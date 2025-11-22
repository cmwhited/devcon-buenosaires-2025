import cors from "@fastify/cors"
import Fastify from "fastify"

import { env } from "./env/server.ts"

const app = Fastify({
  logger: true,
  ignoreDuplicateSlashes: true,
  ignoreTrailingSlash: true,
})

app
  .register(cors, {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept", "Authorization"],
  })
  .route({
    method: "GET",
    url: "/",
    async handler() {
      return "OK"
    },
  })

async function start() {
  try {
    await app.listen({ port: env.API_PORT, host: "0.0.0.0" })
    const address = app.server.address()
    app.log.info(`api started and running on [${address}]`)
  } catch (err) {
    app.log.error("failure initializing api")
    app.log.error(err)
    process.exit(1)
  }
}

start()
