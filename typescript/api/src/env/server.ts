import { createEnv } from "@t3-oss/env-core"
import { config } from "dotenv"
import { z } from "zod"

config()

export const env = createEnv({
  server: {
    API_PORT: z.coerce.number().default(4000),
    PRIVY_APP_ID: z.string().min(1),
    PRIVY_APP_SECRET: z.string().min(1),
    X402_PAY_TO_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    X402_NETWORK: z.enum(["base", "base-sepolia", "polygon-amoy"]).default("polygon-amoy"),
  },
  runtimeEnv: process.env,
})
