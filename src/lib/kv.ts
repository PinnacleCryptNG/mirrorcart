import "server-only";
import { Redis } from "@upstash/redis";

/**
 * Minimal KV used for jobs, cache index, events and counters.
 * Upstash Redis in production (Vercel KV env names or Upstash names), in-memory locally.
 * All keys are namespaced with "mc:".
 */
const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

type Entry = { v: unknown; exp?: number };
const g = globalThis as unknown as { __mcMem?: Map<string, Entry> };
const mem = (g.__mcMem ??= new Map());
const P = "mc:";

function memGet(k: string): Entry | undefined {
  const e = mem.get(k);
  if (e?.exp && e.exp < Date.now()) { mem.delete(k); return undefined; }
  return e;
}

export const kv = {
  backend: redis ? "upstash" : "memory",

  async get<T>(key: string): Promise<T | null> {
    if (redis) return (await redis.get<T>(P + key)) ?? null;
    return (memGet(P + key)?.v as T) ?? null;
  },

  async set(key: string, value: unknown, ttlSeconds?: number) {
    if (redis) { await (ttlSeconds ? redis.set(P + key, value, { ex: ttlSeconds }) : redis.set(P + key, value)); return; }
    mem.set(P + key, { v: structuredClone(value), exp: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined });
  },

  /** SET NX with TTL; true when the key was created (used as a short lock). */
  async setnx(key: string, ttlSeconds: number): Promise<boolean> {
    if (redis) return (await redis.set(P + key, 1, { nx: true, ex: ttlSeconds })) === "OK";
    if (memGet(P + key)) return false;
    mem.set(P + key, { v: 1, exp: Date.now() + ttlSeconds * 1000 });
    return true;
  },

  async del(...keys: string[]) {
    if (!keys.length) return;
    if (redis) { await redis.del(...keys.map((k) => P + k)); return; }
    keys.forEach((k) => mem.delete(P + k));
  },

  async incrby(key: string, by: number, ttlSeconds?: number): Promise<number> {
    if (redis) {
      const n = await redis.incrby(P + key, by);
      if (ttlSeconds && n === by) await redis.expire(P + key, ttlSeconds);
      return n;
    }
    const e = memGet(P + key);
    const n = Number(e?.v ?? 0) + by;
    mem.set(P + key, { v: n, exp: e?.exp ?? (ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined) });
    return n;
  },

  async hincrby(key: string, field: string, by = 1) {
    if (redis) return redis.hincrby(P + key, field, by);
    const e = memGet(P + key);
    const h = (e?.v as Record<string, number>) ?? {};
    h[field] = (h[field] ?? 0) + by;
    mem.set(P + key, { v: h });
    return h[field];
  },

  async hgetall(key: string): Promise<Record<string, number>> {
    if (redis) {
      const r = await redis.hgetall<Record<string, number>>(P + key);
      return Object.fromEntries(Object.entries(r ?? {}).map(([k, v]) => [k, Number(v)]));
    }
    return { ...((memGet(P + key)?.v as Record<string, number>) ?? {}) };
  },

  /** Sorted-set index (score = epoch ms) used by the retention cron. */
  async zadd(key: string, score: number, member: string) {
    if (redis) { await redis.zadd(P + key, { score, member }); return; }
    const e = memGet(P + key);
    const z = (e?.v as Record<string, number>) ?? {};
    z[member] = score;
    mem.set(P + key, { v: z });
  },

  async zrangeByScore(key: string, max: number): Promise<string[]> {
    if (redis) return redis.zrange<string[]>(P + key, 0, max, { byScore: true });
    const z = (memGet(P + key)?.v as Record<string, number>) ?? {};
    return Object.entries(z).filter(([, s]) => s <= max).map(([m]) => m);
  },

  async zrem(key: string, ...members: string[]) {
    if (!members.length) return;
    if (redis) { await redis.zrem(P + key, ...members); return; }
    const z = (memGet(P + key)?.v as Record<string, number>) ?? {};
    members.forEach((m) => delete z[m]);
    mem.set(P + key, { v: z });
  },

  async sadd(key: string, ...members: string[]) {
    if (!members.length) return;
    if (redis) { await redis.sadd(P + key, members[0], ...members.slice(1)); return; }
    const s = new Set((memGet(P + key)?.v as string[]) ?? []);
    members.forEach((m) => s.add(m));
    mem.set(P + key, { v: [...s] });
  },

  async smembers(key: string): Promise<string[]> {
    if (redis) return redis.smembers(P + key);
    return (memGet(P + key)?.v as string[]) ?? [];
  },

  /**
   * Atomic token bucket. Returns ms to wait (0 = token granted).
   * capacity tokens refill linearly over windowMs.
   */
  async takeToken(key: string, capacity: number, windowMs: number): Promise<number> {
    const now = Date.now();
    const rate = capacity / windowMs;
    if (redis) {
      const script = `
local k=KEYS[1]; local cap=tonumber(ARGV[1]); local rate=tonumber(ARGV[2]); local now=tonumber(ARGV[3])
local d=redis.call('HMGET',k,'t','ts'); local t=tonumber(d[1]) or cap; local ts=tonumber(d[2]) or now
t=math.min(cap,t+(now-ts)*rate)
if t>=1 then redis.call('HSET',k,'t',t-1,'ts',now); redis.call('PEXPIRE',k,600000); return 0 end
redis.call('HSET',k,'t',t,'ts',now); redis.call('PEXPIRE',k,600000); return math.ceil((1-t)/rate)`;
      return Number(await redis.eval(script, [P + key], [capacity, rate, now]));
    }
    const e = memGet(P + key);
    const st = (e?.v as { t: number; ts: number }) ?? { t: capacity, ts: now };
    const t = Math.min(capacity, st.t + (now - st.ts) * rate);
    if (t >= 1) { mem.set(P + key, { v: { t: t - 1, ts: now } }); return 0; }
    mem.set(P + key, { v: { t, ts: now } });
    return Math.ceil((1 - t) / rate);
  },
};
