# User testing

Each tester gets only the link https://tally-monad.vercel.app and one instruction: "Buy a coffee with this." The counter QR is shown on a laptop.

We record the time from opening the link to "Paid", where they hesitated, and any word that made it feel like crypto.

| # | Who (role) | Device | Time to first payment | Hesitated at | "Crypto" words noticed | What we changed |
|---|---|---|---|---|---|---|
| 0 | Automated run (Playwright, virtual passkey) | Chromium, 390×844 | ~25 s (welcome credit ≈ 7 s) | none | none | Found two Monad reserve-balance and gas bugs in the welcome credit; fixed with `Drip.welcome` and estimated gas |
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |
| 5 | | | | | | |
