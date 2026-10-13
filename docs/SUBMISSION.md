# Metropolis submission kit

| Field | Value |
|---|---|
| Project | Tally: pocket money that can't be talked into the wrong purchase |
| Primary track | Consumer Products & Payments |
| Bounties | Best Mera-Powered UX · Mera: One Passkey, Many Keys · Agora Cross-Border Payments (AUSD) · Best Use of Envio · Best Builds Powered by KIMI · Best Community Team Project |
| Live product | https://tally-monad.vercel.app (judges: use a phone; the counter QR is at `/counter`) |
| Repo | https://github.com/LSUDOKO/Tally-Monad. Give `metropolis@hackathon.monad.xyz` access. |
| Logo | `docs/brand/app-icon-1024.png` (PNG, under 3 MB) |
| Contract | Monad Testnet `0x5c7b28d93a424d87018fBf11cD86217a0d68AEE7` |
| Test login | None needed: the passkey is the account, and a $50 test credit is added automatically |

## Pitch video (≤ 2:00)

| Time | Say | Show |
|---|---|---|
| 0:00 | "My parents send me money for food. It arrives days later, a bank takes six percent, and nobody can say what it was spent on." | Face to camera |
| 0:15 | "Now my AI assistant orders my coffee. One line of menu text, 'regular is sold out', and it buys the large. Every spending cap says yes." | AgentLAB / Whisper headline |
| 0:30 | "Tally is pocket money that can't be talked into the wrong purchase. Family tops it up from anywhere in a second. It only buys what a counter signed, at the signed price, inside the family's rules." | Home screen |
| 0:50 | "The assistant can order, but a Monad contract, not the model, checks it took the cheapest match. Anything pricier waits for my Face ID." | Second Look |
| 1:05 | "No seed phrase, no wallet, no gas. One passkey gives me my account, my assistant's limited key, and, if I run a café, the key that signs my menu." | Settings, three keys |
| 1:20 | "Why Monad: settlement in under a second makes tap-and-go honest, and fees small enough for a two-dollar chai." | "Settled in 0.6 s" |
| 1:35 | "Who first: 1.9 million Indian students abroad and the families who fund them. Next 100 users: two campus cafés near us and a student-society group." | Distribution slide |
| 1:50 | "Greenlight controls the store. AP2 controls the cart. Tally controls the item." | Logo |

## Technical demo video (≤ 3:00, live product only)

1. **0:00 Phone, fresh.** Get started → name → Face ID. The $50 welcome appears. Say: "That was a passkey through Mera; there's no seed phrase."
2. **0:20 Allowance.** Coffee and food, $10 per purchase, $25 a day → Create.
3. **0:40 Laptop `/counter`.** The QR re-signs every 20 s. Phone: Scan → "oat latte" → assistant picked, checks ✓ → Pay → **Paid in under 1 s** → Proof (explorer).
4. **1:10** "Large oat latte" → **Second look: $1.40 more than the cheapest coffee** → Approve with Face ID → Paid, approved by you.
5. **1:35** Scan the same code and pay again → **Already paid**.
6. **1:50 Second phone** opens the "Ask family" link (₹ hint, "For lunches this week") → Face ID → Send $20 → **Arrived**. First phone: Home shows the top-up.
7. **2:20** You → Try to trick my assistant → four attacks, **four blocked** by the contract.
8. **2:40** Merchant mode: the same passkey opens a counter; your Face ID signs the menu. Receipts come from Envio.

## Distribution: the next 100 users

1. **Two campus cafés** within walking distance: print the `/counter` QR on a table tent and pay the first 50 coffees from our test credit. Merchant mode needs only a phone.
2. **Student-society WhatsApp groups** (hostel, international-student cell): "Your parents can top up your coffee allowance from Dubai in a second."
3. **Parents' groups:** the top-up link is the acquisition loop. Every student who shares "Ask family" brings one funder, who sees the rules before paying.
4. **AI-assistant users:** the MCP/Telegram surface from Tally v1 returns as "let your assistant order, safely".

## User testing

Log each session in `docs/USER-TESTING.md`: who, device, time to first payment, where they hesitated, any word that felt "crypto", and what we changed.
