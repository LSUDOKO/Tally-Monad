import { it, expect } from "vitest";
import { staleRecovery } from "../lib/flow";

it("refetches the demo cafe's menu, but sends real counters back to the scanner", () => {
  expect(staleRecovery("demo")).toEqual({ label: "Get the fresh menu", refetchDemo: true });
  expect(staleRecovery("scan")).toEqual({ label: "Scan the counter again", refetchDemo: false });
});
