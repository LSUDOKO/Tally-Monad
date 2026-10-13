import React from "react";
import { AbsoluteFill, interpolate, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Captions } from "./components/Captions";
import { Sky } from "./components/Sky";
import { ifStatic } from "./lib/assets";
import { Scene } from "./scenes/Scene";
import { SCENES, STORYBOARD, TOTAL_FRAMES, sceneFrames } from "./storyboard";
import { C, FADE } from "./theme";

const MUSIC = 0.1;
/** Music bed under the voice: 2 s fade-in, 3 s fade-out at the end of the film. */
const musicVolume = (f: number) =>
  interpolate(f, [0, 2 * STORYBOARD.fps, TOTAL_FRAMES - 3 * STORYBOARD.fps, TOTAL_FRAMES], [0, MUSIC, MUSIC, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/**
 * The whole film. Every scene except the last is extended by FADE frames and overlaps the next one by the same amount,
 * so each scene still starts exactly on its storyboard second. The sky sits underneath, so it drifts continuously.
 */
export const Full: React.FC = () => {
  const vo = ifStatic("audio/vo.wav");
  const music = ifStatic(STORYBOARD.music ?? "audio/music.wav");
  const timing = linearTiming({ durationInFrames: FADE });
  const presentation = fade({ shouldFadeOutExitingScene: true });
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Sky />
      <TransitionSeries>
        {SCENES.flatMap((s, i) => {
          const last = i === SCENES.length - 1;
          const seq = (
            <TransitionSeries.Sequence key={s.id} name={s.id} durationInFrames={sceneFrames(s) + (last ? 0 : FADE)}>
              <Scene scene={s} />
            </TransitionSeries.Sequence>
          );
          return last ? [seq] : [seq, <TransitionSeries.Transition key={`${s.id}-fade`} presentation={presentation} timing={timing} />];
        })}
      </TransitionSeries>
      <Captions />
      {vo ? <Audio src={staticFile(vo)} /> : null}
      {music ? <Audio src={staticFile(music)} volume={musicVolume} /> : null}
    </AbsoluteFill>
  );
};

/** One scene on its own sky, for preview. */
export const SceneOnly: React.FC<{ id: string }> = ({ id }) => {
  const s = SCENES.find((x) => x.id === id)!;
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Sky />
      <Scene scene={s} />
    </AbsoluteFill>
  );
};
