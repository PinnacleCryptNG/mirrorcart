import "server-only";
import { createHash, randomUUID } from "crypto";
import sharp from "sharp";
import { getVariant, Slot, slotOf, SLOT_LABEL } from "@/lib/catalog";
import { config, forcedDemo, publicUrl } from "@/lib/config";
import { kv } from "@/lib/kv";
import { putImage, readImage, deletePrefix } from "@/lib/blob";
import { getClient, Feature, UNIT_COST, YouCamError } from "@/lib/youcam";
import { demoKey, getManifest } from "@/lib/demo";
import { track } from "@/lib/events";

export type ChainItem = { id: string; variant?: string; fabric?: string };
export type StepStatus = "pending" | "running" | "done" | "error" | "skipped";

export type Step = {
  sig: string;
  kind: Slot | "fabric";
  feature: Feature;
  productId: string;
  variantId: string;
  fabricTemplateId?: string;
  garmentCategory?: "upper_body" | "lower_body" | "full_body";
  refUrl?: string;
  label: string;
  status: StepStatus;
  taskId?: string;
  cacheKey?: string;
  inputUrl?: string;
  outputUrl?: string;
  cached?: boolean;
  note?: string;
  startedAt?: number;
  polls?: number;
  nextPollAt?: number;
  /** Bag VTO regenerates the whole scene, so its output is a side branch, not the next input. */
  branch?: boolean;
  /** Jewellery runs on an upscaled head-and-shoulders crop that is composited back. */
  crop?: { left: number; top: number; width: number; height: number };
};

export type Selfie = { id: string; hash: string; url: string; createdAt: number; demo?: boolean };

export type Job = {
  id: string;
  store: string;
  selfieId: string;
  mode: "live" | "demo";
  client: "live" | "mock" | "demo";
  gender: "female" | "male";
  steps: Step[];
  skipped: { productId: string; variantId: string; reason: string }[];
  cursor: number;
  done: boolean;
  capHit?: boolean;
  createdAt: number;
  finalUrl?: string;
  sceneUrl?: string;
  sourceUrl: string;
};

const DAY = 86_400;
const today = () => new Date().toISOString().slice(0, 10);
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const TIMEOUT_MS = 150_000;

/* ---------- planning ---------- */

export function planChain(items: ChainItem[], maxSteps = config.maxChainSteps) {
  const bySlot = new Map<Slot, { productId: string; variantId: string; fabric?: string; refUrl: string; name: string }>();
  const skipped: Job["skipped"] = [];
  for (const it of items) {
    const pv = getVariant(it.id, it.variant);
    if (!pv) continue;
    const slot = slotOf(pv.product, pv.variant);
    const entry = { productId: pv.product.id, variantId: pv.variant.id, fabric: it.fabric, refUrl: pv.variant.image, name: `${pv.product.name} · ${pv.variant.label}` };
    if (bySlot.has(slot)) skipped.push({ productId: entry.productId, variantId: entry.variantId, reason: `Only one ${SLOT_LABEL[slot].toLowerCase()} per look` });
    else bySlot.set(slot, entry);
  }
  const jewel: Slot | undefined = bySlot.has("necklace") ? "necklace" : bySlot.has("earring") ? "earring" : undefined;
  if (bySlot.has("necklace") && bySlot.has("earring")) {
    const e = bySlot.get("earring")!;
    skipped.push({ productId: e.productId, variantId: e.variantId, reason: "One jewellery step per look" });
  }
  const order: Slot[] = [];
  if (bySlot.has("full")) {
    order.push("full");
    for (const s of ["upper", "lower"] as Slot[]) if (bySlot.has(s)) {
      const e = bySlot.get(s)!;
      skipped.push({ productId: e.productId, variantId: e.variantId, reason: "Your dress/jumpsuit already covers this" });
    }
  } else {
    if (bySlot.has("upper")) order.push("upper");
    if (bySlot.has("lower")) order.push("lower");
  }
  if (bySlot.has("shoes")) order.push("shoes");
  if (jewel) order.push(jewel);
  if (bySlot.has("bag")) order.push("bag");

  const steps: Step[] = [];
  let itemSteps = 0;
  for (const slot of order) {
    const e = bySlot.get(slot)!;
    if (itemSteps >= maxSteps) { skipped.push({ productId: e.productId, variantId: e.variantId, reason: `Chain limited to ${maxSteps} items for quality` }); continue; }
    itemSteps++;
    const feature: Feature =
      slot === "shoes" ? "shoes-transfer" : slot === "bag" ? "bag" : slot === "necklace" ? "2d-vto/necklace" : slot === "earring" ? "2d-vto/earring" : "cloth-v4";
    const garmentCategory = slot === "upper" ? "upper_body" : slot === "lower" ? "lower_body" : slot === "full" ? "full_body" : undefined;
    steps.push({ sig: `${feature}:${e.productId}:${e.variantId}`, kind: slot, feature, productId: e.productId, variantId: e.variantId, garmentCategory, refUrl: e.refUrl, label: e.name, status: "pending", ...(slot === "bag" ? { branch: true } : {}) });
    if (e.fabric && garmentCategory)
      steps.push({ sig: `fabric:${e.fabric}`, kind: "fabric", feature: "fabric", productId: e.productId, variantId: e.variantId, fabricTemplateId: e.fabric, label: `Fabric swap on ${e.name}`, status: "pending" });
  }
  return { steps, skipped };
}

