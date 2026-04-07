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
NEVER rewrite the entire file. Use targeted find-and-replace. If adding a feature, add it. Don't rebuild everything around it. Every prompt begins with "Read CLAUDE.md" — this file is the source of truth for all project rules.

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

### Rule 9: Supabase is Source of Truth — localStorage is Cache Only
- **NEVER store critical user data in localStorage alone** — it can be cleared by the browser, cache wipes, or the user-switching protection code
- All critical data MUST be synced to Supabase via `syncCriticalDataToSupabase()` from `src/utils/dataSync.js`
- Use `saveUserData` pattern: write to Supabase FIRST, then cache to localStorage
- On login/mount, `fullSyncCycle()` restores all critical data from Supabase → localStorage
- Critical data includes: injuries, preferences, baseline tests, power records, exercise effort, sport selections, finger health log, hypertrophy settings, HR settings
- Ephemeral data (paused workout, daily plan, rotation indices, last screen, stats) can stay localStorage-only
- When adding new data persistence: add the localStorage key to `CRITICAL_KEYS` in `src/utils/dataSync.js` if the data is user-created and not easily regenerated

### Rule 10: Preventing Recurring Bugs — Standards Checklist

#### 10A — Loading States (Never Show Zero During Load)
Any UI element showing a count or list of user data (conditions, injuries, sessions, streak, days done) must use null as the initial state — never an empty array or zero.

WRONG:
```
const [conditions, setConditions] = useState([])
// renders "0 active" before Supabase responds
```

RIGHT:
```
const [conditions, setConditions] = useState(null)
// renders "Loading..." until Supabase responds
// only renders "0 active" if Supabase confirms empty
```

Rule: show a loading skeleton or dash "—" while fetching. Only show 0 after Supabase confirms the actual count is 0.

#### 10B — React Hooks Ordering (Prevents Error #310)
ALL hooks must be declared unconditionally at the top of every component before any conditional logic, early returns, or JSX.

NEVER:
```
if (!user) return null          // early return
const [x, setX] = useState()   // hook after return — ILLEGAL

if (condition) {
  const [x, setX] = useState() // hook inside condition — ILLEGAL
}
```

ALWAYS:
```
const [x, setX] = useState(null)  // hooks first
const [y, setY] = useState(null)  // hooks first
if (!user) return null             // conditional after
```

For components needing per-item state (e.g. QA panel, profile list), use a single state object keyed by ID:

- WRONG: `profiles.map(p => useState())`
- RIGHT: `const [results, setResults] = useState({})`

Never extract a sub-component just to use hooks conditionally — this masks the violation. Flatten first, extract only after it works.

#### 10C — Active Workout Protection
When any preference that affects workout generation changes (session time, location, conditions, injuries, phase), always check for an in-progress session first:

- If workoutInProgress === true:
  - Write preference change to Supabase
  - Set pendingPlanRebuild = true in localStorage
  - Do NOT rebuild or overwrite the active plan
  - After session ends: detect flag, rebuild silently

- If no workout in progress:
  - Write preference to Supabase
  - Rebuild plan immediately
  - Clear any stale cached plan

#### 10D — Plan Staleness Prevention
Every stored workout plan must be saved with the parameters used to generate it:

```
stored_plan: {
  exercises: [...],
  generated_with: {
    sessionTime,
    location,
    phase,
    conditionIds,
    injuryIds,
    generatedAt
  }
}
```

On app load: compare generated_with against current user preferences. If any value differs, discard and regenerate before displaying. Never show a plan built with stale parameters.

#### 10E — New Screen Checklist
Before shipping any new screen that reads or writes user data, verify all of these:

- [ ] Initial state uses null (not [] or 0) for loaded data
- [ ] Shows loading state while Supabase fetch is in flight
- [ ] All hooks declared unconditionally at component top
- [ ] Data reads from Supabase on mount (not localStorage)
- [ ] Writes go to Supabase FIRST, then localStorage cache
- [ ] Count displays show — not 0 during loading
- [ ] Tested on fresh login with no localStorage present
- [ ] Tested on a second device after saving on first
- [ ] Tested after a preference change mid-session

