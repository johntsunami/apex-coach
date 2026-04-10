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

// ═══════════════════════════════════════════════════════════════
// NASM COMPLIANCE VALIDATOR + AUTO-FIX
// Runs BEFORE any session or week is shown to the user.
// Catches structural issues (min exercises, pattern coverage,
// volume, duplicates) and auto-fixes them.
// ═══════════════════════════════════════════════════════════════

function _normP(mp) {
  if (!mp) return "other";
  const p = (mp || "").toLowerCase();
  if (["anti_rotation", "anti_extension", "anti_flexion", "breathing"].includes(p)) return "core";
  if (p === "lunge") return "squat";
  if (p === "carry") return "core";
  if (p.includes("push")) return "push";
  if (p.includes("pull")) return "pull";
  return p;
}

function _sessionChecks(session, phase, exerciseDB) {
  const main = session.main || [];
  const warmup = session.warmup || [];
  const all = session.all || [...warmup, ...main, ...(session.cooldown || [])];
  const results = [];

  // S1: Minimum exercise count (≥ 4 main)
  results.push({
    id: "S1", severity: "CRITICAL", pass: main.length >= 4,
    msg: main.length >= 4 ? "OK" : `Only ${main.length} main exercises (min 4)`,
  });

  // S2: Movement pattern coverage (≥ 3 of push/pull/hinge/squat)
  const patterns = new Set();
  main.forEach(e => { const p = _normP(e.movementPattern); if (p !== "core" && p !== "other" && p !== "mobility" && p !== "balance") patterns.add(p); });
  results.push({
    id: "S2", severity: "CRITICAL", pass: patterns.size >= 3,
    msg: patterns.size >= 3 ? "OK" : `Only ${patterns.size} patterns: ${[...patterns].join(",")}`,
  });

  // S3: No duplicate exercises
  const names = main.map(e => (e.name || "").toLowerCase().trim());
  const dupes = names.filter((n, i) => names.indexOf(n) !== i);
  results.push({
    id: "S3", severity: "CRITICAL", pass: dupes.length === 0,
    msg: dupes.length === 0 ? "OK" : `Duplicates: ${[...new Set(dupes)].join(", ")}`,
  });

  // S4: No zero-strength sessions
  const strengthCount = main.filter(e => e.type === "strength" || e.type === "isolation" || e.type === "plyometric").length;
  results.push({
    id: "S10", severity: "CRITICAL", pass: strengthCount >= 2,
    msg: strengthCount >= 2 ? "OK" : `Only ${strengthCount} strength exercises (min 2)`,
  });

  // S7: Warm-up has foam rolling
  const foamCount = warmup.filter(e => e.category === "foam_roll").length;
  const blockFoam = (session.blocks?.inhibit || []).length;
  results.push({
    id: "S7", severity: "WARNING", pass: foamCount + blockFoam >= 2,
    msg: foamCount + blockFoam >= 2 ? "OK" : `Only ${foamCount + blockFoam} foam roll exercises (want 2+)`,
  });

  // S9: Balance in warmup not main
  const balInMain = main.filter(e => e.type === "balance" || (e.name || "").toLowerCase().includes("single-leg balance")).length;
  results.push({
    id: "S9", severity: "WARNING", pass: balInMain === 0,
    msg: balInMain === 0 ? "OK" : `${balInMain} balance drill(s) in main slots`,
  });

  // S11: At least 1 core exercise per session (in warmup or main)
  const allExercises = [...warmup, ...main];
  const hasCoreAnywhere = allExercises.some(e => e.bodyPart === "core");
  results.push({
    id: "S11", severity: "CRITICAL", pass: hasCoreAnywhere,
    msg: hasCoreAnywhere ? "OK" : "Zero core exercises in session",
  });

  return results;
}

