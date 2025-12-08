# Connect Cloud SQL to Cloud Run

## ✅ Migration Complete!
All 210 rows have been successfully migrated from Railway to Cloud SQL.

## Next Step: Connect Cloud SQL to Cloud Run

Your backend is currently still running on Railway. We need to connect Cloud Run to Cloud SQL so it uses the new database.

### Step 1: Connect Cloud SQL Instance to Cloud Run

1. **Go to Cloud Run**: https://console.cloud.google.com/run?project=voltaic-wall-480423-u9
2. **Click on `crossify-backend` service**
3. **Click "EDIT & DEPLOY NEW REVISION"**
4. **Scroll down to "Container, Networking, Security" section**
5. **Click "Connections" tab**
6. **Under "Cloud SQL connections"**, click "ADD CLOUD SQL CONNECTION"
7. **Select `crossify-db`** (your Cloud SQL instance)
8. **Click "DEPLOY"**

### Step 2: Update DATABASE_URL Environment Variable

1. **Still in the Cloud Run service edit page**
2. **Go to "Variables & Secrets" tab**
3. **Find `DATABASE_URL`** in the environment variables
4. **Update it to use Cloud SQL connection string:**
   ```
   postgresql://postgres:YOUR_PASSWORD@/crossify-db?host=/cloudsql/crossify-db-connection-name
   ```
   
   **OR** use the simpler format (if Cloud SQL connection is set up):
   ```
   postgresql://postgres:YOUR_PASSWORD@34.147.140.176:5432/crossify-db?sslmode=require
   ```

5. **Actually, better approach**: Use the Cloud SQL connection format:
   - The connection name format is: `PROJECT_ID:REGION:INSTANCE_NAME`
   - For you: `voltaic-wall-480423-u9:europe-west1:crossify-db`
   - Update `DATABASE_URL` to:
     ```
     postgresql://postgres:YOUR_PASSWORD@/crossify-db?host=/cloudsql/voltaic-wall-480423-u9:europe-west1:crossify-db
     ```

6. **Click "DEPLOY"**

### Step 3: Verify Connection

1. **After deployment, check the Cloud Run logs**
2. **Look for**: `✅ PostgreSQL database initialized successfully`
3. **Test the API**: Visit your Cloud Run URL (https://crossify-backend-88917802850.europe-west1.run.app/health)

### Step 4: Update Frontend (if needed)

The frontend should already be pointing to Cloud Run (we updated `VITE_API_BASE` earlier).

### Step 5: Shut Down Railway

Once everything is working:
1. **Go to Railway dashboard**
2. **Delete the `migration-temp` service** (migration is done)
3. **Stop or delete your main backend service** (now running on Cloud Run)
4. **Keep the Postgres service for now** (as backup) or delete it if you're confident

---

## Quick Reference

- **Cloud Run URL**: https://crossify-backend-88917802850.europe-west1.run.app
- **Cloud SQL Instance**: `crossify-db`
- **Connection Name**: `voltaic-wall-480423-u9:europe-west1:crossify-db`
- **Database Name**: `crossify-db`
- **Database User**: `postgres`
- **Database Password**: `YOUR_PASSWORD`

---

## Troubleshooting

If you see connection errors:
1. Make sure Cloud SQL connection is added in Cloud Run
2. Check that `DATABASE_URL` uses the correct format
3. Verify Cloud SQL instance is running
4. Check Cloud Run service account has Cloud SQL Client role



