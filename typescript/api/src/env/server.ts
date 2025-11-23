import { createEnv } from "@t3-oss/env-core"
import { config } from "dotenv"
import { z } from "zod"

config()

export const env = createEnv({
  server: {
    API_PORT: z.coerce.number().default(4000),
    MCP_PORT: z.coerce.number().default(8080),
    PRIVY_APP_ID: z.string().min(1),
    PRIVY_APP_SECRET: z.string().min(1),
  },
  runtimeEnv: process.env,
})
