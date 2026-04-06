// ═══════════════════════════════════════════════════════════════
// APEX Coach — Program Track Logic (PES, SFS, CES, CPT)
// Handles sport-specific templates, PES superset pairing,
// SFS adaptations, and program-filtered exercise selection
// ═══════════════════════════════════════════════════════════════

import exerciseDB from "../data/exercises.json";
import { getSportProfile, getMergedSportProfile, getSportPreventionIds, getRotatedPreventionIds, PATTERN_TO_PLANE } from "../data/sportProfiles.js";

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
  // Check rich NASM PES profile first, fall back to simple templates
  const profile = getSportProfile(sportName);
  if (profile && profile.movementPatterns) {
    const topTraining = Object.entries(profile.priorityTraining || {}).filter(([,v]) => Array.isArray(v) && v.length > 0).slice(0, 3).map(([k]) => k.replace(/_/g, " "));
    return { label: profile.label, patterns: profile.movementPatterns, focus: topTraining.join(", ") || profile.label + " training", unlockPhase: profile.unlockPhase || 3 };
  }
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

function getSportPatterns(sports, sportPrefs) {
  if (!sports || sports.length === 0) return null;
  const allPatterns = new Map(); // pattern -> weight
  const allMuscles = new Set();
  const allPlanes = new Set();

  // If we have ranked preferences, use weighted scoring
  const sorted = sportPrefs ? [...sportPrefs].sort((a, b) => a.rank - b.rank) : sports.map((s, i) => ({ sport: s, rank: i + 1 }));
  for (let i = 0; i < sorted.length; i++) {
    const sportName = sorted[i].sport || sorted[i];
    const weight = i === 0 ? 3 : i === 1 ? 2 : 1; // Primary=3x, Secondary=2x, rest=1x

    // Try rich profile first, then fall back to templates
    const profile = getSportProfile(sportName);
    if (profile?.movementPatterns) {
      for (const p of profile.movementPatterns) {
        allPatterns.set(p, (allPatterns.get(p) || 0) + weight);
      }
      for (const m of (profile.primaryMuscles || [])) allMuscles.add(m);
      for (const pl of (profile.dominantPlanes || [])) allPlanes.add(pl);
      continue;
    }

    // Legacy fallback
    const template = SPORT_TEMPLATES[sportName] || SPORT_NAME_MAP[sportName] ||
      (sportName.includes("BJJ") || sportName.includes("MMA") ? SPORT_TEMPLATES.BJJ : null) ||
      (sportName.includes("Skiing") || sportName.includes("Snowboard") ? SPORT_TEMPLATES.Snowboarding : null) ||
      (sportName.includes("Muay") || sportName.includes("Kickbox") ? SPORT_TEMPLATES["Muay Thai"] : null);
    if (!template?.patterns) continue;
    for (const p of template.patterns) {
      allPatterns.set(p, (allPatterns.get(p) || 0) + weight);
    }
  }
  if (allPatterns.size === 0) return null;
  return { patterns: allPatterns, muscles: allMuscles, planes: allPlanes };
}

// Score an exercise based on how well it matches the user's sport profile
function sportScore(exercise, sportData) {
  if (!sportData) return 0;
  const patterns = sportData.patterns || sportData; // backward compat: accept raw Map
  const muscles = sportData.muscles || new Set();
  const planes = sportData.planes || new Set();
  const mp = (exercise.movementPattern || "").toLowerCase();
  const bp = (exercise.bodyPart || "").toLowerCase();
  const name = (exercise.name || "").toLowerCase();
  const exMuscles = (exercise.primaryMuscles || []).map(m => m.toLowerCase());
  let score = 0;

  // Movement pattern match (highest weight)
  for (const [pattern, weight] of patterns) {
    if (mp.includes(pattern)) score += weight * 3;
    if (pattern === "pull" && (bp === "back" || bp === "arms")) score += weight;
    if (pattern === "push" && (bp === "chest" || bp === "shoulders")) score += weight;
    if (pattern === "squat" && (bp === "legs" || bp === "glutes")) score += weight;
    if (pattern === "hinge" && (bp === "legs" || bp === "glutes" || bp === "back")) score += weight;
    if (pattern === "rotation" && bp === "core") score += weight;
    if (pattern === "carry" && (bp === "core" || bp === "arms")) score += weight;
    if (pattern === "anti_extension" && bp === "core") score += weight;
    if (pattern === "anti_rotation" && bp === "core") score += weight;
  }

  // Primary muscle match from sport profile
  for (const m of muscles) {
    if (exMuscles.some(em => em.includes(m.toLowerCase()) || m.toLowerCase().includes(em))) score += 2;
  }

  // Plane of motion match
  const exPlane = PATTERN_TO_PLANE[mp];
  if (exPlane && planes.has(exPlane)) score += 2;

  // Name bonus for sport-specific exercises
  if (name.includes("sport") || name.includes("agility") || name.includes("power")) score += 2;

  return score;
}

// Prioritize exercises in a pool based on sport selections.
// Returns the same exercises but sorted so sport-relevant ones come first.
// When sportPrefs (ranked array) is provided, uses weighted scoring.
export function prioritizeBySport(exercises, sports, sportPrefs = null) {
  const sportData = getSportPatterns(sports, sportPrefs);
  if (!sportData) return exercises;
  return [...exercises].sort((a, b) => sportScore(b, sportData) - sportScore(a, sportData));
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

// ── Sport Injury Prevention Exercise Resolver ───────────────
// Returns actual exercise objects from the DB for sport-specific injury prevention.
// Filters by phase eligibility and location compatibility.
// Uses rotated deduplication: max per-session cap, rotates excess across the week.
export function getSportPreventionExercises(sportPrefs, db, phase, location, maxPerSession = 3, sessionIdx = 0) {
  const prevItems = getRotatedPreventionIds(sportPrefs, maxPerSession, sessionIdx);
  if (prevItems.length === 0) return [];
  const results = [];
  for (const { id, area } of prevItems) {
    const ex = (db || exerciseDB).find(e => e.id === id);
    if (!ex) continue;
    if (!(ex.phaseEligibility || []).includes(phase)) continue;
    if (location === "home" && !(ex.locationCompatible || []).includes("home")) continue;
    if (location === "outdoor" && !(ex.locationCompatible || []).includes("outdoor")) continue;
    results.push({ ...ex, _sportArea: area, _sportPrevention: true, _reason: `Sport injury prevention — ${area}` });
  }
  return results;
}

export { SPORT_TEMPLATES, getSportPatterns };
