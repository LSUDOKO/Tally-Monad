// Records the demo takes on the live app in headless Chromium with a virtual PRF passkey.
// Usage: PLAYWRIGHT=<path to playwright module> node video/scripts/record.mjs <outDir>
// Prints JSON with each take's video path and the scene marks (seconds from page creation).
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT ?? "playwright");
const OUT = process.argv[2] ?? "/tmp/tally-rec";
const APP = "https://tally-monad.vercel.app";
const VIEW = { width: 390, height: 844 };

async function take(browser, name, fn) {
  const ctx = await browser.newContext({
    viewport: VIEW,
    deviceScaleFactor: 2,
    locale: "en-IN",
    recordVideo: { dir: `${OUT}/${name}`, size: { width: 780, height: 1688 } },
  });
  const p = await ctx.newPage();
  const t0 = Date.now();
  const marks = {};
  const mark = (k) => (marks[k] = (Date.now() - t0) / 1000);
  const cdp = await ctx.newCDPSession(p);
  await cdp.send("WebAuthn.enable");
  await cdp.send("WebAuthn.addVirtualAuthenticator", {
    options: { protocol: "ctap2", ctap2Version: "ctap2_1", transport: "internal", hasResidentKey: true, hasUserVerification: true, isUserVerified: true, hasPrf: true, automaticPresenceSimulation: true },
  });
  let err = null;
  let extra = null;
  try {
    extra = await fn(p, mark);
  } catch (e) {
    err = String(e).slice(0, 300);
  }
  const video = p.video();
  await ctx.close();
  return { name, path: await video.path(), marks, err, extra };
}

const wait = (p, ms) => p.waitForTimeout(ms);

const riya = async (p, mark) => {
  await p.goto(APP + "/");
  await wait(p, 1500);
  mark("welcome");
  await wait(p, 5000);
  mark("signup");
  await p.getByRole("button", { name: /Get started/ }).click();
  await wait(p, 700);
  await p.getByPlaceholder("Your first name").pressSequentially("Riya", { delay: 140 });
  await wait(p, 500);
  await p.getByRole("button", { name: /Create with Face ID/ }).click();
  await p.getByText("Ready to load into your allowance.").waitFor({ timeout: 60000 });
  await wait(p, 2500);
  mark("allowance");
  await p.getByRole("button", { name: /Set up my allowance/ }).click();
  await wait(p, 2500);
  await p.mouse.wheel(0, 350);
  await wait(p, 1500);
  await p.mouse.wheel(0, 600);
  await wait(p, 1200);
  await p.getByRole("button", { name: "Create allowance" }).click();
  await p.getByText(/Your agent can spend/).waitFor({ timeout: 60000 });
  await wait(p, 3000);
  mark("pay");
  await p.getByRole("link", { name: "Scan to pay" }).click({ force: true });
  await wait(p, 2200);
  await p.getByRole("button", { name: /Use the demo café/ }).click();
  await p.getByText(/Signed menu/).waitFor({ timeout: 20000 });
  await wait(p, 1500);
  await p.getByPlaceholder("oat latte, not too sweet").pressSequentially("oat latte", { delay: 110 });
  await wait(p, 400);
  await p.getByRole("button", { name: /Find the cheapest match/ }).click();
  await p.getByText(/Proposed by your agent/).waitFor({ timeout: 20000 });
  await wait(p, 2200);
  await p.getByRole("button", { name: /^Pay \$/ }).click();
  await p.getByText(/Settled in/).waitFor({ timeout: 60000 });
  await wait(p, 3500);
  mark("secondlook");
  await p.getByRole("button", { name: "Pay again" }).click();
  await wait(p, 800);
  await p.getByRole("button", { name: /Use the demo café/ }).click();
  await p.getByText(/Signed menu/).waitFor({ timeout: 20000 });
  await wait(p, 800);
  await p.getByRole("button", { name: "Large oat latte" }).click();
  await p.getByText(/Proposed by your agent/).waitFor({ timeout: 20000 });
  await wait(p, 1500);
  await p.getByRole("button", { name: /^Pay \$/ }).click();
  await wait(p, 3500);
  await p.getByRole("button", { name: /Approve with Face ID/ }).click();
  await p.getByText(/Settled in/).waitFor({ timeout: 60000 });
  await wait(p, 3000);
  mark("redteam");
  await p.getByRole("navigation").getByRole("link", { name: "Red team" }).click();
  await wait(p, 2000);
  await p.getByRole("button", { name: /Run 4 attacks/ }).click();
  await p.getByRole("button", { name: /Run again/ }).waitFor({ timeout: 60000 });
  await wait(p, 800);
  for (let i = 0; i < 4; i++) {
    await p.mouse.wheel(0, 380);
    await wait(p, 1100);
  }
  mark("receipts");
  await p.getByRole("navigation").getByRole("link", { name: "Receipts" }).click();
  await wait(p, 3500);
  await p.mouse.wheel(0, 500);
  await wait(p, 2500);
  mark("settings");
  await p.getByRole("navigation").getByRole("link", { name: "Settings" }).click();
  await wait(p, 3500);
  await p.mouse.wheel(0, 500);
  await wait(p, 2000);
  mark("end");
  const key = await p.evaluate(() => Object.keys(localStorage).find((k) => k.startsWith("tally.receipts.")));
  return { capsule: key?.split(".").pop() };
};

const mom = (capsule) => async (p, mark) => {
  await p.goto(`${APP}/send/${capsule}?n=Riya`);
  await p.getByText("Top up Riya's allowance").waitFor({ timeout: 20000 });
  mark("start");
  await wait(p, 3000);
  await p.getByRole("button", { name: "Continue with Face ID" }).click();
  await p.getByRole("button", { name: "Send $20" }).waitFor({ timeout: 30000 });
  await wait(p, 1500);
  await p.getByRole("button", { name: "Send $20" }).click();
  await p.getByText("Arrived").waitFor({ timeout: 90000 });
  await wait(p, 4000);
  mark("end");
};

const cafe = async (p, mark) => {
  await p.goto(`${APP}/merchant`);
  await wait(p, 1500);
  mark("start");
  await p.getByRole("button", { name: /Create with Face ID/ }).click();
  await p.getByRole("button", { name: "Open my counter" }).waitFor({ timeout: 30000 });
  await wait(p, 7000);
  await p.getByPlaceholder("Shop name").fill("");
  await p.getByPlaceholder("Shop name").pressSequentially("Campus Chai Point", { delay: 80 });
  await wait(p, 600);
  mark("open");
  await p.getByRole("button", { name: "Open my counter" }).click();
  await p.getByText(/Live · signed by your passkey/).waitFor({ timeout: 60000 });
  await wait(p, 4000);
  await p.mouse.wheel(0, 500);
  await wait(p, 3000);
  mark("end");
};

const browser = await chromium.launch({ headless: true });
const results = [];
const r = await take(browser, "riya", riya);
results.push(r);
results.push(await take(browser, "mom", mom(r.extra?.capsule ?? "12")));
results.push(await take(browser, "cafe", cafe));
await browser.close();
console.log(JSON.stringify(results, null, 2));
