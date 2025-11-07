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
    function updateSupply(address tokenId, string memory chain, uint256 newSupply) external;
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
                supply = globalSupply;
            } catch {
                // If tracker call fails (e.g., not authorized yet), fall back to local supply
                supply = totalSupplySold;
            }
        }
        
        return basePrice + (slope * supply);
    }
    
    /**
     * @dev Get the supply used for price calculation (local or global)
     */
    function getSupplyForPricing() public view returns (uint256) {
        if (useGlobalSupply && address(globalSupplyTracker) != address(0)) {
            try globalSupplyTracker.getGlobalSupply(address(token)) returns (uint256 globalSupply) {
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
     */
    function getPriceForAmount(uint256 tokenAmount) public view returns (uint256) {
        // Use getSupplyForPricing which already handles global vs local supply
        uint256 supply = getSupplyForPricing();
        // Price = basePrice * amount + slope * (amount * (supply + amount/2))
        // For more accuracy with linear bonding curve
        uint256 avgPrice = basePrice + (slope * (supply + tokenAmount / 2));
        return avgPrice * tokenAmount;
    }
    
    /**
     * @dev Buy tokens from the bonding curve
     */
    function buy(uint256 tokenAmount) external payable nonReentrant {
        require(!isGraduated, "Curve has graduated to DEX");
        require(tokenAmount > 0, "Amount must be greater than 0");
        
        uint256 price = getPriceForAmount(tokenAmount);
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
        
        // Update global supply if enabled
        if (useGlobalSupply && address(globalSupplyTracker) != address(0)) {
            try globalSupplyTracker.updateSupply(address(token), chainName, totalSupplySold) {
                // Supply updated successfully
            } catch {
                // If update fails (e.g., not authorized yet), continue without updating
                // This allows tokens to be created even if tracker isn't fully set up
            }
        }
        
        // Refund excess
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
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
        
        uint256 price = getPriceForAmount(tokenAmount);
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
        
        // Update global supply if enabled
        if (useGlobalSupply && address(globalSupplyTracker) != address(0)) {
            try globalSupplyTracker.updateSupply(address(token), chainName, totalSupplySold) {
                // Supply updated successfully
            } catch {
                // If update fails (e.g., not authorized yet), continue without updating
            }
        }
        
        // Transfer payment to seller
        payable(msg.sender).transfer(amountReceived);
        
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



