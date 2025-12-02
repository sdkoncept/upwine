# Quick Deployment Guide

## ⚠️ IMPORTANT: Vercel Build Error Fix

**If you're seeing `better-sqlite3` compilation errors on Vercel**, this is because SQLite doesn't work on Vercel's serverless environment.

**✅ SOLUTION: Use Railway instead!** (See below)

---

## 🚀 Fastest Way: Deploy to Railway (Keeps SQLite)

Railway supports persistent storage, so you can use SQLite as-is!

### Steps:

1. **Push to GitHub** (if not already)
   ```bash
   git push -u origin main
   ```

2. **Go to Railway**
   - Visit [railway.app](https://railway.app)
   - Sign up with GitHub
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `sdkoncept/upwine`

3. **Add Environment Variables**
   - Click on your project → Variables
   - Add:
     ```
     PAYSTACK_SECRET_KEY=sk_test_xxxxx
     NEXT_PUBLIC_APP_URL=https://your-app.railway.app
     ```

4. **Deploy**
   - Railway auto-detects Next.js
   - Click "Deploy"
   - Wait for build to complete

5. **Get Your URL**
   - Railway provides a URL like: `https://upwine-production.up.railway.app`
   - Update `NEXT_PUBLIC_APP_URL` with this URL
   - Redeploy

✅ **Done!** Your app is live with SQLite database.

---

## 🌐 Alternative: Deploy to Vercel (Requires Database Migration)

### Before Deploying:

⚠️ **You MUST migrate from SQLite to Postgres/Supabase first!**

### Steps:

1. **Migrate Database** (see `SUPABASE_OPTION.md`)

2. **Push to GitHub**
   ```bash
   git push -u origin main
   ```

3. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub
   - Click "Add New Project"
   - Import `sdkoncept/upwine`
   - Click "Deploy"

4. **Add Environment Variables**
   - Project Settings → Environment Variables
   - Add Paystack keys and database connection

5. **Redeploy**

---

## 📋 Environment Variables Checklist

For Railway:
```
PAYSTACK_SECRET_KEY=sk_test_xxxxx (or sk_live_xxxxx for production)
NEXT_PUBLIC_APP_URL=https://your-app.railway.app
```

For Vercel (after migration):
```
PAYSTACK_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
POSTGRES_URL=postgresql://... (or Supabase URL)
```

---

## 🎯 Recommended: Railway

**Why Railway?**
- ✅ Works with SQLite (no migration needed)
- ✅ Persistent storage
- ✅ Easy deployment
- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ Custom domains

**Why Vercel?**
- ✅ Great for Next.js
- ✅ Edge functions
- ✅ Fast CDN
- ❌ Requires database migration
- ❌ No persistent file storage

---

## 🚨 Important Notes

1. **Database**: Railway keeps SQLite, Vercel needs migration
2. **Paystack**: Use test keys first, then switch to live
3. **WhatsApp**: Configure API keys in environment variables
4. **Domain**: Both platforms support custom domains

---

## 📞 Need Help?

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Check `VERCEL_DEPLOYMENT.md` for detailed Vercel guide

