import { serve } from "@hono/node-server"
import { AuthTokenClaims } from "@privy-io/server-auth"
import { Env, Hono } from "hono"
import { bearerAuth } from "hono/bearer-auth"
import { contextStorage, getContext } from "hono/context-storage"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { prettyJSON } from "hono/pretty-json"
import { requestId } from "hono/request-id"
import { secureHeaders } from "hono/secure-headers"

import { authClient } from "./auth.ts"
import { env } from "./env/server.ts"

interface ApiContext extends Env {
  Variables: {
    claims: AuthTokenClaims | null
    user: string | null
  }
}

const app = new Hono<ApiContext>()

app.use(logger())
app.use(prettyJSON())
app.use("*", requestId()) // applies a request id to all downstream requests
app.use(secureHeaders())
app.use(contextStorage())
app.use(
  "/api/*",
  cors({
    allowHeaders: ["Content-Type", "Accept", "Authorization", "User-Agent"],
    allowMethods: ["POST", "GET", "PUT", "PATCH", "DELETE", "OPTIONS"],
    origin: ["http://localhost:3000"],
  }),
)
app.get("/", (c) => c.json({ status: "OK" }))
app.get(
  "/api/protected",
  bearerAuth({
    async verifyToken(token, c) {
      return await authClient
        .verifyAuthTokenAndFetchUser(token)
        .then(({ claims, user }) => {
          // set claims on request context
          c.set("claims", claims)
          c.set("user", authClient.fetchUserAddress(user))

          return true
        })
        .catch((err) => {
          console.warn("failure verifying auth bearer token", err)
          return false
        })
    },
  }),
  (c) => {
    const user = getContext<ApiContext>().var.user

    return c.json({ protected: "SAFE", user })
  },
)

const server = serve({
  fetch: app.fetch,
  port: env.API_PORT,
})

server.once("listening", () => {
  console.log("api initialized and running on", env.API_PORT)
})

// graceful shutdown
process.on("SIGINT", () => {
  server.close()
  process.exit(0)
})
process.on("SIGTERM", () => {
  server.close((err) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    process.exit(0)
  })
})
