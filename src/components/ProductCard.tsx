import Image from "next/image";
import Link from "next/link";
import { Product, money } from "@/lib/catalog";

export function ProductCard({ product, index }: { product: Product; index: number }) {
  const v = product.variants[0];
  return (
    <Link href={`/p/${product.id}`} className="group block rise" style={{ animationDelay: `${index * 40}ms` }}>
      <div className="relative aspect-[4/5] overflow-hidden bg-fog">
        <Image src={v.image} alt={`${product.name} in ${v.label}`} fill sizes="(min-width:1024px) 25vw, 50vw"
          className="object-contain p-6 transition-transform duration-500 group-hover:scale-[1.04]" />
        <span className="absolute left-3 top-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          {String(index + 1).padStart(2, "0")} / {product.category}
        </span>
        <span className="swing-tag absolute right-4 top-0 flex flex-col items-center">
          <span className="h-4 w-px bg-ink" />
          <span className="rounded-sm border border-ink bg-paper px-2 py-1 font-mono text-[11px] shadow-[2px_2px_0_var(--ink)]">
            {money(product.price)}<span className="ml-1 text-[9px] text-muted">demo</span>
          </span>
        </span>
        <span className="absolute bottom-3 left-3 rounded-full bg-lime px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-lime-ink">
          Try on me
        </span>
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold leading-tight">{product.name}</h3>
          <p className="text-sm text-muted">{product.fabric}</p>
        </div>
        <div className="flex gap-1 pt-1.5">
          {product.variants.map((x) => (
            <span key={x.id} title={x.label} className="h-3 w-3 rounded-full border border-ink/30" style={{ background: x.swatch }} />
          ))}
        </div>
      </div>
    </Link>
  );
}
