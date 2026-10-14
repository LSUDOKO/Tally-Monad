import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Glass } from "../components/Glass";
import { Mascot } from "../components/Mascot";
import { TallyMark } from "../components/TallyMark";
import { EASE, enter, prog } from "../lib/anim";
import { logoOnDark } from "../lib/assets";
import type { SceneDef } from "../storyboard";
import { C, FONT, H } from "../theme";

const TILE = 150;
const WORD = 128;
const LOGO_H = 120;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** A soft spring-in for one piece of the lockup. */
const useIn = (delay: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 120, mass: 0.9 } });
};

const SponsorMark: React.FC<{ logo?: string; name: string }> = ({ logo, name }) => {
  const src = logoOnDark(logo);
  if (src) {
    return (
      <Img
        src={staticFile(src)}
        style={{ height: LOGO_H, maxWidth: 520, objectFit: "contain", filter: "drop-shadow(0 16px 40px rgba(3,6,15,0.45))" }}
      />
    );
  }
  return (
    <Glass radius={LOGO_H / 2} style={{ height: LOGO_H, padding: "0 56px", display: "flex", alignItems: "center" }}>
      <span style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: 84, lineHeight: 1, letterSpacing: "-0.03em", color: C.text }}>{name}</span>
    </Glass>
  );
};

/**
 * Sponsor title card: the Tally tile draws itself, "Tally", a thin ×, then the sponsor's mark spring in one after another;
 * the bounty name and the event line rise beneath, and the mascot pops in at the right.
 */
export const SponsorScene: React.FC<{ scene: SceneDef; logo?: string; name: string }> = ({ scene, logo, name }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tile = useIn(4);
  const bars = [0, 1, 2, 3].map((i) => prog(frame, 12 + i * 5, 22 + i * 5, EASE));
  const strike = prog(frame, 34, 44, EASE);
  const word = enter(frame, fps, 22, 24);
  const x = useIn(38);
  const mark = useIn(48);
  const bounty = enter(frame, fps, 64, 26);
  const event = enter(frame, fps, 76, 26);
  const pool = prog(frame, 0, 50);
  // the event line leads with Monad's own wordmark
  const monad = logoOnDark("logos/monad.svg", false);
  const flash = interpolate(frame, [44, 50, 80], [0, 1, 0.3], clamp);
  const piece = (p: number, dx = 0): React.CSSProperties => ({
    opacity: Math.min(1, p * 1.4),
    transform: `translateX(${(1 - p) * dx}px) scale(${0.7 + 0.3 * p})`,
  });
  return (
    <AbsoluteFill>
      {/* a light pool gathers behind the lockup */}
      <AbsoluteFill
        style={{
          opacity: pool,
          background: "radial-gradient(42% 38% at 50% 46%, rgba(46,118,255,0.32), rgba(31,107,255,0.08) 60%, transparent 75%)",
        }}
      />
      <div style={{ position: "absolute", left: 0, right: 0, top: H / 2 - 150, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 44, height: TILE }}>
          <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
            <div
              style={{
                ...piece(tile),
                filter: `drop-shadow(0 14px 34px rgba(31,107,255,${0.45 + 0.35 * flash}))`,
              }}
            >
              <TallyMark size={TILE} bars={bars} strike={strike} />
            </div>
            <div style={{ overflow: "hidden", paddingRight: 12 }}>
              <div
                style={{
                  fontFamily: FONT.sans,
                  fontWeight: 600,
                  fontSize: WORD,
                  lineHeight: 1.1,
                  letterSpacing: "-0.03em",
                  color: C.text,
                  opacity: word,
                  transform: `translateX(${(1 - word) * -WORD * 0.8}px)`,
                }}
              >
                Tally
              </div>
            </div>
          </div>
          <div style={{ ...piece(x), fontFamily: FONT.sans, fontWeight: 200, fontSize: 96, lineHeight: 1, color: C.core, margin: "0 6px" }}>×</div>
          <div style={piece(mark, 40)}>
            <SponsorMark logo={logo} name={name} />
          </div>
        </div>
        {scene.sub ? (
          <div
            style={{
              marginTop: 64,
              opacity: bounty,
              transform: `translateY(${(1 - bounty) * 22}px)`,
              display: "flex",
              alignItems: "center",
              gap: 18,
              fontFamily: FONT.sans,
              fontWeight: 500,
              fontSize: 32,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: C.bright,
              textShadow: "0 0 24px rgba(92,157,255,0.45)",
            }}
          >
            <span style={{ width: 40 * bounty, height: 2, borderRadius: 1, background: C.bright, boxShadow: `0 0 10px ${C.bright}` }} />
            {scene.sub}
            <span style={{ width: 40 * bounty, height: 2, borderRadius: 1, background: C.bright, boxShadow: `0 0 10px ${C.bright}` }} />
          </div>
        ) : null}
        <div
          style={{
            marginTop: 22,
            opacity: event,
            transform: `translateY(${(1 - event) * 16}px)`,
            fontFamily: FONT.sans,
            fontWeight: 400,
            fontSize: 26,
            letterSpacing: "0.04em",
            color: C.muted,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {monad ? (
            <Img src={staticFile(monad)} style={{ height: 30, opacity: 0.9, transform: "translateY(-1px)" }} />
          ) : (
            "Monad"
          )}
          <span>Metropolis · Consumer Products &amp; Payments</span>
        </div>
      </div>
      <Mascot mood="hero" height={400} delay={58} style={{ right: 120, bottom: 120 }} />
    </AbsoluteFill>
  );
};
