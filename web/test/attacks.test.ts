import { it, expect } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import { buildAttacks } from "../lib/attacks";
import { DEMO_ITEMS, signMenu } from "../lib/counter";
import { buildTree } from "../lib/menu";

const cafe = "0x000000000000000000000000000000000000cafe" as const;
const real = privateKeyToAccount("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
const impostor = privateKeyToAccount("0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a");

it("builds four attacks, each expecting a named contract error", async () => {
  const menu = await signMenu(real, cafe, DEMO_ITEMS, 1000, 1n);
  const forged = await signMenu(impostor, cafe, DEMO_ITEMS, 1000, 2n);
  const a = buildAttacks(menu, forged);
  expect(a.map((x) => x.expect)).toEqual(["WrongSigner", "NotOnMenu", "NotOnMenu", "OwnerCosignRequired"]);
});
it("price inflation keeps the real proof but changes the price", async () => {
  const menu = await signMenu(real, cafe, DEMO_ITEMS, 1000, 1n);
  const a = buildAttacks(menu, menu)[2];
  expect(a.item.price).toBe(9_900_000n);
  expect(a.proof).toEqual(buildTree(DEMO_ITEMS).proofs[0]);
});
