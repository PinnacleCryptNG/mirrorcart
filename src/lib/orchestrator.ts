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

export type Selfie = { id: string; hash: string; url: string; createdAt: number; demo?: boolean; /** Recognised as a photo already uploaded in the last 24 h. */ matched?: boolean };

/** A finished look, remembered per photo for the "Your fitting room" strip (24 h). */
export type SavedLook = { key: string; items: ChainItem[]; thumb: string; labels: string[]; t: number };

export type Job = {
  id: string;
  /** Hashed client IP, for the per-visitor daily unit limit. */
  visitor?: string;
  items?: ChainItem[];
  /** Swap/fabric re-runs of an earlier try-on; excluded from started/completed funnel counts. */
  rerun?: boolean;
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

/** Sum of YouCam credit balances, cached 10 min; null if unknown (never blocks on a credit API hiccup). */
export async function creditBalance(): Promise<number | null> {
  if (config.mock) return null;
  const cached = await kv.get<{ v: number }>("credit:balance");
  if (cached) return cached.v;
  try {
    const r = (await getClient().getCredit()) as { results?: { amount?: number; amount_dec?: string | number }[] };
    const v = (r.results ?? []).reduce((a, x) => a + Number(x.amount_dec ?? x.amount ?? 0), 0);
    await kv.set("credit:balance", { v }, 600);
    return v;
  } catch {
    return null;
  }
}

export type LiveLimit = "cap" | "reserve" | "visitor" | null;
const LIMIT_NOTE: Record<Exclude<LiveLimit, null>, string> = {
  cap: "Today's live try-on budget is used up; sample models are free",
  reserve: "Live try-on is paused to keep credits for judging; sample models are free",
  visitor: "You've used today's live try-ons; sample models are free",
};

export async function liveLimit(extra = 0, visitor?: string): Promise<LiveLimit> {
  if (config.mock) return null; // mock calls cost nothing; limits guard real units only
  if ((await unitsUsedToday()) + extra > config.dailyUnitCap) return "cap";
  if (visitor && ((await kv.get<number>(`vunits:${visitor}:${today()}`)) ?? 0) + extra > config.visitorDailyUnits) return "visitor";
  const bal = await creditBalance();
  if (bal != null && bal - extra < config.creditReserve) return "reserve";
  return null;
}

export const capReached = async (extra = 0) => (await liveLimit(extra)) !== null;

export async function modeStatus() {
  const used = await unitsUsedToday();
  const forced = forcedDemo();
  const cap = used >= config.dailyUnitCap;
  const bal = forced || cap ? null : await creditBalance();
  const reserve = bal != null && bal <= config.creditReserve;
  return {
    demoOnly: forced || cap || reserve,
    reason: config.demoMode ? "demo_mode" : forced ? "no_key" : cap ? "cap_reached" : reserve ? "reserve" : null,
    client: config.mock ? "mock" : "live",
    unitsUsedToday: used,
    dailyUnitCap: config.dailyUnitCap,
  } as const;
}

/* ---------- selfies ---------- */

/* ---------- photo memory ---------- */

type PhotoPrint = { p: string; h: string; ar: number; t: number };
const PRINTS = "photo:prints";
const PW = 24, PH = 32, BLOCK = 4;

/** Normalised 24 × 32 grey-scale thumbnail (int8, base64) plus aspect ratio. */
async function photoPrint(bytes: Buffer) {
  const img = sharp(bytes).rotate();
  const meta = await img.metadata();
  const raw = await img.grayscale().resize(PW, PH, { fit: "fill" }).blur(0.8).raw().toBuffer();
  const mean = raw.reduce((s, x) => s + x, 0) / raw.length;
  const sd = Math.sqrt(raw.reduce((s, x) => s + (x - mean) ** 2, 0) / raw.length) || 1;
  const q = Int8Array.from(raw, (x) => Math.max(-127, Math.min(127, Math.round(((x - mean) / sd) * 32))));
  const w = meta.autoOrient?.width ?? meta.width ?? 1, h = meta.autoOrient?.height ?? meta.height ?? 1;
  return { p: Buffer.from(q.buffer).toString("base64"), ar: w / h };
}

/**
 * Same picture = near-perfect overall correlation and no region that differs (so a re-saved or
 * re-compressed copy matches, but a new pose, a crop or a changed garment does not).
 */
function samePicture(a: string, b: string) {
  const x = new Int8Array(Buffer.from(a, "base64")), y = new Int8Array(Buffer.from(b, "base64"));
  if (x.length !== PW * PH || y.length !== x.length) return false;
  let c = 0, xx2 = 0, yy2 = 0;
  for (let i = 0; i < x.length; i++) { c += x[i] * y[i]; xx2 += x[i] * x[i]; yy2 += y[i] * y[i]; }
  if (c / Math.sqrt(xx2 * yy2 || 1) < 0.995) return false;
  for (let by = 0; by < PH; by += BLOCK) for (let bx = 0; bx < PW; bx += BLOCK) {
    let d = 0;
    for (let yy = by; yy < by + BLOCK; yy++) for (let xx = bx; xx < bx + BLOCK; xx++) d += Math.abs(x[yy * PW + xx] - y[yy * PW + xx]);
    if (d / (BLOCK * BLOCK) / 32 > 0.15) return false;
  }
  return true;
}

async function recentPrints() {
  const cutoff = Date.now() - DAY * 1000;
  return ((await kv.get<PhotoPrint[]>(PRINTS)) ?? []).filter((e) => e.t > cutoff);
}

/** Finds an upload of the same picture in the last 24 h so its saved results are reused (0 units). */
async function matchPhoto(bytes: Buffer, exact: string) {
  const print = await photoPrint(bytes).catch(() => null);
  const prints = await recentPrints();
  const hit = prints.find((e) => e.h === exact) ??
    (print ? prints.find((e) => Math.abs(e.ar - print.ar) / print.ar < 0.01 && samePicture(e.p, print.p)) : undefined);
  if (!hit && print) await kv.set(PRINTS, [...prints, { ...print, h: exact, t: Date.now() }].slice(-150), DAY);
  return hit?.h;
}

export async function saveSelfie(bytes: Buffer, contentType: string): Promise<Selfie> {
  const id = randomUUID();
  const exact = sha(bytes.toString("base64"));
  const known = await matchPhoto(bytes, exact);
  const hash = known ?? exact;
  const url = await putImage(`mc/${id}/selfie.jpg`, bytes, contentType);
  const s: Selfie = { id, hash, url, createdAt: Date.now(), ...(known ? { matched: true } : {}) };
  await kv.set(`selfie:${id}`, s, DAY);
  await kv.sadd(`photo:${hash}:selfies`, id);
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

const looksKey = (selfie: Selfie, visitor?: string) => (selfie.demo ? `looks:${selfie.hash}:${visitor ?? "anon"}` : `looks:${selfie.hash}`);
const itemsKey = (items: ChainItem[]) =>
  JSON.stringify([...items].map((i) => [i.id, i.variant ?? "", i.fabric ?? ""]).sort());

async function rememberLook(job: Job, selfie: Selfie) {
  if (!job.items?.length || !job.finalUrl || job.finalUrl === job.sourceUrl) return;
  const k = looksKey(selfie, job.visitor);
  const key = itemsKey(job.items);
  const labels = job.steps.filter((s) => s.kind !== "fabric" && s.status === "done").map((s) => s.label);
  const prev = ((await kv.get<SavedLook[]>(k)) ?? []).filter((l) => l.key !== key);
  await kv.set(k, [{ key, items: job.items, thumb: job.finalUrl, labels, t: Date.now() }, ...prev].slice(0, 8), DAY);
}

/** Looks already made from this photo (newest first). Reopening one is served from cache. */
export async function savedLooks(selfieId: string, visitor?: string) {
  const selfie = await getSelfie(selfieId);
  if (!selfie) return [];
  return (await kv.get<SavedLook[]>(looksKey(selfie, visitor))) ?? [];
}

/**
 * "Delete my photo": purges this upload and every other upload recognised as the same picture,
 * so no saved result made from it survives. Retention sweeps pass cascade=false.
 */
export async function purgeSelfie(id: string, cascade = true) {
  if (id.startsWith("demo:")) return { deleted: false, reason: "demo model" };
  const s = await kv.get<Selfie>(`selfie:${id}`);
  const ids = new Set([id, ...(cascade && s ? await kv.smembers(`photo:${s.hash}:selfies`) : [])]);
  const out = { deleted: true, cacheEntries: 0, youcamTasksDeleted: 0, youcamTasks: 0 };
  for (const x of ids) {
    const r = await purgeUpload(x);
    out.cacheEntries += r.cacheEntries; out.youcamTasksDeleted += r.youcamTasksDeleted; out.youcamTasks += r.youcamTasks;
  }
  if (cascade && s) {
    await kv.del(`photo:${s.hash}:selfies`, `looks:${s.hash}`);
    const prints = await recentPrints();
    await kv.set(PRINTS, prints.filter((e) => e.h !== s.hash), DAY);
  }
  return out;
}

async function purgeUpload(id: string) {
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
  return { cacheEntries: cacheKeys.length, youcamTasksDeleted: remoteDeleted, youcamTasks: tasks.length };
}

/* ---------- jobs ---------- */

export async function startJob(opts: { selfieId: string; items: ChainItem[]; gender?: "female" | "male"; store?: string; forceDemo?: boolean; rerun?: boolean; visitor?: string }) {
  const selfie = await getSelfie(opts.selfieId);
  if (!selfie) throw new Error("photo_not_found");
  const status = await modeStatus();
  const demo = !!selfie.demo || !!opts.forceDemo;
  const { steps, skipped } = planChain(opts.items);
  if (!steps.length) throw new Error("nothing_to_try_on");
  if (selfie.demo && !opts.rerun) {
    const { looks } = await getManifest();
    const model = selfie.id.replace(/^demo:/, "");
    if (steps.some((_, i) => !looks[demoKey(model, steps.slice(0, i + 1).map((s) => s.sig))]))
      throw Object.assign(new Error("demo_unavailable"), { reason: "not_pregenerated" });
  }
  if (!demo && status.demoOnly && !(await fullyCached(selfie.hash, steps))) throw Object.assign(new Error("demo_only"), { reason: status.reason });
  let gender = opts.gender;
  if (!gender && selfie.demo) gender = (await getManifest()).models.find((m) => `demo:${m.id}` === selfie.id)?.gender;
  const job: Job = {
    id: randomUUID(), rerun: !!opts.rerun, visitor: opts.visitor, items: opts.items, store: opts.store || "aurel-demo", selfieId: selfie.id, mode: demo ? "demo" : "live",
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

function cacheKeyFor(selfieHash: string, job: Pick<Job, "steps">, i: number) {
  const prefix = job.steps.slice(0, i).map((s) => s.sig).join(">");
  return sha(`${selfieHash}|${prefix}|${job.steps[i].sig}`);
}

/** True when every step of this look is already saved, so it can be shown even with live try-on paused. */
async function fullyCached(selfieHash: string, steps: Step[]) {
  for (let i = 0; i < steps.length; i++) if (!(await kv.get(`cache:${cacheKeyFor(selfieHash, { steps }, i)}`))) return false;
  return true;
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
      return { ...srcField, ...(ref.url ? { ref_file_url: ref.url } : { ref_file_id: ref.id }), garment_category: step.garmentCategory, change_shoes: false };
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
  const seen = await getJob(jobId);
  if (!seen) throw new Error("job_not_found");
  if (seen.done) return seen;
  if (!(await kv.setnx(`lock:job:${jobId}`, 20))) return seen;
  try {
    const job = (await getJob(jobId)) ?? seen;
    if (job.done) return job;
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
        let limit: LiveLimit = null;
        if (hit) {
          await Promise.all([kv.hincrby("stats", "cached_hits"), kv.hincrby("stats", "units_saved", UNIT_COST[step.feature])]);
          await completeStep(job, step, hit.url, true);
        } else if ((limit = await liveLimit(UNIT_COST[step.feature], job.visitor))) {
          job.capHit = true;
          for (const s of job.steps.slice(i)) { s.status = "skipped"; s.note = LIMIT_NOTE[limit]; }
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
            else await Promise.all([kv.incrby(`units:${today()}`, UNIT_COST[step.feature], 2 * DAY), ...(job.visitor ? [kv.incrby(`vunits:${job.visitor}:${today()}`, UNIT_COST[step.feature], 2 * DAY)] : []), kv.hincrby("stats", "units_used", UNIT_COST[step.feature]), kv.hincrby("stats", "live_steps")]);
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
    if (job.done && !job.rerun) await track("tryon_completed", { store: job.store });
    if (job.done) await rememberLook(job, selfie);
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
