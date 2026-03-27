# PT Protocol System — Separate from but Integrated with Main Workouts

## THE PROBLEM
Physical therapy exercises aren't like gym exercises. PT protocols often need:
- Multiple sessions per day (McKenzie press-ups every 2 hours, knee ROM 3x/day)
- Different frequency than workouts (PT is daily or multi-daily, workouts are 3-5x/week)
- Independent progress tracking (PT progress is about pain reduction and ROM gains, not sets/reps/weight)
- Clear timelines with expected outcomes per phase
- Reminders throughout the day
- Graduation criteria (when to progress to next PT phase, when to stop PT)

## WHERE IT LIVES IN THE APP
- **Home Page**: "My Therapy Protocols" card showing active protocols with daily completion status
- **Dedicated "Therapy" tab or section**: Accessible from Home, separate from Train
- **Notifications/Reminders**: Push reminders throughout the day
- **Progress Dashboard**: Timeline showing where they are in each protocol
- **Integration with Training**: Main workout references PT progress ("Your back ROM improved 15° — unlocking seated cable row this week")

## WHAT THE USER SEES AFTER ASSESSMENT

### Post-Assessment Plan Overview (enhance existing)
After assessment, before Home, show a comprehensive plan that includes:

**Section: "Your Training Program — What to Expect"**
For each 6-week block, show specific expected outcomes:

Week 1-2 (Neural Adaptation):
- "Your body is learning new movement patterns"
- "Expect: slight soreness, improving form, building mind-muscle connection"
- "Sets are intentionally low (1-2 per exercise) — this protects your joints while your nervous system adapts"
- "Strength gains: 10-15% from neural efficiency alone (not muscle growth yet)"
- "Stability improvement: core activation patterns establishing"

Week 3-4 (Foundation Building):
- "Movement quality improving — you'll notice exercises feeling more natural"
- "Volume increases to 2-3 sets — your connective tissue is ready"
- "Expect: less soreness between sessions, better balance, improved confidence"
- "Injury prevention: stabilizer muscles engaging properly now"

Week 5-6 (Phase 1 Completion):
- "Testing readiness for Phase 2"
- "Expected outcomes by end of Phase 1:"
  - "Core endurance: hold plank 30+ seconds"
  - "Hip hinge: proper form with bodyweight → light load"
  - "Balance: single-leg stance 20+ seconds"
  - "Pain levels: stable or improved vs Week 1"
  - "ROM: measurable improvement in limited areas"

Week 7-12 (Phase 2 — Strength):
- "Progressive loading begins — weights increase systematically"
- "Expected: noticeable strength gains, muscle definition starting"
- "Compound lifts introduced (trap bar deadlift, DB bench, rows)"
- "Stability from Phase 1 protects you during heavier work"

Week 13-24 (Phase 3 — Development):
- "Hypertrophy-focused training for your size goals"
- "Expected: visible muscle growth, significant strength increases"
- "Sport-specific work begins (BJJ mobility, surfing balance)"

**Section: "Your Physical Therapy Plan"**
For EACH active condition, show a dedicated PT protocol:

Example for Lower Back (Post-Surgical, Severity 3):
```
PROTOCOL: Lumbar Spine Rehabilitation
Duration: 12-24 weeks (adapts based on your progress)
Current Phase: Phase 1 of 4

Daily Requirements:
  Morning: McKenzie press-ups (10 reps) + diaphragmatic breathing (3 min)
  Midday: Standing extension (10 reps) + walking (10 min)
  Evening: McGill Big 3 (curl-up, side plank, bird dog) + gentle stretching

Frequency: 3x per day, 10-15 min each session
Main workout integration: PT exercises included in your warm-up/cooldown automatically

Expected Timeline:
  Weeks 1-4: Pain management, basic movement restoration
  - Goal: Pain ≤4/10 during daily activities
  - Milestone: Full McKenzie sequence tolerated
  
  Weeks 5-8: Core stability foundation
  - Goal: Plank hold 30s, bird dog with control
  - Milestone: McGill Big 3 mastered pain-free
  
  Weeks 9-12: Functional loading
  - Goal: Glute bridge with resistance, trap bar deadlift intro
  - Milestone: Daily activities pain-free
  
  Weeks 13-24: Progressive strengthening
  - Goal: Return to full training with permanent awareness
  - Milestone: Loaded hip hinge pattern established

Graduation Criteria (when PT protocol reduces):
  ✓ Pain consistently ≤2/10 for 2 weeks
  ✓ Full ROM restored vs baseline
  ✓ Core stability tests passed
  ✓ No flare-ups in last 4 weeks
  ✓ Cleared by PT/physician (self-reported)
```

