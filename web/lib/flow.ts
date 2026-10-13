export type MenuSource = "demo" | "scan";

/** A menu lives 60 s. The demo café can be re-fetched; a real counter must be scanned again. */
export function staleRecovery(source: MenuSource) {
  return source === "demo"
    ? { label: "Get the fresh menu", refetchDemo: true }
    : { label: "Scan the counter again", refetchDemo: false };
}
