"use client";

import { Bot, Check, Copy, Cpu, Fuel, KeyRound, LogOut, ScrollText, Store, Swords, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { formatEther } from "viem";
import { BottomNav } from "@/components/BottomNav";
import { Mascot } from "@/components/Mascot";
import { RequireSession } from "@/components/RequireSession";
import { Button, Card, Chip, Label, Tile, usd } from "@/components/ui";
import { publicClient } from "@/lib/chain";
import { useSession } from "@/lib/session";
import { describeRules } from "@/lib/tally";
import { useAllowance } from "@/lib/useAllowance";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

function Row({ icon, title, value, copy }: { icon: ReactNode; title: string; value: string; copy?: string }) {
  const [done, setDone] = useState(false);
  return (
    <li className="flex items-center gap-3 py-3">
      <Tile>{icon}</Tile>
      <div className="min-w-0 flex-1">
        <p className="text-[14px]">{title}</p>
        <p className="truncate text-[13px] text-muted">{value}</p>
      </div>
      {copy && (
        <button
          aria-label={`Copy ${title}`}
          onClick={() => navigator.clipboard.writeText(copy).then(() => (setDone(true), setTimeout(() => setDone(false), 1500)))}
          className="grid h-8 w-8 place-items-center text-muted"
        >
          {done ? <Check size={16} className="text-paid" /> : <Copy size={16} />}
        </button>
      )}
    </li>
  );
}

function SettingsInner() {
  const { keys, signOut } = useSession();
  const a = useAllowance();
  const router = useRouter();
  const [fee, setFee] = useState<bigint>();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => setName(localStorage.getItem("tally.name")), []);
  useEffect(() => {
    if (keys) publicClient.getBalance({ address: keys.agent.address }).then(setFee);
  }, [keys]);
  if (!keys) return null;

  return (
    <div className="flex flex-1 flex-col gap-4 pb-28">
      <div className="mt-4 flex items-start justify-between">
        <h1 className="statement text-[40px] leading-[44px]">
          Your keys,
          <br />
          your rules.
        </h1>
        <Mascot mood="success" height={120} />
      </div>

      <Card>
        <div className="flex items-center gap-3">
          <Mascot mood="avatar" height={48} glow={false} />
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-medium">{name ?? "Tally user"}</p>
            <p className="text-[13px] text-faint">Passkey · {short(keys.owner.address)}</p>
          </div>
          <Chip>testnet</Chip>
        </div>
        <div className="mt-4">
          <Button
            variant="ghost"
            className="!text-blocked"
            onClick={() => {
              signOut();
              router.replace("/");
            }}
          >
            <LogOut size={17} /> Sign out
          </Button>
        </div>
      </Card>

      <Label className="mt-2">One Face ID, three keys</Label>
      <Card className="!py-1">
        <ul className="divide-y divide-white/5">
          <Row icon={<Wallet size={17} />} title="You: changes rules, approves pricier picks" value={short(keys.owner.address)} copy={keys.owner.address} />
          <Row icon={<Bot size={17} />} title="Agent key: pays only inside your rules" value={short(keys.agent.address)} copy={keys.agent.address} />
          <Row icon={<Store size={17} />} title="Counter key: signs your café's menu" value={short(keys.merchant.address)} copy={keys.merchant.address} />
        </ul>
      </Card>

      <Label className="mt-2">Agent</Label>
      <Card className="!py-1">
        <ul className="divide-y divide-white/5">
          <Row icon={<Fuel size={17} />} title="Fee balance" value={fee === undefined ? "…" : `${Number(formatEther(fee)).toFixed(4)} MON, sponsored by Tally`} />
          <Row icon={<Cpu size={17} />} title="Model" value="Kimi behind the context firewall, rule-based fallback" />
          {a.id !== undefined && <Row icon={<KeyRound size={17} />} title="Allowance" value={`#${a.id}`} />}
        </ul>
      </Card>

      {a.capsule && (
        <>
          <Label className="mt-2">Rules</Label>
          <Card>
            <div className="flex gap-3">
              <Tile>
                <ScrollText size={17} />
              </Tile>
              <div>
                <p className="text-[14px]">{describeRules(a.capsule.rules)}.</p>
                <p className="mt-1 text-[13px] text-faint">
                  Pricier than the cheapest match, a counter bonded under {usd(a.capsule.rules.minMerchantBond)}, or a printed menu: always asks you
                  first. Ends {new Date(Number(a.capsule.rules.expiry) * 1000).toLocaleDateString()}.
                </p>
              </div>
            </div>
          </Card>
        </>
      )}

      <Link href="/redteam" className="block">
        <Button variant="ghost">
          <Swords size={17} /> Attack your own agent
        </Button>
      </Link>
      <Link href="/merchant" className="block">
        <Button variant="ghost">
          <Store size={17} /> Run a counter
        </Button>
      </Link>
      <BottomNav />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <RequireSession>
      <SettingsInner />
    </RequireSession>
  );
}
