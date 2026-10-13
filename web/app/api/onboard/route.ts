import { NextResponse } from "next/server";
import { createWalletClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { chain, RPC, AUSD, publicClient } from "@/lib/chain";
import { MOCK_AUSD_ABI } from "@/lib/abi";
import { DRIP_ABI } from "@/lib/abi-drip";
import { RESERVE_WINDOW_BLOCKS, welcomePlan, windowClear } from "@/lib/onboard";
import d from "@/lib/deployments.json";

export const runtime = "nodejs";

const inFlight = new Set<string>();

async function waitForWindow(sponsor: Hex) {
  for (let i = 0; i < 20; i++) {
    const head = await publicClient.getBlockNumber();
    const [now, then] = await Promise.all([
      publicClient.getTransactionCount({ address: sponsor, blockNumber: head }),
      publicClient.getTransactionCount({ address: sponsor, blockNumber: head - RESERVE_WINDOW_BLOCKS }),
    ]);
    if (windowClear(now, then)) return;
    await new Promise((r) => setTimeout(r, 450));
  }
}

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
    await waitForWindow(sponsor.address);
    let nonce = await publicClient.getTransactionCount({ address: sponsor.address, blockTag: "pending" });
    const hashes: Hex[] = [];
    const to: Hex[] = [];
    const amount: bigint[] = [];
    if (plan.ownerMon > 0n) (to.push(owner), amount.push(plan.ownerMon));
    if (plan.agentMon > 0n) (to.push(agent), amount.push(plan.agentMon));
    if (to.length > 0 || plan.usd > 0n) {
      // the whole welcome is ONE transaction: under Monad's reserve-balance rule a second sponsor tx in the
      // same 3-block window reverts once the first has moved MON
      const value = amount.reduce((a, b) => a + b, 0n);
      hashes.push(
        await w.writeContract({
          address: d.drip as Hex,
          abi: DRIP_ABI,
          functionName: "welcome",
          args: [to, amount, AUSD, owner, plan.usd],
          value,
          gas: 160_000n,
          nonce: nonce++,
        }),
      );
    }
    const receipts = await Promise.all(hashes.map((hash) => publicClient.waitForTransactionReceipt({ hash })));
    if (receipts.some((r) => r.status !== "success")) throw new Error("a welcome transaction reverted");
    return NextResponse.json({ ok: true, welcomeUsd: Number(plan.usd) / 1e6 });
  } catch (e) {
    console.error("onboard failed", e);
    return NextResponse.json({ error: "Could not add your welcome credit. Try again." }, { status: 502 });
  } finally {
    inFlight.delete(owner);
  }
}
