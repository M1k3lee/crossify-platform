# Token Ownership Migration Guide

## Problem

Tokens created before the ownership fix have the TokenFactory contract as their owner instead of the creator. This prevents token creators from using management features like minting, burning, and pausing.

## Solution

We've implemented a secure migration system that allows the factory owner to transfer ownership of existing tokens to their creators.

## Changes Made

### 1. TokenFactory Contract Updates

- Added `tokenCreator` mapping to track who created each token
- Added `migrateTokenOwnership()` function to transfer ownership to creator
- Added `migrateMultipleTokenOwnership()` for batch migrations
- New tokens automatically set creator as owner during deployment

### 2. Migration Script

A migration script (`scripts/migrate-token-ownership.ts`) has been created to automate the ownership transfer process.

## Migration Process

### Option 1: Automatic Migration (Recommended)

1. **Redeploy TokenFactory** with the new code:
   ```bash
   cd contracts
   npx hardhat run scripts/deploy.ts --network <network>
   ```

2. **Update environment variables** with new factory address:
   ```env
   TOKEN_FACTORY_ADDRESS=0x...
   ```

3. **Run migration script**:
   ```bash
   cd contracts
   npx hardhat run scripts/migrate-token-ownership.ts --network <network>
   ```

   The script will:
   - Find all tokens created by the factory
   - Check if factory is still the owner
   - Transfer ownership to the creator
   - Skip tokens already owned by creators
   - Provide a detailed summary

### Option 2: Manual Migration (For Specific Tokens)

If you only need to migrate specific tokens:

1. Connect to the factory contract (as owner)
2. Call `migrateTokenOwnership(tokenAddress)` for each token
3. Or use `migrateMultipleTokenOwnership([token1, token2, ...])` for batch migration

## Security Considerations

### ✅ Secure Design

- **Only factory owner can migrate**: Uses `onlyOwner` modifier
- **Verifies creator**: Checks `tokenCreator` mapping to ensure correct owner
- **Verifies current owner**: Only migrates if factory is currently owner
- **Idempotent**: Safe to run multiple times
- **Error handling**: Script continues even if individual migrations fail

### ⚠️ Important Notes

1. **Factory Owner**: Only the factory owner can execute migrations. Ensure you have access to the factory owner wallet.

2. **Gas Costs**: Migration requires gas. For many tokens, consider batch migration.

3. **One-Time Operation**: Once ownership is transferred, the factory cannot transfer it again.

4. **New Tokens**: All new tokens created after the fix will automatically have the creator as owner.

## Verification

After migration, verify ownership:

```typescript
// Connect to token contract
const token = await ethers.getContractAt("Ownable", tokenAddress);
const owner = await token.owner();
const creator = await factory.tokenCreator(tokenAddress);

console.log(`Token: ${tokenAddress}`);
console.log(`Owner: ${owner}`);
console.log(`Creator: ${creator}`);
console.log(`Match: ${owner.toLowerCase() === creator.toLowerCase()}`);
```

## Troubleshooting

### "Token not found in factory"
- Token was not created by this factory
- Token was created before `tokenCreator` mapping was added
- Solution: Manually verify and migrate if needed

### "Factory is not the owner"
- Token was already migrated
- Token was created after the fix
- Solution: Skip this token (already correct)

### "Transaction reverted"
- Insufficient gas
- Network issues
- Factory owner changed
- Solution: Check network, gas, and factory owner

## Post-Migration

After successful migration:

1. ✅ Token creators can now mint tokens
2. ✅ Token creators can burn tokens
3. ✅ Token creators can pause/unpause tokens
4. ✅ Token creators can update fees
5. ✅ All management features work correctly

## Support

If you encounter issues:

1. Check factory owner address
2. Verify token was created by this factory
3. Check network and gas settings
4. Review migration script output for specific errors

## Next Steps

1. Redeploy TokenFactory with fixes
2. Update environment variables
3. Run migration script
4. Verify ownership for each token
5. Test minting/burning/pausing in Creator Dashboard