#### 10F — Swap Button UI Rule
Exercise swap/substitute actions must NEVER render as inline icon + muscle name label on workout list cards.

This pattern is banned on list cards:
```
[Gastrocnemius] [🔄]   ← broken, cluttered, confusing
```

Allowed patterns:
1. Three-dot menu (⋯) on the card → opens action sheet with [Swap this exercise] and [View details]
2. [Swap Exercise] button inside the exercise detail screen only

Muscle names and target labels belong in the exercise detail screen — never on the list card.

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

## WORKOUT GENERATION — NEVER VIOLATE

These rules govern how the app selects exercises for any user's session. They apply to EVERY profile, EVERY phase, EVERY account. If any code change touches workout generation, verify these rules still hold.

### Rule 11: Movement Pattern Coverage

Every main workout (Phase D: Integrate) must include at least ONE exercise from each fundamental pattern:
- **Push** (horizontal or vertical)
- **Pull** (horizontal or vertical)
- **Hinge** (deadlift, RDL, hip thrust, glute bridge)
- **Squat** (bilateral or unilateral)
- **Core** (anti-rotation, anti-extension, anti-flexion)

Fill these 5 required slots FIRST, then fill remaining slots with goal-driven picks. If a pattern has zero safe exercises available (due to injury/equipment filters), log the gap — do not fill it with a random exercise from another pattern.

**Exceptions:** Wheelchair users may skip hinge/squat. Bed-bound users may skip most patterns. Post-surgical acute patients use breathing + ROM only.

### Rule 12: Movement Pattern Concentration Limit

**HARD LIMIT: Maximum 2 exercises from any single movementPattern per session.**

This means NEVER 3 anti-rotation exercises. NEVER 3 push exercises. NEVER 3 squats. If the engine selects a 3rd exercise from the same pattern, it must be replaced with the highest-scoring exercise from the most underrepresented pattern.

### Rule 13: Progression Chain Deduplication

**Maximum 1 exercise per chainFamily per session.**

Pallof Press (Tall Kneeling), Pallof Press (Standing), and Pallof Press (Split Stance) are all from `core_anti_rotation_chain`. Only the most advanced version the user has earned should appear. Never include multiple exercises from the same progression chain in one session.

### Rule 14: Phase-Appropriate Exercise Selection

The exercise pool must be weighted by phase. Stabilization exercises dominate Phase 1 but should be deprioritized in Phase 3+. Compound strength exercises dominate Phase 3-4. Power/plyometrics dominate Phase 5.

**Phase weight guidelines:**

| Exercise Type | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 |
|---|---|---|---|---|---|
| Stabilization | HIGH | Medium | LOW | LOW | LOW |
| Compound strength | LOW | HIGH | HIGHEST | HIGHEST | HIGH |
| Isolation | LOW | Medium | HIGH | Medium | LOW |
| Plyometric | BLOCKED | LOW | Medium | Medium | HIGHEST |

**Phase 3 minimum:** At least 3 compound strength exercises per session. If a Phase 3 session has fewer than 3 compounds, the engine is broken.

### Rule 15: Profile Differentiation

Different user profiles must produce meaningfully different exercise selections. If a bodybuilder and a rock climber get the same 8 exercises, the engine is not differentiating.

Target: less than 50% exercise overlap between different sport profiles at the same phase.

### Rule 16: Workout Validation Is Mandatory

Every generated workout MUST pass validation before being served to the user. The validator checks: movement pattern coverage, pattern concentration limit, chain family uniqueness, phase-appropriate compound ratio, no duplicate exercises, body part distribution (max 3 per body part).

**Never serve an unvalidated session.** Never silently serve a session that fails validation.

### Rule 17: Recency-Aware Selection

Do not repeat the same exercises in consecutive sessions unless they are mandatory (rehab/PT exercises, McKenzie protocol, daily minimums). Apply a recency penalty: exercise used yesterday scores × 0.2, exercise used 2 sessions ago scores × 0.6.

---

## WELLNESS SYSTEM — NEVER VIOLATE

### Rule 18: Wellness Technique Progression

