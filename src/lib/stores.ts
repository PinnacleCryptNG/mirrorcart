export type StoreConfig = { id: string; name: string; allowedOrigins: string[] };

/** Store configs for the embeddable widget. allowedOrigins controls who may frame /embed and call /api/events. */
export const STORES: Record<string, StoreConfig> = {
  "aurel-demo": {
    id: "aurel-demo",
    name: "Aurel & Thread",
    allowedOrigins: (process.env.EMBED_ALLOWED_ORIGINS || "*").split(",").map((s) => s.trim()).filter(Boolean),
  },
};

export function getStore(id?: string | null): StoreConfig {
  return STORES[id || "aurel-demo"] ?? STORES["aurel-demo"];
}
