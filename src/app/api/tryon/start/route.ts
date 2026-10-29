import { NextRequest } from "next/server";
import { json } from "@/lib/http";
import { startJob, view, ChainItem } from "@/lib/orchestrator";
import { track } from "@/lib/events";
import { visitorId } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const items: ChainItem[] = Array.isArray(b.items)
    ? b.items.filter((i: ChainItem) => i && typeof i.id === "string").slice(0, 12)
        .map((i: ChainItem) => ({ id: i.id, variant: typeof i.variant === "string" ? i.variant : undefined, fabric: typeof i.fabric === "string" ? i.fabric : undefined }))
    : [];
  const gender = b.gender === "male" ? "male" : b.gender === "female" ? "female" : undefined;
  try {
    const job = await startJob({ selfieId: String(b.selfieId || ""), items, gender, store: b.store, rerun: !!b.rerun, visitor: visitorId(req) });
    if (!b.rerun) await track("tryon_started", { store: job.store });
    return json({ jobId: job.id, job: view(job) });
  } catch (e) {
    const err = e as Error & { reason?: string };
    return json({ error: err.message, reason: err.reason }, err.message === "demo_only" ? 409 : 400);
  }
}
