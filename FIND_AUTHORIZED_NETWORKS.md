# Find Authorized Networks in Cloud SQL

## The Issue
You're on the "Summary" tab, but "Authorized networks" is on the "Networking" tab.

## Steps to Add Authorized Network

1. **On the Cloud SQL Connections page**, you should see tabs:
   - Summary (current)
   - **Networking** ← Click this!
   - Security
   - Connectivity Tests

2. **Click the "Networking" tab**

3. **Look for "Authorized networks" section**

4. **Click "Add network" or "+ Add network"**

5. **Enter:**
   - **Name:** `Railway Migration` (or any name)
   - **Network:** `0.0.0.0/0`
   - **Description:** (optional) "Temporary for migration"

6. **Click "Add" or "Save"**

7. **Wait 1-2 minutes** for the change to apply

8. **Go back to Railway and redeploy the migration**

## Alternative: If Networking Tab Doesn't Show Authorized Networks

Some Cloud SQL instances might have it under:
- **Settings** → **Connections** → **Authorized networks**
- Or in the **Security** tab

## Quick Navigation

Direct link to Networking tab:
https://console.cloud.google.com/sql/instances/crossify-db/connections/networking?project=voltaic-wall-480423-u9

---

**Action**: Click the "Networking" tab to see authorized networks!



