import { NextRequest } from "next/server";
import { json, visitorId } from "@/lib/http";
import { savedLooks } from "@/lib/orchestrator";

export const runtime = "nodejs";

/** Looks already made from this photo in the last 24 h ("Your fitting room"). */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("selfieId");
  if (!id) return json({ error: "selfieId_required" }, 400);
  const looks = await savedLooks(id, visitorId(req));
  return json({ looks: looks.map(({ items, thumb, labels, t }) => ({ items, thumb, labels, t })) });
}
