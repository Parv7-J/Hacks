"use client"

import type React from "react"

import { useState } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"

interface SubmitClaimProps {
  contract: ethers.Contract | null
  account: string
}

export default function SubmitClaim({ contract, account }: SubmitClaimProps) {
  const [amount, setAmount] = useState<string>("")
  const [ipfsHash, setIpfsHash] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<boolean>(false)
  const [txHash, setTxHash] = useState<string>("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!contract) {
      setError("Contract not connected")
      return
    }

    if (!amount || Number.parseFloat(amount) <= 0) {
      setError("Please enter a valid amount")
      return
    }

    // Generate a simple IPFS hash if not provided
    // In a real app, you would upload documents to IPFS and get a real hash
    const documentHash = ipfsHash || `ipfs-${Date.now()}-${account.substring(2, 8)}`

    try {
      setIsSubmitting(true)
      setError("")
      setSuccess(false)

      // Convert amount to wei (assuming input is in ETH)
      const amountInWei = ethers.parseEther(amount)

      // Call the contract method
      const tx = await contract.submitClaim(amountInWei, documentHash)
      setTxHash(tx.hash)

      // Wait for transaction to be mined
      await tx.wait()

      // Reset form and show success
      setAmount("")
      setIpfsHash("")
      setDescription("")
      setSuccess(true)
    } catch (err: any) {
      console.error("Error submitting claim:", err)
      setError(err.message || "Failed to submit claim")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {success ? (
        <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold text-green-800">Claim Submitted Successfully!</h3>
          <p className="text-green-700">Your claim has been submitted to the blockchain.</p>
          {txHash && <p className="text-sm text-green-600 break-all">Transaction Hash: {txHash}</p>}
          <Button
            onClick={() => {
              setSuccess(false)
              setTxHash("")
            }}
            className="mt-4"
          >
            Submit Another Claim
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Claim Amount (ETH)</Label>
            <Input
              id="amount"
              type="number"
              step="0.001"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Claim Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what happened and why you're filing this claim..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-gray-500">This description is stored locally and not on the blockchain.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ipfsHash">IPFS Document Hash (Optional)</Label>
            <Input
              id="ipfsHash"
              placeholder="QmXyz..."
              value={ipfsHash}
              onChange={(e) => setIpfsHash(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              If you've uploaded supporting documents to IPFS, enter the hash here.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Claim"
            )}
          </Button>
        </form>
      )}

      <Card className="p-4 bg-blue-50 border-blue-100">
        <h3 className="font-medium text-blue-800 mb-2">How it works</h3>
        <p className="text-sm text-blue-700">
          When you submit a claim, it's recorded on the blockchain. Our AI system will analyze your claim for fraud
          detection and determine the appropriate payout amount. You'll be notified once your claim has been processed.
        </p>
      </Card>
    </div>
  )
}
