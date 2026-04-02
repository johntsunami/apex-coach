// ═══════════════════════════════════════════════════════════════
// APEX Coach — Baseline Fitness Assessment Engine
// 7 standard tests with ACSM/NSCA norms, injury-aware alternatives,
// capability tag derivation, and auto-selection logic
// ═══════════════════════════════════════════════════════════════

import { getInjuries } from "./injuries.js";

const STORAGE_KEY = "apex_baseline_tests";

// ── ACSM/NSCA Norm Tables ────────────────────────────────────
// Source: ACSM Guidelines for Exercise Testing 11th ed, NSCA Essentials 4th ed
// Format: [percentile_20, percentile_40, percentile_60, percentile_80]
// Below 20th = "Needs Work", 20-40 = "Below Average", 40-60 = "Average", 60-80 = "Above Average", 80+ = "Excellent"

const NORMS = {
  pushups: {
    male: {
      "20-29": [17, 22, 29, 36],
      "30-39": [12, 17, 24, 30],
      "40-49": [10, 13, 18, 24],
      "50-59": [7, 10, 13, 19],
      "60+":   [5, 8, 11, 17],
    },
    female: {
      "20-29": [6, 10, 15, 21],
      "30-39": [4, 8, 12, 17],
      "40-49": [3, 6, 10, 14],
      "50-59": [2, 4, 7, 12],
      "60+":   [1, 3, 5, 9],
    },
  },
  squat: {
    // Bodyweight squat reps — NSCA functional fitness norms
    male: {
      "20-29": [20, 28, 35, 45],
      "30-39": [18, 24, 30, 40],
      "40-49": [14, 20, 26, 34],
      "50-59": [10, 16, 22, 28],
      "60+":   [8, 12, 18, 24],
    },
    female: {
      "20-29": [15, 22, 28, 36],
      "30-39": [12, 18, 24, 32],
      "40-49": [10, 15, 20, 28],
      "50-59": [8, 12, 16, 22],
      "60+":   [5, 9, 14, 18],
    },
  },
  pullups: {
    male: {
      "20-29": [1, 4, 8, 13],
      "30-39": [1, 3, 6, 10],
      "40-49": [0, 2, 5, 8],
      "50-59": [0, 1, 3, 6],
      "60+":   [0, 0, 2, 4],
    },
    female: {
      "20-29": [0, 0, 1, 4],
      "30-39": [0, 0, 1, 3],
      "40-49": [0, 0, 0, 2],
      "50-59": [0, 0, 0, 1],
      "60+":   [0, 0, 0, 1],
    },
  },
  plank: {
    // Plank hold in seconds — McGill endurance norms
    male: {
      "20-29": [30, 60, 90, 120],
      "30-39": [25, 50, 75, 105],
      "40-49": [20, 40, 65, 90],
      "50-59": [15, 35, 55, 75],
      "60+":   [10, 25, 45, 65],
    },
    female: {
      "20-29": [20, 45, 72, 100],
      "30-39": [18, 38, 60, 85],
      "40-49": [15, 30, 50, 75],
      "50-59": [10, 25, 40, 60],
      "60+":   [8, 20, 35, 50],
    },
  },
  gluteBridge: {
    // Glute bridge hold seconds
    male: {
      "20-29": [20, 40, 60, 90],
      "30-39": [18, 35, 55, 80],
      "40-49": [15, 30, 50, 70],
      "50-59": [12, 25, 40, 60],
      "60+":   [10, 20, 35, 50],
    },
    female: {
      "20-29": [18, 35, 55, 80],
      "30-39": [15, 30, 50, 70],
      "40-49": [12, 25, 42, 60],
      "50-59": [10, 20, 35, 50],
      "60+":   [8, 16, 28, 42],
    },
  },
  balance: {
    // Single leg balance eyes open in seconds
    male: {
      "20-29": [15, 25, 38, 50],
      "30-39": [12, 22, 34, 46],
      "40-49": [10, 18, 28, 40],
      "50-59": [8, 14, 22, 32],
      "60+":   [5, 10, 16, 24],
    },
    female: {
      "20-29": [14, 24, 36, 48],
      "30-39": [12, 20, 32, 44],
      "40-49": [10, 16, 26, 38],
      "50-59": [7, 13, 20, 30],
      "60+":   [4, 9, 14, 22],
    },
  },
  sitToStand: {
    // 30-second sit-to-stand count — SFS norms
    male: {
      "20-29": [14, 18, 22, 26],
      "30-39": [12, 16, 20, 24],
      "40-49": [10, 14, 18, 22],
      "50-59": [9, 12, 16, 20],
      "60+":   [7, 10, 14, 18],
    },
    female: {
      "20-29": [12, 16, 20, 24],
      "30-39": [10, 14, 18, 22],
      "40-49": [9, 12, 16, 20],
      "50-59": [7, 10, 14, 18],
      "60+":   [5, 8, 12, 16],
    },
  },
};

