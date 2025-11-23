export interface PumpParams {
  amount: string
  network: string
  targetAddress: string
}

export interface PumpOperationData {
  sourceAddress?: string
  sourceNetwork: string
  targetAddress: string
  targetNetwork: string
  usdcAmount: string
  ethAmount: number
  transactions: {
    swap: { network: string; hash: string; status: string }
    bridge: { network: string; hash: string; status: string }
    transfer: { network: string; hash: string; status: string }
    settlement?: { network: string; hash: string; status: string }
  }
}
