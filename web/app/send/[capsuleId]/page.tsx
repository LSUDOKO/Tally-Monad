"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button, Card, Spinner, usd } from "@/components/ui";
import { EXPLORER } from "@/lib/chain";
import { humanError } from "@/lib/errors";
import { guessCurrency, localHint, remittanceSaving } from "@/lib/fx";
import { useSession } from "@/lib/session";
import { describeRules, fundAllowance, readCapsule, usdBalance, type Capsule } from "@/lib/tally";

const AMOUNTS = [10, 20, 50];
const NOTES = ["For lunches this week", "Coffee money", "Exam week treats"];

function SendInner() {
  const { capsuleId } = useParams<{ capsuleId: string }>();
  const params = useSearchParams();
  const name = params.get("n") || "them";
  const s = useSession();
  const [cap, setCap] = useState<Capsule | null>();
  const [amount, setAmount] = useState(20);
  const [note, setNote] = useState(NOTES[0]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>();
  const [done, setDone] = useState<{ hash: string; ms: number }>();
  const [currency, setCurrency] = useState("USD");

  const id = (() => {
    try {
      return BigInt(capsuleId);
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    setCurrency(guessCurrency(navigator.language));
    if (id === null) return setCap(null);
    readCapsule(id)
      .then((c) => setCap(c.owner === "0x0000000000000000000000000000000000000000" ? null : c))
      .catch(() => setCap(null));
  }, [capsuleId]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = async () => {
    if (!s.keys || id === null) return;
    setBusy(true);
    setErr(undefined);
    try {
      const want = BigInt(amount) * 1_000_000n;
      // the welcome credit can take a few seconds to land after sign-up
      for (let i = 0; i < 20 && (await usdBalance(s.keys.owner.address)) < want; i++) await new Promise((r) => setTimeout(r, 1000));
      const t0 = performance.now();
      const r = await fundAllowance(s.keys.owner, id, want, note);
      setDone({ hash: r.transactionHash, ms: Math.round(performance.now() - t0) });
    } catch (e) {
      setErr(humanError(e));
    } finally {
      setBusy(false);
    }
  };

  if (cap === undefined) {
    return (
      <div className="grid flex-1 place-items-center">
        <Spinner />
      </div>
    );
  }
  if (cap === null) return <p className="mt-20 text-center text-muted">This top-up link isn&apos;t valid.</p>;

  if (done) {
    return (
      <div className="flex flex-1 flex-col items-center pt-16 text-center">
        <div className="grid h-24 w-24 place-items-center rounded-full bg-paid/15 text-5xl text-paid">✓</div>
        <p className="mt-6 text-3xl font-semibold">Arrived</p>
        <p className="mt-2 text-muted">
          ${amount}.00 is in {name}&apos;s allowance. Fee $0.00.
        </p>
        <p className="mt-1 text-sm text-faint">
          “{note}” · a typical transfer would have cost about {remittanceSaving(amount)}
        </p>
        <a href={`${EXPLORER}/tx/${done.hash}`} target="_blank" rel="noreferrer" className="mt-4 text-sm text-brand-bright">
          Proof ›
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <h1 className="text-2xl font-semibold">Top up {name}&apos;s allowance</h1>
      <Card>
        <p className="text-sm text-muted">It can only be spent on</p>
        <p className="mt-1">{describeRules(cap.rules)}.</p>
        <p className="mt-2 text-xs text-faint">At registered counters, at the menu price. You can add money; nobody can take it back out except {name}.</p>
      </Card>

      <Card>
        <div className="grid grid-cols-3 gap-2">
          {AMOUNTS.map((a) => (
            <button
              key={a}
              onClick={() => setAmount(a)}
              className={`h-14 rounded-2xl text-lg font-semibold ${amount === a ? "bg-brand text-white" : "bg-white/5"}`}
            >
              ${a}
            </button>
          ))}
        </div>
        <p className="tabular mt-3 text-center text-sm text-muted">{localHint(amount, currency)}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {NOTES.map((n) => (
            <button key={n} onClick={() => setNote(n)} className={`rounded-full px-3 py-1.5 text-sm ${note === n ? "bg-brand/30 text-text" : "bg-white/5 text-muted"}`}>
              {n}
            </button>
          ))}
        </div>
      </Card>

      {(err || s.error) && <p className="rounded-2xl bg-blocked/10 p-3 text-sm text-blocked">{err || s.error}</p>}

      <div className="mt-auto space-y-3">
        {s.status === "signed-in" ? (
          <Button onClick={send} disabled={busy}>
            {busy ? <Spinner /> : `Send $${amount}`}
          </Button>
        ) : (
          <Button onClick={() => (s.returning ? s.signIn() : s.signUp("Family"))} disabled={s.status === "working"}>
            {s.status === "working" ? <Spinner /> : "Continue with Face ID"}
          </Button>
        )}
        <p className="text-center text-xs text-faint">Arrives in about a second. On the test network your first $50 is on us.</p>
      </div>
    </div>
  );
}

export default function SendPage() {
  return (
    <Suspense>
      <SendInner />
    </Suspense>
  );
}
