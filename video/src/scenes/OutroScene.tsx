import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Header } from "../components/Header";
import { Mascot } from "../components/Mascot";
import { enter, pop } from "../lib/anim";
import type { SceneDef } from "../storyboard";
import { C, FONT } from "../theme";

/** Mark + wordmark, the line, links; the mascot waves goodbye. */
export const OutroScene: React.FC<{ scene: SceneDef }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const m = pop(frame, fps, 0);
  const small = enter(frame, fps, 46);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: -40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 30, marginBottom: 56, opacity: Math.min(1, m * 1.4), transform: `scale(${0.7 + 0.3 * m})` }}>
          <Img src={staticFile("brand/mark.svg")} style={{ width: 128, height: 128, filter: "drop-shadow(0 16px 40px rgba(31,107,255,0.6))" }} />
          <div style={{ fontFamily: FONT.sans, fontWeight: 500, fontSize: 112, letterSpacing: "-0.03em", color: C.text }}>Tally</div>
        </div>
        <Header title={scene.title} sub={scene.sub} align="center" titleSize={84} width={1400} delay={10} />
        <div
          style={{
            marginTop: 52,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            opacity: small,
            transform: `translateY(${(1 - small) * 20}px)`,
            fontFamily: FONT.sans,
            fontWeight: 500,
            fontSize: 24,
            letterSpacing: "0.04em",
            color: C.faint,
          }}
        >
          <div style={{ color: C.bright, letterSpacing: "0.08em", textTransform: "uppercase" }}>Monad Metropolis · Consumer Products &amp; Payments</div>
          <div style={{ fontFamily: FONT.mono, fontWeight: 400 }}>github.com/LSUDOKO/Tally-Monad</div>
        </div>
      </div>
      <Mascot mood="hero" height={560} delay={18} wave style={{ right: 90, bottom: 80 }} />
    </AbsoluteFill>
  );
};
