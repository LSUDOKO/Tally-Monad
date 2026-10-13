import React, { useMemo } from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Header, LeftColumn } from "../components/Header";
import { EASE, EASE_IN_OUT, enter, prog } from "../lib/anim";
import { ifStatic, useStaticText } from "../lib/assets";
import type { EvidenceShot, SceneDef } from "../storyboard";
import { C, FONT, PAD } from "../theme";

/** The browser sits on the right ~55% of the frame; the words keep the left column. */
const BOX = { left: 800, top: 168, width: 1010 };
const CHROME = 58;
const VIEW_W = BOX.width;
const VIEW_H = Math.round((VIEW_W * 1350) / 2160);
const XF = 16; // crossfade between shots, frames

type Meta = { highlight?: { x: number; y: number; w: number; h: number }; width?: number; height?: number };

const metaFor = (file: string) => file.replace(/\.[^.]+$/, ".json");

/** One screenshot inside the viewport: a slow push toward the highlight (or a Ken Burns drift) and the drawn box. */
const Shot: React.FC<{ shot: EvidenceShot; f: number; len: number }> = ({ shot, f, len }) => {
  const { fps } = useVideoConfig();
  const src = ifStatic(shot.file);
  const raw = useStaticText(ifStatic(metaFor(shot.file)));
  const meta = useMemo<Meta | null>(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Meta;
    } catch {
      return null;
    }
  }, [raw]);

  if (!src) return <Fallback source={shot.source} f={f} />;

  const iw = meta?.width ?? 2160;
  const ih = meta?.height ?? 1350;
  const base = Math.max(VIEW_W / iw, VIEW_H / ih); // cover
  const hl = meta?.highlight;

  if (!hl) {
    // gentle Ken Burns: a slow push and a drift down the page
    const z = interpolate(f, [0, len], [1.0, 1.09]);
    const dy = interpolate(f, [0, len], [0, -Math.min(60, ih * base * z - VIEW_H)], { extrapolateRight: "clamp" });
    return (
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <Img
          src={staticFile(src)}
          style={{ position: "absolute", left: 0, top: 0, width: iw * base, height: ih * base, transformOrigin: "50% 0%", transform: `translateY(${dy}px) scale(${z})` }}
        />
      </div>
    );
  }

  // zoom to ~1.6× centred on the highlight, never showing past the page edges
  const zoomP = prog(f, 0.35 * fps, Math.min(len - 10, 3.6 * fps), EASE_IN_OUT);
  const fit = Math.min((VIEW_W * 0.82) / (hl.w * base), (VIEW_H * 0.7) / (hl.h * base));
  const zTarget = Math.max(1.15, Math.min(1.6, fit));
  const z = 1 + (zTarget - 1) * zoomP;
  const s = base * z;
  const hcx = hl.x + hl.w / 2;
  const hcy = hl.y + hl.h / 2;
  const startCx = VIEW_W / 2 / base;
  const startCy = VIEW_H / 2 / base;
  const cxImg = startCx + (hcx - startCx) * zoomP;
  const cyImg = startCy + (hcy - startCy) * zoomP;
  const clampOff = (v: number, view: number, size: number) => Math.min(0, Math.max(view - size, v));
  const ox = clampOff(VIEW_W / 2 - cxImg * s, VIEW_W, iw * s);
  const oy = clampOff(VIEW_H / 2 - cyImg * s, VIEW_H, ih * s);

  // the box draws in after ~0.6 s, then glows
  const draw = prog(f, 0.6 * fps, 0.6 * fps + 26, EASE);
  const glow = enter(f, fps, 0.6 * fps + 18, 30);
  const pad = 10;
  const bx = hl.x * s + ox - pad;
  const by = hl.y * s + oy - pad;
  const bw = hl.w * s + pad * 2;
  const bh = hl.h * s + pad * 2;
  const r = 14;
  const perim = 2 * (bw + bh) - (8 - 2 * Math.PI) * r;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <Img src={staticFile(src)} style={{ position: "absolute", left: ox, top: oy, width: iw * s, height: ih * s }} />
      {/* the rest of the page dims a touch so the highlight reads */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(3,6,15,0.2)",
          opacity: glow,
          clipPath: `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 ${by}px, ${bx}px ${by}px, ${bx}px ${by + bh}px, ${bx + bw}px ${by + bh}px, ${bx + bw}px ${by}px, 0 ${by}px)`,
        }}
      />
      <svg width={VIEW_W} height={VIEW_H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <rect
          x={bx}
          y={by}
          width={bw}
          height={bh}
          rx={r}
          fill="rgba(92,157,255,0.08)"
          fillOpacity={glow}
          stroke={C.bright}
          strokeWidth={4}
          strokeDasharray={perim}
          strokeDashoffset={perim * (1 - draw)}
          style={{ filter: `drop-shadow(0 0 ${6 + 14 * glow}px rgba(92,157,255,0.85))` }}
        />
      </svg>
    </div>
  );
};

