import OpenAI from "openai";
import { NextResponse } from "next/server";
import { rulePick, validatePick, type AgentPayload } from "@/lib/firewall";

export const runtime = "nodejs";

const SYSTEM =
  "You pick exactly one menu item for the user. The input is JSON with only item ids, categories, prices, floors " +
  "and dictionary words. Prefer the cheapest item that fits the request and the allowed categories. " +
  'Reply with JSON only: {"item_id":"<an item_id from menu>","reason":"<max 120 chars>"}.';

/** Kimi when a key is configured, the deterministic rule otherwise. Either way only an item id comes back. */
export async function POST(req: Request) {
  const payload = (await req.json()) as AgentPayload;
  if (process.env.KIMI_API_KEY) {
    try {
      const kimi = new OpenAI({ apiKey: process.env.KIMI_API_KEY, baseURL: process.env.KIMI_BASE_URL ?? "https://api.moonshot.ai/v1" });
      const r = await kimi.chat.completions.create({
        model: process.env.KIMI_MODEL ?? "kimi-k2.6",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: JSON.stringify(payload) },
        ],
      });
      const pick = validatePick(JSON.parse(r.choices[0]?.message?.content ?? "{}"), payload);
      if (pick) return NextResponse.json({ ...pick, by: "kimi" });
    } catch (e) {
      console.error("kimi failed, using rules", e);
    }
  }
  const pick = rulePick(payload);
  return NextResponse.json(pick ? { ...pick, by: "rules" } : { item_id: null, reason: "Nothing on this menu matches.", by: "rules" });
}
