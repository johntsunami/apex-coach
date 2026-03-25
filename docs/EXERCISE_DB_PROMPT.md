# Exercise Database Build Prompt for Claude Code

## IMPORTANT: Save this in docs/ and give Claude Code this EXACT prompt:

---

```
Read docs/EXERCISE_DB_SCHEMA.md first — it contains the complete schema definition, indexing system, prerequisite system, progression chains, and session assembly rules. Every exercise you create MUST follow that schema exactly.

Build src/data/exercises.json containing exercises organized into these exact categories. I've listed every exercise that must be included. Do not skip any. Do not add random filler. Each exercise must have ALL schema fields populated including prerequisites, progressionChain, contraindications with severity gates, substitutions, phaseParams, and injuryNotes for lower_back, knee, and shoulder.

## CATEGORY 1: NASM Phase 1 Stabilization (14 exercises)

### Foam Rolling (Inhibit)
1. Foam Roll Calves — target: gastrocnemius/soleus, 30s per leg
2. Foam Roll IT Band — target: tensor fascia latae, 30s per side
3. Foam Roll Adductors — target: adductor complex, 30s per side
4. Foam Roll Lats — target: latissimus dorsi, 30s per side
5. Foam Roll Thoracic Spine — target: thoracic erectors, 30s total

### Core Stabilization (Activate)
6. Dead Bug (bent knee) — anti-extension, phase 1 baseline
7. Plank (from knees progressing to full) — anti-extension
8. Side Plank (from knees) — anti-lateral flexion
9. Bird Dog — contralateral stabilization
10. McGill Curl-Up — spinal-safe flexion per Stuart McGill

### Balance (Stabilization)
11. Single-Leg Balance (eyes open → eyes closed progression)
12. Single-Leg Balance with Reach
13. BOSU Ball Squat (gym only, phase 1)

### Resistance (Phase 1 Stabilization parameters: 1-3 sets, 12-20 reps, 4/2/1 tempo)
14. Stability Ball Squat — wall-assisted squat learning pattern

## CATEGORY 2: Compound Strength Exercises (16 exercises)
Each must have full progression chain with prerequisites.

### Hinge Pattern
15. Glute Bridge (bodyweight) — level 1, no prerequisites
16. Single-Leg Glute Bridge — level 2, requires: glute_bridge mastered
17. Romanian Deadlift (DB) — level 3, requires: hip_hinge_competent
18. Trap Bar Deadlift (high handles) — level 4, requires: RDL mastered + back severity ≤3
19. Trap Bar Deadlift (low handles) — level 5, requires: high handles mastered + back severity ≤2

### Horizontal Push
20. Wall Push-Up — level 1, no prerequisites
21. Incline Push-Up — level 2, requires: wall push-up 20 reps
22. Floor Push-Up — level 3, requires: incline push-up 15 reps
23. Landmine Press — level 3, requires: core_stability_basic + shoulder severity ≤3
24. DB Floor Press — level 4, requires: push-up mastered + shoulder severity ≤2
25. DB Bench Press — level 5, requires: floor press mastered + shoulder severity ≤1

### Horizontal Pull
26. Band Pull-Apart — level 1, no prerequisites
27. Chest-Supported DB Row — level 2, no prerequisites (back-safe)
28. Single-Arm DB Row — level 3, requires: chest-supported row mastered
29. Cable Row (seated) — level 3, gym only
30. Inverted Row — level 4, requires: DB row mastered

### Squat Pattern
31. Bodyweight Squat — level 1, no prerequisites
32. Goblet Squat — level 2, requires: BW squat competent
33. Bulgarian Split Squat (BW) — level 3, requires: single_leg_stable
34. Bulgarian Split Squat (loaded) — level 4, requires: BW version mastered
35. Front Squat — level 5, requires: goblet squat mastered + back severity ≤2

## CATEGORY 3: Isolation & Accessory (8 exercises)
36. Face Pulls — rear delt/external rotation, all phases
37. Banded External Rotation — rotator cuff activation, all phases
38. Bicep Curl (DB) — phase 2+, isolation
39. Tricep Pushdown (cable/band) — phase 2+
40. Lateral Raise (DB) — phase 2+, shoulder severity ≤2
41. Calf Raise (standing) — all phases
42. VMO Wall Sit — knee rehab, all phases
43. Terminal Knee Extension (band) — knee rehab, all phases

## CATEGORY 4: Core Progression (6 exercises)
44. Pallof Press (tall kneeling) — level 1 anti-rotation
45. Pallof Press (standing) — level 2, requires: kneeling version
46. Pallof Press (split stance) — level 3, requires: standing version
47. Ab Wheel Rollout (knees) — level 3, requires: plank 60s
48. Single-Arm Farmer Carry — level 2, anti-lateral flexion + grip
49. Suitcase Carry — level 3, requires: farmer carry mastered

## CATEGORY 5: McKenzie Protocol — Back (7 exercises, MUST follow this exact order)
Source: McKenzie R. "Treat Your Own Back" + StatPearls NBK539720
50. Prone Lying (passive lumbar extension) — step 1, acute pain
51. Prone on Elbows (sustained extension) — step 2, requires: prone lying tolerated
52. Extension in Lying / Press-Up — step 3, requires: prone on elbows pain-free
53. Extension in Standing — step 4, can be done instead of #52 if lying hurts
54. Lying Flexion (knees to chest) — step 5, only AFTER extension pain-free 1 week
55. Sitting Flexion — step 6, requires: lying flexion tolerated
56. Standing Flexion (touch toes) — step 7, requires: sitting flexion tolerated, ALWAYS follow with exercise #52

## CATEGORY 6: McKenzie Protocol — Neck (7 exercises, MUST follow this order)
Source: McKenzie R. "Treat Your Own Neck" + Spine-Health
57. Neck Retraction (chin tuck, seated) — step 1, baseline for all neck work
58. Neck Extension (seated) — step 2, requires: retraction pain-free
59. Neck Retraction + Extension Combined — step 3
60. Side Bending (in retraction) — step 4, for lateral symptoms
61. Rotation in Retraction — step 5, for rotational stiffness
62. Neck Flexion (chin to chest) — step 6, only after extension work reduces pain
63. Neck Retraction/Extension Lying — step 7, for persistent stiffness

## CATEGORY 7: PT Exercises — Knee Rehab (5 exercises)
64. Quad Sets (isometric) — level 1, immediate post-op safe
65. Straight Leg Raise — level 1, requires: quad set activation
66. Step-Down (low box 4") — level 2, requires: VMO activation + single-leg stability
67. Step-Down (high box 8") — level 3, requires: low box step-down pain-free
68. Single-Leg Press (machine, limited ROM) — level 3, gym only

## CATEGORY 8: PT Exercises — Shoulder Rehab (5 exercises)
69. Isometric External Rotation (towel in doorway) — level 1, acute safe
70. Prone Y-Raise — level 2, scapular stabilization
71. Prone T-Raise — level 2, scapular stabilization
72. Prone W-Raise — level 2, external rotation strengthening
73. Scapular Wall Slides — level 1, scapular motor control

## CATEGORY 9: Mobility & ROM (6 exercises)
74. Cat-Cow Flow — spinal segmental mobility
75. 90/90 Hip Switch — hip internal/external rotation
76. World's Greatest Stretch — multi-joint mobility
77. Thoracic Rotation (open book) — thoracic spine mobility
78. Ankle Dorsiflexion Mobilization (wall) — ankle ROM
79. Shoulder Pass-Throughs (band/dowel) — shoulder ROM, severity ≤2

## CATEGORY 10: Static Stretches — Cooldown (8 exercises)
80. Supine Hamstring Stretch (strap) — 30s per side
81. Hip Flexor Stretch (half-kneeling) — 30s per side
82. Child's Pose + Lat Reach — 30s per side
83. Pec Doorway Stretch — 30s per side
84. Upper Trap Stretch — 30s per side
85. Piriformis Stretch (figure 4) — 30s per side
86. Quadriceps Stretch (standing or side-lying) — 30s per side
87. Cross-Body Shoulder Stretch — 30s per side, shoulder severity ≤2

## CATEGORY 11: Cardio (3 exercises)
88. Walking (Zone 2) — all phases, all locations, all fitness levels
89. Incline Treadmill Walk — phase 1+, gym only
90. Stationary Bike — phase 1+, gym only, knee-friendly

## RULES FOR EVERY EXERCISE:
- Prerequisites must reference specific exercise IDs from this list
- Progression chains must link correctly (regressTo/progressTo IDs must exist)
- Every exercise must have injuryNotes for ALL THREE injuries (lower_back, knee, shoulder) even if the note is "No specific concern"
- Contraindications severity_gate must be set — if an exercise is dangerous above severity X for an injury, set that gate
- substitutions.home and substitutions.outdoor must point to exercises that actually exist in this database and are safe
- phaseParams must only include phases listed in phaseEligibility
- McKenzie exercises MUST have weekMinimum set correctly — back extension exercises week 1, flexion exercises NOT before week 2
- McKenzie exercises MUST have progression chain ordered exactly as listed (this is medically important)
- Tags must include: the category name, relevant protocols (mcgill_big_3, mckenzie_back, mckenzie_neck, nasm_phase1, pt_shoulder, pt_knee), and movement pattern

Save as src/data/exercises.json. After creating, verify: all exercise IDs referenced in prerequisites, progressionChain, and substitutions actually exist in the database. Report any broken references.
```
