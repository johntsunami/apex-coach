// ═══════════════════════════════════════════════════════════════
// APEX Coach — Plan Validator
// Runs on every plan generation. Complements safetyVerification.js
// (which handles contraindications, prerequisites, volume limits,
// movement patterns, CEx order, PT protocols, meds, red flags,
// plyometrics, power caps). This module adds NASM-specific QA checks.
// ═══════════════════════════════════════════════════════════════

// ── Helpers ─────────────────────────────────────────────────────

function safeGet(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

function getUserGoalTier() {
  const assessment = safeGet("apex_assessment") || {};
  const goals = assessment.goals || {};
  const hasSizeGoals = Object.values(goals).some(g => (Array.isArray(g) ? g : [g]).includes("size"));
  const physique = assessment.physiqueCategory;
  const isCompetitor = physique && !["general", "no_compete"].includes(physique);
  const exp = assessment.trainingExperience;
  const isPro = exp === "professional";
  if (isCompetitor) return "competitor";
  if (isPro) return "professional";
  if (hasSizeGoals) return "intermediate_size";
  return "general";
}

// ═══════════════════════════════════════════════════════════════
// MAIN VALIDATOR — call after buildWorkoutList
// ═══════════════════════════════════════════════════════════════

export function validatePlan(plan, weeklyPlan) {
  const violations = [];
  const assessment = safeGet("apex_assessment") || {};
  const meso = safeGet("apex_mesocycle");
  const injuries = safeGet("apex_injuries") || [];
  const phase = meso?.phase || assessment.startingPhase || 1;
  const goalTier = getUserGoalTier();
  const weakPoints = assessment.weakPoints || [];
  const prefs = assessment.preferences || {};
  const rom = assessment.rom || {};
  const daysPerWeek = prefs.daysPerWeek || 3;
  const sessionTime = prefs.sessionTime || 45;
  const sportPrefs = safeGet("apex_sport_prefs") || prefs.sports || [];

  const allEx = plan?.all || [...(plan?.warmup || []), ...(plan?.main || []), ...(plan?.cooldown || [])];
  const mainEx = plan?.main || [];
  const warmupEx = plan?.warmup || [];
  const blocks = plan?.blocks || {};

  // ── CHECK 2B: Body Part Minimum Per Week ────────────────────
  if (weeklyPlan?.days) {
    const weekExercises = weeklyPlan.days.flatMap(d => d.exercises || []);
    const bpCounts = {};
    weekExercises.forEach(ex => { const bp = ex.bodyPart; if (bp) bpCounts[bp] = (bpCounts[bp] || 0) + 1; });

    const mins = daysPerWeek <= 2
      ? { chest: 1, back: 1, shoulders: 1, legs: 1, hamstrings: 1, glutes: 1, core: 1 }
      : { chest: 2, back: 2, shoulders: 2, legs: 2, hamstrings: 1, glutes: 1, arms: 1, core: 2, calves: 1 };

    const activeInjBps = new Set(injuries.filter(i => i.status !== "resolved" && i.severity >= 4).map(i => i.gateKey === "lower_back" ? "back" : i.gateKey === "knee" ? "legs" : i.gateKey));
    const blacklist = new Set(prefs.blacklist || []);

    Object.entries(mins).forEach(([bp, min]) => {
      const count = bpCounts[bp] || 0;
      if (count < min) {
        if (activeInjBps.has(bp)) {
          violations.push({ check: "BODY_PART_MIN", severity: "info", message: `EXCUSED: ${bp} minimum not met (${count}/${min}) due to condition severity`, bodyPart: bp });
        } else if (sessionTime <= 30) {
          violations.push({ check: "BODY_PART_MIN", severity: "info", message: `${bp} at ${count}/${min} exercises/week — limited by 30-min sessions`, bodyPart: bp });
        } else {
          violations.push({ check: "BODY_PART_MIN", severity: "warning", message: `BODY PART NEGLECTED: ${bp} has ${count} exercises this week (minimum ${min})`, bodyPart: bp });
        }
      }
    });
  }

  // ── CHECK 2C: Max Exercises Per Body Part Per Session ────────
  {
    const sessionBpCounts = {};
    mainEx.forEach(ex => { const bp = ex.bodyPart; if (bp) sessionBpCounts[bp] = (sessionBpCounts[bp] || 0) + 1; });

    const maxPerSession = goalTier === "competitor" ? { priority: 8, large: 5, small: 4, core: 4 }
      : goalTier === "intermediate_size" ? { priority: 6, large: 4, small: 3, core: 4 }
      : goalTier === "professional" ? { priority: 99, large: 99, small: 99, core: 99 } // no hard cap
      : { priority: 4, large: 4, small: 2, core: 3 };

    const smallGroups = new Set(["arms", "calves", "forearms"]);
    Object.entries(sessionBpCounts).forEach(([bp, count]) => {
      const isPriority = weakPoints[0]?.replace(/_/g, " ").includes(bp) || false;
      const cap = isPriority ? maxPerSession.priority : bp === "core" ? maxPerSession.core : smallGroups.has(bp) ? maxPerSession.small : maxPerSession.large;
      if (count > cap) {
        const sev = goalTier === "professional" ? "info" : goalTier === "competitor" ? "info" : "warning";
        violations.push({ check: "SESSION_BP_MAX", severity: sev, message: `${bp}: ${count} exercises in session (max ${cap} for ${goalTier})`, bodyPart: bp });
      }
    });
  }

  // ── CHECK 2D: Max Exercises Per Body Part Per Week ───────────
  if (weeklyPlan?.days) {
    const weekBpCounts = {};
    weeklyPlan.days.flatMap(d => d.exercises || []).forEach(ex => { const bp = ex.bodyPart; if (bp) weekBpCounts[bp] = (weekBpCounts[bp] || 0) + 1; });

    const weekMax = goalTier === "competitor" ? { priority: 12, large: 10, medium: 8, small: 6 }
      : goalTier === "intermediate_size" ? { priority: 8, large: 7, medium: 6, small: 5 }
      : goalTier === "professional" ? { priority: 99, large: 99, medium: 99, small: 99 }
      : { priority: 6, large: 6, medium: 5, small: 4 };

    const smallGroups = new Set(["arms", "calves", "forearms"]);
    const medGroups = new Set(["shoulders", "glutes", "hips"]);
    Object.entries(weekBpCounts).forEach(([bp, count]) => {
      const isPriority = weakPoints.includes(bp) || weakPoints.some(w => w.replace(/_/g, " ").includes(bp));
      const cap = isPriority ? weekMax.priority : smallGroups.has(bp) ? weekMax.small : medGroups.has(bp) ? weekMax.medium : weekMax.large;
      if (count > cap) {
        const sev = goalTier === "professional" ? "info" : "warning";
        violations.push({ check: "WEEK_BP_MAX", severity: sev, message: `${bp}: ${count} exercises/week (max ${cap} for ${goalTier})`, bodyPart: bp });
      }
    });

    // Absolute cap: 30 sets/week for any muscle
    const weeklyVol = plan?.weeklyVol || safeGet("apex_weekly_volume") || {};
    Object.entries(weeklyVol).forEach(([bp, sets]) => {
      if (sets > 30) violations.push({ check: "VOLUME_ABSOLUTE_CAP", severity: "warning", message: `${bp}: ${sets} sets/week exceeds 30-set evidence-based ceiling (Pelland et al.)`, bodyPart: bp });
      else if (sets > 25) violations.push({ check: "VOLUME_HIGH", severity: "info", message: `${bp}: ${sets} sets/week approaching upper limit (25+)`, bodyPart: bp });
    });
  }

  // ── CHECK 7: Session Time Compliance ────────────────────────
  {
    const estMinutes = (warmupEx.length + mainEx.length + (plan?.cooldown?.length || 0)) * 4 + 5; // rough: 4 min/exercise + 5 min overhead
    if (estMinutes > sessionTime + 10) {
      violations.push({ check: "TIME_EXCEEDED", severity: "warning", message: `Plan estimates ~${estMinutes} min but user selected ${sessionTime} min`, estimatedMinutes: estMinutes, selectedMinutes: sessionTime });
    }
  }

  // ── CHECK 9: Warm-up/Cooldown Stretch Type ──────────────────
  {
    const lengthenEx = blocks.lengthen || [];
    const cooldownEx = blocks.cooldownStretches || [];

    if (phase >= 2) {
      const staticInWarmup = lengthenEx.filter(e => e.stretch_type === "static" && !e._phase1Static);
      if (staticInWarmup.length > 0) {
        violations.push({ check: "STRETCH_TYPE", severity: "warning", message: `${staticInWarmup.length} static stretch(es) in Phase ${phase} warm-up — should be dynamic per NASM`, exercises: staticInWarmup.map(e => e.name) });
      }
    }

    const dynamicInCooldown = cooldownEx.filter(e => e.stretch_type === "dynamic");
    if (dynamicInCooldown.length > 0) {
      violations.push({ check: "STRETCH_TYPE", severity: "info", message: `${dynamicInCooldown.length} dynamic stretch(es) in cooldown — should be static per NASM`, exercises: dynamicInCooldown.map(e => e.name) });
    }
  }

  // ── CHECK 10: Sport Bias Verification ───────────────────────
  {
    const userSports = Array.isArray(sportPrefs) ? sportPrefs.map(s => typeof s === "string" ? s : s.sport).filter(s => s && s !== "None") : [];
    if (userSports.length > 0) {
      const hasSportBias = mainEx.some(e => e._sportBiased);
      if (!hasSportBias) {
        violations.push({ check: "SPORT_MISMATCH", severity: "warning", message: `User has ${userSports[0]} as sport but zero sport-biased exercises in today's plan`, sport: userSports[0] });
      }
    }
  }

  // ── CHECK 11: ROM Exercise Frequency ────────────────────────
  {
    const romToBodyPart = { neck: "neck", cervical_retraction: "neck", thoracic: "back", lumbar: "back", lumbar_ext: "back", lumbar_flex: "back", shoulders: "shoulders", elbows: "arms", wrists: "arms", hip_flexion: "hips", hip_ir: "hips", hip_er: "hips", hip_ext: "hips", hips: "hips", knee_left: "legs", knee_right: "legs", ankles: "calves", feet: "calves" };
    const tierNum = v => v === "slight" ? 2 : v === "limited" ? 3 : v === "mod_limited" ? 4 : v === "painful" ? 5 : 1;
    const romBps = {};
    Object.entries(rom).forEach(([j, v]) => { const bp = romToBodyPart[j]; const t = tierNum(v); if (bp && t >= 4) romBps[bp] = Math.max(romBps[bp] || 0, t); });

    const lengthenBps = new Set((blocks.lengthen || []).map(e => e.bodyPart).filter(Boolean));
    Object.entries(romBps).forEach(([bp, tier]) => {
      if (!lengthenBps.has(bp)) {
        violations.push({ check: "ROM_GAP", severity: tier >= 5 ? "warning" : "info", message: `ROM T${tier}: ${bp} severely limited but no ROM exercise in today's warm-up`, bodyPart: bp });
      }
    });
  }

  // ── CHECK 12: Weak Point Volume ─────────────────────────────
  if (weakPoints.length > 0 && weeklyPlan?.days) {
    const weeklyVol = plan?.weeklyVol || safeGet("apex_weekly_volume") || {};
    const wp1 = weakPoints[0];
    const wp1Bp = wp1?.replace(/_/g, " ").replace("back width", "back").replace("back thickness", "back").replace("side delts", "shoulders").replace("front delts", "shoulders").replace("rear delts", "shoulders");
    const wp1Sets = weeklyVol[wp1Bp] || 0;
    const avgSets = Object.values(weeklyVol).filter(v => v > 0);
    const avgNonWp = avgSets.length > 1 ? avgSets.filter((_, i) => i > 0).reduce((a, b) => a + b, 0) / Math.max(1, avgSets.length - 1) : 0;
    if (wp1Sets > 0 && avgNonWp > 0 && wp1Sets <= avgNonWp) {
      violations.push({ check: "WEAK_POINT_IGNORED", severity: "warning", message: `${wp1} is #1 priority but only ${wp1Sets} sets/week (avg non-priority: ${Math.round(avgNonWp)})`, weakPoint: wp1, sets: wp1Sets });
    }
  }

  // ── CHECK 13: Cardio Inclusion ──────────────────────────────
  if (weeklyPlan?.days) {
    const cardioDays = weeklyPlan.days.filter(d => d.exercises?.some(e => e.category === "cardio" || e.type === "cardio")).length;
    const blockCardio = (blocks.cardio || []).length;
    if (cardioDays === 0 && blockCardio === 0) {
      violations.push({ check: "CARDIO_MISSING", severity: "info", message: "No cardio sessions detected in this week's plan (minimum 2 recommended)" });
    }
  }

  // ── CHECK 14: Deload Compliance ─────────────────────────────
  {
    const mesoWeek = meso?.currentWeek || 1;
    const mesoLength = meso?.mesoLength || 6;
    const isDeload = mesoWeek >= mesoLength;
    if (isDeload) {
      const totalMainSets = mainEx.reduce((sum, e) => sum + (parseInt(e.phaseParams?.[String(phase)]?.sets) || 2), 0);
      if (totalMainSets > 15) {
        violations.push({ check: "DELOAD_MISSING", severity: "warning", message: `Week ${mesoWeek}/${mesoLength} (deload) but ${totalMainSets} main sets — should be ~50% reduction`, sets: totalMainSets });
      }
    }
  }

  // ── CHECK 6: Duplicate Exercises ────────────────────────────
  {
    const ids = mainEx.map(e => e.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dupes.length > 0) {
      violations.push({ check: "DUPLICATE", severity: "warning", message: `Duplicate exercise(s) in session: ${[...new Set(dupes)].join(", ")}`, exercises: [...new Set(dupes)] });
    }
  }

  // ── Compute score ───────────────────────────────────────────
  const totalChecks = 14;
  const failedChecks = new Set(violations.filter(v => v.severity === "critical" || v.severity === "warning").map(v => v.check)).size;
  const score = Math.round(((totalChecks - failedChecks) / totalChecks) * 100);

  return {
    generatedAt: new Date().toISOString(),
    phase,
    goalTier,
    checksTotal: totalChecks,
    checksPassed: totalChecks - failedChecks,
    checksFailed: failedChecks,
    violations,
    score,
    criticalCount: violations.filter(v => v.severity === "critical").length,
    warningCount: violations.filter(v => v.severity === "warning").length,
    infoCount: violations.filter(v => v.severity === "info").length,
  };
}

// ═══════════════════════════════════════════════════════════════
// SAVE VALIDATION RESULT (to localStorage for dev dashboard)
// ═══════════════════════════════════════════════════════════════

const LS_VALIDATIONS = "apex_plan_validations";

export function saveValidation(result) {
  try {
    const existing = JSON.parse(localStorage.getItem(LS_VALIDATIONS) || "[]");
    existing.push(result);
    while (existing.length > 50) existing.shift(); // keep last 50
    localStorage.setItem(LS_VALIDATIONS, JSON.stringify(existing));
  } catch {}
}

export function getValidations() {
  try { return JSON.parse(localStorage.getItem(LS_VALIDATIONS) || "[]"); } catch { return []; }
}

export function getValidationSummary() {
  const validations = getValidations();
  if (validations.length === 0) return null;
  const recent = validations.slice(-10);
  const avgScore = Math.round(recent.reduce((s, v) => s + v.score, 0) / recent.length);
  const totalCritical = recent.reduce((s, v) => s + v.criticalCount, 0);
  const totalWarnings = recent.reduce((s, v) => s + v.warningCount, 0);
  const totalInfo = recent.reduce((s, v) => s + v.infoCount, 0);
  return { avgScore, totalCritical, totalWarnings, totalInfo, count: recent.length, latest: recent[recent.length - 1] };
}
