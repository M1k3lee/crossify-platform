# Security Remediation Guide - Exposed Secrets

## 🚨 Critical Security Issue

GitGuardian detected exposed secrets in your GitHub repository on **December 8th, 2025**:

1. **PostgreSQL URI** - Database connection string with credentials
2. **Cloudinary API Key Config** - API keys and secrets

## ✅ Immediate Actions Completed

1. ✅ Redacted all hardcoded secrets from documentation files
2. ✅ Replaced actual values with placeholders (`YOUR_*`)
3. ✅ Verified code files use environment variables correctly (not hardcoded)

## ⚠️ Required Actions - YOU MUST DO THESE NOW

### 1. Rotate All Exposed Credentials

**CRITICAL**: Even though we've removed the secrets from the repo, they were exposed in Git history. You MUST rotate all credentials:

#### Cloudinary Credentials
1. Go to https://cloudinary.com/console
2. Navigate to Settings → Security
3. **Regenerate API Key and Secret**
4. Update the new credentials in:
   - Google Cloud Run environment variables
   - Any other deployment platforms you use

#### Database Credentials
1. Go to Google Cloud Console → SQL → Your Database Instance
2. **Change the database password** for the `postgres` user
3. Update `DATABASE_URL` in Google Cloud Run with the new password
4. Format: `postgresql://postgres:NEW_PASSWORD@/crossify-db?host=/cloudsql/...`

#### Private Keys (Ethereum, Hedera)
1. **Generate new private keys** for all exposed wallets
2. **Transfer any funds** from old wallets to new wallets immediately
3. Update environment variables in Google Cloud Run:
   - `PRIVATE_KEY` (new Ethereum private key)
   - `ETHEREUM_PRIVATE_KEY` (new Ethereum private key)
   - `HEDERA_PRIVATE_KEY` (new Hedera private key)
4. **Update wallet addresses** in any configuration files

#### WalletConnect Project ID
1. Go to https://cloud.walletconnect.com
2. **Regenerate** or create a new project
3. Update `WALLETCONNECT_PROJECT_ID` in Google Cloud Run

### 2. Remove Secrets from Git History

The secrets are still in Git history. To completely remove them:

**Option A: Use git-filter-repo (Recommended)**
```bash
# Install git-filter-repo if not already installed
pip install git-filter-repo

# Remove secrets from history
git filter-repo --invert-paths --path RAILWAY_TO_CLOUD_RUN_MAPPING.md
git filter-repo --invert-paths --path CLOUDINARY_SETUP.md
git filter-repo --invert-paths --path scripts/run-migration.ps1
git filter-repo --invert-paths --path scripts/quick-migrate.ps1

# Force push (WARNING: This rewrites history)
git push origin --force --all
```

**Option B: Use BFG Repo-Cleaner (Alternative)**
```bash
# Download BFG from https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --replace-text passwords.txt
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin --force --all
```

**Option C: Create a new repository (Safest)**
1. Create a fresh repository
2. Copy only the current code (without history)
3. Update remote and push

### 3. Add .gitignore Rules

Add these patterns to `.gitignore` to prevent future commits:

```
# Secrets and credentials
*.env
*.env.local
*.env.production
.env.*
secrets/
credentials/
*.key
*.pem
*.p12
*_private_key*
*_secret*
*_password*
```

### 4. Enable GitGuardian Pre-commit Hook

1. Install GitGuardian CLI:
   ```bash
   pip install ggshield
   ```

2. Add pre-commit hook:
   ```bash
   ggshield install
   ```

3. This will scan commits before they're pushed and block secrets

### 5. Review All Recent Commits

Check what else might have been exposed:

```bash
git log --since="2025-12-01" --all --source --full-history
```

### 6. Monitor for Unauthorized Access

#### Cloudinary
- Check Cloudinary dashboard for unusual activity
- Review API usage logs
- Check for unauthorized uploads/deletions

#### Database
- Review Google Cloud SQL logs for suspicious connections
- Check for unauthorized data access
- Monitor for unusual query patterns

#### Blockchain Wallets
- **IMMEDIATELY** check all wallet balances
- Transfer funds to new secure wallets
- Monitor for unauthorized transactions

## 📋 Checklist

- [ ] Rotate Cloudinary API key and secret
- [ ] Update Cloudinary credentials in Google Cloud Run
- [ ] Change database password
- [ ] Update DATABASE_URL in Google Cloud Run
- [ ] Generate new Ethereum private keys
- [ ] Transfer funds from old wallets to new wallets
- [ ] Update PRIVATE_KEY and ETHEREUM_PRIVATE_KEY in Google Cloud Run
- [ ] Generate new Hedera private key
- [ ] Update HEDERA_PRIVATE_KEY in Google Cloud Run
- [ ] Regenerate WalletConnect Project ID
- [ ] Update WALLETCONNECT_PROJECT_ID in Google Cloud Run
- [ ] Remove secrets from Git history (choose one method above)
- [ ] Add .gitignore rules for secrets
- [ ] Install GitGuardian pre-commit hook
- [ ] Review recent commits for other exposed secrets
- [ ] Monitor all services for unauthorized access

## 🔒 Prevention for Future

1. **Never commit secrets** - Always use environment variables
2. **Use secret management** - Consider Google Secret Manager or similar
3. **Pre-commit hooks** - Use GitGuardian or similar tools
4. **Code reviews** - Always review changes before merging
5. **Documentation** - Use placeholders in docs, never real values

## 📞 Support

If you need help with any of these steps, refer to:
- Google Cloud documentation for Secret Manager
- GitGuardian documentation for secret scanning
- Your deployment platform's secret management guides

---

**Last Updated**: December 8th, 2025  
**Status**: Secrets redacted from current code, rotation required

