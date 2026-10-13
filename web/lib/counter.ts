import { keccak256, stringToHex, type LocalAccount } from "viem";
import { buildTree, menuTypes, tallyDomain, verifyFloors, type Hex, type Item, type SignedMenu } from "./menu";

/** The demo café. Each category's floor is its cheapest item, so only pricier picks need the owner. */
export const DEMO_ITEMS: Item[] = [
  { itemId: "0x7a11e0000000000000000000000000a1", category: 3, price: 4_500_000n, floor: 4_500_000n, name: "Oat latte, regular" },
  { itemId: "0x7a11e0000000000000000000000000a2", category: 3, price: 5_900_000n, floor: 4_500_000n, name: "Oat latte, large" },
  { itemId: "0x7a11e0000000000000000000000000b1", category: 0, price: 3_000_000n, floor: 3_000_000n, name: "Butter croissant" },
  { itemId: "0x7a11e0000000000000000000000000b2", category: 0, price: 6_500_000n, floor: 3_000_000n, name: "Paneer wrap" },
  { itemId: "0x7a11e0000000000000000000000000c1", category: 1, price: 2_500_000n, floor: 2_500_000n, name: "Masala chai" },
  { itemId: "0x7a11e0000000000000000000000000d1", category: 8, price: 1_000_000n, floor: 1_000_000n, name: "Tip for the barista" },
];

export const WINDOW = 60n;
export const SKEW = 5n;

/** Signs a menu that is valid for 60 s from five seconds ago (absorbs clock skew against the chain). */
export async function signMenu(account: LocalAccount, merchant: Hex, items: Item[], nowSec: number, nonce: bigint): Promise<SignedMenu> {
  if (!verifyFloors(items)) throw new Error("Each category's floor must equal its cheapest item");
  const { root } = buildTree(items);
  const issuedAt = BigInt(nowSec) - SKEW;
  const header = { merchant, menuRoot: root, issuedAt, expiresAt: issuedAt + WINDOW, menuNonce: nonce, itemCount: items.length };
  const sig = await account.signTypedData({ domain: tallyDomain(), types: menuTypes, primaryType: "Menu", message: header });
  return { header, sig, items };
}

export type MenuRow = { name: string; price: number; category: number };

/** Floors are computed, never typed, so an honest counter can't be slashed by accident. */
export function rowsToItems(input: MenuRow[]): Item[] {
  // half-typed rows (empty name, empty or zero price) are left off the signed menu until they're complete
  const rows = input.filter((r) => r.name.trim() && Number.isFinite(r.price) && r.price > 0);
  const micro = (n: number) => BigInt(Math.round(n * 1e6));
  const floor = new Map<number, bigint>();
  for (const r of rows) {
    const p = micro(r.price);
    const f = floor.get(r.category);
    if (f === undefined || p < f) floor.set(r.category, p);
  }
  return rows.map((r, i) => ({
    itemId: keccak256(stringToHex(`${i}:${r.name}`)).slice(0, 34) as Hex,
    category: r.category,
    price: micro(r.price),
    floor: floor.get(r.category)!,
    name: r.name,
  }));
}
