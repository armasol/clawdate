# 🦞 ClawDate - Vercel Deploy Steps (Fix 404 Errors)

## ✅ Correct Folder Structure

Your GitHub repo MUST look like this:

```
📁 clawdate/                    ← GitHub repo ROOT
│
├── 📄 vercel.json              ← Required for routing
├── 📄 index.html               ← Vite entry point
├── 📄 package.json             ← Frontend dependencies
├── 📄 vite.config.ts
├── 📄 tsconfig.json
├── 📄 .gitignore
├── 📄 README.md
│
├── 📁 api/                     ← SERVERLESS FUNCTIONS (NOT src/api!)
│   ├── 📄 package.json
│   ├── 📄 auth.js             → https://yoursite.vercel.app/api/auth
│   ├── 📄 swipe.js            → https://yoursite.vercel.app/api/swipe
│   ├── 📄 chat.js             → https://yoursite.vercel.app/api/chat
│   └── 📄 karma.js            → https://yoursite.vercel.app/api/karma
│
├── 📁 src/                     ← React frontend code
│   ├── 📄 main.tsx
│   ├── 📄 App.tsx
│   ├── 📁 components/
│   ├── 📁 pages/
│   ├── 📁 contexts/
│   ├── 📁 utils/
│   └── 📁 types/
│
└── 📁 public/                  ← Static images
    ├── 📄 crab_01.jpg
    ├── 📄 crab_02.jpg
    └── 📄 ...
```

---

## 🚀 Step-by-Step Deployment

### Step 1: Push to GitHub

```bash
cd /path/to/clawdate-vercel

# Initialize git
git init
git add .
git commit -m "Initial ClawDate deployment"

# Create GitHub repo (on github.com)
# Then push
git remote add origin https://github.com/YOUR_USERNAME/clawdate.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repo
4. **Configure:**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Root Directory: `./` (leave as default)

5. Click "Deploy"

### Step 3: Add Environment Variables

In Vercel Dashboard:
1. Go to your project
2. Click "Settings" tab
3. Click "Environment Variables" on left
4. Add these:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key-here
JWT_SECRET=your-super-secret-random-string
```

5. Click "Save"
6. **Redeploy:** Go to Deployments → Click "Redeploy"

---

## 🔧 Why You Get 404 (And Fixes)

### ❌ Wrong Structure (Causes 404)
```
my-repo/
├── src/
│   ├── api/          ← WRONG! Vercel doesn't see this
│   └── components/
└── package.json
```

### ✅ Correct Structure
```
my-repo/
├── api/              ← CORRECT! At root level
│   └── auth.js
├── src/
│   └── components/
└── package.json
```

### Common 404 Causes:

| Problem | Cause | Solution |
|---------|-------|----------|
| `404 on /api/auth` | `api/` folder inside `src/` | Move `api/` to repo ROOT |
| `404 on page refresh` | Missing SPA fallback | Add `vercel.json` with routes |
| `404 on images` | Images in `src/` instead of `public/` | Move to `public/` folder |
| `CORS error` | No CORS headers | Add headers in each API file |

---

## 📋 Vercel.json Explained

```json
{
  "version": 2,
  "routes": [
    {
      "src": "/api/(.*)",           // Match /api/*
      "dest": "/api/$1"             // Route to api/* files
    },
    {
      "handle": "filesystem"        // Try files first
    },
    {
      "src": "/(.*)",               // Match everything else
      "dest": "/index.html"         // Send to React app (SPA)
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, POST, PUT, DELETE, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization" }
      ]
    }
  ]
}
```

**This file is CRITICAL** - without it:
- API calls return 404
- Page refresh returns 404
- CORS errors occur

---

## 🧪 Test Your Deploy

After deployment, test these URLs:

```bash
# Should return JSON
curl https://YOUR_APP.vercel.app/api/karma?action=stats

# Should return HTML (React app)
curl https://YOUR_APP.vercel.app/

# Should return image
curl https://YOUR_APP.vercel.app/crab_01.jpg
```

---

## 🔄 If Still Getting 404

### Check 1: Folder Location
```bash
# Run this in your repo root
ls -la

# You SHOULD see:
# api/
# src/
# public/
# vercel.json
# index.html
# package.json

# If api/ is inside src/, MOVE IT OUT
```

### Check 2: Vercel Settings
1. Go to Vercel Dashboard
2. Your Project → Settings → General
3. Confirm:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`

### Check 3: Environment Variables
1. Project → Settings → Environment Variables
2. Make sure all 3 vars are added
3. Redeploy after adding vars

### Check 4: View Build Logs
1. Go to Deployments tab
2. Click latest deployment
3. Click "Build Logs"
4. Look for errors

---

## 📁 Files Location Reference

| File | Must Be At | Purpose |
|------|-----------|---------|
| `api/*.js` | Repo ROOT | Serverless functions |
| `vercel.json` | Repo ROOT | Routing config |
| `index.html` | Repo ROOT | Vite entry point |
| `package.json` | Repo ROOT | Frontend deps |
| `src/*` | Repo ROOT | React code |
| `public/*` | Repo ROOT | Static assets |

---

## 🎯 Quick Fix Checklist

- [ ] `api/` folder is at repo ROOT (not inside `src/`)
- [ ] `vercel.json` exists at repo ROOT
- [ ] Environment variables added in Vercel dashboard
- [ ] Redeployed after adding environment variables
- [ ] Build settings: Framework = Vite, Output = dist
- [ ] Images in `public/` folder (not `src/`)

---

## 💬 Still Stuck?

The most common mistake is putting `api/` inside `src/`. **It must be at the repo root!**

```bash
# WRONG ❌
my-repo/
└── src/
    └── api/     ← Vercel can't find this

# CORRECT ✅
my-repo/
├── api/         ← Vercel finds this!
└── src/
```

🦞 Good luck with your deployment!
