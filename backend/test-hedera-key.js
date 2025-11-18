/**
 * Test script to verify Hedera private key matches account
 * 
 * Usage: node test-hedera-key.js
 * 
 * Make sure to install dependencies first:
 * npm install @hashgraph/sdk
 */

const { Client, PrivateKey, AccountId, AccountInfoQuery } = require("@hashgraph/sdk");

async function testKey() {
  const accountId = process.env.HEDERA_ACCOUNT_ID || "YOUR_HEDERA_ACCOUNT_ID";
  const privateKeyStr = process.env.HEDERA_PRIVATE_KEY || "YOUR_HEDERA_PRIVATE_KEY";
  
  console.log("🔍 Testing Hedera Private Key");
  console.log("Account ID:", accountId);
  console.log("Private Key:", privateKeyStr.substring(0, 10) + "..." + privateKeyStr.substring(privateKeyStr.length - 10));
  console.log("");
  
  // Remove 0x if present
  const privateKeyHex = privateKeyStr.replace(/^0x/, '').trim();
  
  if (privateKeyHex.length !== 64) {
    console.error("❌ Invalid private key length:", privateKeyHex.length, "hex characters");
    console.error("   Expected: 64 hex characters (32 bytes)");
    return;
  }
  
  try {
    // Parse private key - try ECDSA first (HashPack often uses ECDSA), then ED25519
    console.log("📝 Parsing private key...");
    let privateKey;
    try {
      privateKey = PrivateKey.fromStringECDSA(privateKeyHex);
      console.log("✅ Private key parsed successfully (ECDSA)");
    } catch (ecdsaError) {
      try {
        privateKey = PrivateKey.fromStringED25519(privateKeyHex);
        console.log("✅ Private key parsed successfully (ED25519)");
      } catch (ed25519Error) {
        throw new Error(`Failed to parse as ECDSA: ${ecdsaError.message}. Failed as ED25519: ${ed25519Error.message}`);
      }
    }
    
    const publicKey = privateKey.publicKey;
    console.log("   Public key:", publicKey.toString());
    console.log("");
    
    // Create client
    console.log("🔗 Connecting to Hedera Testnet...");
    const client = Client.forTestnet();
    client.setOperator(accountId, privateKey);
    
    // Try to query account info
    console.log("🔍 Querying account info...");
    const accountInfo = await new AccountInfoQuery()
      .setAccountId(accountId)
      .execute(client);
    
    console.log("");
    console.log("✅ SUCCESS: Private key matches account!");
    console.log("   Account ID:", accountInfo.accountId.toString());
    console.log("   Account balance:", accountInfo.balance.toString(), "tinybars");
    console.log("   Balance (HBAR):", (Number(accountInfo.balance.toTinybars()) / 100000000).toFixed(2), "HBAR");
    console.log("   Public key on account:", accountInfo.key?.toString() || "N/A");
    console.log("");
    
    // Compare public keys
    const accountPublicKey = accountInfo.key?.toString();
    const derivedPublicKey = publicKey.toString();
    
    if (accountPublicKey && accountPublicKey !== derivedPublicKey) {
      console.warn("⚠️  WARNING: Public key mismatch!");
      console.warn("   Account public key:", accountPublicKey);
      console.warn("   Derived public key:", derivedPublicKey);
      console.warn("   This might indicate the account was rekeyed.");
    } else {
      console.log("✅ Public keys match!");
    }
    
  } catch (error) {
    console.error("");
    console.error("❌ FAILED: Private key does not match account");
    console.error("   Error:", error.message);
    console.error("");
    console.error("Possible causes:");
    console.error("   1. Private key is for a different account");
    console.error("   2. Account was rekeyed (new key was set)");
    console.error("   3. Wrong network (using Mainnet key on Testnet)");
    console.error("   4. Account doesn't exist");
    console.error("");
    console.error("Next steps:");
    console.error("   1. Export the private key from HashPack");
    console.error("   2. Verify the account exists: https://hashscan.io/testnet/account/" + accountId);
    console.error("   3. Try sending a transaction from HashPack to verify the account works");
    process.exit(1);
  }
}

testKey().catch(console.error);

