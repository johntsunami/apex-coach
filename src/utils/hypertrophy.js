// ═══════════════════════════════════════════════════════════════
// APEX Coach — Evidence-Based Hypertrophy & Physique Engine
// Schoenfeld (2021), Pelland et al. (2026 meta-regression),
// NSCA/ACSM guidelines, ISSN protein position stand
// ═══════════════════════════════════════════════════════════════

import { getAssessment } from "../components/Onboarding.jsx";
import { getSessions } from "./storage.js";

const LS_HYPERTROPHY = "apex_hypertrophy_settings";

// ═══════════════════════════════════════════════════════════════
// 1. PHYSIQUE CATEGORIES & EMPHASIS
// ═══════════════════════════════════════════════════════════════

export const PHYSIQUE_CATEGORIES = [
  { id: "general", label: "General Muscle Building", desc: "Look better, no competition plans", icon: "💪" },
  { id: "mens_physique", label: "NPC Men's Physique", desc: "V-taper: shoulders, back, chest, arms — less leg emphasis", icon: "🏖️" },
  { id: "classic_physique", label: "NPC Classic Physique", desc: "Balanced full-body muscle with size limits by height", icon: "🏛️" },
  { id: "bodybuilding", label: "NPC Bodybuilding", desc: "Maximum muscle mass and conditioning", icon: "🏋️" },
  { id: "bikini", label: "NPC Bikini", desc: "Toned, lean, glute/shoulder emphasis", icon: "👙" },
  { id: "figure", label: "NPC Figure", desc: "Athletic, muscular but feminine, balanced", icon: "🏆" },
  { id: "wellness", label: "NPC Wellness", desc: "Emphasis on lower body: glutes, quads, hamstrings", icon: "🍑" },
  { id: "womens_physique", label: "NPC Women's Physique", desc: "Muscular, symmetrical, full development", icon: "💎" },
  { id: "no_compete", label: "Not Competing", desc: "Just want to maximize muscle growth", icon: "📈" },
];

export const EXPERIENCE_LEVELS = [
  { id: "beginner", label: "New to muscle building", desc: "< 1 year consistent training", icon: "🌱" },
  { id: "intermediate", label: "Intermediate", desc: "1-3 years, understand basic lifts", icon: "📊" },
  { id: "advanced", label: "Advanced", desc: "3+ years, plateau-breaking needed", icon: "🔥" },
  { id: "competitor", label: "Experienced Competitor", desc: "Knows their body, needs periodization optimization", icon: "🏆" },
];

export const WEAK_POINTS = [
  { id: "chest", label: "Chest" }, { id: "back_width", label: "Back Width" },
  { id: "back_thickness", label: "Back Thickness" }, { id: "front_delts", label: "Front Delts" },
  { id: "side_delts", label: "Side Delts" }, { id: "rear_delts", label: "Rear Delts" },
  { id: "biceps", label: "Biceps" }, { id: "triceps", label: "Triceps" },
  { id: "forearms", label: "Forearms" }, { id: "quads", label: "Quads" },
  { id: "hamstrings", label: "Hamstrings" }, { id: "glutes", label: "Glutes" },
  { id: "calves", label: "Calves" }, { id: "abs", label: "Abs" }, { id: "traps", label: "Traps" },
];

// Volume emphasis by physique category
const CATEGORY_EMPHASIS = {
  general: {},
  mens_physique: { side_delts: 1.4, back_width: 1.3, chest: 1.2, biceps: 1.2, triceps: 1.2, quads: 0.7, hamstrings: 0.7, calves: 0.7 },
  classic_physique: { side_delts: 1.3, chest: 1.2, back_width: 1.2, quads: 1.1, abs: 1.2 },
  bodybuilding: { chest: 1.1, back_width: 1.1, back_thickness: 1.1, quads: 1.1, hamstrings: 1.1 },
  bikini: { glutes: 1.5, side_delts: 1.3, hamstrings: 1.2, chest: 0.7, back_thickness: 0.7 },
  figure: { side_delts: 1.3, glutes: 1.2, back_width: 1.2, quads: 1.1 },
  wellness: { glutes: 1.5, quads: 1.4, hamstrings: 1.4, side_delts: 0.9, chest: 0.8 },
  womens_physique: { side_delts: 1.2, back_width: 1.2, glutes: 1.1, quads: 1.1 },
  no_compete: {},
};

