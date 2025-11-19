/**
 * Utility functions to convert UUID token IDs to bytes32 for smart contracts
 */

import { ethers } from 'ethers';

/**
 * Convert a UUID string to bytes32 (keccak256 hash)
 * @param uuidString The UUID string (e.g., "ea23015c-d3c7-40e1-8cb3-94d2cbd813b9")
 * @returns The bytes32 token ID
 */
export function uuidToBytes32(uuidString: string): string {
  // Remove dashes from UUID
  const uuidWithoutDashes = uuidString.replace(/-/g, '');
  
  // Convert to bytes and hash
  const bytes = ethers.toUtf8Bytes(uuidWithoutDashes);
  const hash = ethers.keccak256(bytes);
  
  return hash;
}

/**
 * Convert a UUID string to bytes32 (alternative: direct hex conversion)
 * This matches the Solidity implementation
 * @param uuidString The UUID string
 * @returns The bytes32 token ID
 */
export function uuidToBytes32Direct(uuidString: string): string {
  // Remove dashes
  const uuidWithoutDashes = uuidString.replace(/-/g, '');
  
  // Ensure it's 32 hex characters (UUID without dashes is 32 hex chars)
  if (uuidWithoutDashes.length !== 32) {
    throw new Error(`Invalid UUID length: ${uuidWithoutDashes.length}, expected 32`);
  }
  
  // Hash the hex string
  const bytes = ethers.toUtf8Bytes(uuidWithoutDashes);
  return ethers.keccak256(bytes);
}

/**
 * Get token ID bytes32 for a token from database
 * @param tokenId The UUID token ID from database
 * @returns The bytes32 representation
 */
export function getTokenIdBytes32(tokenId: string): string {
  return uuidToBytes32(tokenId);
}

