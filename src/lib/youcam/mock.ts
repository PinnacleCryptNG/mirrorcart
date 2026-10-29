import "server-only";
import { createHash, randomUUID } from "crypto";
import sharp from "sharp";
import { kv } from "@/lib/kv";
import { putImage, readImage } from "@/lib/blob";
import { config } from "@/lib/config";
import { Feature, FabricTemplate, YouCamClient } from "./types";

/**
 * Fake YouCam client (YOUCAM_MOCK=true). Returns the documented response shapes:
 *   create → {status:200, data:{task_id}}
 *   poll   → {status:200, data:{task_status:"running"}} for ~2 s, then
 *            {status:200, data:{task_status:"success", results:{url}}}
 * The "result" is a placeholder: the input photo with the reference item pinned on top and a MOCK label.
 */
const DELAY_MS = 2000;

type MockTask = { feature: Feature; body: Record<string, unknown>; created: number; url?: string };

export const MOCK_FABRICS: FabricTemplate[] = [
  { id: "mock_fabric_houndstooth", thumb: "/fabrics/houndstooth.svg", title: "Houndstooth", category_name: "Mock" },
  { id: "mock_fabric_gingham", thumb: "/fabrics/gingham.svg", title: "Gingham", category_name: "Mock" },
  { id: "mock_fabric_floral", thumb: "/fabrics/floral.svg", title: "Ditsy floral", category_name: "Mock" },
  { id: "mock_fabric_stripe", thumb: "/fabrics/stripe.svg", title: "Breton stripe", category_name: "Mock" },
  { id: "mock_fabric_polka", thumb: "/fabrics/polka.svg", title: "Polka dot", category_name: "Mock" },
];

const LABEL: Record<Feature, string> = {
  "cloth-v4": "CLOTH-V4", "shoes-transfer": "SHOES", bag: "BAG", fabric: "FABRIC", "2d-vto/necklace": "NECKLACE", "2d-vto/earring": "EARRING",
};

function refOf(body: Record<string, unknown>): string | undefined {
  if (typeof body.ref_file_url === "string") return body.ref_file_url;
  if (Array.isArray(body.ref_file_urls)) return body.ref_file_urls[0] as string;
  if (typeof body.template_id === "string") return MOCK_FABRICS.find((f) => f.id === body.template_id)?.thumb;
}

async function render(task: MockTask, id: string): Promise<string> {
  const src = task.body.src_file_url as string;
  const base = sharp(await readImage(src, config.siteUrl)).resize({ width: 768, height: 1024, fit: "cover" });
  const layers: NonNullable<Parameters<ReturnType<typeof sharp>["composite"]>[0]> = [];
  const ref = refOf(task.body);
  const hue = parseInt(createHash("md5").update(ref ?? id).digest("hex").slice(0, 2), 16) * 1.4;
  layers.push({ input: Buffer.from(`<svg width="768" height="1024"><rect width="768" height="1024" fill="hsl(${hue},70%,55%)" opacity="0.10"/></svg>`), top: 0, left: 0 });
  if (ref) {
    try {
      const thumb = await sharp(await readImage(ref, config.siteUrl)).resize(220, 260, { fit: "contain", background: "#ffffff" }).flatten({ background: "#ffffff" }).extend({ top: 6, bottom: 6, left: 6, right: 6, background: "#101014" }).png().toBuffer();
      const steps = (task.body.__mockIndex as number) ?? 0;
      layers.push({ input: thumb, top: 20 + (steps % 3) * 280, left: 768 - 252 });
    } catch { /* ignore unreadable ref */ }
  }
  const tag = `${LABEL[task.feature]}${task.body.garment_category ? " · " + task.body.garment_category : ""}`;
  layers.push({
    input: Buffer.from(`<svg width="768" height="64"><rect width="768" height="64" fill="#101014"/><text x="20" y="41" font-family="monospace" font-size="24" fill="#c6f432">MOCK RESULT · ${tag}</text></svg>`),
    top: 1024 - 64, left: 0,
  });
  const out = await base.composite(layers).jpeg({ quality: 85 }).toBuffer();
  return putImage(`mc/mock/${id}.jpg`, out);
}

export const mockClient: YouCamClient = {
  kind: "mock",

  async uploadFile() {
    await new Promise((r) => setTimeout(r, 150));
    return `mock_file_${randomUUID()}`;
  },

  async createTask(feature, body) {
    const task_id = `mock_${feature.replace(/\W/g, "_")}_${randomUUID()}`;
    await kv.set(`mocktask:${task_id}`, { feature, body, created: Date.now() } satisfies MockTask, 86_400);
    return { status: 200, data: { task_id } };
  },

  async pollTask(_feature, id) {
    const t = await kv.get<MockTask>(`mocktask:${id}`);
    if (!t) return { status: 200, data: { task_status: "error", error: "task_not_found" } };
    if (Date.now() - t.created < DELAY_MS) return { status: 200, data: { task_status: "running" } };
    if (!t.url) {
      t.url = await render(t, id);
      await kv.set(`mocktask:${id}`, t, 86_400);
    }
    return { status: 200, data: { task_status: "success", results: { url: t.url } } };
  },

  async deleteTask(id) { await kv.del(`mocktask:${id}`); },

  async listFabricTemplates() {
    return { status: 200, data: { templates: MOCK_FABRICS } };
  },

  async getCredit() {
    return { status: 200, mock: true, results: [{ id: "mock", type: "Subscription", amount_dec: 1000, expiry: Date.parse("2026-12-31") }] };
  },

  async getFeatureCost() {
    return { status: 200, mock: true, note: "Mock mode: feature-cost is only available with a real key." };
  },
};
