"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from "react";

export type HeroFrame = { src: string; label: string; thumb?: string; detail?: string };
export type HeroLook = { name: string; frames: HeroFrame[] };

// Glass opening inside /hero/mirror-frame.png (644×1479), in % of the frame.
const GLASS = { left: "9.94%", top: "7.91%", width: "79.97%", height: "86.82%" };

/** Gilded Art Deco fitting-room mirror that dresses a model one cart item at a time (real YouCam outputs). */
export function HeroMirror({ looks }: { looks: HeroLook[] }) {
  const seq = useMemo(() => looks.flatMap((l, li) => l.frames.map((_, fi) => ({ li, fi }))), [looks]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setTick((n) => n + 1), 2600);
    return () => clearInterval(t);
  }, []);
  const { li, fi } = seq[tick % seq.length];
  const look = looks[li];
  const frame = look.frames[fi];

  return (
    <div className="relative mx-auto w-[min(62vw,280px)] sm:w-[290px] lg:w-[min(290px,calc((100svh-200px)*0.4354))]">
      <div className="pointer-events-none absolute -inset-x-24 -top-10 bottom-0 bg-[radial-gradient(closest-side,rgba(255,222,150,.42),transparent)] blur-2xl" />
      <div className="pointer-events-none absolute -bottom-5 left-1/2 h-10 w-[120%] -translate-x-1/2 rounded-[50%] bg-black/45 blur-xl" />
      <div className="float-slow relative aspect-[644/1479]">
        <div className="absolute overflow-hidden bg-[#e9e4dc] glass-mask" style={GLASS}>
          {looks.flatMap((l, a) => l.frames.map((f, b) => (
            <img key={`${a}-${b}`} src={f.src} alt={a === li && b === fi ? `${l.name}: ${f.label}` : ""}
              className={`absolute inset-0 h-full w-full object-cover object-[50%_35%] transition-all duration-[900ms] ${a === li && b === fi ? "scale-100 opacity-100" : "scale-[1.02] opacity-0"}`} />
          )))}
          <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,.22)_0%,transparent_28%,transparent_70%,rgba(255,236,200,.18)_100%)]" />
          <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(40,25,0,.35)]" />
          <div className="sheen absolute inset-0" />
        </div>
        <img src="/hero/mirror-frame.png" alt="" className="pointer-events-none absolute inset-0 h-full w-full drop-shadow-[0_18px_30px_rgba(0,0,0,.45)]" />
        <div className="gold-glint pointer-events-none absolute inset-0" />
        <p className="absolute bottom-[8%] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/50 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white backdrop-blur">
          {look.name}
        </p>
      </div>

      {frame.thumb && (
        <div key={tick} className="tag-in absolute -right-10 top-[36%] w-28 rounded-2xl bg-paper p-2 text-ink shadow-[0_20px_40px_-18px_rgba(0,0,0,.6)] sm:-right-28 sm:w-36">
          <div className="arch-sm aspect-square overflow-hidden bg-fog"><img src={frame.thumb} alt="" className="h-full w-full object-contain p-1.5" /></div>
          <p className="mt-1.5 px-1 text-[11px] font-semibold leading-tight">{frame.label.replace(/^\+ /, "")}</p>
          {frame.detail && <p className="px-1 text-[10px] text-muted">{frame.detail}</p>}
          <span className="absolute -left-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-coral text-xs font-bold text-white">+</span>
        </div>
      )}

      <ol className="relative mt-8 flex flex-wrap justify-center gap-1.5">
        {look.frames.map((f, i) => (
          <li key={f.label} className={`rounded-full px-2.5 py-1 text-[11px] transition ${i === fi ? "bg-lime text-lime-ink" : i < fi ? "bg-white/20 text-white" : "bg-white/5 text-white/50"}`}>
            {i === 0 ? "Her photo" : f.label.replace(/^\+ /, "")}
          </li>
        ))}
      </ol>
    </div>
  );
}
