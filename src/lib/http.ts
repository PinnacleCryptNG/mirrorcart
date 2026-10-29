import "server-only";
import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/stores";

export const json = (data: unknown, init?: number | ResponseInit) =>
  NextResponse.json(data, typeof init === "number" ? { status: init } : init);

export function originOf(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "http";
  return host ? `${proto}://${host}` : new URL(req.url).origin;
}

/** CORS for the embeddable widget: only origins listed in the store config. */
export function cors(req: NextRequest, res: NextResponse, storeId?: string) {
  const origin = req.headers.get("origin");
  if (origin && getStore(storeId).allowedOrigins.some((o) => o === "*" || o === origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Vary", "Origin");
    res.headers.set("Access-Control-Allow-Headers", "content-type");
    res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  }
  return res;
}

/** Salted hash of the client IP: enough to rate-limit a visitor without storing the IP. */
export function visitorId(req: NextRequest) {
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
  return createHash("sha256").update(`${process.env.CRON_SECRET || "mirrorcart"}:${ip}`).digest("hex").slice(0, 20);
}
