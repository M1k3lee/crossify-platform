# Verify Migration Success

## Check Railway Logs

In Railway `migration-temp` service → **Logs** tab, you should see:

✅ **Success indicators:**
- "✅ Connected to Railway database"
- "✅ Connected to Cloud SQL database"
- "📦 [table name]: X rows" for each table
- "✅ Imported X/X rows" for each table
- "📊 Migration Summary:"
- "✅ Migration completed!"

## Verify Data in Cloud SQL

### Option 1: Test via API

```bash
curl https://crossify-backend-88917802850.europe-west1.run.app/api/tokens/marketplace
```

You should see your tokens in the response!

### Option 2: Check Cloud SQL Directly

1. Go to: https://console.cloud.google.com/sql/instances/crossify-db?project=voltaic-wall-480423-u9
2. Click **"Cloud SQL Studio"** tab
3. Run query: `SELECT COUNT(*) FROM tokens;`
4. Should show the number of tokens migrated

## What to Look For

- **Token count**: Should match what you had in Railway
- **Token deployments**: Should have all chain deployments
- **Transactions**: Should have transaction history
- **Presale data**: If you had presales, they should be migrated

## If Migration Failed

Check Railway logs for errors:
- Connection errors → Check environment variables
- Table errors → Tables might not exist in Cloud SQL (run backend once to create schema)
- Import errors → Check for data type mismatches

## Clean Up

Once migration is verified:
1. ✅ Delete the `migration-temp` service in Railway
2. ✅ Your data is now safely in Cloud SQL!

---

**Next Step**: Verify your tokens appear in the marketplace API!



