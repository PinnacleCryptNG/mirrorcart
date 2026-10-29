import "server-only";
import { config } from "@/lib/config";
import { acquire } from "./limiter";
import { Feature, FileUploadResponse, FabricTemplateResponse, TaskCreateResponse, TaskPollResponse, YouCamClient, YouCamError } from "./types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    await acquire();
    const res = await fetch(config.apiBase + path, {
      method,
      headers: { Authorization: `Bearer ${config.apiKey}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    if (res.status === 429 && attempt < 3) {
      const retryAfter = Number(res.headers.get("retry-after"));
      await sleep(retryAfter > 0 ? retryAfter * 1000 : 1000 * 2 ** attempt + Math.random() * 300);
      continue;
    }
    const text = await res.text();
    let json: unknown;
    try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
    if (!res.ok) {
      const j = json as { error_code?: string; error?: string; message?: string };
      throw new YouCamError(res.status, j.error_code, j.error || j.message || `YouCam ${res.status}`, json);
    }
    return json as T;
  }
}

export const liveClient: YouCamClient = {
  kind: "live",

  async uploadFile(data, contentType, fileName) {
    const r = await call<FileUploadResponse>("POST", "/s2s/v2.0/file", {
      files: [{ content_type: contentType, file_name: fileName, file_size: data.length }],
    });
    const f = r.data.files[0];
    const req = f.requests[0];
    const put = await fetch(req.url, { method: req.method || "PUT", headers: req.headers, body: new Uint8Array(data) });
    if (!put.ok) throw new YouCamError(put.status, "UploadFailed", `File PUT failed: ${put.status}`);
    return f.file_id;
  },

  createTask: (feature: Feature, body) => call<TaskCreateResponse>("POST", `/s2s/v2.0/task/${feature}`, body),
  pollTask: (feature: Feature, id: string) => call<TaskPollResponse>("GET", `/s2s/v2.0/task/${feature}/${encodeURIComponent(id)}`),
  async deleteTask(id) { await call("POST", "/s2s/v2.0/task/delete", { task_id: id }); },
  listFabricTemplates(pageSize = 20, token) {
    const q = new URLSearchParams({ page_size: String(pageSize), ...(token ? { starting_token: token } : {}) });
    return call<FabricTemplateResponse>("GET", `/s2s/v2.0/task/template/fabric?${q}`);
  },
  getCredit: () => call("GET", "/s2s/v1.0/client/credit"),
  getFeatureCost: () => call("GET", "/s2s/v2.0/credit/feature-cost"),
};
