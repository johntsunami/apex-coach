// ═══════════════════════════════════════════════════════════════
// APEX Coach — Data Export Utility
// Exports structured JSON + readable markdown for profile & workout review
// ═══════════════════════════════════════════════════════════════

// Use localStorage directly to avoid circular dependency issues
// All data is persisted in localStorage under apex_* keys

// ── Helpers ─────────────────────────────────────────────────────

function safeGet(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

function downloadFile(content, filename, type = "application/json") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function datestamp() {
  return new Date().toISOString().split("T")[0];
}

function getUserName() {
  try {
    const profile = safeGet("apex_user_profile");
    return profile?.first_name || profile?.name || "user";
  } catch { return "user"; }
}

// ═══════════════════════════════════════════════════════════════
// EXPORT 1: PROFILE & ASSESSMENT
// ═══════════════════════════════════════════════════════════════

export function exportProfile() {
  const assessment = safeGet("apex_assessment") || {};
  const injuries = safeGet("apex_injuries") || [];
  const stats = safeGet("apex_stats") || {};
  const sportPrefs = safeGet("apex_sport_prefs") || [];
  const meso = safeGet("apex_mesocycle");
  const baseline = safeGet("apex_baseline_tests");
  const latestBaseline = Array.isArray(baseline) ? baseline[baseline.length - 1] : baseline;
  const capabilities = safeGet("apex_baseline_capabilities") || [];
  const prefs = assessment.preferences || {};

  const data = {
    exportedAt: new Date().toISOString(),
    exportType: "profile_assessment",
    version: "1.0",

    // User profile
    profile: {
      fitnessLevel: assessment.fitnessLevel || "unknown",
      trainingExperience: assessment.trainingExperience || null,
      trainingRecency: assessment.trainingRecency || null,
      trainingHistory: assessment.trainingHistory || null,
      progressionRate: assessment.progressionRate || "standard",
      startingPhase: assessment.startingPhase || 1,
    },

    // Active conditions
    conditions: {
      active: (assessment.conditions || []).map(c => ({
        id: c.conditionId,
        name: c.name,
        severity: c.severity,
        location: c.bodyArea || null,
        status: c.condType || null,
        category: c.category,
        impact: c.impact || null,
        flareFreq: c.flareFreq || null,
        clearance: c.clearance || null,
        hrMeds: c.hrMeds || null,
      })),
      injuries: injuries.map(i => ({
        id: i.id,
        area: i.area,
        severity: i.severity,
        status: i.status,
        gateKey: i.gateKey,
        type: i.type || null,
        notes: i.notes || null,
        dateAdded: i.dateAdded || null,
      })),
      resolved: safeGet("apex_injury_history") || [],
    },

    // Assessment results
    assessment: {
      parq: assessment.parq || null,
      compensations: assessment.compensations || [],
      rom: assessment.rom || {},
      directionalPreferences: assessment.directionalPreferences || {},
      painBehaviors: assessment.painBehaviors || {},
      painTimelines: assessment.painTimelines || {},
      functionalLimitations: assessment.functionalLimitations || {},
      treatmentHistory: assessment.treatmentHistory || null,
      medications: assessment.medications || [],
      redFlags: assessment.redFlags || [],
    },

    // Goals
    goals: {
      muscleGoals: assessment.goals || {},
      physiqueCategory: assessment.physiqueCategory || null,
      hypertrophyExperience: assessment.hypertrophyExperience || null,
      weakPoints: assessment.weakPoints || [],
      compensatoryAdditions: assessment.compensatoryAdditions || [],
    },

    // Preferences
    preferences: {
      daysPerWeek: prefs.daysPerWeek || 3,
      sessionTime: prefs.sessionTime || 45,
      homeEquipment: prefs.homeEquipment || [],
      favorites: prefs.favorites || [],
      blacklist: prefs.blacklist || [],
      sports: sportPrefs.length > 0 ? sportPrefs : (prefs.sports || []),
    },

    // Current programming state
    programming: {
      currentPhase: meso?.phase || assessment.startingPhase || 1,
      mesocycle: meso ? {
        id: meso.id,
        tier: meso.tier,
        tierName: meso.tierName,
        mesoLength: meso.mesoLength,
        currentWeek: meso.currentWeek,
        progressionRate: meso.progressionRate || "standard",
        cycleEmphasis: meso.cycleEmphasis || null,
        sessionsCompleted: meso.sessionsCompleted || 0,
      } : null,
      isInContinuousCycling: (() => { try { const a = JSON.parse(localStorage.getItem("apex_mesocycle_archive") || "[]"); return new Set(a.map(m => m.phase)).has(4) || a.length >= 4; } catch { return false; } })(),
    },

    // Baseline & capabilities
    baseline: latestBaseline ? {
      date: latestBaseline.date,
      overallScore: latestBaseline.overallScore,
      tests: latestBaseline.tests || {},
    } : null,
    capabilityTags: capabilities,

    // Stats
    stats: {
      totalSessions: stats.totalSessions || 0,
      streak: stats.streak || 0,
      sessionsThisWeek: stats.sessionsThisWeek || 0,
    },

    // HR & cardio
    hrSettings: safeGet("apex_hr_settings") || null,
    vo2Tests: safeGet("apex_vo2_tests") || [],
    cardioPrefs: safeGet("apex_cardio_prefs") || null,
  };

  const name = getUserName();
  const ds = datestamp();

  // Build readable markdown (always)
  const md = buildProfileMarkdown(data, name);
  downloadFile(md, `apex_profile_${name}_${ds}.md`, "text/markdown");

  // JSON only for developers
  if (isDevExportEnabled()) {
    downloadFile(JSON.stringify(data, null, 2), `apex_profile_${name}_${ds}.json`);
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORT 2: WORKOUT PLAN
// ═══════════════════════════════════════════════════════════════

export function exportWorkout() {
  const assessment = safeGet("apex_assessment") || {};
  const meso = safeGet("apex_mesocycle");
  const weeklyPlan = safeGet("apex_weekly_plan");
  const sessions = safeGet("apex_sessions") || [];
  const weeklyVol = safeGet("apex_weekly_volume") || {};
  const prefs = assessment.preferences || {};

  // Get today's workout if cached
  const dailyWorkout = safeGet("apex_daily_workout");

  const data = {
    exportedAt: new Date().toISOString(),
    exportType: "workout_plan",
    version: "1.0",

    // Context
    context: {
      currentPhase: meso?.phase || assessment.startingPhase || 1,
      mesoWeek: meso?.currentWeek || 1,
      mesoLength: meso?.mesoLength || 6,
      tier: meso?.tier || 2,
      tierName: meso?.tierName || "Cautious",
      progressionRate: meso?.progressionRate || "standard",
      cycleEmphasis: meso?.cycleEmphasis || null,
      daysPerWeek: prefs.daysPerWeek || 3,
      sessionTime: prefs.sessionTime || 45,
    },

    // Weekly plan
    weeklyPlan: weeklyPlan ? {
      weekNumber: weeklyPlan.weekNumber,
      isDeload: weeklyPlan.isDeload || false,
      days: (weeklyPlan.days || []).map(day => ({
        dayName: day.dayName,
        type: day.type,
        label: day.label,
        description: day.description,
        estimatedMinutes: day.estimatedMinutes,
        exercises: (day.exercises || []).map(ex => ({
          id: ex.id,
          name: ex.name,
          category: ex.category,
          bodyPart: ex.bodyPart,
          movementPattern: ex.movementPattern,
          type: ex.type,
          stretch_type: ex.stretch_type || null,
          primaryMuscles: ex.primaryMuscles || [],
          sets: ex.phaseParams?.[String(meso?.phase || 1)]?.sets || ex.sets,
          reps: ex.phaseParams?.[String(meso?.phase || 1)]?.reps || ex.reps,
          tempo: ex.phaseParams?.[String(meso?.phase || 1)]?.tempo || null,
          rest: ex.phaseParams?.[String(meso?.phase || 1)]?.rest || null,
          rpe: ex.phaseParams?.[String(meso?.phase || 1)]?.rpe || null,
          reason: ex._reason || null,
          sportBiased: ex._sportBiased || null,
          ptProtocol: ex._ptProtocol || false,
          phase1Static: ex._phase1Static || false,
        })),
      })),
    } : null,

    // Today's generated workout (if available)
    todayWorkout: dailyWorkout ? {
      warmup: (dailyWorkout.warmup || []).map(summarizeExercise),
      main: (dailyWorkout.main || []).map(summarizeExercise),
      cooldown: (dailyWorkout.cooldown || []).map(summarizeExercise),
      blocks: {
        inhibit: (dailyWorkout.blocks?.inhibit || []).map(summarizeExercise),
        lengthen: (dailyWorkout.blocks?.lengthen || []).map(summarizeExercise),
        cooldownStretches: (dailyWorkout.blocks?.cooldownStretches || []).map(summarizeExercise),
        cardio: (dailyWorkout.blocks?.cardio || []).map(summarizeExercise),
      },
      location: dailyWorkout.location,
      volSwaps: dailyWorkout.volSwaps || [],
      weeklyVol: dailyWorkout.weeklyVol || {},
      sportMeta: dailyWorkout.sportMeta || null,
    } : null,

    // Weekly volume tracking
    weeklyVolume: weeklyVol,

    // PT protocols
    ptProtocols: safeGet("apex_pt_protocols") || [],

    // Recent sessions (last 7 for context)
    recentSessions: sessions.slice(-7).map(s => ({
      date: s.date,
      exerciseCount: (s.exercises_completed || []).length,
      durationMinutes: s.durationMinutes || null,
      reflection: s.reflection || null,
      painFlagged: (s.pain_flagged || []).length,
    })),
  };

  const name = getUserName();
  const ds = datestamp();

  // Build readable markdown (always)
  const md = buildWorkoutMarkdown(data, name);
  downloadFile(md, `apex_workout_${name}_${ds}.md`, "text/markdown");

  // JSON only for developers
  if (isDevExportEnabled()) {
    downloadFile(JSON.stringify(data, null, 2), `apex_workout_${name}_${ds}.json`);
  }
}

// ── Exercise summary helper ─────────────────────────────────────

function summarizeExercise(ex) {
  return {
    id: ex.id,
    name: ex.name,
    category: ex.category,
    bodyPart: ex.bodyPart,
    movementPattern: ex.movementPattern,
    type: ex.type,
    stretch_type: ex.stretch_type || null,
    primaryMuscles: ex.primaryMuscles || [],
    reason: ex._reason || null,
    duration: ex._duration || null,
    sportBiased: ex._sportBiased || null,
    ptProtocol: ex._ptProtocol || false,
    swappedFor: ex._swappedFor || null,
    swapReason: ex._swapReason || null,
  };
}

// ═══════════════════════════════════════════════════════════════
// READABLE MARKDOWN BUILDERS
// ═══════════════════════════════════════════════════════════════

function buildProfileMarkdown(data, name) {
  const lines = [];
  const p = data.profile;
  const c = data.conditions;
  const a = data.assessment;
  const g = data.goals;
  const pr = data.preferences;
  const prog = data.programming;

  lines.push(`# APEX Profile Export — ${name}`);
  lines.push(`Exported: ${data.exportedAt}\n`);

  lines.push(`## Profile`);
  lines.push(`- Fitness Level: **${p.fitnessLevel}**`);
  lines.push(`- Training Experience: ${p.trainingExperience || "Not set"}`);
  lines.push(`- Recent Training (6wk): ${p.trainingRecency || "Not set"}`);
  lines.push(`- Prior History: ${p.trainingHistory || "Not set"}`);
  lines.push(`- Progression Rate: ${p.progressionRate}`);
  lines.push("");

  lines.push(`## Active Conditions (${c.active.length})`);
  if (c.active.length === 0) lines.push("None");
  c.active.forEach(cond => {
    lines.push(`- **${cond.name}** — Severity ${cond.severity}/5${cond.location ? ` (${cond.location})` : ""}${cond.status ? ` [${cond.status}]` : ""}`);
  });
  lines.push("");

  lines.push(`## Injuries (${c.injuries.length})`);
  c.injuries.forEach(inj => {
    lines.push(`- **${inj.area}** — Severity ${inj.severity}/5, Status: ${inj.status}, Gate: ${inj.gateKey}`);
  });
  lines.push("");

  lines.push(`## ROM Assessment`);
  Object.entries(a.rom || {}).forEach(([joint, val]) => {
    if (val !== "full") lines.push(`- ${joint}: **${val}**`);
  });
  const fullCount = Object.values(a.rom || {}).filter(v => v === "full").length;
  if (fullCount > 0) lines.push(`- ${fullCount} joints at full ROM`);
  lines.push("");

  lines.push(`## Goals`);
  Object.entries(g.muscleGoals || {}).forEach(([muscle, goals]) => {
    const ga = Array.isArray(goals) ? goals : [goals];
    if (ga.length > 0) lines.push(`- ${muscle}: ${ga.join(", ")}`);
  });
  if (g.weakPoints?.length > 0) lines.push(`- Weak Points: ${g.weakPoints.map((w, i) => `#${i + 1} ${w}`).join(", ")}`);
  if (g.physiqueCategory) lines.push(`- Physique: ${g.physiqueCategory}`);
  lines.push("");

  lines.push(`## Preferences`);
  lines.push(`- Days/week: ${pr.daysPerWeek} | Session: ${pr.sessionTime} min`);
  if (pr.sports?.length > 0) lines.push(`- Sports: ${pr.sports.map((s, i) => `#${i + 1} ${typeof s === "string" ? s : s.sport}`).join(", ")}`);
  if (pr.favorites?.length > 0) lines.push(`- Favorites: ${pr.favorites.length} exercises`);
  if (pr.blacklist?.length > 0) lines.push(`- Blacklisted: ${pr.blacklist.length} exercises`);
  if (pr.homeEquipment?.length > 0) lines.push(`- Equipment: ${pr.homeEquipment.join(", ")}`);
  lines.push("");

  lines.push(`## Current Programming`);
  lines.push(`- Phase: ${prog.currentPhase}`);
  if (prog.mesocycle) {
    lines.push(`- Tier: ${prog.mesocycle.tier} (${prog.mesocycle.tierName})`);
    lines.push(`- Mesocycle: Week ${prog.mesocycle.currentWeek}/${prog.mesocycle.mesoLength}`);
    lines.push(`- Progression: ${prog.mesocycle.progressionRate}`);
    if (prog.mesocycle.cycleEmphasis) lines.push(`- Cycle Emphasis: ${prog.mesocycle.cycleEmphasis}`);
  }
  lines.push(`- Continuous Cycling: ${prog.isInContinuousCycling ? "Yes" : "No"}`);
  lines.push("");

  if (data.baseline) {
    lines.push(`## Baseline Test (${data.baseline.date})`);
    lines.push(`- Overall Score: ${data.baseline.overallScore}`);
    Object.entries(data.baseline.tests || {}).forEach(([test, val]) => {
      lines.push(`- ${test}: ${typeof val === "object" ? JSON.stringify(val) : val}`);
    });
    lines.push("");
  }

  if (data.capabilityTags?.length > 0) {
    lines.push(`## Capability Tags Earned`);
    lines.push(data.capabilityTags.join(", "));
    lines.push("");
  }

  lines.push(`## Stats`);
  lines.push(`- Total Sessions: ${data.stats.totalSessions}`);
  lines.push(`- Current Streak: ${data.stats.streak}`);
  lines.push(`- Sessions This Week: ${data.stats.sessionsThisWeek}`);

  return lines.join("\n");
}

function buildWorkoutMarkdown(data, name) {
  const lines = [];
  const ctx = data.context;

  lines.push(`# APEX Workout Export — ${name}`);
  lines.push(`Exported: ${data.exportedAt}\n`);

  lines.push(`## Context`);
  lines.push(`- Phase ${ctx.currentPhase} · Tier ${ctx.tier} (${ctx.tierName})`);
  lines.push(`- Mesocycle Week ${ctx.mesoWeek}/${ctx.mesoLength} · ${ctx.progressionRate} progression`);
  lines.push(`- Schedule: ${ctx.daysPerWeek}x/week · ${ctx.sessionTime} min sessions`);
  if (ctx.cycleEmphasis) lines.push(`- Cycle Emphasis: ${ctx.cycleEmphasis}`);
  lines.push("");

  if (data.weeklyPlan) {
    lines.push(`## Weekly Plan (Week ${data.weeklyPlan.weekNumber}${data.weeklyPlan.isDeload ? " — DELOAD" : ""})`);
    (data.weeklyPlan.days || []).forEach(day => {
      lines.push(`\n### ${day.dayName} — ${day.label} (${day.type})`);
      if (day.description) lines.push(`*${day.description}*`);
      if (day.exercises?.length > 0) {
        lines.push(`| # | Exercise | Body Part | Pattern | Sets | Reps | RPE | Reason |`);
        lines.push(`|---|----------|-----------|---------|------|------|-----|--------|`);
        day.exercises.forEach((ex, i) => {
          lines.push(`| ${i + 1} | ${ex.name} | ${ex.bodyPart || "-"} | ${ex.movementPattern || "-"} | ${ex.sets || "-"} | ${ex.reps || "-"} | ${ex.rpe || "-"} | ${ex.reason || "-"} |`);
        });
      }
    });
    lines.push("");
  }

  if (data.todayWorkout) {
    const tw = data.todayWorkout;
    lines.push(`## Today's Generated Workout`);
    lines.push(`Location: ${tw.location || "gym"}\n`);

    const sections = [
      { label: "Foam Roll (Inhibit)", data: tw.blocks.inhibit },
      { label: "Mobility (Lengthen)", data: tw.blocks.lengthen },
      { label: "Warm-Up", data: tw.warmup },
      { label: "Main Exercises", data: tw.main },
      { label: "Cooldown Stretches", data: tw.blocks.cooldownStretches },
      { label: "Cardio", data: tw.blocks.cardio },
    ];

    sections.forEach(sec => {
      if (sec.data?.length > 0) {
        lines.push(`### ${sec.label} (${sec.data.length})`);
        sec.data.forEach((ex, i) => {
          const tags = [ex.stretch_type, ex.ptProtocol ? "PT" : null, ex.sportBiased ? `Sport: ${ex.sportBiased}` : null].filter(Boolean).join(", ");
          lines.push(`${i + 1}. **${ex.name}** — ${ex.bodyPart || ""}${ex.reason ? ` | ${ex.reason}` : ""}${tags ? ` [${tags}]` : ""}`);
        });
        lines.push("");
      }
    });

    if (tw.volSwaps?.length > 0) {
      lines.push(`### Volume Swaps`);
      tw.volSwaps.forEach(s => lines.push(`- ${s.original} → ${s.replacement}: ${s.reason}`));
      lines.push("");
    }

    if (Object.keys(tw.weeklyVol || {}).length > 0) {
      lines.push(`### Weekly Volume (sets)`);
      Object.entries(tw.weeklyVol).forEach(([bp, sets]) => {
        if (sets > 0) lines.push(`- ${bp}: ${sets} sets`);
      });
      lines.push("");
    }
  }

  if (data.ptProtocols?.length > 0) {
    lines.push(`## PT Protocols (${data.ptProtocols.length})`);
    data.ptProtocols.forEach(p => {
      lines.push(`- ${p.condition_key || p.conditionKey}: ${(p.exercises || []).length} exercises, ${p.frequency || "daily"}`);
    });
    lines.push("");
  }

  if (data.recentSessions?.length > 0) {
    lines.push(`## Recent Sessions (last ${data.recentSessions.length})`);
    data.recentSessions.forEach(s => {
      lines.push(`- ${s.date}: ${s.exerciseCount} exercises · ${s.durationMinutes || "?"}min${s.painFlagged > 0 ? ` · ${s.painFlagged} pain flags` : ""}`);
    });
  }

  return lines.join("\n");
}

// ═══════════════════════════════════════════════════════════════
// EXPORT 3: DEVELOPER / QA DIAGNOSTIC (full data dump)
// Accessible via ?export=dev URL param or Settings dev toggle
// ═══════════════════════════════════════════════════════════════

export function isDevExportEnabled() {
  try {
    if (window.location.search.includes("export=dev")) return true;
    return localStorage.getItem("apex_dev_mode") === "true";
  } catch { return false; }
}

export function exportDevDiagnostic() {
  const name = getUserName();
  const ds = datestamp();

  // ── Gather ALL localStorage data ────────────────────────────
  const allKeys = [
    "apex_assessment", "apex_injuries", "apex_injury_history", "apex_sessions",
    "apex_stats", "apex_prefs", "apex_baseline_tests", "apex_baseline_capabilities",
    "apex_power_records", "apex_exercise_progress", "apex_exercise_effort",
    "apex_cardio_sessions", "apex_vo2_tests", "apex_hr_settings",
    "apex_pt_protocols", "apex_pt_sessions", "apex_exercise_swaps",
    "apex_overtraining", "apex_cardio_prefs", "apex_hypertrophy_settings",
    "apex_weekly_plan", "apex_mesocycle", "apex_mesocycle_archive",
    "apex_weekly_volume", "apex_daily_workout", "apex_sport_prefs",
    "apex_stretch_tracker", "apex_paused_workout", "apex_user_profile",
    "apex_daily_progress", "apex_finger_health_log",
    "apex_last_fitness_reassessment",
  ];

  const rawData = {};
  for (const key of allKeys) { rawData[key] = safeGet(key); }

  // ── Progressive overload history (4 weeks per exercise) ─────
  const effortMap = safeGet("apex_exercise_effort") || {};
  const progressMap = safeGet("apex_exercise_progress") || {};
  const sessions = safeGet("apex_sessions") || [];
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const recentSessions = sessions.filter(s => new Date(s.date) >= fourWeeksAgo);

  const overloadHistory = {};
  for (const session of recentSessions) {
    for (const ec of (session.exercises_completed || [])) {
      const id = ec.exercise_id;
      if (!overloadHistory[id]) overloadHistory[id] = [];
      overloadHistory[id].push({
        date: session.date,
        sets: (ec.sets || []).map(s => ({ weight: s.weight, reps: s.reps, rpe: s.rpe })),
        painDuring: ec.pain_during || false,
      });
    }
  }

  // ── Feedback history (last 4 sessions full detail) ──────────
  const feedbackHistory = sessions.slice(-4).map(s => ({
    date: s.date, reflection: s.reflection || null, painFlagged: s.pain_flagged || [],
    exercisesCompleted: (s.exercises_completed || []).length,
    durationMinutes: s.durationMinutes || null, checkIn: s.checkIn || null,
  }));

  // ── Substitution chains ─────────────────────────────────────
  const swapHistory = safeGet("apex_exercise_swaps") || {};
  const dailyWorkout = safeGet("apex_daily_workout");
  const todaySwaps = [];
  if (dailyWorkout) {
    for (const ex of [...(dailyWorkout.main || []), ...(dailyWorkout.warmup || []), ...(dailyWorkout.cooldown || [])]) {
      if (ex._swappedFor) todaySwaps.push({ exercise: ex.name, exerciseId: ex.id, original: ex._swappedFor, reason: ex._swapReason || "location/availability" });
    }
  }

  // ── Condition intersection analysis ─────────────────────────
  const assessment = safeGet("apex_assessment") || {};
  const conditions = assessment.conditions || [];
  const conditionIntersections = [];
  if (conditions.length > 1) {
    for (let i = 0; i < conditions.length; i++) {
      for (let j = i + 1; j < conditions.length; j++) {
        const c1 = conditions[i], c2 = conditions[j];
        const overlap = { condition1: c1.name, condition2: c2.name, sameCategory: c1.category === c2.category,
          combinedSeverity: (c1.severity || 0) + (c2.severity || 0), sameArea: c1.bodyArea && c2.bodyArea && c1.bodyArea === c2.bodyArea };
        if (overlap.sameCategory || overlap.sameArea || overlap.combinedSeverity >= 6) conditionIntersections.push(overlap);
      }
    }
  }

  // ── Full exercise schemas for today's workout ───────────────
  const fullExerciseSchemas = {};
  if (dailyWorkout) {
    const allEx = [...(dailyWorkout.warmup || []), ...(dailyWorkout.main || []), ...(dailyWorkout.cooldown || []),
      ...(dailyWorkout.blocks?.inhibit || []), ...(dailyWorkout.blocks?.lengthen || []),
      ...(dailyWorkout.blocks?.cooldownStretches || []), ...(dailyWorkout.blocks?.cardio || [])];
    for (const ex of allEx) {
      fullExerciseSchemas[ex.id] = { ...ex, _selectionMeta: { reason: ex._reason, swappedFor: ex._swappedFor, swapReason: ex._swapReason,
        sportBiased: ex._sportBiased, ptProtocol: ex._ptProtocol, phase1Static: ex._phase1Static,
        compensationProtocol: ex._compensationProtocol, climbingProtocol: ex._climbingProtocol, duration: ex._duration } };
    }
  }

  const meso = safeGet("apex_mesocycle");
  const mesoArchive = safeGet("apex_mesocycle_archive") || [];

  const data = {
    exportedAt: new Date().toISOString(), exportType: "developer_diagnostic", version: "1.0",
    environment: { userAgent: navigator.userAgent, screen: `${window.innerWidth}x${window.innerHeight}`,
      keysUsed: allKeys.filter(k => rawData[k] !== null).length,
      storageSize: (() => { try { let t = 0; for (const k of allKeys) { const v = localStorage.getItem(k); if (v) t += v.length; } return `${Math.round(t / 1024)}KB`; } catch { return "unknown"; } })() },
    rawLocalStorage: rawData,
    todayExerciseSchemas: fullExerciseSchemas,
    progressiveOverloadHistory: overloadHistory,
    exerciseEffortMap: effortMap,
    exerciseProgressTracking: progressMap,
    feedbackHistory,
    substitutions: { todaySwaps, historicalSwaps: swapHistory },
    conditionIntersections,
    mesocycleFeedback: meso?.feedbackHistory || [],
    mesocycleArchive: mesoArchive.map(m => ({ id: m.id, phase: m.phase, tier: m.tier, tierName: m.tierName,
      mesoLength: m.mesoLength, weeksCompleted: m.weeksCompleted, sessionsCompleted: m.sessionsCompleted,
      cycleEmphasis: m.cycleEmphasis || null, feedbackHistory: m.feedbackHistory || [], archivedAt: m.archivedAt })),
    overtrainingMonitor: safeGet("apex_overtraining"),
    powerRecords: safeGet("apex_power_records") || {},
    todayVolumeSwaps: dailyWorkout?.volSwaps || [],
    todayWeeklyVol: dailyWorkout?.weeklyVol || {},
  };

  downloadFile(JSON.stringify(data, null, 2), `apex_dev_${name}_${ds}.json`);

  // ── Build developer markdown ────────────────────────────────
  const lines = [];
  lines.push(`# APEX Developer Diagnostic — ${name}`);
  lines.push(`Exported: ${data.exportedAt}`);
  lines.push(`Storage: ${data.environment.keysUsed} keys, ${data.environment.storageSize}\n`);

  if (conditionIntersections.length > 0) {
    lines.push(`## Condition Intersections (${conditionIntersections.length})`);
    conditionIntersections.forEach(ci => lines.push(`- **${ci.condition1}** × **${ci.condition2}** — Severity: ${ci.combinedSeverity}${ci.sameCategory ? " [same category]" : ""}${ci.sameArea ? " [same area]" : ""}`));
    lines.push("");
  }

  if (todaySwaps.length > 0) {
    lines.push(`## Today's Substitutions (${todaySwaps.length})`);
    todaySwaps.forEach(s => lines.push(`- ${s.original} → **${s.exercise}** | ${s.reason}`));
    lines.push("");
  }

  const ohEntries = Object.entries(overloadHistory).sort((a, b) => b[1].length - a[1].length).slice(0, 10);
  if (ohEntries.length > 0) {
    lines.push(`## Progressive Overload — 4 Weeks (top ${ohEntries.length})`);
    for (const [id, hist] of ohEntries) {
      const latest = hist[hist.length - 1], earliest = hist[0];
      const lMax = Math.max(0, ...(latest.sets || []).map(s => s.weight || 0));
      const eMax = Math.max(0, ...(earliest.sets || []).map(s => s.weight || 0));
      const pct = eMax > 0 ? Math.round(((lMax - eMax) / eMax) * 100) : 0;
      lines.push(`- **${id}**: ${hist.length} sessions | ${eMax}→${lMax}lbs (${pct >= 0 ? "+" : ""}${pct}%)${hist.some(h => h.painDuring) ? " ⚠️ pain" : ""}`);
    }
    lines.push("");
  }

  if (feedbackHistory.length > 0) {
    lines.push(`## Feedback — Last ${feedbackHistory.length} Sessions`);
    feedbackHistory.forEach(f => { const r = f.reflection || {}; lines.push(`- ${f.date}: diff=${r.difficulty || "?"} pain=${r.pain || "?"} enjoy=${r.enjoyment || "?"} form=${r.form_confidence || "?"}${f.painFlagged?.length ? ` | ${f.painFlagged.length} flags` : ""}`); });
    lines.push("");
  }

  const ot = data.overtrainingMonitor;
  if (ot) {
    lines.push(`## Overtraining Monitor`);
    lines.push(`- Level: ${ot.level || 0} | Severity: ${ot.severity || 0}`);
    (ot.signals || []).forEach(s => lines.push(`  - ${s.name || s.type || JSON.stringify(s)}`));
    lines.push("");
  }

  if (mesoArchive.length > 0) {
    lines.push(`## Mesocycle Archive (${mesoArchive.length})`);
    mesoArchive.forEach(m => lines.push(`- Phase ${m.phase} · T${m.tier} (${m.tierName}) · ${m.weeksCompleted || m.mesoLength}wk · ${m.sessionsCompleted || "?"}sess${m.cycleEmphasis ? ` [${m.cycleEmphasis}]` : ""}`));
    lines.push("");
  }

  const exCount = Object.keys(fullExerciseSchemas).length;
  if (exCount > 0) {
    lines.push(`## Today's Exercises — Full Schema (${exCount})`);
    for (const [id, ex] of Object.entries(fullExerciseSchemas)) {
      const m = ex._selectionMeta || {};
      lines.push(`### ${ex.name || id}`);
      lines.push(`- ID: \`${id}\` | Cat: ${ex.category} | Body: ${ex.bodyPart} | Pattern: ${ex.movementPattern} | Safety: ${ex.safetyTier || "green"}`);
      lines.push(`- Type: ${ex.type} | Stretch: ${ex.stretch_type || "n/a"} | Muscles: ${(ex.primaryMuscles || []).join(", ")}`);
      if (ex.contraindications) lines.push(`- Contraindications: \`${JSON.stringify(ex.contraindications)}\``);
      if (m.reason) lines.push(`- Why selected: ${m.reason}`);
      if (m.swappedFor) lines.push(`- Swapped for: ${m.swappedFor} (${m.swapReason || ""})`);
      if (m.sportBiased) lines.push(`- Sport: ${m.sportBiased}`);
      if (m.ptProtocol) lines.push(`- PT Protocol`);
      lines.push("");
    }
  }

  lines.push(`---\n*Full raw localStorage dump in companion JSON file.*`);
  downloadFile(lines.join("\n"), `apex_dev_${name}_${ds}.md`, "text/markdown");
}
