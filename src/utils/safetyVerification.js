// ═══════════════════════════════════════════════════════════════
// APEX Coach — Safety & Quality Verification Engine
// 12 automated clinical checks that validate EVERY generated plan
// ═══════════════════════════════════════════════════════════════

import exerciseDB from "../data/exercises.json";
import conditionsDB from "../data/conditions.json";
import { getInjuries } from "./injuries.js";
import { getAssessment } from "../components/Onboarding.jsx";
import { getLocalProtocols } from "../components/PTSystem.jsx";
import {
  getWeeklyVolume,
  getVolumeLimit,
  getTrainingWeek,
} from "./volumeTracker.js";
import { VOLUME_LIMITS } from "./constants.js";
import { getSessions } from "./storage.js";

const exById = Object.fromEntries(exerciseDB.map((e) => [e.id, e]));

// ── Helper: find condition DB entry by key ──────────────────
function findCondition(condKey) {
  return conditionsDB.find(
    (c) => c.id === condKey || c.condition === condKey
  );
}

// ── Helper: find safe substitute ────────────────────────────
function findSubstitute(exercise, blockedIds, phase = 1) {
  // Try progression chain regression first
  const regId = exercise.progressionChain?.regressTo;
  if (regId && !blockedIds.has(regId)) {
    const reg = exById[regId];
    if (reg && (reg.phaseEligibility || []).includes(phase)) return reg;
  }
  // Try same body part + movement pattern
  const alt = exerciseDB.find(
    (e) =>
      e.id !== exercise.id &&
      !blockedIds.has(e.id) &&
      e.bodyPart === exercise.bodyPart &&
      e.movementPattern === exercise.movementPattern &&
      (e.phaseEligibility || []).includes(phase) &&
      e.safetyTier !== "red"
  );
  if (alt) return alt;
  // Fallback: same body part, any pattern
  return exerciseDB.find(
    (e) =>
      e.id !== exercise.id &&
      !blockedIds.has(e.id) &&
      e.bodyPart === exercise.bodyPart &&
      (e.phaseEligibility || []).includes(phase) &&
      e.safetyTier !== "red"
  );
}

// ═══════════════════════════════════════════════════════════════
// CHECK 1: CONTRAINDICATION CROSS-CHECK
// ═══════════════════════════════════════════════════════════════
export function checkContraindications(plan, profile) {
  const result = { passed: true, issues: [], corrections: [] };
  const injuries = profile.injuries || getInjuries();
  const active = injuries.filter((i) => i.status !== "resolved");
  const conditions = profile.conditions || [];
  const blockedIds = new Set();

  for (const ex of plan.all || []) {
    const sg = ex.contraindications?.severity_gate || {};
    const ciConditions = ex.contraindications?.conditions || [];
    const ciInjuries = ex.contraindications?.injuries || [];

    // Check severity gates against injuries
    for (const inj of active) {
      const gate = sg[inj.gateKey];
      const eff = inj.tempFlag ? Math.min(5, inj.severity + 1) : inj.severity;
      if (gate !== undefined && eff > gate) {
        blockedIds.add(ex.id);
        result.passed = false;
        const sub = findSubstitute(ex, blockedIds, profile.phase || 1);
        result.issues.push({
          check: 1,
          severity: "critical",
          exercise: ex.name,
          exerciseId: ex.id,
          msg: `Contraindicated for ${inj.area} — severity ${eff} > gate ${gate}`,
        });
        result.corrections.push({
          action: "substitute",
          removed: ex.id,
          removedName: ex.name,
          replacement: sub?.id || null,
          replacementName: sub?.name || "None available",
          reason: `${inj.area} severity ${eff} exceeds safety gate ${gate}`,
        });
        break;
      }
    }

    // Check condition-specific blocks
    for (const cond of conditions) {
      const condDB = findCondition(cond.conditionId);
      if (!condDB) continue;
      // Check avoid list (string matching against exercise name/pattern)
      const avoids = condDB.avoid || [];
      for (const avoidPattern of avoids) {
        const pattern = avoidPattern.toLowerCase();
        const exName = ex.name.toLowerCase();
        const exType = (ex.movementPattern || "").toLowerCase();
        if (
          exName.includes(pattern) ||
          pattern.includes(exName) ||
          (pattern.includes("plyometric") && ex.tags?.includes("plyometric")) ||
          (pattern.includes("deadlift") && exName.includes("deadlift")) ||
          (pattern.includes("crunch") && exName.includes("crunch")) ||
          (pattern.includes("sit-up") && exName.includes("sit"))
        ) {
          if (!blockedIds.has(ex.id)) {
            blockedIds.add(ex.id);
            result.passed = false;
            const sub = findSubstitute(ex, blockedIds, profile.phase || 1);
            result.issues.push({
              check: 1,
              severity: "critical",
              exercise: ex.name,
              exerciseId: ex.id,
              msg: `Condition "${condDB.name}" avoids: ${avoidPattern}`,
            });
            result.corrections.push({
              action: "substitute",
              removed: ex.id,
              removedName: ex.name,
              replacement: sub?.id || null,
              replacementName: sub?.name || "None available",
              reason: `Blocked by ${condDB.name}`,
            });
          }
          break;
        }
      }
      // Check conditions array on exercise
      if (ciConditions.includes(cond.conditionId) && !blockedIds.has(ex.id)) {
        blockedIds.add(ex.id);
        result.passed = false;
        const sub = findSubstitute(ex, blockedIds, profile.phase || 1);
        result.issues.push({
          check: 1,
          severity: "critical",
          exercise: ex.name,
          exerciseId: ex.id,
          msg: `Exercise directly contraindicated for condition ${cond.conditionId}`,
        });
        result.corrections.push({
          action: "substitute",
          removed: ex.id,
          removedName: ex.name,
          replacement: sub?.id || null,
          replacementName: sub?.name || "None available",
          reason: `Direct contraindication for ${cond.name || cond.conditionId}`,
        });
      }
    }
  }

  if (result.issues.length === 0) result.passed = true;
  return result;
}

