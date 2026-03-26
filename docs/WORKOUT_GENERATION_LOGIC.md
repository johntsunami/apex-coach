# Workout Generation Engine — The Brain of APEX Coach
## This is the algorithm that selects exercises and builds each user's plan

---

## WHEN THIS RUNS

1. **Initial Plan** — After the intake assessment completes (first time user)
2. **Daily Recalculation** — After every check-in, using today's readiness data
3. **On-Demand** — When user changes injuries, goals, equipment, or preferences

---

## INPUTS (data the engine needs)

### From Intake Assessment (one-time, stored in profile)
- PAR-Q+ health screening results
- Active conditions/injuries (from CONDITIONS_MASTER_INDEX — each with severity 1-5)
- Movement screen results (overhead squat compensations identified)
- ROM assessment results (which joints are limited)
- Fitness level (beginner/intermediate/advanced)
- Goals per muscle group (size vs strength)
- Equipment available (what they own at home)
- Training frequency (days per week available)
- Session time available (30/45/60/90 min)
- Favorite exercises (with readiness check)
- Sport interests (BJJ, surfing, etc.)

### From Daily Check-In (recalculated each session)
- Location (gym/home/outdoor)
- Sleep quality (1-10)
- Soreness areas (body part list)
- Energy level (1-10)
- Stress level (1-10)
- "Having a flare today?" (yes/no — for chronic conditions)

### From History (accumulated over time)
- Sessions completed (total count)
- Current phase (1-5)
- Current week within phase
- Capability tags earned
- Exercises mastered (pain-free 3+ sessions)
- Weekly volume per muscle group (running total)
- Feedback from last session (loved/hated exercises, pain flags)
- Deload status (is this a deload week?)
- Overtraining monitor flags

---

## STEP-BY-STEP ALGORITHM

### Step 1: Calculate Readiness Scores
```
RTT = (sleep × 0.30) + (soreness_inv × 0.20) + (energy × 0.20) + (stress_inv × 0.15) + (nutrition × 0.15) × 10
CTP = RTT - (sum of injury_severity × 5 for each active injury)
CTP floor = 20, ceiling = 100

Safety Level:
  ≥70 = CLEAR (green) — full training
  ≥50 = CAUTION (yellow) — modified
  ≥30 = RESTRICTED (orange) — limited
  <30 = STOP (red) — rest day
```

### Step 2: Determine Today's Parameters
```
Based on Safety Level + Phase:

CLEAR → use full phase parameters
CAUTION → reduce volume 20%, add 15s rest, extend warm-up 5 min
RESTRICTED → reduce volume 40%, add 30s rest, extend warm-up 8 min, simplify exercises
STOP → prescribe: breathing exercises, gentle ROM, walking only. Show recovery protocol.

Based on Stress Level:
  1-3 → standard coaching tone, full complexity
  4-6 → supportive tone, -20% volume, +15s rest
  7-10 → gentle tone, -40% volume, +30s rest, simplified exercises

Based on Deload Week (every 4th week):
  → reduce all volume 50%, maintain exercise selection, reduce intensity to RPE 5
```

### Step 3: Filter Exercise Pool
Start with ALL 300 exercises. Apply filters in this order:

