/* eslint-disable @next/next/no-img-element */
import { Mirror } from "@/components/Mirror";
import { Look, LOOK_SLOT } from "@/lib/looks";

/** A cart styled as a flat-lay inside the rose squiggle mirror. */
export function FlatLay({ look, className = "" }: { look: Look; className?: string }) {
  return (
    <Mirror ratio={1.5} rim={5} amp={3.4} waves={12} glass="flatlay-glass" className={className}>
      {look.pieces.map((p) => {
        const [x, y, w, h, r] = LOOK_SLOT[p.slot];
        return (
          <img key={p.src} src={p.src} alt={p.name} loading="lazy"
            className="piece-in absolute object-contain drop-shadow-[0_6px_8px_rgba(107,36,64,.22)]"
            style={{ left: `${x}%`, top: `${y / 1.5}%`, width: `${w}%`, height: `${h / 1.5}%`, rotate: `${r}deg` }} />
        );
      })}
    </Mirror>
  );
}
