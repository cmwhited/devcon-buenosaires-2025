"use client"

import { GearIcon } from "@phosphor-icons/react"
import { usePrivy } from "@privy-io/react-auth"
import Image from "next/image"

import { Button } from "./Button"

export function Splash() {
  const { authenticated, ready, login } = usePrivy()

  return (
    <div className="flex w-full flex-col gap-y-12 py-8">
      <div className="grid w-full grid-cols-3 gap-x-8" style={{ marginTop: "40px" }}>
        <div className="col-span-2">
          <div className="flex flex-col gap-y-4" style={{ marginLeft: "60px" }}>
            <h3 className="font-sans text-[48px] uppercase leading-tight tracking-wide whitespace-nowrap">Your crosschain filling station</h3>
            <p className="whitespace-break-spaces text-[24px] text-black/90" style={{ lineHeight: "1.2" }}>
              Running on fumes? We&apos;ll get you back on the road. One-click gas delivery to any wallet, any chain.
            </p>
            <div className="my-4 flex items-center justify-center" style={{ marginLeft: "-80px", marginTop: "20px" }}>
              <Button type="button" disabled={!ready || authenticated} onClick={() => login()}>
                Connect Wallet to Fuel Up
              </Button>
            </div>
            <div className="flex items-center gap-x-6 text-white" style={{ marginTop: "100px", marginLeft: "70px" }}>
              <div className="flex flex-col gap-y-2">
                <span className="font-mono text-[24px] font-bold uppercase">Currently Servicing:</span>
                <span className="font-mono text-[18px] font-bold">(More chains coming soon!)</span>
              </div>
              <div className="flex items-center">
                <Image src="/icons/Base.png" width={90} height={90} alt="Base" className="size-[90px] object-cover" />
                <Image src="/icons/Polygon.png" width={90} height={90} alt="Polygon" className="size-[90px] object-cover ml-6" />
                <Image src="/icons/Ethereum.png" width={90} height={90} alt="Ethereum" className="size-[90px] object-cover ml-2" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center">
          <Image
            src="/images/monkey.png"
            width={365}
            height={540}
            className="-mt-12 h-[550px] w-[375px] object-cover"
            alt=""
          />
        </div>
      </div>
      <div className="flex w-full items-center justify-center gap-x-4 text-center text-black uppercase py-4">
        <GearIcon size={10} className="size-10" weight="fill" />
        <h5 className="font-sans text-4xl font-normal tracking-widest text-black uppercase">Full service in 3 steps</h5>
        <GearIcon size={10} className="size-10" weight="fill" />
      </div>
      <div className="mx-auto grid max-w-5xl grid-cols-3 gap-x-8">
        <div className="flex flex-col items-center justify-start gap-y-4 p-6">
          <Image src="/icons/wrench.png" height={158} width={158} alt="" className="size-[158px] object-cover" />
          <div className="flex w-full flex-col items-center justify-center gap-y-2">
            <p className="w-full text-center text-lg font-bold uppercase tracking-wide">1. Pull in</p>
            <p className="w-full text-center text-sm leading-relaxed text-black/80">Connect your wallet.</p>
            <p className="w-full text-center text-sm leading-relaxed text-black/80">No paperwork needed.</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-start gap-y-4 p-6">
          <Image src="/icons/handle.png" height={158} width={158} alt="" className="size-[158px] object-cover" />
          <div className="flex w-full flex-col items-center justify-center gap-y-2">
            <p className="w-full text-center text-lg font-bold uppercase tracking-wide">2. Pick your chain</p>
            <p className="w-full text-center text-sm leading-relaxed text-black/80">Choose ETH or Base.</p>
            <p className="w-full text-center text-sm leading-relaxed text-black/80">Set your fill amount.</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-start gap-y-4 p-6">
          <Image src="/icons/flag.png" height={158} width={158} alt="" className="size-[158px] object-cover" />
          <div className="flex w-full flex-col items-center justify-center gap-y-2">
            <p className="w-full text-center text-lg font-bold uppercase tracking-wide">3. Pump &amp; go</p>
            <p className="w-full text-center text-sm leading-relaxed text-black/80">We handle the rest.</p>
            <p className="w-full text-center text-sm leading-relaxed text-black/80">Back on road in seconds.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
