# Fix Immutable Audit Trail After Google Cloud Migration

## Problem
The Immutable Audit Trail is showing "No audit logs yet" because the Hedera HCS (Hedera Consensus Service) environment variables were not migrated from Railway to Google Cloud.

## Solution: Add Required Environment Variables

The Hedera Audit Trail requires these environment variables to be set in your Google Cloud deployment:

### Required Environment Variables

1. **`HEDERA_ACCOUNT_ID`** (Required)
   - Format: `0.0.xxxxx` (e.g., `0.0.7268944`)
   - Your Hedera account ID used for audit logging

2. **`HEDERA_PRIVATE_KEY`** (Required)
   - Format: 64 hex characters (with or without `0x` prefix)
   - Example: `0xfe34316bfc0d64e2470214427bffae181c99b1cbacaa61d206c3a8bf182c22ee`
   - The private key for the Hedera account

3. **`HEDERA_HCS_TOPIC_ID`** (Optional but Recommended)
   - Format: `0.0.xxxxx`
   - If not set, a new topic will be auto-created on first initialization
   - After creation, add this to prevent creating duplicate topics

### Optional Environment Variables

4. **`HEDERA_MAINNET`** (Optional)
   - Set to `true` if using Hedera mainnet
   - Omit or leave unset for testnet (default)

## How to Add Environment Variables in Google Cloud

### If using Cloud Run:

1. Go to **Google Cloud Console** → **Cloud Run**
2. Select your backend service
3. Click **Edit & Deploy New Revision**
4. Scroll down to **Variables & Secrets**
5. Click **Add Variable** for each variable:
   - `HEDERA_ACCOUNT_ID` = `0.0.7268944` (use your actual account ID)
   - `HEDERA_PRIVATE_KEY` = `0x...` (use your actual private key)
   - (Optional) `HEDERA_HCS_TOPIC_ID` = `0.0.xxxxx` (if you have one)
6. Click **Deploy**

### If using Secret Manager (Recommended for private keys):

1. Create secrets in **Secret Manager**:
   ```bash
   gcloud secrets create hedera-account-id --data-file=- <<< "0.0.7268944"
   gcloud secrets create hedera-private-key --data-file=- <<< "0xfe34316bfc0d64e2470214427bffae181c99b1cbacaa61d206c3a8bf182c22ee"
   ```

2. Grant Cloud Run access to secrets:
   ```bash
   gcloud secrets add-iam-policy-binding hedera-account-id --member="serviceAccount:YOUR_SERVICE_ACCOUNT" --role="roles/secretmanager.secretAccessor"
   gcloud secrets add-iam-policy-binding hedera-private-key --member="serviceAccount:YOUR_SERVICE_ACCOUNT" --role="roles/secretmanager.secretAccessor"
   ```

3. Reference secrets in Cloud Run environment variables using the format:
   - `HEDERA_ACCOUNT_ID` → `projects/PROJECT_ID/secrets/hedera-account-id:latest`
   - `HEDERA_PRIVATE_KEY` → `projects/PROJECT_ID/secrets/hedera-private-key:latest`

## Verification Steps

After adding the environment variables and redeploying:

1. **Check Backend Logs** - Look for these messages:
   - ✅ `✅ Hedera Audit Service initialized (Powered by Hedera)` - Success!
   - ⚠️ `⚠️ Hedera credentials not configured` - Variables not set correctly
   - ❌ `❌ Error initializing Hedera Audit Service` - Check credentials format

2. **If topic is auto-created**, you'll see:
   ```
   ======================================================================
   ✅ HEDERA HCS TOPIC CREATED
   ======================================================================
   📋 Topic ID: 0.0.xxxxx
   
   🔧 ADD THIS TO ENVIRONMENT VARIABLES:
      HEDERA_HCS_TOPIC_ID=0.0.xxxxx
   ======================================================================
   ```
   - Copy the Topic ID and add it as `HEDERA_HCS_TOPIC_ID`

3. **Test the Audit Trail**:
   - Navigate to any token detail page
   - Scroll to "Immutable Audit Trail" section
   - Should show audit logs (if transactions exist) or "No audit logs yet" (if no transactions)
   - Should NOT show "Hedera HCS Not Configured"

4. **Make a Test Transaction**:
   - Buy or sell a token
   - Wait a few seconds
   - Refresh the audit trail - should show the new transaction

## Troubleshooting

### Still showing "No audit logs yet" after adding variables?

1. **Check if service initialized**: Look for `✅ Hedera Audit Service initialized` in logs
2. **Check account balance**: Account needs HBAR (tinybars) for topic creation and message submission
3. **Verify credentials format**: 
   - Account ID must be format `0.0.xxxxx`
   - Private key must be 64 hex characters
4. **Check topic ID**: If using existing topic, verify it's correct format

### Getting errors in logs?

- **"Private key does not match account"**: Verify the private key belongs to the account ID
- **"Account balance too low"**: Fund the Hedera account with HBAR
- **"Topic not found"**: If using `HEDERA_HCS_TOPIC_ID`, verify the topic ID is correct

## Expected Behavior After Fix

✅ Audit trail widget shows audit logs from Hedera HCS  
✅ New buy/sell transactions automatically appear in audit trail  
✅ Price sync events are logged to Hedera  
✅ Users can verify transactions on HashScan via "View Topic" link  
✅ Immutable, timestamped audit records for all cross-chain operations

## Next Steps

1. Add the required environment variables to Google Cloud
2. Redeploy the backend service
3. Verify initialization in logs
4. Test with a token transaction
5. Confirm audit logs appear in the UI

