import "server-only";

const bool = (v: string | undefined, d = false) => (v == null || v === "" ? d : /^(1|true|yes|on)$/i.test(v));

export const config = {
  apiBase: process.env.YOUCAM_API_BASE || "https://yce-api-01.makeupar.com",
  apiKey: process.env.YOUCAM_API_KEY || "",
  /** Mock is on by default until a key is configured. */
  mock: bool(process.env.YOUCAM_MOCK, !process.env.YOUCAM_API_KEY),
  demoMode: bool(process.env.DEMO_MODE, false),
  dailyUnitCap: Number(process.env.DAILY_UNIT_CAP || 60),
  dashboardPass: process.env.DASHBOARD_PASS || "",
  cronSecret: process.env.CRON_SECRET || "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  retentionHours: 24,
  maxChainSteps: Number(process.env.MAX_CHAIN_STEPS || 5),
};

/** Live uploads are possible when we either have a key or run the mock client. */
export function liveAvailable() {
  return config.mock || !!config.apiKey;
}

/** Demo mode is forced by env or by a missing key (when not mocking). The unit cap check lives in the orchestrator. */
export function forcedDemo() {
  return config.demoMode || !liveAvailable();
}

export function publicUrl(path: string, origin?: string) {
  if (/^https?:\/\//.test(path)) return path;
  return new URL(path, origin || config.siteUrl).toString();
}
