"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  ["/home", "Home", "⌂"],
  ["/scan", "Pay", "◎"],
  ["/receipts", "Receipts", "≡"],
  ["/settings", "You", "☺"],
] as const;

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md justify-around rounded-t-3xl px-2 pb-[max(env(safe-area-inset-bottom),10px)] pt-2">
      {TABS.map(([href, label, icon]) => {
        const on = path.startsWith(href);
        return (
          <Link key={href} href={href} className={`flex w-16 flex-col items-center gap-0.5 py-1 text-xs ${on ? "text-brand-bright" : "text-faint"}`}>
            <span className="text-xl leading-none">{icon}</span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
