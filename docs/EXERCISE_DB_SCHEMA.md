# Exercise Database Schema & Indexing System

## Overview
Every exercise in the database follows this schema. The indexing system enables:
- Fast lookup by body part, movement pattern, equipment, location
- Safety filtering against user injury profiles
- Prerequisite gating (exercise B requires mastery of exercise A)
- Phase-appropriate exercise selection
- Automatic substitution when an exercise is contraindicated
- Progression chains (beginner → intermediate → advanced)

---

## Schema Definition

```json
{
  "id": "string — unique identifier (e.g., 'stab_dead_bug', 'str_trap_bar_dl')",

  // ═══ CLASSIFICATION INDEXES ═══
  "name": "string — display name",
  "category": "enum: warmup | main | cooldown | rehab | mobility | mckenzie | cardio | foam_roll",
  "type": "enum: strength | stabilization | mobility | flexibility | rehab | cardio | plyometric | foam_roll",
  "movementPattern": "enum: push | pull | hinge | squat | lunge | carry | rotation | anti_rotation | anti_extension | anti_flexion | isolation | mobility | static_stretch | foam_roll | breathing",

  // ═══ BODY TARGETING INDEXES ═══
  "bodyPart": "enum: chest | back | shoulders | legs | glutes | core | hips | arms | full_body | neck | ankles | calves",
  "primaryMuscles": ["array of specific muscles"],
  "secondaryMuscles": ["array of specific muscles"],
  "jointsInvolved": ["array: spine | hip | knee | ankle | shoulder | elbow | wrist"],

  // ═══ EQUIPMENT & LOCATION INDEXES ═══
  "equipmentRequired": ["array: none | mat | band | dumbbell | barbell | trap_bar | cable | bench | stability_ball | foam_roller | kettlebell | pull_up_bar | landmine | box | wall | strap | towel"],
  "locationCompatible": ["array: gym | home | outdoor"],

  // ═══ PHASE & DIFFICULTY GATING ═══
  "phaseEligibility": [1, 2, 3, 4, 5],
  "difficultyLevel": "integer 1-5 (1=beginner, 5=elite)",
  "weekMinimum": "integer — earliest week this exercise can appear (e.g., week 1 = only basic, week 3+ = can add complexity)",

  // ═══ PREREQUISITE SYSTEM (Exercise Unlocking) ═══
  "prerequisites": {
    "minCompletedSessions": "integer — total sessions user must have completed",
    "requiredExercisesMastered": ["array of exercise IDs that must be completed pain-free for 3+ sessions"],
    "requiredCapabilities": ["array of capability tags user must have earned"],
    "minPhase": "integer — minimum OPT phase",
    "maxInjurySeverity": {
      "lower_back": "integer — max severity to allow (e.g., 3 means severity must be ≤3)",
      "knee": "integer",
      "shoulder": "integer"
    },
    "painFreeROM": ["array of ROM requirements: 'shoulder_flexion_160', 'hip_flexion_90', etc."],
    "notes": "string — human-readable explanation of why these prerequisites exist"
  },

  // ═══ PROGRESSION CHAIN ═══
  "progressionChain": {
    "level": "integer — position in the chain (1=most basic, 5=most advanced)",
    "regressTo": "exercise ID — easier version if user can't do this",
    "progressTo": "exercise ID — harder version when user is ready",
    "unlockCriteria": "string — what must happen to progress (e.g., '3 sessions pain-free at RPE 6, full ROM')",
    "chainFamily": "string — groups related exercises (e.g., 'hip_hinge_chain', 'horizontal_push_chain')"
  },

  // ═══ SAFETY & CONTRAINDICATION INDEX ═══
  "contraindications": {
    "injuries": ["array of injury tags that PROHIBIT this exercise"],
    "conditions": ["array: disc_herniation_acute | spondylolisthesis | labrum_tear_acute | acl_post_op_early | meniscus_acute | rotator_cuff_tear_acute | spinal_stenosis"],
    "movements_to_avoid": ["array: spinal_flexion_under_load | overhead_pressing | deep_knee_flexion | behind_neck | plyometrics | axial_loading_heavy | end_range_shoulder"],
    "severity_gate": {
      "lower_back": "integer — if user's back severity is ABOVE this number, exercise is blocked",
      "knee": "integer",
      "shoulder": "integer"
    }
  },
  "safetyTier": "enum: green (safe for all) | yellow (caution — modify for injuries) | red (advanced — requires clearance)",

  // ═══ SUBSTITUTION MAP ═══
  "substitutions": {
    "home": "exercise ID — what to swap when at home",
    "outdoor": "exercise ID — what to swap when outdoors",
    "injury_lower_back": "exercise ID — safer alternative for back issues",
    "injury_knee": "exercise ID — safer alternative for knee issues",
    "injury_shoulder": "exercise ID — safer alternative for shoulder issues",
    "no_equipment": "exercise ID — bodyweight alternative"
  },

  // ═══ WORKOUT PARAMETERS (per phase) ═══
  "phaseParams": {
    "1": { "sets": "1-3", "reps": "12-20", "tempo": "4/2/1", "rest": "0-90s", "intensity": "50-70% 1RM" },
    "2": { "sets": "2-4", "reps": "8-12", "tempo": "2/0/2", "rest": "0-60s", "intensity": "70-80% 1RM" },
    "3": { "sets": "3-5", "reps": "6-12", "tempo": "2/0/2", "rest": "0-60s", "intensity": "75-85% 1RM" },
    "4": { "sets": "4-6", "reps": "1-5", "tempo": "X/X/X", "rest": "3-5min", "intensity": "85-100% 1RM" },
    "5": { "sets": "3-5", "reps": "1-10", "tempo": "X/X/X", "rest": "3-5min", "intensity": "30-45% or 85-100%" }
  },

  // ═══ COACHING CONTENT ═══
  "emoji": "string — visual identifier",
  "steps": ["array of numbered step-by-step instructions"],
  "formCues": ["array of ✅ good form cues"],
  "commonMistakes": ["array of ❌ bad form warnings"],
  "coreBracing": "string — bracing level and technique",
  "breathing": { "inhale": "seconds", "hold": "seconds", "exhale": "seconds", "pattern": "description" },
  "injuryNotes": {
    "lower_back": "string — specific notes for back issues",
    "knee": "string — specific notes for knee issues",
    "shoulder": "string — specific notes for shoulder issues"
  },
  "purpose": "string — general purpose",
  "whyForYou": "string — personalized reason for John",
  "proTip": "string — advanced coaching tip",

  // ═══ METADATA ═══
  "source": "string — evidence source (e.g., 'NASM CPT 7th Ed', 'McKenzie MDT', 'ACSM Guidelines')",
  "lastReviewed": "date string — when this exercise was last verified",
  "tags": ["array of searchable tags: 'mcgill_big_3', 'mckenzie_back', 'nasm_phase1', 'pt_shoulder', 'compound', 'isolation', 'unilateral', etc."]
}
```

