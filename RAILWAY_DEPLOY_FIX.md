# Fix Railway Deployment Failure

## Issue: Deploy Failed

Your deployment failed. Here's how to fix it:

## Step 1: Check Build Logs

Visit the build logs URL Railway provided:
```
https://railway.com/project/1f6f7b72-6aa9-4a5b-ad41-422f9197acdc/service/51e00889-51bd-495e-8ba7-9c9c0d306b74?id=bce435f4-dc43-4152-92b8-ac7377d15eb3
```

This will show you the exact error. Common issues:
- Build errors (TypeScript, missing dependencies)
- Database initialization errors
- Missing environment variables

## Step 2: Link Service (if needed)

If you see "No service linked", run in your terminal:

```bash
npx railway service
```

Select your service from the list.

## Step 3: Set Environment Variables via Dashboard

Since CLI might have issues, use the Railway dashboard:

1. Go to [railway.app](https://railway.app)
2. Open your project
3. Click on your service
4. Go to **Variables** tab
5. Add:
   - `PAYSTACK_SECRET_KEY` = `sk_test_a507c7d09097e2029acf05e80deaa2b5304843ee`
   - `NEXT_PUBLIC_APP_URL` = (will be set after first successful deploy)

## Step 4: Check Common Issues

### Issue: Build Fails

**Check:**
- All dependencies in `package.json`
- TypeScript compiles: `npm run build` (test locally)
- No syntax errors

**Fix:**
```bash
# Test build locally first
npm run build
```

### Issue: Database Errors

**Check:**
- SQLite file permissions
- Database initialization code

**Fix:**
- Railway provides persistent storage
- Make sure database path is writable

### Issue: Port Binding

**Check:**
- Next.js should use `PORT` environment variable
- Railway sets `PORT` automatically

**Fix:**
- Next.js handles this automatically
- No changes needed

## Step 5: Redeploy

After fixing issues:

```bash
npx railway up
```

Or trigger redeploy from Railway dashboard:
- Click on your service
- Click **"Redeploy"**

## Alternative: Use Railway Dashboard

If CLI keeps failing:

1. **Go to Railway Dashboard**
   - Visit [railway.app](https://railway.app)
   - Open your project

2. **Check Build Logs**
   - Click on your service
   - View **"Deployments"** tab
   - Click on failed deployment
   - Read error logs

3. **Fix Based on Logs**
   - Common errors shown in logs
   - Fix code/dependencies
   - Push to GitHub

4. **Redeploy**
   - Railway auto-deploys on GitHub push
   - Or click **"Redeploy"** button

## Quick Debug Commands

```bash
# Test build locally
npm run build

# Check for errors
npm run lint

# View Railway logs
npx railway logs

# Open Railway dashboard
npx railway open
```

## Most Common Fixes

1. **Build fails**: Check build logs, fix TypeScript errors
2. **Missing env vars**: Set in Railway dashboard
3. **Service not linked**: Run `npx railway service` in terminal
4. **Port issues**: Next.js handles automatically

## Need More Help?

- Railway Discord: https://discord.gg/railway
- Railway Docs: https://docs.railway.app
- Check build logs URL for specific errors

