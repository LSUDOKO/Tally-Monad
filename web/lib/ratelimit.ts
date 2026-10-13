/** Sliding-window limiter, per key. In memory: it guards one serverless instance, which is enough for a demo. */
export function createLimiter(max: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return (key: string, now = Date.now()) => {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.set(key, recent);
    return true;
  };
}

/** Caps how much the sponsor can give away per window, whoever asks. */
export function createBudget(max: bigint, windowMs: number) {
  let spent: { at: number; amount: bigint }[] = [];
  return (amount: bigint, now = Date.now()) => {
    spent = spent.filter((s) => now - s.at < windowMs);
    const used = spent.reduce((a, s) => a + s.amount, 0n);
    if (used + amount > max) return false;
    spent.push({ at: now, amount });
    return true;
  };
}
