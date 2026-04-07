// ═══════════════════════════════════════════════════════════════
// APEX Coach — Workout Session Validator
// Runs on every generated workout. Catches movement pattern gaps,
// chain family dupes, body part concentration, phase mismatches.
// ═══════════════════════════════════════════════════════════════

function normalizePattern(pattern) {
  if (["anti_rotation", "anti_extension", "anti_flexion", "breathing"].includes(pattern)) return "core";
  if (["static_stretch", "foam_roll", "mobility"].includes(pattern)) return "mobility";
  if (["lunge"].includes(pattern)) return "squat"; // lunges count as knee-dominant
  if (["carry"].includes(pattern)) return "core"; // carries = loaded core
  return pattern;
}

export function validateSession(session, phase, profile) {
  const errors = [];
  const warnings = [];
  const exercises = session?.main || [];
  if (exercises.length === 0) { errors.push("No main exercises in session"); return { valid: false, errors, warnings }; }

  const patternCounts = {};
  const chainFamilies = {};
  const bodyParts = {};
  const ids = [];

  exercises.forEach(ex => {
    const p = normalizePattern(ex.movementPattern);
    patternCounts[p] = (patternCounts[p] || 0) + 1;
    const cf = ex.progressionChain?.chainFamily;
    if (cf) chainFamilies[cf] = (chainFamilies[cf] || 0) + 1;
    bodyParts[ex.bodyPart] = (bodyParts[ex.bodyPart] || 0) + 1;
    ids.push(ex.id);
  });

  // Check 1: Pattern coverage
  const required = ["push", "pull", "hinge", "squat", "core"];
  const missing = required.filter(p => !patternCounts[p]);
  // Allow expected gaps for special profiles
  const expectedGaps = profile?.expectedPatternGaps || [];
  const unexpectedMissing = missing.filter(p => !expectedGaps.includes(p));
  if (unexpectedMissing.length > 1) errors.push(`Missing patterns: ${unexpectedMissing.join(", ")}`);
  else if (unexpectedMissing.length === 1) warnings.push(`Missing pattern: ${unexpectedMissing[0]}`);

  // Check 2: Pattern concentration (split-aware)
  // Full-body: max 2 per pattern. Split: primary pattern unlimited, secondary max 2, core always max 2.
  const splitType = profile?.splitType || "full_body"; // "full_body"|"push"|"pull"|"legs"|"upper"|"lower"
  const primaryPatterns = { push: ["push"], pull: ["pull"], legs: ["squat","hinge"], upper: ["push","pull"], lower: ["squat","hinge"], full_body: [] }[splitType] || [];
  Object.entries(patternCounts).forEach(([p, count]) => {
    if (p === "mobility") return;
    const isPrimary = primaryPatterns.includes(p);
    const limit = p === "core" ? 2 : isPrimary ? 99 : 2; // primary unlimited (except core), secondary max 2
    if (count > limit) errors.push(`Pattern "${p}" has ${count} exercises (max ${limit} for ${splitType} session)`);
  });

  // Check 3: Chain family uniqueness
  Object.entries(chainFamilies).forEach(([f, count]) => {
    if (count > 1) errors.push(`Chain family "${f}" has ${count} exercises (max 1)`);
  });

  // Check 4: Body part distribution
  Object.entries(bodyParts).forEach(([bp, count]) => {
    if (count > 3) errors.push(`Body part "${bp}" has ${count} exercises (max 3)`);
  });

  // Check 5: Phase compound ratio
  const compounds = exercises.filter(e => e.type === "strength").length;
  const minCompounds = { 1: 1, 2: 2, 3: 3, 4: 3, 5: 2 }[phase] || 1;
  if (compounds < minCompounds && exercises.length >= 5) {
    warnings.push(`Phase ${phase} expects ${minCompounds}+ compound exercises, found ${compounds}`);
  }

  // Check 6: No duplicates
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length > 0) errors.push(`Duplicate exercises: ${[...new Set(dupes)].join(", ")}`);

  // Check 7: Cardio placement (Rule 20 — cardio after all strength)
  const lastStrengthIdx = exercises.reduce((max, ex, i) => (ex.type === "strength" || ex.type === "isolation" || ex.type === "stabilization") ? i : max, -1);
  const firstCardioIdx = exercises.findIndex(e => e.category === "cardio" || e.type === "cardio");
  if (firstCardioIdx !== -1 && lastStrengthIdx !== -1 && firstCardioIdx < lastStrengthIdx) {
    warnings.push(`Cardio exercise at position ${firstCardioIdx + 1} appears before strength at position ${lastStrengthIdx + 1}`);
  }

  return { valid: errors.length === 0, errors, warnings, patternCounts, bodyParts, compounds, exerciseCount: exercises.length };
}

export { normalizePattern };
