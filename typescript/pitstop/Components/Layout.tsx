import { Avatar } from "@base-ui-components/react/avatar"

import { AuthStateContainer } from "./AuthState"
import { Footer } from "./Footer"

export function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh w-full border-collapse flex-col">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-2 md:px-0">
        <Avatar.Root
          className="inline-flex h-16 items-center overflow-hidden pt-4"
          style={{
            filter:
              "drop-shadow(0 0 10px rgba(255, 215, 0, 0.8)) drop-shadow(0 0 20px rgba(255, 215, 0, 0.5)) drop-shadow(2px 2px 0 #000)",
            position: "relative",
            top: "50px",
            left: "-40px",
          }}
        >
          <Avatar.Image src="/images/pitstop-logo.png" width={160} height={32} />
          <Avatar.Fallback className="animate-flicker -rotate-[0.5deg] -skew-x-1 font-sans text-2xl brightness-95 contrast-[1.2]">
            Pit Stop
          </Avatar.Fallback>
        </Avatar.Root>
        <div style={{ position: "relative", top: "50px" }}>
          <AuthStateContainer />
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 grow px-2 py-10 md:px-0">{children}</main>

      <Footer />
    </div>
  )
}
