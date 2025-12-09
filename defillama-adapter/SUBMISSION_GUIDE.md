# DefiLlama Adapter Submission Guide

## Overview

This guide walks you through submitting the Crossify DefiLlama adapter to get listed on DefiLlama.

## Prerequisites

1. **Public API Endpoint**: Your backend must be deployed and accessible
   - Endpoint: `https://your-api-url.com/api/protocol/stats`
   - Must return TVL data in the format specified
   - Must be publicly accessible (no authentication required)

2. **GitHub Account**: You'll need a GitHub account to fork and submit a PR

## Step-by-Step Submission Process

### Step 1: Update API URL

Before submitting, update the API URL in `defillama-adapter/index.js`:

```javascript
const API_BASE_URL = process.env.CROSSIFY_API_URL || 'https://your-actual-api-url.com';
```

Replace `your-actual-api-url.com` with your production API URL (e.g., your Google Cloud Run URL).

### Step 2: Update Launch Date

Update the `start` timestamp in `defillama-adapter/index.js`:

```javascript
start: 1735689600000, // Replace with your actual protocol launch timestamp (Unix timestamp in milliseconds)
```

You can get your launch timestamp from: https://www.epochconverter.com/

### Step 3: Test the API Endpoint

Before submitting, test that your API endpoint works:

```bash
curl https://your-api-url.com/api/protocol/stats
```

You should get a JSON response with TVL data.

### Step 4: Fork DefiLlama Adapters Repository

1. Go to: https://github.com/DefiLlama/DefiLlama-Adapters
2. Click "Fork" button (top right)
3. This creates a copy in your GitHub account

### Step 5: Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/DefiLlama-Adapters.git
cd DefiLlama-Adapters
```

### Step 6: Create Project Folder

```bash
cd projects
mkdir crossify
cd crossify
```

### Step 7: Add Adapter File

Copy the `index.js` file from your `defillama-adapter/` directory:

```bash
# From your crossify-platform directory
cp defillama-adapter/index.js /path/to/DefiLlama-Adapters/projects/crossify/index.js
```

### Step 8: Update the API URL in the Adapter

Edit `projects/crossify/index.js` and make sure `API_BASE_URL` points to your production API.

### Step 9: Test the Adapter

From the DefiLlama-Adapters root directory:

```bash
node test.js projects/crossify/index.js
```

If successful, you should see TVL output.

### Step 10: Commit and Push

```bash
git add projects/crossify/
git commit -m "Add Crossify protocol adapter"
git push origin main
```

### Step 11: Create Pull Request

1. Go to your forked repository on GitHub
2. Click "Pull requests" tab
3. Click "New pull request"
4. Set base repository: `DefiLlama/DefiLlama-Adapters` (base: `master`)
5. Set compare repository: `YOUR_USERNAME/DefiLlama-Adapters` (compare: `main`)
6. Fill in PR title: `Add Crossify protocol adapter`
7. Fill in PR description:
   ```
   ## Protocol Information
   
   **Name**: Crossify
   **Category**: Launchpad
   **Description**: Cross-chain token launch platform with bonding curves and automatic DEX graduation
   
   ## What This Adapter Does
   
   This adapter tracks:
   - Total Value Locked (TVL) across all bonding curves and DEX pools
   - TVL is aggregated across multiple chains: Ethereum, Base, BSC, Hedera, and Unichain
   - Data is fetched from our public API endpoint
   
   ## API Endpoint
   
   - URL: https://your-api-url.com/api/protocol/stats
   - Publicly accessible (no auth required)
   - Returns TVL data aggregated by chain
   
   ## Testing
   
   ✅ Tested locally with `node test.js projects/crossify/index.js`
   ✅ API endpoint verified and accessible
   ```
8. **Enable "Allow edits by maintainers"** (important!)
9. Click "Create pull request"

### Step 12: Wait for Review

- DefiLlama team will review your PR
- They may ask questions or request changes
- Once approved and merged, your protocol will appear on DefiLlama within 24 hours

## Troubleshooting

### API Endpoint Not Accessible
- Make sure your backend is deployed
- Check CORS settings allow requests from DefiLlama servers
- Verify the endpoint returns data in the expected format

### Adapter Test Fails
- Check that `node-fetch` or native `fetch` is available
- Verify the API URL is correct
- Check that the API returns valid JSON

### TVL Shows as Zero
- Verify your database has transactions with reserve balances
- Check that `token_deployments` table has entries with `status = 'deployed'`
- Verify `reserve_balance` values are being updated

## What DefiLlama Will Do

Once your adapter is merged:
- DefiLlama will query your API endpoint regularly (every few hours)
- Your protocol will appear on https://defillama.com
- TVL, volumes, and fees will be tracked automatically
- Your protocol will be searchable and comparable to others

## Additional Resources

- DefiLlama Documentation: https://docs.llama.fi/list-your-project
- DefiLlama Adapters Repo: https://github.com/DefiLlama/DefiLlama-Adapters
- Example Adapters: Check `projects/` folder in the DefiLlama-Adapters repo for examples

## Important Notes

1. **Keep API Endpoint Stable**: Once merged, don't change the API endpoint URL without coordinating with DefiLlama
2. **Maintain API Availability**: Your API should be highly available (DefiLlama queries it regularly)
3. **Data Accuracy**: Ensure TVL calculations are accurate - this affects your protocol's credibility
4. **Response Format**: Don't change the API response format without updating the adapter

## Questions?

If you encounter issues:
1. Check the DefiLlama Discord: https://discord.gg/defillama
2. Review other adapter examples in the DefiLlama-Adapters repo
3. Check DefiLlama documentation: https://docs.llama.fi

