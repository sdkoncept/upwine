# Deploy to Railway (SQLite Compatible)

Railway supports SQLite, so you can deploy without changing your database!

## Quick Steps

1. **Go to Railway**
   - Visit [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `sdkoncept/upwine`

3. **Configure Environment Variables**
   - Click on your project → Variables
   - Add:
     ```
     PAYSTACK_SECRET_KEY=sk_test_xxxxx
     NEXT_PUBLIC_APP_URL=https://your-app.railway.app
     ```
   - Railway will auto-generate a URL after first deploy

4. **Deploy**
   - Railway auto-detects Next.js
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)

5. **Get Your URL**
   - After deployment, Railway provides a URL
   - Update `NEXT_PUBLIC_APP_URL` with the Railway URL
   - Redeploy (or Railway will auto-redeploy)

## Database Persistence

✅ Railway provides persistent storage, so your SQLite database will persist between deployments!

## Custom Domain

1. Go to Settings → Networking
2. Add your custom domain: `upwine.com`
3. Railway will provide DNS instructions
4. SSL is automatic

## Environment Variables Needed

```
PAYSTACK_SECRET_KEY=sk_test_xxxxx (or sk_live_xxxxx for production)
NEXT_PUBLIC_APP_URL=https://your-app.railway.app
```

## Pricing

- **Free tier**: $5 credit/month
- **Hobby plan**: $5/month (if you exceed free tier)
- Perfect for small businesses!

## Why Railway?

✅ Works with SQLite (no migration needed)
✅ Persistent storage
✅ Easy deployment
✅ Automatic HTTPS
✅ Custom domains
✅ No build errors!

