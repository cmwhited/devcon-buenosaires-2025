"use client"

import { Select, SelectRootProps } from "@base-ui-components/react/select"
import { CaretDownIcon } from "@phosphor-icons/react"
import { useStore } from "@tanstack/react-form"
import { NetworkIcon } from "@web3icons/react"

import { useFieldContext } from "./FormContext"

import { classnames } from "@/utils/classnames"
import { OmitStrict } from "@/utils/types"

export const NetworkSelectValue = ["base-sepolia", "sepolia", "polygon-amoy"] as const
export type NetworkSelectValue = (typeof NetworkSelectValue)[number]

const networks: ReadonlyArray<{
  label: React.ReactNode
  value: NetworkSelectValue
}> = [
  {
    label: "Base Sepolia",
    value: "base-sepolia",
  },
  {
    label: "Sepolia",
    value: "sepolia",
  },
  {
    label: "Polygon Amoy",
    value: "polygon-amoy",
  },
]

export type NetworkSelectProps = OmitStrict<
  SelectRootProps<NetworkSelectValue, false>,
  "id" | "name" | "items" | "value" | "onValueChange"
> & {
  id: string
  name: string
  label?: React.ReactNode
  hint?: React.ReactNode
}
export function NetworkSelect({ id, name, label, ...rest }: Readonly<NetworkSelectProps>) {
  const field = useFieldContext<NetworkSelectValue>()
  const errors = useStore(field.store, (state) => state.meta.errors)
  const touched = useStore(field.store, (state) => state.meta.isTouched)
  const dirty = useStore(field.store, (state) => state.meta.isDirty)
  const hasErrors = errors.length > 0 && touched && dirty

  return (
    <div>
      {label != null ? (
        <label htmlFor={name} className="block text-sm/6 text-black">
          {label}
          {rest.required ? "*" : ""}
        </label>
      ) : null}
      <Select.Root {...rest} items={networks} value={field.state.value} onValueChange={field.handleChange}>
        <Select.Trigger
          data-state={hasErrors ? "invalid" : undefined}
          aria-invalid={hasErrors ? "true" : undefined}
          className={classnames(
            "flex w-full items-center justify-between rounded-sm border-2 border-[#333333] bg-(--color-oil-black)",
            "cursor-pointer px-4 py-3 text-(--color-neon-green)",
            "appearance-none",
            "text-sm tracking-wider uppercase",
            "shadow-(--shadow-inset-industrial)",
            "hover:border-(--color-neon-green) hover:bg-[#0a0a0a]",
            "focus:border-(--color-neon-green) focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),0_0_0_1px_var(--color-neon-green),0_0_15px_rgba(0,255,65,0.15)] focus:outline-none",
            "data-[state=invalid]:border-(--color-rust) data-[state=invalid]:bg-[#1a0a0a]",
          )}
        >
          <Select.Value />
          <Select.Icon className="flex">
            <CaretDownIcon className="size-5 text-(--color-neon-green)" aria-hidden="true" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner
            className="z-10 outline-none select-none"
            side="bottom"
            sideOffset={0}
            alignItemWithTrigger={false}
          >
            <Select.Popup className="group w-(--anchor-width) origin-(--transform-origin) rounded-xs bg-[#2D2D2D] bg-clip-padding p-3 shadow-(--shadow-industrial) outline-1 outline-(--color-oil-black) transition-[transform,scale,opacity] data-ending-style:scale-90 data-ending-style:opacity-0 data-starting-style:scale-90 data-starting-style:opacity-0 data-[side=none]:data-ending-style:transition-none data-[side=none]:data-starting-style:scale-100 data-[side=none]:data-starting-style:opacity-100 data-[side=none]:data-starting-style:transition-none">
              <Select.ScrollUpArrow className="top-0 z-1 flex h-4 w-full cursor-default items-center justify-center rounded-md bg-[canvas] text-center text-xs before:absolute before:left-0 before:h-full before:w-full before:content-[''] data-[side=none]:before:-top-full" />
              <Select.List className="relative flex max-h-(--available-height) w-full scroll-py-6 flex-col gap-y-3 overflow-y-auto py-1">
                {networks.map(({ label, value }) => (
                  <Select.Item
                    key={value}
                    value={value}
                    className="flex cursor-pointer items-center gap-x-1.5 px-1 py-2 text-base text-(--color-neon-green) hover:bg-(--color-oil-black)"
                  >
                    <NetworkIcon variant="branded" name={value} size={5} className="size-5" />
                    {label}
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  )
}
