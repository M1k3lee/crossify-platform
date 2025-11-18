# Dual Cross-Chain Architecture: LayerZero + Supra Parallel System

**Version:** 1.0  
**Date:** December 2024  
**Status:** Design Document

## Overview

This document outlines the architecture for running **LayerZero** and **Supra HyperNova** in parallel, providing redundancy, performance comparison, and gradual migration capabilities.

---

## Architecture Principles

### 1. **Abstraction Layer**
- Unified interface for cross-chain operations
- Protocol-agnostic contract design
- Easy to add/remove protocols

### 2. **Redundancy & Reliability**
- Both protocols can run simultaneously
- Automatic failover if one fails
- Conflict resolution for duplicate messages

### 3. **Performance Comparison**
- Track metrics for both protocols
- Cost comparison
- Latency measurement

### 4. **Gradual Migration**
- Start with LayerZero (existing)
- Add Supra as alternative
- Allow user/protocol selection
- Eventually migrate if Supra proves superior

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         BondingCurve                             │
│                    (Token Buy/Sell Logic)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              UnifiedCrossChainSync (Abstraction Layer)           │
│  ┌──────────────────────┐      ┌──────────────────────┐       │
│  │  LayerZero Adapter    │      │   Supra Adapter      │       │
│  │  - CrossChainSync     │      │   - SupraSync        │       │
│  │  - LayerZero v2       │      │   - HyperNova        │       │
│  └──────────────────────┘      └──────────────────────┘       │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Ethereum    │    │     BSC      │    │     Base     │
│  Sepolia     │    │   Testnet    │    │   Sepolia    │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## Smart Contract Architecture

### 1. UnifiedCrossChainSync Contract

**Purpose:** Abstraction layer that routes messages to LayerZero, Supra, or both.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title UnifiedCrossChainSync
 * @dev Unified interface for multiple cross-chain protocols
 * Supports LayerZero and Supra HyperNova in parallel
 */
contract UnifiedCrossChainSync is Ownable {
    // Protocol adapters
    address public layerZeroSync;
    address public supraSync;
    
    // Protocol configuration
    enum Protocol { LAYERZERO, SUPRA, BOTH, AUTO }
    
    // Token => preferred protocol
    mapping(address => Protocol) public tokenProtocol;
    
    // Global supply tracking (unified across protocols)
    mapping(address => uint256) public globalSupply;
    mapping(address => mapping(uint32 => uint256)) public chainSupply;
    
    // Message deduplication (prevent double-processing)
    mapping(bytes32 => bool) public processedMessages;
    
    // Protocol metrics
    struct ProtocolMetrics {
        uint256 messagesSent;
        uint256 messagesReceived;
        uint256 failures;
        uint256 totalCost;
        uint256 avgLatency;
    }
    
    mapping(Protocol => ProtocolMetrics) public metrics;
    
    // Events
    event SupplySynced(
        address indexed token,
        uint32 indexed sourceEID,
        uint32 indexed targetEID,
        uint256 supply,
        Protocol protocol
    );
    
    event ProtocolSelected(address indexed token, Protocol protocol);
    event MessageDeduplicated(bytes32 indexed messageId);
    
    constructor(address _layerZeroSync, address _supraSync) Ownable(msg.sender) {
        layerZeroSync = _layerZeroSync;
        supraSync = _supraSync;
    }
    
    /**
     * @dev Sync supply update using selected protocol(s)
     */
    function syncSupplyUpdate(
        address token,
        uint256 newSupply,
        uint32 sourceEID
    ) external payable {
        require(authorizedTokens[msg.sender], "Not authorized");
        
        Protocol protocol = tokenProtocol[token];
        if (protocol == Protocol.AUTO) {
            protocol = _selectBestProtocol(token, sourceEID);
        }
        
        // Update local state first
        uint256 oldChainSupply = chainSupply[token][sourceEID];
        chainSupply[token][sourceEID] = newSupply;
        globalSupply[token] = globalSupply[token] - oldChainSupply + newSupply;
        
        // Route to protocol(s)
        if (protocol == Protocol.LAYERZERO || protocol == Protocol.BOTH) {
            _syncViaLayerZero(token, newSupply, sourceEID);
        }
        
        if (protocol == Protocol.SUPRA || protocol == Protocol.BOTH) {
            _syncViaSupra(token, newSupply, sourceEID);
        }
    }
    
    /**
     * @dev Receive message from LayerZero
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
     * @dev Receive message from Supra
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
     * @dev Internal: Process supply update
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
        chainSupply[token][sourceEID] = supply;
        globalSupply[token] = globalSupply[token] - oldChainSupply + supply;
        
        // Update metrics
        metrics[protocol].messagesReceived++;
        
        emit SupplySynced(token, sourceEID, _getCurrentEID(), supply, protocol);
    }
    
    /**
     * @dev Select best protocol based on metrics
     */
    function _selectBestProtocol(address token, uint32 sourceEID) internal view returns (Protocol) {
        // Simple heuristic: use protocol with lower failure rate
        uint256 lzFailures = metrics[Protocol.LAYERZERO].failures;
        uint256 supraFailures = metrics[Protocol.SUPRA].failures;
        
        if (supraFailures < lzFailures && supraSync != address(0)) {
            return Protocol.SUPRA;
        }
        return Protocol.LAYERZERO;
    }
    
    /**
     * @dev Set preferred protocol for a token
     */
    function setTokenProtocol(address token, Protocol protocol) external onlyOwner {
        tokenProtocol[token] = protocol;
        emit ProtocolSelected(token, protocol);
    }
    
    // ... additional helper functions
}
```

---

### 2. LayerZero Adapter (Existing - Modified)

**Purpose:** Wraps existing LayerZero implementation for unified interface.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CrossChainSync.sol"; // Existing contract
import "./UnifiedCrossChainSync.sol";

/**
 * @title LayerZeroAdapter
 * @dev Adapter for LayerZero to work with UnifiedCrossChainSync
 */
contract LayerZeroAdapter is CrossChainSync {
    UnifiedCrossChainSync public unifiedSync;
    
    constructor(address _lzEndpoint, address _unifiedSync) CrossChainSync(_lzEndpoint) {
        unifiedSync = UnifiedCrossChainSync(_unifiedSync);
    }
    
    /**
     * @dev Override lzReceive to forward to UnifiedSync
     */
    function lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _payload,
        address _executor,
        bytes calldata _extraData
    ) external payable override {
        // Call parent to maintain existing logic
        super.lzReceive(_origin, _guid, _payload, _executor, _extraData);
        
        // Also forward to unified sync for deduplication
        (
            address token,
            uint32 sourceEID,
            uint256 chainSupplyValue,
            uint256 globalSupplyValue
        ) = abi.decode(_payload, (address, uint32, uint256, uint256));
        
        unifiedSync.receiveLayerZeroMessage(
            _guid,
            token,
            sourceEID,
            chainSupplyValue,
            globalSupplyValue
        );
    }
}
```

