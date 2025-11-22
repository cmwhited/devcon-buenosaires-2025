import { CdpClient, EvmServerAccount } from "@coinbase/cdp-sdk"
import { parseEther } from "viem"

import { env } from "./env/server.ts"
import { SUPPORTED_NETWORKS, SupportedNetwork } from "./networks.ts"
import { getRpcClient } from "./rpc.ts"

const CDP_ACCOUNT_NAME = "gas-station"
const CDP_ACCOUNT_IDEMPOTENCY_KEY = "a104a221-36a7-4e10-95fb-05580a24cb76"
const MIN_BALANCE_THRESHOLD = parseEther("0.0005")

const cdp = new CdpClient({
  apiKeyId: env.CDP_API_KEY_ID,
  apiKeySecret: env.CDP_API_KEY_SECRET,
  walletSecret: env.CDP_WALLET_SECRET,
})

export async function getWallet(network: SupportedNetwork): Promise<{ account: EvmServerAccount; balance: bigint }> {
  const publicClient = getRpcClient(network)
  const account = await cdp.evm.createAccount({
    name: CDP_ACCOUNT_NAME,
    idempotencyKey: CDP_ACCOUNT_IDEMPOTENCY_KEY,
  })

  let balance = await getEthBalance(account, network)

  if (SUPPORTED_NETWORKS.includes(network) && balance < MIN_BALANCE_THRESHOLD) {
    const { transactionHash: faucetTransactionHash } = await cdp.evm.requestFaucet({
      address: account.address,
      network: network as any,
      token: "eth",
    })
    await publicClient.waitForTransactionReceipt({
      hash: faucetTransactionHash,
    })
    balance = await getEthBalance(account, network)
  }

  return { account, balance }
}

export async function sendEth(
  account: EvmServerAccount,
  network: SupportedNetwork,
  to: `0x${string}`,
  amount: bigint,
): Promise<string> {
  const publicClient = getRpcClient(network)

  const transactionResult = await cdp.evm.sendTransaction({
    address: account.address,
    transaction: {
      to,
      value: amount,
    },
    network: network as any,
  })

  const txReceipt = await publicClient.waitForTransactionReceipt({
    hash: transactionResult.transactionHash,
  })
  return txReceipt.status
}

async function getEthBalance(account: EvmServerAccount, network: SupportedNetwork): Promise<bigint> {
  const balances = await account.listTokenBalances({ network: network as any })
  const ethBalance = balances.balances.find((b) => b.token.symbol === "ETH")
  return ethBalance?.amount.amount ?? 0n
}
