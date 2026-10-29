"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getVariant, slotOf } from "@/lib/catalog";
import { api, Item, JobView, ModeInfo, Selfie } from "./api";
import { btn, ConsentStage, Filmstrip, PhotoStage, StepList } from "./Stages";
import { ResultViewer } from "./ResultViewer";

type Stage = "consent" | "photo" | "running" | "result";

export type MirrorcartProps = {
  items: Item[];
  store?: string;
  embedded?: boolean;
  onClose: () => void;
  onRemove?: (item: Item) => void;
  onSwap?: (item: Item, variant: string) => void;
  onFabric?: (item: Item, fabric?: string) => void;
  onCheckout?: (items: Item[]) => void;
  onReplaceItems?: (items: Item[]) => void;
};

const REASON: Record<string, string> = {
  demo_mode: "Demo mode is on: try a sample model for instant, pre-generated looks.",
  no_key: "Live try-on isn't configured on this deployment; sample models still work.",
  cap_reached: "Today's live try-on budget is used up. Sample models are instant and free.",
};

export function MirrorcartModal(p: MirrorcartProps) {
  const store = p.store || "aurel-demo";
  const [stage, setStage] = useState<Stage>("consent");
  const [mode, setMode] = useState<ModeInfo | null>(null);
  const [items, setItems] = useState<Item[]>(p.items);
  const [selfie, setSelfie] = useState<Selfie | null>(null);
  const [gender, setGender] = useState<"female" | "male" | undefined>();
  const [job, setJob] = useState<JobView | null>(null);
  const [toast, setToast] = useState("");
  const alive = useRef(true);
  const runId = useRef(0);

  useEffect(() => {
    alive.current = true;
    api.track("widget_open", store);
    api.mode().then(setMode).catch(() => {});
    return () => { alive.current = false; };
  }, [store]);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && p.onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [p]);

  const needsGender = items.some((i) => { const v = getVariant(i.id, i.variant); return v && ["shoes", "bag"].includes(slotOf(v.product, v.variant)); });

  const run = useCallback(async (s: Selfie, list: Item[], g?: string, rerun = false) => {
    const my = ++runId.current;
    setStage("running");
    try {
      const r = await api.start({ selfieId: s.id, items: list, gender: g, store, rerun });
      let j = r.job;
      setJob(j);
      while (!j.done && alive.current && my === runId.current) {
        const before = j.cursor;
        const res = await api.step(j.id);
        j = res.job;
        setJob(j);
        if (j.cursor === before && !j.done) await new Promise((t) => setTimeout(t, 2500));
      }
      if (my !== runId.current || !alive.current) return;
      sessionStorage.setItem("mc-tried-on", "1");
      setStage("result");
    } catch (e) {
      const m = (e as Error).message;
      setToast(m === "demo_only" ? REASON.cap_reached : m === "photo_not_found" ? "Your photo was deleted. Add a new one." : `Try-on failed: ${m}`);
      setStage("photo");
      api.mode().then(setMode).catch(() => {});
    }
  }, [store]);

  async function deletePhoto() {
    if (!selfie || selfie.demo) { setSelfie(null); setJob(null); setStage("photo"); return; }
    runId.current++;
    await api.deletePhoto(selfie.id, store);
    setSelfie(null); setJob(null); setStage("photo");
    setToast("Your photo and every try-on made from it were deleted.");
  }

  function updateItems(next: Item[]) {
    setItems(next);
    p.onReplaceItems?.(next);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-2 backdrop-blur-sm sm:p-6" onClick={p.embedded ? undefined : p.onClose}>
      <div className="mirror-edge relative w-full max-w-5xl rounded-[28px] p-[1.5px] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="relative max-h-[94vh] overflow-y-auto rounded-[27px] bg-glass/95 p-5 text-white sm:p-8">
          <header className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="sheen grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-white/90 to-white/30 font-display font-extrabold text-ink">M</span>
              <div>
                <p className="font-display text-xl font-bold leading-none">Mirrorcart</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-white/50">{items.length} items · {mode?.client === "mock" ? "mock API" : "YouCam API"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selfie && !selfie.demo && <button onClick={deletePhoto} className={btn.danger}>Delete my photo</button>}
              <button onClick={p.onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full border border-white/20 hover:bg-white/10">✕</button>
            </div>
          </header>
          {mode?.demoOnly && <div className="mb-5 rounded-xl border border-lime/40 bg-lime/10 px-4 py-2 text-sm text-lime">{REASON[mode.reason || "demo_mode"]}</div>}
          {mode?.client === "mock" && !mode.demoOnly && stage !== "consent" && <div className="mb-5 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/70">Mock mode: the API client returns YouCam&apos;s documented responses with placeholder images. No units are used.</div>}
          {toast && <div className="mb-5 flex justify-between rounded-xl bg-white/10 px-4 py-2 text-sm"><span>{toast}</span><button onClick={() => setToast("")}>✕</button></div>}

          {stage === "consent" && <ConsentStage onAgree={() => { api.track("consent_given", store); setStage("photo"); }} />}
          {stage === "photo" && (
            <PhotoStage mode={mode} needsGender={needsGender}
              onLoadOutfit={(o) => { updateItems(o); setToast("Outfit loaded into your cart."); }}
              onSelfie={(s, g) => { setSelfie(s); setGender(g); run(s, items, g); }} />
          )}
          {stage === "running" && job && (
            <div className="rise grid gap-6 lg:grid-cols-[1.1fr_1fr]">
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img key={job.finalUrl || job.steps.findLast((s) => s.outputUrl)?.outputUrl || job.sourceUrl}
                  src={job.steps.findLast((s) => s.outputUrl)?.outputUrl || job.sourceUrl} alt="Current try-on" className="curtain-in h-full w-full object-contain" />
                <div className="sheen absolute inset-0" />
                <p className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 font-mono text-[10px] uppercase tracking-widest">
                  Chaining step {Math.min(job.cursor + 1, job.steps.length)} / {job.steps.length}
                </p>
              </div>
              <div className="space-y-5">
                <div><p className="font-mono text-[10px] uppercase tracking-[0.25em] text-lime">Step 3 · Dressing you</p>
                  <h2 className="mt-1 font-display text-3xl font-bold">Each result feeds the next</h2></div>
                <StepList job={job} />
                <Filmstrip job={job} />
              </div>
            </div>
          )}
          {stage === "result" && job && selfie && (
            <ResultViewer job={job} items={items} store={store}
              onRerun={(next) => { updateItems(next); run(selfie, next, gender, true); }}
              onRemove={(it) => p.onRemove?.(it)} onSwap={(it, v) => p.onSwap?.(it, v)} onFabric={(it, f) => p.onFabric?.(it, f)}
              onCheckout={(list) => p.onCheckout?.(list)} />
          )}
        </div>
      </div>
    </div>
  );
}
