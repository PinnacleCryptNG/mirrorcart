"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getVariant, money } from "@/lib/catalog";
import { cart, useCart } from "@/lib/cart";

export function CheckoutView() {
  const items = useCart();
  const [placed, setPlaced] = useState<null | { id: string; total: number; count: number }>(null);
  const [triedOn, setTriedOn] = useState(false);
  useEffect(() => { setTriedOn(sessionStorage.getItem("mc-tried-on") === "1"); }, []);
  const rows = items.map((i) => ({ item: i, ...getVariant(i.productId, i.variantId)! }));
  const total = rows.reduce((n, r) => n + r.product.price * r.item.qty, 0);

  async function place() {
    const id = "AT-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    if (triedOn) {
      await fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "checkout_after_tryon", store: "aurel-demo", items: items.map((i) => ({ id: i.productId, variant: i.variantId })) }) }).catch(() => {});
      sessionStorage.removeItem("mc-tried-on");
    }
    setPlaced({ id, total, count: items.reduce((n, i) => n + i.qty, 0) });
    cart.clear();
  }

  if (placed)
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center rise">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted">Order {placed.id}</p>
        <h1 className="mt-4 font-display text-6xl font-extrabold tracking-[-0.04em]">Demo order placed</h1>
        <p className="mt-4 text-muted">{placed.count} items · {money(placed.total)} (demo). No payment was taken and nothing will ship.</p>
        <Link href="/" className="mt-8 inline-block rounded-full bg-ink px-6 py-3 text-paper">Back to the store</Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="font-display text-5xl font-extrabold tracking-[-0.04em]">Checkout</h1>
      <p className="mt-2 text-sm text-muted">Mock checkout: no payment details, nothing ships.</p>
      {triedOn && <p className="mt-4 inline-block rounded-full bg-lime px-3 py-1 font-mono text-[11px] uppercase text-lime-ink">Checking out with confidence: tried on</p>}
      <ul className="mt-8 divide-y divide-line rounded-3xl bg-mist px-5 ring-1 ring-ink/5">
        {rows.map(({ item, product, variant }) => (
          <li key={product.id + variant.id} className="flex justify-between py-3 text-sm"><span>{product.name} · {variant.label} × {item.qty}</span><span className="font-mono">{money(product.price * item.qty)}</span></li>
        ))}
      </ul>
      <div className="mt-4 flex justify-between font-mono"><span>Total</span><span>{money(total)} demo</span></div>
      <button disabled={!rows.length} onClick={place} className="mt-8 w-full rounded-full bg-coral px-6 py-4 font-semibold text-white disabled:opacity-40">Place demo order</button>
    </div>
  );
}
