import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Glass } from "../components/Glass";
import { Header, LeftColumn } from "../components/Header";
import { PHONE_H, PHONE_W, Phone } from "../components/Phone";
import type { PhoneSide, SceneDef } from "../storyboard";
import { C, FONT, H, PAD } from "../theme";

const W1 = 370;
const K = W1 / PHONE_W;
const H1 = Math.round(PHONE_H * K);
const GAP = 96;
const LABEL_H = 52;
const LABEL_GAP = 22;
const CX = 1355;
const TEXT_W = 600;

const Side: React.FC<{ side: PhoneSide; x: number; delay: number; dir: number }> = ({ side, x, delay, dir }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 90 } });
  const lab = spring({ frame: frame - delay - 14, fps, config: { damping: 14, stiffness: 120 } });
  const drift = interpolate(frame, [0, durationInFrames], [8, -8]) * dir;
  const top = (H - (H1 + LABEL_H + LABEL_GAP)) / 2;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top,
        width: W1,
        opacity: Math.min(1, p * 1.3),
        transform: `translateY(${(1 - p) * 120 + drift}px)`,
      }}
    >
      <div style={{ height: LABEL_H, display: "flex", justifyContent: "center", marginBottom: LABEL_GAP }}>
        <Glass
          radius={LABEL_H / 2}
          style={{
            height: LABEL_H,
            padding: "0 26px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            opacity: Math.min(1, lab * 1.4),
            transform: `scale(${0.8 + 0.2 * lab})`,
          }}
        >
          <span style={{ width: 10, height: 10, borderRadius: 5, background: C.bright, boxShadow: `0 0 12px ${C.bright}` }} />
          <span style={{ fontFamily: FONT.sans, fontWeight: 500, fontSize: 24, color: C.text, whiteSpace: "nowrap" }}>{side.label}</span>
        </Glass>
      </div>
      <div style={{ position: "relative", width: W1, height: H1 }}>
        <Phone video={side.video} style={{ left: 0, top: 0, transform: `scale(${K})`, transformOrigin: "0 0" }} />
      </div>
    </div>
  );
};

/** Left the header; right two phones side by side, each with a label pill, playing their own recordings. */
export const PhonesScene: React.FC<{ scene: SceneDef; left: PhoneSide; right: PhoneSide }> = ({ scene, left, right }) => {
  const x0 = CX - GAP / 2 - W1;
  return (
    <AbsoluteFill>
      <Side side={left} x={x0} delay={2} dir={1} />
      <Side side={right} x={CX + GAP / 2} delay={12} dir={-1} />
      <LeftColumn left={PAD} width={TEXT_W}>
        <Header eyebrow={scene.eyebrow} title={scene.title} sub={scene.sub} titleSize={76} subSize={30} width={TEXT_W} />
      </LeftColumn>
    </AbsoluteFill>
  );
};
