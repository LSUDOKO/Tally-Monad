"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "needs" | "blocked" | "ghost";

/** Pill buttons from the app: one lit cobalt primary per screen, amber when it waits for you, red for attacks. */
export function Button({ variant = "primary", className = "", ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const v = {
    primary: "btn-primary text-white",
    needs: "btn-needs",
    blocked: "btn-blocked",
    ghost: "glass text-text",
  }[variant];
  return (
    <button
      {...p}
      className={`flex h-14 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold transition active:scale-[0.98] disabled:opacity-45 ${v} ${className}`}
    />
  );
}

export function Card({ children, className = "", tint }: { children: ReactNode; className?: string; tint?: string }) {
  return (
    <div className={`rounded-[28px] p-5 ${tint ? "tint" : "glass"} ${className}`} style={tint ? ({ "--c": tint } as React.CSSProperties) : undefined}>
      {children}
    </div>
  );
}

export function Chip({ children, color = "var(--brand-bright)", icon }: { children: ReactNode; color?: string; icon?: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium"
      style={{ color, background: `color-mix(in srgb, ${color} 13%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 28%, transparent)` }}
    >
      {icon}
      {children}
    </span>
  );
}

export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`label ${className}`}>{children}</p>;
}

export function Mono({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`font-mono text-[12px] leading-[17px] text-muted ${className}`}>{children}</p>;
}

/** The square icon tile in front of every list row. */
export function Tile({ children, color = "var(--brand-bright)" }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
      style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 30%, transparent)` }}
    >
      {children}
    </span>
  );
}

export function Header({ title, back }: { title: string; back?: string }) {
  return (
    <header className="mb-4 flex items-center gap-3">
      {back && (
        <Link href={back} aria-label="Back" className="glass grid h-10 w-10 place-items-center rounded-full">
          <ArrowLeft size={18} />
        </Link>
      )}
      <h1 className="text-[19px] font-medium">{title}</h1>
    </header>
  );
}

export function Spinner() {
  return <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white align-middle" />;
}

export const usd = (micro: bigint | number) =>
  `$${(Number(micro) / 1e6).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
