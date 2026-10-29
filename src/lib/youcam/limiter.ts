import "server-only";
import { kv } from "@/lib/kv";

/** Shared token bucket: 200 requests / 300 s (YouCam allows 250 / 300 s per IP and token). */
const CAPACITY = 200;
const WINDOW_MS = 300_000;

export async function acquire(maxWaitMs = 8_000) {
  const deadline = Date.now() + maxWaitMs;
  for (;;) {
    const wait = await kv.takeToken("ratelimit:youcam", CAPACITY, WINDOW_MS);
    if (wait === 0) return;
    if (Date.now() + wait > deadline) throw new Error("rate_limited_locally");
    await new Promise((r) => setTimeout(r, wait));
  }
}
