"use client";

import Link from "next/link";
import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { RecentReceipts } from "@/components/RecentReceipts";
import { RequireSession } from "@/components/RequireSession";
import { ShareAllowance } from "@/components/ShareAllowance";
import { Button, Card, Spinner, usd } from "@/components/ui";
import { useSession } from "@/lib/session";
import { CATEGORY_ICON, CATEGORY_LABEL, categoriesOf, setFrozen } from "@/lib/tally";
import { useAllowance } from "@/lib/useAllowance";

function HomeInner() {
  const { keys, welcomeUsd } = useSession();
  const a = useAllowance();
  const [busy, setBusy] = useState(false);
  const name = typeof window !== "undefined" ? localStorage.getItem("tally.name") : null;

  if (a.loading) {
    return (
      <div className="grid flex-1 place-items-center">
        <Spinner />
      </div>
    );
  }

  if (!a.capsule || a.id === undefined) {
    return (
      <div className="flex flex-1 flex-col">
        <h1 className="text-2xl font-semibold">Hi{name ? ` ${name}` : ""} 👋</h1>
        <Card className="mt-6">
          <p className="text-muted">Welcome gift</p>
          <p className="tabular mt-1 text-4xl font-semibold">{usd(a.walletUsd)}</p>
          <p className="mt-2 text-sm text-faint">
            {a.walletUsd > 0n || welcomeUsd ? "Ready to load into your first allowance." : "Adding your welcome credit…"}
          </p>
        </Card>
        <div className="mt-auto pt-8">
          <Link href="/allowance">
            <Button disabled={a.walletUsd === 0n}>Set up my allowance</Button>
          </Link>
        </div>
      </div>
    );
  }

  const c = a.capsule;
  const pct = c.rules.dailyCap > 0n ? Number((a.spentToday * 100n) / c.rules.dailyCap) : 0;

  const toggle = async () => {
    if (!keys || a.id === undefined) return;
    setBusy(true);
    try {
      await setFrozen(keys.owner, a.id, !c.frozen);
      await a.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Hi{name ? ` ${name}` : ""}</h1>
        <span className={`rounded-full px-3 py-1 text-xs ${c.frozen ? "bg-needs/15 text-needs" : "bg-paid/15 text-paid"}`}>
          {c.frozen ? "Paused" : "Active"}
        </span>
      </div>

      <Card>
        <p className="text-muted">Allowance left</p>
        <p className="tabular mt-1 text-5xl font-semibold tracking-tight">{usd(c.balance)}</p>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-deep to-brand-core" style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
        <p className="tabular mt-2 text-sm text-muted">
          Today {usd(a.spentToday)} of {usd(c.rules.dailyCap)} · up to {usd(c.rules.perTxCap)} a purchase
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {categoriesOf(c.rules.categories).map((cat) => (
            <span key={cat} className="rounded-full bg-white/5 px-3 py-1 text-sm">
              {CATEGORY_ICON[cat]} {CATEGORY_LABEL[cat]}
            </span>
          ))}
        </div>
      </Card>

      <Link href="/scan">
        <Button disabled={c.frozen}>Scan to pay</Button>
      </Link>

      <div className="grid grid-cols-2 gap-3">
        <ShareAllowance id={a.id} />
        <Button variant="ghost" onClick={toggle} disabled={busy}>
          {busy ? <Spinner /> : c.frozen ? "Resume" : "Pause"}
        </Button>
      </div>

      <RecentReceipts capsuleId={a.id} limit={3} />
      <BottomNav />
    </div>
  );
}

export default function Home() {
  return (
    <RequireSession>
      <HomeInner />
    </RequireSession>
  );
}
