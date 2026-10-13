# Tally on Monad Testnet

| What | Address / link |
|---|---|
| Network | Monad Testnet, chain id 10143, RPC `https://testnet-rpc.monad.xyz` |
| Tally contract | [`0xe7d22F222a799218908997f837CF3e0Fd1c1e40a`](https://testnet.monadvision.com/address/0xe7d22F222a799218908997f837CF3e0Fd1c1e40a) (Sourcify exact match) |
| AUSD (test) | [`0xad4B854A7eF968FDC53D4C8CC6590Dc24Cb536F1`](https://testnet.monadvision.com/address/0xad4B854A7eF968FDC53D4C8CC6590Dc24Cb536F1): 6-decimal stand-in. Agora AUSD exists only on mainnet (`0x00000000eFE302BEAA2b3e6e1b18d08D69a9012a`) |
| Demo café (merchant authority) | `0xF19e5Ab096Eb0fD81181e2bCFC51F6DD5a2FF7f1`, with a $500 bond |
| Demo café menu signer | `0x44465dbA8aF170EaB1d4aAD438643Db778Acdcb6` |
| Drip (one-transaction welcome) | [`0xafA3C3598E2051BDd615Fd7b7df8018fE22B625E`](https://testnet.monadvision.com/address/0xafA3C3598E2051BDd615Fd7b7df8018fE22B625E) |
| Deploy block | 70747699 |

## Deploy transactions

- [Deploy MockAUSD](https://testnet.monadvision.com/tx/0xfc59670096c9e6a6b1d6b9e18da18625665b61395649fd3faaf3bd92b3fd36c1)
- [Deploy Tally](https://testnet.monadvision.com/tx/0x3b05bb8ab9d4ceef7bd15c1febad5a1d52ef834d95b6e0322695544ed8e37328)
- [Register the demo café](https://testnet.monadvision.com/tx/0x1683f8d3f6db67e0452cc4da394f6f82913ea01921c0910d6166ec6d0237cc57)

## Gas (forge gas report)

| Function | Gas |
|---|---|
| `payOffer` | 125,328 |
| `createCapsule` (with deposit) | 247,063 |

Monad charges the declared gas limit, so the app sends `estimate × 1.2`.
