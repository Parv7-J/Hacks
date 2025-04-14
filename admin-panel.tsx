"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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

interface AdminPanelProps {
  contract: ethers.Contract | null
}

export default function AdminPanel({ contract }: AdminPanelProps) {
  const [allClaims, setAllClaims] = useState<ClaimData[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>("")
  const [selectedClaimId, setSelectedClaimId] = useState<string>("")
  const [fraudScore, setFraudScore] = useState<number>(50)
  const [approvedAmount, setApprovedAmount] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [fraudThreshold, setFraudThreshold] = useState<number>(70)
  const [fundAmount, setFundAmount] = useState<string>("")
  const [withdrawAmount, setWithdrawAmount] = useState<string>("")
  const [contractBalance, setContractBalance] = useState<string>("0")

  useEffect(() => {
    if (contract) {
      fetchContractData()
    }
  }, [contract])

  const fetchContractData = async () => {
    if (!contract) return

    try {
      setLoading(true)
      setError("")

      // Get fraud threshold
      const threshold = await contract.fraudScoreThreshold()
      setFraudThreshold(Number(threshold))

      // Get contract balance
      const balance = await contract.getContractBalance()
      setContractBalance(ethers.formatEther(balance))

      // Get total claims count
      const totalClaims = await contract.totalClaims()

      // Fetch all claims
      const claimsData: ClaimData[] = []

      for (let i = 0; i < Number(totalClaims); i++) {
        const claimDetails = await contract.claims(i)

        claimsData.push({
          claimId: Number(claimDetails[0]),
          policyholder: claimDetails[1],
          requestedAmount: claimDetails[2],
          approvedAmount: claimDetails[3],
          fraudScore: Number(claimDetails[4]),
          status: Number(claimDetails[5]),
          timestamp: claimDetails[6],
          ipfsDocumentHash: claimDetails[7],
          verifier: claimDetails[8],
        })
      }

      // Sort claims by timestamp (newest first)
      claimsData.sort((a, b) => Number(b.timestamp - a.timestamp))

      setAllClaims(claimsData)
    } catch (err: any) {
      console.error("Error fetching contract data:", err)
      setError(err.message || "Failed to fetch contract data")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyClaim = async () => {
    if (!contract || !selectedClaimId) return

    try {
      setIsProcessing(true)
      setError("")

      const claimId = Number.parseInt(selectedClaimId)

      // Get claim details to get the requested amount
      const claimDetails = await contract.getClaimDetails(claimId)
      const requestedAmount = claimDetails[1]

      // Calculate approved amount based on fraud score
      // If fraud score is high, reduce the approved amount
      const approvedAmountValue = approvedAmount
        ? ethers.parseEther(approvedAmount)
        : fraudScore > 50
          ? (requestedAmount * BigInt(Math.floor((100 - fraudScore) * 2))) / BigInt(100)
          : requestedAmount

      // Call the contract method
      const tx = await contract.verifyClaim(claimId, fraudScore, approvedAmountValue)

      // Wait for transaction to be mined
      await tx.wait()

      // Refresh data
      await fetchContractData()

      // Reset form
      setSelectedClaimId("")
      setFraudScore(50)
      setApprovedAmount("")
    } catch (err: any) {
      console.error("Error verifying claim:", err)
      setError(err.message || "Failed to verify claim")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAdminOverride = async (claimId: number, approved: boolean) => {
    if (!contract) return

    try {
      setIsProcessing(true)
      setError("")

      // Get claim details to get the requested amount
      const claimDetails = await contract.getClaimDetails(claimId)
      const requestedAmount = claimDetails[1]

      // Call the contract method
      const tx = await contract.adminOverrideClaim(claimId, approved, approved ? requestedAmount : 0)

      // Wait for transaction to be mined
      await tx.wait()

      // Refresh data
      await fetchContractData()
    } catch (err: any) {
      console.error("Error overriding claim:", err)
      setError(err.message || "Failed to override claim")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExecutePayout = async (claimId: number) => {
    if (!contract) return

    try {
      setIsProcessing(true)
      setError("")

      // Call the contract method
      const tx = await contract.executePayout(claimId)

      // Wait for transaction to be mined
      await tx.wait()

      // Refresh data
      await fetchContractData()
    } catch (err: any) {
      console.error("Error executing payout:", err)
      setError(err.message || "Failed to execute payout")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUpdateThreshold = async () => {
    if (!contract) return

    try {
      setIsProcessing(true)
      setError("")

      // Call the contract method
      const tx = await contract.updateFraudScoreThreshold(fraudThreshold)

      // Wait for transaction to be mined
      await tx.wait()

      // Refresh data
      await fetchContractData()
    } catch (err: any) {
      console.error("Error updating threshold:", err)
      setError(err.message || "Failed to update threshold")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFundContract = async () => {
    if (!contract || !fundAmount) return

    try {
      setIsProcessing(true)
      setError("")

      // Call the contract method
      const tx = await contract.fundContract({
        value: ethers.parseEther(fundAmount),
      })

      // Wait for transaction to be mined
      await tx.wait()

      // Refresh data
      await fetchContractData()

      // Reset form
      setFundAmount("")
    } catch (err: any) {
      console.error("Error funding contract:", err)
      setError(err.message || "Failed to fund contract")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleWithdrawFunds = async () => {
    if (!contract || !withdrawAmount) return

    try {
      setIsProcessing(true)
      setError("")

      // Call the contract method
      const tx = await contract.withdrawFunds(ethers.parseEther(withdrawAmount))

      // Wait for transaction to be mined
      await tx.wait()

      // Refresh data
      await fetchContractData()

      // Reset form
      setWithdrawAmount("")
    } catch (err: any) {
      console.error("Error withdrawing funds:", err)
      setError(err.message || "Failed to withdraw funds")
    } finally {
      setIsProcessing(false)
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

  return (
    <Tabs defaultValue="claims" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="claims">Manage Claims</TabsTrigger>
        <TabsTrigger value="verify">Verify Claims</TabsTrigger>
        <TabsTrigger value="settings">Contract Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="claims">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">All Claims</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchContractData}
              disabled={loading || isProcessing}
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
            <p>Loading claims...</p>
          ) : allClaims.length === 0 ? (
            <div className="text-center p-8 border rounded-lg bg-gray-50">
              <p className="text-gray-500">No claims have been submitted yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allClaims.map((claim) => (
                <Card key={claim.claimId} className="p-4">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">laim #{claim.claimId}</h4>
                        {getStatusBadge(claim.status)}
                      </div>
                      <p className="text-sm">
                        From:{" "}
                        <span className="font-mono text-xs">
                          {claim.policyholder.slice(0, 10)}...{claim.policyholder.slice(-8)}
                        </span>
                      </p>
                      <p className="text-sm">
                        Requested: <span className="font-medium">{ethers.formatEther(claim.requestedAmount)} ETH</span>
                      </p>
                      {claim.status !== 0 && (
                        <p className="text-sm">
                          Approved: <span className="font-medium">{ethers.formatEther(claim.approvedAmount)} ETH</span>
                        </p>
                      )}
                      {claim.fraudScore > 0 && (
                        <p className="text-sm">
                          Fraud Score: <span className="font-medium">{claim.fraudScore}/100</span>
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 items-start">
                      {claim.status === 0 && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAdminOverride(claim.claimId, true)}
                            disabled={isProcessing}
                            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAdminOverride(claim.claimId, false)}
                            disabled={isProcessing}
                            className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800"
                          >
                            Deny
                          </Button>
                        </>
                      )}

                      {claim.status === 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExecutePayout(claim.claimId)}
                          disabled={isProcessing}
                          className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:text-purple-800"
                        >
                          Execute Payout
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              ))}
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="verify">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="claimId">Claim ID</Label>
              <Input
                id="claimId"
                type="number"
                min="0"
                placeholder="Enter claim ID"
                value={selectedClaimId}
                onChange={(e) => setSelectedClaimId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="fraudScore">Fraud Score: {fraudScore}</Label>
                <span className="text-sm text-gray-500">
                  {fraudScore < fraudThreshold ? "Will Approve" : "Will Deny"}
                </span>
              </div>
              <Slider
                id="fraudScore"
                min={0}
                max={100}
                step={1}
                value={[fraudScore]}
                onValueChange={(value) => setFraudScore(value[0])}
              />
              <p className="text-xs text-gray-500">0 = Not fraudulent, 100 = Highly fraudulent</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="approvedAmount">Approved Amount (ETH, optional)</Label>
              <Input
                id="approvedAmount"
                type="number"
                step="0.001"
                min="0"
                placeholder="Leave empty to calculate automatically"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value)}
              />
              <p className="text-xs text-gray-500">If left empty, amount will be calculated based on fraud score</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Button onClick={handleVerifyClaim} disabled={!selectedClaimId || isProcessing} className="w-full">
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Verify Claim"
              )}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="settings">
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-medium">Fraud Threshold Settings</h3>
              <div className="space-y-2">
                <Label htmlFor="threshold">Fraud Score Threshold: {fraudThreshold}</Label>
                <Slider
                  id="threshold"
                  min={0}
                  max={100}
                  step={1}
                  value={[fraudThreshold]}
                  onValueChange={(value) => setFraudThreshold(value[0])}
                />
                <p className="text-xs text-gray-500">
                  Claims with fraud scores above this threshold will be automatically denied
                </p>
              </div>

              <Button onClick={handleUpdateThreshold} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Threshold"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-medium">Contract Funds</h3>
              <p className="text-sm">
                Current Balance: <span className="font-medium">{contractBalance} ETH</span>
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fundAmount">Fund Amount (ETH)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="fundAmount"
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="0.00"
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                    />
                    <Button onClick={handleFundContract} disabled={!fundAmount || isProcessing}>
                      Fund
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="withdrawAmount">Withdraw Amount (ETH)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="withdrawAmount"
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="0.00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                    <Button onClick={handleWithdrawFunds} disabled={!withdrawAmount || isProcessing} variant="outline">
                      Withdraw
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  )
}
