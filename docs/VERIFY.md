# Verify Tally on Monad yourself

Every claim in the README maps to something you can run, open on the explorer, or read in the code.

## 1. Live product

- App: https://tally-monad.vercel.app (use a phone: passkeys need PRF, which iCloud Keychain, Google Password Manager and 1Password support)
- Demo café counter: https://tally-monad.vercel.app/counter. A fresh EIP-712-signed menu is served every 20 s, timed by the chain's clock.

## 2. Run the tests

```bash
cd contracts && forge test
# 5 suites, 30 tests: Tally (21: ten invariants, attacks, cosign, top-up note, slashing), MenuMerkle (3), Drip (4), MockAUSD (2)

cd web && pnpm install && pnpm test
# 51 tests + 1 skipped live test: menu tree ⇄ Solidity vectors, QR codec, Mera key derivation, firewall,
# preflight, error sentences, welcome plan, reserve window, counter signing, red-team builder, fx hints

E2E=1 pnpm vitest run test/e2e.live.test.ts
# real Monad Testnet (needs web/.env.local with a funded DRIP_PRIVATE_KEY and DEMO_MERCHANT_SIGNER_KEY):
# create allowance → on-chain menuDigest == viem hashTypedData → pay cheapest → "needs your approval"
# → cosigned pay → "Already paid" → family top-up with a note → exact balance
```

The cross-language byte check: `contracts/test/MenuMerkle.t.sol::test_ThreeItemRootMatchesTypeScript` pins the root that `web/lib/menu.ts` builds for the same three items (`0x40782891…5b005b`).

## 3. On-chain evidence (Monad Testnet, chain 10143)

| What | Link |
|---|---|
| Tally contract (Sourcify exact match) | [0x5c7b…AEE7](https://testnet.monadvision.com/address/0x5c7b28d93a424d87018fBf11cD86217a0d68AEE7) |
| Deploy Tally | [0x592d…c2c](https://testnet.monadvision.com/tx/0x592dd5181c24c74b5b92004db07ebbd52cb4e419b5c9731af953f49eff049c2c) |
| Demo café registered with a $500 bond | [0x3f6c…71b](https://testnet.monadvision.com/tx/0x3f6c51ef74c158f728afee88194b4ac67b5a539f921607912ba597aaa6c4271b) |
| Assistant pays the cheapest latte alone (invariants 1–10, no cosign) | [0x1fcb…250a](https://testnet.monadvision.com/tx/0x1fcb42c4d187dd86036f78b0c3058b7e2d92f26903fdd2e4298c93c325d7250a) |
| Large latte, owner's EIP-712 cosign relayed by the assistant | [0x2191…4a45](https://testnet.monadvision.com/tx/0x21916ee8a9b57d73d3201200134259d4714a712d7572255b2d5a558e757a4a45) |
| Reserve-balance revert we hit (a second sponsor transfer in one 3-block window) | [0xa266…68c4](https://testnet.monadvision.com/tx/0xa2660324300c27f8e75810636742b44de66ca96fc60161b982794194219268c4) |

## 4. Code map

| Claim | Code |
|---|---|
| Ten invariants | `contracts/src/Tally.sol` `payOffer`, numbered comments 1–10 |
| Cheapest match → owner | `Tally.sol` step 8; `web/lib/pay.ts` `preflight` mirrors it before Face ID |
| Floor-fraud slashing | `Tally.sol` `proveFloorFraud`; test `test_FloorFraudSlashes` |
| One passkey, three keys | `web/lib/mera.ts` `PATHS`, `deriveKeys`, `toKeys` |
| Context firewall | `web/lib/firewall.ts`; test "never puts display names in the agent payload" |
| Kimi agent with schema check | `web/app/api/agent/route.ts` + `validatePick` |
| One-transaction welcome (reserve balance) | `contracts/src/Drip.sol` `welcome`; `web/app/api/onboard/route.ts` `waitForWindow` |
| Purpose-bound top-up | `Tally.fund(id, amount, note)` → `Funded(..., note)`; `web/app/send/[capsuleId]/page.tsx` |

## 5. Not done

No audit, no mainnet deployment, no real AUSD on testnet (a stand-in token), no merchant pilots yet. User testing results are in `docs/USER-TESTING.md` once collected.
