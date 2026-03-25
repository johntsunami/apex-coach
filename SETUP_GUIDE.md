# APEX Coach — Local Development Setup

## Quick Start (5 minutes)

### 1. Install Prerequisites
```bash
# Install Node.js (if you don't have it)
# Download from https://nodejs.org — get the LTS version

# Install Claude Code
npm install -g @anthropic-ai/claude-code
```

### 2. Create Project
```bash
mkdir apex-coach && cd apex-coach
npx create-react-app . --template typescript
# OR for faster/lighter:
npm create vite@latest . -- --template react-ts
```

### 3. Copy Your Current App
Take the `apex-coach.jsx` file from this chat and save it as `src/App.tsx` in your project.

### 4. Run Locally
```bash
npm install
npm run dev
```
This starts a local dev server (usually http://localhost:5173).

### 5. Access on Your Phone (Same WiFi)
```bash
# Find your computer's local IP:
# Mac: System Settings → Network → your IP (e.g., 192.168.1.100)
# Windows: ipconfig → IPv4 Address

# Vite already exposes on network. Open on phone:
# http://192.168.1.100:5173
```

### 6. Deploy for Permanent Phone Access
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (free)
vercel

# You'll get a URL like: https://apex-coach-xyz.vercel.app
# Bookmark this on your phone's home screen as a PWA
```

### 7. Initialize Claude Code
```bash
cd apex-coach
claude
# Once inside Claude Code, run:
/init
```
This creates a starter CLAUDE.md. **Replace it** with the CLAUDE.md file included in this project.

---

## Working Workflow

**At home (PC):** Open terminal → `cd apex-coach` → `claude` → Make changes → Test at localhost

**At gym (phone):** Open your Vercel URL → Use the app → Note issues → Fix later on PC

**After changes:** `vercel` to redeploy → Phone auto-gets latest version

---

## File Structure
```
apex-coach/
├── CLAUDE.md          ← HARD RULES (never delete this)
├── .claude/
│   └── rules/
│       ├── exercise-data.md    ← Exercise DB rules
│       ├── injury-safety.md    ← Safety escalation rules
│       └── mental-health.md    ← Mental coaching rules
├── docs/
│   ├── V7_SPEC.md             ← Full V7 product spec
│   ├── FEATURE_CHECKLIST.md   ← What's built vs pending
│   └── DATA_MODEL.md          ← 10 core objects
├── src/
│   ├── App.tsx                ← Main app
│   ├── data/
│   │   ├── exercises.ts       ← Exercise database
│   │   ├── injuries.ts        ← User injury profiles
│   │   └── scoring.ts         ← RTT/CTP formulas
│   ├── components/            ← Reusable UI components
│   ├── screens/               ← Screen components
│   └── utils/                 ← Helper functions
├── package.json
└── vercel.json
```