// ═══════════════════════════════════════════════════════════════
// 2. VOLUME RECOMMENDATIONS (Pelland et al. 2026 meta-regression)
// ═══════════════════════════════════════════════════════════════

const VOLUME_BY_EXPERIENCE = {
  beginner:     { min: 10, max: 12, desc: "Focus on learning movements" },
  intermediate: { min: 14, max: 18, desc: "Progressive overload emphasis" },
  advanced:     { min: 18, max: 24, desc: "Strategic volume with deloads" },
  competitor:   { min: 20, max: 25, desc: "Priority muscles higher, maintenance lower" },
};

const ABSOLUTE_VOLUME_CAP = 30; // Hard cap per muscle/week — beyond this, negative returns
const SESSION_VOLUME_CAP = 12;  // Max productive sets per muscle per session (Pelland et al.)

export function getHypertrophyVolume(experience = "intermediate", muscle = null, weakPoints = [], physiqueCategory = "general") {
  const base = VOLUME_BY_EXPERIENCE[experience] || VOLUME_BY_EXPERIENCE.intermediate;
  let multiplier = 1.0;

  // Weak point priority: +30%
  if (weakPoints.includes(muscle)) multiplier += 0.3;

  // Category emphasis
  const catEmphasis = CATEGORY_EMPHASIS[physiqueCategory] || {};
  if (catEmphasis[muscle]) multiplier *= catEmphasis[muscle];

  // Maintenance muscles: -20% if not a weak point and not category-emphasized
  if (!weakPoints.includes(muscle) && (!catEmphasis[muscle] || catEmphasis[muscle] < 1)) {
    multiplier *= 0.8;
  }

  return {
    min: Math.round(base.min * multiplier),
    max: Math.min(ABSOLUTE_VOLUME_CAP, Math.round(base.max * multiplier)),
    desc: base.desc,
    multiplier,
    isPriority: multiplier > 1.1,
    isMaintenance: multiplier < 0.9,
  };
}

// ═══════════════════════════════════════════════════════════════
// 3. TRAINING SPLITS
// ═══════════════════════════════════════════════════════════════

export const TRAINING_SPLITS = {
  3: [
    { id: "full_body_3", label: "Full Body × 3", desc: "Best for beginners — high frequency per muscle", days: ["Full Body", "Full Body", "Full Body"], recommended: "beginner" },
    { id: "ppl_3", label: "Push-Pull-Legs", desc: "Each pattern trained once", days: ["Push", "Pull", "Legs"], recommended: "intermediate" },
  ],
  4: [
    { id: "upper_lower_4", label: "Upper-Lower × 2", desc: "Best general option per research", days: ["Upper", "Lower", "Upper", "Lower"], recommended: "all" },
    { id: "ppl_weak_4", label: "PPL + Weak Point", desc: "Prioritize lagging areas", days: ["Push", "Pull", "Legs", "Weak Points"], recommended: "intermediate" },
  ],
  5: [
    { id: "ulppl_5", label: "ULPPL", desc: "Upper-Lower-Push-Pull-Legs", days: ["Upper", "Lower", "Push", "Pull", "Legs"], recommended: "advanced" },
    { id: "pplul_5", label: "PPLUL", desc: "Push-Pull-Legs-Upper-Lower", days: ["Push", "Pull", "Legs", "Upper", "Lower"], recommended: "advanced" },
    { id: "arnold_5", label: "Arnold Split", desc: "Chest+Back / Shoulders+Arms / Legs × repeat", days: ["Chest+Back", "Shoulders+Arms", "Legs", "Chest+Back", "Shoulders+Arms"], recommended: "advanced" },
  ],
  6: [
    { id: "ppl_6", label: "PPL × 2", desc: "Most popular competitive bodybuilding split", days: ["Push", "Pull", "Legs", "Push", "Pull", "Legs"], recommended: "advanced" },
  ],
};

