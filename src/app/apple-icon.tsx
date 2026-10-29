import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center", background: "#0f4434", paddingBottom: 22 }}>
        <div style={{ position: "absolute", top: 22, width: 52, height: 40, border: "11px solid #e8c46c", borderBottom: "none", borderRadius: "30px 30px 0 0" }} />
        <div style={{ width: 112, height: 124, display: "flex", padding: 12, borderRadius: "56px 56px 14px 14px", background: "linear-gradient(135deg,#ffffff,#a9b6af 35%,#f4f7f5 55%,#6f7f78)" }}>
          <div style={{ flex: 1, borderRadius: "46px 46px 8px 8px", background: "linear-gradient(180deg,#1d6b53,#072b21)" }} />
        </div>
      </div>
    ),
    size,
  );
}
