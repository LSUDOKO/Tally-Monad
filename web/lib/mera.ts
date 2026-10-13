import {
  createPasskeyWithPrfOutput,
  createSecp256k1SigningSession,
  getPasskeyPrfOutput,
  isMeraError,
  type PasskeyCredentialMetadata,
} from "@category-labs/mera";
import { toViemAccount } from "@category-labs/mera/viem";
import { HDKey } from "@scure/bip32";
import { entropyToMnemonic, mnemonicToSeedSync } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import type { LocalAccount } from "viem";

/** One passkey, three keys: the owner, the agent that pays inside the rules, and a shop's menu signer. */
export const PATHS = {
  owner: "m/44'/60'/0'/0/0",
  agent: "m/44'/60'/0'/0/1",
  merchant: "m/44'/60'/0'/0/2",
} as const;

const CRED_KEY = "tally.credential";

export function deriveKeys(prf: Uint8Array) {
  const root = HDKey.fromMasterSeed(mnemonicToSeedSync(entropyToMnemonic(prf, wordlist)));
  const key = (p: string) => root.derive(p).privateKey!;
  return { owner: key(PATHS.owner), agent: key(PATHS.agent), merchant: key(PATHS.merchant) };
}

export type Keys = { owner: LocalAccount; agent: LocalAccount; merchant: LocalAccount; end(): void };

function toKeys(prf: Uint8Array): Keys {
  const d = deriveKeys(prf);
  const sessions = [d.owner, d.agent, d.merchant].map((privateKey) => createSecp256k1SigningSession({ privateKey }));
  [d.owner, d.agent, d.merchant].forEach((k) => k.fill(0));
  return {
    owner: toViemAccount(sessions[0]) as unknown as LocalAccount,
    agent: toViemAccount(sessions[1]) as unknown as LocalAccount,
    merchant: toViemAccount(sessions[2]) as unknown as LocalAccount,
    end: () => sessions.forEach((s) => s.end()),
  };
}

export function hasSavedPasskey(): boolean {
  try {
    return !!localStorage.getItem(CRED_KEY);
  } catch {
    return false;
  }
}

export async function signUp(displayName: string): Promise<Keys> {
  const { prfOutput, credentialId, transports } = await createPasskeyWithPrfOutput({
    rp: { id: location.hostname, name: "Tally" },
    user: { name: displayName, displayName },
  });
  localStorage.setItem(CRED_KEY, JSON.stringify({ credentialId, transports }));
  return toKeys(prfOutput);
}

export async function signIn(): Promise<Keys> {
  const saved = localStorage.getItem(CRED_KEY);
  const credential = saved ? (JSON.parse(saved) as PasskeyCredentialMetadata) : undefined;
  const { prfOutput, credentialId } = await getPasskeyPrfOutput({ rpId: location.hostname, credential });
  if (!saved) localStorage.setItem(CRED_KEY, JSON.stringify({ credentialId }));
  return toKeys(prfOutput);
}

export function forgetPasskey() {
  localStorage.removeItem(CRED_KEY);
}

export function friendlyMeraError(e: unknown): string {
  if (isMeraError(e)) {
    switch (e.code) {
      case "PRF_UNAVAILABLE":
        return "This device can't use Tally's Face ID sign-in. Open Tally on your phone, or save the passkey in Google Password Manager or iCloud Keychain.";
      case "PASSKEY_OPERATION_FAILED":
        return "Face ID or fingerprint was cancelled. Try again.";
      case "SESSION_ENDED":
        return "You were signed out. Sign in again.";
    }
  }
  return "Something went wrong signing in. Try again.";
}
