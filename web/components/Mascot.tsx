import Image from "next/image";

export type Mood = "hero" | "success" | "blocked" | "thinking" | "editorial" | "avatar";

/** The Tally mascot, one pose per moment: hero on welcome, success when paid, blocked when an attack bounces. */
export function Mascot({ mood, height = 180, className = "", glow = true }: { mood: Mood; height?: number; className?: string; glow?: boolean }) {
  const ratio = mood === "avatar" ? 1 : mood === "hero" ? 685 / 1250 : mood === "blocked" || mood === "editorial" ? 1024 / 1536 : 928 / 1694;
  return (
    <div className={`relative shrink-0 ${className}`} style={{ height, width: Math.round(height * ratio) }}>
      {glow && <div className="absolute inset-x-[-30%] bottom-[-8%] top-[20%] rounded-full bg-[radial-gradient(closest-side,rgba(46,118,255,0.45),transparent)]" />}
      <Image src={`/mascot/${mood}.webp`} alt="" fill sizes={`${height}px`} className="relative object-contain" priority={mood === "hero"} />
    </div>
  );
}
