"use client";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { MirrorcartLogo } from "@/components/Logo";

/** The demo boutique's own name, in plain type (fictional brand, no logo). */
export function Wordmark({ className = "" }: { className?: string }) {
  return <span className={`serif-i leading-none ${className}`}>Aurel &amp; Thread</span>;
}

export function StoreHeader() {
  const items = useCart();
  const count = items.reduce((n, i) => n + i.qty, 0);
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur-md">
      <div className="bg-velvet-deep px-4 py-1.5 text-center text-[11px] text-white/80">
        <span className="hidden sm:inline">You&apos;re in <b className="font-semibold text-lime">Aurel &amp; Thread</b>, a pretend boutique for trying Mirrorcart. Nothing is for sale · photos auto-delete within 24 h</span>
        <span className="sm:hidden">Demo boutique · nothing is for sale · photos deleted in 24 h</span>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" aria-label="Mirrorcart home" className="flex min-w-0 items-baseline gap-3">
          <MirrorcartLogo className="text-[22px] sm:text-2xl" />
          <span className="hidden truncate text-sm text-muted md:inline">at <Wordmark className="text-[17px] text-ink" /></span>
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          <Link href="/#shop" className="hidden rounded-full px-3 py-2 hover:bg-fog sm:inline">Shop</Link>
          <Link href="/#how" className="hidden rounded-full px-3 py-2 hover:bg-fog lg:inline">How it works</Link>
          <Link href="/#retailers" className="hidden rounded-full px-3 py-2 hover:bg-fog lg:inline">For shops</Link>
          <Link href="/cart" className="ml-1 flex items-center gap-2 rounded-full bg-ink py-2 pl-4 pr-2 text-paper transition hover:bg-velvet">
            Cart
            <span className={`grid h-6 min-w-6 place-items-center rounded-full px-1.5 font-mono text-xs ${count ? "bg-coral text-white" : "bg-white/15"}`}>{count}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function StoreFooter() {
  return (
    <footer className="velvet-deep mt-24 text-white/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <MirrorcartLogo tone="light" className="text-2xl text-white" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed">A fitting room for online checkout. Shoppers see their whole cart on themselves before they pay, and shops get fewer &ldquo;it looked different on me&rdquo; returns.</p>
          <p className="mt-3 text-xs text-white/50">Built for the YouCam API Hackathon. Aurel &amp; Thread is fictional; prices are pretend.</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-lime">Product</p>
          <Link className="block hover:text-white" href="/#how">How it works</Link>
          <Link className="block hover:text-white" href="/dashboard">Retailer dashboard</Link>
          <a className="block hover:text-white" href="/embed-demo.html">Embed on another shop</a>
          <Link className="block hover:text-white" href="/privacy">Privacy &amp; photo deletion</Link>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-lime">Open source</p>
          <a className="block hover:text-white" href="https://github.com/PinnacleCryptNG/mirrorcart">Source code (MIT)</a>
          <a className="block hover:text-white" href="https://github.com/PinnacleCryptNG/mirrorcart/blob/main/public/products/CREDITS.md">Image credits</a>
          <p className="text-white/50">Try-on by the YouCam API (Perfect Corp.)</p>
        </div>
      </div>
    </footer>
  );
}