function _weekChecks(days, phase) {
  const results = [];
  const vol = {};
  const allEx = [];
  const dayMuscles = []; // track which muscles each day trains

  days.forEach((d, di) => {
    const ex = d.main || d.exercises || [];
    const dayBps = new Set();
    ex.forEach(e => {
      const bp = e.bodyPart || "other";
      const sets = parseInt(e.sets || e.prescribedSets || "2") || 2;
      vol[bp] = (vol[bp] || 0) + sets;
      allEx.push({ ...e, _dayIdx: di });
      dayBps.add(bp);
    });
    dayMuscles.push(dayBps);
  });

  // W1: Volume within phase limits (CRITICAL — auto-fixable)
  const LIMITS = { 1: [8, 12], 2: [10, 18], 3: [14, 24], 4: [10, 16], 5: [8, 15] };
  const [lo, hi] = LIMITS[phase] || [8, 24];
  const overVol = Object.entries(vol).filter(([bp, s]) => s > hi * 1.25 && bp !== "other" && bp !== "core"); // flag at 125% of max
  results.push({
    id: "W1", severity: overVol.length > 0 ? "CRITICAL" : "WARNING",
    pass: overVol.length === 0,
    msg: overVol.length === 0 ? "OK" : `Over-volume: ${overVol.map(([bp, s]) => `${bp} ${s}/${hi}`).join(", ")}`,
    _overVol: overVol, _maxSets: hi,
  });

  // W5: Minimum volume per major group (≥ 6 sets)
  const majorGroups = ["chest", "back", "legs", "shoulders"];
  const underVol = majorGroups.filter(g => (vol[g] || 0) < 6);
  results.push({
    id: "W5", severity: "CRITICAL", pass: underVol.length === 0,
    msg: underVol.length === 0 ? "OK" : `Under-volume: ${underVol.map(g => `${g} ${vol[g] || 0}/6`).join(", ")}`,
  });

  // W2: Push:pull ratio (1:1 to 1:2)
  const pushVol = (vol.chest || 0) + (vol.shoulders || 0);
  const pullVol = (vol.back || 0);
  const ratio = pullVol > 0 ? pushVol / pullVol : 0;
  results.push({
    id: "W2", severity: "WARNING", pass: ratio <= 1.5 || pullVol === 0,
    msg: ratio <= 1.5 ? "OK" : `Push:pull ratio ${ratio.toFixed(1)}:1 (max 1.5:1)`,
  });

  // W4: Exercise variety (no exercise > 2 times per week)
  const exCounts = {};
  allEx.forEach(e => { exCounts[e.id] = (exCounts[e.id] || 0) + 1; });
  const repeats = Object.entries(exCounts).filter(([, c]) => c > 2);
  results.push({
    id: "W4", severity: "WARNING", pass: repeats.length === 0,
    msg: repeats.length === 0 ? "OK" : `Repeated 3+ times: ${repeats.map(([id]) => id).join(", ")}`,
  });

  // W6: Core variety
  const coreCounts = {};
  allEx.filter(e => e.bodyPart === "core").forEach(e => { coreCounts[e.id] = (coreCounts[e.id] || 0) + 1; });
  const coreTotal = allEx.filter(e => e.bodyPart === "core").length;
  const coreDominant = Object.entries(coreCounts).find(([, c]) => c > Math.max(2, coreTotal * 0.5));
  results.push({
    id: "W6", severity: "WARNING", pass: !coreDominant,
    msg: !coreDominant ? "OK" : `Core dominated by ${coreDominant[0]} (${coreDominant[1]}/${coreTotal})`,
  });

  return { results, volume: vol };
}

