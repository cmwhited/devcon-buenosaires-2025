import { FastMCP } from "fastmcp"
import { withX402Payment } from "@edgeandnode/ampersend-sdk/mcp/server/fastmcp"
import { useFacilitator } from "x402/verify"
import { z } from "zod"

import {
  calculatePumpPaymentRequirements,
  executePump,
  getSwapQuote,
  getWallets,
  sharedEnv,
  type PumpParams,
  type SwapQuoteRequest,
} from "../shared/index.ts"
import { env } from "../env/server.ts"

const wallets = await getWallets()
const x402PayToAddress = wallets["base-sepolia"].account.address

export const server = new FastMCP({
  name: "Gas Station",
  version: "1.0.0",
})

// Tool 1: pump (with x402 payment)
server.addTool({
  name: "pump",
  description: "Pump gas to any chain - one-click gas refills across chains (requires USDC payment)",
  parameters: z.object({
    amount: z.string().describe("USDC amount to pump (e.g. '5.00')"),
    network: z.enum(["base-sepolia", "sepolia", "polygon-amoy"]).describe("Target network for gas refill"),
    targetAddress: z.string().describe("Target wallet address to receive gas (0x...)"),
  }),
  execute: withX402Payment({
    onExecute: async ({ args }) => {
      const resource = `http://localhost:${env.MCP_PORT}/mcp/pump`
      const requirements = calculatePumpPaymentRequirements(
        args as PumpParams,
        sharedEnv.X402_NETWORK,
        x402PayToAddress,
        resource,
      )

      // Log payment requirements being sent to client
      console.log(
        "[x402] Sending payment requirements:",
        JSON.stringify({
          network: requirements.network,
          maxAmount: requirements.maxAmountRequired,
          payTo: requirements.payTo,
          params: args,
        }),
      )

      return requirements
    },
    onPayment: async ({ payment, requirements }) => {
      // Log payment received from client
      console.log(
        "[x402] Received payment:",
        JSON.stringify({
          network: payment.network,
          // amount: payment.payment.value,
          // signer: payment.payment.from,
          requirementsMaxAmount: requirements.maxAmountRequired,
        }),
      )

      const facilitator = useFacilitator({
        url: sharedEnv.X402_FACILITATOR_URL as `${string}://${string}`,
      })

      // Step 1: Verify payment first
      console.log("[x402] Verifying payment...")
      const verification = await facilitator.verify(payment, requirements)
      if (!verification.isValid) {
        console.error("[x402] Payment verification failed:", verification.invalidReason)
        throw new Error(verification.invalidReason ?? "Payment verification failed")
      }
      console.log("[x402] Payment verified successfully")

      // Step 2: Settle only after successful verification
      console.log("[x402] Settling payment...")
      const settlement = await facilitator.settle(payment, requirements)
      if (!settlement.success) {
        console.error("[x402] Settlement failed:", settlement.errorReason)
        throw new Error(settlement.errorReason ?? "Settlement failed")
      }
      console.log("[x402] Payment settled successfully")

      return settlement
    },
  })(async (args) => {
    const result = await executePump(args as PumpParams, wallets, sharedEnv.X402_NETWORK)
    return JSON.stringify(result, null, 2)
  }),
})

// Tool 2: quote (free - no payment required)
server.addTool({
  name: "quote",
  description: "Get swap quote for ETH/USDC conversion (free, no payment required)",
  parameters: z.object({
    network: z.enum(["base-sepolia", "sepolia", "polygon-amoy"]).describe("Network for swap quote"),
    amountIn: z.string().describe("Amount of input token (e.g. '1.0' for 1 ETH)"),
    tokenIn: z.enum(["ETH", "USDC"]).describe("Input token"),
    tokenOut: z.enum(["ETH", "USDC"]).describe("Output token"),
  }),
  execute: async (args) => {
    const quote = await getSwapQuote(args as SwapQuoteRequest)
    return JSON.stringify(quote, null, 2)
  },
})

export async function start() {
  console.log(`\n🚀 Starting Gas Station MCP Server on port ${env.MCP_PORT}`)
  console.log(`📡 Connect with: http://localhost:${env.MCP_PORT}/mcp`)
  console.log(`\n`)

  await server.start({
    transportType: "httpStream",
    httpStream: {
      port: Number(env.MCP_PORT),
      endpoint: "/mcp",
    },
  })
}
