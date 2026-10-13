import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Glass } from "../components/Glass";
import { Header } from "../components/Header";
import { TallyMark } from "../components/TallyMark";
import { EASE_IN_OUT, enter, pop, prog } from "../lib/anim";
import type { SceneDef } from "../storyboard";
import { C, FONT, PAD } from "../theme";

type Box = { x: number; y: number; w: number; h: number };
type Glyph = "phone" | "menu" | "agent" | "coin" | "index";

/** Layout in frame pixels. The contract is the hub, top right; everything else feeds it or flows out of it. */
const N = {
  phone: { x: PAD, y: 392, w: 440, h: 150 },
  cafe: { x: PAD, y: 706, w: 440, h: 150 },
  agent: { x: 780, y: 540, w: 400, h: 168 },
  contract: { x: 1260, y: 104, w: 540, h: 410 },
  payout: { x: 1260, y: 660, w: 260, h: 176 },
  envio: { x: 1540, y: 660, w: 260, h: 176 },
} satisfies Record<string, Box>;

const CHECKS = ["signature", "item & price", "rules", "cheapest match", "receipt", "exact payout"];

/** Moments, as fractions of the scene, matched to the narration. */
const T = {
  phone: 0.02,
  cafe: 0.16,
  agent: 0.27,
  phoneAgent: 0.3,
  cafeAgent: 0.34,
  contract: 0.42,
  agentContract: 0.45,
  checks: 0.5,
  phoneContract: 0.6,
  payout: 0.7,
  envio: 0.83,
};

const GlyphIcon: React.FC<{ g: Glyph; size?: number }> = ({ g, size = 30 }) => {
  const s = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: C.text, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (g) {
    case "phone":
      return (
        <svg {...s}>
          <rect x="6.5" y="2.5" width="11" height="19" rx="2.6" />
          <path d="M10.5 18.5h3" />
          <path d="M12 8.2a1.8 1.8 0 1 1 0 3.6a1.8 1.8 0 0 1 0-3.6zM12 11.8v2.4" stroke={C.bright} />
        </svg>
      );
    case "menu":
      return (
        <svg {...s}>
          <path d="M6 3.5h12v17l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2-2 1.2z" />
          <path d="M9 8h6M9 11.5h6M9 15h3.5" stroke={C.bright} />
        </svg>
      );
    case "agent":
      return (
        <svg {...s}>
          <rect x="4.5" y="7" width="15" height="12" rx="4" />
          <path d="M12 3.5V7" />
          <circle cx="9.5" cy="13" r="1.2" fill={C.bright} stroke="none" />
          <circle cx="14.5" cy="13" r="1.2" fill={C.bright} stroke="none" />
        </svg>
      );
    case "coin":
      return (
        <svg {...s}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M14.6 9.2c-.5-.9-1.5-1.4-2.6-1.4-1.5 0-2.6.8-2.6 2s1.1 1.7 2.6 2.1 2.7.9 2.7 2.2-1.2 2-2.7 2c-1.2 0-2.2-.5-2.7-1.4M12 6.5v11" stroke={C.paid} />
        </svg>
      );
    case "index":
      return (
        <svg {...s}>
          <ellipse cx="12" cy="6" rx="7" ry="2.6" />
          <path d="M5 6v6c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6M5 12v6c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-6" />
          <path d="M9 12.2l2 1.4 3.2-3" stroke={C.bright} />
        </svg>
      );
  }
};