// ── AUTO-FIX for session-level critical failures ──
function _autoFixSession(session, checks, phase, exerciseDB) {
  let fixed = { ...session, main: [...(session.main || [])], warmup: [...(session.warmup || [])], cooldown: [...(session.cooldown || [])] };
  const log = [];

  const fails = checks.filter(c => !c.pass && c.severity === "CRITICAL");
  if (fails.length === 0) return { session: fixed, log };

  const usedIds = new Set(fixed.main.map(e => e.id));
  const isUsable = (e) => e.category === "main" && !usedIds.has(e.id) && (e.phaseEligibility || []).includes(phase) && e.safetyTier !== "red" && e.bodyPart !== "core" && e.type !== "balance";

  // S1/S10: Not enough exercises or strength exercises
  // Respect the day's split focus — don't add push-ups on leg days
  if (fails.some(c => c.id === "S1" || c.id === "S10")) {
    // Determine which body parts this day's focus covers
    const _mainBps = new Set(fixed.main.map(e => e.bodyPart).filter(Boolean));
    const _isLowerDay = _mainBps.has("legs") || _mainBps.has("glutes") || _mainBps.has("hips");
    const _isUpperDay = _mainBps.has("chest") || _mainBps.has("back") || _mainBps.has("shoulders");
    const _focusBps = _isLowerDay ? ["legs", "glutes", "hips", "core"] : _isUpperDay ? ["chest", "back", "shoulders", "arms", "core"] : null;
    // 1. Try exercises matching the day's focus
    const focusPool = _focusBps ? (exerciseDB || []).filter(e => isUsable(e) && _focusBps.includes(e.bodyPart)).sort((a, b) => (b.difficultyLevel || 1) - (a.difficultyLevel || 1)) : [];
    for (const ex of focusPool) { if (fixed.main.length >= 4) break; fixed.main.push({ ...ex, _reason: "Auto-fix: split-appropriate filler" }); usedIds.add(ex.id); log.push(`S1: Added ${ex.name} (matches day focus)`); }
    // 2. Try core exercises (always appropriate)
    if (fixed.main.length < 4) {
      const corePool = (exerciseDB || []).filter(e => e.bodyPart === "core" && !usedIds.has(e.id) && (e.phaseEligibility || []).includes(phase));
      for (const ex of corePool) { if (fixed.main.length >= 4) break; fixed.main.push({ ...ex, _reason: "Auto-fix: core filler" }); usedIds.add(ex.id); log.push(`S1: Added ${ex.name} (core filler)`); }
    }
    // 3. Last resort: any exercise
    if (fixed.main.length < 4) {
      const pool = (exerciseDB || []).filter(isUsable).sort((a, b) => (b.difficultyLevel || 1) - (a.difficultyLevel || 1));
      for (const ex of pool) { if (fixed.main.length >= 4) break; fixed.main.push({ ...ex, _reason: "Auto-fix: minimum session size" }); usedIds.add(ex.id); log.push(`S1: Added ${ex.name} (last resort)`); }
    }
  }

  // S2: Missing patterns
  if (fails.some(c => c.id === "S2")) {
    const present = new Set();
    fixed.main.forEach(e => { const p = _normP(e.movementPattern); if (p !== "core" && p !== "other") present.add(p); });
    const needed = ["push", "pull", "hinge", "squat"].filter(p => !present.has(p));
    for (const pattern of needed) {
      if (present.size >= 3) break; // only need 3
      const match = (exerciseDB || []).find(e => isUsable(e) && _normP(e.movementPattern) === pattern);
      if (match) {
        fixed.main.push({ ...match, _reason: `Auto-fix: missing ${pattern} pattern` });
        usedIds.add(match.id);
        present.add(pattern);
        log.push(`S2: Added ${match.name} for ${pattern} pattern`);
      }
    }
  }

  // S11: Core guarantee
  if (fails.some(c => c.id === "S11")) {
    const allEx = [...fixed.warmup, ...fixed.main];
    if (!allEx.some(e => e.bodyPart === "core")) {
      const coreRotation = ["stab_dead_bug", "stab_mcgill_curl_up", "core_pallof_kneel", "stab_bird_dog", "stab_plank", "stab_side_plank"];
      const coreEx = (exerciseDB || []).find(e => coreRotation.includes(e.id) && !usedIds.has(e.id) && (e.phaseEligibility || []).includes(phase))
        || (exerciseDB || []).find(e => e.bodyPart === "core" && !usedIds.has(e.id) && (e.phaseEligibility || []).includes(phase));
      if (coreEx) { fixed.warmup.push({ ...coreEx, _reason: "Auto-fix: core guarantee", _phase: "activate" }); usedIds.add(coreEx.id); log.push(`S11: Added ${coreEx.name} as core guarantee`); }
    }
  }

  // S3: Duplicates
  if (fails.some(c => c.id === "S3")) {
    const seen = new Set();
    fixed.main = fixed.main.filter(e => {
      const n = (e.name || "").toLowerCase().trim();
      if (seen.has(n)) { log.push(`S3: Removed duplicate ${e.name}`); return false; }
      seen.add(n);
      return true;
    });
  }

  // Rebuild .all
  fixed.all = [...fixed.warmup, ...fixed.main, ...fixed.cooldown];
  return { session: fixed, log };
}

