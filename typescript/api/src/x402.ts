import { Context, MiddlewareHandler } from "hono"
import { exact } from "x402/schemes"
import { findMatchingPaymentRequirements, processPriceToAtomicAmount } from "x402/shared"
import {
  type Network,
  type PaymentPayload,
  type PaymentRequirements,
  type Price,
  type Resource,
  settleResponseHeader,
} from "x402/types"
import { useFacilitator } from "x402/verify"

import { env } from "./env/server.ts"

const x402Version = 1
const { verify, settle } = useFacilitator({
  url: env.X402_FACILITATOR_URL as `${string}://${string}`,
})

export function createExactPaymentRequirements(
  price: Price,
  network: Network,
  resource: Resource,
  payTo: string,
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
    payTo,
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

  let verification
  try {
    verification = await verify(decodedPayment, selectedPaymentRequirement)
  } catch (error) {
    console.error("Facilitator verification failed:", error)
    verification = {
      isValid: false,
      invalidReason: error instanceof Error ? error.message : "Facilitator verification failed",
      payer: undefined,
    }
  }

  return {
    verification,
    selectedPaymentRequirement,
  }
}

export async function settlePayment(decodedPayment: PaymentPayload, paymentRequirement: PaymentRequirements) {
  return await settle(decodedPayment, paymentRequirement)
}

export interface X402MiddlewareConfig {
  paymentRequirements: PaymentRequirements[] | ((c: Context) => PaymentRequirements[] | Promise<PaymentRequirements[]>)
  onVerified?: (c: Context, payment: PaymentPayload, requirement: PaymentRequirements) => Promise<void>
  onSettle?: (
    c: Context,
    payment: PaymentPayload,
    requirement: PaymentRequirements,
    settlement: { transactionHash: string; payer: string },
  ) => Promise<void | Response>
}

export function x402Middleware(config: X402MiddlewareConfig): MiddlewareHandler {
  return async (c, next) => {
    const paymentRequirements =
      typeof config.paymentRequirements === "function" ? await config.paymentRequirements(c) : config.paymentRequirements

    // 1. Check for X-PAYMENT header
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

    // 2. Decode payment
    let decodedPayment: PaymentPayload
    try {
      decodedPayment = decodePayment(payment)
      console.log("Decoded payment:", JSON.stringify(decodedPayment, null, 2))
    } catch (error) {
      console.error("Payment decode error:", error)
      return c.json(
        {
          error: error instanceof Error ? error.message : "Invalid or malformed payment header",
          accepts: paymentRequirements,
          x402Version,
        },
        402,
      )
    }

    // 3. Verify payment
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

    // 4. Execute custom logic after verification (swap, bridge, transfer, etc.)
    if (config.onVerified) {
      try {
        await config.onVerified(c, decodedPayment, selectedPaymentRequirement)
      } catch (error) {
        return c.json(
          {
            error: error instanceof Error ? error.message : "Failed to process payment",
            accepts: paymentRequirements,
            x402Version,
          },
          500,
        )
      }
    }

    // 5. Settle payment
    try {
      const settlement = await settlePayment(decodedPayment, selectedPaymentRequirement)
      if (!settlement.success) {
        throw new Error(settlement.errorReason)
      }

      // 6. Set response header
      const responseHeader = settleResponseHeader(settlement)
      c.header("X-PAYMENT-RESPONSE", responseHeader)

      // 7. Execute custom logic after settlement
      if (config.onSettle) {
        const result = await config.onSettle(c, decodedPayment, selectedPaymentRequirement, {
          transactionHash: settlement.transaction,
          payer: settlement.payer ?? "unknown",
        })

        // If onSettle returned a response, we're done
        if (result) {
          return result
        }
      }

      // 8. Continue to route handler
      await next()
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
  }
}
