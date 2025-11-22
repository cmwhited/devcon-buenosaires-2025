import { AuthStateContainer } from "./AuthState"

export function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh w-full border-collapse flex-col">
      <div className="sticky top-0 z-40 mx-auto flex h-12 w-full max-w-7xl items-center justify-between bg-white px-2 md:px-0">
        <h1 className="animate-flicker -rotate-[0.5deg] -skew-x-1 font-sans text-2xl brightness-95 contrast-[1.2]">
          Pit Stop
        </h1>
        <AuthStateContainer />
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 px-2 py-10 md:px-0">{children}</main>
    </div>
  )
}
