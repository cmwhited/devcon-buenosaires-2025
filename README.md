# Pit Stop - Cross-Chain Gas Station

> Running on fumes? We'll get you back on the road. One-click gas delivery to any wallet, any chain.

**Devcon Buenos Aires 2025 Hackathon Project**

## Overview

Pit Stop is a cross-chain gas station that solves one of crypto's most frustrating problems: running out of gas on a new chain. With one click, users can refill gas on any supported chain without complex bridging, swapping, or manual transfers.

### The Problem

You're trying to use a dApp on Base, but you have zero ETH for gas. You have USDC on Polygon. Now you need to:
1. Find a bridge
2. Bridge USDC to Base
3. Find a DEX
4. Swap USDC to ETH
5. Hope you calculated the amounts correctly

**That's 5+ transactions and 15+ minutes of frustration.**

### Our Solution

1. **Pull in.** Connect your wallet. No paperwork needed.
2. **Pick your chain.** Choose Base, Ethereum, or Polygon. Set your fill amount.
3. **Pump & go.** We handle the rest. Back on the road in seconds.

## Features

### Core Functionality

- **One-Click Gas Refills**: Pay with USDC on any chain, receive gas on your target chain
- **Automated Cross-Chain Bridging**: Uses Circle's CCTP for secure, fast USDC transfers
- **Automatic Token Swaps**: Converts USDC to native ETH using Uniswap
- **Multi-Chain Support**: Currently servicing Base Sepolia, Ethereum Sepolia, and Polygon Amoy
- **Real-Time Transaction Tracking**: Monitor your gas refills in real-time

### Autonomous Gas Station

The backend includes an autonomous gas station that:
- Monitors gas balances across all supported chains
- Automatically refills when balances drop below threshold
- Manages liquidity across chains efficiently
- Bridges and swaps USDC to ETH as needed

### AI Agent Integration

Built-in MCP (Model Context Protocol) server enables AI agents to:
- **Pump gas** to any chain programmatically
- **Get swap quotes** for ETH/USDC conversions
- Pay with x402 protocol (HTTP 402 Payment Required)

## Technology Stack

### Frontend (Pitstop)

- **Next.js 16** with React 19 - Latest React features including the React Compiler
- **TailwindCSS 4** - Modern, utility-first styling
- **Privy** - Seamless wallet authentication
- **Wagmi v3** - Type-safe Ethereum interactions
- **ElectricSQL** - Real-time transaction syncing
- **Base UI Components** - Accessible, headless UI primitives
- **Phosphor Icons** - Beautiful, consistent iconography

### Backend (API)

- **Hono** - Ultra-fast edge-compatible web framework
- **Viem v2** - Modern Ethereum library with full TypeScript support
- **Coinbase CDP SDK** - Secure wallet management and account abstraction
- **Circle BridgeKit** - Cross-chain USDC transfers via CCTP
- **Uniswap SDK** - Optimal swap routing and execution
- **x402 Protocol** - HTTP 402 Payment Required for monetized APIs
- **FastMCP** - MCP server for AI agent integration

### Infrastructure

- **Edge and Node AMP** - Real-time blockchain data streaming and querying
- **PostgreSQL** - Transaction and state persistence
- **Docker Compose** - Local development environment

## Architecture

```
┌─────────────────┐
│   Pitstop UI    │  Next.js frontend with real-time updates powered by amp
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   API Server    │  Hono/Fastify backend
├─────────────────┤
│ • Gas Station   │  Automated monitoring & refilling
│ • MCP Server    │  AI agent tools (pump, quote)
│ • x402 Payment  │  Monetized API endpoints
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Blockchain Integrations             │
├──────────────────────────────────────┤
│ • Coinbase CDP  │  Wallet management │
│ • Circle CCTP   │  Cross-chain USDC  │
│ • Uniswap       │  Token swaps       │
│ • Viem          │  Chain interactions│
└─────────────────────────────────────┘
```

## How It Works

### User Flow

1. **User Request**: User wants gas on Base but has USDC on Polygon
2. **Payment**: User pays in USDC on Polygon via x402 protocol
3. **Bridge**: System bridges USDC from Polygon to Base using Circle CCTP
4. **Swap**: Automatically swaps USDC to ETH on Base via Uniswap
5. **Deliver**: Transfers ETH to user's wallet
6. **Confirm**: User sees real-time transaction updates

### Autonomous Gas Station

The gas station runs continuously to ensure liquidity:

