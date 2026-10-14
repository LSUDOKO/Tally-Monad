import React from "react";
import { Img, staticFile } from "remotion";
import { logoOnDark } from "../lib/assets";
import { C, FONT } from "../theme";
import { Glass } from "./Glass";

export const BADGE_H = 44;

/** The sponsor's logo, small in the top-right corner (or its name in a glass pill when the logo is missing). */
export const SponsorBadge: React.FC<{ logo?: string; name: string; opacity: number }> = ({ logo, name, opacity }) => {
  const src = logoOnDark(logo, false);
  if (opacity <= 0) return null;
  return (
    <div style={{ position: "absolute", top: 46, right: 64, height: BADGE_H, display: "flex", alignItems: "center", opacity: 0.7 * opacity }}>
      {src ? (
        <Img src={staticFile(src)} style={{ height: BADGE_H, maxWidth: 260, objectFit: "contain" }} />
      ) : (
        <Glass radius={BADGE_H / 2} style={{ height: BADGE_H, padding: "0 22px", display: "flex", alignItems: "center" }}>
          <span style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: 22, letterSpacing: "0.02em", color: C.text }}>{name}</span>
        </Glass>
      )}
    </div>
  );
};
