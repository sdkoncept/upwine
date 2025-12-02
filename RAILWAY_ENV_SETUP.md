# Railway Environment Variables Setup

## Required Environment Variables

Your app needs these environment variables to work properly:

### 1. Paystack Secret Key (REQUIRED for payments)

**Variable Name:** `PAYSTACK_SECRET_KEY`

**How to Set:**

**Option A: Via Railway Dashboard**
1. Go to [railway.app](https://railway.app)
2. Open your project
3. Click on your service
4. Go to **Variables** tab
5. Click **"New Variable"**
6. Name: `PAYSTACK_SECRET_KEY`
7. Value: `sk_test_a507c7d09097e2029acf05e80deaa2b5304843ee` (your test key)
8. Click **"Add"**

**Option B: Via Railway CLI**
```bash
npx railway variables --set "PAYSTACK_SECRET_KEY=sk_test_a507c7d09097e2029acf05e80deaa2b5304843ee"
```

### 2. App URL (REQUIRED for payment callbacks)

**Variable Name:** `NEXT_PUBLIC_APP_URL`

**How to Set:**

1. Get your Railway URL (e.g., `https://upwine-production.up.railway.app`)
2. Set it in Railway Variables:
   - Name: `NEXT_PUBLIC_APP_URL`
   - Value: `https://upwine-production.up.railway.app`

**Via CLI:**
```bash
npx railway variables --set "NEXT_PUBLIC_APP_URL=https://upwine-production.up.railway.app"
```

### 3. Admin Password (Optional but Recommended)

**Variable Name:** `ADMIN_PASSWORD`

**Default:** `upwine2024` (if not set)

**How to Set:**

**Via Dashboard:**
- Name: `ADMIN_PASSWORD`
- Value: `your_secure_password`

**Via CLI:**
```bash
npx railway variables --set "ADMIN_PASSWORD=your_secure_password"
```

## Complete Setup Checklist

- [ ] `PAYSTACK_SECRET_KEY` - Set to your Paystack test/live key
- [ ] `NEXT_PUBLIC_APP_URL` - Set to your Railway URL
- [ ] `ADMIN_PASSWORD` - Set a secure password (optional)

## After Setting Variables

1. **Redeploy** (Railway will auto-redeploy when you add variables)
   - Or click **"Redeploy"** in Railway dashboard
   - Or run: `npx railway up`

2. **Test Payment**
   - Try placing an order with online payment
   - Should redirect to Paystack payment page

3. **Test Admin Login**
   - Go to `/admin/login`
   - Login with your password

## Troubleshooting

**"Paystack secret key not configured"**
- ✅ Make sure `PAYSTACK_SECRET_KEY` is set in Railway
- ✅ Check spelling (case-sensitive)
- ✅ Redeploy after adding variable

**Payment callback not working**
- ✅ Make sure `NEXT_PUBLIC_APP_URL` is set correctly
- ✅ Should be your Railway URL (with https://)
- ✅ No trailing slash

**Admin login not working**
- ✅ Check `ADMIN_PASSWORD` is set (or use default: `upwine2024`)
- ✅ Make sure you're using the correct password

## Quick Setup Commands

```bash
# Set all required variables at once
npx railway variables --set "PAYSTACK_SECRET_KEY=sk_test_a507c7d09097e2029acf05e80deaa2b5304843ee" \
  --set "NEXT_PUBLIC_APP_URL=https://upwine-production.up.railway.app" \
  --set "ADMIN_PASSWORD=your_secure_password"

# Redeploy
npx railway up
```

## Production vs Test Keys

**Test Environment:**
- Use: `sk_test_...` keys
- For testing payments

**Production:**
- Use: `sk_live_...` keys
- For real payments
- Get from Paystack Dashboard → Settings → API Keys & Webhooks


