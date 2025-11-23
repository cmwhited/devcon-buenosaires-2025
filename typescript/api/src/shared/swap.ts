import { ChainId, Token } from "@uniswap/sdk-core"
import { Actions, V4Planner } from "@uniswap/v4-sdk"
import { RoutePlanner, CommandType } from "@uniswap/universal-router-sdk"
import { Contract, formatUnits, JsonRpcProvider, parseUnits } from "ethers"
import { parseUnits as viemParseUnits, createWalletClient, http } from "viem"
import { sepolia, baseSepolia } from "viem/chains"
import { toAccount } from "viem/accounts"

import { SupportedNetwork } from "./networks.ts"
import { getRpcClient } from "./rpc.ts"

const QUOTER_ABI = [
  {
    inputs: [
      {
        components: [
          {
            components: [
              { internalType: "Currency", name: "currency0", type: "address" },
              { internalType: "Currency", name: "currency1", type: "address" },
              { internalType: "uint24", name: "fee", type: "uint24" },
              { internalType: "int24", name: "tickSpacing", type: "int24" },
              { internalType: "contract IHooks", name: "hooks", type: "address" },
            ],
            internalType: "struct PoolKey",
            name: "poolKey",
            type: "tuple",
          },
          { internalType: "bool", name: "zeroForOne", type: "bool" },
          { internalType: "uint128", name: "exactAmount", type: "uint128" },
          { internalType: "bytes", name: "hookData", type: "bytes" },
        ],
        internalType: "struct IV4Quoter.QuoteExactSingleParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "quoteExactInputSingle",
    outputs: [
      { internalType: "uint256", name: "amountOut", type: "uint256" },
      { internalType: "uint256", name: "gasEstimate", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
]

export interface SwapQuoteRequest {
  network: SupportedNetwork
  amountIn: string // Amount in human-readable format (e.g., "1" for 1 ETH)
  tokenIn: "ETH" | "USDC"
  tokenOut: "ETH" | "USDC"
}

interface SwapQuoteResponse {
  amountIn: string
  amountOut: string
  tokenIn: string
  tokenOut: string
  rate: string
  fee: number
  tickSpacing: number
}

interface PoolConfig {
  fee: number
  tickSpacing: number
}

// Common Uniswap V4 fee tiers
const COMMON_POOL_CONFIGS: PoolConfig[] = [
  { fee: 100, tickSpacing: 1 }, // 0.01% - stablecoins
  { fee: 500, tickSpacing: 10 }, // 0.05% - common pairs
  { fee: 3000, tickSpacing: 60 }, // 0.3% - most liquid for ETH pairs
  { fee: 10000, tickSpacing: 200 }, // 1% - exotic pairs
]

export async function getSwapQuote(request: SwapQuoteRequest): Promise<SwapQuoteResponse> {
  if (request.network !== "sepolia" && request.network !== "base-sepolia") {
    // TODO: remove this mocking once we have proper liquidity in other pools
    return getMockQuote(request.tokenIn, request.tokenOut, request.amountIn)
  }

  const { quoter: QUOTER_ADDRESS, usdc: USDC_TOKEN, eth: ETH_TOKEN } = getUniswapContext(request.network)

  const publicClient = getRpcClient(request.network)
  const quoterContract = new Contract(QUOTER_ADDRESS, QUOTER_ABI, new JsonRpcProvider(publicClient.chain?.rpcUrls.default.http[0]))

  const { amountIn, tokenIn, tokenOut } = request

  if (tokenIn === tokenOut) {
    throw new Error("tokenIn and tokenOut must be different")
  }

  if ((tokenIn !== "ETH" && tokenIn !== "USDC") || (tokenOut !== "ETH" && tokenOut !== "USDC")) {
    throw new Error("Only ETH and USDC tokens are supported")
  }

  // Currencies must be in sorted order (ETH < USDC by address)
  // zeroForOne = true means ETH -> USDC, false means USDC -> ETH
  const zeroForOne = tokenIn === "ETH"
  const inputToken = tokenIn === "ETH" ? ETH_TOKEN : USDC_TOKEN
  const outputToken = tokenOut === "ETH" ? ETH_TOKEN : USDC_TOKEN
  const amountInWei = parseUnits(amountIn, inputToken.decimals).toString()

  // Try all pool configs in parallel
  const quotePromises = COMMON_POOL_CONFIGS.map((config) =>
    tryGetQuote(config, quoterContract, zeroForOne, amountInWei, ETH_TOKEN, USDC_TOKEN, inputToken),
  )

  const quotes = await Promise.all(quotePromises)
  const validQuotes = quotes.filter((q) => q !== null)

  if (validQuotes.length === 0) {
    // TODO: remove this mocking once we have proper liquidity in the pools
    return getMockQuote(tokenIn, tokenOut, amountIn)
  }

  // Pick the quote with the best rate for the user
  const bestQuote = validQuotes.reduce((best, current) => (current.amountOut > best.amountOut ? current : best))

  const amountOutFormatted = formatUnits(bestQuote.amountOut, outputToken.decimals)
  const rate = (parseFloat(amountOutFormatted) / parseFloat(amountIn)).toString()

  console.log(
    `Best quote: fee=${bestQuote.config.fee} (${bestQuote.config.fee / 10000}%), tickSpacing=${bestQuote.config.tickSpacing}`,
  )

  return {
    amountIn,
    amountOut: amountOutFormatted,
    tokenIn,
    tokenOut,
    rate,
    fee: bestQuote.config.fee,
    tickSpacing: bestQuote.config.tickSpacing,
  }
}

async function tryGetQuote(
  poolConfig: PoolConfig,
  quoterContract: Contract,
  zeroForOne: boolean,
  amountInWei: string,
  ethToken: Token,
  usdcToken: Token,
  inputToken: Token,
): Promise<{ amountOut: bigint; config: PoolConfig } | null> {
  try {
    // Always use sorted order: ETH (0x0000...) as currency0, USDC as currency1
    const quotedAmountOut = await quoterContract.quoteExactInputSingle.staticCall({
      poolKey: {
        currency0: ethToken.address,
        currency1: usdcToken.address,
        fee: poolConfig.fee,
        tickSpacing: poolConfig.tickSpacing,
        hooks: "0x0000000000000000000000000000000000000000",
      },
      zeroForOne,
      exactAmount: amountInWei,
      hookData: "0x00",
    })

    return {
      amountOut: quotedAmountOut.amountOut,
      config: poolConfig,
    }
  } catch (error) {
    // Pool doesn't exist or has no liquidity, go to next pool config
    return null
  }
}

function getMockQuote(tokenIn: "ETH" | "USDC", tokenOut: "ETH" | "USDC", amountIn: string): SwapQuoteResponse {
  const mockRate = tokenIn === "ETH" ? 3333.33 : 0.0003 // ETH -> USDC or USDC -> ETH
  const amountOutMock = (parseFloat(amountIn) * mockRate).toString()
  return {
    amountIn,
    amountOut: amountOutMock,
    tokenIn,
    tokenOut,
    rate: mockRate.toString(),
    fee: 500,
    tickSpacing: 10,
  }
}

function getUniswapContext(network: SupportedNetwork): { quoter: string; usdc: Token; eth: Token } {
  switch (network) {
    case "sepolia":
      return {
        quoter: "0x61b3f2011a92d183c7dbadbda940a7555ccf9227",
        usdc: new Token(ChainId.SEPOLIA, "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", 6, "USDC", "USDC"),
        eth: new Token(ChainId.SEPOLIA, "0x0000000000000000000000000000000000000000", 18, "ETH", "Ether"),
      }
    case "base-sepolia":
      return {
        quoter: "0x4a6513c898fe1b2d0e78d3b0e0a4a151589b1cba",
        usdc: new Token(ChainId.BASE_SEPOLIA, "0x036CbD53842c5426634e7929541eC2318f3dCF7e", 6, "USDC", "USDC"),
        eth: new Token(ChainId.BASE_SEPOLIA, "0x0000000000000000000000000000000000000000", 18, "ETH", "Ether"),
      }
    default:
      throw new Error(`Unsupported network: ${network}`)
  }
}

// ============================================================================
// SWAP EXECUTION
// ============================================================================

const UNISWAP_V4_CONFIG = {
  sepolia: {
    universalRouter: "0x3A9D48AB9751398BbFa63ad67599Bb04e4BdF98b" as `0x${string}`,
    permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3" as `0x${string}`,
    usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as `0x${string}`,
    chain: sepolia,
  },
  "base-sepolia": {
    universalRouter: "0x492e6456d9528771018deb9e87ef7750ef184104" as `0x${string}`,
    permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3" as `0x${string}`,
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as `0x${string}`,
    chain: baseSepolia,
  },
} as const

const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const

const PERMIT2_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "spender", type: "address" },
      { name: "amount", type: "uint160" },
      { name: "expiration", type: "uint48" },
    ],
    outputs: [],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "token", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [
      { name: "amount", type: "uint160" },
      { name: "expiration", type: "uint48" },
      { name: "nonce", type: "uint48" },
    ],
  },
] as const

const UNIVERSAL_ROUTER_ABI = [
  {
    name: "execute",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "commands", type: "bytes" },
      { name: "inputs", type: "bytes[]" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bytes[]" }],
  },
] as const

const SLIPPAGE_TOLERANCE = 0.005 // 0.5%

type SwapNetwork = "sepolia" | "base-sepolia"

export interface SwapResult {
  success: boolean
  txHash?: string
  amountIn: string
  expectedAmountOut: string
  error?: string
}

async function ensureUsdcApprovalForPermit2(
  network: SwapNetwork,
  cdpAccount: any,
  amount: bigint,
): Promise<void> {
  const config = UNISWAP_V4_CONFIG[network]
  const account = toAccount(cdpAccount)
  const publicClient = getRpcClient(network)

  const walletClient = createWalletClient({
    account,
    chain: config.chain,
    transport: http(),
  })

  const currentAllowance = await publicClient.readContract({
    address: config.usdc,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [account.address, config.permit2],
  })

  if (currentAllowance < amount) {
    const hash = await walletClient.writeContract({
      address: config.usdc,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [config.permit2, amount],
    })
    await publicClient.waitForTransactionReceipt({ hash })
  }
}

async function ensureUniversalRouterApprovalOnPermit2(
  network: SwapNetwork,
  cdpAccount: any,
  amount: bigint,
): Promise<void> {
  const config = UNISWAP_V4_CONFIG[network]
  const account = toAccount(cdpAccount)
  const publicClient = getRpcClient(network)

  const walletClient = createWalletClient({
    account,
    chain: config.chain,
    transport: http(),
  })

  const allowanceData = await publicClient.readContract({
    address: config.permit2,
    abi: PERMIT2_ABI,
    functionName: "allowance",
    args: [account.address, config.usdc, config.universalRouter],
  })

  if (allowanceData[0] < amount) {
    const expiration = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
    const hash = await walletClient.writeContract({
      address: config.permit2,
      abi: PERMIT2_ABI,
      functionName: "approve",
      args: [config.usdc, config.universalRouter, amount, expiration],
    })
    await publicClient.waitForTransactionReceipt({ hash })
  }
}

export async function executeUsdcToEthSwap(
  network: SwapNetwork,
  cdpAccount: any,
  usdcAmountIn: string,
): Promise<SwapResult> {
  try {
    console.log(`[SWAP] Starting USDC -> ETH swap on ${network}: ${usdcAmountIn} USDC`)

    const config = UNISWAP_V4_CONFIG[network]
    const account = toAccount(cdpAccount)
    const publicClient = getRpcClient(network)

    const walletClient = createWalletClient({
      account,
      chain: config.chain,
      transport: http(),
    })

    const usdcAmountInWei = viemParseUnits(usdcAmountIn, 6)

    // Get quote
    const quote = await getSwapQuote({
      network,
      amountIn: usdcAmountIn,
      tokenIn: "USDC",
      tokenOut: "ETH",
    })

    const amountOutWei = parseUnits(quote.amountOut, 18)
    const minAmountOut = (amountOutWei * BigInt(Math.floor((1 - SLIPPAGE_TOLERANCE) * 10000))) / 10000n

    // Approvals
    await ensureUsdcApprovalForPermit2(network, cdpAccount, usdcAmountInWei)
    await ensureUniversalRouterApprovalOnPermit2(network, cdpAccount, usdcAmountInWei)

    // Build swap
    const { usdc: USDC_TOKEN, eth: ETH_TOKEN } = getUniswapContext(network)

    const swapConfig = {
      poolKey: {
        currency0: ETH_TOKEN.address,
        currency1: USDC_TOKEN.address,
        fee: quote.fee,
        tickSpacing: quote.tickSpacing,
        hooks: "0x0000000000000000000000000000000000000000",
      },
      zeroForOne: false, // USDC (currency1) -> ETH (currency0)
      amountIn: usdcAmountInWei.toString(),
      amountOutMinimum: minAmountOut.toString(),
      hookData: "0x00",
    }

    const v4Planner = new V4Planner()
    v4Planner.addAction(Actions.SWAP_EXACT_IN_SINGLE, [swapConfig])
    v4Planner.addAction(Actions.SETTLE_ALL, [USDC_TOKEN.address, usdcAmountInWei.toString()])
    v4Planner.addAction(Actions.TAKE_ALL, [ETH_TOKEN.address, minAmountOut.toString()])

    const encodedActions = v4Planner.finalize()
    const routePlanner = new RoutePlanner()
    routePlanner.addCommand(CommandType.V4_SWAP, [encodedActions])

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 30 * 60)

    // Execute swap
    const hash = await walletClient.writeContract({
      address: config.universalRouter,
      abi: UNIVERSAL_ROUTER_ABI,
      functionName: "execute",
      args: [routePlanner.commands as `0x${string}`, routePlanner.inputs as `0x${string}`[], deadline],
      gas: 500000n,
    })

    await publicClient.waitForTransactionReceipt({ hash })

    console.log(`[SWAP] Swap successful: ${hash}`)

    return {
      success: true,
      txHash: hash,
      amountIn: usdcAmountIn,
      expectedAmountOut: quote.amountOut,
    }
  } catch (error) {
    console.error(`[SWAP] Swap failed:`, error)
    return {
      success: false,
      amountIn: usdcAmountIn,
      expectedAmountOut: "0",
      error: error instanceof Error ? error.message : String(error),
    }
  }
}