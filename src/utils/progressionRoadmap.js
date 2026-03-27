// ═══════════════════════════════════════════════════════════════
// APEX Coach — Progression Roadmap & Favorite Readiness Engine
// Builds chains, checks readiness, tracks progress, auto-advances
// ═══════════════════════════════════════════════════════════════

import exerciseDB from "../data/exercises.json";
import { getInjuries } from "./injuries.js";
import { getSessions } from "./storage.js";

const exById = Object.fromEntries(exerciseDB.map((e) => [e.id, e]));

// ── Storage keys ─────────────────────────────────────────────
const PROGRESS_KEY = "apex_exercise_progress";
const UNLOCK_NOTIFICATIONS_KEY = "apex_unlock_notifications";

// ── Exercise progress tracking ───────────────────────────────

export function getExerciseProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
  } catch {
    return {};
  }
}

export function saveExerciseProgress(progress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function getProgressForExercise(exerciseId) {
  const all = getExerciseProgress();
  return all[exerciseId] || { timesCompleted: 0, painFreeCount: 0, mastered: false, lastCompleted: null };
}

export function recordExerciseCompletion(exerciseId, painFree = true) {
  const all = getExerciseProgress();
  const cur = all[exerciseId] || { timesCompleted: 0, painFreeCount: 0, mastered: false, lastCompleted: null };
  cur.timesCompleted++;
  if (painFree) cur.painFreeCount++;
  else cur.painFreeCount = 0; // reset streak on pain
  cur.lastCompleted = new Date().toISOString();
  // Auto-mastery: 3 consecutive pain-free sessions
  if (cur.painFreeCount >= 3 && !cur.mastered) {
    cur.mastered = true;
    cur.masteredAt = new Date().toISOString();
  }
  all[exerciseId] = cur;
  saveExerciseProgress(all);
  return cur;
}

// ── Unlock notifications ─────────────────────────────────────

export function getUnlockNotifications() {
  try {
    return JSON.parse(localStorage.getItem(UNLOCK_NOTIFICATIONS_KEY)) || [];
  } catch {
    return [];
  }
}

export function addUnlockNotification(notification) {
  const all = getUnlockNotifications();
  all.push({ ...notification, timestamp: new Date().toISOString(), seen: false });
  localStorage.setItem(UNLOCK_NOTIFICATIONS_KEY, JSON.stringify(all));
}

export function markNotificationsSeen() {
  const all = getUnlockNotifications();
  all.forEach((n) => (n.seen = true));
  localStorage.setItem(UNLOCK_NOTIFICATIONS_KEY, JSON.stringify(all));
}

// ── Build the full progression chain for an exercise ─────────

export function buildChain(exerciseId) {
  const target = exById[exerciseId];
  if (!target) return [];

  const family = target.progressionChain?.chainFamily;
  if (!family) return [target];

  // Get all exercises in same chain family, sorted by level
  const chainExercises = exerciseDB
    .filter((e) => e.progressionChain?.chainFamily === family)
    .sort((a, b) => (a.progressionChain?.level || 0) - (b.progressionChain?.level || 0));

  if (chainExercises.length === 0) return [target];

  // Walk backward from target to find the path TO it
  const path = [];
  let current = target;
  const visited = new Set();

  // First, collect all exercises from root to target
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    path.unshift(current);
    const regId = current.progressionChain?.regressTo;
    if (regId) current = exById[regId];
    else break;
  }

  // Also add exercises that come AFTER the target (progression beyond)
  current = target;
  visited.clear();
  visited.add(target.id);
  while (current) {
    const progId = current.progressionChain?.progressTo;
    if (!progId || visited.has(progId)) break;
    const next = exById[progId];
    if (!next) break;
    visited.add(next.id);
    path.push(next);
    current = next;
  }

  return path;
}

// ── Check if a user is ready for a specific exercise ─────────

