import Image from "next/image";
import Link from "next/link";
import { HeroMirror } from "@/components/home/HeroMirror";
import { FlatLay } from "@/components/home/FlatLay";
import { LOOKS, LOOKBOOK, lookTotal } from "@/lib/looks";
import { ShopGrid } from "@/components/home/ShopGrid";
import { Mirror } from "@/components/Mirror";
import { TryLook } from "@/components/home/TryLook";
import { RETURN_COST, RETURN_RATE, SAMPLE_STATS } from "@/lib/sample-stats";


const STEPS = [
  { n: "01", t: "Fill your cart", d: "Pick a dress or a top and skirt, then shoes, a bag and jewellery. Mix colours and fabrics like you would in a store." },
  { n: "02", t: "Add one photo", d: "A full-length, front-facing photo works best. We frame it around you automatically, or you can use one of our sample models." },
  { n: "03", t: "See it all on you", d: "Each piece is put on in order, so you see one complete outfit. Swap a colour or fabric, remove what doesn't work, then check out." },
];
const YOUCAM = [
  ["Clothes", "cloth-v4"],
  ["Shoes", "shoes-transfer"],
  ["Bags", "bag"],
  ["Fabric swap", "fabric"],
  ["Necklaces & earrings", "2d-vto"],
];
const S = SAMPLE_STATS.counts;
const DROPPED = S.item_dropped_after_tryon;
const PREVIEW = [
  ["Try-ons", String(S.tryon_started)],
  ["Bought after trying on", `${Math.round((S.checkout_after_tryon / S.tryon_completed) * 100)}%`],
  ["Likely returns avoided", String(Math.round(DROPPED * RETURN_RATE / 100))],
  ["Return costs saved", `$${Math.round(DROPPED * RETURN_RATE / 100 * RETURN_COST)}`],
];

const CART = ["/hero/cut/wrap-dress-sage.png", "/hero/cut/block-heel-loafers-tan.png", "/hero/cut/mini-crossbody-cream.png"];

function StepVisual({ n }: { n: string }) {
  if (n === "01") return (
    <>
      {CART.map((src, i) => (
        <div key={src} className="w-20" style={{ transform: `rotate(${(i - 1) * 7}deg) translateY(${i === 1 ? -8 : 0}px)` }}>
          <Mirror ratio={1.42} rim={5.5} amp={3.4} waves={8} glass="flatlay-glass">
            <Image src={src} alt="" fill sizes="80px" className="object-contain p-3" />
          </Mirror>
        </div>
      ))}
    </>
  );
  if (n === "02") return (
    <div className="relative w-28">
      <Mirror ratio={1.42} rim={5.5} amp={3.4} waves={8} glass="flatlay-glass">
        <div className="viewfinder absolute inset-[18%_16%]">
          {["left-0 top-0 border-l-2 border-t-2", "right-0 top-0 border-r-2 border-t-2", "bottom-0 left-0 border-b-2 border-l-2", "bottom-0 right-0 border-b-2 border-r-2"].map((c) => (
            <span key={c} className={`absolute h-4 w-4 border-brass ${c}`} />
          ))}
        </div>
        <p className="serif-i absolute inset-0 grid place-items-center text-[2.6rem] text-velvet">you</p>
        <div className="flash pointer-events-none absolute inset-0 bg-white" />
      </Mirror>
      <span className="absolute -right-3 top-3 rounded-full bg-coral px-2 py-0.5 font-mono text-[10px] text-white">1 photo</span>
    </div>
  );
  return (
    <div className="relative w-[6.5rem]">
      <FlatLay look={LOOKS[0]} />
      <span className="serif-i absolute -right-6 top-6 rounded-full bg-velvet px-2.5 py-0.5 text-sm text-lime">${lookTotal(LOOKS[0])}</span>
    </div>
  );
}

