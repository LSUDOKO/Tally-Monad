"use client";

import { Ban, Download } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Mascot } from "@/components/Mascot";
import { ReceiptRow, TopupRow } from "@/components/RecentReceipts";
import { RequireSession } from "@/components/RequireSession";
import { Card, Chip, Label, Spinner, Tile, usd } from "@/components/ui";
import { blockedAttempts, getReceipts, getTopups, indexerOn, type Blocked, type Receipt, type Topup } from "@/lib/activity";
import { EXPLORER } from "@/lib/chain";
import { CATEGORY_LABEL } from "@/lib/tally";
import { useAllowance } from "@/lib/useAllowance";

const WEEK = 7 * 86_400;

type Row = { t: number; kind: "paid"; r: Receipt } | { t: number; kind: "topup"; r: Topup } | { t: number; kind: "blocked"; r: Blocked };

function BlockedRow({ b }: { b: Blocked }) {
  return (
    <li className="py-3">
      <div className="flex items-start gap-3">
        <Tile color="var(--blocked)">
          <Ban size={18} />
        </Tile>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium">{b.title}</p>
          <p className="text-[13px] text-muted">{b.reason}</p>
        </div>
        <p className="tabular text-[15px] text-blocked line-through decoration-1">{usd(b.price)}</p>
      </div>
    </li>
  );
}

function csv(rows: Receipt[]) {
  const head = "time,item,category,price_usd,approved_by_you,tx";
  const body = rows.map((r) =>
    [new Date(r.timestamp * 1000).toISOString(), JSON.stringify(r.name ?? ""), CATEGORY_LABEL[r.category], (Number(r.price) / 1e6).toFixed(2), r.cosigned, `${EXPLORER}/tx/${r.txHash}`].join(","),
  );
  const url = URL.createObjectURL(new Blob([[head, ...body].join("\n")], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "tally-receipts.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function ReceiptsInner() {
  const a = useAllowance();
  const [paid, setPaid] = useState<Receipt[]>();
  const [tops, setTops] = useState<Topup[]>([]);
  const [blocked, setBlocked] = useState<Blocked[]>([]);

  useEffect(() => {
    if (a.id === undefined) return;
    getReceipts(a.id, 100).then(setPaid);
    getTopups(a.id).then(setTops);
    setBlocked(blockedAttempts(a.id));
  }, [a.id]);

  const timeline: Row[] = useMemo(
    () =>
      [
        ...(paid ?? []).map((r) => ({ t: r.timestamp, kind: "paid" as const, r })),
        ...tops.map((r) => ({ t: r.timestamp, kind: "topup" as const, r })),
        ...blocked.map((r) => ({ t: r.timestamp, kind: "blocked" as const, r })),
      ].sort((x, y) => y.t - x.t),
    [paid, tops, blocked],
  );

  const week = useMemo(() => {
    const since = Math.floor(Date.now() / 1000) - WEEK;
    const by = new Map<number, bigint>();
    for (const r of paid ?? []) if (r.timestamp >= since) by.set(r.category, (by.get(r.category) ?? 0n) + r.price);
    const total = [...by.values()].reduce((x, y) => x + y, 0n);
    return { total, parts: [...by.entries()].sort((x, y) => Number(y[1] - x[1])) };
  }, [paid]);

  return (
    <div className="flex flex-1 flex-col gap-4 pb-28">
      <div className="mt-4 flex items-start justify-between gap-2">
        <div>
          <h1 className="statement text-[36px] leading-[40px]">
            Every payment,
            <br />
            on the record.
          </h1>
          <p className="mt-2 text-[14px] text-muted">Paid purchases, family top-ups and blocked attempts, each paid one with its Monad transaction.</p>
          <button onClick={() => paid && csv(paid)} className="mt-3">
            <Chip icon={<Download size={13} />}>Export CSV</Chip>
          </button>
        </div>
        <Mascot mood="editorial" height={150} />
      </div>

      <Card>
        <Label>This week</Label>
        <p className="statement tabular mt-1 text-[32px]">{usd(week.total)}</p>
        <div className="mt-3 flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-white/10">
          {week.parts.map(([c, v], i) => (
            <div key={c} style={{ width: `${week.total ? Number((v * 100n) / week.total) : 0}%`, opacity: 1 - i * 0.22 }} className="h-full bg-brand-bright" />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-[12px] text-muted">
          {week.parts.map(([c, v]) => (
            <span key={c} className="inline-flex items-center gap-1">
              <CategoryIcon category={c} size={13} /> {CATEGORY_LABEL[c]} {usd(v)}
            </span>
          ))}
        </div>
      </Card>

      <section className="glass rounded-[28px] px-5 py-1">
        {paid === undefined ? (
          <div className="grid place-items-center py-8">
            <Spinner />
          </div>
        ) : timeline.length === 0 ? (
          <p className="py-6 text-center text-[14px] text-faint">No payments yet. Scan a counter to make your first one.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {timeline.map((x, i) =>
              x.kind === "paid" ? <ReceiptRow key={`p${i}`} r={x.r} /> : x.kind === "topup" ? <TopupRow key={`t${i}`} t={x.r} /> : <BlockedRow key={`b${i}`} b={x.r} />,
            )}
          </ul>
        )}
      </section>
      <p className="text-center text-[12px] text-faint">{indexerOn() ? "History indexed by Envio HyperIndex" : "Showing activity from this device"}</p>
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
