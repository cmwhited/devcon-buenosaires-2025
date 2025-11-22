import type { Metadata } from "next"
import { Anton, Space_Mono } from "next/font/google"
import { headers } from "next/headers"
import { cookieToInitialState } from "wagmi"

import { Providers } from "./Providers"

import { wagmiConfig } from "@/clients/wagmi"

import "./globals.css"

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: ["400"],
})

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
})

export const metadata: Metadata = {
  title: "Pit Stop",
  description: "Cross-chain gas station - One-click gas refills across any chain",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const _headers = await headers()
  const _cookies = _headers.get("cookie")
  const initialState = cookieToInitialState(wagmiConfig, _cookies)

  return (
    <html lang="en" className="m-0 flex h-full min-h-screen w-full flex-col pb-56">
      <body
        className={`${anton.variable} ${spaceMono.variable} h-full w-full bg-[url(/images/background.png)] bg-cover bg-top-left bg-no-repeat bg-origin-border pb-56 font-mono antialiased`}
      >
        <Providers initialState={initialState}>{children}</Providers>
      </body>
    </html>
  )
}
