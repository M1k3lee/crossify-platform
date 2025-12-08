# Migration from Railway to Google Cloud Run - Status

## ✅ Completed Steps

1. ✅ **Google Cloud Project Setup**
   - Project created: `voltaic-wall-480423-u9`
   - Billing activated with £300 credit

2. ✅ **APIs Enabled**
   - Cloud Run API
   - Cloud SQL Admin API
   - Cloud Build API
   - Artifact Registry API

3. ✅ **Database Created**
   - Cloud SQL PostgreSQL instance: `crossify-db`
   - Region: `europe-west2` (London)
   - Configuration: 1 vCPU, 3.75 GB RAM, 10 GB storage

4. ✅ **Backend Deployed**
   - Service: `crossify-backend`
   - URL: `https://crossify-backend-88917802850.europe-west1.run.app`
   - Region: `europe-west1`
   - Status: ✅ Deployed and publicly accessible

5. ✅ **Cloud Build Trigger Configured**
   - Trigger: `deploy-backend`
   - Repository: `M1k3lee/crossify-platform`
   - Auto-deploy on push to `main` branch
   - Configuration: `cloudbuild.yaml` (autodetected)

6. ✅ **Docker Configuration**
   - `backend/Dockerfile` created
   - `backend/.dockerignore` created
   - `cloudbuild.yaml` created with logging configuration

## ⚠️ Remaining Steps (Critical)

### 1. Update GitHub Secret (URGENT - Railway expires tonight!)

**Action Required:**
1. Go to your GitHub repository: https://github.com/M1k3lee/crossify-platform
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Find or create the secret:
   - **Name:** `VITE_API_BASE`
   - **Value:** `https://crossify-backend-88917802850.europe-west1.run.app`
4. Click **Update secret** (or **Add secret** if new)
5. **Trigger deployment:**
   - Go to **Actions** tab
   - Click **"Deploy to GitHub Pages"** workflow
   - Click **"Run workflow"** → **"Run workflow"**
   - OR just push a commit to `main` branch

**Why:** The frontend is still pointing to Railway, which expires tonight. Without this update, the site will break.

### 2. Configure Environment Variables in Cloud Run

The backend needs environment variables from Railway. You need to:

1. Go to Cloud Run → `crossify-backend` → **Edit & Deploy New Revision**
2. Go to **Variables & Secrets** tab
3. Add all environment variables from Railway (DATABASE_URL, API keys, etc.)
4. Click **Deploy**

**Critical Variables Needed:**
- `DATABASE_URL` (Cloud SQL connection string)
- `PORT=3001`
- Any API keys (Hedera, Cloudinary, etc.)
- CORS settings

### 3. Connect Cloud SQL to Cloud Run

1. Go to Cloud Run → `crossify-backend` → **Edit & Deploy New Revision**
2. Go to **Connections** tab
3. Under **Cloud SQL connections**, click **Add connection**
4. Select `crossify-db`
5. Click **Deploy**

### 4. Update Database Connection String

After connecting Cloud SQL, you'll need to:
1. Get the Cloud SQL connection name
2. Update `DATABASE_URL` in Cloud Run environment variables to use the Cloud SQL connection

## 📊 Current Status

| Component | Status | URL/Details |
|-----------|--------|-------------|
| Backend (Cloud Run) | ✅ Deployed | `https://crossify-backend-88917802850.europe-west1.run.app` |
| Database (Cloud SQL) | ✅ Created | `crossify-db` (europe-west2) |
| Frontend (GitHub Pages) | ⚠️ Needs Update | Still pointing to Railway |
| Environment Variables | ❌ Not Configured | Need to add from Railway |
| Cloud SQL Connection | ❌ Not Connected | Need to connect to Cloud Run |

## 🚨 Urgent Actions (Railway expires tonight!)

1. **Update GitHub Secret `VITE_API_BASE`** - Do this NOW
2. **Export environment variables from Railway** - Before it expires
3. **Configure Cloud Run environment variables** - Use exported values
4. **Connect Cloud SQL to Cloud Run** - So backend can access database

## 📝 Notes

- Railway trial expires **tonight** - migrate ASAP
- Cloud Run backend is deployed but needs environment variables to function
- Database is created but not yet connected to the backend
- Frontend will break if Vercel env var isn't updated before Railway expires

## 🔗 Useful Links

- **Cloud Run Service:** https://console.cloud.google.com/run/detail/europe-west1/crossify-backend?project=voltaic-wall-480423-u9
- **Cloud SQL Database:** https://console.cloud.google.com/sql/instances?project=voltaic-wall-480423-u9
- **Cloud Build Triggers:** https://console.cloud.google.com/cloud-build/triggers?project=voltaic-wall-480423-u9
- **GitHub Repository:** https://github.com/M1k3lee/crossify-platform
- **GitHub Actions:** https://github.com/M1k3lee/crossify-platform/actions

