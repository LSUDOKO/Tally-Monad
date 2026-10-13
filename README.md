<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/brand/logo-lockup-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="docs/brand/logo-lockup-light.png">
  <img src="docs/brand/logo-lockup-light.png" alt="Tally" width="420">
</picture>

### Pocket money that can't be talked into the wrong purchase.

Family tops up a student's allowance from anywhere, in about a second, for cents.<br>
It can only buy what a counter signed, at the signed price, inside the family's rules.<br>
The student's AI assistant can order, but a Monad contract (not the model) makes it pick the cheapest match.

**[▶ Try it: tally-monad.vercel.app](https://tally-monad.vercel.app)** · **[Download the Android app (v2.0.0)](https://github.com/LSUDOKO/Tally-Monad/releases/download/v2.0.0/tally-monad-v2.0.0.apk)** · [Counter QR](https://tally-monad.vercel.app/counter) · [Contract on Monad Testnet](https://testnet.monadvision.com/address/0xe7d22F222a799218908997f837CF3e0Fd1c1e40a) · [Market gap](docs/MARKET-GAP.md) · [Verify it](docs/VERIFY.md)

Built for **Monad Metropolis**: Consumer Products & Payments

</div>

---

<p align="center"><img src="docs/images/monad/v2/strip-1.png" alt="Welcome, Home, the agent's pick and Second Look, recorded on Monad Testnet" width="100%"></p>
<p align="center"><img src="docs/images/monad/v2/strip-2.png" alt="Paid, red team, receipts and keys, recorded on Monad Testnet" width="100%"></p>
<p align="center"><sub>Recorded on the live app against Monad Testnet. The agent pays the cheapest latte alone; the large one waits for Face ID; four attacks bounce off the contract.</sub></p>

## Judges: try it in two minutes

Use a **phone**: install the [Android app](https://github.com/LSUDOKO/Tally-Monad/releases/download/v2.0.0/tally-monad-v2.0.0.apk), or open the web app on any phone whose passkeys sync (iCloud Keychain, Google Password Manager or 1Password). Desktop Chrome with a passkey saved only to that profile can't produce the PRF output Mera needs.

1. On a laptop, open **[tally-monad.vercel.app/counter](https://tally-monad.vercel.app/counter)**. This is the demo café's live, re-signing QR.
2. On your phone, open **[tally-monad.vercel.app](https://tally-monad.vercel.app)** → **Get started** → your first name → **Create with Face ID**. You get a $50 welcome credit; there is no seed phrase, extension, wallet or gas.
3. **Set up my allowance**: coffee and food, $10 per purchase, $25 a day → **Create allowance**.
4. **Scan to pay** → point at the laptop (or tap **Use the demo café instead** on one device) → **Oat latte** → **Pay $4.50**. It settles in under a second.
5. Try **Large oat latte**. Tally shows **Second look**: "$1.40 more than the cheapest coffee". Approve with Face ID.
6. Scan the same code again and pay the same item: **Already paid**.
7. Home → **Ask family** shares a top-up link. Open it on another device or browser, Face ID, **Send $20**, and it arrives with its note.
8. You → **Try to trick my assistant** sends four attacks to the contract from your own assistant key. All four are refused.

No login credentials are needed: your passkey is the account.

## Why

| Who | Today | With Tally |
|---|---|---|
| **Family abroad** (≈1.88M Indian students study abroad) | Sends money through Wise or a bank: days, ~6.36% average cost, arrives as unrestricted cash | A link and Face ID: AUSD lands in about a second, fee about $0, and it's **purpose-bound** ("For lunches this week") |
| **The student** | A card that blocks whole stores by category code, or cash | Scan, say "oat latte", done. No app account, no wallet. |
| **Their AI assistant** | Agent-payment schemes cap the *amount* or bind a cart; prompt injection steers agents to options 2–3× pricier ([AgentLAB](https://arxiv.org/pdf/2602.16901)) | The contract enforces **which item, at which signed price, to which registered counter**, and that it's the **cheapest match**. Anything pricier needs the owner. |
| **The café** | Card fees, chargebacks, settlement days later | A signed menu, a registered payout, final in under a second, and a bond that proves honesty |

*Greenlight controls the store. AP2 controls the cart. Tally controls the item, and the agent's choice of it.* Full analysis with sources: **[docs/MARKET-GAP.md](docs/MARKET-GAP.md)**.

## How it works

1. **One passkey, three keys ([Mera](https://mera.category.xyz)).** The WebAuthn PRF output derives three EOAs:
   - `m/44'/60'/0'/0/0`, **you**: changes rules, approves pricier picks.
   - `/1`, **your assistant**: may pay, but only inside the rules.
   - `/2`, **your counter**: signs your café's menu in merchant mode.

   Keys live in memory for the session and are re-derived from Face ID; nothing is stored on a server.
2. **The counter signs its menu.** It is an EIP-712 `Menu` header over a Merkle root of `(itemId, category, price, floor)` leaves, valid for 60 seconds and re-signed every 20. `floor` is the cheapest price in that category.
3. **The assistant proposes, behind a context firewall.** Kimi (or a deterministic rule) sees item ids, prices, floors and dictionary words, never merchant prose ("regular is sold out", "SYSTEM: …").
4. **The contract checks everything in one transaction** (`payOffer`, below), then moves AUSD to the counter's **registered** payout and checks exact balance deltas.
5. **Pricier than the cheapest match, an under-bonded counter, or a printed menu** → Second Look. Your owner key signs an EIP-712 `Cosign` after a fresh Face ID, and the assistant relays it.

### `payOffer`: ten invariants

| # | Check | Stops |
|---|---|---|
| 1 | Caller is the allowance's assistant or owner; allowance not paused or expired; counter active | Stolen keys, kill switch |
| 2–3 | `ECDSA.recover(EIP-712 menu digest) == counter's registered signing key` (the domain binds chain + contract) | Fake counters, forged menus |
| 4 | `issuedAt ≤ now ≤ expiresAt`; window ≤ 60 s autonomous, ≤ 1 h only with `allowExtended` and the owner | Replayed old QRs |
| 5 | Payout comes from the registry, never from the QR | Payee swap |
| 6 | The contract hashes the leaf itself and verifies the Merkle proof | Price inflation, phantom add-ons |
| 7 | Category bitmap, per-purchase cap, rolling 24 h cap, balance | Out-of-policy spend |
| 8 | **Cheapest match:** `price > floor` (or bond < your minimum, or extended window) needs the owner's `Cosign` | Whisper upsells |
| 9 | Receipt nullifier `keccak(capsule, counter, menuNonce, itemId)` | Double charges |
| 10 | `transfer`, then `Δcontract == −price` and `Δpayout == +price` | Hidden drains, fee-on-transfer tokens |

Plus **trustless slashing**: `proveFloorFraud` lets anyone slash 20% of a counter's bond when its own signed menu lists an item cheaper than the floor it certified (the reporter gets 10% of the slash). It accepts any menu key the counter *ever* registered, so rotating the key can't dodge a proof. Bonds and the compensation pool are not withdrawable yet (demo scope). Code: [`contracts/src/Tally.sol`](contracts/src/Tally.sol).

## Built on Monad, and what Monad changed

- **Sub-second finality makes "tap and go" honest.** Payments settle in about 0.4–1 s on testnet. The UI shows the measured time ("Settled in 0.6 s").
- **Reserve balance.** Monad keeps a 10 MON reserve per account and lets an account below it make one value-moving transaction per 3-block window. Our sponsor's second transfer in a window reverted on testnet. The fix is [`Drip.welcome`](contracts/src/Drip.sol), which sends the owner's and assistant's fee floats and the welcome AUSD in **one** transaction, after a clean 3-block window.
- **Gas is billed at the limit.** Every write uses `estimateGas × 1.2`, never a guessed constant. A fixed 160k limit for the welcome ran out on cold accounts.
- **`eth_getLogs` is capped at about 100 blocks** on the public RPC, so history comes from **Envio HyperIndex**, with a device cache as fallback.

## Sponsor integrations

| Bounty | What's real |
|---|---|
| **Mera: best UX** | Mera is the whole account layer: `createPasskeyWithPrfOutput` / `getPasskeyPrfOutput` → `createSecp256k1SigningSession` → `toViemAccount`. No seed phrase, extension or custody backend. [`web/lib/mera.ts`](web/lib/mera.ts) |
| **Mera: one passkey, many keys** | The same PRF gives the owner key, a **scoped agent key** (the contract only lets it spend inside rules) and a **merchant menu-signing key**. The non-wallet use: your Face ID signs your café's menu. |
| **Agora AUSD cross-border** | A family top-up link with passkey onboarding funds a rule-bound allowance in AUSD with a purpose note. The testnet uses a 6-decimal stand-in, because AUSD is deployed only on mainnet (`0x00000000eFE302BEAA2b3e6e1b18d08D69a9012a`). The token address is a constructor argument. |
| **Envio** | HyperIndex indexes `Paid`, `Funded`, `CapsuleCreated`, `MerchantRegistered` and `Slashed` → Receipts, this week's spend, family top-ups, points and merchant sales ([`indexer/`](indexer)). Hosted on Envio Cloud: [GraphQL endpoint](https://indexer.dev.hyperindex.xyz/a8a78bb/v1/graphql). |
| **Kimi** | `/api/agent` asks Kimi (OpenAI-compatible) to pick one item id from the firewalled payload; the reply is schema-checked. It falls back to a deterministic rule without a key. |

## Deployed (Monad Testnet, chain 10143)

| Contract | Address |
|---|---|
| Tally | [`0xe7d22F222a799218908997f837CF3e0Fd1c1e40a`](https://testnet.monadvision.com/address/0xe7d22F222a799218908997f837CF3e0Fd1c1e40a) (Sourcify verified) |
| AUSD (test) | [`0xad4B854A7eF968FDC53D4C8CC6590Dc24Cb536F1`](https://testnet.monadvision.com/address/0xad4B854A7eF968FDC53D4C8CC6590Dc24Cb536F1) |
| Drip | [`0xafA3C3598E2051BDd615Fd7b7df8018fE22B625E`](https://testnet.monadvision.com/address/0xafA3C3598E2051BDd615Fd7b7df8018fE22B625E) |

Evidence (more in [docs/VERIFY.md](docs/VERIFY.md)):
- [Assistant pays the cheapest latte alone](https://testnet.monadvision.com/tx/0x00be7f8c1b270a92df972b79c897548332d43273aab911b8b69369eec195f092)
- [Large latte paid with the owner's cosign](https://testnet.monadvision.com/tx/0x583fa31698333d4fd56332ff7a6671d2bfb533f9501f354463b8bc524554623c)

## Repo

| Path | What |
|---|---|
| [`contracts`](contracts) | Foundry: `Tally.sol`, `MenuMerkle.sol`, `Drip.sol`, `MockAUSD.sol`, 32 tests including the attack suite |
| [`web`](web) | Next.js PWA: Mera sign-in, allowance, scan, assistant, Second Look, receipts, family top-up, merchant mode, red team; 55 vitest tests + 1 live testnet run |
| [`indexer`](indexer) | Envio HyperIndex |
| [`android`](android) | The Android app: a Trusted Web Activity over the live app (so Mera passkeys run in Chrome), verified with Digital Asset Links |
| [`docs`](docs) | [Market gap](docs/MARKET-GAP.md), [Monad notes](docs/MONAD.md), [verify guide](docs/VERIFY.md), [plan](docs/superpowers/plans/2026-10-13-tally-monad.md), and the original Solana design docs this was ported from |

```bash
cd contracts && forge test                 # 32 tests: invariants, attacks, slashing, drip
cd web && pnpm install && pnpm test        # 55 tests: menu tree ⇄ Solidity vector, firewall, preflight, keys…
E2E=1 pnpm vitest run test/e2e.live.test.ts  # real Monad Testnet: pay, second look, replay, top-up
```

## Honest status

- Testnet only. AUSD is a 6-decimal stand-in; the mainnet AUSD address is documented and the contract takes the token as a constructor argument.
- Not audited. The welcome credit and fee floats come from a sponsor wallet so testers never meet gas; on mainnet that becomes a paymaster or a fee in AUSD.
- Ported from [Tally on Solana](https://github.com/LSUDOKO/Tally) (Anchor + Android, built for Solana Mobile). The research numbers there and in [MARKET-GAP](docs/MARKET-GAP.md) are other teams' published results, not our measurements.

## License

Apache-2.0