// Which body parts get hit on each split day
const SPLIT_MUSCLES = {
  "Full Body": ["chest", "back", "shoulders", "legs", "core"],
  Push: ["chest", "shoulders", "triceps"],
  Pull: ["back", "biceps", "rear_delts", "forearms"],
  Legs: ["quads", "hamstrings", "glutes", "calves"],
  Upper: ["chest", "back", "shoulders", "biceps", "triceps"],
  Lower: ["quads", "hamstrings", "glutes", "calves", "core"],
  "Chest+Back": ["chest", "back"],
  "Shoulders+Arms": ["shoulders", "biceps", "triceps", "forearms"],
  "Weak Points": [], // Dynamically filled from weak points
};

export function getSplitMuscles(dayLabel, weakPoints = []) {
  if (dayLabel === "Weak Points") return weakPoints.map(wp => wp.replace("back_width", "back").replace("back_thickness", "back").replace("side_delts", "shoulders").replace("front_delts", "shoulders").replace("rear_delts", "shoulders"));
  return SPLIT_MUSCLES[dayLabel] || [];
}

export function getRecommendedSplit(daysPerWeek, experience) {
  const splits = TRAINING_SPLITS[daysPerWeek] || TRAINING_SPLITS[4];
  return splits.find(s => s.recommended === experience || s.recommended === "all") || splits[0];
}

// ═══════════════════════════════════════════════════════════════
// 4. REP RANGES & INTENSITY (undulating periodization)
// ═══════════════════════════════════════════════════════════════

export const REP_SCHEMES = {
  heavy:    { compound: "6-8",  isolation: "8-10",  rpe: "8-9", rest: 120, desc: "Heavy day — strength-hypertrophy" },
  moderate: { compound: "8-12", isolation: "10-12", rpe: "7-9", rest: 90,  desc: "Moderate day — hypertrophy sweet spot" },
  light:    { compound: "12-15", isolation: "12-20", rpe: "8-10", rest: 60, desc: "Light/metabolic day — higher TUT, shorter rest" },
};

export function getDayRepScheme(dayIndex) {
  const schemes = ["heavy", "moderate", "light"];
  return REP_SCHEMES[schemes[dayIndex % 3]];
}

// ═══════════════════════════════════════════════════════════════
// 5. ADVANCED HYPERTROPHY TECHNIQUES
// ═══════════════════════════════════════════════════════════════

