import { ImageResponse } from "next/og";

export const alt = "Mirrorcart: try the whole cart on before you pay";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://mirrorcart.vercel.app";

export default function OG() {
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
        <div style={{ position: "absolute", right: 70, top: 50, width: 390, height: 530, display: "flex", padding: 16, borderRadius: "195px 195px 26px 26px", background: "linear-gradient(135deg,#ffffff,#93a19a 22%,#ffffff 40%,#74827c 58%,#eef2ef)" }}>
          <img src={`${SITE}/demo/looks/amara/cloth-v4-wrap-dress-terracotta__shoes-transfer-block-heel-loafers-black.jpg`} alt="" width={358} height={498}
            style={{ width: 358, height: 498, objectFit: "cover", borderRadius: "179px 179px 12px 12px" }} />
        </div>
        <div style={{ position: "absolute", right: 330, top: 92, display: "flex", background: "#ff6b4a", color: "#fff", fontSize: 24, fontWeight: 700, padding: "10px 18px", borderRadius: 999, transform: "rotate(-6deg)" }}>See it on me</div>
      </div>
    ),
    size,
  );
}
