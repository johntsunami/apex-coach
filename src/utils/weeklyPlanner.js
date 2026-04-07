// ═══════════════════════════════════════════════════════════════
// APEX Coach — Weekly Planner & Exercise Rotation Engine
// Generates full weekly plans, enforces exercise variety across
// days, tracks rotation indices, 48-hour muscle recovery rule
// ═══════════════════════════════════════════════════════════════

import { getSessions, isTodayComplete } from "./storage.js";
import { getWeeklyVolume, getVolumeLimit, wouldExceedVolume, capExerciseParams, getTrainingWeek } from "./volumeTracker.js";
import { getAssessment } from "../components/Onboarding.jsx";
import { getInjuries, conditionToGateKey } from "./injuries.js";
import { getWeeklyCardioProgress } from "./cardioEngine.js";
import { getMesocycleContext, getOrCreateMesocycle, determineTrainingTier, TIERS } from "./mesocycle.js";
import { hasHypertrophyGoals, getReadyPhysiqueMuscles } from "./hypertrophy.js";

const LS_WEEKLY_PLAN = "apex_weekly_plan";
const LS_ROTATION = "apex_rotation_indices";

// ═══════════════════════════════════════════════════════════════
// 1. EXERCISE ROTATION POOLS — by movement pattern
// ═══════════════════════════════════════════════════════════════

const ROTATION_POOLS = {
  squat: [
    "goblet_squat", "bulgarian_split_squat", "step_up", "leg_press",
    "bodyweight_squat", "reverse_lunge", "lateral_lunge", "wall_squat",
    "split_squat", "front_squat", "hack_squat",
  ],
  horizontal_push: [
    "push_up", "landmine_press", "db_floor_press", "db_bench_press",
    "cable_chest_press", "incline_db_press", "machine_chest_press",
    "decline_push_up", "chest_dip",
  ],
  horizontal_pull: [
    "db_row", "seated_cable_row", "chest_supported_row", "inverted_row",
    "band_row", "machine_row", "face_pull", "trx_row",
  ],
  hinge: [
    "glute_bridge", "db_romanian_deadlift", "kettlebell_deadlift",
    "trap_bar_deadlift", "cable_pull_through", "hip_thrust",
    "back_extension", "single_leg_rdl", "good_morning",
  ],
  core: [
    "dead_bug", "plank", "pallof_press", "bird_dog", "side_plank",
    "ab_wheel", "cable_rotation", "mcgill_curl_up", "stir_the_pot",
    "farmers_carry",
  ],
  vertical_push: [
    "landmine_press_angled", "half_kneeling_db_press", "db_shoulder_press",
    "machine_shoulder_press", "arnold_press", "pike_push_up",
  ],
  vertical_pull: [
    "lat_pulldown", "band_assisted_pull_up", "cable_pullover",
    "straight_arm_pulldown", "pull_up", "chin_up",
  ],
};

// ═══════════════════════════════════════════════════════════════
// 2. TRAINING SPLITS — based on days per week
// ═══════════════════════════════════════════════════════════════