/* ---------- units / cap ---------- */

export async function unitsUsedToday() {
  return Number((await kv.get<number>(`units:${today()}`)) ?? 0);
}

export async function capReached(extra = 0) {
  if (config.mock) return false; // mock calls cost nothing; the cap guards real units only
  return (await unitsUsedToday()) + extra > config.dailyUnitCap;
}

export async function modeStatus() {
  const used = await unitsUsedToday();
  const forced = forcedDemo();
  const cap = used >= config.dailyUnitCap;
  return {
    demoOnly: forced || cap,
    reason: config.demoMode ? "demo_mode" : forced ? "no_key" : cap ? "cap_reached" : null,
    client: config.mock ? "mock" : "live",
    unitsUsedToday: used,
    dailyUnitCap: config.dailyUnitCap,
  } as const;
}

/* ---------- selfies ---------- */

export async function saveSelfie(bytes: Buffer, contentType: string): Promise<Selfie> {
  const id = randomUUID();
  const hash = sha(bytes.toString("base64"));
  const url = await putImage(`mc/${id}/selfie.jpg`, bytes, contentType);
  const s: Selfie = { id, hash, url, createdAt: Date.now() };
  await kv.set(`selfie:${id}`, s, DAY);
  await kv.zadd("retention:selfies", s.createdAt, id);
  return s;
}

export async function getSelfie(id: string): Promise<Selfie | null> {
  if (id.startsWith("demo:")) {
    const m = (await getManifest()).models.find((x) => `demo:${x.id}` === id);
    return m ? { id, hash: `demo-${m.id}`, url: m.image, createdAt: 0, demo: true } : null;
  }
  return kv.get<Selfie>(`selfie:${id}`);
}

/** Purge our copies (Blob + cache index + jobs) and ask YouCam to delete the tasks made from this photo. */
export async function purgeSelfie(id: string) {
  if (id.startsWith("demo:")) return { deleted: false, reason: "demo model" };
  const [cacheKeys, tasks, jobs] = await Promise.all([
    kv.smembers(`selfie:${id}:cache`), kv.smembers(`selfie:${id}:tasks`), kv.smembers(`selfie:${id}:jobs`),
  ]);
  await deletePrefix(`mc/${id}/`);
  await kv.del(...cacheKeys.map((k) => `cache:${k}`), ...jobs.map((j) => `job:${j}`), `selfie:${id}`, `selfie:${id}:cache`, `selfie:${id}:tasks`, `selfie:${id}:jobs`);
  await kv.zrem("retention:selfies", id);
  const client = getClient();
  let remoteDeleted = 0;
  for (const t of tasks) {
    try { await client.deleteTask(t); remoteDeleted++; } catch { /* already gone or still running */ }
  }
  return { deleted: true, cacheEntries: cacheKeys.length, youcamTasksDeleted: remoteDeleted, youcamTasks: tasks.length };
}

