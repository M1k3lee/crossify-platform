# Quick Google Cloud Setup - Direct Links

## ✅ Already Completed
- ✅ Account activated with billing
- ✅ Project created: `voltaic-wall-480423-u9`
- ✅ Dockerfile created
- ✅ Cloud Build config created

## 🔗 Direct Links to Complete Setup

### Step 1: Enable APIs (Click these links)

1. **Cloud Run API:**
   https://console.cloud.google.com/flows/enableapi?apiid=run.googleapis.com&project=voltaic-wall-480423-u9

2. **Cloud SQL Admin API:**
   https://console.cloud.google.com/flows/enableapi?apiid=sqladmin.googleapis.com&project=voltaic-wall-480423-u9

3. **Cloud Build API:**
   https://console.cloud.google.com/flows/enableapi?apiid=cloudbuild.googleapis.com&project=voltaic-wall-480423-u9

4. **Artifact Registry API:**
   https://console.cloud.google.com/flows/enableapi?apiid=artifactregistry.googleapis.com&project=voltaic-wall-480423-u9

**For each link:** Click "Enable" button when the page loads.

---

### Step 2: Create Cloud SQL Database

**Direct link:**
https://console.cloud.google.com/sql/instances/create?project=voltaic-wall-480423-u9

**Configuration:**
- **Database engine:** PostgreSQL
- **Instance ID:** `crossify-db`
- **Password:** (Set a strong password - SAVE THIS!)
- **Region:** `europe-west1` (or closest to you)
- **Database version:** PostgreSQL 15 or 16
- **Machine type:** Shared core → `db-f1-micro` (smallest/cheapest)
- **Storage:** 10GB SSD
- **Public IP:** ✅ Enable
- **Authorized networks:** Add `0.0.0.0/0` (temporary - we'll secure later)

Click **"Create"** and wait ~5-10 minutes.

**After creation, note:**
- Public IP address
- Connection name (format: `voltaic-wall-480423-u9:europe-west1:crossify-db`)

---

### Step 3: Set Up Cloud Build (GitHub Auto-Deploy)

**Direct link:**
https://console.cloud.google.com/cloud-build/triggers?project=voltaic-wall-480423-u9

1. Click **"Connect Repository"**
2. Select **"GitHub (Cloud Build GitHub App)"**
3. Authorize Google Cloud
4. Select your `crossify-platform` repository
5. Click **"Create Push Trigger"**:
   - **Name:** `deploy-backend`
   - **Event:** Push to a branch
   - **Branch:** `^main$` (or your default branch)
   - **Configuration:** Cloud Build configuration file
   - **Location:** `cloudbuild.yaml`
   - Click **"Create"**

---

### Step 4: First Deployment

**Option A: Manual Deploy via Console**
1. Go to: https://console.cloud.google.com/cloud-build/builds?project=voltaic-wall-480423-u9
2. Click **"Run"** → **"Run trigger"**
3. Select your trigger
4. Click **"Run"**

**Option B: Push to GitHub**
- Push any commit to `main` branch
- Cloud Build will automatically trigger

---

### Step 5: Configure Cloud Run Environment Variables

**Direct link:**
https://console.cloud.google.com/run?project=voltaic-wall-480423-u9

1. Click on `crossify-backend` service (after first deploy)
2. Click **"Edit & Deploy New Revision"**
3. Go to **"Variables & Secrets"** tab
4. Add all environment variables (copy from Railway)

**Critical variables:**
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@PUBLIC_IP:5432/postgres
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://crossify.io,https://www.crossify.io,https://crossify-platform.vercel.app
```

(Add all your other Railway variables)

---

### Step 6: Connect Cloud SQL to Cloud Run

1. In Cloud Run service → **"Connections"** tab
2. Click **"Add Connection"**
3. Select `crossify-db`
4. Update `DATABASE_URL` to use Cloud SQL connection:
   ```
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@/postgres?host=/cloudsql/voltaic-wall-480423-u9:europe-west1:crossify-db
   ```

---

## 📋 Quick Checklist

- [ ] Enable Cloud Run API
- [ ] Enable Cloud SQL Admin API  
- [ ] Enable Cloud Build API
- [ ] Enable Artifact Registry API
- [ ] Create Cloud SQL PostgreSQL instance
- [ ] Set up Cloud Build GitHub trigger
- [ ] Deploy backend (push to GitHub or manual trigger)
- [ ] Add environment variables to Cloud Run
- [ ] Connect Cloud SQL to Cloud Run
- [ ] Update frontend `VITE_API_BASE` URL
- [ ] Test deployment

---

## 🎯 Project Info

**Project ID:** `voltaic-wall-480423-u9`  
**Project Name:** My First Project  
**Region:** `europe-west1` (recommended)

---

**Estimated Time:** 15-20 minutes  
**Cost:** ~£9-17/month (18-33 months with £300 credit)




