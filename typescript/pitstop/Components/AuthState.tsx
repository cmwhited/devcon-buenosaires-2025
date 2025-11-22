"use client"

import { Avatar } from "@base-ui-components/react/avatar"
import { Tooltip } from "@base-ui-components/react/tooltip"
import { PowerIcon } from "@phosphor-icons/react"
import { usePrivy, User } from "@privy-io/react-auth"
import Image from "next/image"

import { useAuthUserAvatar, useAuthUserENS } from "@/hooks/useEnsName"
import { createIdenticon } from "@/utils/createIdenticon"

export function AuthStateContainer() {
  const { authenticated, ready, user, login, logout } = usePrivy()

  if (!ready) {
    return null
  }

  if (!authenticated || user == null) {
    return (
      <button
        type="button"
        className="cursor-pointer rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50"
        onClick={() => login()}
      >
        Connect Wallet
      </button>
    )
  }

  return (
    <div className="flex w-fit items-center gap-x-1.5">
      <AuthUserDisplay user={user} />
      <button
        type="button"
        className="inline-flex cursor-pointer items-center gap-x-0.5 rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50"
        onClick={() => logout()}
      >
        Disconnect
        <PowerIcon className="size-5 rounded-full text-inherit" aria-hidden="true" />
      </button>
    </div>
  )
}

function AuthUserDisplay({ user }: Readonly<{ user: User }>) {
  const { data: ens } = useAuthUserENS()
  const { data: avatar } = useAuthUserAvatar()

  const full = user.smartWallet?.address || user.wallet?.address || user.id
  let display = user.id
  if (ens) {
    display = ens
  } else if (user.smartWallet?.address) {
    display = shorten(user.smartWallet.address)
  } else if (user.wallet?.address) {
    display = shorten(user.wallet.address)
  }

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger className="flex w-fit items-center gap-x-0.5">
          <Avatar.Root className="inline-flex size-6 items-center justify-center overflow-hidden rounded-full bg-gray-100 align-middle text-base font-medium text-black select-none">
            <Avatar.Image src={avatar || undefined} width="24" height="24" className="size-full object-cover" />
            <Avatar.Fallback className="flex size-full items-center justify-center text-base">
              <Image src={createIdenticon(display)} width={24} height={24} alt="" className="size-full object-cover" />
            </Avatar.Fallback>
          </Avatar.Root>
          <span className="font-mono text-sm">{display}</span>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={10}>
            <Tooltip.Popup
              className="
                  flex origin-(--transform-origin)
                  flex-col rounded-lg
                  bg-gray-100
                  px-3
                  py-1.5
                  text-sm
                  shadow-lg shadow-gray-200 outline-1 outline-gray-200
                  transition-[transform,scale,opacity]
                  data-ending-style:scale-90 data-ending-style:opacity-0
                  data-instant:transition-none
                  data-starting-style:scale-90 data-starting-style:opacity-0
                  dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300"
            >
              {full}
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
function shorten(val: string): string {
  if (val.length <= 18) {
    return val
  }
  return `${val.substring(0, 6)}...${val.substring(val.length - 6, val.length)}`
}
