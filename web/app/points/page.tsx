"use client";

import { BadgeCheck, Flame, Lock, ShieldCheck } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Mascot } from "@/components/Mascot";
import { RequireSession } from "@/components/RequireSession";
import { Card, Header, Label, Tile } from "@/components/ui";
import { getReceipts, type Receipt } from "@/lib/activity";
import { LEVELS, levelFor, multiplier, points, streakDays } from "@/lib/points";
import { useAllowance } from "@/lib/useAllowance";

function How({ icon, color, children }: { icon: ReactNode; color: string; children: ReactNode }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <Tile color={color}>{icon}</Tile>
      <p className="text-[14px]">{children}</p>
    </li>
  );
}

function PointsInner() {
  const a = useAllowance();
  const [rows, setRows] = useState<Receipt[]>([]);
  useEffect(() => {
    if (a.id !== undefined) getReceipts(a.id, 200).then(setRows);
  }, [a.id]);
  const now = Number(a.now) || Math.floor(Date.now() / 1000);
  const pts = points(rows, now);
  const lvl = levelFor(pts);
  const streak = streakDays(rows, now);

  return (
    <div className="flex flex-1 flex-col gap-4 pb-28">
      <Header title="Tally Points" back="/home" />
      <div className="flex flex-col items-center text-center">
        <Mascot mood="success" height={220} />
        <Label className="mt-2 !text-needs">{lvl.name} level</Label>
        <p className="statement tabular text-[44px] leading-tight">{pts} points</p>
        <p className="text-[14px] text-muted">
          <Flame size={14} className="inline text-needs" /> {streak}-day streak · {multiplier(streak).toFixed(1)}× points
        </p>
      </div>
      <Card>
        <Label>How points work</Label>
        <ul className="mt-1">
          <How icon={<BadgeCheck size={17} />} color="var(--paid)">+10 for every settled purchase of $1 or more</How>
          <How icon={<Flame size={17} />} color="var(--needs)">Daily streaks multiply points, up to 1.5×</How>
          <How icon={<ShieldCheck size={17} />} color="var(--brand-bright)">Only on-chain receipts count. Red-team runs and blocked attempts earn nothing.</How>
          <How icon={<Lock size={17} />} color="var(--faint)">Points can&apos;t be bought or sent to anyone</How>
        </ul>
      </Card>
      <Card>
        <Label>Levels</Label>
        <ul className="mt-2 space-y-2">
          {LEVELS.map((l) => (
            <li key={l.name} className={`flex justify-between text-[15px] ${l.name === lvl.name ? "text-text" : "text-faint"}`}>
              <span>{l.name}</span>
              <span className="tabular">{l.at} pts</span>
            </li>
          ))}
        </ul>
      </Card>
      <BottomNav />
    </div>
  );
}

export default function PointsPage() {
  return (
    <RequireSession>
      <PointsInner />
    </RequireSession>
  );
}