export default function Home() {
  return (
    <>
      {/* HERO: the fitting room */}
      <section className="velvet relative overflow-hidden text-white">
        <div className="curtain l" /><div className="curtain r" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-14 pt-10 lg:grid-cols-[1.1fr_1fr] lg:pb-16 lg:pt-14">
          <div className="rise">
            <h1 className="font-display text-[clamp(2.7rem,7.2vw,6.2rem)] font-extrabold leading-[0.92] tracking-[-0.045em]">
              Try the whole<br />cart on.<br /><span className="serif-i text-[1.08em] text-lime">Before you pay.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/85">
              Mirrorcart is a fitting room for online shops. Add a dress, shoes and a bag, upload one photo, and see the <em>whole outfit on you</em>, not on a model.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="#shop" className="rounded-full bg-coral px-7 py-3.5 font-semibold text-white shadow-[0_12px_30px_-10px_rgba(217,70,122,.8)] transition hover:-translate-y-0.5">Start with a dress</Link>
              <Link href="#how" className="rounded-full border border-white/30 px-6 py-3.5 transition hover:bg-white/10">How it works</Link>
            </div>
            <p className="mt-8 max-w-md border-l-2 border-lime/70 pl-4 text-sm text-white/65">
              You&apos;re shopping at <b className="font-semibold text-white">Aurel &amp; Thread</b>, a pretend boutique we built so you can try Mirrorcart for free. Nothing is for sale and nothing ships.
            </p>
          </div>
          <HeroMirror looks={LOOKS} />
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="mx-auto max-w-7xl px-5 py-20 lg:py-28">
        <h2 className="reveal max-w-3xl font-display text-[clamp(2rem,4.6vw,3.6rem)] font-extrabold leading-[0.98] tracking-[-0.04em]">
          Three steps from <span className="serif-i font-normal text-velvet">&ldquo;will it suit me?&rdquo;</span> to checkout.
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <article key={s.n} className="reveal flex flex-col rounded-[28px] bg-mist p-6 ring-1 ring-ink/5">
              <div aria-hidden className="flex h-40 items-end justify-center gap-2"><StepVisual n={s.n} /></div>
              <p className="mt-6 font-mono text-xs text-coral">{s.n}</p>
              <h3 className="mt-1 font-display text-2xl font-bold tracking-tight">{s.t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.d}</p>
            </article>
          ))}
        </div>
        <div className="reveal mt-10 flex flex-col gap-5 rounded-[28px] border border-ink/10 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-coral">Powered by YouCam AI</p>
            <p className="mt-2 max-w-md font-display text-xl font-bold leading-snug tracking-tight">Every try-on is a real call to the <span className="serif-i font-normal text-velvet">YouCam API</span> by Perfect Corp., chained one piece at a time.</p>
          </div>
          <ul className="flex flex-wrap gap-2">
            {YOUCAM.map(([t, api]) => (
              <li key={api} className="rounded-full bg-mist px-4 py-2 text-sm ring-1 ring-ink/5">{t} <code className="ml-1 font-mono text-[11px] text-muted">{api}</code></li>
            ))}
          </ul>
        </div>
      </section>

      {/* LOOKBOOK */}
      <section className="velvet-deep overflow-hidden text-white">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:py-24">
          <div className="reveal flex flex-wrap items-end justify-between gap-6">
            <h2 className="font-display text-[clamp(2rem,4.4vw,3.4rem)] font-extrabold leading-[0.98] tracking-[-0.04em]">
              The lookbook.<br /><span className="serif-i font-normal text-lime">Every cart, styled whole.</span>
            </h2>
            <p className="max-w-sm text-white/70">Each look is one cart: every piece, priced together. Add the pieces you love, then press <b className="text-white">See it on me</b> to wear the whole look on your own photo.</p>
          </div>
          <div className="mt-14 grid gap-12 sm:grid-cols-3 sm:gap-8">
            {LOOKBOOK.map((l, i) => (
              <figure key={l.name} className={`group reveal ${i === 1 ? "sm:-translate-y-6" : "sm:translate-y-4"}`}>
                <div className="relative mx-auto w-full max-w-[290px]">
                  <div className="glow-pulse pointer-events-none absolute -inset-6 rounded-full bg-[radial-gradient(closest-side,rgba(236,143,176,.28),transparent)] blur-2xl" style={{ animationDelay: `${i * .8}s` }} />
                  <FlatLay look={l} />
                </div>
                <figcaption className="mt-6 text-center">
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-lime">{l.name}</p>
                  <p className="mx-auto mt-2 max-w-[260px] text-sm leading-relaxed text-white/70">{l.pieces.map((p) => p.name).join(" · ")}</p>
                  <p className="serif-i mt-1 text-3xl">${lookTotal(l)}</p>
                </figcaption>
              </figure>
            ))}
          </div>
          <ul className="reveal mx-auto mt-16 flex max-w-4xl flex-wrap justify-center gap-3 text-sm">
            {["Dresses, jumpsuits, tops & skirts", "Shoes, bags & jewellery", "Swap colour or fabric in place", "Keeps your face, hair & head covering"].map((t) => (
              <li key={t} className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2.5 ring-1 ring-white/10"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blush" />{t}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* SHOP */}
      <section id="shop" className="mx-auto max-w-7xl px-5 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-[clamp(2rem,4.4vw,3.4rem)] font-extrabold leading-none tracking-[-0.04em]">The edit<span className="serif-i font-normal text-velvet"> · twelve pieces</span></h2>
          <p className="max-w-sm text-sm text-muted">Add a few pieces to your cart, then press <b className="text-ink">See it on me</b>. Prices are pretend.</p>
        </div>
        <ShopGrid />
      </section>

      {/* RETAILERS */}
      <section id="retailers" className="mx-auto max-w-7xl px-5 pb-8">
        <div className="grid gap-8 overflow-hidden rounded-[32px] bg-ink p-8 text-white sm:p-12 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="font-mono text-xs text-lime">For shops</p>
            <h2 className="mt-3 font-display text-[clamp(1.9rem,3.8vw,3rem)] font-extrabold leading-[1] tracking-[-0.04em]">One line of code.<br /><span className="serif-i font-normal text-lime">Fewer returns.</span></h2>
            <p className="mt-4 max-w-md text-white/70">Paste one script tag and any shop gets a &ldquo;See it on me&rdquo; button. When a shopper removes an item after seeing it on themselves, the dashboard counts it as a likely return avoided.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="/embed-demo.html" className="rounded-full bg-paper px-6 py-3 font-semibold text-ink transition hover:bg-lime">See it on another shop</a>
              <Link href="/dashboard" className="rounded-full border border-white/25 px-6 py-3 transition hover:bg-white/10">Retailer dashboard</Link>
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-4 self-center">
          <div className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/60">Dashboard · sample shop</p>
              <p className="text-[11px] text-white/40">illustrative data</p>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              {PREVIEW.map(([k, v], i) => (
                <div key={k} className={`rounded-xl p-3 ${i === 3 ? "bg-lime text-lime-ink" : "bg-black/30"}`}>
                  <dt className={`text-[11px] ${i === 3 ? "text-lime-ink/70" : "text-white/55"}`}>{k}</dt>
                  <dd className="mt-1 font-display text-2xl font-bold tracking-tight">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[11px] leading-relaxed text-white/45">{DROPPED} items removed after try-on × {RETURN_RATE}% return rate × ${RETURN_COST} per return. Each shop sets its own rate and cost.</p>
          </div>
          <pre className="no-scrollbar overflow-x-auto rounded-2xl bg-black/40 p-5 font-mono text-[12px] leading-relaxed text-white/80 ring-1 ring-white/10">
<span className="text-white/40">{"<!-- add to any product or cart page -->"}</span>{"\n"}<span className="text-lime">{"<script"}</span>{" src=\"https://mirrorcart.vercel.app/widget.js\"\n        data-store=\"your-shop\" async"}<span className="text-lime">{"></script>"}</span>{"\n\n"}<span className="text-lime">{"<button"}</span>{" data-mirrorcart-tryon\n  data-items='[{\"id\":\"wrap-dress\"}]'"}<span className="text-lime">{">"}</span>{"See it on me"}<span className="text-lime">{"</button>"}</span>
          </pre>
          </div>
        </div>
      </section>

      {/* PRIVACY */}
      <section className="mx-auto grid max-w-7xl gap-4 px-5 py-12 sm:grid-cols-3">
        {[["Asks first", "Nothing is uploaded until you tick the consent box."], ["Deleted within 24 h", "Your photo and looks are erased automatically, or right away with one tap."], ["Free to try", "Sample models are always free. Live photos have a fair daily limit."]].map(([t, d]) => (
          <div key={t} className="reveal rounded-3xl border border-ink/10 p-6">
            <h3 className="font-display text-lg font-bold">{t}</h3><p className="mt-1 text-sm text-muted">{d}</p>
          </div>
        ))}
      </section>

      {/* CLOSE */}
      <section className="velvet relative overflow-hidden text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center px-5 py-20 text-center lg:py-24">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-lime">The dinner look · ${lookTotal(LOOKS[0])}</p>
          <h2 className="mt-4 max-w-3xl font-display text-[clamp(2.2rem,5.4vw,4.4rem)] font-extrabold leading-[0.95] tracking-[-0.045em]">
            Don&apos;t guess. <span className="serif-i whitespace-nowrap font-normal text-lime">See it on you.</span>
          </h2>
          <p className="mt-5 max-w-md text-white/75">We&apos;ll put the whole dinner look in your cart. Add one photo, or pick a sample model for free.</p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <TryLook look={LOOKS[0]} className="sheen rounded-full bg-coral px-9 py-4 font-display text-lg font-bold text-white shadow-[0_14px_34px_-12px_rgba(217,70,122,.9)] transition hover:-translate-y-0.5">See it on me</TryLook>
            <Link href="#retailers" className="rounded-full border border-white/30 px-6 py-4 transition hover:bg-white/10">For shops: add Mirrorcart</Link>
          </div>
        </div>
      </section>
    </>
  );
}