export const ADVANCED_TECHNIQUES = [
  {
    id: "drop_set", name: "Drop Set",
    desc: "After final working set, reduce weight 20-30% and continue to failure. 2-3 drops.",
    when: "Last exercise for a muscle group, isolation movements",
    notOn: "Heavy compounds (safety concern)",
    minExperience: "intermediate", minPhase: 3,
    example: "DB Lateral Raise: 3×12, then drop set on set 3 (20→15→10 lbs to failure)",
    explanation: "This forces maximum fiber recruitment by pushing past initial failure.",
  },
  {
    id: "rest_pause", name: "Rest-Pause",
    desc: "Set to near failure → rest 10-20 sec → continue for more reps. Repeat 2-3 times.",
    when: "Machine exercises and isolations where re-racking is easy",
    minExperience: "intermediate", minPhase: 3,
    example: "Leg Extension: set of 10 to failure → 15s rest → 3 more reps → 15s → 2 more",
    explanation: "Maximizes motor unit recruitment in time-efficient sets.",
  },
  {
    id: "superset_antagonist", name: "Agonist-Antagonist Superset",
    desc: "Two opposing exercises back-to-back: e.g., Bench Press → Bent Row.",
    when: "Research shows enhanced performance on second exercise",
    minExperience: "beginner", minPhase: 2,
    example: "Bench Press × 10 → immediately → Bent Over Row × 10 → rest 90s → repeat",
    explanation: "Saves time, reciprocal inhibition may actually improve performance.",
  },
  {
    id: "superset_preexhaust", name: "Pre-Exhaustion Superset",
    desc: "Isolation first, then compound for the same muscle: Cable Fly → Bench Press.",
    when: "When a muscle doesn't fatigue during compounds (e.g., chest not feeling bench)",
    minExperience: "intermediate", minPhase: 3,
    example: "Cable Fly × 12 → immediately → Bench Press × 8",
    explanation: "Pre-fatigues the target muscle so it fails first during the compound.",
  },
  {
    id: "superset_compound", name: "Compound Set",
    desc: "Two exercises for same muscle back-to-back: DB Press → Push-Up.",
    when: "Time-efficient volume accumulation",
    minExperience: "intermediate", minPhase: 3,
    example: "DB Bench Press × 10 → Push-Ups to failure → rest 90s",
    explanation: "Massive metabolic stress for maximum muscle pump.",
  },
  {
    id: "mechanical_drop", name: "Mechanical Drop Set",
    desc: "Same muscle, change angle/leverage to extend the set as you fatigue.",
    when: "Biceps, triceps, shoulders — exercises with easy angle changes",
    minExperience: "advanced", minPhase: 3,
    example: "Incline DB Curl → Standing DB Curl → Hammer Curl (progressively easier leverage)",
    explanation: "Extends effective reps by exploiting biomechanical advantages.",
  },
  {
    id: "slow_eccentric", name: "Tempo Manipulation (Slow Eccentric)",
    desc: "3-5 second lowering phase for enhanced muscle damage (Schoenfeld 2015).",
    when: "Effective for: biceps, chest, quads",
    minExperience: "beginner", minPhase: 2,
    example: "4/0/1/0 tempo: 4 seconds down, no pause, 1 second up, no pause",
    explanation: "Eccentric emphasis creates greater mechanical tension per rep.",
  },
  {
    id: "myo_reps", name: "Myo-Reps",
    desc: "Activation set of 12-20 reps near failure → 5-rep clusters with 5-breath rest.",
    when: "Isolation exercises, time-limited sessions",
    minExperience: "intermediate", minPhase: 3,
    example: "Cable Fly: 15 reps → 5 breaths → 5 reps → 5 breaths → 5 reps → 5 breaths → 4 reps",
    explanation: "Time-efficient — high effective reps without full sets.",
  },
  {
    id: "lengthened_partials", name: "Lengthened Partial Reps",
    desc: "After full ROM failure, continue with partial reps in the stretched position (Wolf et al. 2025).",
    when: "Exercises that load the stretched position",
    minExperience: "intermediate", minPhase: 3,
    example: "Incline DB Curl to failure → continue bottom-half reps for 5-8 more",
    explanation: "Emerging evidence: stretched-position partials produce similar or greater hypertrophy.",
  },
];

// Select techniques for a session based on rules
export function selectTechniques(experience, phase, muscles, weakPoints = []) {
  const eligible = ADVANCED_TECHNIQUES.filter(t => {
    const expOrder = { beginner: 0, intermediate: 1, advanced: 2, competitor: 3 };
    return (expOrder[experience] || 0) >= (expOrder[t.minExperience] || 0) && phase >= t.minPhase;
  });

  if (eligible.length === 0) return [];

  // Max 2 advanced techniques per session to manage fatigue
  const selected = [];

  // Prioritize techniques for weak point muscles
  const hasWeakPoint = muscles.some(m => weakPoints.includes(m));
  if (hasWeakPoint) {
    const wpTech = eligible.find(t => t.id === "drop_set" || t.id === "lengthened_partials" || t.id === "myo_reps");
    if (wpTech) selected.push({ ...wpTech, _forWeakPoint: true });
  }

  // Add one more varied technique
  const remaining = eligible.filter(t => !selected.find(s => s.id === t.id));
  if (remaining.length > 0 && selected.length < 2) {
    // Rotate week-to-week using session count
    const sessions = getSessions();
    const idx = sessions.length % remaining.length;
    selected.push(remaining[idx]);
  }

  return selected.slice(0, 2);
}

