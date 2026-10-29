"use client";
import { useState } from "react";
import { PRODUCTS, Product } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";

const ORDER: Product["category"][] = ["Full looks", "Tops", "Bottoms", "Shoes", "Bags", "Jewellery"];
const LABEL: Record<Product["category"], string> = { "Full looks": "Dresses & jumpsuits", Tops: "Tops", Bottoms: "Skirts & trousers", Shoes: "Shoes", Bags: "Bags", Jewellery: "Jewellery" };

export function ShopGrid() {
  const [cat, setCat] = useState<Product["category"] | "all">("all");
  const list = [...PRODUCTS].sort((a, b) => ORDER.indexOf(a.category) - ORDER.indexOf(b.category)).filter((p) => cat === "all" || p.category === cat);
  const chip = (on: boolean) => `shrink-0 rounded-full border px-4 py-2 text-sm transition ${on ? "border-ink bg-ink text-paper" : "border-ink/15 bg-paper hover:border-ink/50"}`;
  return (
    <>
      <div className="no-scrollbar -mx-5 mt-8 flex gap-2 overflow-x-auto px-5 pb-1">
        <button className={chip(cat === "all")} onClick={() => setCat("all")}>Everything <span className="ml-1 font-mono text-xs opacity-60">{PRODUCTS.length}</span></button>
        {ORDER.map((c) => (
          <button key={c} className={chip(cat === c)} onClick={() => setCat(c)}>{LABEL[c]}</button>
        ))}
      </div>
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
        {list.map((p) => <ProductCard key={p.id} product={p} index={PRODUCTS.indexOf(p)} />)}
      </div>
    </>
  );
}
