export const DRIP_ABI = [
  {
    type: "function",
    name: "drip",
    stateMutability: "payable",
    inputs: [
      { name: "to", type: "address[]" },
      { name: "amount", type: "uint256[]" },
    ],
    outputs: [],
  },
] as const;
