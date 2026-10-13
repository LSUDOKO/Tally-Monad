// Screenshots the public sources behind the problem section and records where the key line sits,
// so the video can zoom into it. Usage: PLAYWRIGHT=<playwright module> node video/scripts/evidence.mjs
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT ?? "playwright");
const OUT = new URL("../public/evidence/", import.meta.url).pathname;
const DPR = 1.5;

const JOBS = [
  ["worldbank-rpw", "https://remittanceprices.worldbank.org/", "6\\.\\d+\\s?%", ""],
  ["icef-students", "https://monitor.icef.com/2025/12/the-number-of-indian-students-abroad-fell-in-2025/", "1\\.8\\d? million|1\\.88|1,8\\d\\d,\\d{3}", ""],
  ["arxiv-agentlab", "https://arxiv.org/abs/2602.16901", "expensive|costlier|pric", "i"],
  ["shopifreaks-study", "https://www.shopifreaks.com/ai-shopping-agents-tend-to-push-pricier-sponsored-options-instead-of-the-best-deal-a-princeton-and-uw-study-finds/", "pricier|sponsored", "i"],
  ["greenlight-mcc", "https://help.greenlight.com/hc/en-us/articles/47951314307227-How-do-I-block-a-store-or-merchant", "category code|MCC", "i"],
  ["stripe-spt", "https://docs.stripe.com/agentic-commerce/concepts/shared-payment-tokens", "max_amount|usage limit", "i"],
];

function findBest(src) {
  const re = new RegExp(src.s, src.f);
  const els = [...document.querySelectorAll("p, li, td, h1, h2, h3, blockquote, span, strong, code, div")];
  let best = null;
  for (const el of els) {
    const t = el.innerText || "";
    if (!re.test(t) || t.length > 500) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 30 || r.height < 10) continue;
    if (!best || t.length < best.len) best = { el, len: t.length };
  }
  if (!best) return null;
  if (src.scroll) best.el.scrollIntoView({ block: "center" });
  const r = best.el.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height, text: (best.el.innerText || "").slice(0, 160) };
}

const browser = await chromium.launch({ headless: true });
const report = {};
for (const [name, url, s, f] of JOBS) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: DPR,
    locale: "en-US",
    userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36",
  });
  const p = await ctx.newPage();
  try {
    await p.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await p.waitForTimeout(4500);
    for (const label of [/accept all/i, /^accept/i, /i agree/i, /got it/i, /allow all/i, /^ok$/i, /agree/i]) {
      const b = p.getByRole("button", { name: label }).first();
      if (await b.isVisible().catch(() => false)) {
        await b.click().catch(() => {});
        await p.waitForTimeout(700);
      }
    }
    await p.evaluate(findBest, { s, f, scroll: true });
    await p.waitForTimeout(1500);
    const r = await p.evaluate(findBest, { s, f, scroll: false });
    await p.screenshot({ path: `${OUT}${name}.png` });
    const meta = { url, width: 1440 * DPR, height: 900 * DPR, title: await p.title() };
    if (r && r.y > -5 && r.y < 900) {
      const pad = 10;
      meta.highlight = { x: (r.x - pad) * DPR, y: (r.y - pad) * DPR, w: (r.w + 2 * pad) * DPR, h: (r.h + 2 * pad) * DPR };
      meta.text = r.text;
    }
    writeFileSync(`${OUT}${name}.json`, JSON.stringify(meta, null, 2) + "\n");
    report[name] = { ok: true, highlight: !!meta.highlight, text: meta.text, title: meta.title };
  } catch (e) {
    report[name] = { ok: false, err: String(e).slice(0, 200) };
  }
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(report, null, 2));
