// ═══════════════════════════════════════════════════════════════
// APEX Coach — Workout Builder Helpers
// Small pure-ish helpers extracted from App.jsx. Used by both
// buildWorkoutList and individual screens for normalizing exercise
// data and gating availability by location/equipment.
//
// NOTE: The big buildWorkoutList / buildSessionBlocks functions
// remain in App.jsx for now — they have too many call-site-specific
// closures to move surgically. Phase 1 extracts pure helpers only.
// ═══════════════════════════════════════════════════════════════

import { capExerciseParams } from "./volumeTracker.js";
import exerciseDB from "../data/exercises.json";
import { getAssessment } from "../components/Onboarding.jsx";

// Phase-appropriate sets/reps/rest/intensity for an exercise (with volume caps).
// Honors session-time-driven _restSecondsOverride that buildWorkoutList stamps
// onto each main exercise so the in-session rest timer reflects the chosen
// session length (30-min → 30s rest, 90-min → 90s, etc.).
export function exParams(ex, phase = 1, diff = "standard") {
  const _restOverride = typeof ex._restSecondsOverride === "number" ? ex._restSecondsOverride : null;
  if (ex._legacy) {
    return {
      sets: ex.sets || 1,
      reps: ex.reps || "—",
      rest: _restOverride != null ? _restOverride : (ex.rest || 0),
      intensity: ex.intensity || "",
      tempo: ex.tempo || "",
    };
  }
  const cp = capExerciseParams(ex, phase, diff);
  const _rest = _restOverride != null ? _restOverride : cp.rest;
  return { sets: cp.sets, reps: cp.reps, rest: _rest, intensity: cp.intensity, tempo: cp.tempo, _capped: cp._capped, _deload: cp._deload };
}

// Normalize muscles access (new schema uses flat arrays).
export function exMuscles(ex) {
  return {
    primary: ex.primaryMuscles || ex.muscles?.primary || [],
    secondary: ex.secondaryMuscles || ex.muscles?.secondary || [],
  };
}

// Normalize injury notes (new schema: object, old: string).
export function exInjuryNotes(ex) {
  if (typeof ex.injuryNotes === "string") return ex.injuryNotes;
  const n = ex.injuryNotes || {};
  return [
    n.lower_back && `⚠️ BACK: ${n.lower_back}`,
    n.knee && `⚠️ KNEE: ${n.knee}`,
    n.shoulder && `⚠️ SHOULDER: ${n.shoulder}`,
  ].filter(Boolean).join("\n");
}

// Normalize location display.
export function exLocationLabel(ex) {
  if (typeof ex.location === "string") return ex.location;
  return (ex.locationCompatible || []).join(", ") || (ex.equipmentRequired || []).join(", ");
}

// Base equipment everyone has (bodyweight, walls, towels).
export const ALWAYS_AVAILABLE = new Set(["none", "wall", "towel", "strap"]);

// Build the user's actual equipment set from their assessment.
export function getUserEquipment() {
  try {
    const assessment = getAssessment();
    const selected = assessment?.preferences?.homeEquipment || [];
    const equip = new Set(ALWAYS_AVAILABLE);
    selected.forEach(id => equip.add(id));
    if (selected.includes("none") && selected.length === 1) return equip;
    return equip;
  } catch { return new Set(ALWAYS_AVAILABLE); }
}

// Filter — is this exercise usable at the given location with the user's
// equipment? Mirrors the inline check used by buildWorkoutList pick().
export function locationFilter(ex, location) {
  if (location === "gym") return true;
  if (location === "outdoor") {
    if (!(ex.locationCompatible || []).includes("outdoor")) return false;
    const outdoorEquip = new Set(["none", "wall", "towel", "strap", "mat", "band"]);
    return (ex.equipmentRequired || []).every(eq => outdoorEquip.has(eq));
  }
  // Home: check against user's actual equipment
  const userEquip = getUserEquipment();
  if (!userEquip || userEquip.size === 0) {
    const defaultHomeEquip = new Set(["none", "mat", "band", "dumbbell"]);
    return (ex.equipmentRequired || []).every(eq => defaultHomeEquip.has(eq));
  }
  return (ex.equipmentRequired || []).every(eq => userEquip.has(eq));
}

// Quick exercise-by-id lookup.
export const exById = Object.fromEntries(exerciseDB.map(e => [e.id, e]));

// Try to substitute an exercise for home/outdoor when the original requires
// gym equipment. Returns the substitute (with swap metadata) or null.
export function trySubstitute(ex, location, phase) {
  const subKey = location === "outdoor" ? "outdoor" : "home";
  const subId = ex.substitutions?.[subKey];
  if (!subId) return null;
  const sub = exById[subId];
  if (!sub) return null;
  if (!(sub.phaseEligibility || []).includes(phase)) return null;
  if (!locationFilter(sub, location)) return null;
  return {
    ...sub,
    _swappedFor: ex.name,
    _swapReason: location === "outdoor" ? "outdoor — no gym equipment" : "home — equipment not available",
  };
}
