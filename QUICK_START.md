# Quick Start Guide - Supabase Setup

## ⚠️ IMPORTANT: Required Environment Variables

Your app needs these environment variables to work with Supabase:

### 1. Get Your Supabase Credentials

1. Go to https://supabase.com/dashboard
2. Select your project (or create one)
3. Go to **Settings** → **API**
4. Copy these values:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **service_role key**: (under "Project API keys" section)

5. Go to **Settings** → **Database**
6. Copy the **Connection string** (Connection pooling mode)

### 2. Add to `.env.local`

Create or update `.env.local` in your project root:

```env
# Required: Supabase REST API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Required: Database connection
DATABASE_URL=postgresql://postgres.xxxxxxxxxxxxx:password@aws-1-region.pooler.supabase.com:6543/postgres

# Other existing variables
PAYSTACK_SECRET_KEY=your_paystack_key
ADMIN_PASSWORD=your_admin_password
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run the SQL Migration

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy and paste the entire contents of `supabase-migration.sql`
4. Click **Run** (or press Ctrl+Enter)
5. Verify tables were created (should see success message)

### 4. Restart Your Dev Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### 5. Test

- Visit http://localhost:3000
- Try creating an order
- Check admin dashboard
- Verify data appears in Supabase dashboard → Table Editor

## Troubleshooting

**Error: "Supabase not configured"**
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Restart your dev server after adding/updating `.env.local`

**Error: "relation does not exist"**
- Run the SQL migration script in Supabase SQL Editor
- Check that all tables were created (orders, stock, settings, invoices, discount_codes)

**Error: "authentication failed"**
- Verify your DATABASE_URL connection string is correct
- Check that your Supabase project is active (not paused)
