import React from "react";
import { AbsoluteFill, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Chip } from "../components/Chip";
import { Header, LeftColumn } from "../components/Header";
import { Mascot, Mood } from "../components/Mascot";
import { PHONE_H, PHONE_W, Phone } from "../components/Phone";
import { ifStatic } from "../lib/assets";
import type { SceneDef } from "../storyboard";
import { H, PAD, TEXT_W } from "../theme";

const MOOD: Record<string, Mood> = {
  meet: "hero",
  signin: "thinking",
  rules: "editorial",
  pay: "success",
  secondlook: "thinking",
  family: "hero",
  redteam: "blocked",
  receipts: "success",
  merchant: "editorial",
};

const PHONE_CX = 1440;

/** Left text; right a phone playing the screen recording, the mascot popping in beside it. */
export const PhoneScene: React.FC<{ scene: SceneDef; video: string; chip?: string; story?: string }> = ({ scene, video, chip, story }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const off = ifStatic(story) ? 90 : 0; // the family scene opens on its story plate first
  const p = spring({ frame: frame - off - 2, fps, config: { damping: 18, stiffness: 90 } });
  // one slow move: the phone settles in, then drifts up a touch over the scene
  const drift = interpolate(frame, [0, durationInFrames], [10, -10]);
  const top = (H - PHONE_H) / 2;
  const inset = ifStatic(story);
  const mood = MOOD[scene.id] ?? "hero";
  const mascotH = mood === "blocked" || mood === "editorial" ? 300 : 340;
  const main = (
    <AbsoluteFill>
      <Phone
        video={video}
        style={{
          left: PHONE_CX - PHONE_W / 2,
          top,
          opacity: Math.min(1, p * 1.3),
          transform: `translateY(${(1 - p) * 140 + drift}px) scale(${0.92 + 0.08 * p})`,
        }}
      />
      <Mascot mood={mood} height={mascotH} delay={22} style={{ right: 14, bottom: 70 }} />
      <LeftColumn left={PAD} width={TEXT_W}>
        <Header eyebrow={scene.eyebrow} title={scene.title} sub={scene.sub} width={TEXT_W}>
          {chip ? <Chip text={chip} delay={36} style={{ marginTop: 40 }} /> : null}
        </Header>
      </LeftColumn>
    </AbsoluteFill>
  );
  if (!inset) return main;

  // With a story plate: open on the full-bleed moment, then dissolve into the phone.
  const INTRO = 96;
  const out = interpolate(frame, [INTRO - 6, INTRO + 18], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const zoom = interpolate(frame, [0, INTRO + 18], [1.04, 1.12]);
  const words = spring({ frame: frame - 10, fps, config: { damping: 20, stiffness: 80 } });
  return (
    <AbsoluteFill>
      <Sequence from={INTRO - 6} layout="none">
        {main}
      </Sequence>
      {frame < INTRO + 18 ? (
        <AbsoluteFill style={{ opacity: out }}>
          <Img src={staticFile(inset)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "38% 40%", transform: `scale(${zoom})` }} />
          <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 240px rgba(3,6,15,0.55)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(3,6,15,0.92) 0%, rgba(3,6,15,0.6) 24%, transparent 50%)" }} />
          <div style={{ position: "absolute", left: PAD, bottom: 150, opacity: words, transform: `translateY(${(1 - words) * 30}px)` }}>
            <Header eyebrow="Pune · 7:02 am" title={"Mom tops it up.\nIn a second."} sub="Her thumb, a link, and Riya's rules." width={1200} />
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
