import React from "react";
import type { SceneDef } from "../storyboard";
import { GapScene } from "./GapScene";
import { OutroScene } from "./OutroScene";
import { PhoneScene } from "./PhoneScene";
import { ProofScene } from "./ProofScene";
import { StoryScene } from "./StoryScene";

/** Picks the layout from the storyboard's visual.kind. */
export const Scene: React.FC<{ scene: SceneDef }> = ({ scene }) => {
  const v = scene.visual;
  switch (v.kind) {
    case "story":
      return <StoryScene scene={scene} image={v.image} stats={v.stats} layout={v.layout} focus={v.focus} />;
    case "phone":
      return <PhoneScene scene={scene} video={v.video} chip={v.chip} story={v.story} />;
    case "gap":
      return <GapScene scene={scene} />;
    case "proof":
      return <ProofScene scene={scene} cards={v.cards} />;
    case "outro":
      return <OutroScene scene={scene} />;
  }
};
