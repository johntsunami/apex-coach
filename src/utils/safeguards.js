// ═══════════════════════════════════════════════════════════════
// APEX Coach — Loading Safeguards (Single Source of Truth)
// Joint rep floors, age phase ceiling, condition rep modifications.
// Every file that needs these IMPORTS from here — no duplication.
// ═══════════════════════════════════════════════════════════════

// ── 1. JOINT REP FLOORS ──────────────────────────────────────
// Exercises loading an injured joint keep higher reps even in Phase 4-5.
// The USER advances to higher phases but AFFECTED JOINTS stay protected.

const JOINT_REP_FLOORS = {
  shoulder:   { 1: 6, 2: 8, 3: 12 },
  knee:       { 1: 6, 2: 8, 3: 12 },
  lower_back: { 1: 6, 2: 8, 3: 12 },
  hip:        { 1: 6, 2: 8, 3: 12 },
  ankle:      { 1: 8, 2: 10, 3: 15 },
  wrist:      { 1: 8, 2: 10, 3: 15 },
  elbow:      { 1: 6, 2: 8, 3: 12 },
  neck:       { 1: 8, 2: 10, 3: 15 },
};

function normalizeJointName(area) {
  const a = (area || "").toLowerCase();
  if (a.includes("shoulder") || a.includes("labrum") || a.includes("rotator") || a.includes("slap")) return "shoulder";
  if (a.includes("knee") || a.includes("patell") || a.includes("acl") || a.includes("meniscus")) return "knee";
  if (a.includes("back") || a.includes("lumbar") || a.includes("spine") || a.includes("disc") || a.includes("fusion")) return "lower_back";
  if (a.includes("hip") || a.includes("labral") || a.includes("trochant")) return "hip";
  if (a.includes("ankle") || a.includes("achilles") || a.includes("foot") || a.includes("plantar")) return "ankle";
  if (a.includes("wrist") || a.includes("carpal")) return "wrist";
  if (a.includes("elbow") || a.includes("tennis") || a.includes("golfer") || a.includes("epicondyl")) return "elbow";
  if (a.includes("neck") || a.includes("cervical") || a.includes("whiplash")) return "neck";
  return null;
}

const BODY_JOINT_MAP = {
  chest: ["shoulder"], shoulders: ["shoulder"], back: ["lower_back"],
  legs: ["knee", "hip"], glutes: ["hip"], hips: ["hip"],
  arms: ["elbow"], calves: ["ankle"], neck: ["neck"],
};

export function getRepFloor(exercise, injuries) {
  if (!injuries || injuries.length === 0) return 0;
  const joints = (exercise.jointsInvolved || []).length > 0
    ? exercise.jointsInvolved
    : (BODY_JOINT_MAP[exercise.bodyPart] || []);

  let highestFloor = 0;
  joints.forEach(joint => {
    const nj = normalizeJointName(joint) || joint;
    injuries.forEach(injury => {
      if (normalizeJointName(injury.area) === nj) {
        const bucket = (injury.severity || 2) >= 3 ? 3 : (injury.severity || 2) >= 2 ? 2 : 1;
        highestFloor = Math.max(highestFloor, JOINT_REP_FLOORS[nj]?.[bucket] || 8);
      }
    });
  });
  return highestFloor;
}

// ── 2. AGE-BASED PHASE CEILING ───────────────────────────────
// NASM SFS: older adults cycle Phase 1-2 by default.
// Advanced seniors with no conditions can go higher.

export function getMaxPhaseForAge(age, fitnessLevel, conditions) {
  if (!age || age < 18) return 5;
  const severeCount = (conditions || []).filter(c => (c.severity || 0) >= 2).length;
  const adv = fitnessLevel === "advanced";

  if (age >= 75) return (adv && severeCount === 0) ? 3 : 2;
  if (age >= 65) return (adv && severeCount <= 1) ? 4 : 3;
  if (age >= 55) return adv ? 5 : 4;
  return 5;
}

// ── 3. CONDITION-SPECIFIC REP MODIFICATIONS ──────────────────
// Some conditions require higher reps GLOBALLY (all exercises).

