# Token ID-Based Cross-Chain Price Synchronization

## Overview

This document describes the new token ID-based system for cross-chain price synchronization. This system solves the problem where tokens with different addresses on each chain couldn't share the same global supply.

## Problem Statement

Previously, `GlobalSupplyTracker` used token addresses as keys. Since each chain has a different token address for the same logical token, each chain tracked its own separate global supply, preventing true cross-chain price synchronization.

**Example:**
- Base Sepolia: Token address `0xa6E90B03A2aaF99543dbf1c64d22395d9b4359eb`
- BSC Testnet: Token address `0x1f2D4CA70F1274c8CcfB9d600191258C4f2Aec1c`
- Sepolia: Token address `0x84c7959EEbCC0307Ca0A3Cf3d338C215A1bB24Cb`

These are the same token (same database UUID), but were tracked separately.

## Solution

The new system uses **token IDs** (bytes32 hashes of database UUIDs) instead of token addresses:

1. **TokenIDRegistry**: Maps token addresses to token IDs
2. **GlobalSupplyTrackerV2**: Tracks supply by token ID instead of address
3. **Backward Compatibility**: V2 still accepts token addresses and looks up token IDs automatically

## Architecture

```
┌─────────────────┐
│ TokenIDRegistry │  Maps: tokenAddress → bytes32 tokenId
└────────┬────────┘
         │
         ▼
┌──────────────────────┐
│ GlobalSupplyTrackerV2│  Tracks: tokenId → globalSupply
└──────────────────────┘
         │
         ├── updateSupplyByTokenId(bytes32 tokenId, ...)
         └── updateSupply(address tokenAddress, ...) [backward compatible]
```

## Components

### 1. TokenIDRegistry.sol

Maps token addresses to token IDs (bytes32 hashes of database UUIDs).

**Key Functions:**
- `registerToken(address tokenAddress, bytes32 tokenId, string chain)`: Register a token
- `getTokenId(address tokenAddress)`: Get token ID for an address
- `getTokenAddress(bytes32 tokenId, string chain)`: Get token address for a token ID on a chain

### 2. GlobalSupplyTrackerV2.sol

Tracks global supply using token IDs instead of addresses.

**Key Functions:**
- `updateSupplyByTokenId(bytes32 tokenId, string chain, uint256 newSupply)`: Update using token ID (recommended)
- `updateSupply(address tokenAddress, string chain, uint256 newSupply)`: Update using address (backward compatible, auto-looks up token ID)
- `getGlobalSupply(bytes32 tokenId)`: Get global supply by token ID
- `getGlobalSupplyByAddress(address tokenAddress)`: Get global supply by address (looks up token ID)

### 3. TokenIDUtils.sol

Utility library for converting UUID strings to bytes32.

**Functions:**
- `uuidToBytes32(string memory uuidString)`: Convert UUID to bytes32

## Migration Steps

### Step 1: Deploy TokenIDRegistry and GlobalSupplyTrackerV2

```bash
# Deploy to each testnet
npx hardhat run scripts/deploy-token-id-system.ts --network sepolia
npx hardhat run scripts/deploy-token-id-system.ts --network bscTestnet
npx hardhat run scripts/deploy-token-id-system.ts --network baseSepolia
```

### Step 2: Register Existing Tokens

```bash
# Register all existing tokens in TokenIDRegistry
TOKEN_ID_REGISTRY_SEPOLIA=<address> \
TOKEN_ID_REGISTRY_BSC_TESTNET=<address> \
TOKEN_ID_REGISTRY_BASE_SEPOLIA=<address> \
npx ts-node scripts/register-tokens.ts
```

### Step 3: Update Bonding Curves (Optional)

Existing bonding curves will continue to work because `GlobalSupplyTrackerV2` has backward compatibility. However, for optimal performance, you can:

1. Update bonding curves to use `GlobalSupplyTrackerV2` instead of `GlobalSupplyTracker`
2. The bonding curve will automatically look up the token ID when calling `updateSupply(address, ...)`

### Step 4: Update TokenFactory (Future)

For new tokens, update `TokenFactory` to:
1. Register tokens in `TokenIDRegistry` during deployment
2. Use `GlobalSupplyTrackerV2` instead of `GlobalSupplyTracker`

## Benefits

1. **True Cross-Chain Sync**: Same token across different chains shares the same global supply
2. **Backward Compatible**: Existing bonding curves continue to work
3. **Flexible**: Supports both token ID and address-based lookups
4. **Scalable**: Easy to add new chains without modifying existing contracts

## Example Usage

### Registering a Token

```solidity
// In TokenIDRegistry
bytes32 tokenId = keccak256(abi.encodePacked("ea23015c-d3c7-40e1-8cb3-94d2cbd813b9"));
registry.registerToken(0xa6E90B03A2aaF99543dbf1c64d22395d9b4359eb, tokenId, "base-sepolia");
```

### Updating Supply (Token ID Method)

```solidity
// In BondingCurve (recommended)
bytes32 tokenId = tokenIDRegistry.getTokenId(address(token));
trackerV2.updateSupplyByTokenId(tokenId, "base-sepolia", newSupply);
```

### Updating Supply (Address Method - Backward Compatible)

```solidity
// In BondingCurve (backward compatible)
trackerV2.updateSupply(address(token), "base-sepolia", newSupply);
// Automatically looks up token ID from registry
```

## Testing

After migration, verify:

1. **Token Registration**: Check that all tokens are registered in `TokenIDRegistry`
2. **Supply Tracking**: Verify that global supply is shared across chains
3. **Price Sync**: Test that prices sync correctly after transactions on different chains

## Rollback Plan

If issues occur:

1. Keep `GlobalSupplyTracker` (V1) running
2. Bonding curves can be switched back to V1 if needed
3. TokenIDRegistry is independent and doesn't affect existing contracts

## Future Enhancements

1. **Automatic Registration**: TokenFactory automatically registers tokens
2. **Multi-Chain Deployment**: Single transaction to register on all chains
3. **Token ID in Events**: Include token ID in all events for easier tracking

