// ═══════════════════════════════════════════════════════════════
// APEX Coach — Weekly Planner & Exercise Rotation Engine
// Generates full weekly plans, enforces exercise variety across
// days, tracks rotation indices, 48-hour muscle recovery rule
// ═══════════════════════════════════════════════════════════════

import { getSessions, isTodayComplete } from "./storage.js";
import { getWeeklyVolume, getVolumeLimit, wouldExceedVolume, capExerciseParams, getTrainingWeek } from "./volumeTracker.js";
import { getAssessment } from "../components/Onboarding.jsx";
import { getInjuries, conditionToGateKey } from "./injuries.js";
import conditionsDB from "../data/conditions.json";
import { isExerciseAllowedByPostOp, getCombinedPostOpRestrictions } from "./postOpTimeline.js";
import { checkExerciseSafety } from "./safetyGate.js";
import { getWeeklyCardioProgress } from "./cardioEngine.js";
import { getMesocycleContext, getOrCreateMesocycle, determineTrainingTier, TIERS } from "./mesocycle.js";
import { applySafeguards } from "./safeguards.js";
import { hasHypertrophyGoals, getReadyPhysiqueMuscles, CATEGORY_EMPHASIS } from "./hypertrophy.js";
import { prioritizeBySport, getSportPreventionExercises } from "./programTracks.js";
import { getSportPrefs } from "./storage.js";

const LS_WEEKLY_PLAN = "apex_weekly_plan";
const LS_ROTATION = "apex_rotation_indices";

// ═══════════════════════════════════════════════════════════════
// 1. EXERCISE ROTATION POOLS — by movement pattern
// ═══════════════════════════════════════════════════════════════

const ROTATION_POOLS = {
  squat: [
    "str_goblet_squat", "str_bss_bw", "str_step_up", "mach_leg_press",
    "str_bodyweight_squat", "str_reverse_lunge", "str_lateral_lunge",
    "str_bss_loaded", "str_front_squat",
  ],
  horizontal_push: [
    // ACTUAL exercise IDs from the DB — chest-dominant exercises
    "str_floor_push_up", "str_incline_push_up", "str_db_floor_press",
    "str_db_bench_press", "band_chest_press", "bb_bench_press",
    "bb_incline_press", "cable_fly_low", "trx_pushup",
  ],
  horizontal_pull: [
    "str_db_row", "mach_seated_cable_row", "str_chest_supported_row",
    "str_inverted_row", "band_row", "mach_cable_row",
    "iso_face_pulls", "trx_row",
  ],
  hinge: [
    "str_glute_bridge", "str_db_rdl", "kb_deadlift",
    "str_trap_bar_dl_high", "cable_pull_through", "band_hip_thrust",
    "sport_barbell_hip_thrust", "sl_rdl_bw", "str_sl_glute_bridge",
  ],
  // Glute-dominant pool — used by lower body days to guarantee glute work
  glute: [
    "sport_barbell_hip_thrust", "cable_pull_through", "band_hip_thrust",
    "str_sl_glute_bridge", "str_glute_bridge",
  ],
  core: [
    "stab_dead_bug", "stab_plank_prone", "stab_pallof_press",
    "stab_bird_dog", "stab_side_plank", "core_ab_wheel",
    "cable_rotation", "stab_mcgill_curl", "stab_stir_pot",
    "str_farmers_carry",
  ],
  vertical_push: [
    "str_landmine_press", "str_half_kneel_db_press", "str_db_shoulder_press",
    "mach_shoulder_press", "str_arnold_press", "str_pike_push_up",
  ],
  vertical_pull: [
    "mach_lat_pulldown", "band_assisted_pullup", "cable_pullover",
    "mach_straight_arm_pulldown", "str_pull_up", "str_chin_up",
  ],
};

// ═══════════════════════════════════════════════════════════════
// 2. TRAINING SPLITS — based on days per week
// ═══════════════════════════════════════════════════════════════