const Node: React.FC<{ box: Box; at: number; glyph: Glyph; title: string; sub: string; tone?: string; lit?: number; compact?: boolean }> = ({
  box,
  at,
  glyph,
  title,
  sub,
  tone = C.bright,
  lit = 0,
  compact = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = pop(frame, fps, at);
  return (
    <div
      style={{
        position: "absolute",
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        opacity: Math.min(1, p * 1.5),
        transform: `translateY(${(1 - p) * 26}px) scale(${0.9 + 0.1 * p})`,
      }}
    >
      <Glass
        radius={26}
        style={{
          position: "absolute",
          inset: 0,
          padding: "24px 26px",
          display: "flex",
          flexDirection: compact ? "column" : "row",
          gap: compact ? 14 : 20,
          alignItems: "flex-start",
          boxShadow: `0 30px 80px -30px rgba(0,0,0,0.75), 0 0 ${50 * lit}px -10px rgba(46,118,255,${0.7 * lit})`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            flex: "none",
            width: compact ? 48 : 58,
            height: compact ? 48 : 58,
            borderRadius: 18,
            background: `linear-gradient(180deg, color-mix(in srgb, ${tone} 34%, transparent), color-mix(in srgb, ${tone} 14%, transparent))`,
            border: `1px solid color-mix(in srgb, ${tone} 55%, transparent)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <GlyphIcon g={glyph} size={compact ? 26 : 30} />
        </div>
        {compact ? <div style={{ fontFamily: FONT.sans, fontWeight: 500, fontSize: 30, letterSpacing: "-0.01em", color: C.text }}>{title}</div> : null}
        </div>
        <div style={{ minWidth: 0 }}>
          {compact ? null : <div style={{ fontFamily: FONT.sans, fontWeight: 500, fontSize: 30, letterSpacing: "-0.01em", color: C.text, lineHeight: 1.15 }}>{title}</div>}
          <div style={{ fontFamily: FONT.sans, fontWeight: 400, fontSize: 21, color: C.muted, lineHeight: 1.35, marginTop: 8 }}>{sub}</div>
        </div>
      </Glass>
    </div>
  );
};

/** A connector that draws itself in, then carries a flowing dash, with a small label at its middle. */
const Link: React.FC<{ id: string; d: string; at: number; tone?: string; label?: string; lx?: number; ly?: number; dur?: number }> = ({
  id,
  d,
  at,
  tone = C.bright,
  label,
  lx = 0,
  ly = 0,
  dur = 24,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const draw = prog(frame, at, at + dur, EASE_IN_OUT);
  const lab = enter(frame, fps, at + dur * 0.6, 18);
  if (draw <= 0) return null;
  return (
    <g>
      <defs>
        <mask id={`m-${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080">
          <path d={d} pathLength={1} fill="none" stroke="#fff" strokeWidth={14} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
        </mask>
      </defs>
      <g mask={`url(#m-${id})`}>
        <path d={d} fill="none" stroke={tone} strokeOpacity={0.28} strokeWidth={6} strokeLinecap="round" style={{ filter: `blur(4px)` }} />
        <path d={d} fill="none" stroke={tone} strokeOpacity={0.45} strokeWidth={2.5} strokeLinecap="round" />
        <path
          d={d}
          fill="none"
          stroke={tone}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeDasharray="3 16"
          strokeDashoffset={-frame * 1.1}
          style={{ filter: `drop-shadow(0 0 5px ${tone})` }}
        />
      </g>
      {label ? (
        <foreignObject x={lx - 200} y={ly - 20} width={400} height={40} style={{ overflow: "visible" }}>
          <div style={{ display: "flex", justifyContent: "center", opacity: lab, transform: `scale(${0.9 + 0.1 * lab})` }}>
            <div
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                background: "rgba(3,7,26,0.85)",
                border: `1px solid color-mix(in srgb, ${tone} 45%, transparent)`,
                fontFamily: FONT.mono,
                fontSize: 17,
                color: C.text,
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </div>
          </div>
        </foreignObject>
      ) : null}
    </g>
  );
};

/** The architecture, told in the order the narration walks it: keys, menu, agent, contract, payout, index. */
export const DiagramScene: React.FC<{ scene: SceneDef }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const len = Math.round(scene.duration * fps);
  const at = (k: keyof typeof T) => Math.round(T[k] * len);
  const c = N.contract;
  const contractLit = interpolate(frame, [at("agentContract") + 20, at("agentContract") + 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const mid = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

  // connector paths
  const pA = `M${N.phone.x + N.phone.w} ${mid(N.phone).y} C ${N.phone.x + N.phone.w + 70} ${mid(N.phone).y}, ${N.agent.x - 70} ${N.agent.y + 50}, ${N.agent.x} ${N.agent.y + 50}`;
  const cA = `M${N.cafe.x + N.cafe.w} ${mid(N.cafe).y} C ${N.cafe.x + N.cafe.w + 70} ${mid(N.cafe).y}, ${N.agent.x - 70} ${N.agent.y + N.agent.h - 50}, ${N.agent.x} ${N.agent.y + N.agent.h - 50}`;
  const aC = `M${N.agent.x + N.agent.w} ${mid(N.agent).y} C ${N.agent.x + N.agent.w + 60} ${mid(N.agent).y}, ${c.x - 70} ${c.y + c.h - 90}, ${c.x} ${c.y + c.h - 90}`;
  const phC = `M${N.phone.x + 300} ${N.phone.y} C ${N.phone.x + 300} ${c.y + 150}, ${c.x - 200} ${c.y + 110}, ${c.x} ${c.y + 110}`;
  const cP = `M${mid(N.payout).x} ${c.y + c.h} L ${mid(N.payout).x} ${N.payout.y}`;
  const cE = `M${mid(N.envio).x} ${c.y + c.h} L ${mid(N.envio).x} ${N.envio.y}`;

  const cp = pop(frame, fps, at("contract"));
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: PAD, top: 96 }}>
        <Header eyebrow={scene.eyebrow} title={scene.title} titleSize={66} width={900} />
      </div>

      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <Link id="pa" d={pA} at={at("phoneAgent")} label="capped agent key" lx={670} ly={500} />
        <Link id="ca" d={cA} at={at("cafeAgent")} label="items & prices" lx={670} ly={760} />
        <Link id="ac" d={aC} at={at("agentContract")} />
        <Link id="pc" d={phC} at={at("phoneContract")} tone={C.core} label="owner rules" lx={900} ly={238} dur={30} />
        <Link id="cp" d={cP} at={at("payout")} tone={C.paid} />
        <Link id="ce" d={cE} at={at("envio")} />
      </svg>

      <Node box={N.phone} at={at("phone")} glyph="phone" title="Phone · Mera passkey" sub="owner key + capped agent key" />
      <Node box={N.cafe} at={at("cafe")} glyph="menu" title="Café · signed menu" sub="EIP-712 + Merkle root" />
      <Node box={N.agent} at={at("agent")} glyph="agent" title="Agent · Kimi" sub="behind a context firewall · sees items & prices only" />

      {/* the hub */}
      <div
        style={{
          position: "absolute",
          left: c.x,
          top: c.y,
          width: c.w,
          height: c.h,
          opacity: Math.min(1, cp * 1.5),
          transform: `scale(${0.88 + 0.12 * cp})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 32,
            background: "linear-gradient(180deg, rgba(46,120,255,0.34), rgba(31,107,255,0.20) 45%, rgba(4,10,28,0.72))",
            border: "1px solid rgba(92,157,255,0.6)",
            boxShadow: `0 40px 110px -30px rgba(0,0,0,0.8), 0 0 ${60 + 60 * contractLit}px -10px rgba(31,107,255,${0.45 + 0.35 * contractLit}), inset 0 1px 0 rgba(232,241,255,0.35)`,
          }}
        />
        <div style={{ position: "relative", padding: "34px 38px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <TallyMark size={62} style={{ filter: "drop-shadow(0 8px 20px rgba(31,107,255,0.6))" }} />
            <div>
              <div style={{ fontFamily: FONT.sans, fontWeight: 500, fontSize: 21, letterSpacing: "0.1em", textTransform: "uppercase", color: C.core }}>On Monad</div>
              <div style={{ fontFamily: FONT.sans, fontWeight: 500, fontSize: 38, letterSpacing: "-0.02em", color: C.text, lineHeight: 1.1 }}>Tally contract</div>
            </div>
          </div>
          <div style={{ fontFamily: FONT.sans, fontWeight: 300, fontSize: 30, color: C.text, marginTop: 26 }}>
            <span style={{ fontWeight: 500 }}>10 checks</span>
            <span style={{ color: C.muted }}> · one transaction</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 20 }}>
            {CHECKS.map((k, i) => {
              const q = pop(frame, fps, at("checks") + i * 7);
              return (
                <div
                  key={k}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 16px",
                    borderRadius: 999,
                    background: "rgba(3,7,26,0.55)",
                    border: "1px solid rgba(61,189,140,0.45)",
                    fontFamily: FONT.mono,
                    fontSize: 19,
                    color: C.text,
                    opacity: Math.min(1, q * 1.5),
                    transform: `scale(${0.7 + 0.3 * q})`,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.paid} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                  {k}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Node box={N.payout} at={at("payout") + 14} glyph="coin" tone={C.paid} compact title="AUSD" sub="paid to the counter's registered payout" />
      <Node box={N.envio} at={at("envio") + 14} glyph="index" compact title="Envio" sub="HyperIndex → receipts & points" />
    </AbsoluteFill>
  );
};
