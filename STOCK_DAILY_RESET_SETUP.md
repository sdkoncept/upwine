# Daily Stock Reset Setup

## Overview

Stock now resets daily (every day at midnight) instead of weekly. The system uses today's date to track stock.

## Automatic Midnight Reset

### Option 1: Railway Cron Job (Recommended for Railway deployments)

1. Go to your Railway project
2. Navigate to **Settings** → **Cron Jobs**
3. Add a new cron job:
   - **Schedule**: `0 0 * * *` (runs at midnight every day)
   - **URL**: `https://your-app.railway.app/api/cron/reset-stock`
   - **Method**: `GET`

Or use Railway CLI:
```bash
railway cron create --schedule "0 0 * * *" --url "https://your-app.railway.app/api/cron/reset-stock"
```

### Option 2: Vercel Cron Jobs (If using Vercel)

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/reset-stock",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### Option 3: External Cron Service

Use a service like:
- **cron-job.org** (free)
- **EasyCron** (free tier)
- **Uptime Robot** (free tier)

Schedule: Run every day at 00:00 (midnight)
URL: `https://your-app-url.com/api/cron/reset-stock`
Method: GET

### Option 4: Manual Cron Setup (Linux server)

Add to crontab:
```bash
0 0 * * * curl https://your-app-url.com/api/cron/reset-stock
```

## Security (Optional)

To secure the cron endpoint, set an environment variable:

1. Add to Railway/Vercel environment variables:
   - `CRON_SECRET` = `your-secret-key-here`

2. Update the cron job URL to include the secret:
   ```
   https://your-app-url.com/api/cron/reset-stock
   Authorization: Bearer your-secret-key-here
   ```

## Testing

Test the cron endpoint manually:
```bash
curl https://your-app-url.com/api/cron/reset-stock
```

Expected response:
```json
{
  "success": true,
  "message": "Stock reset to 100 bottles for 2025-01-17",
  "date": "2025-01-17",
  "bottles": 100
}
```

## What Changed

- **Stock tracking**: Changed from weekly (Monday) to daily (by date)
- **Stock reset**: Now uses today's date instead of week start date
- **Automatic reset**: New cron endpoint `/api/cron/reset-stock` for automatic midnight reset
- **Manual reset**: Still available from admin dashboard (now resets today's stock)

## Timezone Note

The cron job runs at midnight in the server's timezone. Make sure your cron service is set to the correct timezone (e.g., WAT - West Africa Time for Nigeria).

For Railway: The server uses UTC by default. Adjust the cron schedule accordingly:
- For midnight WAT (UTC+1): `0 23 * * *` (11 PM UTC = midnight WAT)
