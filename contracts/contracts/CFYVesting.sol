// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CFYVesting
 * @dev Vesting contract for CFY token distribution
 * 
 * Supports:
 * - Cliff period (tokens locked for X months)
 * - Linear vesting after cliff
 * - Multiple vesting schedules per address
 */
contract CFYVesting is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    IERC20 public cfyToken;
    
    struct VestingSchedule {
        uint256 totalAmount;          // Total amount to be vested
        uint256 releasedAmount;       // Amount already released
        uint256 cliffDuration;        // Cliff period in seconds
        uint256 vestingDuration;      // Total vesting duration in seconds
        uint256 startTime;            // When vesting starts
        bool revoked;                 // Whether vesting has been revoked
    }
    
    // Mapping from beneficiary to vesting schedules
    mapping(address => VestingSchedule[]) public vestingSchedules;
    
    // Total amount of tokens in all vesting schedules
    uint256 public totalVested;
    uint256 public totalReleased;
    
    // Events
    event VestingScheduleCreated(
        address indexed beneficiary,
        uint256 totalAmount,
        uint256 cliffDuration,
        uint256 vestingDuration,
        uint256 startTime
    );
    event TokensReleased(address indexed beneficiary, uint256 amount);
    event VestingRevoked(address indexed beneficiary, uint256 index);
    
    constructor(address _cfyToken, address _owner) Ownable(_owner) {
        require(_cfyToken != address(0), "Invalid token address");
        cfyToken = IERC20(_cfyToken);
    }
    
    /**
     * @dev Create a vesting schedule for a beneficiary
     * @param beneficiary Address that will receive the tokens
     * @param totalAmount Total amount of tokens to vest
     * @param cliffDuration Cliff period in seconds (e.g., 6 months = 15552000)
     * @param vestingDuration Total vesting duration in seconds (e.g., 24 months = 62208000)
     * @param startTime When vesting starts (0 = now)
     */
    function createVestingSchedule(
        address beneficiary,
        uint256 totalAmount,
        uint256 cliffDuration,
        uint256 vestingDuration,
        uint256 startTime
    ) external onlyOwner {
        require(beneficiary != address(0), "Invalid beneficiary");
        require(totalAmount > 0, "Amount must be greater than 0");
        require(vestingDuration > 0, "Vesting duration must be greater than 0");
        require(cliffDuration <= vestingDuration, "Cliff must be less than or equal to vesting duration");
        
        if (startTime == 0) {
            startTime = block.timestamp;
        }
        
        vestingSchedules[beneficiary].push(VestingSchedule({
            totalAmount: totalAmount,
            releasedAmount: 0,
            cliffDuration: cliffDuration,
            vestingDuration: vestingDuration,
            startTime: startTime,
            revoked: false
        }));
        
        totalVested += totalAmount;
        
        // Transfer tokens to this contract
        cfyToken.safeTransferFrom(msg.sender, address(this), totalAmount);
        
        emit VestingScheduleCreated(
            beneficiary,
            totalAmount,
            cliffDuration,
            vestingDuration,
            startTime
        );
    }
    
    /**
     * @dev Create multiple vesting schedules in one transaction
     */
    function createVestingSchedulesBatch(
        address[] calldata beneficiaries,
        uint256[] calldata totalAmounts,
        uint256[] calldata cliffDurations,
        uint256[] calldata vestingDurations,
        uint256[] calldata startTimes
    ) external onlyOwner {
        require(
            beneficiaries.length == totalAmounts.length &&
            totalAmounts.length == cliffDurations.length &&
            cliffDurations.length == vestingDurations.length &&
            vestingDurations.length == startTimes.length,
            "Array length mismatch"
        );
        
        uint256 totalAmount = 0;
        
        for (uint256 i = 0; i < beneficiaries.length; i++) {
            require(beneficiaries[i] != address(0), "Invalid beneficiary");
            require(totalAmounts[i] > 0, "Amount must be greater than 0");
            
            uint256 startTime = startTimes[i] == 0 ? block.timestamp : startTimes[i];
            
            vestingSchedules[beneficiaries[i]].push(VestingSchedule({
                totalAmount: totalAmounts[i],
                releasedAmount: 0,
                cliffDuration: cliffDurations[i],
                vestingDuration: vestingDurations[i],
                startTime: startTime,
                revoked: false
            }));
            
            totalAmount += totalAmounts[i];
            
            emit VestingScheduleCreated(
                beneficiaries[i],
                totalAmounts[i],
                cliffDurations[i],
                vestingDurations[i],
                startTime
            );
        }
        
        totalVested += totalAmount;
        
        // Transfer all tokens to this contract
        cfyToken.safeTransferFrom(msg.sender, address(this), totalAmount);
    }
    
    /**
     * @dev Release vested tokens for a beneficiary
     * @param beneficiary Address to release tokens for
     * @param scheduleIndex Index of the vesting schedule
     */
    function release(address beneficiary, uint256 scheduleIndex) external nonReentrant {
        require(scheduleIndex < vestingSchedules[beneficiary].length, "Invalid schedule index");
        
        VestingSchedule storage schedule = vestingSchedules[beneficiary][scheduleIndex];
        require(!schedule.revoked, "Schedule has been revoked");
        
        uint256 releasable = releasableAmount(beneficiary, scheduleIndex);
        require(releasable > 0, "No tokens to release");
        
        schedule.releasedAmount += releasable;
        totalReleased += releasable;
        
        cfyToken.safeTransfer(beneficiary, releasable);
        
        emit TokensReleased(beneficiary, releasable);
    }
    
    /**
     * @dev Release all vested tokens for a beneficiary (all schedules)
     */
    function releaseAll(address beneficiary) external nonReentrant {
        uint256 totalReleasable = 0;
        
        for (uint256 i = 0; i < vestingSchedules[beneficiary].length; i++) {
            if (!vestingSchedules[beneficiary][i].revoked) {
                uint256 releasable = releasableAmount(beneficiary, i);
                if (releasable > 0) {
                    vestingSchedules[beneficiary][i].releasedAmount += releasable;
                    totalReleasable += releasable;
                }
            }
        }
        
        require(totalReleasable > 0, "No tokens to release");
        
        totalReleased += totalReleasable;
        cfyToken.safeTransfer(beneficiary, totalReleasable);
        
        emit TokensReleased(beneficiary, totalReleasable);
    }
    
    /**
     * @dev Calculate releasable amount for a vesting schedule
     */
    function releasableAmount(address beneficiary, uint256 scheduleIndex) 
        public 
        view 
        returns (uint256) 
    {
        require(scheduleIndex < vestingSchedules[beneficiary].length, "Invalid schedule index");
        
        VestingSchedule storage schedule = vestingSchedules[beneficiary][scheduleIndex];
        
        if (schedule.revoked) {
            return 0;
        }
        
        uint256 currentTime = block.timestamp;
        uint256 vestingStartTime = schedule.startTime;
        uint256 cliffEndTime = vestingStartTime + schedule.cliffDuration;
        
        // Before cliff, nothing is releasable
        if (currentTime < cliffEndTime) {
            return 0;
        }
        
        // After vesting duration, all tokens are releasable
        uint256 vestingEndTime = vestingStartTime + schedule.vestingDuration;
        if (currentTime >= vestingEndTime) {
            return schedule.totalAmount - schedule.releasedAmount;
        }
        
        // Calculate linear vesting after cliff
        uint256 elapsedSinceCliff = currentTime - cliffEndTime;
        uint256 vestingPeriodAfterCliff = schedule.vestingDuration - schedule.cliffDuration;
        
        uint256 vestedAmount = (schedule.totalAmount * elapsedSinceCliff) / vestingPeriodAfterCliff;
        
        // Subtract already released amount
        if (vestedAmount > schedule.releasedAmount) {
            return vestedAmount - schedule.releasedAmount;
        }
        
        return 0;
    }
    
    /**
     * @dev Get total releasable amount for a beneficiary (all schedules)
     */
    function totalReleasableAmount(address beneficiary) external view returns (uint256) {
        uint256 total = 0;
        
        for (uint256 i = 0; i < vestingSchedules[beneficiary].length; i++) {
            total += releasableAmount(beneficiary, i);
        }
        
        return total;
    }
    
    /**
     * @dev Get vesting schedule details
     */
    function getVestingSchedule(address beneficiary, uint256 scheduleIndex)
        external
        view
        returns (
            uint256 totalAmount,
            uint256 releasedAmount,
            uint256 cliffDuration,
            uint256 vestingDuration,
            uint256 startTime,
            bool revoked,
            uint256 releasable
        )
    {
        require(scheduleIndex < vestingSchedules[beneficiary].length, "Invalid schedule index");
        
        VestingSchedule storage schedule = vestingSchedules[beneficiary][scheduleIndex];
        
        return (
            schedule.totalAmount,
            schedule.releasedAmount,
            schedule.cliffDuration,
            schedule.vestingDuration,
            schedule.startTime,
            schedule.revoked,
            releasableAmount(beneficiary, scheduleIndex)
        );
    }
    
    /**
     * @dev Get number of vesting schedules for a beneficiary
     */
    function getVestingScheduleCount(address beneficiary) external view returns (uint256) {
        return vestingSchedules[beneficiary].length;
    }
    
    /**
     * @dev Revoke a vesting schedule (emergency only)
     * Unreleased tokens are returned to owner
     */
    function revokeVestingSchedule(address beneficiary, uint256 scheduleIndex) external onlyOwner {
        require(scheduleIndex < vestingSchedules[beneficiary].length, "Invalid schedule index");
        
        VestingSchedule storage schedule = vestingSchedules[beneficiary][scheduleIndex];
        require(!schedule.revoked, "Schedule already revoked");
        
        schedule.revoked = true;
        
        uint256 unreleased = schedule.totalAmount - schedule.releasedAmount;
        if (unreleased > 0) {
            cfyToken.safeTransfer(owner(), unreleased);
        }
        
        emit VestingRevoked(beneficiary, scheduleIndex);
    }
    
    /**
     * @dev Emergency withdraw tokens (only owner)
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        cfyToken.safeTransfer(owner(), amount);
    }
}

