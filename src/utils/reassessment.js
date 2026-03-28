// ═══════════════════════════════════════════════════════════════
// APEX Coach — Reassessment Engine
// Handles data preservation, capability tags, phase regression,
// 12 edge cases for safe reassessment flow
// ═══════════════════════════════════════════════════════════════

import exerciseDB from "../data/exercises.json";
import { getInjuries } from "./injuries.js";
import { getSessions } from "./storage.js";
import { getAssessment, saveAssessment } from "../components/Onboarding.jsx";
import { generateProtocols, saveLocalProtocols, getLocalProtocols } from "../components/PTSystem.jsx";
import { supabase } from "./supabase.js";

const LS_CAPS = "apex_capability_tags";
const LS_PAUSED = "apex_paused_capabilities";
const exById = Object.fromEntries(exerciseDB.map(e => [e.id, e]));

// ═══════════════════════════════════════════════════════════════
// 1. SNAPSHOT — capture pre-reassessment state
// ═══════════════════════════════════════════════════════════════

export function capturePreReassessmentSnapshot() {
  const old = getAssessment();
  if (!old) return null;
  return {
    conditions: old.conditions || [],
    goals: old.goals || {},
    preferences: old.preferences || {},
    medications: old.medications || [],
    fitnessLevel: old.fitnessLevel,
    startingPhase: old.startingPhase || 1,
    rom: old.rom || {},
    compensations: old.compensations || [],
    capturedAt: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════
// 2. COMPARE — diff old vs new assessment
// ═══════════════════════════════════════════════════════════════

export function compareAssessments(oldSnap, newAssessment) {
  const diff = {
    conditionsAdded: [],
    conditionsRemoved: [],
    conditionsChanged: [],
    goalsChanged: false,
    oldGoals: oldSnap?.goals || {},
    newGoals: newAssessment?.goals || {},
    frequencyChanged: false,
    oldFreq: oldSnap?.preferences?.daysPerWeek,
    newFreq: newAssessment?.preferences?.daysPerWeek,
    sessionTimeChanged: false,
    oldTime: oldSnap?.preferences?.sessionTime,
    newTime: newAssessment?.preferences?.sessionTime,
    equipmentChanged: false,
    medsChanged: false,
    oldMeds: oldSnap?.medications || [],
    newMeds: newAssessment?.medications || [],
    exercisesNewlyBlocked: [],
    exercisesNewlyUnlocked: [],
    capsPaused: [],
    phaseChange: null,
    ptProtocolChanges: [],
    splitChanged: false,
  };

  // Conditions diff
  const oldCondMap = Object.fromEntries((oldSnap?.conditions || []).map(c => [c.conditionId, c]));
  const newCondMap = Object.fromEntries((newAssessment?.conditions || []).map(c => [c.conditionId, c]));

  for (const [id, nc] of Object.entries(newCondMap)) {
    if (!oldCondMap[id]) diff.conditionsAdded.push(nc);
    else if (oldCondMap[id].severity !== nc.severity) {
      diff.conditionsChanged.push({ ...nc, oldSeverity: oldCondMap[id].severity, newSeverity: nc.severity });
    }
  }
  for (const [id, oc] of Object.entries(oldCondMap)) {
    if (!newCondMap[id]) diff.conditionsRemoved.push(oc);
  }

  // Goals diff
  diff.goalsChanged = JSON.stringify(oldSnap?.goals) !== JSON.stringify(newAssessment?.goals);

  // Frequency
  if (oldSnap?.preferences?.daysPerWeek !== newAssessment?.preferences?.daysPerWeek) diff.frequencyChanged = true;

  // Session time
  if (oldSnap?.preferences?.sessionTime !== newAssessment?.preferences?.sessionTime) diff.sessionTimeChanged = true;

  // Equipment
  const oldEq = new Set(oldSnap?.preferences?.homeEquipment || []);
  const newEq = new Set(newAssessment?.preferences?.homeEquipment || []);
  diff.equipmentChanged = oldEq.size !== newEq.size || [...oldEq].some(e => !newEq.has(e));

  // Medications
  diff.medsChanged = JSON.stringify(diff.oldMeds.sort()) !== JSON.stringify(diff.newMeds.sort());

  // Exercise availability changes
  const injuries = (newAssessment?.conditions || []).map(c => ({
    gateKey: c.conditionId || c.bodyArea?.toLowerCase().replace(/\s+/g, "_"),
    severity: c.severity,
  }));
  const oldInjuries = (oldSnap?.conditions || []).map(c => ({
    gateKey: c.conditionId || c.bodyArea?.toLowerCase().replace(/\s+/g, "_"),
    severity: c.severity,
  }));

  for (const ex of exerciseDB) {
    const sg = ex.contraindications?.severity_gate || {};
    const wasBlocked = oldInjuries.some(inj => sg[inj.gateKey] !== undefined && inj.severity > sg[inj.gateKey]);
    const nowBlocked = injuries.some(inj => sg[inj.gateKey] !== undefined && inj.severity > sg[inj.gateKey]);
    if (!wasBlocked && nowBlocked) diff.exercisesNewlyBlocked.push({ id: ex.id, name: ex.name });
    if (wasBlocked && !nowBlocked) diff.exercisesNewlyUnlocked.push({ id: ex.id, name: ex.name });
  }

  return diff;
}

// ═══════════════════════════════════════════════════════════════
// 3. CAPABILITY TAG MANAGEMENT (Edge Case 1)
// ═══════════════════════════════════════════════════════════════

const CAPABILITY_INJURY_GATES = {
  overhead_cleared: { gateKeys: ["shoulder"], maxSeverity: 1 },
  heavy_loading_ready: { gateKeys: ["lower_back"], maxSeverity: 2 },
  plyometric_ready: { gateKeys: ["knee"], maxSeverity: 1 },
  barbell_competent: { gateKeys: ["lower_back", "shoulder"], maxSeverity: 2 },
  full_rom_restored: { gateKeys: ["knee", "shoulder", "lower_back"], maxSeverity: 1 },
};

export function getCapabilityTags() {
  try { return JSON.parse(localStorage.getItem(LS_CAPS) || "[]"); } catch { return []; }
}

export function getPausedCapabilities() {
  try { return JSON.parse(localStorage.getItem(LS_PAUSED) || "[]"); } catch { return []; }
}

export function reevaluateCapabilities(newConditions) {
  const caps = getCapabilityTags();
  const paused = getPausedCapabilities();
  const revoked = [];
  const remaining = [];

  const condMap = {};
  for (const c of (newConditions || [])) {
    const key = c.conditionId || c.bodyArea?.toLowerCase().replace(/\s+/g, "_");
    condMap[key] = c.severity;
  }

  for (const cap of caps) {
    const gate = CAPABILITY_INJURY_GATES[cap.id];
    if (!gate) { remaining.push(cap); continue; }

    let shouldRevoke = false;
    for (const gk of gate.gateKeys) {
      if (condMap[gk] !== undefined && condMap[gk] > gate.maxSeverity) {
        shouldRevoke = true;
        break;
      }
    }

    if (shouldRevoke) {
      revoked.push({ ...cap, revokedAt: new Date().toISOString(), reason: "New condition severity exceeds gate" });
    } else {
      remaining.push(cap);
    }
  }

  // Move revoked to paused (not deleted)
  const newPaused = [...paused.filter(p => !revoked.find(r => r.id === p.id)), ...revoked];

  try {
    localStorage.setItem(LS_CAPS, JSON.stringify(remaining));
    localStorage.setItem(LS_PAUSED, JSON.stringify(newPaused));
  } catch {}

  return { remaining, revoked, paused: newPaused };
}

// ═══════════════════════════════════════════════════════════════
// 4. PHASE REGRESSION CHECK (Edge Case 2)
// ═══════════════════════════════════════════════════════════════

export function checkPhaseRegression(currentPhase, newConditions) {
  let targetPhase = currentPhase;
  const reasons = [];

  for (const c of (newConditions || [])) {
    if (c.severity >= 4 && currentPhase > 1) {
      targetPhase = 1;
      reasons.push(`${c.name || c.conditionId} severity ${c.severity} requires Phase 1 for safety`);
    }
    if (c.severity >= 3 && currentPhase > 2) {
      targetPhase = Math.min(targetPhase, 2);
      reasons.push(`${c.name || c.conditionId} limits training to Phase 2 or lower`);
    }
  }

  // Check if conditions only improved
  const conditionsOnlyBetter = newConditions.every(c => c.severity <= 2);
  if (conditionsOnlyBetter && reasons.length === 0) {
    return { regressed: false, newPhase: currentPhase, reasons: [] };
  }

  return {
    regressed: targetPhase < currentPhase,
    newPhase: targetPhase,
    oldPhase: currentPhase,
    reasons,
  };
}

// ═══════════════════════════════════════════════════════════════
// 5. FAVORITE EXERCISE HANDLING (Edge Case 4)
// ═══════════════════════════════════════════════════════════════

export function reconcileFavorites(oldFavs, newFavs, newConditions) {
  const merged = [...new Set([...(oldFavs || []), ...(newFavs || [])])];
  const active = [];
  const paused = [];

  const injuries = (newConditions || []).map(c => ({
    gateKey: c.conditionId || c.bodyArea?.toLowerCase().replace(/\s+/g, "_"),
    severity: c.severity,
  }));

  for (const favId of merged) {
    const ex = exById[favId];
    if (!ex) { active.push(favId); continue; }

    const sg = ex.contraindications?.severity_gate || {};
    let blocked = false;
    let reason = "";
    for (const inj of injuries) {
      if (sg[inj.gateKey] !== undefined && inj.severity > sg[inj.gateKey]) {
        blocked = true;
        reason = `Blocked by ${inj.gateKey} severity ${inj.severity}`;
        break;
      }
    }

    if (blocked) {
      paused.push({ id: favId, name: ex.name, reason, pausedAt: new Date().toISOString() });
    } else {
      active.push(favId);
    }
  }

  return { active, paused };
}

// ═══════════════════════════════════════════════════════════════
// 6. PT PROTOCOL RECONCILIATION (preserves progress)
// ═══════════════════════════════════════════════════════════════

export function reconcileProtocols(oldProtocols, newAssessment) {
  const newProtocols = generateProtocols(newAssessment);
  const oldMap = Object.fromEntries((oldProtocols || []).map(p => [p.condition_key, p]));
  const changes = [];

  for (const np of newProtocols) {
    const old = oldMap[np.condition_key];
    if (old) {
      // Condition existed before — preserve progress
      const oldCond = (getAssessment()?.conditions || []).find(c => c.conditionId === np.condition_key);
      const newCond = (newAssessment.conditions || []).find(c => c.conditionId === np.condition_key);
      const oldSev = oldCond?.severity || 0;
      const newSev = newCond?.severity || 0;

      if (newSev > oldSev) {
        // Severity increased — regress phase by 1
        np.current_phase = Math.max(1, old.current_phase - 1);
        changes.push({ key: np.condition_key, action: "regressed", from: old.current_phase, to: np.current_phase });
      } else {
        // Same or better — keep current phase and progress
        np.current_phase = old.current_phase;
        np.graduation_criteria = old.graduation_criteria; // preserve met criteria
        changes.push({ key: np.condition_key, action: "preserved", phase: np.current_phase });
      }
    } else {
      changes.push({ key: np.condition_key, action: "new" });
    }
  }

  return { protocols: newProtocols, changes };
}

// ═══════════════════════════════════════════════════════════════
// 7. MEDICATION IMPACT CHECK (Edge Case 9)
// ═══════════════════════════════════════════════════════════════

export function checkMedicationImpacts(oldMeds, newMeds) {
  const impacts = [];
  const oldSet = new Set((oldMeds || []).map(m => m.toLowerCase()));
  const newSet = new Set((newMeds || []).map(m => m.toLowerCase()));

  const betaBlockerTerms = ["metoprolol", "atenolol", "propranolol", "beta-blocker", "beta blocker", "bisoprolol", "carvedilol"];
  const bloodThinnerTerms = ["warfarin", "coumadin", "blood thinner", "aspirin", "eliquis", "xarelto", "heparin"];

  const hadBeta = [...oldSet].some(m => betaBlockerTerms.some(t => m.includes(t)));
  const hasBeta = [...newSet].some(m => betaBlockerTerms.some(t => m.includes(t)));
  const hadThinner = [...oldSet].some(m => bloodThinnerTerms.some(t => m.includes(t)));
  const hasThinner = [...newSet].some(m => bloodThinnerTerms.some(t => m.includes(t)));

  if (!hadBeta && hasBeta) {
    impacts.push({ type: "beta_blocker_added", message: "Heart rate zones switched to RPE-based due to beta-blocker medication." });
  }
  if (hadBeta && !hasBeta) {
    impacts.push({ type: "beta_blocker_removed", message: "Heart rate zones re-enabled — beta-blocker removed." });
  }
  if (!hadThinner && hasThinner) {
    impacts.push({ type: "blood_thinner_added", message: "Foam rolling intensity capped at LIGHT due to blood thinner medication." });
  }
  if (hadThinner && !hasThinner) {
    impacts.push({ type: "blood_thinner_removed", message: "Full foam rolling intensity restored." });
  }

  return impacts;
}

// ═══════════════════════════════════════════════════════════════
// 8. EXERCISE POOL CHECK (Edge Case 8)
// ═══════════════════════════════════════════════════════════════

export function checkExercisePool(newConditions, phase = 1) {
  const injuries = (newConditions || []).map(c => ({
    gateKey: c.conditionId || c.bodyArea?.toLowerCase().replace(/\s+/g, "_"),
    severity: c.severity,
  }));

  let safeCount = 0;
  for (const ex of exerciseDB) {
    if (!(ex.phaseEligibility || []).includes(phase)) continue;
    if (ex.safetyTier === "red") continue;
    const sg = ex.contraindications?.severity_gate || {};
    let blocked = false;
    for (const inj of injuries) {
      if (sg[inj.gateKey] !== undefined && inj.severity > sg[inj.gateKey]) { blocked = true; break; }
    }
    if (!blocked) safeCount++;
  }

  return {
    safeCount,
    isRestricted: safeCount < 15,
    message: safeCount < 15
      ? `Your conditions limit available exercises to ${safeCount}. Consider consulting a PT to expand your safe exercise list.`
      : null,
  };
}

// ═══════════════════════════════════════════════════════════════
// 9. GOAL + CONDITION CONFLICT RESOLUTION (Edge Case 6)
// ═══════════════════════════════════════════════════════════════

export function resolveGoalConflicts(goals, conditions) {
  const conflicts = [];
  const condMap = {};
  for (const c of (conditions || [])) {
    const key = c.conditionId || c.bodyArea?.toLowerCase().replace(/\s+/g, "_");
    condMap[key] = c;
  }

  for (const [muscle, types] of Object.entries(goals || {})) {
    for (const type of types) {
      // Chest goals + shoulder condition
      if (muscle === "chest" && condMap.shoulder && condMap.shoulder.severity >= 2) {
        conflicts.push({
          muscle, type,
          condition: "Shoulder",
          adapted: `Building ${muscle} with shoulder-safe pressing only. Landmine press and cable fly instead of bench press. Slower progression but same destination.`,
        });
      }
      // Leg goals + knee condition
      if (["legs", "glutes"].includes(muscle) && condMap.knee && condMap.knee.severity >= 3) {
        conflicts.push({
          muscle, type,
          condition: "Knee",
          adapted: `${muscle} ${type} starting with isometric and machine work to protect your knee. Free weight exercises unlock when knee severity drops to 2.`,
        });
      }
      // Back goals + lower back condition
      if (muscle === "back" && condMap.lower_back && condMap.lower_back.severity >= 3) {
        conflicts.push({
          muscle, type,
          condition: "Lower Back",
          adapted: `${muscle} ${type} using horizontal pulling only (rows, face pulls). Vertical pulling and deadlifts unlock as back severity improves.`,
        });
      }
    }
  }

  return conflicts;
}

// ═══════════════════════════════════════════════════════════════
// 10. MASTER REASSESSMENT HANDLER
// ═══════════════════════════════════════════════════════════════

export function processReassessment(oldSnapshot, newAssessment) {
  // Compare
  const diff = compareAssessments(oldSnapshot, newAssessment);

  // Capability tags (Edge Case 1)
  const caps = reevaluateCapabilities(newAssessment.conditions);
  diff.capsPaused = caps.revoked;

  // Phase regression (Edge Case 2)
  const currentPhase = oldSnapshot?.startingPhase || 1;
  const phaseCheck = checkPhaseRegression(currentPhase, newAssessment.conditions);
  diff.phaseChange = phaseCheck.regressed ? phaseCheck : null;

  // Favorites reconciliation (Edge Case 4)
  const oldFavs = oldSnapshot?.preferences?.favorites || [];
  const newFavs = newAssessment?.preferences?.favorites || [];
  const favResult = reconcileFavorites(oldFavs, newFavs, newAssessment.conditions);

  // Merge favorites into new assessment
  newAssessment.preferences.favorites = favResult.active;
  diff.pausedFavorites = favResult.paused;

  // PT protocol reconciliation
  const oldProtocols = getLocalProtocols();
  const ptResult = reconcileProtocols(oldProtocols, newAssessment);
  diff.ptProtocolChanges = ptResult.changes;

  // Save reconciled protocols
  saveLocalProtocols(ptResult.protocols);

  // Medication impacts (Edge Case 9)
  diff.medicationImpacts = checkMedicationImpacts(oldSnapshot?.medications, newAssessment.medications);

  // Exercise pool check (Edge Case 8)
  const poolPhase = phaseCheck.regressed ? phaseCheck.newPhase : currentPhase;
  diff.exercisePool = checkExercisePool(newAssessment.conditions, poolPhase);

  // Goal conflicts (Edge Case 6)
  diff.goalConflicts = resolveGoalConflicts(newAssessment.goals, newAssessment.conditions);

  // Save assessment (preserving completedAt for history)
  saveAssessment(newAssessment);

  // Fire-and-forget Supabase log
  supabase.from("reassessment_logs").insert({
    conditions_added: diff.conditionsAdded.length,
    conditions_removed: diff.conditionsRemoved.length,
    exercises_blocked: diff.exercisesNewlyBlocked.length,
    exercises_unlocked: diff.exercisesNewlyUnlocked.length,
    caps_paused: diff.capsPaused.length,
    phase_regressed: !!diff.phaseChange,
    created_at: new Date().toISOString(),
  }).then(() => {});

  return diff;
}

// ═══════════════════════════════════════════════════════════════
// 11. GOAL-SPECIFIC OUTCOME PROJECTIONS (Issue 3)
// ═══════════════════════════════════════════════════════════════

export function generateGoalProjections(assessment) {
  const projections = [];
  const fitness = assessment?.fitnessLevel || "beginner";
  const conditions = assessment?.conditions || [];
  const condMap = {};
  for (const c of conditions) {
    const key = c.conditionId || c.bodyArea?.toLowerCase().replace(/\s+/g, "_");
    condMap[key] = c;
  }

  for (const [muscle, types] of Object.entries(assessment?.goals || {})) {
    for (const type of types) {
      const label = muscle.replace(/_/g, " ");
      const blocks = [];

      if (type === "strength") {
        if (fitness === "beginner") {
          blocks.push({ weeks: "1-6", title: "Foundation", desc: `Learning movement patterns. Building neuromuscular connection for ${label}.` });
          blocks.push({ weeks: "7-12", title: "Loading Phase", desc: `Progressive loading begins. Expect 30-50% strength gains on key lifts.` });
          blocks.push({ weeks: "13-18", title: "Strength Phase", desc: `Compound lifts at working weights. RPE 7-8. Significant strength gains.` });
          blocks.push({ weeks: "19-24", title: "Peak Strength", desc: `Advanced loading. Testing new maxes. Sport-specific power development.` });
        } else {
          blocks.push({ weeks: "1-6", title: "Ramp-Up", desc: `Re-establishing movement quality and working weights.` });
          blocks.push({ weeks: "7-12", title: "Overload", desc: `Progressive overload at higher intensities. RPE 7-9.` });
          blocks.push({ weeks: "13-18", title: "Peak", desc: `Peak strength phase. Testing limits safely.` });
          blocks.push({ weeks: "19-24", title: "Maintain & Specialize", desc: `Maintain strength while adding sport-specific work.` });
        }
        blocks.push({ note: "Assumes 3+ sessions/week and adequate protein (0.7-1g per lb bodyweight)." });
      } else if (type === "size") {
        blocks.push({ weeks: "1-6", title: "Neural Adaptation", desc: `No visible size change yet. Building the foundation your muscles need to grow.` });
        blocks.push({ weeks: "7-12", title: "Early Development", desc: `First noticeable development begins. Pressing/pulling strength up 15-25%.` });
        blocks.push({ weeks: "13-18", title: "Hypertrophy Phase", desc: `Visible muscle growth with proper nutrition. Volume accumulation at its peak.` });
        blocks.push({ weeks: "19-24", title: "Peak Development", desc: `${label} approaching target development. Refining proportions.` });
        blocks.push({ note: "Visible results require a caloric surplus of 200-500 calories above maintenance." });
      } else if (type === "endurance") {
        blocks.push({ weeks: "1-6", title: "Base Building", desc: `Zone 2 work 20-30 min. VO2 max improvement 5-10%.` });
        blocks.push({ weeks: "7-12", title: "Threshold Work", desc: `Zone 3-4 intervals introduced. Endurance capacity expanding.` });
        blocks.push({ weeks: "13-18", title: "Performance", desc: `Sustained effort at higher intensities. Mile time improvements expected.` });
        blocks.push({ weeks: "19-24", title: "Sport-Specific", desc: `Conditioning matched to your sport demands.` });
      } else if (type === "injury_prevention") {
        blocks.push({ weeks: "1-6", title: "Corrective Foundation", desc: `Addressing ${(assessment.compensations || []).length} compensatory patterns.` });
        blocks.push({ weeks: "7-12", title: "Stabilizer Strength", desc: `Stabilizer muscles catching up. Movement screen improvements expected.` });
        blocks.push({ weeks: "13-18", title: "Integration", desc: `Corrected patterns integrated into compound movements.` });
        blocks.push({ weeks: "19-24", title: "Resilience", desc: `Movement quality maintained under load. Injury risk significantly reduced.` });
      }

      projections.push({ muscle: label, type, blocks });
    }
  }

  // Condition-specific timelines
  for (const c of conditions) {
    const key = c.conditionId || c.bodyArea?.toLowerCase().replace(/\s+/g, "_");
    const blocks = [];
    blocks.push({ weeks: "1-4", title: "Pain Management", desc: `Target: pain ≤4/10. PT protocols ${c.severity >= 3 ? "4x" : "2x"}/day.` });
    blocks.push({ weeks: "5-8", title: "Stability", desc: `Core stability foundation. Plank 30s, bird dog with control.` });
    blocks.push({ weeks: "9-12", title: "Functional Loading", desc: `Daily activities pain-free. Light resistance training.` });
    blocks.push({ weeks: "13+", title: "Progressive Strengthening", desc: `Expected pain reduction: 40-60% by Week 12.` });
    projections.push({ muscle: c.name || key, type: "rehab", blocks, isCondition: true, severity: c.severity });
  }

  // Goal + condition conflicts
  const conflicts = resolveGoalConflicts(assessment.goals, conditions);
  for (const conf of conflicts) {
    projections.push({ muscle: conf.muscle, type: "adapted", blocks: [{ desc: conf.adapted }], isConflict: true, condition: conf.condition });
  }

  return projections;
}
