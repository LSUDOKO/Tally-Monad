import agora from "../storyboards/agora.json";
import envio from "../storyboards/envio.json";
import mera from "../storyboards/mera.json";
import ad from "../storyboards/ad.json";
import { type Board, type BoardJson, STORYBOARD, makeBoard } from "./storyboard";

/** Every film, keyed by composition id. */
export const BOARDS: Board[] = [
  STORYBOARD,
  makeBoard("Agora", agora as unknown as BoardJson),
  makeBoard("Envio", envio as unknown as BoardJson),
  makeBoard("Mera", mera as unknown as BoardJson),
  makeBoard("Ad", ad as unknown as BoardJson),
];
