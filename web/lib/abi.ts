import tallyAbi from "./tally.abi.json";
import { erc20Abi, type Abi } from "viem";

export const TALLY_ABI = tallyAbi as Abi;
export const MOCK_AUSD_ABI = [
  ...erc20Abi,
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [],
  },
] as const;
