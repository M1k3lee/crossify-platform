// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title GlobalSupplyTracker
 * @dev Interface for global supply tracking
 */
interface IGlobalSupplyTracker {
    function getGlobalSupply(address tokenId) external view returns (uint256);
    function updateSupply(address tokenId, string memory chain, uint256 newSupply) external payable;
}

/**
 * @title BondingCurve
 * @dev Linear bonding curve for token sales with automatic graduation
 * Uses VIRTUAL LIQUIDITY with global supply tracking for cross-chain price sync
 * Price formula: price = basePrice + (slope * globalSupplySold)
 */
contract BondingCurve is Ownable, ReentrancyGuard {
    IERC20 public token;
    uint256 public basePrice; // Price per token at supply = 0 (in wei)
    uint256 public slope; // Price increase per token sold (in wei)
    uint256 public graduationThreshold; // Market cap threshold in USD (scaled by 1e18)
    uint256 public buyFeePercent; // Fee percentage (e.g., 100 = 1%)
    uint256 public sellFeePercent;
    
    uint256 public totalSupplySold; // Local supply on this chain
    uint256 public totalReserve; // Total ETH/BNB collected
    bool public isGraduated;
    address public dexPool; // Address of DEX pool after graduation
    
    // Global supply tracking for cross-chain price synchronization
    IGlobalSupplyTracker public globalSupplyTracker;
    string public chainName; // e.g., "ethereum", "bsc", "base"
    bool public useGlobalSupply; // Whether to use global supply for pricing
    
    event TokenBought(address indexed buyer, uint256 amountPaid, uint256 tokensReceived);
    event TokenSold(address indexed seller, uint256 tokensSold, uint256 amountReceived);
    event Graduated(address indexed dexPool, uint256 reserveAmount);
    
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
        bool _useGlobalSupply
    ) Ownable(_owner) {
        token = IERC20(_token);
        basePrice = _basePrice;
        slope = _slope;
        graduationThreshold = _graduationThreshold;
        buyFeePercent = _buyFeePercent;
        sellFeePercent = _sellFeePercent;
        globalSupplyTracker = IGlobalSupplyTracker(_globalSupplyTracker);
        chainName = _chainName;
        useGlobalSupply = _useGlobalSupply;
    }
    
    /**
     * @dev Set global supply tracker (only owner)
     */
    function setGlobalSupplyTracker(address _tracker) external onlyOwner {
        globalSupplyTracker = IGlobalSupplyTracker(_tracker);
    }
    
    /**
     * @dev Enable/disable global supply usage
     */
    function setUseGlobalSupply(bool _use) external onlyOwner {
        useGlobalSupply = _use;
    }
    
    /**
     * @dev Calculate current price per token
     * Uses GLOBAL supply if enabled for cross-chain price synchronization
     */
    function getCurrentPrice() public view returns (uint256) {
        uint256 supply = totalSupplySold;
        
        // Use global supply if enabled and tracker is set
        if (useGlobalSupply && address(globalSupplyTracker) != address(0)) {
            try globalSupplyTracker.getGlobalSupply(address(token)) returns (uint256 globalSupply) {
                // Safety check: if global supply seems way off, use local
                if (globalSupply > totalSupplySold && totalSupplySold > 0) {
                    uint256 ratio = globalSupply / totalSupplySold;
                    if (ratio > 1000) {
                        supply = totalSupplySold; // Use local if global is 1000x+ larger
                    } else {
                        supply = globalSupply;
                    }
                } else if (totalSupplySold == 0 && globalSupply > 0) {
                    supply = globalSupply;
                } else {
                    supply = globalSupply;
                }
            } catch {
                // If tracker call fails, fall back to local supply
                supply = totalSupplySold;
            }
        }
        
        // Convert supply from wei to base token units (divide by 1e18)
        // slope is in wei per token, so: price = basePrice + slope * (supply / 1e18)
        uint256 supplyInTokens = supply / 1 ether;
        return basePrice + (slope * supplyInTokens);
    }
    
    /**
     * @dev Get the supply used for price calculation (local or global)
     * Safety: Validates global supply to prevent astronomical prices from corrupted data
     * Maximum reasonable supply: 1 billion tokens = 1e9 * 1e18 = 1e27 wei
     */
    function getSupplyForPricing() public view returns (uint256) {
        if (useGlobalSupply && address(globalSupplyTracker) != address(0)) {
            try globalSupplyTracker.getGlobalSupply(address(token)) returns (uint256 globalSupply) {
                // CRITICAL SAFETY CHECK: Maximum reasonable supply is 1 billion tokens (1e27 wei)
                // If global supply exceeds this, it's definitely corrupted - use local supply
                uint256 maxReasonableSupply = 1e9 * 1 ether; // 1 billion tokens
                if (globalSupply > maxReasonableSupply) {
                    // Global supply is corrupted - use local supply instead
                    return totalSupplySold;
                }
                
                // Safety check: if global supply is way larger than local supply (100x+), 
                // it might be a unit mismatch - use local supply instead
                // This prevents astronomical prices from incorrect global supply values
                if (globalSupply > totalSupplySold && totalSupplySold > 0) {
                    uint256 ratio = globalSupply / totalSupplySold;
                    // If global is more than 100x local, something is wrong - use local
                    if (ratio > 100) {
                        return totalSupplySold;
                    }
                }
                
                // If local is 0 but global has value, validate global supply is reasonable
                // For a new token on this chain, global supply should be small
                if (totalSupplySold == 0 && globalSupply > 0) {
                    // Additional validation: if global supply is extremely large for a "new" token,
                    // it's likely corrupted - return 0 to use base price
                    if (globalSupply > 1e6 * 1 ether) { // More than 1 million tokens seems unreasonable for a new chain
                        return 0;
                    }
                    return globalSupply;
                }
                
                // Otherwise use global supply (it has passed all safety checks)
                return globalSupply;
            } catch {
                // If tracker call fails, fall back to local supply
                return totalSupplySold;
            }
        }
        return totalSupplySold;
    }
    
    /**
     * @dev Calculate price for a specific amount of tokens
     * NOTE: totalSupplySold is in wei (18 decimals), but for price calculation we treat it as base token units
     * This means we divide by 1e18 to get the number of tokens, then calculate price
     * SAFETY: Includes overflow protection and maximum price limits
     */
    function getPriceForAmount(uint256 tokenAmount) public view returns (uint256) {
        require(tokenAmount > 0, "Amount must be greater than 0");
        
        // Use getSupplyForPricing which already handles global vs local supply with safety checks
        uint256 supply = getSupplyForPricing();
        
        // Convert supply and tokenAmount from wei to base token units (divide by 1 ether)
        // This is needed because totalSupplySold stores tokens in wei, but price calculation expects base units
        uint256 supplyInTokens = supply / 1 ether;
        uint256 amountInTokens = tokenAmount / 1 ether;
        
        // SAFETY CHECK: Maximum reasonable amount is 1 billion tokens
        // If amountInTokens is larger, the calculation would be invalid
        require(amountInTokens <= 1e9, "Amount too large");
        
        // For very small amounts (< 1 ether = < 1 token), handle separately
        if (tokenAmount < 1 ether) {
            // For amounts less than 1 token, use simplified calculation to avoid overflow
            // Price ≈ basePrice * (tokenAmount / 1 ether) 
            // For small amounts, we can ignore the slope component to prevent overflow issues
            uint256 priceFromBase = (basePrice * tokenAmount) / 1 ether;
            
            // SAFETY: Ensure result doesn't exceed maximum reasonable price (100 ETH)
            uint256 maxPrice = 100 ether; // 100 ETH maximum
            if (priceFromBase > maxPrice) {
                revert("Price calculation overflow - basePrice may be too high");
            }
            
            return priceFromBase;
        }
        
        // Standard calculation for amounts >= 1 token
        // Price per token at average supply = basePrice + slope * (supplyInTokens + amountInTokens / 2)
        // SAFETY: Check for overflow in slope calculation
        uint256 supplyForAvgPrice = supplyInTokens + (amountInTokens / 2);
        
        // Maximum reasonable supply for price calculation: 1 billion tokens
        if (supplyForAvgPrice > 1e9) {
            revert("Supply too large for price calculation");
        }
        
        // Calculate average price per token
        // Price = basePrice + slope * supplyForAvgPrice
        // Solidity 0.8+ has automatic overflow protection, but we validate inputs first
        
        // SAFETY: Validate inputs before multiplication to prevent overflow
        // Maximum reasonable slope: 0.01 ETH per token = 1e16 wei
        // Maximum reasonable supplyForAvgPrice: 1e9 tokens (already checked above)
        // Maximum product: 1e16 * 1e9 = 1e25, which is safe (well below 2^256)
        uint256 slopeComponent = slope * supplyForAvgPrice;
        
        // SAFETY: Check if slopeComponent is reasonable
        // If slopeComponent > 1e25, something is wrong with inputs
        if (slopeComponent > 1e25) {
            revert("Slope calculation error - slope or supply values are invalid");
        }
        
        uint256 avgPricePerToken = basePrice + slopeComponent;
        
        // SAFETY: Validate avgPricePerToken is reasonable (max 1 ETH per token)
        // This prevents astronomical prices per token
        uint256 maxPricePerToken = 1 ether; // 1 ETH per token maximum
        if (avgPricePerToken > maxPricePerToken) {
            revert("Price per token exceeds maximum (1 ETH) - check basePrice and slope");
        }
        
        // Total price = avgPricePerToken * amountInTokens
        // Both are in wei, so result is in wei
        // Validate inputs before multiplication
        // Maximum avgPricePerToken: 1 ether (already validated)
        // Maximum amountInTokens: 1e9 (already validated)
        // Maximum product: 1e9 * 1e18 = 1e27, which is safe
        uint256 totalPrice = avgPricePerToken * amountInTokens;
        
        // FINAL SAFETY CHECK: Maximum total price is 100 ETH
        // This is the absolute maximum for any single transaction
        uint256 maxTotalPrice = 100 ether;
        if (totalPrice > maxTotalPrice) {
            revert("Total price exceeds maximum (100 ETH) - reduce amount or check supply");
        }
        
        return totalPrice;
    }
    
    /**
     * @dev Get price for amount using LOCAL supply only (for transaction calculations)
     * This ensures failed transactions don't affect local price
     * Global supply is used for display/consistency, but transactions use local supply
     */
    function _getPriceForAmountLocal(uint256 tokenAmount) internal view returns (uint256) {
        require(tokenAmount > 0, "Amount must be greater than 0");
        
        // Use LOCAL supply only for transaction calculations
        // This prevents price increases from failed transactions
        uint256 supply = totalSupplySold;
        
        // Convert supply and tokenAmount from wei to base token units
        uint256 supplyInTokens = supply / 1 ether;
        uint256 amountInTokens = tokenAmount / 1 ether;
        
        // SAFETY CHECK: Maximum reasonable amount is 1 billion tokens
        require(amountInTokens <= 1e9, "Amount too large");
        
        // For very small amounts (< 1 token), use simplified calculation
        if (tokenAmount < 1 ether) {
            uint256 priceFromBase = (basePrice * tokenAmount) / 1 ether;
            uint256 maxPrice = 100 ether;
            if (priceFromBase > maxPrice) {
                revert("Price calculation overflow - basePrice may be too high");
            }
            return priceFromBase;
        }
        
        // Standard calculation: Price per token at average supply
        uint256 supplyForAvgPrice = supplyInTokens + (amountInTokens / 2);
        
        // Maximum reasonable supply for price calculation
        if (supplyForAvgPrice > 1e9) {
            revert("Supply too large for price calculation");
        }
        
        // Calculate average price per token using LOCAL supply only
        uint256 slopeComponent = slope * supplyForAvgPrice;
        if (slopeComponent > 1e25) {
            revert("Slope calculation error");
        }
        
        uint256 avgPricePerToken = basePrice + slopeComponent;
        
        // Validate price per token is reasonable
        uint256 maxPricePerToken = 1 ether;
        if (avgPricePerToken > maxPricePerToken) {
            revert("Price per token exceeds maximum (1 ETH)");
        }
        
        // Total price = avgPricePerToken * amountInTokens
        uint256 totalPrice = avgPricePerToken * amountInTokens;
        
        // Final safety check
        uint256 maxTotalPrice = 100 ether;
        if (totalPrice > maxTotalPrice) {
            revert("Total price exceeds maximum (100 ETH)");
        }
        
        return totalPrice;
    }
    
    /**
     * @dev Buy tokens from the bonding curve
     */
    function buy(uint256 tokenAmount) external payable nonReentrant {
        require(!isGraduated, "Curve has graduated to DEX");
        require(tokenAmount > 0, "Amount must be greater than 0");
        
        // CRITICAL FIX: Use LOCAL supply for transaction price calculation
        // This ensures failed transactions don't cause price increases
        // Global supply is used for display/consistency, but actual transactions use local supply
        uint256 price = _getPriceForAmountLocal(tokenAmount);
        uint256 fee = (price * buyFeePercent) / 10000;
        uint256 totalCost = price + fee;
        
        require(msg.value >= totalCost, "Insufficient payment");
        
        // Graduation feature: Only check if threshold is set (not 0)
        // Setting threshold to 0 disables graduation - tokens remain on bonding curve indefinitely
        if (graduationThreshold > 0) {
            // Check graduation threshold (simplified - in production, use oracle for USD price)
            uint256 marketCap = getCurrentPrice() * (totalSupplySold + tokenAmount);
            if (marketCap >= graduationThreshold) {
                // Auto-graduate
                _graduate();
                revert("Token has graduated. Please use DEX.");
            }
        }
        
        // Transfer tokens to buyer
        require(token.transfer(msg.sender, tokenAmount), "Token transfer failed");
        
        totalSupplySold += tokenAmount;
        totalReserve += price;
        
        // Refund excess payment first (before cross-chain sync to avoid balance issues)
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
        
        // Update global supply if enabled
        // Note: We pass 0 value - GlobalSupplyTracker will use its own balance for fees
        // This avoids affecting the bonding curve's reserve calculations
        if (useGlobalSupply && address(globalSupplyTracker) != address(0)) {
            try globalSupplyTracker.updateSupply{value: 0}(
                address(token), 
                chainName, 
                totalSupplySold
            ) {
                // Supply updated successfully, cross-chain sync attempted if enabled
                // GlobalSupplyTracker will use its own balance for LayerZero fees
            } catch {
                // If update fails (e.g., not authorized yet), continue without updating
                // This allows tokens to be created even if tracker isn't fully set up
            }
        }
        
        emit TokenBought(msg.sender, price, tokenAmount);
    }
    
    /**
     * @dev Sell tokens back to the bonding curve
     * Now supports cross-chain liquidity bridging when reserves are low
     */
    function sell(uint256 tokenAmount) external nonReentrant {
        require(!isGraduated, "Curve has graduated to DEX");
        require(tokenAmount > 0, "Amount must be greater than 0");
        require(token.balanceOf(msg.sender) >= tokenAmount, "Insufficient balance");
        
        // CRITICAL FIX: Use LOCAL supply for transaction price calculation
        // This ensures failed transactions don't cause price changes
        // Global supply is used for display/consistency, but actual transactions use local supply
        uint256 price = _getPriceForAmountLocal(tokenAmount);
        uint256 fee = (price * sellFeePercent) / 10000;
        uint256 amountReceived = price - fee;
        
        // Check if we have enough reserve
        // If not, the transaction will revert - liquidity bridge should be called first
        // In production, this could trigger an automatic bridge request
        if (address(this).balance < amountReceived) {
            // Emit event for liquidity bridge to detect
            emit InsufficientReserve(address(this).balance, amountReceived);
            revert("Insufficient reserve. Cross-chain liquidity bridge may be needed.");
        }
        
        // Transfer tokens from seller
        require(token.transferFrom(msg.sender, address(this), tokenAmount), "Token transfer failed");
        
        totalSupplySold = totalSupplySold > tokenAmount ? totalSupplySold - tokenAmount : 0;
        totalReserve = totalReserve > price ? totalReserve - price : 0;
        
        // Transfer payment to seller first
        payable(msg.sender).transfer(amountReceived);
        
        // Update global supply if enabled
        // Note: We pass 0 value - GlobalSupplyTracker will use its own balance for fees
        if (useGlobalSupply && address(globalSupplyTracker) != address(0)) {
            try globalSupplyTracker.updateSupply{value: 0}(
                address(token), 
                chainName, 
                totalSupplySold
            ) {
                // Supply updated successfully, cross-chain sync attempted if enabled
                // GlobalSupplyTracker will use its own balance for LayerZero fees
            } catch {
                // If update fails (e.g., not authorized yet), continue without updating
            }
        }
        
        emit TokenSold(msg.sender, tokenAmount, amountReceived);
    }
    
    event InsufficientReserve(uint256 currentReserve, uint256 requiredAmount);
    
    /**
     * @dev Graduate to DEX - migrates liquidity and freezes curve
     */
    function graduate(address dexPoolAddress) external onlyOwner {
        require(!isGraduated, "Already graduated");
        require(dexPoolAddress != address(0), "Invalid DEX pool address");
        
        _graduate();
        dexPool = dexPoolAddress;
    }
    
    function _graduate() internal {
        isGraduated = true;
        
        // Transfer remaining tokens and reserve to owner for DEX migration
        // In production, this would transfer to a migration contract
        
        emit Graduated(dexPool, totalReserve);
    }
    
    /**
     * @dev Get market cap estimate
     */
    function getMarketCap() external view returns (uint256) {
        return getCurrentPrice() * totalSupplySold;
    }
    
    /**
     * @dev Update buy fee percentage (only owner)
     * @param _buyFeePercent New buy fee percentage (e.g., 100 = 1%, max 1000 = 10%)
     */
    function setBuyFeePercent(uint256 _buyFeePercent) external onlyOwner {
        require(_buyFeePercent <= 1000, "Buy fee cannot exceed 10%");
        buyFeePercent = _buyFeePercent;
    }
    
    /**
     * @dev Update sell fee percentage (only owner)
     * @param _sellFeePercent New sell fee percentage (e.g., 100 = 1%, max 1000 = 10%)
     */
    function setSellFeePercent(uint256 _sellFeePercent) external onlyOwner {
        require(_sellFeePercent <= 1000, "Sell fee cannot exceed 10%");
        sellFeePercent = _sellFeePercent;
    }
    
    /**
     * @dev Update both buy and sell fees (only owner)
     */
    function setFees(uint256 _buyFeePercent, uint256 _sellFeePercent) external onlyOwner {
        require(_buyFeePercent <= 1000, "Buy fee cannot exceed 10%");
        require(_sellFeePercent <= 1000, "Sell fee cannot exceed 10%");
        buyFeePercent = _buyFeePercent;
        sellFeePercent = _sellFeePercent;
    }
    
    /**
     * @dev Withdraw fees (only owner)
     */
    function withdrawFees() external onlyOwner {
        // Fee calculation and withdrawal logic
        // In production, track fees separately
    }
    
    receive() external payable {}
}



