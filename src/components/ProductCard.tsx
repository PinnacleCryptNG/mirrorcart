import Image from "next/image";
import Link from "next/link";
import { Product, money } from "@/lib/catalog";

export function ProductCard({ product, index }: { product: Product; index: number }) {
  const v = product.variants[0];
  return (
    <Link href={`/p/${product.id}`} className="group reveal block" style={{ animationDelay: `${index * 40}ms` }}>
      <div className="relative">
        <div className="arch relative aspect-[4/5] overflow-hidden bg-fog ring-1 ring-ink/5 transition duration-500 group-hover:shadow-[0_24px_50px_-28px_rgba(7,43,33,.55)]">
          <Image src={v.image} alt={`${product.name} in ${v.label}`} fill sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
            className="object-contain p-5 pt-8 transition-transform duration-700 group-hover:scale-[1.05]" />
          <div className="sheen pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100" />
          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-paper/90 px-3 py-1 text-[11px] font-medium text-velvet shadow-sm backdrop-blur transition group-hover:bg-coral group-hover:text-white">
            Try it on you
          </span>
        </div>
        <span className="swing-tag absolute -right-1 top-6 flex flex-col items-center sm:right-1">
          <span className="h-3 w-px bg-ink/50" />
          <span className="rounded-md bg-coral px-2 py-1 font-mono text-[11px] font-medium text-white shadow-md">{money(product.price)}</span>
        </span>
      </div>
      <div className="mt-3 px-1">
        <h3 className="font-display text-[15px] font-bold leading-tight sm:text-base">{product.name}</h3>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="truncate text-[13px] text-muted">{product.fabric}</p>
          <div className="flex shrink-0 gap-1">
            {product.variants.map((x) => (
              <span key={x.id} title={x.label} className="h-3 w-3 rounded-full ring-1 ring-ink/20" style={{ background: x.swatch }} />
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
