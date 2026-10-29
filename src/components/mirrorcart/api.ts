"use client";

export type Item = { id: string; variant?: string; fabric?: string };
export type ModeInfo = {
  demoOnly: boolean; reason: "demo_mode" | "no_key" | "cap_reached" | null; client: "mock" | "live";
  unitsUsedToday: number; dailyUnitCap: number;
  models: { id: string; name: string; image: string; gender: "female" | "male"; credit: string }[];
  outfits: { id: string; title: string; items: { id: string; variant: string; fabric?: string }[] }[];
  demoGeneratedWith: string;
};
export type StepView = {
  sig: string; kind: string; feature: string; productId: string; variantId: string; fabricTemplateId?: string;
  label: string; status: "pending" | "running" | "done" | "error" | "skipped"; outputUrl?: string; cached: boolean; note?: string; branch?: boolean;
};
export type JobView = {
  id: string; mode: "live" | "demo"; client: string; done: boolean; capHit: boolean; cursor: number;
  sourceUrl: string; finalUrl?: string; sceneUrl?: string; skipped: { productId: string; variantId: string; reason: string }[]; steps: StepView[];
};
export type Selfie = { id: string; url: string; demo: boolean };

async function post<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || `HTTP ${r.status}`), { info: j });
  return j as T;
}

export const api = {
  mode: () => fetch("/api/mode", { cache: "no-store" }).then((r) => r.json() as Promise<ModeInfo>),
  fabrics: () => fetch("/api/fabrics").then((r) => r.json() as Promise<{ templates: { id: string; thumb: string; title?: string }[] }>),
  async upload(blob: Blob): Promise<{ selfieId: string; url: string }> {
    const f = new FormData();
    f.set("consent", "yes");
    f.set("photo", blob, "photo.jpg");
    const r = await fetch("/api/photo/upload", { method: "POST", body: f });
    const j = await r.json();
    if (!r.ok) throw Object.assign(new Error(j.error || "upload_failed"), { info: j });
    return j;
  },
  start: (b: { selfieId: string; items: Item[]; gender?: string; store: string; rerun?: boolean }) => post<{ jobId: string; job: JobView }>("/api/tryon/start", b),
  step: (jobId: string) => post<{ job: JobView }>("/api/tryon/step", { jobId }),
  deletePhoto: (selfieId: string, store: string) => post<{ deleted: boolean }>("/api/photo/delete", { selfieId, store }),
  track: (type: string, store: string, items?: { id: string; variant?: string }[]) =>
    post("/api/events", { type, store, items }).catch(() => undefined),
};

/** Resize to a 1024 px long side JPEG in the browser before upload (SPEC §4). */
/** Long side 1024 JPEG, cropped around the detected person so they fill the frame (YouCam's ≥80% guidance). */
export async function resizeToJpeg(src: Blob | HTMLVideoElement, longSide = 1024): Promise<{ blob: Blob; framed: boolean; warnings: string[] }> {
  let w: number, h: number, draw: CanvasImageSource;
  if (src instanceof HTMLVideoElement) { w = src.videoWidth; h = src.videoHeight; draw = src; }
  else { const bmp = await createImageBitmap(src); w = bmp.width; h = bmp.height; draw = bmp; }
  const scale = Math.min(1, (longSide * 2) / Math.max(w, h));
  const full = document.createElement("canvas");
  full.width = Math.round(w * scale); full.height = Math.round(h * scale);
  const fctx = full.getContext("2d")!;
  if (src instanceof HTMLVideoElement) { fctx.translate(full.width, 0); fctx.scale(-1, 1); }
  fctx.drawImage(draw, 0, 0, full.width, full.height);
  const { frameSubject } = await import("./frame");
  const { canvas, framed, warnings } = await frameSubject(full);
  const k = Math.min(1, longSide / Math.max(canvas.width, canvas.height));
  const c = document.createElement("canvas");
  c.width = Math.round(canvas.width * k); c.height = Math.round(canvas.height * k);
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(canvas, 0, 0, c.width, c.height);
  const blob = await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("encode_failed"))), "image/jpeg", 0.92));
  return { blob, framed, warnings };
}
