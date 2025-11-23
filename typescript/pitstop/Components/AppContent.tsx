"use client"

import { usePrivy } from "@privy-io/react-auth"

import { Splash } from "./Splash"
import { TransactionForm } from "./TransactionForm"

export function AppContent() {
  const { authenticated, ready, user } = usePrivy()

  if (!ready) {
    return null
  }
  if (!authenticated || user == null) {
    return <Splash />
  }

  return <TransactionForm user={user} />
}
