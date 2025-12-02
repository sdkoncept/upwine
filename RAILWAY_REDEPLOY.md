# Redeploy to Railway

## Quick Steps

### Option 1: Auto-Deploy (If Railway is connected to GitHub)

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Railway will automatically deploy** - Check your Railway dashboard for deployment status

### Option 2: Manual Deploy via CLI

```bash
# Make sure you're logged in
npx railway login

# Deploy
npx railway up
```

### Option 3: Manual Redeploy via Dashboard

1. Go to [railway.app](https://railway.app)
2. Open your project
3. Click on your service
4. Click **"Redeploy"** button

## Important: Set Admin Password

Before deploying, make sure to set the admin password:

1. **In Railway Dashboard:**
   - Go to your service
   - Click **Variables** tab
   - Add: `ADMIN_PASSWORD` = `your_secure_password`
   - Save

2. **Or via CLI:**
   ```bash
   npx railway variables --set "ADMIN_PASSWORD=your_secure_password"
   ```

## After Deployment

1. Visit your Railway URL: `https://your-app.railway.app/admin/login`
2. Login with your password
3. Test the new features!

## What Changed

✅ Admin page now requires authentication
✅ Login page at `/admin/login`
✅ Detailed order view modal
✅ All order information displayed
✅ Logout functionality

