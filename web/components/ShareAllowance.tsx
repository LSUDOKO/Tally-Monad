"use client";

/** Family top-up link: anyone with it can add money, nobody can take it out. */
export async function shareAllowance(id: bigint): Promise<"shared" | "copied" | "failed"> {
  const name = localStorage.getItem("tally.name") ?? "";
  const url = `${location.origin}/send/${id}${name ? `?n=${encodeURIComponent(name)}` : ""}`;
  const text = `Top up my Tally allowance${name ? ` (${name})` : ""}`;
  try {
    if (navigator.share) {
      await navigator.share({ title: "Tally", text, url });
      return "shared";
    }
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}
