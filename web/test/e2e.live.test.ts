/**
 * Live end-to-end run on Monad Testnet: E2E=1 pnpm vitest run test/e2e.live.test.ts
 * Uses the sponsor key from .env.local to fund throwaway owner/agent keys.
 */
import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { createWalletClient, hashTypedData, http, parseEther, type Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { AUSD, DEMO_MERCHANT, RPC, TALLY, chain, publicClient } from "../lib/chain";
import { MOCK_AUSD_ABI, TALLY_ABI } from "../lib/abi";
import { DEMO_ITEMS, signMenu } from "../lib/counter";
import { menuTypes, tallyDomain } from "../lib/menu";
import { pay } from "../lib/pay";
import { humanError } from "../lib/errors";
import { CATEGORIES, chainNow, createAllowance, fundAllowance, readCapsule, rulesFromForm } from "../lib/tally";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);

describe.runIf(process.env.E2E === "1")("live Monad Testnet", () => {
  it("allowance → pay cheapest → Second Look → cosigned pay → replay blocked → family top-up", async () => {
    const sponsor = privateKeyToAccount(env.DRIP_PRIVATE_KEY as Hex);
    const signer = privateKeyToAccount(env.DEMO_MERCHANT_SIGNER_KEY as Hex);
    const owner = privateKeyToAccount(generatePrivateKey());
    const agent = privateKeyToAccount(generatePrivateKey());
    const w = createWalletClient({ account: sponsor, chain, transport: http(RPC) });
    let nonce = await publicClient.getTransactionCount({ address: sponsor.address, blockTag: "pending" });
    const hs = [
      await w.sendTransaction({ to: owner.address, value: parseEther("0.06"), gas: 21_000n, nonce: nonce++ }),
      await w.sendTransaction({ to: agent.address, value: parseEther("0.06"), gas: 21_000n, nonce: nonce++ }),
      await w.writeContract({ address: AUSD, abi: MOCK_AUSD_ABI, functionName: "mint", args: [owner.address, 30_000_000n], gas: 90_000n, nonce: nonce++ }),
      await w.writeContract({ address: AUSD, abi: MOCK_AUSD_ABI, functionName: "mint", args: [sponsor.address, 10_000_000n], gas: 90_000n, nonce: nonce++ }),
    ];
    for (const hash of hs) await publicClient.waitForTransactionReceipt({ hash });

    const rules = rulesFromForm({ categories: [CATEGORIES.coffee, CATEGORIES.food], perPurchase: 10, daily: 25, days: 7, nowSec: Number(await chainNow()) });
    const id = await createAllowance(owner, agent.address, rules, 30_000_000n);
    console.log("capsule", id);

    const menu = await signMenu(signer, DEMO_MERCHANT, DEMO_ITEMS, Number(await chainNow()), BigInt(Date.now()));
    const onchain = await publicClient.readContract({ address: TALLY, abi: TALLY_ABI, functionName: "menuDigest", args: [menu.header] });
    expect(onchain).toBe(hashTypedData({ domain: tallyDomain(), types: menuTypes, primaryType: "Menu", message: menu.header }));

    const p1 = await pay(agent, null, id, menu, DEMO_ITEMS[0]);
    console.log("paid regular", p1.hash, `${p1.ms}ms`);

    const blocked = await pay(agent, null, id, menu, DEMO_ITEMS[1]).catch((e) => e);
    expect(humanError(blocked)).toMatch(/needs your approval/);

    const p2 = await pay(agent, owner, id, menu, DEMO_ITEMS[1]);
    console.log("paid large with cosign", p2.hash, `${p2.ms}ms`);

    const replay = await pay(agent, null, id, menu, DEMO_ITEMS[0]).catch((e) => e);
    expect(humanError(replay)).toMatch(/already paid/i);

    await fundAllowance(sponsor, id, 5_000_000n, "For lunches this week");
    const c = await readCapsule(id);
    expect(c.balance).toBe(30_000_000n - 4_500_000n - 5_900_000n + 5_000_000n);
  }, 120_000);
});
