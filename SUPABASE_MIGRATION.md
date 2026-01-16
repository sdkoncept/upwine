# Supabase Migration Guide

This guide will help you migrate from JSON file-based storage to Supabase PostgreSQL.

## Prerequisites

1. A Supabase account and project
2. Your Supabase project URL and service role key (or anon key)
3. Your Supabase database connection string (DATABASE_URL)

## Environment Variables

Add the following to your `.env.local` file:

```env
# Supabase Database Connection (Required)
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-1-[region].pooler.supabase.com:6543/postgres

# Supabase REST API (Required for Supabase client)
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# OR use anon key (less secure, but works):
# SUPABASE_ANON_KEY=your_anon_key
```

### How to Get Your Supabase Credentials

1. **Project URL (NEXT_PUBLIC_SUPABASE_URL)**:
   - Go to your Supabase project dashboard
   - Navigate to Settings → API
   - Copy the "Project URL" (e.g., `https://xxxxxxxxxxxxx.supabase.co`)

2. **Service Role Key (SUPABASE_SERVICE_ROLE_KEY)** (Recommended):
   - Go to Settings → API
   - Under "Project API keys", copy the "service_role" key (keep this secret!)
   - ⚠️ **Important**: Never expose this key in client-side code

3. **Anon Key (SUPABASE_ANON_KEY)** (Alternative):
   - Go to Settings → API
   - Under "Project API keys", copy the "anon" key
   - Less secure but can be used if service_role is not available

4. **DATABASE_URL**:
   - Go to Settings → Database
   - Under "Connection string", select "Connection pooling"
   - Copy the connection string (starts with `postgresql://`)

## Migration Steps

### 1. Run the SQL Migration Script

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase-migration.sql`
4. Run the script

This will create all necessary tables:
- `orders` - Customer orders
- `stock` - Weekly stock management
- `settings` - Application settings
- `invoices` - Manual invoices
- `discount_codes` - Discount/promotion codes

### 2. Verify Tables

After running the migration, verify that all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
```

You should see:
- orders
- stock
- settings
- invoices
- discount_codes

### 3. Check Default Settings

The migration script inserts default settings. Verify they exist:

```sql
SELECT * FROM settings;
```

### 4. Test the Application

1. Start your development server: `npm run dev`
2. Test creating an order
3. Test admin functions
4. Verify data is being saved to Supabase (check Supabase dashboard)

## Data Migration (Optional)

If you have existing data in `upwine-data.json`, you can migrate it:

1. Export your JSON data
2. Use the Supabase dashboard or a script to import:
   - Orders → `orders` table
   - Stock → `stock` table
   - Settings → `settings` table
   - Invoices → `invoices` table
   - Discount Codes → `discount_codes` table

## Troubleshooting

### Connection Issues

- Verify your `DATABASE_URL` is correct
- Check that your Supabase project is active
- Ensure your IP is allowed (if using IP restrictions)

### Missing Tables

- Re-run the migration script
- Check for errors in the SQL Editor

### Environment Variables Not Loading

- Restart your development server after adding `.env.local`
- Verify the file is in the project root
- Check that variable names match exactly

## Rollback

If you need to rollback to JSON storage:

1. Revert `lib/db.ts` to the previous version
2. Remove Supabase dependencies: `npm uninstall @supabase/supabase-js pg @types/pg`
3. Your `upwine-data.json` file will be used again

## Notes

- The migration script includes indexes for better query performance
- Triggers automatically update `updated_at` timestamps
- All functions in `lib/db.ts` are now async and must be awaited
- API routes have been updated to handle async operations
