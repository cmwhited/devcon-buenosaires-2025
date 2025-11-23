import { createAdapterFromProvider } from "@circle-fin/adapter-viem-v2"
import { BridgeKit } from "@circle-fin/bridge-kit"
import { CdpClient } from "@coinbase/cdp-sdk"
import { createPublicClient, createWalletClient, http, parseUnits } from "viem"
import { toAccount } from "viem/accounts"
import { baseSepolia, polygonAmoy, sepolia } from "viem/chains"

import { env } from "./env/server.ts"
import { sharedEnv } from "./shared/env.ts"
import { executeUsdcToEthSwap } from "./shared/swap.ts"

// ============================================================================
// CONFIGURATION - Adjust these values as needed
// ============================================================================

const CONFIG = {
  // ETH balance threshold - bridge USDC if ETH balance falls below this
  ETH_BALANCE_THRESHOLD: parseUnits("0.01", 18),

  // Amount of USDC to bridge when refilling
  USDC_BRIDGE_AMOUNT: "20",

  // Minimum USDC balance on Polygon Amoy before we stop bridging
  MIN_POLYGON_USDC_BALANCE: parseUnits("50", 6),

  // USDC contract addresses
  USDC_ADDRESSES: {
    "polygon-amoy": "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582" as `0x${string}`,
    sepolia: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as `0x${string}`,
    "base-sepolia": "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as `0x${string}`,
  },

  // Circle BridgeKit chain names
  BRIDGE_CHAINS: {
    "polygon-amoy": "Polygon_Amoy_Testnet",
    sepolia: "Ethereum_Sepolia",
    "base-sepolia": "Base_Sepolia",
  },

  // RPC endpoints
  RPC_URLS: {
    "polygon-amoy": env.POLYGON_AMOY_RPC,
    sepolia: env.ETHEREUM_SEPOLIA_RPC,
    "base-sepolia": env.BASE_SEPOLIA_RPC,
  },
} as const

const CDP_ACCOUNT_NAME = "gas-station"
const CDP_ACCOUNT_IDEMPOTENCY_KEY = "a104a221-36a7-4e10-95fb-05580a24cb76"

// ERC20 ABI for balanceOf
const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const

// ============================================================================
// TYPES
// ============================================================================

type DestinationChain = "sepolia" | "base-sepolia"

interface BalanceCheckResult {
  chain: DestinationChain
  ethBalance: bigint
  needsRefill: boolean
}

// ============================================================================
// CDP WALLET SETUP
// ============================================================================

let cachedCdpAccount: any = null

async function getCdpAccount() {
  if (cachedCdpAccount) return cachedCdpAccount

  const cdp = new CdpClient({
    apiKeyId: sharedEnv.CDP_API_KEY_ID,
    apiKeySecret: sharedEnv.CDP_API_KEY_SECRET,
    walletSecret: sharedEnv.CDP_WALLET_SECRET,
  })

  // Try to get existing account first, only create if it doesn't exist
  let account = await cdp.evm.getAccount({
    name: CDP_ACCOUNT_NAME,
  })

  if (account == null) {
    account = await cdp.evm.createAccount({
      name: CDP_ACCOUNT_NAME,
      idempotencyKey: CDP_ACCOUNT_IDEMPOTENCY_KEY,
    })
  }

  cachedCdpAccount = account
  return cachedCdpAccount
}

// ============================================================================
// BALANCE CHECKING
// ============================================================================

async function checkEthBalance(chain: DestinationChain, address: `0x${string}`): Promise<BalanceCheckResult> {
  const chainConfig = chain === "sepolia" ? sepolia : baseSepolia
  const rpcUrl = CONFIG.RPC_URLS[chain]

  const publicClient = createPublicClient({
    chain: chainConfig,
    transport: http(rpcUrl),
  })

  try {
    const balance = await publicClient.getBalance({ address })
    const needsRefill = balance < CONFIG.ETH_BALANCE_THRESHOLD

    console.log(`[GAS-STATION] ${chain} ETH balance: ${balance} wei (needs refill: ${needsRefill})`)

    return {
      chain,
      ethBalance: balance,
      needsRefill,
    }
  } catch (error) {
    console.error(`[GAS-STATION] Failed to check ${chain} balance:`, error)
    return {
      chain,
      ethBalance: 0n,
      needsRefill: false, // Don't refill if we can't check balance
    }
  }
}

async function checkPolygonUsdcBalance(address: `0x${string}`): Promise<bigint> {
  const publicClient = createPublicClient({
    chain: polygonAmoy,
    transport: http(CONFIG.RPC_URLS["polygon-amoy"]),
  })

  try {
    const balance = (await publicClient.readContract({
      address: CONFIG.USDC_ADDRESSES["polygon-amoy"],
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [address],
    })) as bigint

    console.log(`[GAS-STATION] Polygon Amoy USDC balance: ${balance} (${Number(balance) / 1e6} USDC)`)

    return balance
  } catch (error) {
    console.error("[GAS-STATION] Failed to check Polygon USDC balance:", error)
    return 0n
  }
}

// ============================================================================
// BRIDGING
// ============================================================================

