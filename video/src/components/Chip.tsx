import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { pop } from "../lib/anim";
import { C, FONT } from "../theme";

/** A brand-tinted pill (sponsor tech callout). */
export const Chip: React.FC<{ text: string; delay?: number; style?: React.CSSProperties }> = ({ text, delay = 34, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = pop(frame, fps, delay);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 14,
        alignSelf: "flex-start",
        padding: "14px 26px",
        borderRadius: 999,
        background: "color-mix(in srgb, #1F6BFF 18%, rgba(4, 10, 28, 0.6))",
        border: "1px solid rgba(92, 157, 255, 0.5)",
        boxShadow: "0 10px 30px -10px rgba(31, 107, 255, 0.6)",
        fontFamily: FONT.mono,
        fontWeight: 500,
        fontSize: 24,
        color: C.text,
        opacity: Math.min(1, p * 1.4),
        transform: `scale(${0.7 + 0.3 * p})`,
        transformOrigin: "0% 50%",
        ...style,
      }}
    >
      <span style={{ width: 12, height: 12, borderRadius: 6, background: C.bright, boxShadow: `0 0 12px ${C.bright}` }} />
      {text}
    </div>
  );
};