**Section: "How Often You'll Train"**
- Main workouts: [X] days/week, [Y] minutes each
- PT mini-sessions: [X] times per day, 10-15 min each
- Active recovery days: gentle walking + stretching
- Full rest days: [X] per week

**Section: "How We Verify This Plan is Right"**
- "Every exercise was selected from a database of 300 evidence-based movements"
- "Each exercise was checked against your [X] active conditions — [Y] exercises were blocked for your safety"
- "Your compensatory muscle work was auto-calculated based on your movement screen"
- "This plan follows NASM Optimum Performance Training protocols, McKenzie Method guidelines, and current physical therapy evidence"
- "The plan recalculates daily based on your feedback, pain levels, and progress"
- "If anything feels wrong — tell us. The app adapts immediately."

---

## PT MINI-SESSION SYSTEM

### Data Structure (add to Supabase)

Table: pt_protocols
```sql
- id (uuid, primary key)
- user_id (uuid, references profiles)
- condition_key (text — links to conditions.json)
- protocol_name (text — e.g., "Lumbar Spine Rehabilitation")
- current_phase (integer — 1-4)
- phase_started_at (timestamptz)
- exercises (jsonb — array of exercise IDs for current phase)
- frequency_per_day (integer — how many times per day)
- session_duration_minutes (integer)
- graduation_criteria (jsonb — checklist of criteria to advance)
- created_at (timestamptz)
- graduated_at (timestamptz, nullable — when protocol completed)
```

Table: pt_sessions
```sql
- id (uuid, primary key)
- user_id (uuid, references profiles)
- protocol_id (uuid, references pt_protocols)
- session_type (text — "morning" / "midday" / "evening" / "as_needed")
- exercises_completed (jsonb)
- pain_before (integer, 1-10)
- pain_after (integer, 1-10)
- rom_measurement (jsonb, nullable — for protocols tracking ROM)
- notes (text)
- completed_at (timestamptz)
```

Table: pt_reminders
```sql
- id (uuid, primary key)
- user_id (uuid, references profiles)
- protocol_id (uuid, references pt_protocols)
- reminder_time (time — e.g., "08:00", "13:00", "20:00")
- enabled (boolean, default true)
- last_sent (timestamptz)
```

### PT Mini-Session Flow
When user taps a PT reminder or "Start Therapy Session" on Home:

1. Show which protocol this session is for: "Lumbar Spine — Midday Session"
2. Show pain check: "Rate your pain right now (1-10)" — slider
3. Walk through each exercise with images, timer, form cues
4. After completion: "Rate your pain now (1-10)" — compare before/after
5. Show: "Pain went from 6 → 4. That's progress! ✅"
6. Log to pt_sessions in Supabase
7. Update the protocol progress tracker

### Progress & Timeline Display

On Home page, show a "Therapy Progress" card:
```
LUMBAR SPINE REHAB
Phase 1 of 4 — Week 3 of 8
████████░░░░░░░░ 38%

Today: 2/3 sessions completed
  ✅ Morning (7:15 AM) — Pain: 5→3
  ✅ Midday (12:30 PM) — Pain: 4→3  
  ⬜ Evening
  
Streak: 12 days consecutive
Average pain trend: 6.2 → 3.8 (↓38% since start)
```

On the dedicated PT page, show full timeline:
```
PHASE 1: Pain Management ✅ COMPLETE (Week 1-4)
  Achievement: Pain reduced from 7/10 to 4/10
  Milestone: Full McKenzie sequence tolerated

PHASE 2: Core Stability ← YOU ARE HERE (Week 5-8)
  Current goal: Plank 30s, bird dog with control
  Progress: Plank at 22s (73% of goal)
  
PHASE 3: Functional Loading 🔒 (Week 9-12)
  Unlocks when: Core stability tests passed + pain ≤3/10

PHASE 4: Progressive Strengthening 🔒 (Week 13-24)
  Unlocks when: Phase 3 graduated + PT clearance
```

### Same Progress System for Main Workouts
Apply the identical progress/timeline display to the main training program:

On Home page:
```
TRAINING PROGRAM
Phase 1: Stabilization — Week 3 of 8
████████░░░░░░░░ 38%

Sessions this week: 2/3 completed
Volume: Chest 8/12 sets | Back 10/12 | Legs 6/12
Streak: 12 sessions

Strength Milestones:
  ✓ Goblet Squat: 25lbs (Week 1: bodyweight)
  ✓ Trap Bar DL: 95lbs (Week 1: 65lbs)
  → Next unlock: DB Bench Press (need 2 more pain-free sessions)
```

### Reminder System
For MVP (no push notifications yet):
- Show reminder badges on the Home page: "Midday PT session due"
- Show a notification bar at top of app when a PT session is overdue
- Track completion times to establish habit patterns
- Later (v2): integrate with phone notifications via service worker

