// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title CFYPresale
 * @dev Presale contract for CFY token with tiered pricing and vesting
 * 
 * Presale Details:
 * - Total Supply: 300M CFY (30% of total)
 * - Public Presale: 200M CFY (tiered pricing)
 * - Private Sale: 100M CFY (discounted price)
 * 
 * Tiered Pricing:
 * - Tier 1 (First 50M): $0.01/CFY
 * - Tier 2 (Next 50M): $0.015/CFY
 * - Tier 3 (Next 50M): $0.02/CFY
 * - Tier 4 (Last 50M): $0.025/CFY
 * 
 * Private Sale: $0.008/CFY (20% discount)
 * 
 * Vesting:
 * - Public: 20% TGE, 80% linear vesting over 12 months
 * - Private: 6-month cliff, 18-month linear vesting
 */
contract CFYPresale is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    IERC20 public cfyToken;
    
    // Presale parameters
    uint256 public constant PUBLIC_PRESALE_AMOUNT = 200_000_000 * 10**18; // 200M CFY
    uint256 public constant PRIVATE_SALE_AMOUNT = 100_000_000 * 10**18; // 100M CFY
    uint256 public constant TOTAL_PRESALE_AMOUNT = 300_000_000 * 10**18; // 300M CFY
    
    // Tier limits (in CFY tokens)
    uint256 public constant TIER1_LIMIT = 50_000_000 * 10**18; // 50M CFY
    uint256 public constant TIER2_LIMIT = 50_000_000 * 10**18; // 50M CFY
    uint256 public constant TIER3_LIMIT = 50_000_000 * 10**18; // 50M CFY
    uint256 public constant TIER4_LIMIT = 50_000_000 * 10**18; // 50M CFY
    
    // Tier prices (in wei per CFY token)
    uint256 public constant TIER1_PRICE = 0.01 ether; // $0.01 per CFY (assuming 1 ETH = $1 for simplicity)
    uint256 public constant TIER2_PRICE = 0.015 ether; // $0.015 per CFY
    uint256 public constant TIER3_PRICE = 0.02 ether; // $0.02 per CFY
    uint256 public constant TIER4_PRICE = 0.025 ether; // $0.025 per CFY
    uint256 public constant PRIVATE_PRICE = 0.008 ether; // $0.008 per CFY
    
    // Vesting parameters
    uint256 public constant PUBLIC_TGE_PERCENT = 20; // 20% at TGE
    uint256 public constant PUBLIC_VESTING_DURATION = 365 days; // 12 months
    uint256 public constant PRIVATE_CLIFF_DURATION = 180 days; // 6 months
    uint256 public constant PRIVATE_VESTING_DURATION = 547 days; // 18 months
    
    // Presale state
    bool public publicPresaleActive;
    bool public privateSaleActive;
    uint256 public publicPresaleStartTime;
    uint256 public publicPresaleEndTime;
    uint256 public privateSaleStartTime;
    uint256 public privateSaleEndTime;
    
    // Tracking
    uint256 public publicPresaleSold;
    uint256 public privateSaleSold;
    uint256 public totalRaised; // In native tokens (ETH/BNB)
    
    // Tier tracking
    uint256 public tier1Sold;
    uint256 public tier2Sold;
    uint256 public tier3Sold;
    uint256 public tier4Sold;
    
    // User purchases
    struct Purchase {
        uint256 amount; // CFY tokens purchased
        uint256 paid; // Native tokens paid
        uint256 tier; // Tier (1-4) or 0 for private
        bool isPrivate;
        uint256 purchaseTime;
    }
    
    mapping(address => Purchase[]) public purchases;
    mapping(address => bool) public privateSaleWhitelist;
    mapping(address => uint256) public totalPurchased;
    
    // Vesting
    struct VestingSchedule {
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 tgeAmount; // Amount released at TGE
        uint256 vestingStartTime;
        uint256 vestingDuration;
        uint256 cliffDuration; // 0 for public, 180 days for private
        bool isPrivate;
    }
    
    mapping(address => VestingSchedule[]) public vestingSchedules;
    uint256 public tgeTime; // Token Generation Event time
    
    // Events
    event PublicPresaleStarted(uint256 startTime, uint256 endTime);
    event PrivateSaleStarted(uint256 startTime, uint256 endTime);
    event TokensPurchased(
        address indexed buyer,
        uint256 cfyAmount,
        uint256 paidAmount,
        uint256 tier,
        bool isPrivate
    );
    event TokensReleased(address indexed beneficiary, uint256 amount);
    event WhitelistUpdated(address indexed user, bool whitelisted);
    
    constructor(
        address _cfyToken,
        address _owner
    ) Ownable(_owner) {
        require(_cfyToken != address(0), "Invalid CFY token address");
        cfyToken = IERC20(_cfyToken);
    }
    
    /**
     * @dev Start public presale
     */
    function startPublicPresale(uint256 duration) external onlyOwner {
        require(!publicPresaleActive, "Public presale already active");
        require(cfyToken.balanceOf(address(this)) >= PUBLIC_PRESALE_AMOUNT, "Insufficient CFY balance");
        
        publicPresaleStartTime = block.timestamp;
        publicPresaleEndTime = block.timestamp + duration;
        publicPresaleActive = true;
        
        emit PublicPresaleStarted(publicPresaleStartTime, publicPresaleEndTime);
    }
    
    /**
     * @dev Start private sale
     */
    function startPrivateSale(uint256 duration) external onlyOwner {
        require(!privateSaleActive, "Private sale already active");
        require(cfyToken.balanceOf(address(this)) >= PRIVATE_SALE_AMOUNT, "Insufficient CFY balance");
        
        privateSaleStartTime = block.timestamp;
        privateSaleEndTime = block.timestamp + duration;
        privateSaleActive = true;
        
        emit PrivateSaleStarted(privateSaleStartTime, privateSaleEndTime);
    }
    
    /**
     * @dev End public presale
     */
    function endPublicPresale() external onlyOwner {
        publicPresaleActive = false;
    }
    
    /**
     * @dev End private sale
     */
    function endPrivateSale() external onlyOwner {
        privateSaleActive = false;
    }
    
    /**
     * @dev Set TGE time (Token Generation Event)
     */
    function setTGETime(uint256 _tgeTime) external onlyOwner {
        require(_tgeTime >= block.timestamp, "TGE time must be in the future");
        tgeTime = _tgeTime;
    }
    
    /**
     * @dev Add/remove private sale whitelist
     */
    function updateWhitelist(address user, bool whitelisted) external onlyOwner {
        privateSaleWhitelist[user] = whitelisted;
        emit WhitelistUpdated(user, whitelisted);
    }
    
    /**
     * @dev Batch update whitelist
     */
    function batchUpdateWhitelist(address[] calldata users, bool[] calldata whitelisted) external onlyOwner {
        require(users.length == whitelisted.length, "Array length mismatch");
        for (uint256 i = 0; i < users.length; i++) {
            privateSaleWhitelist[users[i]] = whitelisted[i];
            emit WhitelistUpdated(users[i], whitelisted[i]);
        }
    }
    
    /**
     * @dev Buy tokens in public presale
     */
    function buyPublicPresale() external payable nonReentrant whenNotPaused {
        require(publicPresaleActive, "Public presale not active");
        require(block.timestamp >= publicPresaleStartTime, "Presale not started");
        require(block.timestamp < publicPresaleEndTime, "Presale ended");
        require(msg.value > 0, "Must send ETH");
        require(publicPresaleSold < PUBLIC_PRESALE_AMOUNT, "Public presale sold out");
        
        uint256 remainingInPublic = PUBLIC_PRESALE_AMOUNT - publicPresaleSold;
        uint256 cfyToBuy = 0;
        uint256 totalPaid = 0;
        uint256 remainingValue = msg.value;
        uint256 currentTier = _getCurrentTier();
        uint256 tierAmount = 0;
        
        // Calculate how many tokens can be bought across tiers
        while (remainingValue > 0 && currentTier <= 4 && publicPresaleSold < PUBLIC_PRESALE_AMOUNT) {
            uint256 tierLimit = _getTierLimit(currentTier);
            uint256 tierSold = _getTierSold(currentTier);
            uint256 tierRemaining = tierLimit - tierSold;
            
            if (tierRemaining == 0) {
                currentTier++;
                continue;
            }
            
            uint256 tierPrice = _getTierPrice(currentTier);
            uint256 maxCFYFromTier = tierRemaining;
            uint256 maxValueForTier = (maxCFYFromTier * tierPrice) / 10**18;
            
            if (maxValueForTier <= remainingValue) {
                // Buy entire tier
                tierAmount = maxCFYFromTier;
                totalPaid += maxValueForTier;
                remainingValue -= maxValueForTier;
                _updateTierSold(currentTier, tierAmount);
                publicPresaleSold += tierAmount;
                cfyToBuy += tierAmount;
                currentTier++;
            } else {
                // Buy partial tier
                tierAmount = (remainingValue * 10**18) / tierPrice;
                if (tierAmount > tierRemaining) {
                    tierAmount = tierRemaining;
                }
                totalPaid += remainingValue;
                _updateTierSold(currentTier, tierAmount);
                publicPresaleSold += tierAmount;
                cfyToBuy += tierAmount;
                remainingValue = 0;
            }
        }
        
        require(cfyToBuy > 0, "No tokens to buy");
        require(cfyToBuy <= remainingInPublic, "Exceeds remaining supply");
        
        // Create purchase record
        purchases[msg.sender].push(Purchase({
            amount: cfyToBuy,
            paid: totalPaid,
            tier: currentTier > 1 ? currentTier - 1 : 1,
            isPrivate: false,
            purchaseTime: block.timestamp
        }));
        
        totalPurchased[msg.sender] += cfyToBuy;
        totalRaised += totalPaid;
        
        // Create vesting schedule
        uint256 tgeAmount = (cfyToBuy * PUBLIC_TGE_PERCENT) / 100;
        uint256 vestingAmount = cfyToBuy - tgeAmount;
        
        vestingSchedules[msg.sender].push(VestingSchedule({
            totalAmount: cfyToBuy,
            releasedAmount: 0,
            tgeAmount: tgeAmount,
            vestingStartTime: tgeTime > 0 ? tgeTime : block.timestamp,
            vestingDuration: PUBLIC_VESTING_DURATION,
            cliffDuration: 0,
            isPrivate: false
        }));
        
        // Refund excess
        if (remainingValue > 0) {
            payable(msg.sender).transfer(remainingValue);
        }
        
        emit TokensPurchased(msg.sender, cfyToBuy, totalPaid, currentTier > 1 ? currentTier - 1 : 1, false);
    }
    
    /**
     * @dev Buy tokens in private sale
     */
    function buyPrivateSale() external payable nonReentrant whenNotPaused {
        require(privateSaleActive, "Private sale not active");
        require(block.timestamp >= privateSaleStartTime, "Private sale not started");
        require(block.timestamp < privateSaleEndTime, "Private sale ended");
        require(privateSaleWhitelist[msg.sender], "Not whitelisted for private sale");
        require(msg.value > 0, "Must send ETH");
        require(privateSaleSold < PRIVATE_SALE_AMOUNT, "Private sale sold out");
        
        uint256 remainingInPrivate = PRIVATE_SALE_AMOUNT - privateSaleSold;
        uint256 cfyToBuy = (msg.value * 10**18) / PRIVATE_PRICE;
        
        if (cfyToBuy > remainingInPrivate) {
            cfyToBuy = remainingInPrivate;
            uint256 requiredValue = (cfyToBuy * PRIVATE_PRICE) / 10**18;
            uint256 refund = msg.value - requiredValue;
            if (refund > 0) {
                payable(msg.sender).transfer(refund);
            }
            // Note: msg.value is read-only, but we've already refunded the excess
        }
        
        require(cfyToBuy > 0, "No tokens to buy");
        
        // Create purchase record
        purchases[msg.sender].push(Purchase({
            amount: cfyToBuy,
            paid: msg.value,
            tier: 0,
            isPrivate: true,
            purchaseTime: block.timestamp
        }));
        
        totalPurchased[msg.sender] += cfyToBuy;
        privateSaleSold += cfyToBuy;
        totalRaised += msg.value;
        
        // Create vesting schedule (6 month cliff, 18 month vesting)
        vestingSchedules[msg.sender].push(VestingSchedule({
            totalAmount: cfyToBuy,
            releasedAmount: 0,
            tgeAmount: 0,
            vestingStartTime: tgeTime > 0 ? tgeTime : block.timestamp,
            vestingDuration: PRIVATE_VESTING_DURATION,
            cliffDuration: PRIVATE_CLIFF_DURATION,
            isPrivate: true
        }));
        
        emit TokensPurchased(msg.sender, cfyToBuy, msg.value, 0, true);
    }
    
    /**
     * @dev Release vested tokens
     */
    function release(address beneficiary, uint256 scheduleIndex) external nonReentrant {
        require(scheduleIndex < vestingSchedules[beneficiary].length, "Invalid schedule index");
        
        VestingSchedule storage schedule = vestingSchedules[beneficiary][scheduleIndex];
        uint256 releasable = releasableAmount(beneficiary, scheduleIndex);
        require(releasable > 0, "No tokens to release");
        
        schedule.releasedAmount += releasable;
        
        cfyToken.safeTransfer(beneficiary, releasable);
        
        emit TokensReleased(beneficiary, releasable);
    }
    
    /**
     * @dev Release all vested tokens for a beneficiary
     */
    function releaseAll(address beneficiary) external nonReentrant {
        uint256 totalReleasable = 0;
        
        for (uint256 i = 0; i < vestingSchedules[beneficiary].length; i++) {
            uint256 releasable = releasableAmount(beneficiary, i);
            if (releasable > 0) {
                vestingSchedules[beneficiary][i].releasedAmount += releasable;
                totalReleasable += releasable;
            }
        }
        
        require(totalReleasable > 0, "No tokens to release");
        
        cfyToken.safeTransfer(beneficiary, totalReleasable);
        
        emit TokensReleased(beneficiary, totalReleasable);
    }
    
    /**
     * @dev Calculate releasable amount for a vesting schedule
     */
    function releasableAmount(address beneficiary, uint256 scheduleIndex) public view returns (uint256) {
        require(scheduleIndex < vestingSchedules[beneficiary].length, "Invalid schedule index");
        
        VestingSchedule storage schedule = vestingSchedules[beneficiary][scheduleIndex];
        
        if (tgeTime == 0 || block.timestamp < tgeTime) {
            return 0; // TGE not reached
        }
        
        uint256 currentTime = block.timestamp;
        uint256 vestingStartTime = schedule.vestingStartTime;
        
        // Release TGE amount immediately (public presale only)
        if (!schedule.isPrivate && schedule.tgeAmount > 0 && schedule.releasedAmount < schedule.tgeAmount) {
            if (currentTime >= vestingStartTime) {
                uint256 unreleasedTGE = schedule.tgeAmount - schedule.releasedAmount;
                if (unreleasedTGE > 0) {
                    // TGE amount is released immediately
                    uint256 vestingAmount = schedule.totalAmount - schedule.tgeAmount;
                    if (vestingAmount == 0) {
                        return unreleasedTGE;
                    }
                    // Continue with vesting calculation
                }
            }
        }
        
        // Check cliff (private sale)
        if (schedule.isPrivate && schedule.cliffDuration > 0) {
            uint256 cliffEndTime = vestingStartTime + schedule.cliffDuration;
            if (currentTime < cliffEndTime) {
                return 0; // Still in cliff period
            }
        }
        
        // Calculate linear vesting
        uint256 vestingAmount = schedule.isPrivate 
            ? schedule.totalAmount 
            : schedule.totalAmount - schedule.tgeAmount;
        
        if (vestingAmount == 0) {
            return 0;
        }
        
        uint256 vestingEndTime = vestingStartTime + schedule.vestingDuration;
        if (currentTime >= vestingEndTime) {
            // All tokens are releasable
            return schedule.totalAmount - schedule.releasedAmount;
        }
        
        // Calculate linear vesting
        uint256 vestingStart = schedule.isPrivate 
            ? vestingStartTime + schedule.cliffDuration
            : vestingStartTime;
        
        uint256 elapsed = currentTime - vestingStart;
        uint256 vested = (vestingAmount * elapsed) / schedule.vestingDuration;
        
        // Add TGE amount if not released yet (public presale)
        if (!schedule.isPrivate && schedule.releasedAmount < schedule.tgeAmount) {
            vested += schedule.tgeAmount;
        }
        
        if (vested > schedule.releasedAmount) {
            return vested - schedule.releasedAmount;
        }
        
        return 0;
    }
    
    /**
     * @dev Get total releasable amount for a beneficiary
     */
    function totalReleasableAmount(address beneficiary) external view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < vestingSchedules[beneficiary].length; i++) {
            total += releasableAmount(beneficiary, i);
        }
        return total;
    }
    
    /**
     * @dev Get current tier
     */
    function _getCurrentTier() internal view returns (uint256) {
        if (tier1Sold < TIER1_LIMIT) return 1;
        if (tier2Sold < TIER2_LIMIT) return 2;
        if (tier3Sold < TIER3_LIMIT) return 3;
        if (tier4Sold < TIER4_LIMIT) return 4;
        return 5; // Sold out
    }
    
    /**
     * @dev Get tier limit
     */
    function _getTierLimit(uint256 tier) internal pure returns (uint256) {
        if (tier == 1) return TIER1_LIMIT;
        if (tier == 2) return TIER2_LIMIT;
        if (tier == 3) return TIER3_LIMIT;
        if (tier == 4) return TIER4_LIMIT;
        return 0;
    }
    
    /**
     * @dev Get tier sold
     */
    function _getTierSold(uint256 tier) internal view returns (uint256) {
        if (tier == 1) return tier1Sold;
        if (tier == 2) return tier2Sold;
        if (tier == 3) return tier3Sold;
        if (tier == 4) return tier4Sold;
        return 0;
    }
    
    /**
     * @dev Get tier price
     */
    function _getTierPrice(uint256 tier) internal pure returns (uint256) {
        if (tier == 1) return TIER1_PRICE;
        if (tier == 2) return TIER2_PRICE;
        if (tier == 3) return TIER3_PRICE;
        if (tier == 4) return TIER4_PRICE;
        return 0;
    }
    
    /**
     * @dev Update tier sold
     */
    function _updateTierSold(uint256 tier, uint256 amount) internal {
        if (tier == 1) tier1Sold += amount;
        else if (tier == 2) tier2Sold += amount;
        else if (tier == 3) tier3Sold += amount;
        else if (tier == 4) tier4Sold += amount;
    }
    
    /**
     * @dev Get purchase count for a user
     */
    function getPurchaseCount(address user) external view returns (uint256) {
        return purchases[user].length;
    }
    
    /**
     * @dev Get vesting schedule count for a user
     */
    function getVestingScheduleCount(address user) external view returns (uint256) {
        return vestingSchedules[user].length;
    }
    
    /**
     * @dev Get vesting schedule details
     */
    function getVestingSchedule(address user, uint256 index) 
        external 
        view 
        returns (
            uint256 totalAmount,
            uint256 releasedAmount,
            uint256 tgeAmount,
            uint256 vestingStartTime,
            uint256 vestingDuration,
            uint256 cliffDuration,
            bool isPrivate,
            uint256 releasable
        ) 
    {
        require(index < vestingSchedules[user].length, "Invalid index");
        VestingSchedule storage schedule = vestingSchedules[user][index];
        
        return (
            schedule.totalAmount,
            schedule.releasedAmount,
            schedule.tgeAmount,
            schedule.vestingStartTime,
            schedule.vestingDuration,
            schedule.cliffDuration,
            schedule.isPrivate,
            releasableAmount(user, index)
        );
    }
    
    /**
     * @dev Pause presale (emergency only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause presale
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Withdraw raised funds (only owner)
     */
    function withdrawFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }
    
    /**
     * @dev Emergency withdraw CFY tokens (only owner)
     */
    function emergencyWithdrawCFY(uint256 amount) external onlyOwner {
        cfyToken.safeTransfer(owner(), amount);
    }
    
    /**
     * @dev Receive ETH
     */
    receive() external payable {
        // ETH is received through buyPublicPresale or buyPrivateSale
    }
}