---

### 3. Supra Adapter (New)

**Purpose:** Integrates Supra HyperNova for cross-chain messaging.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
// import "@supra/hypernova/contracts/IHyperNova.sol"; // When available

/**
 * @title SupraSync
 * @dev Supra HyperNova adapter for cross-chain synchronization
 * NOTE: This is a placeholder - actual Supra interfaces will be available when EVM support launches
 */
contract SupraSync is Ownable {
    // Placeholder for Supra HyperNova interface
    // IHyperNova public hyperNova;
    
    UnifiedCrossChainSync public unifiedSync;
    
    // Chain ID to Supra chain ID mapping
    mapping(uint32 => uint256) public supraChainIds;
    
    // Message tracking
    mapping(bytes32 => bool) public sentMessages;
    
    event SupraMessageSent(
        bytes32 indexed messageId,
        address indexed token,
        uint32 sourceEID,
        uint32 targetEID
    );
    
    constructor(address _unifiedSync) Ownable(msg.sender) {
        unifiedSync = UnifiedCrossChainSync(_unifiedSync);
    }
    
    /**
     * @dev Sync supply via Supra HyperNova
     * TODO: Implement when Supra EVM support is available
     */
    function syncSupplyUpdate(
        address token,
        uint256 newSupply,
        uint32 sourceEID,
        uint32 targetEID
    ) external payable {
        require(msg.sender == address(unifiedSync), "Only unified sync");
        
        // Generate message ID for deduplication
        bytes32 messageId = keccak256(abi.encodePacked(
            token,
            sourceEID,
            targetEID,
            newSupply,
            block.timestamp
        ));
        
        // TODO: Call Supra HyperNova when available
        // hyperNova.sendMessage(targetEID, payload, msg.value);
        
        sentMessages[messageId] = true;
        emit SupraMessageSent(messageId, token, sourceEID, targetEID);
    }
    
    /**
     * @dev Receive message from Supra HyperNova
     * TODO: Implement when Supra EVM support is available
     */
    function receiveSupraMessage(
        bytes32 messageId,
        address token,
        uint32 sourceEID,
        uint256 supply,
        uint256 globalSupplyValue
    ) external {
        // TODO: Verify message is from Supra HyperNova
        // require(msg.sender == address(hyperNova), "Invalid sender");
        
        // Forward to unified sync
        unifiedSync.receiveSupraMessage(
            messageId,
            token,
            sourceEID,
            supply,
            globalSupplyValue
        );
    }
}
```

---

## Backend Architecture

### 1. Cross-Chain Service Abstraction

```typescript
// backend/src/services/crossChain/ICrossChainProvider.ts

