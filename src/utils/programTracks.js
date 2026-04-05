// ═══════════════════════════════════════════════════════════════
// APEX Coach — Program Track Logic (PES, SFS, CES, CPT)
// Handles sport-specific templates, PES superset pairing,
// SFS adaptations, and program-filtered exercise selection
// ═══════════════════════════════════════════════════════════════

import exerciseDB from "../data/exercises.json";

// ── Sport-specific movement pattern priorities ──────────────

const SPORT_TEMPLATES = {
  BJJ: { label: "BJJ / Grappling", patterns: ["rotation", "hinge", "pull", "carry"], focus: "Rotational power, guard mobility, grip endurance, hip escape drills, neck strengthening", unlockPhase: 3 },
  "Muay Thai": { label: "Muay Thai / Striking", patterns: ["rotation", "push", "anti_rotation", "locomotion"], focus: "Rotational power, hip mobility, shoulder endurance, core anti-rotation", unlockPhase: 3 },
  Surfing: { label: "Surfing", patterns: ["push", "rotation", "anti_extension"], focus: "Shoulder endurance, balance on unstable surfaces, pop-up power, thoracic rotation", unlockPhase: 3 },
  Snowboarding: { label: "Snowboarding", patterns: ["squat", "rotation", "anti_rotation"], focus: "Quad endurance, ankle stability, rotational core, knee protection", unlockPhase: 3 },
  Hiking: { label: "Hiking", patterns: ["squat", "lunge", "carry"], focus: "Quad/calf endurance, ankle stability, cardiovascular base, loaded carries", unlockPhase: 2 },
  Running: { label: "Running", patterns: ["locomotion", "lunge", "isolation"], focus: "Calf/hip flexor strength, IT band maintenance, cadence drills", unlockPhase: 2 },
  Swimming: { label: "Swimming", patterns: ["pull", "rotation", "anti_extension"], focus: "Shoulder stability, lat endurance, thoracic rotation, breathing efficiency", unlockPhase: 3 },
  Golf: { label: "Golf", patterns: ["rotation", "hinge", "anti_extension"], focus: "Rotational power, hip mobility, thoracic rotation, anti-extension core", unlockPhase: 3 },
};

export function getSportTemplate(sportName) {
  return SPORT_TEMPLATES[sportName] || { label: sportName, patterns: ["push", "pull", "squat", "hinge", "carry"], focus: "Balanced SAQ + power development", unlockPhase: 3 };
}

export function getSportMessage(sportName, currentPhase) {
  const template = getSportTemplate(sportName);
  if (currentPhase >= template.unlockPhase) {
    return `Your ${template.label} training is ACTIVE. Focus: ${template.focus}`;
  }
  return `Your ${template.label} training begins in Phase ${template.unlockPhase}. Right now we're building the foundation your sport demands.`;
}

// ── PES Superset Pairing (Phase 4-5) ────────────────────────

const POWER_PAIRS = {
  squat: ["pes_squat_jump", "sport_box_jump", "pes_depth_jump"],
  hinge: ["kb_swing", "sport_med_ball_slam"],
  push: ["sport_med_ball_slam", "pes_med_ball_overhead"],
  pull: ["sport_med_ball_rot_throw"],
  lunge: ["pes_lateral_bound", "pes_agil_icky"],
};

export function getPESSuperset(strengthExercise, phase) {
  if (phase < 4) return null;
  const pattern = strengthExercise.movementPattern;
  const powerOptions = POWER_PAIRS[pattern];
  if (!powerOptions) return null;

  for (const powId of powerOptions) {
    const powEx = exerciseDB.find(e => e.id === powId);
    if (powEx && (powEx.phaseEligibility || []).includes(phase)) {
      return { ...powEx, _supersetWith: strengthExercise.name, _reason: "PES power superset — strength + power for " + pattern };
    }
  }
  return null;
}

// ── SFS Adaptations ─────────────────────────────────────────

