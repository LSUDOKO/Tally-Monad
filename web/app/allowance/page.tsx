"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RequireSession } from "@/components/RequireSession";
import { Button, Card, Header, Spinner, usd } from "@/components/ui";
import { useSession } from "@/lib/session";
import { CATEGORIES, CATEGORY_ICON, CATEGORY_LABEL, chainNow, createAllowance, describeRules, rulesFromForm } from "@/lib/tally";
import { useAllowance } from "@/lib/useAllowance";

const CHOICES = [CATEGORIES.coffee, CATEGORIES.food, CATEGORIES.drinks, CATEGORIES.snacks, CATEGORIES.groceries, CATEGORIES.transit, CATEGORIES.tips];

function Slider({ label, value, min, max, step, onChange, fmt }: { label: string; value: number; min: number; max: number; step: number; onChange: (n: number) => void; fmt: (n: number) => string }) {
  return (
    <label className="block">
      <div className="flex justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="tabular font-medium">{fmt(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-2 w-full accent-[#1f6bff]" />
    </label>
  );
}

function AllowanceInner() {
  const { keys } = useSession();
  const a = useAllowance();
  const router = useRouter();
  const [cats, setCats] = useState<number[]>([CATEGORIES.coffee, CATEGORIES.food]);
  const [perPurchase, setPerPurchase] = useState(10);
  const [daily, setDaily] = useState(25);
  const [days, setDays] = useState(30);
  const [load, setLoad] = useState(40);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>();

  const maxLoad = Math.max(1, Math.floor(Number(a.walletUsd) / 1e6));
  const toggle = (c: number) => setCats((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));
  let preview = "";
  try {
    preview = describeRules(rulesFromForm({ categories: cats, perPurchase, daily, days, nowSec: 0 }));
  } catch (e) {
    preview = (e as Error).message;
  }

  const create = async () => {
    if (!keys) return;
    setBusy(true);
    setErr(undefined);
    try {
      const rules = rulesFromForm({ categories: cats, perPurchase, daily, days, nowSec: Number(await chainNow()) });
      await createAllowance(keys.owner, keys.agent.address, rules, BigInt(Math.min(load, maxLoad)) * 1_000_000n);
      router.replace("/home");
    } catch (e) {
      setErr((e as Error).message.includes("limit") || (e as Error).message.includes("Pick") ? (e as Error).message : "Couldn't create the allowance. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Header title="Your allowance" back="/home" />

      <Card>
        <p className="mb-3 text-sm text-muted">It can be spent on</p>
        <div className="flex flex-wrap gap-2">
          {CHOICES.map((c) => (
            <button
              key={c}
              onClick={() => toggle(c)}
              className={`rounded-full px-4 py-2 text-sm transition ${cats.includes(c) ? "bg-brand text-white" : "bg-white/5 text-muted"}`}
            >
              {CATEGORY_ICON[c]} {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
      </Card>

      <Card className="space-y-5">
        <Slider label="Per purchase" value={perPurchase} min={1} max={50} step={1} onChange={setPerPurchase} fmt={(n) => `$${n}`} />
        <Slider label="Per day" value={daily} min={1} max={100} step={1} onChange={setDaily} fmt={(n) => `$${n}`} />
        <Slider label="Lasts for" value={days} min={1} max={90} step={1} onChange={setDays} fmt={(n) => `${n} days`} />
        <Slider label="Load now" value={Math.min(load, maxLoad)} min={1} max={maxLoad} step={1} onChange={setLoad} fmt={(n) => `$${n}`} />
        <p className="text-xs text-faint">Available to load: {usd(a.walletUsd)}</p>
      </Card>

      <p className="px-1 text-sm text-muted">{preview}. A pricier pick than the cheapest match always asks you first.</p>

      {err && <p className="rounded-2xl bg-blocked/10 p-3 text-sm text-blocked">{err}</p>}
      <div className="mt-auto">
        <Button onClick={create} disabled={busy || cats.length === 0 || perPurchase > daily || a.walletUsd === 0n}>
          {busy ? <Spinner /> : "Create allowance"}
        </Button>
      </div>
    </div>
  );
}

export default function AllowancePage() {
  return (
    <RequireSession>
      <AllowanceInner />
    </RequireSession>
  );
}
