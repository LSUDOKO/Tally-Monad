import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { ifStatic, useStaticText } from "../lib/assets";
import { C, FONT } from "../theme";
import { Glass } from "./Glass";

type Cue = { start: number; end: number; text: string };

/** Bottom-center caption from public/captions.json ({start, end, text} in seconds). Renders nothing when the file is missing. */
export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const raw = useStaticText(ifStatic("captions.json"));
  const cues = useMemo<Cue[]>(() => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as Cue[]) : [];
    } catch {
      return [];
    }
  }, [raw]);
  const t = frame / fps;
  const cue = cues.find((c) => t >= c.start && t < c.end);
  if (!cue) return null;
  const fadeIn = Math.min(1, (t - cue.start) / 0.15);
  const fadeOut = Math.min(1, (cue.end - t) / 0.15);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 70, display: "flex", justifyContent: "center", opacity: Math.min(fadeIn, fadeOut) }}>
      <Glass strong radius={26} style={{ maxWidth: 1240, padding: "16px 34px" }}>
        <div
          style={{
            fontFamily: FONT.sans,
            fontWeight: 500,
            fontSize: 32,
            lineHeight: 1.3,
            color: C.text,
            textAlign: "center",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {cue.text}
        </div>
      </Glass>
    </div>
  );
};
