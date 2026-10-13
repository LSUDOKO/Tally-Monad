"use client";

import { Fingerprint, Store } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Mascot } from "@/components/Mascot";
import { Button, Spinner } from "@/components/ui";
import { useSession } from "@/lib/session";

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
      <div className="flex items-center gap-3">
        <Image src="/mark.svg" alt="" width={40} height={40} className="rounded-xl" />
        <div className="leading-tight">
          <p className="font-medium">Tally</p>
          <p className="text-[12px] text-faint">Monad testnet</p>
        </div>
      </div>

      <h1 className="statement mt-8 text-[40px] leading-[44px]">Let your agent pay, only for what tallies.</h1>

      <div className="relative mt-7 overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,#2e78ff,#1f6bff_50%,#0f3fb4)] p-5 pt-44 shadow-[0_20px_60px_-20px_rgba(31,107,255,0.8)]">
        <div className="absolute -top-2 right-2">
          <Mascot mood="hero" height={250} glow={false} />
        </div>
        <p className="label relative !text-white/80">Tally · pocket money with proof</p>
        <p className="statement relative mt-1 text-[32px] leading-[37px] text-white">Pay with proof.</p>
      </div>

      <p className="mt-5 text-[15px] leading-[22px] text-muted">
        Family tops it up from anywhere in a second. Your agent spends it only on what the counter signed, at the signed price, inside your rules.
        Tally checks every payment on Monad.
      </p>

      <div className="mt-auto space-y-3 pt-8">
        {s.error && <p className="rounded-2xl bg-blocked/10 p-3 text-sm text-blocked">{s.error}</p>}
        {asking ? (
          <>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
              placeholder="Your first name"
              className="glass h-14 w-full rounded-full px-5 text-[16px] outline-none"
            />
            <Button onClick={create} disabled={working}>
              {working ? <Spinner /> : <><Fingerprint size={18} /> Create with Face ID</>}
            </Button>
          </>
        ) : (
          <Button onClick={() => (s.returning ? s.signIn() : setAsking(true))} disabled={working}>
            {working ? <Spinner /> : <><Fingerprint size={18} /> {s.returning ? "Continue with Face ID" : "Get started"}</>}
          </Button>
        )}
        {!asking && (
          <Button variant="ghost" onClick={() => s.signIn()} disabled={working}>
            I already have Tally
          </Button>
        )}
        <p className="px-4 text-center text-[12px] leading-[17px] text-faint">
          Your passkey is your account: no seed phrase, no extension, no gas. Your agent only ever holds a capped key.
        </p>
        <Link href="/merchant" className="flex items-center justify-center gap-1.5 pt-1 text-[13px] text-brand-bright">
          <Store size={14} /> Run a café? Open a counter
        </Link>
      </div>
    </div>
  );
}
