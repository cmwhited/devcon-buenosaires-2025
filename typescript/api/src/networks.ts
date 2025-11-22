export const SUPPORTED_NETWORKS = ["base-sepolia", "sepolia", "polygon-amoy"] as const
export type SupportedNetwork = (typeof SUPPORTED_NETWORKS)[number]
