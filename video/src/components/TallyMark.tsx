import React, { useId } from "react";

/** Geometry from public/brand/mark.svg (108×108 viewBox). */
const BARS = [37, 48, 59, 70];
const BAR_TOP = 34;
const BAR_LEN = 38;
const STRIKE = { x1: 29, y1: 69, x2: 78, y2: 38 };
const STRIKE_LEN = Math.hypot(STRIKE.x2 - STRIKE.x1, STRIKE.y2 - STRIKE.y1);

/**
 * The Tally mark, drawable: a cobalt rounded tile, four white tally bars and one diagonal strike.
 * `bars` holds each bar's draw progress (0..1, drawn top to bottom); `strike` draws the slash left to right.
 */
export const TallyMark: React.FC<{
  size: number;
  bars?: number[];
  strike?: number;
  style?: React.CSSProperties;
}> = ({ size, bars = [1, 1, 1, 1], strike = 1, style }) => {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 108 108" style={{ display: "block", overflow: "visible", ...style }}>
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2E78FF" />
          <stop offset=".55" stopColor="#1F6BFF" />
          <stop offset="1" stopColor="#0F4BD8" />
        </linearGradient>
        <linearGradient id={`r${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(232,241,255,0.55)" />
          <stop offset=".5" stopColor="rgba(232,241,255,0.08)" />
          <stop offset="1" stopColor="rgba(232,241,255,0.0)" />
        </linearGradient>
      </defs>
      <rect width="108" height="108" rx="30" fill={`url(#g${id})`} />
      {/* a lit rim along the top edge, like the app's glass */}
      <rect x="0.5" y="0.5" width="107" height="107" rx="29.5" fill="none" stroke={`url(#r${id})`} strokeWidth="1" />
      <g stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" fill="none">
        {BARS.map((x, i) => {
          const p = Math.max(0, Math.min(1, bars[i] ?? 0));
          if (p <= 0) return null;
          return (
            <path
              key={x}
              d={`M${x} ${BAR_TOP}v${BAR_LEN}`}
              strokeDasharray={BAR_LEN}
              strokeDashoffset={BAR_LEN * (1 - p)}
            />
          );
        })}
        {strike > 0 ? (
          <path
            d={`M${STRIKE.x1} ${STRIKE.y1}L${STRIKE.x2} ${STRIKE.y2}`}
            strokeDasharray={STRIKE_LEN}
            strokeDashoffset={STRIKE_LEN * (1 - Math.min(1, strike))}
          />
        ) : null}
      </g>
    </svg>
  );
};
