import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { prettyJSON } from "hono/pretty-json"

import { env } from "./env/server.ts"

const app = new Hono()

app.use(logger())
app.use(prettyJSON())
app.use(
  "/api/*",
  cors({
    allowHeaders: ["Content-Type", "Accept", "Authorization", "User-Agent"],
    allowMethods: ["POST", "GET", "PUT", "PATCH", "DELETE", "OPTIONS"],
    origin: ["http://localhost:3000"],
  }),
)
app.get("/", (c) => c.json({ status: "OK" }))

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
