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
import { exact } from "x402/schemes"
import { findMatchingPaymentRequirements, processPriceToAtomicAmount } from "x402/shared"
import type { Network, PaymentPayload, PaymentRequirements, Price, Resource } from "x402/types"
import { settleResponseHeader } from "x402/types"
import { useFacilitator } from "x402/verify"

import { authClient } from "./auth.ts"
import { env } from "./env/server.ts"

interface ApiContext extends Env {
  Variables: {
    claims: AuthTokenClaims | null
    user: string | null
  }
}

const app = new Hono<ApiContext>()

// Initialize x402 facilitator
const { verify, settle } = useFacilitator({
  url: "https://x402-amoy.polygon.technology",
})
const x402Version = 1

// Helper function to create payment requirements
function createExactPaymentRequirements(
  price: Price,
  network: Network,
  resource: Resource,
  description = "",
): PaymentRequirements {
  const atomicAmountForAsset = processPriceToAtomicAmount(price, network)
  if ("error" in atomicAmountForAsset) {
    throw new Error(atomicAmountForAsset.error)
  }
  const { maxAmountRequired, asset } = atomicAmountForAsset

  return {
    scheme: "exact",
    network,
    maxAmountRequired,
    resource,
    description,
    mimeType: "application/json",
    payTo: env.X402_PAY_TO_ADDRESS,
    maxTimeoutSeconds: 60,
    asset: asset.address,
    outputSchema: undefined,
    extra: {
      name: asset.eip712.name,
      version: asset.eip712.version,
    },
  }
}

app.use(logger())
app.use(prettyJSON())
app.use("*", requestId()) // applies a request id to all downstream requests
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
  "/api/protected",
  bearerAuth({
    async verifyToken(token, c) {
      return await authClient
        .verifyAuthTokenAndFetchUser(token)
        .then(({ claims, user }) => {
          // set claims on request context
          c.set("claims", claims)
          c.set("user", authClient.fetchUserAddress(user))

          return true
        })
        .catch((err) => {
          console.warn("failure verifying auth bearer token", err)
          return false
        })
    },
  }),
  (c) => {
    const user = getContext<ApiContext>().var.user

    return c.json({ protected: "SAFE", user })
  },
)

// x402-protected route with dynamic pricing - requires payment
app.get("/api/hello", async (c) => {
  // 1. Generate random price between $0.001 and $0.005
  const randomPrice = (Math.random() * (0.005 - 0.001) + 0.001).toFixed(3)

  // 2. Create payment requirements
  const resource = c.req.url as Resource
  const paymentRequirements = [
    createExactPaymentRequirements(
      `$${randomPrice}`,
      env.X402_NETWORK,
      resource,
      "Access to hello world endpoint",
    ),
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
  let decodedPayment: PaymentPayload
  try {
    decodedPayment = exact.evm.decodePayment(payment)
    decodedPayment.x402Version = x402Version
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
  const selectedPaymentRequirement =
    findMatchingPaymentRequirements(paymentRequirements, decodedPayment) ||
    paymentRequirements[0]

  const verification = await verify(decodedPayment, selectedPaymentRequirement)
  if (!verification.isValid) {
    return c.json(
      {
        error: verification.invalidReason,
        accepts: paymentRequirements,
        payer: verification.payer,
        x402Version,
      },
      402,
    )
  }

  // 6. Settle payment
  try {
    const settlement = await settle(decodedPayment, selectedPaymentRequirement)
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
