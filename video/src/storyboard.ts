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
  | { kind: "outro" }
  | { kind: "sponsor"; logo?: string; name: string }
  | { kind: "phones"; left: PhoneSide; right: PhoneSide }
  | { kind: "terminal"; proof: string }
  | { kind: "flow" };

export type PhoneSide = { video: string; label: string };

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

/** A storyboard JSON file: scenes plus optional audio and caption paths (relative to public/). */
export type BoardJson = {
  fps: number;
  width: number;
  height: number;
  music?: string;
  vo?: string;
  captions?: string;
  scenes: SceneDef[];
};

/** A storyboard ready to drive a <Film>: totals computed, audio and caption paths resolved. */
export type Board = BoardJson & {
  name: string;
  totalFrames: number;
  /** Music bed fades, in seconds. */
  musicFadeIn: number;
  musicFadeOut: number;
  /** Sponsor logo (from scene 0's visual.logo) shown small on every scene but the intro and outro. */
  sponsor?: { logo?: string; name: string };
};

export const sceneFramesAt = (s: SceneDef, fps: number) => Math.round(s.duration * fps);

export function makeBoard(name: string, raw: BoardJson, opts: Partial<Board> = {}): Board {
  const scenes = raw.scenes;
  const last = scenes[scenes.length - 1];
  // Every scene must start where the previous one ends, or the voice drifts from the picture.
  scenes.forEach((s, i) => {
    const prev = scenes[i - 1];
    if (prev && Math.abs(prev.start + prev.duration - s.start) > 1e-6) {
      console.warn(`${name}: ${s.id} starts at ${s.start}s, expected ${prev.start + prev.duration}s`);
    }
  });
  const v0 = scenes[0]?.visual;
  return {
    ...raw,
    name,
    totalFrames: Math.round((last.start + last.duration) * raw.fps),
    musicFadeIn: 1.5,
    musicFadeOut: 2,
    sponsor: v0?.kind === "sponsor" ? { logo: v0.logo, name: v0.name } : undefined,
    ...opts,
  };
}

/** The main Tally film: its audio and captions keep their original paths and fades. */
export const STORYBOARD = makeBoard("Tally", raw as unknown as BoardJson, {
  vo: "audio/vo.wav",
  captions: "captions.json",
  music: (raw as { music?: string }).music ?? "audio/music.wav",
  musicFadeIn: 2,
  musicFadeOut: 3,
});

export const SCENES = STORYBOARD.scenes;
export const TOTAL_FRAMES = STORYBOARD.totalFrames;
export const sceneFrames = (s: SceneDef) => sceneFramesAt(s, STORYBOARD.fps);