// ── Age bracket helper ────────────────────────────────────────
function getAgeBracket(age) {
  if (!age || age < 20) return "20-29";
  if (age < 30) return "20-29";
  if (age < 40) return "30-39";
  if (age < 50) return "40-49";
  if (age < 60) return "50-59";
  return "60+";
}

// ── Percentile ranking from norm table ─────────────────────────
function getPercentile(value, normRow) {
  if (!normRow) return 50;
  const [p20, p40, p60, p80] = normRow;
  if (value >= p80) return 80 + Math.min(20, Math.round(((value - p80) / Math.max(1, p80 - p60)) * 10));
  if (value >= p60) return 60 + Math.round(((value - p60) / Math.max(1, p80 - p60)) * 20);
  if (value >= p40) return 40 + Math.round(((value - p40) / Math.max(1, p60 - p40)) * 20);
  if (value >= p20) return 20 + Math.round(((value - p20) / Math.max(1, p40 - p20)) * 20);
  return Math.max(1, Math.round((value / Math.max(1, p20)) * 20));
}

// ── Rating from percentile ─────────────────────────────────────
function getRating(percentile) {
  if (percentile >= 80) return { label: "Excellent", color: "#22c55e", emoji: "🟢" };
  if (percentile >= 60) return { label: "Above Average", color: "#14b8a6", emoji: "🔵" };
  if (percentile >= 40) return { label: "Average", color: "#eab308", emoji: "🟡" };
  if (percentile >= 20) return { label: "Below Average", color: "#f97316", emoji: "🟠" };
  return { label: "Needs Work", color: "#ef4444", emoji: "🔴" };
}

// ── 7 TEST DEFINITIONS ────────────────────────────────────────

