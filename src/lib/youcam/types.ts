export type Feature = "cloth-v4" | "shoes-transfer" | "bag" | "fabric" | "2d-vto/necklace" | "2d-vto/earring";

export type TaskCreateResponse = { status: number; data: { task_id: string } };
export type TaskStatus = "running" | "success" | "error";
export type TaskPollResponse = {
  status: number;
  data: { task_status: TaskStatus; results?: { url: string }; error?: string | null; error_message?: string };
};
export type FileUploadResponse = {
  status: number;
  data: { files: { file_id: string; content_type: string; file_name: string; requests: { method: string; url: string; headers: Record<string, string> }[] }[] };
};
export type FabricTemplate = { id: string; thumb: string; title?: string; category_name?: string };
export type FabricTemplateResponse = { status: number; data: { templates: FabricTemplate[]; next_token?: string } };
export type CreditResponse = { status: number; results: { id: string; type: string; amount?: number; amount_dec?: string | number; expiry?: number }[] };

export class YouCamError extends Error {
  constructor(public status: number, public code: string | undefined, message: string, public body?: unknown) {
    super(message);
  }
}

export interface YouCamClient {
  readonly kind: "live" | "mock";
  uploadFile(data: Buffer, contentType: string, fileName: string): Promise<string>;
  createTask(feature: Feature, body: Record<string, unknown>): Promise<TaskCreateResponse>;
  pollTask(feature: Feature, taskId: string): Promise<TaskPollResponse>;
  deleteTask(taskId: string): Promise<void>;
  listFabricTemplates(pageSize?: number, startingToken?: string): Promise<FabricTemplateResponse>;
  getCredit(): Promise<unknown>;
  getFeatureCost(): Promise<unknown>;
}

/** Units charged on success (Unit System docs; cloth-v4 cost not listed in docs, assumed equal to V2/V3). */
export const UNIT_COST: Record<Feature, number> = {
  "cloth-v4": 2,
  "shoes-transfer": 2,
  bag: 2,
  fabric: 2,
  "2d-vto/necklace": 1,
  "2d-vto/earring": 1,
};
