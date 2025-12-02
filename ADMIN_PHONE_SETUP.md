# How to Set Admin Phone Number

The admin phone number is used to send WhatsApp notifications when orders are placed. Here are **3 easy ways** to set it:

## Method 1: Using the Script (Easiest) ⭐

Use the provided script:

```bash
node scripts/set-admin-phone.js 2348123456789
```

**Format:** `234XXXXXXXXXX` (Nigeria country code + phone number without leading 0)

**Example:**
- If your phone is: `08123456789`
- Use: `2348123456789`

## Method 2: Using SQLite Directly

If you have SQLite installed:

```bash
sqlite3 upwine.db "UPDATE settings SET value='2348123456789' WHERE key='admin_phone';"
```

Or open the database interactively:

```bash
sqlite3 upwine.db
```

Then run:
```sql
UPDATE settings SET value='2348123456789' WHERE key='admin_phone';
SELECT * FROM settings WHERE key='admin_phone';
.quit
```

## Method 3: Using the API Endpoint

You can use curl or any HTTP client:

```bash
# First, make sure you're logged into admin panel
# Then use the API:

curl -X PATCH http://localhost:3000/api/admin/settings \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_authenticated=true" \
  -d '{"key": "admin_phone", "value": "2348123456789"}'
```

Or from your browser console (while logged into admin):

```javascript
fetch('/api/admin/settings', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: 'admin_phone', value: '2348123456789' })
})
.then(r => r.json())
.then(console.log)
```

## Phone Number Format

**Important:** The phone number must be in this format:
- ✅ Correct: `2348123456789` (country code + number without leading 0)
- ❌ Wrong: `08123456789` (missing country code)
- ❌ Wrong: `+2348123456789` (has + sign)
- ❌ Wrong: `234 812 345 6789` (has spaces)

**Conversion guide:**
- If your number is: `08123456789` → Use: `2348123456789`
- If your number is: `08012345678` → Use: `2348012345678`
- If your number is: `07012345678` → Use: `2347012345678`

## Verify It's Set

Check if the admin phone is set:

**Using SQLite:**
```bash
sqlite3 upwine.db "SELECT * FROM settings WHERE key='admin_phone';"
```

**Using the script:**
The script will confirm when it's set successfully.

**Using the API:**
```bash
curl http://localhost:3000/api/admin/settings?key=admin_phone
```

## For Railway Deployment

If you're deployed on Railway, you'll need to:

1. **SSH into Railway** (if available), OR
2. **Use Railway CLI** to run the script:
   ```bash
   npx railway run node scripts/set-admin-phone.js 2348123456789
   ```
3. **Or use SQLite via Railway CLI:**
   ```bash
   npx railway run sqlite3 upwine.db "UPDATE settings SET value='2348123456789' WHERE key='admin_phone';"
   ```

## Troubleshooting

### "Database locked" error
- Make sure your dev server is stopped
- Close any database connections
- Try again

### Phone number not working
- Verify the format is correct: `234XXXXXXXXXX`
- Check that WhatsApp API is configured (see `WHATSAPP_SETUP.md`)
- Check server logs for WhatsApp errors

### Can't find the database file
- Make sure you're in the project root directory
- The database file is `upwine.db` in the project root
- If it doesn't exist, start your dev server once: `npm run dev` (it will create it)

## Next Steps

After setting the admin phone:
1. Make sure WhatsApp API is configured (see `WHATSAPP_SETUP.md`)
2. Test by placing a test order
3. Check your WhatsApp for the notification