export const BASELINE_TESTS = [
  {
    id: "pushups",
    name: "Push-Up Test",
    category: "Upper Body Push",
    standard: "NASM/ACSM",
    type: "reps", // reps | time | count
    unit: "reps",
    description: "Max reps with proper form — chest touches fist height from floor, full lockout, no sagging",
    instructions: [
      "Start in plank position, hands shoulder-width apart",
      "Lower chest until it touches a fist placed on the floor",
      "Press up to full lockout (elbows fully extended)",
      "Maintain rigid plank throughout — no sagging or piking",
      "Count each rep with proper form only",
      "Stop when form breaks or you can't complete a full rep",
    ],
    formCues: [
      "Core braced — ribs pulled down, glutes tight",
      "Elbows at 45° angle (not flared out)",
      "Full range of motion every rep",
    ],
    commonFaults: [
      "Hips sagging below shoulder line",
      "Incomplete range — not touching floor or not locking out",
      "Head dropping forward / neck strain",
    ],
    getAlternative(injuries) {
      const shoulder = injuries.find(i => (i.area || "").toLowerCase().includes("shoulder"));
      const wrist = injuries.find(i => (i.area || "").toLowerCase().includes("wrist"));
      if (shoulder && shoulder.severity >= 3) return { name: "Wall Push-Up", note: "Record reps — shoulder restriction", modification: "wall_pushup" };
      if (shoulder && shoulder.severity >= 2) return { name: "Incline Push-Up (elevated hands)", note: "Record reps + surface height", modification: "incline_pushup" };
      if (wrist) return { name: "Fist Push-Ups", note: "Neutral wrist position — record reps", modification: "fist_pushup" };
      return null;
    },
    shouldSkip(injuries) {
      const upper = injuries.find(i => (i.area || "").toLowerCase().includes("shoulder") || (i.area || "").toLowerCase().includes("chest"));
      return upper && upper.severity >= 4 && upper.type?.toLowerCase().includes("surgical");
    },
    skipReason: "Medical restriction — post-surgical upper body",
  },
  {
    id: "squat",
    name: "Bodyweight Squat Test",
    category: "Lower Body Push",
    standard: "NSCA",
    type: "reps",
    unit: "reps",
    description: "Max reps to parallel with proper form — knees tracking toes, neutral spine, full depth",
    instructions: [
      "Stand with feet shoulder-width apart, toes slightly out",
      "Squat down until thighs are parallel to the floor",
      "Keep knees tracking over toes — no caving inward",
      "Maintain neutral spine — chest up, back flat",
      "Drive through heels to stand fully",
      "Record reps AND depth reached AND any compensations",
    ],
    formCues: [
      "Weight in heels — wiggle toes at bottom",
      "Chest stays up, eyes forward",
      "Knees push out over pinky toes",
    ],
    commonFaults: [
      "Knees caving inward (valgus collapse)",
      "Excessive forward lean / back rounding",
      "Heels rising off the ground",
    ],
    depthOptions: ["full", "parallel", "quarter"],
    compensationOptions: ["knees_cave", "forward_lean", "heels_rise", "back_round"],
    getAlternative(injuries) {
      const knee = injuries.find(i => (i.area || "").toLowerCase().includes("knee"));
      const hip = injuries.find(i => (i.area || "").toLowerCase().includes("hip"));
      const back = injuries.find(i => (i.area || "").toLowerCase().includes("back"));
      if (knee && knee.severity >= 3) return { name: "Wall Sit Hold", note: "Record seconds at 45° — knee restriction", modification: "wall_sit", type: "time", unit: "seconds" };
      if (hip && hip.type?.toLowerCase().includes("replacement")) return { name: "Chair Sit-to-Stand (arm assist)", note: "Record count in 30s", modification: "chair_sts", type: "count", unit: "reps in 30s" };
      if (back && back.severity >= 3) return { name: "Squat to High Box", note: "Record reps + box height", modification: "box_squat" };
      return null;
    },
    shouldSkip() { return false; },
  },
  {
    id: "pullups",
    name: "Pull-Up / Hang Test",
    category: "Upper Body Pull",
    standard: "NSCA",
    type: "tiered",
    unit: "reps",
    tiers: [
      { id: "A", name: "Strict Pull-Ups", desc: "Full dead hang to chin over bar", type: "reps", unit: "reps" },
      { id: "B", name: "Chin-Ups", desc: "Supinated grip, full dead hang to chin over bar", type: "reps", unit: "reps" },
      { id: "C", name: "Dead Hang", desc: "Max time hanging from bar", type: "time", unit: "seconds" },
      { id: "D", name: "Inverted Row / Band Row", desc: "Max reps at specified angle or band", type: "reps", unit: "reps" },
    ],
    description: "Tiered test: try pull-ups first → chin-ups → dead hang → rows",
    instructions: [
      "Tier A: Attempt strict pull-ups (pronated grip, full dead hang to chin over bar)",
      "If 0 pull-ups → Tier B: Try chin-ups (supinated grip)",
      "If 0 chin-ups → Tier C: Dead hang for max time",
      "If no bar → Tier D: Inverted rows or band rows",
    ],
    formCues: [
      "Start from full dead hang — no kipping",
      "Chin must clear the bar for a rep",
      "Lower under control, full extension each rep",
    ],
    commonFaults: [
      "Kipping or swinging for momentum",
      "Partial range — chin not clearing bar",
      "Not returning to full dead hang between reps",
    ],
    getAlternative(injuries) {
      const shoulder = injuries.find(i => (i.area || "").toLowerCase().includes("shoulder"));
      const back = injuries.find(i => (i.area || "").toLowerCase().includes("back"));
      if (shoulder && shoulder.severity >= 2) return { name: "Seated Band Row", note: "Record band color + reps", modification: "band_row", type: "reps", unit: "reps" };
      if (back && back.severity >= 3) return { name: "Supported Inverted Row", note: "Record angle + reps", modification: "supported_row", type: "reps", unit: "reps" };
      return null;
    },
    shouldSkip() { return false; },
  },
  {
    id: "plank",
    name: "Plank Hold",
    category: "Core Anti-Extension",
    standard: "McGill",
    type: "time",
    unit: "seconds",
    description: "Max time in proper plank — neutral spine, glutes engaged, no sagging or piking",
    instructions: [
      "Forearm plank position — elbows under shoulders",
      "Body in a straight line from head to heels",
      "Squeeze glutes, brace core at ~30%",
      "Timer stops when form breaks (hips sag >2 inches or pike)",
      "Record time AND which fault ended it",
    ],
    formCues: [
      "Imagine a broomstick along your spine — maintain contact at head, upper back, and tailbone",
      "Breathe! Don't hold your breath",
      "Pull elbows slightly toward toes to engage core more",
    ],
    commonFaults: [
      "Hips sagging — lower back arches",
      "Hips piking up — pushing butt into the air",
      "Shaking excessively — sign to stop",
    ],
    faultOptions: ["sag", "pike", "shaking", "pain"],
    getAlternative(injuries) {
      const back = injuries.find(i => (i.area || "").toLowerCase().includes("back"));
      if (back && back.severity >= 4) return { name: "Supine Abdominal Draw-In", note: "Record hold time in seconds", modification: "draw_in", type: "time", unit: "seconds" };
      if (back && back.severity >= 3) return { name: "Dead Bug Reps", note: "Record slow-tempo reps", modification: "dead_bug", type: "reps", unit: "reps" };
      return null;
    },
    shouldSkip() { return false; },
  },
  {
    id: "gluteBridge",
    name: "Glute Bridge Hold",
    category: "Posterior Chain",
    standard: "PT Standard",
    type: "time",
    unit: "seconds",
    description: "Max hold at top position — full hip extension, glutes squeezed",
    instructions: [
      "Lie on back, knees bent, feet flat on floor hip-width apart",
      "Drive hips up until body forms straight line from shoulders to knees",
      "Squeeze glutes hard at the top",
      "Hold as long as possible with proper form",
      "If bilateral >60s, test single-leg",
    ],
    formCues: [
      "Drive through heels, not toes",
      "Maximum glute squeeze at top — think about cracking a walnut",
      "Don't hyperextend lower back",
    ],
    commonFaults: [
      "Hamstrings cramping — feet too far from hips",
      "Back arching instead of hip extending",
      "Hips dropping before test ends",
    ],
    getAlternative(injuries) {
      const back = injuries.find(i => (i.area || "").toLowerCase().includes("back"));
      const hip = injuries.find(i => (i.area || "").toLowerCase().includes("hip"));
      if (back && back.severity >= 4) return { name: "Prone Glute Squeeze Hold", note: "Record time in seconds", modification: "prone_squeeze" };
      if (hip && hip.type?.toLowerCase().includes("replacement")) return { name: "Modified Bridge (limited ROM)", note: "Record time + ROM achieved", modification: "modified_bridge" };
      return null;
    },
    shouldSkip() { return false; },
  },
  {
    id: "balance",
    name: "Single Leg Balance",
    category: "Proprioception",
    standard: "Clinical Validated",
    type: "balance",
    unit: "seconds",
    description: "Test BOTH sides: max time eyes open, then eyes closed",
    instructions: [
      "Stand on one leg, other foot lifted off ground",
      "Arms at sides (not on hips)",
      "Time how long you can hold without touching down",
      "Test LEFT eyes open, then LEFT eyes closed",
      "Test RIGHT eyes open, then RIGHT eyes closed",
      "Note: >20% asymmetry flags compensation",
    ],
    formCues: [
      "Fix gaze on a point at eye level",
      "Keep standing knee slightly bent (not locked)",
      "Engage core gently for stability",
    ],
    commonFaults: [
      "Locking the standing knee",
      "Excessive arm waving for balance",
      "Looking at the ground (shifts center of gravity)",
    ],
    getAlternative(injuries) {
      const ankle = injuries.find(i => (i.area || "").toLowerCase().includes("ankle") || (i.area || "").toLowerCase().includes("feet"));
      const knee = injuries.find(i => (i.area || "").toLowerCase().includes("knee"));
      if ((ankle && ankle.severity >= 3) || (knee && knee.severity >= 3)) {
        return { name: "Tandem Stance (heel-to-toe)", note: "Record time — balance modification", modification: "tandem" };
      }
      return null;
    },
    shouldSkip() { return false; },
    flags: {
      fallsRisk: (val) => val < 20, // eyes open <20s at any age
      asymmetry: (left, right) => Math.abs(left - right) / Math.max(left, right, 1) > 0.20,
    },
  },
  {
    id: "sitToStand",
    name: "30-Second Sit-to-Stand",
    category: "Functional Fitness",
    standard: "SFS/Geriatric Validated",
    type: "count",
    unit: "reps",
    description: "Standard chair height (17-18 inches), arms crossed on chest, count in 30 seconds",
    instructions: [
      "Sit in a standard-height chair (17-18 inches), feet flat",
      "Cross arms on chest — do NOT use hands for assistance",
      "On 'Go', stand fully then sit fully — that's 1 rep",
      "Continue for 30 seconds",
      "Count full sit-to-stand-to-sit cycles only",
    ],
    formCues: [
      "Stand ALL the way up — full hip and knee extension",
      "Sit ALL the way down — controlled, not dropping",
      "Find a rhythm — efficiency matters for max count",
    ],
    commonFaults: [
      "Not standing fully (partial extension)",
      "Not sitting fully (hovering above chair)",
      "Using momentum / rocking forward",
    ],
    getAlternative() { return null; }, // Universal test — no alternative needed
    shouldSkip() { return false; },
  },
];

