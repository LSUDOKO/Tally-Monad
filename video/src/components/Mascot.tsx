import React from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { pop } from "../lib/anim";

export type Mood = "hero" | "success" | "blocked" | "thinking" | "editorial" | "avatar";
const RATIO: Record<Mood, number> = {
  hero: 350 / 640,
  success: 350 / 640,
  thinking: 350 / 640,
  blocked: 426 / 640,
  editorial: 426 / 640,
  avatar: 1,
};

/** The Tally mascot with a spring pop and a soft cobalt glow pool beneath it. */
export const Mascot: React.FC<{
  mood: Mood;
  height: number;
  delay?: number;
  style?: React.CSSProperties;
  wave?: boolean;
}> = ({ mood, height, delay = 10, style, wave = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = pop(frame, fps, delay);
  const bob = Math.sin((frame - delay) / 22) * 6;
  const rot = wave ? Math.sin((frame - delay) / 9) * 4 : 0;
  const width = Math.round(height * RATIO[mood]);
  return (
    <div
      style={{
        position: "absolute",
        width,
        height,
        opacity: Math.min(1, p * 1.5),
        transform: `translateY(${(1 - p) * 60 + (frame > delay ? bob : 0)}px) scale(${0.6 + 0.4 * p}) rotate(${rot}deg)`,
        transformOrigin: "50% 100%",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "-35%",
          right: "-35%",
          top: "25%",
          bottom: "-10%",
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(46, 118, 255, 0.45), transparent)",
        }}
      />
      <Img
        src={staticFile(`mascot/${mood}.webp`)}
        style={{ position: "relative", width: "100%", height: "100%", objectFit: "contain" }}
      />
    </div>
  );
};
