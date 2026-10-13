import { it, expect, describe } from "vitest";
import { preflight } from "../lib/pay";
import { humanError } from "../lib/errors";
import { DEMO_ITEMS } from "../lib/counter";
import { encodeErrorResult } from "viem";
import { TALLY_ABI } from "../lib/abi";

const cap = {
  owner: "0x1",
  agent: "0x2",
  balance: 40_000_000n,
  spentInCycle: 22_000_000n,
  cycleStart: 0n,
  frozen: false,
  rules: { categories: 0b1001n, perTxCap: 10_000_000n, dailyCap: 25_000_000n, minMerchantBond: 50_000_000n, expiry: 10n ** 12n, allowExtended: false },
} as const;
const menu = (exp: bigint) => ({ header: { expiresAt: exp, issuedAt: exp - 60n } }) as never;
const fresh = { ...cap, spentInCycle: 0n };

describe("preflight", () => {
  it("blocks over-daily before signing, with the numbers", () => {
    const r = preflight(cap as never, 500_000_000n, menu(100n), DEMO_ITEMS[0], 50n);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/\$22\.00 of today's \$25\.00/);
  });
  it("stale menu asks for a refresh", () => {
    const r = preflight(fresh as never, 500_000_000n, menu(10n), DEMO_ITEMS[0], 50n);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("stale");
  });
  it("cheapest match pays alone", () => {
    const r = preflight(fresh as never, 500_000_000n, menu(100n), DEMO_ITEMS[0], 50n);
    expect(r.ok && r.needsOwner).toBe(false);
  });
  it("pricier pick needs the owner and says by how much", () => {
    const r = preflight(fresh as never, 500_000_000n, menu(100n), DEMO_ITEMS[1], 50n);
    expect(r.ok && r.needsOwner).toBe(true);
    if (r.ok) expect(r.reasons[0]).toMatch(/\$1\.40 more than the cheapest/);
  });
  it("under-bonded counter needs the owner", () => {
    const r = preflight(fresh as never, 10_000_000n, menu(100n), DEMO_ITEMS[0], 50n);
    expect(r.ok && r.needsOwner).toBe(true);
  });
  it("blocks categories the family didn't allow", () => {
    const r = preflight(fresh as never, 500_000_000n, menu(100n), DEMO_ITEMS[4], 50n);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/drinks/i);
  });
  it("blocks a paused allowance", () => {
    const r = preflight({ ...fresh, frozen: true } as never, 500_000_000n, menu(100n), DEMO_ITEMS[0], 50n);
    expect(r.ok).toBe(false);
  });
});

describe("humanError", () => {
  it("maps ReceiptUsed to Already paid", () => {
    const data = encodeErrorResult({ abi: TALLY_ABI, errorName: "ReceiptUsed" });
    expect(humanError({ data })).toMatch(/already paid/i);
  });
  it("finds the revert data nested in a viem error", () => {
    const data = encodeErrorResult({ abi: TALLY_ABI, errorName: "NotOnMenu" });
    expect(humanError({ cause: { cause: { data } } })).toMatch(/not on the signed menu/i);
  });
  it("falls back to a plain sentence", () => {
    expect(humanError(new Error("execution reverted 0x1234"))).not.toMatch(/0x|revert/i);
  });
});

describe("receipt key", () => {
  it("matches the contract's keccak(abi.encode(id, merchant, nonce, itemId)) (vector from cast)", async () => {
    const { receiptKey } = await import("../lib/pay");
    expect(receiptKey(1n, "0x000000000000000000000000000000000000cafe", 7n, "0x7a11e0000000000000000000000000a1")).toBe("0xe77e0ba8e8408fa324fd53de32c1e23c8e3e7910ba13d87aa6df367bf5eb84df");
  });
});
