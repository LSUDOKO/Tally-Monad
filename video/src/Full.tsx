import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Captions } from "./components/Captions";
import { Sky } from "./components/Sky";
import { ifStatic } from "./lib/assets";
import { Scene } from "./scenes/Scene";
import { SCENES, sceneFrames } from "./storyboard";
import { C, FADE } from "./theme";

/**
 * The whole film. Every scene except the last is extended by FADE frames and overlaps the next one by the same amount,
 * so each scene still starts exactly on its storyboard second. The sky sits underneath, so it drifts continuously.
 */
export const Full: React.FC = () => {
  const vo = ifStatic("audio/vo.wav");
  const music = ifStatic("audio/music.wav");
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
      {music ? <Audio src={staticFile(music)} volume={0.12} /> : null}
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
