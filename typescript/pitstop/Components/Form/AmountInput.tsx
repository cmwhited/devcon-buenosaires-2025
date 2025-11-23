"use client"

import { Input, type InputProps } from "@base-ui-components/react/input"
import { useStore } from "@tanstack/react-form"

import { useFieldContext } from "./FormContext"

import { classnames } from "@/utils/classnames"
import { OmitStrict } from "@/utils/types"

export type AmountInputProps = OmitStrict<InputProps, "id" | "name"> & {
  id: string
  name: string
  label?: React.ReactNode
  hint?: React.ReactNode
}
export function AmounInput({ id, name, label, hint, ...rest }: Readonly<AmountInputProps>) {
  const field = useFieldContext<string>()
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
      <div className={classnames("grid grid-cols-1", label != null ? "mt-2" : "mt-0")}>
        <div
          data-state={hasErrors ? "invalid" : undefined}
          className="col-start-1 row-start-1 flex items-center rounded-md bg-(--color-oil-black) outline-2 -outline-offset-1 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-[#333333] focus:border-(--color-neon-green) focus:bg-[#0a0a0a] data-[state=invalid]:outline-(--color-rust) data-[state=invalid]:focus-within:outline-(--color-rust)"
        >
          <Input
            {...rest}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => {
              field.handleChange(e.target.value)
              rest.onChange?.(e)
            }}
            data-state={hasErrors ? "invalid" : undefined}
            aria-invalid={hasErrors ? "true" : undefined}
            aria-describedby={hasErrors ? `${id}-invalid` : hint != null ? `${id}-hint` : undefined}
            className={classnames(
              "block w-full min-w-0 grow rounded-sm px-4 py-3 font-mono text-base tracking-wider",
              "text-(--color-neon-green)",
              "shadow-(--shadow-inset-industrial)",
              "transition-all duration-200 ease-in-out",
              "placeholder:text-[#505050] placeholder:italic",
              "focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),0_0_0_1px_var(--color-neon-green),0_0_20px_rgba(0,255,65,0.2)] focus:outline-none",
              "data-[state=invalid]:bg-[#1a0a0a] data-[state=invalid]:focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),0_0_0_1px_var(--color-rust),0_0_20px_rgba(255,107,53,0.2)]",
            )}
          />
        </div>
        {hint != null && !hasErrors ? (
          <p id={`${id}-hint`} className="mt-1.5 text-sm text-[#1a1a1a]">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  )
}
