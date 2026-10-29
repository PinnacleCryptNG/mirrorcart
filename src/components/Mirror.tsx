import type { ReactNode } from "react";
import { MirrorOpts, mirrorMasks } from "@/lib/mirror";

/** A squiggle mirror: glossy blush rim with the content behind the glass. */
export function Mirror({ ratio = 1.25, rim, amp, waves, className = "", glass = "bg-fog", children }:
  Partial<MirrorOpts> & { className?: string; glass?: string; children?: ReactNode }) {
  const m = mirrorMasks({ ratio, rim, amp, waves });
  return (
    <div className={`mirror relative ${className}`} style={{ aspectRatio: `1 / ${ratio}` }}>
      <div className="mirror-rim absolute inset-0" style={m.outer} />
      <div className={`absolute inset-0 overflow-hidden ${glass}`} style={m.inner}>
        {children}
        <div className="mirror-glare pointer-events-none absolute inset-0" />
      </div>
    </div>
  );
}
