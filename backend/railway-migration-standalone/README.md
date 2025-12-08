# Railway Migration Service

This is a standalone migration service that can be deployed to Railway.

## Files in this directory:

- `railway-migration.js` - The migration script
- `package.json` - Dependencies and start command

## How to Deploy to Railway:

1. Connect this directory to Railway service
2. Add environment variable: `CLOUD_SQL_DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@34.147.140.176:5432/crossify-db`
3. Railway will auto-detect `package.json` and run `npm start`
4. Watch logs for migration progress