---

## HOW TO VERIFY THE PT PLAN IS CORRECT

1. **Evidence-based protocols**: Each condition in CONDITIONS_MASTER_INDEX.md has recommended exercises sourced from clinical evidence (McKenzie MDT, NASM CES, ACSM guidelines, peer-reviewed PT research)

2. **Phase progression based on outcomes, not time**: User doesn't auto-advance — they must meet criteria (pain reduction, ROM improvement, strength benchmarks)

3. **Pain tracking validates effectiveness**: If pain isn't trending down over 2 weeks, the app flags it and suggests PT referral

4. **The app never replaces a PT**: Every protocol includes "When to see a professional" triggers and the user can mark "cleared by PT" as a graduation criterion

5. **Database cross-reference**: Every PT exercise is checked against ALL active conditions — if a user has both a back issue and a knee issue, only exercises safe for BOTH are prescribed

6. **Frequency is condition-specific**: The CONDITIONS_MASTER_INDEX.md and clinical research dictate how often exercises should be done (McKenzie: every 2 hours in acute phase; general PT: 2-3x/day; maintenance: 1x/day)

---

## ASSESSMENT GAPS TO FIX — CLINICAL QUALITY CONTROL

The current assessment is missing critical information that a real PT would collect. These gaps must be added to ensure protocols are correctly prescribed:

### Gap 1: Pain Behavior Assessment (per condition)
For each condition the user selects, ask:
```
- Pain type: Constant / Intermittent / Only with activity / Only at rest
- Worst time: Morning / Midday / Evening / Night / No pattern
- Pain triggers: Sitting / Standing / Walking / Lifting / Bending / Twisting / Lying down
- Pain relievers: Rest / Movement / Heat / Ice / Stretching / Nothing helps
- Pain pattern over last 2 weeks: Getting better / Staying same / Getting worse
```
WHY: Constant pain = more conservative protocol. Intermittent = can push more. Morning stiffness = likely inflammatory. Night pain = red flag. "Getting worse" = refer out consideration.

### Gap 2: Directional Preference Testing (for spinal conditions)
For ANY spine/back/neck condition, ask:
```
- "Does bending backward (arching your back) make your pain: Better / Worse / No change?"
- "Does bending forward (touching toes) make your pain: Better / Worse / No change?"
- "Does your pain move TOWARD your spine when you arch back?" (centralization check)
- "Does your pain move AWAY from your spine (into legs/arms) when you bend forward?" (peripheralization check)
```
WHY: This determines McKenzie vs Williams protocol. Extension preference = McKenzie (disc issue). Flexion preference = Williams (stenosis/facet). WRONG DIRECTION = CAN MAKE IT WORSE. This is the single most important question for spinal conditions.

### Gap 3: Pain Timeline
For each condition:
```
- "When did this start?"
  - Less than 6 weeks ago (ACUTE)
  - 6-12 weeks ago (SUBACUTE)  
  - More than 3 months ago (CHRONIC)
  - More than 1 year ago (CHRONIC PERSISTENT)
- "Was there a specific injury or did it come on gradually?"
- "Have you had surgery for this? If yes, how long ago?"
```
WHY: Acute = gentle, frequent, short sessions (5-10 min, 4-6x/day). Subacute = moderate, 2-3x/day. Chronic = can push more, 1-2x/day plus integration with main workout. Post-surgical timeline determines which exercises are safe and when.

### Gap 4: Functional Limitations
For each condition, ask user to rate these (Can do easily / Can do with difficulty / Cannot do):
```
- Sit for 30+ minutes
- Stand for 30+ minutes
- Walk for 15+ minutes
- Climb stairs
- Lift objects overhead
- Reach behind back
- Get up from floor
- Sleep through the night
- Drive for 30+ minutes
- Exercise at moderate intensity
```
WHY: These become the MEASURABLE GOALS for the PT protocol. "Can't sit >30 min" → goal is "Sit 30 min pain-free." Progress is measured by re-assessing these every 2-4 weeks. Users SEE their functional improvement, not just pain numbers.

### Gap 5: Previous Treatment History
```
- "Have you seen a physical therapist for this?" Yes / No
- If yes: "What exercises or treatments helped?" (free text)
- "What made it worse?" (free text)
- "Are you currently seeing a PT?" Yes / No
- "Has a doctor cleared you for exercise?" Yes / No / Haven't asked
```
WHY: If they're currently seeing a PT, the app should COMPLEMENT the PT's plan, not replace it. If certain exercises helped before, prioritize them. If exercises made it worse, avoid them.

