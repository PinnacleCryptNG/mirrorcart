// The Mirrorcart mirror: a soft "squiggle" silhouette (a rounded superellipse with a wave running round its edge).
// Everything is in a 100-wide viewBox; `ratio` is height / width.

type Pt = [number, number];

function ring(ratio: number, offset: number, amp: number, waves: number, phase: number, n = 96): Pt[] {
  const H = 100 * ratio, a = 50 - amp - 1, b = H / 2 - amp - 1, e = 2.7;
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const t = (2 * Math.PI * i) / n, c = Math.cos(t), s = Math.sin(t);
    const x = a * Math.sign(c) * Math.abs(c) ** (2 / e), y = b * Math.sign(s) * Math.abs(s) ** (2 / e);
    let nx = (Math.sign(x) * Math.abs(x / a) ** (e - 1)) / a, ny = (Math.sign(y) * Math.abs(y / b) ** (e - 1)) / b;
    const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    const d = amp * Math.sin(waves * t + phase) - offset;
    pts.push([50 + x + nx * d, H / 2 + y + ny * d]);
  }
  return pts;
}

const f = (v: number) => v.toFixed(2);
function smooth(p: Pt[]): string {
  const n = p.length;
  let d = `M${f(p[0][0])} ${f(p[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + "Z";
}

export type MirrorOpts = { ratio: number; rim?: number; amp?: number; waves?: number; phase?: number };

export function mirrorPaths({ ratio, rim = 4, amp = 3.2, waves = 10, phase = 0 }: MirrorOpts) {
  return { outer: smooth(ring(ratio, 0, amp, waves, phase)), inner: smooth(ring(ratio, rim, amp, waves, phase)) };
}

const svgUrl = (ratio: number, d: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 ${f(100 * ratio)}' preserveAspectRatio='none'><path d='${d}'/></svg>`)}")`;

const cache = new Map<string, { outer: React.CSSProperties; inner: React.CSSProperties }>();
/** CSS mask styles for the mirror's rim (outer) and glass (inner). */
export function mirrorMasks(o: MirrorOpts) {
  const k = JSON.stringify(o);
  let m = cache.get(k);
  if (!m) {
    const p = mirrorPaths(o);
    const mk = (d: string): React.CSSProperties => {
      const u = svgUrl(o.ratio, d);
      return { WebkitMaskImage: u, maskImage: u, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat" };
    };
    m = { outer: mk(p.outer), inner: mk(p.inner) };
    cache.set(k, m);
  }
  return m;
}
