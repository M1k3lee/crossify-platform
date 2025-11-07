# Admin Dashboard Access

## Default Password

**Current Default Password:** `admin123`

⚠️ **SECURITY WARNING**: This is a development password. Change it in production!

**Status:** ✅ Fixed and verified - The password hash has been updated and tested. The password `admin123` should now work correctly.

## Setting a Secure Password

### Option 1: Set Password Hash in Environment Variable (Recommended)

1. Generate a password hash:
```bash
cd backend
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YOUR_SECURE_PASSWORD', 10).then(hash => console.log('Password hash:', hash));"
```

2. Add to your `backend/.env` file:
```env
ADMIN_PASSWORD_HASH=$2b$10$YourGeneratedHashHere...
```

3. Restart the backend server.

### Option 2: Use a Pre-Generated Secure Password

A secure password hash has been generated for you:

**Password:** `crossify-admin-2025`
**Hash:** `$2b$10$FhPQ4sZCz6DshyHpPEg/P.vjACl43DCreiPo79NHufySpVPRf5pfa`

Add this to your `backend/.env` file:
```env
ADMIN_PASSWORD_HASH=$2b$10$FhPQ4sZCz6DshyHpPEg/P.vjACl43DCreiPo79NHufySpVPRf5pfa
```

Then restart the backend server and use `crossify-admin-2025` as the password.

## Accessing the Admin Dashboard

1. Navigate to: `http://localhost:3000/admin`
2. Enter your password
3. Click "Login"

## Features Available

- View all tokens created on the platform
- Monitor real-time fee collection
- View fee statistics and analytics
- Track platform metrics
- View token deployment status

## Security Notes

- Change the default password before production deployment
- Use a strong, unique password
- Keep the password hash secure in your `.env` file
- Never commit `.env` files to version control
- Consider using a password manager for production passwords

## JWT Token

- Tokens expire after 24 hours
- You'll need to log in again after expiration
- Tokens are stored in browser localStorage

