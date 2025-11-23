import { Context } from "hono"
import type { PaymentPayload, PaymentRequirements } from "x402/types"

import { calculatePumpPaymentRequirements, executePump, type PumpOperationData, type PumpParams, Wallets } from "./shared/index.ts"

async function extractPumpParams(c: Context): Promise<PumpParams> {
  const body = await c.req.json<Partial<PumpParams>>()

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

export { type PumpOperationData }

export async function createPumpPaymentRequirements(
  c: Context,
  payToAddress: string,
  x402Network: string,
): Promise<PaymentRequirements[]> {
  const params = await extractPumpParams(c)
  const resource = c.req.url
  return [calculatePumpPaymentRequirements(params, x402Network, payToAddress, resource)]
}

export function createProcessPumpPayment(x402Network: string, wallets: Wallets) {
  return async (c: Context, _payment: PaymentPayload, _requirement: PaymentRequirements): Promise<void> => {
    const params = await extractPumpParams(c)
    const operationData = await executePump(params, wallets, x402Network)
    c.set("pumpOperation", operationData)
  }
}

export async function createPumpResponse(
  c: Context,
  _payment: PaymentPayload,
  _requirement: PaymentRequirements,
  settlement: { transactionHash: string; payer: string },
) {
  // Retrieve operation data from context
  const operationData = c.get("pumpOperation") as PumpOperationData | undefined

  if (!operationData) {
    throw new Error("Operation data not found in context")
  }

  // Add settlement to operation data
  operationData.sourceAddress = settlement.payer
  operationData.transactions.settlement = {
    network: operationData.targetNetwork,
    hash: settlement.transactionHash,
    status: settlement.transactionHash ? "success" : "reverted",
  }

  return c.json({
    message: "Pump operation completed successfully",
    status: "success",
    ...operationData,
  })
}
