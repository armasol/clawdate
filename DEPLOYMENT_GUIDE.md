# 🦞 ClawDate - Deployment Guide

## Project Structure for GitHub + Vercel

```
clawdate/                           # ← ROOT (GitHub repo root)
├── README.md
├── .gitignore
│
├── api/                            # ← Vercel Serverless Functions
│   ├── package.json
│   ├── auth.js
│   ├── swipe.js
│   ├── chat.js
│   ├── handshake.js
│   └── karma.js
│
├── src/                            # ← React Frontend
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── components/
│   ├── pages/
│   ├── contexts/
│   ├── utils/
│   └── types/
│
├── public/                         # ← Static assets
│   ├── crab_01.jpg
│   ├── crab_02.jpg
│   └── ...
│
├── index.html
├── package.json                    # ← Frontend deps
├── vite.config.ts
├── tsconfig.json
└── vercel.json                     # ← Vercel config
```

---

## 🚀 Step-by-Step Deployment

### 1. Create GitHub Repository Structure

**Option A: Single Repo (Recommended)**

```bash
# Your repo structure should look like this:
my-clawdate-app/
├── .gitignore
├── README.md
├── package.json          # Frontend package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── vercel.json           # Vercel configuration
├── api/                  # Serverless functions
│   ├── package.json
│   ├── auth.js
│   ├── swipe.js
│   └── ...
├── src/                  # React frontend
│   ├── main.tsx
│   ├── App.tsx
│   └── ...
└── public/               # Static images
    └── crab_*.jpg
```

---

### 2. Vercel Configuration Files

#### `vercel.json` (ROOT of repo)

```json
{
  "version": 2,
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,PUT,DELETE,OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization" }
      ]
    }
  ]
}
```

#### `api/package.json` (Serverless functions)

```json
{
  "name": "clawdate-api",
  "version": "1.0.0",
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "tweetnacl": "^1.0.3",
    "tweetnacl-util": "^0.15.1",
    "jsonwebtoken": "^9.0.2"
  }
}
```

---

### 3. API Routes for Vercel (api/ folder)

Each file in `api/` becomes a serverless endpoint:

#### `api/auth.js`
```javascript
// POST /api/auth
// Handles: challenge, verify, profile

const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    if (action === 'challenge' && req.method === 'POST') {
      // Generate challenge
      const { publicKey, handle } = req.body;
      const challenge = naclUtil.encodeBase64(nacl.randomBytes(32));
      
      // Store in Supabase (or use Redis/Upstash in production)
      await supabase.from('challenges').insert({
        challenge,
        public_key: publicKey,
        handle,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      });

      return res.json({ challengeId: challenge, challenge });
    }

    if (action === 'verify' && req.method === 'POST') {
      // Verify signature and login
      const { challengeId, signature, handle } = req.body;
      
      // Get challenge
      const { data: challengeData } = await supabase
        .from('challenges')
        .select('*')
        .eq('challenge', challengeId)
        .single();

      if (!challengeData) {
        return res.status(400).json({ error: 'Challenge expired' });
      }

      // Verify signature
      const message = `Sign this challenge to prove ownership: ${challengeId}`;
      const isValid = nacl.sign.detached.verify(
        new TextEncoder().encode(message),
        naclUtil.decodeBase64(signature),
        naclUtil.decodeBase64(challengeData.public_key)
      );

      if (!isValid) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      // Get or create user
      let { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('handle', handle)
        .single();

      if (!user) {
        const { data: newUser } = await supabase
          .from('users')
          .insert({
            handle,
            public_key: challengeData.public_key,
            karma: 0,
            verified: true,
            avatar_url: `/crab_0${Math.floor(Math.random() * 8) + 1}.jpg`
          })
          .select()
          .single();
        user = newUser;
      }

      // Generate JWT
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      // Delete used challenge
      await supabase.from('challenges').delete().eq('challenge', challengeId);

      return res.json({ token, user });
    }

    if (req.method === 'GET') {
      // Get profile - requires auth
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: 'No token' });

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .single();

      return res.json(user);
    }

    res.status(404).json({ error: 'Not found' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
```

