# Tally on Monad Testnet

| What | Address / link |
|---|---|
| Network | Monad Testnet, chain id 10143, RPC `https://testnet-rpc.monad.xyz` |
| Tally contract | [`0x5c7b28d93a424d87018fBf11cD86217a0d68AEE7`](https://testnet.monadvision.com/address/0x5c7b28d93a424d87018fBf11cD86217a0d68AEE7) (Sourcify exact match) |
| AUSD (test) | [`0x935864aB732A31da51738C6dF9705F0dB415754F`](https://testnet.monadvision.com/address/0x935864aB732A31da51738C6dF9705F0dB415754F): 6-decimal stand-in. Agora AUSD exists only on mainnet (`0x00000000eFE302BEAA2b3e6e1b18d08D69a9012a`) |
| Demo café (merchant authority) | `0xF19e5Ab096Eb0fD81181e2bCFC51F6DD5a2FF7f1`, with a $500 bond |
| Demo café menu signer | `0x44465dbA8aF170EaB1d4aAD438643Db778Acdcb6` |
| Deploy block | 70733299 |

## Deploy transactions

- [Deploy MockAUSD](https://testnet.monadvision.com/tx/0x888410e10d42820735edf1d7e16a454ca71f635bedefd2d6de936f9875d92b25)
- [Deploy Tally](https://testnet.monadvision.com/tx/0x592dd5181c24c74b5b92004db07ebbd52cb4e419b5c9731af953f49eff049c2c)
- [Register the demo café](https://testnet.monadvision.com/tx/0x3f6c51ef74c158f728afee88194b4ac67b5a539f921607912ba597aaa6c4271b)

## Gas (forge gas report)

| Function | Gas |
|---|---|
| `payOffer` | 125,328 |
| `createCapsule` (with deposit) | 247,063 |

Monad charges the declared gas limit, so the app sends `estimate × 1.2`.
