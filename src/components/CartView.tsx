"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getVariant, money, SLOT_LABEL, slotOf } from "@/lib/catalog";
import { cart, useCart } from "@/lib/cart";
import { MirrorcartModal } from "@/components/mirrorcart/MirrorcartModal";
import { Mirror } from "@/components/Mirror";

export function CartView() {
  const items = useCart();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const rows = items.map((i) => ({ item: i, ...getVariant(i.productId, i.variantId)! })).filter((r) => r.product);
  const total = rows.reduce((n, r) => n + r.product.price * r.item.qty, 0);

  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <h1 className="font-display text-[clamp(2.4rem,5vw,3.6rem)] font-extrabold tracking-[-0.045em]">Your cart<span className="serif-i font-normal text-velvet"> · ready to try on</span></h1>
      {rows.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-ink/25 p-10 text-center">
          <p className="text-muted">Nothing here yet.</p>
          <Link href="/#shop" className="mt-4 inline-block rounded-full bg-ink px-6 py-3 text-paper">Shop the capsule</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <ul className="divide-y divide-line rounded-3xl bg-mist px-4 ring-1 ring-ink/5 sm:px-6">
            {rows.map(({ item, product, variant }) => (
              <li key={product.id + variant.id} className="flex items-center gap-3 py-4 sm:gap-4">
                <Mirror ratio={1.2} rim={6} amp={3.5} waves={8} glass="bg-[#f0f0f0]" className="w-20 shrink-0"><Image src={variant.image} alt="" fill sizes="80px" className="object-contain p-3" /></Mirror>
                <div className="min-w-0 flex-1">
                  <Link href={`/p/${product.id}`} className="font-display text-lg font-semibold hover:underline">{product.name}</Link>
                  <p className="text-sm text-muted">{variant.label} · qty {item.qty}</p>
                  <p className="mt-1 inline-block rounded-full bg-paper px-2 py-0.5 text-[11px] text-velvet ring-1 ring-ink/10">{SLOT_LABEL[slotOf(product, variant)]}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="font-mono">{money(product.price * item.qty)}</p>
                  <button onClick={() => cart.remove(product.id, variant.id)} className="text-xs text-muted underline-offset-4 hover:underline">Remove</button>
                </div>
              </li>
            ))}
          </ul>
          <aside className="h-fit rounded-3xl bg-ink p-6 text-white lg:sticky lg:top-28">
            <div className="flex justify-between font-mono text-sm"><span>Subtotal</span><span>{money(total)} <span className="text-white/50">pretend</span></span></div>
            <button onClick={() => setOpen(true)}
              className="sheen mt-6 w-full rounded-full bg-coral px-6 py-4 font-display text-lg font-bold text-white shadow-[0_14px_34px_-12px_rgba(217,70,122,.9)] transition hover:scale-[1.01]">
              See it on me
            </button>
            <p className="mt-3 text-xs text-white/60">Upload one photo (or pick a sample model) and see every item in your cart on you, in order: garments → shoes → bag → jewellery.</p>
            <Link href="/checkout" className="mt-4 block w-full rounded-full border border-white/20 px-6 py-3 text-center hover:bg-white/10">Checkout without trying on</Link>
          </aside>
        </div>
      )}
      {open && (
        <MirrorcartModal
          items={items.map((i) => ({ id: i.productId, variant: i.variantId, fabric: i.fabricTemplateId }))}
          onClose={() => setOpen(false)}
          onRemove={(it) => cart.remove(it.id, it.variant)}
          onSwap={(it, v) => it.variant && cart.setVariant(it.id, it.variant, v)}
          onFabric={(it, f) => it.variant && cart.setFabric(it.id, it.variant, f)}
          onReplaceItems={(next) => cart.replace(next.map((n) => ({ productId: n.id, variantId: n.variant || getVariant(n.id)!.variant.id, fabricTemplateId: n.fabric, qty: items.find((x) => x.productId === n.id)?.qty ?? 1 })))}
          onCheckout={() => router.push("/checkout")}
        />
      )}
    </div>
  );
}
