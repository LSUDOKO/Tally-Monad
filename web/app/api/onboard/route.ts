import { NextResponse } from "next/server";
import { createWalletClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { chain, RPC, AUSD, publicClient } from "@/lib/chain";
import { MOCK_AUSD_ABI } from "@/lib/abi";
import { welcomePlan } from "@/lib/onboard";

export const runtime = "nodejs";

const inFlight = new Set<string>();

/** Sponsors a new user: a little MON for fees on both keys and $50 of test AUSD. */
export async function POST(req: Request) {
  const { owner, agent } = (await req.json()) as { owner: Hex; agent: Hex };
  let plan;
  try {
    const [ownerMon, agentMon, ownerUsd] = await Promise.all([
      publicClient.getBalance({ address: owner }),
      publicClient.getBalance({ address: agent }),
      publicClient.readContract({ address: AUSD, abi: MOCK_AUSD_ABI, functionName: "balanceOf", args: [owner] }),
    ]);
    plan = welcomePlan({ owner, agent, ownerMon, agentMon, ownerUsd });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  if (inFlight.has(owner)) return NextResponse.json({ ok: true, pending: true });
  inFlight.add(owner);
  try {
    const sponsor = privateKeyToAccount(process.env.DRIP_PRIVATE_KEY as Hex);
    const w = createWalletClient({ account: sponsor, chain, transport: http(RPC) });
    let nonce = await publicClient.getTransactionCount({ address: sponsor.address, blockTag: "pending" });
    const hashes: Hex[] = [];
    if (plan.ownerMon > 0n) hashes.push(await w.sendTransaction({ to: owner, value: plan.ownerMon, gas: 21_000n, nonce: nonce++ }));
    if (plan.agentMon > 0n) hashes.push(await w.sendTransaction({ to: agent, value: plan.agentMon, gas: 21_000n, nonce: nonce++ }));
    if (plan.usd > 0n) {
      hashes.push(
        await w.writeContract({ address: AUSD, abi: MOCK_AUSD_ABI, functionName: "mint", args: [owner, plan.usd], gas: 90_000n, nonce: nonce++ }),
      );
    }
    await Promise.all(hashes.map((hash) => publicClient.waitForTransactionReceipt({ hash })));
    return NextResponse.json({ ok: true, welcomeUsd: Number(plan.usd) / 1e6 });
  } catch (e) {
    console.error("onboard failed", e);
    return NextResponse.json({ error: "Could not add your welcome credit. Try again." }, { status: 502 });
  } finally {
    inFlight.delete(owner);
  }
}
