// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./BondingCurve.sol";
import "./CrossChainToken.sol";
import "./CrossChainSync.sol";

/**
 * @title TokenFactory
 * @dev Factory contract for creating Crossify tokens and bonding curves
 */
contract TokenFactory is Ownable {
    event TokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        address indexed curveAddress,
        string name,
        string symbol
    );

    mapping(address => address[]) public tokensByCreator;
    address[] public allTokens;
    mapping(address => address) public tokenCreator; // token => creator (for migration)
    
    // Global supply tracker for cross-chain price synchronization
    address public globalSupplyTracker;
    string public chainName; // e.g., "ethereum", "bsc", "base"
    bool public useGlobalSupply; // Whether to enable global supply tracking
    
    // Cross-chain infrastructure
    address public lzEndpoint;
    address public crossChainSync;
    address public priceOracle;
    uint32 public chainEID; // LayerZero Endpoint ID
    bool public crossChainEnabled;

    constructor(
        address initialOwner,
        address _globalSupplyTracker,
        string memory _chainName,
        bool _useGlobalSupply,
        address _lzEndpoint,
        address _crossChainSync,
        address _priceOracle,
        uint32 _chainEID
    ) Ownable(initialOwner) {
        globalSupplyTracker = _globalSupplyTracker;
        chainName = _chainName;
        useGlobalSupply = _useGlobalSupply;
        lzEndpoint = _lzEndpoint;
        crossChainSync = _crossChainSync;
        priceOracle = _priceOracle;
        chainEID = _chainEID;
        crossChainEnabled = (_lzEndpoint != address(0) && _crossChainSync != address(0));
    }
    
    /**
     * @dev Update cross-chain infrastructure
     */
    function setCrossChainInfrastructure(
        address _lzEndpoint,
        address _crossChainSync,
        address _priceOracle,
        uint32 _chainEID
    ) external onlyOwner {
        lzEndpoint = _lzEndpoint;
        crossChainSync = _crossChainSync;
        priceOracle = _priceOracle;
        chainEID = _chainEID;
        crossChainEnabled = (_lzEndpoint != address(0) && _crossChainSync != address(0));
    }
    
    /**
     * @dev Set global supply tracker (only owner)
     */
    function setGlobalSupplyTracker(address _tracker) external onlyOwner {
        globalSupplyTracker = _tracker;
    }
    
    /**
     * @dev Set chain name
     */
    function setChainName(string memory _chainName) external onlyOwner {
        chainName = _chainName;
    }
    
    /**
     * @dev Enable/disable global supply usage
     */
    function setUseGlobalSupply(bool _use) external onlyOwner {
        useGlobalSupply = _use;
    }

    /**
     * @dev Create a new token and bonding curve
     * @param name Token name
     * @param symbol Token symbol
     * @param initialSupply Initial token supply (in token units, not wei)
     * @param uri Metadata URI (IPFS hash)
     * @param basePrice Base price for bonding curve (in wei)
     * @param slope Slope for bonding curve (in wei per token)
     * @param graduationThreshold Market cap threshold for graduation (in USD, scaled by 1e18). Set to 0 to disable graduation.
     * @param buyFeePercent Buy fee percentage (e.g., 100 = 1%)
     * @param sellFeePercent Sell fee percentage (e.g., 100 = 1%)
     * @return tokenAddress Address of the created token
     * @return curveAddress Address of the created bonding curve
     */
    function createToken(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        string memory uri,
        uint256 basePrice,
        uint256 slope,
        uint256 graduationThreshold,
        uint256 buyFeePercent,
        uint256 sellFeePercent
    ) external returns (address tokenAddress, address curveAddress) {
        // Deploy token - use CrossChainToken if cross-chain is enabled, otherwise use CrossifyToken
        ERC20 token;
        
        // Strategy: Mint tokens to factory first, transfer to bonding curve, then transfer ownership to creator
        // This avoids needing approval from the creator and ensures the creator can mint later
        
        if (crossChainEnabled && lzEndpoint != address(0) && crossChainSync != address(0)) {
            // Deploy CrossChainToken with built-in cross-chain sync
            // Mint to factory first, then we'll transfer ownership to creator after setup
            token = CrossChainToken(
                new CrossChainToken(
                    name,
                    symbol,
                    initialSupply * 10**18, // Convert to wei (18 decimals)
                    address(this), // Temporarily own by factory (will transfer to creator)
                    uri,
                    lzEndpoint,
                    chainEID,
                    crossChainSync,
                    priceOracle
                )
            );
            
            // Note: We don't need to authorize the token in CrossChainSync here.
            // The token contract doesn't directly call CrossChainSync.
            // Instead, the GlobalSupplyTracker calls CrossChainSync, and it's already authorized.
            // The authorization happens when the GlobalSupplyTracker is set up, not when tokens are created.
        } else {
            // Deploy CrossChainToken even without cross-chain sync (it will just work locally)
            // This simplifies the code and avoids code size issues
            token = CrossChainToken(
                new CrossChainToken(
                    name,
                    symbol,
                    initialSupply * 10**18, // Convert to wei (18 decimals)
                    address(this), // Temporarily own by factory (will transfer to creator)
                    uri,
                    address(0), // No LayerZero endpoint
                    0, // No chain EID
                    address(0), // No cross-chain sync
                    address(0) // No price oracle
                )
            );
        }
        
        tokenAddress = address(token);

        // Deploy bonding curve with global supply tracking
        BondingCurve curve = new BondingCurve(
            tokenAddress,
            basePrice,
            slope,
            graduationThreshold,
            buyFeePercent,
            sellFeePercent,
            msg.sender, // Owner is the token creator
            globalSupplyTracker, // Global supply tracker address
            chainName, // Chain name for supply tracking
            useGlobalSupply // Whether to use global supply for pricing
        );
        curveAddress = address(curve);

        // Transfer all tokens from factory to the bonding curve (factory owns them temporarily)
        require(token.transfer(curveAddress, token.totalSupply()), "Failed to transfer tokens to bonding curve");
        
        // If using CrossChainToken, set bonding curve address (must do BEFORE transferring ownership)
        // Factory is still the owner at this point, so it can call setBondingCurve
        if (crossChainEnabled && tokenAddress != address(0)) {
            try CrossChainToken(tokenAddress).setBondingCurve(curveAddress) {
                // Successfully set bonding curve
            } catch {
                // Not a CrossChainToken or already set, continue
                // This is not critical - bonding curve can work without this
            }
        }
        
        // Transfer token ownership from factory to creator (msg.sender)
        // This allows the creator to mint, burn, pause, etc.
        Ownable(tokenAddress).transferOwnership(msg.sender);

        // Authorize bonding curve in GlobalSupplyTracker if using global supply
        // Note: We use a low-level call with limited gas to avoid excessive gas usage on failure
        // This is optional - tokens can be created even if authorization fails
        if (useGlobalSupply && globalSupplyTracker != address(0)) {
            // Use limited gas for authorization call to prevent out-of-gas issues
            // 50k gas should be enough for a simple authorization call
            (bool success, ) = globalSupplyTracker.call{gas: 50000}(
                abi.encodeWithSignature("authorizeUpdater(address)", curveAddress)
            );
            // Authorization is optional - don't revert if it fails
            // Admin can manually authorize later if needed
        }

        // Track token
        tokensByCreator[msg.sender].push(tokenAddress);
        allTokens.push(tokenAddress);
        
        // Store creator for each token (for migration purposes)
        tokenCreator[tokenAddress] = msg.sender;

        emit TokenCreated(tokenAddress, msg.sender, curveAddress, name, symbol);

        return (tokenAddress, curveAddress);
    }

    /**
     * @dev Get all tokens created by an address
     */
    function getTokensByCreator(address creator) external view returns (address[] memory) {
        return tokensByCreator[creator];
    }

    /**
     * @dev Get total number of tokens created
     */
    function getTotalTokens() external view returns (uint256) {
        return allTokens.length;
    }
    
    /**
     * @dev Get all token addresses created by this factory
     * @return Array of all token addresses
     */
    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }
    
    /**
     * @dev Migrate ownership of an existing token to its creator
     * This allows fixing ownership for tokens created before the ownership fix
     * Only callable by factory owner, and only if factory currently owns the token
     * @param tokenAddress The address of the token to migrate
     */
    function migrateTokenOwnership(address tokenAddress) external onlyOwner {
        require(tokenAddress != address(0), "Invalid token address");
        
        // Verify this token was created by this factory
        address creator = tokenCreator[tokenAddress];
        require(creator != address(0), "Token not found in factory");
        
        // Verify factory currently owns the token
        Ownable token = Ownable(tokenAddress);
        require(token.owner() == address(this), "Factory is not the owner");
        
        // Transfer ownership to creator
        token.transferOwnership(creator);
        
        emit TokenOwnershipMigrated(tokenAddress, creator);
    }
    
    /**
     * @dev Migrate ownership of multiple tokens in one transaction
     * @param tokenAddresses Array of token addresses to migrate
     */
    function migrateMultipleTokenOwnership(address[] calldata tokenAddresses) external onlyOwner {
        for (uint i = 0; i < tokenAddresses.length; i++) {
            if (tokenAddresses[i] != address(0)) {
                try this.migrateTokenOwnership(tokenAddresses[i]) {
                    // Success
                } catch {
                    // Skip if migration fails for this token
                    continue;
                }
            }
        }
    }
    
    event TokenOwnershipMigrated(address indexed tokenAddress, address indexed newOwner);
}

