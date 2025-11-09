// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CFYStaking
 * @dev Staking contract for CFY tokens with multiple staking pools
 * 
 * Staking Pools:
 * 1. Flexible Staking: 10-20% APY, no lock period
 * 2. Locked Staking: Up to 50% APY, 1-12 month lock periods
 * 3. LP Staking: Up to 100% APY, stake LP tokens
 * 
 * Rewards Distribution:
 * - Total Rewards: 100M CFY (10% of total supply)
 * - Distribution: 4 years with halving each year
 * - Year 1: 40M CFY
 * - Year 2: 30M CFY
 * - Year 3: 20M CFY
 * - Year 4: 10M CFY
 */
contract CFYStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    IERC20 public cfyToken;
    IERC20 public lpToken; // LP token for LP staking
    
    // Staking pool types
    enum PoolType {
        Flexible,
        Locked,
        LP
    }
    
    // Staking pool configuration
    struct PoolConfig {
        PoolType poolType;              // Type of pool (Flexible, Locked, LP)
        uint256 apy;                    // APY in basis points (10000 = 100%)
        uint256 lockPeriod;             // Lock period in seconds (0 for flexible)
        uint256 totalStaked;            // Total amount staked in this pool
        uint256 totalRewardsDistributed; // Total rewards distributed
        bool active;                    // Whether pool is active
    }
    
    // User stake information
    struct Stake {
        uint256 amount;                 // Amount staked
        uint256 poolId;                 // Pool ID
        uint256 lockEndTime;            // When lock period ends (0 for flexible)
        uint256 lastRewardTime;         // Last time rewards were calculated
        uint256 pendingRewards;         // Pending rewards
        uint256 totalRewardsEarned;     // Total rewards earned
    }
    
    // Pool configurations
    mapping(uint256 => PoolConfig) public pools;
    uint256 public poolCount;
    
    // User stakes
    mapping(address => Stake[]) public userStakes;
    mapping(address => uint256) public totalStakedByUser;
    
    // Rewards tracking
    uint256 public constant TOTAL_REWARDS = 100_000_000 * 10**18; // 100M CFY
    uint256 public constant REWARDS_DURATION = 4 * 365 days; // 4 years
    uint256 public rewardsStartTime;
    uint256 public totalRewardsDistributed;
    uint256 public totalStaked;
    
    // Events
    event PoolCreated(uint256 poolId, PoolType poolType, uint256 apy, uint256 lockPeriod);
    event Staked(address indexed user, uint256 stakeId, uint256 amount, uint256 poolId);
    event Unstaked(address indexed user, uint256 stakeId, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 stakeId, uint256 amount);
    event PoolUpdated(uint256 poolId, uint256 apy, bool active);
    
    constructor(
        address _cfyToken,
        address _lpToken,
        address _owner
    ) Ownable(_owner) {
        require(_cfyToken != address(0), "Invalid CFY token address");
        require(_lpToken != address(0), "Invalid LP token address");
        
        cfyToken = IERC20(_cfyToken);
        lpToken = IERC20(_lpToken);
        rewardsStartTime = block.timestamp;
        
        // Create default pools
        _createPool(PoolType.Flexible, 1500, 0); // 15% APY flexible
        _createPool(PoolType.Locked, 3000, 30 days); // 30% APY, 1 month lock
        _createPool(PoolType.Locked, 4000, 90 days); // 40% APY, 3 month lock
        _createPool(PoolType.Locked, 5000, 180 days); // 50% APY, 6 month lock
        _createPool(PoolType.LP, 10000, 0); // 100% APY LP staking
    }
    
    /**
     * @dev Create a new staking pool
     */
    function createPool(
        PoolType poolType,
        uint256 apy,
        uint256 lockPeriod
    ) external onlyOwner returns (uint256) {
        return _createPool(poolType, apy, lockPeriod);
    }
    
    /**
     * @dev Internal function to create a pool
     */
    function _createPool(
        PoolType poolType,
        uint256 apy,
        uint256 lockPeriod
    ) internal returns (uint256) {
        uint256 poolId = poolCount;
        pools[poolId] = PoolConfig({
            poolType: poolType,
            apy: apy,
            lockPeriod: lockPeriod,
            totalStaked: 0,
            totalRewardsDistributed: 0,
            active: true
        });
        poolCount++;
        
        emit PoolCreated(poolId, poolType, apy, lockPeriod);
        return poolId;
    }
    
    /**
     * @dev Update pool configuration
     */
    function updatePool(
        uint256 poolId,
        uint256 apy,
        bool active
    ) external onlyOwner {
        require(poolId < poolCount, "Invalid pool ID");
        pools[poolId].apy = apy;
        pools[poolId].active = active;
        emit PoolUpdated(poolId, apy, active);
    }
    
    /**
     * @dev Stake tokens in a pool
     */
    function stake(uint256 poolId, uint256 amount) external nonReentrant {
        require(poolId < poolCount, "Invalid pool ID");
        require(pools[poolId].active, "Pool is not active");
        require(amount > 0, "Amount must be greater than 0");
        
        PoolConfig storage pool = pools[poolId];
        
        // Determine which token to stake based on pool type
        IERC20 tokenToStake = (pool.poolType == PoolType.LP) ? lpToken : cfyToken;
        
        // Transfer tokens from user
        tokenToStake.safeTransferFrom(msg.sender, address(this), amount);
        
        // Calculate lock end time
        uint256 lockEndTime = pool.lockPeriod > 0 
            ? block.timestamp + pool.lockPeriod 
            : 0;
        
        // Create stake
        uint256 stakeId = userStakes[msg.sender].length;
        userStakes[msg.sender].push(Stake({
            amount: amount,
            poolId: poolId,
            lockEndTime: lockEndTime,
            lastRewardTime: block.timestamp,
            pendingRewards: 0,
            totalRewardsEarned: 0
        }));
        
        // Update totals
        pool.totalStaked += amount;
        totalStakedByUser[msg.sender] += amount;
        totalStaked += amount;
        
        emit Staked(msg.sender, stakeId, amount, poolId);
    }
    
    /**
     * @dev Unstake tokens from a pool
     */
    function unstake(uint256 stakeId) external nonReentrant {
        require(stakeId < userStakes[msg.sender].length, "Invalid stake ID");
        
        Stake storage userStake = userStakes[msg.sender][stakeId];
        require(userStake.amount > 0, "Stake already withdrawn");
        
        // Check if lock period has passed
        if (userStake.lockEndTime > 0) {
            require(block.timestamp >= userStake.lockEndTime, "Lock period not ended");
        }
        
        // Claim pending rewards first
        _claimRewards(msg.sender, stakeId);
        
        uint256 amount = userStake.amount;
        uint256 poolId = userStake.poolId;
        PoolConfig storage pool = pools[poolId];
        
        // Determine which token to return based on pool type
        IERC20 tokenToReturn = (pool.poolType == PoolType.LP) ? lpToken : cfyToken;
        
        // Update totals
        pools[poolId].totalStaked -= amount;
        totalStakedByUser[msg.sender] -= amount;
        totalStaked -= amount;
        
        // Clear stake
        userStake.amount = 0;
        
        // Transfer tokens back to user
        tokenToReturn.safeTransfer(msg.sender, amount);
        
        emit Unstaked(msg.sender, stakeId, amount);
    }
    
    /**
     * @dev Claim rewards for a specific stake
     */
    function claimRewards(uint256 stakeId) external nonReentrant {
        require(stakeId < userStakes[msg.sender].length, "Invalid stake ID");
        _claimRewards(msg.sender, stakeId);
    }
    
    /**
     * @dev Claim all rewards for a user
     */
    function claimAllRewards() external nonReentrant {
        uint256 totalRewards = 0;
        
        for (uint256 i = 0; i < userStakes[msg.sender].length; i++) {
            if (userStakes[msg.sender][i].amount > 0) {
                totalRewards += _calculateRewards(msg.sender, i);
                userStakes[msg.sender][i].lastRewardTime = block.timestamp;
            }
        }
        
        require(totalRewards > 0, "No rewards to claim");
        require(_canDistributeRewards(totalRewards), "Insufficient rewards pool");
        
        totalRewardsDistributed += totalRewards;
        cfyToken.safeTransfer(msg.sender, totalRewards);
        
        emit RewardsClaimed(msg.sender, 0, totalRewards);
    }
    
    /**
     * @dev Internal function to claim rewards
     */
    function _claimRewards(address user, uint256 stakeId) internal {
        Stake storage userStake = userStakes[user][stakeId];
        require(userStake.amount > 0, "Stake not found");
        
        uint256 rewards = _calculateRewards(user, stakeId);
        
        if (rewards > 0) {
            require(_canDistributeRewards(rewards), "Insufficient rewards pool");
            
            userStake.pendingRewards = 0;
            userStake.lastRewardTime = block.timestamp;
            userStake.totalRewardsEarned += rewards;
            
            pools[userStake.poolId].totalRewardsDistributed += rewards;
            totalRewardsDistributed += rewards;
            
            cfyToken.safeTransfer(user, rewards);
            
            emit RewardsClaimed(user, stakeId, rewards);
        }
    }
    
    /**
     * @dev Calculate rewards for a stake
     */
    function _calculateRewards(address user, uint256 stakeId) internal view returns (uint256) {
        Stake storage userStake = userStakes[user][stakeId];
        
        if (userStake.amount == 0) {
            return 0;
        }
        
        PoolConfig storage pool = pools[userStake.poolId];
        uint256 timeElapsed = block.timestamp - userStake.lastRewardTime;
        
        // Calculate annual rewards: (amount * APY) / 10000
        // Then calculate for time elapsed: (annualRewards * timeElapsed) / 365 days
        uint256 annualRewards = (userStake.amount * pool.apy) / 10000;
        uint256 rewards = (annualRewards * timeElapsed) / 365 days;
        
        // Apply halving based on year
        uint256 year = (block.timestamp - rewardsStartTime) / 365 days;
        if (year >= 1) {
            rewards = rewards / (2 ** year); // Halve each year
        }
        
        return rewards + userStake.pendingRewards;
    }
    
    /**
     * @dev Get pending rewards for a stake
     */
    function getPendingRewards(address user, uint256 stakeId) external view returns (uint256) {
        return _calculateRewards(user, stakeId);
    }
    
    /**
     * @dev Get total pending rewards for a user
     */
    function getTotalPendingRewards(address user) external view returns (uint256) {
        uint256 total = 0;
        
        for (uint256 i = 0; i < userStakes[user].length; i++) {
            if (userStakes[user][i].amount > 0) {
                total += _calculateRewards(user, i);
            }
        }
        
        return total;
    }
    
    /**
     * @dev Check if rewards can be distributed
     */
    function _canDistributeRewards(uint256 amount) internal view returns (bool) {
        // Check if we have enough tokens in contract
        uint256 contractBalance = cfyToken.balanceOf(address(this));
        
        // Check if we're within rewards distribution period
        if (block.timestamp > rewardsStartTime + REWARDS_DURATION) {
            return false;
        }
        
        // Check if total distributed is within limits
        uint256 year = (block.timestamp - rewardsStartTime) / 365 days;
        uint256 maxRewardsForYear = _getMaxRewardsForYear(year);
        
        if (totalRewardsDistributed + amount > maxRewardsForYear) {
            return false;
        }
        
        return contractBalance >= amount;
    }
    
    /**
     * @dev Get maximum rewards for a specific year
     */
    function _getMaxRewardsForYear(uint256 year) internal pure returns (uint256) {
        if (year == 0) {
            return 40_000_000 * 10**18; // 40M CFY
        } else if (year == 1) {
            return 70_000_000 * 10**18; // 70M CFY (40M + 30M)
        } else if (year == 2) {
            return 90_000_000 * 10**18; // 90M CFY (70M + 20M)
        } else if (year == 3) {
            return 100_000_000 * 10**18; // 100M CFY (90M + 10M)
        }
        return 100_000_000 * 10**18; // Max 100M
    }
    
    /**
     * @dev Fund the staking contract with rewards
     */
    function fundRewards(uint256 amount) external {
        cfyToken.safeTransferFrom(msg.sender, address(this), amount);
    }
    
    /**
     * @dev Get user stake information
     */
    function getUserStake(address user, uint256 stakeId)
        external
        view
        returns (
            uint256 amount,
            uint256 poolId,
            uint256 lockEndTime,
            uint256 pendingRewards,
            uint256 totalRewardsEarned
        )
    {
        require(stakeId < userStakes[user].length, "Invalid stake ID");
        Stake storage stake = userStakes[user][stakeId];
        
        return (
            stake.amount,
            stake.poolId,
            stake.lockEndTime,
            _calculateRewards(user, stakeId),
            stake.totalRewardsEarned
        );
    }
    
    /**
     * @dev Get number of stakes for a user
     */
    function getUserStakeCount(address user) external view returns (uint256) {
        return userStakes[user].length;
    }
    
    /**
     * @dev Emergency withdraw (only owner)
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}

