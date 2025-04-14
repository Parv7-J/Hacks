"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ethers } from "ethers"

type ClaimStatus = "Pending" | "Approved" | "Denied" | "PaidOut" | "Unknown"

interface ClaimDetailsProps {
  claim: any // Replace 'any' with the actual type of 'claim'
  onClose: () => void
}

export default function ClaimDetails({ claim, onClose }: ClaimDetailsProps) {
  const getStatusText = (status: number): ClaimStatus => {
    const statusMap: Record<number, ClaimStatus> = {
      0: "Pending",
      1: "Approved",
      2: "Denied",
      3: "PaidOut",
    }
    return statusMap[status] || "Unknown"
  }

  const formatAmount = (amount: bigint) => {
    return ethers.formatEther(amount)
  }

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString()
  }

  const getStatusColor = (status: number): string => {
    const colorMap: Record<number, string> = {
      0: "text-yellow-600",
      1: "text-green-600",
      2: "text-red-600",
      3: "text-purple-600",
    }
    return colorMap[status] || "text-gray-600"
  }

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Claim #{claim.claimId} Details</DialogTitle>
          <DialogDescription>Submitted on {formatDate(claim.timestamp)}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Status:</span>
            <span className={`col-span-2 font-medium ${getStatusColor(claim.status)}`}>
              {getStatusText(claim.status)}
            </span>
          </div>

          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Requested:</span>
            <span className="col-span-2">{formatAmount(claim.requestedAmount)} ETH</span>
          </div>

          {claim.status !== 0 && (
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="text-sm font-medium">Approved:</span>
              <span className="col-span-2">{formatAmount(claim.approvedAmount)} ETH</span>
            </div>
          )}

          {claim.fraudScore > 0 && (
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="text-sm font-medium">Fraud Score:</span>
              <span className="col-span-2">{claim.fraudScore}/100</span>
            </div>
          )}

          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Documents:</span>
            <span className="col-span-2 text-sm break-all">{claim.ipfsDocumentHash}</span>
          </div>

          {claim.verifier && claim.verifier !== ethers.ZeroAddress && (
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="text-sm font-medium">Verified by:</span>
              <span className="col-span-2 text-sm break-all">{claim.verifier}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
