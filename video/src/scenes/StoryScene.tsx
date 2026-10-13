import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Glass } from "../components/Glass";
import { Header, LeftColumn } from "../components/Header";
import { Mascot } from "../components/Mascot";
import { enter, pop } from "../lib/anim";
import { ifStatic } from "../lib/assets";
import type { SceneDef, Stat } from "../storyboard";
import { C, FONT, PAD, TEXT_W } from "../theme";

const CARD = { left: 930, top: 90, width: 900, height: 900 };

const Stats: React.FC<{ stats: Stat[]; delay: number }> = ({ stats, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", gap: 20, marginTop: 44, width: TEXT_W }}>
      {stats.map(([n, label], i) => {
        const p = pop(frame, fps, delay + i * 10);
        return (
          <Glass
            key={i}
            radius={24}
            style={{
              flex: 1,
              padding: "24px 24px 26px",
              opacity: Math.min(1, p * 1.4),
              transform: `translateY(${(1 - p) * 30}px) scale(${0.85 + 0.15 * p})`,
            }}
          >
            <div style={{ fontFamily: FONT.sans, fontWeight: 300, fontSize: 60, letterSpacing: "-0.02em", color: C.text, lineHeight: 1 }}>{n}</div>
            <div style={{ fontFamily: FONT.sans, fontWeight: 500, fontSize: 21, color: C.muted, marginTop: 12, lineHeight: 1.3 }}>{label}</div>
          </Glass>
        );
      })}
    </div>
  );
};

/** Left text, right a rounded image card with a slow Ken Burns zoom (or a branded placeholder slot). */
export const StoryScene: React.FC<{ scene: SceneDef; image: string; stats?: Stat[] }> = ({ scene, image, stats }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const src = ifStatic(image);
  const p = enter(frame, fps, 0, 30);
  const zoom = interpolate(frame, [0, durationInFrames], [1.04, 1.14]);
  const panX = interpolate(frame, [0, durationInFrames], [0, -24]);
  const lines = scene.title.split("\n").length;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          ...CARD,
          borderRadius: 28,
          overflow: "hidden",
          opacity: p,
          transform: `translateX(${(1 - p) * 60}px)`,
          boxShadow: "0 40px 100px -30px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(194, 220, 255, 0.16)",
        }}
      >
        {src ? (
          <>
            <Img
              src={staticFile(src)}
              style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom}) translateX(${panX}px)` }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(3,6,15,0.35), transparent 30%, transparent 75%, rgba(3,6,15,0.25))" }} />
          </>
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(60% 40% at 60% 10%, rgba(168,204,255,0.4), transparent 70%), linear-gradient(180deg, #1c5feb 0%, #0e39a8 30%, #061a55 60%, #03060f 100%)",
            }}
          >
            <Mascot mood="thinking" height={520} delay={8} style={{ left: 450 - 142, top: 110 }} />
            <Glass radius={22} style={{ position: "absolute", left: 120, right: 120, bottom: 90, padding: "22px 28px", textAlign: "center" }}>
              <div style={{ fontFamily: FONT.sans, fontWeight: 500, fontSize: 20, letterSpacing: "0.08em", textTransform: "uppercase", color: C.bright }}>
                Image slot
              </div>
              <div style={{ fontFamily: FONT.mono, fontSize: 24, color: C.muted, marginTop: 8 }}>{image}</div>
            </Glass>
          </div>
        )}
      </div>
      <LeftColumn left={PAD} width={TEXT_W}>
        <Header eyebrow={scene.eyebrow} title={scene.title} sub={scene.sub} width={TEXT_W}>
          {stats && stats.length ? <Stats stats={stats} delay={24 + lines * 6} /> : null}
        </Header>
      </LeftColumn>
    </AbsoluteFill>
  );
};
