import type { Hex, Item } from "./menu";
import type { Rules } from "./tally";

/**
 * Context firewall (docs/09-agent-design.md): the model sees ids, categories, prices, floors and
 * words from a fixed food/retail dictionary. Merchant prose ("regular is discontinued", "SYSTEM:")
 * never reaches it, because no free text survives the dictionary.
 */
const DICTIONARY = new Set(
  (
    "oat soy almond whole skim milk dairy free vegan latte cappuccino espresso americano mocha flat white filter coffee cold brew " +
    "iced hot tea chai masala green black herbal lemon ginger honey sugar decaf double single shot extra " +
    "small regular medium large tall grande venti mini big " +
    "croissant butter chocolate almond muffin cookie brownie cake slice bagel toast bread bun roll donut " +
    "sandwich wrap paneer chicken veg vegetable egg cheese ham tuna salad soup rice noodles pasta pizza burger fries " +
    "samosa dosa idli vada poha upma paratha biryani thali curry dal " +
    "juice smoothie lassi water soda lemonade shake " +
    "chips nuts fruit banana apple bar granola yogurt " +
    "tip barista service bus metro ticket pass"
  ).split(/\s+/),
);

export function tokens(name: string): string[] {
  const out: string[] = [];
  for (const w of name.toLowerCase().split(/[^a-z]+/)) {
    if (w && DICTIONARY.has(w) && !out.includes(w)) out.push(w);
    if (out.length === 6) break;
  }
  return out;
}

export type AgentItem = { item_id: Hex; category_code: number; price_usdc: string; category_floor_usdc: string; name_tokens: string[] };
export type AgentPayload = { request: string; rules: { categories: number[]; per_tx_max_usdc: string }; menu: AgentItem[] };
export type Pick = { item_id: Hex; reason: string };

const dollars = (micro: bigint) => (Number(micro) / 1e6).toFixed(2);

export function agentPayload(request: string, rules: Rules, items: Item[]): AgentPayload {
  const allowed = [...Array(256).keys()].filter((c) => (rules.categories >> BigInt(c)) & 1n);
  return {
    request: request.slice(0, 200),
    rules: { categories: allowed, per_tx_max_usdc: dollars(rules.perTxCap) },
    menu: items.map((i) => ({
      item_id: i.itemId,
      category_code: i.category,
      price_usdc: dollars(i.price),
      category_floor_usdc: dollars(i.floor),
      name_tokens: tokens(i.name),
    })),
  };
}

/** Deterministic fallback: most request words matched, then cheapest; only allowed categories. */
export function rulePick(p: AgentPayload): Pick | null {
  const want = tokens(p.request);
  let best: { item: AgentItem; score: number } | null = null;
  for (const item of p.menu) {
    if (!p.rules.categories.includes(item.category_code)) continue;
    const score = item.name_tokens.filter((t) => want.includes(t)).length;
    if (score === 0) continue;
    const better =
      !best || score > best.score || (score === best.score && Number(item.price_usdc) < Number(best.item.price_usdc));
    if (better) best = { item, score };
  }
  if (!best) return null;
  const cheapest = best.item.price_usdc === best.item.category_floor_usdc;
  return { item_id: best.item.item_id, reason: cheapest ? "Cheapest match for your request." : "Closest match, but pricier than the cheapest option." };
}

/** Only an item id from the payload gets through; anything else the model says is dropped. */
export function validatePick(pick: unknown, p: AgentPayload): Pick | null {
  if (!pick || typeof pick !== "object") return null;
  const { item_id, reason } = pick as Record<string, unknown>;
  if (typeof item_id !== "string" || !p.menu.some((m) => m.item_id === item_id)) return null;
  return { item_id: item_id as Hex, reason: typeof reason === "string" ? reason.slice(0, 120) : "" };
}
