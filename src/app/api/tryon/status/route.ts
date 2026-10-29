import { NextRequest } from "next/server";
import { json } from "@/lib/http";
import { getJob, view } from "@/lib/orchestrator";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("jobId");
  const job = id ? await getJob(id) : null;
  if (!job) return json({ error: "job_not_found" }, 404);
  return json({ job: view(job) });
}