export interface ICrossChainProvider {
  name: string;
  sendMessage(
    tokenId: string,
    sourceChain: string,
    targetChains: string[],
    payload: any
  ): Promise<{ success: boolean; txHashes?: string[]; cost?: number }>;
  
  estimateCost(
    sourceChain: string,
    targetChains: string[]
  ): Promise<number>;
  
  getMetrics(): Promise<{
    messagesSent: number;
    messagesReceived: number;
    failures: number;
    avgLatency: number;
    totalCost: number;
  }>;
}

// backend/src/services/crossChain/LayerZeroProvider.ts

export class LayerZeroProvider implements ICrossChainProvider {
  name = 'LayerZero';
  
  async sendMessage(...) {
    // Existing LayerZero implementation
  }
  
  // ... other methods
}

// backend/src/services/crossChain/SupraProvider.ts

export class SupraProvider implements ICrossChainProvider {
  name = 'Supra';
  
  async sendMessage(...) {
    // Supra HyperNova implementation
    // TODO: Implement when Supra EVM support is available
  }
  
  // ... other methods
}
```

### 2. Unified Cross-Chain Manager

```typescript
// backend/src/services/crossChain/UnifiedCrossChainManager.ts

import { LayerZeroProvider } from './LayerZeroProvider';
import { SupraProvider } from './SupraProvider';
import { ICrossChainProvider } from './ICrossChainProvider';

export enum Protocol {
  LAYERZERO = 'layerzero',
  SUPRA = 'supra',
  BOTH = 'both',
  AUTO = 'auto'
}

export class UnifiedCrossChainManager {
  private providers: Map<string, ICrossChainProvider>;
  private defaultProtocol: Protocol;
  
  constructor() {
    this.providers = new Map();
    this.providers.set('layerzero', new LayerZeroProvider());
    this.providers.set('supra', new SupraProvider());
    this.defaultProtocol = Protocol.AUTO;
  }
  
  /**
   * Send cross-chain message using selected protocol(s)
   */
  async sendMessage(
    tokenId: string,
    sourceChain: string,
    targetChains: string[],
    payload: any,
    protocol?: Protocol
  ): Promise<{ success: boolean; results: any[] }> {
    const selectedProtocol = protocol || this.defaultProtocol;
    const results: any[] = [];
    
    if (selectedProtocol === Protocol.LAYERZERO || selectedProtocol === Protocol.BOTH) {
      const lzProvider = this.providers.get('layerzero')!;
      const result = await lzProvider.sendMessage(tokenId, sourceChain, targetChains, payload);
      results.push({ protocol: 'layerzero', ...result });
    }
    
    if (selectedProtocol === Protocol.SUPRA || selectedProtocol === Protocol.BOTH) {
      const supraProvider = this.providers.get('supra')!;
      const result = await supraProvider.sendMessage(tokenId, sourceChain, targetChains, payload);
      results.push({ protocol: 'supra', ...result });
    }
    
    if (selectedProtocol === Protocol.AUTO) {
      // Select best protocol based on metrics
      const bestProtocol = await this.selectBestProtocol(sourceChain, targetChains);
      const provider = this.providers.get(bestProtocol)!;
      const result = await provider.sendMessage(tokenId, sourceChain, targetChains, payload);
      results.push({ protocol: bestProtocol, ...result });
    }
    
    return {
      success: results.some(r => r.success),
      results
    };
  }
  
  /**
   * Select best protocol based on metrics
   */
  private async selectBestProtocol(
    sourceChain: string,
    targetChains: string[]
  ): Promise<string> {
    // Compare metrics: latency, cost, failure rate
    const lzMetrics = await this.providers.get('layerzero')!.getMetrics();
    const supraMetrics = await this.providers.get('supra')!.getMetrics();
    
    // Simple heuristic: prefer lower failure rate
    if (supraMetrics.failures < lzMetrics.failures) {
      return 'supra';
    }
    return 'layerzero';
  }
  
