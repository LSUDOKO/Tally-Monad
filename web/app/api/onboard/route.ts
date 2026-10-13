import { NextResponse } from "next/server";
import { createWalletClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { chain, RPC, AUSD, publicClient, withMargin } from "@/lib/chain";
import { MOCK_AUSD_ABI } from "@/lib/abi";
import { DRIP_ABI } from "@/lib/abi-drip";
import { RESERVE_WINDOW_BLOCKS, welcomePlan, windowClear } from "@/lib/onboard";
import d from "@/lib/deployments.json";
import { createBudget, createLimiter } from "@/lib/ratelimit";

export const runtime = "nodejs";

const inFlight = new Set<string>();
// A venue shares one IP, so the per-IP cap is generous; the hourly MON budget is the real guard.
const perIp = createLimiter(20, 3_600_000);
const hourlyMon = createBudget(1_000_000_000_000_000_000n, 3_600_000); // 1 MON / hour

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
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const mon = plan.ownerMon + plan.agentMon;
  if (mon + plan.usd > 0n && (!perIp(ip) || !hourlyMon(mon))) {
    return NextResponse.json({ error: "Lots of new people right now. Try again in a few minutes." }, { status: 429 });
  }
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
      const call = { address: d.drip as Hex, abi: DRIP_ABI, functionName: "welcome", args: [to, amount, AUSD, owner, plan.usd], value } as const;
      // Monad prices cold accounts and new storage above Ethereum, so estimate instead of guessing
      const gas = withMargin(await publicClient.estimateContractGas({ ...call, account: sponsor }));
      hashes.push(await w.writeContract({ ...call, gas, nonce: nonce++ }));
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
