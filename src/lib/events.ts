import "server-only";
import { kv } from "@/lib/kv";

export const EVENT_TYPES = [
  "widget_open", "consent_given", "tryon_started", "tryon_completed", "item_swapped",
  "fabric_changed", "item_dropped_after_tryon", "checkout_after_tryon", "photo_deleted",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export function isEventType(t: unknown): t is EventType {
  return typeof t === "string" && (EVENT_TYPES as readonly string[]).includes(t);
}

const day = () => new Date().toISOString().slice(0, 10);

/** Events hold product ids and counts only, never images or personal data. */
export async function track(type: EventType, opts: { store?: string; productIds?: string[] } = {}) {
  const store = (opts.store || "aurel-demo").replace(/[^a-z0-9-]/gi, "").slice(0, 40);
  const ops: Promise<unknown>[] = [
    kv.hincrby(`events:${store}:counts`, type),
    kv.hincrby(`events:${store}:day:${day()}`, type),
  ];
  if (type === "item_swapped" || type === "fabric_changed")
    for (const id of opts.productIds ?? []) ops.push(kv.hincrby(`events:${store}:swapped`, id.slice(0, 60)));
  if (type === "item_dropped_after_tryon")
    for (const id of opts.productIds ?? []) ops.push(kv.hincrby(`events:${store}:dropped`, id.slice(0, 60)));
  await Promise.all(ops);
}

export async function readEvents(store = "aurel-demo") {
  const [counts, swapped, dropped, stats] = await Promise.all([
    kv.hgetall(`events:${store}:counts`),
    kv.hgetall(`events:${store}:swapped`),
    kv.hgetall(`events:${store}:dropped`),
    kv.hgetall("stats"),
  ]);
  const days: Record<string, Record<string, number>> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    days[d] = await kv.hgetall(`events:${store}:day:${d}`);
  }
  return { counts, swapped, dropped, stats, days };
}
