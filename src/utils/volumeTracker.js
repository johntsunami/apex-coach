// ═══════════════════════════════════════════════════════════════
// APEX Coach — Weekly Volume Tracker & Deload Engine
// Enforces set limits per muscle group per phase, deload weeks,
// and early-phase set caps (weeks 1-2: max 2 sets/exercise)
// ═══════════════════════════════════════════════════════════════

import { getSessions, getStats } from "./storage.js";
import { VOLUME_LIMITS, PHASE_DEFAULTS } from "./constants.js";

// Hypertrophy-specific volume limits by experience (Pelland et al. 2026)
const HYPERTROPHY_VOLUME = {
  beginner:     { min: 10, max: 12 },
  intermediate: { min: 14, max: 18 },
  advanced:     { min: 18, max: 24 },
  competitor:   { min: 20, max: 25 },
};
const HYPERTROPHY_ABSOLUTE_CAP = 30;  // Hard cap — beyond this, negative returns
const HYPERTROPHY_SESSION_CAP = 12;   // Max productive sets per muscle per session

// ── Week & deload tracking ────────────────────────────────────

function getTrainingWeek() {
  const sessions = getSessions();
  if (sessions.length === 0) return { week: 1, phaseWeek: 1, isDeload: false };

  // Find the earliest session date
  const firstDate = new Date(sessions[0].date);
  const now = new Date();
  const daysSinceStart = Math.floor((now - firstDate) / (1000 * 60 * 60 * 24));
  const week = Math.max(1, Math.floor(daysSinceStart / 7) + 1);

  // Phase week resets per phase — for now we track from start
  const phaseWeek = week; // TODO: reset when phase changes

  // Deload: every 4th week
  const isDeload = week >= 4 && week % 4 === 0;

  return { week, phaseWeek, isDeload };
}

// ── Weekly volume from completed sessions ─────────────────────

function getWeeklyVolume() {
  const sessions = getSessions();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const volume = {};
  sessions
    .filter((s) => new Date(s.date) >= weekAgo)
    .forEach((s) => {
      if (s.total_volume) {
        Object.entries(s.total_volume).forEach(([muscle, sets]) => {
          volume[muscle] = (volume[muscle] || 0) + sets;
        });
      }
    });

  return volume;
}

// ── Get the volume limit for a muscle group in current phase ──

function getVolumeLimit(phase = 1) {
  const limits = VOLUME_LIMITS[phase] || VOLUME_LIMITS[1];
  const { isDeload } = getTrainingWeek();

  // Deload weeks: 50% volume
  if (isDeload) {
    return { min: Math.floor(limits.min / 2), max: Math.floor(limits.max / 2) };
  }

  return limits;
}

// ── Max sets per exercise based on phase week ─────────────────

function getMaxSetsPerExercise(phase = 1) {
  const { phaseWeek, isDeload } = getTrainingWeek();

  if (isDeload) return 1; // Deload: 1 set per exercise
  if (phaseWeek <= 2) return 2; // Weeks 1-2: max 2 sets (neural adaptation)
  if (phaseWeek <= 4) return 3; // Weeks 3-4: max 3 sets

  // Week 5+: follow phase parameters
  return phase >= 3 ? 5 : phase >= 2 ? 4 : 3;
}

// ── Check if adding an exercise would exceed volume limits ────

function wouldExceedVolume(exercise, currentVolume, phase = 1) {
  const limit = getVolumeLimit(phase);
  const bodyPart = exercise.bodyPart || "other";
  const currentSets = currentVolume[bodyPart] || 0;
  const exerciseSets = _getExerciseSets(exercise, phase);

  if (currentSets + exerciseSets > limit.max) {
    return {
      exceeded: true,
      muscle: bodyPart,
      current: currentSets,
      limit: limit.max,
      adding: exerciseSets,
    };
  }

  return { exceeded: false };
}

// ── Find a mobility/cardio substitute when volume is exceeded ─

function findVolumeSub(exercise, exerciseDB, phase = 1, location = "gym") {
  // Try to find a mobility or cooldown exercise for the same body area
  const alternatives = exerciseDB.filter(
    (e) =>
      (e.category === "mobility" || e.category === "cooldown" || e.category === "foam_roll" || e.category === "cardio") &&
      (e.phaseEligibility || []).includes(phase) &&
      (location === "gym" || (e.locationCompatible || []).includes(location))
  );

  // Prefer same body part, then any mobility
  const samePart = alternatives.find((e) => e.bodyPart === exercise.bodyPart);
  return samePart || alternatives[0] || null;
}

// ── Issue 2: Smart params for stabilization/timed exercises ──────
// Core stabilization exercises ALWAYS use stabilization params (never 5×3-5)
// Timed holds (plank, side plank) progress by duration, not reps

