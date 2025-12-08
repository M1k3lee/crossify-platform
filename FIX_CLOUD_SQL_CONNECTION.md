# Fix Cloud SQL Connection Timeout

## The Problem
Railway can connect to its own database, but can't reach Cloud SQL at `34.147.140.176:5432`. This is a network/firewall issue.

## Solution Options

### Option 1: Enable Cloud SQL Public IP & Whitelist (Quick Fix)

1. **Go to Cloud SQL**: https://console.cloud.google.com/sql/instances/crossify-db?project=voltaic-wall-480423-u9
2. **Click "Connections" tab**
3. **Under "Public IP"**:
   - Make sure **"Public IP" is enabled**
   - Click **"Add network"** or **"Authorized networks"**
   - Add: `0.0.0.0/0` (allows from anywhere - **temporary for migration only!**)
   - Or get Railway's IP and whitelist it specifically
4. **Save**
5. **Redeploy Railway migration**

### Option 2: Export First, Import Later (Safer)

Since Railway can't reach Cloud SQL directly, we can:

1. **Export data from Railway to JSON/file**
2. **Run import script locally or on Cloud Run** (which can access Cloud SQL)

### Option 3: Use Cloud SQL Proxy (More Complex)

Set up Cloud SQL Proxy, but this is more complex for a one-time migration.

## Quick Fix Steps (Option 1)

1. **Cloud SQL Console → crossify-db → Connections**
2. **Public IP section → Add network**
3. **Add:** `0.0.0.0/0` (temporary - remove after migration!)
4. **Save**
5. **Go back to Railway → Redeploy migration**

**⚠️ Security Note**: `0.0.0.0/0` allows connections from anywhere. This is OK for a one-time migration, but **remove it after migration completes!**

---

**Recommended**: Use Option 1 for quick migration, then remove the whitelist after.



