import { NextRequest } from "next/server";
import { json } from "@/lib/http";
import { config } from "@/lib/config";
import { kv } from "@/lib/kv";
import { purgeSelfie } from "@/lib/orchestrator";
import { deleteOlderThan } from "@/lib/blob";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Purge selfies, results, cache entries and YouCam tasks older than 24 h.
 * Triggered daily by Vercel Cron (authenticated) and hourly by GitHub Actions. The sweep only removes
 * data already past retention, so unauthenticated calls are allowed but throttled to once per 5 min.
 */
export async function GET(req: NextRequest) {
  const authed = !config.cronSecret || req.headers.get("authorization") === `Bearer ${config.cronSecret}`;
  if (!authed && !(await kv.setnx("retention:lock", 300))) return json({ ok: true, throttled: true });
  const cutoff = Date.now() - config.retentionHours * 3600_000;
  const ids = await kv.zrangeByScore("retention:selfies", cutoff);
  let purged = 0;
  for (const id of ids.slice(0, 200)) { await purgeSelfie(id, false); purged++; }
  const orphanBlobs = await deleteOlderThan("mc/", cutoff);
  return json({ ok: true, purgedSelfies: purged, orphanBlobsDeleted: orphanBlobs, cutoff: new Date(cutoff).toISOString() });
}
