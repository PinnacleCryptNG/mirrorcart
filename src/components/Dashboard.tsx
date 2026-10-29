"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Wordmark } from "@/components/StoreChrome";

type Data = { counts: Record<string, number>; swapped: Record<string, number>; dropped: Record<string, number>; stats: Record<string, number>; days: Record<string, Record<string, number>> };

const SAMPLE: Data = {
  counts: { widget_open: 412, consent_given: 301, tryon_started: 288, tryon_completed: 251, item_swapped: 97, fabric_changed: 41, item_dropped_after_tryon: 63, checkout_after_tryon: 118, photo_deleted: 54 },
  swapped: { "wrap-dress": 31, "linen-shirt": 22, "wide-leg-trousers": 18, "leather-tote": 12, "white-sneakers": 9 },
  dropped: { "block-heel-loafers": 19, "pleated-midi-skirt": 14, "denim-jacket": 11 },
  stats: { units_used: 1460, cached_hits: 388, units_saved: 776, live_steps: 730, demo_steps: 210 },
  days: {},
};

const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "–");

export function Dashboard(props: { data: Data; names: Record<string, string>; cap: number; client: "mock" | "live" }) {
  const [sample, setSample] = useState(false);
  const [rate, setRate] = useState(30);
  const [cost, setCost] = useState(15);
  const [credit, setCredit] = useState<unknown>(null);
  useEffect(() => {
    const s = JSON.parse(localStorage.getItem("mc-dash-assumptions") || "{}");
    if (s.rate != null) setRate(s.rate);
    if (s.cost != null) setCost(s.cost);
    fetch("/api/admin/credit").then((r) => r.json()).then(setCredit).catch((e) => setCredit({ error: String(e) }));
  }, []);
  useEffect(() => { localStorage.setItem("mc-dash-assumptions", JSON.stringify({ rate, cost })); }, [rate, cost]);

  const d = sample ? SAMPLE : props.data;
  const c = (k: string) => d.counts[k] ?? 0;
  const hasData = Object.values(props.data.counts).some((n) => n > 0);
  const dropped = c("item_dropped_after_tryon");
  const avoided = dropped * (rate / 100) * cost;
  const topSwapped = useMemo(() => Object.entries(d.swapped).sort((a, b) => b[1] - a[1]).slice(0, 8), [d]);
  const topDropped = useMemo(() => Object.entries(d.dropped).sort((a, b) => b[1] - a[1]).slice(0, 8), [d]);

  const cards = [
    { k: "Try-ons", v: c("tryon_started"), sub: `${c("widget_open")} widget opens · ${c("consent_given")} consents` },
    { k: "Completion rate", v: pct(c("tryon_completed"), c("tryon_started")), sub: `${c("tryon_completed")} completed looks` },
    { k: "Conversion after try-on", v: pct(c("checkout_after_tryon"), c("tryon_completed")), sub: `${c("checkout_after_tryon")} checkouts after trying on` },
    { k: "Items dropped before ship", v: dropped, sub: "removed after seeing it on themselves" },
    { k: "Est. returns avoided", v: `$${avoided.toFixed(0)}`, sub: `estimate: ${dropped} × ${rate}% × $${cost}`, hi: true },
    { k: "Units used vs cached hits", v: `${d.stats.units_used ?? 0} / ${d.stats.cached_hits ?? 0}`, sub: `${d.stats.units_saved ?? 0} units saved by cache · ${props.client} client` },
  ];

  return (
    <main className="min-h-screen bg-glass text-white">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-4"><Link href="/"><Wordmark className="text-lg" /></Link><span className="font-mono text-[11px] uppercase tracking-widest text-lime">Mirrorcart · retailer dashboard</span></div>
        <div className="flex items-center gap-3 text-sm">
          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-white/20 px-3 py-1.5">
            <input type="checkbox" checked={sample} onChange={(e) => setSample(e.target.checked)} className="accent-[#e8c46c]" /> Show SAMPLE data (fake)
          </label>
          <form action="/api/dashboard/login" method="post"><button name="logout" value="1" className="text-white/60 hover:text-white">Log out</button></form>
        </div>
      </header>
      {sample && <p className="bg-amber-400 px-6 py-2 text-center font-mono text-xs font-bold uppercase tracking-widest text-ink">Sample data: these numbers are illustrative, not real events</p>}
      <div className="mx-auto max-w-7xl space-y-8 p-6">
        {!sample && !hasData && <div className="rounded-2xl border border-dashed border-white/20 p-6 text-center text-white/70">No data yet. Open the store, run a try-on, and the counts here update from real events.</div>}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((x) => (
            <div key={x.k} className={`rounded-2xl border p-5 ${x.hi ? "border-lime/50 bg-lime/10" : "border-white/10 bg-white/[0.03]"}`}>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">{x.k}</p>
              <p className={`mt-2 font-display text-4xl font-bold ${x.hi ? "text-lime" : ""}`}>{x.v}</p>
              <p className="mt-1 text-xs text-white/50">{x.sub}</p>
            </div>
          ))}
        </section>
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 p-5">
            <h2 className="font-display text-xl font-bold">Estimate assumptions</h2>
            <p className="mt-1 text-xs text-white/50">Editable. “Returns avoided” is an <b>estimate</b>: items dropped after try-on × assumed return rate × average cost per return.</p>
            <label className="mt-4 block text-sm">Assumed return rate for those items (%)
              <input type="number" min={0} max={100} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2" /></label>
            <label className="mt-3 block text-sm">Average cost per return (USD)
              <input type="number" min={0} value={cost} onChange={(e) => setCost(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2" /></label>
            <p className="mt-3 text-[11px] text-white/40">Defaults (30%, $15) are placeholders, not measured values.</p>
          </div>
          <div className="rounded-2xl border border-white/10 p-5">
            <h2 className="font-display text-xl font-bold">Top swapped products</h2>
            {topSwapped.length ? <table className="mt-3 w-full text-sm"><tbody>{topSwapped.map(([id, n]) => <tr key={id} className="border-t border-white/10"><td className="py-1.5">{props.names[id] ?? id}</td><td className="text-right font-mono">{n}</td></tr>)}</tbody></table> : <p className="mt-3 text-sm text-white/50">No data yet</p>}
            <h3 className="mt-5 font-display font-bold">Dropped after try-on</h3>
            {topDropped.length ? <table className="mt-2 w-full text-sm"><tbody>{topDropped.map(([id, n]) => <tr key={id} className="border-t border-white/10"><td className="py-1.5">{props.names[id] ?? id}</td><td className="text-right font-mono">{n}</td></tr>)}</tbody></table> : <p className="mt-2 text-sm text-white/50">No data yet</p>}
          </div>
          <div className="rounded-2xl border border-white/10 p-5">
            <h2 className="font-display text-xl font-bold">Event counts</h2>
            <table className="mt-3 w-full text-sm"><tbody>
              {["widget_open", "consent_given", "tryon_started", "tryon_completed", "item_swapped", "fabric_changed", "item_dropped_after_tryon", "checkout_after_tryon", "photo_deleted"].map((k) => (
                <tr key={k} className="border-t border-white/10"><td className="py-1.5 font-mono text-xs">{k}</td><td className="text-right font-mono">{c(k)}</td></tr>
              ))}
            </tbody></table>
          </div>
        </section>
        <section className="rounded-2xl border border-white/10 p-5">
          <h2 className="font-display text-xl font-bold">YouCam credit (cost meter)</h2>
          <p className="mt-1 text-xs text-white/50">Live from <code>GET /s2s/v1.0/client/credit</code> and <code>GET /s2s/v2.0/credit/feature-cost</code> (shown raw). Daily cap: {props.cap} units.</p>
          <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-black/40 p-4 text-xs text-white/80">{credit ? JSON.stringify(credit, null, 2) : "Loading…"}</pre>
        </section>
      </div>
    </main>
  );
}
