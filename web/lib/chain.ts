import { createPublicClient, http } from "viem";
import { monadTestnet } from "viem/chains";
import d from "./deployments.json";

export const chain = monadTestnet;
export const RPC = process.env.NEXT_PUBLIC_RPC_URL ?? "https://testnet-rpc.monad.xyz";
export const publicClient = createPublicClient({ chain, transport: http(RPC) });
export const TALLY = d.tally as `0x${string}`;
export const AUSD = d.ausd as `0x${string}`;
export const DEMO_MERCHANT = d.demoMerchant as `0x${string}`;
export const DEPLOY_BLOCK = BigInt(d.deployBlock);
export const EXPLORER = "https://testnet.monadvision.com";

/** Monad charges the declared gas limit, so keep the margin small but explicit. */
export const withMargin = (estimate: bigint) => (estimate * 12n) / 10n;
