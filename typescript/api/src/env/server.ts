import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
  server: {
    API_PORT: z.coerce.number().default(4000),
  },
  runtimeEnv: process.env,
})
