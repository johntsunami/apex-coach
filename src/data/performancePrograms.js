// ═══════════════════════════════════════════════════════════════
// APEX Coach — Performance Programs
// Standalone goal-specific add-on programs users activate alongside
// regular training. Each has its own progression, testing, tracking.
// ═══════════════════════════════════════════════════════════════

export const PERFORMANCE_PROGRAMS = {

  max_pushups: {
    id: "max_pushups", name: "Max Push-Up Program", icon: "💪",
    description: "Build toward your push-up goal using Grease the Groove — proven to outperform traditional high-rep training.",
    duration: 8, prerequisite: "Can perform at least 5 push-ups with good form",
    requiresTest: true, testExercise: "push_up", testType: "max_reps",
    volumeOffset: { chest: -3 }, // reduce main workout chest sets
    tiers: [
      { name: "Beginner", maxRange: [1, 10], method: "ladder" },
      { name: "Intermediate", maxRange: [11, 30], method: "gtg" },
      { name: "Advanced", maxRange: [31, 60], method: "gtg" },
      { name: "Elite", maxRange: [61, 999], method: "gtg" },
    ],
    weeklyProgression: [
      { week: 1, repPct: 0.50, sets: 5, note: "Foundation — build the habit" },
      { week: 2, repPct: 0.55, sets: 5, note: "Slight increase" },
      { week: 3, repPct: 0.60, sets: 5, note: "Building volume" },
      { week: 4, repPct: 0.50, sets: 4, note: "DELOAD — recovery week" },
      { week: 5, repPct: 0.60, sets: 6, note: "Increased frequency" },
      { week: 6, repPct: 0.65, sets: 6, note: "Pushing limits" },
      { week: 7, repPct: 0.70, sets: 5, note: "Peak week — quality focus" },
      { week: 8, repPct: 0.50, sets: 3, note: "TAPER — test at end of week" },
    ],
    retestWeeks: [4, 8],
    restBetweenSets: "1+ hours (spread throughout day)",
    conditionRestrictions: {
      carpal_tunnel: { 3: { modification: "Push-ups on fists or parallettes" } },
      lower_back: { 3: { modification: "Incline push-ups only" } },
    },
  },

  max_pullups: {
    id: "max_pullups", name: "Max Pull-Up Program", icon: "🏋️",
    description: "From zero to hero. Whether you can't do one yet or want to hit 20+, this program adapts to you.",
    duration: 12, prerequisite: "Access to a pull-up bar",
    requiresTest: true, testExercise: "pull_up", testType: "max_reps",
    volumeOffset: { back: -3 },
    tiers: [
      { name: "Zero to One", maxRange: [0, 0], method: "negatives" },
      { name: "Building Base", maxRange: [1, 5], method: "gtg_assisted" },
      { name: "Intermediate", maxRange: [6, 12], method: "gtg" },
      { name: "Advanced", maxRange: [13, 20], method: "armstrong" },
      { name: "Elite", maxRange: [21, 999], method: "weighted" },
    ],
    weeklyProgression: [
      { week: 1, repPct: 0.40, sets: 5, note: "Start conservative" },
      { week: 2, repPct: 0.45, sets: 5 }, { week: 3, repPct: 0.50, sets: 5 },
      { week: 4, repPct: 0.40, sets: 3, note: "DELOAD" },
      { week: 5, repPct: 0.50, sets: 6 }, { week: 6, repPct: 0.55, sets: 6 },
      { week: 7, repPct: 0.60, sets: 5 }, { week: 8, repPct: 0.45, sets: 3, note: "DELOAD" },
      { week: 9, repPct: 0.60, sets: 6 }, { week: 10, repPct: 0.65, sets: 5 },
      { week: 11, repPct: 0.65, sets: 6, note: "Peak volume" },
      { week: 12, repPct: 0.40, sets: 3, note: "TAPER — test end of week" },
    ],
    retestWeeks: [6, 12],
    restBetweenSets: "1+ hours (spread throughout day)",
    conditionRestrictions: {
      labrum_tear_shoulder: {
        1: { allowed: true, modification: "Neutral grip only, no kipping, stop if pinching" },
        2: { allowed: true, modification: "Band-assisted only, neutral grip, max 5 reps" },
        3: { allowed: false, substitute: "Lat pulldown machine, band rows" },
      },
    },
  },

  max_squats: {
    id: "max_squats", name: "Max BW Squat Program", icon: "🦵",
    description: "Build lower body muscular endurance to hit high rep counts.",
    duration: 6, prerequisite: "Can squat to parallel with good form",
    requiresTest: true, testExercise: "bodyweight_squat", testType: "max_reps",
    volumeOffset: { legs: -2 },
    tiers: [
      { name: "Beginner", maxRange: [1, 20], method: "rep_goal" },
      { name: "Intermediate", maxRange: [21, 50], method: "rep_goal" },
      { name: "Advanced", maxRange: [51, 999], method: "density" },
    ],
    weeklyProgression: [
      { week: 1, totalReps: "2x max", sets: "as needed", rest: 30, note: "Hit the total however many sets" },
      { week: 2, totalReps: "2.5x max", sets: "as needed", rest: 30 },
      { week: 3, method: "timed", workTime: 60, restTime: 30, rounds: 5, note: "AMRAP in 60s" },
      { week: 4, totalReps: "1.5x max", sets: 3, rest: 60, note: "DELOAD" },
      { week: 5, method: "ladder", pattern: "10-20-30-40-50-40-30-20-10", rest: 30 },
      { week: 6, note: "TAPER: Day 1 = 50% x 3, Day 2 = rest, Day 3 = MAX TEST" },
    ],
    retestWeeks: [3, 6],
    schedule: "3x/week",
    conditionRestrictions: {
      knee_osteoarthritis: { 2: { modification: "Limit depth to 90°" } },
      acl_post_op: { 2: { modification: "Limit depth, no speed reps" } },
    },
  },

  vertical_jump: {
    id: "vertical_jump", name: "Vertical Jump Program", icon: "🚀",
    description: "Increase your vertical leap using complex training — combining heavy strength with explosive plyometrics.",
    duration: 12, prerequisite: "Phase 2+, single-leg balance 30s, no acute knee/ankle",
    requiresTest: true, testExercise: "vertical_jump", testType: "max_height",
    requiresPhase: 2,
    volumeOffset: { legs: -4 },
    tiers: [
      { name: "Foundation", maxRange: [0, 18], method: "strength_base" },
      { name: "Intermediate", maxRange: [19, 24], method: "complex" },
      { name: "Advanced", maxRange: [25, 999], method: "peaking" },
    ],
    phases: [
      { name: "Strength Base", weeks: [1, 4], focus: "Build raw force — heavy squats, hip thrusts, calf work" },
      { name: "Power Development", weeks: [5, 8], focus: "Complex training — pair heavy lifts with plyometrics" },
      { name: "Peaking", weeks: [9, 12], focus: "Reduce volume, max intensity, neural drive" },
    ],
    retestWeeks: [4, 8, 12],
    schedule: "3x/week (reduce to 2x in peaking)",
    landingCues: [
      "Land softly — bend knees, hips, ankles to absorb",
      "Knees track over toes — NO valgus",
      "Stick every landing 2 seconds before next rep",
      "If landing breaks down, STOP the set",
    ],
    conditionRestrictions: {
      acl_post_op: {
        1: { allowed: true, modification: "No depth jumps, land softly, start Phase A only" },
        2: { allowed: false, substitute: "Strength base only — no plyometrics" },
        3: { allowed: false },
      },
      patellar_tendinopathy: {
        1: { allowed: true, modification: "Reduce depth jump height, increase rest" },
        2: { allowed: false },
      },
      lower_back: {
        1: { allowed: true, modification: "Trap bar only, brace core on all jumps" },
        2: { modification: "No depth jumps, limit to box jumps and squat jumps" },
      },
    },
  },
};

// Blocked program combinations (overtraining risk)
export const BLOCKED_COMBOS = [
  ["vertical_jump", "max_squats"], // same muscle group
];

export const MAX_ACTIVE_PROGRAMS = 2;
