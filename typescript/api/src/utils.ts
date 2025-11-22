import { PumpOperationData } from "./pump.ts"

export function logPumpOperation(operation: PumpOperationData) {
  console.log("\n=== PUMP OPERATION COMPLETE ===")
  console.log(`Source Address: ${operation.sourceAddress}`)
  console.log(`Source Network: ${operation.sourceNetwork}`)
  console.log(`Target Address: ${operation.targetAddress}`)
  console.log(`Target Network: ${operation.targetNetwork}`)
  console.log(`USDC Amount: $${operation.usdcAmount}`)
  console.log(`ETH Amount: ${operation.ethAmount}`)
  console.log("\nTransactions:")
  console.log(`  Swap: ${operation.transactions.swap.hash} (${operation.transactions.swap.status})`)
  console.log(`  Bridge: ${operation.transactions.bridge.hash} (${operation.transactions.bridge.status})`)
  console.log(`  Transfer: ${operation.transactions.transfer.hash} (${operation.transactions.transfer.status})`)
  console.log(`  Settlement: ${operation.transactions.settlement?.hash} (${operation.transactions.settlement?.status})`)
  console.log("==============================\n")
}

export function logServerBoot() {
  console.clear();

  console.log("%c====================================================",
    "color:#0ff; font-size:12px");
  console.log("%c      ⛽🚀  GAS STATION ONLINE  🚀⛽",
    "color:#fff; background:#ff0066; font-size:22px; padding:8px 16px; font-weight:bold;");
  console.log("%c====================================================\n",
    "color:#0ff; font-size:12px");

  // Boot Stage 1
  console.log("%c🔧 Igniting cross-chain engines…",
    "color:#00eaff; font-size:16px; font-weight:bold;");

  // Boot Stage 2
  console.log("%c🛢️ Loading gas barrels into the pipeline…",
    "color:#ffcc00; font-size:16px; font-weight:bold;");

  // Boot Stage 3
  console.log("%c🌉 Activating bridge conduits…",
    "color:#9d4dff; font-size:16px; font-weight:bold;");

  // Boot Stage 4
  console.log("%c🚨 Pressurizing gas pumps…",
    "color:#ff4444; font-size:18px; font-weight:bold; text-shadow:1px 1px #000;");

  // FINAL ACTIVATION
  console.log("%c🔥 ALL SYSTEMS GO — READY TO PUMP GAS ACROSS THE MULTICHAIN 🔥",
    "background:linear-gradient(to right, #ff0066, #ff9900); color:white; font-size:20px; padding:10px 14px; font-weight:bold; border-radius:6px;");

  // Tagline
  console.log("%c⛽ Serving premium, unleaded, cross-chain liquidity since block zero.",
    "color:#0ff; font-size:14px; font-style:italic; margin-top:12px;");

  console.log("\n")
}