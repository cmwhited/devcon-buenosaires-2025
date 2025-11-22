import { Button as ButtonPrimitive, ButtonProps as ButtonPrimitiveProps } from "@base-ui-components/react/button"

import { classnames } from "@/utils/classnames"

export type ButtonProps = ButtonPrimitiveProps & {
  type?: "submit" | "reset" | "button"
}
export function Button({ children, type = "button", ...rest }: Readonly<ButtonProps>) {
  return (
    <ButtonPrimitive
      {...rest}
      type={type}
      nativeButton={true}
      className="inline-flex cursor-pointer items-center justify-center gap-x-1.5 rounded px-4 py-1.5 font-mono shadow"
      style={{
        background: "var(--bg-oilcan)",
        color: "var(--dirty-white)",
      }}
    >
      {children}
    </ButtonPrimitive>
  )
}

export function SecondaryButton({ children, type = "button", ...rest }: Readonly<ButtonProps>) {
  return (
    <ButtonPrimitive
      {...rest}
      type={type}
      nativeButton={true}
      className={classnames(
        "inline-flex cursor-pointer items-center justify-center gap-x-1.5 rounded px-6 py-3 font-mono uppercase shadow",
        "bg-linear-to-b from-[#606060] to-[#3C3C3C]",
        "border-2 border-[#2A2A2A] text-(--color-neon-green)",
        "shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),inset_0_-2px_4px_rgba(0,0,0,0.5),2px_2px_4px_rgba(0,0,0,0.3)]",
        "transition-all duration-100",
        "hover:bg-linear-to-b hover:from-[#707070] hover:to-[#4C4C4C]",
        "hover:text-(--color-neon-green) hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.15),inset_0_-2px_4px_rgba(0,0,0,0.6),2px_2px_6px_rgba(0,0,0,0.4)]",
        "active:translate-y-px active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),1px_1px_2px_rgba(0,0,0,0.3)]",
        "disabled:cursor-not-allowed disabled:bg-linear-to-b disabled:from-[#404040] disabled:to-[#2C2C2C] disabled:text-[#666666] disabled:opacity-50",
        "w-full",
      )}
    >
      {children}
    </ButtonPrimitive>
  )
}
