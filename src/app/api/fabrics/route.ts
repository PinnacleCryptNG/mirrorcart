import { json } from "@/lib/http";
import { kv } from "@/lib/kv";
import { getClient, FabricTemplate } from "@/lib/youcam";
import { config } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Fabric templates from GET /s2s/v2.0/task/template/fabric, cached for 6 h to save requests. */
export async function GET() {
  const key = `fabrics:${config.mock ? "mock" : "live"}`;
  let templates = await kv.get<FabricTemplate[]>(key);
  if (!templates) {
    try {
      const r = await getClient().listFabricTemplates(20);
      templates = (r.data?.templates ?? []).map((t) => ({ id: t.id, thumb: t.thumb, title: t.title, category_name: t.category_name }));
      await kv.set(key, templates, 6 * 3600);
    } catch (e) {
      return json({ templates: [], error: (e as Error).message }, 502);
    }
  }
  return json({ templates });
}
