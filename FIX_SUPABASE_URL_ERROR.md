# Fix: "Request cannot be constructed from a URL that includes credentials"

## The Problem

The error occurs because `NEXT_PUBLIC_SUPABASE_URL` in Railway contains credentials in the URL format, which the Fetch API doesn't allow.

**Error message:**
```
Failed to create order: TypeError: Request cannot be constructed from a URL that includes credentials: 
https://trkeicjyippmvfjplgyj:!1JJosephine%401948@aws-1-eu-central-1.supabase.co/rest/v1/orders?select=*
```

## The Solution

### Step 1: Check Current Railway Variables

1. Go to [Railway Dashboard](https://railway.app)
2. Select your project
3. Go to **Variables** tab
4. Find `NEXT_PUBLIC_SUPABASE_URL`

### Step 2: Fix the Variable

**Current (WRONG) format:**
```
https://trkeicjyippmvfjplgyj:password@aws-1-eu-central-1.supabase.co
```

**Correct format:**
```
https://trkeicjyippmvfjplgyj.supabase.co
```

### Step 3: Update in Railway

**Option A: Via Railway Dashboard**
1. Click on `NEXT_PUBLIC_SUPABASE_URL` variable
2. Change the value to: `https://trkeicjyippmvfjplgyj.supabase.co`
3. Click **Save**
4. Railway will automatically redeploy

**Option B: Via Railway CLI**
```bash
npx railway variables --set "NEXT_PUBLIC_SUPABASE_URL=https://trkeicjyippmvfjplgyj.supabase.co"
```

### Step 4: Alternative - Remove the Variable Entirely

The code can automatically construct the correct URL from `DATABASE_URL`, so you can actually **delete** `NEXT_PUBLIC_SUPABASE_URL` if you want:

1. In Railway Dashboard → Variables
2. Find `NEXT_PUBLIC_SUPABASE_URL`
3. Click **Delete**
4. The code will use the project reference from `DATABASE_URL` instead

## How the Code Works Now

The updated code (`lib/supabase.ts`) now:

1. **First**: Tries to extract project reference from `DATABASE_URL`
   - Extracts `trkeicjyippmvfjplgyj` from: `postgresql://postgres.trkeicjyippmvfjplgyj:password@...`
   - Constructs: `https://trkeicjyippmvfjplgyj.supabase.co`

2. **Second**: If that fails, tries to clean `NEXT_PUBLIC_SUPABASE_URL`
   - Removes credentials if present
   - Extracts project reference if needed

3. **Never**: Uses a URL with credentials embedded

## Required Railway Variables

Make sure these are set correctly:

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | `postgresql://postgres.trkeicjyippmvfjplgyj:password@...` | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://trkeicjyippmvfjplgyj.supabase.co` | ⚠️ Optional (code can construct from DATABASE_URL) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | ✅ Yes |

## Verification

After updating:

1. **Wait for Railway to redeploy** (usually 1-2 minutes)
2. **Check Railway logs** for any Supabase connection errors
3. **Test creating an order** - the error should be gone

## Still Getting the Error?

If you're still seeing the error after updating:

1. **Check Railway logs** - Look for `[Supabase]` messages
2. **Verify DATABASE_URL** - Make sure it contains the project reference
3. **Clear Railway cache** - Sometimes a redeploy helps
4. **Check the exact error** - The logs will show which URL is being used

## Quick Fix Command

If you have Railway CLI installed:

```bash
# Remove the incorrect variable (if you want the code to auto-construct)
npx railway variables --unset "NEXT_PUBLIC_SUPABASE_URL"

# OR set it correctly
npx railway variables --set "NEXT_PUBLIC_SUPABASE_URL=https://trkeicjyippmvfjplgyj.supabase.co"
```

Then wait for Railway to redeploy (check the Deployments tab).
