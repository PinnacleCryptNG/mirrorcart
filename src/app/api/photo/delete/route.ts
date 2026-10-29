import { NextRequest } from "next/server";
import { json } from "@/lib/http";
import { purgeSelfie } from "@/lib/orchestrator";
import { track } from "@/lib/events";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { selfieId, store } = await req.json().catch(() => ({}));
  if (typeof selfieId !== "string" || !selfieId) return json({ error: "selfieId_required" }, 400);
  const r = await purgeSelfie(selfieId);
  if (r.deleted) await track("photo_deleted", { store });
  return json(r);
}