```
Filter 1: PHASE ELIGIBILITY
  → Remove exercises not eligible for current phase
  → Example: Phase 1 user can't access Phase 3+ exercises

Filter 2: LOCATION
  → Remove exercises incompatible with today's location
  → Gym: full pool
  → Home: only exercises with equipmentRequired ⊆ user's home equipment
  → Outdoor: only exercises with locationCompatible includes "outdoor"

Filter 3: INJURY CONTRAINDICATIONS
  → For each active injury, check every exercise's contraindications.severity_gate
  → If user's injury severity EXCEEDS the gate, BLOCK the exercise
  → Log: "[Exercise] blocked — [injury] severity [X] exceeds gate [Y]"

Filter 4: CONDITION PROTOCOLS
  → For each active condition in user's profile, look up CONDITIONS_MASTER_INDEX
  → ADD all exercises from "recommended" list
  → REMOVE all exercises from "avoid" list
  → If "mandatory_daily" exists, FORCE those into every session

Filter 5: COMPENSATION CORRECTIONS
  → For each compensation identified in movement screen, look up COMPENSATIONS index
  → ADD foam roll targets to warm-up
  → ADD stretch targets to warm-up
  → ADD activation exercises
  → These are NON-NEGOTIABLE — they fix the root cause

Filter 6: PREREQUISITES
  → For each remaining exercise, check prerequisites:
    - minCompletedSessions: user must have enough sessions
    - requiredExercisesMastered: referenced exercises must be in user's mastered list
    - requiredCapabilities: user must have earned the capability tag
    - minPhase: must be at or above this phase
    - maxInjurySeverity: each injury must be at or below the gate
    - painFreeROM: user must have the required ROM
  → If ANY prerequisite fails, BLOCK the exercise
  → If blocked AND user favorited it, show progression roadmap instead

Filter 7: ABILITY LEVEL
  → If user is wheelchair-bound: only abilityLevel includes "wheelchair_accessible" or "seated_only"
  → If user is bed-bound: only abilityLevel includes "bed_bound" or "supine_only"
  → If user can stand: full pool (minus above filters)

Filter 8: WEEKLY VOLUME CHECK
  → Check running weekly volume per muscle group
  → If adding an exercise would push a muscle group over the weekly limit:
    Phase 1: 10-12 sets/muscle/week
    Phase 2: 14-18 sets/muscle/week
    Phase 3+: 18-24 sets/muscle/week
  → SKIP the exercise, log why, suggest mobility/cardio alternative
  → NEVER exceed volume limits even if user has extra time
```

### Step 4: Build Session Structure (CEx Continuum)
Every session follows this exact order:

```
PHASE A: INHIBIT (Foam Rolling) — 5-8 min
  → Select 3-5 foam rolling exercises targeting:
    1. Overactive muscles from compensation screen
    2. Muscles trained yesterday (recovery)
    3. Sore areas reported in check-in
  → 30 seconds per area, 1 set each

PHASE B: LENGTHEN (Stretching/Mobility) — 5-8 min
  → Select 3-5 stretches/mobility exercises targeting:
    1. Tight muscles from compensation screen
    2. ROM restrictions from assessment
    3. Dynamic stretches for today's movement patterns
  → Phase 1: static stretches 30s hold
  → Phase 2+: active/dynamic stretches

PHASE C: ACTIVATE (Isolated Strengthening) — 5-8 min
  → Select 2-4 activation exercises targeting:
    1. Underactive muscles from compensation screen
    2. Injury protocol mandatory exercises (e.g., VMO for knee, ER for shoulder)
    3. PT exercises for active conditions
  → 1-2 sets, 10-15 reps, controlled tempo

PHASE D: INTEGRATE (Main Workout) — 20-35 min
  → Select 4-8 compound/main exercises ensuring:
    1. At least ONE of each fundamental pattern:
       - Push (horizontal or vertical)
       - Pull (horizontal or vertical)
       - Hinge
       - Squat (bilateral or unilateral)
       - Core/Anti-movement
    2. Movement pattern coverage — don't double up unless goal-specific
    3. Muscle group balance — match user's size/strength goals
    4. Apply phase-appropriate parameters:
       Phase 1: 1-3 sets, 12-20 reps, 4/2/1 tempo, 0-90s rest
       Phase 2: 2-4 sets, 8-12 reps, 2/0/2 tempo, 0-60s rest
       Phase 3: 3-5 sets, 6-12 reps, 2/0/2 tempo, 0-60s rest
    5. Week 1-2: MAX 1-2 sets per exercise (neural adaptation)
    6. Week 3-4: MAX 2-3 sets per exercise
    7. Prioritize user's favorited exercises (if they pass safety checks)
    8. Deprioritize exercises user flagged as disliked (substitute)

PHASE E: COOLDOWN (Static Stretching + Optional) — 8-15 min
  → MANDATORY static stretches for ALL muscles trained today (30s each)
  → EXTRA time on:
    1. Sore areas from check-in
    2. Injury-affected areas
    3. Chronically tight areas from assessment
  → OPTIONAL add-ons (user selects):
    - McKenzie protocol (back/neck)
    - Additional foam rolling
    - Extra PT exercises
    - Breathing/relaxation
```

### Step 5: Apply Substitutions
```
For each exercise selected in Step 4:
  → If user is at home AND exercise requires gym equipment:
    → Check substitutions.home — use that exercise instead
    → If no home sub, find same movementPattern + bodyPart that's home-compatible
    → If nothing works, skip and log

  → If user is outdoors AND exercise requires equipment:
    → Check substitutions.outdoor
    → Same fallback logic

  → If exercise was flagged with pain in last session:
    → Check substitutions.injury_[type]
    → Use safer alternative
    → Show user: "Swapped [X] for [Y] because you reported pain last time"

  → NEVER substitute silently — always explain
```

