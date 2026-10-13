import { it, expect, describe } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import { recoverTypedDataAddress } from "viem";
import { signMenu, DEMO_ITEMS } from "../lib/counter";
import { menuTypes, tallyDomain, verifyFloors, decodeQr, encodeQr } from "../lib/menu";

const acct = privateKeyToAccount("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
const cafe = "0x000000000000000000000000000000000000cafe" as const;

describe("counter", () => {
  it("demo menu has honest floors and the regular latte is the cheapest coffee", () => {
    expect(verifyFloors(DEMO_ITEMS)).toBe(true);
    const coffee = DEMO_ITEMS.filter((i) => i.category === 3);
    expect(coffee[0].price).toBe(coffee[0].floor);
  });
  it("back-dates issuedAt by 5 s with a 60 s window and a recoverable signature", async () => {
    const m = await signMenu(acct, cafe, DEMO_ITEMS, 1000, 1n);
    expect(m.header.issuedAt).toBe(995n);
    expect(m.header.expiresAt).toBe(1055n);
    const who = await recoverTypedDataAddress({ domain: tallyDomain(), types: menuTypes, primaryType: "Menu", message: m.header, signature: m.sig });
    expect(who).toBe(acct.address);
  });
  it("signed menu survives the QR round trip", async () => {
    const m = await signMenu(acct, cafe, DEMO_ITEMS, 1000, 1n);
    expect(decodeQr(encodeQr(m)).header.menuRoot).toBe(m.header.menuRoot);
  });
  it("refuses to sign a floor-inconsistent menu", async () => {
    await expect(signMenu(acct, cafe, [{ ...DEMO_ITEMS[1], floor: 1n }], 1000, 1n)).rejects.toThrow(/floor/);
  });
});
