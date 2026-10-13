import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Glass } from "../components/Glass";
import { Header } from "../components/Header";
import { Mascot } from "../components/Mascot";
import { enter, pop } from "../lib/anim";
import type { SceneDef } from "../storyboard";
import { C, FONT } from "../theme";

const ROWS: { name: string; scope: string; who: string }[] = [
  { name: "Greenlight", scope: "the store", who: "teen cards" },
  { name: "AP2", scope: "the cart", who: "agent payments" },
  { name: "Tally", scope: "the item", who: "and the agent's choice of it" },
];

const Check: React.FC<{ p: number }> = ({ p }) => (
  <div
    style={{
      width: 56,
      height: 56,
      borderRadius: 28,
      background: "radial-gradient(circle at 50% 30%, #5c9dff, #2e76ff 45%, #1450d6)",
      boxShadow: "0 0 0 1px rgba(232,241,255,0.4), 0 12px 36px rgba(46,118,255,0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transform: `scale(${p})`,
    }}
  >
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  </div>
);

/** The store, the cart, the item: three rows, the last one lit. */
export const GapScene: React.FC<{ scene: SceneDef }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delays = [40, 70, 118];
  const tally = enter(frame, fps, delays[2], 20);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 96, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <Header eyebrow={scene.eyebrow} title={scene.title} sub={scene.sub} align="center" titleSize={76} width={1500} />
      </div>
      <div style={{ position: "absolute", top: 480, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
        {ROWS.map((r, i) => {
          const p = enter(frame, fps, delays[i], 22);
          const lit = i === 2;
          const dim = !lit ? 1 - 0.45 * tally : 1;
          const body = (
            <div style={{ display: "flex", alignItems: "center", width: "100%", gap: 26 }}>
              <div style={{ fontFamily: FONT.sans, fontWeight: lit ? 500 : 400, fontSize: 46, letterSpacing: "-0.02em", color: C.text }}>{r.name}</div>
              <div style={{ fontFamily: FONT.sans, fontWeight: 300, fontSize: 46, color: lit ? C.core : C.muted }}>· {r.scope}</div>
              <div style={{ flex: 1 }} />
              <div style={{ fontFamily: FONT.sans, fontWeight: 500, fontSize: 22, letterSpacing: "0.08em", textTransform: "uppercase", color: lit ? C.core : C.faint }}>
                {r.who}
              </div>
              {lit ? <Check p={pop(frame, fps, delays[2] + 10)} /> : null}
            </div>
          );
          const common: React.CSSProperties = {
            width: 1000,
            opacity: p * dim,
            transform: `translateY(${(1 - p) * 30}px)${lit ? ` scale(${1 + 0.03 * tally})` : ""}`,
          };
          return lit ? (
            <div
              key={i}
              style={{
                ...common,
                padding: "22px 30px 22px 40px",
                borderRadius: 999,
                background: "linear-gradient(180deg, rgba(92,157,255,0.35), rgba(31,107,255,0.28) 55%, rgba(22,89,240,0.3))",
                border: "1px solid rgba(92,157,255,0.7)",
                boxShadow: `0 16px 50px -10px rgba(31,107,255,${0.7 * tally}), inset 0 1px 0 rgba(232,241,255,0.35)`,
              }}
            >
              {body}
            </div>
          ) : (
            <Glass key={i} radius={999} style={{ ...common, padding: "26px 40px" }}>
              {body}
            </Glass>
          );
        })}
      </div>
      <Mascot mood="editorial" height={400} delay={delays[2] + 6} style={{ right: 50, bottom: 60 }} />
    </AbsoluteFill>
  );
};
