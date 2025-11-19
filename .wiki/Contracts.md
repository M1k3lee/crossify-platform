# Smart Contracts Deep Dive

**Written by MikeLee**

This page provides a comprehensive overview of every smart contract in the Crossify platform. Each contract was designed, tested, and deployed with careful attention to security, gas efficiency, and cross-chain compatibility.

## Contract Overview

The Crossify platform consists of 14 core smart contracts, each serving a specific purpose in the token launch and trading ecosystem:

1. **TokenFactory** - Entry point for token creation
2. **BondingCurve** - Manages token sales with linear pricing
3. **GlobalSupplyTracker** - Tracks supply across all chains (V1 - legacy, address-based)
4. **GlobalSupplyTrackerV2** - Next-gen supply tracker with Token ID support (January 2025)
5. **TokenIDRegistry** - Maps token addresses to canonical bytes32 token IDs (January 2025)
6. **CrossChainSync** - Handles LayerZero messaging (legacy, still supported)
7. **UnifiedCrossChainSync** - Unified interface for multiple cross-chain protocols
8. **SupraSync** - Supra HyperNova adapter for cross-chain messaging
9. **CrossChainLiquidityBridge** - Manages liquidity across chains
10. **CrossifyToken** - Standard ERC20 token implementation
11. **Migration** - Handles DEX graduation
12. **DEXDetector** - Identifies available DEXes
13. **UnifiedLiquidityPool** - Shared liquidity management
14. **CFY Contracts** - Platform token ecosystem (separate system)

## 1. TokenFactory

**Purpose**: Factory contract that creates new tokens and their associated bonding curves.

