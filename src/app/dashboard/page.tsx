import Link from "next/link";
import { isDashAuthed } from "@/lib/auth";
import { config } from "@/lib/config";
import { readEvents } from "@/lib/events";
import { PRODUCTS } from "@/lib/catalog";
import { Dashboard } from "@/components/Dashboard";
import { Wordmark } from "@/components/StoreChrome";

export const dynamic = "force-dynamic";
export const metadata = { title: "Retailer dashboard" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (!(await isDashAuthed()))
    return (
      <main className="grid min-h-screen place-items-center bg-glass p-6 text-white">
        <form action="/api/dashboard/login" method="post" className="w-full max-w-sm space-y-4">
          <Link href="/" className="text-white/60"><Wordmark className="text-lg" /></Link>
          <h1 className="font-display text-4xl font-bold">Retailer dashboard</h1>
          {!config.dashboardPass && <p className="rounded-lg bg-white/10 p-3 text-sm">DASHBOARD_PASS is not set on this deployment, so the dashboard is locked.</p>}
          <input name="pass" type="password" placeholder="Dashboard password" autoFocus className="w-full rounded-full border border-white/20 bg-white/5 px-5 py-3 outline-none focus:border-lime" />
          {error && <p className="text-sm text-red-300">Wrong password.</p>}
          <button className="w-full rounded-full bg-lime px-5 py-3 font-medium text-lime-ink">Enter</button>
          <p className="text-xs text-white/50">Judges: the password is in the Devpost testing instructions.</p>
        </form>
      </main>
    );
  const data = await readEvents("aurel-demo");
  const names = Object.fromEntries(PRODUCTS.map((p) => [p.id, p.name]));
  return <Dashboard data={data} names={names} cap={config.dailyUnitCap} client={config.mock ? "mock" : "live"} />;
}
