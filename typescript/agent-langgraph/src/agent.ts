import "dotenv/config"
import { createReactAgent } from "@langchain/langgraph/prebuilt"
import { loadMcpTools } from "@langchain/mcp-adapters"
import { ChatOpenAI } from "@langchain/openai"

import { createMcpClient } from "./mcp-client.ts"

async function main() {
  const openaiKey = process.env.OPENAI_API_KEY

  if (!openaiKey) {
    console.error("Missing required environment variables:")
    console.error("  OPENAI_API_KEY - OpenAI API key")
    console.error("  CLIENT_PRIVATE_KEY - Wallet private key (must start with 0x)")
    process.exit(1)
  }

  // Create MCP client with x402 payment support
  const client = await createMcpClient()

  try {
    // Load MCP tools (pump and quote)
    const tools = await loadMcpTools("gas-station", client as any, {
      throwOnLoadError: true,
      prefixToolNameWithServerName: false,
    })

    console.log(`✓ Loaded ${tools.length} MCP tools:`)
    tools.forEach((tool) => {
      console.log(`  - ${tool.name}: ${tool.description}`)
    })

    // Create LangChain agent with OpenAI
    const model = new ChatOpenAI({
      apiKey: openaiKey,
      modelName: "gpt-4o-mini",
      temperature: 0,
    })

    const agent = createReactAgent({ llm: model, tools })

    // Get query from command line or use default
    const args = process.argv.slice(2).filter((arg) => arg !== "--")
    const defaultQuery = "Get a quote for swapping 1 USDC to ETH on polygon-amoy"
    const query = args.length > 0 ? args.join(" ") : defaultQuery

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`Query: ${query}`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

    console.log("Invoking agent...\n")

    const response = await agent.invoke({
      messages: [{ role: "user", content: query }],
    })

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("Agent Response:")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    console.log(response.messages[response.messages.length - 1].content)
    console.log()
  } finally {
    // Cleanup
    await client.close()
    console.log("✓ Disconnected from MCP server")
  }
}

main().catch((error) => {
  console.error("\n❌ Error:", error)
  process.exit(1)
})
