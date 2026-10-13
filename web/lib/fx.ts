/** Display-only hints for family abroad. Money moves in dollars (AUSD); these rates never touch the chain. */
const RATES: Record<string, { rate: number; fmt: (n: number) => string }> = {
  INR: { rate: 88.5, fmt: (n) => `₹${Math.round(n).toLocaleString("en-IN")}` },
  AED: { rate: 3.67, fmt: (n) => `AED ${Math.round(n)}` },
  GBP: { rate: 0.75, fmt: (n) => `£${Math.round(n)}` },
  EUR: { rate: 0.86, fmt: (n) => `€${Math.round(n)}` },
  CAD: { rate: 1.38, fmt: (n) => `C$${Math.round(n)}` },
  SGD: { rate: 1.29, fmt: (n) => `S$${Math.round(n)}` },
};

const BY_REGION: Record<string, string> = { IN: "INR", AE: "AED", GB: "GBP", DE: "EUR", FR: "EUR", IE: "EUR", CA: "CAD", SG: "SGD" };

export function guessCurrency(locale: string): string {
  const region = locale.split("-")[1]?.toUpperCase();
  return (region && BY_REGION[region]) || "USD";
}

export function localHint(usd: number, currency: string): string {
  const r = RATES[currency];
  return r ? `≈ ${r.fmt(usd * r.rate)}` : "";
}

/** World Bank RPW global average cost of sending $200: 6.36% (Aug 2025). */
export const AVG_REMITTANCE_COST = 0.0636;
export const remittanceSaving = (usd: number) => `$${(usd * AVG_REMITTANCE_COST).toFixed(2)}`;
