import { NextRequest } from "next/server";
import { json } from "@/lib/http";
import { saveSelfie, modeStatus } from "@/lib/orchestrator";

export const runtime = "nodejs";
const MAX_BYTES = 4 * 1024 * 1024;

/** Accepts the client-resized JPEG (long side 1024). Requires the consent flag. */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  if (form.get("consent") !== "yes") return json({ error: "consent_required" }, 400);
  const status = await modeStatus();
  if (status.demoOnly) return json({ error: "demo_only", reason: status.reason }, 409);
  const file = form.get("photo");
  if (!(file instanceof Blob)) return json({ error: "photo_required" }, 400);
  if (file.size > MAX_BYTES) return json({ error: "photo_too_large" }, 413);
  if (!/^image\/(jpeg|jpg|png)$/.test(file.type)) return json({ error: "jpeg_or_png_only" }, 415);
  const s = await saveSelfie(Buffer.from(await file.arrayBuffer()), file.type === "image/png" ? "image/png" : "image/jpeg");
  return json({ selfieId: s.id, url: s.url, matched: !!s.matched, expiresAt: s.createdAt + 86_400_000 });
}
