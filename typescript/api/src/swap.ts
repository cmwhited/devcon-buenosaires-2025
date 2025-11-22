import { ChainId, Token } from "@uniswap/sdk-core"
import { Contract, formatUnits, JsonRpcProvider, parseUnits } from "ethers"

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
  if (request.network !== "sepolia") {
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

  const zeroForOne = tokenIn === "ETH"
  const inputToken = tokenIn === "ETH" ? ETH_TOKEN : USDC_TOKEN
  const outputToken = tokenOut === "ETH" ? ETH_TOKEN : USDC_TOKEN
  const amountInWei = parseUnits(amountIn, inputToken.decimals).toString()

  // Try all pool configs in parallel
  const quotePromises = COMMON_POOL_CONFIGS.map((config) =>
    tryGetQuote(config, quoterContract, zeroForOne, amountInWei, inputToken, outputToken),
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
  inputToken: Token,
  outputToken: Token,
): Promise<{ amountOut: bigint; config: PoolConfig } | null> {
  try {
    const quotedAmountOut = await quoterContract.quoteExactInputSingle.staticCall({
      poolKey: {
        currency0: inputToken.address,
        currency1: outputToken.address,
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
    default:
      throw new Error(`Unsupported network: ${network}`)
  }
}