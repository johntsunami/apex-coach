# APEX Coach — Exercise Safety Rules
## For Physical Therapist Review

> This document describes how the APEX Coach app decides which exercises are safe
> or unsafe for each user based on their injury history. It is written in plain
> English so physical therapists can review and adjust the logic without coding knowledge.

---

## How the Safety System Works

Every exercise in the app has a **safety gate** for each body area (lower back, knee, shoulder).
Every user injury has a **severity score** from 1 to 5.

**The rule is simple**: If the user's injury severity is HIGHER than the exercise's gate value, that exercise is BLOCKED.

Example: Goblet Squat has a lower back gate of 3. If the user's back severity is 4 (post-surgical), the Goblet Squat is blocked. If their severity is 3 or lower, it's allowed.

### Severity Scale

| Severity | Meaning | Example Conditions |
|----------|---------|--------------------|
| 1 | Minor — minimal symptoms, full function | Mild muscle soreness, old resolved strain |
| 2 | Moderate — mild symptoms, slight limitation | Chronic low-grade pain, minor instability |
| 3 | Significant — functional impact, active symptoms | Acute disc herniation, active tendinitis, recent sprain |
| 4 | Severe — major limitation, post-surgical | Microdiscectomy (3-6 months), ACL reconstruction, labrum repair |
| 5 | Acute/critical — needs medical clearance | Fresh post-surgical (<3 months), acute fracture, severe nerve involvement |

### Gate Values Explained

| Gate Value | What It Means |
|-----------|---------------|
| 1 | Very restrictive — only users with severity 1 (minor) can do this exercise |
| 2 | Restricted — blocked for severity 3, 4, and 5 |
| 3 | Moderate — blocked for severity 4 and 5 (post-surgical and above) |
| 4 | Permissive — blocked only for severity 5 (acute/critical) |
| 5 | No restriction — this body area never blocks this exercise |

---

## Common Conditions and What Gets Blocked

### Lumbar Microdiscectomy (Post-Surgical)
**Body Area**: Lower Back | **Severity**: 4/5 | **Exercises Blocked**: 78

Post-surgical recovery from disc removal. The app blocks all exercises that load the spine under flexion, rotation, or heavy axial compression. Only bodyweight hip hinges (glute bridges), wall-supported squats, and supine core exercises are permitted.

**Cardio** (3):
- Battle Ropes
- Hill Sprints (Short)
- Sprint Intervals (20m)

**Cooldown** (7):
- Crow Pose
- Dancer's Pose
- Headstand Prep (Wall Only)
- Seated Forward Fold
- Seated Spinal Twist
- Side Plank Pose
- Wheel Pose (Full Backbend)

**Main** (59):
- Ab Wheel Rollout (From Knees)
- Band Deadlift
- Barbell Bent-Over Row
- Barbell Hip Thrust
- Barbell Overhead Press
- BOSU Single-Leg Romanian Deadlift
- Box Jump
- Bulgarian Split Squat (Loaded)
- Cable Row (Seated)
- Captain's Chair Lift
- Depth Jump
- Dumbbell Bench Press
- Farmer Carry (Bilateral)
- Front Squat
- Inverted Row
- Kettlebell Deadlift
- Kettlebell Farmer Carry
- Kettlebell Row (Single Arm)
- Kettlebell Single-Arm Press
- Kettlebell Swing (Russian)
- Kettlebell Turkish Get-Up
- L-Drill (Cone)
- Ladder Crossover
- Ladder Icky Shuffle
- Ladder In-Out
- Ladder Lateral Shuffle
- Landmine Press
- Lateral Bound
- Medicine Ball Overhead Throw
- Medicine Ball Rotational Throw
- Medicine Ball Slam
- Overhead Carry
- Pallof Press (Split Stance)
- Power Clean (from Hang)
- Pro Agility (5-10-5)
- Romanian Deadlift (Dumbbell)
- Seated Crunch
- Seated Oblique Twist
- Seated Trunk Rotation
- Shuttle Run (5-10-5)
- Single-Arm Dumbbell Row
- Single-Arm Farmer Carry
- Single-Leg Romanian Deadlift (Bodyweight)
- Single-Leg Romanian Deadlift (Dumbbell)
- Sled Pull (Backward or Rope)
- Sled Push
- Squat Jump
- Stability Ball Back Extension
- Stability Ball Dumbbell Row
- Stability Ball Reverse Hyperextension
- Suitcase Carry
- T-Bar Row
- Trap Bar Deadlift (High Handles)
- Trap Bar Deadlift (Low Handles)
- TRX Pike
- TRX Push-Up
- TRX Row
- Tuck Jump
- Turkish Get-Up (Light/No Weight)