/** No screenshot yet: a quiet page placeholder carrying the source domain. */
const Fallback: React.FC<{ source: string; f: number }> = ({ source, f }) => {
  const { fps } = useVideoConfig();
  const p = enter(f, fps, 6, 26);
  const domain = source.replace(/\/.*$/, "");
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(70% 60% at 70% 0%, rgba(92,157,255,0.16), transparent 70%), linear-gradient(180deg, #0b1533, #060c1f)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 90px",
        gap: 26,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18, opacity: p, transform: `translateY(${(1 - p) * 16}px)` }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "linear-gradient(180deg, rgba(92,157,255,0.5), rgba(31,107,255,0.3))",
            border: "1px solid rgba(92,157,255,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT.sans,
            fontWeight: 600,
            fontSize: 28,
            color: C.text,
          }}
        >
          {domain.replace(/^www\./, "")[0]?.toUpperCase()}
        </div>
        <div style={{ fontFamily: FONT.mono, fontSize: 38, color: C.text, letterSpacing: "-0.01em" }}>{domain}</div>
      </div>
      {[0.92, 0.78, 0.86, 0.55].map((w, i) => {
        const q = enter(f, fps, 14 + i * 5, 24);
        return <div key={i} style={{ height: 18, width: `${w * 100 * q}%`, borderRadius: 9, background: "rgba(194,220,255,0.10)" }} />;
      })}
      <div style={{ fontFamily: FONT.mono, fontSize: 20, color: C.faint, marginTop: 10, opacity: p }}>source · {source}</div>
    </div>
  );
};

const Lock: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.paid} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="10" rx="2.5" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

/**
 * Real web pages as receipts for a claim: each screenshot in a browser frame, one after another, with the source
 * in the URL pill. A <name>.json beside the PNG adds a zoom onto the highlighted region.
 */
export const EvidenceScene: React.FC<{ scene: SceneDef; shots: EvidenceShot[] }> = ({ scene, shots }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const len = Math.round(scene.duration * fps);
  const n = Math.max(1, shots.length);
  const each = Math.floor(len / n);
  const inP = enter(frame, fps, 6, 30);
  const active = Math.min(n - 1, Math.floor(frame / each));
  const lines = scene.title.split("\n").length;
  return (
    <AbsoluteFill>
      <LeftColumn left={PAD} width={600}>
        <Header eyebrow={scene.eyebrow} title={scene.title} sub={scene.sub} titleSize={64} subSize={27} width={600} />
        <div style={{ display: "flex", gap: 12, marginTop: 40, opacity: enter(frame, fps, 20 + lines * 6) }}>
          {shots.map((_, i) => (
            <div
              key={i}
              style={{
                height: 8,
                width: i === active ? 44 : 8,
                borderRadius: 4,
                background: i === active ? C.bright : i < active ? "rgba(92,157,255,0.55)" : "rgba(194,220,255,0.22)",
              }}
            />
          ))}
        </div>
      </LeftColumn>
      <div
        style={{
          position: "absolute",
          left: BOX.left,
          top: BOX.top,
          width: BOX.width,
          height: CHROME + VIEW_H,
          borderRadius: 22,
          overflow: "hidden",
          background: "#0A0F1E",
          boxShadow: "0 0 0 1px rgba(194,220,255,0.16), 0 50px 120px -30px rgba(0,0,0,0.85), 0 0 140px -40px rgba(46,118,255,0.55)",
          opacity: inP,
          transform: `translateX(${(1 - inP) * 60}px) scale(${0.97 + 0.03 * inP})`,
          transformOrigin: "100% 50%",
        }}
      >
        {/* chrome */}
        <div
          style={{
            height: CHROME,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 22px",
            background: "linear-gradient(180deg, #161d31, #10172a)",
            borderBottom: "1px solid rgba(194,220,255,0.08)",
          }}
        >
          {["#FF6B6B", "#FFB547", "#3DBD8C"].map((c) => (
            <span key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c, opacity: 0.85 }} />
          ))}
          <div
            style={{
              position: "relative",
              marginLeft: 28,
              flex: 1,
              maxWidth: 620,
              height: 34,
              borderRadius: 17,
              background: "rgba(3,6,15,0.65)",
              border: "1px solid rgba(194,220,255,0.10)",
            }}
          >
            {shots.map((s, i) => {
              const o =
                i === 0
                  ? interpolate(frame, [each - XF / 2, each + XF / 2], [1, n > 1 ? 0 : 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
                  : interpolate(frame, [i * each - XF / 2, i * each + XF / 2, (i + 1) * each - XF / 2, (i + 1) * each + XF / 2], [0, 1, 1, i === n - 1 ? 1 : 0], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    });
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "0 16px",
                    opacity: o,
                    fontFamily: FONT.mono,
                    fontSize: 18,
                    color: C.muted,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                  }}
                >
                  <Lock />
                  <span style={{ color: C.text }}>{s.source.replace(/\/.*$/, "")}</span>
                  <span style={{ marginLeft: -10 }}>{s.source.includes("/") ? s.source.slice(s.source.indexOf("/")) : ""}</span>
                </div>
              );
            })}
          </div>
        </div>
        {/* viewport */}
        <div style={{ position: "relative", width: VIEW_W, height: VIEW_H, overflow: "hidden", background: "#fff" }}>
          {shots.map((s, i) => {
            const from = i * each;
            const to = i === n - 1 ? len + 12 : (i + 1) * each + XF;
            if (frame < from - 1 || frame > to) return null;
            const o = i === 0 ? 1 : interpolate(frame, [from, from + XF], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });
            return (
              <div key={i} style={{ position: "absolute", inset: 0, opacity: o }}>
                <Shot shot={s} f={frame - from} len={to - from} />
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