/* ---------- jobs ---------- */

export async function startJob(opts: { selfieId: string; items: ChainItem[]; gender?: "female" | "male"; store?: string; forceDemo?: boolean }) {
  const selfie = await getSelfie(opts.selfieId);
  if (!selfie) throw new Error("photo_not_found");
  const status = await modeStatus();
  const demo = !!selfie.demo || !!opts.forceDemo;
  if (!demo && status.demoOnly) throw Object.assign(new Error("demo_only"), { reason: status.reason });
  const { steps, skipped } = planChain(opts.items);
  if (!steps.length) throw new Error("nothing_to_try_on");
  let gender = opts.gender;
  if (!gender && selfie.demo) gender = (await getManifest()).models.find((m) => `demo:${m.id}` === selfie.id)?.gender;
  const job: Job = {
    id: randomUUID(), store: opts.store || "aurel-demo", selfieId: selfie.id, mode: demo ? "demo" : "live",
    client: demo ? "demo" : getClient().kind, gender: gender || "female", steps, skipped, cursor: 0, done: false,
    createdAt: Date.now(), sourceUrl: selfie.url,
  };
  await saveJob(job);
  if (!selfie.demo) await kv.sadd(`selfie:${selfie.id}:jobs`, job.id);
  return job;
}

export const getJob = (id: string) => kv.get<Job>(`job:${id}`);
const saveJob = (job: Job) => kv.set(`job:${job.id}`, job, DAY);

function prevOutput(job: Job, i: number) {
  for (let k = i - 1; k >= 0; k--) if (job.steps[k].outputUrl && !job.steps[k].branch) return job.steps[k].outputUrl!;
  return job.sourceUrl;
}

function cacheKeyFor(selfieHash: string, job: Job, i: number) {
  const prefix = job.steps.slice(0, i).map((s) => s.sig).join(">");
  return sha(`${selfieHash}|${prefix}|${job.steps[i].sig}`);
}

function needsUpload(url: string) {
  const u = new URL(url);
  return u.protocol !== "https:" || ["localhost", "127.0.0.1"].includes(u.hostname);
}

/** YouCam can fetch public https URLs; anything else (local dev) goes through the File API. */
async function asInput(url: string, origin: string) {
  const abs = publicUrl(url, origin);
  if (getClient().kind === "mock" || (!needsUpload(abs) && process.env.YOUCAM_CHAIN_INPUT !== "upload")) return { url: abs };
  const bytes = await readImage(url, origin);
  const id = await getClient().uploadFile(bytes, "image/jpeg", "image.jpg");
  return { id };
}

const isJewel = (f: Feature) => f === "2d-vto/necklace" || f === "2d-vto/earring";

/** Necklace/earring need the neck ≥15% of image width and centred; full-body photos fail, so crop the head and shoulders. */
async function jewelleryCrop(job: Job, step: Step, inputUrl: string, origin: string) {
  const bytes = await readImage(inputUrl, origin);
  const { width: W = 0, height: H = 0 } = await sharp(bytes).metadata();
  if (!W || H / W < 1.3) return inputUrl;
  const width = Math.round(W * 0.36), left = Math.round((W - width) / 2), height = Math.min(H, Math.round(width * 1.3));
  step.crop = { left, top: 0, width, height };
  const crop = await sharp(bytes).extract({ left, top: 0, width, height }).resize({ width: 768, kernel: "lanczos3" }).jpeg({ quality: 92 }).toBuffer();
  return putImage(`mc/${job.selfieId}/crop-${step.cacheKey}.jpg`, crop);
}

