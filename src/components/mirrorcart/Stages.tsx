"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { getVariant, SLOT_LABEL, slotOf } from "@/lib/catalog";
import { api, Item, JobView, ModeInfo, resizeToJpeg, Selfie, StepView } from "./api";

const pill = "rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed";
export const btn = { primary: `${pill} bg-lime text-lime-ink hover:brightness-95`, ghost: `${pill} border border-white/25 hover:bg-white/10`, danger: `${pill} border border-red-300/40 text-red-200 hover:bg-red-500/15` };

export function ConsentStage({ onAgree }: { onAgree: () => void }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="rise mx-auto max-w-xl">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-lime">Step 1 · Your consent</p>
      <h2 className="mt-2 font-display text-3xl font-bold">Before we use your photo</h2>
      <ul className="mt-5 space-y-3 text-sm text-white/80">
        <li><b className="text-white">What is sent:</b> one photo of you (resized to 1024 px in your browser) plus the product images in your cart.</li>
        <li><b className="text-white">Where it goes:</b> to our server, which stores it in our private storage and sends it to the YouCam API (Perfect Corp.) to render the try-on. Your browser never talks to YouCam directly.</li>
        <li><b className="text-white">How long:</b> we delete your photo and results within 24 hours. We also ask YouCam to delete every task made from your photo (YouCam otherwise keeps files up to 30 days).</li>
        <li><b className="text-white">Delete now:</b> a <i>Delete my photo</i> button stays visible the whole time.</li>
        <li>Prefer not to upload? Pick a sample model on the next screen.</li>
      </ul>
      <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-white/15 bg-white/5 p-4 text-sm">
        <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#c6f432]" />
        <span>I agree to my photo being processed as described above, only to show me this try-on.</span>
      </label>
      <div className="mt-6 flex gap-3">
        <button disabled={!ok} onClick={onAgree} className={btn.primary}>Continue</button>
        <a href="/privacy" target="_blank" className={btn.ghost}>Privacy details</a>
      </div>
    </div>
  );
}

