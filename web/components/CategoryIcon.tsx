import { Bus, Coffee, Cookie, CupSoda, HandCoins, Scissors, ShoppingBasket, Smartphone, UtensilsCrossed, type LucideProps } from "lucide-react";

const ICONS = [UtensilsCrossed, CupSoda, Cookie, Coffee, Bus, ShoppingBasket, Smartphone, Scissors, HandCoins];

export function CategoryIcon({ category, ...p }: { category: number } & LucideProps) {
  const Icon = ICONS[category] ?? UtensilsCrossed;
  return <Icon size={18} strokeWidth={1.8} {...p} />;
}
