import "server-only";
import { promises as fs } from "fs";
import path from "path";

export type DemoModel = { id: string; name: string; image: string; gender: "female" | "male"; credit: string };
export type DemoOutfit = { id: string; title: string; items: { id: string; variant: string; fabric?: string }[] };
export type DemoManifest = {
  version: number;
  note: string;
  generatedWith: "mock" | "youcam" | "none";
  models: DemoModel[];
  outfits: DemoOutfit[];
  /** key = `${modelId}|${stepSig1}>${stepSig2}>...` → image path under /demo/looks */
  looks: Record<string, string>;
};

let cached: DemoManifest | null = null;

export async function getManifest(): Promise<DemoManifest> {
  if (cached && process.env.NODE_ENV === "production") return cached;
  const raw = await fs.readFile(path.join(process.cwd(), "public", "demo", "manifest.json"), "utf8");
  cached = JSON.parse(raw) as DemoManifest;
  return cached;
}

export const demoKey = (modelId: string, sigs: string[]) => `${modelId}|${sigs.join(">")}`;
