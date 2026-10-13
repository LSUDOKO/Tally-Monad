"use client";

import { BadgeCheck, Bot, ExternalLink, Fingerprint, Plus, Radio, ShieldCheck, Snowflake, Sparkles, Store, X, Zap } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Mascot } from "@/components/Mascot";
import { RequireSession } from "@/components/RequireSession";
import { Button, Card, Chip, Header, Label, Mono, Spinner, Tile, usd } from "@/components/ui";
import { rememberBlocked, rememberReceipt } from "@/lib/activity";
import { EXPLORER } from "@/lib/chain";
import { humanError } from "@/lib/errors";
import { agentPayload, type Pick } from "@/lib/firewall";
import { staleRecovery, type MenuSource } from "@/lib/flow";
import { signIn as passkeyConfirm } from "@/lib/mera";
import { decodeQr, type Item, type SignedMenu } from "@/lib/menu";
import { alreadyPaid, pay, preflight, type Preflight } from "@/lib/pay";
import { useSession } from "@/lib/session";
import { chainNow, readMerchant, setFrozen, type Merchant } from "@/lib/tally";
import { useAllowance } from "@/lib/useAllowance";
import { signedBy } from "@/lib/verify";

const Scanner = dynamic(() => import("@yudiel/react-qr-scanner").then((m) => m.Scanner), { ssr: false });

type Ctx = { menu: SignedMenu; merchant: Merchant; source: MenuSource };
type Stage =
  | { s: "scan" }
  | { s: "loading" }
  | ({ s: "menu" } & Ctx)
  | ({ s: "thinking"; request: string } & Ctx)
  | ({ s: "checkout"; item: Item; pick: Pick & { by: string }; check: Preflight; sheet: boolean } & Ctx)
  | { s: "paying"; item: Item; merchant: Merchant; cosign: boolean }
  | ({ s: "paid"; item: Item; hash: string; ms: number; cosigned: boolean } & Ctx);

const QUICK = ["Oat latte", "Large oat latte", "Croissant", "Masala chai"];

