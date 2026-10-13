import { isAddress, parseEther } from "viem";

const OWNER_FLOAT = parseEther("0.05");
const AGENT_FLOAT = parseEther("0.08");
const LOW = parseEther("0.01");
const WELCOME_USD = 50_000_000n; // $50 test AUSD

/** What the sponsor wallet sends a user so they never see fees or a faucet. */
export function welcomePlan(s: { owner: string; agent: string; ownerMon: bigint; agentMon: bigint; ownerUsd: bigint }) {
  if (!isAddress(s.owner) || !isAddress(s.agent)) throw new Error("bad address");
  const isNew = s.ownerMon < LOW && s.ownerUsd === 0n;
  return {
    ownerMon: s.ownerMon < LOW ? OWNER_FLOAT : 0n,
    agentMon: s.agentMon < LOW ? AGENT_FLOAT : 0n,
    usd: isNew ? WELCOME_USD : 0n,
  };
}

/** Monad reserve balance: below 10 MON, a sender gets one value-moving tx per 3-block window. */
export const RESERVE_WINDOW_BLOCKS = 3n;
export const windowClear = (nonceNow: number, nonceKBlocksAgo: number) => nonceNow === nonceKBlocksAgo;