**Mckenzie** (2):
- Sitting Flexion
- Standing Flexion (Touch Toes)

**Rehab** (2):
- Partial Curl-Up (Williams)
- Seated Forward Flexion (Williams)

**Warmup** (5):
- Bear Crawl
- Carioca / Grapevine
- Inchworm
- Squat to Stand
- Toy Soldiers (Straight Leg Kicks)

---

### Acute Disc Herniation (Non-Surgical)
**Body Area**: Lower Back | **Severity**: 3/5 | **Exercises Blocked**: 12

Active disc bulge with radiating symptoms. Loaded flexion, heavy deadlifts, and ballistic spinal movements are blocked. McKenzie protocol exercises are automatically added to every session.

**Cooldown** (2):
- Headstand Prep (Wall Only)
- Wheel Pose (Full Backbend)

**Main** (10):
- Ab Wheel Rollout (From Knees)
- Front Squat
- Kettlebell Swing (Russian)
- Kettlebell Turkish Get-Up
- Medicine Ball Rotational Throw
- Medicine Ball Slam
- Power Clean (from Hang)
- Trap Bar Deadlift (Low Handles)
- TRX Pike
- Turkish Get-Up (Light/No Weight)

---

### Chronic Low Back Pain (Managed)
**Body Area**: Lower Back | **Severity**: 2/5 | **Exercises Blocked**: 2

Ongoing but manageable back pain. Nearly all exercises remain available. Only the highest-risk movements (Power Clean, Full Backbend) are blocked.

**Cooldown** (1):
- Wheel Pose (Full Backbend)

**Main** (1):
- Power Clean (from Hang)

---

### ACL Reconstruction (Post-Surgical)
**Body Area**: Knee | **Severity**: 4/5 | **Exercises Blocked**: 85

Post-surgical ACL repair in recovery. Deep flexion, plyometrics, single-leg loaded movements, and high-impact activities are blocked. Bike and pool cardio only.

**Cardio** (4):
- Big Step Walking (LSVT BIG Concept)
- Hill Sprints (Short)
- Incline Treadmill Walk
- Sprint Intervals (20m)

**Cooldown** (4):
- Dancer's Pose
- Pigeon Pose (Modified with Props)
- Quadriceps Stretch (Side-Lying)
- Seated Glute Stretch (Figure 4)

**Main** (54):
- Band Hamstring Curl (Prone)
- Band Squat
- Barbell Hip Thrust
- Bodyweight Squat
- BOSU Ball Squat
- BOSU Reverse Lunge
- Box Drill (4-Corner)
- Box Jump
- Broad Jump
- Bulgarian Split Squat (Bodyweight)
- Bulgarian Split Squat (Loaded)
- Cone Shuffle Drill
- Depth Jump
- Dual-Task Walking
- Front Squat
- Goblet Squat
- Kettlebell Goblet Squat
- Kettlebell Swing (Russian)
- Kettlebell Turkish Get-Up
- L-Drill (Cone)
- Ladder Crossover
- Ladder Icky Shuffle
- Ladder In-Out
- Ladder Lateral Shuffle
- Ladder Quick Feet
- Lateral Bound
- Medicine Ball Overhead Throw
- Medicine Ball Slam
- Park Bench Step-Ups
- Pistol Squat (Assisted)
- Power Clean (from Hang)
- Pro Agility (5-10-5)
- Reaction Ball Catches
- Shuttle Run (5-10-5)
- Single-Leg Balance Eyes Closed
- Single-Leg Balance on BOSU
- Single-Leg Balance with Reach
- Single-Leg Hop and Stick
- Single-Leg Hop to Stabilization
- Single-Leg Squat to Box
- Sled Pull (Backward or Rope)
- Sled Push
- Squat Jump
- Stability Ball Hamstring Curl
- Stability Ball Wall Squat
- T-Drill
- Tandem Stance Walk (Heel-to-Toe)
- Trap Bar Deadlift (High Handles)
- Trap Bar Deadlift (Low Handles)
- TRX Hamstring Curl
- TRX Lunge (Rear Foot Suspended)
- TRX Squat
- Tuck Jump
- Turkish Get-Up (Light/No Weight)