const SPLITS = {
  2: {
    label: "Full Body A/B",
    days: [
      { name: "Full Body A", focus: ["chest", "back", "legs", "core", "shoulders"], patterns: ["horizontal_push", "horizontal_pull", "squat", "hinge", "core"] },
      { name: "Full Body B", focus: ["chest", "back", "legs", "core", "shoulders"], patterns: ["vertical_push", "vertical_pull", "squat", "hinge", "core"] },
    ],
  },
  3: {
    label: "Full Body A/B/C",
    days: [
      { name: "Full Body A", focus: ["chest", "back", "legs", "core"], patterns: ["horizontal_push", "horizontal_pull", "squat", "hinge", "core"] },
      { name: "Full Body B", focus: ["shoulders", "back", "legs", "core"], patterns: ["vertical_push", "vertical_pull", "hinge", "squat", "core"] },
      { name: "Full Body C", focus: ["chest", "shoulders", "back", "legs", "core"], patterns: ["horizontal_push", "horizontal_pull", "vertical_push", "vertical_pull", "squat", "core"] },
    ],
  },
  4: {
    label: "Upper/Lower Split",
    days: [
      // Issue 6: 2 pulls per upper day for balanced push:pull ratio and adequate back volume
      { name: "Upper Body A", focus: ["chest", "back", "shoulders", "core"], patterns: ["horizontal_push", "horizontal_pull", "vertical_pull", "vertical_push", "core"] },
      { name: "Lower Body A", focus: ["legs", "glutes", "hips", "core"], patterns: ["squat", "hinge", "core"] },
      { name: "Upper Body B", focus: ["chest", "back", "shoulders", "core"], patterns: ["vertical_push", "vertical_pull", "horizontal_pull", "horizontal_push", "core"] },
      { name: "Lower Body B", focus: ["legs", "glutes", "hips", "core"], patterns: ["hinge", "squat", "core"] },
    ],
  },
  5: {
    label: "Push/Pull/Legs/Upper/Lower",
    days: [
      { name: "Push", focus: ["chest", "shoulders"], patterns: ["horizontal_push", "vertical_push", "core"] },
      { name: "Pull", focus: ["back"], patterns: ["horizontal_pull", "vertical_pull", "core"] },
      { name: "Legs", focus: ["legs", "glutes", "hips"], patterns: ["squat", "hinge", "core"] },
      { name: "Upper", focus: ["chest", "back", "shoulders"], patterns: ["horizontal_push", "horizontal_pull", "vertical_pull", "vertical_push", "core"] },
      { name: "Lower", focus: ["legs", "glutes", "hips", "core"], patterns: ["hinge", "squat", "core"] },
    ],
  },
  6: {
    label: "Push/Pull/Legs x2",
    days: [
      { name: "Push A", focus: ["chest", "shoulders"], patterns: ["horizontal_push", "vertical_push", "core"] },
      { name: "Pull A", focus: ["back"], patterns: ["horizontal_pull", "vertical_pull", "core"] },
      { name: "Legs A", focus: ["legs", "glutes", "hips"], patterns: ["squat", "hinge", "core"] },
      { name: "Push B", focus: ["chest", "shoulders"], patterns: ["horizontal_push", "vertical_push", "core"] },
      { name: "Pull B", focus: ["back"], patterns: ["horizontal_pull", "vertical_pull", "core"] },
      { name: "Legs B", focus: ["legs", "glutes", "hips"], patterns: ["hinge", "squat", "core"] },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════
// 3. WEEKLY PLAN GENERATION
// ═══════════════════════════════════════════════════════════════

function getWeekStartDate(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon
  const diff = day === 0 ? 6 : day - 1; // Monday = start of week
  d.setDate(d.getDate() - diff);
  return d.toISOString().split("T")[0];
}

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

function getDayOfWeek() {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1; // 0=Mon, 6=Sun
}

// Get rotation indices — advances per week for variety
function getRotationIndices() {
  try {
    const raw = localStorage.getItem(LS_ROTATION);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveRotationIndices(indices) {
  try { localStorage.setItem(LS_ROTATION, JSON.stringify(indices)); } catch {}
}

function advanceRotation(pattern, poolSize) {
  const indices = getRotationIndices();
  const current = indices[pattern] || 0;
  indices[pattern] = (current + 1) % poolSize;
  saveRotationIndices(indices);
  return indices[pattern];
}

// Match a rotation pool ID to an actual exercise in the DB
function resolveExercise(poolId, exerciseDB, phase, location, excludeIds, injuries) {
  // Try exact ID match first
  let ex = exerciseDB.find(e => e.id === poolId);
  if (ex && canUseExercise(ex, phase, location, excludeIds, injuries)) return ex;

  // Try fuzzy name match (pool IDs use underscores, exercise IDs may differ)
  const fuzzy = poolId.replace(/_/g, " ").toLowerCase();
  ex = exerciseDB.find(e =>
    e.name?.toLowerCase().replace(/[-_]/g, " ").includes(fuzzy) &&
    canUseExercise(e, phase, location, excludeIds, injuries)
  );
  if (ex) return ex;

  return null;
}

function canUseExercise(ex, phase, location, excludeIds, injuries) {
  if (!ex) return false;
  if (excludeIds?.has(ex.id)) return false;
  if (!(ex.phaseEligibility || []).includes(phase)) return false;
  if (ex.safetyTier === "red") return false;

  // Location filter
  if (location !== "gym") {
    const equip = ex.equipment || [];
    const needsGym = equip.some(e => ["barbell", "cable", "machine", "smith_machine", "leg_press"].includes(e));
    if (needsGym && location === "home") return false;
    if (needsGym && location === "outdoor") return false;
  }

  // Injury gate check
  if (injuries && injuries.length > 0) {
    const gates = ex.contraindications?.severity_gate || {};
    for (const inj of injuries) {
      const gateKey = conditionToGateKey ? conditionToGateKey(inj.condition_key || inj.area || "") : (inj.area || "").toLowerCase().replace(/\s+/g, "_");
      if (gates[gateKey] !== undefined && inj.severity > gates[gateKey]) return false;
    }
  }

  return true;
}

// ── ISSUE 1: Difficulty ceiling — exercises too easy for late phases are BLOCKED ──
function getMaxPhaseForDifficulty(difficulty) {
  return { 1: 2, 2: 3, 3: 4, 4: 5, 5: 5 }[difficulty] || 5;
}

// ⚠️ DUAL PATH: This is the plan view exercise selection path.
// App.jsx buildWorkoutList() is the daily workout path.
// Both must apply the same rules: difficulty ceiling, core param exemptions,
// isolation (Phase 3+), plyometric (Phase 5), within-week dedup, double pulls.
// Any fix to exercise selection must be applied to BOTH files.

// Select exercises for a single training day from rotation pools
function selectDayExercises(dayTemplate, exerciseDB, phase, location, usedThisWeek, dayIndex, injuries) {
  const selected = [];
  const usedIds = new Set();
  const indices = getRotationIndices();
  const assessment = getAssessment();
  const blacklist = new Set(assessment?.preferences?.blacklist || []);

  for (const pattern of dayTemplate.patterns) {
    const pool = ROTATION_POOLS[pattern] || [];
    if (pool.length === 0) continue;

    // Start from current rotation index for this pattern, offset by dayIndex for variety across days
    const baseIdx = (indices[pattern] || 0);
    let found = false;

    for (let attempt = 0; attempt < pool.length; attempt++) {
      const rotIdx = (baseIdx + dayIndex + attempt) % pool.length;
      const poolId = pool[rotIdx];

      // Skip if already used on another day this week (consecutive day check)
      if (usedThisWeek.has(poolId)) continue;

      const ex = resolveExercise(poolId, exerciseDB, phase, location, usedIds, injuries);
      if (!ex) continue;
      if (blacklist.has(ex.id)) continue;
      // Issue 1: difficulty ceiling — skip exercises too easy for this phase
      // EXEMPT core/stabilization — they always appear with stabilization params (Issue 2)
      if (ex.bodyPart !== "core" && ex.type !== "stabilization" && phase > getMaxPhaseForDifficulty(ex.difficultyLevel || 3)) continue;

      // Check volume
      const volCheck = wouldExceedVolume(ex, {}, phase);
      if (volCheck.exceeded) continue;

      selected.push({ ...ex, _rotationPattern: pattern, _rotationPoolId: poolId });
      usedIds.add(ex.id);
      found = true;
      break;
    }

    // Fallback: if no pool exercise matched, pick any DB exercise for this pattern
    if (!found) {
      const patternMap = {
        horizontal_push: ["push", "horizontal_push"],
        horizontal_pull: ["pull", "horizontal_pull"],
        vertical_push: ["vertical_push", "push"],
        vertical_pull: ["vertical_pull", "pull"],
        squat: ["squat"],
        hinge: ["hinge", "hip_hinge"],
        core: ["core", "anti_extension", "anti_rotation"],
      };
      const matchPatterns = patternMap[pattern] || [pattern];
      const _fallbackFilter = (e, checkCeiling) =>
        e.category === "main" &&
        !usedIds.has(e.id) &&
        !usedThisWeek.has(e.id) &&
        !blacklist.has(e.id) &&
        (e.phaseEligibility || []).includes(phase) &&
        e.safetyTier !== "red" &&
        // Difficulty ceiling exempt for core/stabilization (Issue 2 handles their params)
        (!checkCeiling || e.bodyPart === "core" || e.type === "stabilization" || phase <= getMaxPhaseForDifficulty(e.difficultyLevel || 3)) &&
        matchPatterns.some(p => (e.movementPattern || "").toLowerCase().includes(p)) &&
        canUseExercise(e, phase, location, usedIds, injuries);
      // Try with difficulty ceiling first
      let fallback = exerciseDB.find(e => _fallbackFilter(e, true));
      // If no candidates pass ceiling, fall back to highest-difficulty available
      if (!fallback) {
        const noCeiling = exerciseDB.filter(e => _fallbackFilter(e, false)).sort((a, b) => (b.difficultyLevel || 1) - (a.difficultyLevel || 1));
        if (noCeiling.length > 0) {
          console.log(`[WARNING] No exercises for ${pattern} in Phase ${phase} after difficulty filter — using ${noCeiling[0].name} (diff ${noCeiling[0].difficultyLevel})`);
          fallback = noCeiling[0];
        }
      }
      if (fallback) {
        selected.push({ ...fallback, _rotationPattern: pattern });
        usedIds.add(fallback.id);
      }
    }
  }

  // Add isolation exercises for the day's focus muscles
  // Issue 3: Phase 3+ MUST include at least 1-2 isolation exercises
  // Fix: check movementPattern === "isolation" (not type — DB uses type: "strength" for these)
  // Also check usedThisWeek for within-week dedup
  const isoLimit = phase >= 3 ? 2 : dayTemplate.focus.length >= 4 ? 2 : 1;
  let isoCount = 0;
  for (const bodyPart of dayTemplate.focus) {
    if (isoCount >= isoLimit) break;
    const iso = exerciseDB.find(e =>
      e.category === "main" &&
      (e.movementPattern === "isolation" || e.type === "isolation") &&
      e.bodyPart === bodyPart &&
      !usedIds.has(e.id) &&
      !usedThisWeek.has(e.id) &&
      !blacklist.has(e.id) &&
      (e.phaseEligibility || []).includes(phase) &&
      (e.bodyPart === "core" || e.type === "stabilization" || phase <= getMaxPhaseForDifficulty(e.difficultyLevel || 3)) &&
      canUseExercise(e, phase, location, usedIds, injuries)
    );
    if (iso) {
      selected.push({ ...iso, _reason: `Isolation work for ${bodyPart}` });
      usedIds.add(iso.id);
      isoCount++;
    }
  }

  // ── Physique-priority isolation injection (NASM OPT gated) ──
  // Adds targeted isolation for physique category + weak point muscles
  // only when the body meets readiness criteria per NASM/PT guidelines
  try {
    if (hasHypertrophyGoals()) {
      const completedSessions = getSessions().length;
      const { week: mesoWeek } = getTrainingWeek();
      const readyMuscles = getReadyPhysiqueMuscles(assessment, phase, mesoWeek, completedSessions, injuries);

      if (readyMuscles.length > 0) {
        // Expand day focus to include sub-muscles relevant to today's training
        const relevantMuscles = new Set();
        for (const focus of dayTemplate.focus) {
          relevantMuscles.add(focus);
          if (focus === "shoulders") { relevantMuscles.add("side_delts"); relevantMuscles.add("rear_delts"); relevantMuscles.add("front_delts"); relevantMuscles.add("traps"); }
          if (focus === "back") { relevantMuscles.add("back_width"); relevantMuscles.add("back_thickness"); relevantMuscles.add("biceps"); }
          if (focus === "chest") { relevantMuscles.add("triceps"); }
          if (focus === "legs") { relevantMuscles.add("quads"); relevantMuscles.add("hamstrings"); relevantMuscles.add("calves"); }
          if (focus === "glutes" || focus === "hips") relevantMuscles.add("glutes");
          if (focus === "core") relevantMuscles.add("abs");
        }

        const maxPhysiqueIso = phase >= 2 ? 2 : 1;
        let physiqueAdded = 0;

        for (const pm of readyMuscles) {
          if (physiqueAdded >= maxPhysiqueIso) break;

          // Only inject for muscles relevant to today's split day
          if (!relevantMuscles.has(pm.muscle) && !relevantMuscles.has(pm.bodyPart)) continue;

          // Skip if body part already has isolation (unless double-priority: weak + category)
          const alreadyHasIso = selected.some(e =>
            e.bodyPart === pm.bodyPart && (e.type === "isolation" || (e._reason || "").includes("Isolation") || (e._reason || "").includes("Physique"))
          );
          if (alreadyHasIso && pm.priority < 3) continue;

          // Base eligibility filter (includes usedThisWeek for within-week dedup)
          const baseFilter = (e) =>
            !usedIds.has(e.id) &&
            !usedThisWeek.has(e.id) &&
            !blacklist.has(e.id) &&
            e.bodyPart === pm.bodyPart &&
            e.safetyTier !== "red" &&
            (pm.maxSafetyTier !== "green" || e.safetyTier === "green" || !e.safetyTier) &&
            (e.phaseEligibility || []).includes(phase) &&
            canUseExercise(e, phase, location, usedIds, injuries);

          // Prefer hint-matched exercises (muscle specificity: lateral raise for side delts, not face pulls)
          let candidate = exerciseDB.find(e => {
            if (!baseFilter(e)) return false;
            const searchText = ((e.name || "") + " " + (e.id || "") + " " + ((e.tags || []).join(" "))).toLowerCase();
            return pm.hints.some(h => searchText.includes(h));
          });

          // Fallback: any isolation exercise for the body part
          if (!candidate) {
            candidate = exerciseDB.find(e =>
              baseFilter(e) &&
              (e.movementPattern === "isolation" || e.type === "isolation" || (e.tags || []).includes("isolation"))
            );
          }

          if (candidate) {
            const volCheck = wouldExceedVolume(candidate, {}, phase);
            if (volCheck.exceeded) continue;

            const reason = `Physique priority: ${pm.muscle.replace(/_/g, " ")}` +
              (pm.isWeakPoint ? " (weak point)" : "") +
              (pm.isCategoryPriority ? ` (${(assessment?.physiqueCategory || "").replace(/_/g, " ")} emphasis)` : "");

            selected.push({ ...candidate, _reason: reason });
            usedIds.add(candidate.id);
            physiqueAdded++;
          }
        }
      }
    }
  } catch (err) {
    console.warn("Physique isolation injection skipped:", err.message);
  }

  // ── Issue 4: Phase 5 MUST include at least 1 plyometric/explosive exercise ──
  // Cap at 2 plyometric appearances per week to prevent overuse injury
  if (phase >= 5) {
    const hasPlyo = selected.some(e => e.type === "plyometric");
    if (!hasPlyo) {
      const plyoCandidate = exerciseDB
        .filter(e =>
          e.type === "plyometric" &&
          !usedIds.has(e.id) &&
          !usedThisWeek.has(e.id) &&
          !blacklist.has(e.id) &&
          (e.phaseEligibility || []).includes(phase) &&
          canUseExercise(e, phase, location, usedIds, injuries)
        )
        .sort((a, b) => (b.difficultyLevel || 1) - (a.difficultyLevel || 1));
      if (plyoCandidate.length > 0) {
        selected.push({ ...plyoCandidate[0], _reason: "Phase 5 plyometric/explosive requirement" });
        usedIds.add(plyoCandidate[0].id);
      } else {
        console.log("[WARNING] No plyometric exercises available for Phase 5 — check injury gates and database");
      }
    }
  }

  return selected;
}

// Generate a full 7-day weekly plan
export function generateWeeklyPlan(exerciseDB, phase = 1, defaultLocation = "gym") {
  const assessment = getAssessment();
  const daysPerWeek = assessment?.preferences?.daysPerWeek || 3;
  const split = SPLITS[daysPerWeek] || SPLITS[3];
  const injuries = getInjuries().filter(i => i.status !== "resolved");

  // ── MESOCYCLE INTEGRATION ──
  let mesoCtx = null;
  try { mesoCtx = getMesocycleContext(phase); } catch (e) { console.warn("Mesocycle context unavailable:", e); }
  const tierInfo = mesoCtx?.mesocycle ? { tier: mesoCtx.mesocycle.tier, name: mesoCtx.mesocycle.tierName } : null;
  const weekParams = mesoCtx?.weekParams || null;
  const injAdj = mesoCtx?.injuryAdjustments || null;

  // Determine which calendar days are training days
  const trainingDayIndices = getTrainingDayIndices(daysPerWeek);

  const weekPlan = {
    weekStart: getWeekStartDate(),
    generatedAt: new Date().toISOString(),
    split: split.label,
    daysPerWeek,
    phase,
    days: [], // 7 entries, one per day (Mon-Sun)
    // Mesocycle metadata
    tier: tierInfo?.tier || null,
    tierName: tierInfo?.name || null,
    mesoWeek: mesoCtx?.mesocycle?.currentWeek || null,
    mesoLength: mesoCtx?.mesocycle?.mesoLength || null,
    weekLabel: weekParams?.label || null,
    isDeload: weekParams?.isDeload || false,
    setsPerExercise: weekParams?.sets || null,
    rpeRange: weekParams ? `RPE ${weekParams.rpeMin}-${weekParams.rpeMax}` : null,
    tierMessage: mesoCtx?.mesocycle?.config?.message || null,
  };

  const usedExercisesThisWeek = new Set(); // Issue 5: track ALL exercises across the week (not just prev day)

  for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
    const trainingIdx = trainingDayIndices.indexOf(dayOfWeek);

    if (trainingIdx === -1) {
      // Rest day
      weekPlan.days.push({
        dayOfWeek,
        dayName: DAY_NAMES[dayOfWeek],
        type: "rest",
        label: "Rest Day",
        description: (() => {
          const base = weekPlan.isDeload
            ? "Deload week — extra recovery. Light walking and stretching."
            : "Recovery — ROM, walking, gentle stretching recommended";
          try {
            const cp = getWeeklyCardioProgress(phase);
            if (cp && cp.deficit > 15) return base + ` | Cardio suggestion: 20 min walk (${cp.deficit} min remaining this week)`;
          } catch {}
          return base;
        })(),
        exercises: [],
        muscleGroups: [],
        estimatedMinutes: 0,
        status: "not_started",
      });
      // Issue 5: do NOT clear — maintain full-week dedup even across rest days
      continue;
    }

    const template = split.days[trainingIdx];
    const mainExercises = selectDayExercises(
      template, exerciseDB, phase, defaultLocation,
      usedExercisesThisWeek, trainingIdx, injuries
    );

    // ── Filter exercises through mesocycle injury adjustments ──
    // Sets get serialized to {} via JSON.stringify(localStorage) — safely convert back
    const _toIterable = (v) => v instanceof Set ? v : Array.isArray(v) ? v : (v && typeof v === "object") ? Object.keys(v) : [];
    const _toSet = (v) => v instanceof Set ? v : new Set(_toIterable(v));
    let filteredExercises = mainExercises;
    if (injAdj) {
      const _blockedIds = _toIterable(injAdj.blockedExerciseIds);
      const _blockedCats = _toSet(injAdj.blockedCategories);
      const _blockedPats = _toIterable(injAdj.blockedPatterns);
      filteredExercises = mainExercises.filter(ex => {
        // Check blocked exercise IDs (fuzzy match by name parts)
        const exNameLower = (ex.name || "").toLowerCase().replace(/[-_\s]/g, "");
        for (const blocked of _blockedIds) {
          if (exNameLower.includes(blocked.replace(/[-_\s]/g, "")) || ex.id === blocked) return false;
        }
        // Check blocked categories
        if (_blockedCats.has(ex.category)) return false;
        // Check blocked movement patterns
        const mp = (ex.movementPattern || "").toLowerCase();
        for (const bp of _blockedPats) {
          if (mp.includes(bp) || (ex.name || "").toLowerCase().includes(bp)) return false;
        }
        // Check safety tier restrictions
        if (weekParams?.safetyTiers && ex.safetyTier && !weekParams.safetyTiers.includes(ex.safetyTier)) return false;
        // Check compounds allowed
        if (!weekParams?.compoundsAllowed && ex.type === "compound") return false;
        return true;
      });
    }

    // Estimate time (use mesocycle warmup minutes if available)
    const warmupMin = weekParams?.warmupMinutes || 8;
    const estMin = filteredExercises.length * 4 + warmupMin;

    weekPlan.days.push({
      dayOfWeek,
      dayName: DAY_NAMES[dayOfWeek],
      type: "training",
      label: template.name,
      description: `${template.focus.join(", ")} focus`,
      exercises: filteredExercises.map(e => ({
        id: e.id,
        name: e.name,
        bodyPart: e.bodyPart,
        movementPattern: e.movementPattern,
        _rotationPattern: e._rotationPattern,
        _reason: e._reason,
      })),
      muscleGroups: [...new Set(filteredExercises.map(e => e.bodyPart).filter(Boolean))],
      estimatedMinutes: estMin,
      status: "not_started",
      patterns: template.patterns,
      focus: template.focus,
      // Per-day mesocycle params
      sets: weekParams?.sets || null,
      rpeMin: weekParams?.rpeMin || null,
      rpeMax: weekParams?.rpeMax || null,
    });

    // Issue 5: track used exercises for full-week dedup (no clearing between days)
    filteredExercises.forEach(e => {
      usedExercisesThisWeek.add(e.id);
      if (e._rotationPoolId) usedExercisesThisWeek.add(e._rotationPoolId);
    });
  }

  // Advance rotation indices for next week
  for (const pattern of Object.keys(ROTATION_POOLS)) {
    advanceRotation(pattern, ROTATION_POOLS[pattern].length);
  }

  return weekPlan;
}

// Determine which days of the week are training days (0=Mon, 6=Sun)
function getTrainingDayIndices(daysPerWeek) {
  switch (daysPerWeek) {
    case 2: return [0, 3]; // Mon, Thu
    case 3: return [0, 2, 4]; // Mon, Wed, Fri
    case 4: return [0, 1, 3, 4]; // Mon, Tue, Thu, Fri
    case 5: return [0, 1, 2, 3, 4]; // Mon-Fri
    case 6: return [0, 1, 2, 3, 4, 5]; // Mon-Sat
    default: return [0, 2, 4]; // Default 3 days
  }
}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// ═══════════════════════════════════════════════════════════════
// 4. WEEKLY PLAN STORAGE & RETRIEVAL
// ═══════════════════════════════════════════════════════════════

export function getWeeklyPlan() {
  try {
    const raw = localStorage.getItem(LS_WEEKLY_PLAN);
    if (!raw) return null;
    const plan = JSON.parse(raw);
    // Check if plan is for current week
    if (plan.weekStart !== getWeekStartDate()) return null;
    return plan;
  } catch { return null; }
}

export function saveWeeklyPlan(plan) {
  try { localStorage.setItem(LS_WEEKLY_PLAN, JSON.stringify(plan)); } catch {}
}

export function getOrCreateWeeklyPlan(exerciseDB, phase, location) {
  let plan = getWeeklyPlan();
  if (!plan) {
    plan = generateWeeklyPlan(exerciseDB, phase, location);
    saveWeeklyPlan(plan);
  }
  return plan;
}

// Archive previous week's plan for history
export function archiveWeeklyPlan(plan) {
  try {
    const key = "apex_weekly_plan_archive";
    const raw = localStorage.getItem(key);
    const archive = raw ? JSON.parse(raw) : [];
    archive.push({ ...plan, archivedAt: new Date().toISOString() });
    // Keep last 12 weeks
    while (archive.length > 12) archive.shift();
    localStorage.setItem(key, JSON.stringify(archive));
  } catch {}
}

// ═══════════════════════════════════════════════════════════════
// 5. TODAY'S PLAN FROM WEEKLY CONTEXT
// ═══════════════════════════════════════════════════════════════

export function getTodayFromPlan(plan) {
  if (!plan) return null;
  const dow = getDayOfWeek();
  return plan.days[dow] || null;
}

export function getTomorrowFromPlan(plan) {
  if (!plan) return null;
  const dow = (getDayOfWeek() + 1) % 7;
  return plan.days[dow] || null;
}

// Mark today's workout status in the weekly plan
export function updateDayStatus(plan, dayOfWeek, status) {
  if (!plan || !plan.days[dayOfWeek]) return plan;
  plan.days[dayOfWeek].status = status;
  plan.days[dayOfWeek].completedAt = status === "completed" ? new Date().toISOString() : null;
  saveWeeklyPlan(plan);
  return plan;
}

// ═══════════════════════════════════════════════════════════════
// 6. CHECK-IN MODIFICATIONS (adjust, don't rebuild)
// ═══════════════════════════════════════════════════════════════

export function adjustPlanForCheckIn(dayPlan, checkInData, exerciseDB, phase) {
  if (!dayPlan || dayPlan.type !== "training") return dayPlan;

  const adjustments = [];
  const adjusted = { ...dayPlan, exercises: [...dayPlan.exercises] };

  // High soreness → swap exercises for sore areas
  const sharpPain = (checkInData.soreness || []).filter(area =>
    checkInData.painTypes?.[area] === "sharp"
  );
  if (sharpPain.length > 0) {
    const painAreas = new Set(sharpPain.map(a => a.toLowerCase()));
    adjusted.exercises = adjusted.exercises.filter(ex => {
      const bp = (ex.bodyPart || "").toLowerCase();
      if (painAreas.has(bp) || painAreas.has(bp.replace(/\s+/g, ""))) {
        adjustments.push(`Removed ${ex.name} — sharp pain in ${bp}`);
        return false;
      }
      return true;
    });
  }

  // Low energy → flag for reduced sets/reps (handled by buildWorkoutList)
  if (checkInData.energy <= 3) {
    adjustments.push("Low energy — sets and volume will be reduced");
  }

  // Location change → swap equipment-dependent exercises
  if (checkInData.location && checkInData.location !== "gym") {
    const injuries = getInjuries().filter(i => i.status !== "resolved");
    adjusted.exercises = adjusted.exercises.map(ex => {
      const fullEx = exerciseDB.find(e => e.id === ex.id);
      if (!fullEx) return ex;
      if (!canUseExercise(fullEx, phase, checkInData.location, new Set(), injuries)) {
        // Find alternative for same movement pattern
        const alt = exerciseDB.find(e =>
          e.category === "main" &&
          e.id !== ex.id &&
          (e.movementPattern || "").toLowerCase().includes((ex.movementPattern || "").toLowerCase()) &&
          canUseExercise(e, phase, checkInData.location, new Set(), injuries)
        );
        if (alt) {
          adjustments.push(`Swapped ${ex.name} for ${alt.name} (${checkInData.location} adaptation)`);
          return { id: alt.id, name: alt.name, bodyPart: alt.bodyPart, movementPattern: alt.movementPattern, _swappedFor: ex.name };
        }
      }
      return ex;
    });
  }

  adjusted._adjustments = adjustments;
  return adjusted;
}

// ═══════════════════════════════════════════════════════════════
// 7. 48-HOUR MUSCLE RECOVERY CHECK
// ═══════════════════════════════════════════════════════════════

export function checkMuscleRecovery(dayPlan, sessions) {
  if (!dayPlan || dayPlan.type !== "training") return { ok: true, warnings: [] };

  const warnings = [];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().split("T")[0];

  // Find yesterday's session
  const yesterdaySession = sessions.find(s => s.date?.split("T")[0] === yesterdayKey);
  if (!yesterdaySession) return { ok: true, warnings: [] };

  // Get muscle groups trained yesterday
  const yesterdayMuscles = new Set();
  (yesterdaySession.exercises_completed || []).forEach(ec => {
    if (ec.bodyPart) yesterdayMuscles.add(ec.bodyPart);
  });

  // Check overlap (except core and calves — can be daily per NASM/NSCA)
  const dailyOk = new Set(["core", "calves"]);
  for (const muscle of dayPlan.muscleGroups || []) {
    if (dailyOk.has(muscle)) continue;
    if (yesterdayMuscles.has(muscle)) {
      warnings.push(`${muscle} was trained yesterday — consider lighter volume or swapping`);
    }
  }

  return { ok: warnings.length === 0, warnings };
}

// ═══════════════════════════════════════════════════════════════
// 8. ADD-ON SESSION TYPES (post-completion options)
// ═══════════════════════════════════════════════════════════════

export const ADDON_TYPES = [
  { id: "rom", label: "Extra ROM Session", icon: "🧘", duration: "15 min", description: "Extended mobility and range of motion work" },
  { id: "pt", label: "Bonus PT Protocol", icon: "🩺", duration: "15 min", description: "Extra rehab and prehab exercises" },
  { id: "foam", label: "Foam Rolling Recovery", icon: "🧽", duration: "10 min", description: "Full body myofascial release" },
  { id: "cardio", label: "Cardio Add-On", icon: "🫀", duration: "20-30 min", description: "Low-intensity steady state or interval work" },
  { id: "stretch", label: "Stretching Session", icon: "🤸", duration: "15 min", description: "Full body static stretching for flexibility" },
];

// ═══════════════════════════════════════════════════════════════
// 9. WEEKLY PLAN COMPARISON (this week vs last)
// ═══════════════════════════════════════════════════════════════

export function getWeekComparison() {
  try {
    const key = "apex_weekly_plan_archive";
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const archive = JSON.parse(raw);
    if (archive.length === 0) return null;
    const lastWeek = archive[archive.length - 1];
    const thisWeek = getWeeklyPlan();
    if (!thisWeek || !lastWeek) return null;

    const lastTrainingDays = lastWeek.days.filter(d => d.type === "training" && d.status === "completed").length;
    const thisCompleted = thisWeek.days.filter(d => d.type === "training" && d.status === "completed").length;

    return {
      lastWeekCompleted: lastTrainingDays,
      thisWeekCompleted: thisCompleted,
      thisWeekTotal: thisWeek.days.filter(d => d.type === "training").length,
    };
  } catch { return null; }
}

// ═══════════════════════════════════════════════════════════════
// 10. REGENERATION TRIGGERS
// ═══════════════════════════════════════════════════════════════

export function shouldRegeneratePlan(plan) {
  if (!plan) return true;
  // Different week
  if (plan.weekStart !== getWeekStartDate()) return true;
  // Phase changed
  const assessment = getAssessment();
  const currentPhase = assessment?.currentPhase || 1;
  if (plan.phase !== currentPhase) return true;
  // Training days changed
  const daysPerWeek = assessment?.preferences?.daysPerWeek || 3;
  if (plan.daysPerWeek !== daysPerWeek) return true;

  return false;
}

// Force regenerate and archive old plan
export function regenerateWeeklyPlan(exerciseDB, phase, location) {
  const old = getWeeklyPlan();
  if (old) archiveWeeklyPlan(old);
  const plan = generateWeeklyPlan(exerciseDB, phase, location);
  saveWeeklyPlan(plan);
  return plan;
}

export { SPLITS, ROTATION_POOLS, DAY_NAMES, getWeekStartDate, getDayOfWeek };
