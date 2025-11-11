# GitHub Pages DNS Setup for crossify.io

## DNS Records Needed

After adding `crossify.io` as a custom domain in GitHub Pages settings, you need to configure these DNS records with your domain registrar (where you bought crossify.io).

### Option 1: Apex Domain (crossify.io) - Recommended

Add **4 A records** pointing to GitHub's IP addresses:

```
Type: A
Name: @ (or leave blank, or use "crossify.io")
Value: 185.199.108.153
TTL: 3600 (or default)

Type: A
Name: @
Value: 185.199.109.153
TTL: 3600

Type: A
Name: @
Value: 185.199.110.153
TTL: 3600

Type: A
Name: @
Value: 185.199.111.153
TTL: 3600
```

### Option 2: www Subdomain (www.crossify.io)

Add **1 CNAME record**:

```
Type: CNAME
Name: www
Value: M1k3lee.github.io
TTL: 3600
```

### Option 3: Both (Recommended for Best Compatibility)

Add all 5 records above:
- 4 A records for `crossify.io` (apex domain)
- 1 CNAME record for `www.crossify.io`

## Where to Add These Records

1. **Log in to your domain registrar** (where you bought crossify.io)
   - Common registrars: Namecheap, GoDaddy, Google Domains, Cloudflare, etc.

2. **Find DNS Management**
   - Usually under "DNS Settings", "DNS Management", or "Advanced DNS"

3. **Add the records** as shown above

4. **Save changes**

## Verification

After adding DNS records:

1. **Wait 5-60 minutes** for DNS propagation
2. **Check in GitHub Pages settings** - it should show "DNS check successful" or similar
3. **GitHub will automatically provision SSL certificate** (takes a few minutes)
4. **Test your site**: Visit `https://crossify.io` (should work with HTTPS)

## Troubleshooting

### DNS not propagating
- DNS changes can take up to 48 hours (usually 5-60 minutes)
- Use https://dnschecker.org to check DNS propagation globally
- Make sure you saved the DNS records correctly

### GitHub shows "DNS check failed"
- Double-check the IP addresses are correct
- Make sure you added all 4 A records
- Wait a bit longer for DNS to propagate

### SSL certificate not provisioning
- GitHub automatically provisions SSL after DNS is verified
- Can take 10-60 minutes after DNS is verified
- Make sure "Enforce HTTPS" is enabled in GitHub Pages settings

### Site not loading
- Clear browser cache
- Try incognito/private mode
- Check if DNS has propagated: `nslookup crossify.io` or use online DNS checker

## Current GitHub Pages URL

Until DNS propagates, your site is available at:
- `https://M1k3lee.github.io/crossify-platform`

After DNS is configured and verified:
- `https://crossify.io` (main domain)
- `https://www.crossify.io` (if you set up www CNAME)

