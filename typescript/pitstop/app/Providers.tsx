"use client"

import { Toast } from "@base-ui-components/react/toast"
import { PrivyProvider } from "@privy-io/react-auth"
import { WagmiProvider } from "@privy-io/wagmi"
import { QueryClientProvider } from "@tanstack/react-query"
import { polygonAmoy } from "viem/chains"
import type { State } from "wagmi"

import { getQueryClient } from "@/clients/query"
import { wagmiConfig } from "@/clients/wagmi"
import { Layout } from "@/Components/Layout"
import { env } from "@/env/client"

export function Providers({
  children,
  initialState,
}: Readonly<{ children: React.ReactNode; initialState: State | undefined }>) {
  const queryClient = getQueryClient()

  return (
    <PrivyProvider
      appId={env.NEXT_PUBLIC_APP_ID}
      clientId={env.NEXT_PUBLIC_CLIENT_ID}
      config={{
        defaultChain: { ...polygonAmoy, testnet: true },
        supportedChains: [{ ...polygonAmoy, testnet: true }],
        captchaEnabled: true,
        loginMethods: ["wallet"],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        appearance: {
          theme: "light",
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig} initialState={initialState}>
          <Toast.Provider>
            <Layout>{children}</Layout>
          </Toast.Provider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  )
}
