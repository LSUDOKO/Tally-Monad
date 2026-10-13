import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Header } from "../components/Header";
import { LogoLockup } from "../components/LogoLockup";
import { Mascot } from "../components/Mascot";
import { enter } from "../lib/anim";
import type { SceneDef } from "../storyboard";
import { C, FONT, W } from "../theme";

const LINKS = "tally-monad.vercel.app · Android APK on GitHub";

/** The logo draws itself again (faster), then the line, the event, the links; the mascot waves goodbye. */
export const OutroScene: React.FC<{ scene: SceneDef }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const speed = 1.8;
  const lockupDone = Math.round(100 / speed);
  const small = enter(frame, fps, lockupDone + 34);
  const sub = scene.sub && scene.sub !== LINKS ? scene.sub : "";
  return (
    <AbsoluteFill>
      <LogoLockup cx={W / 2} cy={268} delay={2} speed={speed} drawSize={170} size={124} wordSize={104} />
      <div style={{ position: "absolute", top: 410, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <Header title={scene.title} sub={sub} align="center" titleSize={84} width={1400} delay={lockupDone - 4} />
      </div>
      <div
        style={{
          position: "absolute",
          top: sub ? 680 : 600,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          opacity: small,
          transform: `translateY(${(1 - small) * 20}px)`,
          fontFamily: FONT.sans,
          fontWeight: 500,
          fontSize: 24,
          letterSpacing: "0.04em",
          color: C.faint,
        }}
      >
        <div style={{ color: C.bright, letterSpacing: "0.1em", textTransform: "uppercase" }}>Monad Metropolis · Consumer Products &amp; Payments</div>
        <div style={{ fontFamily: FONT.mono, fontWeight: 400, fontSize: 26, color: C.muted, letterSpacing: 0 }}>{LINKS}</div>
      </div>
      <Mascot mood="hero" height={520} delay={lockupDone + 10} wave style={{ right: 110, bottom: 150 }} />
    </AbsoluteFill>
  );
};
