"use client"

import { CheckIcon, ExclamationMarkIcon } from "@phosphor-icons/react"

import { ButtonProps, SecondaryButton } from "../Button"

import { useFormContext } from "./FormContext"

export type SubmitButtonProps = ButtonProps & {
  status: "idle" | "error" | "success" | "pending"
}
export function SubmitButton({ children, status, ...rest }: SubmitButtonProps) {
  const form = useFormContext()

  return (
    <form.Subscribe
      selector={(state) => ({
        canSubmit: state.canSubmit,
        isSubmitting: state.isSubmitting,
        valid: state.isValid && state.errors.length === 0,
        dirty: state.isDirty,
      })}
    >
      {(state) => (
        <SecondaryButton {...rest} type="submit" disabled={!state.canSubmit || !state.valid} data-state={status}>
          {status === "success" ? (
            <>
              <CheckIcon className="text-status-success-default" aria-hidden="true" size={4} alt="" />
              {children}
            </>
          ) : status === "error" ? (
            <>
              <ExclamationMarkIcon className="text-status-error-default" aria-hidden="true" size={4} alt="" />
              Error
            </>
          ) : (
            children
          )}
        </SecondaryButton>
      )}
    </form.Subscribe>
  )
}
