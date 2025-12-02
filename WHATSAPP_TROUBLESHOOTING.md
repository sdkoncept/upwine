# WhatsApp Troubleshooting Guide

## Issue Found: WhatsApp Service Not Configured

Your admin phone is set correctly (`2347061350647` ✅), but the WhatsApp service environment variables are missing.

## Quick Fix

### For Local Development:

1. **Create or edit `.env.local` file** in your project root:

```bash
# Add these lines:
WHATSAPP_SERVICE=twilio
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

2. **Get your Twilio credentials:**
   - Go to https://console.twilio.com/
   - Find your Account SID (starts with `AC`)
   - Find your Auth Token (click to reveal)
   - Get your WhatsApp number from Messaging > Try it out > Send a WhatsApp message

3. **Restart your dev server:**
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

### For Railway Deployment:

Run these commands:

```bash
npx railway variables --set "WHATSAPP_SERVICE=twilio"
npx railway variables --set "TWILIO_ACCOUNT_SID=your_account_sid"
npx railway variables --set "TWILIO_AUTH_TOKEN=your_auth_token"
npx railway variables --set "TWILIO_WHATSAPP_FROM=whatsapp:+14155238886"
```

Then redeploy:
```bash
git add .
git commit -m "Configure WhatsApp"
git push origin main
```

## Verify Configuration

Run the diagnostic script:

```bash
node scripts/check-whatsapp-config.js
```

You should see all ✅ green checkmarks.

## Common Issues

### 1. "Twilio credentials not configured"
- **Fix:** Make sure all 3 Twilio variables are set in `.env.local` or Railway

### 2. "Phone number not in sandbox"
- **Fix:** Add your phone number to Twilio sandbox:
  - Go to Twilio Console > Messaging > Try it out
  - Send the code to Twilio's WhatsApp number
  - Your number will be added to sandbox

### 3. Messages logged but not sent
- **Check:** Look at server logs/console for errors
- **Common:** Missing credentials or wrong phone format

### 4. Admin phone not receiving messages
- **Check:** Run `node scripts/check-whatsapp-config.js`
- **Verify:** Admin phone format is `234XXXXXXXXXX` (no +, no spaces)

## Testing

After configuring:

1. Place a test order with Cash on Delivery
2. Check server console for WhatsApp logs
3. Check your WhatsApp for the message

## Still Not Working?

1. **Check server logs** for WhatsApp errors
2. **Verify Twilio sandbox** is set up correctly
3. **Test Twilio directly** using their console
4. **Check phone format** - must be `234XXXXXXXXXX`

## Need Help?

Check:
- `WHATSAPP_SETUP.md` - Full setup guide
- `ADMIN_PHONE_SETUP.md` - Admin phone setup
- Twilio Console logs for API errors

