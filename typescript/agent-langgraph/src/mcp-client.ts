import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"
import { Client } from "@edgeandnode/ampersend-sdk/mcp/client"
import { AccountWallet, NaiveTreasurer } from "@edgeandnode/ampersend-sdk/x402"

export async function createMcpClient() {
  const serverUrl = process.env.MCP_SERVER_URL || "http://localhost:8080/mcp"
  const privateKey = process.env.CLIENT_PRIVATE_KEY

  if (!privateKey) {
    throw new Error("CLIENT_PRIVATE_KEY environment variable is required")
  }

  if (!privateKey.startsWith("0x")) {
    throw new Error("CLIENT_PRIVATE_KEY must start with 0x")
  }

  console.log(`Connecting to MCP server at ${serverUrl}`)

  // Setup payment wallet and treasurer
  const wallet = AccountWallet.fromPrivateKey(privateKey as `0x${string}`)
  const treasurer = new NaiveTreasurer(wallet)

  // Create X402 MCP client with payment support
  const client = new Client(
    { name: "gas-station-agent", version: "1.0.0" },
    {
      mcpOptions: { capabilities: { tools: {} } },
      treasurer,
    },
  )

  // Connect to MCP server
  const transport = new StreamableHTTPClientTransport(new URL(serverUrl))
  await client.connect(transport as any)

  console.log("✓ Connected to MCP server")

  return client
}
