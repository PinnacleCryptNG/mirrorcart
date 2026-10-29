"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Product, SLOT_LABEL, money, slotOf } from "@/lib/catalog";
import { cart } from "@/lib/cart";

export function ProductDetail({ product }: { product: Product }) {
  const [vid, setVid] = useState(product.variants[0].id);
  const [added, setAdded] = useState(false);
  const v = product.variants.find((x) => x.id === vid)!;
  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 lg:grid-cols-[1.3fr_1fr]">
      <div key={v.id} className="curtain-in relative aspect-[4/5] bg-fog">
        <Image src={v.image} alt={`${product.name} in ${v.label}`} fill priority sizes="(min-width:1024px) 55vw, 100vw" className="object-contain p-10" />
        <span className="absolute left-4 top-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">{product.category} / {v.label}</span>
      </div>
      <div className="lg:pt-8">
        <Link href="/#shop" className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted hover:text-ink">← All pieces</Link>
        <h1 className="mt-4 font-display text-5xl font-extrabold leading-[0.95] tracking-[-0.04em]">{product.name}</h1>
        <p className="mt-3 font-mono text-lg">{money(product.price)} <span className="text-xs text-muted">USD · demo price</span></p>
        <p className="mt-6 max-w-md text-muted">{product.blurb}</p>

        <div className="mt-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Colour / variant · {v.label}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.variants.map((x) => (
              <button key={x.id} onClick={() => setVid(x.id)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${x.id === vid ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"}`}>
                <span className="h-3.5 w-3.5 rounded-full border border-white/40" style={{ background: x.swatch }} />{x.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            onClick={() => { cart.add(product.id, v.id); setAdded(true); }}
            className="rounded-full bg-ink px-7 py-3.5 text-paper transition hover:bg-ink/85">
            {added ? "Added ✓ Add another" : "Add to cart"}
          </button>
          {added && <Link href="/cart" className="rounded-full border border-ink px-6 py-3.5 hover:bg-lime">Go to cart →</Link>}
        </div>

        <div className="mt-8 flex items-start gap-3 border border-ink p-4">
          <span className="mt-0.5 rounded-full bg-lime px-2 py-0.5 font-mono text-[10px] uppercase text-lime-ink">Try on me</span>
          <p className="text-sm">This piece works with Mirrorcart as the <b>{SLOT_LABEL[slotOf(product, v)].toLowerCase()}</b> step.
            Add it with the rest of your outfit, then press <b>See it on me</b> in the cart.
            {product.fabricSwappable && " You can also swap its fabric/pattern on your photo."}</p>
        </div>
        <dl className="mt-8 grid grid-cols-2 gap-y-2 border-t border-line pt-4 text-sm">
          <dt className="text-muted">Material</dt><dd>{product.fabric}</dd>
          <dt className="text-muted">Shipping</dt><dd>Demo only, nothing ships</dd>
        </dl>
      </div>
    </div>
  );
}