**Rehab** (15):
- Cook Hip Lift
- Eccentric Squat on Decline Board
- Isometric Squat Hold (Wall Sit)
- Kneeling Hip Flexor Stretch
- Lateral Band Walk
- Monster Walk (Band)
- Pigeon Pose (Modified)
- Quadruped Hip Circles
- Single-Leg Balance on Unstable Surface
- Single-Leg Press (Machine, Limited ROM)
- Spanish Squat (Band Behind Knees)
- Standing Hip Flexor March (Band)
- Step-Down (High Box 8 inches)
- Step-Down (Low Box 4 inches)
- Tall Kneeling Balance

**Warmup** (8):
- Bear Crawl
- Butt Kicks (Walking)
- Carioca / Grapevine
- High Knees (March or Skip)
- Lateral Shuffle
- Squat to Stand
- Walking Lunges (Bodyweight)
- World's Greatest Stretch

---

### Meniscus Tear / Patellofemoral Pain
**Body Area**: Knee | **Severity**: 3/5 | **Exercises Blocked**: 39

Active knee pain with mechanical symptoms. Deep squats, lunges past safe ROM, plyometrics, and heavy single-leg loading are restricted. Squat depth limited to 60 degrees.

**Cardio** (2):
- Hill Sprints (Short)
- Sprint Intervals (20m)

**Cooldown** (1):
- Dancer's Pose

**Main** (29):
- Box Drill (4-Corner)
- Box Jump
- Broad Jump
- Bulgarian Split Squat (Bodyweight)
- Bulgarian Split Squat (Loaded)
- Cone Shuffle Drill
- Depth Jump
- Front Squat
- Kettlebell Turkish Get-Up
- L-Drill (Cone)
- Ladder Crossover
- Ladder Icky Shuffle
- Ladder In-Out
- Ladder Lateral Shuffle
- Ladder Quick Feet
- Lateral Bound
- Medicine Ball Overhead Throw
- Pistol Squat (Assisted)
- Power Clean (from Hang)
- Pro Agility (5-10-5)
- Shuttle Run (5-10-5)
- Single-Leg Balance on BOSU
- Single-Leg Hop and Stick
- Single-Leg Hop to Stabilization
- Squat Jump
- T-Drill
- TRX Lunge (Rear Foot Suspended)
- Tuck Jump
- Turkish Get-Up (Light/No Weight)

**Rehab** (2):
- Single-Leg Press (Machine, Limited ROM)
- Step-Down (High Box 8 inches)

**Warmup** (5):
- Butt Kicks (Walking)
- Carioca / Grapevine
- High Knees (March or Skip)
- Lateral Shuffle
- Walking Lunges (Bodyweight)

---

### Mild Knee Pain (Tracking Issue)
**Body Area**: Knee | **Severity**: 2/5 | **Exercises Blocked**: 4

Minor knee discomfort. Most exercises remain safe. Only high-risk single-leg plyometrics and extreme flexion movements are blocked.

**Cardio** (1):
- Hill Sprints (Short)

**Main** (3):
- Box Jump
- Single-Leg Hop and Stick
- Single-Leg Hop to Stabilization

---

### Labrum Repair (Post-Surgical)
**Body Area**: Shoulder | **Severity**: 4/5 | **Exercises Blocked**: 86

Post-surgical shoulder repair. All overhead pressing, heavy bench press, pull-ups, hanging, and end-range movements are blocked. Only floor press, push-ups, and supported rows are allowed.

**Cardio** (4):
- Battle Ropes
- Seated Punches (Shadow Boxing)
- Sprint Intervals (20m)
- Upper Body Ergometer (Arm Bike)

**Cooldown** (11):
- Anterior Shoulder Stretch
- Chest Stretch (Hands Behind Back)
- Cross-Body Shoulder Stretch
- Crow Pose
- Dancer's Pose
- Downward Dog
- Headstand Prep (Wall Only)
- Pec Doorway Stretch
- Seated Eagle Arms
- Side Plank Pose
- Wheel Pose (Full Backbend)