// ═══════════════════════════════════════════════════════════════
// CHECK 2: DIRECTIONAL PREFERENCE COMPLIANCE
// ═══════════════════════════════════════════════════════════════
export function checkDirectionalPreference(plan, profile) {
  const result = { passed: true, issues: [], corrections: [] };
  const assessment = profile.assessment || getAssessment() || {};
  const dirPrefs = assessment.directionalPreferences || {};
  const conditions = profile.conditions || assessment.conditions || [];
  const spinal = conditions.filter((c) => c.category === "spinal");

  if (spinal.length === 0) return result; // No spinal conditions — skip

  // Categorize PT exercises
  const extensionExIds = new Set([
    "mob_cat_cow", // used in both but primarily extension-included
  ]);
  const flexionPatterns = ["crunch", "sit-up", "toe touch", "jefferson curl"];
  const extensionPatterns = ["press-up", "cobra", "extension", "superman"];

  for (const cond of spinal) {
    const dp = dirPrefs[cond.conditionId];
    if (!dp) {
      result.issues.push({
        check: 2,
        severity: "warning",
        msg: `Directional preference not determined for ${cond.name || cond.conditionId} — using neutral protocol. Consider testing.`,
      });
      continue;
    }

    const preference =
      dp.extension === "better"
        ? "extension"
        : dp.flexion === "better"
        ? "flexion"
        : "neutral";

    for (const ex of plan.all || []) {
      const exName = ex.name.toLowerCase();

      if (preference === "extension") {
        // Flexion exercises should be absent
        if (
          flexionPatterns.some((p) => exName.includes(p)) ||
          ex.movementPattern === "spinal_flexion"
        ) {
          result.passed = false;
          result.issues.push({
            check: 2,
            severity: "critical",
            exercise: ex.name,
            exerciseId: ex.id,
            msg: `Flexion exercise present but user has EXTENSION preference — wrong direction can cause harm`,
          });
          result.corrections.push({
            action: "remove",
            removed: ex.id,
            removedName: ex.name,
            reason:
              "Extension preference — all flexion exercises must be removed",
          });
        }
      } else if (preference === "flexion") {
        // Extension exercises should be absent
        if (
          extensionPatterns.some((p) => exName.includes(p)) &&
          !exName.includes("hip")
        ) {
          result.passed = false;
          result.issues.push({
            check: 2,
            severity: "critical",
            exercise: ex.name,
            exerciseId: ex.id,
            msg: `Extension exercise present but user has FLEXION preference — wrong direction can cause harm`,
          });
          result.corrections.push({
            action: "remove",
            removed: ex.id,
            removedName: ex.name,
            reason:
              "Flexion preference — extension exercises must be removed",
          });
        }
      }
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════
// CHECK 3: MULTIPLE CONDITION INTERSECTION
// ═══════════════════════════════════════════════════════════════
export function checkMultipleConditions(plan, profile) {
  const result = { passed: true, issues: [], corrections: [] };
  const conditions = profile.conditions || [];
  if (conditions.length < 2) return result;

  // Gather all avoid lists
  const avoidSets = {};
  for (const cond of conditions) {
    const condDB = findCondition(cond.conditionId);
    if (condDB) avoidSets[cond.conditionId] = new Set(condDB.avoid || []);
  }

  // Find exercises that are safe for some but not all
  const safeExerciseCount = exerciseDB.filter((ex) => {
    const sg = ex.contraindications?.severity_gate || {};
    const injuries = profile.injuries || getInjuries();
    const active = injuries.filter((i) => i.status !== "resolved");
    return !active.some((inj) => {
      const gate = sg[inj.gateKey];
      return gate !== undefined && inj.severity > gate;
    });
  }).length;

  if (safeExerciseCount < 10) {
    result.passed = false;
    result.issues.push({
      check: 3,
      severity: "warning",
      msg: `Your combination of ${conditions.length} conditions significantly limits exercise options (${safeExerciseCount} available). Consider consulting with a PT who can assess your specific situation.`,
    });
  }

  // Check for conflicting recommendations (e.g., one says extension, another says avoid)
  const condPairs = [];
  for (let i = 0; i < conditions.length; i++) {
    for (let j = i + 1; j < conditions.length; j++) {
      condPairs.push([conditions[i], conditions[j]]);
    }
  }

  for (const [a, b] of condPairs) {
    const aDB = findCondition(a.conditionId);
    const bDB = findCondition(b.conditionId);
    if (!aDB || !bDB) continue;
    const aRec = new Set(aDB.recommended || []);
    const bAvoid = new Set(bDB.avoid || []);
    const bRec = new Set(bDB.recommended || []);
    const aAvoid = new Set(aDB.avoid || []);

    // Check if condition A recommends what B avoids
    for (const recId of aRec) {
      const recEx = exById[recId];
      if (!recEx) continue;
      const recName = recEx.name.toLowerCase();
      for (const avoid of bAvoid) {
        if (recName.includes(avoid.toLowerCase())) {
          result.issues.push({
            check: 3,
            severity: "info",
            msg: `"${recEx.name}" recommended for ${aDB.name} but restricted by ${bDB.name} — most restrictive rule applied`,
          });
        }
      }
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════
// CHECK 4: PHASE-APPROPRIATE PARAMETERS
// ═══════════════════════════════════════════════════════════════
export function checkPhaseParameters(plan, profile) {
  const result = { passed: true, issues: [], corrections: [] };
  const phase = profile.phase || 1;
  const { phaseWeek, isDeload } = getTrainingWeek();

  const PHASE_LIMITS = {
    1: { maxSets: 3, repsRange: [12, 20] },
    2: { maxSets: 4, repsRange: [8, 12] },
    3: { maxSets: 5, repsRange: [6, 12] },
  };
  const limits = PHASE_LIMITS[phase] || PHASE_LIMITS[1];

  // Week 1-2 hard cap
  const weekCap = phaseWeek <= 2 ? 2 : phaseWeek <= 4 ? 3 : limits.maxSets;

  for (const ex of plan.all || []) {
    // Check phase eligibility
    if (
      ex.phaseEligibility &&
      !ex.phaseEligibility.includes(phase) &&
      ex.category === "main"
    ) {
      result.passed = false;
      result.issues.push({
        check: 4,
        severity: "critical",
        exercise: ex.name,
        exerciseId: ex.id,
        msg: `Phase ${phase} exercise not eligible (allowed: ${ex.phaseEligibility.join(",")})`,
      });
      result.corrections.push({
        action: "remove",
        removed: ex.id,
        removedName: ex.name,
        reason: `Not eligible for Phase ${phase}`,
      });
    }

    // Check set counts
    const pp = ex.phaseParams?.[String(phase)] || {};
    const sets = parseInt(pp.sets) || 1;
    if (sets > weekCap && ex.category === "main") {
      result.issues.push({
        check: 4,
        severity: "warning",
        exercise: ex.name,
        exerciseId: ex.id,
        msg: `Sets (${sets}) exceeds week ${phaseWeek} cap (${weekCap})`,
      });
      result.corrections.push({
        action: "cap_sets",
        exercise: ex.id,
        exerciseName: ex.name,
        from: sets,
        to: weekCap,
        reason: `Week ${phaseWeek} cap is ${weekCap} sets`,
      });
    }

    // Deload check
    if (isDeload && sets > 1 && ex.category === "main") {
      result.issues.push({
        check: 4,
        severity: "warning",
        exercise: ex.name,
        exerciseId: ex.id,
        msg: `Deload week — sets should be 1, found ${sets}`,
      });
      result.corrections.push({
        action: "cap_sets",
        exercise: ex.id,
        exerciseName: ex.name,
        from: sets,
        to: 1,
        reason: "Deload week — 50% volume",
      });
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════
// CHECK 5: PREREQUISITE CHAIN INTEGRITY
// ═══════════════════════════════════════════════════════════════
export function checkPrerequisites(plan, profile) {
  const result = { passed: true, issues: [], corrections: [] };
  const phase = profile.phase || 1;
  const sessionCount = profile.sessionCount ?? (getSessions()?.length || 0);
  const blockedIds = new Set();

  for (const ex of plan.all || []) {
    const prereqs = ex.prerequisites || {};

    // Min sessions
    if (
      prereqs.minCompletedSessions &&
      sessionCount < prereqs.minCompletedSessions
    ) {
      blockedIds.add(ex.id);
      result.passed = false;
      const sub = findSubstitute(ex, blockedIds, phase);
      result.issues.push({
        check: 5,
        severity: "critical",
        exercise: ex.name,
        exerciseId: ex.id,
        msg: `Requires ${prereqs.minCompletedSessions} sessions (have ${sessionCount})`,
      });
      result.corrections.push({
        action: "substitute",
        removed: ex.id,
        removedName: ex.name,
        replacement: sub?.id || null,
        replacementName: sub?.name || "Regression",
        reason: "Prerequisite sessions not met",
      });
      continue;
    }

    // Min phase
    if (prereqs.minPhase && phase < prereqs.minPhase) {
      blockedIds.add(ex.id);
      result.passed = false;
      const sub = findSubstitute(ex, blockedIds, phase);
      result.issues.push({
        check: 5,
        severity: "critical",
        exercise: ex.name,
        exerciseId: ex.id,
        msg: `Requires Phase ${prereqs.minPhase} (currently Phase ${phase})`,
      });
      result.corrections.push({
        action: "substitute",
        removed: ex.id,
        removedName: ex.name,
        replacement: sub?.id || null,
        replacementName: sub?.name || "Regression",
        reason: `Phase ${prereqs.minPhase} required`,
      });
      continue;
    }

    // Max injury severity
    const maxSev = prereqs.maxInjurySeverity || {};
    const injuries = profile.injuries || getInjuries();
    for (const inj of injuries.filter((i) => i.status !== "resolved")) {
      const gate = maxSev[inj.gateKey];
      if (gate !== undefined && inj.severity > gate) {
        if (!blockedIds.has(ex.id)) {
          blockedIds.add(ex.id);
          result.passed = false;
          const sub = findSubstitute(ex, blockedIds, phase);
          result.issues.push({
            check: 5,
            severity: "critical",
            exercise: ex.name,
            exerciseId: ex.id,
            msg: `${inj.area} severity ${inj.severity} exceeds prerequisite gate ${gate}`,
          });
          result.corrections.push({
            action: "substitute",
            removed: ex.id,
            removedName: ex.name,
            replacement: sub?.id || null,
            replacementName: sub?.name || "Regression",
            reason: `Injury prerequisite failed`,
          });
        }
      }
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════
// CHECK 6: WEEKLY VOLUME LIMITS
// ═══════════════════════════════════════════════════════════════
export function checkVolumeLimit(plan, profile) {
  const result = { passed: true, issues: [], corrections: [] };
  const phase = profile.phase || 1;
  const weeklyVol = getWeeklyVolume();
  const limit = getVolumeLimit(phase);
  const runningVol = { ...weeklyVol };

  // Add PT protocol exercises to volume count
  const ptProtocols = getLocalProtocols();
  for (const proto of ptProtocols) {
    for (const exId of proto.exercises || []) {
      const ex = exById[exId];
      if (ex) {
        const bp = ex.bodyPart || "other";
        runningVol[bp] =
          (runningVol[bp] || 0) + (proto.frequency_per_day || 1);
      }
    }
  }

  // Check each exercise in today's plan
  for (const ex of (plan.main || []).concat(plan.warmup || [])) {
    const bp = ex.bodyPart || "other";
    const pp = ex.phaseParams?.[String(phase)] || {};
    const sets = parseInt(pp.sets) || 1;
    const projectedTotal = (runningVol[bp] || 0) + sets;

    if (projectedTotal > limit.max) {
      result.passed = false;
      result.issues.push({
        check: 6,
        severity: "warning",
        exercise: ex.name,
        exerciseId: ex.id,
        msg: `${bp.replace(/_/g, " ")} would reach ${projectedTotal}/${limit.max} sets — exceeds weekly limit`,
      });
      result.corrections.push({
        action: "substitute_mobility",
        removed: ex.id,
        removedName: ex.name,
        reason: `${bp.replace(/_/g, " ")} at ${projectedTotal}/${limit.max} sets this week — swap to mobility/stretching`,
      });
    } else {
      runningVol[bp] = projectedTotal;
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════
// CHECK 7: MOVEMENT PATTERN COVERAGE
// ═══════════════════════════════════════════════════════════════
export function checkMovementPatterns(plan, profile) {
  const result = { passed: true, issues: [], corrections: [] };
  const required = ["push", "pull", "hinge", "squat", "anti_extension"];
  // anti_extension covers core/anti-movement; also accept anti_rotation, anti_flexion
  const corePatterns = new Set([
    "anti_extension",
    "anti_flexion",
    "anti_rotation",
  ]);

  const planPatterns = new Set();
  for (const ex of plan.all || []) {
    const mp = ex.movementPattern;
    if (mp) planPatterns.add(mp);
    if (corePatterns.has(mp)) planPatterns.add("anti_extension"); // normalize
  }

  const injuries = profile.injuries || getInjuries();
  const active = injuries.filter((i) => i.status !== "resolved");

  for (const pattern of required) {
    if (!planPatterns.has(pattern)) {
      // Check if ALL exercises for this pattern are contraindicated
      const available = exerciseDB.filter(
        (e) =>
          e.movementPattern === pattern &&
          (e.phaseEligibility || []).includes(profile.phase || 1) &&
          e.safetyTier !== "red"
      );
      const allBlocked = available.every((ex) => {
        const sg = ex.contraindications?.severity_gate || {};
        return active.some((inj) => {
          const gate = sg[inj.gateKey];
          return gate !== undefined && inj.severity > gate;
        });
      });

      if (allBlocked && available.length > 0) {
        result.issues.push({
          check: 7,
          severity: "info",
          msg: `${pattern} pattern missing — ALL exercises contraindicated by active conditions. Skipping.`,
        });
      } else if (available.length > 0) {
        result.passed = false;
        const safest = available.find((e) => e.safetyTier === "green") || available[0];
        result.issues.push({
          check: 7,
          severity: "warning",
          msg: `${pattern} pattern missing from today's plan`,
        });
        result.corrections.push({
          action: "add_exercise",
          exerciseId: safest.id,
          exerciseName: safest.name,
          reason: `${pattern} pattern was missing — added safest available option`,
        });
      }
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════
// CHECK 8: CEx CONTINUUM ORDER
// ═══════════════════════════════════════════════════════════════
export function checkCExOrder(plan, profile) {
  const result = { passed: true, issues: [], corrections: [] };
  const all = plan.all || [];
  if (all.length === 0) return result;

  // Expected order: foam_roll → mobility/warmup → main/rehab → cooldown
  const ORDER_MAP = {
    foam_roll: 0,
    mobility: 1,
    warmup: 1,
    rehab: 2,
    main: 3,
    cardio: 3,
    cooldown: 4,
    mckenzie: 1,
  };

  let lastOrder = -1;
  let lastCat = "";
  for (const ex of all) {
    const cat = ex.category || "main";
    const order = ORDER_MAP[cat] ?? 3;
    if (order < lastOrder) {
      result.passed = false;
      result.issues.push({
        check: 8,
        severity: "warning",
        exercise: ex.name,
        exerciseId: ex.id,
        msg: `CEx order violation: ${cat} (${ex.name}) appears after ${lastCat} — should be earlier in session`,
      });
      result.corrections.push({
        action: "reorder",
        exercise: ex.id,
        exerciseName: ex.name,
        reason: `Move ${cat} exercises before ${lastCat} exercises`,
      });
    }
    if (order > lastOrder) {
      lastOrder = order;
      lastCat = cat;
    }
  }

  // Check: static stretches NOT in warmup
  const warmupIdx = all.findIndex(
    (e) => e.category === "warmup" || e.category === "mobility"
  );
  const staticInWarmup = all.findIndex(
    (e, i) =>
      i <= warmupIdx &&
      e.category === "cooldown" &&
      e.movementPattern === "static_stretch"
  );
  if (staticInWarmup >= 0) {
    result.passed = false;
    result.issues.push({
      check: 8,
      severity: "warning",
      exercise: all[staticInWarmup].name,
      msg: "Static stretch found in warm-up — reduces strength output per evidence. Move to cooldown.",
    });
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════
// CHECK 9: PT PROTOCOL COMPLETENESS
// ═══════════════════════════════════════════════════════════════
export function checkPTCompleteness(plan, profile) {
  const result = { passed: true, issues: [], corrections: [] };
  const conditions = profile.conditions || [];
  const assessment = profile.assessment || getAssessment() || {};
  const ptProtocols = profile.ptProtocols || getLocalProtocols();
  const timelines = assessment.painTimelines || {};

  for (const cond of conditions) {
    if (cond.severity < 2) continue; // Only severity ≥2

    const condDB = findCondition(cond.conditionId);
    const hasProtocol = ptProtocols.find(
      (p) => p.condition_key === cond.conditionId
    );

    if (!hasProtocol) {
      result.passed = false;
      result.issues.push({
        check: 9,
        severity: "critical",
        msg: `No PT protocol exists for "${cond.name || cond.conditionId}" (severity ${cond.severity}) — one must be created`,
      });
      result.corrections.push({
        action: "create_protocol",
        conditionKey: cond.conditionId,
        conditionName: cond.name || cond.conditionId,
        reason: `Severity ${cond.severity} requires active PT protocol`,
      });
      continue;
    }

    // Check mandatory daily exercises
    if (condDB?.mandatoryDaily?.length) {
      const protoExIds = new Set(hasProtocol.exercises || []);
      for (const mandId of condDB.mandatoryDaily) {
        if (!protoExIds.has(mandId)) {
          result.issues.push({
            check: 9,
            severity: "warning",
            msg: `Mandatory daily exercise "${mandId}" missing from ${condDB.name} protocol`,
          });
          result.corrections.push({
            action: "add_to_protocol",
            protocolKey: cond.conditionId,
            exerciseId: mandId,
            reason: "Mandatory daily exercise per condition guidelines",
          });
        }
      }
    }

    // Check frequency matches timeline phase
    const tl = timelines[cond.conditionId];
    if (tl?.onset && hasProtocol.frequency_per_day) {
      const expectedFreq =
        tl.onset === "acute"
          ? 4
          : tl.onset === "subacute"
          ? 3
          : 2;
      if (hasProtocol.frequency_per_day < expectedFreq) {
        result.issues.push({
          check: 9,
          severity: "warning",
          msg: `${cond.name || cond.conditionId} is ${tl.onset} — frequency should be ${expectedFreq}x/day (currently ${hasProtocol.frequency_per_day}x)`,
        });
      }
    }

    // Check graduation criteria exist
    if (
      !hasProtocol.graduation_criteria ||
      hasProtocol.graduation_criteria.length === 0
    ) {
      result.issues.push({
        check: 9,
        severity: "warning",
        msg: `PT protocol for ${cond.name || cond.conditionId} has no graduation criteria defined`,
      });
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════
// CHECK 10: MEDICATION INTERACTIONS
// ═══════════════════════════════════════════════════════════════
export function checkMedications(plan, profile) {
  const result = { passed: true, issues: [], corrections: [] };
  const assessment = profile.assessment || getAssessment() || {};
  const meds = assessment.medications || profile.medications || [];

  if (meds.length === 0 || meds.includes("none")) return result;

  for (const ex of plan.all || []) {
    // Blood thinners: no aggressive foam rolling
    if (meds.includes("blood_thinners") && ex.category === "foam_roll") {
      result.issues.push({
        check: 10,
        severity: "warning",
        exercise: ex.name,
        exerciseId: ex.id,
        msg: "Blood thinners — foam rolling intensity must be LIGHT (bruising risk)",
      });
      result.corrections.push({
        action: "modify_intensity",
        exercise: ex.id,
        exerciseName: ex.name,
        modification: "Cap foam rolling at LIGHT pressure",
        reason: "Blood thinner medication",
      });
    }

    // Opioids: no unstable surfaces
    if (
      meds.includes("opioids") &&
      (ex.name.toLowerCase().includes("bosu") ||
        ex.name.toLowerCase().includes("single-leg") ||
        ex.name.toLowerCase().includes("balance") ||
        ex.tags?.includes("unstable_surface"))
    ) {
      result.passed = false;
      result.issues.push({
        check: 10,
        severity: "critical",
        exercise: ex.name,
        exerciseId: ex.id,
        msg: "Opioid medication — unstable surface/balance exercise unsafe (coordination impairment)",
      });
      result.corrections.push({
        action: "substitute",
        removed: ex.id,
        removedName: ex.name,
        reason:
          "Opioid use — balance exercises require stable surface only",
      });
    }
  }

  // Beta-blockers: flag any HR-based intensity
  if (meds.includes("bp_meds")) {
    const hrBased = (plan.all || []).filter(
      (ex) =>
        (ex.phaseParams?.[String(profile.phase || 1)]?.intensity || "")
          .toLowerCase()
          .includes("hr") ||
        (ex.phaseParams?.[String(profile.phase || 1)]?.intensity || "")
          .toLowerCase()
          .includes("heart rate")
    );
    if (hrBased.length > 0) {
      result.issues.push({
        check: 10,
        severity: "warning",
        msg: `Beta-blocker/BP medication — ${hrBased.length} exercise(s) use HR-based intensity. Switched to RPE only.`,
      });
      for (const ex of hrBased) {
        result.corrections.push({
          action: "modify_intensity",
          exercise: ex.id,
          exerciseName: ex.name,
          modification: "Use RPE exclusively — HR unreliable with beta-blockers",
          reason: "Blood pressure medication",
        });
      }
    }
  }

  // Steroids: ensure weight-bearing exercises present
  if (meds.includes("steroids")) {
    const weightBearing = (plan.main || []).filter(
      (ex) =>
        ex.movementPattern === "squat" ||
        ex.movementPattern === "hinge" ||
        ex.movementPattern === "lunge"
    );
    if (weightBearing.length === 0) {
      result.issues.push({
        check: 10,
        severity: "warning",
        msg: "Long-term steroid use — weight-bearing exercises recommended for bone density but none found in plan",
      });
      const safeLunge = exerciseDB.find(
        (e) =>
          e.movementPattern === "squat" &&
          e.safetyTier === "green" &&
          (e.phaseEligibility || []).includes(profile.phase || 1)
      );
      if (safeLunge) {
        result.corrections.push({
          action: "add_exercise",
          exerciseId: safeLunge.id,
          exerciseName: safeLunge.name,
          reason:
            "Steroid use — weight-bearing exercise added for bone density",
        });
      }
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════
// CHECK 11: RED FLAG MONITORING
// ═══════════════════════════════════════════════════════════════
export function checkRedFlags(plan, profile) {
  const result = { passed: true, issues: [], corrections: [] };
  const sessions = profile.sessions || getSessions() || [];
  const assessment = profile.assessment || getAssessment() || {};

  // Check assessment red flags
  const redFlags = assessment.redFlags || profile.redFlags || [];
  if (redFlags.length > 0 && !assessment.redFlagCleared && !profile.redFlagCleared) {
    result.passed = false;
    result.issues.push({
      check: 11,
      severity: "blocker",
      msg: `${redFlags.length} red flag symptom(s) reported without medical clearance — PLAN BLOCKED`,
    });
    result.corrections.push({
      action: "block_plan",
      reason:
        "Red flag symptoms require medical evaluation before starting exercise program",
    });
    return result;
  }

  // Pain 7+ for 3 consecutive sessions → refer out
  if (sessions.length >= 3) {
    const last3 = sessions.slice(-3);
    const allHighPain = last3.every(
      (s) => (s.reflection?.pain || s.pain_rating || 0) >= 7
    );
    if (allHighPain) {
      result.passed = false;
      result.issues.push({
        check: 11,
        severity: "blocker",
        msg: "Pain 7+/10 for 3 consecutive sessions — REFER OUT. See your PT or doctor.",
      });
      result.corrections.push({
        action: "reduce_to_floor",
        reason:
          "Persistent high pain — reduce to Floor Session (minimum viable) until professional clearance",
      });
    }
  }

  // Pain-flagged exercises for same body area 3+ times
  const painFlags = {};
  for (const s of sessions) {
    for (const pf of s.painFlagged || s.pain_flagged_exercises || []) {
      const bp = typeof pf === "string" ? pf : pf.bodyPart || pf.area || "unknown";
      painFlags[bp] = (painFlags[bp] || 0) + 1;
    }
  }
  for (const [area, count] of Object.entries(painFlags)) {
    if (count >= 3) {
      result.issues.push({
        check: 11,
        severity: "warning",
        msg: `${area} exercises flagged for pain ${count} times — suggest PT evaluation for this area`,
      });
    }
  }

  // Worsening functional scores over 4 weeks
  const funcLimitations = assessment.functionalLimitations || {};
  const limitedCount = Object.values(funcLimitations).filter(
    (v) => v === "cannot"
  ).length;
  if (limitedCount >= 5) {
    result.issues.push({
      check: 11,
      severity: "warning",
      msg: `${limitedCount} functional activities rated "cannot do" — monitor for worsening. Reassess in 4 weeks.`,
    });
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════
// CHECK 12: PT + TRAINING BLEND VERIFICATION
// ═══════════════════════════════════════════════════════════════
export function checkPTBlend(plan, profile) {
  const result = { passed: true, issues: [], corrections: [] };
  const assessment = profile.assessment || getAssessment() || {};
  const conditions = profile.conditions || assessment.conditions || [];
  const timelines = assessment.painTimelines || {};
  const injuries = profile.injuries || getInjuries();

  for (const cond of conditions) {
    const tl = timelines[cond.conditionId];
    if (!tl?.onset) continue;

    // Map condition to body area for exercise filtering
    const condArea = cond.bodyArea || cond.name || "";
    const bodyPartKeys = [];
    const area = condArea.toLowerCase();
    if (area.includes("back") || area.includes("lumbar") || area.includes("spine"))
      bodyPartKeys.push("back", "lower_back", "core");
    if (area.includes("knee")) bodyPartKeys.push("legs", "quads", "hamstrings");
    if (area.includes("shoulder")) bodyPartKeys.push("shoulders", "chest");
    if (area.includes("hip")) bodyPartKeys.push("hips", "glutes");
    if (area.includes("ankle")) bodyPartKeys.push("calves", "feet");

    if (bodyPartKeys.length === 0) continue;

    if (tl.onset === "acute") {
      // ACUTE: PT dominates, main workout EXCLUDES loaded exercises for that area
      const loadedInArea = (plan.main || []).filter((ex) =>
        bodyPartKeys.includes(ex.bodyPart)
      );
      if (loadedInArea.length > 0) {
        result.passed = false;
        for (const ex of loadedInArea) {
          result.issues.push({
            check: 12,
            severity: "critical",
            exercise: ex.name,
            exerciseId: ex.id,
            msg: `${condArea} is in ACUTE phase — loaded exercise "${ex.name}" must be excluded. PT dominates this body area.`,
          });
          result.corrections.push({
            action: "remove",
            removed: ex.id,
            removedName: ex.name,
            reason: `Acute ${condArea} condition — PT exercises only for this area`,
          });
        }
      }
    } else if (tl.onset === "subacute") {
      // SUBACUTE: light loading only
      const heavyInArea = (plan.main || []).filter(
        (ex) =>
          bodyPartKeys.includes(ex.bodyPart) &&
          ex.difficultyLevel >= 3
      );
      if (heavyInArea.length > 0) {
        for (const ex of heavyInArea) {
          result.issues.push({
            check: 12,
            severity: "warning",
            exercise: ex.name,
            exerciseId: ex.id,
            msg: `${condArea} is SUBACUTE — "${ex.name}" (difficulty ${ex.difficultyLevel}) may be too intense. Light loading only.`,
          });
        }
      }
    }
    // CHRONIC: full loading within severity gates — no additional restrictions
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════
// CHECK 13: PLYOMETRIC READINESS
// Phase 3+ required, no acute joint conditions, landing mechanics
// ═══════════════════════════════════════════════════════════════
export function checkPlyometricReadiness(plan, profile) {
  const result = { passed: true, issues: [], corrections: [] };
  const phase = profile.phase || 1;
  const injuries = profile.injuries || getInjuries();
  const active = injuries.filter((i) => i.status !== "resolved");
  let capabilities;
  try { capabilities = JSON.parse(localStorage.getItem("apex_baseline_capabilities")) || []; } catch { capabilities = []; }

  for (const ex of plan.all || []) {
    const isPlyometric = (ex.capabilityTag || []).includes("plyometric") ||
                         (ex.tags || []).includes("plyometric") || ex._isPower;
    if (!isPlyometric) continue;

    // Phase gate
    if (phase < 3) {
      result.passed = false;
      result.issues.push({ check: 13, severity: "critical", exercise: ex.name, exerciseId: ex.id, msg: `Plyometric "${ex.name}" requires Phase 3+ (currently Phase ${phase})` });
      result.corrections.push({ action: "remove", removed: ex.id, removedName: ex.name, reason: `Phase ${phase} < 3 — plyometrics not yet safe` });
      continue;
    }

    // Joint condition blocks for jump exercises
    const isJump = (ex.tags || []).includes("jump") || (ex.movementPattern || "") === "plyometric" ||
                   (ex.name || "").toLowerCase().includes("jump");
    if (isJump) {
      for (const inj of active) {
        const area = (inj.area || "").toLowerCase();
        const sev = inj.severity || 0;
        if ((area.includes("knee") && sev >= 2) || (area.includes("ankle") && sev >= 2) ||
            (area.includes("back") && sev >= 3) || (inj.type || "").toLowerCase().includes("replacement") ||
            (inj.type || "").toLowerCase().includes("stress fracture")) {
          result.passed = false;
          result.issues.push({ check: 13, severity: "critical", exercise: ex.name, exerciseId: ex.id, msg: `Jump exercise blocked: ${inj.area} severity ${sev}` });
          result.corrections.push({ action: "remove", removed: ex.id, removedName: ex.name, reason: `${inj.area} (sev ${sev}) prohibits jump exercises` });
          break;
        }
      }
    }
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════
// CHECK 14: POWER EXERCISE VOLUME CAP
// Max 3 power/plyometric exercises per session (NSCA CNS fatigue)
// ═══════════════════════════════════════════════════════════════
export function checkPowerVolumeCap(plan) {
  const result = { passed: true, issues: [], corrections: [] };
  const powerExercises = (plan.all || []).filter((e) =>
    (e.capabilityTag || []).includes("power") ||
    (e.capabilityTag || []).includes("plyometric") ||
    (e.tags || []).includes("plyometric") ||
    (e.tags || []).includes("power") ||
    e._isPower
  );

  if (powerExercises.length > 3) {
    result.passed = false;
    const excess = powerExercises.slice(3);
    for (const ex of excess) {
      result.issues.push({ check: 14, severity: "warning", exercise: ex.name, exerciseId: ex.id, msg: `${powerExercises.length} power exercises exceed NSCA max of 3/session — CNS fatigue risk` });
      result.corrections.push({ action: "remove", removed: ex.id, removedName: ex.name, reason: "Power volume cap exceeded (max 3 per session per NSCA)" });
    }
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════
// CHECK 15: POWER SESSION RECOVERY
// Min 48 hours between sessions with plyometric/power (NSCA)
// ═══════════════════════════════════════════════════════════════
export function checkPowerRecovery(plan, profile) {
  const result = { passed: true, issues: [], corrections: [] };
  const hasPowerInPlan = (plan.all || []).some((e) =>
    (e.capabilityTag || []).includes("power") ||
    (e.capabilityTag || []).includes("plyometric") ||
    (e.tags || []).includes("plyometric") ||
    e._isPower
  );

  if (!hasPowerInPlan) return result;

  const sessions = profile.sessions || getSessions() || [];
  for (let i = sessions.length - 1; i >= 0; i--) {
    const s = sessions[i];
    const hasPower = (s.exercises_completed || []).some((ec) => {
      const dbEx = exById[ec.exercise_id];
      return dbEx && (
        (dbEx.capabilityTag || []).includes("power") ||
        (dbEx.capabilityTag || []).includes("plyometric") ||
        (dbEx.tags || []).includes("plyometric") ||
        (dbEx.tags || []).includes("power")
      );
    });
    if (hasPower) {
      const hoursSince = (Date.now() - new Date(s.date).getTime()) / 3600000;
      if (hoursSince < 48) {
        result.passed = false;
        result.issues.push({ check: 15, severity: "warning", msg: `Only ${Math.round(hoursSince)}h since last power session — NSCA recommends 48h minimum` });
        // Don't remove exercises, just flag — user can override
      }
      break;
    }
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════
// RUN ALL CHECKS — master verification function
// ═══════════════════════════════════════════════════════════════

const CHECK_NAMES = [
  "Contraindication Cross-Check",
  "Directional Preference Compliance",
  "Multiple Condition Intersection",
  "Phase-Appropriate Parameters",
  "Prerequisite Chain Integrity",
  "Weekly Volume Limits",
  "Movement Pattern Coverage",
  "CEx Continuum Order",
  "PT Protocol Completeness",
  "Medication Interactions",
  "Red Flag Monitoring",
  "PT + Training Blend",
  "Plyometric Readiness",
  "Power Volume Cap",
  "Power Session Recovery",
];

const CHECK_FUNCTIONS = [
  checkContraindications,
  checkDirectionalPreference,
  checkMultipleConditions,
  checkPhaseParameters,
  checkPrerequisites,
  checkVolumeLimit,
  checkMovementPatterns,
  checkCExOrder,
  checkPTCompleteness,
  checkMedications,
  checkRedFlags,
  checkPTBlend,
  checkPlyometricReadiness,
  checkPowerVolumeCap,
  checkPowerRecovery,
];

export function runAllChecks(plan, profile = {}) {
  // Build profile from available data if not fully provided
  const assessment = profile.assessment || getAssessment() || {};
  const fullProfile = {
    phase: profile.phase || assessment.startingPhase || 1,
    injuries: profile.injuries || getInjuries(),
    conditions: profile.conditions || assessment.conditions || [],
    assessment,
    medications: profile.medications || assessment.medications || [],
    redFlags: profile.redFlags || assessment.redFlags || [],
    redFlagCleared: profile.redFlagCleared ?? assessment.redFlagCleared,
    sessionCount: profile.sessionCount ?? (getSessions()?.length || 0),
    sessions: profile.sessions || getSessions() || [],
    ptProtocols: profile.ptProtocols || getLocalProtocols(),
    ...profile,
  };

  const report = {
    timestamp: new Date().toISOString(),
    totalChecks: CHECK_FUNCTIONS.length,
    passed: 0,
    failed: 0,
    blocked: false,
    checks: [],
    allIssues: [],
    allCorrections: [],
    autoApplied: [],
  };

  for (let i = 0; i < CHECK_FUNCTIONS.length; i++) {
    try {
      const checkResult = CHECK_FUNCTIONS[i](plan, fullProfile);
      const entry = {
        id: i + 1,
        name: CHECK_NAMES[i],
        passed: checkResult.passed,
        issueCount: checkResult.issues.length,
        correctionCount: checkResult.corrections.length,
        issues: checkResult.issues,
        corrections: checkResult.corrections,
      };
      report.checks.push(entry);
      if (checkResult.passed) {
        report.passed++;
      } else {
        report.failed++;
      }
      report.allIssues.push(...checkResult.issues);
      report.allCorrections.push(...checkResult.corrections);

      // Check for blockers
      if (checkResult.corrections.some((c) => c.action === "block_plan")) {
        report.blocked = true;
      }
    } catch (err) {
      report.checks.push({
        id: i + 1,
        name: CHECK_NAMES[i],
        passed: false,
        issueCount: 1,
        correctionCount: 0,
        issues: [
          {
            check: i + 1,
            severity: "error",
            msg: `Check threw error: ${err.message}`,
          },
        ],
        corrections: [],
      });
      report.failed++;
    }
  }

  return report;
}

// ═══════════════════════════════════════════════════════════════
// APPLY CORRECTIONS — auto-fix what can be fixed
// ═══════════════════════════════════════════════════════════════

export function applyCorrections(plan, report) {
  if (!report.allCorrections.length) return { plan, applied: [] };

  const applied = [];
  let modified = {
    warmup: [...(plan.warmup || [])],
    main: [...(plan.main || [])],
    cooldown: [...(plan.cooldown || [])],
  };

  for (const corr of report.allCorrections) {
    if (corr.action === "block_plan") {
      // Cannot auto-fix — plan is blocked
      applied.push({ ...corr, success: false, note: "Plan blocked — requires user action" });
      continue;
    }

    if (corr.action === "substitute" && corr.removed && corr.replacement) {
      const replacement = exById[corr.replacement];
      if (!replacement) continue;

      for (const section of ["warmup", "main", "cooldown"]) {
        const idx = modified[section].findIndex((e) => e.id === corr.removed);
        if (idx >= 0) {
          modified[section][idx] = {
            ...replacement,
            _swappedFor: corr.removedName,
            _swapReason: `Safety: ${corr.reason}`,
          };
          applied.push({ ...corr, success: true });
          break;
        }
      }
    } else if (corr.action === "remove" && corr.removed) {
      for (const section of ["warmup", "main", "cooldown"]) {
        const before = modified[section].length;
        modified[section] = modified[section].filter(
          (e) => e.id !== corr.removed
        );
        if (modified[section].length < before) {
          applied.push({ ...corr, success: true });
          break;
        }
      }
    } else if (corr.action === "add_exercise" && corr.exerciseId) {
      const ex = exById[corr.exerciseId];
      if (ex && !modified.main.find((e) => e.id === ex.id)) {
        modified.main.push({
          ...ex,
          _reason: corr.reason,
        });
        applied.push({ ...corr, success: true });
      }
    }
  }

  const newPlan = {
    ...plan,
    warmup: modified.warmup,
    main: modified.main,
    cooldown: modified.cooldown,
    all: [...modified.warmup, ...modified.main, ...modified.cooldown],
    _safetyApplied: applied,
  };

  return { plan: newPlan, applied };
}

// ═══════════════════════════════════════════════════════════════
// VERIFY AND FIX — run checks + auto-apply corrections
// ═══════════════════════════════════════════════════════════════

export function verifyAndFix(plan, profile = {}) {
  const report = runAllChecks(plan, profile);

  if (report.blocked) {
    return { plan, report, blocked: true, applied: [] };
  }

  if (report.failed > 0) {
    const { plan: fixedPlan, applied } = applyCorrections(plan, report);
    // Re-run checks on fixed plan to verify
    const recheck = runAllChecks(fixedPlan, profile);
    return {
      plan: fixedPlan,
      report: recheck,
      blocked: false,
      applied,
      originalReport: report,
    };
  }

  return { plan, report, blocked: false, applied: [] };
}
