import Image from "next/image";
import Link from "next/link";
import manifest from "../../../public/demo/manifest.json";
import { HeroMirror, HeroLook } from "@/components/home/HeroMirror";
import { BeforeAfter } from "@/components/home/BeforeAfter";
import { ShopGrid } from "@/components/home/ShopGrid";

const looks = (manifest as { looks: Record<string, string> }).looks;
const HERO: HeroLook[] = [
  { name: "Zola · dinner look", frames: [
    { src: "/hero/zola.jpg", label: "Photo" },
    { src: "/hero/zola-dinner-0.jpg", label: "+ Wrap dress", thumb: "/products/wrap-dress-terracotta.jpg", detail: "Terracotta · $112" },
    { src: "/hero/zola-dinner-1.jpg", label: "+ Loafers", thumb: "/products/block-heel-loafers-black.jpg", detail: "Black · $118" },
    { src: "/hero/zola-dinner-2.jpg", label: "+ Pendant", thumb: "/products/gold-pendant-pendant.jpg", detail: "Gold · $58" },
  ] },
  { name: "Zola · studio look", frames: [
    { src: "/hero/zola.jpg", label: "Photo" },
    { src: "/hero/zola-studio-0.jpg", label: "+ Knit top", thumb: "/products/ribbed-knit-top-black.jpg", detail: "Black · $42" },
    { src: "/hero/zola-studio-1.jpg", label: "+ Midi skirt", thumb: "/products/pleated-midi-skirt-sage.jpg", detail: "Sage · $74" },
    { src: "/hero/zola-studio-2.jpg", label: "+ Loafers", thumb: "/products/block-heel-loafers-tan.jpg", detail: "Tan · $118" },
  ] },
];

const STEPS = [
  { n: "01", t: "Fill your cart", d: "Pick a dress or a top and skirt, then shoes, a bag and jewellery. Mix colours and fabrics like you would in a store.", img: ["/products/wrap-dress-sage.jpg", "/products/block-heel-loafers-tan.jpg", "/products/mini-crossbody-cream.jpg"] },
  { n: "02", t: "Add one photo", d: "A full-length, front-facing photo works best. We frame it around you automatically, or you can use one of our sample models.", img: ["/demo/models/amara.jpg"] },
  { n: "03", t: "See it all on you", d: "Each piece is put on in order, so you see one complete outfit. Swap a colour or fabric, remove what doesn't work, then check out.", img: [HERO[0].frames[3].src] },
];

export default function Home() {
  const after = looks["mei|cloth-v4:ribbed-knit-top:black>cloth-v4:pleated-midi-skirt:sage>shoes-transfer:block-heel-loafers:tan"];
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
              <Link href="#shop" className="rounded-full bg-coral px-7 py-3.5 font-semibold text-white shadow-[0_12px_30px_-10px_rgba(255,107,74,.8)] transition hover:-translate-y-0.5">Start with a dress</Link>
              <Link href="#how" className="rounded-full border border-white/30 px-6 py-3.5 transition hover:bg-white/10">How it works</Link>
            </div>
            <p className="mt-8 max-w-md border-l-2 border-lime/70 pl-4 text-sm text-white/65">
              You&apos;re shopping at <b className="font-semibold text-white">Aurel &amp; Thread</b>, a pretend boutique we built so you can try Mirrorcart for free. Nothing is for sale and nothing ships.
            </p>
          </div>
          <HeroMirror looks={HERO} />
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
              <div className="flex h-40 items-end justify-center gap-2">
                {s.img.map((src, i) => (
                  <div key={src} className={`arch-sm relative overflow-hidden bg-paper ring-1 ring-ink/10 ${s.img.length > 1 ? "h-28 w-20" : "h-40 w-28"}`} style={{ transform: s.img.length > 1 ? `rotate(${(i - 1) * 7}deg) translateY(${i === 1 ? -8 : 0}px)` : undefined }}>
                    <Image src={src} alt="" fill sizes="120px" className={s.img.length > 1 ? "object-contain p-1.5" : "object-cover"} />
                  </div>
                ))}
              </div>
              <p className="mt-6 font-mono text-xs text-coral">{s.n}</p>
              <h3 className="mt-1 font-display text-2xl font-bold tracking-tight">{s.t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.d}</p>
            </article>
          ))}
        </div>
      </section>

      {/* BEFORE / AFTER */}
      <section className="velvet-deep text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 lg:grid-cols-[1fr_1.1fr] lg:py-24">
          <div className="mx-auto w-full max-w-[380px]"><BeforeAfter before="/demo/models/mei.jpg" after={after} alt="Mei" /></div>
          <div className="reveal">
            <h2 className="font-display text-[clamp(2rem,4.4vw,3.4rem)] font-extrabold leading-[0.98] tracking-[-0.04em]">
              Same photo.<br /><span className="serif-i font-normal text-lime">Her whole cart.</span>
            </h2>
            <p className="mt-5 max-w-md text-white/75">Drag the line. On the left is Mei&apos;s photo; on the right she&apos;s wearing a knit top, pleated midi skirt and loafers, put on one after another by the YouCam API.</p>
            <ul className="mt-8 grid max-w-md gap-3 text-sm sm:grid-cols-2">
              {["Dresses, jumpsuits, tops & skirts", "Shoes, bags & jewellery", "Swap colour or fabric in place", "Keeps her face, hair & head covering"].map((t) => (
                <li key={t} className="flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-coral" />{t}</li>
              ))}
            </ul>
          </div>
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
            <p className="mt-4 max-w-md text-white/70">Paste one script tag and any shop gets a &ldquo;See it on me&rdquo; button. When a shopper removes an item after seeing it on herself, the dashboard counts it as a likely return avoided.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="/embed-demo.html" className="rounded-full bg-paper px-6 py-3 font-semibold text-ink transition hover:bg-lime">See it on another shop</a>
              <Link href="/dashboard" className="rounded-full border border-white/25 px-6 py-3 transition hover:bg-white/10">Retailer dashboard</Link>
            </div>
          </div>
          <pre className="no-scrollbar self-center overflow-x-auto rounded-2xl bg-black/40 p-5 font-mono text-[12px] leading-relaxed text-white/80 ring-1 ring-white/10">
<span className="text-white/40">{"<!-- add to any product or cart page -->"}</span>{"\n"}<span className="text-lime">{"<script"}</span>{" src=\"https://mirrorcart.vercel.app/widget.js\"\n        data-store=\"your-shop\" async"}<span className="text-lime">{"></script>"}</span>{"\n\n"}<span className="text-lime">{"<button"}</span>{" data-mirrorcart-tryon\n  data-items='[{\"id\":\"wrap-dress\"}]'"}<span className="text-lime">{">"}</span>{"See it on me"}<span className="text-lime">{"</button>"}</span>
          </pre>
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
    </>
  );
}
