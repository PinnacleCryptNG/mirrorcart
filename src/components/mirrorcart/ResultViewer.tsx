"use client";
/* eslint-disable @next/next/no-img-element */
import { Item, JobView } from "./api";
import { btn, Filmstrip } from "./Stages";

export function ResultViewer(p: {
  job: JobView; items: Item[]; store: string;
  onRerun: (items: Item[]) => void; onRemove: (i: Item) => void; onSwap: (i: Item, v: string) => void; onFabric: (i: Item, f?: string) => void;
  onCheckout: (items: Item[]) => void;
}) {
  return (
    <div className="rise grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <img src={p.job.finalUrl} alt="Your look" className="aspect-[3/4] w-full rounded-2xl object-contain bg-black/40" />
      <div className="space-y-4">
        <h2 className="font-display text-3xl font-bold">Your look</h2>
        <Filmstrip job={p.job} />
        <button className={btn.primary} onClick={() => p.onCheckout(p.items)}>Checkout with confidence</button>
      </div>
    </div>
  );
}
