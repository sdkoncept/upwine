# Railway Can't See Your Repo - Troubleshooting Guide

## Common Issues & Solutions

### Issue 1: GitHub Authorization Not Granted

**Problem:** Railway needs permission to access your GitHub repositories.

**Solution:**
1. Go to [railway.app](https://railway.app)
2. Click your profile icon (top right)
3. Go to **Settings** → **Connected Accounts**
4. Click **"Connect GitHub"** or **"Reconnect GitHub"**
5. Authorize Railway to access your repositories
6. Make sure to grant access to **all repositories** or at least `sdkoncept/upwine`
7. Try deploying again

### Issue 2: Repository is Private

**Problem:** If your repo is private, Railway needs explicit access.

**Solution:**
1. In Railway, go to **Settings** → **Connected Accounts**
2. Click **"Configure"** next to GitHub
3. Make sure **"Private Repositories"** access is granted
4. Re-authorize if needed

### Issue 3: Repository Not Found

**Problem:** Railway can't find `sdkoncept/upwine`.

**Solution:**
1. Verify the repo exists: Go to `https://github.com/sdkoncept/upwine`
2. Make sure you're logged into the correct GitHub account
3. Check if the repo name is correct (case-sensitive)
4. Try searching for "upwine" in Railway's repo search

### Issue 4: Wrong GitHub Account

**Problem:** Railway is connected to a different GitHub account.

**Solution:**
1. Check which GitHub account Railway is connected to
2. Go to Railway Settings → Connected Accounts
3. Disconnect and reconnect with the correct account (`sdkoncept`)

## Step-by-Step: Connect Railway to GitHub

1. **Go to Railway**
   - Visit [railway.app](https://railway.app)
   - Sign in/up

2. **Authorize GitHub**
   - Click **"New Project"**
   - Select **"Deploy from GitHub repo"**
   - If prompted, click **"Authorize Railway"** or **"Connect GitHub"**

3. **Grant Permissions**
   - When GitHub asks for permissions, select:
     - ✅ **"All repositories"** (recommended)
     - OR select **"Only select repositories"** and choose `upwine`
   - Click **"Authorize Railway"**

4. **Search for Your Repo**
   - In Railway's repo search, type: `upwine`
   - Or search: `sdkoncept/upwine`
   - Click on your repo when it appears

5. **Deploy**
   - Railway will auto-detect Next.js
   - Click **"Deploy"**

## Alternative: Manual Deployment

If Railway still can't see your repo, you can deploy manually:

1. **Install Railway CLI**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login**
   ```bash
   railway login
   ```

3. **Initialize Project**
   ```bash
   railway init
   ```

4. **Deploy**
   ```bash
   railway up
   ```

## Still Having Issues?

1. **Check GitHub Repository Visibility**
   - Go to `https://github.com/sdkoncept/upwine/settings`
   - Make sure the repo exists and is accessible

2. **Verify Railway Account**
   - Make sure you're logged into Railway with the correct account
   - Check Railway Settings → Profile

3. **Try Different Browser**
   - Sometimes browser cache causes issues
   - Try incognito/private mode

4. **Contact Railway Support**
   - Railway Discord: https://discord.gg/railway
   - Or email: support@railway.app

## Quick Checklist

- [ ] Railway account created
- [ ] GitHub account connected in Railway
- [ ] Repository access granted (all repos or specific repo)
- [ ] Private repo access granted (if repo is private)
- [ ] Correct GitHub account (`sdkoncept`)
- [ ] Repository exists: `https://github.com/sdkoncept/upwine`
- [ ] Tried refreshing Railway dashboard
- [ ] Tried disconnecting and reconnecting GitHub

