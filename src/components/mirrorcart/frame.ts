"use client";
import type { PoseLandmarker } from "@mediapipe/tasks-vision";

/** Person-aware framing: YouCam clothes VTO wants one front-facing person filling ≥80% of the frame. */
let landmarker: Promise<PoseLandmarker> | null = null;

function getLandmarker() {
  landmarker ??= (async () => {
    const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
    const files = await FilesetResolver.forVisionTasks("/mediapipe");
    return PoseLandmarker.createFromOptions(files, {
      baseOptions: { modelAssetPath: "/mediapipe/pose_landmarker_lite.task" },
      runningMode: "IMAGE",
      numPoses: 2,
    });
  })();
  landmarker.catch(() => (landmarker = null));
  return landmarker;
}

export type Framing = { canvas: HTMLCanvasElement; framed: boolean; warnings: string[] };

const VIS = 0.5;

export async function frameSubject(src: HTMLCanvasElement): Promise<Framing> {
  const warnings: string[] = [];
  let result;
  try {
    result = (await getLandmarker()).detect(src);
  } catch {
    return { canvas: src, framed: false, warnings };
  }
  const poses = result.landmarks ?? [];
  if (!poses.length) return { canvas: src, framed: false, warnings: ["We couldn't find a person. Use a front-facing, full-body photo."] };
  if (poses.length > 1) warnings.push("More than one person is in the photo. Try-on works best with just you.");

  const W = src.width, H = src.height;
  const p = poses[0];
  const seen = (i: number) => (p[i]?.visibility ?? 1) > VIS;
  const nose = p[0], ls = p[11], rs = p[12];
  if (!seen(0)) warnings.push("Your face should be clearly visible.");
  if (!seen(27) && !seen(28)) warnings.push("Your feet are cut off. Dresses, trousers and shoes need a full-body photo.");
  const shoulderY = (ls.y + rs.y) / 2;
  if (Math.abs(ls.x - rs.x) < 0.04) warnings.push("Face the camera straight on for the best fit.");

  const pts = p.filter((_, i) => seen(i));
  const xs = pts.map((q) => q.x * W), ys = pts.map((q) => q.y * H);
  const headTop = (nose.y - 1.1 * (shoulderY - nose.y)) * H;
  const top = Math.min(headTop, ...ys), bottom = Math.max(...ys);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const bodyH = bottom - top;

  // 3:4 box with the person at ~85% of its height, centred on the body.
  let ch = bodyH / 0.85, cw = ch * 0.75;
  cw = Math.max(cw, (maxX - minX) * 1.3);
  ch = Math.max(ch, cw / 0.75);
  cw = Math.min(cw, W); ch = Math.min(ch, H);
  const cx = (minX + maxX) / 2, cy = top - bodyH * 0.06 + ch / 2;
  const x = Math.max(0, Math.min(W - cw, cx - cw / 2)), y = Math.max(0, Math.min(H - ch, cy - ch / 2));
  if (cw * ch > W * H * 0.8) return { canvas: src, framed: false, warnings };

  const out = document.createElement("canvas");
  const scale = Math.min(1024 / ch, 2); // upscale small subjects up to 2× (to 1024 long side)
  out.width = Math.round(cw * scale); out.height = Math.round(ch * scale);
  const ctx = out.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, x, y, cw, ch, 0, 0, out.width, out.height);
  return { canvas: out, framed: true, warnings };
}