```typescript
// Monitors ETH balances across chains
async function runGasStationCheck() {
  // 1. Check Polygon USDC balance (our source of funds)
  // 2. Check ETH balances on all chains
  // 3. If balance < threshold:
  //    - Bridge USDC from Polygon to target chain
  //    - Swap USDC to ETH on target chain
  // 4. Repeat for all chains needing refills
}
```

### MCP Integration

AI agents can use Pit Stop as a tool:

```typescript
// AI agent calls the pump tool
const result = await mcp.call('pump', {
  amount: '5.00',              // USDC amount
  network: 'base-sepolia',     // Target chain
  targetAddress: '0x...',      // Recipient
  // Pays with x402 protocol
})
```

## Supported Networks

- **Base Sepolia** - Coinbase's L2 testnet
- **Ethereum Sepolia** - Ethereum testnet
- **Polygon Amoy** - Polygon testnet

Mainnet support coming soon!

## Project Structure

```
devcon-buenosaires-2025/
├── typescript/
│   ├── api/              # Backend API server
│   │   ├── src/
│   │   │   ├── gas-station.ts    # Autonomous gas monitoring
│   │   │   ├── mcp/              # MCP server for AI agents
│   │   │   ├── shared/
│   │   │   │   ├── pump.ts       # Core gas pump logic
│   │   │   │   ├── swap.ts       # Uniswap integration
│   │   │   │   └── x402.ts       # Payment protocol
│   │   │   └── server.ts         # Hono API server
│   │   └── package.json
│   └── pitstop/          # Next.js frontend
│       ├── app/
│       ├── Components/
│       └── package.json
├── infra/                # Infrastructure (PostgreSQL)
├── amp.config.ts         # AMP dataset configuration
└── docker-compose.yml    # Local development setup
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 10.23.0+
- Docker (for local development)

### Installation

```bash
# Install dependencies
pnpm install

# Start infrastructure (PostgreSQL)
docker-compose up -d

# Start development servers
pnpm dev
```

This starts:
- Frontend: http://localhost:3001
- API Server: http://localhost:3000
- MCP Server: http://localhost:3000/mcp

### Configuration

Create a `.env` file with:

```env
# API Keys
CDP_API_KEY_ID=your_coinbase_cdp_key
CDP_API_KEY_SECRET=your_coinbase_cdp_secret
CDP_WALLET_SECRET=your_wallet_secret

# RPC Endpoints
BASE_SEPOLIA_RPC=your_base_rpc
ETHEREUM_SEPOLIA_RPC=your_eth_rpc
POLYGON_AMOY_RPC=your_polygon_rpc

# Authentication
PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_secret

# x402 Configuration
X402_NETWORK=base-sepolia
X402_FACILITATOR_URL=https://facilitator.x402.dev
```

## Use Cases

### For Users

- **New chain onboarding**: Get gas instantly when trying a new chain
- **Emergency refills**: Stuck in the middle of a DeFi operation? Get gas fast
- **Cross-chain operations**: Move value and gas in one transaction

### For Developers

- **DApp gas sponsorship**: Pay for your users' gas to improve UX
- **Multi-chain testing**: Quickly get gas on multiple testnets
- **Integration**: Add gas refill buttons to your DApp

### For AI Agents

- **Autonomous operations**: Agents can manage their own gas across chains
- **Pay-per-use**: x402 protocol enables usage-based pricing
- **Tool integration**: MCP makes Pit Stop accessible to any AI agent

## Hackathon Highlights

### Innovation

- **First-of-its-kind** cross-chain gas station with autonomous monitoring
- **x402 integration** for monetized API access
- **MCP server** enabling AI agents to manage cross-chain gas
- **Real-time updates** via ElectricSQL sync

### Technical Achievement

- Full-stack TypeScript with latest frameworks (Next.js 16, React 19)
- Complex multi-chain orchestration (bridging + swapping)
- Production-ready error handling and retry logic
- Type-safe end-to-end with Zod validation

### User Experience

- One-click solution to a universal problem
- Real-time transaction tracking
- Clean, intuitive interface
- Seamless wallet integration with Privy

## Future Roadmap

- [ ] Mainnet deployment (Base, Ethereum, Polygon)
- [ ] Additional chains (Arbitrum, Optimism, Avalanche)
- [ ] Gasless refills (meta-transactions)
- [ ] Subscription plans for frequent users
- [ ] Gas limit predictions and recommendations
- [ ] Mobile app (React Native)

## Team

Built with passion for Devcon Buenos Aires 2025

## License

MIT

---

**Built with**: Base, Polygon, Circle CCTP, Coinbase CDP, Uniswap, x402, AMP, Privy, Next.js

**Hackathon**: Devcon Buenos Aires 2025