// ── MASTER: Validate + Auto-Fix Session ──
export function validateAndFixSession(session, phase, exerciseDB) {
  let current = session;
  const allLogs = [];

  for (let attempt = 0; attempt < 3; attempt++) {
    const checks = _sessionChecks(current, phase, exerciseDB);
    const criticals = checks.filter(c => !c.pass && c.severity === "CRITICAL");
    if (criticals.length === 0) {
      const warnings = checks.filter(c => !c.pass && c.severity === "WARNING");
      return { session: current, valid: true, checks, log: allLogs, warnings: warnings.length, score: Math.round((checks.filter(c => c.pass).length / checks.length) * 100) };
    }
    const { session: fixed, log } = _autoFixSession(current, checks, phase, exerciseDB);
    allLogs.push(...log);
    current = fixed;
  }

  // After 3 attempts
  const finalChecks = _sessionChecks(current, phase, exerciseDB);
  const remaining = finalChecks.filter(c => !c.pass && c.severity === "CRITICAL");
  return {
    session: current, valid: remaining.length === 0,
    checks: finalChecks, log: allLogs,
    warnings: finalChecks.filter(c => !c.pass && c.severity === "WARNING").length,
    unfixable: remaining.map(c => c.msg),
    score: Math.round((finalChecks.filter(c => c.pass).length / finalChecks.length) * 100),
  };
}

// ── MASTER: Validate + Auto-Fix Week ──
export function validateAndFixWeek(weekDays, phase, exerciseDB) {
  // Validate each day
  const dayResults = (weekDays || []).map(day => {
    if (day.type !== "training" || !(day.exercises || day.main || []).length) return { day, valid: true, checks: [], log: [] };
    // Wrap day exercises into session format
    const asSess = { main: day.exercises || day.main || [], warmup: day.warmup || [], cooldown: day.cooldown || [], all: day.all || day.exercises || [], blocks: day.blocks };
    const result = validateAndFixSession(asSess, phase, exerciseDB);
    return { day: { ...day, exercises: result.session.main, main: result.session.main }, ...result };
  });

  // Validate week as a whole
  const trainingDays = dayResults.filter(d => d.day.type === "training");
  const weekCheck = _weekChecks(trainingDays.map(d => d.day), phase);

  const allValid = dayResults.every(d => d.valid) && weekCheck.results.filter(r => !r.pass && r.severity === "CRITICAL").length === 0;
  const totalChecks = dayResults.reduce((s, d) => s + (d.checks?.length || 0), 0) + weekCheck.results.length;
  const totalPassed = dayResults.reduce((s, d) => s + (d.checks?.filter(c => c.pass)?.length || 0), 0) + weekCheck.results.filter(r => r.pass).length;

  return {
    days: dayResults.map(d => d.day),
    valid: allValid,
    dayResults, weekResults: weekCheck.results, volume: weekCheck.volume,
    score: totalChecks > 0 ? Math.round((totalPassed / totalChecks) * 100) : 100,
    log: dayResults.flatMap(d => d.log || []),
  };
}
