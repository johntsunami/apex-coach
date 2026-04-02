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
