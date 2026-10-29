import { useId } from "react";

/** Mirrorcart mark: an arched fitting-room mirror wearing a shopping-bag handle. */
export function MirrorMark({ className = "h-8 w-8", tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const id = useId().replace(/:/g, "");
  const handle = tone === "dark" ? "#0d1a15" : "#e8c46c";
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id={`c${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" /><stop offset=".35" stopColor="#a9b6af" /><stop offset=".55" stopColor="#f4f7f5" /><stop offset="1" stopColor="#6f7f78" />
        </linearGradient>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d6b53" /><stop offset="1" stopColor="#072b21" />
        </linearGradient>
      </defs>
      <path d="M11.5 9V6.5a4.5 4.5 0 0 1 9 0V9" fill="none" stroke={handle} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M5 30V17.5a11 11 0 0 1 22 0V30z" fill={`url(#c${id})`} />
      <path d="M7.6 28.2V17.6a8.4 8.4 0 0 1 16.8 0v10.6z" fill={`url(#g${id})`} />
      <path d="M11 25.5l7.5-10M14.5 27l6-8" stroke="#ffffff" strokeOpacity=".7" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="16" cy="28.9" r="1" fill="#ff6b4a" />
    </svg>
  );
}

export function MirrorcartLogo({ className = "", tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <MirrorMark className="h-[1.6em] w-[1.6em]" tone={tone} />
      <span className="font-display font-extrabold tracking-[-0.045em] leading-none stretch">mirror<span className="serif-i font-normal tracking-normal text-[1.12em]">cart</span></span>
    </span>
  );
}
