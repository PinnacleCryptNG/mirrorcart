"use client";
/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { mirrorMasks } from "@/lib/mirror";

const M = mirrorMasks({ ratio: 4 / 3, rim: 3.5 });

export function BeforeAfter({ before, after, alt }: { before: string; after: string; alt: string }) {
  const [x, setX] = useState(52);
  const box = useRef<HTMLDivElement>(null);
  const move = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (r) setX(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  };
  return (
    <div className="mirror relative aspect-[3/4] w-full">
    <div className="mirror-rim absolute inset-0" style={M.outer} />
    <div ref={box} style={M.inner} className="absolute inset-0 cursor-ew-resize touch-none select-none overflow-hidden bg-fog"
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); move(e.clientX); }}
      onPointerMove={(e) => e.buttons && move(e.clientX)}>
      <img src={after} alt={`${alt}, after`} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <img src={before} alt={`${alt}, before`} className="absolute inset-0 h-full w-full object-cover" style={{ clipPath: `inset(0 ${100 - x}% 0 0)` }} draggable={false} />
      <div className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,.4)]" style={{ left: `${x}%` }}>
        <input type="range" min={0} max={100} value={Math.round(x)} onChange={(e) => setX(Number(e.target.value))} aria-label="Compare before and after"
          className="absolute inset-0 h-full w-6 -translate-x-1/2 cursor-ew-resize opacity-0" />
        <span className="absolute top-1/2 left-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-paper text-ink shadow-lg">⟷</span>
      </div>
      <span className="absolute bottom-[12%] left-[17%] rounded-full bg-black/55 px-3 py-1 text-xs text-white">Her photo</span>
      <span className="absolute bottom-[12%] right-[17%] rounded-full bg-coral px-3 py-1 text-xs text-white">Her cart, on her</span>
      <div className="mirror-glare pointer-events-none absolute inset-0" />
    </div>
    </div>
  );
}
