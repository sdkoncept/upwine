# How to Check Admin Phone Number

## Current Status

Based on your migration files, the admin phone number is stored in the Supabase `settings` table.

## Method 1: Check via Admin Dashboard (Easiest)

1. Go to your admin dashboard: https://upwine-production.up.railway.app/admin (or localhost:3000/admin)
2. Log in with your admin password
3. Go to the **Settings** tab
4. Look for **"Admin Phone"** field
5. The current value will be displayed there

## Method 2: Check via Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Table Editor** (left sidebar)
4. Select the **settings** table
5. Find the row where `key = 'admin_phone'`
6. Check the `value` column

## Method 3: Query via SQL Editor

1. Go to Supabase dashboard → **SQL Editor**
2. Run this query:

```sql
SELECT value FROM settings WHERE key = 'admin_phone';
```

## Previously Configured Number

According to your previous configuration files, the admin phone was set to:
- **2347061350647**

However, after migration to Supabase, it may have been reset to empty (`''`).

## To Update the Admin Phone

### Via Admin Dashboard:
1. Go to Admin Dashboard → Settings tab
2. Enter your phone number in format: `234XXXXXXXXXX`
3. Click Save

### Via SQL:
```sql
UPDATE settings SET value = '2347061350647' WHERE key = 'admin_phone';
```

Replace `2347061350647` with your actual phone number.

## Phone Number Format

- ✅ Correct: `2347061350647` (country code + number, no +, no spaces)
- ❌ Wrong: `07061350647` (missing country code)
- ❌ Wrong: `+2347061350647` (has + sign)
- ❌ Wrong: `234 706 135 0647` (has spaces)
