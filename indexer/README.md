# Tally indexer (Envio HyperIndex)

Indexes the Tally contract on Monad Testnet (chain 10143) from block 70747699. Monad's public RPC caps `eth_getLogs` at about 100 blocks, so the app's history (Receipts, this week's spend, family top-ups, merchant sales) is served from here.

| Entity | From event | Used by |
|---|---|---|
| `Payment` | `Paid` | Receipts, Home "recent payments", points, merchant sales |
| `Topup` | `Funded` (with the family's note) | Receipts, Home |
| `Capsule` | `CapsuleCreated`, `Paid`, `Funded` | funded and spent totals per allowance |
| `Merchant` | `MerchantRegistered`, `Paid`, `Slashed` | sales, bond and slashed totals |

```bash
pnpm install && pnpm codegen
pnpm test     # handler tests with simulated events
pnpm dev      # local run (needs Docker)
```

Hosted on Envio Cloud as `tally-monad`. The web app reads it through `NEXT_PUBLIC_ENVIO_URL`.
