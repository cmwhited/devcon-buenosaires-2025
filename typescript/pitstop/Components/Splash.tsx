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
      <div className="flex w-full items-center justify-center gap-x-4 text-center text-black uppercase py-4" style={{ marginBottom: "-50px" }}>
        <GearIcon size={10} className="size-10" weight="fill" />
        <h5 className="font-mono text-[40px] font-bold tracking-normal text-black uppercase">Full service in 3 steps</h5>
        <GearIcon size={10} className="size-10" weight="fill" />
      </div>
      <div className="mx-auto grid grid-cols-3 gap-x-[22px]" style={{ maxWidth: "1340px" }}>
        <div className="flex flex-col items-center justify-start gap-y-4 p-6">
          <Image src="/icons/wrench.png" height={158} width={158} alt="" className="size-[158px] object-cover" />
          <div className="flex w-full flex-col items-center justify-center gap-y-2">
            <p className="w-full text-center font-mono text-[24px] font-bold uppercase tracking-wide">1. Pull in</p>
            <p className="w-full text-center font-mono text-[18px] text-black/80" style={{ lineHeight: "0.91" }}>Connect your wallet.</p>
            <p className="w-full text-center font-mono text-[18px] text-black/80" style={{ lineHeight: "0.91" }}>No paperwork needed.</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-start gap-y-4 p-6">
          <Image src="/icons/handle.png" height={158} width={158} alt="" className="size-[158px] object-cover" />
          <div className="flex w-full flex-col items-center justify-center gap-y-2">
            <p className="w-full text-center font-mono text-[24px] font-bold uppercase tracking-wide">2. Pick your chain</p>
            <p className="w-full text-center font-mono text-[18px] text-black/80" style={{ lineHeight: "0.91" }}>Choose ETH or Base.</p>
            <p className="w-full text-center font-mono text-[18px] text-black/80" style={{ lineHeight: "0.91" }}>Set your fill amount.</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-start gap-y-4 p-6">
          <Image src="/icons/flag.png" height={158} width={158} alt="" className="size-[158px] object-cover" />
          <div className="flex w-full flex-col items-center justify-center gap-y-2">
            <p className="w-full text-center font-mono text-[24px] font-bold uppercase tracking-wide">3. Pump &amp; go</p>
            <p className="w-full text-center font-mono text-[18px] text-black/80" style={{ lineHeight: "0.91" }}>We handle the rest.</p>
            <p className="w-full text-center font-mono text-[18px] text-black/80" style={{ lineHeight: "0.91" }}>Back on road in seconds.</p>
          </div>
        </div>
      </div>
      <div className="mx-auto" style={{ maxWidth: "1340px", marginTop: "-60px", marginLeft: "calc(50% - 670px + 216px)" }}>
        <p className="font-mono text-[14px] font-bold text-black/80">* Minimum service fee applies</p>
      </div>

      <div
        className="relative flex flex-col items-center justify-center"
        style={{
          marginTop: "-10px",
          padding: "66px 0",
        }}
      >
        {/* Background Image Layer */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "960px",
            height: "100%",
            backgroundImage: "url(/images/Section\\ background.png)",
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            borderRadius: "12px",
            zIndex: 0,
          }}
        />

        {/* Content Layer */}
        <div className="relative flex flex-col items-center justify-center" style={{ zIndex: 1 }}>
          <h2 className="mb-8 font-mono text-[42px] font-bold uppercase text-white">
            Why drivers choose Pit Stop:
          </h2>

          <div className="grid w-full gap-x-12 gap-y-12 px-16" style={{ gridTemplateColumns: "1fr 1fr", maxWidth: "1000px" }}>
            <div className="flex flex-col items-center text-center">
              <h3 className="mb-3 font-mono text-[24px] font-bold uppercase text-white underline">
                NO BRIDGE NEEDED
              </h3>
              <p className="font-mono text-[18px] leading-tight text-white">
                Skip the bridge dance.
                <br />
                We handle the dirty work.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <h3 className="mb-3 font-mono text-[24px] font-bold uppercase text-white underline">
                INSTANT DELIVERY
              </h3>
              <p className="font-mono text-[18px] leading-tight text-white">
                Gas in your tank
                <br />
                in under a minute.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <h3 className="mb-3 font-mono text-[24px] font-bold uppercase text-white underline">
                PAY WITH USDC
              </h3>
              <p className="font-mono text-[18px] leading-tight text-white">
                Use USDC on Polygon,
                <br />
                We'll convert.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <h3 className="mb-3 font-mono text-[24px] font-bold uppercase text-white underline">
                TRACK YOUR FILLS
              </h3>
              <p className="font-mono text-[18px] leading-tight text-white">
                Service history and
                <br />
                receipts always ready.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
