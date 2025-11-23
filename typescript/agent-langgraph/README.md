# Gas Station LangGraph Agent

LangGraph.js agent with x402-enabled MCP tool integration. This agent connects to the Gas Station MCP server and can perform cross-chain gas refills with automatic micropayments.

## Overview

This package demonstrates a simple but powerful pattern:

```
LangGraph.js Agent (this package)
    ↓ uses X402McpClient
MCP Server (typescript/api)
    ✓ Tools: /pump (paid), /quote (free)
    ✓ x402 payment integration via withX402Payment()
```

**Key Features:**

- 🤖 LangGraph.js ReAct agent with OpenAI
- 💰 Automatic x402 micropayments via ampersend-sdk
- 🔧 Two MCP tools: `pump` (paid) and `quote` (free)
- 🎨 LangGraph Studio support for visual debugging
- 🔑 Simple wallet-based payment authorization

## Prerequisites

1. **Node.js 18+** (check with `node --version`)
2. **OpenAI API Key** (get from [platform.openai.com](https://platform.openai.com))
3. **Wallet with funds** for x402 payments (polygon-amoy testnet USDC)
4. **MCP Server running** (see setup below)

## Quick Start

### 1. Install Dependencies

From the repository root:

```bash
pnpm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cd typescript/agent-langgraph
cp .env.example .env
```

Edit `.env` and add your credentials:

```bash
# OpenAI API key (required)
OPENAI_API_KEY=sk-...

# Wallet private key for signing payments (required)
CLIENT_PRIVATE_KEY=0x...

# MCP server URL (optional, defaults to http://localhost:8080/mcp)
MCP_SERVER_URL=http://localhost:8080/mcp
```

### 3. Start the MCP Server

In a separate terminal, start the Gas Station MCP server:

```bash
cd typescript/api
pnpm dev:mcp
```

The server will start on `http://localhost:8080/mcp` with two tools:

- **pump** - Cross-chain gas refill (requires x402 payment)
- **quote** - Get swap quote for ETH/USDC (free)

### 4. Run the Agent

```bash
cd typescript/agent-langgraph
pnpm dev
```

By default, the agent will query: "Get a quote for swapping 1 USDC to ETH on polygon-amoy"

You can provide a custom query:

```bash
pnpm dev "Pump $5 USDC to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e on base-sepolia"
```

## Using LangGraph Studio

LangGraph Studio provides a visual interface for debugging and interacting with your agent.

### 1. Start the MCP Server

In Terminal 1, start the MCP server:

```bash
cd typescript/api
pnpm dev:mcp
```

### 2. Launch LangGraph Studio (Web UI)

In Terminal 2, run the LangGraph CLI from your agent directory:

```bash
cd typescript/agent-langgraph
npx @langchain/langgraph-cli dev
```

This will start the local dev server and automatically open the Studio Web UI in your browser at:

```
https://smith.langchain.com/studio/?baseUrl=http://127.0.0.1:2024
```

**Note:** You'll need to log in with your LangSmith account (free accounts work).

**Safari Users:** Safari blocks localhost connections. Use the `--tunnel` flag instead:

```bash
npx @langchain/langgraph-cli dev --tunnel
```

### 3. Interact with Your Agent

1. The Studio Web UI will load your graph from `langgraph.json`
2. Type queries in the chat interface
3. View execution flow in the graph visualization
4. Inspect tool calls, x402 payments, and responses
5. Debug individual nodes and replay from checkpoints

### Alternative: Desktop App (Mac Only)

If you prefer the desktop app (requires Apple Silicon Mac and Docker):

- Install via Homebrew: `brew install --cask langgraph-studio`
- Or download from: [studio.langchain.com](https://studio.langchain.com/)
- Open the `typescript/agent-langgraph/` directory in the app

The **Web UI method is recommended** as it works on all platforms and doesn't require Docker.

## How It Works

### Payment Flow

1. **User Query** → Agent receives a query (e.g., "Pump gas to address X")
2. **Tool Selection** → LLM decides to call the `pump` tool
3. **MCP Call** → Agent calls MCP server's `pump` tool
4. **402 Response** → Server returns 402 with payment requirements
5. **Auto Payment** → X402McpClient automatically:
   - Consults treasurer (NaiveTreasurer auto-approves)
   - Signs payment with wallet
   - Retries request with payment
6. **Execution** → Server verifies payment and executes pump operation
7. **Response** → Agent receives result and responds to user

### Architecture

**src/mcp-client.ts**

- Creates X402-aware MCP client
- Configures AccountWallet from private key
- Sets up NaiveTreasurer for auto-approval
- Connects to MCP server via HTTP Stream transport

**src/agent.ts**

- Main CLI entry point
- Loads MCP tools via @langchain/mcp-adapters
- Creates LangGraph ReAct agent with OpenAI
- Handles command-line queries

**src/graph.ts**

- Exports graph for LangGraph Studio
- Same setup as agent.ts but as module export
- Used by Studio for visual debugging

## Available MCP Tools

### pump (Paid)

**Description:** Cross-chain gas refill - swap USDC to ETH and bridge to target chain

**Parameters:**

- `amount` (string) - USDC amount (e.g., "5.00")
- `network` (string) - Target network: "base-sepolia", "sepolia", or "polygon-amoy"
- `targetAddress` (string) - Wallet address to receive gas (0x...)

**Payment:** Dynamic pricing based on amount and network

**Example:**

```
"Pump $10 USDC to 0x123... on base-sepolia"
```

### quote (Free)

**Description:** Get swap quote for ETH/USDC conversion

**Parameters:**

- `network` (string) - Network for swap quote
- `amountIn` (string) - Amount of input token
- `tokenIn` (string) - "ETH" or "USDC"
- `tokenOut` (string) - "ETH" or "USDC"

**Payment:** None (free)

**Example:**

```
"Get a quote for swapping 1 ETH to USDC on polygon-amoy"
```

## Development

### Build

```bash
pnpm build
```

Builds to `dist/agent.mjs` using tsdown.

### Run Built Version

```bash
pnpm start
```

### Type Check

```bash
pnpm typecheck
```

### Lint & Format

```bash
pnpm lint
pnpm format
```

## Troubleshooting

### "Missing required environment variables"

Make sure you've created `.env` with `OPENAI_API_KEY` and `CLIENT_PRIVATE_KEY`.

### "Failed to connect to MCP server"

Check that the MCP server is running:

```bash
cd typescript/api
pnpm dev:mcp
```

### "Payment failed" or "Insufficient funds"

Your wallet needs testnet USDC on polygon-amoy. Get some from:

- [Polygon Amoy Faucet](https://faucet.polygon.technology/)
- Swap for USDC on a testnet DEX

### "OpenAI API error"

Verify your OpenAI API key is valid and has credits.

## Next Steps

- **Customize the agent** - Modify `src/agent.ts` to change LLM model or add system prompts
- **Add custom tools** - Extend the MCP server with your own tools
- **Change payment logic** - Replace NaiveTreasurer with custom authorization logic
- **Deploy to production** - Build and deploy as a service

## Learn More

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Ampersend SDK](https://github.com/edgeandnode/ampersend-sdk)
- [x402 Payment Protocol](https://docs.x402.org/)
