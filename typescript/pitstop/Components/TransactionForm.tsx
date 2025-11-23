/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { User, useX402Fetch } from "@privy-io/react-auth"
import { createFormHook, useStore } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"
import Image from "next/image"
import { useState } from "react"
import { Address, isAddress } from "viem"
import { z } from "zod"

import { SecondaryButton } from "./Button"
import { AmounInput } from "./Form/AmountInput"
import { fieldContext, formContext } from "./Form/FormContext"
import { NetworkSelect, NetworkSelectValue } from "./Form/NetworkSelect"
import { RecipientAddress } from "./Form/RecipientAddress"
import { SubmitButton } from "./Form/SubmitButton"
import { TransactionsTable } from "./TransactionsTable"

import { abortableAddressReverseLookup, abortableEnsNameLookup } from "@/clients/ens"

export const { useAppForm } = createFormHook({
  fieldComponents: {
    AmounInput,
    NetworkSelect,
    RecipientAddress,
  },
  formComponents: {
    SubmitButton,
  },
  fieldContext,
  formContext,
})

const AddressSchema = z.custom<Address>((val) => val != null && typeof val === "string" && isAddress(val))
const EnsNameSchema = z.custom<`${string}.eth`>((val) => val != null && typeof val === "string" && val.endsWith(".eth"))
const TransactionFormSchema = z.object({
  network: z.literal(NetworkSelectValue),
  amount: z.string(),
  recipient: z.union([AddressSchema, EnsNameSchema] as const),
  recipientAddress: AddressSchema,
})
type TransactionFormSchema = z.infer<typeof TransactionFormSchema>

const Tx = z.object({
  network: z.string(),
  hash: z.string(),
  status: z.string(),
})
export const PumpOperationData = z.object({
  sourceAddress: z.string().optional().nullable(),
  sourceNetwork: z.string(),
  targetAddress: z.string(),
  targetNetwork: z.string(),
  usdcAmount: z.string(),
  ethAmount: z.number().positive(),
  transactions: z.object({
    swap: Tx,
    bridge: Tx,
    transfer: Tx,
    settlement: Tx.nullable().optional(),
  }),
})
type PumpOperationData = z.infer<typeof PumpOperationData>

const defaultValues: TransactionFormSchema = {
  network: "polygon-amoy",
  amount: "0.01",
  recipient: "" as any,
  recipientAddress: "0x",
}

