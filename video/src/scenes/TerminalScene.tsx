import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Header, LeftColumn } from "../components/Header";
import { TerminalFrame } from "../components/TerminalFrame";
import { ifStatic, useStaticText } from "../lib/assets";
import type { SceneDef } from "../storyboard";
import { C, FONT, H, PAD } from "../theme";

const PANEL = { left: 720, width: 1090, height: 770 };
const FONT_SIZE = 24;
const LINE_H = 37;
const BAR_H = 47;
const BODY_PAD = 22;
const VISIBLE = Math.floor((PANEL.height - BAR_H - BODY_PAD * 2) / LINE_H);
/** An output line lands whole, worth this many typed characters. */
const OUTPUT_COST = 5;
const TEXT_W = 540;

const isPrompt = (l: string) => /^\s*\$/.test(l);
const isComment = (l: string) => /^\s*(#|\/\/)/.test(l);
const isGood = (l: string) => /status\s+1\s+\(success\)|success|passed|exact_match|✓/i.test(l);
const isBad = (l: string) => /^\s*(\[FAIL|FAIL\b|Error\b)|\berror\b.*\b(code|status)\b/i.test(l);

const lineColor = (l: string) => {
  if (isPrompt(l)) return C.bright;
  if (isComment(l)) return C.faint;
  if (isGood(l)) return C.paid;
  if (isBad(l)) return C.blocked;
  if (/^\s*(…|\.\.\.)\s*$/.test(l)) return C.faint;
  return "#D6E2FA";
};

/**
 * Left the header; right a large terminal that types the proof file out over the first ~45% of the scene, then holds.
 * Commands type character by character, output lines land whole; the view scrolls to keep the newest line in sight.
 */
export const TerminalScene: React.FC<{ scene: SceneDef; proof: string }> = ({ scene, proof }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const file = ifStatic(proof);
  const loaded = useStaticText(file);
  const name = proof.replace(/^.*\//, "");
  const text = loaded ?? `$ cat ${proof}\n# output pending`;
  const lines = text.replace(/\r/g, "").split("\n");
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();

  const cost = (l: string) => (isPrompt(l) ? Math.max(l.length, 1) : OUTPUT_COST);
  const total = lines.reduce((a, l) => a + cost(l), 0);
  const end = Math.max(30, Math.round(durationInFrames * 0.45));
  let budget = interpolate(frame, [12, end], [0, total], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  type Row = { text: string; color: string; typing: boolean; prompt: boolean };
  const rows: Row[] = [];
  for (const l of lines) {
    if (budget <= 0) break;
    const c = cost(l);
    if (isPrompt(l)) {
      const shown = Math.min(l.length, Math.floor(budget));
      rows.push({ text: l.slice(0, shown), color: lineColor(l), typing: budget < c, prompt: true });
    } else {
      rows.push({ text: l, color: lineColor(l), typing: false, prompt: false });
    }
    budget -= c;
  }
  const done = rows.length === lines.length && !rows[rows.length - 1]?.typing;
  const view = rows.slice(Math.max(0, rows.length - VISIBLE));
  const blink = Math.floor(frame / 16) % 2 === 0;

  const p = spring({ frame: frame - 2, fps, config: { damping: 18, stiffness: 90 } });
  const top = (H - PANEL.height) / 2;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: PANEL.left,
          top,
          width: PANEL.width,
          opacity: Math.min(1, p * 1.3),
          transform: `translateX(${(1 - p) * 60}px) scale(${0.97 + 0.03 * p})`,
        }}
      >
        <TerminalFrame name={name} height={PANEL.height} nameSize={20}>
          <div
            style={{
              padding: `${BODY_PAD}px 30px`,
              fontFamily: FONT.mono,
              fontSize: FONT_SIZE,
              lineHeight: `${LINE_H}px`,
              fontVariantLigatures: "none",
            }}
          >
            {view.map((r, i) => (
              <div key={i} style={{ whiteSpace: "pre", overflow: "hidden", textOverflow: "ellipsis", color: r.color }}>
                {r.prompt ? (
                  <>
                    <span style={{ color: C.paid }}>$</span>
                    {r.text.replace(/^\s*\$/, "")}
                  </>
                ) : (
                  r.text || " "
                )}
                {r.typing ? <span style={{ background: C.bright, color: C.bright }}>▌</span> : null}
              </div>
            ))}
            {done && blink ? <span style={{ background: C.bright, color: C.bright }}>▌</span> : null}
          </div>
        </TerminalFrame>
      </div>
      <LeftColumn left={PAD} width={TEXT_W}>
        <Header eyebrow={scene.eyebrow} title={scene.title} sub={scene.sub} titleSize={68} subSize={28} width={TEXT_W} />
      </LeftColumn>
    </AbsoluteFill>
  );
};