function getExerciseDisplayParams(exercise, phase = 1) {
  // Timed holds FIRST (plank, side plank, dead hang, wall sit) — progress by duration not reps
  const isTimedHold = exercise.trackingType === "timed" ||
    exercise.name?.toLowerCase().includes("plank") ||
    exercise.name?.toLowerCase().includes("hold") ||
    exercise.name?.toLowerCase().includes("hang");
  if (isTimedHold) {
    const timedParams = { 1: { sets: "2", reps: "20-30s hold", rest: "30s" }, 2: { sets: "2-3", reps: "30-45s hold", rest: "30s" }, 3: { sets: "3", reps: "45-60s hold", rest: "30s" }, 4: { sets: "3", reps: "45-60s hold", rest: "30s" }, 5: { sets: "3", reps: "45-60s hold", rest: "30s" } };
    return timedParams[phase] || timedParams[3];
  }

  // Core stabilization exercises — ALWAYS use stabilization params (never 5×3-5)
  const STAB_IDS = ["dead_bug", "bird_dog", "pallof_press", "mcgill_curl_up", "stir_the_pot"];
  const isStabilizationCore = (
    exercise.type === "stabilization" ||
    (exercise.bodyPart === "core" && (exercise.difficultyLevel || 3) <= 2) ||
    STAB_IDS.some(id => exercise.id?.includes(id) || exercise.name?.toLowerCase().includes(id.replace(/_/g, " ")))
  );
  if (isStabilizationCore) {
    // Use their Phase 1-2 params, NEVER apply Phase 4+ max-strength rep ranges
    return exercise.phaseParams?.[String(Math.min(phase, 2))] || { sets: "2-3", reps: "8-12 each side", tempo: "4/2/1", rest: "30-60s", intensity: "bodyweight" };
  }

  // Normal exercises: use their phaseParams or NASM defaults (from constants.js)
  return exercise.phaseParams?.[String(phase)] || PHASE_DEFAULTS[phase] || {};
}

// ── Apply volume caps to exercise parameters ──────────────────

function capExerciseParams(exercise, phase = 1, difficulty = "standard") {
  const maxSets = getMaxSetsPerExercise(phase);
  // Issue 2: use smart params (stabilization/timed get their own ranges)
  const phaseParams = getExerciseDisplayParams(exercise, phase);

  let sets = parseInt(phaseParams.sets) || 1;
  let rest = parseInt(phaseParams.rest) || 0;

  // Apply difficulty modifiers
  if (difficulty === "push") {
    if (exercise.category === "main") sets += 1;
    rest = Math.max(0, rest - 10);
  } else if (difficulty === "send") {
    if (exercise.category === "main") sets += 2;
    rest = Math.max(0, rest - 20);
  } else if (difficulty === "hypertrophy") {
    // Hypertrophy: extra set on main exercises, longer rest for compounds
    if (exercise.category === "main") sets += 1;
    const isCompound = (exercise.movementPattern || "").match(/push|pull|squat|hinge|press|row/i);
    rest = isCompound ? Math.max(rest, 90) : Math.max(60, rest);
  }

  // Cap sets to max allowed for this phase week
  sets = Math.min(sets, maxSets);

  // Deload: RPE 5 max
  const { isDeload } = getTrainingWeek();
  const intensity = isDeload ? "RPE 5 (deload)" : phaseParams.intensity || "";

  return {
    sets,
    reps: phaseParams.reps || "—",
    rest,
    intensity,
    tempo: phaseParams.tempo || "",
    _capped: sets < (parseInt(phaseParams.sets) || 1),
    _deload: isDeload,
  };
}

// ── Build volume summary for Home screen ──────────────────────

function getVolumeSummary(phase = 1) {
  const volume = getWeeklyVolume();
  const limit = getVolumeLimit(phase);
  const { week, isDeload } = getTrainingWeek();

  const groups = Object.entries(volume)
    .map(([muscle, sets]) => ({
      muscle: muscle.replace(/_/g, " "),
      sets,
      limit: limit.max,
      pct: Math.round((sets / limit.max) * 100),
      over: sets > limit.max,
    }))
    .sort((a, b) => b.pct - a.pct);

  return { groups, week, isDeload, limit };
}

function _getExerciseSets(exercise, phase) {
  const p =
    exercise.phaseParams?.[String(phase)] ||
    Object.values(exercise.phaseParams || {})[0] ||
    {};
  return parseInt(p.sets) || 1;
}

// ── Safeguard-aware param wrapper ────────────────────────────
import { getSafeExerciseParams } from './safeguards.js';

function getSafeguardedParams(exercise, phase, profile) {
  return getSafeExerciseParams(
    exercise, phase,
    profile?.injuries || [], profile?.conditions || [],
    profile?.age, profile?.fitnessLevel,
    getExerciseDisplayParams
  );
}

export {
  getTrainingWeek,
  getWeeklyVolume,
  getVolumeLimit,
  getMaxSetsPerExercise,
  wouldExceedVolume,
  findVolumeSub,
  capExerciseParams,
  getExerciseDisplayParams,
  getSafeguardedParams,
  getVolumeSummary,
  VOLUME_LIMITS,
  HYPERTROPHY_VOLUME,
  HYPERTROPHY_ABSOLUTE_CAP,
  HYPERTROPHY_SESSION_CAP,
};
