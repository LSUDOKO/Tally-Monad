import { createWalletClient, http, hexToString, parseEventLogs, type Hex, type LocalAccount } from "viem";
import { AUSD, RPC, TALLY, chain, publicClient, withMargin } from "./chain";
import { MOCK_AUSD_ABI, TALLY_ABI } from "./abi";

export const CATEGORIES = {
  food: 0,
  drinks: 1,
  snacks: 2,
  coffee: 3,
  transit: 4,
  groceries: 5,
  digital: 6,
  services: 7,
  tips: 8,
} as const;

export const CATEGORY_LABEL: Record<number, string> = {
  0: "Food",
  1: "Drinks",
  2: "Snacks",
  3: "Coffee",
  4: "Transit",
  5: "Groceries",
  6: "Digital",
  7: "Services",
  8: "Tips",
};

export const CATEGORY_ICON: Record<number, string> = {
  0: "🥪",
  1: "🧃",
  2: "🍪",
  3: "☕",
  4: "🚌",
  5: "🛒",
  6: "📱",
  7: "✂️",
  8: "🙏",
};

export type Rules = {
  categories: bigint;
  perTxCap: bigint;
  dailyCap: bigint;
  minMerchantBond: bigint;
  expiry: bigint;
  allowExtended: boolean;
};

export type Capsule = {
  owner: Hex;
  agent: Hex;
  balance: bigint;
  spentInCycle: bigint;
  cycleStart: bigint;
  frozen: boolean;
  rules: Rules;
};

export type Merchant = {
  signingKey: Hex;
  payout: Hex;
  name: string;
  bond: bigint;
  slashedTotal: bigint;
  active: boolean;
};

const DAY = 86_400n;
const money = (micro: bigint) => `$${(Number(micro) / 1e6).toFixed(2)}`;

export function rulesFromForm(f: { categories: number[]; perPurchase: number; daily: number; days: number; nowSec: number }): Rules {
  if (f.categories.length === 0) throw new Error("Pick at least one thing it can be spent on");
  if (f.perPurchase > f.daily) throw new Error("The per purchase limit can't be above the daily limit");
  const micro = (n: number) => BigInt(Math.round(n * 1e6));
  return {
    categories: f.categories.reduce((b, c) => b | (1n << BigInt(c)), 0n),
    perTxCap: micro(f.perPurchase),
    dailyCap: micro(f.daily),
    minMerchantBond: 50_000_000n,
    expiry: BigInt(f.nowSec) + BigInt(f.days) * DAY,
    allowExtended: false,
  };
}

export function categoriesOf(bitmap: bigint): number[] {
  return Object.keys(CATEGORY_LABEL)
    .map(Number)
    .filter((c) => (bitmap >> BigInt(c)) & 1n);
}

export function describeRules(r: Rules): string {
  const names = categoriesOf(r.categories).map((c) => CATEGORY_LABEL[c]);
  const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)!.toLowerCase()}` : names[0];
  return `${list}, up to ${money(r.perTxCap)} a purchase and ${money(r.dailyCap)} a day`;
}

/** Mirrors the contract's rolling 24h cycle. */
export function todayUsage(c: { spentInCycle: bigint; cycleStart: bigint }, nowSec: bigint): bigint {
  return nowSec - c.cycleStart >= DAY ? 0n : c.spentInCycle;
}

// ---------- chain reads ----------

export async function readCapsule(id: bigint): Promise<Capsule> {
  return (await publicClient.readContract({ address: TALLY, abi: TALLY_ABI, functionName: "capsuleOf", args: [id] })) as Capsule;
}

export async function getMyCapsule(owner: Hex): Promise<{ id: bigint; c: Capsule } | null> {
  const ids = (await publicClient.readContract({
    address: TALLY,
    abi: TALLY_ABI,
    functionName: "ownerCapsules",
    args: [owner],
  })) as bigint[];
  if (ids.length === 0) return null;
  const id = ids[ids.length - 1];
  return { id, c: await readCapsule(id) };
}

export async function readMerchant(addr: Hex): Promise<Merchant | null> {
  const m = (await publicClient.readContract({ address: TALLY, abi: TALLY_ABI, functionName: "merchants", args: [addr] })) as [
    Hex,
    Hex,
    Hex,
    bigint,
    bigint,
    boolean,
  ];
  if (m[1] === "0x0000000000000000000000000000000000000000") return null;
  return {
    signingKey: m[0],
    payout: m[1],
    name: hexToString(m[2]).replace(/\0+$/, ""),
    bond: m[3],
    slashedTotal: m[4],
    active: m[5],
  };
}

export async function usdBalance(addr: Hex): Promise<bigint> {
  return publicClient.readContract({ address: AUSD, abi: MOCK_AUSD_ABI, functionName: "balanceOf", args: [addr] });
}

export async function chainNow(): Promise<bigint> {
  return (await publicClient.getBlock()).timestamp;
}

// ---------- chain writes ----------

const wallet = (account: LocalAccount) => createWalletClient({ account, chain, transport: http(RPC) });

/** Simulates, sends with an explicit gas limit (Monad bills the limit), and waits for the receipt. */
export async function send(account: LocalAccount, req: { address: Hex; abi: typeof TALLY_ABI | typeof MOCK_AUSD_ABI; functionName: string; args: readonly unknown[]; value?: bigint }) {
  const { request } = await publicClient.simulateContract({ ...req, account } as never);
  const gas = withMargin(await publicClient.estimateContractGas({ ...req, account } as never));
  const hash = await wallet(account).writeContract({ ...(request as object), gas } as never);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error("Transaction reverted");
  return receipt;
}

export async function approveUsd(account: LocalAccount, amount: bigint) {
  const allowance = await publicClient.readContract({
    address: AUSD,
    abi: MOCK_AUSD_ABI,
    functionName: "allowance",
    args: [account.address, TALLY],
  });
  if (allowance >= amount) return;
  await send(account, { address: AUSD, abi: MOCK_AUSD_ABI, functionName: "approve", args: [TALLY, amount] });
}

export async function createAllowance(owner: LocalAccount, agent: Hex, rules: Rules, deposit: bigint): Promise<bigint> {
  await approveUsd(owner, deposit);
  const receipt = await send(owner, { address: TALLY, abi: TALLY_ABI, functionName: "createCapsule", args: [agent, rules, deposit] });
  const ev = parseEventLogs({ abi: TALLY_ABI, logs: receipt.logs, eventName: "CapsuleCreated" })[0] as unknown as { args: { id: bigint } };
  return ev.args.id;
}

export async function fundAllowance(from: LocalAccount, id: bigint, amount: bigint, note: string) {
  await approveUsd(from, amount);
  return send(from, { address: TALLY, abi: TALLY_ABI, functionName: "fund", args: [id, amount, note.slice(0, 64)] });
}

export async function setFrozen(owner: LocalAccount, id: bigint, frozen: boolean) {
  return send(owner, { address: TALLY, abi: TALLY_ABI, functionName: "setFrozen", args: [id, frozen] });
}

export async function updateRules(owner: LocalAccount, id: bigint, rules: Rules) {
  return send(owner, { address: TALLY, abi: TALLY_ABI, functionName: "updateRules", args: [id, rules] });
}
