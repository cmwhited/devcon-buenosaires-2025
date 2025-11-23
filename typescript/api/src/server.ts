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
import {
  createProcessPumpPayment,
  createPumpPaymentRequirements,
  createPumpResponse,
  PumpOperationData,
} from "./pump.ts"
import { getSwapQuote, SwapQuoteRequest } from "./swap.ts"
import { logServerBoot } from "./utils.ts"
import { getWallets } from "./wallet.ts"
import { x402Middleware } from "./x402.ts"

interface ApiContext extends Env {
  Variables: {
    pumpOperation?: PumpOperationData
  }
}

logServerBoot()

const wallets = await getWallets()
console.log("server wallet balances:")
for (const [network, wallet] of Object.entries(wallets)) {
  console.log(`- [${network}] CDP account: ${wallet.account.address}, balance: ${formatEther(wallet.balance)} ETH`)
}
console.log("\n")

const x402PayToAddress = wallets["base-sepolia"].account.address

const app = new Hono<ApiContext>()
app.use(
  "*",
  cors({
    origin: "http://localhost:3000",
    exposeHeaders: ["X-PAYMENT-RESPONSE"],
  }),
)
app.use(logger())
app.use(prettyJSON())
app.use("*", requestId())
app.use(secureHeaders())
app.use(contextStorage())
app.get("/", (c) => c.json({ status: "OK" }))

app.post(
  "/api/pump",
  x402Middleware({
    paymentRequirements: (c) => createPumpPaymentRequirements(c, x402PayToAddress, env.X402_NETWORK),
    onVerified: createProcessPumpPayment(env.X402_NETWORK, wallets),
    onSettle: createPumpResponse,
  }),
)

app.post("/api/quote", async (c) => {
  try {
    const body = await c.req.json<SwapQuoteRequest>()
    console.log(body)
    const quote = await getSwapQuote(body)
    return c.json(quote)
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : "Unknown error" }, 400)
  }
})

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
