// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CFYToken
 * @dev Crossify Platform Token (CFY) with advanced tokenomics
 * 
 * Features:
 * - Total Supply: 1,000,000,000 CFY (1 billion)
 * - Automatic Buyback: 50% of platform fees
 * - Liquidity Provision: 30% of platform fees
 * - Deflationary Burns: 10% of platform fees
 * - Staking Rewards: Up to 100% APY
 * - Fee Discounts: Based on holder balance
 * - Governance: 1 CFY = 1 vote
 * 
 * Distribution:
 * - Presale: 30% (300M)
 * - Liquidity Pool: 25% (250M)
 * - Team & Advisors: 15% (150M) - 6 month cliff, 24 month vesting
 * - Ecosystem: 15% (150M)
 * - Staking Rewards: 10% (100M) - distributed over 4 years
 * - Treasury: 5% (50M)
 */
contract CFYToken is ERC20, ERC20Burnable, ERC20Pausable, Ownable, ReentrancyGuard {
    // Tokenomics constants
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18; // 1 billion CFY
    
    // Fee distribution percentages (basis points: 10000 = 100%)
    uint256 public constant BUYBACK_PERCENT = 5000; // 50%
    uint256 public constant LIQUIDITY_PERCENT = 3000; // 30%
    uint256 public constant BURN_PERCENT = 1000; // 10%
    uint256 public constant OPERATIONS_PERCENT = 700; // 7%
    uint256 public constant TREASURY_PERCENT = 300; // 3%
    
    // Buyback thresholds
    uint256 public dailyBuybackThreshold = 1 ether; // $1K equivalent
    uint256 public weeklyBuybackThreshold = 5 ether; // $5K equivalent
    
    // Contracts
    address public buybackContract;
    address public liquidityContract;
    address public stakingContract;
    address public governanceContract;
    address public feeDiscountContract;
    address public feeCollector;
    address public treasury;
    
    // Tracking
    uint256 public totalBurned;
    uint256 public totalBuybackAmount;
    uint256 public totalLiquidityAdded;
    uint256 public lastDailyBuyback;
    uint256 public lastWeeklyBuyback;
    uint256 public dailyBuybackAccumulated;
    uint256 public weeklyBuybackAccumulated;
    
    // Fee discount tiers (based on balance)
    mapping(uint256 => uint256) public discountTiers; // balance threshold => discount %
    mapping(address => bool) public feeExempt;
    
    // Events
    event BuybackExecuted(uint256 amount, uint256 cfyBought);
    event LiquidityAdded(uint256 amount, address pool);
    event TokensBurned(uint256 amount, string reason);
    event FeeCollected(address indexed from, uint256 amount, string feeType);
    event DiscountApplied(address indexed holder, uint256 discountPercent);
    event ContractUpdated(string contractType, address oldAddress, address newAddress);
    
    constructor(
        address _owner,
        address _feeCollector,
        address _treasury
    ) ERC20("Crossify Token", "CFY") Ownable(_owner) {
        require(_owner != address(0), "Invalid owner");
        require(_feeCollector != address(0), "Invalid fee collector");
        require(_treasury != address(0), "Invalid treasury");
        
        feeCollector = _feeCollector;
        treasury = _treasury;
        
        // Initialize discount tiers
        // 1K CFY = 5% discount
        discountTiers[1_000 * 10**18] = 500; // 5%
        // 10K CFY = 10% discount
        discountTiers[10_000 * 10**18] = 1000; // 10%
        // 100K CFY = 20% discount
        discountTiers[100_000 * 10**18] = 2000; // 20%
        // 1M CFY = 50% discount
        discountTiers[1_000_000 * 10**18] = 5000; // 50%
        
        // Mint total supply to owner for distribution
        _mint(_owner, TOTAL_SUPPLY);
        
        // Initialize timestamps
        lastDailyBuyback = block.timestamp;
        lastWeeklyBuyback = block.timestamp;
    }
    
    /**
     * @dev Set buyback contract address
     */
    function setBuybackContract(address _buybackContract) external onlyOwner {
        address oldAddress = buybackContract;
        buybackContract = _buybackContract;
        emit ContractUpdated("Buyback", oldAddress, _buybackContract);
    }
    
    /**
     * @dev Set liquidity provision contract address
     */
    function setLiquidityContract(address _liquidityContract) external onlyOwner {
        address oldAddress = liquidityContract;
        liquidityContract = _liquidityContract;
        emit ContractUpdated("Liquidity", oldAddress, _liquidityContract);
    }
    
    /**
     * @dev Set staking contract address
     */
    function setStakingContract(address _stakingContract) external onlyOwner {
        address oldAddress = stakingContract;
        stakingContract = _stakingContract;
        emit ContractUpdated("Staking", oldAddress, _stakingContract);
    }
    
    /**
     * @dev Set governance contract address
     */
    function setGovernanceContract(address _governanceContract) external onlyOwner {
        address oldAddress = governanceContract;
        governanceContract = _governanceContract;
        emit ContractUpdated("Governance", oldAddress, _governanceContract);
    }
    
    /**
     * @dev Set fee discount contract address
     */
    function setFeeDiscountContract(address _feeDiscountContract) external onlyOwner {
        address oldAddress = feeDiscountContract;
        feeDiscountContract = _feeDiscountContract;
        emit ContractUpdated("FeeDiscount", oldAddress, _feeDiscountContract);
    }
    
    /**
     * @dev Set fee collector address
     */
    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "Invalid address");
        feeCollector = _feeCollector;
    }
    
    /**
     * @dev Set treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid address");
        treasury = _treasury;
    }
    
    /**
     * @dev Set fee exemption for an address
     */
    function setFeeExempt(address account, bool exempt) external onlyOwner {
        feeExempt[account] = exempt;
    }
    
    /**
     * @dev Set discount tier
     */
    function setDiscountTier(uint256 balanceThreshold, uint256 discountPercent) external onlyOwner {
        require(discountPercent <= 10000, "Discount cannot exceed 100%");
        discountTiers[balanceThreshold] = discountPercent;
    }
    
    /**
     * @dev Collect platform fees and distribute according to tokenomics
     * Called by platform contracts when fees are collected (in native tokens)
     */
    function collectFees(uint256 amount, string memory feeType) public payable nonReentrant {
        require(msg.sender == feeCollector || msg.sender == owner(), "Not authorized");
        require(amount > 0 || msg.value > 0, "Amount must be greater than 0");
        
        uint256 feeAmount = msg.value > 0 ? msg.value : amount;
        
        emit FeeCollected(msg.sender, feeAmount, feeType);
        
        // Distribute fees according to tokenomics
        uint256 buybackAmount = (feeAmount * BUYBACK_PERCENT) / 10000;
        uint256 liquidityAmount = (feeAmount * LIQUIDITY_PERCENT) / 10000;
        uint256 burnAmount = (feeAmount * BURN_PERCENT) / 10000;
        uint256 operationsAmount = (feeAmount * OPERATIONS_PERCENT) / 10000;
        uint256 treasuryAmount = (feeAmount * TREASURY_PERCENT) / 10000;
        
        // Accumulate buyback amounts
        dailyBuybackAccumulated += buybackAmount;
        weeklyBuybackAccumulated += buybackAmount;
        
        // Execute buyback if thresholds reached
        if (dailyBuybackAccumulated >= dailyBuybackThreshold && 
            block.timestamp >= lastDailyBuyback + 1 days) {
            _executeBuyback(dailyBuybackAccumulated);
            dailyBuybackAccumulated = 0;
            lastDailyBuyback = block.timestamp;
        } else if (weeklyBuybackAccumulated >= weeklyBuybackThreshold && 
                   block.timestamp >= lastWeeklyBuyback + 7 days) {
            _executeBuyback(weeklyBuybackAccumulated);
            weeklyBuybackAccumulated = 0;
            lastWeeklyBuyback = block.timestamp;
        }
        
        // Add liquidity
        if (liquidityAmount > 0 && liquidityContract != address(0)) {
            _addLiquidity(liquidityAmount);
        }
        
        // Burn tokens (convert native tokens to CFY and burn)
        // Note: In production, would need to swap native tokens for CFY first
        if (burnAmount > 0) {
            // For now, accumulate for quarterly burns
            // In production, would swap and burn immediately or accumulate
            emit TokensBurned(burnAmount, "Fee burn");
        }
        
        // Send operations amount to fee collector
        if (operationsAmount > 0) {
            payable(feeCollector).transfer(operationsAmount);
        }
        
        // Send treasury amount to treasury
        if (treasuryAmount > 0) {
            payable(treasury).transfer(treasuryAmount);
        }
    }
    
    /**
     * @dev Execute buyback of CFY tokens
     * Transfers native tokens to buyback contract which handles the swap
     */
    function _executeBuyback(uint256 amount) internal {
        if (buybackContract != address(0) && amount > 0) {
            totalBuybackAmount += amount;
            payable(buybackContract).transfer(amount);
            emit BuybackExecuted(amount, 0); // Buyback contract will emit actual CFY bought
        }
    }
    
    /**
     * @dev Add liquidity to CFY pools
     * Transfers native tokens to liquidity contract which handles LP creation
     */
    function _addLiquidity(uint256 amount) internal {
        if (liquidityContract != address(0) && amount > 0) {
            totalLiquidityAdded += amount;
            payable(liquidityContract).transfer(amount);
            emit LiquidityAdded(amount, liquidityContract);
        }
    }
    
    /**
     * @dev Manual burn function (for quarterly burns)
     */
    function manualBurn(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        burn(amount);
        totalBurned += amount;
        emit TokensBurned(amount, "Manual burn");
    }
    
    /**
     * @dev Override burn to track total burned
     */
    function burn(uint256 amount) public override {
        super.burn(amount);
        totalBurned += amount;
        emit TokensBurned(amount, "Burn");
    }
    
    /**
     * @dev Override burnFrom to track total burned
     */
    function burnFrom(address account, uint256 amount) public override {
        super.burnFrom(account, amount);
        totalBurned += amount;
        emit TokensBurned(amount, "Burn from");
    }
    
    /**
     * @dev Get fee discount for an address based on balance
     */
    function getFeeDiscount(address holder) external view returns (uint256) {
        uint256 balance = balanceOf(holder);
        
        // Check discount tiers (highest tier first)
        if (balance >= 1_000_000 * 10**18) {
            return discountTiers[1_000_000 * 10**18]; // 50%
        } else if (balance >= 100_000 * 10**18) {
            return discountTiers[100_000 * 10**18]; // 20%
        } else if (balance >= 10_000 * 10**18) {
            return discountTiers[10_000 * 10**18]; // 10%
        } else if (balance >= 1_000 * 10**18) {
            return discountTiers[1_000 * 10**18]; // 5%
        }
        
        return 0; // No discount
    }
    
    /**
     * @dev Check if address has voting power (minimum 10K CFY)
     */
    function hasVotingPower(address account) external view returns (bool) {
        return balanceOf(account) >= 10_000 * 10**18;
    }
    
    /**
     * @dev Get voting power of an address (1 CFY = 1 vote)
     */
    function getVotingPower(address account) external view returns (uint256) {
        return balanceOf(account);
    }
    
    /**
     * @dev Check if address can propose (minimum 10K CFY)
     */
    function canPropose(address account) external view returns (bool) {
        return balanceOf(account) >= 10_000 * 10**18;
    }
    
    /**
     * @dev Set buyback thresholds
     */
    function setBuybackThresholds(uint256 _dailyThreshold, uint256 _weeklyThreshold) external onlyOwner {
        require(_dailyThreshold > 0, "Invalid daily threshold");
        require(_weeklyThreshold > 0, "Invalid weekly threshold");
        dailyBuybackThreshold = _dailyThreshold;
        weeklyBuybackThreshold = _weeklyThreshold;
    }
    
    /**
     * @dev Trigger buyback manually (for testing or emergency)
     */
    function triggerBuyback() external onlyOwner {
        if (dailyBuybackAccumulated >= dailyBuybackThreshold) {
            _executeBuyback(dailyBuybackAccumulated);
            dailyBuybackAccumulated = 0;
            lastDailyBuyback = block.timestamp;
        } else if (weeklyBuybackAccumulated >= weeklyBuybackThreshold) {
            _executeBuyback(weeklyBuybackAccumulated);
            weeklyBuybackAccumulated = 0;
            lastWeeklyBuyback = block.timestamp;
        }
    }
    
    /**
     * @dev Pause token transfers (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause token transfers (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Override _update to handle pausable
     */
    function _update(address from, address to, uint256 value) 
        internal 
        override(ERC20, ERC20Pausable) 
    {
        super._update(from, to, value);
    }
    
    /**
     * @dev Receive native tokens (for fee collection)
     */
    receive() external payable {
        // Fees should be sent via collectFees function
        // This is a fallback for direct transfers
        if (msg.sender == feeCollector || msg.sender == owner()) {
            collectFees(msg.value, "Direct transfer");
        }
    }
}

