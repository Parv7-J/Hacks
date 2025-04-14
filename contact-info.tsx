"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Loader2, RefreshCw } from "lucide-react"

interface ContractInfoProps {
  contract: ethers.Contract | null
  isOwner: boolean
  account: string
}

export default function ContractInfo({ contract, isOwner, account }: ContractInfoProps) {
  const [contractBalance, setContractBalance] = useState<string>("0")
  const [fraudThreshold, setFraudThreshold] = useState<number>(0)
  const [totalClaims, setTotalClaims] = useState<number>(0)
  const [ownerAddress, setOwnerAddress] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>("")
  const [fundAmount, setFundAmount] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

  useEffect(() => {
    if (contract) {
      fetchContractInfo()
    }
  }, [contract])

  const fetchContractInfo = async () => {
    if (!contract) return

    try {
      setLoading(true)
      setError("")

      // Get contract balance
      const balance = await contract.getContractBalance()
      setContractBalance(ethers.formatEther(balance))

      // Get fraud threshold
      const threshold = await contract.fraudScoreThreshold()
      setFraudThreshold(Number(threshold))

      // Get total claims
      const claims = await contract.totalClaims()
      setTotalClaims(Number(claims))

      // Get owner address
      const owner = await contract.owner()
      setOwnerAddress(owner)
    } catch (err: any) {
      console.error("Error fetching contract info:", err)
      setError(err.message || "Failed to fetch contract info")
    } finally {
      setLoading(false)
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
      await fetchContractInfo()

      // Reset form
      setFundAmount("")
    } catch (err: any) {
      console.error("Error funding contract:", err)
      setError(err.message || "Failed to fund contract")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Contract Information</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchContractInfo}
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
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-5 w-60 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-5 w-52 bg-gray-200 rounded animate-pulse"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Contract Balance</p>
                  <p className="text-2xl font-bold">{contractBalance} ETH</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Total Claims</p>
                  <p className="text-2xl font-bold">{totalClaims}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-2">
              <p className="text-sm">
                <span className="font-medium">Contract Address:</span>{" "}
                <span className="font-mono text-xs break-all">{contract?.target}</span>
              </p>
              <p className="text-sm">
                <span className="font-medium">Owner Address:</span>{" "}
                <span className="font-mono text-xs break-all">{ownerAddress}</span>
              </p>
              <p className="text-sm">
                <span className="font-medium">Fraud Score Threshold:</span> <span>{fraudThreshold}/100</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <h4 className="font-medium">Fund Contract</h4>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="fundAmount" className="sr-only">
                    Fund Amount (ETH)
                  </Label>
                  <Input
                    id="fundAmount"
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="Amount in ETH"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                  />
                </div>
                <Button onClick={handleFundContract} disabled={!fundAmount || isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Fund Contract"
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">Fund the contract to enable claim payouts</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
