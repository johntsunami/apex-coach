# Safety & Quality Verification Engine
## Automated clinical checks that validate EVERY generated plan before a user sees it

---

## THE PROBLEM

We have 300 exercises, 100 conditions, 7 compensation protocols, and a complex workout generation algorithm. The logic SHOULD produce safe, optimized plans — but how do we KNOW it does? A single missed contraindication could injure someone. A wrong directional preference could worsen a disc herniation. A missing PT protocol means incomplete rehabilitation.

The app needs an automated verification layer — a "second opinion" system that checks every plan against clinical rules before the user ever sees it.

---

## VERIFICATION ENGINE: 12 SAFETY CHECKS

Every time a workout plan or PT protocol is generated, these checks run AUTOMATICALLY. If any check fails, the plan is flagged and either auto-corrected or blocked with an explanation.

### Check 1: CONTRAINDICATION CROSS-CHECK
```
For each exercise in the generated plan:
  For each active condition the user has:
    → Is this exercise in that condition's "avoid" list? → BLOCK
    → Does the exercise's severity_gate allow this user's severity? → BLOCK if exceeded
    → Does the exercise's contraindications.injuries array match any user injury? → BLOCK
    → Does the exercise's contraindications.movements_to_avoid overlap with any condition's restrictions? → BLOCK

If ANY exercise passes through that should have been blocked:
  → Remove it immediately
  → Log: "SAFETY CATCH: [exercise] removed — contraindicated for [condition]"
  → Substitute with a safe alternative
  → Show user: "We caught a potential conflict and swapped [X] for [Y]"
```

### Check 2: DIRECTIONAL PREFERENCE COMPLIANCE
```
For users with spinal conditions:
  If directional_preference = "extension":
    → ALL McKenzie extension exercises MUST be present in PT protocol
    → ALL Williams flexion exercises MUST be ABSENT from PT protocol
    → No loaded spinal flexion in main workout
  
  If directional_preference = "flexion":
    → Williams flexion protocol MUST be present
    → McKenzie extension exercises MUST be ABSENT
    → Extension exercises blocked
  
  If directional_preference = "neutral" or not tested:
    → Only neutral stabilization exercises (planks, dead bugs, pallof)
    → Neither extension nor flexion protocols
    → Flag: "Directional preference not determined — using neutral protocol. Consider testing."

FAILURE = CRITICAL. Wrong direction can cause harm.
```

### Check 3: MULTIPLE CONDITION INTERSECTION
```
For users with 2+ conditions:
  → Find the INTERSECTION of safe exercises (must be safe for ALL conditions)
  → If Condition A recommends extension but Condition B contraindicates it:
    → Use MOST RESTRICTIVE rule
    → Log: "[Extension exercises] blocked — safe for [Condition A] but contraindicated for [Condition B]"
    → Show user why
  → If the intersection is very small (<10 available exercises):
    → Flag: "Your combination of conditions significantly limits exercise options"
    → Suggest: "Consider consulting with a PT who can assess your specific situation"
```

### Check 4: PHASE-APPROPRIATE PARAMETERS
```
Every exercise must use parameters matching current phase:
  Phase 1: sets 1-3, reps 12-20, tempo 4/2/1, rest 0-90s
  Phase 2: sets 2-4, reps 8-12, tempo 2/0/2, rest 0-60s
  Phase 3: sets 3-5, reps 6-12, tempo 2/0/2, rest 0-60s

Check:
  → No Phase 3 exercise appearing in a Phase 1 plan
  → No Phase 1 parameters on a Phase 3 exercise
  → Week 1-2: MAXIMUM 1-2 sets per exercise (hard cap)
  → Deload week: all volume at 50%
```

### Check 5: PREREQUISITE CHAIN INTEGRITY
```
For each exercise in the plan:
  → Are ALL prerequisites met?
    - minCompletedSessions: check session count
    - requiredExercisesMastered: check user_exercise_progress.mastered
    - requiredCapabilities: check capability_tags
    - minPhase: check current phase
    - maxInjurySeverity: check current severities
    - painFreeROM: check ROM assessment
  → If ANY prerequisite fails: BLOCK and substitute with the regression

NEVER allow an advanced exercise if the prerequisite chain isn't complete.
Example: Barbell Bench Press requires DB Floor Press mastery. If not mastered → use DB Floor Press instead.
```

### Check 6: WEEKLY VOLUME LIMITS
```
Calculate total weekly volume per muscle group including:
  → Today's planned exercises
  → Already completed sessions this week
  → PT protocol exercises (these count toward volume!)

Check against limits:
  Phase 1: 10-12 sets/muscle/week MAX
  Phase 2: 14-18 sets/muscle/week MAX
  Phase 3+: 18-24 sets/muscle/week MAX

If over limit:
  → Remove the exercise that would exceed the cap
  → Substitute with mobility/stretching for that area
  → Show: "Chest is at 11/12 sets this week — swapping to pec stretch to prevent overtraining"

Also check:
  → Volume increase from last week ≤10%
  → If >10%: reduce to 10% increase max
```

### Check 7: MOVEMENT PATTERN COVERAGE
```
Every session MUST include at least one of each:
  □ Push (horizontal or vertical)
  □ Pull (horizontal or vertical)
  □ Hinge (hip dominant)
  □ Squat (knee dominant)
  □ Core/Anti-movement

If any pattern is missing:
  → Auto-add the safest available exercise for that pattern
  → Log: "Added [exercise] — [pattern] was missing from today's plan"

Exception: if ALL exercises for a pattern are contraindicated, skip it and log why.
```