async function compositeCrop(baseUrl: string, result: Buffer, crop: NonNullable<Step["crop"]>, origin: string) {
  const patch = await sharp(result).resize(crop.width, crop.height, { fit: "fill" }).toBuffer();
  return sharp(await readImage(baseUrl, origin)).composite([{ input: patch, left: crop.left, top: crop.top }]).jpeg({ quality: 92 }).toBuffer();
}

async function buildBody(job: Job, step: Step, inputUrl: string, origin: string) {
  const src = await asInput(isJewel(step.feature) ? await jewelleryCrop(job, step, inputUrl, origin) : inputUrl, origin);
  const srcField = src.url ? { src_file_url: src.url } : { src_file_id: src.id };
  if (step.feature === "fabric") return { template_id: step.fabricTemplateId, ...srcField };
  const ref = await asInput(step.refUrl!, origin);
  switch (step.feature) {
    case "cloth-v4":
      return { ...srcField, ...(ref.url ? { ref_file_url: ref.url } : { ref_file_id: ref.id }), garment_category: step.garmentCategory };
    case "shoes-transfer":
    case "bag":
      return { ...srcField, ...(ref.url ? { ref_file_url: ref.url } : { ref_file_id: ref.id }), gender: job.gender, style: "random" };
    case "2d-vto/necklace":
    case "2d-vto/earring":
      // Schema: src + ref_file_urls[] + source_info{name} + object_infos[{name}] (docs example uses the file URLs as names).
      return {
        ...srcField,
        ...(ref.url ? { ref_file_urls: [ref.url] } : { ref_file_ids: [ref.id] }),
        source_info: { name: src.url ?? src.id },
        object_infos: [{ name: ref.url ?? ref.id }],
      };
  }
}

function finish(job: Job) {
  job.done = true;
  job.finalUrl = prevOutput(job, job.steps.length);
  job.sceneUrl = job.steps.find((s) => s.branch && s.outputUrl)?.outputUrl;
}

async function completeStep(job: Job, step: Step, url: string, cached: boolean) {
  step.status = "done";
  step.outputUrl = url;
  step.cached = cached;
  job.cursor++;
  if (job.cursor >= job.steps.length) finish(job);
}

function fallBackToPrevious(job: Job, step: Step, note: string, status: StepStatus = "error") {
  step.status = status;
  step.note = note;
  job.cursor++;
  if (job.cursor >= job.steps.length) finish(job);
}

