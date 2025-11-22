import { electricCollectionOptions } from "@tanstack/electric-db-collection"
import { createCollection } from "@tanstack/react-db"
import { type Address, getAddress } from "viem"
import { z } from "zod"

export const AddressFromSelf = z
  .string()
  .regex(/^0x[0-9a-fA-F]{40}$/, "Invalid Ethereum address format")
  .transform((address) => getAddress(address as Address))
  .pipe(z.custom<Address>())

export const AddressFromString = z
  .string()
  .transform((address) => {
    const normalized = address.startsWith("0x") ? address : `0x${address.replace(/^\\x/, "")}`
    return getAddress(normalized as Address)
  })
  .pipe(z.custom<Address>())

export type AddressFromString = z.infer<typeof AddressFromString>

export const Transaction = z.object({
  tx_hash: z.string(),
  block_num: z.coerce.number().int().positive(),
  timestamp: z.coerce.date(),
  to: AddressFromString,
  from: AddressFromString,
  value: z.coerce.number().int(),
})
export type Transaction = z.infer<typeof Transaction>

export const transactionCollection = createCollection(
  electricCollectionOptions({
    id: "pitstop_transaction",
    shapeOptions: {
      url: new URL(`/api/shape-proxy`, `http://localhost:${process.env.PORT ?? 3001}`).href,
      transformer(message) {
        return Transaction.parse(message)
      },
    },
    schema: Transaction,
    getKey(item) {
      return item.tx_hash
    },
  }),
)
