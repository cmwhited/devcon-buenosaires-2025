import { createSigner, decodeXPaymentResponse, type Hex, wrapFetchWithPayment } from "x402-fetch"

const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex
const API_URL = process.env.API_URL || "http://localhost:4000/api/hello"
const NETWORK = "polygon-amoy"

async function testHelloEndpoint() {
  console.log("🔐 Creating signer for", NETWORK)
  const signer = await createSigner(NETWORK, PRIVATE_KEY)

  console.log("🔗 Wrapping fetch with payment handler...")
  const fetchWithPayment = wrapFetchWithPayment(fetch, signer)

  console.log(`📡 Calling ${API_URL}...`)
  console.log("   (This will handle 402, sign payment, and retry automatically)")

  const response = await fetchWithPayment(API_URL, { method: "GET" })

  console.log("\n✅ Response received!")
  console.log("   Status:", response.status, response.statusText)

  const body = await response.json()
  console.log("   Body:", body)

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

testHelloEndpoint().catch((error) => {
  console.error("\n❌ Error:", error?.response?.data?.error ?? error.message ?? error)
  process.exit(1)
})
