"use client";

import { House, ReceiptText, ScanLine, ShieldCheck, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LEFT = [
  { href: "/home", label: "Home", Icon: House },
  { href: "/receipts", label: "Receipts", Icon: ReceiptText },
];
const RIGHT = [
  { href: "/redteam", label: "Red team", Icon: ShieldCheck },
  { href: "/settings", label: "Settings", Icon: SlidersHorizontal },
];

function Tab({ href, label, Icon }: (typeof LEFT)[number]) {
  const on = usePathname().startsWith(href);
  return (
    <Link href={href} aria-label={label} className={`flex h-[52px] w-[60px] flex-col items-center justify-center ${on ? "text-text" : "text-faint"}`}>
      <Icon size={22} strokeWidth={1.8} />
      <span className={`mt-1.5 h-[3px] rounded-full bg-brand-bright transition-all ${on ? "w-4 opacity-100" : "w-1.5 opacity-0"}`} />
    </Link>
  );
}

/** A floating smoked-glass bar with the scan orb set into its middle. */
export function BottomNav({ scanEnabled = true }: { scanEnabled?: boolean }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md px-4 pb-[max(env(safe-area-inset-bottom),10px)]">
      <div className="relative h-20">
        <nav className="glass glass-strong absolute inset-x-0 bottom-0 flex h-16 items-center justify-between rounded-full px-2">
          {LEFT.map((t) => (
            <Tab key={t.href} {...t} />
          ))}
          <span className="w-16" />
          {RIGHT.map((t) => (
            <Tab key={t.href} {...t} />
          ))}
        </nav>
        <Link
          href="/scan"
          aria-label="Scan to pay"
          className={`orb absolute bottom-[14px] left-1/2 grid h-16 w-16 -translate-x-1/2 place-items-center rounded-full text-white ${scanEnabled ? "breathe" : "opacity-50"}`}
        >
          <ScanLine size={26} />
        </Link>
      </div>
    </div>
  );
}