export function applySFSRules(workout, phase) {
  const rules = {
    maxSetsPerMuscle: phase <= 2 ? 8 : 12,
    minRest: phase <= 2 ? 90 : 60,
    rpeCeiling: phase <= 2 ? 7 : 8,
    minWarmupMinutes: 10,
    balanceEverySession: true,
    chairAlternatives: true,
  };

  // Add balance exercises to every session
  const balanceExercises = exerciseDB.filter(e =>
    e.id.startsWith("bal_") && (e.phaseEligibility || []).includes(phase)
  ).slice(0, 2);

  return { ...workout, sfsRules: rules, balanceAddOns: balanceExercises };
}

// ── SFS Assessments ─────────────────────────────────────────

const SFS_ASSESS_KEY = "apex_sfs_assessments";

export function saveSFSAssessment(data) {
  try {
    const all = JSON.parse(localStorage.getItem(SFS_ASSESS_KEY) || "[]");
    all.push({ ...data, date: new Date().toISOString() });
    localStorage.setItem(SFS_ASSESS_KEY, JSON.stringify(all));
  } catch {}
}

export function getSFSAssessments() {
  try { return JSON.parse(localStorage.getItem(SFS_ASSESS_KEY) || "[]"); } catch { return []; }
}

// ── Program detection ───────────────────────────────────────

export function detectPrograms(assessment) {
  const programs = ["cpt"]; // Everyone gets CPT foundation

  // HYP: size goals or physique category selected
  const hasSize = Object.values(assessment?.goals || {}).some(g => (Array.isArray(g) ? g : [g]).includes("size"));
  const hasPhysique = !!assessment?.physiqueCategory;
  if (hasSize || hasPhysique) programs.push("hyp");

  // PES: sport interests or strength/endurance goals
  const hasSports = (assessment?.preferences?.sports || []).length > 0;
  const hasStrength = Object.values(assessment?.goals || {}).some(g => (Array.isArray(g) ? g : [g]).includes("strength"));
  const hasEndurance = Object.values(assessment?.goals || {}).some(g => (Array.isArray(g) ? g : [g]).includes("endurance"));
  if (hasSports || hasStrength || hasEndurance) programs.push("pes");

  // SFS: functional limitations or future age check
  const funcLimits = assessment?.functionalLimitations || {};
  const hasSignificantLimits = Object.values(funcLimits).filter(v => v === "unable").length >= 2;
  if (hasSignificantLimits) programs.push("sfs");

  // CES: compensations detected
  if ((assessment?.compensations || []).length > 0) programs.push("ces");

  // Rehab: conditions present
  if ((assessment?.conditions || []).length > 0) programs.push("rehab");

  return programs;
}

// ── Program filter for library ──────────────────────────────

export const PROGRAM_FILTERS = [
  { id: "All", label: "All Programs" },
  { id: "cpt", label: "Foundation (CPT)" },
  { id: "pes", label: "Performance (PES)" },
  { id: "hyp", label: "Hypertrophy (HYP)" },
  { id: "sfs", label: "Senior (SFS)" },
  { id: "ces", label: "Corrective (CES)" },
  { id: "rehab", label: "Rehab (PT)" },
];

export function filterByProgram(exercises, programId) {
  if (programId === "All") return exercises;
  return exercises.filter(e => (e.methodology || []).includes(programId));
}

// ── Sport-Aware Exercise Prioritization ──────────────────────
// Scores and sorts exercises based on user's sport selections.
// Exercises matching sport movement patterns are prioritized.

// Map sport names (as stored in assessment) to SPORT_TEMPLATES keys
const SPORT_NAME_MAP = {
  "Basketball": null, "Soccer": null, "Baseball/Softball": null,
  "Tennis": null, "Volleyball": null, "Football": null,
  "Yoga": null, "Pilates": null, "Dance": null,
  "Rowing": { patterns: ["pull", "hinge", "anti_extension"], focus: "Pull power, hip hinge endurance, core anti-extension" },
  "Cycling": { patterns: ["squat", "hinge", "locomotion"], focus: "Quad endurance, hip flexor mobility, cardiovascular base" },
  "Pickleball": { patterns: ["rotation", "lunge", "anti_rotation"], focus: "Lateral agility, rotational power, shoulder endurance" },
  "Skateboarding": { patterns: ["squat", "anti_rotation", "carry"], focus: "Single-leg balance, ankle stability, core anti-rotation" },
  "Martial Arts": { patterns: ["rotation", "push", "anti_rotation"], focus: "Rotational power, shoulder endurance, core stability" },
  "Wrestling": { patterns: ["hinge", "pull", "carry", "rotation"], focus: "Hip power, grip endurance, neck strength, rotational control" },
  "CrossFit": { patterns: ["squat", "hinge", "push", "pull"], focus: "Balanced compound strength, metabolic conditioning" },
  "Boxing/Kickboxing": { patterns: ["rotation", "push", "anti_rotation"], focus: "Rotational power, shoulder endurance, footwork" },
  "Rock Climbing": { patterns: ["pull", "carry", "anti_extension"], focus: "Grip endurance, lat/forearm strength, shoulder stability, core tension" },
  "Skiing/Snowboarding": null, // mapped via SPORT_TEMPLATES.Snowboarding
  "MMA/BJJ": null, // mapped via SPORT_TEMPLATES.BJJ
};

