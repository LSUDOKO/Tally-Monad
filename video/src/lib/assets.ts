import { useEffect, useState } from "react";
import { continueRender, delayRender, getStaticFiles, staticFile } from "remotion";

/** True when public/<name> exists. getStaticFiles() lists public/ at bundle time, so late assets are picked up on the next render. */
export const hasStatic = (name: string | undefined | null): boolean => {
  if (!name) return false;
  try {
    return getStaticFiles().some((f) => f.name === name);
  } catch {
    return false;
  }
};

/** `name` if it exists in public/, else null. */
export const ifStatic = (name: string | undefined | null): string | null => (name && hasStatic(name) ? name : null);

const cache = new Map<string, string>();

/** Loads a text file from public/ (blocking the render until it arrives). Returns null when missing or not loaded. */
export function useStaticText(name: string | null): string | null {
  const [text, setText] = useState<string | null>(() => (name ? (cache.get(name) ?? null) : null));
  const [handle] = useState(() => (name && !cache.has(name) ? delayRender(`load ${name}`) : null));
  useEffect(() => {
    if (!name || handle === null) return;
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        continueRender(handle);
      }
    };
    fetch(staticFile(name))
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((t) => {
        cache.set(name, t);
        setText(t);
        finish();
      })
      .catch((err) => {
        console.warn(`could not load ${name}`, err);
        finish();
      });
  }, [name, handle]);
  return text;
}
