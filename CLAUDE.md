# APEX Coach — Project Rules

## CRITICAL: Read Before Every Task
This is a fitness + mental health coaching app. The founder (John) is the test subject.
**Every feature that exists MUST be preserved when making changes. NEVER rewrite the entire file. Make surgical edits only.**

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `git push origin master` — Auto-deploys to Vercel

## Live URL
- **Production**: https://apex-coach-five.vercel.app/
- **GitHub**: https://github.com/johntsunami/apex-coach
- Auto-deploys on every push to master via Vercel GitHub integration

## Architecture
- Single React app in `src/App.tsx` (will be split into components later)
- Inline SVG exercise illustrations (external images don't load in sandboxed environments)
- Claude API calls for AI Coach (no API key needed in claude.ai artifacts)
- Persistent data via localStorage (or artifact storage API when available)

---

## HARD RULES — NEVER VIOLATE

### Rule 1: Never Remove Existing Features
Before editing, LIST every feature currently in the file. After editing, VERIFY every feature still works. If a feature is missing after your edit, you broke the rule.

### Rule 2: Surgical Edits Only
NEVER rewrite the entire file. Use targeted find-and-replace. If adding a feature, add it. Don't rebuild everything around it.

### Rule 3: Exercise Screen Must Always Include
- Inline SVG illustration of the exercise (accurate to the specific movement)
- Step-by-step instructions (numbered)
- Good form cues (✅)
- Common mistakes (❌)
- Core bracing level with percentage and technique
- Injury-specific notes (⚠️) referencing John's 3 injuries
- Pro tip
- Breathing pattern with explicit inhale/hold/exhale counts
- Rest timer between sets (with countdown, hydration reminder, skip option)
- Sticky SET DONE / Substitute buttons above bottom nav
- Sets/Reps/RPE display with current set tracking

### Rule 4: Check-In Must Always Include
- Location selector (Gym / Home / Outdoor) — adapts exercise selection
- Sleep quality (card-based: Great/Good/OK/Poor)
- Body part soreness map (2-column grid, multi-select)
- Energy slider (1-10)
- Stress slider (1-10) with real-time adaptation preview table
- Skip option

### Rule 5: Bottom Nav Works on ALL Screens
Home, Train, Library, Tasks, Coach — all clickable at every point.
Train tab opens a dedicated workout overview page (not redirect to Home).

### Rule 6: AI Coach Has Two Modes
1. **Health Coach** — Exercise science, injury rehab, form, recovery, nutrition
2. **Mental Health Coach** — CBT, Self-Coaching Model (Brooke Castillo CTFAR), DBT (TIPP, DEAR MAN, STOP), ACT, Motivational Interviewing
Both use Claude API with full client profile in system prompt.
Never mention "NASM" by name. Use evidence-based exercise science principles.

### Rule 7: Exercise Library Is Its Own Page
- Filterable by phase (Warm-Up, Main, Cooldown)
- Filterable by body part (Back, Core, Shoulders, Legs, Glutes, Hips, Full Body)
- Expandable detail view with SVG illustration
- Every exercise shows: muscles, equipment, steps, form cues, mistakes, injury notes

### Rule 8: Data Must Persist
- Track workout completion, readiness scores, session reflections
- Store in localStorage or storage API
- User is the test subject — their data matters

---

## SCORING FORMULAS (from V7 spec)

### Readiness to Train (RTT)
```
RTT = (sleep × 0.30) + (soreness_inv × 0.20) + (energy × 0.20) + (stress_inv × 0.15) + (nutrition × 0.15)
Scale: 0-100
```

### Capacity to Push (CTP)
```
CTP = RTT - (sum of injury_severity × 5 for each active injury)
Floor: 20, Ceiling: 100
```

### Safety Level (from RTT + CTP average)
- ≥70: CLEAR (green) — full training
- ≥50: CAUTION (yellow) — modified intensity
- ≥30: RESTRICTED (orange) — limited exercises
- <30: STOP (red) — rest day, consult professional

---

## JOHN'S INJURY PROFILE — NEVER IGNORE

### Lower Back (Post-Surgical, Severity 3)
- NO axial loading >70% 1RM
- McGill Big 3 daily
- Hip hinge pattern priority
- Trap bar ONLY (no conventional deadlift)
- HIGH handles only until capacity increases
- Any radiating/tingling/numbness = STOP

### Left Knee (Post-Surgical, Severity 2)
- Limited deep flexion
- VMO activation pre-sets required
- NO plyometrics
- Wall sits at 45° max (not 90°)
- Watch for valgus (knee caving)

### Left Shoulder (Labrum Tear, Severity 2)
- NO behind-neck pressing
- External rotation warm-up mandatory before pressing
- NO overhead at end-range (Phase 1-2)
- Landmine press = safe pressing alternative
- Face pulls = mandatory counterbalance

---

## CLINICAL SAFETY ESCALATION (4 levels)

1. **Monitor**: "Keep an eye on this area. If it changes, let me know."
2. **Flag**: "This area is showing a pattern. We're modifying your session."
3. **Stop**: "Stop and rest this area. See a PT if it persists."
4. **Refer Out**: "This needs professional evaluation before you continue."

---

## PHASE SYSTEM

### Phase 1: Stabilization Endurance (Current — Months 1-2)
- Sets: 1-3 | Reps: 12-20 | Tempo: 4/2/1 | Rest: 0-90s
- Focus: Movement quality, core activation, injury-safe patterns
- Intensity: RPE 5-7

### Phase 2: Strength (Months 3-4)
- Sets: 3-5 | Reps: 6-12 | Tempo: 2/0/2 | Rest: 60-120s
- Focus: Progressive overload, compound lifts, sport-specific patterns
- Requires: Phase 1 completion + PT protocol criteria met

### Phase 3: Hypertrophy (Month 5+)
- Sets: 3-4 | Reps: 8-15 | Tempo: 2/0/2 | Rest: 60-90s
- Focus: Muscle development for physique competition
- Requires: Phase 2 completion + injury stability confirmed

---

## STRESS ADAPTATION TABLE

| Stress Level | Warm-up | Volume | Rest | Coaching Tone | Complexity |
|---|---|---|---|---|---|
| 1-3 (Low) | Standard | Full | Standard | Direct & focused | Full |
| 4-6 (Moderate) | +5 min | -20% | +15s | Supportive & patient | Standard |
| 7-10 (High) | +8 min | -40% | +30s | Gentle & encouraging | Simplified |

---

## WORKOUT LOCATION RULES

### Gym
- Full exercise selection available
- All machine and cable exercises included
- Trap bar, landmine, bench access assumed

### Home
- Bodyweight + resistance bands + dumbbells only
- Replace machine exercises with band/DB alternatives
- Replace cable exercises with band alternatives
- Replace trap bar deadlift with DB Romanian deadlift

### Outdoor
- Bodyweight + minimal equipment
- Focus on mobility, bodyweight strength, cardio
- Replace all machine/cable work with bodyweight alternatives
- Add walking/running options

---

## VOLUME REGULATION — NEVER VIOLATE

### Weekly Set Limits Per Muscle Group
- Beginner (Phase 1): 10-12 sets/muscle/week MAX
- Intermediate (Phase 2): 14-18 sets/muscle/week MAX
- Advanced (Phase 3+): 18-24 sets/muscle/week MAX

### Progressive Volume Rules
- Week 1-2: 1-2 sets per exercise ONLY (neural adaptation)
- Week 3-4: 2-3 sets per exercise
- Week 5+: Follow phase parameters
- NEVER increase volume >10% week-to-week
- Deload every 4th week (50% volume reduction)
- Extra time ≠ extra sets. Fill with mobility, cardio, foam rolling.

### Session Structure (Every Session Must Include)
1. Inhibit (foam roll overactive muscles)
2. Lengthen (stretch tight muscles)
3. Activate (isolated strengthening of underactive muscles)
4. Integrate (compound movements)
5. Cool down (static stretching ALL trained areas + trouble areas)

---

## REFERENCE DOCS
Read these files for detailed requirements:
- `docs/FEATURE_REQUIREMENTS_V2.md` — All feature specs with details
- `docs/ARCHITECTURE_DECISIONS.md` — Database, deployment, verification strategy
- `docs/V7_SPEC.md` — Original product specification

---

## FEATURES CHECKLIST

### ✅ Built
- [x] Home screen with workout card, stats, plan phases, daily minimums, injury protocols
- [x] Check-in flow (sleep, soreness, energy, stress with adaptation preview)
- [x] Train page with full exercise list by phase
- [x] Exercise screen with SVG illustrations, steps, form, mistakes, bracing, injury notes
- [x] Rest timer between sets
- [x] Mindfulness breaks between phases
- [x] Reflect screen (post-session ratings)
- [x] Recap screen with recovery protocol
- [x] AI Coach — Health mode (exercise science)
- [x] AI Coach — Mental Health mode (CBT, CTFAR, DBT, ACT)
- [x] Exercise Library with phase + body part filters
- [x] Bottom nav on all screens
- [x] Momentum modules on home

### ❌ Not Yet Built — Priority Order
- [ ] Exercise database (JSON file, 50+ exercises with full metadata)
- [ ] NASM initial assessment protocol (posture, movement screen, PAR-Q+)
- [ ] Goal selection: size vs strength per muscle group + compensatory muscle logic
- [ ] Transparency layer: show WHY each exercise was selected/excluded
- [ ] Quick-complete mode (checkbox on workout list for experienced users)
- [ ] Difficulty override: Standard / Push It / Full Send (with safety check)
- [ ] Persistent data storage (localStorage)
- [ ] Injury management: add, edit, remove injuries anytime
- [ ] Daily ROM + static stretching cooldown targeting trouble areas
- [ ] McKenzie protocol library (back, neck, hip, knee)
- [ ] Add-on exercises: foam rolling, extra PT, bodyweight fundamentals, sport-specific
- [ ] Volume regulation engine (sets per week, deload weeks, overtraining prevention)
- [ ] Post-session feedback that feeds into future plans
- [ ] Favorite exercises with progression roadmap
- [ ] Exercise plan review with alternative requests
- [ ] VO2 max tracking + cardio prescription
- [ ] Home page progress visuals (strength goals, VO2, phase timeline)
- [ ] Core movement patterns daily (push/pull/hinge/squat/carry)
- [ ] Long-term periodization tracking (phase progression)
- [ ] Return-to-Training engine (after breaks)
- [ ] Weekly coach report (Claude-generated narrative)
- [ ] Integrity score from task completion
- [ ] Task board with CTFAR coaching
- [ ] Sport bias layers (surfing, BJJ, muay thai, snowboarding, hiking)
- [ ] PT Protocol Scorecards with criteria-driven progression
- [ ] Weight history tracking per exercise
- [ ] Progressive overload recommendations
- [ ] Floor Session (minimum viable workout for bad days)
- [ ] Persona system (coaching tone by context)
- [ ] Multi-user support (Supabase auth + cloud DB)
