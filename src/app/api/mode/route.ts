import { json } from "@/lib/http";
import { modeStatus } from "@/lib/orchestrator";
import { getManifest } from "@/lib/demo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [status, manifest] = await Promise.all([modeStatus(), getManifest()]);
  return json({ ...status, models: manifest.models, outfits: manifest.outfits, demoGeneratedWith: manifest.generatedWith });
}