### Step 6: Apply Progressive Overload
```
For returning users (session 2+):
  → Compare today's exercise parameters to last session's
  → If user completed all sets/reps pain-free last time:
    → Increase ONE variable (following NASM progression rules):
      - First: increase reps (within phase range)
      - Then: increase sets (within phase range)
      - Then: increase load (2-5% upper body, 5-10% lower body)
      - Then: decrease rest (within phase range)
      - Then: increase complexity (progress to next in chain)
    → NEVER increase more than one variable at once
    → NEVER increase volume >10% week-to-week

  → If user reported pain or difficulty last time:
    → Maintain or regress current parameters
    → If pain persists 3+ sessions: regress to previous exercise in chain
```

### Step 7: Calculate Session Metrics
```
Total exercises: count
Estimated duration: sum of (sets × reps × tempo) + (rest × sets) + transitions
Total volume: sum of sets per muscle group
Movement patterns covered: list
Safety level: from Step 1
Adaptations applied: list of every modification and why
```

### Step 8: Generate Transparency Report
```
Show the user BEFORE the workout starts:

"Today's Plan — Built For You"

📊 Your Readiness: RTT [score], CTP [score] → [SAFETY LEVEL]
🏋️ Location: [Gym/Home/Outdoor]
📅 Phase [X], Week [Y] — [phase description]

Factors Considered:
  ✓ Sleep: [quality] → [impact]
  ✓ Soreness: [areas] → [adjustments]
  ✓ Stress: [level] → [volume/tone changes]
  ✓ Injuries: [list] → [X exercises blocked, Y modified]
  ✓ Last session feedback: [incorporated changes]

Your Exercises (X total, ~Y minutes):
  [Each exercise with one-line WHY it was chosen]

Excluded:
  [Each excluded exercise with reason]

[Standard] [Push It] [Full Send] ← difficulty selector
[Looks good — let's go →] button
```

---

## LONG-TERM PLAN GENERATION (Weekly/Monthly)

### Weekly Split Logic
```
Based on training frequency:
  2 days/week: Full body each day
  3 days/week: Full body or Push-Pull-Legs
  4 days/week: Upper-Lower split
  5 days/week: Push-Pull-Legs-Upper-Lower
  6 days/week: PPL × 2

Each day must still include:
  → CEx warm-up (inhibit, lengthen, activate)
  → Core work
  → Injury protocol exercises
  → Cooldown stretching

Weekly volume distributed across sessions:
  → Track total sets per muscle group
  → Distribute evenly across training days
  → Don't front-load volume early in the week
```

### Phase Progression Criteria
```
Phase 1 → Phase 2 (after 4-8 weeks):
  ✓ Can perform all exercises with proper form (assessed via feedback)
  ✓ No pain increases over last 2 weeks
  ✓ Core stability basic capability earned
  ✓ All injury severities stable or improving
  ✓ Completed minimum 8 sessions

Phase 2 → Phase 3 (after 4-8 weeks):
  ✓ Strength endurance metrics met
  ✓ Hip hinge competent capability earned
  ✓ Barbell competent capability earned (if applicable)
  ✓ All injury severities ≤2
  ✓ No compensation patterns in overhead squat retest

Phase 3 → Phase 4/5 (after 4-8 weeks):
  ✓ Sport-specific goals defined
  ✓ Heavy loading ready capability earned
  ✓ Medical clearance for high intensity (if applicable)
```

### Compensatory Muscle Logic
```
When user selects SIZE or STRENGTH goals per muscle group:

If user wants CHEST size:
  → Program chest exercises (bench, press, fly)
  → ALSO program: rear delts (face pulls), external rotators, thoracic mobility
  → WHY: prevents shoulder impingement from pressing dominance
  → Show: "We've added face pulls to protect your shoulders while building chest"

If user wants QUAD strength:
  → Program quad exercises (squats, leg press)
  → ALSO program: hamstring strength, glute activation, hip mobility
  → WHY: maintains safe quad:hamstring ratio (should be ~60:40)
  → Show: "Hamstring curls added — strong hamstrings protect your knees"

If user wants ARM size:
  → Program arm exercises (curls, extensions)
  → ALSO program: wrist/forearm work, elbow mobility
  → WHY: prevents elbow tendinopathy from heavy curls
  → Show: "Wrist work included to keep your elbows healthy as you load up"

General rule: For every muscle the user wants to grow, program its:
  1. Antagonist (opposite muscle)
  2. Stabilizers (joint protectors)
  3. Mobility for the associated joints
```