async function executeBridge(toChain: DestinationChain, amount: string): Promise<void> {
  console.log(`[GAS-STATION] Starting bridge: ${amount} USDC from Polygon Amoy to ${toChain}`)

  const cdpAccount = await getCdpAccount()
  const account = toAccount(cdpAccount)

  // Helper to create a provider bound to a specific chain
  const makeBoundProvider = (chain: any, rpcUrl: string) => {
    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(rpcUrl, {
        retryCount: 3,
        timeout: 10000,
      }),
    })

    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl, {
        retryCount: 3,
        timeout: 10000,
      }),
    })

    return {
      request: async ({ method, params }: { method: string; params?: Array<any> }) => {
        if (method === "eth_accounts" || method === "eth_requestAccounts") {
          return [account.address]
        }

        if (method === "eth_chainId") {
          return `0x${chain.id.toString(16)}`
        }

        if (method === "wallet_addEthereumChain") {
          return null
        }

        if (method === "wallet_switchEthereumChain") {
          throw new Error(`Provider is chain-bound to ${chain.name}`)
        }

        if (method === "eth_sendTransaction") {
          const [txRequest] = params || []

          // Explicitly map fields with proper type conversion
          const hash = await walletClient.sendTransaction(txRequest)

          return hash
        }

        if (method === "eth_sendRawTransaction") {
          return walletClient.request({ method: method as any, params: params as any })
        }

        const signingMethods = new Set([
          "eth_sign",
          "personal_sign",
          "eth_signTypedData",
          "eth_signTypedData_v4",
          "eth_signTransaction",
        ])
        if (signingMethods.has(method)) {
          return walletClient.request({ method: method as any, params: params as any })
        }

        return publicClient.request({ method: method as any, params: params as any })
      },
    }
  }

  // Create two separate chain-bound providers
  const amoyProvider = makeBoundProvider(polygonAmoy, CONFIG.RPC_URLS["polygon-amoy"])

  const destChainConfig = toChain === "sepolia" ? sepolia : baseSepolia
  const destProvider = makeBoundProvider(destChainConfig, CONFIG.RPC_URLS[toChain])

  // Create separate adapters for source and destination
  const fromAdapter = await createAdapterFromProvider({ provider: amoyProvider as any })
  const toAdapter = await createAdapterFromProvider({ provider: destProvider as any })

  const kit = new BridgeKit()

  try {
    const result = await kit.bridge({
      from: { adapter: fromAdapter, chain: CONFIG.BRIDGE_CHAINS["polygon-amoy"] },
      to: { adapter: toAdapter, chain: CONFIG.BRIDGE_CHAINS[toChain] },
      amount,
    })

    console.log(
      `[GAS-STATION] Bridge result:`,
      JSON.stringify(result, (_, v) => (typeof v === "bigint" ? v.toString() : v), 2),
    )

    if (result.state === "success") {
      console.log(`[GAS-STATION] ✅ Successfully bridged ${amount} USDC to ${toChain}`)

      // After successful bridge, swap USDC to ETH
      try {
        console.log(`[GAS-STATION] Swapping ${amount} USDC to ETH on ${toChain}...`)
        const swapResult = await executeUsdcToEthSwap(toChain, cdpAccount, amount)

        if (swapResult.success) {
          console.log(`[GAS-STATION] ✅ Swap successful: ${swapResult.txHash}`)
        } else {
          console.error(`[GAS-STATION] ❌ Swap failed: ${swapResult.error}`)
        }
      } catch (swapError) {
        console.error(`[GAS-STATION] Swap execution failed:`, swapError)
        // Don't throw - USDC is bridged but not swapped, can be done manually
      }
    } else {
      console.error(`[GAS-STATION] ❌ Bridge failed with state: ${result.state}`)
    }
  } catch (error) {
    console.error(`[GAS-STATION] Bridge execution failed:`, error)
    throw error
  }
}

// ============================================================================
// MAIN GAS STATION LOGIC
// ============================================================================

export async function runGasStationCheck(): Promise<void> {
  console.log("[GAS-STATION] Starting gas station check...")

  try {
    // 1. Get CDP account address
    const cdpAccount = await getCdpAccount()
    const account = toAccount(cdpAccount)
    const walletAddress = account.address

    console.log(`[GAS-STATION] Using wallet address: ${walletAddress}`)

    // 2. Check Polygon Amoy USDC balance first
    const polygonUsdcBalance = await checkPolygonUsdcBalance(walletAddress)

    if (polygonUsdcBalance < CONFIG.MIN_POLYGON_USDC_BALANCE) {
      console.warn(
        `[GAS-STATION] ⚠️ Polygon USDC balance too low (${Number(polygonUsdcBalance) / 1e6} USDC < ${Number(CONFIG.MIN_POLYGON_USDC_BALANCE) / 1e6} USDC). Skipping bridging.`,
      )
      return
    }

    // 3. Check ETH balances on destination chains
    const balanceChecks = await Promise.all([
      checkEthBalance("sepolia", walletAddress),
      checkEthBalance("base-sepolia", walletAddress),
    ])

    // 4. Bridge to chains that need refills
    for (const check of balanceChecks) {
      if (check.needsRefill) {
        console.log(`[GAS-STATION] 🔄 ${check.chain} needs refill, bridging ${CONFIG.USDC_BRIDGE_AMOUNT} USDC...`)

        try {
          await executeBridge(check.chain, CONFIG.USDC_BRIDGE_AMOUNT)
        } catch (error) {
          console.error(`[GAS-STATION] Failed to bridge to ${check.chain}:`, error)
          // Continue with other chains even if one fails
        }
      } else {
        console.log(`[GAS-STATION] ✅ ${check.chain} balance sufficient, no refill needed`)
      }
    }

    console.log("[GAS-STATION] Gas station check completed")
  } catch (error) {
    console.error("[GAS-STATION] Gas station check failed:", error)
    throw error
  }
}
