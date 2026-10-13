"use client";

import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useState } from "react";
import { stringToBytes, toHex } from "viem";
import { Button, Card, Header, Spinner, usd } from "@/components/ui";
import { getSales, type Receipt } from "@/lib/activity";
import { TALLY_ABI } from "@/lib/abi";
import { TALLY } from "@/lib/chain";
import { rowsToItems, signMenu, type MenuRow } from "@/lib/counter";
import { encodeQr } from "@/lib/menu";
import { useSession } from "@/lib/session";
import { CATEGORY_LABEL, approveUsd, chainNow, readMerchant, send, usdBalance, type Merchant } from "@/lib/tally";

type Row = MenuRow;
const DEFAULT_MENU: Row[] = [
  { name: "Filter coffee", price: 2, category: 3 },
  { name: "Cappuccino", price: 3.5, category: 3 },
  { name: "Veg sandwich", price: 4, category: 0 },
];
const BOND = 25_000_000n;

export default function MerchantPage() {
  const s = useSession();
  const [m, setM] = useState<Merchant | null>();
  const [rows, setRows] = useState<Row[]>(DEFAULT_MENU);
  const [shop, setShop] = useState("My Café");
  const [qr, setQr] = useState<string>();
  const [sales, setSales] = useState<Receipt[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>();

  const owner = s.keys?.owner;

  const refresh = useCallback(async () => {
    if (!owner) return;
    setM(await readMerchant(owner.address));
    setSales(await getSales(owner.address));
  }, [owner]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // re-sign the menu every 20 s with the passkey's third key
  useEffect(() => {
    if (!s.keys || !m) return;
    let stop = false;
    const sign = async () => {
      const menu = await signMenu(s.keys!.merchant, s.keys!.owner.address, rowsToItems(rows), Number(await chainNow()), BigInt(Date.now()));
      if (!stop) setQr(encodeQr(menu));
    };
    sign();
    const t = setInterval(sign, 20_000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [s.keys, m, rows]);

  const open = async () => {
    if (!s.keys) return;
    setBusy(true);
    setErr(undefined);
    try {
      if ((await usdBalance(s.keys.owner.address)) < BOND) throw new Error("You need $25 for the counter's bond.");
      await approveUsd(s.keys.owner, BOND);
      const name = toHex(stringToBytes(shop.slice(0, 31)), { size: 32 });
      await send(s.keys.owner, {
        address: TALLY,
        abi: TALLY_ABI,
        functionName: "registerMerchant",
        args: [name, s.keys.merchant.address, s.keys.owner.address, BOND],
      });
      await refresh();
    } catch (e) {
      setErr((e as Error).message.startsWith("You need") ? (e as Error).message : "Couldn't open the counter. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (s.status !== "signed-in") {
    return (
      <div className="flex flex-1 flex-col">
        <Header title="Open a counter" back="/" />
        <p className="text-muted">Take Tally payments at your café. Your menu is signed by your Face ID; every sale settles in under a second.</p>
        {s.error && <p className="mt-4 rounded-2xl bg-blocked/10 p-3 text-sm text-blocked">{s.error}</p>}
        <div className="mt-auto space-y-3">
          <Button onClick={() => s.signUp("Merchant")} disabled={s.status === "working"}>
            {s.status === "working" ? <Spinner /> : "Create with Face ID"}
          </Button>
          <Button variant="ghost" onClick={() => s.signIn()}>
            I already have Tally
          </Button>
        </div>
      </div>
    );
  }

  if (m === undefined) {
    return (
      <div className="grid flex-1 place-items-center">
        <Spinner />
      </div>
    );
  }

  const total = sales.reduce((a, r) => a + r.price, 0n);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Header title={m ? m.name : "Open a counter"} back="/home" />

      {!m ? (
        <>
          <Card className="space-y-3">
            <input value={shop} onChange={(e) => setShop(e.target.value)} className="glass h-12 w-full rounded-xl px-3 outline-none" placeholder="Shop name" />
            <p className="text-sm text-muted">
              A $25 bond shows customers you&apos;re honest. If your signed menu ever lies about its cheapest price, anyone can claim part of it.
            </p>
          </Card>
          {err && <p className="rounded-2xl bg-blocked/10 p-3 text-sm text-blocked">{err}</p>}
          <Button onClick={open} disabled={busy}>
            {busy ? <Spinner /> : "Open my counter"}
          </Button>
        </>
      ) : (
        <>
          <Card className="flex flex-col items-center">
            <div className="rounded-2xl bg-white p-3">{qr ? <QRCodeSVG value={qr} size={300} level="L" marginSize={1} /> : <div className="h-60 w-60" />}</div>
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-paid/30 bg-paid/10 px-3 py-1.5 text-[13px] text-paid">● Live · signed by your passkey · re-signs every ~20 s · {rows.length} items</p>
          </Card>

          <Card className="space-y-3">
            <p className="text-sm text-muted">Menu</p>
            {rows.map((r, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={r.name}
                  onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                  className="glass h-11 min-w-0 flex-1 rounded-xl px-3 outline-none"
                />
                <select
                  value={r.category}
                  onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, category: Number(e.target.value) } : x)))}
                  className="glass h-11 rounded-xl px-2"
                >
                  {[0, 1, 2, 3, 5].map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABEL[c]}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.1"
                  value={r.price}
                  onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, price: Number(e.target.value) } : x)))}
                  className="glass tabular h-11 w-20 rounded-xl px-2 outline-none"
                />
              </div>
            ))}
            <button className="text-sm text-brand-bright" onClick={() => setRows([...rows, { name: "New item", price: 1, category: 0 }])}>
              + Add item
            </button>
          </Card>

          <Card>
            <div className="flex justify-between">
              <p className="text-sm text-muted">Sales</p>
              <p className="tabular font-medium">{usd(total)}</p>
            </div>
            <ul className="mt-2 divide-y divide-white/5">
              {sales.slice(0, 8).map((r) => (
                <li key={r.txHash} className="flex justify-between py-2 text-sm">
                  <span>{CATEGORY_LABEL[r.category]}</span>
                  <span className="tabular">{usd(r.price)}</span>
                </li>
              ))}
              {sales.length === 0 && <li className="py-2 text-sm text-faint">No sales yet</li>}
            </ul>
            <p className="mt-3 text-xs text-faint">Bond {usd(m.bond)} · slashed {usd(m.slashedTotal)}</p>
          </Card>
        </>
      )}
    </div>
  );
}
