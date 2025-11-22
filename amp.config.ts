import { defineDataset } from "@edgeandnode/amp"

const network = "base-sepolia" as const
const PitstopServerWalletAddressMap = {
  [network]: "87f78a9c6A46f07d60F7101A270b34F5dDf4DAa3",
} as const satisfies Record<"base-sepolia", string>

export default defineDataset(() => ({
  namespace: "pitstop",
  name: "pitstop",
  description: "Cross-chain gas station - One-click gas refills across any chain",
  keywords: ["Base", "Polygon", "x402", "USDC", "Autonomous Agents"],
  sources: ["0x87f78a9c6A46f07d60F7101A270b34F5dDf4DAa3"],
  readme: `# Pit Stop - Your crosschain filling station

Cross-chain gas station - One-click gas refills across any chain.

Running on fumes? We'll get you back on the road. One-click gas delivery to any wallet, any chain.

Currently servicing: base, polygon, ETH mainnet.

1. Pull in. Connect your wallet. No paperwork needed.
2. Pick your chain. Choose ETH or Base. Set your fill amount.
3. Pump & go. We handle the rest. Back on the road in seconds.
`,
  network,
  dependencies: {
    transactions: "edgeandnode/base_sepolia@0.0.1",
  },
  tables: {
    pitstop_transactions: {
      sql: `SELECT * FROM transactions.transactions WHERE "from" = x'${PitstopServerWalletAddressMap[network]}'`,
    },
  },
}))
