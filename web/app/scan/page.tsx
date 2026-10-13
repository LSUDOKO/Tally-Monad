"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { RequireSession } from "@/components/RequireSession";
import { Button, Card, Header, Spinner, usd } from "@/components/ui";
import { rememberReceipt } from "@/lib/activity";
import { EXPLORER } from "@/lib/chain";
import { humanError } from "@/lib/errors";
import { agentPayload, type Pick } from "@/lib/firewall";
import { signIn as passkeyConfirm } from "@/lib/mera";
import { decodeQr, type Item, type SignedMenu } from "@/lib/menu";
import { pay, preflight, type Preflight } from "@/lib/pay";
import { useSession } from "@/lib/session";
import { CATEGORY_ICON, chainNow, readMerchant, type Merchant } from "@/lib/tally";
import { useAllowance } from "@/lib/useAllowance";
import { signedBy } from "@/lib/verify";
import { staleRecovery, type MenuSource } from "@/lib/flow";

const Scanner = dynamic(() => import("@yudiel/react-qr-scanner").then((m) => m.Scanner), { ssr: false });

type Stage =
  | { s: "scan" }
  | { s: "loading" }
  | { s: "menu"; menu: SignedMenu; merchant: Merchant; source: MenuSource }
  | { s: "thinking"; menu: SignedMenu; merchant: Merchant; source: MenuSource; request: string }
  | { s: "checkout"; menu: SignedMenu; merchant: Merchant; source: MenuSource; item: Item; pick: Pick & { by: string }; check: Preflight }
  | { s: "paying"; item: Item; merchant: Merchant; cosign: boolean }
  | { s: "paid"; item: Item; merchant: Merchant; hash: string; ms: number; cosigned: boolean };

const QUICK = ["Oat latte", "Large oat latte", "Croissant", "Masala chai"];