export function checkReadiness(exerciseId, profile = {}) {
  const ex = exById[exerciseId];
  if (!ex) return { ready: false, reasons: ["Exercise not found"] };

  const injuries = profile.injuries || getInjuries();
  const active = injuries.filter((i) => i.status !== "resolved");
  const phase = profile.phase || 1;
  const sessionCount = profile.sessionCount ?? (getSessions()?.length || 0);
  const progress = getExerciseProgress();
  const reasons = [];

  // Phase eligibility
  if (ex.phaseEligibility && !ex.phaseEligibility.includes(phase)) {
    reasons.push(`Requires Phase ${Math.min(...ex.phaseEligibility)} (currently Phase ${phase})`);
  }

  // Safety tier
  if (ex.safetyTier === "red") {
    reasons.push("Advanced exercise — requires clearance");
  }

  // Prerequisites
  const prereqs = ex.prerequisites || {};

  if (prereqs.minCompletedSessions && sessionCount < prereqs.minCompletedSessions) {
    reasons.push(`Need ${prereqs.minCompletedSessions} sessions (have ${sessionCount})`);
  }

  if (prereqs.minPhase && phase < prereqs.minPhase) {
    reasons.push(`Requires Phase ${prereqs.minPhase}`);
  }

  // Severity gates
  const sg = ex.contraindications?.severity_gate || prereqs.maxInjurySeverity || {};
  for (const inj of active) {
    const gate = sg[inj.gateKey];
    if (gate !== undefined && inj.severity > gate) {
      reasons.push(`${inj.area} severity ${inj.severity} exceeds gate ${gate}`);
    }
  }

  // Required exercises mastered
  if (prereqs.requiredExercisesMastered?.length) {
    for (const reqId of prereqs.requiredExercisesMastered) {
      if (!progress[reqId]?.mastered) {
        const reqEx = exById[reqId];
        reasons.push(`Must master ${reqEx?.name || reqId} first`);
      }
    }
  }

  // Regression chain — check if previous step is mastered
  const regId = ex.progressionChain?.regressTo;
  if (regId && ex.progressionChain?.level > 1) {
    const regProgress = progress[regId];
    if (!regProgress?.mastered) {
      const regEx = exById[regId];
      reasons.push(`Must master ${regEx?.name || regId} first (progression chain)`);
    }
  }

  return {
    ready: reasons.length === 0,
    reasons,
    exercise: ex,
  };
}

// ── Get current step in chain for a target exercise ──────────

export function getCurrentStep(targetId) {
  const chain = buildChain(targetId);
  if (chain.length === 0) return null;

  const progress = getExerciseProgress();
  const target = exById[targetId];
  const targetIdx = chain.findIndex((e) => e.id === targetId);

  // Find the highest mastered step in the chain up to (not including) target
  let currentIdx = 0;
  for (let i = 0; i < chain.length; i++) {
    if (i >= targetIdx) break;
    if (progress[chain[i].id]?.mastered) {
      currentIdx = i + 1; // Move past mastered
    } else {
      break; // First unmastered = current
    }
  }

  // If all steps mastered up to target, check target itself
  if (currentIdx >= targetIdx) {
    const readiness = checkReadiness(targetId);
    if (readiness.ready) return { step: targetIdx, total: chain.length, chain, unlocked: true, exercise: target };
  }

  const currentExercise = chain[Math.min(currentIdx, chain.length - 1)];
  return {
    step: currentIdx,
    total: chain.length,
    targetIdx,
    chain,
    unlocked: currentIdx >= targetIdx,
    exercise: currentExercise,
    target,
  };
}

// ── Progress percentage toward a target exercise ─────────────

export function getProgressPercent(targetId) {
  const info = getCurrentStep(targetId);
  if (!info || info.chain.length <= 1) return 100;
  if (info.unlocked) return 100;
  return Math.round((info.step / info.targetIdx) * 100);
}

// ── Build roadmap data for display ───────────────────────────

export function buildRoadmap(targetId) {
  const chain = buildChain(targetId);
  const target = exById[targetId];
  if (!target) return null;

  const targetIdx = chain.findIndex((e) => e.id === targetId);
  if (targetIdx < 0) return null;

  // Only show steps up to and including the target
  const stepsToTarget = chain.slice(0, targetIdx + 1);
  const progress = getExerciseProgress();
  const injuries = getInjuries().filter((i) => i.status !== "resolved");

  const steps = stepsToTarget.map((ex, i) => {
    const prog = progress[ex.id] || { timesCompleted: 0, painFreeCount: 0, mastered: false };
    const isTarget = i === targetIdx;
    const readiness = checkReadiness(ex.id);
    const isMastered = prog.mastered;
    const isCurrent = !isMastered && (i === 0 || progress[stepsToTarget[i - 1]?.id]?.mastered);

    return {
      exercise: ex,
      stepNumber: i + 1,
      isTarget,
      isCurrent,
      isMastered,
      isLocked: !isMastered && !isCurrent,
      readiness,
      progress: prog,
      unlockCriteria: ex.progressionChain?.unlockCriteria || "3 pain-free sessions",
      painFreeCount: prog.painFreeCount,
      painFreeNeeded: 3,
    };
  });

  const currentStepIdx = steps.findIndex((s) => s.isCurrent);
  const progressPct =
    currentStepIdx < 0
      ? steps.every((s) => s.isMastered) ? 100 : 0
      : Math.round((currentStepIdx / targetIdx) * 100);

  return {
    target,
    steps,
    progressPercent: progressPct,
    currentStep: currentStepIdx >= 0 ? steps[currentStepIdx] : null,
    totalSteps: steps.length,
    unlocked: steps[steps.length - 1]?.isMastered || checkReadiness(targetId).ready,
  };
}

