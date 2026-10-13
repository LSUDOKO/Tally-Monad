"use client";

import { useState } from "react";
import { Button } from "./ui";

/** Family top-up link: anyone with it can add money, nobody can take it out. */
export function ShareAllowance({ id }: { id: bigint }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const name = localStorage.getItem("tally.name") ?? "";
    const url = `${location.origin}/send/${id}${name ? `?n=${encodeURIComponent(name)}` : ""}`;
    const text = `Top up my Tally allowance${name ? ` (${name})` : ""}`;
    try {
      if (navigator.share) await navigator.share({ title: "Tally", text, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  };
  return (
    <Button variant="ghost" onClick={share}>
      {copied ? "Link copied" : "Ask family"}
    </Button>
  );
}
