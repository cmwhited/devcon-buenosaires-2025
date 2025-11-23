import { parseEther } from "viem"
import type { Network, PaymentRequirements, Resource } from "x402/types"

import { SupportedNetwork } from "./networks.ts"
import { getSwapQuote } from "./swap.ts"
import type { PumpOperationData, PumpParams } from "./types.ts"
import { sendEth, Wallets } from "./wallet.ts"
import { createExactPaymentRequirements } from "./x402.ts"


export function calculatePumpPaymentRequirements(
  params: PumpParams,
  x402Network: string,
  payToAddress: string,
  resource: string,
): PaymentRequirements {
  const { amount, network, targetAddress } = params

  return createExactPaymentRequirements(
    `$${amount}`,
    x402Network as Network,
    resource as Resource,
    payToAddress,
    `Pump ${amount} USDC to ${targetAddress} on ${network}`,
  )
}

export async function executePump(
  params: PumpParams,
  wallets: Wallets,
  x402Network: string,
): Promise<PumpOperationData> {
  const { amount, network, targetAddress, amountEth } = params

  const quote = await getSwapQuote({
    network: network as SupportedNetwork,
    amountIn: amount,
    tokenIn: "USDC",
    tokenOut: "ETH",
  })

  // check quote and amount eth are within an accepted slippage
  const slippage = 0.01
  const minAmountOut = parseFloat(quote.amountOut) * (1 - slippage)
  if (parseFloat(amountEth) < minAmountOut) {
    throw new Error("Amount eth is less than the minimum amount out")
  }

  const ethAmount = parseFloat(amountEth)

  // 3. Transfer ETH to target address (REAL)
  const targetNetwork = network as SupportedNetwork
  const wallet = wallets[targetNetwork]

  if (!wallet) {
    throw new Error(`Wallet not found for network: ${targetNetwork}`)
  }

  const ethAmountWei = parseEther(ethAmount.toString())
  console.log(`Transferring ${ethAmount} ETH to ${targetAddress} on ${targetNetwork}...`)
  const txTransferReceipt = await sendEth(wallet.account, targetNetwork, targetAddress as `0x${string}`, ethAmountWei)
  console.log(`Transfer complete! Transaction hash: ${txTransferReceipt.transactionHash}`)

  // Return operation data
  return {
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
}