  /**
   * Get metrics for all protocols
   */
  async getAllMetrics(): Promise<Record<string, any>> {
    const metrics: Record<string, any> = {};
    
    for (const [name, provider] of this.providers) {
      metrics[name] = await provider.getMetrics();
    }
    
    return metrics;
  }
}
```

### 3. Message Deduplication Service

```typescript
// backend/src/services/crossChain/MessageDeduplication.ts

export class MessageDeduplication {
  private processedMessages: Set<string>;
  
  constructor() {
    this.processedMessages = new Set();
  }
  
  /**
   * Generate message ID for deduplication
   */
  generateMessageId(
    tokenId: string,
    sourceChain: string,
    targetChain: string,
    payload: any
  ): string {
    return `${tokenId}-${sourceChain}-${targetChain}-${JSON.stringify(payload)}`;
  }
  
  /**
   * Check if message was already processed
   */
  isProcessed(messageId: string): boolean {
    return this.processedMessages.has(messageId);
  }
  
  /**
   * Mark message as processed
   */
  markProcessed(messageId: string): void {
    this.processedMessages.add(messageId);
    
    // Cleanup old messages (keep last 10,000)
    if (this.processedMessages.size > 10000) {
      const first = this.processedMessages.values().next().value;
      this.processedMessages.delete(first);
    }
  }
  
  /**
   * Handle duplicate message from different protocol
   */
  async handleDuplicate(
    messageId: string,
    protocol: string
  ): Promise<{ isDuplicate: boolean; shouldProcess: boolean }> {
    if (this.isProcessed(messageId)) {
      console.log(`⚠️  Duplicate message detected: ${messageId} from ${protocol}`);
      return { isDuplicate: true, shouldProcess: false };
    }
    
    this.markProcessed(messageId);
    return { isDuplicate: false, shouldProcess: true };
  }
}
```

---

## Configuration & Routing

### Protocol Selection Strategy

```typescript
// backend/src/config/crossChainConfig.ts

export interface CrossChainConfig {
  defaultProtocol: Protocol;
  tokenProtocols: Record<string, Protocol>;
  failoverEnabled: boolean;
  metricsEnabled: boolean;
}

export const crossChainConfig: CrossChainConfig = {
  defaultProtocol: Protocol.AUTO, // Auto-select based on metrics
  tokenProtocols: {
    // Token-specific overrides
    // '0x123...': Protocol.SUPRA,
    // '0x456...': Protocol.BOTH,
  },
  failoverEnabled: true, // If one fails, try the other
  metricsEnabled: true, // Track performance metrics
};
```

### Routing Logic

```typescript
// backend/src/services/crossChain/ProtocolRouter.ts

export class ProtocolRouter {
  /**
   * Determine which protocol(s) to use for a message
   */
  async route(
    tokenId: string,
    sourceChain: string,
    targetChains: string[]
  ): Promise<Protocol[]> {
    // 1. Check token-specific configuration
    const tokenProtocol = crossChainConfig.tokenProtocols[tokenId];
    if (tokenProtocol) {
      return [tokenProtocol];
    }
    
    // 2. Check default protocol
    const defaultProtocol = crossChainConfig.defaultProtocol;
    if (defaultProtocol !== Protocol.AUTO) {
      return [defaultProtocol];
    }
    
    // 3. Auto-select based on metrics
    const manager = new UnifiedCrossChainManager();
    const bestProtocol = await manager.selectBestProtocol(sourceChain, targetChains);
    return [bestProtocol as Protocol];
    
    // 4. If failover enabled, return both for redundancy
    if (crossChainConfig.failoverEnabled) {
      return [Protocol.LAYERZERO, Protocol.SUPRA];
    }
  }
}
```

---

## Conflict Resolution

### Handling Duplicate Messages

When both protocols deliver the same message:

1. **Message ID Generation**: Use deterministic message IDs
2. **First-Wins Strategy**: Process first message, ignore duplicates
3. **State Verification**: Verify state matches before updating
4. **Idempotent Updates**: Ensure updates are safe to apply multiple times

```solidity
// In UnifiedCrossChainSync contract

mapping(bytes32 => bool) public processedMessages;

