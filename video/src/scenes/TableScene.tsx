import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Glass } from "../components/Glass";
import { Header, LeftColumn } from "../components/Header";
import { enter, pop } from "../lib/anim";
import type { SceneDef, TableRow } from "../storyboard";
import { C, FONT, PAD } from "../theme";

const PANEL = { left: 880, width: 920 };
const COL = 196;
const ROW_H = 86;
const HEAD_H = 92;
const FIRST = 26; // first row lands
const STEP = 10; // a row every ~10 frames

const Yes: React.FC<{ p: number; strong?: boolean }> = ({ p, strong }) => (
  <div
    style={{
      width: 46,
      height: 46,
      borderRadius: 23,
      background: strong ? "radial-gradient(circle at 50% 30%, #6fe0b3, #3DBD8C 55%, #23966a)" : "rgba(61,189,140,0.16)",
      border: strong ? "none" : "1px solid rgba(61,189,140,0.55)",
      boxShadow: strong ? "0 0 0 1px rgba(232,255,244,0.35), 0 10px 28px rgba(61,189,140,0.45)" : "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity: Math.min(1, p * 1.5),
      transform: `scale(${0.4 + 0.6 * p})`,
    }}
  >
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={strong ? "#fff" : C.paid} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  </div>
);

const No: React.FC<{ p: number }> = ({ p }) => (
  <div style={{ width: 46, height: 46, display: "flex", alignItems: "center", justifyContent: "center", opacity: p * 0.9 }}>
    <div style={{ width: 22 * p, height: 3, borderRadius: 2, background: "rgba(127,144,181,0.55)" }} />
  </div>
);

/** Caps & allowlists vs Tally: a glass table, rows landing one by one, the Tally column lit and its checks a beat later. */
export const TableScene: React.FC<{ scene: SceneDef; rows: TableRow[]; cols: [string, string] }> = ({ scene, rows, cols }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const panel = enter(frame, fps, 8, 28);
  const height = HEAD_H + rows.length * ROW_H + 20;
  const lastRow = FIRST + (rows.length - 1) * STEP;
  const lit = enter(frame, fps, lastRow + 24, 30);
  return (
    <AbsoluteFill>
      <LeftColumn left={PAD} width={680}>
        <Header eyebrow={scene.eyebrow} title={scene.title} sub={scene.sub} titleSize={62} width={680} />
      </LeftColumn>
      <div
        style={{
          position: "absolute",
          left: PANEL.left,
          top: (1080 - height) / 2 - 30,
          width: PANEL.width,
          height,
          opacity: panel,
          transform: `translateX(${(1 - panel) * 50}px)`,
        }}
      >
        <Glass radius={30} strong style={{ position: "absolute", inset: 0, boxShadow: "0 50px 120px -40px rgba(0,0,0,0.8)" }} />
        {/* the Tally column, brand-tinted, glowing brighter once every row is in */}
        <div
          style={{
            position: "absolute",
            right: 14,
            top: 12,
            bottom: 12,
            width: COL,
            borderRadius: 22,
            background: "linear-gradient(180deg, rgba(92,157,255,0.30), rgba(31,107,255,0.20) 50%, rgba(22,89,240,0.16))",
            border: "1px solid rgba(92,157,255,0.55)",
            boxShadow: `0 0 ${30 + 40 * lit}px -6px rgba(31,107,255,${0.35 + 0.35 * lit}), inset 0 1px 0 rgba(232,241,255,0.3)`,
          }}
        />
        {/* header row */}
        <div style={{ position: "absolute", left: 40, right: 14, top: 0, height: HEAD_H, display: "flex", alignItems: "center" }}>
          <div style={{ flex: 1 }} />
          {cols.map((c, i) => (
            <div
              key={c}
              style={{
                width: COL,
                textAlign: "center",
                fontFamily: FONT.sans,
                fontWeight: i === 1 ? 600 : 500,
                fontSize: i === 1 ? 30 : 21,
                letterSpacing: i === 1 ? "-0.01em" : "0.06em",
                textTransform: i === 1 ? "none" : "uppercase",
                color: i === 1 ? C.text : C.faint,
                lineHeight: 1.2,
                padding: "0 14px",
              }}
            >
              {c}
            </div>
          ))}
        </div>
        {rows.map(([label, caps, tally], i) => {
          const d = FIRST + i * STEP;
          const p = enter(frame, fps, d, 22);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 40,
                right: 14,
                top: HEAD_H + i * ROW_H,
                height: ROW_H,
                display: "flex",
                alignItems: "center",
                borderTop: "1px solid rgba(194,220,255,0.08)",
                opacity: p,
                transform: `translateY(${(1 - p) * 18}px)`,
              }}
            >
              <div
                style={{
                  flex: 1,
                  fontFamily: FONT.sans,
                  fontWeight: 400,
                  fontSize: 31,
                  letterSpacing: "-0.01em",
                  color: caps ? C.muted : C.text,
                }}
              >
                {label}
              </div>
              <div style={{ width: COL, display: "flex", justifyContent: "center" }}>
                {caps ? <Yes p={pop(frame, fps, d + 6)} /> : <No p={enter(frame, fps, d + 6, 14)} />}
              </div>
              <div style={{ width: COL, display: "flex", justifyContent: "center" }}>
                {tally ? <Yes strong p={pop(frame, fps, d + 16)} /> : <No p={enter(frame, fps, d + 16, 14)} />}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