// Core exercises moved to warm-up activation (NASM CEx: Activate phase).
// Freed slot replaced with additional body-part exercise per day focus.
const SPLITS = {
  2: {
    label: "Full Body A/B",
    days: [
      { name: "Full Body A", focus: ["chest", "back", "legs", "shoulders"], patterns: ["horizontal_push", "horizontal_pull", "squat", "hinge", "vertical_pull"] },
      { name: "Full Body B", focus: ["chest", "back", "legs", "shoulders"], patterns: ["vertical_push", "vertical_pull", "squat", "hinge", "horizontal_push"] },
    ],
  },
  3: {
    label: "Full Body A/B/C",
    days: [
      { name: "Full Body A", focus: ["chest", "back", "legs", "shoulders"], patterns: ["horizontal_push", "horizontal_pull", "squat", "hinge", "vertical_pull"] },
      { name: "Full Body B", focus: ["shoulders", "back", "legs", "chest"], patterns: ["vertical_push", "vertical_pull", "hinge", "squat", "horizontal_push"] },
      { name: "Full Body C", focus: ["chest", "shoulders", "back", "legs"], patterns: ["horizontal_push", "horizontal_pull", "vertical_push", "vertical_pull", "squat"] },
    ],
  },
  4: {
    label: "Upper/Lower Split",
    days: [
      { name: "Upper Body A", focus: ["chest", "back", "shoulders"], patterns: ["horizontal_push", "horizontal_pull", "vertical_pull", "horizontal_push", "vertical_push"] },
      { name: "Lower Body A", focus: ["legs", "glutes", "hips"], patterns: ["squat", "hinge", "glute", "hinge"] },
      { name: "Upper Body B", focus: ["chest", "back", "shoulders"], patterns: ["horizontal_push", "vertical_pull", "horizontal_pull", "vertical_push", "horizontal_pull"] },
      { name: "Lower Body B", focus: ["legs", "glutes", "hips"], patterns: ["hinge", "squat", "glute", "squat"] },
    ],
  },
  5: {
    label: "Push/Pull/Legs/Upper/Lower",
    days: [
      { name: "Push", focus: ["chest", "shoulders"], patterns: ["horizontal_push", "vertical_push", "horizontal_push"] },
      { name: "Pull", focus: ["back"], patterns: ["horizontal_pull", "vertical_pull", "horizontal_pull"] },
      { name: "Legs", focus: ["legs", "glutes", "hips"], patterns: ["squat", "hinge", "glute"] },
      { name: "Upper", focus: ["chest", "back", "shoulders"], patterns: ["horizontal_push", "horizontal_pull", "vertical_pull", "vertical_push", "horizontal_push"] },
      { name: "Lower", focus: ["legs", "glutes", "hips"], patterns: ["hinge", "squat", "glute", "hinge"] },
    ],
  },
  6: {
    label: "Push/Pull/Legs x2",
    days: [
      { name: "Push A", focus: ["chest", "shoulders"], patterns: ["horizontal_push", "vertical_push", "horizontal_push"] },
      { name: "Pull A", focus: ["back"], patterns: ["horizontal_pull", "vertical_pull", "horizontal_pull"] },
      { name: "Legs A", focus: ["legs", "glutes", "hips"], patterns: ["squat", "hinge", "glute"] },
      { name: "Push B", focus: ["chest", "shoulders"], patterns: ["horizontal_push", "vertical_push", "horizontal_push"] },
      { name: "Pull B", focus: ["back"], patterns: ["horizontal_pull", "vertical_pull", "horizontal_pull"] },
      { name: "Legs B", focus: ["legs", "glutes", "hips"], patterns: ["hinge", "squat", "glute"] },
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

  // Try partial ID match (pool ID may be a suffix: "db_bench_press" matches "str_db_bench_press")
  ex = exerciseDB.find(e =>
    e.id.includes(poolId) &&
    canUseExercise(e, phase, location, excludeIds, injuries)
  );
  if (ex) return ex;

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

  // ── PERMANENT CONDITION CONTRAINDICATIONS (apply at every phase) ──
  // Critical safety bug fix: roadmap preview must not show exercises that
  // violate condition "avoid" lists in future phases. Spinal fusion, ACL post-op,
  // rotator cuff post-op, and other chronic/post-surgical conditions have
  // PERMANENT restrictions that do not lift with phase progression.
  if (injuries && injuries.length > 0 && isExerciseBlockedByConditions(ex, injuries)) return false;

  // ── POST-OP TIMELINE (surgery-date-driven, tier-specific) ──
  if (injuries && injuries.length > 0 && !isExerciseAllowedByPostOp(ex, injuries)) return false;

  // ── UNIVERSAL SAFETY GATE (canonical authority — runs every time) ──
  // Note: skipPhaseCheck=true because this fn is called per-phase and phase
  // eligibility is enforced just above. Avoids redundant work / false-blocks.
  if (injuries && injuries.length > 0) {
    const gate = checkExerciseSafety(ex, { conditions: injuries }, { phase, skipPhaseCheck: true });
    if (!gate.safe) return false;
  }

  return true;
}

// ── PERMANENT CONDITION CONTRAINDICATIONS ─────────────────────
// Hard blocks that apply regardless of phase. Chronic conditions
// like spinal fusion never "unlock" deadlifts or heavy axial loading.
const SPINAL_FUSION_BLOCKS = {
  byKeyword: [
    /\bdeadlift\b/i, /\bbarbell.*press\b/i, /\bbarbell.*bench\b/i, /\bbench.*barbell\b/i,
    /\bchin.?up\b/i, /\bpull.?up\b/i, /\bsquat.*heavy\b/i, /\bjump\b/i, /\barnold\b/i,
    /\bsplit step\b/i, /\bplyo\b/i, /\bpower clean\b/i, /\bclean\b/i, /\bsnatch\b/i,
    /\bjerk\b/i, /\boverhead.*barbell\b/i, /\bback extension\b/i, /\bgood morning\b/i,
    /\bsit.?up\b/i, /\bcrunch\b/i, /\brussian twist\b/i, /\bmax effort\b/i, /\b1rm\b/i,
    // Unilateral high-axial / anti-rotation demand — clinically contraindicated for fusion
    /\bpistol\b/i, /\bsingle.?leg.*squat\b/i, /\bsl.*squat\b/i,
    /\bsingle.?leg.*deadlift\b/i, /\bsl.?rdl\b/i, /\bsingle.?leg.*rdl\b/i,
    /\bsingle.?leg.*press\b/i, /\bsingle.?leg.*shoulder\b/i,
    /\bsingle.?leg.*row\b/i, /\bsl.?row\b/i,
    /\bdead hang\b/i, /\bhanging.*leg.*raise\b/i, /\btoes.?to.?bar\b/i,
    /\bturkish get.?up\b/i, /\bwindmill\b/i,
  ],
  byPattern: ["squat_loaded_heavy", "deadlift_all", "overhead_press_barbell", "plyometric"],
  byTag: ["plyometric", "olympic_lift", "max_effort", "heavy_axial_load", "single_leg_loaded", "spinal_loading"],
  byType: ["plyometric"],
};

const CONDITION_BLOCK_MAP = {
  spinal_fusion_lumbar: SPINAL_FUSION_BLOCKS,
  spinal_fusion_cervical: { byKeyword: [/\bbehind.?neck\b/i, /\boverhead.*press\b/i, /\bheadstand\b/i, /\bjerk\b/i], byTag: ["overhead_loaded"] },
};

function _conditionKey(inj) {
  const raw = inj.conditionId || inj.condition_key || inj.condition || inj.id || "";
  // Strip injection prefix ("inj_..." is the localStorage row id, not the condition key)
  if (typeof raw === "string" && raw.startsWith("inj_")) return inj.conditionId || inj.condition_key || "";
  return raw;
}

export function isExerciseBlockedByConditions(ex, injuries) {
  if (!ex || !injuries?.length) return false;
  const name = ex.name || "";
  const tags = ex.tags || [];
  const movementPattern = ex.movementPattern || "";
  const exType = ex.type || "";

  for (const inj of injuries) {
    const key = _conditionKey(inj);
    if (!key) continue;
    const sev = inj.severity || 2;

    // Microdiscectomy at high severity uses the same blocks as fusion
    const useFusionBlocks = key === "spinal_fusion_lumbar" || (key === "microdiscectomy" && sev >= 3);
    const blocks = useFusionBlocks ? SPINAL_FUSION_BLOCKS : CONDITION_BLOCK_MAP[key];

    if (blocks) {
      if (blocks.byKeyword?.some(rx => rx.test(name))) return true;
      if (blocks.byTag?.some(t => tags.includes(t))) return true;
      if (blocks.byPattern?.includes(movementPattern)) return true;
      if (blocks.byType?.includes(exType)) return true;
    }

    // Generic: pull the condition's "avoid" array from conditions.json
    // and apply keyword matching. This makes new conditions auto-respected.
    const cond = conditionsDB?.find(c => c.condition === key || c.id === key);
    if (cond?.avoid?.length) {
      for (const avoidStr of cond.avoid) {
        const lower = String(avoidStr).toLowerCase();
        // Pattern phrases like "ALL spinal flexion under load" → keyword check
        if (lower.includes("deadlift") && /deadlift/i.test(name)) return true;
        if (lower.includes("plyometric") && (exType === "plyometric" || tags.includes("plyometric"))) return true;
        if (lower.includes("sit-up") && /sit.?up/i.test(name)) return true;
        if (lower.includes("crunch") && /crunch/i.test(name)) return true;
        if (lower.includes("russian twist") && /russian twist/i.test(name)) return true;
        if (lower.includes("good morning") && /good morning/i.test(name)) return true;
        if (lower.includes("back extension") && /back extension/i.test(name)) return true;
        if (lower.includes("behind-neck") && /behind.?neck/i.test(name)) return true;
        if (lower.includes("headstand") && /headstand/i.test(name)) return true;
      }
    }
  }
  return false;
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
  const _weekVol = getWeeklyVolume();
  const _runVol = { ..._weekVol };

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
      const volCheck = wouldExceedVolume(ex, _runVol, phase);
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
        glute: ["hinge"], // glute slot falls back to hinge exercises with glute bodyPart
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

  // ── SPORT PRIORITIZATION — inject sport-specific exercises ──
  try {
    const _sportPrefs = getSportPrefs();
    const _userSports = _sportPrefs.length > 0 ? _sportPrefs : (assessment?.preferences?.sports || []).filter(s => s !== "None").map((s, i) => ({ sport: s, rank: i + 1 }));
    if (_userSports.length > 0 && phase >= 2) {
      const _sessIdx = (getSessions() || []).length % (assessment?.preferences?.daysPerWeek || 3);
      const sportEx = getSportPreventionExercises(_userSports, exerciseDB, phase, location, 2, _sessIdx);
      for (const sex of sportEx) {
        if (usedIds.has(sex.id) || usedThisWeek.has(sex.id) || blacklist.has(sex.id)) continue;
        if (selected.length >= 8) break; // don't overfill
        selected.push(sex);
        usedIds.add(sex.id);
      }
      // Also sort existing selected exercises by sport relevance (don't change required pattern order)
      if (selected.length > 5) {
        const patternSlots = selected.slice(0, 5); // preserve first 5 (pattern-filled)
        const extra = prioritizeBySport(selected.slice(5), _userSports.map(s => s.sport || s), _sportPrefs.length > 0 ? _sportPrefs : null);
        selected.length = 0;
        selected.push(...patternSlots, ...extra);
      }
    }
  } catch (e) { console.warn("Sport injection in planner error:", e); }

  // ── PHYSIQUE CATEGORY EXTRA SLOTS ──
  try {
    const _cat = assessment?.physiqueCategory || "general";
    const _emphasis = CATEGORY_EMPHASIS[_cat] || {};
    // If chest emphasis >= 1.2 and < 2 chest exercises, add another horizontal push
    if (_emphasis.chest >= 1.2) {
      const chestCount = selected.filter(e => e.bodyPart === "chest").length;
      if (chestCount < 2 && dayTemplate.focus.includes("chest")) {
        const chestEx = exerciseDB.find(e =>
          e.category === "main" && e.bodyPart === "chest" && e.movementPattern === "push" &&
          !usedIds.has(e.id) && !usedThisWeek.has(e.id) && !blacklist.has(e.id) &&
          (e.phaseEligibility || []).includes(phase) && canUseExercise(e, phase, location, usedIds, injuries)
        );
        if (chestEx) {
          selected.push({ ...chestEx, _reason: `${_cat.replace(/_/g, " ")} chest emphasis` });
          usedIds.add(chestEx.id);
        }
      }
    }
    // If glutes emphasis >= 1.3 and < 2 glute exercises on lower days
    if (_emphasis.glutes >= 1.3 && dayTemplate.focus.includes("glutes")) {
      const gluteCount = selected.filter(e => e.bodyPart === "glutes").length;
      if (gluteCount < 2) {
        const gluteEx = exerciseDB.find(e =>
          e.category === "main" && e.bodyPart === "glutes" &&
          !usedIds.has(e.id) && !usedThisWeek.has(e.id) && !blacklist.has(e.id) &&
          (e.phaseEligibility || []).includes(phase) && canUseExercise(e, phase, location, usedIds, injuries)
        );
        if (gluteEx) {
          selected.push({ ...gluteEx, _reason: `${_cat.replace(/_/g, " ")} glute emphasis` });
          usedIds.add(gluteEx.id);
        }
      }
    }
  } catch (e) { console.warn("Physique emphasis injection error:", e); }

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

  // ── BODYWEIGHT → LOADED SWAP (Phase 3+) ──
  // If a bodyweight variant was selected but a loaded variant exists, swap it
  if (phase >= 3) {
    const LOADED_VARIANTS = {
      str_bss_bw: "str_bss_loaded",
      str_bodyweight_squat: "str_goblet_squat",
      str_glute_bridge: "sport_barbell_hip_thrust",
      str_wall_push_up: "str_db_floor_press",
      str_incline_push_up: "str_floor_push_up",
    };
    for (let i = 0; i < selected.length; i++) {
      const loadedId = LOADED_VARIANTS[selected[i].id];
      if (!loadedId) continue;
      const loaded = exerciseDB.find(e => e.id === loadedId);
      if (loaded && canUseExercise(loaded, phase, location, usedIds, injuries) && !usedIds.has(loaded.id)) {
        console.log(`[SWAP] Phase ${phase}: ${selected[i].name} → ${loaded.name}`);
        usedIds.delete(selected[i].id);
        selected[i] = { ...loaded, _reason: `Loaded variant for Phase ${phase}`, _swappedFor: selected[i].name };
        usedIds.add(loaded.id);
      }
    }
  }

  // ── PLYOMETRIC CAP: max 2 per session ──
  const plyos = selected.filter(e => e.type === "plyometric");
  if (plyos.length > 2) {
    const excess = plyos.slice(2);
    for (const ex of excess) {
      const idx = selected.indexOf(ex);
      if (idx >= 0) { console.log(`[PLYO CAP] Removed excess plyometric: ${ex.name}`); selected.splice(idx, 1); }
    }
  }

  // ── FIX: Move balance-only exercises to warmup, not main slots ──
  const _balanceRemoved = [];
  for (let i = selected.length - 1; i >= 0; i--) {
    const ex = selected[i];
    const isBalance = ex.type === "balance" || (ex.name || "").toLowerCase().includes("single-leg balance");
    if (isBalance) { _balanceRemoved.push(selected.splice(i, 1)[0]); }
  }
  // Balance exercises will be added to warmup/activation by buildSessionBlocks

  // ── FIX: Core variety — enforce rotation, max 1 same core per 3 sessions ──
  // (Core is in warmup now, but if any core leaked into main, still enforce variety)

  // ── MINIMUM SESSION SIZE ENFORCEMENT (Rule: every session ≥ 4 main exercises) ──
  const MIN_MAIN = 5;
  if (selected.length < MIN_MAIN) {
    console.warn('[MIN SESSION] Only', selected.length, 'exercises selected. Relaxing constraints...');
    // 1. Relax within-week dedup — allow exercises from other days this week
    const _relaxPool = exerciseDB.filter(e =>
      e.category === "main" && !usedIds.has(e.id) && !blacklist.has(e.id) &&
      (e.phaseEligibility || []).includes(phase) && e.safetyTier !== "red" &&
      canUseExercise(e, phase, location, usedIds, injuries)
    ).sort((a, b) => (b.difficultyLevel || 1) - (a.difficultyLevel || 1));
    for (const ex of _relaxPool) {
      if (selected.length >= MIN_MAIN) break;
      if (!usedIds.has(ex.id)) { selected.push({ ...ex, _reason: "Added to meet minimum session size" }); usedIds.add(ex.id); }
    }
    // 2. If still short, add mobility/stabilization exercises (always safe)
    if (selected.length < MIN_MAIN) {
      const _safeFillers = exerciseDB.filter(e =>
        (e.type === "stabilization" || e.type === "mobility" || e.category === "mobility") &&
        !usedIds.has(e.id) && (e.phaseEligibility || []).includes(phase) &&
        canUseExercise(e, phase, location, usedIds, injuries) &&
        e.bodyPart !== "core" // core is in warmup
      );
      for (const ex of _safeFillers) {
        if (selected.length >= MIN_MAIN) break;
        selected.push({ ...ex, _reason: "Safe filler — limited options due to conditions" }); usedIds.add(ex.id);
      }
    }
    // 3. Last resort: relax location filter
    if (selected.length < MIN_MAIN) {
      const _anyLoc = exerciseDB.filter(e =>
        e.category === "main" && !usedIds.has(e.id) && !blacklist.has(e.id) &&
        (e.phaseEligibility || []).includes(phase) && e.safetyTier !== "red" &&
        e.bodyPart !== "core"
      );
      for (const ex of _anyLoc) {
        if (selected.length >= MIN_MAIN) break;
        if (!usedIds.has(ex.id)) { selected.push({ ...ex, _reason: "Added (location relaxed) to meet minimum" }); usedIds.add(ex.id); }
      }
    }
    if (selected.length < MIN_MAIN) {
      console.warn('[MIN SESSION] Still only', selected.length, 'exercises after relaxation. Condition restrictions may be too broad.');
    }
  }

  // ── CORE GUARANTEE: every session must have at least 1 core exercise ──
  const _hasCore = selected.some(e => e.bodyPart === "core");
  if (!_hasCore) {
    // Rotate through core exercises — don't always pick the same one
    const _coreRotation = ["stab_dead_bug", "stab_mcgill_curl_up", "core_pallof_kneel", "stab_bird_dog", "stab_plank", "stab_side_plank", "core_pallof_stand"];
    const _recentCore = new Set();
    try { (getSessions() || []).slice(-3).forEach(s => (s.exercises_completed || []).forEach(ec => { const d = exerciseDB.find(x => x.id === ec.exercise_id); if (d?.bodyPart === "core") _recentCore.add(ec.exercise_id); })); } catch {}
    const _coreId = _coreRotation.find(id => !_recentCore.has(id) && !usedIds.has(id) && !usedThisWeek.has(id)) || _coreRotation[0];
    const _coreEx = exerciseDB.find(e => e.id === _coreId && (e.phaseEligibility || []).includes(phase)) || exerciseDB.find(e => e.bodyPart === "core" && (e.phaseEligibility || []).includes(phase) && !usedIds.has(e.id));
    if (_coreEx) {
      selected.push({ ..._coreEx, _reason: "Core guarantee — every session must include core" });
      usedIds.add(_coreEx.id);
    }
  }

  // ═══ MAX CAP — prevent session bloat from injection layers ═══
  const MAX_MAIN = 8;
  if (selected.length > MAX_MAIN) {
    const _reqP = new Set(["push", "pull", "hinge", "squat"]);
    const _np2 = p => { if (!p) return "other"; const lp = p.toLowerCase(); if (lp.includes("push")) return "push"; if (lp.includes("pull")) return "pull"; if (["anti_rotation","anti_extension","anti_flexion"].includes(lp)) return "core"; if (lp === "lunge") return "squat"; return lp; };
    const kept = []; const cov = new Set();
    for (const ex of selected) { const p = _np2(ex.movementPattern); if (_reqP.has(p) && !cov.has(p)) { kept.push(ex); cov.add(p); } }
    if (!kept.some(e => e.bodyPart === "core")) { const c = selected.find(e => e.bodyPart === "core" && !kept.includes(e)); if (c) kept.push(c); }
    for (const ex of selected) { if (kept.length >= MAX_MAIN) break; if (!kept.includes(ex)) kept.push(ex); }
    selected.length = 0; selected.push(...kept);
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
            if (cp && cp.deficit > 15) {
              const zone = phase <= 2 ? "Zone 1" : phase <= 3 ? "Zone 2" : "Zone 1";
              return base + ` | 🫀 Cardio: ${Math.min(30, cp.deficit)} min ${zone} walk/bike (${cp.deficit} min remaining)`;
            }
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
      exercises: filteredExercises.map(e => {
        const _assessment = getAssessment();
        const sg = applySafeguards(e, phase, injuries, injuries, _assessment?.userAge, _assessment?.fitnessLevel);
        return {
          id: e.id,
          name: e.name,
          bodyPart: e.bodyPart,
          movementPattern: e.movementPattern,
          _rotationPattern: e._rotationPattern,
          _reason: e._reason,
          ...(sg.wasModified ? { _safeguard: sg, _safeguardReasons: sg.reasons } : {}),
        };
      }),
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

  // Structural validation + auto-fix before returning
  try {
    const { validateAndFixWeek } = require("./planValidator.js");
    const validated = validateAndFixWeek(weekPlan.days, phase, exerciseDB);
    if (validated.log.length > 0) console.log("[WEEK VALIDATOR]", validated.log.join(" | "));
    weekPlan.days = validated.days;
    weekPlan._validationScore = validated.score;
  } catch (e) { console.warn("[WEEK VALIDATOR] Error (non-blocking):", e.message); }

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
