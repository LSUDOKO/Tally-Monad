import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { LogoLockup } from "../components/LogoLockup";
import { Mascot } from "../components/Mascot";
import { EASE, prog } from "../lib/anim";
import type { SceneDef } from "../storyboard";
import { C, H, W } from "../theme";

/**
 * The 7 s intro. Night ink, the sky's light pool rises, the mark draws itself, the tile settles beside the
 * wordmark, "on Monad" and the mascot arrive, then the whole lockup breathes out into the first story frame.
 */
export const LogoScene: React.FC<{ scene: SceneDef }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const len = Math.round(scene.duration * fps);
  const pool = prog(frame, 0, 60);
  const exit = prog(frame, len - 14, len + 12, EASE);
  const t = frame / fps;
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      {/* the sky's light pools, rising out of the dark */}
      <AbsoluteFill
        style={{
          opacity: pool,
          background: [
            `radial-gradient(60% 50% at ${62 + Math.sin(t * 0.4) * 3}% -6%, rgba(168, 204, 255, 0.42), transparent 70%)`,
            "radial-gradient(46% 52% at 42% 52%, rgba(31, 107, 255, 0.30), transparent 72%)",
            "radial-gradient(80% 50% at 50% 120%, rgba(10, 61, 184, 0.55), transparent 70%)",
            "linear-gradient(180deg, #0e39a8 0%, #061a55 34%, #040c2b 64%, #03060f 100%)",
          ].join(", "),
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 1 - exit,
          transform: `scale(${1 + 0.07 * exit})`,
          filter: exit > 0 ? `blur(${exit * 14}px)` : undefined,
        }}
      >
        <LogoLockup cx={W / 2 - 150} cy={H / 2 - 20} delay={8} drawSize={300} size={210} wordSize={150} label={scene.sub || "on Monad"} />
        <Mascot mood="hero" height={500} delay={128} style={{ left: 1330, top: H / 2 - 280 }} />
      </AbsoluteFill>
      {/* a fine grain-free vignette keeps the corners in the night */}
      <AbsoluteFill style={{ boxShadow: "inset 0 0 260px rgba(3,6,15,0.85)", pointerEvents: "none", opacity: interpolate(pool, [0, 1], [1, 0.8]) }} />
    </AbsoluteFill>
  );
};
