"use client"

import { usePrivy } from "@privy-io/react-auth"
import type { UseQueryOptions } from "@tanstack/react-query"
import type { GetEnsAvatarErrorType, GetEnsNameErrorType } from "@wagmi/core"
import {
  type GetEnsAvatarQueryKey,
  getEnsAvatarQueryKey,
  type GetEnsNameQueryKey,
  getEnsNameQueryKey,
} from "@wagmi/core/query"
import { type Address, getAddress, type GetEnsAvatarReturnType, type GetEnsNameReturnType } from "viem"
import { mainnet } from "viem/chains"
import type { Config, ResolvedRegister } from "wagmi"
import { useQuery, type UseQueryReturnType } from "wagmi/query"

import { abortableEnsAvatarLookup, abortableEnsNameLookup } from "@/clients/ens"

type ResolveEnsNameArgs = Readonly<{
  address: Address
  /**
   * Timeout, in milliseconds, before aborting the lookup
   * @default 5000
   */
  timeout?: number
}>
export type UseAuthUserEnsArgs = Omit<ResolveEnsNameArgs, "address"> & { address?: Address | null }
export type UseAuthUserEnsResult = UseQueryReturnType<GetEnsNameReturnType, GetEnsNameErrorType>

/**
 * This overrides the wagmi `useEnsName` hook.
 * This app has wired connection to polygon,
 * but ENS primarily runs on mainnet.
 * This hook uses the viem public client `getEnsName` function and allows us to build a public client against mainnet to perform the lookup.
 *
 * @see https://viem.sh/docs/ens/actions/getEnsName
 */
export function useAuthUserENS<const config extends Config = ResolvedRegister["config"]>(
  args: Readonly<UseAuthUserEnsArgs> = {},
  options: Omit<
    UseQueryOptions<GetEnsNameReturnType, GetEnsNameErrorType, GetEnsNameReturnType, GetEnsNameQueryKey<config>>,
    "queryKey" | "queryFn"
  > = {},
): UseAuthUserEnsResult {
  const { authenticated, ready, user } = usePrivy()

  const userAddress = args.address || user?.wallet?.address || user?.smartWallet?.address
  const address = userAddress ? getAddress(userAddress) : undefined

  const { enabled, ...rest } = options
  const isEnabled =
    (enabled === undefined || enabled) && ready && authenticated && (args.address != null || user != null)

  return useQuery<GetEnsNameReturnType, GetEnsNameErrorType, GetEnsNameReturnType, GetEnsNameQueryKey<config>>({
    queryKey: getEnsNameQueryKey({
      chainId: mainnet.id,
      blockTag: "latest",
      address,
    }),
    async queryFn() {
      if (address == null) {
        return null
      }
      return await abortableEnsNameLookup(address, args.timeout)
    },
    enabled: isEnabled,
    ...rest,
  })
}

export type UseAuthUserAvatarResult = UseQueryReturnType<GetEnsAvatarReturnType, GetEnsAvatarErrorType>

/**
 * This overrides the wagmi `useEnsAvatar` hook.
 * This app has wired connection to polygon,
 * but ENS primarily runs on mainnet.
 * This hook uses the viem public client `getEnsAvatar` function and allows us to build a public client against mainnet to perform the lookup.
 *
 * @see https://viem.sh/docs/ens/actions/https://viem.sh/docs/ens/actions/getEnsAvatar
 */
export function useAuthUserAvatar<const config extends Config = ResolvedRegister["config"]>(
  options: Omit<
    UseQueryOptions<
      GetEnsAvatarReturnType,
      GetEnsAvatarErrorType,
      GetEnsAvatarReturnType,
      GetEnsAvatarQueryKey<config>
    >,
    "queryKey" | "queryFn"
  > = {},
): UseAuthUserAvatarResult {
  const { data: ens } = useAuthUserENS()

  const { enabled, ...rest } = options
  const isEnabled = (enabled === undefined || enabled) && ens != null

  return useQuery<GetEnsAvatarReturnType, GetEnsAvatarErrorType, GetEnsAvatarReturnType, GetEnsAvatarQueryKey<config>>({
    queryKey: getEnsAvatarQueryKey({
      chainId: mainnet.id,
      blockTag: "latest",
      name: ens || undefined,
    }),
    async queryFn() {
      if (ens == null) {
        return null
      }
      return await abortableEnsAvatarLookup(ens)
    },
    enabled: isEnabled,
    ...rest,
  })
}
