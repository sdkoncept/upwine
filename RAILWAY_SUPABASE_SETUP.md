# Railway Supabase Setup Guide

## ⚠️ IMPORTANT: Set These Environment Variables in Railway

Your Railway deployment needs these Supabase environment variables to work.

## Method 1: Via Railway Dashboard (Recommended)

1. Go to https://railway.app
2. Open your project
3. Click on your service (upwine-production)
4. Go to **Variables** tab
5. Click **"New Variable"** and add each of these:

### Required Variables:

```
Variable Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://trkeicjyippmvfjplgyj.supabase.co
```

```
Variable Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRya2VpY2p5aXBwbXZmanBsZ3lqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzIwODc0OSwiZXhwIjoyMDgyNzg0NzQ5fQ._IMfzVDscS0eVys9rxwJ0wGeEKVtjAGJmT1GEuqB4o4
```

```
Variable Name: DATABASE_URL
Value: postgresql://postgres.trkeicjyippmvfjplgyj:!1JJosephine@1948@aws-1-eu-central-1.pooler.supabase.com:6543/postgres
```

```
Variable Name: NEXT_PUBLIC_APP_URL
Value: https://upwine-production.up.railway.app
```

```
Variable Name: ADMIN_PASSWORD
Value: upwyne2024
```

```
Variable Name: PAYSTACK_SECRET_KEY
Value: sk_test_a507c7d09097e2029acf05e80deaa2b5304843ee
```

## Method 2: Via Railway CLI

If you have Railway CLI installed, run these commands:

```bash
npx railway variables --set "NEXT_PUBLIC_SUPABASE_URL=https://trkeicjyippmvfjplgyj.supabase.co"
npx railway variables --set "SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRya2VpY2p5aXBwbXZmanBsZ3lqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzIwODc0OSwiZXhwIjoyMDgyNzg0NzQ5fQ._IMfzVDscS0eVys9rxwJ0wGeEKVtjAGJmT1GEuqB4o4"
npx railway variables --set "DATABASE_URL=postgresql://postgres.trkeicjyippmvfjplgyj:!1JJosephine@1948@aws-1-eu-central-1.pooler.supabase.com:6543/postgres"
npx railway variables --set "NEXT_PUBLIC_APP_URL=https://upwine-production.up.railway.app"
npx railway variables --set "ADMIN_PASSWORD=upwyne2024"
npx railway variables --set "PAYSTACK_SECRET_KEY=sk_test_a507c7d09097e2029acf05e80deaa2b5304843ee"
```

## ⚠️ CRITICAL: Run SQL Migration

Before the app will work, you MUST run the SQL migration in Supabase:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New query**
5. Copy the entire contents of `supabase-migration.sql`
6. Paste into the SQL editor
7. Click **Run** (or press Ctrl+Enter)
8. Wait for success message

This creates all the necessary tables (orders, stock, settings, invoices, discount_codes).

## After Setting Variables

1. **Railway will auto-redeploy** when you add variables
2. Wait for deployment to complete (1-2 minutes)
3. Visit https://upwine-production.up.railway.app/admin
4. The page should load correctly

## Verify Setup

After deployment, check:

1. ✅ Admin page loads (no "Checking authentication..." stuck)
2. ✅ Can view orders/stock/sales
3. ✅ Can create new orders
4. ✅ Data appears in Supabase dashboard → Table Editor

## Troubleshooting

**Still seeing "Checking authentication..."**
- Wait 1-2 minutes after adding variables for redeploy
- Check Railway logs for errors
- Verify all variables are set correctly

**Database errors**
- Make sure SQL migration was run in Supabase
- Check Supabase dashboard → Table Editor to verify tables exist

**Connection errors**
- Verify DATABASE_URL is correct (check for special characters in password)
- Check Supabase project is active (not paused)
