import { it, expect, describe } from "vitest";
import { rulesFromForm, CATEGORIES, describeRules, todayUsage } from "../lib/tally";

describe("rules", () => {
  it("builds a bitmap and 6-decimal caps", () => {
    const r = rulesFromForm({ categories: [CATEGORIES.coffee, CATEGORIES.food], perPurchase: 10, daily: 25, days: 30, nowSec: 1000 });
    expect(r.categories).toBe((1n << 3n) | 1n);
    expect(r.perTxCap).toBe(10_000_000n);
    expect(r.dailyCap).toBe(25_000_000n);
    expect(r.expiry).toBe(1000n + 30n * 86400n);
    expect(r.minMerchantBond).toBe(50_000_000n);
    expect(r.allowExtended).toBe(false);
  });
  it("rejects a per-purchase limit above the daily one", () => {
    expect(() => rulesFromForm({ categories: [3], perPurchase: 30, daily: 25, days: 30, nowSec: 0 })).toThrow(/per purchase/i);
  });
  it("rejects an empty category list", () => {
    expect(() => rulesFromForm({ categories: [], perPurchase: 5, daily: 25, days: 30, nowSec: 0 })).toThrow(/at least one/i);
  });
  it("describes rules in plain words for the family", () => {
    const r = rulesFromForm({ categories: [CATEGORIES.coffee, CATEGORIES.food], perPurchase: 10, daily: 25, days: 30, nowSec: 0 });
    expect(describeRules(r)).toBe("Food and coffee, up to $10.00 a purchase and $25.00 a day");
  });
  it("today's usage resets after 24 hours", () => {
    expect(todayUsage({ spentInCycle: 9_000_000n, cycleStart: 100n }, 200n)).toBe(9_000_000n);
    expect(todayUsage({ spentInCycle: 9_000_000n, cycleStart: 100n }, 100n + 86_400n)).toBe(0n);
  });
});