/** Advance the job by at most one YouCam call. Called repeatedly by the client. */
export async function advance(jobId: string, origin: string): Promise<Job> {
  const job = await getJob(jobId);
  if (!job) throw new Error("job_not_found");
  if (job.done) return job;
  if (!(await kv.setnx(`lock:job:${jobId}`, 20))) return job;
  try {
    const selfie = await getSelfie(job.selfieId);
    if (!selfie) throw new Error("photo_deleted");
    const i = job.cursor;
    const step = job.steps[i];
    const now = Date.now();

    if (step.status === "pending") {
      step.inputUrl = prevOutput(job, i);
      step.cacheKey = cacheKeyFor(selfie.hash, job, i);
      step.startedAt = now;

      if (job.mode === "demo") {
        const manifest = await getManifest();
        const modelId = selfie.id.replace(/^demo:/, "");
        const hit = manifest.looks[demoKey(modelId, job.steps.slice(0, i + 1).map((s) => s.sig))];
        if (hit) await completeStep(job, step, hit, true);
        else fallBackToPrevious(job, step, "Not pre-generated for demo mode; showing the previous step", "skipped");
        await kv.hincrby("stats", "demo_steps");
      } else {
        const hit = await kv.get<{ url: string }>(`cache:${step.cacheKey}`);
        if (hit) {
          await Promise.all([kv.hincrby("stats", "cached_hits"), kv.hincrby("stats", "units_saved", UNIT_COST[step.feature])]);
          await completeStep(job, step, hit.url, true);
        } else if (await capReached(UNIT_COST[step.feature])) {
          job.capHit = true;
          for (const s of job.steps.slice(i)) { s.status = "skipped"; s.note = "Daily unit cap reached; try demo mode"; }
          finish(job);
        } else {
          try {
            const body = await buildBody(job, step, step.inputUrl, origin);
            const r = await getClient().createTask(step.feature, body as Record<string, unknown>);
            step.taskId = r.data.task_id;
            step.status = "running";
            step.polls = 0;
            step.nextPollAt = now + 2000;
            await kv.sadd(`selfie:${selfie.id}:tasks`, step.taskId);
          } catch (e) {
            fallBackToPrevious(job, step, errText(e));
          }
        }
      }
    } else if (step.status === "running" && step.taskId) {
      if (now >= (step.nextPollAt ?? 0)) {
        try {
          const r = await getClient().pollTask(step.feature, step.taskId);
          const d = r.data;
          if (d.task_status === "success" && d.results?.url) {
            let bytes = await readImage(d.results.url, origin);
            if (step.crop && step.inputUrl) bytes = await compositeCrop(step.inputUrl, bytes, step.crop, origin);
            const url = await putImage(`mc/${selfie.id}/${step.cacheKey}.jpg`, bytes);
            await kv.set(`cache:${step.cacheKey}`, { url }, DAY);
            await kv.sadd(`selfie:${selfie.id}:cache`, step.cacheKey!);
            if (getClient().kind === "mock") await kv.hincrby("stats", "mock_steps");
            else await Promise.all([kv.incrby(`units:${today()}`, UNIT_COST[step.feature], 2 * DAY), kv.hincrby("stats", "units_used", UNIT_COST[step.feature]), kv.hincrby("stats", "live_steps")]);
            await completeStep(job, step, url, false);
          } else if (d.task_status === "error") {
            fallBackToPrevious(job, step, `YouCam: ${d.error || d.error_message || "error"}`);
          } else if (now - (step.startedAt ?? now) > TIMEOUT_MS) {
            fallBackToPrevious(job, step, "Timed out");
          } else {
            step.polls = (step.polls ?? 0) + 1;
            step.nextPollAt = now + Math.min(2000 * 1.25 ** step.polls, 8000);
          }
        } catch (e) {
          step.polls = (step.polls ?? 0) + 1;
          step.nextPollAt = now + Math.min(3000 * 2 ** Math.min(step.polls, 3), 15000);
          if (now - (step.startedAt ?? now) > TIMEOUT_MS) fallBackToPrevious(job, step, errText(e));
        }
      }
    }
    if (job.done) await track("tryon_completed", { store: job.store });
    await saveJob(job);
    return job;
  } finally {
    await kv.del(`lock:job:${jobId}`);
  }
}

function errText(e: unknown) {
  if (e instanceof YouCamError) return `YouCam ${e.status}${e.code ? " " + e.code : ""}: ${e.message}`;
  return e instanceof Error ? e.message : String(e);
}

/** Public view of a job (no hashes, no task bodies). */
export function view(job: Job) {
  return {
    id: job.id, mode: job.mode, client: job.client, done: job.done, capHit: !!job.capHit, cursor: job.cursor,
    sourceUrl: job.sourceUrl, finalUrl: job.finalUrl, sceneUrl: job.sceneUrl, skipped: job.skipped,
    steps: job.steps.map((s) => ({
      sig: s.sig, kind: s.kind, feature: s.feature, productId: s.productId, variantId: s.variantId, fabricTemplateId: s.fabricTemplateId,
      label: s.label, status: s.status, outputUrl: s.outputUrl, cached: !!s.cached, note: s.note, branch: !!s.branch,
    })),
  };
}
export type JobView = ReturnType<typeof view>;