Every wellness technique must be completable end-to-end. Two player modes exist:
- **Timer mode:** For breathing exercises — auto-advances on countdown
- **Step mode:** For guided techniques (grounding, STOP, TIPP, DEAR MAN, etc.) — requires a visible, tappable "Next →" button to advance between steps

If a technique has no way for the user to reach the completion screen, it is broken.

---

## REFERENCE DOCS
Read these files for detailed requirements:
- `docs/FEATURE_REQUIREMENTS_V2.md` — All feature specs with details
- `docs/ARCHITECTURE_DECISIONS.md` — Database, deployment, verification strategy
- `docs/V7_SPEC.md` — Original product specification
- `src/utils/workoutValidator.js` — Validation rules for generated sessions

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

### ❌ Not Yet Built / ✅ Now Built — Priority Order
- [x] Exercise database (JSON file, 472 exercises with full metadata) ✅ BUILT
- [x] NASM initial assessment protocol (posture, movement screen, PAR-Q+) ✅ BUILT — 14-screen assessment
- [x] Goal selection: size vs strength per muscle group + compensatory muscle logic ✅ BUILT
- [x] Transparency layer: show WHY each exercise was selected/excluded ✅ BUILT — _reason field on every exercise
- [x] Quick-complete mode (checkbox on workout list for experienced users) ✅ BUILT
- [x] Difficulty override: Standard / Push It / Full Send (with safety check) ✅ BUILT
- [x] Persistent data storage (Supabase + localStorage cache) ✅ BUILT
- [x] Injury management: add, edit, remove injuries anytime ✅ BUILT — InjuryManager component
- [x] Daily ROM + static stretching cooldown targeting trouble areas ✅ BUILT — 5-tier ROM system
- [x] McKenzie protocol library (back, neck, hip, knee) ✅ BUILT
- [x] Add-on exercises: foam rolling, extra PT, bodyweight fundamentals, sport-specific ✅ BUILT
- [x] Volume regulation engine (sets per week, deload weeks, overtraining prevention) ✅ BUILT
- [x] Post-session feedback that feeds into future plans ✅ BUILT — analyzeFeedback in mesocycle
- [x] Favorite exercises with progression roadmap ✅ BUILT
- [x] Exercise plan review with alternative requests ✅ BUILT — swap modal
- [x] VO2 max tracking + cardio prescription ✅ BUILT
- [x] Home page progress visuals (Power Rings, stats, volume chart) ✅ BUILT
- [x] Core movement patterns daily (push/pull/hinge/squat/carry) ✅ BUILT — pattern-slot selection
- [x] Long-term periodization tracking (phase progression) ✅ BUILT — continuous cycling + mesocycles
- [x] Return-to-Training engine (after breaks) ✅ BUILT — detraining protocol
- [ ] Weekly coach report (Claude-generated narrative) — NOT YET
- [ ] Integrity score from task completion — NOT YET
- [ ] Task board with CTFAR coaching — REMOVED from nav (deprioritized)
- [x] Sport bias layers (surfing, BJJ, muay thai, snowboarding, hiking, climbing) ✅ BUILT — PES sport system
- [x] PT Protocol Scorecards with criteria-driven progression ✅ BUILT — PTSystem component
- [x] Weight history tracking per exercise ✅ BUILT — exercise effort map
- [x] Progressive overload recommendations ✅ BUILT — load enrichment
- [x] Floor Session (minimum viable workout for bad days) ✅ BUILT
- [ ] Persona system (coaching tone by context) — NOT YET
- [x] Multi-user support (Supabase auth + cloud DB) ✅ BUILT
- [x] Wellness module (breathing, mindfulness, DBT/ACT skills, sleep) ✅ BUILT
- [x] Senior fitness system (fall risk, balance training, age-adapted) ✅ BUILT
- [x] Weight/body composition tracking with goals ✅ BUILT
- [x] Data export (profile + workout JSON/markdown) ✅ BUILT
- [x] Bug reporting system (Supabase-backed) ✅ BUILT
- [x] Plan quality validation (14 automated checks) ✅ BUILT
- [x] Developer testing dashboard (8 simulated profiles) ✅ BUILT
- [x] Celebration/reinforcement system (confetti + milestones) ✅ BUILT
- [x] Power Rings detraining visualization ✅ BUILT
