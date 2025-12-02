# How to Push to GitHub

## Option 1: Using Personal Access Token (HTTPS) - Recommended

### Step 1: Create Personal Access Token
1. Go to GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name: "Upwine Project"
4. Select scopes: Check `repo` (full control of private repositories)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)

### Step 2: Push using the token
When prompted for password, paste your token instead:

```bash
git push -u origin main
# Username: sdkoncept
# Password: [paste your token here]
```

## Option 2: Set Up SSH Keys (Better for long-term)

### Step 1: Check if you have SSH keys
```bash
ls -al ~/.ssh
```

### Step 2: Generate SSH key (if you don't have one)
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
# Press Enter to accept default location
# Press Enter twice for no passphrase (or set one)
```

### Step 3: Add SSH key to GitHub
```bash
# Copy your public key
cat ~/.ssh/id_ed25519.pub
```

Then:
1. Go to GitHub.com → Settings → SSH and GPG keys
2. Click "New SSH key"
3. Paste your public key
4. Click "Add SSH key"

### Step 4: Switch to SSH and push
```bash
git remote set-url origin git@github.com:sdkoncept/upwine.git
git push -u origin main
```

## Option 3: Use GitHub CLI (gh)

If you have GitHub CLI installed:
```bash
gh auth login
git push -u origin main
```

## Current Status

Your repository is set up with HTTPS. To push:

1. **Get a Personal Access Token** (see Option 1 above)
2. Run: `git push -u origin main`
3. When prompted:
   - Username: `sdkoncept`
   - Password: `[paste your token]`

## Troubleshooting

**"Permission denied"**: 
- Make sure your token has `repo` scope
- Check that the repository exists and you have access

**"Repository not found"**:
- Verify the repository name: `sdkoncept/upwine`
- Make sure the repository exists on GitHub

