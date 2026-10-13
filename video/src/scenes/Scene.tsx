import React from "react";
import type { SceneDef } from "../storyboard";
import { DiagramScene } from "./DiagramScene";
import { EvidenceScene } from "./EvidenceScene";
import { GapScene } from "./GapScene";
import { LogoScene } from "./LogoScene";
import { MonadScene } from "./MonadScene";
import { OutroScene } from "./OutroScene";
import { PhoneScene } from "./PhoneScene";
import { ProofScene } from "./ProofScene";
import { StoryScene } from "./StoryScene";
import { TableScene } from "./TableScene";

/** Picks the layout from the storyboard's visual.kind. */
export const Scene: React.FC<{ scene: SceneDef }> = ({ scene }) => {
  const v = scene.visual;
  switch (v.kind) {
    case "logo":
      return <LogoScene scene={scene} />;
    case "evidence":
      return <EvidenceScene scene={scene} shots={v.shots} />;
    case "table":
      return <TableScene scene={scene} rows={v.rows} cols={v.cols} />;
    case "diagram":
      return <DiagramScene scene={scene} />;
    case "monad":
      return <MonadScene scene={scene} stats={v.stats} />;
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
