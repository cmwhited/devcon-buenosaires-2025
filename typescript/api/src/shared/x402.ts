import { processPriceToAtomicAmount } from "x402/shared"
import { type Network, type PaymentRequirements, type Price, type Resource } from "x402/types"

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
