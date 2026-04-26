// ═══════════════════════════════════════════════════════════════
// APEX Coach — Exercise Eligibility (single source of truth)
// Wraps the three universal safety filters (permanent contraindications
// + post-op timeline + universal safety gate). Callers add their own
// context-specific filters (location, sharp pain, difficulty, senior).
// ═══════════════════════════════════════════════════════════════

import { isExerciseBlockedByConditions } from "./weeklyPlanner.js";
import { isExerciseAllowedByPostOp } from "./postOpTimeline.js";
import { checkExerciseSafety } from "./safetyGate.js";

/**
 * isExerciseEligible — returns true iff the exercise passes the universal
 * safety chain for the given profile/phase/week/simulation point.
 * Both buildWorkoutList (App.jsx) and canUseExercise (weeklyPlanner.js)
 * delegate their safety triple-check here.
 *
 * @param {Object} exercise
 * @param {Object} profile  - { conditions: injuryRows[] }
 * @param {Object} context  - { phase, simulatedWeeksPostOp, skipPhaseCheck }
 * @returns {{eligible: boolean, blockedBy: string|null, reason: string|null}}
 */
export function checkExerciseEligibility(exercise, profile, context = {}) {
  const conditions = profile?.conditions || [];
  const { phase = 1, simulatedWeeksPostOp = null, skipPhaseCheck = false } = context;

  // 1. Phase eligibility (skippable for callers that gate phase elsewhere)
  if (!skipPhaseCheck && !(exercise.phaseEligibility || []).includes(phase)) {
    return { eligible: false, blockedBy: "phase", reason: `Not eligible for Phase ${phase}` };
  }

  // 2. Permanent condition contraindications (chronic conditions, fusion, etc.)
  if (conditions.length > 0 && isExerciseBlockedByConditions(exercise, conditions)) {
    return { eligible: false, blockedBy: "permanent_contraindication", reason: "Exercise blocked by chronic-condition contraindication" };
  }

  // 3. Post-op timeline (surgery-date-driven, can simulate future weeks)
  if (conditions.length > 0) {
    const nowMs = simulatedWeeksPostOp != null
      ? Date.now() + (simulatedWeeksPostOp * 7 * 86400000)
      : Date.now();
    if (!isExerciseAllowedByPostOp(exercise, conditions, nowMs)) {
      return { eligible: false, blockedBy: "post_op_timeline", reason: "Exercise blocked by post-op timeline" };
    }
  }

  // 4. Universal safety gate (RTT + condition avoid list + universal post-surgical guards)
  const gate = checkExerciseSafety(exercise, profile, { phase, simulatedWeeksPostOp, skipPhaseCheck: true });
  if (!gate.safe) return { eligible: false, blockedBy: gate.blockedBy, reason: gate.reason };

  return { eligible: true, blockedBy: null, reason: null };
}

/**
 * Filter helper — convenience wrapper around checkExerciseEligibility.
 * Returns just the boolean for use inside .filter() chains.
 */
export function isExerciseEligibleSafe(exercise, profile, context = {}) {
  return checkExerciseEligibility(exercise, profile, context).eligible;
}

/**
 * getEligibleExercises — returns exercises that pass the universal
 * safety chain. Callers can apply additional filters on the result.
 */
export function getEligibleExercises(exerciseDB, profile, context = {}) {
  return (exerciseDB || []).filter(ex => isExerciseEligibleSafe(ex, profile, context));
}
