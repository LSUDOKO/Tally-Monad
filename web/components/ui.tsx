"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Button({ variant = "primary", className = "", ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const v = {
    primary: "bg-brand text-white shadow-[0_8px_30px_rgba(31,107,255,0.45)] active:bg-brand-deep",
    ghost: "glass text-text active:bg-surface",
    danger: "bg-blocked/15 text-blocked border border-blocked/40",
  }[variant];
  return (
    <button
      {...p}
      className={`h-14 w-full rounded-2xl text-[17px] font-semibold transition disabled:opacity-50 ${v} ${className}`}
    />
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`glass rounded-3xl p-5 ${className}`}>{children}</div>;
}

export function Header({ title, back }: { title: string; back?: string }) {
  return (
    <header className="mb-5 flex items-center gap-3">
      {back && (
        <Link href={back} aria-label="Back" className="glass grid h-10 w-10 place-items-center rounded-full text-lg">
          ‹
        </Link>
      )}
      <h1 className="text-xl font-semibold">{title}</h1>
    </header>
  );
}

export function Spinner() {
  return <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white align-middle" />;
}

export const usd = (micro: bigint | number) =>
  `$${(Number(micro) / 1e6).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