**Main** (60):
- Ab Wheel Rollout (From Knees)
- Arnold Press
- Band Chest Press
- Band Lat Pulldown
- Band Overhead Press
- Barbell Bench Press
- Barbell Incline Bench Press
- Barbell Overhead Press
- BOSU Push-Up
- Cable Fly (High to Low)
- Cable Fly (Low to High)
- Captain's Chair Lift
- Chair Dips
- Chin-Up
- Dead Hang (Pull-Up Bar)
- Depth Jump
- Dumbbell Bench Press
- Dumbbell Floor Press
- Floor Push-Up
- Front Squat
- Incline Push-Up
- Inverted Row
- Kettlebell Single-Arm Press
- Kettlebell Swing (Russian)
- Kettlebell Turkish Get-Up
- L-Drill (Cone)
- Ladder Crossover
- Ladder Icky Shuffle
- Ladder In-Out
- Ladder Lateral Shuffle
- Landmine Press
- Lateral Bound
- Lateral Raise (Dumbbell)
- Medicine Ball Overhead Throw
- Medicine Ball Rotational Throw
- Medicine Ball Slam
- Overhead Carry
- Park Bench Incline Push-Ups
- Park Bench Tricep Dips
- Pike Push-Up
- Playground Pull-Ups / Hanging
- Power Clean (from Hang)
- Pro Agility (5-10-5)
- Renegade Row
- Seated Chest Press (Band)
- Seated Lateral Raise (DB, Light)
- Seated Shoulder Press (DB/Band)
- Seated Tricep Extension (DB/Band)
- Shuttle Run (5-10-5)
- Single-Leg Dumbbell Shoulder Press
- Sled Pull (Backward or Rope)
- Sled Push
- Squat Jump
- Stability Ball Dumbbell Fly
- Stability Ball Push-Up
- Stability Ball Y-T-W Raises
- TRX Pike
- TRX Push-Up
- TRX Y-Raise
- Turkish Get-Up (Light/No Weight)

**Rehab** (7):
- Band Pull-Apart (High Rep)
- Pec Doorway Stretch
- Prone T-Raise
- Prone W-Raise
- Prone Y-Raise
- Serratus Anterior Wall Slide
- Wall Angel

**Warmup** (4):
- Bear Crawl
- Inchworm
- Kettlebell Halo
- Shoulder Pass-Throughs (Band/Dowel)

---

### Rotator Cuff Tendinitis / Impingement
**Body Area**: Shoulder | **Severity**: 3/5 | **Exercises Blocked**: 31

Active shoulder inflammation. Overhead pressing and extreme ranges are blocked. Landmine press and floor press remain safe alternatives.

**Cardio** (1):
- Battle Ropes

**Cooldown** (4):
- Cross-Body Shoulder Stretch
- Crow Pose
- Headstand Prep (Wall Only)
- Wheel Pose (Full Backbend)

**Main** (25):
- Arnold Press
- Band Overhead Press
- Barbell Bench Press
- Barbell Incline Bench Press
- Barbell Overhead Press
- Cable Fly (High to Low)
- Cable Fly (Low to High)
- Captain's Chair Lift
- Chair Dips
- Dumbbell Bench Press
- Dumbbell Floor Press
- Front Squat
- Kettlebell Single-Arm Press
- Kettlebell Turkish Get-Up
- Lateral Raise (Dumbbell)
- Medicine Ball Slam
- Overhead Carry
- Park Bench Tricep Dips
- Playground Pull-Ups / Hanging
- Power Clean (from Hang)
- Seated Lateral Raise (DB, Light)
- Seated Shoulder Press (DB/Band)
- Seated Tricep Extension (DB/Band)
- Stability Ball Dumbbell Fly
- Turkish Get-Up (Light/No Weight)

**Warmup** (1):
- Shoulder Pass-Throughs (Band/Dowel)

---

### Mild Shoulder Instability
**Body Area**: Shoulder | **Severity**: 2/5 | **Exercises Blocked**: 4

Minor instability or anterior discomfort. Most exercises remain safe. Only extreme overhead and behind-neck positions are blocked.

**Cooldown** (2):
- Headstand Prep (Wall Only)
- Wheel Pose (Full Backbend)

