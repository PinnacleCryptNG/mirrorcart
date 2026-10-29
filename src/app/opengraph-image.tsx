import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Mirrorcart: try the whole cart on before you pay";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const asset = async (f: string, type: string) =>
  `data:${type};base64,${(await readFile(join(process.cwd(), "public/hero", f))).toString("base64")}`;

export default async function OG() {
  const [frame, look] = await Promise.all([asset("mirror-frame.png", "image/png"), asset("zola-dinner-2.jpg", "image/jpeg")]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "repeating-linear-gradient(90deg,#072b21 0px,#145a45 30px,#072b21 60px)", color: "#f7f9f7", padding: 64, position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 680 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 40, fontWeight: 800, letterSpacing: -1.5 }}>
            <div style={{ width: 34, height: 44, borderRadius: "17px 17px 5px 5px", background: "linear-gradient(135deg,#fff,#a9b6af 35%,#f4f7f5 55%,#6f7f78)" }} />
            mirrorcart
          </div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 84, fontWeight: 800, lineHeight: 0.95, letterSpacing: -3 }}>
            <span>Try the whole</span><span>cart on.</span>
            <span style={{ color: "#e8c46c", fontStyle: "italic", fontWeight: 400 }}>Before you pay.</span>
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#cfe3d9" }}>One photo. Dress, shoes, bag & jewellery.</div>
        </div>
        <div style={{ position: "absolute", right: 150, top: 35, width: 244, height: 560, display: "flex" }}>
          <img src={look} alt="" width={195} height={486}
            style={{ position: "absolute", left: 24, top: 44, width: 195, height: 486, objectFit: "cover", borderRadius: "98px 98px 0 0" }} />
          <img src={frame} alt="" width={244} height={560} style={{ position: "absolute", left: 0, top: 0, width: 244, height: 560 }} />
        </div>
        <div style={{ position: "absolute", right: 360, top: 120, display: "flex", background: "#ff6b4a", color: "#fff", fontSize: 24, fontWeight: 700, padding: "10px 18px", borderRadius: 999, transform: "rotate(-6deg)" }}>See it on me</div>
      </div>
    ),
    size,
  );
}