---

## Index Categories for Quick Lookup

### By Body Part
Query: "Give me all exercises targeting glutes"
→ Filter: `bodyPart === 'glutes'` OR `primaryMuscles.includes('Glute Max')`

### By Movement Pattern
Query: "I need a hinge exercise for home"
→ Filter: `movementPattern === 'hinge'` AND `locationCompatible.includes('home')`

### By Injury Safety
Query: "What exercises are safe for severity 3 lower back?"
→ Filter: `contraindications.severity_gate.lower_back >= 3` OR `contraindications.severity_gate.lower_back === null`

### By Phase Eligibility
Query: "What can I do in Phase 1?"
→ Filter: `phaseEligibility.includes(1)`

### By Prerequisites Met
Query: "What is this user ready for?"
→ Check each exercise's `prerequisites` against user's completed sessions, mastered exercises, and injury status

### By Progression Chain
Query: "User mastered floor press — what's next?"
→ Lookup: `progressionChain.progressTo` from floor_press exercise

### By Tags
Query: "Show me all McKenzie back exercises"
→ Filter: `tags.includes('mckenzie_back')`

### By Equipment Available
Query: "User is at home with bands and dumbbells"
→ Filter: `equipmentRequired` is subset of `['none', 'mat', 'band', 'dumbbell']`

---

## Capability Tags (User earns these through training)

These are tracked in the user profile and checked against exercise prerequisites:

```
core_stability_basic         — earned after 4 sessions with plank hold >30s
core_stability_intermediate  — earned after 8 sessions with anti-rotation work
hip_hinge_competent          — earned after 6 sessions with proper deadlift form
single_leg_stable            — earned after 4 sessions of split squats without balance issues
shoulder_pressing_cleared    — earned after rotator cuff activation protocol completed pain-free
overhead_cleared             — earned after Phase 2+ AND shoulder severity ≤1
plyometric_ready             — earned after Phase 3+ AND knee severity ≤1 AND 12+ sessions
heavy_loading_ready          — earned after Phase 2+ AND back severity ≤2 AND 8+ sessions
barbell_competent            — earned after 6 sessions with trap bar/DB compounds
pull_up_ready                — earned after band-assisted pull-ups for 4+ sessions
```

