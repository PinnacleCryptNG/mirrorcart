"use client";
/* eslint-disable @next/next/no-img-element */
import { Mirror } from "@/components/Mirror";
import type { Item, SavedLook } from "./api";

const sameLook = (a: Item[], b: Item[]) => {
  const k = (l: Item[]) => JSON.stringify([...l].map((i) => [i.id, i.variant ?? "", i.fabric ?? ""]).sort());
  return k(a) === k(b);
};

/** Every look already made from this photo (last 24 h). Reopening one is served from saved results. */
export function FittingRoom({ looks, current, onOpen }: { looks: SavedLook[]; current: Item[]; onOpen: (items: Item[]) => void }) {
  return (
    <section className="rise mt-8 border-t border-white/10 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-lime">Your fitting room</p>
          <h3 className="mt-1 font-display text-2xl font-bold">Every look you&apos;ve tried <span className="serif-i font-normal">today</span></h3>
        </div>
        <p className="text-xs text-white/50">Tap one to bring it back instantly · 0 credits</p>
      </div>
      <ul className="mt-4 flex gap-4 overflow-x-auto pb-2">
        {looks.map((l) => {
          const on = sameLook(l.items, current);
          return (
            <li key={l.t} className="w-[124px] shrink-0">
              <button onClick={() => !on && onOpen(l.items)} disabled={on} aria-label={`Reopen look: ${l.labels.join(", ")}`}
                className={`group block w-full text-left transition ${on ? "" : "hover:-translate-y-1"}`}>
                <Mirror ratio={4 / 3} rim={4} glass="bg-black/40" className={on ? "drop-shadow-[0_0_14px_rgba(232,196,108,.55)]" : ""}>
                  <img src={l.thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
                </Mirror>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-white/50">
                  {on ? <span className="text-lime">On you now</span> : `${l.items.length} piece${l.items.length === 1 ? "" : "s"}`}
                </p>
                <p className="line-clamp-2 text-xs text-white/80">{l.labels.map((x) => x.split(" · ")[0]).join(", ")}</p>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
