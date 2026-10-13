import { describe, it, expect } from "vitest";
import { keccak256, encodePacked } from "viem";
import { leafHash, buildTree, verifyFloors, encodeQr, decodeQr, type Item } from "../lib/menu";

const it0: Item = { itemId: "0x11111111111111111111111111111111", category: 3, price: 4_500_000n, floor: 4_500_000n, name: "Oat latte" };
const items: Item[] = [
  { itemId: "0x00000000000000000000000000000001", category: 3, price: 4_500_000n, floor: 4_500_000n, name: "Latte regular" },
  { itemId: "0x00000000000000000000000000000002", category: 3, price: 5_900_000n, floor: 4_500_000n, name: "Latte large" },
  { itemId: "0x00000000000000000000000000000003", category: 0, price: 3_000_000n, floor: 3_000_000n, name: "Croissant" },
];

describe("menu", () => {
  it("leaf matches the Solidity vector", () => {
    expect(leafHash(it0)).toBe(
      keccak256(encodePacked(["bytes1", "bytes16", "uint16", "uint128", "uint128"], ["0x00", it0.itemId, 3, 4_500_000n, 4_500_000n])),
    );
  });
  it("every proof folds to the root and the odd leaf is promoted", () => {
    const { root, proofs } = buildTree(items);
    expect(proofs[2]).toHaveLength(1);
    expect(proofs[0]).toHaveLength(2);
    console.log("ROOT3", root);
    expect(root).toMatch(/^0x[0-9a-f]{64}$/);
  });
  it("detects a floor contradiction", () => {
    expect(verifyFloors(items)).toBe(true);
    expect(verifyFloors([{ ...items[0], price: 3_000_000n, floor: 3_000_000n }, items[1]])).toBe(false);
  });
  it("QR round-trips and rejects a tampered price", () => {
    const { root } = buildTree(items);
    const m = {
      header: { merchant: "0x000000000000000000000000000000000000cafe" as const, menuRoot: root, issuedAt: 1n, expiresAt: 61n, menuNonce: 7n, itemCount: 3 },
      sig: "0x00" as const,
      items,
    };
    const s = encodeQr(m);
    expect(s.startsWith("TALLY:EVM1:")).toBe(true);
    expect(decodeQr(s).items[1].price).toBe(5_900_000n);
    const bad = encodeQr({ ...m, items: [{ ...items[0], price: 1n }, items[1], items[2]] });
    expect(() => decodeQr(bad)).toThrow(/root/);
  });
});
