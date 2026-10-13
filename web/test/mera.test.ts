import { describe, it, expect } from "vitest";
import { MeraError } from "@category-labs/mera";
import { deriveKeys, friendlyMeraError } from "../lib/mera";

describe("mera", () => {
  it("one PRF output gives three distinct, stable keys", () => {
    const prf = new Uint8Array(32).fill(7);
    const a = deriveKeys(prf);
    const b = deriveKeys(prf);
    expect(a.owner).toEqual(b.owner);
    const hex = [a.owner, a.agent, a.merchant].map((k) => Buffer.from(k).toString("hex"));
    expect(new Set(hex).size).toBe(3);
  });
  it("a different passkey gives different keys", () => {
    expect(deriveKeys(new Uint8Array(32).fill(1)).owner).not.toEqual(deriveKeys(new Uint8Array(32).fill(2)).owner);
  });
  it("explains a missing PRF in plain words", () => {
    expect(friendlyMeraError(new MeraError("PRF_UNAVAILABLE", "x"))).toMatch(/phone/i);
  });
  it("explains a cancelled prompt", () => {
    expect(friendlyMeraError(new MeraError("PASSKEY_OPERATION_FAILED", "x"))).toMatch(/try again/i);
  });
  it("never leaks jargon for unknown errors", () => {
    expect(friendlyMeraError(new Error("secp256k1 scalar invalid"))).not.toMatch(/secp|key|wallet/i);
  });
});
