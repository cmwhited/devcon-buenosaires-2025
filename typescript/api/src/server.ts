import { serve } from "@hono/node-server"
import { Env, Hono } from "hono"
import { contextStorage } from "hono/context-storage"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { prettyJSON } from "hono/pretty-json"
import { requestId } from "hono/request-id"
import { secureHeaders } from "hono/secure-headers"
import { formatEther } from "viem"
import type { Resource } from "x402/types"

import { env } from "./env/server.ts"
import { getWallet } from "./wallet.ts"
import { createExactPaymentRequirements, x402Middleware } from "./x402.ts"

interface ApiContext extends Env {
  Variables: Record<string, never>
}

const app = new Hono<ApiContext>()
const wallet = await getWallet("base-sepolia")
console.log(`retrieved CDP account: ${wallet.account.address}, balance: ${formatEther(wallet.balance)} ETH`)

app.use(logger())
app.use(prettyJSON())
app.use("*", requestId())
app.use(secureHeaders())
app.use(contextStorage())
app.use(
  "/api/*",
  cors({
    allowHeaders: ["Content-Type", "Accept", "Authorization", "User-Agent", "X-PAYMENT", "X-PAYMENT-RESPONSE"],
    allowMethods: ["POST", "GET", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["X-PAYMENT-RESPONSE"],
    origin: ["http://localhost:3000"],
  }),
)
app.get("/", (c) => c.json({ status: "OK" }))

app.get(
  "/api/pump",
  x402Middleware({
    paymentRequirements: (c) => {
      const amount = c.req.query("amount")
      const targetNetwork = c.req.query("network")
      const targetAddress = c.req.query("targetAddress")

      if (!amount || !targetNetwork || !targetAddress) {
        throw new Error("Missing required parameters: amount, network, targetAddress")
      }

      const resource = c.req.url as Resource
      return [
        createExactPaymentRequirements(
          `$${amount}`,
          env.X402_NETWORK,
          resource,
          wallet.account.address,
          `Bridge ${amount} USDC to ${targetAddress} on ${targetNetwork}`,
        ),
      ]
    },
    onVerified: async (c, _payment, _requirement) => {
      const amount = c.req.query("amount")!
      const targetNetwork = c.req.query("network")!
      const targetAddress = c.req.query("targetAddress")!

      console.log(`Payment verified for ${amount} USDC`)
      console.log(`Processing bridge to ${targetAddress} on ${targetNetwork}`)

      // 4.b. Swap USDC to ETH (mocked)
      console.log(`[MOCK] Swapping ${amount} USDC to ETH...`)
      await new Promise((resolve) => setTimeout(resolve, 100)) // Simulate async operation
      const ethAmount = parseFloat(amount) * 0.0003 // Mock conversion rate
      console.log(`[MOCK] Swapped to ${ethAmount} ETH`)

      // 4.c. Bridge ETH to target chain (mocked)
      console.log(`[MOCK] Bridging ${ethAmount} ETH to ${targetNetwork}...`)
      await new Promise((resolve) => setTimeout(resolve, 100))
      console.log(`[MOCK] Bridge initiated`)

      // 4.d. Transfer ETH to target address (mocked)
      console.log(`[MOCK] Transferring ${ethAmount} ETH to ${targetAddress} on ${targetNetwork}...`)
      await new Promise((resolve) => setTimeout(resolve, 100))
      console.log(`[MOCK] Transfer complete`)
    },
    onSettle: async (c, _payment, _requirement, settlement) => {
      const amount = c.req.query("amount")!
      const targetNetwork = c.req.query("network")!
      const targetAddress = c.req.query("targetAddress")!

      console.log(`Payment settled - Transaction: ${settlement.transactionHash}`)
      console.log(`Payer: ${settlement.payer}`)
      console.log(`Bridge to ${targetAddress} on ${targetNetwork} completed for ${amount} USDC`)

      // Return response to user
      return c.json({
        message: "Bridge operation completed",
        amount,
        targetAddress,
        targetNetwork,
        settlementTx: settlement.transactionHash,
        payer: settlement.payer,
        status: "success",
      })
    },
  }),
)

const server = serve({
  fetch: app.fetch,
  port: env.API_PORT,
})

server.once("listening", () => {
  console.log("api initialized and running on", env.API_PORT)
})

process.on("SIGINT", () => {
  server.close()
  process.exit(0)
})

process.on("SIGTERM", () => {
  server.close((err) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    process.exit(0)
  })
})
