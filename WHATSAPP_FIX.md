# WhatsApp Not Working - Quick Fix

## ✅ What's Already Configured:
- Admin phone: `2347061350647` ✅
- Twilio credentials in `.env.local` ✅

## 🔧 Fix Steps:

### Step 1: Restart Your Dev Server

**Important:** Next.js only loads `.env.local` when the server starts!

1. Stop your dev server (press `Ctrl+C`)
2. Start it again:
   ```bash
   npm run dev
   ```

### Step 2: Check Twilio Sandbox

Your phone number (`2347061350647`) must be added to Twilio sandbox:

1. Go to https://console.twilio.com/
2. Navigate to: **Messaging** > **Try it out** > **Send a WhatsApp message**
3. You'll see a code like: `join <code-word>`
4. Send that code to Twilio's WhatsApp number: `+1 415 523 8886`
5. You should get a confirmation message

**Without this step, Twilio won't send messages to your number!**

### Step 3: Test It

1. Place a test order with **Cash on Delivery**
2. Check your server console for logs
3. Look for: `WhatsApp message sent via Twilio to +2347061350647`
4. Check your WhatsApp

### Step 4: Check Server Logs

When you place an order, look for these in your console:

**✅ Success:**
```
WhatsApp message sent via Twilio to +2347061350647
```

**❌ Error (credentials missing):**
```
Twilio credentials not configured. Set TWILIO_ACCOUNT_SID...
```

**❌ Error (phone not in sandbox):**
```
Twilio API error: Unable to create record: The number +2347061350647 is not a valid WhatsApp-enabled number
```

### Step 5: For Railway Deployment

If you're deployed on Railway, set environment variables there:

```bash
npx railway variables --set "WHATSAPP_SERVICE=twilio"
npx railway variables --set "TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID"
npx railway variables --set "TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN"
npx railway variables --set "TWILIO_WHATSAPP_FROM=whatsapp:+14155238886"
```

**Note:** Replace `YOUR_TWILIO_ACCOUNT_SID` and `YOUR_TWILIO_AUTH_TOKEN` with your actual Twilio credentials from your Twilio Console.

Then redeploy:
```bash
git push origin main
```

## Common Issues:

### Issue 1: "Phone number not in sandbox"
- **Fix:** Add your number to Twilio sandbox (Step 2 above)

### Issue 2: Environment variables not loading
- **Fix:** Restart dev server (Step 1 above)

### Issue 3: Messages logged but not sent
- **Check:** Server console for Twilio API errors
- **Common:** Wrong phone format or sandbox issue

### Issue 4: Works locally but not on Railway
- **Fix:** Set environment variables in Railway dashboard

## Still Not Working?

1. **Check Twilio Console Logs:**
   - Go to https://console.twilio.com/
   - Navigate to **Monitor** > **Logs** > **Messaging**
   - Look for failed message attempts

2. **Verify Phone Format:**
   - Admin phone should be: `2347061350647` (no +, no spaces)
   - Twilio will format it as: `+2347061350647`

3. **Test Twilio Directly:**
   - Use Twilio Console to send a test message
   - If that works, the issue is in the code
   - If that fails, it's a Twilio configuration issue

## Quick Test Command:

After restarting your server, place a test order and watch the console. You should see WhatsApp logs.


