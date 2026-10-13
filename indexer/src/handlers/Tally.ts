import { indexer } from "envio";

const lower = (a: string) => a.toLowerCase();
const txFields = { transaction: ["hash"], block: ["timestamp"] } as const;

const nameFrom = (b32: string) =>
  Buffer.from(b32.slice(2), "hex")
    .toString("utf8")
    .replace(/\0+$/, "");

indexer.onEvent({ contract: "Tally", event: "CapsuleCreated" }, async ({ event, context }) => {
  context.Capsule.set({
    id: event.params.id.toString(),
    owner: lower(event.params.owner),
    agent: lower(event.params.agent),
    funded: 0n,
    spent: 0n,
    payments: 0,
  });
});

indexer.onEvent({ contract: "Tally", event: "MerchantRegistered" }, async ({ event, context }) => {
  const id = lower(event.params.merchant);
  const prev = await context.Merchant.get(id);
  context.Merchant.set({
    id,
    name: nameFrom(event.params.name),
    bond: event.params.bond,
    sales: prev?.sales ?? 0n,
    count: prev?.count ?? 0,
    slashed: prev?.slashed ?? 0n,
  });
});

indexer.onEvent({ contract: "Tally", event: "Paid", fields: txFields }, async ({ event, context }) => {
  const merchant = lower(event.params.merchant);
  context.Payment.set({
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    capsuleId: event.params.capsuleId,
    merchant,
    itemId: event.params.itemId,
    category: Number(event.params.category),
    price: event.params.price,
    cosigned: event.params.cosigned,
    receipt: event.params.receipt,
    txHash: event.transaction.hash,
    timestamp: Number(event.block.timestamp),
  });
  const m = await context.Merchant.get(merchant);
  if (m) context.Merchant.set({ ...m, sales: m.sales + event.params.price, count: m.count + 1 });
  const c = await context.Capsule.get(event.params.capsuleId.toString());
  if (c) context.Capsule.set({ ...c, spent: c.spent + event.params.price, payments: c.payments + 1 });
});

indexer.onEvent({ contract: "Tally", event: "Funded", fields: txFields }, async ({ event, context }) => {
  context.Topup.set({
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    capsuleId: event.params.id,
    from: lower(event.params.from),
    amount: event.params.amount,
    note: event.params.note,
    txHash: event.transaction.hash,
    timestamp: Number(event.block.timestamp),
  });
  const c = await context.Capsule.get(event.params.id.toString());
  if (c) context.Capsule.set({ ...c, funded: c.funded + event.params.amount });
});

indexer.onEvent({ contract: "Tally", event: "Slashed" }, async ({ event, context }) => {
  const id = lower(event.params.merchant);
  const m = await context.Merchant.get(id);
  if (m) context.Merchant.set({ ...m, bond: m.bond - event.params.amount, slashed: m.slashed + event.params.amount });
});