function SignedMenuList({ ctx, onPick }: { ctx: Ctx; onPick?: (i: Item) => void }) {
  return (
    <Card>
      <Label>Signed menu · shown to you, not the agent</Label>
      <ul className="mt-2 divide-y divide-white/5">
        {ctx.menu.items.map((i) => (
          <li key={i.itemId} className="flex items-center gap-3 py-2.5">
            <Tile>
              <CategoryIcon category={i.category} />
            </Tile>
            <span className="min-w-0 flex-1 truncate text-[15px]">{i.name}</span>
            <span className="text-right">
              <span className="tabular block text-[15px]">{usd(i.price)}</span>
              {i.price === i.floor && <span className="block text-[11px] text-paid">cheapest</span>}
            </span>
            {onPick && (
              <button onClick={() => onPick(i)} aria-label={`Choose ${i.name}`} className="grid h-8 w-8 place-items-center rounded-full text-muted">
                <Plus size={18} />
              </button>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function CounterChips({ m, live }: { m: Merchant; live: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Chip color="var(--paid)" icon={<BadgeCheck size={14} />}>
        {usd(m.bond)} bonded
      </Chip>
      <Chip icon={<Radio size={14} />}>{live ? "Live menu" : "Printed menu"}</Chip>
    </div>
  );
}

function ScanInner() {
  const { keys } = useSession();
  const a = useAllowance();
  const [st, setSt] = useState<Stage>({ s: "scan" });
  const [request, setRequest] = useState("");
  const [err, setErr] = useState<string>();
  const [frozen, setFrozenNow] = useState(false);

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
      const m = (e as Error).message;
      setErr(m.includes("Tally") || m.includes("counter") ? m : "That's not a Tally menu.");
      setSt({ s: "scan" });
    }
  };

  const demoCafe = async () => {
    try {
      const r = await fetch("/api/counter", { cache: "no-store" });
      await load((await r.json()).qr, "demo");
    } catch {
      setErr("Couldn't reach the demo café. Try again.");
      setSt({ s: "scan" });
    }
  };

  const review = async (ctx: Ctx, item: Item, pick: Pick & { by: string }) => {
    if (!a.capsule || a.id === undefined) return;
    let check = preflight(a.capsule, ctx.merchant.bond, ctx.menu, item, await chainNow());
    if (check.ok && (await alreadyPaid(a.id, ctx.menu, item).catch(() => false))) {
      check = { ok: false, code: "paid", message: "Already paid. You won't be charged twice." };
    }
    if (!check.ok && a.id !== undefined && check.code !== "stale") {
      rememberBlocked(a.id, { title: item.name, reason: check.message, price: item.price, timestamp: Math.floor(Date.now() / 1000) });
    }
    setSt({ s: "checkout", ...ctx, item, pick, check, sheet: false });
  };

  const ask = async (ctx: Ctx, text: string) => {
    if (!a.capsule) return;
    setErr(undefined);
    setSt({ s: "thinking", ...ctx, request: text });
    try {
      const payload = agentPayload(text, a.capsule.rules, ctx.menu.items);
      const r = await fetch("/api/agent", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const pick = (await r.json()) as Pick & { by: string };
      const item = ctx.menu.items.find((i) => i.itemId === pick.item_id);
      if (!item) {
        setErr("Nothing on this menu matches. Try different words.");
        setSt({ s: "menu", ...ctx });
        return;
      }
      await review(ctx, item, pick);
    } catch {
      setErr("Your agent couldn't answer. Pick from the menu below.");
      setSt({ s: "menu", ...ctx });
    }
  };

  const confirm = async (ctx: Ctx, item: Item, needsOwner: boolean) => {
    if (!keys || a.id === undefined) return;
    setErr(undefined);
    setSt({ s: "paying", item, merchant: ctx.merchant, cosign: needsOwner });
    let fresh: Awaited<ReturnType<typeof passkeyConfirm>> | undefined;
    try {
      if (needsOwner) {
        fresh = await passkeyConfirm(); // Second Look: a fresh Face ID before your key signs
        if (fresh.owner.address !== keys.owner.address) throw new Error("other-passkey");
      }
      const r = await pay(keys.agent, fresh ? fresh.owner : null, a.id, ctx.menu, item);
      rememberReceipt({
        capsuleId: a.id,
        merchant: ctx.menu.header.merchant,
        itemId: item.itemId,
        category: item.category,
        price: item.price,
        cosigned: needsOwner,
        receipt: r.receipt,
        txHash: r.hash,
        timestamp: Math.floor(Date.now() / 1000),
        name: item.name,
        merchantName: ctx.merchant.name,
      });
      setSt({ s: "paid", ...ctx, item, hash: r.hash, ms: r.ms, cosigned: needsOwner });
      a.refresh();
    } catch (e) {
      const m = (e as Error).message;
      if (m === "other-passkey") {
        setErr("That was a different passkey. Approve with the one you signed in with.");
        setSt({ s: "menu", ...ctx });
        return;
      }
      const msg = humanError(e);
      if (msg.includes("Scan again")) {
        setErr("The menu refreshed.");
        if (staleRecovery(ctx.source).refetchDemo) await demoCafe();
        else setSt({ s: "scan" });
        return;
      }
      rememberBlocked(a.id, { title: item.name, reason: msg, price: item.price, timestamp: Math.floor(Date.now() / 1000) });
      setErr(msg);
      setSt({ s: "menu", ...ctx });
    } finally {
      fresh?.end();
    }
  };

  const freeze = async () => {
    if (!keys || a.id === undefined) return;
    await setFrozen(keys.owner, a.id, true);
    setFrozenNow(true);
    a.refresh();
  };

  if (!a.loading && !a.capsule) {
    return (
      <div className="flex flex-1 flex-col">
        <Header title="Scan or tap" back="/home" />
        <p className="text-muted">Set up your allowance first.</p>
        <Link href="/allowance" className="mt-6 block">
          <Button>Set up my allowance</Button>
        </Link>
      </div>
    );
  }

  const errBox = err && <p className="rounded-2xl bg-blocked/10 p-3 text-[14px] text-blocked">{err}</p>;

  if (st.s === "scan" || st.s === "loading") {
    return (
      <div className="flex flex-1 flex-col gap-4 pb-28">
        <Header title="Scan or tap" back="/home" />
        {errBox}
        <div className="overflow-hidden rounded-[28px] border-2 border-white/15">
          {st.s === "loading" ? (
            <div className="grid aspect-square place-items-center bg-black/40">
              <Spinner />
            </div>
          ) : (
            <Scanner onScan={(codes) => codes[0]?.rawValue && load(codes[0].rawValue)} formats={["qr_code"]} components={{ finder: true }} />
          )}
        </div>
        <div className="flex items-center gap-3">
          <Mascot mood="thinking" height={110} />
          <div>
            <p className="text-[17px] font-medium">Point at the counter&apos;s QR</p>
            <p className="text-[13px] text-muted">The menu is signed by the counter and re-signed every 20 seconds.</p>
          </div>
        </div>
        <Button variant="ghost" onClick={demoCafe} disabled={st.s === "loading"}>
          <Store size={18} /> Use the demo café
        </Button>
        <BottomNav />
      </div>
    );
  }

  if (st.s === "paying") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <Mascot mood="thinking" height={200} />
        <Spinner />
        <p className="text-muted">{st.cosign ? "Waiting for your Face ID…" : `Your agent is paying ${st.merchant.name}…`}</p>
      </div>
    );
  }

  if (st.s === "paid") {
    return (
      <div className="flex flex-1 flex-col gap-4 pb-28">
        <div className="glass glass-strong flex items-start gap-3 rounded-3xl p-4">
          <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand-bright" />
          <div className="min-w-0 flex-1">
            <p className="text-[14px]">
              Your agent paid {usd(st.item.price)} · now
            </p>
            <p className="truncate text-[13px] text-muted">
              {st.item.name} at {st.merchant.name}
            </p>
            {frozen ? (
              <p className="mt-2 text-[13px] text-needs">Allowance paused</p>
            ) : (
              <button onClick={freeze} className="mt-2 inline-flex items-center gap-1 text-[13px] text-brand-bright">
                <Snowflake size={13} /> Wasn&apos;t you? Pause allowance
              </button>
            )}
          </div>
        </div>
        <div className="flex justify-center">
          <Mascot mood="success" height={210} />
        </div>
        <Card tint="var(--paid)">
          <p className="flex items-center gap-2 text-[22px] font-light text-paid">
            <BadgeCheck size={22} /> Paid {usd(st.item.price)} AUSD
          </p>
          <p className="mt-2 text-[14px] text-muted">
            {st.item.name}, straight to {st.merchant.name}&apos;s registered account. Settled in {(st.ms / 1000).toFixed(1)} s
            {st.cosigned ? ", approved by you." : "."}
          </p>
          <a href={`${EXPLORER}/tx/${st.hash}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex">
            <Chip icon={<ExternalLink size={13} />}>View on Monad explorer</Chip>
          </a>
        </Card>
        <SignedMenuList ctx={st} />
        <div className="grid grid-cols-2 gap-3">
          <Link href="/home" className="block">
            <Button variant="ghost">Done</Button>
          </Link>
          <Button onClick={() => setSt({ s: "scan" })}>Pay again</Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // menu / thinking / checkout share the counter header
  const ctx: Ctx = { menu: st.menu, merchant: st.merchant, source: st.source };
  const live = st.menu.header.expiresAt - st.menu.header.issuedAt <= 60n;

  return (
    <div className="flex flex-1 flex-col gap-4 pb-28">
      <Header title={st.merchant.name} back="/home" />
      <CounterChips m={st.merchant} live={live} />
      {errBox}

      {st.s === "checkout" ? (
        <Card>
          <div className="flex items-center gap-3">
            <Tile>
              <Bot size={18} />
            </Tile>
            <div className="min-w-0">
              <Label>{st.pick.by === "you" ? "Picked by you" : `Proposed by your agent${st.pick.by === "kimi" ? " · Kimi" : ""}`}</Label>
              <p className="truncate text-[17px] font-medium">
                {st.item.name} · {usd(st.item.price)}
              </p>
            </div>
          </div>
          {st.pick.reason && <p className="mt-3 text-[14px] text-muted">“{st.pick.reason}”</p>}
          <p className="mt-2 text-[13px] text-faint">
            Nothing is paid until you tap. The signed menu and your rules are checked again on-chain.
          </p>
          {!st.check.ok && <p className="mt-3 rounded-2xl bg-blocked/10 p-3 text-[14px] text-blocked">{st.check.message}</p>}
          <div className="mt-4">
            {st.check.ok ? (
              <Button onClick={() => (st.check.ok && st.check.needsOwner ? setSt({ ...st, sheet: true }) : confirm(ctx, st.item, false))}>
                <Zap size={17} /> Pay {usd(st.item.price)}
              </Button>
            ) : st.check.code === "stale" ? (
              <Button onClick={() => (staleRecovery(st.source).refetchDemo ? demoCafe() : setSt({ s: "scan" }))}>{staleRecovery(st.source).label}</Button>
            ) : (
              <Button variant="ghost" onClick={() => setSt({ s: "menu", ...ctx })}>
                Pick something else
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <Card>
          <Label>Ask your agent</Label>
          <input
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && request && ask(ctx, request)}
            placeholder="oat latte, not too sweet"
            className="glass mt-3 h-12 w-full rounded-full px-5 outline-none"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK.map((q) => (
              <button key={q} onClick={() => ask(ctx, q)} className="glass rounded-full px-3.5 py-1.5 text-[13px] text-muted">
                {q}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <Button onClick={() => request && ask(ctx, request)} disabled={!request || st.s === "thinking"}>
              {st.s === "thinking" ? <Spinner /> : <><Sparkles size={17} /> Find the cheapest match</>}
            </Button>
          </div>
        </Card>
      )}

      <SignedMenuList ctx={ctx} onPick={(i) => review(ctx, i, { item_id: i.itemId, reason: "", by: "you" })} />

      {st.s === "checkout" && st.sheet && st.check.ok && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/60 backdrop-blur-sm" onClick={() => setSt({ ...st, sheet: false })}>
          <div className="glass glass-strong mx-auto w-full max-w-md rounded-t-[32px] p-5 pb-[max(env(safe-area-inset-bottom),20px)]" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/30" />
            <div className="flex items-center gap-4">
              <Mascot mood="thinking" height={110} />
              <div>
                <Label className="!text-needs">Second look</Label>
                <p className="text-[14px] text-muted">You pay (gross)</p>
                <p className="tabular text-[36px] font-light leading-tight text-needs">{usd(st.item.price)}</p>
              </div>
            </div>
            <Mono className="mt-3">Allowance vault −{usd(st.item.price)}</Mono>
            <ul className="mt-3 space-y-3">
              <li className="flex gap-3">
                <Tile>
                  <Store size={17} />
                </Tile>
                <div>
                  <p className="text-[15px]">To {st.merchant.name}</p>
                  <p className="text-[12px] text-faint">{usd(st.merchant.bond)} bonded · payout from the registry</p>
                </div>
              </li>
              <li className="flex gap-3">
                <Tile>
                  <CategoryIcon category={st.item.category} />
                </Tile>
                <div>
                  <p className="text-[15px]">{st.item.name}</p>
                  <p className="text-[12px] text-faint">{st.check.reasons.join(" ")}</p>
                </div>
              </li>
            </ul>
            {(() => {
              const cheaper = st.menu.items.find((i) => i.category === st.item.category && i.price === i.floor && i.itemId !== st.item.itemId);
              return cheaper ? (
                <button
                  onClick={() => review(ctx, cheaper, { item_id: cheaper.itemId, reason: "The cheapest match.", by: "you" })}
                  className="tint mt-4 flex w-full items-center gap-2 rounded-2xl p-3 text-left text-[14px] text-paid"
                  style={{ "--c": "var(--paid)" } as React.CSSProperties}
                >
                  <ShieldCheck size={16} /> Cheaper match: {cheaper.name} · {usd(cheaper.price)}
                </button>
              ) : null;
            })()}
            <div className="mt-3">
              <Chip icon={<ShieldCheck size={13} />}>Only: owner cosign · Tally payOffer</Chip>
            </div>
            <div className="mt-4 space-y-3">
              <Button variant="needs" onClick={() => confirm(ctx, st.item, true)}>
                <Fingerprint size={18} /> Approve with Face ID
              </Button>
              <Button variant="ghost" onClick={() => setSt({ ...st, sheet: false })}>
                <X size={17} /> No, cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      <BottomNav />
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
