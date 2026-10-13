import { isAddressEqual, recoverTypedDataAddress, type Hex } from "viem";
import { menuTypes, tallyDomain, type SignedMenu } from "./menu";

/** True when the menu header was signed by `signingKey` (the key the counter registered on-chain). */
export async function signedBy(m: SignedMenu, signingKey: Hex): Promise<boolean> {
  try {
    const who = await recoverTypedDataAddress({ domain: tallyDomain(), types: menuTypes, primaryType: "Menu", message: m.header, signature: m.sig });
    return isAddressEqual(who, signingKey);
  } catch {
    return false;
  }
}