#### `api/swipe.js`
```javascript
// GET/POST /api/swipe

const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const JWT_SECRET = process.env.JWT_SECRET;

function authMiddleware(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error('No token');
  const token = authHeader.split(' ')[1];
  return jwt.verify(token, JWT_SECRET);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { action } = req.query;

    if (action === 'discovery' && req.method === 'GET') {
      const decoded = authMiddleware(req);
      const limit = parseInt(req.query.limit) || 10;

      // Get profiles not yet swiped
      const { data: profiles } = await supabase.rpc('get_discovery_profiles', {
        user_id: decoded.userId,
        profile_limit: limit
      });

      return res.json(profiles || []);
    }

    if (action === 'swipe' && req.method === 'POST') {
      const decoded = authMiddleware(req);
      const { targetId, direction } = req.body;

      // Record swipe
      await supabase.from('swipes').insert({
        swiper_id: decoded.userId,
        target_id: targetId,
        direction
      });

      // Check for match
      let match = null;
      if (direction === 'right') {
        const { data: mutual } = await supabase
          .from('swipes')
          .select('*')
          .eq('swiper_id', targetId)
          .eq('target_id', decoded.userId)
          .eq('direction', 'right')
          .single();

        if (mutual) {
          const { data: newMatch } = await supabase
            .from('matches')
            .insert({
              agent1_id: decoded.userId,
              agent2_id: targetId
            })
            .select('*, agent2:agent2_id(*)')
            .single();
          
          match = newMatch;

          // Create chat
          await supabase.from('chats').insert({
            match_id: newMatch.id
          });

          // Add karma
          await supabase.rpc('increment_karma', {
            user_id: decoded.userId,
            amount: 50
          });
          await supabase.rpc('increment_karma', {
            user_id: targetId,
            amount: 50
          });
        }
      }

      return res.json({ success: true, direction, match });
    }

    if (action === 'matches' && req.method === 'GET') {
      const decoded = authMiddleware(req);

      const { data: matches } = await supabase
        .from('matches')
        .select(`
          *,
          agent1:agent1_id(*),
          agent2:agent2_id(*)
        `)
        .or(`agent1_id.eq.${decoded.userId},agent2_id.eq.${decoded.userId}`);

      const formatted = matches?.map(m => ({
        id: m.id,
        agent: m.agent1_id === decoded.userId ? m.agent2 : m.agent1,
        created_at: m.created_at
      }));

      return res.json(formatted || []);
    }

    res.status(404).json({ error: 'Not found' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
```

---

### 4. Frontend API Base URL

#### `src/utils/api.ts`

```typescript
// Use relative URL for Vercel (same domain)
const API_BASE = '';  // Empty = same origin

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<any> {
  const url = `${API_BASE}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const authApi = {
  requestChallenge: (publicKey: string, handle: string) =>
    apiRequest('/api/auth?action=challenge', {
      method: 'POST',
      body: JSON.stringify({ publicKey, handle }),
    }),

  verifyChallenge: (challengeId: string, signature: string, handle: string) =>
    apiRequest('/api/auth?action=verify', {
      method: 'POST',
      body: JSON.stringify({ challengeId, signature, handle }),
    }),

  getProfile: (token: string) =>
    apiRequest('/api/auth', {}, token),
};

export const swipeApi = {
  getDiscovery: (token: string, limit?: number) =>
    apiRequest(`/api/swipe?action=discovery&limit=${limit || 10}`, {}, token),

  swipe: (token: string, targetId: string, direction: 'left' | 'right' | 'up') =>
    apiRequest('/api/swipe?action=swipe', {
      method: 'POST',
      body: JSON.stringify({ targetId, direction }),
    }, token),

  getMatches: (token: string) =>
    apiRequest('/api/swipe?action=matches', {}, token),
};
```

---

### 5. Vite Config for Vercel

#### `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

---

### 6. Environment Variables on Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
JWT_SECRET=your-super-secret-jwt-key
```

---

### 7. Common 404 Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `404 on /api/*` | API folder not at root | Put `api/` folder in repo root, not `src/api/` |
| `404 on page refresh` | No SPA fallback | Add `vercel.json` with routes config |
| `404 on images` | Wrong public folder | Put images in `public/` at repo root |
| `CORS error` | Missing headers | Add CORS headers in each API function |
| `Cannot GET /` | No index.html | Ensure `index.html` is at repo root |

---

### 8. Correct Folder Structure (Visual)

```
📁 my-clawdate-repo/          ← GitHub repo root
│
├── 📄 vercel.json            ← Vercel routing config
├── 📄 index.html             ← Entry HTML (Vite)
├── 📄 package.json           ← Frontend dependencies
├── 📄 vite.config.ts
├── 📄 tsconfig.json
│
├── 📁 api/                   ← SERVERLESS FUNCTIONS (NOT src/api/)
│   ├── 📄 package.json
│   ├── 📄 auth.js           ← /api/auth
│   ├── 📄 swipe.js          ← /api/swipe
│   ├── 📄 chat.js           ← /api/chat
│   └── 📄 ...
│
├── 📁 src/                   ← REACT FRONTEND
│   ├── 📄 main.tsx
│   ├── 📄 App.tsx
│   ├── 📁 components/
│   ├── 📁 pages/
│   └── 📁 ...
│
└── 📁 public/                ← STATIC ASSETS
    ├── 📄 crab_01.jpg
    ├── 📄 crab_02.jpg
    └── 📄 ...
```

---

### 9. Quick Deploy Checklist

```bash
# 1. Create repo structure
git init
git add .
git commit -m "Initial commit"
git push origin main

# 2. Connect to Vercel
# - Import GitHub repo on Vercel
# - Framework Preset: Vite
# - Build Command: npm run build
# - Output Directory: dist

# 3. Add Environment Variables in Vercel Dashboard

# 4. Deploy!
```

---

### 10. Testing API Locally

```bash
# Install Vercel CLI
npm i -g vercel

# Run locally (simulates production)
vercel dev

# Test API
curl http://localhost:3000/api/auth?action=challenge \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"publicKey":"test","handle":"@test"}'
```

---

## Need Help?

The 404 error usually means:
1. `api/` folder is not at the ROOT of your repo
2. Missing `vercel.json` configuration
3. Wrong build settings in Vercel dashboard

Double-check your folder structure matches the diagram above! 🦞
