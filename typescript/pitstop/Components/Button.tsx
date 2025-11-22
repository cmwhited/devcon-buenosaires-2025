import { Button as ButtonPrimitive, ButtonProps } from "@base-ui-components/react/button"

export function Button({ children, ...rest }: Readonly<ButtonProps>) {
  return (
    <ButtonPrimitive
      {...rest}
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
