// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TokenIDUtils
 * @dev Utility functions for converting UUID strings to bytes32 token IDs
 * UUIDs are 128-bit, but we use keccak256 to convert them to 256-bit bytes32
 */
library TokenIDUtils {
    /**
     * @dev Convert a UUID string to bytes32 token ID
     * @param uuidString The UUID string (e.g., "ea23015c-d3c7-40e1-8cb3-94d2cbd813b9")
     * @return tokenId The bytes32 token ID
     */
    function uuidToBytes32(string memory uuidString) internal pure returns (bytes32) {
        bytes memory uuidBytes = bytes(uuidString);
        require(uuidBytes.length == 36, "Invalid UUID format");
        
        // Remove dashes and convert to bytes
        bytes memory hexBytes = new bytes(32);
        uint256 j = 0;
        
        for (uint256 i = 0; i < uuidBytes.length; i++) {
            if (uuidBytes[i] != 0x2D) { // Skip dashes (0x2D = '-')
                hexBytes[j] = uuidBytes[i];
                j++;
            }
        }
        
        // Hash the UUID to get a bytes32
        return keccak256(hexBytes);
    }
    
    /**
     * @dev Convert a UUID string without dashes to bytes32
     * @param uuidHex The UUID hex string without dashes (e.g., "ea23015cd3c740e18cb394d2cbd813b9")
     * @return tokenId The bytes32 token ID
     */
    function hexToBytes32(string memory uuidHex) internal pure returns (bytes32) {
        bytes memory hexBytes = bytes(uuidHex);
        require(hexBytes.length == 32, "Invalid hex length");
        
        return keccak256(hexBytes);
    }
}