function ScanInner() {
  const { keys } = useSession();
  const a = useAllowance();
  const [st, setSt] = useState<Stage>({ s: "scan" });
  const [request, setRequest] = useState("");
  const [err, setErr] = useState<string>();

  const load = async (raw: string, source: MenuSource = "scan") => {
    setErr(undefined);
    setSt({ s: "loading" });
    try {
      const menu = decodeQr(raw);
      const merchant = await readMerchant(menu.header.merchant);
      if (!merchant || !merchant.active) throw new Error("This counter isn't registered with Tally.");
      if (!(await signedBy(menu, merchant.signingKey))) throw new Error("This menu wasn't signed by the counter. Don't pay it.");
      setSt({ s: "menu", menu, merchant, source });
    } catch (e) {
      setErr((e as Error).message.includes("Tally") || (e as Error).message.includes("counter") ? (e as Error).message : "That's not a Tally menu.");
      setSt({ s: "scan" });
    }
  };

  const demoCafe = async () => {
    const r = await fetch("/api/counter", { cache: "no-store" });
    await load((await r.json()).qr, "demo");
  };

  const ask = async (menu: SignedMenu, merchant: Merchant, source: MenuSource, text: string) => {
    if (!a.capsule || a.id === undefined) return;
    setErr(undefined);
    setSt({ s: "thinking", menu, merchant, source, request: text });
    const payload = agentPayload(text, a.capsule.rules, menu.items);
    const r = await fetch("/api/agent", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const pick = (await r.json()) as Pick & { by: string };
    const item = menu.items.find((i) => i.itemId === pick.item_id);
    if (!item) {
      setErr("Nothing on this menu matches. Try different words.");
      setSt({ s: "menu", menu, merchant, source });
      return;
    }
    const check = preflight(a.capsule, merchant.bond, menu, item, await chainNow());
    setSt({ s: "checkout", menu, merchant, source, item, pick, check });
  };

  const confirm = async (menu: SignedMenu, merchant: Merchant, source: MenuSource, item: Item, needsOwner: boolean) => {
    if (!keys || a.id === undefined) return;
    setErr(undefined);
    setSt({ s: "paying", item, merchant, cosign: needsOwner });
    let fresh: Awaited<ReturnType<typeof passkeyConfirm>> | undefined;
    try {
      if (needsOwner) fresh = await passkeyConfirm(); // Second Look: a new Face ID before the owner signs
      const r = await pay(keys.agent, fresh ? fresh.owner : null, a.id, menu, item);
      rememberReceipt({
        capsuleId: a.id,
        merchant: menu.header.merchant,
        itemId: item.itemId,
        category: item.category,
        price: item.price,
        cosigned: needsOwner,
        receipt: r.receipt,
        txHash: r.hash,
        timestamp: Math.floor(Date.now() / 1000),
        name: item.name,
        merchantName: merchant.name,
      });
      setSt({ s: "paid", item, merchant, hash: r.hash, ms: r.ms, cosigned: needsOwner });
      a.refresh();
    } catch (e) {
      const msg = humanError(e);
      if (msg.includes("Scan again")) {
        // the 60 s menu expired between the scan and the tap: recover from where it came from
        setErr("The menu refreshed.");
        if (staleRecovery(source).refetchDemo) await demoCafe();
        else setSt({ s: "scan" });
        return;
      }
      setErr(msg);
      setSt({ s: "menu", menu, merchant, source });
    } finally {
      fresh?.end();
    }
  };

  if (!a.loading && !a.capsule) {
    return (
      <div className="flex flex-1 flex-col">
        <Header title="Pay" back="/home" />
        <p className="text-muted">Set up your allowance first.</p>
        <Link href="/allowance" className="block mt-6">
          <Button>Set up my allowance</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 pb-24">
      <Header title="Pay" back="/home" />
      {err && <p className="rounded-2xl bg-blocked/10 p-3 text-sm text-blocked">{err}</p>}

      {st.s === "scan" && (
        <>
          <div className="overflow-hidden rounded-3xl border border-hairline">
            <Scanner onScan={(codes) => codes[0]?.rawValue && load(codes[0].rawValue)} formats={["qr_code"]} components={{ finder: true }} />
          </div>
          <p className="text-center text-sm text-muted">Point at the Tally code on the counter</p>
          <Button variant="ghost" onClick={demoCafe}>
            Use the demo café instead
          </Button>
        </>
      )}

      {st.s === "loading" && (
        <div className="grid flex-1 place-items-center">
          <Spinner />
        </div>
      )}

      {(st.s === "menu" || st.s === "thinking") && (
        <>
          <Card>
            <p className="text-lg font-semibold">{st.merchant.name}</p>
            <p className="mt-1 text-sm text-paid">✓ Menu signed by this counter · bond {usd(st.merchant.bond)}</p>
            <ul className="mt-3 divide-y divide-white/5">
              {st.menu.items.map((i) => (
                <li key={i.itemId} className="flex justify-between py-2 text-sm">
                  <span>
                    {CATEGORY_ICON[i.category]} {i.name}
                  </span>
                  <span className="tabular text-muted">{usd(i.price)}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <p className="text-sm text-muted">What would you like? Your assistant picks, Tally checks.</p>
            <input
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && request && ask(st.menu, st.merchant, st.source, request)}
              placeholder="e.g. oat latte"
              className="glass mt-3 h-12 w-full rounded-xl px-3 outline-none"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK.map((q) => (
                <button key={q} onClick={() => ask(st.menu, st.merchant, st.source, q)} className="rounded-full bg-white/5 px-3 py-1.5 text-sm">
                  {q}
                </button>
              ))}
            </div>
          </Card>
          <Button onClick={() => request && ask(st.menu, st.merchant, st.source, request)} disabled={!request || st.s === "thinking"}>
            {st.s === "thinking" ? <Spinner /> : "Ask my assistant"}
          </Button>
        </>
      )}

      {st.s === "checkout" && (
        <>
          <Card>
            <p className="text-sm text-muted">Your assistant picked</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xl font-semibold">
                {CATEGORY_ICON[st.item.category]} {st.item.name}
              </p>
              <p className="tabular text-2xl font-semibold">{usd(st.item.price)}</p>
            </div>
            <p className="mt-2 text-sm text-faint">
              “{st.pick.reason}” · {st.pick.by === "kimi" ? "Kimi" : "Tally rules"}
            </p>
            <ul className="mt-4 space-y-1 text-sm">
              <li className="text-paid">✓ On the counter&apos;s signed menu, at the signed price</li>
              <li className="text-paid">✓ Paid only to the counter&apos;s registered account</li>
              {st.check.ok ? (
                <li className="text-paid">✓ Inside your allowance rules</li>
              ) : (
                <li className="text-blocked">✗ {st.check.message}</li>
              )}
            </ul>
          </Card>

          {st.check.ok && st.check.needsOwner && (
            <Card className="border-needs/40">
              <p className="font-semibold text-needs">Second look</p>
              {st.check.reasons.map((r) => (
                <p key={r} className="mt-1 text-sm text-muted">
                  {r}
                </p>
              ))}
              <p className="mt-2 text-sm text-muted">Your assistant can&apos;t pay this alone. Approve it with Face ID, or pick the cheaper one.</p>
            </Card>
          )}

          {st.check.ok ? (
            <Button onClick={() => st.check.ok && confirm(st.menu, st.merchant, st.source, st.item, st.check.needsOwner)}>
              {st.check.needsOwner ? `Approve ${usd(st.item.price)} with Face ID` : `Pay ${usd(st.item.price)}`}
            </Button>
          ) : st.check.code === "stale" ? (
            <Button onClick={() => (staleRecovery(st.source).refetchDemo ? demoCafe() : setSt({ s: "scan" }))}>{staleRecovery(st.source).label}</Button>
          ) : null}
          <Button variant="ghost" onClick={() => setSt({ s: "menu", menu: st.menu, merchant: st.merchant, source: st.source })}>
            Pick something else
          </Button>
        </>
      )}

      {st.s === "paying" && (
        <div className="grid flex-1 place-items-center text-center">
          <div>
            <Spinner />
            <p className="mt-3 text-muted">{st.cosign ? "Waiting for your Face ID…" : `Paying ${st.merchant.name}…`}</p>
          </div>
        </div>
      )}

      {st.s === "paid" && (
        <div className="flex flex-1 flex-col items-center pt-10 text-center">
          <div className="grid h-24 w-24 place-items-center rounded-full bg-paid/15 text-5xl text-paid">✓</div>
          <p className="mt-6 text-3xl font-semibold">Paid {usd(st.item.price)}</p>
          <p className="mt-1 text-muted">
            {st.item.name} · {st.merchant.name}
          </p>
          <p className="mt-1 text-sm text-faint">
            Settled in {(st.ms / 1000).toFixed(1)} s{st.cosigned ? " · approved by you" : ""}
          </p>
          <a href={`${EXPLORER}/tx/${st.hash}`} target="_blank" rel="noreferrer" className="mt-4 text-sm text-brand-bright">
            Proof ›
          </a>
          <div className="mt-auto w-full space-y-3 pt-10">
            <Link href="/home" className="block">
              <Button>Done</Button>
            </Link>
            <Button variant="ghost" onClick={() => setSt({ s: "scan" })}>
              Pay again
            </Button>
          </div>
        </div>
      )}
      {st.s !== "paid" && <BottomNav />}
    </div>
  );
}

export default function ScanPage() {
  return (
    <RequireSession>
      <ScanInner />
    </RequireSession>
  );
}
