import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

/** The app's sky: cobalt falling into night, with three slow-drifting light pools. */
export const Sky: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const a = Math.sin(t * 0.13) * 7;
  const b = Math.cos(t * 0.09) * 4;
  const c = Math.sin(t * 0.07 + 1.3) * 8;
  return (
    <AbsoluteFill
      style={{
        background: [
          `radial-gradient(70% 45% at ${66 + a}% ${2 + b}%, rgba(168, 204, 255, 0.5), transparent 70%)`,
          `radial-gradient(60% 70% at ${-4 + c}% 52%, rgba(2, 6, 17, 0.6), transparent 70%)`,
          `radial-gradient(80% 45% at ${50 - a}% 112%, rgba(10, 61, 184, 0.45), transparent 70%)`,
          "linear-gradient(180deg, #2f7bff 0%, #1c5feb 15%, #0e39a8 34%, #061a55 52%, #040c2b 74%, #03060f 100%)",
        ].join(", "),
      }}
    />
  );
};
