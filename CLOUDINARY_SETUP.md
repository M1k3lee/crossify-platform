# Cloudinary Setup Guide

## Overview
Cloudinary provides persistent cloud storage for images, solving the Railway ephemeral storage issue. Images uploaded to Cloudinary will persist across deployments and container restarts.

## Your Cloudinary Credentials

You've provided:
- **API Key**: `156865466263218`
- **API Secret**: `hmMhdSWPV0GZKMnIgQ0EmdBW9uU`

You still need to get your **Cloud Name** from your Cloudinary dashboard.

## Step 1: Get Your Cloud Name

1. Go to https://cloudinary.com/console
2. Log in to your Cloudinary account
3. On the dashboard, you'll see your **Cloud Name** (it's usually displayed at the top)
4. It looks something like: `dxyz123abc` or `my-cloud-name`

## Step 2: Add Environment Variables to Railway

1. Go to your Railway project: https://railway.app
2. Select your backend service
3. Click on the **"Variables"** tab
4. Click **"+ New Variable"** and add these three variables:

   ```
   CLOUDINARY_CLOUD_NAME=your-cloud-name-here
   CLOUDINARY_API_KEY=156865466263218
   CLOUDINARY_API_SECRET=hmMhdSWPV0GZKMnIgQ0EmdBW9uU
   ```

   **Important**: Replace `your-cloud-name-here` with your actual Cloud Name from Step 1.

5. Click **"Deploy"** or Railway will automatically redeploy when you save the variables

## Step 3: Verify Setup

After Railway redeploys:

1. Try uploading a banner or logo on a token
2. Check the backend logs - you should see:
   - `✅ Uploaded to Cloudinary: https://res.cloudinary.com/...`
3. The image should display immediately and persist across deployments

## How It Works

- **When Cloudinary is configured**: Images are uploaded directly to Cloudinary and the full Cloudinary URL is stored in the database
- **When Cloudinary is NOT configured**: Falls back to local storage (for backward compatibility)
- **Existing images**: Old local storage images will still work via the `/upload/file/:filename` endpoint until they're lost on container restart

## Benefits

✅ **Persistent Storage**: Images survive container restarts and deployments  
✅ **CDN**: Cloudinary serves images via a global CDN (faster loading)  
✅ **Automatic Optimization**: Images are automatically optimized for web  
✅ **Transformations**: Can resize, crop, and transform images on-the-fly  
✅ **Free Tier**: 25GB storage and 25GB bandwidth per month (free)

## Troubleshooting

### Images not uploading to Cloudinary
- Check Railway logs for Cloudinary errors
- Verify all three environment variables are set correctly
- Make sure your Cloud Name is correct (no spaces, lowercase)

### Images still not displaying
- Check browser console for errors
- Verify the Cloudinary URL is being stored in the database
- Check that the Cloudinary URL is accessible (try opening it directly in a browser)

### Fallback to local storage
- If Cloudinary upload fails, the system automatically falls back to local storage
- Check backend logs for Cloudinary error messages
- Verify your API credentials are correct

## Security Notes

⚠️ **Never commit these credentials to Git** - they're already in environment variables  
⚠️ **Keep your API Secret secure** - it has full access to your Cloudinary account  
⚠️ **Consider using Railway's secret management** for sensitive credentials

