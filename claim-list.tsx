"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, RefreshCw, Eye } from "lucide-react"
import ClaimDetails from "./claim-details"

// Define the ClaimData interface
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

// Define the ClaimStatus type
type ClaimStatus = "Pending" | "Approved" | "Denied" | "PaidOut" | "Unknown"

interface ClaimsListProps {
  contract: ethers.Contract | null
  account: string
}

export default function ClaimsList({ contract, account }: ClaimsListProps) {
  const [claims, setClaims] = useState<ClaimData[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>("")
  const [selectedClaim, setSelectedClaim] = useState<ClaimData | null>(null)

  useEffect(() => {
    if (contract && account) {
      fetchClaims()
    }
  }, [contract, account])

  const fetchClaims = async () => {
    if (!contract || !account) return

    try {
      setLoading(true)
      setError("")

      // Get claim IDs for the connected account
      const claimIds = await contract.getPolicyholderClaimIds(account)

      // Fetch details for each claim
      const claimsData: ClaimData[] = []

      for (let i = 0; i < claimIds.length; i++) {
        const claimId = claimIds[i]
        const claimDetails = await contract.getClaimDetails(claimId)

        claimsData.push({
          claimId: Number(claimId),
          policyholder: claimDetails[0],
          requestedAmount: claimDetails[1],
          approvedAmount: claimDetails[2],
          fraudScore: Number(claimDetails[3]),
          status: Number(claimDetails[4]),
          timestamp: claimDetails[5],
          ipfsDocumentHash: claimDetails[6],
          verifier: claimDetails[7],
        })
      }

      // Sort claims by timestamp (newest first)
      claimsData.sort((a, b) => Number(b.timestamp - a.timestamp))

      setClaims(claimsData)
    } catch (err: any) {
      console.error("Error fetching claims:", err)
      setError(err.message || "Failed to fetch claims")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: number) => {
    const statusMap: Record<number, { label: ClaimStatus; color: string }> = {
      0: { label: "Pending", color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
      1: { label: "Approved", color: "bg-green-100 text-green-800 hover:bg-green-100" },
      2: { label: "Denied", color: "bg-red-100 text-red-800 hover:bg-red-100" },
      3: { label: "PaidOut", color: "bg-purple-100 text-purple-800 hover:bg-purple-100" },
    }

    const { label, color } = statusMap[status] || {
      label: "Unknown",
      color: "bg-gray-100 text-gray-800 hover:bg-gray-100",
    }

    return (
      <Badge className={color} variant="outline">
        {label}
      </Badge>
    )
  }

  const formatAmount = (amount: bigint) => {
    return ethers.formatEther(amount)
  }

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Your Claims</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchClaims}
          disabled={loading}
          className="flex items-center gap-1"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : claims.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-gray-50">
          <p className="text-gray-500">You haven't submitted any claims yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map((claim) => (
            <Card key={claim.claimId} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">Claim #{claim.claimId}</h4>
                    {getStatusBadge(claim.status)}
                  </div>
                  <p className="text-sm text-gray-500">Submitted: {formatDate(claim.timestamp)}</p>
                  <p className="text-sm">
                    Amount: <span className="font-medium">{formatAmount(claim.requestedAmount)} ETH</span>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedClaim(claim)}
                  className="flex items-center gap-1"
                >
                  <Eye className="h-3 w-3" />
                  Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedClaim && <ClaimDetails claim={selectedClaim} onClose={() => setSelectedClaim(null)} />}
    </div>
  )
}
