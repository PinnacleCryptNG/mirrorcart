"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { getVariant, money, SLOT_LABEL, slotOf } from "@/lib/catalog";
import { api, Item, JobView } from "./api";
import { btn, Filmstrip } from "./Stages";
import { mirrorMasks } from "@/lib/mirror";

const RM = mirrorMasks({ ratio: 4 / 3, rim: 3 });

function BeforeAfter({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(55);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const move = (x: number) => { const r = box.current!.getBoundingClientRect(); setPos(Math.max(0, Math.min(100, ((x - r.left) / r.width) * 100))); };
  return (
    <div className="mirror relative mx-auto aspect-[3/4] w-full max-w-[460px]">
    <div className="mirror-rim absolute inset-0" style={RM.outer} />
    <div ref={box} style={RM.inner} className="absolute inset-0 select-none overflow-hidden bg-black/40 touch-none"
      onPointerDown={(e) => { drag.current = true; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); move(e.clientX); }}
      onPointerMove={(e) => drag.current && move(e.clientX)} onPointerUp={() => (drag.current = false)}>
      <img src={after} alt="After: wearing the look" className="absolute inset-0 h-full w-full object-contain" draggable={false} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={before} alt="Before: original photo" className="h-full w-full object-contain bg-[#0f0f13]" draggable={false} />
      </div>
      <div className="absolute inset-y-0 w-0.5 bg-lime" style={{ left: `${pos}%` }}>
        <span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime px-2 py-1 font-mono text-[10px] text-lime-ink">◀ ▶</span>
      </div>
      <span className="absolute left-[20%] top-[12%] rounded-full bg-black/60 px-2 py-0.5 font-mono text-[10px]">BEFORE</span>
      <span className="absolute right-[20%] top-[12%] rounded-full bg-black/60 px-2 py-0.5 font-mono text-[10px]">AFTER</span>
      <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label="Before/after slider" className="sr-only" />
    </div>
    </div>
  );
}

async function sharePng(imgUrl: string, items: Item[]) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imgUrl;
  await img.decode();
  const W = 1080, H = 1350, c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = "#101014"; g.fillRect(0, 0, W, H);
  const ih = H - 230, iw = ih * (img.width / img.height);
  g.drawImage(img, (W - iw) / 2, 40, iw, ih - 40);
  g.fillStyle = "#e8c46c"; g.fillRect(0, H - 190, W, 4);
  g.fillStyle = "#fff"; g.font = "800 44px sans-serif"; g.fillText("AUREL & THREAD", 48, H - 120);
  g.font = "24px monospace"; g.fillStyle = "#e8c46c"; g.fillText("Tried on with Mirrorcart", 48, H - 80);
  g.fillStyle = "rgba(255,255,255,.7)"; g.font = "22px sans-serif";
  g.fillText(items.map((i) => getVariant(i.id, i.variant)?.product.name).filter(Boolean).join(" · ").slice(0, 80), 48, H - 40);
  const blob: Blob = await new Promise((r) => c.toBlob((b) => r(b!), "image/png"));
  const file = new File([blob], "mirrorcart-look.png", { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], title: "My Mirrorcart look" }); return; } catch { /* fall back to download */ } }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "mirrorcart-look.png"; a.click();
}

