export const SUPPORTED_NETWORKS = ["base-sepolia", "sepolia"] as const
export type SupportedNetwork = (typeof SUPPORTED_NETWORKS)[number]
