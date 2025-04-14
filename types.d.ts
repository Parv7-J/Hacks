interface Window {
  ethereum: any
}

interface ClaimData {
  claimId: number
  policyholder: string
  requestedAmount: bigint
  approvedAmount: bigint
  fraudScore: number
  status: number
  timestamp: bigint
  ipfsDocumentHash: string
  verifier: string
}

type ClaimStatus = "Pending" | "Approved" | "Denied" | "PaidOut"

interface ClaimDetailsProps {
  claim: ClaimData
  onClose: () => void
}
