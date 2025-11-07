// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title BuybackContract
 * @dev Handles automatic buyback of CFY tokens using platform fees
 * Buys CFY from DEX and distributes: 80% to liquidity, 20% burned
 */
interface IUniswapV2Router {
    function swapExactETHForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable returns (uint[] memory amounts);
    
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity);
    
    function WETH() external pure returns (address);
}

interface IUniswapV2Factory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}

contract BuybackContract is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    IERC20 public cfyToken;
    IUniswapV2Router public uniswapRouter;
    IUniswapV2Factory public uniswapFactory;
    address public liquidityPool;
    address public feeCollector; // Platform fee collector address
    
    uint256 public buybackThreshold = 1 ether; // Minimum ETH to trigger buyback
    uint256 public buybackPercent = 50; // 50% of fees go to buyback
    uint256 public liquidityPercent = 80; // 80% of bought CFY to liquidity
    uint256 public burnPercent = 20; // 20% of bought CFY burned
    
    uint256 public totalCFYBought;
    uint256 public totalCFYAddedToLiquidity;
    uint256 public totalCFYBurned;
    
    event BuybackExecuted(uint256 ethAmount, uint256 cfyBought, uint256 cfyToLiquidity, uint256 cfyBurned);
    event LiquidityAdded(uint256 cfyAmount, uint256 ethAmount, uint256 liquidity);
    event TokensBurned(uint256 amount);
    
    constructor(
        address _cfyToken,
        address _uniswapRouter,
        address _uniswapFactory,
        address _liquidityPool,
        address _owner,
        address _feeCollector
    ) Ownable(_owner) {
        cfyToken = IERC20(_cfyToken);
        uniswapRouter = IUniswapV2Router(_uniswapRouter);
        uniswapFactory = IUniswapV2Factory(_uniswapFactory);
        liquidityPool = _liquidityPool;
        feeCollector = _feeCollector;
    }
    
    /**
     * @dev Execute buyback of CFY tokens
     * Called automatically when threshold is reached or manually by owner
     */
    function executeBuyback() external payable nonReentrant {
        require(msg.value >= buybackThreshold, "Below threshold");
        require(msg.sender == feeCollector || msg.sender == owner(), "Not authorized");
        
        uint256 ethAmount = msg.value;
        
        // Get CFY/WETH pair address
        address weth = uniswapRouter.WETH();
        address pair = uniswapFactory.getPair(address(cfyToken), weth);
        require(pair != address(0), "No liquidity pool");
        
        // Calculate minimum CFY to receive (slippage protection: 5%)
        uint256 minCFY = (ethAmount * 95) / 100; // Simplified - in production, use oracle price
        
        // Swap ETH for CFY
        address[] memory path = new address[](2);
        path[0] = weth;
        path[1] = address(cfyToken);
        
        uint256[] memory amounts = uniswapRouter.swapExactETHForTokens{value: ethAmount}(
            minCFY,
            path,
            address(this),
            block.timestamp + 300
        );
        
        uint256 cfyBought = amounts[amounts.length - 1];
        totalCFYBought += cfyBought;
        
        // Distribute: 80% to liquidity, 20% burned
        uint256 cfyToLiquidity = (cfyBought * liquidityPercent) / 100;
        uint256 cfyToBurn = cfyBought - cfyToLiquidity;
        
        // Add liquidity
        if (cfyToLiquidity > 0) {
            _addLiquidity(cfyToLiquidity, ethAmount);
            totalCFYAddedToLiquidity += cfyToLiquidity;
        }
        
        // Burn tokens
        if (cfyToBurn > 0) {
            // In production, would call burn function on CFY token
            // For now, transfer to dead address
            address deadAddress = 0x000000000000000000000000000000000000dEaD;
            cfyToken.safeTransfer(deadAddress, cfyToBurn);
            totalCFYBurned += cfyToBurn;
            emit TokensBurned(cfyToBurn);
        }
        
        emit BuybackExecuted(ethAmount, cfyBought, cfyToLiquidity, cfyToBurn);
    }
    
    /**
     * @dev Add liquidity to CFY/ETH pool
     */
    function _addLiquidity(uint256 cfyAmount, uint256 ethAmount) internal {
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
                liquidityPool,
                block.timestamp + 300
            );
        
        emit LiquidityAdded(tokenAmount, ethAmountUsed, liquidity);
    }
    
    /**
     * @dev Set buyback threshold
     */
    function setBuybackThreshold(uint256 _threshold) external onlyOwner {
        require(_threshold > 0, "Invalid threshold");
        buybackThreshold = _threshold;
    }
    
    /**
     * @dev Set distribution percentages
     */
    function setDistributionPercentages(uint256 _liquidity, uint256 _burn) external onlyOwner {
        require(_liquidity + _burn == 100, "Must sum to 100");
        liquidityPercent = _liquidity;
        burnPercent = _burn;
    }
    
    /**
     * @dev Set fee collector address
     */
    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "Invalid address");
        feeCollector = _feeCollector;
    }
    
    /**
     * @dev Set liquidity pool address
     */
    function setLiquidityPool(address _liquidityPool) external onlyOwner {
        require(_liquidityPool != address(0), "Invalid address");
        liquidityPool = _liquidityPool;
    }
    
    /**
     * @dev Emergency withdraw (only owner)
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }
    
    receive() external payable {
        // Auto-execute buyback if threshold reached
        // Note: receive() can only call functions via this pattern
        if (msg.value >= buybackThreshold && (msg.sender == feeCollector || msg.sender == owner())) {
            // Delegate to internal logic (can't call external directly from receive)
            // In production, use a separate internal function or emit event for keeper
            // For now, just accept the funds - buyback will be triggered manually or by keeper
        }
    }
    
    /**
     * @dev Trigger buyback with contract's ETH balance
     * Can be called by owner or fee collector to execute buyback
     */
    function triggerBuyback() external nonReentrant {
        require(msg.sender == feeCollector || msg.sender == owner(), "Not authorized");
        uint256 balance = address(this).balance;
        require(balance >= buybackThreshold, "Below threshold");
        
        // Call executeBuyback with contract balance
        this.executeBuyback{value: balance}();
    }
}