// ── Score a single test ───────────────────────────────────────

export function scoreTest(testId, value, gender = "male", age = 30) {
  const bracket = getAgeBracket(age);
  const normTable = NORMS[testId];
  if (!normTable) return { percentile: 50, rating: getRating(50) };
  const normRow = normTable[gender]?.[bracket] || normTable.male?.[bracket];
  if (!normRow) return { percentile: 50, rating: getRating(50) };
  const percentile = getPercentile(value, normRow);
  return { percentile, rating: getRating(percentile) };
}

// ── Overall fitness score (weighted composite 0-100) ──────────

const TEST_WEIGHTS = {
  pushups: 0.18,
  squat: 0.18,
  pullups: 0.16,
  plank: 0.16,
  gluteBridge: 0.12,
  balance: 0.10,
  sitToStand: 0.10,
};

export function computeOverallScore(results, gender = "male", age = 30) {
  let totalWeight = 0;
  let weightedSum = 0;
  let modificationPenalty = 0;

  for (const [testId, result] of Object.entries(results)) {
    if (result.skipped) continue;
    const weight = TEST_WEIGHTS[testId] || 0.1;
    const { percentile } = scoreTest(testId, result.value, gender, age);
    weightedSum += percentile * weight;
    totalWeight += weight;
    if (result.modification) modificationPenalty += 0.02; // slight penalty for using modification
  }

  if (totalWeight === 0) return 0;
  const raw = weightedSum / totalWeight;
  // Apply modification penalty (max -10 points)
  return Math.max(0, Math.min(100, Math.round(raw - modificationPenalty * 100)));
}