---

## Progression Chain Families

Each family is a sequence from easiest to hardest:

### hip_hinge_chain
1. Glute Bridge (bodyweight) → 
2. Single-Leg Glute Bridge → 
3. Romanian Deadlift (DB) → 
4. Trap Bar Deadlift (high handles) → 
5. Trap Bar Deadlift (low handles) → 
6. Conventional Deadlift (if back allows)

### horizontal_push_chain
1. Wall Push-Up → 
2. Incline Push-Up → 
3. Floor Push-Up → 
4. Landmine Press → 
5. DB Floor Press → 
6. DB Bench Press → 
7. Barbell Bench Press

### horizontal_pull_chain
1. Band Pull-Apart → 
2. Seated Band Row → 
3. Chest-Supported DB Row → 
4. Single-Arm DB Row → 
5. Cable Row → 
6. Barbell Bent-Over Row (if back allows)

### vertical_push_chain
1. Landmine Press (angled) → 
2. Half-Kneeling DB Press → 
3. Standing DB Press → 
4. Barbell Overhead Press (Phase 3+ only, shoulder permitting)

### vertical_pull_chain
1. Lat Pulldown (machine) → 
2. Band-Assisted Pull-Up → 
3. Eccentric Pull-Up → 
4. Full Pull-Up → 
5. Weighted Pull-Up

### squat_chain
1. Bodyweight Squat → 
2. Goblet Squat → 
3. Bulgarian Split Squat (BW) → 
4. Bulgarian Split Squat (loaded) → 
5. Front Squat → 
6. Back Squat (Phase 3+ only)

### core_anti_extension_chain
1. Dead Bug (bent knee) → 
2. Dead Bug (straight leg) → 
3. Plank (knees) → 
4. Plank (full) → 
5. Ab Wheel Rollout (knees) → 
6. Ab Wheel Rollout (standing)

### core_anti_rotation_chain
1. Pallof Press (tall kneeling) → 
2. Pallof Press (standing) → 
3. Pallof Press (split stance) → 
4. Single-Arm Farmer Carry → 
5. Renegade Row

### shoulder_rehab_chain
1. Isometric External Rotation → 
2. Banded External Rotation → 
3. Cable External Rotation → 
4. Face Pulls → 
5. Prone Y-T-W Raises → 
6. Turkish Get-Up (light)

### knee_rehab_chain
1. VMO Wall Sit (45°) → 
2. Terminal Knee Extension (band) → 
3. Step-Down (low box) → 
4. Step-Down (high box) → 
5. Single-Leg Squat to Box → 
6. Pistol Squat (assisted)

### mckenzie_back_chain (progressive — follow this ORDER)
1. Prone Lying (passive extension) → 
2. Prone on Elbows → 
3. Extension in Lying (press-up) → 
4. Extension in Standing → 
5. Lying Flexion (knees to chest) → 
6. Sitting Flexion → 
7. Standing Flexion

### mckenzie_neck_chain (progressive — follow this ORDER)
1. Neck Retraction (seated) → 
2. Neck Extension (seated) → 
3. Neck Retraction + Extension → 
4. Side Bending → 
5. Rotation in Retraction → 
6. Neck Flexion in Sitting → 
7. Neck Retraction/Extension (lying)

---

## Session Assembly Rules

When building a session, the engine must:

1. **Check prerequisites** for every exercise before including it
2. **Filter by location** (gym/home/outdoor) 
3. **Filter by injury contraindications** against active injury profile
4. **Filter by phase eligibility** against current phase
5. **Ensure progression order** — never include an advanced exercise if prerequisites aren't met
6. **Check weekly volume** — don't exceed muscle group limits
7. **Ensure movement pattern coverage** — at least one push, pull, hinge, squat, core per session
8. **Include mandatory protocols** — if injury is active, include rehab exercises from that chain
9. **Respect CEx Continuum order** — Inhibit → Lengthen → Activate → Integrate → Cool down
10. **Apply phase-appropriate parameters** — sets/reps/tempo/rest from phaseParams

---

## Substitution Priority Order

When an exercise is contraindicated:
1. Check `substitutions.injury_[type]` first — use the injury-specific alternative
2. If no injury-specific sub, find another exercise with same `movementPattern` + `bodyPart` that passes safety check
3. If no same-pattern match, find same `bodyPart` exercise that's safe
4. If nothing works, skip and log: "No safe alternative found for [exercise] — skipped"
5. NEVER substitute silently — always tell user what was changed and why
