import { Easing, interpolate, spring } from "remotion";

/** Brand ease: fast out, long settle. Matches the app's cubic-bezier(0.16,1,0.3,1). */
export const EASE = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0..1 progress between two frames, eased. */
export const prog = (frame: number, start: number, end: number, easing: (t: number) => number = EASE) =>
  interpolate(frame, [start, end], [0, 1], { ...clamp, easing });

/** Smooth, no-overshoot entrance spring that starts at `delay`. */
export const enter = (frame: number, fps: number, delay = 0, durationInFrames = 24) =>
  spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames });

/** A playful pop with a little overshoot (mascot, chips, checks). */
export const pop = (frame: number, fps: number, delay = 0) =>
  spring({ frame: frame - delay, fps, config: { damping: 11, stiffness: 140, mass: 0.8 } });
