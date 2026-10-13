import { decodeErrorResult, type Abi, type Hex } from "viem";
import { TALLY_ABI } from "./abi";

/** Contract errors in words a non-crypto user understands (no hashes, no "revert"). */
export const SENTENCES: Record<string, string> = {
  Frozen: "Your allowance is paused.",
  Expired: "This allowance has ended. Ask family to set up a new one.",
  MerchantInactive: "This counter isn't taking Tally right now.",
  WrongSigner: "This menu wasn't signed by the counter. Don't pay it.",
  Stale: "The menu refreshed. Scan again.",
  WindowTooLong: "This menu is too old to pay automatically.",
  NotOnMenu: "That item or price is not on the signed menu.",
  Category: "Your allowance can't be spent on this.",
  OverPerTx: "That's above your per-purchase limit.",
  OverDaily: "That's above today's limit.",
  OwnerCosignRequired: "This one needs your approval.",
  PostCondition: "The payment didn't add up, so nothing moved.",
  Unauthorized: "You can't do that on this allowance.",
  InsufficientBalance: "Not enough left in your allowance.",
  ReceiptUsed: "Already paid. You won't be charged twice.",
  InvalidRules: "Those limits don't work together.",
  AlreadyRegistered: "This counter is already open.",
  ERC20InsufficientBalance: "Not enough money on this account yet. Wait a moment and try again.",
  ERC20InsufficientAllowance: "The approval didn't go through. Try again.",
};

/** OpenZeppelin v5 token errors: the stablecoin reverts with these, not with Tally's own. */
const TOKEN_ERRORS: Abi = [
  { type: "error", name: "ERC20InsufficientBalance", inputs: [{ name: "sender", type: "address" }, { name: "balance", type: "uint256" }, { name: "needed", type: "uint256" }] },
  { type: "error", name: "ERC20InsufficientAllowance", inputs: [{ name: "spender", type: "address" }, { name: "allowance", type: "uint256" }, { name: "needed", type: "uint256" }] },
];

function findData(e: unknown, depth = 0): Hex | undefined {
  if (!e || typeof e !== "object" || depth > 6) return undefined;
  const o = e as Record<string, unknown>;
  if (typeof o.data === "string" && o.data.startsWith("0x") && o.data.length >= 10) return o.data as Hex;
  if (o.data && typeof o.data === "object" && typeof (o.data as Record<string, unknown>).errorName === "string") {
    return undefined;
  }
  return findData(o.cause, depth + 1) ?? findData(o.error, depth + 1);
}

function findName(e: unknown, depth = 0): string | undefined {
  if (!e || typeof e !== "object" || depth > 6) return undefined;
  const o = e as Record<string, unknown>;
  const d = o.data as Record<string, unknown> | undefined;
  if (d && typeof d.errorName === "string") return d.errorName;
  return findName(o.cause, depth + 1);
}

export function errorName(e: unknown): string | undefined {
  const named = findName(e);
  if (named) return named;
  const data = findData(e);
  if (!data) return undefined;
  for (const abi of [TALLY_ABI, TOKEN_ERRORS]) {
    try {
      return decodeErrorResult({ abi, data }).errorName;
    } catch {}
  }
  return undefined;
}

export function humanError(e: unknown): string {
  const name = errorName(e);
  if (name && SENTENCES[name]) return SENTENCES[name];
  return "That didn't go through, and nothing was charged. Try again.";
}
