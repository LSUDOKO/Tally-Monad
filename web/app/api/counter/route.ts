import { NextResponse } from "next/server";
import { privateKeyToAccount } from "viem/accounts";
import type { Hex } from "viem";
import { DEMO_MERCHANT, publicClient } from "@/lib/chain";
import { DEMO_ITEMS, signMenu } from "@/lib/counter";
import { encodeQr } from "@/lib/menu";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The demo café counter: a freshly signed menu on every request, timed by the chain's clock. */
export async function GET() {
  const signer = privateKeyToAccount(process.env.DEMO_MERCHANT_SIGNER_KEY as Hex);
  const now = Number((await publicClient.getBlock()).timestamp);
  const menu = await signMenu(signer, DEMO_MERCHANT, DEMO_ITEMS, now, BigInt(Date.now()));
  return NextResponse.json(
    { qr: encodeQr(menu), expiresAt: Number(menu.header.expiresAt), now },
    { headers: { "cache-control": "no-store" } },
  );
}
