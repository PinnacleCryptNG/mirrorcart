import type { NextConfig } from "next";
import { STORES } from "./src/lib/stores";

const embedAncestors = [...new Set(Object.values(STORES).flatMap((s) => s.allowedOrigins))].join(" ") || "'self'";

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/((?!embed).*)", headers: [{ key: "Content-Security-Policy", value: "frame-ancestors 'self'" }] },
      { source: "/embed", headers: [{ key: "Content-Security-Policy", value: `frame-ancestors ${embedAncestors}` }] },
      { source: "/widget.js", headers: [{ key: "Access-Control-Allow-Origin", value: "*" }, { key: "Cache-Control", value: "public, max-age=300" }] },
    ];
  },
};

export default nextConfig;
