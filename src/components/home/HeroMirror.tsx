"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from "react";

export type HeroFrame = { src: string; label: string; thumb?: string; detail?: string };
export type HeroLook = { name: string; frames: HeroFrame[] };

/** Arched fitting-room mirror that dresses a sample model one cart item at a time (real YouCam outputs). */
export function HeroMirror({ looks }: { looks: HeroLook[] }) {
  const seq = useMemo(() => looks.flatMap((l, li) => l.frames.map((_, fi) => ({ li, fi }))), [looks]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setTick((n) => n + 1), 2300);
    return () => clearInterval(t);
  }, []);
  const { li, fi } = seq[tick % seq.length];
  const look = looks[li];
  const frame = look.frames[fi];

  return (
    <div className="relative mx-auto w-[min(82vw,400px)] lg:w-[420px]">
      <div className="absolute -inset-10 rounded-full bg-[radial-gradient(closest-side,rgba(255,226,170,.35),transparent)] blur-2xl" />
      <div className="chrome arch relative p-[10px] shadow-[0_40px_90px_-30px_rgba(0,0,0,.7)]">
        <div className="arch relative aspect-[3/4] overflow-hidden bg-[#dfe6e2]">
          {looks.flatMap((l, a) => l.frames.map((f, b) => (
            <img key={`${a}-${b}`} src={f.src} alt={a === li && b === fi ? `${l.name}: ${f.label}` : ""}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${a === li && b === fi ? "opacity-100" : "opacity-0"}`} />
          )))}
          <div className="sheen absolute inset-0" />
          <p className="absolute left-1/2 top-5 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/45 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white backdrop-blur">
            {look.name}
          </p>
        </div>
      </div>

      {frame.thumb && (
        <div key={tick} className="tag-in absolute -right-4 top-[38%] w-32 rounded-2xl bg-paper p-2 text-ink shadow-[0_20px_40px_-18px_rgba(0,0,0,.6)] sm:-right-14 sm:w-36">
          <div className="arch-sm aspect-square overflow-hidden bg-fog"><img src={frame.thumb} alt="" className="h-full w-full object-contain p-1.5" /></div>
          <p className="mt-1.5 px-1 text-[11px] font-semibold leading-tight">{frame.label.replace(/^\+ /, "")}</p>
          {frame.detail && <p className="px-1 text-[10px] text-muted">{frame.detail}</p>}
          <span className="absolute -left-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-coral text-xs font-bold text-white">+</span>
        </div>
      )}

      <ol className="mt-6 flex justify-center gap-1.5">
        {look.frames.map((f, i) => (
          <li key={f.label} className={`rounded-full px-2.5 py-1 text-[11px] transition ${i === fi ? "bg-lime text-lime-ink" : i < fi ? "bg-white/20 text-white" : "bg-white/5 text-white/50"}`}>
            {i === 0 ? "Photo" : f.label.replace(/^\+ /, "")}
          </li>
        ))}
      </ol>
    </div>
  );
}
