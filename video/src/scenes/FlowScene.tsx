import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Header } from "../components/Header";
import { TallyMark } from "../components/TallyMark";
import { EASE, EASE_IN_OUT } from "../lib/anim";
import { ifStatic } from "../lib/assets";
import type { SceneDef } from "../storyboard";
import { C, FONT, PAD, W } from "../theme";

type Glyph = "phone" | "block" | "stream" | "code" | "graphql" | "receipt";
type Node = { title: string; detail: string; glyph: Glyph; corner?: "tally" | "envio" };

const NODES: Node[] = [
  { title: "Tally app", detail: "pay $4.50", glyph: "phone", corner: "tally" },
  { title: "Monad", detail: "block + tx", glyph: "block" },
  { title: "HyperSync", detail: "streams the block", glyph: "stream", corner: "envio" },
  { title: "HyperIndex handler", detail: "Paid → Payment", glyph: "code", corner: "envio" },
  { title: "GraphQL", detail: "hosted on Envio Cloud", glyph: "graphql", corner: "envio" },
  { title: "Tally app", detail: "Receipts", glyph: "receipt", corner: "tally" },
];

const TILE = 136;
const SPAN = (W - PAD * 2) / NODES.length;
const CY = 610;
const LINK_PAD = 18;
const LINK_LEN = SPAN - TILE - LINK_PAD * 2;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const cx = (i: number) => PAD + SPAN * (i + 0.5);

/** Line glyphs on a 48×48 grid, drawn in currentColor. */
const GlyphSvg: React.FC<{ glyph: Glyph; size: number }> = ({ glyph, size }) => {
  const s = { fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ display: "block" }}>
      {glyph === "phone" ? (
        <g {...s}>
          <rect x="13" y="5" width="22" height="38" rx="5" />
          <path d="M21 9.5h6" />
          <path d="M27.5 19.5c-.8-1.4-2.2-2-3.6-2-2 0-3.4 1-3.4 2.6 0 3.6 7.2 1.8 7.2 5.6 0 1.7-1.6 2.8-3.7 2.8-1.6 0-3-.7-3.8-2M24 15.5v2M24 28.5v2" />
        </g>
      ) : glyph === "block" ? (
        <g {...s}>
          <path d="M24 5 40 14v20L24 43 8 34V14Z" />
          <path d="M8 14l16 9 16-9M24 23v20" />
        </g>
      ) : glyph === "stream" ? (
        <g {...s}>
          <path d="M5 15c6-5 10 5 16 0s10 5 16 0" />
          <path d="M5 24c6-5 10 5 16 0s10 5 16 0" />
          <path d="M5 33c6-5 10 5 16 0s10 5 16 0" />
          <path d="M39 12l5 3-5 3M39 21l5 3-5 3M39 30l5 3-5 3" />
        </g>
      ) : glyph === "code" ? (
        <g {...s}>
          <path d="M16 10c-4 0-5 2-5 5v4c0 2-1 4-4 5 3 1 4 3 4 5v4c0 3 1 5 5 5M32 10c4 0 5 2 5 5v4c0 2 1 4 4 5-3 1-4 3-4 5v4c0 3-1 5-5 5" />
          <path d="M19 24h10M25 20l4 4-4 4" />
        </g>
      ) : glyph === "graphql" ? (
        <g {...s}>
          <path d="M24 5 40.5 14.5v19L24 43 7.5 33.5v-19Z" />
          <path d="M24 5 40.5 33.5h-33Z" />
          {[
            [24, 5],
            [40.5, 14.5],
            [40.5, 33.5],
            [24, 43],
            [7.5, 33.5],
            [7.5, 14.5],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="currentColor" stroke="none" />
          ))}
        </g>
      ) : (
        <g {...s}>
          <path d="M11 5h26v38l-4.3-3-4.4 3-4.3-3-4.3 3-4.4-3L11 43Z" />
          <path d="M17 15h14M17 22h14M17 29h8" />
          <path d="M28 30l2.2 2.2L35 27" stroke={C.paid} />
        </g>
      )}
    </svg>
  );
};

const Corner: React.FC<{ kind: "tally" | "envio"; on: number }> = ({ kind, on }) => {
  const envio = ifStatic("logos/envio.svg") ?? ifStatic("logos/envio.png");
  const base: React.CSSProperties = {
    position: "absolute",
    top: -14,
    right: -14,
    opacity: on,
    transform: `scale(${0.6 + 0.4 * on})`,
  };
  if (kind === "tally") {
    return (
      <div style={{ ...base, filter: "drop-shadow(0 6px 14px rgba(31,107,255,0.6))" }}>
        <TallyMark size={38} />
      </div>
    );
  }
  return (
    <div
      style={{
        ...base,
        height: 38,
        minWidth: 38,
        padding: envio ? "0 8px" : "0 12px",
        borderRadius: 19,
        background: C.glassStrong,
        border: "1px solid rgba(194,220,255,0.22)",
        boxShadow: "0 8px 20px -6px rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {envio ? (
        <Img src={staticFile(envio)} style={{ height: 24, maxWidth: 90, objectFit: "contain" }} />
      ) : (
        <span style={{ fontFamily: FONT.mono, fontWeight: 500, fontSize: 16, color: C.core, letterSpacing: "0.02em" }}>envio</span>
      )}
    </div>
  );
};

