// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./CFYToken.sol";

/**
 * @title CFYGovernance
 * @dev Governance contract for CFY token holders
 * 
 * Features:
 * - 1 CFY = 1 Vote
 * - Minimum 10K CFY to create a proposal
 * - Voting period: 7 days
 * - Quorum: 5% of total supply
 * - Execution delay: 2 days after voting ends
 */
contract CFYGovernance is Ownable, ReentrancyGuard {
    CFYToken public cfyToken;
    
    // Proposal structure
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool cancelled;
        address target;              // Contract to execute on
        bytes data;                  // Calldata for execution
        uint256 value;               // ETH value to send
    }
    
    // Voting parameters
    uint256 public constant MIN_PROPOSE_AMOUNT = 10_000 * 10**18; // 10K CFY
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant EXECUTION_DELAY = 2 days;
    uint256 public constant QUORUM = 50_000_000 * 10**18; // 5% of 1B supply
    
    // Proposals
    Proposal[] public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => uint8)) public votes; // 1 = for, 2 = against, 3 = abstain
    
    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        uint256 startTime,
        uint256 endTime
    );
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        uint8 support,
        uint256 votes
    );
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);
    
    constructor(address _cfyToken, address _owner) Ownable(_owner) {
        require(_cfyToken != address(0), "Invalid CFY token address");
        cfyToken = CFYToken(_cfyToken);
    }
    
    /**
     * @dev Create a new proposal
     */
    function createProposal(
        string memory title,
        string memory description,
        address target,
        bytes memory data,
        uint256 value
    ) external returns (uint256) {
        require(cfyToken.balanceOf(msg.sender) >= MIN_PROPOSE_AMOUNT, "Insufficient balance to propose");
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        
        uint256 proposalId = proposals.length;
        
        proposals.push(Proposal({
            id: proposalId,
            proposer: msg.sender,
            title: title,
            description: description,
            startTime: block.timestamp,
            endTime: block.timestamp + VOTING_PERIOD,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            executed: false,
            cancelled: false,
            target: target,
            data: data,
            value: value
        }));
        
        emit ProposalCreated(
            proposalId,
            msg.sender,
            title,
            block.timestamp,
            block.timestamp + VOTING_PERIOD
        );
        
        return proposalId;
    }
    
    /**
     * @dev Vote on a proposal
     * @param proposalId Proposal ID
     * @param support 1 = for, 2 = against, 3 = abstain
     */
    function vote(uint256 proposalId, uint8 support) external {
        require(proposalId < proposals.length, "Invalid proposal ID");
        require(!hasVoted[proposalId][msg.sender], "Already voted");
        require(support >= 1 && support <= 3, "Invalid support value");
        
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.startTime, "Voting not started");
        require(block.timestamp < proposal.endTime, "Voting ended");
        require(!proposal.cancelled, "Proposal cancelled");
        require(!proposal.executed, "Proposal executed");
        
        uint256 votingPower = cfyToken.balanceOf(msg.sender);
        require(votingPower > 0, "No voting power");
        
        hasVoted[proposalId][msg.sender] = true;
        votes[proposalId][msg.sender] = support;
        
        if (support == 1) {
            proposal.forVotes += votingPower;
        } else if (support == 2) {
            proposal.againstVotes += votingPower;
        } else if (support == 3) {
            proposal.abstainVotes += votingPower;
        }
        
        emit VoteCast(proposalId, msg.sender, support, votingPower);
    }
    
    /**
     * @dev Execute a proposal
     */
    function executeProposal(uint256 proposalId) external nonReentrant {
        require(proposalId < proposals.length, "Invalid proposal ID");
        
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.endTime + EXECUTION_DELAY, "Execution delay not passed");
        require(!proposal.executed, "Proposal already executed");
        require(!proposal.cancelled, "Proposal cancelled");
        require(proposal.forVotes > proposal.againstVotes, "Proposal did not pass");
        
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        require(totalVotes >= QUORUM, "Quorum not met");
        
        proposal.executed = true;
        
        // Execute proposal
        if (proposal.target != address(0)) {
            (bool success, ) = proposal.target.call{value: proposal.value}(proposal.data);
            require(success, "Proposal execution failed");
        }
        
        emit ProposalExecuted(proposalId);
    }
    
    /**
     * @dev Cancel a proposal (only proposer or owner)
     */
    function cancelProposal(uint256 proposalId) external {
        require(proposalId < proposals.length, "Invalid proposal ID");
        
        Proposal storage proposal = proposals[proposalId];
        require(msg.sender == proposal.proposer || msg.sender == owner(), "Not authorized");
        require(!proposal.executed, "Proposal already executed");
        require(!proposal.cancelled, "Proposal already cancelled");
        require(block.timestamp < proposal.endTime, "Voting ended");
        
        proposal.cancelled = true;
        
        emit ProposalCancelled(proposalId);
    }
    
    /**
     * @dev Get proposal details
     */
    function getProposal(uint256 proposalId)
        external
        view
        returns (
            uint256 id,
            address proposer,
            string memory title,
            string memory description,
            uint256 startTime,
            uint256 endTime,
            uint256 forVotes,
            uint256 againstVotes,
            uint256 abstainVotes,
            bool executed,
            bool cancelled,
            address target,
            uint256 value
        )
    {
        require(proposalId < proposals.length, "Invalid proposal ID");
        Proposal storage proposal = proposals[proposalId];
        
        return (
            proposal.id,
            proposal.proposer,
            proposal.title,
            proposal.description,
            proposal.startTime,
            proposal.endTime,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.abstainVotes,
            proposal.executed,
            proposal.cancelled,
            proposal.target,
            proposal.value
        );
    }
    
    /**
     * @dev Get number of proposals
     */
    function getProposalCount() external view returns (uint256) {
        return proposals.length;
    }
    
    /**
     * @dev Check if user can vote on a proposal
     */
    function canVote(uint256 proposalId, address voter) external view returns (bool) {
        if (proposalId >= proposals.length) return false;
        if (hasVoted[proposalId][voter]) return false;
        if (cfyToken.balanceOf(voter) == 0) return false;
        
        Proposal storage proposal = proposals[proposalId];
        if (block.timestamp < proposal.startTime) return false;
        if (block.timestamp >= proposal.endTime) return false;
        if (proposal.cancelled) return false;
        if (proposal.executed) return false;
        
        return true;
    }
    
    /**
     * @dev Get voting power of an address
     */
    function getVotingPower(address voter) external view returns (uint256) {
        return cfyToken.balanceOf(voter);
    }
    
    /**
     * @dev Check if user can propose
     */
    function canPropose(address user) external view returns (bool) {
        return cfyToken.balanceOf(user) >= MIN_PROPOSE_AMOUNT;
    }
    
    /**
     * @dev Receive ETH (for proposals that send ETH)
     */
    receive() external payable {}
}