// ═══════════════════════════════════════════════════════════════
// 6. PERIODIZATION (mesocycle structure)
// ═══════════════════════════════════════════════════════════════

export const MESOCYCLE_BLOCKS = {
  accumulation: {
    name: "Accumulation", weeks: "4-6", color: "#3b82f6",
    volumeModifier: 1.0, // Working up from baseline to peak (+10%/week)
    rpeRange: "7-8", desc: "Progressive overload, work capacity building",
    guidance: "Build volume gradually. Leave reps in reserve. Focus on form and mind-muscle connection.",
  },
  intensification: {
    name: "Intensification", weeks: "3-4", color: "#f97316",
    volumeModifier: 0.95, // Slightly reduced from peak
    rpeRange: "8-9", desc: "Push strength, maximize tension",
    guidance: "Closer to failure now. Advanced techniques deployed here. Push hard but smart.",
    advancedTechniques: true,
  },
  deload: {
    name: "Deload", weeks: "1", color: "#22c55e",
    volumeModifier: 0.5,
    rpeRange: "5-6", desc: "Recovery, joint health, sensitize muscle",
    guidance: "Your muscles grow during recovery. Trust the process. Light weights, perfect form.",
  },
};

export function getCurrentBlock(weekNumber) {
  // 10-week mesocycle: 5 accumulation + 4 intensification + 1 deload
  const cycleWeek = ((weekNumber - 1) % 10) + 1;
  if (cycleWeek <= 5) return { ...MESOCYCLE_BLOCKS.accumulation, cycleWeek, rampPct: Math.round((cycleWeek / 5) * 100) };
  if (cycleWeek <= 9) return { ...MESOCYCLE_BLOCKS.intensification, cycleWeek: cycleWeek - 5 };
  return { ...MESOCYCLE_BLOCKS.deload, cycleWeek: 1 };
}

// ═══════════════════════════════════════════════════════════════
// 7. MUSCLE REGION COVERAGE OPTIMIZER
// ═══════════════════════════════════════════════════════════════

export const MUSCLE_REGIONS = {
  chest: { regions: ["upper (incline)", "mid (flat)", "lower (decline/dips)"], minAngles: 2, note: "At least 2 different angles per session" },
  back: { regions: ["width (pulldowns/pullups)", "thickness (rows)", "upper (face pulls)", "lower (hyperextensions)"], minAngles: 2, note: "Vertical pull + horizontal pull every back session" },
  shoulders: { regions: ["front delt (pressing)", "side delt (laterals)", "rear delt (face pulls/reverse fly)"], minAngles: 2, note: "Side delts get extra: 12-16 direct sets/week for V-taper" },
  biceps: { regions: ["long head (incline/drag curls)", "short head (preacher/concentration)", "brachialis (hammer/reverse)"], minAngles: 2 },
  triceps: { regions: ["long head (overhead ext)", "lateral head (pushdowns)", "medial head (close-grip press)"], minAngles: 2 },
  quads: { regions: ["rectus femoris (front squat/ext)", "vastus group (hack squat/press)"], minAngles: 1 },
  hamstrings: { regions: ["hip-dominant (RDL)", "knee-dominant (leg curl)"], minAngles: 2, note: "Both hip and knee flexion needed" },
  glutes: { regions: ["hip extension (hip thrust)", "abduction (gluteus medius)"], minAngles: 2 },
  calves: { regions: ["gastrocnemius (standing raises)", "soleus (seated raises)"], minAngles: 2, note: "Both needed — different fiber composition" },
};

export function getRegionCoverage(muscle) {
  return MUSCLE_REGIONS[muscle] || null;
}

