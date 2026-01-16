# How to Update Admin Phone Number

The admin phone number is currently showing `2347061350647` (the old number). Here's how to update it:

## Method 1: Via Admin Dashboard (Recommended) ✅

1. **Go to Admin Dashboard**
   - Local: http://localhost:3000/admin
   - Railway: https://upwine-production.up.railway.app/admin

2. **Log in** with your admin password

3. **Go to Settings Tab**
   - Click on the "Settings" tab in the admin dashboard

4. **Find "Admin Phone" Field**
   - You'll see a field labeled "Admin Phone (for WhatsApp notifications)"
   - Currently showing: `2347061350647`

5. **Update the Number**
   - Delete the old number
   - Enter your new phone number in format: `234XXXXXXXXXX` (without +, without spaces)
   - Example: If your number is `08123456789`, enter `2348123456789`

6. **Click "Save Settings" Button**
   - The button is at the bottom of the settings form
   - Wait for success message

7. **Refresh the Page**
   - The new number should now be displayed

## Method 2: Via Supabase SQL Editor

If you prefer to update directly in the database:

1. **Go to Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run Update Query**

   To change to a new number:
   ```sql
   UPDATE settings 
   SET value = '2348123456789' 
   WHERE key = 'admin_phone';
   ```
   
   Replace `2348123456789` with your actual phone number.

   To clear/remove the number:
   ```sql
   UPDATE settings 
   SET value = '' 
   WHERE key = 'admin_phone';
   ```

4. **Verify**
   ```sql
   SELECT value FROM settings WHERE key = 'admin_phone';
   ```

## Phone Number Format Rules

- ✅ **Correct**: `2348123456789` (country code + number, no +, no spaces)
- ❌ **Wrong**: `08123456789` (missing country code)
- ❌ **Wrong**: `+2348123456789` (has + sign)
- ❌ **Wrong**: `234 812 345 6789` (has spaces)

**Conversion Examples:**
- `08123456789` → `2348123456789`
- `07061350647` → `2347061350647`
- `08012345678` → `2348012345678`

## Important Notes

- The admin phone number is used to send WhatsApp notifications when orders are placed
- Make sure your WhatsApp service (Twilio) is configured if you want to receive notifications
- The number must be added to Twilio sandbox if using Twilio (for testing)
- After updating, the change takes effect immediately for new orders
