import { it, expect } from "vitest";
import { localHint, guessCurrency, remittanceSaving } from "../lib/fx";

it("shows the sender's local amount as a hint", () => {
  expect(localHint(20, "INR")).toBe("≈ ₹1,770");
  expect(localHint(20, "AED")).toBe("≈ AED 73");
  expect(localHint(20, "USD")).toBe("");
});
it("guesses currency from the browser locale", () => {
  expect(guessCurrency("en-IN")).toBe("INR");
  expect(guessCurrency("ar-AE")).toBe("AED");
  expect(guessCurrency("en-GB")).toBe("GBP");
  expect(guessCurrency("xx")).toBe("USD");
});
it("compares with the 6.36% global average remittance cost", () => {
  expect(remittanceSaving(200)).toBe("$12.72");
});