**Key Features**:
- Deploys ERC20 tokens with custom parameters
- Creates BondingCurve instances for each token
- Registers tokens with GlobalSupplyTracker
- Tracks all tokens created by each address
- Chain-aware deployment (knows which chain it's on)

**Constructor Parameters**:
```solidity
constructor(
    address initialOwner,
    address _globalSupplyTracker,
    string memory _chainName,
    bool _useGlobalSupply,
    address _lzEndpoint,
    address _crossChainSync,
    address _priceOracle,
    uint32 _chainEID
)
```

**Key Functions**:
- `createToken()` - Main function to create a new token
- `setGlobalSupplyTracker()` - Update tracker address
- `setUseGlobalSupply()` - Enable/disable global supply tracking
- `setLiquidityBridge()` - Configure liquidity bridge

**Design Decisions**:
- **Why a Factory?** Centralized creation makes it easier to track all tokens and ensures consistent deployment parameters.
- **Chain Awareness**: Each factory knows its chain, enabling proper cross-chain communication setup.
- **Owner Control**: Critical parameters can only be updated by owner, preventing unauthorized changes.

**Testing**: We tested with 100+ token creations across all testnets, verifying each token was properly registered and configured.

## 2. BondingCurve

**Purpose**: Manages the buy/sell mechanism for tokens using a linear bonding curve.

**Price Formula**: `price = basePrice + (slope * globalSupply)`

This is where our innovation shines. Instead of using local supply (like traditional bonding curves), we use **global supply** from the GlobalSupplyTracker. This means:
- A buy on BSC Testnet increases the price on Base Sepolia
- Prices stay synchronized across all chains
- Unified market experience

**Key Features**:
- Buy/sell operations with automatic pricing
- Global supply integration for cross-chain sync
- Graduation detection (when market cap threshold reached)
- Liquidity bridging when reserves are low
- Fee collection (buy/sell fees configurable)

**Constructor Parameters**:
```solidity
constructor(
    address _token,
    uint256 _basePrice,
    uint256 _slope,
    uint256 _graduationThreshold,
    uint256 _buyFeePercent,
    uint256 _sellFeePercent,
    address _owner,
    address _globalSupplyTracker,
    string memory _chainName,
    bool _useGlobalSupply,
    address _liquidityBridge,
    uint32 _chainEID,
    bool _useLiquidityBridge
)
```

**Key Functions**:
- `buy(uint256 tokenAmount)` - Buy tokens
- `sell(uint256 tokenAmount)` - Sell tokens
- `getCurrentPrice()` - Get current price per token
- `getPriceForAmountLocal(uint256 tokenAmount)` - Calculate price for specific amount
- `checkAndGraduate()` - Check if graduation threshold reached

**Security Features**:
- Reentrancy guards on all external functions
- Price validation (max 1 ETH per token, 100 ETH per transaction)
- Reserve checks before sells
- Owner-only functions for critical operations

**Gas Optimization**:
- Cached global supply reads
- Batch operations where possible
- Minimal storage writes

**Testing**: We ran extensive tests:
- 1000+ buy/sell transactions
- Edge cases (max amounts, zero amounts, etc.)
- Cross-chain price synchronization
- Graduation scenarios

## 3. GlobalSupplyTracker (V1 - Legacy)

**Purpose**: The original cross-chain price synchronization contract. Tracks the total supply sold across all chains using token addresses as keys.

**Key Features**:
- Global supply tracking per token (address-based)
- Per-chain supply tracking
- Cross-chain synchronization via LayerZero
- Authorized updater system (only bonding curves can update)
- Fallback to local pricing if cross-chain fails

**Limitation**: Uses token addresses as keys, which means tokens with different addresses on each chain are tracked separately. This prevents true cross-chain synchronization for tokens deployed with different addresses.

**Status**: Legacy contract, still functional. New tokens should use GlobalSupplyTrackerV2.

## 4. TokenIDRegistry (New - January 2025)

**Purpose**: Revolutionary contract that enables true cross-chain token identification by mapping token addresses to canonical bytes32 token IDs.

**Key Innovation**: Tokens deployed on different chains have different contract addresses, but they represent the same logical token. TokenIDRegistry creates a unified identity system by mapping all addresses to a single bytes32 token ID (derived from the database UUID).

**Key Features**:
- Maps token addresses to bytes32 token IDs
- Reverse lookup: token ID → address on specific chain
- Primary address tracking (first registered address per token ID)
- Chain-aware address mapping
- Owner-controlled registration

**Data Structure**:
```solidity
mapping(address => bytes32) public tokenIdByAddress; // address => token ID
mapping(bytes32 => address) public primaryAddressByTokenId; // token ID => primary address
mapping(bytes32 => mapping(string => address)) public addressByTokenIdAndChain; // token ID => chain => address
```

**Deployed Addresses**:
- Sepolia: `0x4f3854445c33E9cf42b40B0AB36f4Dd58c23331f`
- BSC Testnet: `0x4f3854445c33E9cf42b40B0AB36f4Dd58c23331f`
- Base Sepolia: `0x1f1f75d84CB2Ff86ffe2b8Fb3eb0d2e94438433D`

**Key Functions**:
- `registerToken()` - Register a token address with a token ID
- `getTokenId()` - Get token ID for an address
- `getTokenAddress()` - Get token address for a token ID on a specific chain
- `isRegistered()` - Check if an address is registered
- `batchRegisterTokens()` - Batch register multiple tokens

**Token ID Generation**: Token IDs are generated by hashing the database UUID (without dashes) using keccak256. This ensures consistency between backend and smart contracts.

**Why This Matters**: Enables true cross-chain price synchronization. A token deployed on Sepolia with address `0xABC...` and on BSC with address `0xDEF...` can now share the same token ID, allowing GlobalSupplyTrackerV2 to track them as a single logical token.

**Testing**: 
- Verified token ID generation matches backend
- Tested address-to-ID and ID-to-address lookups
- Confirmed batch registration works correctly
- Validated cross-chain address mapping

## 5. GlobalSupplyTrackerV2 (New - January 2025)

**Purpose**: Next-generation global supply tracker that uses Token IDs instead of addresses for true cross-chain synchronization.

**Key Innovation**: Unlike V1 which uses addresses (which differ per chain), V2 uses bytes32 token IDs from TokenIDRegistry. This enables tokens with different addresses on each chain to share the same global supply.

**Key Features**:
- Token ID-based global supply tracking
- Chain-specific supply tracking per token ID
- Automatic cross-chain synchronization via LayerZero
- Backward compatible: Auto-looks up token IDs for address-based calls
- Fee management for cross-chain messages
- Authorized updater system (bonding curves)

**Data Structure**:
```solidity
mapping(bytes32 => uint256) public globalSupply; // token ID => total supply
mapping(bytes32 => mapping(string => uint256)) public chainSupply; // token ID => chain => supply
mapping(address => bool) public authorizedUpdaters; // bonding curves
TokenIDRegistry public tokenIDRegistry; // Registry for ID lookups
```

**Deployed Addresses**:
- Sepolia: `0xc443F7e5F0e62C4803030E938d5Cc762F0829A02`
- BSC Testnet: `0xc443F7e5F0e62C4803030E938d5Cc762F0829A02`
- Base Sepolia: `0x7aDD63A32854b5b44091B56e5c37B09Ec32e215C`

**Key Functions**:
- `updateSupplyByTokenId()` - Update supply using token ID (recommended)
- `updateSupply()` - Update supply using address (backward compatible, auto-looks up token ID)
- `getGlobalSupply()` - Get global supply for a token ID
- `getGlobalSupplyByAddress()` - Get global supply for an address (looks up token ID)
- `getChainSupply()` - Get supply for a token ID on a specific chain
- `setCrossChainSync()` - Configure cross-chain sync contract
- `authorizeUpdater()` - Authorize bonding curve to update supply

**Cross-Chain Flow**:
1. BondingCurve calls `updateSupply()` with token address
2. V2 looks up token ID from TokenIDRegistry
3. V2 updates global supply using token ID
4. V2 sends LayerZero message to all other chains (using token address for compatibility)
5. Other chains receive message and update their V2 instances
6. All BondingCurves now see updated global supply

**Backward Compatibility**: 
- Address-based calls automatically look up token IDs
- Falls back to address-based tracking if token not registered
- Existing tokens continue to work

**Why This Matters**: Enables true cross-chain price synchronization. A token with address `0xABC...` on Sepolia and `0xDEF...` on BSC can now share the same global supply, ensuring prices stay synchronized.

**Testing**: 
- Verified token ID lookups work correctly
- Tested cross-chain synchronization with different addresses
- Confirmed backward compatibility with address-based calls
- Validated global supply calculation across chains

## 6. CrossChainSync

**Purpose**: Handles LayerZero messaging for cross-chain communication (legacy, still supported).

**Key Features**:
- Sends supply updates to other chains
- Receives and processes incoming messages
- Message verification and authentication
- Retry logic for failed messages
- Fee estimation

**LayerZero Integration**:
- Uses LayerZero Endpoint V2
- Implements `ILayerZeroReceiver` for message receiving
- Handles message encoding/decoding
- Manages gas limits and fees

**Security**:
- Only authorized contracts can send messages
- Message verification before processing
- Replay attack prevention
- Rate limiting

**Status**: Legacy contract, still functional. New deployments should use UnifiedCrossChainSync.

## 7. UnifiedCrossChainSync

**Purpose**: Next-generation unified interface for multiple cross-chain protocols. Supports LayerZero and Supra HyperNova in parallel.

**Key Innovation**: This contract provides a protocol-agnostic abstraction layer, allowing the platform to use multiple cross-chain protocols simultaneously for redundancy and performance optimization.

**Key Features**:
- **Protocol Abstraction**: Unified interface for LayerZero and Supra
- **Dual Protocol Support**: Can route messages to LayerZero, Supra, or both
- **Message Deduplication**: Prevents double-processing when both protocols deliver
- **Metrics Tracking**: Performance comparison between protocols
- **Automatic Failover**: If one protocol fails, the other handles it
- **Protocol Selection**: Auto-selects best protocol based on metrics, or manual per-token
- **Global Supply Management**: Maintains unified supply tracking across protocols

**Deployed Addresses** (All Networks):
- Sepolia: `0xa5B144683Db8fE4402B06dbb774cacD95FD1A93e`
- BSC Testnet: `0xa5B144683Db8fE4402B06dbb774cacD95FD1A93e`
- Base Sepolia: `0xa5B144683Db8fE4402B06dbb774cacD95FD1A93e`

**Protocol Selection**:
```solidity
enum Protocol { LAYERZERO, SUPRA, BOTH, AUTO }
```

- `LAYERZERO`: Use only LayerZero (battle-tested, reliable)
- `SUPRA`: Use only Supra HyperNova (when EVM support launches)
- `BOTH`: Send via both protocols for maximum redundancy
- `AUTO`: Automatically select best protocol based on metrics

**Key Functions**:
- `syncSupplyUpdate()` - Sync supply using selected protocol(s)
- `setTokenProtocol()` - Set preferred protocol for a token
- `receiveLayerZeroMessage()` - Handle LayerZero messages
- `receiveSupraMessage()` - Handle Supra messages
- `getProtocolMetrics()` - Get performance metrics per protocol
- `authorizeToken()` - Authorize contracts to sync

**Security**:
- Message deduplication prevents double-processing
- Idempotent state updates
- Protocol failure isolation
- Authorized sender verification

**Why This Matters**: Provides redundancy, performance optimization, and future-proofing. LayerZero is proven and reliable, while Supra offers enhanced security with L1-to-L1 cryptographic consensus.

## 8. SupraSync

**Purpose**: Adapter contract for Supra HyperNova cross-chain messaging.

**Key Features**:
- Interface for Supra HyperNova integration
- Message tracking and deduplication
- Chain ID mapping for Supra networks
- Enable/disable toggle
- Forward messages to UnifiedCrossChainSync

**Deployed Addresses** (All Networks):
- Sepolia: `0x0D5f52088E30802DC8d5c67Bc5E2231f7ad36569`
- BSC Testnet: `0x0D5f52088E30802DC8d5c67Bc5E2231f7ad36569`
- Base Sepolia: `0x0D5f52088E30802DC8d5c67Bc5E2231f7ad36569`

**Status**: Placeholder implementation. Will be fully integrated when Supra EVM support launches (expected Q1-Q2 2025).

**Future Integration**:
- Supra HyperNova provides L1-to-L1 cryptographic consensus
- No bridge trust assumptions
- Enhanced security model
- Sub-second finality (600-900ms)

**Key Functions**:
- `syncSupplyUpdate()` - Sync via Supra (when available)
- `receiveSupraMessage()` - Receive Supra messages
- `setEnabled()` - Enable/disable Supra sync
- `isReady()` - Check if Supra is configured and ready

## 9. CrossChainLiquidityBridge

**Purpose**: Manages liquidity across chains, ensuring all chains have sufficient reserves.

**The Problem**: Without this, each chain would need its own liquidity pool. If one chain runs low on reserves, sells would fail.

**The Solution**: Shared liquidity pool that automatically rebalances. When a chain needs liquidity, it requests it from other chains via LayerZero.

**Key Features**:
- Reserve tracking per chain
- Automatic liquidity requests
- Cross-chain liquidity transfers
- Volume-based reserve calculation
- Minimum reserve thresholds

**How It Works**:
1. BondingCurve detects low reserves
2. Calls `requestLiquidity()` on bridge
3. Bridge sends LayerZero message to other chains
4. Chain with excess liquidity sends it back
5. Target chain receives liquidity and updates reserves

**Testing**:
- Tested with various reserve scenarios
- Verified automatic rebalancing
- Confirmed liquidity transfers work correctly
- Tested edge cases (all chains low, one chain very high)

## 10. CrossifyToken

**Purpose**: Standard ERC20 token implementation with additional features.

**Key Features**:
- Standard ERC20 functionality
- Burnable (deflationary mechanism)
- Pausable (emergency stops)
- Custom metadata support
- Transfer restrictions (optional)

**Why Custom Token?**: We needed a token that integrates seamlessly with our bonding curve system and supports all our features.

## 11. Migration

**Purpose**: Handles the migration from bonding curve to DEX when graduation threshold is reached.

**Key Features**:
- Detects graduation conditions
- Creates DEX pool (Uniswap V3, PancakeSwap, etc.)
- Transfers liquidity from bonding curve to DEX
- Updates token state
- Emits graduation events

**DEX Support**:
- Uniswap V3 (Ethereum)
- PancakeSwap (BSC)
- BaseSwap (Base)
- Raydium (Solana - planned)

## 12. DEXDetector

**Purpose**: Automatically detects available DEXes on each chain.

**Key Features**:
- Chain-specific DEX detection
- Router address resolution
- Factory address resolution
- Pool creation parameters

## 13. UnifiedLiquidityPool

**Purpose**: Manages shared liquidity across chains (alternative to bridge approach).

**Status**: Implemented but using bridge approach for now. This provides a different architecture option.

## Contract Deployment

### Testnet Addresses

**Sepolia (Ethereum)**:
- TokenFactory: `0x8eF1A74d477448630282EFC130ac9D17f495Bca4`
- UnifiedCrossChainSync: `0xa5B144683Db8fE4402B06dbb774cacD95FD1A93e`
- SupraSync: `0x0D5f52088E30802DC8d5c67Bc5E2231f7ad36569`
- GlobalSupplyTracker: `[Address]`
- CrossChainLiquidityBridge: `0x7005c0A2c9Cd108af213c717cA6d7232AcBD1b29`

**BSC Testnet**:
- TokenFactory: `0xFF8c690B5b65905da20D8de87Cd6298c223a40B6`
- UnifiedCrossChainSync: `0xa5B144683Db8fE4402B06dbb774cacD95FD1A93e`
- SupraSync: `0x0D5f52088E30802DC8d5c67Bc5E2231f7ad36569`
- GlobalSupplyTracker: `[Address]`
- CrossChainLiquidityBridge: `0x08BA4231c0843375714Ef89999C9F908735E0Ec2`

**Base Sepolia**:
- TokenFactory: `0x170EE984fBcfd01599312EaA1AD4D35Ad5e66f58`
- UnifiedCrossChainSync: `0xa5B144683Db8fE4402B06dbb774cacD95FD1A93e`
- SupraSync: `0x0D5f52088E30802DC8d5c67Bc5E2231f7ad36569`
- GlobalSupplyTracker: `[Address]`
- CrossChainLiquidityBridge: `0xDeFC8B749e68b5e21b3873928e68Aaf56031C6EA`

### Deployment Process

1. **Compile Contracts**: `npx hardhat compile`
2. **Run Tests**: `npx hardhat test`
3. **Deploy**: `npx hardhat run scripts/deploy-[chain].ts --network [network]`
4. **Verify**: `npx hardhat verify --network [network] [address]`
5. **Authorize**: Authorize bonding curves in GlobalSupplyTracker
6. **Configure**: Set cross-chain sync addresses

## Security Considerations

### Audits
- Internal security review completed
- External audit planned before mainnet
- OpenZeppelin libraries used (audited)

### Best Practices
- Reentrancy guards on all external functions
- Access control with Ownable pattern
- Input validation
- Gas optimization
- Event logging for transparency

### Known Limitations
- Cross-chain messages can fail (fallback to local pricing)
- Gas costs on some chains can be high
- LayerZero dependency for cross-chain sync

## Gas Costs

**Typical Operations** (approximate):
- Token Creation: ~2,000,000 gas
- Buy (first): ~150,000 gas
- Buy (subsequent): ~120,000 gas
- Sell: ~130,000 gas
- Cross-chain sync: ~200,000 gas (source) + ~100,000 gas (destination)

## Future Improvements

- [ ] Batch cross-chain updates to reduce gas
- [ ] Optimize storage layout for gas savings
- [ ] Add more DEX support
- [ ] Implement oracle price verification
- [ ] Add governance features

## Conclusion

These contracts represent months of development, testing, and iteration. Each contract was built with security, efficiency, and cross-chain compatibility in mind. The result is a robust, scalable system that enables true multichain token launches.

**- MikeLee**

---

*For development process, see [Development Process](Development-Process)*
*For testing details, see [Testing](Testing)*

