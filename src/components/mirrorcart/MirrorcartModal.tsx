"use client";
import type { CartItem } from "@/lib/cart";

// Placeholder until the try-on flow lands (SPEC §9 step 4).
export function MirrorcartModal({ items, onClose }: { items: CartItem[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4" onClick={onClose}>
      <div className="rounded-2xl bg-glass p-8 text-paper" onClick={(e) => e.stopPropagation()}>
        <p className="font-display text-2xl">Mirrorcart</p>
        <p className="mt-2 text-sm opacity-70">{items.length} items ready. Try-on is coming in the next build step.</p>
        <button className="mt-6 rounded-full bg-lime px-5 py-2 text-lime-ink" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