---

## FLARE DAY PROTOCOL

When user selects "I'm having a flare today":
```
1. Immediately reduce to minimum viable session
2. Remove ALL loaded exercises
3. Keep: breathing exercises, gentle ROM, walking
4. Add: condition-specific flare exercises from CONDITIONS index
5. Show: "Flare day — we're protecting you. Gentle movement only."
6. Duration: 15-20 min max
7. Post-session: "How did that feel? Better/Same/Worse"
8. If WORSE: suggest rest day tomorrow + refer out if 3+ consecutive flare days
```

---

## FLOOR SESSION (Minimum Viable Workout)

For days when everything is bad (low energy, high stress, pain):
```
10-15 minutes total:
  1. Diaphragmatic breathing (2 min)
  2. Gentle cat-cow (2 min)
  3. Supine pelvic tilts (2 min)
  4. Glute bridges or glute sets (2 min)
  5. Walking (5 min)
  6. Child's pose (2 min)

Message: "Showing up IS the workout today. This counts."
Track as completed session. Maintain streak.
```

---

## DAILY FEEDBACK LOOP — How Yesterday Changes Tomorrow

### Data Collected After Each Session (Reflect Screen)
```
1. Difficulty rating (1-10)
2. Pain rating (1-10)
3. Enjoyment rating (1-10)
4. Form confidence rating (1-10)
5. Starred exercises (loved these)
6. Flagged exercises (didn't like / problematic)
7. Pain-flagged exercises (specific exercise caused pain)
8. Free-text notes ("shoulder felt weird during presses")
9. Overall: "Too easy" / "Just right" / "Too hard"
```

### How Each Data Point Modifies the NEXT Session

```
DIFFICULTY RATING:
  1-3 (too easy) for 2+ consecutive sessions:
    → Increase volume: add 1 set per main exercise
    → Or progress to next exercise in chain
    → Show: "You've been crushing it — stepping it up today"

  4-7 (appropriate):
    → Maintain current parameters
    → Apply normal progressive overload (Step 6)

  8-10 (too hard) for 2+ consecutive sessions:
    → Decrease volume: remove 1 set per main exercise
    → Or increase rest periods 15-30s
    → Check: is this overtraining? (trigger overtraining monitor)
    → Show: "Dialing it back slightly — recovery is where you grow"

PAIN RATING:
  1-3 (minimal):
    → Continue normally
    → Log as positive trend

  4-6 (moderate):
    → Review which exercises were done
    → Cross-reference with injury profile
    → Next session: swap any exercises targeting the painful area with gentler alternatives
    → Show: "Noticed some discomfort last time — adjusting today's plan"

  7-10 (significant):
    → IMMEDIATE flag on home screen: "Pain was high last session"
    → Next session: reduce volume 30%, remove exercises for affected area
    → If 2+ sessions at 7+: trigger STOP safety escalation
    → Show: "Your pain level concerns me. If this continues, please see your PT."
    → Refer out if 3 consecutive sessions at 7+

ENJOYMENT RATING:
  1-3 (low enjoyment) for 3+ sessions:
    → Swap 1-2 exercises for different options targeting same muscles
    → Prioritize any starred favorites that are safe
    → Show: "Freshening up your routine — variety keeps you coming back"

  7-10 (high enjoyment):
    → Keep current exercise selection stable
    → These exercises become "preferred" in the database for this user

STARRED EXERCISES (loved):
  → Tag exercise as "user_favorite" in profile
  → Prioritize including in future sessions (if safe + passes filters)
  → If exercise is in a progression chain, track progress toward next level
  → Never remove a starred exercise without asking

FLAGGED EXERCISES (didn't like):
  → Tag exercise as "user_disliked" in profile
  → Substitute with alternative from same movementPattern + bodyPart
  → Show: "Swapped [X] for [Y] based on your feedback"
  → Don't include flagged exercise for 4+ weeks
  → After 4 weeks, can ask: "Want to try [X] again?"

PAIN-FLAGGED EXERCISES (caused pain):
  → CRITICAL — tag exercise as "pain_trigger" for this user
  → Cross-reference with injury profile:
    - Is this expected given their condition? Log and monitor.
    - Is this NEW pain in an area without a known injury? Escalate.
  → Next session: replace with regression from same chain
  → If regression also causes pain: skip entire chain, refer out
  → Show: "[X] caused pain last time. Using [Y] instead — it's gentler on your [area]."
  → Track pain-flagged exercises over time:
    - Same exercise flagged 3x → permanently remove, suggest PT evaluation
    - Multiple exercises for same body part flagged → trigger injury assessment

FREE-TEXT NOTES:
  → Parse for key signals:
    - "pain", "hurt", "sharp", "tingling", "numb" → trigger pain protocol
    - "easy", "boring", "not challenging" → flag for progression
    - "loved", "favorite", "great" → boost exercise priority
    - Specific body part mentioned → cross-reference with injury profile
  → Store all notes for AI Coach context (can reference in conversations)
  → Flag for user review if concerning pattern emerges

"TOO EASY" / "JUST RIGHT" / "TOO HARD":
  Too Easy:
    → If also difficulty 1-3: definitely progress
    → Options (apply ONE per session):
      1. Progress 1-2 exercises to next in chain
      2. Add 1 set to main exercises
      3. Reduce rest by 15s
      4. Increase load 2-5%
    → Show: "Leveling up based on your feedback"

  Just Right:
    → Maintain. Apply standard progressive overload only.

  Too Hard:
    → If also difficulty 8-10: definitely regress
    → Options (apply ONE per session):
      1. Regress 1-2 exercises to previous in chain
      2. Remove 1 set from main exercises
      3. Add 15-30s rest
      4. Reduce load 5-10%
    → Show: "Adjusted for better recovery — we'll build back up"
```

