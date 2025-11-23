import { ChainId, Token } from "@uniswap/sdk-core"
import { SwapExactInSingle } from "@uniswap/v4-sdk"
import { createPublicClient, formatUnits, getContract, http, parseUnits } from "viem"
import { sepolia } from "viem/chains"

const ETH_TOKEN = new Token(ChainId.SEPOLIA, "0x0000000000000000000000000000000000000000", 18, "ETH", "Ether")

const USDC_TOKEN = new Token(ChainId.SEPOLIA, "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", 6, "USDC", "USDC")

const CurrentConfig: SwapExactInSingle = {
  poolKey: {
    currency0: ETH_TOKEN.address,
    currency1: USDC_TOKEN.address,
    fee: 500,
    tickSpacing: 10,
    hooks: "0x0000000000000000000000000000000000000000",
  },
  zeroForOne: true,
  amountIn: parseUnits("0.01", ETH_TOKEN.decimals).toString(),
  amountOutMinimum: "0",
  hookData: "0x00",
}

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http("https://gateway.tenderly.co/public/sepolia"),
})

const quoterContract = getContract({
  address: "0x61b3f2011a92d183c7dbadbda940a7555ccf9227",
  abi: [
    {
      inputs: [{ internalType: "contract IPoolManager", name: "_poolManager", type: "address" }],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      inputs: [{ internalType: "PoolId", name: "poolId", type: "bytes32" }],
      name: "NotEnoughLiquidity",
      type: "error",
    },
    { inputs: [], name: "NotPoolManager", type: "error" },
    { inputs: [], name: "NotSelf", type: "error" },
    { inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }], name: "QuoteSwap", type: "error" },
    { inputs: [], name: "UnexpectedCallSuccess", type: "error" },
    {
      inputs: [{ internalType: "bytes", name: "revertData", type: "bytes" }],
      name: "UnexpectedRevertBytes",
      type: "error",
    },
    {
      inputs: [
        {
          components: [
            { internalType: "Currency", name: "exactCurrency", type: "address" },
            {
              components: [
                { internalType: "Currency", name: "intermediateCurrency", type: "address" },
                { internalType: "uint24", name: "fee", type: "uint24" },
                { internalType: "int24", name: "tickSpacing", type: "int24" },
                { internalType: "contract IHooks", name: "hooks", type: "address" },
                { internalType: "bytes", name: "hookData", type: "bytes" },
              ],
              internalType: "struct PathKey[]",
              name: "path",
              type: "tuple[]",
            },
            { internalType: "uint128", name: "exactAmount", type: "uint128" },
          ],
          internalType: "struct IV4Quoter.QuoteExactParams",
          name: "params",
          type: "tuple",
        },
      ],
      name: "_quoteExactInput",
      outputs: [{ internalType: "bytes", name: "", type: "bytes" }],
      stateMutability: "nonpayable",
      type: "function",
    },
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
      name: "_quoteExactInputSingle",
      outputs: [{ internalType: "bytes", name: "", type: "bytes" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          components: [
            { internalType: "Currency", name: "exactCurrency", type: "address" },
            {
              components: [
                { internalType: "Currency", name: "intermediateCurrency", type: "address" },
                { internalType: "uint24", name: "fee", type: "uint24" },
                { internalType: "int24", name: "tickSpacing", type: "int24" },
                { internalType: "contract IHooks", name: "hooks", type: "address" },
                { internalType: "bytes", name: "hookData", type: "bytes" },
              ],
              internalType: "struct PathKey[]",
              name: "path",
              type: "tuple[]",
            },
            { internalType: "uint128", name: "exactAmount", type: "uint128" },
          ],
          internalType: "struct IV4Quoter.QuoteExactParams",
          name: "params",
          type: "tuple",
        },
      ],
      name: "_quoteExactOutput",
      outputs: [{ internalType: "bytes", name: "", type: "bytes" }],
      stateMutability: "nonpayable",
      type: "function",
    },
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
      name: "_quoteExactOutputSingle",
      outputs: [{ internalType: "bytes", name: "", type: "bytes" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "poolManager",
      outputs: [{ internalType: "contract IPoolManager", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          components: [
            { internalType: "Currency", name: "exactCurrency", type: "address" },
            {
              components: [
                { internalType: "Currency", name: "intermediateCurrency", type: "address" },
                { internalType: "uint24", name: "fee", type: "uint24" },
                { internalType: "int24", name: "tickSpacing", type: "int24" },
                { internalType: "contract IHooks", name: "hooks", type: "address" },
                { internalType: "bytes", name: "hookData", type: "bytes" },
              ],
              internalType: "struct PathKey[]",
              name: "path",
              type: "tuple[]",
            },
            { internalType: "uint128", name: "exactAmount", type: "uint128" },
          ],
          internalType: "struct IV4Quoter.QuoteExactParams",
          name: "params",
          type: "tuple",
        },
      ],
      name: "quoteExactInput",
      outputs: [
        { internalType: "uint256", name: "amountOut", type: "uint256" },
        { internalType: "uint256", name: "gasEstimate", type: "uint256" },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
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
    {
      inputs: [
        {
          components: [
            { internalType: "Currency", name: "exactCurrency", type: "address" },
            {
              components: [
                { internalType: "Currency", name: "intermediateCurrency", type: "address" },
                { internalType: "uint24", name: "fee", type: "uint24" },
                { internalType: "int24", name: "tickSpacing", type: "int24" },
                { internalType: "contract IHooks", name: "hooks", type: "address" },
                { internalType: "bytes", name: "hookData", type: "bytes" },
              ],
              internalType: "struct PathKey[]",
              name: "path",
              type: "tuple[]",
            },
            { internalType: "uint128", name: "exactAmount", type: "uint128" },
          ],
          internalType: "struct IV4Quoter.QuoteExactParams",
          name: "params",
          type: "tuple",
        },
      ],
      name: "quoteExactOutput",
      outputs: [
        { internalType: "uint256", name: "amountIn", type: "uint256" },
        { internalType: "uint256", name: "gasEstimate", type: "uint256" },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
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
      name: "quoteExactOutputSingle",
      outputs: [
        { internalType: "uint256", name: "amountIn", type: "uint256" },
        { internalType: "uint256", name: "gasEstimate", type: "uint256" },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "bytes", name: "data", type: "bytes" }],
      name: "unlockCallback",
      outputs: [{ internalType: "bytes", name: "", type: "bytes" }],
      stateMutability: "nonpayable",
      type: "function",
    },
  ],
  client: publicClient,
})

const quotedAmountOut = (await quoterContract.read.quoteExactInputSingle([
  {
    poolKey: CurrentConfig.poolKey,
    zeroForOne: CurrentConfig.zeroForOne,
    exactAmount: BigInt(CurrentConfig.amountIn),
    hookData: CurrentConfig.hookData,
  },
])) as [bigint, bigint]

console.log(formatUnits(quotedAmountOut[0], USDC_TOKEN.decimals))
