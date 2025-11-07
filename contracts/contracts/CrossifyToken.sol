// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./CrossChainToken.sol";

/**
 * @title CrossifyToken
 * @dev Platform token for Crossify.io with advanced tokenomics
 * Features: Buyback, Liquidity Provision, Staking, Governance, Deflationary Burns
 */
contract CrossifyToken is CrossChainToken {
    // Buyback mechanism
    address public buybackContract;
    uint256 public buybackThreshold = 1 ether; // Minimum amount to trigger buyback
    uint256 public buybackPercent = 50; // 50% of fees go to buyback (5000 basis points)
    
    // Liquidity provision
    address public liquidityPool;
    uint256 public liquidityPercent = 30; // 30% of fees go to liquidity (3000 basis points)
    
    // Deflationary burns
    uint256 public burnPercent = 10; // 10% of fees go to burns (1000 basis points)
    uint256 public totalBurned;
    
    // Fee collection
    address public feeCollector;
    mapping(address => bool) public feeExempt; // Addresses exempt from fees
    
    // Staking contract
    address public stakingContract;
    
    // Governance
    address public governanceContract;
    uint256 public minVotingPower = 10000 * 10**18; // 10,000 CFY minimum to vote
    
    // Events
    event BuybackTriggered(uint256 amount, uint256 cfyBought);
    event LiquidityAdded(uint256 amount, address pool);
    event TokensBurned(uint256 amount);
    event FeeCollected(address indexed from, uint256 amount, string feeType);
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address _owner,
        string memory uri,
        address _lzEndpoint,
        uint32 _chainEID,
        address _crossChainSync,
        address _priceOracle
    ) CrossChainToken(
        name,
        symbol,
        initialSupply,
        _owner,
        uri,
        _lzEndpoint,
        _chainEID,
        _crossChainSync,
        _priceOracle
    ) {
        feeCollector = _owner;
    }
    
    /**
     * @dev Set buyback contract address
     */
    function setBuybackContract(address _buybackContract) external onlyOwner {
        require(_buybackContract != address(0), "Invalid address");
        buybackContract = _buybackContract;
    }
    
    /**
     * @dev Set liquidity pool address
     */
    function setLiquidityPool(address _liquidityPool) external onlyOwner {
        require(_liquidityPool != address(0), "Invalid address");
        liquidityPool = _liquidityPool;
    }
    
    /**
     * @dev Set staking contract address
     */
    function setStakingContract(address _stakingContract) external onlyOwner {
        require(_stakingContract != address(0), "Invalid address");
        stakingContract = _stakingContract;
    }
    
    /**
     * @dev Set governance contract address
     */
    function setGovernanceContract(address _governanceContract) external onlyOwner {
        require(_governanceContract != address(0), "Invalid address");
        governanceContract = _governanceContract;
    }
    
    /**
     * @dev Set fee collector address
     */
    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "Invalid address");
        feeCollector = _feeCollector;
    }
    
    /**
     * @dev Set fee exemption for an address
     */
    function setFeeExempt(address account, bool exempt) external onlyOwner {
        feeExempt[account] = exempt;
    }
    
    /**
     * @dev Collect platform fees and distribute according to tokenomics
     * Called by platform contracts when fees are collected
     */
    function collectFees(uint256 amount, string memory feeType) external {
        require(msg.sender == feeCollector || msg.sender == owner(), "Not authorized");
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer fees to this contract
        if (msg.sender != address(this)) {
            _transfer(msg.sender, address(this), amount);
        }
        
        emit FeeCollected(msg.sender, amount, feeType);
        
        // Distribute fees according to tokenomics
        uint256 buybackAmount = (amount * buybackPercent) / 10000;
        uint256 liquidityAmount = (amount * liquidityPercent) / 10000;
        uint256 burnAmount = (amount * burnPercent) / 10000;
        uint256 operationsAmount = amount - buybackAmount - liquidityAmount - burnAmount;
        
        // Execute buyback if threshold reached
        if (buybackAmount >= buybackThreshold && buybackContract != address(0)) {
            _executeBuyback(buybackAmount);
        } else {
            // Store for later buyback
            // In production, would store in a separate contract
        }
        
        // Add liquidity
        if (liquidityAmount > 0 && liquidityPool != address(0)) {
            _addLiquidity(liquidityAmount);
        }
        
        // Burn tokens
        if (burnAmount > 0) {
            burn(burnAmount); // Uses ERC20Burnable's burn function
        }
        
        // Send operations amount to fee collector
        if (operationsAmount > 0) {
            _transfer(address(this), feeCollector, operationsAmount);
        }
    }
    
    /**
     * @dev Execute buyback of CFY tokens
     */
    function _executeBuyback(uint256 amount) internal {
        // In production, this would:
        // 1. Swap native tokens (ETH/BNB) for CFY on DEX
        // 2. Burn 20% of bought CFY
        // 3. Add 80% to liquidity pool
        
        // Simplified for now - would call buyback contract
        if (buybackContract != address(0)) {
            // Transfer native tokens to buyback contract
            // Buyback contract handles the swap and distribution
            payable(buybackContract).transfer(amount);
        }
        
        emit BuybackTriggered(amount, 0); // Would emit actual CFY bought
    }
    
    /**
     * @dev Add liquidity to CFY pools
     */
    function _addLiquidity(uint256 amount) internal {
        // In production, this would:
        // 1. Swap half for paired token (ETH/BNB)
        // 2. Add liquidity to DEX pool
        // 3. Stake LP tokens if staking contract is set
        
        if (liquidityPool != address(0)) {
            // Transfer to liquidity pool contract
            // Liquidity pool contract handles the swap and LP creation
            _transfer(address(this), liquidityPool, amount);
        }
        
        emit LiquidityAdded(amount, liquidityPool);
    }
    
    /**
     * @dev Manual burn function (for quarterly burns)
     * Uses ERC20Burnable's burn function and tracks total burned
     */
    function manualBurn(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        burn(amount); // Uses ERC20Burnable's burn function
        totalBurned += amount;
        emit TokensBurned(amount);
    }
    
    /**
     * @dev Mint new tokens (only owner can call)
     * This allows token owners to mint additional tokens if mintable feature is enabled
     */
    function mint(address to, uint256 amount) external override onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Override burn to track total burned
     */
    function burn(uint256 amount) public override {
        super.burn(amount);
        totalBurned += amount;
        emit TokensBurned(amount);
    }
    
    /**
     * @dev Override burnFrom to track total burned
     */
    function burnFrom(address account, uint256 amount) public override {
        super.burnFrom(account, amount);
        totalBurned += amount;
        emit TokensBurned(amount);
    }
    
    /**
     * @dev Check if address has voting power
     */
    function hasVotingPower(address account) external view returns (bool) {
        return balanceOf(account) >= minVotingPower;
    }
    
    /**
     * @dev Get voting power of an address
     */
    function getVotingPower(address account) external view returns (uint256) {
        return balanceOf(account);
    }
    
    /**
     * @dev Override transfer to apply fee discounts for holders
     */
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        // Check if sender is eligible for fee discount
        // In production, would check balance and apply discount to platform fees
        return super.transfer(to, amount);
    }
    
    /**
     * @dev Receive native tokens (for fee collection)
     */
    receive() external payable {
        // Convert native tokens to CFY fees
        // In production, would swap and distribute
    }
}

