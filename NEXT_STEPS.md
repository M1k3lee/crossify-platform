# Next Steps After Configuring Environment Variables

## ✅ You've Completed:
- [x] Created `.env` files
- [x] Added RPC URLs
- [x] Added private keys
- [x] Configured CORS and JWT secret

## 🚀 Next Steps:

### Step 1: Install Dependencies

**Option A: Install everything at once (Recommended)**
```powershell
npm run install:all
```

**Option B: Install individually**
```powershell
cd backend
npm install
cd ../frontend
npm install
cd ../contracts
npm install
cd ..
```

### Step 2: Start the Backend Server

Open a **new PowerShell terminal** (keep this one open) and run:

```powershell
cd backend
npm run dev
```

You should see:
```
✅ Database initialized
✅ Redis initialized (or error if Redis not running - that's OK)
✅ Price sync service started
🚀 Server running on port 3001
```

**Note:** If you see a Redis error, that's OK for now - Redis is optional for the MVP.

### Step 3: Start the Frontend

Open **another new PowerShell terminal** and run:

```powershell
cd frontend
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### Step 4: Open the Application

1. Open your browser and go to: **http://localhost:3000**
2. You should see the Crossify.io homepage!

### Step 5: Test the Setup

1. Click "Launch Your Token" or go to `/builder`
2. Try filling out the token creation form
3. Check the browser console (F12) for any errors
4. Check the backend terminal for API requests

---

## 🔧 Troubleshooting

### Backend won't start?

**Error: "Cannot find module 'dotenv'"**
```powershell
cd backend
npm install
```

**Error: "Database initialization failed"**
- Make sure you're in the `backend` directory
- Check that `DATABASE_PATH=./data/crossify.db` in your `.env`

**Error: "Redis connection failed"**
- This is OK! Redis is optional
- The app will still work without Redis (some features like price caching won't work)

### Frontend won't start?

**Error: "Cannot find module"**
```powershell
cd frontend
npm install
```

**Error: "Port 3000 already in use"**
- Change the port in `frontend/vite.config.ts` or
- Close the application using port 3000

### Can't connect frontend to backend?

- Make sure backend is running on port 3001
- Check `CORS_ORIGIN=http://localhost:3000` in `backend/.env`
- Check browser console (F12) for CORS errors

---

## 📝 Quick Commands Reference

```powershell
# Install all dependencies
npm run install:all

# Start backend (Terminal 1)
cd backend
npm run dev

# Start frontend (Terminal 2)
cd frontend
npm run dev

# Build contracts (when ready)
cd contracts
npm run compile
```

---

## 🎯 What to Do Next

1. ✅ Install dependencies
2. ✅ Start backend and frontend
3. ✅ Open http://localhost:3000
4. ⏭️ Test token creation (UI will work, but contracts need deployment)
5. ⏭️ Deploy contracts to testnets (see DEPLOYMENT.md)
6. ⏭️ Test full token launch flow

---

## 🚨 Important Notes

- **Backend and Frontend must run simultaneously** - Keep both terminals open!
- **Contracts are not deployed yet** - Token creation will work in the UI, but actual deployment requires deploying contracts first
- **Use testnet wallets only** - Never use mainnet private keys in development

---

## 📚 Need More Help?

- See `QUICKSTART.md` for full setup guide
- See `DEPLOYMENT.md` for contract deployment
- See `SETUP_ENV.md` for environment variable details

Good luck! 🚀








