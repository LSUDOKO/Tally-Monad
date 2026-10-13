import React from "react";
import { Composition, Folder } from "remotion";
import { Full, SceneOnly } from "./Full";
import { SCENES, STORYBOARD, TOTAL_FRAMES, sceneFrames } from "./storyboard";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Tally" component={Full} durationInFrames={TOTAL_FRAMES} fps={STORYBOARD.fps} width={STORYBOARD.width} height={STORYBOARD.height} />
    <Folder name="Scenes">
      {SCENES.map((s, i) => (
        <Composition
          key={s.id}
          id={`S${String(i).padStart(2, "0")}-${s.id}`}
          component={SceneOnly}
          defaultProps={{ id: s.id }}
          durationInFrames={sceneFrames(s)}
          fps={STORYBOARD.fps}
          width={STORYBOARD.width}
          height={STORYBOARD.height}
        />
      ))}
    </Folder>
  </>
);
