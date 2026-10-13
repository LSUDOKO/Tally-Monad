import { loadFont as loadInterTight } from "@remotion/google-fonts/InterTight";
import { loadFont as loadJetBrains } from "@remotion/google-fonts/JetBrainsMono";

const inter = loadInterTight("normal", { weights: ["300", "400", "500", "600"], subsets: ["latin"] });
const mono = loadJetBrains("normal", { weights: ["400", "500"], subsets: ["latin"] });

/** The Tally palette, from web/app/globals.css. */
export const C = {
  brand: "#1F6BFF",
  bright: "#5C9DFF",
  core: "#BFDBFF",
  deep: "#0A3DB8",
  ink: "#03060F",
  text: "#EEF4FF",
  muted: "#B3C2DE",
  faint: "#7F90B5",
  paid: "#3DBD8C",
  blocked: "#FF6B6B",
  needs: "#FFB547",
  glass: "rgba(4, 10, 28, 0.56)",
  glassStrong: "rgba(3, 7, 26, 0.78)",
  terminal: "#040812",
} as const;

export const FONT = {
  sans: `${inter.fontFamily}, system-ui, sans-serif`,
  mono: `${mono.fontFamily}, ui-monospace, monospace`,
};

export const W = 1920;
export const H = 1080;
export const FPS = 30;
/** Crossfade between scenes, in frames. The outgoing scene is extended by this much. */
export const FADE = 12;
/** Left text column. */
export const PAD = 120;
export const TEXT_W = 760;
