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