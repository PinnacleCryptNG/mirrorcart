import { EmbedClient } from "@/components/mirrorcart/EmbedClient";

export const metadata = { title: "Mirrorcart" };

export default async function Embed({ searchParams }: { searchParams: Promise<{ store?: string; items?: string; origin?: string }> }) {
  const sp = await searchParams;
  let items: { id: string; variant?: string }[] = [];
  try { items = JSON.parse(sp.items || "[]"); } catch { items = []; }
  return <EmbedClient store={sp.store || "aurel-demo"} items={Array.isArray(items) ? items.slice(0, 12) : []} hostOrigin={sp.origin || "*"} />;
}
