import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { enter } from "../lib/anim";
import { C, FONT } from "../theme";

export const Eyebrow: React.FC<{ text: string; style?: React.CSSProperties }> = ({ text, style }) => (
  <div
    style={{
      fontFamily: FONT.sans,
      fontWeight: 500,
      fontSize: 26,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: C.bright,
      ...style,
    }}
  >
    {text}
  </div>
);

/** Eyebrow, a light statement title (one spring per line) and a muted sub. */
export const Header: React.FC<{
  eyebrow?: string;
  title: string;
  sub?: string;
  align?: "left" | "center";
  titleSize?: number;
  subSize?: number;
  width?: number;
  delay?: number;
  children?: React.ReactNode;
}> = ({ eyebrow, title, sub, align = "left", titleSize = 84, subSize = 32, width, delay = 0, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = (d: number) => {
    const p = enter(frame, fps, delay + d);
    return { opacity: p, transform: `translateY(${(1 - p) * 34}px)` };
  };
  const lines = title.split("\n");
  return (
    <div style={{ width, textAlign: align, display: "flex", flexDirection: "column", alignItems: align === "center" ? "center" : "flex-start" }}>
      {eyebrow ? (
        <Eyebrow text={eyebrow} style={{ ...rise(0), marginBottom: 28, ...(align === "center" ? { color: C.core } : null) }} />
      ) : null}
      <div
        style={{
          fontFamily: FONT.sans,
          fontWeight: 300,
          fontSize: titleSize,
          lineHeight: 1.06,
          letterSpacing: "-0.02em",
          color: C.text,
        }}
      >
        {lines.map((l, i) => (
          <div key={i} style={rise(4 + i * 6)}>
            {l}
          </div>
        ))}
      </div>
      {sub ? (
        <div
          style={{
            ...rise(10 + lines.length * 6),
            marginTop: 30,
            fontFamily: FONT.sans,
            fontWeight: 400,
            fontSize: subSize,
            lineHeight: 1.38,
            color: C.muted,
            maxWidth: width,
            textWrap: "balance",
          }}
        >
          {sub.replace(/ · /g, "\u00a0· ")}
        </div>
      ) : null}
      {children}
    </div>
  );
};

/** Left text column, vertically centered. */
export const LeftColumn: React.FC<{ children: React.ReactNode; width: number; left: number }> = ({ children, width, left }) => (
  <div style={{ position: "absolute", left, top: 0, bottom: 0, width, display: "flex", flexDirection: "column", justifyContent: "center" }}>
    {children}
  </div>
);
