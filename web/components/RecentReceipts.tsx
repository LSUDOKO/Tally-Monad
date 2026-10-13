"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getReceipts, getTopups, type Receipt, type Topup } from "@/lib/activity";
import { EXPLORER } from "@/lib/chain";
import { CATEGORY_ICON } from "@/lib/tally";
import { usd } from "./ui";

const when = (t: number) =>
  new Date(t * 1000).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });

export function ReceiptRow({ r }: { r: Receipt }) {
  return (
    <li className="flex items-center gap-3 py-3">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/5 text-lg">{CATEGORY_ICON[r.category] ?? "•"}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{r.name ?? "Purchase"}</p>
        <p className="text-xs text-faint">
          {r.merchantName ?? "Tally counter"} · {when(r.timestamp)}
          {r.cosigned && <span className="ml-1 text-needs">· approved by you</span>}
        </p>
      </div>
      <div className="text-right">
        <p className="tabular font-medium">−{usd(r.price)}</p>
        <a href={`${EXPLORER}/tx/${r.txHash}`} target="_blank" rel="noreferrer" className="text-xs text-brand-bright">
          Proof ›
        </a>
      </div>
    </li>
  );
}

export function TopupRow({ t }: { t: Topup }) {
  return (
    <li className="flex items-center gap-3 py-3">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-paid/10 text-lg">💌</span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{t.note || "Top-up"}</p>
        <p className="text-xs text-faint">From family · {when(t.timestamp)}</p>
      </div>
      <p className="tabular font-medium text-paid">+{usd(t.amount)}</p>
    </li>
  );
}

export function RecentReceipts({ capsuleId, limit }: { capsuleId: bigint; limit: number }) {
  const [rows, setRows] = useState<Receipt[]>([]);
  const [tops, setTops] = useState<Topup[]>([]);
  useEffect(() => {
    getReceipts(capsuleId, limit).then(setRows);
    getTopups(capsuleId).then((t) => setTops(t.slice(0, 1)));
  }, [capsuleId, limit]);
  if (rows.length === 0 && tops.length === 0) return null;
  return (
    <section className="glass rounded-3xl px-5 py-2">
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-sm text-muted">Recent</h2>
        <Link href="/receipts" className="text-sm text-brand-bright">
          All
        </Link>
      </div>
      <ul className="divide-y divide-white/5">
        {tops.map((t) => (
          <TopupRow key={t.txHash} t={t} />
        ))}
        {rows.map((r) => (
          <ReceiptRow key={r.txHash} r={r} />
        ))}
      </ul>
    </section>
  );
}