// ═══════════════════════════════════════════════════════════════
// 8. NUTRITION GUIDANCE (ISSN Position Stand)
// ═══════════════════════════════════════════════════════════════

export const NUTRITION_TIPS = {
  building: [
    { title: "Protein Target", tip: "Aim for 1.6-2.2g protein per kg bodyweight daily (ISSN position stand)", icon: "🥩" },
    { title: "Caloric Surplus", tip: "200-500 calories above maintenance supports muscle growth with minimal fat gain", icon: "📈" },
    { title: "Post-Workout", tip: "Protein within 2 hours of training optimizes muscle protein synthesis", icon: "⏰" },
    { title: "Meal Frequency", tip: "3-5 protein-rich meals spread through the day for sustained MPS", icon: "🍽️" },
  ],
  contest_prep: [
    { title: "Protein (Deficit)", tip: "Increase to 2.2-2.6g/kg to preserve muscle while cutting", icon: "🥩" },
    { title: "Deficit Size", tip: "0.5-1% bodyweight loss per week preserves the most muscle", icon: "📉" },
    { title: "Keep Lifting Heavy", tip: "Maintain intensity — heavy training preserves muscle in a deficit", icon: "🏋️" },
    { title: "Cardio", tip: "Start 3x/week Zone 2, gradually increase. Don't crash with excessive cardio.", icon: "🫀" },
  ],
};

export function getProteinTarget(weightLbs, phase = "building") {
  const weightKg = weightLbs / 2.205;
  if (phase === "contest_prep") return { min: Math.round(weightKg * 2.2), max: Math.round(weightKg * 2.6), unit: "g/day" };
  return { min: Math.round(weightKg * 1.6), max: Math.round(weightKg * 2.2), unit: "g/day" };
}

// ═══════════════════════════════════════════════════════════════
// 9. HYPERTROPHY SETTINGS STORAGE
// ═══════════════════════════════════════════════════════════════

export function getHypertrophySettings() {
  try { return JSON.parse(localStorage.getItem(LS_HYPERTROPHY) || "{}"); }
  catch { return {}; }
}

export function setHypertrophySettings(settings) {
  try {
    const current = getHypertrophySettings();
    localStorage.setItem(LS_HYPERTROPHY, JSON.stringify({ ...current, ...settings }));
  } catch {}
}

// Check if user has hypertrophy goals active
export function hasHypertrophyGoals() {
  const assessment = getAssessment();
  if (!assessment?.goals) return false;
  return Object.values(assessment.goals).some(g => {
    const arr = Array.isArray(g) ? g : [g];
    return arr.includes("size");
  });
}

// Get volume explanation text for user
export function getVolumeExplanation(muscle, volume, weakPoints = [], category = "general") {
  const isWeak = weakPoints.includes(muscle);
  const catEmphasis = CATEGORY_EMPHASIS[category]?.[muscle];

  if (isWeak && catEmphasis > 1) {
    return `${muscle} is getting ${volume.max} sets/week (priority weak point + category emphasis) to maximize development.`;
  }
  if (isWeak) {
    return `${muscle} is getting ${volume.max} sets/week (priority — flagged as weak point) to bring it up.`;
  }
  if (catEmphasis > 1) {
    return `${muscle} gets ${volume.max} sets/week (emphasis for ${category.replace(/_/g, " ")}).`;
  }
  if (volume.isMaintenance) {
    return `${muscle} at ${volume.max} sets/week (maintenance) — strong area, volume redirected to priorities.`;
  }
  return `${muscle} at ${volume.max} sets/week — standard hypertrophy volume.`;
}

// RPE guide text for exercise screen
export const RPE_GUIDE = {
  compound: "RPE 8-9 recommended — stop 1-2 reps from failure to manage fatigue and protect joints.",
  isolation: "RPE 8-10 — last set to failure is acceptable and often beneficial for isolations.",
  guide: "RPE 8 = you could do 2 more reps. RPE 9 = 1 more rep possible. RPE 10 = absolute failure.",
};