function getSportPatterns(sports) {
  if (!sports || sports.length === 0) return null;
  const allPatterns = new Map(); // pattern -> weight (how many sports need it)
  for (const sport of sports) {
    // Check SPORT_TEMPLATES first (exact match), then SPORT_NAME_MAP
    const template = SPORT_TEMPLATES[sport] || SPORT_NAME_MAP[sport] ||
      (sport.includes("BJJ") || sport.includes("MMA") ? SPORT_TEMPLATES.BJJ : null) ||
      (sport.includes("Skiing") || sport.includes("Snowboard") ? SPORT_TEMPLATES.Snowboarding : null) ||
      (sport.includes("Muay") || sport.includes("Kickbox") ? SPORT_TEMPLATES["Muay Thai"] : null);
    if (!template?.patterns) continue;
    for (const p of template.patterns) {
      allPatterns.set(p, (allPatterns.get(p) || 0) + 1);
    }
  }
  return allPatterns.size > 0 ? allPatterns : null;
}

// Score an exercise based on how well it matches the user's sport patterns
function sportScore(exercise, sportPatterns) {
  if (!sportPatterns) return 0;
  const mp = (exercise.movementPattern || "").toLowerCase();
  const bp = (exercise.bodyPart || "").toLowerCase();
  const name = (exercise.name || "").toLowerCase();
  let score = 0;
  for (const [pattern, weight] of sportPatterns) {
    if (mp.includes(pattern)) score += weight * 3;
    // Body part relevance (shoulders for surfing/climbing, legs for hiking/skiing)
    if (pattern === "pull" && (bp === "back" || bp === "arms")) score += weight;
    if (pattern === "push" && (bp === "chest" || bp === "shoulders")) score += weight;
    if (pattern === "squat" && (bp === "legs" || bp === "glutes")) score += weight;
    if (pattern === "hinge" && (bp === "legs" || bp === "glutes" || bp === "back")) score += weight;
    if (pattern === "rotation" && bp === "core") score += weight;
    if (pattern === "carry" && (bp === "core" || bp === "arms")) score += weight;
    if (pattern === "anti_extension" && bp === "core") score += weight;
    if (pattern === "anti_rotation" && bp === "core") score += weight;
    // Name bonus for sport-specific exercises
    if (name.includes("sport") || name.includes("agility") || name.includes("power")) score += weight;
  }
  return score;
}

// Prioritize exercises in a pool based on sport selections.
// Returns the same exercises but sorted so sport-relevant ones come first.
export function prioritizeBySport(exercises, sports) {
  const patterns = getSportPatterns(sports);
  if (!patterns) return exercises;
  return [...exercises].sort((a, b) => sportScore(b, patterns) - sportScore(a, patterns));
}

// Get a summary of how sports affect the user's training
export function getSportTrainingSummary(sports, currentPhase) {
  if (!sports || sports.length === 0) return null;
  const summaries = [];
  for (const sport of sports) {
    const msg = getSportMessage(sport, currentPhase);
    const template = getSportTemplate(sport);
    summaries.push({ sport, message: msg, patterns: template.patterns, focus: template.focus, active: currentPhase >= template.unlockPhase });
  }
  return summaries;
}

export { SPORT_TEMPLATES, getSportPatterns };
