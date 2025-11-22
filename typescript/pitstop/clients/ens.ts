import { addEnsContracts, createEnsPublicClient } from "@ensdomains/ensjs"
import {
  type Address,
  createPublicClient,
  getAddress,
  type GetEnsAvatarReturnType,
  type GetEnsNameReturnType,
  http,
} from "viem"
import { mainnet } from "viem/chains"
import { normalize, parseAvatarRecord } from "viem/ens"

const transport = http("https://eth.drpc.org")
const ensPublicClient = createEnsPublicClient({
  chain: addEnsContracts(mainnet),
  transport,
})
const publicClient = createPublicClient({
  chain: mainnet,
  transport,
})

export async function abortableEnsNameLookup(address: Address, timeout = 5000) {
  return new Promise<GetEnsNameReturnType>((resolve) => {
    const timeoutInterval = setTimeout(() => {
      resolve(null)
    }, timeout)

    void ensPublicClient
      .getName({ address })
      .then((ens) => {
        clearTimeout(timeoutInterval)
        /** the getName returns type GetNameReturnType, but in _can_ be null so need to handle, even if ts disagrees */
        resolve(ens != null && ens?.match ? ens.name : null)
      })
      .catch(() => {
        resolve(null)
      })
  })
}

export async function abortableAddressReverseLookup(ens: string, timeout = 5000) {
  return new Promise<Address | null>((resolve) => {
    const timeoutInterval = setTimeout(() => {
      resolve(null)
    }, timeout)

    void ensPublicClient
      .getAddressRecord({ name: normalize(ens), strict: true })
      .then((resolved) => {
        clearTimeout(timeoutInterval)

        resolve(resolved?.value ? getAddress(resolved.value) : null)
      })
      .catch(() => {
        clearTimeout(timeoutInterval)

        resolve(null)
      })
  })
}

export async function abortableEnsAvatarLookup(name: string, timeout = 5000) {
  return new Promise<GetEnsAvatarReturnType>((resolve) => {
    const timeoutInterval = setTimeout(() => {
      resolve(null)
    }, timeout)

    void ensPublicClient
      .getTextRecord({ name: normalize(name), key: "avatar" })
      .then((textRecord) => {
        clearTimeout(timeoutInterval)
        if (!textRecord) {
          return resolve(null)
        }
        void parseAvatarRecord(publicClient, { record: textRecord })
          .then((resolved) => {
            clearTimeout(timeoutInterval)
            return resolve(resolved)
          })
          .catch(() => {
            resolve(null)
          })
      })
      .catch(() => {
        resolve(null)
      })
  })
}
