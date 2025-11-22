import { exact } from "x402/schemes"
import { findMatchingPaymentRequirements, processPriceToAtomicAmount } from "x402/shared"
import type { Network, PaymentPayload, PaymentRequirements, Price, Resource } from "x402/types"
import { useFacilitator } from "x402/verify"

import { env } from "./env/server.ts"

const { verify, settle } = useFacilitator({
  url: env.X402_FACILITATOR_URL as `${string}://${string}`,
})

export const x402Version = 1

export function createExactPaymentRequirements(
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

  if (!("eip712" in asset)) {
    throw new Error("Asset does not have EIP-712 information")
  }

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

export function decodePayment(paymentHeader: string): PaymentPayload {
  const decodedPayment = exact.evm.decodePayment(paymentHeader)
  decodedPayment.x402Version = x402Version
  return decodedPayment
}

export async function verifyPayment(decodedPayment: PaymentPayload, paymentRequirements: PaymentRequirements[]) {
  const selectedPaymentRequirement =
    findMatchingPaymentRequirements(paymentRequirements, decodedPayment) || paymentRequirements[0]

  const verification = await verify(decodedPayment, selectedPaymentRequirement)
  return {
    verification,
    selectedPaymentRequirement,
  }
}

export async function settlePayment(decodedPayment: PaymentPayload, paymentRequirement: PaymentRequirements) {
  return await settle(decodedPayment, paymentRequirement)
}
