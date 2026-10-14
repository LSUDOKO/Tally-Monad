// One continuous story for the sponsor videos: Riya onboards and loads an AUSD allowance, Mom onboards
// on another "phone" and sends $20 with a note, Riya sees it arrive, pays for a latte, opens receipts
// (from Envio), her keys, then signs out and back in with the same passkey.
// Usage: PLAYWRIGHT=<playwright module> node video/scripts/record-sponsor.mjs <outDir>
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT ?? "playwright");
const OUT = process.argv[2] ?? "/tmp/tally-sponsor";
const APP = "https://tally-monad.vercel.app";
const TALLY = "0xe7d22F222a799218908997f837CF3e0Fd1c1e40a";

async function phone(browser, name) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    locale: "en-IN",
    recordVideo: { dir: `${OUT}/${name}`, size: { width: 780, height: 1688 } },
  });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("WebAuthn.enable");
  await cdp.send("WebAuthn.addVirtualAuthenticator", {
    options: { protocol: "ctap2", ctap2Version: "ctap2_1", transport: "internal", hasResidentKey: true, hasUserVerification: true, isUserVerified: true, hasPrf: true, automaticPresenceSimulation: true },
  });
  const t0 = Date.now();
  const marks = {};
  return { ctx, page, marks, mark: (k) => (marks[k] = (Date.now() - t0) / 1000) };
}

const browser = await chromium.launch({ headless: true });
const riya = await phone(browser, "riya");
const mom = await phone(browser, "mom");
const R = riya.page;
const M = mom.page;
const out = { errors: [] };
const step = async (label, fn) => {
  try {
    await fn();
  } catch (e) {
    out.errors.push(`${label}: ${String(e).slice(0, 200)}`);
    throw e;
  }
};

try {
  // Riya onboards (Toronto)
  await step("riya-onboard", async () => {
    await R.goto(APP + "/");
    await R.waitForTimeout(1500);
    riya.mark("onboard");
    await R.waitForTimeout(2500);
    await R.getByRole("button", { name: /Get started/ }).click();
    await R.waitForTimeout(600);
    await R.getByPlaceholder("Your first name").pressSequentially("Riya", { delay: 130 });
    await R.waitForTimeout(400);
    await R.getByRole("button", { name: /Create with Face ID/ }).click();
    await R.getByText("Ready to load into your allowance.").waitFor({ timeout: 60000 });
    await R.waitForTimeout(2000);
  });
  // Riya's AUSD balance
  await step("riya-balance", async () => {
    riya.mark("balance");
    await R.getByRole("button", { name: /Set up my allowance/ }).click();
    await R.waitForTimeout(1800);
    await R.mouse.wheel(0, 900);
    await R.waitForTimeout(900);
    await R.getByRole("button", { name: "Create allowance" }).click();
    await R.getByText(/Your agent can spend/).waitFor({ timeout: 60000 });
    await R.waitForTimeout(3500);
    riya.mark("balance-end");
  });
  // the allowance Riya just created is the newest one on the contract
  const rpc = await fetch("https://testnet-rpc.monad.xyz", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to: TALLY, data: "0xae3cfaed" }, "latest"] }),
  }).then((r) => r.json());
  const capId = (BigInt(rpc.result) - 1n).toString();
  out.capsule = capId;
  await step("mom-onboard", async () => {
    await M.goto(`${APP}/send/${capId}?n=Riya`);
    await M.getByText("Top up Riya's allowance").waitFor({ timeout: 30000 });
    mom.mark("onboard");
    await M.waitForTimeout(3500);
    await M.getByRole("button", { name: "Continue with Face ID" }).click();
    await M.getByRole("button", { name: "Send $20" }).waitFor({ timeout: 60000 });
    await M.waitForTimeout(2000);
    mom.mark("onboard-end");
  });
  await step("mom-send", async () => {
    mom.mark("send");
    await M.getByRole("button", { name: "For lunches this week" }).click();
    await M.waitForTimeout(1200);
    await M.getByRole("button", { name: "Send $20" }).click();
    await M.getByText("Arrived").waitFor({ timeout: 90000 });
    await M.waitForTimeout(3500);
    mom.mark("send-end");
    out.fundTx = await M.locator('a[href*="/tx/"]').first().getAttribute("href");
  });
  // Riya sees it arrive (Home polls the chain; Recent comes from Envio)
  await step("riya-receive", async () => {
    riya.mark("receive");
    await R.getByText("For lunches this week").first().waitFor({ timeout: 120000 });
    await R.waitForTimeout(3000);
    riya.mark("receive-end");
  });
  // Riya pays for a latte
  await step("riya-pay", async () => {
    riya.mark("pay");
    await R.getByRole("link", { name: "Scan to pay" }).click({ force: true });
    await R.waitForTimeout(1500);
    await R.getByRole("button", { name: /Use the demo café/ }).click();
    await R.getByText(/Signed menu/).waitFor({ timeout: 20000 });
    await R.waitForTimeout(1000);
    await R.getByPlaceholder("oat latte, not too sweet").pressSequentially("oat latte", { delay: 100 });
    await R.getByRole("button", { name: /Find the cheapest match/ }).click();
    await R.getByText(/Proposed by your agent/).waitFor({ timeout: 20000 });
    await R.waitForTimeout(1800);
    await R.getByRole("button", { name: /^Pay \$/ }).click();
    await R.getByText(/Settled in/).waitFor({ timeout: 60000 });
    await R.waitForTimeout(3000);
    riya.mark("pay-end");
    out.payTx = await R.locator('a[href*="/tx/"]').first().getAttribute("href");
  });
  // Receipts from Envio
  await step("riya-receipts", async () => {
    await R.waitForTimeout(6000); // give the indexer a moment
    riya.mark("receipts");
    await R.getByRole("navigation").getByRole("link", { name: "Receipts" }).click();
    await R.waitForTimeout(4000);
    await R.mouse.wheel(0, 450);
    await R.waitForTimeout(3500);
    riya.mark("receipts-end");
  });
  // One passkey, three keys
  await step("riya-keys", async () => {
    riya.mark("keys");
    await R.getByRole("navigation").getByRole("link", { name: "Settings" }).click();
    await R.waitForTimeout(2500);
    await R.mouse.wheel(0, 420);
    await R.waitForTimeout(4000);
    riya.mark("keys-end");
  });
  // Sign out and come back with the same passkey
  await step("riya-return", async () => {
    riya.mark("return");
    await R.getByRole("button", { name: /Sign out/ }).click();
    await R.waitForTimeout(2500);
    await R.getByRole("button", { name: /Continue with Face ID/ }).click();
    await R.getByText(/Your agent can spend/).waitFor({ timeout: 60000 });
    await R.waitForTimeout(3500);
    riya.mark("return-end");
  });
} catch {
  // recorded what we could; the errors list says where it stopped
}

const rv = R.video();
const mv = M.video();
await riya.ctx.close();
await mom.ctx.close();
await browser.close();
out.riya = { path: await rv.path(), marks: riya.marks };
out.mom = { path: await mv.path(), marks: mom.marks };
console.log(JSON.stringify(out, null, 2));
