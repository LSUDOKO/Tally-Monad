import React from "react";
import { C } from "../theme";

/** Smoked glass with a rim lit at the top and fading at the bottom (globals.css .glass). */
export const Glass: React.FC<{
  children?: React.ReactNode;
  style?: React.CSSProperties;
  radius?: number;
  strong?: boolean;
  blur?: boolean;
}> = ({ children, style, radius = 28, strong = false, blur = true }) => (
  <div
    style={{
      position: "relative",
      borderRadius: radius,
      background: strong ? C.glassStrong : C.glass,
      backdropFilter: blur ? "blur(22px)" : undefined,
      ...style,
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: radius,
        padding: 1,
        background: "linear-gradient(180deg, rgba(194, 220, 255, 0.22), rgba(194, 220, 255, 0.06))",
        WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        pointerEvents: "none",
      }}
    />
    {children}
  </div>
);
