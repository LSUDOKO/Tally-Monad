import { describe, it } from "vitest";
import { createTestIndexer } from "envio";

const merchant = "0x00000000000000000000000000000000000000CA";

describe("Tally indexer", () => {
  it("indexes a payment and rolls it into the merchant and capsule totals", async (t) => {
    const indexer = createTestIndexer();
    await indexer.process({
      chains: {
        10143: {
          simulate: [
            { contract: "Tally", event: "CapsuleCreated", params: { id: 7n, owner: "0x00000000000000000000000000000000000000A1", agent: "0x00000000000000000000000000000000000000A2" } },
            { contract: "Tally", event: "MerchantRegistered", params: { merchant, name: "0x54616c6c792044656d6f20436166650000000000000000000000000000000000", signingKey: merchant, payout: merchant, bond: 500_000_000n } },
            { contract: "Tally", event: "Paid", params: { capsuleId: 7n, merchant, itemId: "0x7a11e0000000000000000000000000a1", category: 3n, price: 4_500_000n, cosigned: false, receipt: "0x" + "11".repeat(32) } },
          ],
        },
      },
    });
    const payments = await indexer.Payment.getAll();
    t.expect(payments.length).toBe(1);
    t.expect(payments[0]!.merchant).toBe(merchant.toLowerCase());
    t.expect(payments[0]!.price).toBe(4_500_000n);
    const m = await indexer.Merchant.getOrThrow(merchant.toLowerCase());
    t.expect(m.name).toBe("Tally Demo Cafe");
    t.expect(m.sales).toBe(4_500_000n);
    const c = await indexer.Capsule.getOrThrow("7");
    t.expect(c.spent).toBe(4_500_000n);
  });

  it("indexes a family top-up with its note", async (t) => {
    const indexer = createTestIndexer();
    await indexer.process({
      chains: {
        10143: {
          simulate: [
            { contract: "Tally", event: "Funded", params: { id: 7n, from: "0x00000000000000000000000000000000000000F1", amount: 20_000_000n, note: "For lunches this week" } },
          ],
        },
      },
    });
    const tops = await indexer.Topup.getAll();
    t.expect(tops[0]!.note).toBe("For lunches this week");
    t.expect(tops[0]!.capsuleId).toBe(7n);
  });
});
