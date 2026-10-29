import Image from "next/image";
import Link from "next/link";
import { CATEGORIES, PRODUCTS } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";

export default function Home() {
  return (
    <>
      <section className="border-b border-ink">
        <div className="mx-auto grid max-w-7xl lg:grid-cols-[1.2fr_1fr]">
          <div className="flex flex-col justify-between gap-10 px-5 py-14 lg:border-r lg:border-ink lg:py-20">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted">SS27 · Capsule of twelve</p>
            <h1 className="font-display text-[clamp(3rem,8vw,7.5rem)] font-extrabold leading-[0.86] tracking-[-0.05em]">
              Dress the<br />whole cart.<br /><span className="relative inline-block">
                Then decide.
                <span className="absolute -bottom-1 left-0 h-3 w-full -z-10 bg-lime" />
              </span>
            </h1>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="#shop" className="rounded-full bg-ink px-6 py-3 text-paper hover:bg-ink/85">Shop the capsule</Link>
              <Link href="/cart" className="rounded-full border border-ink px-6 py-3 hover:bg-lime">See it on me →</Link>
              <p className="max-w-sm text-sm text-muted">Add a top, shoes and a bag, then upload one photo. Mirrorcart puts the whole outfit on you before you pay.</p>
            </div>
          </div>
          <div className="relative grid grid-cols-3 border-t border-ink lg:border-t-0">
            {["amara", "mei", "ravi"].map((m, i) => (
              <div key={m} className={`sheen relative aspect-[3/5] bg-fog ${i < 2 ? "border-r border-ink" : ""}`} style={{ animationDelay: `${i * 0.6}s` }}>
                <Image src={`/demo/models/${m}.jpg`} alt={`Sample model ${m}`} fill sizes="20vw" className="object-cover" priority />
                <span className="absolute bottom-2 left-2 font-mono text-[10px] uppercase tracking-widest">fig. {i + 1}</span>
              </div>
            ))}
            <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">
              <span className="inline-block rotate-[-4deg] border border-ink bg-paper px-3 py-1 font-mono text-[11px] uppercase tracking-widest shadow-[3px_3px_0_var(--ink)]">
                one photo · whole outfit
              </span>
            </div>
          </div>
        </div>
      </section>

      <section id="shop" className="mx-auto max-w-7xl px-5 pt-14">
        {CATEGORIES.map((cat) => {
          const items = PRODUCTS.filter((p) => p.category === cat);
          return (
            <div key={cat} className="mb-14">
              <div className="mb-5 flex items-baseline justify-between border-b border-ink pb-2">
                <h2 className="font-display text-3xl font-bold tracking-tight">{cat}</h2>
                <span className="font-mono text-[11px] text-muted">{items.length} pieces</span>
              </div>
              <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
                {items.map((p) => <ProductCard key={p.id} product={p} index={PRODUCTS.indexOf(p)} />)}
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
