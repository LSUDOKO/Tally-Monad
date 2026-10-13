/**
 * Tally Points, as in the original app: only settled on-chain receipts count, 10 points per purchase of
 * $1 or more, and a daily streak multiplies them up to 1.5x. Nothing can be bought or transferred.
 */
const DAY = 86_400;

type Settled = { timestamp: number; price: bigint };

export function streakDays(rs: Settled[], nowSec: number): number {
  const days = new Set(rs.map((r) => Math.floor(r.timestamp / DAY)));
  let d = Math.floor(nowSec / DAY);
  if (!days.has(d)) d -= 1; // a streak survives until the end of the next day
  let n = 0;
  while (days.has(d)) {
    n++;
    d--;
  }
  return n;
}

export function multiplier(streak: number): number {
  return Math.min(1 + 0.1 * Math.max(streak - 1, 0), 1.5);
}

export function points(rs: Settled[], nowSec: number): number {
  const base = rs.filter((r) => r.price >= 1_000_000n).length * 10;
  return Math.round(base * multiplier(streakDays(rs, nowSec)));
}

export const LEVELS = [
  { name: "Starter", at: 0 },
  { name: "Bronze", at: 100 },
  { name: "Silver", at: 200 },
  { name: "Gold", at: 500 },
] as const;

export function levelFor(pts: number): { name: string; next: number | null } {
  const i = LEVELS.findLastIndex((l) => pts >= l.at);
  return { name: LEVELS[i].name, next: LEVELS[i + 1]?.at ?? null };
}
