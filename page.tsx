"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, AlertCircle } from "lucide-react"
import SubmitClaim from "@/components/submit-claim"
import ClaimsList from "@/components/claims-list"
import AdminPanel from "@/components/admin-panel"
import ContractInfo from "@/components/contract-info"

// Contract ABI and address
const contractABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_claimId",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "_approved",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "_approvedAmount",
        type: "uint256",
      },
    ],
    name: "adminOverrideClaim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "claimId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "enum InsureChainAI.ClaimStatus",
        name: "status",
        type: "uint8",
      },
    ],
    name: "ClaimStatusUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "claimId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "policyholder",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "requestedAmount",
        type: "uint256",
      },
    ],
    name: "ClaimSubmitted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "claimId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "fraudScore",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "approvedAmount",
        type: "uint256",
      },
    ],
    name: "ClaimVerified",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_claimId",
        type: "uint256",
      },
    ],
    name: "executePayout",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "newThreshold",
        type: "uint256",
      },
    ],
    name: "FraudScoreThresholdUpdated",
    type: "event",
  },
  {
    inputs: [],
    name: "fundContract",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "claimId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "policyholder",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "PayoutExecuted",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_requestedAmount",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "_ipfsDocumentHash",
        type: "string",
      },
    ],
    name: "submitClaim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_newThreshold",
        type: "uint256",
      },
    ],
    name: "updateFraudScoreThreshold",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_claimId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_fraudScore",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_predictedAmount",
        type: "uint256",
      },
    ],
    name: "verifyClaim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "withdrawFunds",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "claims",
    outputs: [
      {
        internalType: "uint256",
        name: "claimId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "policyholder",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "requestedAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "approvedAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "fraudScore",
        type: "uint256",
      },
      {
        internalType: "enum InsureChainAI.ClaimStatus",
        name: "status",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "ipfsDocumentHash",
        type: "string",
      },
      {
        internalType: "address",
        name: "verifier",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "fraudScoreThreshold",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_claimId",
        type: "uint256",
      },
    ],
    name: "getClaimDetails",
    outputs: [
      {
        internalType: "address",
        name: "policyholder",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "requestedAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "approvedAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "fraudScore",
        type: "uint256",
      },
      {
        internalType: "enum InsureChainAI.ClaimStatus",
        name: "status",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "ipfsDocumentHash",
        type: "string",
      },
      {
        internalType: "address",
        name: "verifier",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getContractBalance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_policyholder",
        type: "address",
      },
    ],
    name: "getPolicyholderClaimIds",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "policyholderClaims",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalClaims",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
]
const contractAddress = "0xD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771B"

export default function Home() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [account, setAccount] = useState<string>("")
  const [isOwner, setIsOwner] = useState<boolean>(false)
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    // Check if MetaMask is installed
    if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
      // Listen for account changes
      window.ethereum.on("accountsChanged", handleAccountsChanged)

      // Initial connection check
      checkConnection()
    } else {
      setError("Please install MetaMask to use this application")
    }

    return () => {
      // Clean up listeners
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
      }
    }
  }, [])

  const checkConnection = async () => {
    try {
      // Check if already connected
      const accounts = await window.ethereum.request({ method: "eth_accounts" })
      if (accounts.length > 0) {
        await connectWallet()
      }
    } catch (err) {
      console.error("Failed to check connection:", err)
    }
  }

  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected
      setIsConnected(false)
      setAccount("")
      setSigner(null)
      setContract(null)
    } else {
      // Account changed, reconnect
      await connectWallet()
    }
  }

  const connectWallet = async () => {
    try {
      setError("")

      // Request account access
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
      const account = accounts[0]

      // Create provider and signer
      const browserProvider = new ethers.BrowserProvider(window.ethereum)
      const signerInstance = await browserProvider.getSigner()

      // Create contract instance
      const contractInstance = new ethers.Contract(contractAddress, contractABI, signerInstance)

      // Check if connected account is the contract owner
      const ownerAddress = await contractInstance.owner()
      const isOwnerAccount = ownerAddress.toLowerCase() === account.toLowerCase()

      // Update state
      setProvider(browserProvider)
      setSigner(signerInstance)
      setContract(contractInstance)
      setAccount(account)
      setIsOwner(isOwnerAccount)
      setIsConnected(true)
    } catch (err: any) {
      console.error("Error connecting wallet:", err)
      setError(err.message || "Failed to connect wallet")
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="container mx-auto max-w-6xl">
        <header className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">InsureChainAI</h1>
              <p className="text-gray-500">Decentralized Insurance Claims Platform</p>
            </div>

            {!isConnected ? (
              <Button onClick={connectWallet} className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </Button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-md">
                <Wallet className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700 font-medium">
                  {account.slice(0, 6)}...{account.slice(-4)}
                  {isOwner && " (Admin)"}
                </span>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </header>

        {isConnected ? (
          <Tabs defaultValue="claims" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="claims">My Claims</TabsTrigger>
              <TabsTrigger value="submit">Submit Claim</TabsTrigger>
              <TabsTrigger value="info">Contract Info</TabsTrigger>
              {isOwner && <TabsTrigger value="admin">Admin Panel</TabsTrigger>}
            </TabsList>

            <TabsContent value="claims">
              <Card>
                <CardHeader>
                  <CardTitle>My Claims</CardTitle>
                  <CardDescription>View and manage your insurance claims</CardDescription>
                </CardHeader>
                <CardContent>
                  <ClaimsList contract={contract} account={account} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="submit">
              <Card>
                <CardHeader>
                  <CardTitle>Submit New Claim</CardTitle>
                  <CardDescription>File a new insurance claim</CardDescription>
                </CardHeader>
                <CardContent>
                  <SubmitClaim contract={contract} account={account} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle>Contract Information</CardTitle>
                  <CardDescription>View details about the insurance contract</CardDescription>
                </CardHeader>
                <CardContent>
                  <ContractInfo contract={contract} isOwner={isOwner} account={account} />
                </CardContent>
              </Card>
            </TabsContent>

            {isOwner && (
              <TabsContent value="admin">
                <Card>
                  <CardHeader>
                    <CardTitle>Admin Panel</CardTitle>
                    <CardDescription>Manage claims and contract settings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AdminPanel contract={contract} />
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <h2 className="text-2xl font-semibold mb-4">Welcome to InsureChainAI</h2>
            <p className="text-gray-600 mb-8 max-w-md">
              Connect your wallet to submit and manage insurance claims on the blockchain.
            </p>
            <Button onClick={connectWallet} size="lg" className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Connect Wallet
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}
