import "dotenv/config"
import { loadMcpTools } from "@langchain/mcp-adapters"
import { ChatOpenAI } from "@langchain/openai"
import { createReactAgent } from "@langchain/langgraph/prebuilt"
import { createMcpClient } from "./mcp-client.ts"

// Initialize and export the graph for LangGraph Studio
let graphPromise: ReturnType<typeof createReactAgent> | null = null

async function initializeGraph() {
  const openaiKey = process.env.OPENAI_API_KEY

  if (!openaiKey) {
    throw new Error("OPENAI_API_KEY environment variable is required")
  }

  // Create MCP client with x402 payment support
  const client = await createMcpClient()

  // Load MCP tools (pump and quote)
  const tools = await loadMcpTools("gas-station", client as any, {
    throwOnLoadError: true,
    prefixToolNameWithServerName: false,
  })

  console.log(`Loaded ${tools.length} MCP tools for LangGraph Studio`)

  // Create LangChain agent with OpenAI
  const model = new ChatOpenAI({
    apiKey: openaiKey,
    modelName: "gpt-4o-mini",
    temperature: 0,
  })

  return createReactAgent({ llm: model, tools })
}

// Export graph for LangGraph Studio
// Studio will call this to get the graph instance
export const graph = await initializeGraph()
