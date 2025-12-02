# Deploying Upwine.com to Vercel

## 🚨 CRITICAL: SQLite Will NOT Work on Vercel!

**Your build will FAIL with `better-sqlite3` compilation errors!**

The error you're seeing (`C++20 or later required`, `better-sqlite3` build failures) happens because:
- Vercel uses Node.js v24+ which requires C++20
- `better-sqlite3` needs native compilation
- Vercel's serverless environment doesn't support persistent file storage

**SOLUTION: Use Railway instead!** See `RAILWAY_DEPLOYMENT.md` for easy deployment.

---

## ⚠️ If You Still Want Vercel (Requires Database Migration)

**SQLite (better-sqlite3) does NOT work on Vercel's serverless functions!**

Vercel uses serverless functions that are stateless, so file-based databases like SQLite won't persist. You have two options:

### Option 1: Use Supabase/PostgreSQL (Recommended)
- Migrate to Supabase (see `SUPABASE_OPTION.md`)
- Works perfectly with Vercel
- Free tier available

### Option 2: Use Vercel Postgres
- Vercel's built-in PostgreSQL
- Easy integration
- Free tier available

### Option 3: Use a different hosting platform
- Railway, Render, or DigitalOcean
- Support persistent file storage
- Can use SQLite as-is

**For now, I'll show you how to deploy to Vercel, but you'll need to migrate the database first.**

## Prerequisites

1. ✅ Code pushed to GitHub (you're working on this)
2. ✅ Vercel account (free)
3. ⚠️ Database migration (required before deployment)

## Step 1: Push Code to GitHub

First, make sure your code is on GitHub:

```bash
# If not already pushed
git push -u origin main
```

## Step 2: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Sign in with GitHub (recommended)

## Step 3: Deploy from GitHub

1. In Vercel dashboard, click **"Add New Project"**
2. Import your GitHub repository: `sdkoncept/upwine`
3. Vercel will auto-detect Next.js settings
4. Click **"Deploy"**

## Step 4: Configure Environment Variables

Before deployment completes, add environment variables:

1. In project settings → **Environment Variables**
2. Add these variables:

```
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

3. Click **"Save"**

## Step 5: Database Migration (REQUIRED)

### Quick Migration to Vercel Postgres

1. In Vercel project → **Storage** tab
2. Click **"Create Database"** → **"Postgres"**
3. Copy connection string
4. Update your code to use Postgres instead of SQLite

### Or Use Supabase

See `SUPABASE_OPTION.md` for migration guide.

## Step 6: Redeploy

After adding environment variables and migrating database:

1. Go to **Deployments** tab
2. Click **"Redeploy"** on latest deployment
3. Or push a new commit to trigger auto-deploy

## Step 7: Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your domain: `upwine.com`
3. Follow DNS configuration instructions
4. Vercel will handle SSL automatically

## Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrated (Postgres/Supabase)
- [ ] Paystack keys updated (use live keys for production)
- [ ] Test order placement
- [ ] Test payment flow
- [ ] Verify WhatsApp notifications
- [ ] Check admin dashboard
- [ ] Test stock management

## Environment Variables Needed

```
# Paystack (Production)
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxx

# App URL
NEXT_PUBLIC_APP_URL=https://upwine.com

# Database (if using Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# Or Vercel Postgres
POSTGRES_URL=postgresql://...
```

## Troubleshooting

### "Module not found" errors
- Make sure all dependencies are in `package.json`
- Check `node_modules` is in `.gitignore`

### Database connection errors
- Verify connection string is correct
- Check environment variables are set
- Ensure database is accessible from Vercel

### Build errors
- Check build logs in Vercel dashboard
- Ensure TypeScript compiles without errors
- Verify all imports are correct

### Payment not working
- Check Paystack keys are correct
- Verify callback URL is set correctly
- Check environment variables

## Quick Deploy Commands

```bash
# Install Vercel CLI (optional)
npm i -g vercel

# Deploy from command line
vercel

# Deploy to production
vercel --prod
```

## Alternative: Deploy to Railway/Render

If you want to keep SQLite:

### Railway
1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select your repo
4. Add environment variables
5. Deploy!

### Render
1. Go to [render.com](https://render.com)
2. New Web Service
3. Connect GitHub repo
4. Configure build: `npm install && npm run build`
5. Start command: `npm start`
6. Add environment variables
7. Deploy!

## Next Steps After Deployment

1. **Update Paystack Webhook URL**
   - Go to Paystack Dashboard
   - Set webhook URL: `https://your-domain.com/api/payment/webhook`

2. **Test Everything**
   - Place a test order
   - Test payment flow
   - Verify receipts are sent
   - Check admin dashboard

3. **Monitor**
   - Check Vercel analytics
   - Monitor error logs
   - Set up alerts

## Support

- Vercel Docs: https://vercel.com/docs
- Vercel Support: support@vercel.com
- Next.js Deployment: https://nextjs.org/docs/deployment

