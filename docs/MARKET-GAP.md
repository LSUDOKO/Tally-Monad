# Market gap: what Tally does that nobody else does

> **Greenlight controls the store. AP2 controls the cart. Tally controls the item, and the agent's choice of it.**

Tally is **purpose-bound pocket money for the AI-agent era.**
1. Family abroad tops up a student's allowance in dollars (AUSD on Monad) with one link and a passkey. It arrives in under a second, for cents.
2. The money can only buy items on a merchant-signed menu, at the signed price, within the family's rules.
3. When the student's AI orders the oat latte, the contract (not the model) checks that it took the cheapest match. A pricier pick waits for the owner's Face ID.
4. A merchant that lies on its signed menu loses its bond.

## Who it is for

| Who | Need | Tally's answer |
|---|---|---|
| **The funder**: parents or grandparents, often abroad | Send money that is spent on what it was sent for, without days of delay and a 3–6% fee | A purpose-bound allowance with rules the funder can read before paying |
| **The spender**: a student or teen, sometimes through an AI assistant | Buy lunch or coffee with no card and no app account to set up | Face ID, scan, done. The assistant can order without being talked into upsells. |
| **The merchant**: a campus café or canteen | Orders that can't be disputed, and settlement the same second | A signed menu, a registered payout, and a bond that shows it is honest |

## Competitors and what they enforce

| Product | Family can fund it from abroad | Item-level enforcement | Safe for an AI agent | Speed and fee | Any merchant |
|---|---|---|---|---|---|
| Greenlight (US) | Pay link, approved by the parent; senders abroad not documented | ✗ Per-store limits keyed to the merchant category code (MCC); Greenlight notes a misclassified MCC gets around a block | ✗ | Instant inside Greenlight, monthly subscription | ✓ card |
| GoHenry, BusyKid, Step, Revolut <18 | Mostly domestic gift links | ✗ Category or merchant blocks and caps | ✗ | Card rails | ✓ |
| FamApp, Junio, UPI Circle (India) | Parent in India | ✗ Daily and monthly caps | ✗ | UPI, instant | ✓ |
| Wise, Remitly, Western Union, Flywire | ✓ | ✗ Arrives as unrestricted cash | ✗ | Minutes to days, ~3–6.5% | n/a |
| MAS Purpose Bound Money (pilot) | ✗ | Partial: shop types and validity | ✗ | Pilot | Whitelisted shops only |
| Google AP2 | n/a | Cart mandate signed by the user | Partial: no rule tying the purchase to the cheapest option | Rail-agnostic | Merchants that integrate it |
| Stripe SPT / OpenAI ACP | n/a | ✗ Max amount, expiry, one seller | Amount cap only | Card rails | Stripe sellers |
| Visa Intelligent Commerce, Mastercard Agent Pay | n/a | ✗ Token spend limits | Amount cap only | Card rails | ✓ |
| Coinbase x402 | n/a | ✗ Price handshake for each request | No policy layer | Seconds | Servers that implement it |
| **Tally (Monad)** | **✓ Link plus passkey, AUSD, <1 s** | **✓ Merchant-signed leaf plus Merkle proof** | **✓ Cheapest-match rule enforced onchain** | **<1 s, cents** | Any merchant that signs a menu (QR) |

## Five gaps, and where Tally fills each one

1. **Item-level enforcement.** Teen cards stop at the store level, so an allowed store means any item in it is allowed.
   - Tally: `payOffer` checks a merchant-signed EIP-712 menu and a Merkle proof for the exact item and price.
   - Code: `contracts/src/Tally.sol` invariants 2–6.
   - Sources: [Greenlight block a store](https://help.greenlight.com/hc/en-us/articles/47951314307227-How-do-I-block-a-store-or-merchant), [Greenlight spend controls](https://help.greenlight.com/hc/en-us/articles/4403837865627)
2. **Purpose-bound remittance.** Money sent home arrives as unrestricted cash. Conditional money exists only as central-bank pilots (MAS PBM) or research (EduRemesa). That research found that labelling money as being for education *raised* the amount migrants sent.
   - Tally: the family top-up link funds a rule-bound allowance and carries a purpose note ("For lunches this week").
   - Sources: [MAS PBM report](https://www.mas.gov.sg/news/media-releases/2022/mas-report-on-potential-uses-of-a-purpose-bound-digital-singapore-dollar), [IDB EduRemesa](https://blogs.iadb.org/efectividad-desarrollo/en/?p=2432)
3. **No cheapest-match rule outside the model.** AP2, ACP/SPT and the card-network agent tokens bind the amount, the merchant or the cart, but never "the cheapest item that matches."
   - Documented attacks:
     - Injections in search results and product pages pushed agents toward options 2–3× more expensive ([AgentLAB, arXiv 2602.16901](https://arxiv.org/pdf/2602.16901)).
     - Agents favour pricier sponsored listings ([Princeton/UW study coverage](https://www.shopifreaks.com/ai-shopping-agents-tend-to-push-pricier-sponsored-options-instead-of-the-best-deal-a-princeton-and-uw-study-finds/)).
   - Tally: invariant 8. `price > floor` needs the owner's passkey (Second Look).
4. **Merchant honesty is trust-based.** MCC labels are self-reported or set by the acquirer, with no penalty for lying.
   - Tally: merchants post an AUSD bond. `proveFloorFraud` lets *anyone* slash a merchant whose own signed menu contradicts itself.
5. **The agent platform sets the limits, not the payer.** Stripe's shared payment tokens are scoped by the agent's side ([Stripe SPT docs](https://docs.stripe.com/agentic-commerce/concepts/shared-payment-tokens), [Pagos analysis](https://pagos.ai/blog/the-early-building-blocks-of-agentic-commerce)).
   - Tally: the rules live in the owner's capsule. Only the owner's passkey key can change them, and the agent key can only spend inside them.

## Numbers for the pitch

All numbers need re-checking against the source before quoting.

- **About 1.88M Indian students abroad in 2025** (MEA): [ICEF Monitor](https://monitor.icef.com/2025/12/the-number-of-indian-students-abroad-fell-in-2025/), [MEA PDF](https://www.mea.gov.in/Images/CPV/557-en-01-04-12-2025.pdf)
- **6.36% is the global average cost to send $200** (World Bank RPW, Aug 2025). Banks charge about 15%, digital providers about 3.5%: [RPW](https://remittanceprices.worldbank.org)
- **Kids' debit-card platforms are about $4.2B (2025)**, forecast to reach $12.8B by 2034. This is a syndicated estimate; use it as a rough figure only: [Dataintelo](https://dataintelo.com/report/kids-debit-card-platform-market)
