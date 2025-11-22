import { serve } from "@hono/node-server"
import { Env, Hono } from "hono"
import { contextStorage } from "hono/context-storage"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { prettyJSON } from "hono/pretty-json"
import { requestId } from "hono/request-id"
import { secureHeaders } from "hono/secure-headers"
import { formatEther } from "viem"

import { env } from "./env/server.ts"
import { createPumpPaymentRequirements, createPumpResponse, processPumpPayment } from "./pump.ts"
import { getWallet } from "./wallet.ts"
import { x402Middleware } from "./x402.ts"

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

app.post(
  "/api/pump",
  x402Middleware({
    paymentRequirements: (c) => createPumpPaymentRequirements(c, wallet.account.address, env.X402_NETWORK),
    onVerified: processPumpPayment,
    onSettle: createPumpResponse,
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