export function TransactionForm({ user }: Readonly<{ user: User }>) {
  const { wrapFetchWithPayment } = useX402Fetch()

  const { mutateAsync, data, status, reset } = useMutation<
    PumpOperationData | { status: "success"; ethAmount: number },
    Error,
    TransactionFormSchema
  >({
    mutationKey: ["tx", "send", { user: user.id }] as const,
    async mutationFn(vars) {
      try {
        const fetchWithPayment = wrapFetchWithPayment({
          fetch,
        })
        const response = await fetchWithPayment("http://localhost:4000/api/pump", {
          method: "POST",
          body: JSON.stringify({
            amount: vars.amount,
            network: vars.network,
            targetAddress: vars.recipientAddress,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        })
        if (!response.ok) {
          console.error("failure calling fetch to api/pump endpoint. failure status code", response.status)
          throw new Error(`/api/pump endpoint returned not ok status [${response.status}]`)
        }

        const body = await response.json()
        const maybeParsedBody = PumpOperationData.safeParse(body)

        return maybeParsedBody.success ? maybeParsedBody.data : { status: "success", ethAmount: 0 }
      } catch (err) {
        console.error("failure calling fetch to pump endpoint", { err })
        throw err
      }
    },
  })

  const [recipientHint, setRecipientHint] = useState<string | null>(null)

  const txForm = useAppForm({
    defaultValues,
    validators: {
      onChangeAsync: TransactionFormSchema,
      onChange: TransactionFormSchema,
      onSubmitAsync: TransactionFormSchema,
      onBlur: TransactionFormSchema,
    },
    async onSubmit({ value }) {
      await mutateAsync(value)
    },
  })
  const recipient = useStore(txForm.store, (state) => state.values.recipient)

  return (
    <div className="flex w-full flex-col gap-y-10">
      <form
        noValidate
        className="grid grid-cols-2 gap-x-6 border-b border-(--color-oil-black) pb-12"
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()

          void txForm.handleSubmit()
        }}
      >
        <div>
          <Image
            src="/images/gaspump.png"
            height={645}
            width={430}
            alt=""
            className="h-[645px] w-[430px] object-cover"
          />
        </div>
        <div>
          {status === "pending" ? (
            <div className="flex w-full flex-col items-center justify-center gap-y-6">
              <h3 className="font-sans text-3xl font-semibold tracking-wide text-(--color-oil-black)">
                Pouring Gas...
              </h3>
              <Image
                src="/images/pouring.gif"
                width={300}
                height={300}
                className="size-[300px] object-cover"
                preload
                unoptimized
                alt=""
              />
              <p className="mx-auto max-w-64 text-center font-semibold whitespace-break-spaces text-(--color-oil-black)">
                Tank should be full in less than one minute
              </p>
            </div>
          ) : null}
          {status === "success" ? (
            <div className="flex w-full flex-col items-center justify-center gap-y-6">
              <h3 className="font-sans text-3xl font-semibold tracking-wide text-(--color-oil-black)">
                Fueld up &amp; ready to roll!
              </h3>
              <Image src="/images/success.png" width={238} height={238} className="size-[238px] object-cover" alt="" />
              {data != null && data.ethAmount > 0 ? (
                <p className="font-sans font-semibold text-black">
                  {data.ethAmount} sent to {recipient}
                </p>
              ) : null}
              <SecondaryButton
                type="button"
                onClick={() => {
                  txForm.reset({
                    network: "polygon-amoy",
                    amount: "0.01",
                    recipient: "" as any,
                    recipientAddress: "0x",
                  })
                  reset()
                }}
              >
                Get more gas
              </SecondaryButton>
            </div>
          ) : null}
          {status === "idle" ? (
            <div className="flex w-full flex-col gap-y-6">
              <h3 className="font-sans text-3xl font-semibold tracking-wide text-(--color-oil-black)">
                Get your gas now...
              </h3>
              <txForm.AppField
                name="recipient"
                listeners={{
                  onChangeDebounceMs: 500,
                  async onChange({ value }) {
                    const safeParseAddress = AddressSchema.safeParse(value)
                    if (safeParseAddress.success) {
                      // user entered an address, set on form. no need to lookup
                      txForm.setFieldValue("recipientAddress", safeParseAddress.data)
                      // attempt to resolve ENS for hint
                      const maybeFoundEns = await abortableEnsNameLookup(safeParseAddress.data)
                      if (maybeFoundEns) {
                        setRecipientHint(maybeFoundEns)
                      }
                      return
                    }
                    // user entered in an ENS, attempt a reverse lookup for the address
                    const safeParseEns = EnsNameSchema.safeParse(value)
                    if (safeParseEns.success) {
                      const maybeFoundAddress = await abortableAddressReverseLookup(safeParseEns.data)
                      if (maybeFoundAddress) {
                        txForm.setFieldValue("recipientAddress", maybeFoundAddress)
                        setRecipientHint(maybeFoundAddress)
                      }
                    }
                  },
                }}
              >
                {(field) => (
                  <field.RecipientAddress
                    id="recipient"
                    name="recipient"
                    type="text"
                    placeholder="Must be a valid wallet (0x) or ENS name"
                    label="Recipient Wallet"
                    hint={recipientHint || undefined}
                    required
                  />
                )}
              </txForm.AppField>
              <txForm.AppField name="network">
                {(field) => <field.NetworkSelect id="network" name="network" required label="Network" />}
              </txForm.AppField>
              <txForm.AppField name="amount">
                {(field) => (
                  <field.RecipientAddress
                    id="amount"
                    name="amount"
                    type="number"
                    placeholder="In USDC"
                    label="Amount of gas, in USDC, to send"
                    required
                  />
                )}
              </txForm.AppField>
              <div className="mt-4 w-full">
                <txForm.AppForm>
                  <txForm.SubmitButton status={status}>Send Tokens</txForm.SubmitButton>
                </txForm.AppForm>
              </div>
            </div>
          ) : null}
        </div>
      </form>
      <TransactionsTable user={user} />
    </div>
  )
}