export function PhotoStage(props: {
  mode: ModeInfo | null; onSelfie: (s: Selfie, gender: "female" | "male" | undefined) => void; onLoadOutfit: (items: Item[]) => void; needsGender: boolean;
}) {
  const { mode } = props;
  const [gender, setGender] = useState<"female" | "male" | "">("");
  const [preview, setPreview] = useState<{ blob: Blob; url: string } | null>(null);
  const [cam, setCam] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const liveOk = mode ? !mode.demoOnly : false;

  useEffect(() => () => stream.current?.getTracks().forEach((t) => t.stop()), []);

  async function openCam() {
    setErr("");
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", height: 1280 } });
      setCam(true);
      requestAnimationFrame(() => { if (video.current) { video.current.srcObject = stream.current; video.current.play(); } });
    } catch { setErr("Camera not available. Upload a photo instead."); }
  }
  async function snap() {
    if (!video.current) return;
    const b = await resizeToJpeg(video.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    setCam(false);
    setPreview({ blob: b, url: URL.createObjectURL(b) });
  }
  async function pick(f?: File) {
    if (!f) return;
    setErr("");
    try { const b = await resizeToJpeg(f); setPreview({ blob: b, url: URL.createObjectURL(b) }); }
    catch { setErr("Couldn't read that image. Try a JPEG or PNG."); }
  }
  async function use() {
    if (!preview) return;
    if (props.needsGender && !gender) { setErr("Pick a fit for shoes and bags first."); return; }
    setBusy(true); setErr("");
    try {
      const r = await api.upload(preview.blob);
      props.onSelfie({ id: r.selfieId, url: r.url, demo: false }, gender || undefined);
    } catch (e) {
      const m = (e as Error).message;
      setErr(m === "demo_only" ? "Live try-on is paused (daily cap). Pick a sample model." : `Upload failed: ${m}`);
    } finally { setBusy(false); }
  }

  return (
    <div className="rise grid gap-8 lg:grid-cols-[1fr_1fr]">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-lime">Step 2 · Your photo</p>
        <h2 className="mt-2 font-display text-3xl font-bold">Stand like a mannequin</h2>
        <div className="relative mt-4 aspect-[3/4] overflow-hidden rounded-2xl border border-white/15 bg-black/40">
          {cam ? <video ref={video} playsInline muted className="h-full w-full -scale-x-100 object-cover" /> :
            preview ? <img src={preview.url} alt="Your photo preview" className="h-full w-full object-contain" /> : (
              <svg viewBox="0 0 120 160" className="absolute inset-0 m-auto h-[85%] opacity-60" aria-hidden>
                <g fill="none" stroke="#c6f432" strokeWidth="1" strokeDasharray="3 3">
                  <circle cx="60" cy="20" r="10" /><path d="M42 36h36l6 50h-8l-2 66h-10l-4-50-4 50H46l-2-66h-8z" />
                </g>
                <text x="60" y="158" textAnchor="middle" fontSize="6" fill="#fff" fontFamily="monospace">FULL BODY · FRONT · PLAIN WALL</text>
              </svg>
            )}
          {!liveOk && <div className="absolute inset-0 grid place-items-center bg-black/70 p-6 text-center text-sm">Live upload is unavailable right now. Use a sample model →</div>}
        </div>
        <ul className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-white/70">
          <li className="rounded-lg bg-white/5 p-2">Head to toe in frame</li><li className="rounded-lg bg-white/5 p-2">Face the camera, arms relaxed</li><li className="rounded-lg bg-white/5 p-2">Plain background, good light</li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          {cam ? <button onClick={snap} className={btn.primary}>Take photo</button> : (
            <>
              <label className={`${btn.ghost} cursor-pointer ${!liveOk ? "pointer-events-none opacity-40" : ""}`}>
                Upload photo<input type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
              </label>
              <button disabled={!liveOk} onClick={openCam} className={btn.ghost}>Use camera</button>
            </>
          )}
          {preview && !cam && <button disabled={busy} onClick={use} className={btn.primary}>{busy ? "Uploading…" : "Use this photo"}</button>}
        </div>
        <fieldset className="mt-4 flex items-center gap-3 text-sm">
          <legend className="sr-only">Fit for shoes and bags</legend>
          <span className="text-white/70">Fit for shoes &amp; bags{props.needsGender ? " (needed)" : " (optional)"}:</span>
          {(["female", "male"] as const).map((g) => (
            <label key={g} className={`cursor-pointer rounded-full border px-3 py-1 ${gender === g ? "border-lime bg-lime/15 text-lime" : "border-white/20"}`}>
              <input type="radio" name="g" className="sr-only" checked={gender === g} onChange={() => setGender(g)} />{g === "female" ? "Womenswear" : "Menswear"}
            </label>
          ))}
        </fieldset>
        {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
      </div>
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">Or · no upload</p>
        <h3 className="mt-2 font-display text-xl font-bold">Try it on a sample model</h3>
        <p className="mt-1 text-sm text-white/60">Pre-generated looks, instant and free. Fictional, AI-generated models.</p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {(mode?.models ?? []).map((m) => (
            <button key={m.id} onClick={() => props.onSelfie({ id: `demo:${m.id}`, url: m.image, demo: true }, m.gender)}
              className="group relative aspect-[3/5] overflow-hidden rounded-xl border border-white/15 hover:border-lime">
              <img src={m.image} alt={m.name} className="h-full w-full object-cover transition group-hover:scale-105" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-2 text-left text-sm">{m.name}</span>
            </button>
          ))}
        </div>
        {!!mode?.outfits.length && (
          <div className="mt-5">
            <p className="text-sm text-white/60">Demo looks are pre-generated for these outfits:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {mode.outfits.map((o) => <button key={o.id} onClick={() => props.onLoadOutfit(o.items)} className="rounded-full border border-white/20 px-3 py-1 text-xs hover:border-lime">Load “{o.title}”</button>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const stepLabel = (s: StepView) => (s.kind === "fabric" ? "Fabric swap" : SLOT_LABEL[s.kind as keyof typeof SLOT_LABEL] ?? s.kind);

export function StepList({ job }: { job: JobView }) {
  return (
    <ol className="space-y-2">
      {job.steps.map((s, i) => (
        <li key={s.sig + i} className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${s.status === "running" ? "border-lime/60 bg-lime/5" : "border-white/10"}`}>
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/20 font-mono text-[10px]">
            {s.status === "running" ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-lime border-t-transparent" /> : s.status === "done" ? "✓" : s.status === "pending" ? i + 1 : "–"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate"><span className="text-white/50">{stepLabel(s)} · </span>{s.label}</p>
            <p className="font-mono text-[10px] text-white/40">/task/{s.feature}{s.cached ? " · cached, 0 units" : ""}{s.note ? ` · ${s.note}` : ""}</p>
          </div>
        </li>
      ))}
      {job.skipped.map((s) => {
        const pv = getVariant(s.productId, s.variantId);
        return <li key={s.productId + s.variantId} className="rounded-xl border border-dashed border-white/10 p-3 text-xs text-white/50">Not in this look: {pv?.product.name} ({pv && SLOT_LABEL[slotOf(pv.product, pv.variant)]}) · {s.reason}</li>;
      })}
    </ol>
  );
}

export function Filmstrip({ job, active, onPick }: { job: JobView; active?: number; onPick?: (i: number) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button onClick={() => onPick?.(-1)} className={`relative h-28 w-20 shrink-0 overflow-hidden rounded-lg border ${active === -1 ? "border-lime" : "border-white/15"}`}>
        <img src={job.sourceUrl} alt="Original photo" className="h-full w-full object-cover" />
        <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] font-mono">ORIGINAL</span>
      </button>
      {job.steps.map((s, i) => (
        <button key={s.sig + i} disabled={!s.outputUrl} onClick={() => onPick?.(i)}
          className={`relative h-28 w-20 shrink-0 overflow-hidden rounded-lg border ${active === i ? "border-lime" : "border-white/15"} ${s.outputUrl ? "curtain-in" : ""}`}>
          {s.outputUrl ? <img src={s.outputUrl} alt={s.label} className="h-full w-full object-cover" /> :
            <span className={`grid h-full place-items-center text-[10px] text-white/40 ${s.status === "running" ? "sheen bg-white/5" : ""}`}>{s.status === "running" ? "rendering" : s.status}</span>}
          <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] font-mono">{i + 1}. {stepLabel(s).toUpperCase()}{s.branch ? " · SCENE" : ""}</span>
        </button>
      ))}
    </div>
  );
}
