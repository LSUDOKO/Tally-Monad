import React from "react";
import { C, FONT } from "../theme";

/** The terminal panel: near-black glass, a traffic-light bar with the file name, then the body. */
export const TerminalFrame: React.FC<{ name: string; height: number; nameSize?: number; children: React.ReactNode }> = ({
  name,
  height,
  nameSize = 18,
  children,
}) => (
  <div
    style={{
      width: "100%",
      height,
      borderRadius: 24,
      background: C.terminal,
      border: "1px solid rgba(194, 220, 255, 0.14)",
      boxShadow: "0 40px 100px -30px rgba(0,0,0,0.8), 0 0 90px -40px rgba(46,118,255,0.6)",
      overflow: "hidden",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 22px", borderBottom: "1px solid rgba(194,220,255,0.08)" }}>
      {["#FF6B6B", "#FFB547", "#3DBD8C"].map((c) => (
        <span key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c, opacity: 0.85 }} />
      ))}
      <span style={{ fontFamily: FONT.mono, fontSize: nameSize, color: C.faint, marginLeft: 12 }}>{name}</span>
    </div>
    {children}
  </div>
);
