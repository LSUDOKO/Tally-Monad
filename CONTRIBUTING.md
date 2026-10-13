# Contributing to Tally

Tally is a testnet-only, unaudited project, so the bar for a change is simple: every payment check stays in the contract, and every change comes with a test that proves it.

By taking part you agree to the [Code of Conduct](CODE_OF_CONDUCT.md). Security issues go through [SECURITY.md](SECURITY.md), never a public issue.

## Repository map

| Path | What | Language |
|---|---|---|
| `contracts` | `Tally.sol` (pay invariants, cosign, slashing), `MenuMerkle.sol`, `Drip.sol`, `MockAUSD.sol` | Solidity (Foundry) |
| `web` | Next.js PWA: Mera passkeys, allowance, scan, assistant, receipts, family top-up, merchant mode | TypeScript |
| `indexer` | Envio HyperIndex for payments, top-ups, capsules, merchants | TypeScript |
| `docs` | Market gap, Monad notes, verify guide, plans, original Solana design docs | Markdown |

## Set up

| Tool | Version |
|---|---|
| Foundry | 1.4.x |
| Node.js | 22 |
| pnpm | 10+ |

```bash
cd contracts && forge build
cd web && pnpm install
cd indexer && pnpm install && pnpm codegen
```

Secrets (`DRIP_PRIVATE_KEY`, `DEMO_MERCHANT_SIGNER_KEY`, `KIMI_API_KEY`, `ENVIO_API_TOKEN`) live in gitignored `.env` / `.env.local` files. Never commit one, and never paste a key into an issue, a pull request or a screenshot.

## Run the checks CI runs

```bash
cd contracts && forge test
cd web && pnpm test && pnpm exec tsc --noEmit
cd indexer && pnpm test
```

## Rules for changes

- **On-chain checks stay on-chain.** The app may explain or pre-check a payment (`web/lib/pay.ts` `preflight`), but `payOffer` decides.
- **Every attack has a test with its exact custom error** in `contracts/test/Tally.t.sol`.
- **Bytes match across languages.** A change to leaf, node, EIP-712 types or the QR codec must keep `MenuMerkle.t.sol::test_ThreeItemRootMatchesTypeScript` and `web/test/menu.test.ts` green.
- **Errors read as sentences.** A new contract error needs a sentence in `web/lib/errors.ts`.
- **Respect Monad's rules:** explicit gas from `estimateGas × 1.2` (Monad bills the limit), and one value-moving sponsor transaction per 3-block window (reserve balance).
- **Keep it on testnet.** Do not add mainnet keys.

## Commits and pull requests

- One logical change per commit, with a short area prefix: `feat(contracts): …`, `fix(web): …`, `docs: …`.
- Open the pull request against `main`, fill in the template and attach a screenshot for UI changes.
- Add a line under `[Unreleased]` in [CHANGELOG.md](CHANGELOG.md).

## License

By contributing you agree that your contributions are licensed under the [Apache-2.0 License](LICENSE).