export function ResultViewer(p: {
  job: JobView; items: Item[]; store: string;
  onRerun: (items: Item[]) => void; onRemove: (i: Item) => void; onSwap: (i: Item, v: string) => void; onFabric: (i: Item, f?: string) => void;
  onCheckout: (items: Item[]) => void;
}) {
  const { job, items, store } = p;
  const [pick, setPick] = useState<number | null>(null);
  const [open, setOpen] = useState<{ id: string; what: "swap" | "fabric" } | null>(null);
  const [fabrics, setFabrics] = useState<{ id: string; thumb: string; title?: string }[] | null>(null);
  const [sharing, setSharing] = useState(false);
  const lastMain = job.steps.reduce((a, s, i) => (s.outputUrl && !s.branch ? i : a), -1);
  const shown = pick == null ? job.finalUrl || job.sourceUrl : pick < 0 ? job.sourceUrl : job.steps[pick].outputUrl || job.sourceUrl;

  useEffect(() => { if (open?.what === "fabric" && !fabrics) api.fabrics().then((r) => setFabrics(r.templates)).catch(() => setFabrics([])); }, [open, fabrics]);

  const done = job.steps.filter((s) => s.status === "done");
  const saved = job.mode === "live" ? done.filter((s) => s.cached).length : 0;
  const total = items.reduce((n, i) => n + (getVariant(i.id, i.variant)?.product.price ?? 0), 0);

  function remove(it: Item) {
    api.track("item_dropped_after_tryon", store, [{ id: it.id, variant: it.variant }]);
    p.onRemove(it);
    const next = items.filter((x) => !(x.id === it.id && x.variant === it.variant));
    if (next.length) p.onRerun(next); else p.onCheckout([]);
  }
  function swap(it: Item, v: string) {
    api.track("item_swapped", store, [{ id: it.id, variant: v }]);
    p.onSwap(it, v);
    p.onRerun(items.map((x) => (x.id === it.id && x.variant === it.variant ? { ...x, variant: v } : x)));
  }
  function fabric(it: Item, f?: string) {
    api.track("fabric_changed", store, [{ id: it.id, variant: it.variant }]);
    p.onFabric(it, f);
    p.onRerun(items.map((x) => (x.id === it.id && x.variant === it.variant ? { ...x, fabric: f } : x)));
  }

  return (
    <div className="rise grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="space-y-3">
        {saved > 0 && (
          <p className="saved-tag mx-auto w-fit rounded-full px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em]">
            ✦ {saved === done.length ? "Saved look" : `${saved} of ${done.length} steps saved`} · 0 credits
          </p>
        )}
        <BeforeAfter before={job.sourceUrl} after={shown} />
        <Filmstrip job={job} active={pick ?? lastMain} onPick={setPick} />
        {job.sceneUrl && (
          <button onClick={() => setPick(job.steps.findIndex((s) => s.branch))} className="w-full rounded-xl border border-white/15 px-3 py-2 text-left text-xs text-white/70 hover:border-lime">
            <b className="text-white">Bag styled scene →</b> YouCam Bag VTO re-renders the whole setting, so the bag is shown as its own styled shot instead of feeding the outfit chain.
          </button>
        )}
      </div>
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div><p className="font-mono text-[10px] uppercase tracking-[0.25em] text-lime">Step 4 · Decide</p>
            <h2 className="mt-1 font-display text-3xl font-bold">Keep it, swap it, or drop it</h2></div>
          <button disabled={sharing} onClick={async () => { setSharing(true); try { await sharePng(job.finalUrl || job.sourceUrl, items); } finally { setSharing(false); } }} className={btn.ghost}>{sharing ? "…" : "Share look"}</button>
        </div>
        {job.capHit && <p className="rounded-xl border border-lime/40 bg-lime/10 px-3 py-2 text-sm text-lime">Daily live budget reached mid-look; remaining steps were skipped. Try a sample model.</p>}
        {job.mode === "demo" && job.steps.some((s) => s.status === "skipped") && <p className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/70">Some steps aren&apos;t pre-generated for sample models; they show the previous step. Load a featured outfit for complete demo looks.</p>}
        <ul className="space-y-2">
          {items.map((it) => {
            const pv = getVariant(it.id, it.variant);
            if (!pv) return null;
            const step = job.steps.find((s) => s.productId === it.id && s.kind !== "fabric");
            const fabStep = job.steps.find((s) => s.productId === it.id && s.kind === "fabric");
            const skipped = job.skipped.find((s) => s.productId === it.id);
            const isOpen = open?.id === it.id;
            return (
              <li key={it.id} className="rounded-xl border border-white/10 p-3">
                <div className="flex items-center gap-3">
                  <img src={pv.variant.display ?? pv.variant.image} alt="" className="h-14 w-12 rounded-md bg-white object-contain p-1" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{pv.product.name} · {pv.variant.label}</p>
                    <p className="font-mono text-[10px] text-white/50">{SLOT_LABEL[slotOf(pv.product, pv.variant)]} · {money(pv.product.price)} demo
                      {step ? ` · ${step.status === "done" ? (step.cached && job.mode === "live" ? "on you · saved, 0 credits" : "on you") : step.note || step.status}` : skipped ? ` · ${skipped.reason}` : ""}
                      {fabStep ? ` · fabric ${fabStep.status === "done" ? "applied" : fabStep.note || fabStep.status}` : ""}</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                  <span className="rounded-full bg-lime/15 px-3 py-1 text-lime">Keep ✓</span>
                  <button onClick={() => remove(it)} className="rounded-full border border-white/20 px-3 py-1 hover:border-red-300 hover:text-red-200">Remove</button>
                  {pv.product.variants.length > 1 && <button onClick={() => setOpen(isOpen && open?.what === "swap" ? null : { id: it.id, what: "swap" })} className="rounded-full border border-white/20 px-3 py-1 hover:border-lime">Swap variant</button>}
                  {pv.product.fabricSwappable && <button onClick={() => setOpen(isOpen && open?.what === "fabric" ? null : { id: it.id, what: "fabric" })} className="rounded-full border border-white/20 px-3 py-1 hover:border-lime">Change fabric</button>}
                </div>
                {isOpen && open?.what === "swap" && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {pv.product.variants.filter((v) => v.id !== pv.variant.id).map((v) => (
                      <button key={v.id} onClick={() => { setOpen(null); swap(it, v.id); }} className="flex items-center gap-1.5 rounded-full border border-white/20 px-2.5 py-1 text-xs hover:border-lime">
                        <span className="h-3 w-3 rounded-full" style={{ background: v.swatch }} />{v.label}
                      </button>
                    ))}
                  </div>
                )}
                {isOpen && open?.what === "fabric" && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {fabrics == null ? <span className="text-xs text-white/50">Loading fabric templates…</span> : fabrics.length === 0 ? <span className="text-xs text-white/50">No fabric templates available.</span> :
                      fabrics.slice(0, 12).map((f) => (
                        <button key={f.id} title={f.title || f.id} onClick={() => { setOpen(null); fabric(it, f.id); }}
                          className={`h-10 w-10 overflow-hidden rounded-full border-2 ${it.fabric === f.id ? "border-lime" : "border-white/20 hover:border-white"}`}>
                          <img src={f.thumb} alt={f.title || "fabric"} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    {it.fabric && <button onClick={() => { setOpen(null); fabric(it, undefined); }} className="rounded-full border border-white/20 px-3 text-xs">Original fabric</button>}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-white/50">Swaps re-run only from the changed step; earlier steps are saved, so they cost 0 credits.</p>
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <span className="font-mono text-sm">{money(total)} <span className="text-white/50">demo</span></span>
          <button className={btn.primary} onClick={() => p.onCheckout(items)}>Checkout with confidence →</button>
        </div>
      </div>
    </div>
  );
}
