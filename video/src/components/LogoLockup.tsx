import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE, EASE_IN_OUT, enter, prog } from "../lib/anim";
import { C, FONT } from "../theme";
import { TallyMark } from "./TallyMark";

/** "Tally" in Inter Tight 600 is ~2.12 em wide with the -0.03 em tracking. Used to centre the tile before the word lands. */
const WORD_EM = 2.12;

/**
 * The orchestrated logo: the tile lands, four bars draw one by one, the strike slashes across, then the tile
 * springs to its final size while "Tally" slides out from behind it, and the label follows.
 * All offsets are in frames at speed 1 (the 7 s intro); the outro reprises it faster.
 */
export const LogoLockup: React.FC<{
  cx: number;
  cy: number;
  delay?: number;
  speed?: number;
  /** tile size while drawing, and after it settles */
  drawSize?: number;
  size?: number;
  wordSize?: number;
  label?: string;
  /** extra transform for the whole lockup (exit) */
  style?: React.CSSProperties;
}> = ({ cx, cy, delay = 0, speed = 1, drawSize = 300, size = 200, wordSize = 150, label, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = (n: number) => delay + n / speed;
  const span = (n: number) => Math.max(4, n / speed);

  const tileIn = spring({ frame: frame - at(0), fps, config: { damping: 16, stiffness: 120, mass: 0.9 } });
  const bars = [0, 1, 2, 3].map((i) => prog(frame, at(16 + i * 9), at(16 + i * 9) + span(13), EASE));
  const strike = prog(frame, at(56), at(56) + span(11), EASE_IN_OUT);
  // the strike lands: a quick flash of light from the tile
  const flash = interpolate(frame, [at(62), at(68), at(96)], [0, 1, 0.35], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const settle = spring({ frame: frame - at(74), fps, config: { damping: 18, stiffness: 110, mass: 0.9 } });
  const word = enter(frame, fps, at(84), span(26));
  const lab = enter(frame, fps, at(106), span(22));

  const tile = interpolate(settle, [0, 1], [drawSize, size]);
  const gap = size * 0.24;
  const wordW = WORD_EM * wordSize;
  const shift = (1 - settle) * (gap + wordW) * 0.5;
  // a nudge of the strike: the tile kicks a little as the slash lands
  const kick = interpolate(frame, [at(62), at(66), at(76)], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });

  return (
    <div
      style={{
        position: "absolute",
        left: cx,
        top: cy,
        display: "flex",
        alignItems: "center",
        gap,
        transform: `translate(-50%, -50%) translateX(${shift}px)`,
        ...style,
      }}
    >
      <div style={{ position: "relative", width: tile, height: tile, flex: "none" }}>
        <div
          style={{
            position: "absolute",
            left: "-80%",
            top: "-80%",
            right: "-80%",
            bottom: "-80%",
            borderRadius: "50%",
            background: "radial-gradient(closest-side, rgba(46,118,255,0.55), rgba(31,107,255,0.18) 55%, transparent)",
            opacity: Math.min(1, tileIn) * (0.55 + 0.45 * flash),
            transform: `scale(${0.85 + 0.25 * flash})`,
          }}
        />
        <div
          style={{
            position: "relative",
            width: tile,
            height: tile,
            opacity: Math.min(1, tileIn * 1.6),
            transform: `scale(${(0.55 + 0.45 * tileIn) * (1 + 0.035 * kick)})`,
            filter: `drop-shadow(0 ${tile * 0.09}px ${tile * 0.22}px rgba(31,107,255,${0.45 + 0.3 * flash}))`,
          }}
        >
          <TallyMark size={tile} bars={bars} strike={strike} />
        </div>
      </div>
      <div style={{ position: "relative", flex: "none", width: wordW }}>
        {/* the word slides out from behind the tile: clipped on its left edge */}
        <div style={{ overflow: "hidden", paddingRight: 20, marginRight: -20 }}>
          <div
            style={{
              fontFamily: FONT.sans,
              fontWeight: 600,
              fontSize: wordSize,
              lineHeight: 1,
              letterSpacing: "-0.03em",
              color: C.text,
              whiteSpace: "nowrap",
              paddingBottom: wordSize * 0.12,
              marginBottom: -wordSize * 0.12,
              opacity: word,
              transform: `translateX(${(1 - word) * -wordSize * 0.9}px)`,
            }}
          >
            Tally
          </div>
        </div>
        {label ? (
          <div
            style={{
              position: "absolute",
              left: wordSize * 0.06,
              top: "100%",
              marginTop: wordSize * 0.14,
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontFamily: FONT.sans,
              fontWeight: 500,
              fontSize: wordSize * 0.2,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: C.bright,
              whiteSpace: "nowrap",
              opacity: lab,
              transform: `translateY(${(1 - lab) * 16}px)`,
            }}
          >
            <span style={{ width: 34 * lab, height: 2, borderRadius: 1, background: C.bright, boxShadow: `0 0 10px ${C.bright}` }} />
            {label}
          </div>
        ) : null}
      </div>
    </div>
  );
};
