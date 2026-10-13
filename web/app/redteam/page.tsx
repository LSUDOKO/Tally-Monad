"use client";

import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { RequireSession } from "@/components/RequireSession";
import { Button, Card, Header, Spinner } from "@/components/ui";
import { TALLY_ABI } from "@/lib/abi";
import { buildAttacks, type Attack } from "@/lib/attacks";
import { TALLY, publicClient } from "@/lib/chain";
import { DEMO_ITEMS, signMenu } from "@/lib/counter";
import { SENTENCES, errorName } from "@/lib/errors";
import { decodeQr } from "@/lib/menu";
import { useSession } from "@/lib/session";
import { chainNow } from "@/lib/tally";
import { useAllowance } from "@/lib/useAllowance";

type Result = { attack: Attack; got: string; blocked: boolean };

function RedTeamInner() {
  const { keys } = useSession();
  const a = useAllowance();
  const [results, setResults] = useState<Result[]>([]);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!keys || a.id === undefined) return;
    setBusy(true);
    setResults([]);
    const menu = decodeQr((await (await fetch("/api/counter", { cache: "no-store" })).json()).qr);
    // the impostor signs with this user's own counter key while claiming to be the demo café
    const forged = await signMenu(keys.merchant, menu.header.merchant, DEMO_ITEMS, Number(await chainNow()), BigInt(Date.now()));
    for (const attack of buildAttacks(menu, forged)) {
      let got = "none";
      try {
        await publicClient.simulateContract({
          address: TALLY,
          abi: TALLY_ABI,
          functionName: "payOffer",
          args: [a.id, attack.menu.header, attack.menu.sig, { itemId: attack.item.itemId, category: attack.item.category, price: attack.item.price, floor: attack.item.floor }, attack.proof, "0x"],
          account: keys.agent,
        });
      } catch (e) {
        got = errorName(e) ?? "reverted";
      }
      setResults((r) => [...r, { attack, got, blocked: got !== "none" }]);
    }
    setBusy(false);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 pb-24">
      <Header title="Try to trick my assistant" back="/settings" />
      <p className="text-sm text-muted">
        Four tricks a fake counter or a manipulated AI could try. Each one is sent to the Tally contract from your own assistant&apos;s key. Nothing is
        charged: the chain refuses them.
      </p>
      {results.map(({ attack, got, blocked }) => (
        <Card key={attack.title}>
          <div className="flex items-center justify-between">
            <p className="font-semibold">{attack.title}</p>
            <span className={`rounded-full px-3 py-1 text-xs ${blocked ? "bg-blocked/15 text-blocked" : "bg-needs/15 text-needs"}`}>
              {blocked ? "Blocked" : "Not blocked"}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">{attack.story}</p>
          <p className="mt-2 text-sm">
            {SENTENCES[got] ?? got} <span className="font-mono text-xs text-faint">({got})</span>
          </p>
        </Card>
      ))}
      <Button onClick={run} disabled={busy || a.id === undefined}>
        {busy ? <Spinner /> : results.length ? "Run again" : "Run the four attacks"}
      </Button>
      <BottomNav />
    </div>
  );
}

export default function RedTeamPage() {
  return (
    <RequireSession>
      <RedTeamInner />
    </RequireSession>
  );
}
