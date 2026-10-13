import raw from "../storyboard.json";

export type Stat = [string, string];
export type ProofCard = { sponsor: string; line: string; proof?: string; shot?: string };
export type Visual =
  | { kind: "story"; image: string; stats?: Stat[] }
  | { kind: "phone"; video: string; chip?: string; story?: string }
  | { kind: "gap" }
  | { kind: "proof"; cards: ProofCard[] }
  | { kind: "outro" };

export type SceneDef = {
  id: string;
  start: number;
  duration: number;
  eyebrow: string;
  title: string;
  sub: string;
  visual: Visual;
  vo?: string;
};

export const STORYBOARD = raw as unknown as {
  fps: number;
  width: number;
  height: number;
  scenes: SceneDef[];
};

export const SCENES = STORYBOARD.scenes;
export const TOTAL_FRAMES = Math.round(
  (SCENES[SCENES.length - 1].start + SCENES[SCENES.length - 1].duration) * STORYBOARD.fps,
);
export const sceneFrames = (s: SceneDef) => Math.round(s.duration * STORYBOARD.fps);
