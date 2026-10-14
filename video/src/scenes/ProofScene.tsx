import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Glass } from "../components/Glass";
import { Eyebrow } from "../components/Header";
import { TerminalFrame } from "../components/TerminalFrame";
import { EASE, enter, pop } from "../lib/anim";
import { ifStatic, useStaticText } from "../lib/assets";
import type { ProofCard, SceneDef } from "../storyboard";
import { C, FONT, PAD } from "../theme";

const MAX_LINES = 18;
const RIGHT = { left: 900, top: 120, width: 900, height: 780 };

const lineColor = (l: string) => {
  if (/^\s*\$/.test(l)) return C.bright;
  if (/^\s*(\[PASS\]|Suite result: ok|.*\b\d+ (tests )?passed\b|✓|.*\bverified\b)/i.test(l)) return C.paid;
  if (/^\s*(\[FAIL|FAIL\b|Error\b)/.test(l)) return C.blocked;
  if (/^\s*(…|\.\.\.)\s*$/.test(l)) return C.faint;
  return "#D6E2FA";
};

const Terminal: React.FC<{ name: string; text: string; height: number }> = ({ name, text, height }) => {
  const frame = useCurrentFrame();
  const lines = text.replace(/\r/g, "").split("\n").slice(0, MAX_LINES);
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  const total = lines.reduce((a, l) => a + Math.max(l.length, 1), 0);
  // type the whole file out over ~2.3 s, starting after the panel lands
  const typed = interpolate(frame, [10, 80], [0, total], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  let budget = typed;
  return (
    <TerminalFrame name={name} height={height}>
      <div style={{ padding: "18px 26px", fontFamily: FONT.mono, fontSize: 22, lineHeight: "34px", fontVariantLigatures: "none" }}>
        {lines.map((l, i) => {
          const n = Math.max(l.length, 1);
          const shown = Math.max(0, Math.min(n, Math.floor(budget)));
          const isTyping = budget > 0 && budget < n;
          budget -= n;
          if (shown === 0 && !isTyping) return null;
          const prompt = /^\s*\$/.test(l);
          const visible = l.slice(0, shown);
          return (
            <div key={i} style={{ whiteSpace: "pre", overflow: "hidden", textOverflow: "ellipsis", color: lineColor(l) }}>
              {prompt ? (
                <>
                  <span style={{ color: C.paid }}>$</span>
                  <span style={{ color: C.bright }}>{visible.replace(/^\s*\$/, "")}</span>
                </>
              ) : (
                visible || " "
              )}
              {isTyping ? <span style={{ background: C.bright, color: C.bright }}>▌</span> : null}
            </div>
          );
        })}
      </div>
    </TerminalFrame>
  );
};

const Card: React.FC<{ card: ProofCard; index: number; count: number; length: number }> = ({ card, index, count, length }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const proof = ifStatic(card.proof);
  const shot = ifStatic(card.shot);
  const text = useStaticText(proof);
  const inP = enter(frame, fps, 0, 22);
  const out = index === count - 1 ? 1 : interpolate(frame, [length - 10, length], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });
  const op = inP * out;
  const shotP = pop(frame, fps, 30);
  const hasTerm = !!(proof && text);
  return (
    <AbsoluteFill style={{ opacity: op }}>
      {/* left: sponsor + line */}
      <div style={{ position: "absolute", left: PAD, top: 470, width: 700, transform: `translateY(${(1 - inP) * 30}px)` }}>
        <div style={{ fontFamily: FONT.sans, fontWeight: 300, fontSize: 104, letterSpacing: "-0.03em", color: C.text, lineHeight: 1 }}>{card.sponsor}</div>
        <div style={{ fontFamily: FONT.sans, fontSize: 32, lineHeight: 1.38, color: C.muted, marginTop: 26, textWrap: "balance" }}>{card.line}</div>
      </div>
      {/* right: proof */}
      <div style={{ position: "absolute", ...RIGHT, transform: `translateX(${(1 - inP) * 50}px)` }}>
        {hasTerm ? (
          <Terminal name={card.proof!.replace(/^.*\//, "")} text={text!} height={RIGHT.height} />
        ) : shot ? (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Img
              src={staticFile(shot)}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                borderRadius: 28,
                boxShadow: "0 40px 100px -30px rgba(0,0,0,0.8), 0 0 0 1px rgba(194,220,255,0.18)",
                transform: `scale(${0.9 + 0.1 * shotP})`,
              }}
            />
          </div>
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Glass radius={28} style={{ width: 720, padding: "48px 52px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <span style={{ width: 16, height: 16, borderRadius: 8, background: C.paid, boxShadow: `0 0 16px ${C.paid}` }} />
                <span style={{ fontFamily: FONT.sans, fontWeight: 500, fontSize: 24, letterSpacing: "0.08em", textTransform: "uppercase", color: C.paid }}>
                  {card.sponsor}
                </span>
              </div>
              <div style={{ fontFamily: FONT.sans, fontWeight: 300, fontSize: 46, lineHeight: 1.2, letterSpacing: "-0.02em", color: C.text, marginTop: 22 }}>
                {card.line}
              </div>
            </Glass>
          </div>
        )}
        {hasTerm && shot ? (
          <Img
            src={staticFile(shot)}
            style={{
              position: "absolute",
              right: -20,
              bottom: -30,
              width: 420,
              borderRadius: 20,
              boxShadow: "0 30px 80px -20px rgba(0,0,0,0.85), 0 0 0 1px rgba(194,220,255,0.22)",
              opacity: Math.min(1, shotP * 1.4),
              transform: `rotate(-3deg) scale(${0.8 + 0.2 * shotP})`,
            }}
          />
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

/** Six sponsor proofs, evenly cycled: left the claim, right the terminal output and/or screenshot. */
export const ProofScene: React.FC<{ scene: SceneDef; cards: ProofCard[] }> = ({ scene, cards }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const each = Math.floor(durationInFrames / cards.length);
  const active = Math.min(cards.length - 1, Math.floor(frame / each));
  const h = enter(frame, fps, 0, 24);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: PAD, top: 170, opacity: h, transform: `translateY(${(1 - h) * 30}px)` }}>
        <Eyebrow text={scene.eyebrow} />
        <div style={{ fontFamily: FONT.sans, fontWeight: 300, fontSize: 84, letterSpacing: "-0.02em", color: C.text, marginTop: 24, lineHeight: 1.06 }}>
          {scene.title}
        </div>
      </div>
      {cards.map((c, i) => (
        <Sequence key={i} from={i * each} durationInFrames={i === cards.length - 1 ? durationInFrames - i * each : each} layout="none">
          <Card card={c} index={i} count={cards.length} length={each} />
        </Sequence>
      ))}
      <div style={{ position: "absolute", left: PAD, top: 860, display: "flex", gap: 14, opacity: h }}>
        {cards.map((c, i) => (
          <div
            key={i}
            style={{
              height: 10,
              width: i === active ? 56 : 10,
              borderRadius: 5,
              background: i === active ? C.bright : i < active ? "rgba(92,157,255,0.55)" : "rgba(194,220,255,0.2)",
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
