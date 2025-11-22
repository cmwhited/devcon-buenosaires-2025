import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

// Skip environment validation during CI/linting
const isCI = process.env.CI === "true" || process.env.NODE_ENV === "test"

export const env = createEnv({
  client: {
    NEXT_PUBLIC_APP_ID: z.string().min(1),
    NEXT_PUBLIC_CLIENT_ID: z.string().min(1),
    NEXT_PUBLIC_WALLET_CONNECT_PROJECTID: z.string().min(1),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_ID: process.env.NEXT_PUBLIC_APP_ID,
    NEXT_PUBLIC_CLIENT_ID: process.env.NEXT_PUBLIC_CLIENT_ID,
    NEXT_PUBLIC_WALLET_CONNECT_PROJECTID: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECTID,
  },
  skipValidation: isCI,
})
