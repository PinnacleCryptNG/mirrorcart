import "server-only";
import { config } from "@/lib/config";
import { liveClient } from "./live";
import { mockClient } from "./mock";
import type { YouCamClient } from "./types";

export function getClient(): YouCamClient {
  return config.mock ? mockClient : liveClient;
}

export * from "./types";
