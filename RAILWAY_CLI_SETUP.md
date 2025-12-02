# Railway CLI Setup Guide

Railway CLI is installed! Follow these steps to deploy.

## Step 1: Login to Railway

Open your terminal and run:

```bash
cd "/home/aanenih/Cursor Projects/upwine.com"
npx railway login
```

This will:
- Open your browser
- Ask you to authorize Railway
- Log you in automatically

## Step 2: Initialize Project

After login, create a new Railway project:

```bash
npx railway init
```

This will:
- Ask for project name (type: `upwine` or press Enter for default)
- Create a new Railway project
- Link it to your current directory

## Step 3: Add Environment Variables

Set your Paystack key:

```bash
npx railway variables --set "PAYSTACK_SECRET_KEY=sk_test_xxxxx"
```

Replace `sk_test_xxxxx` with your actual Paystack secret key.

**Note:** Use `--set` flag with quotes around the key=value pair.

## Step 4: Deploy!

Deploy your app:

```bash
npx railway up
```

This will:
- Build your Next.js app
- Deploy to Railway
- Give you a URL like `https://upwine-production.up.railway.app`

## Step 5: Set App URL

After deployment, Railway will give you a URL. Set it as an environment variable:

```bash
npx railway variables --set "NEXT_PUBLIC_APP_URL=https://your-app.railway.app"
```

Replace with your actual Railway URL.

## Quick Commands Reference

```bash
# Login
npx railway login

# Create new project
npx railway init

# Set environment variable
npx railway variables --set "KEY=value"

# Deploy
npx railway up

# View logs
npx railway logs

# Open dashboard
npx railway open
```

## Alternative: Use npm scripts

I've added a Railway script to `package.json`, so you can also use:

```bash
npm run railway login
npm run railway init
npm run railway up
```

## Troubleshooting

**"Cannot login in non-interactive mode"**
- Make sure you're running commands in your terminal (not through an automated script)
- The login command needs to open a browser

**"Project not found"**
- Run `npx railway init` first to create a project
- Or link to existing project: `npx railway link`

**Build fails**
- Check logs: `npx railway logs`
- Make sure all dependencies are in `package.json`

## Next Steps After Deployment

1. **Get your Railway URL**
   - Run: `npx railway open` (opens dashboard)
   - Or check the deployment output

2. **Update Paystack callback URL**
   - Go to Paystack Dashboard
   - Set webhook URL to: `https://your-app.railway.app/api/payment/verify`

3. **Test your app**
   - Visit your Railway URL
   - Place a test order
   - Verify everything works

## Need Help?

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway

