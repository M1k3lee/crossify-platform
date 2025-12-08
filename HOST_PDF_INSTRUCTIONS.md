# How to Host Pitch Deck PDF on Your Site

## Quick Steps

### Option 1: Upload to Your Web Hosting

1. **Upload the PDF file:**
   - Copy `PITCH_DECK.pdf` to your website's public folder
   - Place it at: `public/pitch-deck.pdf` or `www/pitch-deck.pdf`
   - Or upload via FTP/cPanel to your root directory

2. **Access it at:**
   - `https://www.crossify.io/pitch-deck.pdf`

### Option 2: Using GitHub Pages (if your site uses it)

1. **Add PDF to repository:**
   ```bash
   git add PITCH_DECK.pdf
   git commit -m "Add pitch deck PDF"
   git push
   ```

2. **Move to public folder:**
   - If using GitHub Pages, move PDF to `docs/` or root
   - Access at: `https://www.crossify.io/pitch-deck.pdf`

### Option 3: Using Netlify/Vercel

1. **Add to public folder:**
   - If using Netlify: Add to `public/` folder
   - If using Vercel: Add to `public/` folder
   - Deploy - it will be accessible at the root URL

2. **Or use static file hosting:**
   - Upload to any static file host
   - Get the direct link
   - Use that URL in your submission

### Option 4: Quick Hosting Services

**Free options:**
- **GitHub Gist**: Upload as file, get raw link
- **Google Drive**: Upload, share link (set to "Anyone with link")
- **Dropbox**: Upload, get shareable link
- **IPFS**: Upload to IPFS for permanent hosting

**Recommended: Direct hosting on your domain**
- Most professional
- Easy to access
- Shows you have infrastructure

## Verification

After uploading, test the link:
- Visit: `https://www.crossify.io/pitch-deck.pdf`
- Should download or display the PDF
- Verify file size is ~1.2MB

## Update Additional Remarks

Once hosted, use this in your submission:

```
Pitch Deck: https://www.crossify.io/pitch-deck.pdf

[Rest of your additional remarks...]
```




