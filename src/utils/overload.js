// ═══════════════════════════════════════════════════════════════
// NASM Progressive Overload Engine
// Determines what to change next session based on stored set data
// ═══════════════════════════════════════════════════════════════

import { getSessions } from "./storage.js";

const PHASE_RANGES = {
  1: { repsMin: 12, repsMax: 20, setsMax: 3 },
  2: { repsMin: 8, repsMax: 12, setsMax: 4 },
  3: { repsMin: 6, repsMax: 12, setsMax: 5 },
};

/**
 * Compute progressive overload recommendation for a specific exercise.
 * Returns { action, variable, from, to, reason }
 */
export function getOverloadRecommendation(exerciseId, phase = 1) {
  const sessions = getSessions();
  const range = PHASE_RANGES[phase] || PHASE_RANGES[1];

  // Find last 2 sessions that include this exercise
  const recent = [];
  for (let i = sessions.length - 1; i >= 0 && recent.length < 2; i--) {
    const ec = (sessions[i].exercises_completed || []).find(e => e.exercise_id === exerciseId);
    if (ec) recent.push(ec);
  }

  if (recent.length === 0) return { action: "maintain", reason: "No previous data" };

  const last = recent[0];
  const sets = last.sets || [];

  // Check if any pain
  if (sets.some(s => s.pain)) {
    return { action: "regress", reason: "Pain reported — maintaining or regressing for safety" };
  }

  // Check if struggled/failed
  const struggled = sets.filter(s => s.quality === "struggled" || s.quality === "failed").length;
  if (struggled >= 2) {
    return { action: "maintain", reason: `Struggled on ${struggled} sets — solidify before progressing` };
  }

  // Check RPE — all sets must be ≤7 to progress
  const avgRpe = sets.filter(s => s.rpe).reduce((sum, s) => sum + s.rpe, 0) / Math.max(1, sets.filter(s => s.rpe).length);
  if (avgRpe > 7) {
    return { action: "maintain", reason: `Average RPE ${avgRpe.toFixed(1)} — wait for RPE ≤7 before increasing` };
  }

  // All completed, no pain, RPE ≤7 → recommend ONE progression
  const avgReps = Math.round(sets.reduce((sum, s) => sum + (s.reps_done || 0), 0) / sets.length);
  const currentLoad = sets[0]?.load || 0;
  const numSets = sets.length;

  // 1. First: increase reps (within phase range)
  if (avgReps < range.repsMax) {
    return {
      action: "progress", variable: "reps",
      from: avgReps, to: Math.min(avgReps + 2, range.repsMax),
      reason: "All sets completed — increasing reps",
    };
  }

  // 2. Then: increase sets (within phase limit)
  if (numSets < range.setsMax) {
    return {
      action: "progress", variable: "sets",
      from: numSets, to: numSets + 1,
      reason: "Max reps achieved — adding 1 set",
    };
  }

  // 3. Then: increase load (2-5% upper, 5-10% lower)
  if (currentLoad > 0) {
    const isLower = ["legs", "glutes", "hips", "calves", "full_body"].includes(last.bodyPart || "");
    const pct = isLower ? 0.075 : 0.035;
    const inc = Math.max(2.5, Math.round(currentLoad * pct / 2.5) * 2.5);
    return {
      action: "progress", variable: "load",
      from: currentLoad, to: currentLoad + inc,
      reason: `Sets and reps maxed — increasing load +${inc} lbs (${Math.round(pct * 100)}%)`,
    };
  }

  // 4. Then: decrease rest
  return {
    action: "progress", variable: "rest",
    from: null, to: null,
    reason: "All variables maxed — decreasing rest period",
  };
}

/**
 * Get overload recommendations for all exercises in a workout
 */
export function getWorkoutOverloads(workout, phase = 1) {
  const results = {};
  (workout?.all || []).forEach(ex => {
    const rec = getOverloadRecommendation(ex.id, phase);
    if (rec.action !== "maintain" || rec.reason !== "No previous data") {
      results[ex.id] = rec;
    }
  });
  return results;
}
