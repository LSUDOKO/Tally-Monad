import React from "react";
import { AbsoluteFill } from "remotion";
import { Film } from "./Film";
import { Sky } from "./components/Sky";
import { Scene } from "./scenes/Scene";
import { SCENES, STORYBOARD } from "./storyboard";
import { C } from "./theme";

/** The main Tally film. */
export const Full: React.FC = () => <Film board={STORYBOARD} />;

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
