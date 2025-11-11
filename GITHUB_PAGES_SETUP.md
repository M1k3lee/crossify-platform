# GitHub Pages Setup (Free Alternative to Netlify)

## Quick Setup Steps

### Step 1: Enable GitHub Pages
1. Go to your GitHub repository: https://github.com/M1k3lee/crossify-platform
2. Click **"Settings"** (top menu)
3. Scroll down to **"Pages"** (left sidebar)
4. Under **"Source"**, select **"GitHub Actions"**
5. Click **"Save"**

### Step 2: Set Environment Variable (Optional but Recommended)
1. In your repository, go to **"Settings"** → **"Secrets and variables"** → **"Actions"**
2. Click **"New repository secret"**
3. Name: `VITE_API_BASE`
4. Value: `https://crossify-platform-production.up.railway.app/api`
5. Click **"Add secret"**

**Note**: If you don't set this, it will use the default Railway URL, which should work fine.

### Step 3: Trigger Deployment
1. Go to the **"Actions"** tab in your repository
2. Click **"Deploy to GitHub Pages"** workflow
3. Click **"Run workflow"** → **"Run workflow"**
4. Wait for the workflow to complete (~2-3 minutes)

### Step 4: Access Your Site
Your site will be available at:
- **Default URL**: `https://M1k3lee.github.io/crossify-platform`
- **Custom Domain**: You can add `crossify.io` later in Pages settings

## Advantages

✅ **Free** - Unlimited bandwidth and deployments  
✅ **No limits** - Unlike Netlify/Vercel free tiers  
✅ **Automatic deployments** - Deploys on every push to `main`  
✅ **Already configured** - Workflow is ready to go  
✅ **Free SSL** - Automatic HTTPS  

## Custom Domain Setup (Optional)

If you want to use `crossify.io`:

1. In GitHub Pages settings, add your custom domain: `crossify.io`
2. Update your DNS records:
   - Type: `CNAME`
   - Name: `@` or `www`
   - Value: `M1k3lee.github.io`
3. GitHub will automatically provision SSL certificate

## Troubleshooting

### Build fails
- Check the Actions tab for error logs
- Make sure `VITE_API_BASE` secret is set if you're using a custom API URL

### Site not loading
- Wait a few minutes after deployment completes
- Check the Actions tab to see if deployment succeeded
- Clear browser cache

### 404 errors on routes
- GitHub Pages should handle this automatically with the workflow
- If issues persist, check the `netlify.toml` redirect rules (they won't apply to GitHub Pages, but the workflow handles routing)

