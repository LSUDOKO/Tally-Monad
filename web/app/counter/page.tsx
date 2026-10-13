"use client";

import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { DEMO_ITEMS } from "@/lib/counter";
import { usd } from "@/components/ui";

const REFRESH_MS = 20_000;

/** Open on a laptop or tablet at the counter; customers scan it with Tally. */
export default function Counter() {
  const [qr, setQr] = useState<string>();
  const [left, setLeft] = useState(20);

  useEffect(() => {
    let stop = false;
    const load = async () => {
      const r = await fetch("/api/counter", { cache: "no-store" });
      const j = await r.json();
      if (!stop) {
        setQr(j.qr);
        setLeft(REFRESH_MS / 1000);
      }
    };
    load();
    const t = setInterval(load, REFRESH_MS);
    const tick = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => {
      stop = true;
      clearInterval(t);
      clearInterval(tick);
    };
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center text-center">
      <div className="flex items-center gap-2">
        <Image src="/mark.svg" alt="" width={28} height={28} className="rounded-lg" />
        <span className="font-semibold">Tally Demo Café</span>
      </div>
      <p className="mt-2 text-sm text-muted">Scan with Tally to pay. The menu re-signs every 20 seconds.</p>
      <div className="mt-6 rounded-3xl bg-white p-4">
        {qr ? <QRCodeSVG value={qr} size={300} level="M" /> : <div className="h-[300px] w-[300px] animate-pulse rounded-2xl bg-slate-200" />}
      </div>
      <p className="tabular mt-3 text-sm text-faint">New code in {left}s</p>
      <ul className="glass mt-6 w-full divide-y divide-white/5 rounded-3xl px-5 text-left">
        {DEMO_ITEMS.map((i) => (
          <li key={i.itemId} className="flex justify-between py-3">
            <span>{i.name}</span>
            <span className="tabular text-muted">{usd(i.price)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
