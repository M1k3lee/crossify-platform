// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CrossChainToken
 * @dev ERC20 token with built-in cross-chain price synchronization
 * Automatically syncs price across all chains when tokens are bought/sold on any DEX
 */
interface ICrossChainSync {
    function syncSupplyUpdate(
        address token,
        uint256 newSupply,
        uint32 sourceEID
    ) external payable;
    
    function getGlobalSupply(address token) external view returns (uint256);
}

interface IPriceOracle {
    function verifyPrice(
        address token,
        uint256 price,
        uint32 chainEID
    ) external;
}

contract CrossChainToken is ERC20, ERC20Burnable, ERC20Pausable, Ownable {
    string private _metadataUri;
    
    // Cross-chain sync configuration
    ICrossChainSync public crossChainSync;
    IPriceOracle public priceOracle;
    bool public crossChainEnabled;
    
    // Fee collection for cross-chain operations
    uint256 public crossChainFeePercent = 50; // 0.5% (50 basis points)
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    // Track if this is a bonding curve token
    address public bondingCurve;
    bool public isBondingCurveToken;
    
    // LayerZero EID (Endpoint ID) for this deployment
    uint32 public immutable chainEID;
    
    // Accumulated fees for cross-chain operations
    uint256 public accumulatedFees;
    
    // DEX pairs (Uniswap, etc.) - automatically detected or manually added
    mapping(address => bool) public isDEXPair;
    address[] public dexPairs;
    
    // DEX detector contract
    address public dexDetector;
    
    // Price tracking for cross-chain sync
    struct PriceData {
        uint256 price;
        uint256 supply;
        uint256 timestamp;
    }
    mapping(uint256 => PriceData) public priceHistory; // blockNumber => PriceData
    
    event CrossChainSyncInitiated(
        address indexed token,
        uint256 supply,
        uint32 sourceEID,
        uint256 feeCollected
    );
    
    event DEXPairDetected(address indexed pair);
    event CrossChainFeeCollected(address indexed from, uint256 amount);
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address owner,
        string memory uri,
        address _lzEndpoint,
        uint32 _chainEID,
        address _crossChainSync,
        address _priceOracle
    ) ERC20(name, symbol) Ownable(owner) {
        _metadataUri = uri;
        chainEID = _chainEID;
        crossChainSync = ICrossChainSync(_crossChainSync);
        priceOracle = IPriceOracle(_priceOracle);
        crossChainEnabled = true;
        
        // Mint initial supply to owner (factory will transfer to bonding curve)
        _mint(owner, initialSupply);
    }
    
    /**
     * @dev Set bonding curve address (called by factory after deployment)
     */
    function setBondingCurve(address _bondingCurve) external onlyOwner {
        require(bondingCurve == address(0), "Bonding curve already set");
        bondingCurve = _bondingCurve;
        isBondingCurveToken = true;
    }
    
    /**
     * @dev Set DEX detector contract
     */
    function setDEXDetector(address _dexDetector) external onlyOwner {
        dexDetector = _dexDetector;
    }
    
    /**
     * @dev Auto-detect and add DEX pair
     */
    function autoDetectDEXPair(string memory chain) external {
        require(dexDetector != address(0), "DEX detector not set");
        
        // Call DEX detector to find pair
        (bool success, bytes memory data) = dexDetector.delegatecall(
            abi.encodeWithSignature("detectUniswapV2Pair(address,string)", address(this), chain)
        );
        
        if (success) {
            address pair = abi.decode(data, (address));
            if (pair != address(0) && !isDEXPair[pair]) {
                isDEXPair[pair] = true;
                dexPairs.push(pair);
                emit DEXPairDetected(pair);
            }
        }
    }
    
    /**
     * @dev Add DEX pair address (for tracking trades)
     */
    function addDEXPair(address pair) external onlyOwner {
        require(!isDEXPair[pair], "Pair already added");
        isDEXPair[pair] = true;
        dexPairs.push(pair);
        emit DEXPairDetected(pair);
    }
    
    /**
     * @dev Verify and add DEX pair (with verification)
     */
    function verifyAndAddDEXPair(address pair, string memory chain) external {
        require(dexDetector != address(0), "DEX detector not set");
        
        // Verify pair is legitimate
        (bool success, bytes memory data) = dexDetector.delegatecall(
            abi.encodeWithSignature("verifyDEXPair(address,address,string)", pair, address(this), chain)
        );
        
        require(success && abi.decode(data, (bool)), "Invalid DEX pair");
        
        if (!isDEXPair[pair]) {
            isDEXPair[pair] = true;
            dexPairs.push(pair);
            emit DEXPairDetected(pair);
        }
    }
    
    /**
     * @dev Remove DEX pair
     */
    function removeDEXPair(address pair) external onlyOwner {
        require(isDEXPair[pair], "Pair not found");
        isDEXPair[pair] = false;
        // Remove from array (simplified - in production, use more efficient data structure)
        for (uint i = 0; i < dexPairs.length; i++) {
            if (dexPairs[i] == pair) {
                dexPairs[i] = dexPairs[dexPairs.length - 1];
                dexPairs.pop();
                break;
            }
        }
    }
    
    /**
     * @dev Set cross-chain sync fee percentage
     */
    function setCrossChainFeePercent(uint256 feePercent) external onlyOwner {
        require(feePercent <= 500, "Fee too high"); // Max 5%
        crossChainFeePercent = feePercent;
    }
    
    /**
     * @dev Enable/disable cross-chain synchronization
     */
    function setCrossChainEnabled(bool enabled) external onlyOwner {
        crossChainEnabled = enabled;
    }
    
    /**
     * @dev Override transfer with fee collection for DEX trades
     */
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        return _transferWithFee(_msgSender(), to, amount);
    }
    
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        return _transferWithFee(from, to, amount);
    }
    
    /**
     * @dev Transfer with fee collection for cross-chain sync
     * Collects 0.5% fee on DEX trades to pay for LayerZero messages
     */
    function _transferWithFee(address from, address to, uint256 amount) internal returns (bool) {
        // Check if this is a DEX trade
        bool isDEXTrade = crossChainEnabled && 
                          (isDEXPair[from] || isDEXPair[to]) && 
                          from != bondingCurve && 
                          to != bondingCurve &&
                          from != address(0) &&
                          to != address(0);
        
        uint256 transferAmount = amount;
        uint256 fee = 0;
        
        // Collect fee on DEX trades (0.5% for cross-chain sync)
        if (isDEXTrade && crossChainFeePercent > 0) {
            fee = (amount * crossChainFeePercent) / FEE_DENOMINATOR;
            if (fee > 0 && fee < amount) {
                transferAmount = amount - fee;
                // Transfer fee to contract (will be converted to native tokens by relayer)
                super._update(from, address(this), fee);
                accumulatedFees += fee;
                emit CrossChainFeeCollected(from, fee);
            }
        }
        
        // Perform the actual transfer
        super._update(from, to, transferAmount);
        
        // Trigger cross-chain sync if DEX trade and we have native tokens for fees
        if (isDEXTrade && address(this).balance >= _estimateCrossChainFee()) {
            _syncCrossChainSupply();
        }
        
        return true;
    }
    
    /**
     * @dev Standard _update hook (used for internal operations like mints/burns)
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Pausable) {
        // Called for mints, burns, and fee transfers
        super._update(from, to, value);
    }
    
    /**
     * @dev Sync supply across all chains
     * Called automatically on DEX trades or manually by bonding curve
     */
    function syncCrossChainSupply() external payable {
        require(
            msg.sender == bondingCurve || msg.sender == owner(),
            "Not authorized"
        );
        _syncCrossChainSupply();
    }
    
    /**
     * @dev Internal function to sync supply across chains
     */
    function _syncCrossChainSupply() internal {
        if (!crossChainEnabled || address(crossChainSync) == address(0)) {
            return;
        }
        
        uint256 currentSupply = totalSupply();
        uint256 circulatingSupply = currentSupply - balanceOf(address(0)) - balanceOf(address(this)); // Exclude burned and fee tokens
        
        // Use native token balance for LayerZero fees (ETH/BNB)
        // In production, we'd need to convert token fees to native tokens
        // For now, we'll use a simpler approach: require native tokens to be sent
        // OR use a relayer service that converts token fees to native
        
        // Check if we have enough native tokens for cross-chain message
        // If not, skip this sync (oracle will verify later)
        uint256 estimatedFee = _estimateCrossChainFee();
        
        if (address(this).balance < estimatedFee) {
            // Not enough native tokens, skip sync
            // Oracle will verify and reconcile later
            return;
        }
        
        // Call cross-chain sync contract
        try crossChainSync.syncSupplyUpdate{value: estimatedFee}(
            address(this),
            circulatingSupply,
            chainEID
        ) {
            emit CrossChainSyncInitiated(
                address(this),
                circulatingSupply,
                chainEID,
                estimatedFee
            );
        } catch {
            // Silent fail - cross-chain sync is best effort
            // Oracle will verify and reconcile later
        }
        
        // Update price history
        priceHistory[block.number] = PriceData({
            price: _calculateCurrentPrice(circulatingSupply),
            supply: circulatingSupply,
            timestamp: block.timestamp
        });
        
        // Notify oracle for verification (non-blocking)
        if (address(priceOracle) != address(0)) {
            try priceOracle.verifyPrice(
                address(this),
                _calculateCurrentPrice(circulatingSupply),
                chainEID
            ) {} catch {
                // Oracle verification is non-blocking
            }
        }
    }
    
    /**
     * @dev Estimate fee for cross-chain message
     */
    function _estimateCrossChainFee() internal view returns (uint256) {
        // Estimate LayerZero fee (simplified)
        // In production, query CrossChainSync contract for actual estimate
        // Rough estimate: 0.001 ETH per chain
        uint256 chainsToSync = 3; // Ethereum, BSC, Base (excluding current chain)
        return 0.001 ether * chainsToSync; // ~0.003 ETH total
    }
    
    /**
     * @dev Collect fee from transfer and store for cross-chain sync
     * This needs to be called BEFORE the transfer in a custom transfer function
     * For now, we'll use a different approach: fee on transfer hook
     */
    function _collectCrossChainFee(address from, uint256 amount) internal returns (uint256 fee) {
        if (from == bondingCurve || from == address(0) || !crossChainEnabled) {
            return 0; // No fee for bonding curve or mints
        }
        
        // Calculate fee
        fee = (amount * crossChainFeePercent) / FEE_DENOMINATOR;
        
        if (fee > 0) {
            // In a real implementation, we'd need to modify the transfer to collect the fee
            // For now, we'll use a simpler approach: collect fees on buy/sell operations
            // DEX trades will trigger sync, and fees will be collected from future operations
        }
        
        return fee;
    }
    
    /**
     * @dev Calculate current price based on supply
     * Uses bonding curve formula if available, otherwise uses market cap / supply
     */
    function _calculateCurrentPrice(uint256 supply) internal view returns (uint256) {
        // If we have a bonding curve, query its price
        if (isBondingCurveToken && bondingCurve != address(0)) {
            try IBondingCurve(bondingCurve).getCurrentPrice() returns (uint256 price) {
                return price;
            } catch {
                // Fallback to market cap calculation
            }
        }
        
        // Fallback: Use a simple price calculation based on supply
        // In production, this would query DEX prices or use an oracle
        return supply; // Simplified - replace with actual price logic
    }
    
    /**
     * @dev Get current global supply across all chains
     */
    function getGlobalSupply() external view returns (uint256) {
        if (address(crossChainSync) == address(0)) {
            return totalSupply();
        }
        
        try crossChainSync.getGlobalSupply(address(this)) returns (uint256 globalSupply) {
            return globalSupply;
        } catch {
            return totalSupply(); // Fallback to local supply
        }
    }
    
    /**
     * @dev Calculate price for a given amount of tokens
     */
    function getPriceForAmount(uint256 amount) external view returns (uint256) {
        uint256 globalSupply = this.getGlobalSupply();
        uint256 currentPrice = _calculateCurrentPrice(globalSupply);
        return currentPrice * amount;
    }
    
    /**
     * @dev Withdraw collected fees (for cross-chain operations)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            payable(owner()).transfer(balance);
        }
    }
    
    function metadataUri() public view returns (string memory) {
        return _metadataUri;
    }
    
    function pause() public onlyOwner {
        _pause();
    }
    
    function unpause() public onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Mint new tokens (only owner can call)
     * This allows token owners to mint additional tokens if mintable feature is enabled
     */
    function mint(address to, uint256 amount) external virtual onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Burn tokens (only owner can call, or user can burn their own)
     * Uses ERC20Burnable's burn function
     */
    // burn() is already available from ERC20Burnable
}

interface IBondingCurve {
    function getCurrentPrice() external view returns (uint256);
}

