import raw from "../storyboard.json";

export type Stat = [string, string];
export type ProofCard = { sponsor: string; line: string; proof?: string; shot?: string };
export type EvidenceShot = { file: string; source: string };
/** [label, caps & allowlists, Tally] — 1 = yes, 0 = no. */
export type TableRow = [string, number, number];
export type Visual =
  | { kind: "story"; image: string; stats?: Stat[]; layout?: "full" | "split"; focus?: number }
  | { kind: "phone"; video: string; chip?: string; story?: string }
  | { kind: "gap" }
  | { kind: "proof"; cards: ProofCard[] }
  | { kind: "logo" }
  | { kind: "evidence"; shots: EvidenceShot[] }
  | { kind: "table"; rows: TableRow[]; cols: [string, string] }
  | { kind: "diagram" }
  | { kind: "monad"; stats: Stat[] }
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
  music?: string;
  scenes: SceneDef[];
};

export const SCENES = STORYBOARD.scenes;
/** Total length in seconds: the last scene's start plus its duration (starts are cumulative). */
export const TOTAL_SECONDS = SCENES[SCENES.length - 1].start + SCENES[SCENES.length - 1].duration;
export const TOTAL_FRAMES = Math.round(TOTAL_SECONDS * STORYBOARD.fps);
export const sceneFrames = (s: SceneDef) => Math.round(s.duration * STORYBOARD.fps);

// Every scene must start where the previous one ends, or the voice drifts from the picture.
SCENES.forEach((s, i) => {
  const prev = SCENES[i - 1];
  if (prev && Math.abs(prev.start + prev.duration - s.start) > 1e-6) {
    console.warn(`storyboard: ${s.id} starts at ${s.start}s, expected ${prev.start + prev.duration}s`);
  }
});
