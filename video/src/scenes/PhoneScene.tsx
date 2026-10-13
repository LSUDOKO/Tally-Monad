import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Chip } from "../components/Chip";
import { Header, LeftColumn } from "../components/Header";
import { Mascot, Mood } from "../components/Mascot";
import { PHONE_H, PHONE_W, Phone } from "../components/Phone";
import { pop } from "../lib/anim";
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
  const p = spring({ frame: frame - 2, fps, config: { damping: 18, stiffness: 90 } });
  // one slow move: the phone settles in, then drifts up a touch over the scene
  const drift = interpolate(frame, [0, durationInFrames], [10, -10]);
  const top = (H - PHONE_H) / 2;
  const inset = ifStatic(story);
  const ip = pop(frame, fps, 40);
  const mood = MOOD[scene.id] ?? "hero";
  const mascotH = mood === "blocked" || mood === "editorial" ? 330 : 380;
  return (
    <AbsoluteFill>
      {inset ? (
        <div
          style={{
            position: "absolute",
            left: 900,
            top: 560,
            width: 300,
            height: 380,
            borderRadius: 24,
            overflow: "hidden",
            opacity: Math.min(1, ip * 1.4),
            transform: `rotate(${-5 + (1 - ip) * -6}deg) scale(${0.8 + 0.2 * ip})`,
            boxShadow: "0 30px 70px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(194,220,255,0.2)",
          }}
        >
          <Img src={staticFile(inset)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      ) : null}
      <Phone
        video={video}
        style={{
          left: PHONE_CX - PHONE_W / 2,
          top,
          opacity: Math.min(1, p * 1.3),
          transform: `translateY(${(1 - p) * 140 + drift}px) scale(${0.92 + 0.08 * p})`,
        }}
      />
      <Mascot mood={mood} height={mascotH} delay={22} style={{ right: 40, bottom: 70 }} />
      <LeftColumn left={PAD} width={TEXT_W}>
        <Header eyebrow={scene.eyebrow} title={scene.title} sub={scene.sub} width={TEXT_W}>
          {chip ? <Chip text={chip} delay={36} style={{ marginTop: 40 }} /> : null}
        </Header>
      </LeftColumn>
    </AbsoluteFill>
  );
};
