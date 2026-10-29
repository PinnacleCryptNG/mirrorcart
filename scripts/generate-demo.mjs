#!/usr/bin/env node
import { existsSync } from "node:fs";
// Pre-generates demo-mode looks: for every sample model × featured outfit, runs the real chain
// against a running Mirrorcart server (mock or live YouCam), saves each step's output under
// public/demo/looks/ and writes the chain → image mapping into public/demo/manifest.json.
// Usage: BASE=http://localhost:3000 node scripts/generate-demo.mjs [--client=mock|youcam]
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.BASE || "http://localhost:3000";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const manifestPath = path.join(root, "public/demo/manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const client = (process.argv.find((a) => a.startsWith("--client=")) || "--client=mock").split("=")[1];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const post = async (p, body) => {
  const r = await fetch(BASE + p, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok) throw new Error(`${p}: ${JSON.stringify(j)}`);
  return j;
};

const looks = {};
for (const model of manifest.models) {
  const photo = await readFile(path.join(root, "public", model.image));
  const form = new FormData();
  form.set("consent", "yes");
  form.set("photo", new Blob([photo], { type: "image/jpeg" }), `${model.id}.jpg`);
  const up = await (await fetch(BASE + "/api/photo/upload", { method: "POST", body: form })).json();
  if (!up.selfieId) throw new Error("upload failed: " + JSON.stringify(up));
  for (const outfit of manifest.outfits) {
    const { jobId, job: planned } = await post("/api/tryon/start", { selfieId: up.selfieId, gender: model.gender, items: outfit.items, store: "demo-generator", rerun: true });
    const relFor = (sigs) => `/demo/looks/${model.id}/${sigs.map((x) => x.replace(/[^a-z0-9]+/gi, "-")).join("__").slice(-120)}.jpg`;
    const plannedRels = planned.steps.map((_, i) => relFor(planned.steps.slice(0, i + 1).map((s) => s.sig)));
    if (plannedRels.every((rel) => existsSync(path.join(root, "public", rel)))) {
      plannedRels.forEach((rel, i) => (looks[`${model.id}|${planned.steps.slice(0, i + 1).map((s) => s.sig).join(">")}`] = rel));
      console.log(`= ${model.id} × ${outfit.id}: already generated, reused`);
      continue;
    }
    let job;
    for (;;) {
      job = (await post("/api/tryon/step", { jobId })).job;
      if (job.done) break;
      await sleep(job.steps[job.cursor]?.status === "running" ? 2500 : 50);
    }
    const sigs = [];
    for (const [i, s] of job.steps.entries()) {
      sigs.push(s.sig);
      if (s.status !== "done" || !s.outputUrl) { console.warn(`  ${model.id}/${outfit.id} step ${i} ${s.status}: ${s.note || ""}`); continue; }
      const url = s.outputUrl.startsWith("/") ? BASE + s.outputUrl : s.outputUrl;
      const bytes = Buffer.from(await (await fetch(url)).arrayBuffer());
      const rel = relFor(sigs);
      await mkdir(path.dirname(path.join(root, "public", rel)), { recursive: true });
      await writeFile(path.join(root, "public", rel), bytes);
      looks[`${model.id}|${sigs.join(">")}`] = rel;
    }
    console.log(`✓ ${model.id} × ${outfit.id}: ${job.steps.filter((s) => s.status === "done").length}/${job.steps.length} steps`);
  }
  await post("/api/photo/delete", { selfieId: up.selfieId, store: "demo-generator" });
}
manifest.looks = looks;
manifest.generatedWith = client;
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`Wrote ${Object.keys(looks).length} looks to manifest.json`);
