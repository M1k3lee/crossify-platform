# Admin Dashboard Documentation

## Overview

The Admin Dashboard is a secure, password-protected area for platform administrators to monitor and manage the Crossify.io platform. It provides real-time insights into platform activity, fee collection, and token management.

## Access

**URL:** `/admin`

**Authentication:**
- Password-protected login
- JWT token-based session (24-hour expiry)
- Secure password hashing (bcrypt)

**Default Password:** `admin123` (MUST be changed in production via `ADMIN_PASSWORD_HASH` env variable)

## Features

### 1. Dashboard Overview
- **Total Tokens**: Count of all tokens created
- **Active Tokens**: Tokens deployed in last 7 days
- **Total Fees (30d)**: Total platform fees collected in last 30 days
- **Fee Count (30d)**: Number of fee transactions in last 30 days

### 2. Fee Analytics
- **Fee Breakdown**: Fees by type (creation, mint, cross-chain, bridge)
- **Real-time Fees**: Live feed of fee collection
- **Historical Data**: Fee trends over time (7d, 30d, 90d, 1y)
- **Top Tokens**: Tokens generating most fees

### 3. Token Management
- **All Tokens**: Complete list of all tokens
- **Search & Filter**: Find tokens by name, symbol, or ID
- **Advanced Settings**: View token configurations
- **Deployment Status**: See deployment details per chain

### 4. Platform Statistics
- **User Metrics**: Active users, creators
- **Platform Growth**: Token creation trends
- **Revenue Metrics**: Fee collection analytics
- **Chain Distribution**: Activity per blockchain

## API Endpoints

### Authentication
- `POST /api/admin/login` - Login with password
- Returns JWT token for subsequent requests

### Dashboard
- `GET /api/admin/dashboard` - Dashboard overview data
- `GET /api/admin/statistics` - Platform statistics

### Fees
- `GET /api/admin/fees` - Fee analytics (with period filter)
- `GET /api/admin/fees/realtime` - Real-time fee stream
- `POST /api/admin/fees/record` - Record a fee (called by platform)

### Tokens
- `GET /api/admin/tokens` - All tokens with pagination and search

## Security

### Password Protection
- Passwords are hashed using bcrypt
- Set `ADMIN_PASSWORD_HASH` environment variable in production
- Generate hash: `bcrypt.hashSync('your-password', 10)`

### JWT Tokens
- 24-hour expiry
- Stored in localStorage (frontend)
- Sent in `Authorization: Bearer <token>` header

### API Key Protection
- Fee recording endpoint requires `X-API-Key` header
- Set `PLATFORM_API_KEY` environment variable

## Environment Variables

```env
# Admin Dashboard
ADMIN_PASSWORD_HASH=<bcrypt-hashed-password>
JWT_SECRET=<your-secret-key>
PLATFORM_API_KEY=<api-key-for-fee-recording>
```

## Fee Collection

### Fee Types
- `token_creation`: Fixed fee for creating tokens (0.01 ETH)
- `mint`: Fee on mint operations (0.1% of tokens)
- `cross_chain`: Fee on cross-chain sync (0.5% of trade value)
- `bridge`: Fee on liquidity bridge (0.1% + LayerZero costs)

### Recording Fees
Fees are automatically recorded when:
- Tokens are created
- Mint operations occur
- Cross-chain sync happens
- Liquidity bridges are used

Manual recording via API:
```bash
POST /api/admin/fees/record
Headers: X-API-Key: <your-api-key>
Body: {
  "tokenId": "token-id",
  "chain": "ethereum",
  "feeType": "mint",
  "amount": "100",
  "amountUsd": 50.25,
  "nativeAmount": "0.001",
  "fromAddress": "0x...",
  "toAddress": "0x...",
  "txHash": "0x..."
}
```

## Database Schema

### platform_fees
```sql
CREATE TABLE platform_fees (
  id INTEGER PRIMARY KEY,
  token_id TEXT,
  chain TEXT NOT NULL,
  fee_type TEXT NOT NULL,
  amount TEXT NOT NULL,
  amount_usd REAL,
  native_amount TEXT,
  from_address TEXT,
  to_address TEXT,
  tx_hash TEXT,
  status TEXT DEFAULT 'pending',
  collected_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### fee_statistics
```sql
CREATE TABLE fee_statistics (
  id INTEGER PRIMARY KEY,
  date TEXT UNIQUE NOT NULL,
  total_fees_usd REAL DEFAULT 0,
  token_creation_fees REAL DEFAULT 0,
  mint_fees REAL DEFAULT 0,
  cross_chain_fees REAL DEFAULT 0,
  bridge_fees REAL DEFAULT 0,
  buyback_amount REAL DEFAULT 0,
  liquidity_amount REAL DEFAULT 0,
  burn_amount REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## Future Enhancements

1. **Buyback Dashboard**: Monitor CFY token buyback activity
2. **Liquidity Management**: Track liquidity provision to CFY pools
3. **User Management**: Manage users and permissions
4. **Fee Configuration**: Adjust fee percentages
5. **Export Reports**: Download fee reports as CSV/PDF
6. **Alerts**: Set up alerts for unusual activity
7. **Multi-admin Support**: Role-based access control

## Production Checklist

- [ ] Change default admin password
- [ ] Set `ADMIN_PASSWORD_HASH` environment variable
- [ ] Set strong `JWT_SECRET`
- [ ] Set `PLATFORM_API_KEY` for fee recording
- [ ] Enable HTTPS
- [ ] Set up rate limiting
- [ ] Configure CORS properly
- [ ] Enable audit logging
- [ ] Set up monitoring and alerts




