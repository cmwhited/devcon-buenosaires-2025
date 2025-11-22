import { Chain, createPublicClient, http, PublicClient } from "viem";
import { baseSepolia, sepolia } from "viem/chains";

import { SupportedNetwork } from "./networks.ts";

function getChain(network: SupportedNetwork): Chain {
    switch (network) {
        case "base-sepolia":
            return baseSepolia;
        case "sepolia":
            return sepolia;
        default:
            throw new Error(`Unsupported network: ${network}`);
    }
}

export function getRpcClient(network: SupportedNetwork): PublicClient {
    return createPublicClient({ chain: getChain(network), transport: http() });
}


