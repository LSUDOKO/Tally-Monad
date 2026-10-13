import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Glass } from "../components/Glass";
import { Header } from "../components/Header";
import { enter, pop, prog } from "../lib/anim";
import type { SceneDef, Stat } from "../storyboard";
import { C, FONT, PAD } from "../theme";

/** Monad's purple, used only as a thin accent. */
const MONAD = "#836EF9";
const CARD_W = 530;
const GAP = 25;

/** Why Monad: three big numbers, each underlined with a hairline of Monad purple. */
export const MonadScene: React.FC<{ scene: SceneDef; stats: Stat[] }> = ({ scene, stats }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const first = 30;
  const step = 14;
  const foot = enter(frame, fps, first + stats.length * step + 20, 24);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: PAD, top: 130 }}>
        <Header eyebrow={scene.eyebrow} title={scene.title} sub={scene.sub} titleSize={84} width={1200} />
      </div>
      <div style={{ position: "absolute", left: PAD, top: 500, display: "flex", gap: GAP }}>
        {stats.map(([value, label], i) => {
          const d = first + i * step;
          const p = pop(frame, fps, d);
          const line = prog(frame, d + 10, d + 34);
          return (
            <Glass
              key={i}
              radius={30}
              style={{
                width: CARD_W,
                height: 290,
                padding: "44px 44px 40px",
                opacity: Math.min(1, p * 1.5),
                transform: `translateY(${(1 - p) * 40}px) scale(${0.88 + 0.12 * p})`,
                boxShadow: "0 40px 100px -40px rgba(0,0,0,0.8)",
              }}
            >
              <div style={{ fontFamily: FONT.sans, fontWeight: 300, fontSize: 104, letterSpacing: "-0.04em", color: C.text, lineHeight: 1 }}>{value}</div>
              <div
                style={{
                  marginTop: 22,
                  height: 3,
                  width: 120 * line,
                  borderRadius: 2,
                  background: `linear-gradient(90deg, ${MONAD}, rgba(131,110,249,0.2))`,
                  boxShadow: `0 0 14px ${MONAD}`,
                }}
              />
              <div style={{ fontFamily: FONT.sans, fontWeight: 400, fontSize: 27, lineHeight: 1.35, color: C.muted, marginTop: 22 }}>{label}</div>
            </Glass>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          left: PAD,
          top: 846,
          display: "flex",
          alignItems: "center",
          gap: 14,
          opacity: foot,
          transform: `translateY(${(1 - foot) * 14}px)`,
          fontFamily: FONT.mono,
          fontSize: 22,
          color: C.faint,
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: 5, background: MONAD, boxShadow: `0 0 12px ${MONAD}` }} />
        Monad Testnet · chain 10143 · Tally <span style={{ color: C.muted }}>0xe7d2…e40a</span>
      </div>
    </AbsoluteFill>
  );
};
