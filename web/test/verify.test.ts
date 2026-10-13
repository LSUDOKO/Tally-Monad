import { it, expect } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import { signMenu, DEMO_ITEMS } from "../lib/counter";
import { signedBy } from "../lib/verify";

const a = privateKeyToAccount("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
const b = privateKeyToAccount("0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a");

it("accepts a menu signed by the counter's registered key", async () => {
  const m = await signMenu(a, "0x000000000000000000000000000000000000cafe", DEMO_ITEMS, 1000, 1n);
  expect(await signedBy(m, a.address)).toBe(true);
});
it("rejects a menu signed by anyone else", async () => {
  const m = await signMenu(b, "0x000000000000000000000000000000000000cafe", DEMO_ITEMS, 1000, 1n);
  expect(await signedBy(m, a.address)).toBe(false);
});
it("rejects a garbage signature without throwing", async () => {
  const m = await signMenu(a, "0x000000000000000000000000000000000000cafe", DEMO_ITEMS, 1000, 1n);
  expect(await signedBy({ ...m, sig: "0x1234" }, a.address)).toBe(false);
});
