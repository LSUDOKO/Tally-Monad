"use client";

import { ArrowUpRight, BadgeDollarSign, CircleAlert, Copy, Ghost, ShieldCheck, ShieldX, Swords } from "lucide-react";
import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Mascot } from "@/components/Mascot";
import { RequireSession } from "@/components/RequireSession";
import { Button, Card, Chip, Mono, Spinner, Tile } from "@/components/ui";
import { TALLY_ABI } from "@/lib/abi";
import { rememberBlocked } from "@/lib/activity";
import { buildAttacks, type Attack } from "@/lib/attacks";
import { TALLY, publicClient } from "@/lib/chain";
import { DEMO_ITEMS, signMenu } from "@/lib/counter";
import { SENTENCES, errorName } from "@/lib/errors";
import { decodeQr } from "@/lib/menu";
import { useSession } from "@/lib/session";
import { chainNow } from "@/lib/tally";
import { useAllowance } from "@/lib/useAllowance";

type Result = { attack: Attack; got: string };

const CHIPS = [
  { label: "Fake counter", color: "var(--blocked)", Icon: Copy },
  { label: "Phantom fee", color: "var(--blocked)", Icon: Ghost },
  { label: "Price ×2", color: "var(--blocked)", Icon: BadgeDollarSign },
  { label: "Upsell", color: "var(--blocked)", Icon: ArrowUpRight },
];

function RedTeamInner() {
  const { keys } = useSession();
  const a = useAllowance();
  const [results, setResults] = useState<Result[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>();

  const run = async () => {
    if (!keys || a.id === undefined) return;
    setBusy(true);
    setErr(undefined);
    setResults([]);
    try {
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
        if (got !== "none") {
          rememberBlocked(a.id, { title: `Red team: ${attack.title}`, reason: SENTENCES[got] ?? got, price: attack.item.price, timestamp: Math.floor(Date.now() / 1000) });
        }
        setResults((r) => [...r, { attack, got }]);
      }
    } catch {
      setErr("Couldn't reach the demo café to attack. Try again.");
    }
    setBusy(false);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 pb-28">
      <h1 className="statement mt-4 text-[40px] leading-[44px]">
        Attack your
        <br />
        own agent.
      </h1>
      <div className="flex justify-center">
        <Mascot mood="blocked" height={200} />
      </div>
      <p className="text-[14px] leading-[21px] text-muted">
        Run four attacks against the demo café&apos;s live menu, sent from your own agent&apos;s key. Every one reaches the Tally contract on Monad, and
        nothing is charged.
      </p>
      <div className="flex flex-wrap gap-2">
        {CHIPS.map(({ label, color, Icon }) => (
          <Chip key={label} color={color} icon={<Icon size={13} />}>
            {label}
          </Chip>
        ))}
      </div>
      {err && <p className="rounded-2xl bg-blocked/10 p-3 text-[14px] text-blocked">{err}</p>}
      <Button variant="blocked" onClick={run} disabled={busy || a.id === undefined}>
        {busy ? <Spinner /> : <><Swords size={18} /> {results.length ? "Run again" : "Run 4 attacks"}</>}
      </Button>

      {results.map(({ attack, got }) => {
        const asExpected = got === attack.expect;
        const blocked = got !== "none";
        const color = !blocked ? "var(--blocked)" : asExpected ? "var(--paid)" : "var(--needs)";
        return (
          <Card key={attack.title} tint={color}>
            <div className="flex items-start gap-3">
              <Tile color="var(--blocked)">
                <CircleAlert size={18} />
              </Tile>
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-medium">{attack.title}</p>
                <p className="text-[13px] text-muted">{attack.story}</p>
              </div>
              {blocked ? <ShieldCheck size={22} style={{ color }} /> : <ShieldX size={22} className="text-blocked" />}
            </div>
            <p className="mt-3 text-[14px]">
              {blocked ? "Reverted on-chain: " : "Not blocked: "}
              {SENTENCES[got] ?? got}
            </p>
            <Mono className="mt-1">
              {got}
              {blocked && !asExpected ? ` (expected ${attack.expect}; your rules stopped it first)` : ""}
            </Mono>
          </Card>
        );
      })}
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
