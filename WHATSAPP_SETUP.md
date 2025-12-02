# WhatsApp Integration Setup Guide

Your WhatsApp integration is currently not configured. Follow these steps to enable WhatsApp notifications.

## Option 1: Twilio WhatsApp API (Recommended)

Twilio provides a reliable WhatsApp Business API service.

### Steps:

1. **Sign up for Twilio**
   - Go to https://www.twilio.com/try-twilio
   - Create a free account (includes $15.50 credit)

2. **Set up WhatsApp Sandbox**
   - In Twilio Console, go to Messaging > Try it out > Send a WhatsApp message
   - Follow instructions to join the sandbox (send a code to Twilio's WhatsApp number)
   - Note your WhatsApp number (format: `whatsapp:+14155238886`)

3. **Get your credentials**
   - Account SID: Found in Twilio Console dashboard
   - Auth Token: Found in Twilio Console dashboard (click to reveal)
   - WhatsApp From Number: Your Twilio WhatsApp number

4. **Set environment variables**
   
   For local development, create `.env.local`:
   ```bash
   WHATSAPP_SERVICE=twilio
   TWILIO_ACCOUNT_SID=your_account_sid_here
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
   ```

   For Railway deployment:
   ```bash
   npx railway variables --set "WHATSAPP_SERVICE=twilio"
   npx railway variables --set "TWILIO_ACCOUNT_SID=your_account_sid"
   npx railway variables --set "TWILIO_AUTH_TOKEN=your_auth_token"
   npx railway variables --set "TWILIO_WHATSAPP_FROM=whatsapp:+14155238886"
   ```

5. **Install Twilio package**
   ```bash
   npm install twilio
   ```

6. **Set admin phone number**
   - Go to your admin dashboard
   - The admin phone should be set in the database settings table
   - Or set it via SQL: `UPDATE settings SET value='234XXXXXXXXXX' WHERE key='admin_phone'`
   - Format: 234XXXXXXXXXX (Nigeria country code + phone number without leading 0)

## Option 2: WhatsApp Business API (Meta/Facebook)

For production use with your own WhatsApp Business account.

### Steps:

1. **Set up WhatsApp Business API**
   - Go to https://developers.facebook.com/docs/whatsapp
   - Create a Meta Business account
   - Set up WhatsApp Business API

2. **Get credentials**
   - API URL: `https://graph.facebook.com/v18.0`
   - Access Token: From Meta Business Manager
   - Phone Number ID: Your WhatsApp Business phone number ID

3. **Set environment variables**
   ```bash
   WHATSAPP_SERVICE=whatsapp-api
   WHATSAPP_API_URL=https://graph.facebook.com/v18.0
   WHATSAPP_API_TOKEN=your_access_token
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
   ```

## Option 3: Green API

Alternative WhatsApp API service.

### Steps:

1. **Sign up for Green API**
   - Go to https://green-api.com/
   - Create an account
   - Get your credentials

2. **Set environment variables**
   ```bash
   WHATSAPP_SERVICE=green-api
   GREEN_API_ID_INSTANCE=your_id_instance
   GREEN_API_TOKEN_INSTANCE=your_token_instance
   ```

## Testing

After setting up, test by placing a test order:

1. Go to your site
2. Place a test order with Cash on Delivery
3. Check your WhatsApp for the confirmation message
4. Check admin WhatsApp for the notification

## Troubleshooting

### Messages not sending?

1. **Check environment variables**
   - Make sure all required variables are set
   - For Railway: Check in Railway dashboard > Variables tab

2. **Check admin phone**
   - Verify `admin_phone` is set in database settings
   - Format: 234XXXXXXXXXX (no +, no spaces)

3. **Check logs**
   - Look for WhatsApp errors in console/logs
   - Check Railway deployment logs

4. **Test phone format**
   - Customer phones should be in format: 234XXXXXXXXXX
   - Admin phone should be in format: 234XXXXXXXXXX

### Twilio Sandbox Limitations

- Twilio sandbox only works with pre-approved numbers
- To send to any number, upgrade to production WhatsApp Business API
- Or use Green API or Meta WhatsApp Business API

## Quick Setup (Twilio - Fastest)

```bash
# 1. Install Twilio
npm install twilio

# 2. Set environment variables (create .env.local for local)
WHATSAPP_SERVICE=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# 3. Set admin phone in database (via SQL or admin panel)
# Format: 234XXXXXXXXXX (e.g., 2348123456789)

# 4. Restart your server
npm run dev
```

## Notes

- WhatsApp messages are sent asynchronously and won't fail orders if they fail
- Customer WhatsApp messages are only sent for Cash on Delivery orders
- Online payment orders receive email receipts instead
- Admin receives WhatsApp notification for all orders