/** A dashed link between two nodes: dim until its turn, then lit left to right with a packet riding the front. */
const Link: React.FC<{ i: number; from: number; to: number }> = ({ i, from, to }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [from, to], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const x = cx(i) + TILE / 2 + LINK_PAD;
  // once the link is lit, packets keep flowing along it
  const period = 42;
  const loop = frame > to ? ((frame - to + i * 9) % period) / period : -1;
  const packet = p > 0 && p < 1 ? p : loop >= 0 ? loop : -1;
  const flow = -frame * 1.4;
  return (
    <div style={{ position: "absolute", left: x, top: CY - 10, width: LINK_LEN, height: 20 }}>
      <svg width={LINK_LEN} height={20} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <line x1={0} y1={10} x2={LINK_LEN} y2={10} stroke="rgba(194,220,255,0.18)" strokeWidth={2.5} strokeDasharray="6 8" strokeLinecap="round" />
        {p > 0 ? (
          <line
            x1={0}
            y1={10}
            x2={LINK_LEN * p}
            y2={10}
            stroke={C.bright}
            strokeWidth={3}
            strokeDasharray="6 8"
            strokeDashoffset={flow}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${C.brand})` }}
          />
        ) : null}
        {p >= 1 ? <path d={`M${LINK_LEN - 9} 3l8 7-8 7`} fill="none" stroke={C.bright} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" /> : null}
      </svg>
      {packet >= 0 ? (
        <div
          style={{
            position: "absolute",
            left: LINK_LEN * packet - 7,
            top: 3,
            width: 14,
            height: 14,
            borderRadius: 7,
            background: C.core,
            boxShadow: `0 0 0 4px rgba(92,157,255,0.25), 0 0 18px 4px ${C.bright}`,
            opacity: loop >= 0 && p >= 1 ? Math.min(1, Math.sin(Math.PI * packet) * 1.6) : 1,
          }}
        />
      ) : null}
    </div>
  );
};

const NodeView: React.FC<{ node: Node; i: number; at: number }> = ({ node, i, at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const appear = spring({ frame: frame - 6 - i * 4, fps, config: { damping: 200 }, durationInFrames: 20 });
  const lit = spring({ frame: frame - at, fps, config: { damping: 12, stiffness: 140, mass: 0.8 } });
  const on = Math.min(1, lit);
  const glow = interpolate(frame, [at, at + 8, at + 40], [0, 1, 0.45], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: cx(i) - SPAN / 2,
        top: CY - TILE / 2,
        width: SPAN,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        opacity: appear,
        transform: `translateY(${(1 - appear) * 24}px)`,
      }}
    >
      <div
        style={{
          position: "relative",
          width: TILE,
          height: TILE,
          borderRadius: 38,
          transform: `scale(${0.92 + 0.08 * lit})`,
          background: `linear-gradient(180deg, rgba(31,107,255,${0.12 + 0.3 * on}), rgba(4,10,28,${0.7 - 0.2 * on}))`,
          boxShadow: `0 0 0 1px rgba(${on > 0.5 ? "92,157,255" : "194,220,255"},${0.16 + 0.5 * on}), 0 24px 60px -20px rgba(0,0,0,0.7), 0 0 ${30 + 50 * glow}px ${-6 + 6 * glow}px rgba(31,107,255,${0.7 * on})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: on > 0.5 ? C.text : C.faint,
        }}
      >
        <div style={{ opacity: 0.45 + 0.55 * on }}>
          <GlyphSvg glyph={node.glyph} size={64} />
        </div>
        {node.corner ? <Corner kind={node.corner} on={on} /> : null}
      </div>
      <div
        style={{
          marginTop: 28,
          fontFamily: FONT.sans,
          fontWeight: 500,
          fontSize: 28,
          lineHeight: 1.15,
          letterSpacing: "-0.01em",
          color: C.text,
          textAlign: "center",
          opacity: 0.45 + 0.55 * on,
          textWrap: "balance",
          maxWidth: SPAN - 24,
        }}
      >
        {node.title}
      </div>
      <div
        style={{
          marginTop: 10,
          fontFamily: FONT.mono,
          fontSize: 21,
          lineHeight: 1.3,
          color: on > 0.5 ? C.core : C.faint,
          textAlign: "center",
          opacity: 0.4 + 0.6 * on,
          maxWidth: SPAN - 20,
        }}
      >
        {node.detail}
      </div>
    </div>
  );
};

/** Envio end to end: six nodes across the frame light up in turn, a packet riding each link from the tap to the receipt. */
export const FlowScene: React.FC<{ scene: SceneDef }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const first = 26;
  const last = Math.round(durationInFrames * 0.78);
  const step = (last - first) / (NODES.length - 1);
  const at = (i: number) => Math.round(first + i * step);
  // a faint rail under the whole pipeline, brightening as the data moves along it
  const rail = interpolate(frame, [first, last], [0, 1], { ...clamp, easing: EASE });
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: PAD, top: 128 }}>
        <Header eyebrow={scene.eyebrow} title={scene.title} sub={scene.sub} width={1300} />
      </div>
      <div
        style={{
          position: "absolute",
          left: PAD,
          top: CY - 130,
          width: (W - PAD * 2) * rail,
          height: 260,
          background: "radial-gradient(50% 50% at 50% 50%, rgba(31,107,255,0.16), transparent 75%)",
          filter: "blur(10px)",
        }}
      />
      {NODES.slice(0, -1).map((_, i) => (
        <Link key={i} i={i} from={at(i) + 4} to={at(i + 1)} />
      ))}
      {NODES.map((n, i) => (
        <NodeView key={i} node={n} i={i} at={at(i)} />
      ))}
    </AbsoluteFill>
  );
};
