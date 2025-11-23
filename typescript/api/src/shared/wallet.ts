import { CdpClient, EvmServerAccount } from "@coinbase/cdp-sdk"
import { TransactionReceipt } from "viem"

import { sharedEnv } from "./env.ts"
import { SUPPORTED_NETWORKS, SupportedNetwork } from "./networks.ts"
import { getRpcClient } from "./rpc.ts"

const CDP_ACCOUNT_NAME = "gas-station"
const CDP_ACCOUNT_IDEMPOTENCY_KEY = "a104a221-36a7-4e10-95fb-05580a24cb76"

const cdp = new CdpClient({
  apiKeyId: sharedEnv.CDP_API_KEY_ID,
  apiKeySecret: sharedEnv.CDP_API_KEY_SECRET,
  walletSecret: sharedEnv.CDP_WALLET_SECRET,
})

export type WalletInfo = { account: EvmServerAccount; balance: bigint }
export type Wallets = Record<SupportedNetwork, WalletInfo>

export async function getWallets(): Promise<Wallets> {
  const wallets: Wallets = {} as Wallets
  for (const network of SUPPORTED_NETWORKS) {
    const wallet = await getWallet(network)
    wallets[network] = wallet
  }
  return wallets
}

export async function getWallet(network: SupportedNetwork): Promise<WalletInfo> {
  const publicClient = getRpcClient(network)
  let account = await cdp.evm.getAccount({
    name: CDP_ACCOUNT_NAME,
  })
  if (account == null) {
    account = await cdp.evm.createAccount({
      name: CDP_ACCOUNT_NAME,
      idempotencyKey: CDP_ACCOUNT_IDEMPOTENCY_KEY,
    })
  }
  const customAccount = await account.useNetwork(publicClient.chain?.rpcUrls.default.http[0] as string)
  const balance = await publicClient.getBalance({ address: account.address })
  return { account: customAccount as unknown as EvmServerAccount, balance }
}

export async function sendEth(
  account: EvmServerAccount,
  network: SupportedNetwork,
  to: `0x${string}`,
  amount: bigint,
): Promise<TransactionReceipt> {
  const publicClient = getRpcClient(network)

  const tx = await account.sendTransaction({
    transaction: {
      to: to,
      value: amount,
    },
    network: network as any,
  })
  const txReceipt = await publicClient.waitForTransactionReceipt({
    hash: tx.transactionHash,
  })
  return txReceipt
}
