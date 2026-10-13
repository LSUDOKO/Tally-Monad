import { createWalletClient, http, parseEventLogs, type LocalAccount } from "viem";
import { RPC, TALLY, chain, publicClient, withMargin } from "./chain";
import { TALLY_ABI } from "./abi";
import { buildTree, cosignTypes, tallyDomain, type Hex, type Item, type SignedMenu } from "./menu";
import { CATEGORY_LABEL, todayUsage, type Capsule } from "./tally";

export type Preflight =
  | { ok: true; needsOwner: boolean; reasons: string[] }
  | { ok: false; code: "paused" | "expired" | "stale" | "category" | "per-tx" | "daily" | "balance"; message: string };

const money = (micro: bigint) => `$${(Number(micro) / 1e6).toFixed(2)}`;

/** Runs the contract's checks on the phone first, in the same order, so the user hears "no" before Face ID. */
export function preflight(c: Capsule, merchantBond: bigint, m: SignedMenu, item: Item, nowSec: bigint): Preflight {
  if (c.frozen) return { ok: false, code: "paused", message: "Your allowance is paused. Resume it on Home." };
  if (nowSec >= c.rules.expiry) return { ok: false, code: "expired", message: "This allowance has ended." };
  if (nowSec > m.header.expiresAt || nowSec < m.header.issuedAt) {
    return { ok: false, code: "stale", message: "The menu refreshed. Tap to get the new one." };
  }
  if (((c.rules.categories >> BigInt(item.category)) & 1n) === 0n) {
    return { ok: false, code: "category", message: `Your allowance can't be spent on ${CATEGORY_LABEL[item.category]?.toLowerCase() ?? "this"}.` };
  }
  if (item.price > c.rules.perTxCap) {
    return { ok: false, code: "per-tx", message: `That's above your ${money(c.rules.perTxCap)} per-purchase limit.` };
  }
  const spent = todayUsage(c, nowSec);
  if (spent + item.price > c.rules.dailyCap) {
    return { ok: false, code: "daily", message: `You've used ${money(spent)} of today's ${money(c.rules.dailyCap)}.` };
  }
  if (item.price > c.balance) return { ok: false, code: "balance", message: `Only ${money(c.balance)} left. Ask family to top up.` };

  const reasons: string[] = [];
  if (item.price > item.floor) reasons.push(`It's ${money(item.price - item.floor)} more than the cheapest ${CATEGORY_LABEL[item.category]?.toLowerCase()} (${money(item.floor)}).`);
  if (merchantBond < c.rules.minMerchantBond) reasons.push(`This counter's bond is ${money(merchantBond)}, below your ${money(c.rules.minMerchantBond)} minimum.`);
  if (m.header.expiresAt - m.header.issuedAt > 60n) reasons.push("This is a printed menu, not a live one.");
  return { ok: true, needsOwner: reasons.length > 0, reasons };
}

const wallet = (account: LocalAccount) => createWalletClient({ account, chain, transport: http(RPC) });

/**
 * The agent key submits `payOffer`. When the owner must approve, the owner key signs the EIP-712
 * Cosign first (after a fresh Face ID in the UI) and the agent relays it.
 */
export async function pay(
  agent: LocalAccount,
  owner: LocalAccount | null,
  capsuleId: bigint,
  m: SignedMenu,
  item: Item,
): Promise<{ hash: Hex; receipt: Hex; ms: number }> {
  const idx = m.items.findIndex((i) => i.itemId === item.itemId);
  if (idx < 0) throw new Error("Item not on this menu");
  const proof = buildTree(m.items).proofs[idx];
  let ownerSig: Hex = "0x";
  if (owner) {
    ownerSig = await owner.signTypedData({
      domain: tallyDomain(),
      types: cosignTypes,
      primaryType: "Cosign",
      message: { capsuleId, merchant: m.header.merchant, menuNonce: m.header.menuNonce, itemId: item.itemId, price: item.price },
    });
  }
  const args = [capsuleId, m.header, m.sig, { itemId: item.itemId, category: item.category, price: item.price, floor: item.floor }, proof, ownerSig] as const;
  const t0 = performance.now();
  const req = { address: TALLY, abi: TALLY_ABI, functionName: "payOffer", args, account: agent } as const;
  const gas = withMargin(await publicClient.estimateContractGas(req as never));
  const hash = await wallet(agent).writeContract({ ...req, gas } as never);
  const r = await publicClient.waitForTransactionReceipt({ hash });
  if (r.status !== "success") throw new Error("Payment reverted");
  const ev = parseEventLogs({ abi: TALLY_ABI, logs: r.logs, eventName: "Paid" })[0] as unknown as { args: { receipt: Hex } };
  return { hash, receipt: ev.args.receipt, ms: Math.round(performance.now() - t0) };
}