// ── Prioritize favorites in workout plan ─────────────────────

export function prioritizeFavorites(plan, favorites = [], phase = 1) {
  if (!favorites.length) return { plan, additions: [], notes: [] };

  const additions = [];
  const notes = [];
  const planIds = new Set((plan.main || []).map((e) => e.id));

  for (const favId of favorites) {
    const fav = exById[favId];
    if (!fav) continue;
    if (planIds.has(favId)) continue; // Already in plan

    const readiness = checkReadiness(favId);

    if (readiness.ready) {
      // Ready — add to plan with priority note
      additions.push({
        ...fav,
        _reason: "Favorited exercise — prioritized in your plan",
        _favorite: true,
      });
      notes.push({
        type: "included",
        exercise: fav.name,
        exerciseId: fav.id,
        msg: `${fav.name} included — you favorited this exercise`,
      });
    } else {
      // Not ready — find current step in chain and include that
      const info = getCurrentStep(favId);
      if (info && info.exercise && info.exercise.id !== favId && !planIds.has(info.exercise.id)) {
        const currentEx = info.exercise;
        const currentReadiness = checkReadiness(currentEx.id);
        if (currentReadiness.ready) {
          additions.push({
            ...currentEx,
            _reason: `Building toward ${fav.name} — currently working ${currentEx.name}`,
            _favorite: true,
            _buildingToward: fav.name,
            _buildingTowardId: fav.id,
          });
          notes.push({
            type: "regression",
            exercise: currentEx.name,
            exerciseId: currentEx.id,
            target: fav.name,
            targetId: fav.id,
            msg: `Working ${currentEx.name} → building toward ${fav.name}`,
            reasons: readiness.reasons,
          });
        }
      }
    }
  }

  return { plan, additions, notes };
}

// ── Check and process auto-advancements ──────────────────────

export function checkAutoAdvancements(favorites = []) {
  const notifications = [];
  const progress = getExerciseProgress();

  for (const favId of favorites) {
    const chain = buildChain(favId);
    const targetIdx = chain.findIndex((e) => e.id === favId);
    if (targetIdx < 0) continue;

    for (let i = 0; i < targetIdx; i++) {
      const step = chain[i];
      const nextStep = chain[i + 1];
      if (!nextStep) continue;

      const stepProg = progress[step.id];
      if (stepProg?.mastered && stepProg.masteredAt) {
        // Check if we already notified about this
        const existing = getUnlockNotifications().find(
          (n) => n.unlockedId === nextStep.id && n.fromId === step.id
        );
        if (!existing) {
          const isTarget = nextStep.id === favId;
          notifications.push({
            unlockedId: nextStep.id,
            unlockedName: nextStep.name,
            fromId: step.id,
            fromName: step.name,
            targetId: favId,
            targetName: exById[favId]?.name || favId,
            isTarget,
            msg: isTarget
              ? `You've unlocked ${nextStep.name}! Your favorite is now available!`
              : `You've unlocked ${nextStep.name}! One step closer to ${exById[favId]?.name}.`,
          });
          addUnlockNotification({
            unlockedId: nextStep.id,
            unlockedName: nextStep.name,
            fromId: step.id,
            fromName: step.name,
            targetId: favId,
          });
        }
      }
    }
  }

  return notifications;
}

// ── Get all favorite roadmaps for display ────────────────────

export function getAllFavoriteRoadmaps(favorites = []) {
  return favorites
    .map((favId) => {
      const readiness = checkReadiness(favId);
      if (readiness.ready) return null; // Ready — no roadmap needed
      return buildRoadmap(favId);
    })
    .filter(Boolean);
}
