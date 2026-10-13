import { describe, it, expect } from "vitest";
import { createLimiter, createBudget } from "../lib/ratelimit";

describe("per-IP limiter", () => {
  it("allows 3 welcomes per IP per hour, then refuses until the window passes", () => {
    const allow = createLimiter(3, 3_600_000);
    expect([1, 2, 3].map(() => allow("1.2.3.4", 0))).toEqual([true, true, true]);
    expect(allow("1.2.3.4", 1000)).toBe(false);
    expect(allow("5.6.7.8", 1000)).toBe(true);
    expect(allow("1.2.3.4", 3_600_001)).toBe(true);
  });
});

describe("global budget", () => {
  it("stops spending once the hourly MON budget is used", () => {
    const spend = createBudget(100n, 3_600_000);
    expect(spend(60n, 0)).toBe(true);
    expect(spend(60n, 10)).toBe(false);
    expect(spend(40n, 20)).toBe(true);
    expect(spend(60n, 3_600_100)).toBe(true);
  });
});
