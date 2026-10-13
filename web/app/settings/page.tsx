"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { RequireSession } from "@/components/RequireSession";
import { Button, Card, Header, usd } from "@/components/ui";
import { EXPLORER } from "@/lib/chain";
import { useSession } from "@/lib/session";
import { describeRules } from "@/lib/tally";
import { useAllowance } from "@/lib/useAllowance";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

function SettingsInner() {
  const { keys, signOut } = useSession();
  const a = useAllowance();
  const router = useRouter();
  if (!keys) return null;
  return (
    <div className="flex flex-1 flex-col gap-4 pb-24">
      <Header title="You" back="/home" />
      {a.capsule && (
        <Card>
          <p className="text-sm text-muted">Allowance rules</p>
          <p className="mt-1">{describeRules(a.capsule.rules)}.</p>
          <p className="mt-2 text-sm text-faint">Ends {new Date(Number(a.capsule.rules.expiry) * 1000).toLocaleDateString()}</p>
        </Card>
      )}
      <Card>
        <p className="text-sm text-muted">Not loaded yet</p>
        <p className="tabular mt-1 text-xl font-semibold">{usd(a.walletUsd)}</p>
      </Card>
      <Card>
        <p className="text-sm text-muted">One Face ID, three keys</p>
        <ul className="mt-2 space-y-2 text-sm">
          <li className="flex justify-between">
            <span>You (changes rules, approves)</span>
            <a className="text-brand-bright" href={`${EXPLORER}/address/${keys.owner.address}`} target="_blank" rel="noreferrer">
              {short(keys.owner.address)}
            </a>
          </li>
          <li className="flex justify-between">
            <span>Your assistant (pays inside rules)</span>
            <span className="text-faint">{short(keys.agent.address)}</span>
          </li>
          <li className="flex justify-between">
            <span>Your counter (signs menus)</span>
            <span className="text-faint">{short(keys.merchant.address)}</span>
          </li>
        </ul>
        <p className="mt-3 text-xs text-faint">All three come from your passkey. Nothing to write down, nothing stored on a server.</p>
      </Card>
      <Link href="/merchant">
        <Button variant="ghost">Run a counter</Button>
      </Link>
      <Link href="/redteam">
        <Button variant="ghost">Try to trick my assistant</Button>
      </Link>
      <Button
        variant="danger"
        onClick={() => {
          signOut();
          router.replace("/");
        }}
      >
        Sign out
      </Button>
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
