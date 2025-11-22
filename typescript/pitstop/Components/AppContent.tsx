"use client"

import { usePrivy } from "@privy-io/react-auth"

import { Splash } from "./Splash"

export function AppContent() {
  const { authenticated, ready } = usePrivy()

  if (!ready) {
    return null
  }
  if (!authenticated) {
    return <Splash />
  }

  return <div>App form goes here</div>
}
