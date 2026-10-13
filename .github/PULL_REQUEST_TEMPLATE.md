## What and why

<!-- One or two sentences. Link the issue: "Closes #123". -->

## Area

- [ ] Contracts (`contracts/`)
- [ ] Web app (`web/`)
- [ ] Indexer (`indexer/`)
- [ ] Docs or CI

## Checklist

- [ ] `forge test`, `pnpm test` (web and indexer) and `tsc --noEmit` pass
- [ ] Every new on-chain check has a Foundry test asserting its exact custom error
- [ ] Encoding changes keep the TypeScript ⇄ Solidity Merkle vector green
- [ ] New contract errors have a plain-language sentence in `web/lib/errors.ts`
- [ ] Writes use explicit gas (`estimateGas × 1.2`)
- [ ] A line under `[Unreleased]` in `CHANGELOG.md`
- [ ] No keys or `.env` values in the diff, screenshots or logs

## Evidence

<!-- Test output, a Monad Testnet transaction hash, or a screenshot / recording for UI changes. -->