// ── Capability tags derived from baseline ─────────────────────

export function deriveCapabilityTags(results) {
  const tags = [];

  // Core stability basic: plank >30s
  if (results.plank && !results.plank.skipped && results.plank.value >= 30) {
    tags.push("core_stability_basic");
  }

  // Upper push competent: 10+ push-ups
  if (results.pushups && !results.pushups.skipped && results.pushups.value >= 10) {
    tags.push("upper_push_competent");
  }

  // Upper pull competent: 5+ pull-ups
  if (results.pullups && !results.pullups.skipped && results.pullups.tier === "A" && results.pullups.value >= 5) {
    tags.push("upper_pull_competent");
  }

  // Squat competent: parallel with no compensations
  if (results.squat && !results.squat.skipped && results.squat.depth === "parallel" && (!results.squat.compensations || results.squat.compensations.length === 0)) {
    tags.push("squat_competent");
  }
  if (results.squat && !results.squat.skipped && results.squat.depth === "full" && (!results.squat.compensations || results.squat.compensations.length === 0)) {
    tags.push("squat_competent");
  }

  // Single leg stable: >20s both sides eyes open
  if (results.balance && !results.balance.skipped) {
    const lo = results.balance.left_open || 0;
    const ro = results.balance.right_open || 0;
    if (lo >= 20 && ro >= 20) tags.push("single_leg_stable");
  }

  // Power ready: requires Phase 3+ AND core_stability AND squat/push competent
  if (tags.includes("core_stability_basic") && tags.includes("squat_competent") && tags.includes("upper_push_competent")) {
    tags.push("plyometric_ready_candidate"); // actual plyometric_ready requires Phase 3+
  }

  return tags;
}

