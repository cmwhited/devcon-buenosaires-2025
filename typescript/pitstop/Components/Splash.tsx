"use client"

import { GearIcon } from "@phosphor-icons/react"
import { usePrivy } from "@privy-io/react-auth"
import { NetworkBase, NetworkEthereum, NetworkPolygon } from "@web3icons/react"
import Image from "next/image"

import { Button } from "./Button"

export function Splash() {
  const { authenticated, ready, login } = usePrivy()

  return (
    <div className="flex w-full flex-col gap-y-6 py-10">
      <div className="grid w-full grid-cols-3 gap-x-4">
        <div className="col-span-2">
          <div className="flex max-w-xl flex-col gap-y-3">
            <h3 className="font-sans text-2xl text-(--color-oil-black) uppercase">Your crosschain filling station</h3>
            <p className="whitespace-break-spaces text-black">
              Running on fumes? We&apos;ll get you back on the road. One-click gas delivery to any wallet, any chain.
            </p>
            <div className="my-6 flex items-center justify-center">
              <Button type="button" disabled={!ready || authenticated} onClick={() => login()}>
                Connect Wallet to Fuel Up
              </Button>
            </div>
            <p className="flex whitespace-break-spaces text-black">
              Currently servicing:
              <NetworkBase variant="branded" size={6} className="size-6" />
              <NetworkEthereum variant="branded" size={6} className="size-6" />
              <NetworkPolygon variant="branded" size={6} className="size-6" />
              (More chains coming soon!)
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center">
          <Image
            src="/images/monkey.png"
            width={365}
            height={540}
            className="-mt-12 h-[440px] w-[300px] object-cover"
            alt=""
          />
        </div>
      </div>
      <div className="flex w-full items-center justify-center gap-x-4 text-center text-black uppercase">
        <GearIcon size={8} className="size-8" />
        <h5 className="font-sans text-3xl font-normal tracking-widest text-black uppercase">Full service in 3 steps</h5>
        <GearIcon size={8} className="size-8" />
      </div>
      <div className="mx-auto grid max-w-4xl grid-cols-3 gap-x-4">
        <div className="flex flex-col items-center justify-center p-6">
          <Image src="/icons/wrench.png" height={158} width={158} alt="" className="size-[158px] object-cover" />
          <div className="flex w-full flex-col items-center justify-center gap-y-1.5">
            <p className="w-full text-center font-semibold uppercase">1. Pull in</p>
            <p className="w-full text-center">Connect your wallet.</p>
            <p className="w-full text-center">No paperwork needed.</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center p-6">
          <Image src="/icons/handle.png" height={158} width={158} alt="" className="size-[158px] object-cover" />
          <div className="flex w-full flex-col items-center justify-center gap-y-1.5">
            <p className="w-full text-center font-semibold uppercase">2. Pick your chain</p>
            <p className="w-full text-center">Choose ETH or Base.</p>
            <p className="w-full text-center">Set your fill amount.</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center p-6">
          <Image src="/icons/flag.png" height={158} width={158} alt="" className="size-[158px] object-cover" />
          <div className="flex w-full flex-col items-center justify-center gap-y-1.5">
            <p className="w-full text-center font-semibold uppercase">3. Pump &amp; go</p>
            <p className="w-full text-center">We handle the rest.</p>
            <p className="w-full text-center">Back on road in seconds.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
