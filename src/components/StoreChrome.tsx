"use client";
import Link from "next/link";
import { useCart } from "@/lib/cart";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-extrabold tracking-[-0.04em] leading-none ${className}`}>
      AUREL<span className="mx-[0.12em] inline-block -translate-y-[0.05em] text-[0.8em] font-medium">&amp;</span>THREAD
    </span>
  );
}

export function StoreHeader() {
  const items = useCart();
  const count = items.reduce((n, i) => n + i.qty, 0);
  return (
    <header className="sticky top-0 z-30 border-b border-ink bg-paper/90 backdrop-blur">
      <div className="overflow-hidden border-b border-ink bg-ink py-1 text-[10px] uppercase tracking-[0.2em] text-paper font-mono">
        <div className="marquee flex w-max gap-10 whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, k) => (
            <span key={k} className="flex gap-10">
              <span>Demo store · prices are mock</span><span className="text-lime">● Try the whole cart on with Mirrorcart</span>
              <span>Fictional brand · no real logos</span><span>One photo → full outfit</span>
              <span className="text-lime">● Swap fabric inline</span><span>Photos auto-deleted within 24 h</span>
            </span>
          ))}
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link href="/" aria-label="Aurel & Thread home"><Wordmark className="text-2xl sm:text-3xl" /></Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/#shop" className="hidden sm:inline hover:underline underline-offset-4">Shop</Link>
          <Link href="/dashboard" className="hidden sm:inline hover:underline underline-offset-4">Retailer dashboard</Link>
          <Link href="/cart" className="flex items-center gap-2 rounded-full border border-ink px-4 py-1.5 hover:bg-ink hover:text-paper transition-colors">
            Cart <span className="font-mono text-xs">[{count}]</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function StoreFooter() {
  return (
    <footer className="mt-24 border-t border-ink">
      <div className="tape h-3 opacity-60" />
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:grid-cols-3">
        <div><Wordmark className="text-xl" /><p className="mt-3 max-w-xs text-sm text-muted">A fictional label built to demo Mirrorcart for the YouCam API Hackathon. Nothing here is for sale.</p></div>
        <div className="text-sm space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Mirrorcart</p>
          <Link className="block hover:underline" href="/dashboard">Retailer dashboard</Link>
          <a className="block hover:underline" href="/embed-demo.html">Embed on another shop</a>
          <Link className="block hover:underline" href="/privacy">Privacy &amp; retention</Link>
        </div>
        <div className="text-sm space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Credits</p>
          <a className="block hover:underline" href="https://github.com/PinnacleCryptNG/mirrorcart">Source (MIT)</a>
          <a className="block hover:underline" href="https://github.com/PinnacleCryptNG/mirrorcart/blob/main/public/products/CREDITS.md">Image credits</a>
          <p className="text-muted">Try-on powered by the YouCam API (Perfect Corp.)</p>
        </div>
      </div>
    </footer>
  );
}