// ── Auto-select exercise variation based on baseline ──────────

export function getBaselineExerciseLevel(testId, results) {
  const result = results[testId];
  if (!result || result.skipped) return { level: "beginner", variation: null };

  switch (testId) {
    case "pushups": {
      const v = result.value || 0;
      if (v === 0) return { level: "beginner", variation: "wall_pushup", desc: "Wall Push-Ups (Phase 1)", progressTo: "Incline → Knee → Standard" };
      if (v <= 10) return { level: "novice", variation: "incline_or_knee", desc: "Incline or Knee Push-Ups" };
      if (v <= 25) return { level: "intermediate", variation: "standard", desc: "Standard Push-Ups" };
      if (v <= 40) return { level: "advanced", variation: "tempo", desc: "Standard with tempo (slow eccentrics)" };
      return { level: "elite", variation: "decline_diamond_weighted", desc: "Decline, Diamond, or Weighted" };
    }
    case "pullups": {
      const tier = result.tier || "C";
      const v = result.value || 0;
      if (tier === "C" && v < 15) return { level: "beginner", variation: "lat_pulldown_hang", desc: "Lat Pulldown + Dead Hang daily" };
      if (tier === "C" && v >= 15) return { level: "novice", variation: "band_assisted_eccentric", desc: "Band-Assisted Pull-Ups + eccentric lowering" };
      if (tier === "B" || (tier === "A" && v <= 5)) return { level: "intermediate", variation: "assisted_and_full", desc: "Mix of assisted and full pull-ups" };
      if (tier === "A" && v <= 12) return { level: "advanced", variation: "standard_plus_chinups", desc: "Standard pull-ups + chin-up variations" };
      return { level: "elite", variation: "weighted_advanced", desc: "Weighted pull-ups + advanced variations" };
    }
    case "plank": {
      const v = result.value || 0;
      if (v < 15) return { level: "beginner", variation: "dead_bug_only", desc: "Dead Bug progression only" };
      if (v < 30) return { level: "novice", variation: "knee_plank", desc: "Knee Plank with progression toward full" };
      if (v < 60) return { level: "intermediate", variation: "full_plank_side", desc: "Full Plank + side plank introduction" };
      return { level: "advanced", variation: "anti_rotation_rollouts", desc: "Anti-rotation (Pallof), rollouts, weighted planks" };
    }
    case "squat": {
      const v = result.value || 0;
      const depth = result.depth || "quarter";
      if (v < 10 || depth === "quarter") return { level: "beginner", variation: "box_squat", desc: "Squat to box/chair" };
      if (v < 20) return { level: "novice", variation: "bodyweight", desc: "Bodyweight squats" };
      if (v < 35) return { level: "intermediate", variation: "goblet", desc: "Goblet squats" };
      return { level: "advanced", variation: "barbell", desc: "Barbell squats" };
    }
    default:
      return { level: "intermediate", variation: null };
  }
}

