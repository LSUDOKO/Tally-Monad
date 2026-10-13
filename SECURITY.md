# Security policy

## Status

Tally runs on **Monad Testnet only** and has **not been audited**. Do not use it with mainnet funds. The design threat model (written for the Solana version, same invariants) is in [docs/11-threat-model.md](docs/11-threat-model.md); what is checked on-chain on Monad is in the README's invariant table and [docs/VERIFY.md](docs/VERIFY.md).

## Supported versions

| Version | Supported |
|---|---|
| 2.x (Monad, `main`) | Yes |
| 1.x (Solana, separate repo) | No |

The deployed testnet contract is `0x5c7b28d93a424d87018fBf11cD86217a0d68AEE7` (Monad Testnet, chain 10143).

## Reporting a vulnerability

**Please do not open a public issue.** Report privately through GitHub: [open a private vulnerability report](https://github.com/LSUDOKO/Tally-Monad/security/advisories/new).

Include what you can of:

- the component (contract, web app, onboarding sponsor route, agent route, indexer);
- the steps or a test that reproduces it, ideally a Foundry test or a testnet transaction hash;
- the impact you expect (funds moved outside a capsule's rules, a check bypassed, a denial of service).

You can expect an acknowledgement within 3 days and an assessment within 7. Fixes land with a regression test in [`contracts/test`](contracts/test) and a credit in the changelog, unless you prefer to stay anonymous.

## Most valuable reports

Anything that lets an assistant key move value that `payOffer` should refuse:

- paying an item that is not under the merchant's signed Merkle root, or at a different price;
- paying any account other than the merchant's registered payout;
- getting past the EIP-712 menu signature, the freshness window, the Cheapest-Match cosign, the caps or the receipt nullifier;
- moving more than the price, or touching another allowance's balance or a merchant bond;
- replaying an owner cosign on a different item, allowance, chain or contract;
- draining the onboarding sponsor faster than its per-address checks allow.

## Out of scope

- Testnet tokens have no value; "stealing" test AUSD is only interesting if it shows a real bypass.
- Rate limits and cold starts of the free-tier hosted demo.
- A compromised phone OS or wallet, physical relay of a fresh QR code, and the other limits listed in the threat model.

Never send a recovery phrase or private key, including in a report.
