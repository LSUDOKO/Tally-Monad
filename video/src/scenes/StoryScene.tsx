import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Glass } from "../components/Glass";
import { Header, LeftColumn } from "../components/Header";
import { Mascot } from "../components/Mascot";
import { enter, pop } from "../lib/anim";
import { ifStatic } from "../lib/assets";
import type { SceneDef, Stat } from "../storyboard";
import { C, FONT, H, PAD, TEXT_W, W } from "../theme";

export type StoryLayout = "full" | "split";

const Stats: React.FC<{ stats: Stat[]; delay: number; width: number }> = ({ stats, delay, width }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", gap: 18, marginTop: 44, width }}>
      {stats.map(([n, label], i) => {
        const p = pop(frame, fps, delay + i * 10);
        return (
          <Glass
            key={i}
            radius={24}
            style={{
              flex: 1,
              padding: "22px 22px 24px",
              opacity: Math.min(1, p * 1.4),
              transform: `translateY(${(1 - p) * 30}px) scale(${0.85 + 0.15 * p})`,
            }}
          >
            <div style={{ fontFamily: FONT.sans, fontWeight: 300, fontSize: 56, letterSpacing: "-0.02em", color: C.text, lineHeight: 1 }}>{n}</div>
            <div style={{ fontFamily: FONT.sans, fontWeight: 500, fontSize: 20, color: C.muted, marginTop: 12, lineHeight: 1.3 }}>{label}</div>
          </Glass>
        );
      })}
    </div>
  );
};

/** A photograph-like plate: slow push-in, a gentle drift toward the focus, a navy grade so it sits in the brand sky. */
const Plate: React.FC<{ src: string; focus: number; style: React.CSSProperties }> = ({ src, focus, style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const zoom = interpolate(frame, [0, durationInFrames], [1.06, 1.16]);
  const drift = interpolate(frame, [0, durationInFrames], [-14, 14]);
  return (
    <div style={{ position: "absolute", overflow: "hidden", ...style }}>
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: `${focus}% 40%`,
          transform: `scale(${zoom}) translateX(${drift}px)`,
          filter: "saturate(1.05) contrast(1.04)",
        }}
      />
      {/* a cool grade and a soft vignette tie the illustration to the Tally palette */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,61,184,0.10), rgba(3,6,15,0.18))", mixBlendMode: "multiply" }} />
      <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 220px rgba(3,6,15,0.55)" }} />
    </div>
  );
};

const Placeholder: React.FC<{ image: string; style: React.CSSProperties }> = ({ image, style }) => (
  <div
    style={{
      position: "absolute",
      ...style,
      background: "radial-gradient(60% 40% at 60% 10%, rgba(168,204,255,0.4), transparent 70%), linear-gradient(180deg, #1c5feb 0%, #0e39a8 30%, #061a55 60%, #03060f 100%)",
    }}
  >
    <Mascot mood="thinking" height={480} delay={8} style={{ right: 260, top: 160 }} />
    <Glass radius={22} style={{ position: "absolute", right: 120, bottom: 110, padding: "20px 26px" }}>
      <div style={{ fontFamily: FONT.mono, fontSize: 22, color: C.muted }}>{image}</div>
    </Glass>
  </div>
);

/**
 * Story beats. "full": the plate fills the frame and the words sit on a navy fade at the bottom (faces stay in the
 * upper half). "split": the plate fills the right of the frame edge to edge and dissolves into the navy column that
 * holds the words.
 */
export const StoryScene: React.FC<{ scene: SceneDef; image: string; stats?: Stat[]; layout?: StoryLayout; focus?: number }> = ({
  scene,
  image,
  stats,
  layout = "split",
  focus = 50,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const src = ifStatic(image);
  const p = enter(frame, fps, 0, 36);
  const lines = scene.title.split("\n").length;

  if (layout === "full") {
    const plateStyle: React.CSSProperties = { inset: 0, opacity: p };
    return (
      <AbsoluteFill>
        {src ? <Plate src={src} focus={focus} style={plateStyle} /> : <Placeholder image={image} style={plateStyle} />}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(0deg, rgba(3,6,15,0.96) 0%, rgba(3,6,15,0.82) 26%, rgba(3,6,15,0.15) 52%, transparent 70%)",
          }}
        />
        <div style={{ position: "absolute", left: PAD, right: PAD, bottom: 150 }}>
          <Header eyebrow={scene.eyebrow} title={scene.title} sub={scene.sub} width={1300} />
        </div>
      </AbsoluteFill>
    );
  }

  const PLATE_LEFT = 760;
  const plateStyle: React.CSSProperties = {
    left: PLATE_LEFT,
    top: 0,
    width: W - PLATE_LEFT,
    height: H,
    opacity: p,
    transform: `translateX(${(1 - p) * 40}px)`,
  };
  return (
    <AbsoluteFill>
      {src ? <Plate src={src} focus={focus} style={plateStyle} /> : <Placeholder image={image} style={plateStyle} />}
      {/* the plate dissolves into the navy column: no hard card edge */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(90deg, rgba(3,6,15,0.97) 0px, rgba(3,6,15,0.94) ${PLATE_LEFT - 40}px, rgba(3,6,15,0.55) ${PLATE_LEFT + 220}px, rgba(3,6,15,0.0) ${PLATE_LEFT + 520}px)`,
        }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(3,6,15,0.55), transparent 22%)" }} />
      <LeftColumn left={PAD} width={TEXT_W}>
        <Header eyebrow={scene.eyebrow} title={scene.title} sub={scene.sub} width={TEXT_W}>
          {stats && stats.length ? <Stats stats={stats} delay={24 + lines * 6} width={TEXT_W} /> : null}
        </Header>
      </LeftColumn>
    </AbsoluteFill>
  );
};