// ── Movement pattern auto-fill from baseline ──────────────────

export function getCoreMovementSelections(baselineResults) {
  return {
    push: getBaselineExerciseLevel("pushups", baselineResults),
    pull: getBaselineExerciseLevel("pullups", baselineResults),
    squat: getBaselineExerciseLevel("squat", baselineResults),
    hinge: { level: "intermediate", variation: "bridge", desc: "Bridge/deadlift matched to baseline" }, // hinge derived from gluteBridge
    core: getBaselineExerciseLevel("plank", baselineResults),
  };
}

// ── Comparison between two test sessions ──────────────────────

export function compareBaselines(current, previous) {
  if (!previous) return null;
  const comparisons = {};

  for (const testId of Object.keys(current)) {
    const cur = current[testId];
    const prev = previous[testId];
    if (!cur || cur.skipped || !prev || prev.skipped) continue;

    const curVal = cur.value || 0;
    const prevVal = prev.value || 0;
    const change = curVal - prevVal;
    const pctChange = prevVal > 0 ? Math.round((change / prevVal) * 100) : (curVal > 0 ? 100 : 0);
    const isPR = curVal > prevVal;

    comparisons[testId] = {
      current: curVal,
      previous: prevVal,
      change,
      pctChange,
      improved: change > 0,
      declined: change < 0,
      isPR,
      message: isPR
        ? `${curVal} (last: ${prevVal} — up ${pctChange}%! New personal record! 🏆)`
        : change < 0
        ? `${curVal} (last: ${prevVal}). This can happen during high-volume training weeks. Your strength is still growing.`
        : `${curVal} (same as last time — consistency is strength)`,
    };
  }

  return comparisons;
}

// ── Check if retest is due ────────────────────────────────────

export function getRetestInfo() {
  const tests = getBaselineTests();
  if (tests.length === 0) return { hasPrevious: false, dueInDays: 0 };
  const latest = tests[tests.length - 1];
  const daysSince = Math.floor((Date.now() - new Date(latest.date).getTime()) / 86400000);
  const retestInterval = 56; // 8 weeks per NASM reassessment guidelines
  return {
    hasPrevious: true,
    lastDate: latest.date,
    daysSince,
    dueInDays: Math.max(0, retestInterval - daysSince),
    isDue: daysSince >= retestInterval,
    latestResults: latest.results,
    overallScore: latest.overallScore,
  };
}

// ── Storage ───────────────────────────────────────────────────

export function getBaselineTests() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveBaselineTest(results, overallScore, capabilityTags) {
  const tests = getBaselineTests();
  const entry = {
    id: `bt_${Date.now()}`,
    date: new Date().toISOString(),
    results,
    overallScore,
    capabilityTags,
  };
  tests.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tests));
  // Also store latest capability tags separately for quick access
  localStorage.setItem("apex_baseline_capabilities", JSON.stringify(capabilityTags));
  return entry;
}

export function getBaselineCapabilities() {
  try {
    return JSON.parse(localStorage.getItem("apex_baseline_capabilities")) || [];
  } catch {
    return [];
  }
}

export function getLatestBaseline() {
  const tests = getBaselineTests();
  return tests.length > 0 ? tests[tests.length - 1] : null;
}

export function getPreviousBaseline() {
  const tests = getBaselineTests();
  return tests.length > 1 ? tests[tests.length - 2] : null;
}
