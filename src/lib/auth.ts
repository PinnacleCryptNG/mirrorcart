import "server-only";
import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { config } from "@/lib/config";

export const DASH_COOKIE = "mc_dash";
export const dashToken = () => createHash("sha256").update(`mirrorcart:${config.dashboardPass}`).digest("hex");

export function checkPass(pass: string) {
  if (!config.dashboardPass) return false;
  const a = Buffer.from(createHash("sha256").update(pass).digest("hex"));
  const b = Buffer.from(createHash("sha256").update(config.dashboardPass).digest("hex"));
  return timingSafeEqual(a, b);
}

export async function isDashAuthed() {
  if (!config.dashboardPass) return false;
  return (await cookies()).get(DASH_COOKIE)?.value === dashToken();
}
