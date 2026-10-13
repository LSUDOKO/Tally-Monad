import type { Hex } from "viem";

export type Receipt = {
  capsuleId: bigint;
  merchant: Hex;
  itemId: Hex;
  category: number;
  price: bigint;
  cosigned: boolean;
  receipt: Hex;
  txHash: Hex;
  timestamp: number;
  name?: string;
  merchantName?: string;
};

export type Topup = { capsuleId: bigint; from: Hex; amount: bigint; note: string; txHash: Hex; timestamp: number };

type EnvioPayment = {
  capsuleId: string;
  merchant: string;
  itemId: string;
  category: number;
  price: string;
  cosigned: boolean;
  receipt: string;
  txHash: string;
  timestamp: number;
};

export function fromEnvio(r: EnvioPayment): Receipt {
  return {
    capsuleId: BigInt(r.capsuleId),
    merchant: r.merchant as Hex,
    itemId: r.itemId as Hex,
    category: Number(r.category),
    price: BigInt(r.price),
    cosigned: r.cosigned,
    receipt: r.receipt as Hex,
    txHash: r.txHash as Hex,
    timestamp: Number(r.timestamp),
  };
}

/** Indexed rows win for facts; the device's copy adds the display name it saw at checkout. */
export function mergeReceipts(local: Receipt[], indexed: Receipt[]): Receipt[] {
  const byTx = new Map<string, Receipt>();
  for (const r of [...indexed, ...local]) {
    const prev = byTx.get(r.txHash);
    byTx.set(r.txHash, prev ? { ...prev, name: prev.name ?? r.name, merchantName: prev.merchantName ?? r.merchantName } : r);
  }
  return [...byTx.values()].sort((a, b) => b.timestamp - a.timestamp);
}

// ---------- local cache (this device's own payments) ----------

const KEY = (id: bigint) => `tally.receipts.${id}`;

const ser = (r: Receipt) => ({ ...r, capsuleId: `${r.capsuleId}`, price: `${r.price}` });

export function rememberReceipt(r: Receipt) {
  try {
    const all = localReceipts(r.capsuleId);
    localStorage.setItem(KEY(r.capsuleId), JSON.stringify([ser(r), ...all.map(ser)].slice(0, 200)));
  } catch {}
}

export function localReceipts(id: bigint): Receipt[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY(id)) ?? "[]") as (Omit<Receipt, "capsuleId" | "price"> & { capsuleId: string; price: string })[];
    return raw.map((x) => ({ ...x, capsuleId: BigInt(x.capsuleId), price: BigInt(x.price) }));
  } catch {
    return [];
  }
}

// ---------- Envio HyperIndex ----------

const ENVIO = process.env.NEXT_PUBLIC_ENVIO_URL;

async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T | null> {
  if (!ENVIO) return null;
  try {
    const r = await fetch(ENVIO, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    const j = await r.json();
    return (j.data as T) ?? null;
  } catch {
    return null;
  }
}

export async function getReceipts(capsuleId: bigint, limit = 50): Promise<Receipt[]> {
  const data = await gql<{ Payment: EnvioPayment[] }>(
    `query($id: numeric!, $limit: Int!) { Payment(where: {capsuleId: {_eq: $id}}, order_by: {timestamp: desc}, limit: $limit) {
      capsuleId merchant itemId category price cosigned receipt txHash timestamp } }`,
    { id: `${capsuleId}`, limit },
  );
  return mergeReceipts(localReceipts(capsuleId), (data?.Payment ?? []).map(fromEnvio)).slice(0, limit);
}

/** The owner loading their own allowance is not a top-up from family. */
export function familyOnly(rows: Topup[], owner?: string): Topup[] {
  return owner ? rows.filter((t) => t.from.toLowerCase() !== owner.toLowerCase()) : rows;
}

export async function getTopups(capsuleId: bigint, owner?: string): Promise<Topup[]> {
  const data = await gql<{ Topup: { capsuleId: string; from: string; amount: string; note: string; txHash: string; timestamp: number }[] }>(
    `query($id: numeric!) { Topup(where: {capsuleId: {_eq: $id}}, order_by: {timestamp: desc}, limit: 20) {
      capsuleId from amount note txHash timestamp } }`,
    { id: `${capsuleId}` },
  );
  const rows = (data?.Topup ?? []).map((t) => ({
    capsuleId: BigInt(t.capsuleId),
    from: t.from as Hex,
    amount: BigInt(t.amount),
    note: t.note,
    txHash: t.txHash as Hex,
    timestamp: Number(t.timestamp),
  }));
  return familyOnly(rows, owner);
}

export async function getSales(merchant: Hex, limit = 30): Promise<Receipt[]> {
  const data = await gql<{ Payment: EnvioPayment[] }>(
    `query($m: String!, $limit: Int!) { Payment(where: {merchant: {_eq: $m}}, order_by: {timestamp: desc}, limit: $limit) {
      capsuleId merchant itemId category price cosigned receipt txHash timestamp } }`,
    { m: merchant.toLowerCase(), limit },
  );
  return (data?.Payment ?? []).map(fromEnvio);
}

export const indexerOn = () => !!ENVIO;

// ---------- blocked attempts (red team and refused payments), shown on Receipts ----------

export type Blocked = { title: string; reason: string; price: bigint; timestamp: number };
const BKEY = (id: bigint) => `tally.blocked.${id}`;

export function rememberBlocked(id: bigint, b: Blocked) {
  try {
    const all = blockedAttempts(id).map((x) => ({ ...x, price: `${x.price}` }));
    localStorage.setItem(BKEY(id), JSON.stringify([{ ...b, price: `${b.price}` }, ...all].slice(0, 50)));
  } catch {}
}

export function blockedAttempts(id: bigint): Blocked[] {
  try {
    const raw = JSON.parse(localStorage.getItem(BKEY(id)) ?? "[]") as (Omit<Blocked, "price"> & { price: string })[];
    return raw.map((x) => ({ ...x, price: BigInt(x.price) }));
  } catch {
    return [];
  }
}
