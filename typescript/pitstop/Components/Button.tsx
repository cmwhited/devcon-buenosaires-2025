import { Button as ButtonPrimitive, ButtonProps } from "@base-ui-components/react/button"

export function Button({ children, ...rest }: Readonly<ButtonProps>) {
  return (
    <ButtonPrimitive
      {...rest}
      className="inline-flex cursor-pointer items-center justify-center gap-x-1.5 rounded px-4 py-1.5 font-mono uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,215,0,1),0_0_25px_rgba(255,215,0,0.5),2px_2px_0_#000]"
      style={{
        background: "var(--bg-oilcan)",
        color: "#FFD700",
        border: "3px solid #000",
        boxShadow:
          "0 0 10px rgba(255, 215, 0, 0.8), 0 0 20px rgba(255, 215, 0, 0.5), 2px 2px 0 #000",
      }}
    >
      {children}
    </ButtonPrimitive>
  )
}
