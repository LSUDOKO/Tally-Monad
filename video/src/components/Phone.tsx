import React from "react";
import { Img, OffthreadVideo, staticFile } from "remotion";
import { ifStatic } from "../lib/assets";
import { C, FONT } from "../theme";

export const PHONE_W = 430;
const BEZEL = 13;
const SCREEN_W = PHONE_W - BEZEL * 2;
/** Recordings are 780×1688. */
const SCREEN_H = Math.round((SCREEN_W * 1688) / 780);
export const PHONE_H = SCREEN_H + BEZEL * 2;

/** rec/04-pay.webm -> shots/04-pay.png */
const shotFor = (video: string) => `shots/${video.replace(/^.*\//, "").replace(/\.[^.]+$/, "")}.png`;

const Placeholder: React.FC<{ label: string }> = ({ label }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: "linear-gradient(180deg, #2f7bff 0%, #0e39a8 34%, #061a55 60%, #03060f 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 24,
    }}
  >
    <Img src={staticFile("brand/mark.svg")} style={{ width: 120, height: 120, filter: "drop-shadow(0 14px 36px rgba(31,107,255,0.6))" }} />
    <div style={{ fontFamily: FONT.sans, fontWeight: 500, fontSize: 44, letterSpacing: "-0.02em", color: C.text }}>Tally</div>
    <div style={{ fontFamily: FONT.mono, fontSize: 18, color: C.muted, textAlign: "center", padding: "0 24px" }}>{label}</div>
  </div>
);

/** A black, rounded phone with a dynamic-island notch, playing the screen recording (or its screenshot, or a placeholder). */
export const Phone: React.FC<{ video: string; style?: React.CSSProperties }> = ({ video, style }) => {
  const rec = ifStatic(video);
  const shot = rec ? null : ifStatic(shotFor(video));
  return (
    <div
      style={{
        position: "absolute",
        width: PHONE_W,
        height: PHONE_H,
        borderRadius: 64,
        background: "#000",
        padding: BEZEL,
        boxShadow:
          "0 0 0 2px #1d2333, 0 0 0 3px rgba(194, 220, 255, 0.18), 0 50px 110px -20px rgba(0, 0, 0, 0.75), 0 0 120px -30px rgba(46, 118, 255, 0.55)",
        ...style,
      }}
    >
      <div style={{ position: "relative", width: SCREEN_W, height: SCREEN_H, borderRadius: 52, overflow: "hidden", background: C.ink }}>
        {rec ? (
          <OffthreadVideo src={staticFile(rec)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : shot ? (
          <Img src={staticFile(shot)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Placeholder label={video} />
        )}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: "50%",
            width: 112,
            height: 32,
            marginLeft: -56,
            borderRadius: 16,
            background: "#000",
          }}
        />
      </div>
    </div>
  );
};
