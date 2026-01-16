# Update Paystack to Live Keys in Railway

## Current Issue
The payment gateway is still showing test mode because Railway environment variables haven't been updated with the live keys.

## Your Live Keys

⚠️ **IMPORTANT**: Your live keys are stored in `PAYSTACK_KEYS_PRIVATE.txt` (local file, not committed to Git)

**Secret Key (Server-side):**
- Check `PAYSTACK_KEYS_PRIVATE.txt` for your live secret key
- Format: `sk_live_xxxxxxxxxxxxx`

**Public Key (Client-side - Not currently used):**
- Check `PAYSTACK_KEYS_PRIVATE.txt` for your live public key
- Format: `pk_live_xxxxxxxxxxxxx`

## Steps to Update Railway

### Method 1: Via Railway Dashboard (Recommended)

1. **Go to Railway Dashboard**
   - Visit https://railway.app
   - Log in to your account
   - Select your project: **upwine**

2. **Navigate to Variables**
   - Click on your project
   - Go to the **Variables** tab (or **Settings** → **Variables**)

3. **Find and Update PAYSTACK_SECRET_KEY**
   - Look for the variable: `PAYSTACK_SECRET_KEY`
   - Click on it to edit
   - **Current value (test):** `sk_test_a507c7d09097e2029acf05e80deaa2b5304843ee`
   - **New value (live):** Check `PAYSTACK_KEYS_PRIVATE.txt` for your live secret key (starts with `sk_live_`)
   - Click **Save** or **Update**

4. **Verify NEXT_PUBLIC_APP_URL is Set**
   - Make sure this variable exists:
   - **Variable:** `NEXT_PUBLIC_APP_URL`
   - **Value:** `https://upwine-production.up.railway.app`
   - If it doesn't exist, add it

5. **Wait for Redeploy**
   - Railway will automatically redeploy when you save variables
   - Check the **Deployments** tab to see the new deployment
   - Wait 1-2 minutes for deployment to complete

### Method 2: Via Railway CLI

If you have Railway CLI installed:

```bash
# Update Paystack secret key to live (replace with your actual live key from PAYSTACK_KEYS_PRIVATE.txt)
npx railway variables --set "PAYSTACK_SECRET_KEY=sk_live_YOUR_ACTUAL_KEY_HERE"

# Ensure NEXT_PUBLIC_APP_URL is set
npx railway variables --set "NEXT_PUBLIC_APP_URL=https://upwine-production.up.railway.app"
```

**Note**: Replace `sk_live_YOUR_ACTUAL_KEY_HERE` with your actual live secret key. Check `PAYSTACK_KEYS_PRIVATE.txt` file for the correct key.

## Verify the Update

After Railway redeploys:

1. **Check Railway Logs**
   - Go to Railway Dashboard → Your Project → **Deployments**
   - Click on the latest deployment
   - Check logs for any errors

2. **Test Payment Flow**
   - Go to your site: https://upwine-production.up.railway.app
   - Try placing a test order with online payment
   - You should now see **live Paystack payment page** (not test mode)

3. **Check Paystack Dashboard**
   - Go to https://dashboard.paystack.com
   - Check **Transactions** - new transactions should appear as live transactions

## Important Notes

⚠️ **Never commit live keys to Git** - They're only in environment variables

⚠️ **Test with small amounts first** - Verify everything works before processing large orders

⚠️ **Keep test keys for development** - Use test keys locally, live keys only in production

## Current Railway Variables Checklist

Make sure these are set correctly:

| Variable | Current Value | Should Be |
|----------|---------------|-----------|
| `PAYSTACK_SECRET_KEY` | `sk_test_...` ❌ | `sk_live_...` (check PAYSTACK_KEYS_PRIVATE.txt) ✅ |
| `NEXT_PUBLIC_APP_URL` | (check) | `https://upwine-production.up.railway.app` ✅ |
| `DATABASE_URL` | (should be set) | Your Supabase connection string ✅ |
| `NEXT_PUBLIC_SUPABASE_URL` | (optional) | `https://trkeicjyippmvfjplgyj.supabase.co` ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | (should be set) | Your service role key ✅ |

## Troubleshooting

**Still showing test mode?**
- Wait 2-3 minutes for Railway to fully redeploy
- Clear your browser cache
- Check Railway logs for any errors
- Verify the variable was saved correctly in Railway dashboard

**Payment not working?**
- Check Railway logs for errors
- Verify `NEXT_PUBLIC_APP_URL` is set correctly
- Make sure Paystack callback URL is configured: `https://upwine-production.up.railway.app/payment/callback`

## After Update

Once live keys are active:
1. ✅ Test with a small real payment
2. ✅ Verify receipt sending works
3. ✅ Check admin notifications
4. ✅ Set up Paystack webhook (optional but recommended)
   - URL: `https://upwine-production.up.railway.app/api/payment/webhook`
   - See `PAYSTACK_LIVE_SETUP.md` for details
