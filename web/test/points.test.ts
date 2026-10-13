import { describe, it, expect } from "vitest";
import { points, levelFor, streakDays } from "../lib/points";

const day = 86_400;
const r = (t: number, price = 4_500_000n) => ({ timestamp: t, price });

describe("Tally points", () => {
  it("10 points per settled purchase of $1 or more", () => {
    expect(points([r(0), r(100), r(200, 500_000n)], 200)).toBe(20);
  });
  it("counts consecutive days with a purchase, ending today or yesterday", () => {
    expect(streakDays([r(0), r(day), r(2 * day + 10)], 2 * day + 20)).toBe(3);
    expect(streakDays([r(0)], 5 * day)).toBe(0);
  });
  it("streak multiplies up to 1.5x", () => {
    const many = Array.from({ length: 10 }, (_, i) => r(i * day));
    expect(points(many, 9 * day)).toBe(150);
  });
  it("levels: Starter, Bronze at 100, Silver at 200, Gold at 500", () => {
    expect(levelFor(0).name).toBe("Starter");
    expect(levelFor(136)).toMatchObject({ name: "Bronze", next: 200 });
    expect(levelFor(510).name).toBe("Gold");
  });
});
