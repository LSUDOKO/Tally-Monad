"use client";

import { useEffect, useMemo, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { ReceiptRow, TopupRow } from "@/components/RecentReceipts";
import { RequireSession } from "@/components/RequireSession";
import { Card, Header, Spinner, usd } from "@/components/ui";
import { getReceipts, getTopups, indexerOn, type Receipt, type Topup } from "@/lib/activity";
import { CATEGORY_ICON, CATEGORY_LABEL } from "@/lib/tally";
import { useAllowance } from "@/lib/useAllowance";

const WEEK = 7 * 86_400;

function ReceiptsInner() {
  const a = useAllowance();
  const [rows, setRows] = useState<Receipt[]>();
  const [tops, setTops] = useState<Topup[]>([]);

  useEffect(() => {
    if (a.id === undefined) return;
    getReceipts(a.id, 100).then(setRows);
    getTopups(a.id).then(setTops);
  }, [a.id]);

  const week = useMemo(() => {
    const since = Math.floor(Date.now() / 1000) - WEEK;
    const by = new Map<number, bigint>();
    for (const r of rows ?? []) if (r.timestamp >= since) by.set(r.category, (by.get(r.category) ?? 0n) + r.price);
    const total = [...by.values()].reduce((x, y) => x + y, 0n);
    return { total, parts: [...by.entries()].sort((x, y) => Number(y[1] - x[1])) };
  }, [rows]);

  return (
    <div className="flex flex-1 flex-col gap-4 pb-24">
      <Header title="Receipts" back="/home" />
      <Card>
        <p className="text-sm text-muted">This week</p>
        <p className="tabular mt-1 text-3xl font-semibold">{usd(week.total)}</p>
        <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-white/10">
          {week.parts.map(([c, v], i) => (
            <div
              key={c}
              style={{ width: `${week.total ? Number((v * 100n) / week.total) : 0}%`, opacity: 1 - i * 0.2 }}
              className="h-full bg-brand-bright"
            />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
          {week.parts.map(([c, v]) => (
            <span key={c}>
              {CATEGORY_ICON[c]} {CATEGORY_LABEL[c]} {usd(v)}
            </span>
          ))}
        </div>
      </Card>

      <section className="glass rounded-3xl px-5 py-2">
        {rows === undefined ? (
          <div className="grid place-items-center py-8">
            <Spinner />
          </div>
        ) : rows.length + tops.length === 0 ? (
          <p className="py-6 text-center text-sm text-faint">No payments yet</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {tops.map((t) => (
              <TopupRow key={t.txHash} t={t} />
            ))}
            {rows.map((r) => (
              <ReceiptRow key={r.txHash} r={r} />
            ))}
          </ul>
        )}
      </section>
      <p className="text-center text-xs text-faint">{indexerOn() ? "History indexed by Envio" : "Showing payments made on this device"}</p>
      <BottomNav />
    </div>
  );
}

export default function ReceiptsPage() {
  return (
    <RequireSession>
      <ReceiptsInner />
    </RequireSession>
  );
}