const CONDITION_REP_RULES = {
  osteoporosis:              { minReps: 10, maxPhase: 3, reason: "Fracture risk — 10-20 reps (NASM Ch23)" },
  osteopenia:                { minReps: 8,  maxPhase: 4, reason: "Moderate loading builds bone safely" },
  rheumatoid_arthritis:      { minReps: 10, maxPhase: 2, reason: "Joint protection — higher reps (NASM Ch23)" },
  psoriatic_arthritis:       { minReps: 10, maxPhase: 2, reason: "Same as RA management" },
  fibromyalgia:              { minReps: 12, maxPhase: 2, reason: "Central sensitization — minimal loading" },
  chronic_fatigue_syndrome:  { minReps: 12, maxPhase: 1, reason: "Post-exertional malaise risk" },
  ehlers_danlos:             { minReps: 10, maxPhase: 2, reason: "Hypermobility — avoid max loads" },
  heart_failure:             { minReps: 10, maxPhase: 2, reason: "Avoid heavy Valsalva (NASM Ch23)" },
  hypertension_uncontrolled: { minReps: 10, maxPhase: 2, reason: "Heavy loading spikes BP" },
  copd:                      { minReps: 10, maxPhase: 2, reason: "No breath-holding (NASM Ch23)" },
  pregnancy_2nd_3rd:         { minReps: 10, maxPhase: 2, reason: "No max effort during pregnancy" },
  postpartum:                { minReps: 10, maxPhase: 2, reason: "Pelvic floor recovery" },
  spinal_fusion:             { minReps: 8,  maxPhase: 3, reason: "Protect fused segments" },
  disc_herniation_acute:     { minReps: 12, maxPhase: 1, reason: "Acute disc — stabilization only" },
  disc_herniation_chronic:   { minReps: 8,  maxPhase: 3, reason: "Chronic disc — moderate loading OK" },
  labrum_tear_shoulder:      { minReps: 8,  maxPhase: 3, reason: "Shoulder instability — no max loads" },
  labrum_tear_hip:           { minReps: 8,  maxPhase: 3, reason: "Hip instability — moderate loading" },
  acl_post_op:               { minReps: 8,  maxPhase: 3, reason: "Graft protection" },
  meniscus_tear:             { minReps: 8,  maxPhase: 3, reason: "Joint surface protection" },
  rotator_cuff_tear:         { minReps: 10, maxPhase: 2, reason: "Tendon healing — no max loads" },
  frozen_shoulder:           { minReps: 10, maxPhase: 2, reason: "ROM priority — no heavy loading" },
  total_joint_replacement:   { minReps: 10, maxPhase: 2, reason: "Prosthetic protection" },
  patellar_tendinopathy:     { minReps: 8,  maxPhase: 3, reason: "Tendon protocol — moderate intensity" },
  achilles_tendinopathy:     { minReps: 8,  maxPhase: 3, reason: "Tendon protocol — eccentric focus" },
  multiple_sclerosis:        { minReps: 10, maxPhase: 2, reason: "Fatigue management" },
  parkinsons:                { minReps: 8,  maxPhase: 3, reason: "Movement quality over max load" },
  stroke_post:               { minReps: 10, maxPhase: 2, reason: "Controlled movements" },
  obesity:                   { minReps: 10, maxPhase: 3, reason: "Joint protection at higher bodyweight" },
  type2_diabetes:            { minReps: 8,  maxPhase: 4, reason: "Moderate-high load OK" },
  lupus:                     { minReps: 10, maxPhase: 2, reason: "Fatigue — avoid overexertion" },
  ankylosing_spondylitis:    { minReps: 10, maxPhase: 2, reason: "Extension focus — no heavy axial load" },
  scoliosis:                 { minReps: 8,  maxPhase: 3, reason: "Asymmetric loading caution" },
  gout:                      { minReps: 10, maxPhase: 3, reason: "Joint protection between flares" },
};

