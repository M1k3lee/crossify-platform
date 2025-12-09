# DefiLlama Adapter for Crossify

This directory contains the DefiLlama adapter for the Crossify protocol. The adapter enables Crossify to be listed on DefiLlama and track protocol metrics like TVL, volumes, and fees.

## What is This?

A DefiLlama adapter is a script that allows your DeFi project to be tracked by DefiLlama's analytics platform. This is often a requirement for funding portals and grants programs.

## Files

- `index.js` - The main adapter file that fetches data from Crossify's API and formats it for DefiLlama
- `README.md` - This file

## How It Works

1. The adapter queries Crossify's API endpoint: `https://api.crossify.io/api/protocol/stats`
2. The API returns aggregated TVL data by chain
3. The adapter maps Crossify chain names to DefiLlama chain identifiers
4. Returns TVL in DefiLlama's expected format

## How to Submit to DefiLlama

1. **Fork the DefiLlama Adapters Repository:**
   ```bash
   # Go to https://github.com/DefiLlama/DefiLlama-Adapters and fork it
   ```

2. **Create Project Folder:**
   - In your forked repo, navigate to `projects/`
   - Create a new folder: `projects/crossify/`

3. **Add Adapter File:**
   - Copy `index.js` from this directory to `projects/crossify/index.js` in your forked repo
   - Update the `API_BASE_URL` constant to point to your production API URL

4. **Test the Adapter:**
   ```bash
   cd DefiLlama-Adapters
   node test.js projects/crossify/index.js
   ```

5. **Submit Pull Request:**
   - Commit your changes
   - Push to your fork
   - Create a PR to the main DefiLlama-Adapters repository
   - Include a brief description of Crossify and what the adapter does
   - Enable "Allow edits by maintainers" in the PR settings

6. **Wait for Review:**
   - The DefiLlama team will review your PR
   - Once approved and merged, your protocol will appear on DefiLlama within 24 hours

## Requirements

- Your API endpoint must be publicly accessible
- The endpoint should return TVL data in USD
- TVL should be aggregated by chain
- The API should be stable and reliable (DefiLlama will query it regularly)

## API Endpoint Requirements

Your backend API endpoint `/api/protocol/stats` should return:

```json
{
  "success": true,
  "tvl": {
    "total": 123456.78,
    "byChain": {
      "ethereum": 50000.00,
      "base": 30000.00,
      "bsc": 25000.00,
      "hedera": 10000.00,
      "unichain": 8356.78
    }
  },
  "volume": {
    "daily24h": 5000.00,
    "weekly7d": 35000.00,
    "monthly30d": 150000.00
  },
  "fees": {
    "daily24h": 50.00,
    "weekly7d": 350.00,
    "monthly30d": 1500.00
  }
}
```

## Notes

- Update the `start` timestamp in `index.js` to your actual protocol launch date
- Update `API_BASE_URL` to your production API URL
- Test thoroughly before submitting the PR
- The adapter currently aggregates TVL by chain - you can enhance it later to break down by individual token addresses if needed

