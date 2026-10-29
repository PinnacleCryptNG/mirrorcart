"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { getVariant, money, SLOT_LABEL, slotOf } from "@/lib/catalog";
import { cart, useCart } from "@/lib/cart";
import { MirrorcartModal } from "@/components/mirrorcart/MirrorcartModal";

export function CartView() {
  const items = useCart();
  const [open, setOpen] = useState(false);
  const rows = items.map((i) => ({ item: i, ...getVariant(i.productId, i.variantId)! })).filter((r) => r.product);
  const total = rows.reduce((n, r) => n + r.product.price * r.item.qty, 0);

  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <h1 className="font-display text-5xl font-extrabold tracking-[-0.04em]">Your cart</h1>
      {rows.length === 0 ? (
        <div className="mt-10 border border-dashed border-ink p-10 text-center">
          <p className="text-muted">Nothing here yet.</p>
          <Link href="/#shop" className="mt-4 inline-block rounded-full bg-ink px-6 py-3 text-paper">Shop the capsule</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <ul className="divide-y divide-line border-y border-ink">
            {rows.map(({ item, product, variant }) => (
              <li key={product.id + variant.id} className="flex items-center gap-4 py-4">
                <div className="relative h-24 w-20 shrink-0 bg-fog"><Image src={variant.image} alt="" fill sizes="80px" className="object-contain p-2" /></div>
                <div className="flex-1">
                  <Link href={`/p/${product.id}`} className="font-display text-lg font-semibold hover:underline">{product.name}</Link>
                  <p className="text-sm text-muted">{variant.label} · qty {item.qty}</p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted">step: {SLOT_LABEL[slotOf(product, variant)]}</p>
                </div>
                <p className="font-mono">{money(product.price * item.qty)}</p>
                <button onClick={() => cart.remove(product.id, variant.id)} className="text-sm text-muted underline-offset-4 hover:underline">Remove</button>
              </li>
            ))}
          </ul>
          <aside className="h-fit border border-ink p-6">
            <div className="flex justify-between font-mono text-sm"><span>Subtotal</span><span>{money(total)} <span className="text-muted">demo</span></span></div>
            <button onClick={() => setOpen(true)}
              className="sheen mt-6 w-full rounded-full bg-glass px-6 py-4 font-display text-lg font-bold text-paper ring-2 ring-lime ring-offset-2 transition hover:scale-[1.01]">
              See it on me
            </button>
            <p className="mt-3 text-xs text-muted">Upload one photo (or pick a sample model) and see every item in your cart on you, in order: garments → shoes → bag → jewellery.</p>
            <Link href="/checkout" className="mt-4 block w-full rounded-full border border-ink px-6 py-3 text-center hover:bg-fog">Checkout without trying on</Link>
          </aside>
        </div>
      )}
      {open && <MirrorcartModal items={items} onClose={() => setOpen(false)} />}
    </div>
  );
}
