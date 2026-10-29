import { NextRequest } from "next/server";
import { json } from "@/lib/http";
import { config } from "@/lib/config";
import { kv } from "@/lib/kv";
import { purgeSelfie } from "@/lib/orchestrator";
import { deleteOlderThan } from "@/lib/blob";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Hourly (vercel.json): purge selfies, results, cache entries and YouCam tasks older than 24 h. */
export async function GET(req: NextRequest) {
  if (config.cronSecret && req.headers.get("authorization") !== `Bearer ${config.cronSecret}`)
    return json({ error: "unauthorized" }, 401);
  const cutoff = Date.now() - config.retentionHours * 3600_000;
  const ids = await kv.zrangeByScore("retention:selfies", cutoff);
  let purged = 0;
  for (const id of ids.slice(0, 200)) { await purgeSelfie(id); purged++; }
  const orphanBlobs = await deleteOlderThan("mc/", cutoff);
  return json({ ok: true, purgedSelfies: purged, orphanBlobsDeleted: orphanBlobs, cutoff: new Date(cutoff).toISOString() });
}
