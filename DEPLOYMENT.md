# 🚀 Deployment Guide

## Overview

This project uses GitHub Pages with a two-branch strategy:
- `main` - Development work
- `production` - Live website deployment

**Live Site:** https://moshehoff.github.io/FamilyHistory/

## Daily Workflow

### Working on Changes (main branch)

```powershell
# Make sure you're on main
git checkout main

# Edit files as needed
# - data/tree.ged
# - bios/*.md
# - site/quartz/components/*.tsx
# etc.

# Commit and push freely - these won't affect the live site
git add .
git commit -m "WIP: your changes"
git push origin main
```

### Publishing to Production

Only do this when you're ready to update the live website!

```powershell
# 1. Make sure you're on main and up-to-date
git checkout main
git pull

# 2. Build the site
cd scripts
python doit.py
cd ../site
npx quartz build

# 3. Test locally (IMPORTANT!)
npx quartz build --serve
# Open http://localhost:8080 and verify everything looks good
# Press Ctrl+C when done testing

# 4. Commit the built site
cd C:\projects\V4
git add .
git commit -m "build: ready for production v[DATE]"
git push origin main

# 5. Merge to production
git checkout production
git merge main -m "deploy: [describe changes]"

# 6. Force-add the public directory (normally ignored)
git add -f site/public/
git commit --amend --no-edit

# 7. Push to production (this triggers deployment!)
git push origin production

# 8. Go back to main for continued work
git checkout main
```

### Checking Deployment Status

1. Go to: https://github.com/moshehoff/FamilyHistory/actions
2. Click on the latest "Deploy to GitHub Pages" workflow
3. Wait for it to complete (~30-60 seconds)
4. Visit: https://moshehoff.github.io/FamilyHistory/

## Troubleshooting

### Deployment Failed

Check the Actions log in GitHub:
https://github.com/moshehoff/FamilyHistory/actions

Common issues:
- `site/public` not found → You forgot to build before pushing
- Permission denied → Check Pages settings in repository

### Wrong Version Deployed

To rollback:
```powershell
git checkout production
git reset --hard HEAD~1  # Go back one commit
git push -f origin production
```

### Need to Update production without new commits

```powershell
git checkout production
git merge main --no-commit
# Fix any conflicts if needed
git add -f site/public/
git commit -m "deploy: manual sync"
git push origin production
git checkout main
```

## Emergency Rollback

If you need to quickly revert to a previous version:

```powershell
# Find the commit hash of the good version
git log production --oneline

# Reset production to that commit
git checkout production
git reset --hard [commit-hash]
git push -f origin production

# Go back to main
git checkout main
```

## Branch Management

### Syncing production with main (without deploying)

```powershell
git checkout production
git merge main --no-ff
# Don't add site/public/ - just push source changes
git push origin production
git checkout main
```

This won't trigger deployment because site/public/ isn't committed.

## Daily Workflow Cheat Sheet

### Scenario 1: Regular Development Work

```powershell
git checkout main
# Edit files...
git add .
git commit -m "your message"
git push origin main  # ← Does NOT deploy
```

### Scenario 2: Ready to Publish

```powershell
git checkout main
cd scripts && python doit.py
cd ../site && npx quartz build
npx quartz build --serve  # Test!
cd C:\projects\V4
git add .
git commit -m "build: production ready"
git push origin main

git checkout production
git merge main
git add -f site/public/
git commit --amend --no-edit
git push origin production  # ← DEPLOYS!
git checkout main
```

### Scenario 3: Quick Fix After Deploy

```powershell
git checkout main
# Fix the issue...
cd scripts && python doit.py && cd ../site && npx quartz build
cd C:\projects\V4
git add .
git commit -m "hotfix: [description]"
git push origin main

git checkout production
git merge main
git add -f site/public/
git commit --amend --no-edit
git push origin production  # ← Re-deploys
git checkout main
```

## Verification Steps

After deployment completes:

1. ✅ **Check Actions:** https://github.com/moshehoff/FamilyHistory/actions
2. ✅ **Check Site:** https://moshehoff.github.io/FamilyHistory/
3. ✅ **Test Navigation:** Click through profiles, chapters, images
4. ✅ **Check Console:** Open DevTools, look for errors

## Emergency Procedures

### Site is Broken - Rollback Immediately

```powershell
git checkout production
git reset --hard HEAD~1
git push -f origin production
git checkout main
# Fix the issue on main before next deploy
```

### Need to Take Site Offline

```powershell
# Disable Pages temporarily
# Go to: Settings → Pages → Source → None
```

### Clear All Caches

```powershell
cd C:\projects\V4\site
Remove-Item -Recurse -Force .quartz-cache
Remove-Item -Recurse -Force public
npx quartz build
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  LOCAL MACHINE (C:\projects\V4)                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [main branch]                                              │
│  ├─ data/tree.ged          ← GEDCOM source                 │
│  ├─ bios/*.md              ← Biography markdown files       │
│  ├─ bios/I10/*.jpg         ← Images                        │
│  ├─ scripts/doit.py        ← Content generator             │
│  ├─ site/quartz/           ← Quartz source code            │
│  └─ site/content/          ← Generated content (tracked)   │
│                                                             │
│  [production branch]                                        │
│  └─ site/public/           ← Built website (tracked)       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              ↓ git push
┌─────────────────────────────────────────────────────────────┐
│  GITHUB (github.com/moshehoff/FamilyHistory)               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [main branch]          ← Development work                  │
│  ├─ All source files                                        │
│  └─ NOT deployed                                            │
│                                                             │
│  [production branch]    ← Ready for deployment             │
│  ├─ All source files                                        │
│  ├─ site/public/ (built website)                           │
│  └─ ✅ Triggers GitHub Actions                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              ↓ GitHub Actions
┌─────────────────────────────────────────────────────────────┐
│  GITHUB PAGES                                               │
│  https://moshehoff.github.io/FamilyHistory/                │
│                                                             │
│  ✅ Live website served to users                           │
└─────────────────────────────────────────────────────────────┘
```

## Summary

| Aspect | Details |
|--------|---------|
| **Live URL** | https://moshehoff.github.io/FamilyHistory/ |
| **Dev Branch** | `main` |
| **Deploy Branch** | `production` |
| **Workflow File** | `.github/workflows/deploy.yml` |
| **Deployment Time** | ~30-60 seconds |
| **Build Command** | `cd scripts && python doit.py && cd ../site && npx quartz build` |
| **Deploy Trigger** | Push to `production` branch |

