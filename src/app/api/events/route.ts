import { NextRequest } from "next/server";
import { json, cors } from "@/lib/http";
import { isEventType, track } from "@/lib/events";

export const runtime = "nodejs";

export async function OPTIONS(req: NextRequest) {
  return cors(req, json({}), req.nextUrl.searchParams.get("store") || undefined);
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  if (!isEventType(b.type)) return cors(req, json({ error: "unknown_event" }, 400), b.store);
  const productIds: string[] = Array.isArray(b.items) ? b.items.map((i: { id?: unknown }) => String(i?.id ?? "")).filter(Boolean).slice(0, 12) : [];
  await track(b.type, { store: b.store, productIds });
  return cors(req, json({ ok: true }), b.store);
}
