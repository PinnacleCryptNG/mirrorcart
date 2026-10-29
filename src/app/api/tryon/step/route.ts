import { NextRequest } from "next/server";
import { json, originOf } from "@/lib/http";
import { advance, view } from "@/lib/orchestrator";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const { jobId } = await req.json().catch(() => ({}));
  if (typeof jobId !== "string") return json({ error: "jobId_required" }, 400);
  try {
    return json({ job: view(await advance(jobId, originOf(req))) });
  } catch (e) {
    return json({ error: (e as Error).message }, 404);
  }
}
