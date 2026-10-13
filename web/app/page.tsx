"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Spinner } from "@/components/ui";
import { useSession } from "@/lib/session";

const POINTS = [
  ["Family tops it up", "From anywhere, in seconds, for cents."],
  ["Spends only on what you allow", "Coffee and lunch yes, everything else no."],
  ["Your AI can order for you", "But it can't be talked into the pricier one."],
];

export default function Welcome() {
  const s = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    if (s.status === "signed-in") router.replace("/home");
  }, [s.status, router]);

  const create = async () => {
    const n = name.trim() || "Tally user";
    try {
      localStorage.setItem("tally.name", n);
    } catch {}
    await s.signUp(n);
  };

  const working = s.status === "working";

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-2">
        <Image src="/mark.svg" alt="" width={32} height={32} className="rounded-lg" />
        <span className="text-lg font-semibold tracking-tight">Tally</span>
      </div>

      <div className="mt-10 flex justify-center">
        <Image src="/mascot.png" alt="Tally mascot" width={168} height={168} priority />
      </div>

      <h1 className="mt-6 text-[34px] font-semibold leading-[1.05] tracking-tight">
        Pocket money that can&apos;t be talked into the wrong purchase.
      </h1>

      <ul className="mt-6 space-y-3">
        {POINTS.map(([t, d]) => (
          <li key={t} className="flex gap-3">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-bright" />
            <span>
              <span className="font-medium">{t}.</span> <span className="text-muted">{d}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-auto space-y-3 pt-10">
        {s.error && <p className="rounded-2xl bg-blocked/10 p-3 text-sm text-blocked">{s.error}</p>}

        {asking ? (
          <>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your first name"
              className="glass h-14 w-full rounded-2xl px-4 text-[17px] outline-none focus:border-brand-bright"
            />
            <Button onClick={create} disabled={working}>
              {working ? <Spinner /> : "Create with Face ID"}
            </Button>
          </>
        ) : (
          <Button onClick={() => (s.returning ? s.signIn() : setAsking(true))} disabled={working}>
            {working ? <Spinner /> : s.returning ? "Continue with Face ID" : "Get started"}
          </Button>
        )}

        <Button variant="ghost" onClick={() => s.signIn()} disabled={working}>
          I already have Tally
        </Button>

        <p className="pt-2 text-center text-sm text-faint">
          Run a café? <Link href="/merchant" className="text-brand-bright">Open a counter</Link>
        </p>
      </div>
    </div>
  );
}
