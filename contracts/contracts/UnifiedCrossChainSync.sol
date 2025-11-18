// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title UnifiedCrossChainSync
 * @dev Unified interface for multiple cross-chain protocols
 * Supports LayerZero and Supra HyperNova in parallel
 * 
 * Architecture:
 * - BondingCurve -> UnifiedCrossChainSync -> [LayerZeroAdapter | SupraAdapter]
 * - Both protocols can run in parallel
 * - Message deduplication prevents double-processing
 * - Metrics tracking for performance comparison
 */
contract UnifiedCrossChainSync is Ownable {
    // Protocol adapters
    address public layerZeroSync;
    address public supraSync;
    
    // Protocol selection
    enum Protocol { LAYERZERO, SUPRA, BOTH, AUTO }
    
    // Token => preferred protocol
    mapping(address => Protocol) public tokenProtocol;
    
    // Global supply tracking (unified across protocols)
    mapping(address => uint256) public globalSupply;
    mapping(address => mapping(uint32 => uint256)) public chainSupply;
    
    // Authorized tokens/addresses that can sync
    mapping(address => bool) public authorizedTokens;
    
    // Message deduplication (prevent double-processing)
    mapping(bytes32 => bool) public processedMessages;
    
    // Protocol metrics
    struct ProtocolMetrics {
        uint256 messagesSent;
        uint256 messagesReceived;
        uint256 failures;
        uint256 totalCost;
        uint256 lastUpdate;
    }
    
    mapping(Protocol => ProtocolMetrics) public metrics;
    
    // Chain EID mapping
    mapping(string => uint32) public chainEIDs;
    mapping(uint32 => string) public eidToChain;
    
    // Events
    event SupplySynced(
        address indexed token,
        uint32 indexed sourceEID,
        uint32 indexed targetEID,
        uint256 supply,
        Protocol protocol
    );
    
    event GlobalSupplyUpdated(
        address indexed token,
        uint256 globalSupply,
        uint256 timestamp
    );
    
    event ProtocolSelected(address indexed token, Protocol protocol);
    event MessageDeduplicated(bytes32 indexed messageId);
    event ProtocolFailure(Protocol protocol, string reason);
    
    error NotAuthorized();
    error InvalidAdapter();
    error MessageAlreadyProcessed();
    
    constructor(address _layerZeroSync, address _supraSync) Ownable(msg.sender) {
        layerZeroSync = _layerZeroSync;
        supraSync = _supraSync;
        
        // Initialize LayerZero EIDs (testnets)
        chainEIDs["ethereum"] = 40161;
        chainEIDs["sepolia"] = 40161;
        chainEIDs["bsc"] = 40102;
        chainEIDs["bsc-testnet"] = 40102;
        chainEIDs["base"] = 40245;
        chainEIDs["base-sepolia"] = 40245;
        
        eidToChain[40161] = "ethereum";
        eidToChain[40102] = "bsc";
        eidToChain[40245] = "base";
    }
    
    /**
     * @dev Set LayerZero adapter address
     */
    function setLayerZeroSync(address _adapter) external onlyOwner {
        require(_adapter != address(0), "Invalid address");
        layerZeroSync = _adapter;
    }
    
    /**
     * @dev Set Supra adapter address
     */
    function setSupraSync(address _adapter) external onlyOwner {
        require(_adapter != address(0), "Invalid address");
        supraSync = _adapter;
    }
    
    /**
     * @dev Authorize a token/address to sync
     */
    function authorizeToken(address token) external onlyOwner {
        require(token != address(0), "Invalid address");
        authorizedTokens[token] = true;
    }
    
    /**
     * @dev Revoke authorization
     */
    function revokeToken(address token) external onlyOwner {
        authorizedTokens[token] = false;
    }
    
    /**
     * @dev Set preferred protocol for a token
     */
    function setTokenProtocol(address token, Protocol protocol) external onlyOwner {
        tokenProtocol[token] = protocol;
        emit ProtocolSelected(token, protocol);
    }
    
    /**
     * @dev Sync supply update using selected protocol(s)
     * Called by BondingCurve or GlobalSupplyTracker
     */
    function syncSupplyUpdate(
        address token,
        uint256 newSupply,
        uint32 sourceEID
    ) external payable {
        if (!authorizedTokens[msg.sender] && msg.sender != owner()) {
            revert NotAuthorized();
        }
        
        // Update local state first
        uint256 oldChainSupply = chainSupply[token][sourceEID];
        chainSupply[token][sourceEID] = newSupply;
        globalSupply[token] = globalSupply[token] - oldChainSupply + newSupply;
        
        emit GlobalSupplyUpdated(token, globalSupply[token], block.timestamp);
        
        // Determine which protocol(s) to use
        Protocol protocol = tokenProtocol[token];
        if (protocol == Protocol.AUTO) {
            protocol = _selectBestProtocol();
        }
        
        // Route to protocol(s)
        if (protocol == Protocol.LAYERZERO || protocol == Protocol.BOTH) {
            _syncViaLayerZero(token, newSupply, sourceEID);
        }
        
        if (protocol == Protocol.SUPRA || protocol == Protocol.BOTH) {
            _syncViaSupra(token, newSupply, sourceEID);
        }
    }
    
    /**
     * @dev Sync via LayerZero
     */
    function _syncViaLayerZero(
        address token,
        uint256 newSupply,
        uint32 sourceEID
    ) internal {
        if (layerZeroSync == address(0)) {
            emit ProtocolFailure(Protocol.LAYERZERO, "Adapter not set");
            return;
        }
        
        // Call LayerZero adapter
        // The adapter will handle LayerZero messaging
        (bool success, ) = layerZeroSync.call{value: msg.value}(
            abi.encodeWithSignature(
                "syncSupplyUpdate(address,uint256,uint32)",
                token,
                newSupply,
                sourceEID
            )
        );
        
        if (success) {
            metrics[Protocol.LAYERZERO].messagesSent++;
            metrics[Protocol.LAYERZERO].totalCost += msg.value;
        } else {
            metrics[Protocol.LAYERZERO].failures++;
            emit ProtocolFailure(Protocol.LAYERZERO, "Sync failed");
        }
        
        metrics[Protocol.LAYERZERO].lastUpdate = block.timestamp;
    }
    
    /**
     * @dev Sync via Supra
     */
    function _syncViaSupra(
        address token,
        uint256 newSupply,
        uint32 sourceEID
    ) internal {
        if (supraSync == address(0)) {
            emit ProtocolFailure(Protocol.SUPRA, "Adapter not set");
            return;
        }
        
        // Call Supra adapter
        // The adapter will handle Supra HyperNova messaging
        (bool success, ) = supraSync.call{value: msg.value}(
            abi.encodeWithSignature(
                "syncSupplyUpdate(address,uint256,uint32)",
                token,
                newSupply,
                sourceEID
            )
        );
        
        if (success) {
            metrics[Protocol.SUPRA].messagesSent++;
            metrics[Protocol.SUPRA].totalCost += msg.value;
        } else {
            metrics[Protocol.SUPRA].failures++;
            emit ProtocolFailure(Protocol.SUPRA, "Sync failed");
        }
        
        metrics[Protocol.SUPRA].lastUpdate = block.timestamp;
    }
    
    /**
     * @dev Receive message from LayerZero adapter
     */
    function receiveLayerZeroMessage(
        bytes32 messageId,
        address token,
        uint32 sourceEID,
        uint256 supply,
        uint256 globalSupplyValue
    ) external {
        require(msg.sender == layerZeroSync, "Invalid sender");
        require(!processedMessages[messageId], "Already processed");
        
        processedMessages[messageId] = true;
        _processSupplyUpdate(token, sourceEID, supply, globalSupplyValue, Protocol.LAYERZERO);
    }
    
    /**
     * @dev Receive message from Supra adapter
     */
    function receiveSupraMessage(
        bytes32 messageId,
        address token,
        uint32 sourceEID,
        uint256 supply,
        uint256 globalSupplyValue
    ) external {
        require(msg.sender == supraSync, "Invalid sender");
        
        // Check if already processed by LayerZero
        if (processedMessages[messageId]) {
            emit MessageDeduplicated(messageId);
            return; // Deduplicate
        }
        
        processedMessages[messageId] = true;
        _processSupplyUpdate(token, sourceEID, supply, globalSupplyValue, Protocol.SUPRA);
    }
    
    /**
     * @dev Internal: Process supply update (idempotent)
     */
    function _processSupplyUpdate(
        address token,
        uint32 sourceEID,
        uint256 supply,
        uint256 globalSupplyValue,
        Protocol protocol
    ) internal {
        // Update state (idempotent - safe to call multiple times)
        uint256 oldChainSupply = chainSupply[token][sourceEID];
        
        // Only update if new supply is greater (prevent rollback)
        if (supply > oldChainSupply) {
            chainSupply[token][sourceEID] = supply;
            globalSupply[token] = globalSupply[token] - oldChainSupply + supply;
        }
        
        // Update metrics
        metrics[protocol].messagesReceived++;
        metrics[protocol].lastUpdate = block.timestamp;
        
        emit SupplySynced(token, sourceEID, _getCurrentEID(), supply, protocol);
        emit GlobalSupplyUpdated(token, globalSupply[token], block.timestamp);
    }
    
    /**
     * @dev Select best protocol based on metrics
     */
    function _selectBestProtocol() internal view returns (Protocol) {
        // Simple heuristic: use protocol with lower failure rate
        uint256 lzFailures = metrics[Protocol.LAYERZERO].failures;
        uint256 supraFailures = metrics[Protocol.SUPRA].failures;
        
        // If Supra has fewer failures and is configured, use it
        if (supraFailures < lzFailures && supraSync != address(0)) {
            return Protocol.SUPRA;
        }
        
        // Default to LayerZero (battle-tested)
        return Protocol.LAYERZERO;
    }
    
    /**
     * @dev Get global supply for a token
     */
    function getGlobalSupply(address token) external view returns (uint256) {
        return globalSupply[token];
    }
    
    /**
     * @dev Get supply for a specific chain
     */
    function getChainSupply(address token, uint32 eid) external view returns (uint256) {
        return chainSupply[token][eid];
    }
    
    /**
     * @dev Get current chain's EID
     */
    function _getCurrentEID() internal view returns (uint32) {
        if (block.chainid == 11155111) return 40161; // Sepolia
        if (block.chainid == 97) return 40102; // BSC Testnet
        if (block.chainid == 84532) return 40245; // Base Sepolia
        return 0;
    }
    
    /**
     * @dev Get metrics for a protocol
     */
    function getProtocolMetrics(Protocol protocol) external view returns (ProtocolMetrics memory) {
        return metrics[protocol];
    }
    
    /**
     * @dev Withdraw native tokens
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            payable(owner()).transfer(balance);
        }
    }
    
    /**
     * @dev Receive ETH
     */
    receive() external payable {}
}

