"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useId, useMemo, useState } from "react";
import { mirrorPaths } from "@/lib/mirror";
import { Mirror } from "@/components/Mirror";

export type HeroFrame = { src: string; label: string; thumb?: string; detail?: string };
export type HeroLook = { name: string; frames: HeroFrame[] };

const STARS: [number, number, number, number][] = [[3, 20, 1.1, 0], [97, 46, .8, 1.1], [1, 108, .7, 2.2], [98, 122, 1.2, .6], [72, -3, .7, 1.7]];
const STAR = "M0 -3C.35 -.35 .35 -.35 3 0C.35 .35 .35 .35 0 3C-.35 .35 -.35 .35 -3 0C-.35 -.35 -.35 -.35 0 -3Z";

/** A glossy blush squiggle mirror whose edge ripples like liquid, dressing a model one cart item at a time (real YouCam outputs). */
export function HeroMirror({ looks }: { looks: HeroLook[] }) {
  const seq = useMemo(() => looks.flatMap((l, li) => l.frames.map((_, fi) => ({ li, fi }))), [looks]);
  const [tick, setTick] = useState(0);
  const [still, setStill] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setStill(true); return; }
    const t = setInterval(() => setTick((n) => n + 1), 2600);
    return () => clearInterval(t);
  }, []);
  const id = useId().replace(/:/g, "");
  const shapes = useMemo(() => Array.from({ length: 9 }, (_, i) => mirrorPaths({ ratio: 1.5, rim: 5, amp: 3.4, waves: 12, phase: (i / 8) * Math.PI * 2 })), []);
  const { li, fi } = seq[tick % seq.length];
  const look = looks[li];
  const frame = look.frames[fi];
  const morph = (k: "outer" | "inner") => still ? null :
    <animate attributeName="d" dur="14s" repeatCount="indefinite" values={shapes.map((s) => s[k]).join(";")} />;
  const u = (s: string) => `url(#${id}${s})`;

  return (
    <div className="relative mx-auto w-[min(68vw,300px)] sm:w-[310px] lg:w-[min(330px,calc((100svh-230px)/1.43))]">
      <div className="glow-pulse pointer-events-none absolute -inset-12 rounded-full bg-[radial-gradient(closest-side,rgba(255,150,180,.42),transparent)] blur-2xl" />
      <div className="pointer-events-none absolute -bottom-6 left-1/2 h-10 w-[110%] -translate-x-1/2 rounded-[50%] bg-black/40 blur-xl" />
      <div className="float-slow relative">
        <svg viewBox="-8 -8 116 166" className="relative block w-full overflow-visible" role="img" aria-label={`${look.name}: ${frame.label}`}>
          <defs>
            <linearGradient id={`${id}r`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ffe6ec" /><stop offset=".35" stopColor="#ffa3b8" /><stop offset=".68" stopColor="#ff7b97" /><stop offset="1" stopColor="#ffc6d2" />
            </linearGradient>
            <radialGradient id={`${id}h`} cx=".26" cy=".08" r=".55">
              <stop offset="0" stopColor="#fff" stopOpacity=".95" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2=".65">
              <stop offset="0" stopColor="#fff" stopOpacity=".34" /><stop offset=".3" stopColor="#fff" stopOpacity="0" />
              <stop offset=".75" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#ffd6e0" stopOpacity=".3" />
            </linearGradient>
            <linearGradient id={`${id}s`} x1="0" x2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".5" stopColor="#fff" stopOpacity=".42" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <filter id={`${id}f`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.5" /></filter>
            <clipPath id={`${id}c`}><path d={shapes[0].inner}>{morph("inner")}</path></clipPath>
          </defs>
          <path d={shapes[0].outer} fill="#ff8fab" opacity=".6" filter={u("f")}>{morph("outer")}</path>
          <path d={shapes[0].outer} fill={u("r")}>{morph("outer")}</path>
          <path d={shapes[0].outer} fill={u("h")}>{morph("outer")}</path>
          <g clipPath={u("c")}>
            <rect x="0" y="0" width="100" height="150" fill="#ece5e1" />
            {looks.flatMap((l, a) => l.frames.map((f, b) => (
              <image key={`${a}-${b}`} href={f.src} x="2" y="2" width="96" height="146" preserveAspectRatio="xMidYMid slice"
                style={{ opacity: a === li && b === fi ? 1 : 0, transition: "opacity .9s ease" }} />
            )))}
            <rect x="0" y="0" width="100" height="150" fill={u("g")} />
            {!still && (
              <rect x="-60" y="-10" width="36" height="170" fill={u("s")} transform="skewX(-12)">
                <animate attributeName="x" values="-60;-60;150" keyTimes="0;.55;1" dur="6.5s" repeatCount="indefinite" />
              </rect>
            )}
          </g>
          <path d={shapes[0].inner} fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth=".7">{morph("inner")}</path>
          {STARS.map(([x, y, s, d]) => (
            <g key={`${x}-${y}`} transform={`translate(${x} ${y}) scale(${s})`}>
              <path className="twinkle" d={STAR} fill="#fff" style={{ animationDelay: `${d}s` }} />
            </g>
          ))}
        </svg>
        <p className="absolute bottom-[10%] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/45 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white backdrop-blur">
          {look.name}
        </p>
      </div>

      {frame.thumb && (
        <div key={tick} className="tag-in absolute -right-8 top-[36%] w-28 rounded-2xl bg-paper p-2 text-ink shadow-[0_20px_40px_-18px_rgba(0,0,0,.6)] sm:-right-28 sm:w-36">
          <Mirror ratio={1} rim={5} amp={3.5} waves={8} glass="bg-[#f0f0f0]"><img src={frame.thumb} alt="" className="h-full w-full object-contain p-2.5" /></Mirror>
          <p className="mt-1.5 px-1 text-[11px] font-semibold leading-tight">{frame.label.replace(/^\+ /, "")}</p>
          {frame.detail && <p className="px-1 text-[10px] text-muted">{frame.detail}</p>}
          <span className="absolute -left-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-coral text-xs font-bold text-white">+</span>
        </div>
      )}

      <ol className="relative mt-8 flex flex-wrap justify-center gap-1.5">
        {look.frames.map((f, i) => (
          <li key={f.label} className={`rounded-full px-2.5 py-1 text-[11px] transition ${i === fi ? "bg-[#ff9fb5] text-[#4a0f22]" : i < fi ? "bg-white/20 text-white" : "bg-white/5 text-white/50"}`}>
            {i === 0 ? "Her photo" : f.label.replace(/^\+ /, "")}
          </li>
        ))}
      </ol>
    </div>
  );
}