### Gap 6: Medication Screen
```
- "Are you taking any of these?" (multi-select):
  - Blood pressure medication (affects heart rate response)
  - Blood thinners (caution with foam rolling / bruising risk)
  - Steroids/Prednisone (bone density concern, affects inflammation)
  - Pain medication - NSAIDs like ibuprofen (masks pain signals)
  - Pain medication - opioids (impairs coordination/balance)
  - Diabetes medication (blood sugar monitoring needed)
  - Muscle relaxants (affects coordination)
  - None of these
```
WHY: Beta-blockers = can't use heart rate for intensity. Blood thinners = no aggressive foam rolling. Steroids = add weight-bearing for bone density. Opioids = balance exercises need supervision. This is NASM's scope of practice requirement.

### Gap 7: Red Flag Screening (beyond PAR-Q)
```
- "Do you have any of these symptoms?" (if ANY = immediate refer out):
  - Unexplained weight loss (10+ lbs without trying)
  - Pain that wakes you from sleep every night
  - Fever or chills with your pain
  - Loss of bowel or bladder control
  - Progressive numbness or weakness in arms/legs
  - Pain that doesn't change with any position or movement
  - History of cancer with new bone/back pain
```
WHY: These are clinical red flags that indicate possible serious pathology (tumor, infection, cauda equina syndrome, fracture). ANY "yes" = the app shows: "⚠️ These symptoms need medical evaluation before starting an exercise program. Please see your doctor first." and BLOCKS protocol generation until user confirms medical clearance.

### Gap 8: Standardized Outcome Measures
For each body region with a condition, administer the appropriate validated questionnaire:
```
- Low Back: Oswestry Disability Index (ODI) — 10 questions, score 0-100%
- Neck: Neck Disability Index (NDI) — 10 questions, score 0-100%
- Shoulder: QuickDASH — 11 questions, score 0-100
- Knee: KOOS (Knee injury and Osteoarthritis Outcome Score) — abbreviated 7 questions
- Hip: Harris Hip Score (modified) — 8 questions
- General pain: NPRS (Numeric Pain Rating Scale) — already have this (1-10)
- Function: Patient-Specific Functional Scale — user names 3 activities and rates difficulty 0-10
```
WHY: These are how real PTs measure progress. Reassess every 4 weeks. "Your Oswestry score improved from 48% to 28% — that's a 42% improvement in function!" This is clinical-grade progress tracking that validates the protocol is working. If scores plateau for 4+ weeks, flag for PT referral.

---

## PROTOCOL FREQUENCY RULES (evidence-based)

### By Condition Phase
```
ACUTE (0-6 weeks):
  - Frequency: 3-6x per day
  - Duration: 5-10 min per session
  - Intensity: Gentle — pain should not increase during exercise
  - Focus: Pain management, basic ROM, centralization
  - McKenzie: every 2 hours if extension-biased

SUBACUTE (6-12 weeks):
  - Frequency: 2-3x per day
  - Duration: 10-15 min per session
  - Intensity: Moderate — mild discomfort OK, pain should not last >30 min after
  - Focus: Restore ROM, begin strengthening, functional activities

CHRONIC (12+ weeks):
  - Frequency: 1-2x per day
  - Duration: 15-20 min per session
  - Intensity: Progressive — challenging but controlled
  - Focus: Strengthen, endurance, sport/activity-specific, prevent recurrence
  - Integration: PT exercises merge into main workout warm-up/cooldown

POST-SURGICAL (timeline varies by surgery):
  - Follow surgeon's protocol timeline strictly
  - App asks: "What week post-op are you?" and gates exercises accordingly
  - Week ranges from CONDITIONS_MASTER_INDEX.md phases
```

### By Condition Type
```
SPINAL (disc, fusion, stenosis, DDD):
  - Daily mandatory: directional preference exercises + core stabilization
  - Frequency: minimum 2x/day, acute phase up to every 2 hours
  - Duration: 10-15 min
  - NEVER skip: even on workout days, PT session happens separately

JOINT (knee, shoulder, hip, ankle):
  - Daily mandatory: ROM exercises + activation exercises
  - Frequency: 2-3x/day for ROM, 1x/day for strengthening
  - Duration: 10-15 min for ROM, 15-20 min for strengthening
  - Can integrate strengthening into main workout

NEUROLOGICAL (Parkinson's, MS, stroke):
  - Daily mandatory: balance + functional movement
  - Frequency: 1-2x/day
  - Duration: 15-30 min
  - Emphasize: consistency over intensity

CHRONIC PAIN (fibromyalgia, CRPS, chronic fatigue):
  - Daily mandatory: gentle movement + nervous system regulation
  - Frequency: 1-2x/day, NEVER push through flares
  - Duration: 5-15 min (start extremely low)
  - Emphasize: pacing, graded exposure, pain education
```