export function getConditionRepModifications(conditions) {
  let globalMinReps = 0, globalMaxPhase = 5;
  const reasons = [];

  (conditions || []).forEach(c => {
    const key = c.id || c.type || c.condition || (c.area || "").toLowerCase().replace(/\s+/g, "_");
    const rule = CONDITION_REP_RULES[key];
    if (rule) {
      globalMinReps = Math.max(globalMinReps, rule.minReps);
      globalMaxPhase = Math.min(globalMaxPhase, rule.maxPhase);
      reasons.push(rule.reason);
    }
  });

  return { globalMinReps, globalMaxPhase, reasons, hasRestrictions: globalMinReps > 0 || globalMaxPhase < 5 };
}

// ── 4. MASTER FUNCTION — APPLY ALL SAFEGUARDS ────────────────
// Call once per exercise. Returns what was modified and why.

export function applySafeguards(exercise, phase, injuries, conditions, age, fitnessLevel) {
  let repFloor = 0, maxPhase = 5;
  const reasons = [];

  // Condition rules (GLOBAL)
  const cond = getConditionRepModifications(conditions);
  if (cond.hasRestrictions) {
    repFloor = Math.max(repFloor, cond.globalMinReps);
    maxPhase = Math.min(maxPhase, cond.globalMaxPhase);
    reasons.push(...cond.reasons);
  }

  // Joint rep floor (PER-EXERCISE)
  const jf = getRepFloor(exercise, injuries);
  if (jf > repFloor) { repFloor = jf; reasons.push(`Joint protection: ${jf}+ reps`); }

  // Age ceiling
  const ac = getMaxPhaseForAge(age, fitnessLevel, conditions);
  if (ac < maxPhase) { maxPhase = ac; reasons.push(`Age ${age}: max Phase ${ac}`); }

  return { repFloor, maxPhase, reasons, wasModified: repFloor > 0 || maxPhase < phase };
}

// ── 5. SAFE DISPLAY PARAMS ───────────────────────────────────
// Wraps any getExerciseDisplayParams with safeguard adjustments.

export function getSafeExerciseParams(exercise, phase, injuries, conditions, age, fitnessLevel, getBaseParams) {
  const base = getBaseParams(exercise, phase);
  const sg = applySafeguards(exercise, phase, injuries, conditions, age, fitnessLevel);
  if (!sg.wasModified) return { ...base, _safeguarded: false };

  const effPhase = Math.min(phase, sg.maxPhase);
  let params = effPhase < phase ? getBaseParams(exercise, effPhase) : { ...base };

  if (sg.repFloor > 0) {
    const cur = parseInt(params.reps) || 1;
    if (cur < sg.repFloor) {
      params.reps = `${sg.repFloor}-${sg.repFloor + 4}`;
      params.sets = String(Math.max(2, Math.min(parseInt(params.sets) || 3, 4)));
      params.intensity = sg.repFloor >= 12 ? "RPE 6-7" : sg.repFloor >= 8 ? "RPE 7-8" : params.intensity;
    }
  }

  return { ...params, _safeguarded: true, _effectivePhase: effPhase, _repFloor: sg.repFloor, _reasons: sg.reasons };
}

// ── 6. PHASE READINESS CHECK ─────────────────────────────────

export function checkSafeguardPhaseReadiness(targetPhase, age, fitnessLevel, conditions) {
  const maxPhase = Math.min(
    getMaxPhaseForAge(age, fitnessLevel, conditions),
    getConditionRepModifications(conditions).globalMaxPhase
  );
  if (targetPhase > maxPhase) {
    const reasons = [];
    if (getMaxPhaseForAge(age, fitnessLevel, conditions) < targetPhase) reasons.push(`Age ${age}: max Phase ${getMaxPhaseForAge(age, fitnessLevel, conditions)}`);
    const cond = getConditionRepModifications(conditions);
    if (cond.globalMaxPhase < targetPhase) reasons.push(...cond.reasons);
    return { allowed: false, maxPhase, reasons, message: `Phase ${targetPhase} restricted. Max Phase ${maxPhase}: ${reasons[0] || "safety"}` };
  }
  return { allowed: true, maxPhase };
}

export { JOINT_REP_FLOORS, CONDITION_REP_RULES };