### Trend Analysis (Weekly Review)

```
Every 7 days, the engine reviews the last 7 sessions:

IMPROVING TREND (3+ sessions showing improvement):
  → Energy scores rising
  → Pain scores stable or dropping
  → Difficulty moving from "too hard" toward "just right"
  → Enjoyment stable or rising
  → Action: Continue current trajectory. Consider phase progression if criteria met.
  → Home screen: "Great week — you're trending up 📈"

PLATEAU (no change for 2+ weeks):
  → Difficulty consistently "just right" but no progression
  → Same exercises, same loads, same feedback
  → Action: Introduce variation — new exercises from same pattern, adjust rep ranges
  → Home screen: "Time to mix it up — introducing new challenges this week"

DECLINING TREND (3+ sessions showing decline):
  → Energy dropping
  → Pain increasing
  → Difficulty shifting to "too hard"
  → Enjoyment dropping
  → Action: AUTO-SUGGEST DELOAD WEEK
  → Home screen: "⚠️ Your body needs recovery. Recommending a deload week."
  → If user declines deload: reduce volume 20% anyway and flag
  → If declining for 2+ consecutive weeks: STOP safety level + refer out

INCONSISTENCY (sporadic attendance):
  → Large gaps between sessions (3+ days between planned sessions)
  → Action: Activate Return-to-Training protocol
  → Reduce volume to Week 1 levels for first session back
  → Show: "Welcome back! Starting easy to get you rolling again."
  → Rebuild over 1-2 sessions, not immediate return to prior levels
```

### What Gets Stored (Feedback Database)

```
Per session, store:
{
  "session_id": "unique",
  "date": "ISO date",
  "exercises_completed": [{ "exercise_id", "sets_done", "reps_done", "load", "pain_during": bool }],
  "exercises_skipped": [{ "exercise_id", "reason" }],
  "readiness": { "RTT", "CTP", "safety_level" },
  "check_in": { "sleep", "soreness_areas", "energy", "stress", "location" },
  "reflection": { "difficulty", "pain", "enjoyment", "form_confidence" },
  "starred": ["exercise_ids"],
  "flagged": ["exercise_ids"],
  "pain_flagged": [{ "exercise_id", "body_area", "severity" }],
  "notes": "free text",
  "overall": "too_easy | just_right | too_hard",
  "duration_minutes": number,
  "total_volume": { "chest": sets, "back": sets, ... }
}

This data feeds into:
  → Next session generation (immediate)
  → Weekly trend analysis (every 7 days)
  → Phase progression checks (every 4 weeks)
  → Overtraining monitor (continuous)
  → AI Coach context (available in conversations)
  → Long-term progress tracking (dashboard)
```
