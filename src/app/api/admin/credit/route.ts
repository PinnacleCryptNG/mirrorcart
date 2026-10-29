import { json } from "@/lib/http";
import { isDashAuthed } from "@/lib/auth";
import { getClient } from "@/lib/youcam";
import { kv } from "@/lib/kv";
import { config } from "@/lib/config";
import { unitsUsedToday } from "@/lib/orchestrator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /s2s/v1.0/client/credit + GET /s2s/v2.0/credit/feature-cost (shown raw), dashboard-only. */
export async function GET() {
  if (!(await isDashAuthed())) return json({ error: "unauthorized" }, 401);
  const c = getClient();
  const [credit, featureCost] = await Promise.all([
    c.getCredit().catch((e: Error) => ({ error: e.message })),
    c.getFeatureCost().catch((e: Error) => ({ error: e.message })),
  ]);
  return json({
    client: c.kind,
    credit,
    featureCost,
    stats: await kv.hgetall("stats"),
    unitsUsedToday: await unitsUsedToday(),
    dailyUnitCap: config.dailyUnitCap,
  });
}
