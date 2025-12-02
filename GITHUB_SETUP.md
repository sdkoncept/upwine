# GitHub Setup Guide for Upwine.com

## Step 1: Create GitHub Repository

1. Go to [github.com](https://github.com) and sign in
2. Click the **+** icon in the top right → **New repository**
3. Repository name: `upwine` or `upwine.com`
4. Description: "Fresh natural palm wine ordering platform from Benin City"
5. Choose **Public** or **Private** (your choice)
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click **Create repository**

## Step 2: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/upwine.git

# Or if you prefer SSH:
# git remote add origin git@github.com:YOUR_USERNAME/upwine.git

# Push your code
git branch -M main
git push -u origin main
```

## Step 3: Create Initial Commit

If you haven't committed yet, run:

```bash
git commit -m "Initial commit: Upwine.com - Palm wine ordering platform"
```

Then push:

```bash
git push -u origin main
```

## Quick Commands Reference

```bash
# Check status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push

# Pull latest changes
git pull
```

## What's Included in Repository

✅ All source code
✅ Configuration files
✅ Documentation (README, SETUP guides)
❌ Database file (excluded via .gitignore)
❌ Node modules (excluded via .gitignore)
❌ Environment variables (excluded via .gitignore)

## Important Notes

1. **Never commit sensitive data:**
   - `.env.local` files (already in .gitignore)
   - Paystack secret keys
   - Database files (already in .gitignore)

2. **Before pushing, make sure:**
   - All sensitive data is in `.env.local` (not committed)
   - Database file is excluded (already in .gitignore)
   - No API keys in code

3. **For collaborators:**
   - They'll need to:
     - Clone the repo
     - Run `npm install`
     - Create their own `.env.local` file
     - Database will be created automatically on first run

## Deployment

After pushing to GitHub, you can:
- Deploy to Vercel (connects to GitHub automatically)
- Deploy to Netlify
- Deploy to your own server

## Repository Structure

```
upwine.com/
├── app/              # Next.js app directory
├── lib/              # Utility functions
├── public/           # Static assets (if any)
├── README.md         # Main documentation
├── SETUP.md          # Setup instructions
├── package.json      # Dependencies
└── .gitignore        # Git ignore rules
```

