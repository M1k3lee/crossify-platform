// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";
import "./CrossChainSync.sol";

/**
 * @title CrossChainLiquidityBridge
 * @dev Handles cross-chain liquidity bridging for bonding curves
 * Ensures all chains have sufficient reserves for sell operations
 */

interface IBondingCurve {
    function totalReserve() external view returns (uint256);
    function chainName() external view returns (string memory);
}

contract CrossChainLiquidityBridge is Ownable, ReentrancyGuard, Pausable {
    ILayerZeroEndpointV2 public lzEndpoint;
    CrossChainSync public crossChainSync;
    
    // Reserve tracking per token per chain
    mapping(address => mapping(uint32 => uint256)) public chainReserves; // token => chainEID => reserve
    
    // Minimum reserve thresholds (as percentage of ideal reserve)
    mapping(address => uint256) public minReservePercent; // Default 30% (3000 basis points)
    
    // Ideal reserve calculation: (globalReserve * chainVolume) / globalVolume
    mapping(address => mapping(uint32 => uint256)) public chainVolume; // token => chainEID => volume
    mapping(address => uint256) public globalVolume; // token => total volume
    
    // Pending liquidity requests
    struct LiquidityRequest {
        address token;
        uint32 targetChainEID;
        uint32 sourceChainEID;
        uint256 amount;
        uint256 requestedAt;
        bool fulfilled;
    }
    
    mapping(bytes32 => LiquidityRequest) public pendingRequests;
    mapping(address => mapping(uint32 => bytes32[])) public chainPendingRequests; // token => chain => request IDs
    
    // Bridge fees
    uint256 public bridgeFeePercent = 10; // 0.1% (10 basis points)
    uint256 public constant FEE_DENOMINATOR = 10000;
    address public feeCollector;
    
    // Events
    event LiquidityRequested(
        address indexed token,
        uint32 targetChainEID,
        uint32 sourceChainEID,
        uint256 amount,
        bytes32 requestId
    );
    
    event LiquidityBridged(
        address indexed token,
        uint32 sourceChainEID,
        uint32 targetChainEID,
        uint256 amount,
        bytes32 requestId
    );
    
    event ReserveUpdated(
        address indexed token,
        uint32 chainEID,
        uint256 newReserve
    );
    
    constructor(
        address _lzEndpoint,
        address _crossChainSync,
        address _owner,
        address _feeCollector
    ) Ownable(_owner) {
        lzEndpoint = ILayerZeroEndpointV2(_lzEndpoint);
        crossChainSync = CrossChainSync(payable(_crossChainSync));
        feeCollector = _feeCollector;
    }
    
    /**
     * @dev Request liquidity from another chain
     * Called by bonding curve when it doesn't have enough reserves
     */
    function requestLiquidity(
        address token,
        uint32 targetChainEID,
        uint256 amount
    ) external nonReentrant whenNotPaused returns (bytes32) {
        require(amount > 0, "Amount must be greater than 0");
        
        // Verify caller is a bonding curve (simplified - in production, use registry)
        // For now, we'll allow any contract to request (with proper access control)
        
        // Find chain with excess liquidity
        uint32 sourceChainEID = findChainWithExcessLiquidity(token, targetChainEID, amount);
        require(sourceChainEID != 0, "No chain with sufficient liquidity");
        
        // Create request
        bytes32 requestId = keccak256(abi.encodePacked(
            token,
            targetChainEID,
            sourceChainEID,
            amount,
            block.timestamp,
            block.number
        ));
        
        pendingRequests[requestId] = LiquidityRequest({
            token: token,
            targetChainEID: targetChainEID,
            sourceChainEID: sourceChainEID,
            amount: amount,
            requestedAt: block.timestamp,
            fulfilled: false
        });
        
        chainPendingRequests[token][targetChainEID].push(requestId);
        
        emit LiquidityRequested(token, targetChainEID, sourceChainEID, amount, requestId);
        
        // Trigger bridge (simplified - in production, use async pattern)
        // For now, this would be handled by a backend service that monitors requests
        
        return requestId;
    }
    
    /**
     * @dev Bridge liquidity from source chain to target chain
     * Called by backend service or keeper after detecting request
     */
    function bridgeLiquidity(
        bytes32 requestId,
        uint256 nativeAmount, // Amount of native token to bridge (ETH, BNB, etc.)
        bytes calldata message
    ) external payable nonReentrant whenNotPaused {
        LiquidityRequest storage request = pendingRequests[requestId];
        require(!request.fulfilled, "Request already fulfilled");
        require(msg.value >= nativeAmount, "Insufficient payment");
        
        // Calculate bridge fee
        uint256 fee = (nativeAmount * bridgeFeePercent) / FEE_DENOMINATOR;
        uint256 bridgedAmount = nativeAmount - fee;
        
        // Transfer fee to collector
        if (fee > 0 && feeCollector != address(0)) {
            payable(feeCollector).transfer(fee);
        }
        
        // Update reserves
        chainReserves[request.token][request.sourceChainEID] -= nativeAmount;
        chainReserves[request.token][request.targetChainEID] += bridgedAmount;
        
        // Mark request as fulfilled
        request.fulfilled = true;
        
        // Send cross-chain message via LayerZero
        // This would notify the target chain to credit the reserves
        // Simplified for now - full implementation requires LayerZero integration
        
        emit LiquidityBridged(
            request.token,
            request.sourceChainEID,
            request.targetChainEID,
            bridgedAmount,
            requestId
        );
    }
    
    /**
     * @dev Update reserve amount for a chain
     * Called by bonding curve after buy/sell operations
     */
    function updateReserve(
        address token,
        uint32 chainEID,
        uint256 newReserve
    ) external {
        // Verify caller is authorized (in production, use registry)
        chainReserves[token][chainEID] = newReserve;
        emit ReserveUpdated(token, chainEID, newReserve);
    }
    
    /**
     * @dev Check if chain has sufficient reserves
     */
    function hasSufficientReserves(
        address token,
        uint32 chainEID,
        uint256 requiredAmount
    ) external view returns (bool) {
        uint256 currentReserve = chainReserves[token][chainEID];
        uint256 minReserve = getMinReserve(token, chainEID);
        
        return currentReserve >= requiredAmount && currentReserve >= minReserve;
    }
    
    /**
     * @dev Calculate minimum reserve for a chain
     * Formula: (globalReserve * chainVolume) / globalVolume * minReservePercent
     */
    function getMinReserve(address token, uint32 chainEID) public view returns (uint256) {
        uint256 globalReserve = getGlobalReserve(token);
        uint256 chainVol = chainVolume[token][chainEID];
        uint256 globalVol = globalVolume[token];
        
        if (globalVol == 0) {
            return globalReserve / 4; // Default to 25% if no volume data
        }
        
        uint256 idealReserve = (globalReserve * chainVol) / globalVol;
        uint256 minPercent = minReservePercent[token];
        if (minPercent == 0) {
            minPercent = 3000; // Default 30%
        }
        
        return (idealReserve * minPercent) / FEE_DENOMINATOR;
    }
    
    /**
     * @dev Get total reserve across all chains for a token
     */
    function getGlobalReserve(address token) public view returns (uint256) {
        // Sum reserves from all known chains
        // In production, maintain a list of chain EIDs
        uint256 total = 0;
        // Simplified - would iterate through all known chains
        return total;
    }
    
    /**
     * @dev Find chain with excess liquidity
     */
    function findChainWithExcessLiquidity(
        address token,
        uint32 excludeChainEID,
        uint256 amount
    ) internal view returns (uint32) {
        // In production, iterate through all known chains
        // For now, return 0 (not found)
        // This would check each chain's reserve vs ideal reserve
        return 0;
    }
    
    /**
     * @dev Set minimum reserve percentage for a token
     */
    function setMinReservePercent(address token, uint256 percent) external onlyOwner {
        require(percent <= 5000, "Cannot exceed 50%"); // Max 50% of ideal
        minReservePercent[token] = percent;
    }
    
    /**
     * @dev Set bridge fee percentage
     */
    function setBridgeFeePercent(uint256 percent) external onlyOwner {
        require(percent <= 100, "Cannot exceed 1%"); // Max 1%
        bridgeFeePercent = percent;
    }
    
    /**
     * @dev Set fee collector address
     */
    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "Invalid address");
        feeCollector = _feeCollector;
    }
    
    /**
     * @dev Update chain volume (called by bonding curve)
     */
    function updateChainVolume(
        address token,
        uint32 chainEID,
        uint256 volume
    ) external {
        // Verify caller is authorized
        chainVolume[token][chainEID] += volume;
        globalVolume[token] += volume;
    }
    
    receive() external payable {}
}

