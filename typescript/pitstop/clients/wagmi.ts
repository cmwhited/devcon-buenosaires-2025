import { createConfig } from "@privy-io/wagmi"
import { createClient, http } from "viem"
import { polygonAmoy } from "viem/chains"
import { cookieStorage, createStorage } from "wagmi"
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors"

import { env } from "@/env/client"
import { getAppUrl } from "@/utils/url"

export const wagmiConfig = createConfig({
  chains: [polygonAmoy] as const,
  ssr: true,
  client(params) {
    const transport = http(`https://polygon-rpc.com`)

    return createClient({
      chain: params.chain,
      transport,
    })
  },
  connectors: [
    injected(),
    coinbaseWallet({
      appName: "Pit Stop",
    }),
    walletConnect({
      projectId: env.NEXT_PUBLIC_WALLET_CONNECT_PROJECTID,
      metadata: {
        name: "Pit Stop",
        description: "Cross-chain gas station - One-click gas refills across any chain",
        icons: [],
        url: getAppUrl(),
      },
      qrModalOptions: {
        themeMode: "dark",
      },
    }),
  ],
  storage: createStorage({ storage: cookieStorage, key: "pitstop__authstate" }),
})

export type PitStopWagmiConfig = typeof wagmiConfig

declare module "wagmi" {
  interface Register {
    config: PitStopWagmiConfig
  }
}