### Check 8: CEx CONTINUUM ORDER
```
Session structure MUST follow this order:
  1. Inhibit (foam rolling) — targets overactive muscles from compensation screen
  2. Lengthen (stretching) — targets tight muscles
  3. Activate (isolation) — targets underactive muscles + injury protocols
  4. Integrate (compounds) — main workout
  5. Cooldown (static stretching) — all trained areas

Check:
  → Are foam rolling exercises FIRST? (not mixed into main work)
  → Are activation exercises BEFORE compound movements?
  → Are static stretches AFTER the main work? (not before — reduces strength per evidence)
  → Is cooldown present and targeting correct areas?
```

### Check 9: PT PROTOCOL COMPLETENESS
```
For each active condition with severity ≥2:
  → Does a PT protocol exist in pt_protocols table? If not → create one
  → Does the protocol include ALL "mandatory_daily" exercises from CONDITIONS_MASTER_INDEX?
  → Is the frequency appropriate for the timeline phase (acute/subacute/chronic)?
  → Are graduation criteria defined?

For McKenzie protocols specifically:
  → Are exercises in EXACT published order?
  → Are flexion exercises gated behind extension tolerance?
  → Is frequency set correctly? (acute: every 2 hours, chronic: 2x/day)

If any protocol is incomplete:
  → Auto-complete it from CONDITIONS_MASTER_INDEX
  → Flag: "PT protocol for [condition] was incomplete — added [X] mandatory exercises"
```

### Check 10: MEDICATION INTERACTIONS
```
If user takes blood thinners:
  → Foam rolling intensity capped at LIGHT
  → Flag on any deep tissue exercises
If user takes beta-blockers:
  → Remove all heart-rate-based intensity prescriptions
  → Use RPE exclusively
If user takes opioids:
  → Balance exercises require stable surface only (no BOSU, no single-leg unstable)
  → Flag: "Coordination may be affected by medication — using stable exercises"
If user takes steroids long-term:
  → Ensure weight-bearing exercises included (osteoporosis prevention)
  → Flag bone density concern
```

### Check 11: RED FLAG MONITORING
```
After every session, check:
  → Pain rating 7+ for 3 consecutive sessions → REFER OUT
  → Pain-flagged exercises for same body area 3+ times → suggest PT evaluation
  → Functional limitations WORSENING over 4 weeks → REFER OUT
  → New neurological symptoms reported in notes (tingling, numbness, weakness) → IMMEDIATE REFER OUT
  → Standardized outcome scores (ODI, NDI, DASH) not improving after 6 weeks → flag for review

When REFER OUT triggers:
  → Show prominent warning on Home screen
  → Reduce plan to Floor Session (minimum viable) until cleared
  → Message: "Your symptoms suggest you need professional evaluation. Please see your PT or doctor before continuing."
  → Do NOT delete their account or data — they can return after clearance
```

### Check 12: PT + TRAINING BLEND VERIFICATION
```
Ensure PT and main workout don't conflict or duplicate:

  → PT exercises that appear in today's warm-up/cooldown: mark as "covered in workout" on PT tracker
  → Main workout exercises that load an area being treated with gentle PT: check load is appropriate
    Example: User has acute back condition → PT is gentle extension → main workout should NOT include heavy deadlifts
  → PT session timing doesn't conflict with main workout:
    Example: If user does PT back exercises at 7am, main workout at 10am should acknowledge the pre-fatigue
  → Total daily volume (PT + workout) doesn't exceed safe limits
  → If PT protocol says "no loading" for a body area, main workout respects that even if the exercise database would allow it

Blend logic:
  ACUTE condition (0-6 weeks):
    → PT exercises DOMINATE for that body area
    → Main workout EXCLUDES that body area from loaded exercises
    → User message: "Your [area] is in active rehab — training focuses on other areas today"
  
  SUBACUTE (6-12 weeks):
    → PT exercises in warm-up/cooldown
    → Main workout includes LIGHT loading for that area
    → User message: "Gradually introducing [area] back into training alongside your therapy"
  
  CHRONIC (12+ weeks):
    → PT exercises integrated into warm-up
    → Main workout includes full loading within severity gates
    → User message: "Your [area] therapy is now part of your regular training routine"
```

---

## HOW TO RUN THESE CHECKS

### Automatic (every plan generation)
All 12 checks run silently every time a plan is generated. Results logged in a verification_log. If all pass → user sees the plan normally. If any fail → auto-correct if possible, flag if not.

### Manual (developer/admin debug)
The Debug Panel (tap version 5x) includes a "Safety Audit" tab that:
- Runs all 12 checks on the current user's plan
- Shows pass/fail for each
- Lists every exercise with its safety status
- Highlights any concerns

### Periodic (AI Coach review)
Every 4 weeks, the AI Coach generates a "Plan Review" that:
- Summarizes the user's progress
- Notes any recurring safety flags
- Recommends PT referral if outcome scores stagnate
- Suggests plan modifications based on 4-week trend data

---

## QUALITY ASSURANCE CHECKLIST

Before launching to beta testers, verify:

□ Create 5 test user profiles with different condition combinations:
  - User 1: Lumbar fusion + knee OA + diabetes (complex multi-condition)
  - User 2: No conditions, beginner (baseline — should get Phase 1 stabilization)
  - User 3: Cervical disc herniation + shoulder impingement (upper body restrictions)
  - User 4: Wheelchair user + chronic pain (seated-only exercises)
  - User 5: Post-ACL surgery + ADHD (joint rehab + mental health)

□ For each test user, verify:
  - No contraindicated exercises appear in their plan
  - PT protocol matches their condition and directional preference
  - Weekly volume stays within limits
  - Phase parameters are correct
  - All 5 movement patterns covered (or correctly excluded with reason)
  - CEx Continuum order is correct
  - Medications are respected
  - Red flags would trigger appropriate response

□ Run the automated verification engine on all 5 test profiles
□ Document results in a test report
□ Fix any failures before inviting real users
