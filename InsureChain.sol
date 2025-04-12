// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title InsureChainAI
 * @dev Smart contract for decentralized insurance claim processing
 */
contract InsureChainAI {
    address public owner;
    
    // Threshold for automatic approval
    uint256 public fraudScoreThreshold = 70; // Any score above 70 is considered potentially fraudulent
    
    // Define claim status
    enum ClaimStatus { Pending, Approved, Denied, PaidOut }
    
    // Structure to store claim details
    struct Claim {
        uint256 claimId;
        address policyholder;
        uint256 requestedAmount;
        uint256 approvedAmount;
        uint256 fraudScore;       // 0-100, higher means more likely to be fraudulent
        ClaimStatus status;
        uint256 timestamp;
        string ipfsDocumentHash;  // Hash of claim documents stored on IPFS
        address verifier;         // Address that verified the claim (ML oracle or admin)
    }
    
    // Mapping from claim ID to Claim
    mapping(uint256 => Claim) public claims;
    
    // Mapping from policyholder to their claim IDs
    mapping(address => uint256[]) public policyholderClaims;
    
    // Total number of claims processed
    uint256 public totalClaims;
    
    // Events
    event ClaimSubmitted(uint256 indexed claimId, address indexed policyholder, uint256 requestedAmount);
    event ClaimVerified(uint256 indexed claimId, uint256 fraudScore, uint256 approvedAmount);
    event ClaimStatusUpdated(uint256 indexed claimId, ClaimStatus status);
    event PayoutExecuted(uint256 indexed claimId, address indexed policyholder, uint256 amount);
    event FraudScoreThresholdUpdated(uint256 newThreshold);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    // Constructor
    constructor(uint256 _fraudScoreThreshold) {
        require(_fraudScoreThreshold <= 100, "Threshold must be between 0 and 100");
        owner = msg.sender;
        fraudScoreThreshold = _fraudScoreThreshold;
    }
    
    /**
     * @dev Submit a new claim
     * @param _requestedAmount Amount requested for the claim
     * @param _ipfsDocumentHash IPFS hash of claim documents
     */
    function submitClaim(uint256 _requestedAmount, string memory _ipfsDocumentHash) external {
        require(_requestedAmount > 0, "Requested amount must be greater than 0");
        
        uint256 claimId = totalClaims;
        
        claims[claimId] = Claim({
            claimId: claimId,
            policyholder: msg.sender,
            requestedAmount: _requestedAmount,
            approvedAmount: 0,
            fraudScore: 0,
            status: ClaimStatus.Pending,
            timestamp: block.timestamp,
            ipfsDocumentHash: _ipfsDocumentHash,
            verifier: address(0)
        });
        
        policyholderClaims[msg.sender].push(claimId);
        totalClaims++;
        
        emit ClaimSubmitted(claimId, msg.sender, _requestedAmount);
    }
    
    /**
     * @dev Verify a claim (called by ML oracle or admin)
     * @param _claimId ID of the claim to verify
     * @param _fraudScore Fraud score determined by ML model
     * @param _predictedAmount Predicted legitimate claim amount by ML model
     */
    function verifyClaim(uint256 _claimId, uint256 _fraudScore, uint256 _predictedAmount) external {
        require(_claimId < totalClaims, "Claim does not exist");
        require(claims[_claimId].status == ClaimStatus.Pending, "Claim is not pending");
        
        Claim storage claim = claims[_claimId];
        claim.fraudScore = _fraudScore;
        claim.approvedAmount = _predictedAmount;
        claim.verifier = msg.sender;
        
        // Automatically approve/deny based on fraud score
        if (_fraudScore < fraudScoreThreshold) {
            claim.status = ClaimStatus.Approved;
        } else {
            claim.status = ClaimStatus.Denied;
        }
        
        emit ClaimVerified(_claimId, _fraudScore, _predictedAmount);
        emit ClaimStatusUpdated(_claimId, claim.status);
    }
    
    /**
     * @dev Admin override for claim verification
     * @param _claimId ID of the claim to override
     * @param _approved Whether to approve or deny the claim
     * @param _approvedAmount Amount to approve (if approved)
     */
    function adminOverrideClaim(uint256 _claimId, bool _approved, uint256 _approvedAmount) external onlyOwner {
        require(_claimId < totalClaims, "Claim does not exist");
        
        Claim storage claim = claims[_claimId];
        
        if (_approved) {
            claim.status = ClaimStatus.Approved;
            claim.approvedAmount = _approvedAmount;
        } else {
            claim.status = ClaimStatus.Denied;
        }
        
        emit ClaimStatusUpdated(_claimId, claim.status);
    }
    
    /**
     * @dev Execute payout for approved claim
     * @param _claimId ID of the claim to pay out
     */
    function executePayout(uint256 _claimId) external payable onlyOwner {
        require(_claimId < totalClaims, "Claim does not exist");
        Claim storage claim = claims[_claimId];
        
        require(claim.status == ClaimStatus.Approved, "Claim is not approved");
        require(address(this).balance >= claim.approvedAmount, "Insufficient contract balance");
        
        claim.status = ClaimStatus.PaidOut;
        
        // Transfer approved amount to policyholder
        payable(claim.policyholder).transfer(claim.approvedAmount);
        
        emit PayoutExecuted(_claimId, claim.policyholder, claim.approvedAmount);
        emit ClaimStatusUpdated(_claimId, claim.status);
    }
    
    /**
     * @dev Fund the contract to pay out claims
     */
    function fundContract() external payable {
        // Just accept the funds, no additional logic needed
    }
    
    /**
     * @dev Update fraud score threshold
     * @param _newThreshold New threshold value
     */
    function updateFraudScoreThreshold(uint256 _newThreshold) external onlyOwner {
        require(_newThreshold <= 100, "Threshold must be between 0 and 100");
        fraudScoreThreshold = _newThreshold;
        emit FraudScoreThresholdUpdated(_newThreshold);
    }
    
    /**
     * @dev Get claim details
     * @param _claimId ID of the claim
     */
    function getClaimDetails(uint256 _claimId) external view returns (
        address policyholder,
        uint256 requestedAmount,
        uint256 approvedAmount,
        uint256 fraudScore,
        ClaimStatus status,
        uint256 timestamp,
        string memory ipfsDocumentHash,
        address verifier
    ) {
        require(_claimId < totalClaims, "Claim does not exist");
        Claim storage claim = claims[_claimId];
        
        return (
            claim.policyholder,
            claim.requestedAmount,
            claim.approvedAmount,
            claim.fraudScore,
            claim.status,
            claim.timestamp,
            claim.ipfsDocumentHash,
            claim.verifier
        );
    }
    
    /**
     * @dev Get all claim IDs for a policyholder
     * @param _policyholder Address of the policyholder
     */
    function getPolicyholderClaimIds(address _policyholder) external view returns (uint256[] memory) {
        return policyholderClaims[_policyholder];
    }
    
    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Transfer ownership of the contract
     * @param _newOwner Address of new owner
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "New owner cannot be zero address");
        owner = _newOwner;
    }
    
    /**
     * @dev Withdraw funds from contract (emergency function)
     * @param _amount Amount to withdraw
     */
    function withdrawFunds(uint256 _amount) external onlyOwner {
        require(_amount <= address(this).balance, "Insufficient contract balance");
        payable(owner).transfer(_amount);
    }
}
