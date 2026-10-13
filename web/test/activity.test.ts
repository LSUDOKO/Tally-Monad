import { describe, it, expect } from "vitest";
import { fromEnvio, mergeReceipts, type Receipt } from "../lib/activity";

const row = {
  id: "0xabc-1",
  capsuleId: "7",
  merchant: "0x00000000000000000000000000000000000000ca",
  itemId: "0x00000000000000000000000000000001",
  category: 3,
  price: "4500000",
  cosigned: false,
  receipt: "0x" + "11".repeat(32),
  txHash: "0xabc",
  timestamp: 1700000000,
};

describe("activity", () => {
  it("maps an Envio row to a receipt with bigints", () => {
    const r = fromEnvio(row);
    expect(r.capsuleId).toBe(7n);
    expect(r.price).toBe(4_500_000n);
    expect(r.txHash).toBe("0xabc");
  });
  it("merges local and indexed receipts, newest first, without duplicates", () => {
    const a = fromEnvio(row);
    const b: Receipt = { ...a, txHash: "0xdef", timestamp: 1700000100 };
    const merged = mergeReceipts([a], [a, b]);
    expect(merged.map((x) => x.txHash)).toEqual(["0xdef", "0xabc"]);
  });
  it("keeps the item name from the local copy", () => {
    const a = fromEnvio(row);
    const merged = mergeReceipts([{ ...a, name: "Oat latte" }], [a]);
    expect(merged[0].name).toBe("Oat latte");
  });
});
