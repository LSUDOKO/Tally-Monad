import { buildTree, type Hex, type Item, type SignedMenu } from "./menu";

export type Attack = {
  title: string;
  story: string;
  expect: string;
  menu: SignedMenu;
  item: Item;
  proof: Hex[];
};

/**
 * Four ways a manipulated assistant or a fake counter could try to move money. Each one is simulated
 * against the live contract from the user's own assistant key; the chain must refuse every one.
 */
export function buildAttacks(menu: SignedMenu, forged: SignedMenu): Attack[] {
  const { proofs } = buildTree(menu.items);
  const cheapest = menu.items[0];
  const pricier = menu.items.findIndex((i) => i.category === cheapest.category && i.price > i.floor);
  return [
    {
      title: "Fake counter",
      story: "A QR that looks like the café but was signed by someone else.",
      expect: "WrongSigner",
      menu: forged,
      item: forged.items[0],
      proof: buildTree(forged.items).proofs[0],
    },
    {
      title: "Phantom add-on",
      story: "The assistant is told to add a \"service fee\" that isn't on the menu.",
      expect: "NotOnMenu",
      menu,
      item: { itemId: "0xdeadbeefdeadbeefdeadbeefdeadbeef", category: cheapest.category, price: 1_000_000n, floor: 1_000_000n, name: "Service fee" },
      proof: proofs[0],
    },
    {
      title: "Price inflation",
      story: "Same latte, but the assistant is told it now costs $9.90.",
      expect: "NotOnMenu",
      menu,
      item: { ...cheapest, price: 9_900_000n },
      proof: proofs[0],
    },
    {
      title: "Whisper upsell",
      story: "Menu text says \"regular is sold out\", so the assistant tries the large one on its own.",
      expect: "OwnerCosignRequired",
      menu,
      item: menu.items[pricier >= 0 ? pricier : 0],
      proof: proofs[pricier >= 0 ? pricier : 0],
    },
  ];
}
