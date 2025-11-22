import { serve } from "@hono/node-server"
import { AuthTokenClaims } from "@privy-io/server-auth"
import { Env, Hono } from "hono"
import { bearerAuth } from "hono/bearer-auth"
import { contextStorage, getContext } from "hono/context-storage"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { prettyJSON } from "hono/pretty-json"
import { requestId } from "hono/request-id"
import { secureHeaders } from "hono/secure-headers"
import { formatEther } from "viem"
import { type Resource, settleResponseHeader } from "x402/types"

import { authClient } from "./auth.ts"
import { env } from "./env/server.ts"
import { getWallet } from "./wallet.ts"
import { createExactPaymentRequirements, decodePayment, settlePayment, verifyPayment, x402Version } from "./x402.ts"

interface ApiContext extends Env {
  Variables: {
    claims: AuthTokenClaims | null
    user: string | null
  }
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

app.get("/api/hello", async (c) => {
  // 1. Generate random price between $0.001 and $0.005
  const randomPrice = (Math.random() * (0.005 - 0.001) + 0.001).toFixed(3)

  // 2. Create payment requirements
  const resource = c.req.url as Resource
  const paymentRequirements = [
    createExactPaymentRequirements(`$${randomPrice}`, env.X402_NETWORK, resource, "Access to hello world endpoint"),
  ]

  // 3. Check for X-PAYMENT header
  const payment = c.req.header("X-PAYMENT")
  if (!payment) {
    return c.json(
      {
        error: "X-PAYMENT header is required",
        accepts: paymentRequirements,
        x402Version,
      },
      402,
    )
  }

  // 4. Decode payment
  let decodedPayment
  try {
    decodedPayment = decodePayment(payment)
  } catch (error) {
    return c.json(
      {
        error: error instanceof Error ? error.message : "Invalid or malformed payment header",
        accepts: paymentRequirements,
        x402Version,
      },
      402,
    )
  }

  // 5. Verify payment
  const { verification, selectedPaymentRequirement } = await verifyPayment(decodedPayment, paymentRequirements)
  if (!verification.isValid) {
    return c.json(
      {
        error: verification.invalidReason ?? "Could not determine invalid reason",
        accepts: paymentRequirements,
        payer: verification.payer,
        x402Version,
      },
      402,
    )
  }

  // 6. Settle payment
  try {
    const settlement = await settlePayment(decodedPayment, selectedPaymentRequirement)
    if (!settlement.success) {
      throw new Error(settlement.errorReason)
    }

    // 7. Set response header
    const responseHeader = settleResponseHeader(settlement)
    c.header("X-PAYMENT-RESPONSE", responseHeader)

    // 8. Return success
    return c.json({ message: "hello world" })
  } catch (error) {
    return c.json(
      {
        error: error instanceof Error ? error.message : "Failed to settle payment",
        accepts: paymentRequirements,
        x402Version,
      },
      402,
    )
  }
})

const server = serve({
  fetch: app.fetch,
  port: env.API_PORT,
})

server.once("listening", () => {
  console.log("api initialized and running on", env.API_PORT)
})

// graceful shutdown
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
