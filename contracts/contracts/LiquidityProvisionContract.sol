// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title LiquidityProvisionContract
 * @dev Handles automatic liquidity provision for CFY token
 * Adds liquidity to CFY pools on all supported chains
 */
interface IUniswapV2Router {
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity);
    
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity);
    
    function WETH() external pure returns (address);
}

interface IStakingContract {
    function stakeLP(address lpToken, uint256 amount) external;
}

contract LiquidityProvisionContract is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    IERC20 public cfyToken;
    IUniswapV2Router public uniswapRouter;
    address public stakingContract;
    address public feeCollector;
    
    uint256 public liquidityPercent = 30; // 30% of fees go to liquidity
    uint256 public liquidityThreshold = 0.5 ether; // Minimum ETH to add liquidity
    
    uint256 public totalLiquidityAdded;
    uint256 public totalLPTokensStaked;
    
    event LiquidityAdded(uint256 cfyAmount, uint256 ethAmount, uint256 liquidity, address pool);
    event LPStaked(uint256 lpAmount, address stakingContract);
    
    constructor(
        address _cfyToken,
        address _uniswapRouter,
        address _stakingContract,
        address _owner,
        address _feeCollector
    ) Ownable(_owner) {
        cfyToken = IERC20(_cfyToken);
        uniswapRouter = IUniswapV2Router(_uniswapRouter);
        stakingContract = _stakingContract;
        feeCollector = _feeCollector;
    }
    
    /**
     * @dev Add liquidity to CFY/ETH pool
     * Called automatically when threshold is reached
     */
    function addLiquidity() external payable nonReentrant {
        require(msg.value >= liquidityThreshold, "Below threshold");
        require(msg.sender == feeCollector || msg.sender == owner(), "Not authorized");
        
        uint256 ethAmount = msg.value;
        
        // Calculate CFY amount (should use oracle for accurate price)
        // For now, use 1:1 ratio (in production, use DEX price)
        uint256 cfyAmount = ethAmount; // Simplified
        
        // Check if we have enough CFY
        uint256 cfyBalance = cfyToken.balanceOf(address(this));
        if (cfyBalance < cfyAmount) {
            // Need to buy CFY first
            // In production, would swap ETH for CFY
            revert("Insufficient CFY balance");
        }
        
        // Approve router to spend CFY
        // In OpenZeppelin v5, use forceApprove or increaseAllowance
        uint256 currentAllowance = cfyToken.allowance(address(this), address(uniswapRouter));
        if (currentAllowance < cfyAmount) {
            if (currentAllowance > 0) {
                cfyToken.safeDecreaseAllowance(address(uniswapRouter), currentAllowance);
            }
            cfyToken.safeIncreaseAllowance(address(uniswapRouter), cfyAmount);
        }
        
        // Add liquidity
        (uint256 tokenAmount, uint256 ethAmountUsed, uint256 liquidity) = 
            uniswapRouter.addLiquidityETH{value: ethAmount}(
                address(cfyToken),
                cfyAmount,
                (cfyAmount * 95) / 100, // 5% slippage
                (ethAmount * 95) / 100, // 5% slippage
                address(this),
                block.timestamp + 300
            );
        
        totalLiquidityAdded += liquidity;
        
        // Get LP token address
        address weth = uniswapRouter.WETH();
        address lpToken = _getLPTokenAddress(address(cfyToken), weth);
        
        emit LiquidityAdded(tokenAmount, ethAmountUsed, liquidity, lpToken);
        
        // Stake LP tokens if staking contract is set
        if (stakingContract != address(0) && lpToken != address(0)) {
            IERC20 lpTokenContract = IERC20(lpToken);
            uint256 lpBalance = lpTokenContract.balanceOf(address(this));
            if (lpBalance > 0) {
                // In OpenZeppelin v5, use increaseAllowance
                uint256 currentAllowance = lpTokenContract.allowance(address(this), stakingContract);
                if (currentAllowance < lpBalance) {
                    if (currentAllowance > 0) {
                        lpTokenContract.safeDecreaseAllowance(stakingContract, currentAllowance);
                    }
                    lpTokenContract.safeIncreaseAllowance(stakingContract, lpBalance);
                }
                IStakingContract(stakingContract).stakeLP(lpToken, lpBalance);
                totalLPTokensStaked += lpBalance;
                emit LPStaked(lpBalance, stakingContract);
            }
        }
    }
    
    /**
     * @dev Get LP token address (simplified - in production, use factory)
     */
    function _getLPTokenAddress(address tokenA, address tokenB) internal pure returns (address) {
        // In production, would use UniswapV2Factory.getPair()
        // For now, return address(0) as placeholder
        return address(0);
    }
    
    /**
     * @dev Set liquidity threshold
     */
    function setLiquidityThreshold(uint256 _threshold) external onlyOwner {
        require(_threshold > 0, "Invalid threshold");
        liquidityThreshold = _threshold;
    }
    
    /**
     * @dev Set staking contract address
     */
    function setStakingContract(address _stakingContract) external onlyOwner {
        stakingContract = _stakingContract;
    }
    
    /**
     * @dev Set fee collector address
     */
    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "Invalid address");
        feeCollector = _feeCollector;
    }
    
    /**
     * @dev Emergency withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }
    
    receive() external payable {
        // Auto-add liquidity if threshold reached
        // Note: receive() can only call functions via this pattern
        // In production, use a separate internal function or emit event for keeper
        // For now, just accept the funds - liquidity will be added manually or by keeper
    }
    
    /**
     * @dev Trigger liquidity addition with contract's ETH balance
     * Can be called by owner or fee collector to execute liquidity provision
     */
    function triggerLiquidityAddition() external nonReentrant {
        require(msg.sender == feeCollector || msg.sender == owner(), "Not authorized");
        uint256 balance = address(this).balance;
        require(balance >= liquidityThreshold, "Below threshold");
        
        // Call addLiquidity with contract balance
        this.addLiquidity{value: balance}();
    }
}

