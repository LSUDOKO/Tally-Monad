"use client";

import { Flame, Gift, Pause, Play, Settings2, Store, UserPlus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Mascot } from "@/components/Mascot";
import { RecentReceipts } from "@/components/RecentReceipts";
import { RequireSession } from "@/components/RequireSession";
import { shareAllowance } from "@/components/ShareAllowance";
import { Button, Card, Chip, Label, Spinner, usd } from "@/components/ui";
import { getReceipts, type Receipt } from "@/lib/activity";
import { levelFor, points, streakDays } from "@/lib/points";
import { useSession } from "@/lib/session";
import { CATEGORY_LABEL, categoriesOf, setFrozen } from "@/lib/tally";
import { useAllowance } from "@/lib/useAllowance";

const greeting = () => {
  const h = new Date().getHours();
  return h < 5 ? "Good night." : h < 12 ? "Good morning." : h < 17 ? "Good afternoon." : "Good evening.";
};

function Round({ label, onClick, href, children }: { label: string; onClick?: () => void; href?: string; children: ReactNode }) {
  const cls = "glass grid h-14 w-14 place-items-center rounded-full";
  const inner = href ? (
    <Link href={href} aria-label={label} className={cls}>
      {children}
    </Link>
  ) : (
    <button onClick={onClick} aria-label={label} className={cls}>
      {children}
    </button>
  );
  return (
    <div className="flex flex-col items-center gap-1.5">
      {inner}
      <span className="text-[11px] text-faint">{label}</span>
    </div>
  );
}

function HomeInner() {
  const { keys, welcomeUsd, error, retryWelcome } = useSession();
  const a = useAllowance();
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Receipt[]>([]);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => setName(localStorage.getItem("tally.name")), []);
  useEffect(() => {
    if (a.id !== undefined) getReceipts(a.id, 200).then(setRows);
  }, [a.id, a.capsule?.balance]);

  if (a.loading) {
    return (
      <div className="grid flex-1 place-items-center">
        <Spinner />
      </div>
    );
  }

  const header = (
    <div className="flex items-center gap-3">
      <Image src="/mark.svg" alt="" width={40} height={40} className="rounded-xl" />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="font-medium">Tally</p>
        <p className="truncate text-[12px] text-faint">{name ? `${name}'s allowance` : "Your allowance"}</p>
      </div>
      <Link href="/merchant" aria-label="Counter" className="glass grid h-10 w-10 place-items-center rounded-full">
        <Store size={18} />
      </Link>
      <Link href="/settings" aria-label="Settings" className="glass grid h-10 w-10 place-items-center rounded-full">
        <Settings2 size={18} />
      </Link>
    </div>
  );

  if (!a.capsule || a.id === undefined) {
    const ready = a.walletUsd > 0n || !!welcomeUsd;
    return (
      <div className="flex flex-1 flex-col">
        {header}
        <h1 className="statement mt-7 text-[40px] leading-[44px]">{greeting()}</h1>
        <p className="statement text-[24px] leading-[30px] text-muted">Let&apos;s set up the allowance your agent can spend.</p>
        <Card className="mt-6 flex items-end justify-between overflow-hidden">
          <div>
            <Label>Welcome gift</Label>
            <p className="statement tabular mt-2 text-[44px] leading-none">{usd(a.walletUsd)}</p>
            <p className="mt-2 text-[13px] text-muted">{ready ? "Ready to load into your allowance." : error ? error : "Adding your welcome credit…"}</p>
            {error && a.walletUsd === 0n && (
              <button onClick={retryWelcome} className="mt-2 text-[13px] text-brand-bright">
                Try again
              </button>
            )}
          </div>
          <Mascot mood="success" height={150} className="-mb-5" />
        </Card>
        <div className="mt-auto pt-8">
          <Link href="/allowance" className="block">
            <Button disabled={a.walletUsd === 0n}>
              <Gift size={18} /> Set up my allowance
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const c = a.capsule;
  const left = c.rules.dailyCap > a.spentToday ? c.rules.dailyCap - a.spentToday : 0n;
  const canSpend = left < c.balance ? left : c.balance;
  const pct = c.rules.dailyCap > 0n ? Number((a.spentToday * 100n) / c.rules.dailyCap) : 0;
  const now = Number(a.now);
  const pts = points(rows, now);
  const lvl = levelFor(pts);
  const streak = streakDays(rows, now);

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
    <div className="flex flex-1 flex-col gap-4 pb-28">
      {header}
      <div className="mt-3">
        <h1 className="statement text-[40px] leading-[44px]">{greeting()}</h1>
        <p className="statement text-[24px] leading-[30px] text-muted">
          {c.frozen ? "Your allowance is paused." : `Your agent can spend ${usd(canSpend)} more today.`}
        </p>
      </div>

      <Card className="flex items-end justify-between overflow-hidden">
        <div className="min-w-0">
          <Label>{categoriesOf(c.rules.categories).map((x) => CATEGORY_LABEL[x]).join(" & ")} allowance</Label>
          <p className="statement tabular mt-2 text-[44px] leading-none">{usd(c.balance)}</p>
          <p className="mt-1 text-[12px] text-muted">AUSD in your allowance</p>
          <div className="mt-4 h-1.5 w-40 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-core" style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
          <p className="tabular mt-2 text-[12px] text-muted">
            {usd(a.spentToday)} of {usd(c.rules.dailyCap)} today · max {usd(c.rules.perTxCap)} each
          </p>
          <div className="mt-3">{c.frozen ? <Chip color="var(--needs)">Paused</Chip> : <Chip color="var(--paid)">Active</Chip>}</div>
        </div>
        <Mascot mood="success" height={170} className="-mb-5 -mr-2" />
      </Card>

      <Card className="flex items-center gap-4">
        <Mascot mood="avatar" height={64} glow={false} />
        <Link href="/points" className="min-w-0 flex-1">
          <Label className="!text-needs">{lvl.name} level</Label>
          <p className="tabular text-[26px] font-light leading-tight">{pts} pts</p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-needs" style={{ width: `${lvl.next ? Math.min((pts / lvl.next) * 100, 100) : 100}%` }} />
          </div>
          <p className="mt-1 text-[12px] text-faint">{lvl.next ? `${lvl.next - pts} to the next level` : "Top level"}</p>
        </Link>
        <div className="flex flex-col items-center text-needs">
          <Flame size={22} />
          <span className="tabular text-[18px] leading-tight text-text">{streak}</span>
          <span className="text-[11px] text-faint">days</span>
        </div>
      </Card>

      <div className="flex justify-around">
        <Round label="Ask family" onClick={() => shareAllowance(a.id!)}>
          <UserPlus size={20} />
        </Round>
        <Round label={c.frozen ? "Resume" : "Pause"} onClick={toggle}>
          {busy ? <Spinner /> : c.frozen ? <Play size={20} /> : <Pause size={20} />}
        </Round>
        <Round label="Rules" href="/settings">
          <Settings2 size={20} />
        </Round>
        <Round label="Counter" href="/merchant">
          <Store size={20} />
        </Round>
      </div>

      <RecentReceipts capsuleId={a.id} limit={3} />
      <BottomNav scanEnabled={!c.frozen} />
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
