"use client";

import { ExternalLink, HeartHandshake } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getReceipts, getTopups, type Receipt, type Topup } from "@/lib/activity";
import { EXPLORER } from "@/lib/chain";
import { CategoryIcon } from "./CategoryIcon";
import { Label, Tile, usd } from "./ui";

const ago = (t: number) => {
  const s = Math.max(0, Math.floor(Date.now() / 1000) - t);
  return s < 60 ? "now" : s < 3600 ? `${Math.floor(s / 60)} min ago` : s < 86_400 ? `${Math.floor(s / 3600)} h ago` : new Date(t * 1000).toLocaleDateString();
};

export function ReceiptRow({ r }: { r: Receipt }) {
  return (
    <li className="flex items-center gap-3 py-3">
      <Tile color={r.cosigned ? "var(--needs)" : "var(--brand-bright)"}>
        <CategoryIcon category={r.category} />
      </Tile>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium">{r.name ?? "Purchase"}</p>
        <p className="truncate text-[12px] text-faint">
          {r.merchantName ?? "Tally counter"} · {ago(r.timestamp)}
          {r.cosigned && <span className="text-needs"> · approved by you</span>}
        </p>
      </div>
      <div className="text-right">
        <p className="tabular text-[15px]">{usd(r.price)}</p>
        <a href={`${EXPLORER}/tx/${r.txHash}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] text-brand-bright">
          Explorer <ExternalLink size={11} />
        </a>
      </div>
    </li>
  );
}

export function TopupRow({ t }: { t: Topup }) {
  return (
    <li className="flex items-center gap-3 py-3">
      <Tile color="var(--paid)">
        <HeartHandshake size={18} />
      </Tile>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium">{t.note || "Top-up from family"}</p>
        <p className="text-[12px] text-faint">From family · {ago(t.timestamp)}</p>
      </div>
      <p className="tabular text-[15px] text-paid">+{usd(t.amount)}</p>
    </li>
  );
}

/** `refreshKey` changes when the balance moves, so a new payment or family top-up shows up without a reload. */
export function RecentReceipts({ capsuleId, limit, owner, refreshKey }: { capsuleId: bigint; limit: number; owner?: string; refreshKey?: string }) {
  const [rows, setRows] = useState<Receipt[]>([]);
  const [tops, setTops] = useState<Topup[]>([]);
  useEffect(() => {
    getReceipts(capsuleId, limit).then(setRows);
    getTopups(capsuleId, owner).then((t) => setTops(t.slice(0, 1)));
  }, [capsuleId, limit, owner, refreshKey]);
  if (rows.length === 0 && tops.length === 0) return null;
  return (
    <section className="glass rounded-[28px] px-5 pb-1 pt-4">
      <div className="flex items-center justify-between">
        <Label>Recent payments</Label>
        <Link href="/receipts" className="text-[13px] text-brand-bright">
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
