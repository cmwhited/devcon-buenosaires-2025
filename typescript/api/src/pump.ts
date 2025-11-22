import { Context } from "hono"
import type { Network, PaymentPayload, PaymentRequirements, Resource } from "x402/types"

import { createExactPaymentRequirements } from "./x402.ts"

interface PumpRequest {
  amount: string
  network: string
  targetAddress: string
}

async function extractPumpParams(c: Context): Promise<PumpRequest> {
  const body = await c.req.json<Partial<PumpRequest>>()

  const { amount, network, targetAddress } = body

  if (!amount || !network || !targetAddress) {
    throw new Error("Missing required parameters: amount, network, targetAddress")
  }

  return {
    amount,
    network,
    targetAddress,
  }
}

export async function createPumpPaymentRequirements(
  c: Context,
  payToAddress: string,
  x402Network: string,
): Promise<PaymentRequirements[]> {
  const { amount, network, targetAddress } = await extractPumpParams(c)

  const resource = c.req.url as Resource
  return [
    createExactPaymentRequirements(
      `$${amount}`,
      x402Network as Network,
      resource,
      payToAddress,
      `Bridge ${amount} USDC to ${targetAddress} on ${network}`,
    ),
  ]
}

export async function processPumpPayment(
  c: Context,
  _payment: PaymentPayload,
  _requirement: PaymentRequirements,
): Promise<void> {
  const { amount, network, targetAddress } = await extractPumpParams(c)

  console.log(`Payment verified for ${amount} USDC`)
  console.log(`Processing bridge to ${targetAddress} on ${network}`)

  // 4.b. Swap USDC to ETH (mocked)
  console.log(`[MOCK] Swapping ${amount} USDC to ETH...`)
  await new Promise((resolve) => setTimeout(resolve, 100)) // Simulate async operation
  const ethAmount = parseFloat(amount) * 0.0003 // Mock conversion rate
  console.log(`[MOCK] Swapped to ${ethAmount} ETH`)

  // 4.c. Bridge ETH to target chain (mocked)
  console.log(`[MOCK] Bridging ${ethAmount} ETH to ${network}...`)
  await new Promise((resolve) => setTimeout(resolve, 100))
  console.log(`[MOCK] Bridge initiated`)

  // 4.d. Transfer ETH to target address (mocked)
  console.log(`[MOCK] Transferring ${ethAmount} ETH to ${targetAddress} on ${network}...`)
  await new Promise((resolve) => setTimeout(resolve, 100))
  console.log(`[MOCK] Transfer complete`)
}

export async function createPumpResponse(
  c: Context,
  _payment: PaymentPayload,
  _requirement: PaymentRequirements,
  settlement: { transactionHash: string; payer: string },
) {
  const { amount, network, targetAddress } = await extractPumpParams(c)

  console.log(`Payment settled - Transaction: ${settlement.transactionHash}`)
  console.log(`Payer: ${settlement.payer}`)
  console.log(`Bridge to ${targetAddress} on ${network} completed for ${amount} USDC`)

  return c.json({
    message: "Bridge operation completed",
    amount,
    targetAddress,
    targetNetwork: network,
    settlementTx: settlement.transactionHash,
    payer: settlement.payer,
    status: "success",
  })
}
