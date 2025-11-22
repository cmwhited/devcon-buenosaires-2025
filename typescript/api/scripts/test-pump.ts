import { config } from "dotenv"
import { createSigner, decodeXPaymentResponse, type Hex, wrapFetchWithPayment } from "x402-fetch"

config()
const CLIENT_PRIVATE_KEY = process.env.CLIENT_PRIVATE_KEY as Hex
if (!CLIENT_PRIVATE_KEY) {
  throw new Error("CLIENT_PRIVATE_KEY is not set")
}
const API_URL = process.env.API_URL || "http://localhost:4000"
const NETWORK = process.env.X402_NETWORK || "polygon-amoy"

// Test parameters
const TEST_AMOUNT = "0.05" // $0.05 USDC
const TEST_TARGET_NETWORK = "base-sepolia"
const TEST_TARGET_ADDRESS = "0x1234567890123456789012345678901234567890" // Replace with actual address

async function testPumpEndpoint() {
  console.log("🔐 Creating signer for", NETWORK)
  const signer = await createSigner(NETWORK, CLIENT_PRIVATE_KEY)

  console.log("🔗 Wrapping fetch with payment handler...")
  const fetchWithPayment = wrapFetchWithPayment(fetch, signer)

  const url = `${API_URL}/api/pump`
  const requestBody = {
    amount: TEST_AMOUNT,
    network: TEST_TARGET_NETWORK,
    targetAddress: TEST_TARGET_ADDRESS,
  }

  console.log(`📡 Calling ${url}...`)
  console.log(`   Amount: $${TEST_AMOUNT} USDC`)
  console.log(`   Target Network: ${TEST_TARGET_NETWORK}`)
  console.log(`   Target Address: ${TEST_TARGET_ADDRESS}`)
  console.log("   (This will handle 402, sign payment, and retry automatically)")

  const response = await fetchWithPayment(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  })

  console.log("\n✅ Response received!")
  console.log("   Status:", response.status, response.statusText)

  const body = await response.json()
  console.log("\n📦 Response Body:")
  console.log(JSON.stringify(body, null, 2))

  // Check for payment response header
  const paymentHeader = response.headers.get("x-payment-response")
  if (paymentHeader) {
    const paymentDetails = decodeXPaymentResponse(paymentHeader)
    console.log("\n💰 Payment Details:")
    console.log("   Success:", paymentDetails.success)
    console.log("   Transaction:", paymentDetails.transaction)
    console.log("   Network:", paymentDetails.network)
    console.log("   Payer:", paymentDetails.payer)
  }
}

testPumpEndpoint().catch((error) => {
  console.error("\n❌ Error:", error?.response?.data?.error ?? error.message ?? error)
  process.exit(1)
})
