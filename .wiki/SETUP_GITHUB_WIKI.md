# How to Set Up GitHub Wiki

## Step 1: Initialize the Wiki

1. Go to your repository: https://github.com/M1k3lee/crossify-platform
2. Click the **"Wiki"** tab
3. Click **"Create the first page"** button
4. Title it: `Home`
5. Copy the content from `.wiki/Home.md` and paste it
6. Click **"Save Page"**

This will initialize the wiki repository.

## Step 2: Clone the Wiki Repository

After creating the first page, GitHub creates a separate wiki repository. Clone it:

```bash
git clone https://github.com/M1k3lee/crossify-platform.wiki.git
cd crossify-platform.wiki
```

## Step 3: Copy All Wiki Files

Copy all the markdown files from `.wiki/` to the cloned wiki directory:

```bash
# From the main repo directory
cp .wiki/*.md ../crossify-platform.wiki/
```

Or manually copy:
- Architecture.md
- Contracts.md
- Development-Process.md
- Integration.md
- Roadmap.md
- Testing.md
- README.md

## Step 4: Commit and Push

```bash
cd crossify-platform.wiki
git add .
git commit -m "Add comprehensive wiki documentation"
git push origin master
```

## Alternative: Manual Creation

If you prefer, you can create each page manually in GitHub's wiki interface:
1. Click "New Page" in the wiki
2. Name the page (e.g., "Architecture")
3. Copy content from the corresponding `.wiki/*.md` file
4. Save

Repeat for each page.

