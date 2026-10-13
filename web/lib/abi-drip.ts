export const DRIP_ABI = [
  {
    type: "function",
    name: "welcome",
    stateMutability: "payable",
    inputs: [
      { name: "to", type: "address[]" },
      { name: "amount", type: "uint256[]" },
      { name: "token", type: "address" },
      { name: "mintTo", type: "address" },
      { name: "mintAmount", type: "uint256" },
    ],
    outputs: [],
  },
] as const;
