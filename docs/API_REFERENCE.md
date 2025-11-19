# Crossify API Reference

**Last Updated**: January 2025  
**Base URL**: `https://crossify-platform-production.up.railway.app/api`

## Authentication

Most endpoints don't require authentication. Wallet signatures are used for blockchain transactions.

## Token Endpoints

### Create Token

**POST** `/tokens/create`

Creates a new token configuration.

**Request Body**:
```json
{
  "name": "My Token",
  "symbol": "MTK",
  "decimals": 18,
  "initialSupply": "1000000",
  "basePrice": "1000000000000000",
  "slope": "1000000000000",
  "logoIpfs": "Qm...",
  "description": "My token description",
  "twitterUrl": "https://twitter.com/...",
  "websiteUrl": "https://..."
}
```

**Response**:
```json
{
  "id": "uuid",
  "name": "My Token",
  "symbol": "MTK",
  ...
}
```

### Get Token Status

**GET** `/tokens/:id/status`

Returns token status across all chains.

**Response**:
```json
{
  "token": {...},
  "deployments": [
    {
      "chain": "sepolia",
      "status": "deployed",
      "tokenAddress": "0x...",
      "curveAddress": "0x...",
      "currentPrice": "0.001",
      "marketCap": "1000"
    }
  ]
}
```

### Price Sync

**GET** `/tokens/:id/price-sync`

Returns current price synchronization status.

**Response**:
```json
{
  "expectedPrice": "0.001",
  "expectedPriceUSD": "3.00",
  "chains": [
    {
      "chain": "sepolia",
      "actualPrice": "0.001",
      "actualPriceUSD": "3.00",
      "variance": "0.00%"
    }
  ],
  "maxVariance": "0.00%"
}
```

### Sync Prices

**POST** `/tokens/:id/sync-prices`

Triggers full price synchronization (configuration + sync).

**Response**:
```json
{
  "success": true,
  "message": "Configuration: Configured 3/3 chains. Sync: Synced 3/3 chains",
  "configuration": {
    "success": true,
    "results": [
      {
        "chain": "sepolia",
        "success": true,
        "message": "Already configured correctly"
      }
    ]
  },
  "sync": {
    "success": true,
    "results": [
      {
        "chain": "sepolia",
        "success": true,
        "message": "Supply already in sync: 100.0"
      }
    ]
  },
  "diagnostics": [...]
}
```

### Sync Diagnostics

**GET** `/tokens/:id/sync-diagnostics`

Returns detailed diagnostics for troubleshooting.

**Response**:
```json
{
  "tokenId": "uuid",
  "diagnostics": [
    {
      "chain": "sepolia",
      "curveAddress": "0x...",
      "trackerAddress": "0x...",
      "actualSupply": "100.0",
      "trackerSupply": "100.0",
      "globalSupply": "100.0",
      "needsUpdate": false,
      "canUpdate": true,
      "authorization": {
        "curveAuthorized": true,
        "walletIsOwner": true
      }
    }
  ]
}
```

### Configure Bonding Curves

**POST** `/tokens/:id/configure-bonding-curves`

Only runs configuration (no sync).

**Response**: Same as sync-prices configuration section.

### Authorize Backend Wallet

**POST** `/tokens/:id/authorize-backend-wallet`

Authorizes the backend wallet in GlobalSupplyTracker contracts.

**Response**:
```json
{
  "success": true,
  "message": "Authorized on 3/3 chains",
  "results": [
    {
      "chain": "sepolia",
      "success": true,
      "txHash": "0x..."
    }
  ]
}
```

### Price History

**GET** `/tokens/:id/price-history`

Returns OHLC price history for charts.

**Query Parameters**:
- `timeframe`: `1h`, `24h`, `7d`, `30d` (default: `24h`)
- `chain`: Optional chain filter

**Response**:
```json
{
  "data": [
    {
      "time": 1234567890,
      "open": 0.001,
      "high": 0.0015,
      "low": 0.0009,
      "close": 0.0012,
      "volume": 1000
    }
  ],
  "timeframe": "24h",
  "interval": 3600000
}
```

### Analytics

**GET** `/tokens/:id/analytics`

Returns token analytics and statistics.

**Query Parameters**:
- `period`: `24h`, `7d`, `30d`, `all` (default: `7d`)

**Response**:
```json
{
  "period": "7d",
  "statistics": {
    "totalTransactions": 100,
    "buyTransactions": 60,
    "sellTransactions": 40,
    "buySellRatio": "1.50",
    "totalVolume": 5000,
    "avgPrice": 0.001,
    "uniqueAddresses": 25,
    "priceChange": 10.5,
    "firstPrice": 0.0009,
    "lastPrice": 0.001
  },
  "volumeByDay": [...],
  "transactionsByType": [...]
}
```

**Note**: Returns empty data if queries fail (no 500 error).

### Market Depth

**GET** `/tokens/:id/market-depth`

Returns market depth data for order book visualization.

**Response**:
```json
{
  "buyOrders": [
    {
      "price": 0.001,
      "amount": 1000,
      "total": 1.0
    }
  ],
  "sellOrders": [...]
}
```

## Transaction Endpoints

### Buy Tokens

**POST** `/tokens/:id/buy`

Initiates a buy transaction (returns transaction data for wallet signing).

**Request Body**:
```json
{
  "chain": "sepolia",
  "amount": "1000"
}
```

### Sell Tokens

**POST** `/tokens/:id/sell`

Initiates a sell transaction.

**Request Body**:
```json
{
  "chain": "sepolia",
  "amount": "1000"
}
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message",
  "message": "Detailed error message",
  "details": "Additional details (development only)"
}
```

## Rate Limiting

- **General endpoints**: 100 requests per minute
- **Sync endpoints**: 10 requests per minute
- **Transaction endpoints**: 5 requests per minute

## WebSocket Events (Future)

Real-time updates via WebSocket:
- Price updates
- Transaction confirmations
- Sync status changes

