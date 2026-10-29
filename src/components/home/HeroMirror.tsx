"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useId, useMemo, useState } from "react";
import { mirrorPaths } from "@/lib/mirror";
import { Mirror } from "@/components/Mirror";
import { Look, LOOK_SLOT } from "@/lib/looks";

const STAR = "M0 -3C.35 -.35 .35 -.35 3 0C.35 .35 .35 .35 0 3C-.35 .35 -.35 .35 -3 0C-.35 -.35 -.35 -.35 0 -3Z";
const STARS: [number, number, number, number][] = [[3, 20, 1.1, 0], [97, 46, .8, 1.1], [1, 108, .7, 2.2], [98, 122, 1.2, .6], [72, -3, .7, 1.7]];
const BURST: [number, number][] = [[0, -15], [13, -8], [14, 7], [0, 15], [-13, 8], [-14, -7]];
const DUST = Array.from({ length: 16 }, (_, i) => ({ x: 8 + ((i * 37) % 84), y: 40 + ((i * 53) % 100), r: .35 + (i % 3) * .25, d: (i * .83) % 7, t: 6 + (i % 4) }));
const TICK = 1500;

/** The opening mirror: a glossy rose squiggle that "reflects" a cart as each piece lands into a styled flat-lay. */
export function HeroMirror({ looks }: { looks: Look[] }) {
  const [tick, setTick] = useState(0);
  const [still, setStill] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setStill(true); return; }
    const t = setInterval(() => setTick((n) => n + 1), TICK);
    return () => clearInterval(t);
  }, []);
  const id = useId().replace(/:/g, "");
  const shapes = useMemo(() => Array.from({ length: 9 }, (_, i) => mirrorPaths({ ratio: 1.5, rim: 5, amp: 3.4, waves: 12, phase: (i / 8) * Math.PI * 2 })), []);

  const cycles = looks.map((l) => l.pieces.length + 4);
  let t = still ? 0 : tick % cycles.reduce((a, b) => a + b, 0), li = 0;
  while (t >= cycles[li]) { t -= cycles[li]; li++; }
  const look = looks[li];
  const n = look.pieces.length;
  const landed = still ? n : Math.min(t, n);
  const done = landed === n;
  const leaving = !still && t === n + 3;
  const latest = landed > 0 && !done ? look.pieces[landed - 1] : null;
  const total = look.pieces.reduce((s, p) => s + p.price, 0);

  const morph = (k: "outer" | "inner") => still ? null :
    <animate attributeName="d" dur="14s" repeatCount="indefinite" values={shapes.map((s) => s[k]).join(";")} />;
  const u = (s: string) => `url(#${id}${s})`;

  return (
    <div className="relative mx-auto w-[min(68vw,300px)] sm:w-[310px] lg:w-[min(330px,calc((100svh-230px)/1.43))]">
      <div className="glow-pulse pointer-events-none absolute -inset-12 rounded-full bg-[radial-gradient(closest-side,rgba(236,143,176,.4),transparent)] blur-2xl" />
      <div className="pointer-events-none absolute -bottom-6 left-1/2 h-10 w-[110%] -translate-x-1/2 rounded-[50%] bg-black/40 blur-xl" />
      <div className="float-slow relative">
        <svg viewBox="-8 -8 116 166" className="relative block w-full overflow-visible" role="img"
          aria-label={`${look.name}: ${look.pieces.map((p) => p.name).join(", ")}`}>
          <defs>
            <linearGradient id={`${id}r`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ffe4ec" /><stop offset=".35" stopColor="#f6a9c1" /><stop offset=".68" stopColor="#e46d96" /><stop offset="1" stopColor="#f8cbd8" />
            </linearGradient>
            <radialGradient id={`${id}h`} cx=".26" cy=".08" r=".55">
              <stop offset="0" stopColor="#fff" stopOpacity=".9" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${id}b`} cx=".45" cy=".42" r=".75">
              <stop offset="0" stopColor="#fffaf5" /><stop offset=".7" stopColor="#f9ebe8" /><stop offset="1" stopColor="#f1d6db" />
            </radialGradient>
            <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2=".65">
              <stop offset="0" stopColor="#fff" stopOpacity=".4" /><stop offset=".3" stopColor="#fff" stopOpacity="0" />
              <stop offset=".75" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#f6c9d6" stopOpacity=".35" />
            </linearGradient>
            <linearGradient id={`${id}s`} x1="0" x2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".5" stopColor="#fff6e0" stopOpacity=".55" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <filter id={`${id}f`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.5" /></filter>
            <filter id={`${id}d`} x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx=".6" dy="1.6" stdDeviation="1.4" floodColor="#6b2440" floodOpacity=".22" /></filter>
            <clipPath id={`${id}c`}><path d={shapes[0].inner}>{morph("inner")}</path></clipPath>
          </defs>
          <path d={shapes[0].outer} fill="#ec8fb0" opacity=".6" filter={u("f")}>{morph("outer")}</path>
          <path d={shapes[0].outer} fill={u("r")}>{morph("outer")}</path>
          <path d={shapes[0].outer} fill={u("h")}>{morph("outer")}</path>
          <g clipPath={u("c")}>
            <rect x="0" y="0" width="100" height="150" fill={u("b")} />
            {DUST.map((p, i) => (
              <circle key={i} className="dust" cx={p.x} cy={p.y} r={p.r} fill="#e8c46c"
                style={{ "--d": `${p.d}s`, "--t": `${p.t}s` } as React.CSSProperties} />
            ))}
            <g key={li} filter={u("d")} style={{ opacity: leaving ? 0 : 1, transition: "opacity .9s ease" }}>
              {look.pieces.map((p, i) => {
                const [x, y, w, h, r] = LOOK_SLOT[p.slot], on = i < landed;
                return (
                  <image key={p.src} href={p.src} x={x} y={y} width={w} height={h} preserveAspectRatio="xMidYMid meet"
                    style={{ transformBox: "fill-box", transformOrigin: "center", opacity: on ? 1 : 0,
                      transform: on ? `rotate(${r}deg)` : `translateY(-22px) scale(.55) rotate(${r - 24}deg)`,
                      transition: "opacity .5s ease, transform .9s cubic-bezier(.2,1.5,.4,1)" }} />
                );
              })}
            </g>
            <rect x="0" y="0" width="100" height="150" fill={u("g")} />
            {!still && (
              <rect x="-60" y="-10" width="36" height="170" fill={u("s")} transform="skewX(-12)">
                <animate attributeName="x" values="-60;-60;150" keyTimes="0;.55;1" dur="6.5s" repeatCount="indefinite" />
              </rect>
            )}
          </g>
          <path d={shapes[0].inner} fill="none" stroke="#f3d58f" strokeOpacity=".85" strokeWidth=".8">{morph("inner")}</path>
          {!still && landed > 0 && (() => {
            const [x, y, w, h] = done ? [0, 0, 100, 150] : LOOK_SLOT[look.pieces[landed - 1].slot];
            const s = done ? 2.4 : 1;
            return (
              <g key={`${li}-${landed}`} transform={`translate(${x + w / 2} ${y + h / 2})`}>
                {BURST.map(([dx, dy], i) => (
                  <path key={i} className="burst" d={STAR} fill={i % 2 ? "#fff" : "#f3d58f"}
                    style={{ "--dx": `${dx * s}px`, "--dy": `${dy * s}px`, animationDelay: `${i * 40}ms` } as React.CSSProperties} />
                ))}
              </g>
            );
          })()}
          {STARS.map(([x, y, s, d]) => (
            <g key={`${x}-${y}`} transform={`translate(${x} ${y}) scale(${s})`}>
              <path className="twinkle" d={STAR} fill="#fff" style={{ animationDelay: `${d}s` }} />
            </g>
          ))}
        </svg>
        <p className="absolute bottom-[9%] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-velvet-deep/80 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-lime backdrop-blur">
          {look.name}
        </p>
      </div>

      {(latest || done) && (
        <div key={`${li}-${landed}`} className="tag-in absolute -right-8 top-[36%] w-28 rounded-2xl bg-paper p-2 text-ink shadow-[0_20px_40px_-18px_rgba(0,0,0,.6)] sm:-right-28 sm:w-36">
          {latest ? (
            <>
              <Mirror ratio={1} rim={5} amp={3.5} waves={8} glass="bg-[#fbf3f4]"><img src={latest.src} alt="" className="h-full w-full object-contain p-3" /></Mirror>
              <p className="mt-1.5 px-1 text-[11px] font-semibold leading-tight">{latest.name}</p>
              <p className="px-1 text-[10px] text-muted">{latest.detail}</p>
            </>
          ) : (
            <div className="px-1 py-2 text-center">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-coral">The whole cart</p>
              <p className="serif-i mt-1 text-2xl leading-none">${total}</p>
              <p className="mt-1.5 text-[10px] leading-snug text-muted">{n} pieces, seen together before checkout</p>
            </div>
          )}
          <span className="absolute -left-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-coral text-xs font-bold text-white">{latest ? "+" : "✓"}</span>
        </div>
      )}

      <ol className="relative mt-8 flex flex-wrap justify-center gap-1.5">
        {[...look.pieces.map((p) => p.name), "Complete look"].map((name, i) => {
          const at = done ? n : landed - 1;
          return (
            <li key={name} className={`rounded-full px-2.5 py-1 text-[11px] transition ${i === at ? "bg-blush text-velvet-deep" : i < at ? "bg-white/20 text-white" : "bg-white/5 text-white/50"}`}>
              {name}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
