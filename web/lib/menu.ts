import { keccak256, encodePacked, type TypedDataDomain } from "viem";
import { TALLY, chain } from "./chain";

export type Hex = `0x${string}`;
export type Item = { itemId: Hex; category: number; price: bigint; floor: bigint; name: string };
export type MenuHeader = {
  merchant: Hex;
  menuRoot: Hex;
  issuedAt: bigint;
  expiresAt: bigint;
  menuNonce: bigint;
  itemCount: number;
};
export type SignedMenu = { header: MenuHeader; sig: Hex; items: Item[] };

/** leaf = keccak(0x00 ‖ itemId16 ‖ category u16 ‖ price u128 ‖ floor u128), same as MenuMerkle.sol */
export const leafHash = (i: Item): Hex =>
  keccak256(
    encodePacked(["bytes1", "bytes16", "uint16", "uint128", "uint128"], ["0x00", i.itemId, i.category, i.price, i.floor]),
  );

const node = (a: Hex, b: Hex): Hex => {
  const [lo, hi] = BigInt(a) < BigInt(b) ? [a, b] : [b, a];
  return keccak256(encodePacked(["bytes1", "bytes32", "bytes32"], ["0x01", lo, hi]));
};

/** Sorted-pair tree; an odd node is promoted unchanged, so its proof skips that level. */
export function buildTree(items: Item[]): { root: Hex; proofs: Hex[][] } {
  let level = items.map(leafHash);
  let pos = items.map((_, i) => i);
  const proofs: Hex[][] = items.map(() => []);
  while (level.length > 1) {
    const next: Hex[] = [];
    for (let i = 0; i < level.length; i += 2) next.push(i + 1 < level.length ? node(level[i], level[i + 1]) : level[i]);
    pos = pos.map((p, leaf) => {
      const sib = p ^ 1;
      if (sib < level.length) proofs[leaf].push(level[sib]);
      return p >> 1;
    });
    level = next;
  }
  return { root: level[0], proofs };
}

/** Every leaf's floor must equal the cheapest price in its category (what proveFloorFraud checks). */
export function verifyFloors(items: Item[]): boolean {
  const min = new Map<number, bigint>();
  for (const i of items) {
    const cur = min.get(i.category);
    if (cur === undefined || i.price < cur) min.set(i.category, i.price);
  }
  return items.every((i) => i.floor === min.get(i.category));
}

export const menuTypes = {
  Menu: [
    { name: "merchant", type: "address" },
    { name: "menuRoot", type: "bytes32" },
    { name: "issuedAt", type: "uint64" },
    { name: "expiresAt", type: "uint64" },
    { name: "menuNonce", type: "uint64" },
    { name: "itemCount", type: "uint32" },
  ],
} as const;

export const cosignTypes = {
  Cosign: [
    { name: "capsuleId", type: "uint256" },
    { name: "merchant", type: "address" },
    { name: "menuNonce", type: "uint64" },
    { name: "itemId", type: "bytes16" },
    { name: "price", type: "uint128" },
  ],
} as const;

export const tallyDomain = (): TypedDataDomain => ({
  name: "Tally",
  version: "1",
  chainId: chain.id,
  verifyingContract: TALLY,
});

const PREFIX = "TALLY:EVM1:";

function b64uEncode(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64uDecode(s: string): string {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function encodeQr(m: SignedMenu): string {
  const h = m.header;
  return (
    PREFIX +
    b64uEncode(
      JSON.stringify({
        m: h.merchant,
        r: h.menuRoot,
        is: `${h.issuedAt}`,
        ex: `${h.expiresAt}`,
        n: `${h.menuNonce}`,
        c: h.itemCount,
        s: m.sig,
        i: m.items.map((x) => [x.itemId, x.category, `${x.price}`, `${x.floor}`, x.name]),
      }),
    )
  );
}

/** Decodes a scanned menu and rebuilds its root, so a tampered item never reaches the agent. */
export function decodeQr(s: string): SignedMenu {
  if (!s.startsWith(PREFIX)) throw new Error("Not a Tally menu");
  const j = JSON.parse(b64uDecode(s.slice(PREFIX.length)));
  const items: Item[] = j.i.map((x: [Hex, number, string, string, string]) => ({
    itemId: x[0],
    category: x[1],
    price: BigInt(x[2]),
    floor: BigInt(x[3]),
    name: x[4],
  }));
  const header: MenuHeader = {
    merchant: j.m,
    menuRoot: j.r,
    issuedAt: BigInt(j.is),
    expiresAt: BigInt(j.ex),
    menuNonce: BigInt(j.n),
    itemCount: j.c,
  };
  if (items.length !== header.itemCount || buildTree(items).root !== header.menuRoot) {
    throw new Error("Menu root mismatch");
  }
  return { header, sig: j.s, items };
}
