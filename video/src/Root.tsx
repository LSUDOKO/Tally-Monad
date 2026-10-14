import React from "react";
import { Composition, Folder } from "remotion";
import { Film } from "./Film";
import { Full, SceneOnly } from "./Full";
import { BOARDS } from "./boards";
import { SCENES, STORYBOARD, TOTAL_FRAMES, sceneFrames } from "./storyboard";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Tally" component={Full} durationInFrames={TOTAL_FRAMES} fps={STORYBOARD.fps} width={STORYBOARD.width} height={STORYBOARD.height} />
    {BOARDS.filter((b) => b.name !== "Tally").map((b) => (
      <Composition
        key={b.name}
        id={b.name}
        component={Film}
        defaultProps={{ board: b }}
        durationInFrames={b.totalFrames}
        fps={b.fps}
        width={b.width}
        height={b.height}
      />
    ))}
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
