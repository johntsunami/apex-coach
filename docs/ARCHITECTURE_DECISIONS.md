# APEX Coach — Architecture Decisions & Answers

---

## 1. "How can I verify the app creates the most optimized plan?"

Three layers of verification:

**Layer 1 — Deterministic Rules (the app enforces these, not AI)**
- Phase parameters (sets/reps/tempo/rest) come from a hard-coded table matching NASM OPT guidelines
- Injury contraindications are a lookup table — not AI-generated
- Volume caps per week per muscle group are enforced by code
- Deload frequency is hard-coded (every 4th week)
- These rules can be audited line-by-line in the codebase

**Layer 2 — Exercise Database Review**
- Build the database from primary sources:
  - NASM Essentials of Personal Training (7th edition, 2022)
  - NASM Corrective Exercise Specialization manual
  - McKenzie Institute protocols
  - ACSM Guidelines for Exercise Testing and Prescription
  - Current peer-reviewed research (PubMed)
- Each exercise has a `lastUpdated` date and `source` field
- Quarterly review flag: exercises older than 90 days get flagged for review
- You (or Claude Code) can update individual exercises without rebuilding the whole database

**Layer 3 — Transparency to the User**
- Every daily plan shows WHY each exercise was selected
- Every exclusion is explained
- User can challenge any choice and request alternatives
- Post-session feedback feeds into future plans
- This makes the logic auditable by the user in real-time

**How to verify PT completeness:**
- Create a PT Protocol Checklist per injury (e.g., Lower Back PT must include: McGill Big 3, hip hinge patterning, core endurance progression, extension-based movements)
- App checks that each active protocol's required exercises appear in the weekly plan
- If a protocol requirement is missing, it auto-adds it or flags the gap

---

## 2. "Should we build an exercise database?"

**Yes, absolutely.** Here's why and how:

**Why:** Right now, every exercise is hard-coded in the React component. That means:
- Adding exercises requires editing the app code
- Exercise data gets lost if you rebuild the UI
- AI has to re-parse exercise details every session
- Can't filter/sort/query efficiently

**What to build (for 1-week MVP):**
```
/apex-coach/
  /src/
    /data/
      exercises.json      ← 50-100 exercises, structured
      protocols.json      ← PT protocols per injury type
      phases.json         ← NASM OPT phase parameters
      mckenzie.json       ← McKenzie method exercises
      assessments.json    ← NASM assessment protocols
```

Each is a JSON file. No server needed. Ships with the app.
Claude Code can update any individual file without touching the others.

**For keeping it current:**
- Each exercise has `lastReviewed: "2026-03-25"` and `sources: ["NASM 7th Ed", "PMID:12345678"]`
- Claude Code can run a review pass: "Review all exercises last updated before January 2026 and check for new evidence"
- This doesn't need to happen daily — quarterly is fine for exercise science

---

## 3. "Where can we build this database? I want this live in a week."

**Week 1 Stack (simplest possible, gets it live):**

| Layer | Tool | Cost | Why |
|---|---|---|---|
| Frontend | React (Vite) | Free | Already built |
| Database | JSON files in repo | Free | No server, loads instantly |
| User data | localStorage | Free | Each person's data stays on their device |
| Hosting | Vercel | Free | One-command deploy, instant URL |
| AI Coach | Claude API | Your existing plan | Already integrated |

**Your family and friends:**
1. You deploy to Vercel → get URL like `apex-coach.vercel.app`
2. Share the URL
3. They open it on their phones, bookmark as PWA
4. Each person's data is stored locally on their phone
5. Limitation: data doesn't sync between devices, and clears if they clear browser data

**Week 2-3 Upgrade (when you need real multi-user):**

| Layer | Tool | Cost | Why |
|---|---|---|---|
| Auth | Supabase Auth | Free tier | Google/email login |
| Cloud DB | Supabase PostgreSQL | Free tier | User data syncs across devices |
| Storage | Supabase Storage | Free tier | Profile photos, progress pics |

This upgrade means: user creates account → data persists forever → works on any device → you can see anonymized usage data to improve the app.

---

## 4. "5 Sandbox App Design Ideas"

Here are 5 distinct design directions. Each would feel very different:

### Design 1: "Clinical Performance Lab"
- White/light gray background with dark text
- Clean medical-grade UI (think Whoop or Oura ring app)
- Data-heavy dashboard with charts and metrics
- Minimal decoration — all function
- Trust signal: looks like a medical device, not a fitness app

### Design 2: "Dark Athleisure" (current direction, refined)
- Deep navy/black with teal accents
- Rounded cards with subtle glow effects
- Smooth micro-animations on interactions
- Premium feel like a luxury fitness brand
- Gradient buttons, frosted glass cards

### Design 3: "Tactical Operator"
- Matte black with amber/orange accents
- Military-inspired typography (condensed, uppercase)
- Angular cards with hard edges (no rounded corners)
- Progress shown as "mission objectives"
- Feels like a HUD — heads-up display for your body

### Design 4: "Nature Biometric"
- Dark green/earth tones with warm gold accents
- Organic shapes, soft curves
- Body illustrations with nature metaphors (tree growth = strength progression)
- Calm, grounding aesthetic
- Feels like training in the woods, not a gym

### Design 5: "Neon Arcade"
- True black with electric blue/pink neon accents
- Pixelated/retro font for headers
- XP bars, level-up animations, achievement badges prominent
- Gamification as the primary UI metaphor
- Feels like leveling up a character in a game

I can build a quick mockup of any of these as an artifact if you want to compare.

---

## 5. NASM Assessment Verification Checklist

To verify the app follows all NASM protocols:

### Initial Assessment (must complete before first workout)
- [ ] PAR-Q+ health screening
- [ ] Resting heart rate
- [ ] Blood pressure (optional, user-reported)
- [ ] Body composition assessment method selected
- [ ] Overhead squat assessment (5 checkpoints)
- [ ] Single-leg squat assessment
- [ ] Push-up assessment (form check)
- [ ] Pulling assessment
- [ ] ROM: shoulder flexion, hip flexion, ankle dorsiflexion, trunk rotation

### Every Session Must Include (CEx Continuum)
1. **Inhibit** — SMR/foam rolling on overactive muscles (identified from assessment)
2. **Lengthen** — Static or dynamic stretch on tight muscles
3. **Activate** — Isolated strengthening of underactive muscles
4. **Integrate** — Compound movement using corrected pattern

### Phase Parameter Compliance
| Phase | Sets | Reps | Tempo | Rest | Intensity |
|---|---|---|---|---|---|
| 1 Stabilization | 1-3 | 12-20 | 4/2/1 | 0-90s | 50-70% 1RM |
| 2 Strength Endurance | 2-4 | 8-12 | 2/0/2 | 0-60s | 70-80% 1RM |
| 3 Hypertrophy | 3-5 | 6-12 | 2/0/2 | 0-60s | 75-85% 1RM |
| 4 Max Strength | 4-6 | 1-5 | X/X/X | 3-5min | 85-100% 1RM |
| 5 Power | 3-5 | 1-10 | X/X/X | 3-5min | 30-45% or 85-100% |

### Volume Progression Rules
- Week 1-2: 1-2 sets per exercise (neural adaptation period)
- Week 3-4: 2-3 sets per exercise
- Week 5+: Follow phase parameters
- NEVER increase volume >10% week-to-week
- Deload every 4th week (50% volume reduction)
- Track total weekly volume per muscle group
