import { createEnv } from "@t3-oss/env-core"
import { config } from "dotenv"
import { z } from "zod"

config()

export const sharedEnv = createEnv({
  server: {
    X402_NETWORK: z.enum(["base", "base-sepolia", "polygon-amoy"]).default("polygon-amoy"),
    X402_FACILITATOR_URL: z.string().url(),
    CDP_API_KEY_ID: z.string().min(1),
    CDP_API_KEY_SECRET: z.string().min(1),
    CDP_WALLET_SECRET: z.string().min(1),
  },
  runtimeEnv: process.env,
})
