import React from "react";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Captions } from "./components/Captions";
import { Sky } from "./components/Sky";
import { SponsorBadge } from "./components/SponsorBadge";
import { ifStatic } from "./lib/assets";
import { Scene } from "./scenes/Scene";
import { type Board, sceneFramesAt } from "./storyboard";
import { C, FADE } from "./theme";

const MUSIC = 0.5;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const NO_BADGE = new Set(["sponsor", "logo", "outro"]);

/** The sponsor logo stays put across the cuts: fades in after the intro, out before the outro. */
const Badge: React.FC<{ board: Board }> = ({ board }) => {
  const frame = useCurrentFrame();
  if (!board.sponsor) return null;
  // merge back-to-back eligible scenes into runs, so the badge never dips at a cut
  const runs: [number, number][] = [];
  for (const s of board.scenes) {
    if (NO_BADGE.has(s.visual.kind)) continue;
    const a = Math.round(s.start * board.fps);
    const b = a + sceneFramesAt(s, board.fps);
    const prev = runs[runs.length - 1];
    if (prev && prev[1] === a) prev[1] = b;
    else runs.push([a, b]);
  }
  const on = runs.reduce((m, [a, b]) => Math.max(m, interpolate(frame, [a, a + FADE, b, b + FADE], [0, 1, 1, 0], clamp)), 0);
  return <SponsorBadge logo={board.sponsor.logo} name={board.sponsor.name} opacity={on} />;
};

/**
 * A whole film from a storyboard. Every scene except the last is extended by FADE frames and overlaps the next one by
 * the same amount, so each scene still starts exactly on its storyboard second. The sky sits underneath, so it drifts
 * continuously. Voice, music and captions play only when their files exist in public/.
 */
export const Film: React.FC<{ board: Board }> = ({ board }) => {
  const { fps, totalFrames: total, scenes } = board;
  const vo = ifStatic(board.vo);
  const music = ifStatic(board.music);
  const musicVolume = (f: number) =>
    interpolate(f, [0, board.musicFadeIn * fps, total - board.musicFadeOut * fps, total], [0, MUSIC, MUSIC, 0], clamp);
  const timing = linearTiming({ durationInFrames: FADE });
  const presentation = fade({ shouldFadeOutExitingScene: true });
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Sky />
      <TransitionSeries>
        {scenes.flatMap((s, i) => {
          const last = i === scenes.length - 1;
          const seq = (
            <TransitionSeries.Sequence key={s.id} name={s.id} durationInFrames={sceneFramesAt(s, fps) + (last ? 0 : FADE)}>
              <Scene scene={s} />
            </TransitionSeries.Sequence>
          );
          return last ? [seq] : [seq, <TransitionSeries.Transition key={`${s.id}-fade`} presentation={presentation} timing={timing} />];
        })}
      </TransitionSeries>
      <Badge board={board} />
      {board.captions ? <Captions src={board.captions} /> : null}
      {vo ? <Audio src={staticFile(vo)} /> : null}
      {music ? <Audio src={staticFile(music)} volume={musicVolume} /> : null}
    </AbsoluteFill>
  );
};
