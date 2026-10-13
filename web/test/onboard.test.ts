import { describe, it, expect } from "vitest";
import { parseEther } from "viem";
import { welcomePlan } from "../lib/onboard";

const owner = "0x1111111111111111111111111111111111111111";
const agent = "0x2222222222222222222222222222222222222222";

describe("welcome plan", () => {
  it("new user gets fees for both keys and $50", () => {
    const p = welcomePlan({ owner, agent, ownerMon: 0n, agentMon: 0n, ownerUsd: 0n });
    expect(p).toEqual({ ownerMon: parseEther("0.05"), agentMon: parseEther("0.06"), usd: 50_000_000n });
  });
  it("returning user with funds gets nothing", () => {
    const p = welcomePlan({ owner, agent, ownerMon: parseEther("0.05"), agentMon: parseEther("0.06"), ownerUsd: 10n });
    expect(p).toEqual({ ownerMon: 0n, agentMon: 0n, usd: 0n });
  });
  it("only tops up the agent when it runs low", () => {
    const p = welcomePlan({ owner, agent, ownerMon: parseEther("1"), agentMon: parseEther("0.001"), ownerUsd: 5n });
    expect(p).toEqual({ ownerMon: 0n, agentMon: parseEther("0.06"), usd: 0n });
  });
  it("rejects bad addresses", () => {
    expect(() => welcomePlan({ owner: "0x12", agent, ownerMon: 0n, agentMon: 0n, ownerUsd: 0n })).toThrow(/address/);
  });
});

describe("reserve-balance window", () => {
  it("is clear only when the sponsor sent nothing in the last 3 blocks", async () => {
    const { windowClear } = await import("../lib/onboard");
    expect(windowClear(10, 10)).toBe(true);
    expect(windowClear(11, 10)).toBe(false);
  });
});
