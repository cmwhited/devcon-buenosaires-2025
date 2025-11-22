import { Context } from "hono"
import { parseEther } from "viem"
import type { Network, PaymentPayload, PaymentRequirements, Resource } from "x402/types"

import { SupportedNetwork } from "./networks.ts"
import { logPumpOperation } from "./utils.ts"
import { sendEth, Wallets } from "./wallet.ts"
import { createExactPaymentRequirements } from "./x402.ts"

interface PumpRequest {
  amount: string
  network: string
  targetAddress: string
}

export interface PumpOperationData {
  sourceAddress?: string
  sourceNetwork: string
  targetAddress: string
  targetNetwork: string
  usdcAmount: string
  ethAmount: number
  transactions: {
    swap: { network: string; hash: string; status: string }
    bridge: { network: string; hash: string; status: string }
    transfer: { network: string; hash: string; status: string }
    settlement?: { network: string; hash: string; status: string }
  }
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
      `Pump ${amount} USDC to ${targetAddress} on ${network}`,
    ),
  ]
}

export function createProcessPumpPayment(x402Network: string, wallets: Wallets) {
  return async (c: Context, _payment: PaymentPayload, _requirement: PaymentRequirements): Promise<void> => {
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

    // 4.d. Transfer ETH to target address (REAL)
    const targetNetwork = network as SupportedNetwork
    const wallet = wallets[targetNetwork]

    if (!wallet) {
      throw new Error(`Wallet not found for network: ${targetNetwork}`)
    }

    const ethAmountWei = parseEther(ethAmount.toString())
    console.log(`Transferring ${ethAmount} ETH to ${targetAddress} on ${targetNetwork}...`)
    const txTransferReceipt = await sendEth(wallet.account, targetNetwork, targetAddress as `0x${string}`, ethAmountWei)
    console.log(`Transfer complete! Transaction hash: ${txTransferReceipt.transactionHash}`)

    // Store operation data in context for later retrieval
    const operationData: PumpOperationData = {
      sourceNetwork: x402Network,
      usdcAmount: amount,
      ethAmount,
      targetAddress,
      targetNetwork,
      transactions: {
        swap: {
          network: x402Network,
          hash: "0xMOCKED_SWAP_TX",
          status: "mocked",
        },
        bridge: {
          network: x402Network,
          hash: "0xMOCKED_BRIDGE_TX",
          status: "mocked",
        },
        transfer: {
          network: targetNetwork,
          hash: txTransferReceipt.transactionHash,
          status: txTransferReceipt.status,
        },
      },
    }

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

  logPumpOperation(operationData)

  return c.json({
    message: "Bridge operation completed successfully",
    status: "success",
    ...operationData,
  })
}
