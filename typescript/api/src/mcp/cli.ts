#!/usr/bin/env node
import { start } from "./server.ts"

start().catch((error) => {
  console.error("Failed to start MCP server:", error)
  process.exit(1)
})