**Main** (2):
- Chair Dips
- Dumbbell Bench Press

---

## Additional Safety Protections

Beyond the gate system, the app runs 15 additional safety checks on every workout:

1. **Directional Preference** — If a PT indicates "extension preference" (common after disc herniation), ALL flexion exercises are automatically removed from the plan, and vice versa.

2. **Safety Tiers** — Exercises are Green (safe for all), Yellow (caution), or Red (high risk). Post-surgical users are limited to Green exercises only.

3. **Phase Gating** — Plyometrics, Olympic lifts, and heavy compounds are locked to later training phases and cannot appear during early rehabilitation.

4. **Effort Cap** — For severe lower back conditions (severity 3+), maximum effort is capped at RPE 5 (easy-moderate) regardless of user selection.

5. **Volume Limits** — Weekly set limits per muscle group prevent overtraining. Post-surgical users have lower limits.

6. **48-Hour Recovery** — Same primary muscle group cannot be trained on consecutive days (core and calves excepted per NASM/NSCA guidelines).

7. **Plyometric Readiness** — Jumping exercises require baseline strength above 20th percentile, single-leg balance above 15 seconds, and Phase 3+ clearance.

8. **Post-Surgical Window** — Within 4 weeks of surgery, additional safety flags activate and more exercises are blocked.

9. **Multiple Conditions** — When a user has 2+ injuries, the MOST restrictive rule from each is applied. If fewer than 10 exercises remain available, the system flags for PT consultation.

10. **Medication Interactions** — Blood pressure medications and blood thinners trigger intensity restrictions on high-intensity cardio.

## Mesocycle Injury Adjustments

These restrictions apply ON TOP of the gate system during the training program:

### Lower Back (Severity 3-5)
- **Hinge exercises**: ONLY glute bridges for first 4 weeks. No deadlifts of any kind.
- **Squat exercises**: ONLY wall squat or stability ball squat. No free-standing loaded squats.
- **Core**: Supine only (dead bug, pelvic tilt). NO planks until week 4+ and pain-free.
- **McKenzie protocol**: Mandatory 2-3 times daily (morning + workout + evening).
- **Max effort**: RPE 5 on any exercise involving the spine.
- **Phase advancement**: BLOCKED until severity drops to 2 or below.

### Knee (Severity 3-5)
- **Squat**: Chair sit-to-stand or wall sit ONLY. No loaded squats.
- **No lunges**, no step-ups higher than 4 inches.
- **Cardio**: Bike or pool ONLY. No treadmill if painful.
- **Mandatory**: VMO activation and knee rehab exercises every session.
- **Phase advancement**: BLOCKED until severity drops to 2 or below.

### Shoulder (Severity 3-5)
- **Push**: Floor press and push-ups ONLY. No bench press.
- **Pull**: Machine or supported rows ONLY. No pull-ups or hanging.
- **No direct shoulder isolation** until severity drops to 2.
- **Mandatory**: Pendulum swings, isometric ER/IR, scapular exercises every session.
- **Phase advancement**: BLOCKED until severity drops to 2 or below.

---

## How to Adjust These Rules

### Option 1: Change a User's Injury Severity
In the app: **Home > Settings (gear icon) > Edit Injuries & Conditions**

- Lowering severity from 4 to 3 unlocks all exercises with gate value 3
- Lowering from 3 to 2 unlocks all exercises with gate value 2
- Marking an injury as "resolved" removes ALL blocks for that body area

### Option 2: Change an Exercise's Gate Value
In the file: `src/data/exercises.json`

Each exercise has a gate object that looks like this:

```
"severity_gate": {
  "lower_back": 3,   <-- Blocked when back severity is 4 or 5
  "knee": 3,         <-- Blocked when knee severity is 4 or 5
  "shoulder": 5      <-- Never blocked by shoulder (5 = no restriction)
}
```

To make an exercise **more restrictive**: lower the gate number.
To make an exercise **less restrictive**: raise the gate number.
To **block for all injury levels**: set gate to 0.
To **never block**: set gate to 5.

### Option 3: Full Exercise Reference
See **docs/EXERCISE_GATE_REFERENCE.md** for a complete table of all 409 exercises with their gate values.

---

_Last updated: 2026-04-04 | 409 exercises in database_