function _processSupplyUpdate(
    address token,
    uint32 sourceEID,
    uint256 supply,
    bytes32 messageId
) internal {
    // Check if already processed
    if (processedMessages[messageId]) {
        emit MessageDeduplicated(messageId);
        return;
    }
    
    // Verify state consistency
    uint256 currentSupply = chainSupply[token][sourceEID];
    if (currentSupply >= supply) {
        // State already ahead, skip
        return;
    }
    
    // Process update
    processedMessages[messageId] = true;
    chainSupply[token][sourceEID] = supply;
    // ... update global supply
}
```

---

## Metrics & Monitoring

### Tracked Metrics

1. **Message Count**
   - Messages sent per protocol
   - Messages received per protocol
   - Duplicate messages detected

2. **Performance**
   - Average latency per protocol
   - P95/P99 latency
   - Success rate

3. **Costs**
   - Cost per message per protocol
   - Total cost per protocol
   - Cost per token

4. **Reliability**
   - Failure rate per protocol
   - Failover events
   - Recovery time

### Metrics Dashboard

```typescript
// backend/src/routes/metrics.ts

router.get('/cross-chain/metrics', async (req, res) => {
  const manager = new UnifiedCrossChainManager();
  const metrics = await manager.getAllMetrics();
  
  res.json({
    protocols: metrics,
    comparison: {
      fastest: Object.entries(metrics)
        .sort((a, b) => a[1].avgLatency - b[1].avgLatency)[0][0],
      cheapest: Object.entries(metrics)
        .sort((a, b) => a[1].totalCost - b[1].totalCost)[0][0],
      mostReliable: Object.entries(metrics)
        .sort((a, b) => a[1].failures - b[1].failures)[0][0],
    }
  });
});
```

---

## Migration Strategy

### Phase 1: Parallel Operation (Months 1-3)

- ✅ Deploy Supra adapter contracts
- ✅ Integrate Supra provider in backend
- ✅ Run both protocols in parallel
- ✅ Collect metrics and compare
- ✅ Default to LayerZero (existing)

### Phase 2: Selective Migration (Months 4-6)

- ✅ Allow token creators to choose protocol
- ✅ Auto-select based on metrics for new tokens
- ✅ Gradually migrate high-volume tokens to Supra
- ✅ Monitor performance

### Phase 3: Full Migration (Months 7-12)

- ✅ If Supra proves superior, make it default
- ✅ Keep LayerZero as fallback
- ✅ Eventually deprecate LayerZero if not needed

---

## Implementation Checklist

### Smart Contracts
- [ ] Create `UnifiedCrossChainSync` contract
- [ ] Modify `LayerZeroAdapter` to work with unified sync
- [ ] Create `SupraSync` adapter (placeholder until EVM support)
- [ ] Update `GlobalSupplyTracker` to use unified sync
- [ ] Add message deduplication logic
- [ ] Implement metrics tracking

### Backend Services
- [ ] Create `ICrossChainProvider` interface
- [ ] Implement `LayerZeroProvider`
- [ ] Implement `SupraProvider` (placeholder)
- [ ] Create `UnifiedCrossChainManager`
- [ ] Implement `MessageDeduplication` service
- [ ] Create `ProtocolRouter`
- [ ] Add metrics collection
- [ ] Create metrics API endpoint

### Testing
- [ ] Unit tests for unified sync
- [ ] Integration tests for dual-protocol operation
- [ ] Test message deduplication
- [ ] Test failover scenarios
- [ ] Performance benchmarks

### Deployment
- [ ] Deploy unified sync contracts
- [ ] Configure protocol routing
- [ ] Enable metrics collection
- [ ] Monitor both protocols
- [ ] Gradual rollout

---

## Risk Mitigation

### 1. **Protocol Failure**
- ✅ Failover to alternative protocol
- ✅ Automatic retry logic
- ✅ Manual intervention capability

### 2. **Duplicate Messages**
- ✅ Message ID deduplication
- ✅ Idempotent state updates
- ✅ Conflict resolution logic

### 3. **Cost Overruns**
- ✅ Cost tracking per protocol
- ✅ Budget limits per token
- ✅ Automatic protocol selection based on cost

### 4. **State Inconsistency**
- ✅ State verification before updates
- ✅ Reconciliation service
- ✅ Manual override capability

---

## Conclusion

This architecture enables:
- ✅ **Redundancy**: Both protocols run in parallel
- ✅ **Flexibility**: Easy to add/remove protocols
- ✅ **Performance**: Compare and optimize
- ✅ **Migration**: Gradual transition path
- ✅ **Reliability**: Failover and deduplication

The system is designed to be **backward compatible** with existing LayerZero infrastructure while providing a clear path for Supra integration.

---

**Next Steps:**
1. Review and approve architecture
2. Implement Phase 1 (parallel operation)
3. Deploy to testnet
4. Collect metrics
5. Make go/no-go decision for Phase 2

