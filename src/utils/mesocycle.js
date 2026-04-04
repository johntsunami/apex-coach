// ═══════════════════════════════════════════��═══════════════════
// APEX Coach — Individualized 6-Week Mesocycle Engine
// Tier determination, per-tier volume/RPE progression,
// injury-specific adjustments, assessment-driven exercise
// selection, feedback auto-adjustments, phase readiness
// ═══════════════════════════════════════════════════════════════

import { getSessions, getStats } from "./storage.js";
import { getAssessment } from "../components/Onboarding.jsx";
import { getInjuries } from "./injuries.js";
import { getLatestBaseline, getBaselineCapabilities } from "./baselineTest.js";
import { getTrainingWeek } from "./volumeTracker.js";

const LS_MESOCYCLE = "apex_mesocycle";
const LS_MESOCYCLE_ARCHIVE = "apex_mesocycle_archive";

// ═══════════════════════════════════════════════════════════════
// 1. TRAINING TIER DETERMINATION
// ══════���════════════════════════════════════════════════════════

const TIERS = {
  1: { name: "Protected", mesoLength: 8, color: "#ef4444", icon: "🛡️" },
  2: { name: "Cautious", mesoLength: 6, color: "#f59e0b", icon: "⚡" },
  3: { name: "Standard", mesoLength: 6, color: "#14b8a6", icon: "💪" },
  4: { name: "Accelerated", mesoLength: 5, color: "#8b5cf6", icon: "🚀" },
};

export function determineTrainingTier(assessment, injuries, baseline) {
  if (!assessment) return { tier: 2, ...TIERS[2], reasons: ["No assessment — defaulting to Cautious"] };

  const conditions = injuries || [];
  const activeConditions = conditions.filter(c => c.status !== "resolved");
  const maxSeverity = Math.max(0, ...activeConditions.map(c => c.severity || 0));
  const conditionCount = activeConditions.length;
  const fitnessLevel = assessment.fitnessLevel || "beginner";
  const baselineScore = baseline?.overallScore || 0;
  const capabilities = baseline?.capabilityTags || [];

  const reasons = [];

  // ── TIER 1: PROTECTED ──
  if (maxSeverity >= 3) {
    reasons.push(`Condition severity ${maxSeverity}/5 — requires protected approach`);
    return { tier: 1, ...TIERS[1], reasons };
  }
  if (conditionCount >= 3) {
    reasons.push(`${conditionCount} active conditions — multi-condition protection`);
    return { tier: 1, ...TIERS[1], reasons };
  }
  if (baselineScore > 0 && baselineScore < 20) {
    reasons.push(`Baseline score ${baselineScore}/100 — below 20th percentile`);
    return { tier: 1, ...TIERS[1], reasons };
  }
  // Post-surgical <6 months check
  const postSurgical = activeConditions.some(c =>
    (c.type || "").toLowerCase().includes("post-surgical") ||
    (c.type || "").toLowerCase().includes("surgery") ||
    (c.type || "").toLowerCase().includes("repair")
  );
  if (postSurgical && maxSeverity >= 2) {
    reasons.push("Post-surgical condition — protected approach");
    return { tier: 1, ...TIERS[1], reasons };
  }
  if (fitnessLevel === "beginner" && conditionCount >= 2) {
    reasons.push("Foundation fitness with multiple conditions");
    return { tier: 1, ...TIERS[1], reasons };
  }

  // ── TIER 4: ACCELERATED ──
  if (
    fitnessLevel === "advanced" &&
    baselineScore >= 60 &&
    maxSeverity <= 1 &&
    conditionCount <= 1
  ) {
    reasons.push("Advanced fitness, strong baseline, minimal conditions");
    return { tier: 4, ...TIERS[4], reasons };
  }

  // ── TIER 3: STANDARD ──
  if (
    (fitnessLevel === "intermediate" || fitnessLevel === "advanced") &&
    maxSeverity <= 1 &&
    conditionCount <= 1 &&
    (baselineScore === 0 || baselineScore >= 40)
  ) {
    reasons.push("Good fitness base, minor or no conditions");
    return { tier: 3, ...TIERS[3], reasons };
  }

  // ── TIER 2: CAUTIOUS (default) ──
  if (conditionCount >= 1) reasons.push(`${conditionCount} active condition(s) with manageable severity`);
  if (fitnessLevel === "beginner") reasons.push("Foundation fitness level — building base");
  if (reasons.length === 0) reasons.push("Standard cautious approach for returning trainers");
  return { tier: 2, ...TIERS[2], reasons };
}

// ══════���═════════════════════════════���══════════════════════════
// 2. MESOCYCLE VOLUME/RPE PROGRESSION BY TIER
// ══════════════════════════════════════════��════════════════════

const TIER_PROGRESSIONS = {
  1: { // PROTECTED — 8 weeks
    weeks: [
      { sets: 1, rpeMin: 4, rpeMax: 5, label: "Neural adaptation" },
      { sets: 1, rpeMin: 4, rpeMax: 5, label: "Neural adaptation" },
      { sets: [1,2], rpeMin: 5, rpeMax: 6, label: "Light loading" },
      { sets: [1,2], rpeMin: 5, rpeMax: 6, label: "Light loading" },
      { sets: 2, rpeMin: 5, rpeMax: 6, label: "Building capacity" },
      { sets: 2, rpeMin: 5, rpeMax: 6, label: "Building capacity" },
      { sets: 2, rpeMin: 6, rpeMax: 6, label: "Consolidation" },
      { sets: 1, rpeMin: 4, rpeMax: 4, label: "Deload — recovery" },
    ],
    safetyTiers: ["green"],
    compoundsAllowed: false,
    compoundsWeek: null,
    stabilityBallWeek: 4,
    singleLegWeek: 4,
    progressionRule: "3 consecutive pain-free sessions at same weight",
    progressionSessions: 3,
    cardioZone: 1,
    cardioMaxMin: 15,
    warmupMinutes: 12,
    ptMandatory: true,
    message: "Your plan is built around your recovery. We're strengthening your foundation before adding intensity. This phase is critical — don't skip it.",
  },
  2: { // CAUTIOUS — 6 weeks
    weeks: [
      { sets: [1,2], rpeMin: 5, rpeMax: 6, label: "Introduction" },
      { sets: 2, rpeMin: 6, rpeMax: 7, label: "Building" },
      { sets: [2,3], rpeMin: 7, rpeMax: 7, label: "Progressive loading" },
      { sets: [2,3], rpeMin: 7, rpeMax: 8, label: "Volume peak" },
      { sets: [2,3], rpeMin: 7, rpeMax: 8, label: "Intensity peak" },
      { sets: [1,2], rpeMin: 5, rpeMax: 5, label: "Deload — recovery" },
    ],
    safetyTiers: ["green", "yellow"],
    compoundsAllowed: true,
    compoundsWeek: 3,
    stabilityBallWeek: 1,
    singleLegWeek: 2,
    progressionRule: "2-for-2 rule (NSCA standard)",
    progressionSessions: 2,
    cardioZone: 2,
    cardioMaxMin: 20,
    warmupMinutes: 8,
    ptMandatory: false,
    message: "Building strength around your conditions. We'll progress you when your body is ready — not on a calendar.",
  },
  3: { // STANDARD — 6 weeks
    weeks: [
      { sets: 2, rpeMin: 6, rpeMax: 7, label: "Foundation" },
      { sets: [2,3], rpeMin: 7, rpeMax: 7, label: "Building" },
      { sets: 3, rpeMin: 7, rpeMax: 8, label: "Progressive overload" },
      { sets: 3, rpeMin: 8, rpeMax: 8, label: "Peak volume" },
      { sets: 3, rpeMin: 8, rpeMax: 9, label: "Peak intensity" },
      { sets: 2, rpeMin: 5, rpeMax: 6, label: "Deload — recovery" },
    ],
    safetyTiers: ["green", "yellow"],
    compoundsAllowed: true,
    compoundsWeek: 1,
    stabilityBallWeek: 1,
    singleLegWeek: 1,
    progressionRule: "2-for-2 rule — upper +5 lbs, lower +10 lbs",
    progressionSessions: 2,
    cardioZone: 2,
    cardioMaxMin: 25,
    warmupMinutes: 6,
    ptMandatory: false,
    message: "Solid foundation phase. We're perfecting your movement patterns before adding serious weight.",
  },
  4: { // ACCELERATED — 5 weeks
    weeks: [
      { sets: [2,3], rpeMin: 7, rpeMax: 7, label: "Ramp-up" },
      { sets: 3, rpeMin: 7, rpeMax: 8, label: "Building" },
      { sets: [3,4], rpeMin: 8, rpeMax: 9, label: "Peak volume" },
      { sets: 3, rpeMin: 9, rpeMax: 9, label: "Peak intensity" },
      { sets: 2, rpeMin: 5, rpeMax: 6, label: "Deload — recovery" },
    ],
    safetyTiers: ["green", "yellow"],
    compoundsAllowed: true,
    compoundsWeek: 1,
    stabilityBallWeek: 1,
    singleLegWeek: 1,
    progressionRule: "2-for-2 rule — upper +5 lbs, lower +10 lbs",
    progressionSessions: 2,
    cardioZone: 3,
    cardioMaxMin: 30,
    warmupMinutes: 5,
    ptMandatory: false,
    advancedTechniquesWeek: 3,
    message: "You came in strong. We're building on your experience with structured periodization.",
  },
};

// Get the week parameters for a specific mesocycle week
export function getMesocycleWeekParams(tier, mesoWeek) {
  const progression = TIER_PROGRESSIONS[tier];
  if (!progression) return null;
  const weekIdx = Math.min(mesoWeek - 1, progression.weeks.length - 1);
  const weekData = progression.weeks[weekIdx];
  if (!weekData) return null;

  // Normalize sets to a single value (use max of range)
  const sets = Array.isArray(weekData.sets) ? weekData.sets[1] || weekData.sets[0] : weekData.sets;
  const setsMin = Array.isArray(weekData.sets) ? weekData.sets[0] : weekData.sets;

  const isDeload = weekIdx === progression.weeks.length - 1;

  return {
    sets,
    setsMin,
    rpeMin: weekData.rpeMin,
    rpeMax: weekData.rpeMax,
    label: weekData.label,
    isDeload,
    compoundsAllowed: progression.compoundsAllowed && mesoWeek >= (progression.compoundsWeek || 1),
    singleLegAllowed: mesoWeek >= (progression.singleLegWeek || 1),
    stabilityBallAllowed: mesoWeek >= (progression.stabilityBallWeek || 1),
    advancedTechniques: progression.advancedTechniquesWeek ? mesoWeek >= progression.advancedTechniquesWeek : false,
    safetyTiers: progression.safetyTiers,
    cardioZone: progression.cardioZone,
    cardioMaxMin: progression.cardioMaxMin,
    warmupMinutes: progression.warmupMinutes,
    ptMandatory: progression.ptMandatory,
    progressionRule: progression.progressionRule,
    progressionSessions: progression.progressionSessions,
  };
}

// ═══════════════════════════════════════════════════════════════
// 3. INJURY-SPECIFIC MESOCYCLE ADJUSTMENTS
// ═══════════════════════════════════════════════════════════════

const INJURY_ADJUSTMENTS = {
  lower_back: {
    low: { // severity 1-2
      hinge: { weekRange: [1, 2], allowOnly: ["glute_bridge", "hip_thrust"], message: "Start with bridges, introduce DB RDL in Week 3+ if pain-free" },
      hingeWeek3: { allow: ["db_romanian_deadlift", "single_leg_rdl"] },
      squat: { allowOnly: ["goblet_squat", "leg_press"], message: "Goblet squat and leg press only until Week 4+" },
      core: { pattern: "anti_extension_only", allow: ["plank", "dead_bug", "bird_dog", "pallof_press"], block: ["crunch", "sit_up", "russian_twist", "cable_rotation", "cable_woodchop", "cable_reverse_woodchop"], message: "Anti-extension only — no crunches, no loaded rotation" },
      blockCategories: ["plyometric"],
      blockPatterns: ["jump", "bound", "sprint", "slam"],
      addExercises: ["mckenzie_extension", "hip_flexor_stretch"],
      addFrequency: "every session",
      weeklyCheck: "How is your back this week? Better / Same / Worse",
      regressOnWorse: true,
    },
    high: { // severity 3-5
      hinge: { weekRange: [1, 4], allowOnly: ["glute_bridge"], message: "Glute bridge only for Weeks 1-4. No deadlifts until severity drops to 2 or below" },
      squat: { allowOnly: ["wall_squat", "stability_ball_squat"], message: "Wall squat or stability ball squat only. No free-standing loaded squats." },
      core: { pattern: "supine_only", allow: ["dead_bug", "pelvic_tilt"], block: ["plank", "side_plank", "crunch", "sit_up", "russian_twist", "cable_rotation", "ab_wheel", "cable_woodchop", "cable_reverse_woodchop"], message: "Supine only (dead bug, pelvic tilt). No plank until Week 4+ and pain-free" },
      blockCategories: ["plyometric"],
      blockPatterns: ["jump", "bound", "sprint", "slam", "throw", "battle_rope"],
      addExercises: ["mckenzie_extension"],
      addFrequency: "2-3x daily (morning + workout + evening)",
      maxRPE: 5,
      phaseGate: 2, // cannot progress past this severity
      weeklyCheck: "How is your back this week? Better / Same / Worse",
      regressOnWorse: true,
      cardioOnly: ["walking", "bike", "elliptical", "pool"],
    },
  },
  knee: {
    low: { // severity 1-2
      squat: { maxFlexion: 60, message: "Limited ROM — no deeper than 60 degrees flexion until Week 3" },
      squat_progressionPerWeek: 10, // add 10 degrees per week if pain-free
      blockCategories: ["plyometric"],
      addExercises: ["vmo_activation", "terminal_knee_extension"],
      addFrequency: "before any quad work",
      wallSitMax: 45,
    },
    high: { // severity 3-5
      squat: { allowOnly: ["chair_sit_to_stand", "wall_squat"], message: "Chair sit-to-stand or wall sit only. No loaded squats." },
      blockPatterns: ["lunge", "step_up_high"],
      stepUpMaxInches: 4,
      cardioOnly: ["bike", "pool"],
      addExercises: ["vmo_activation", "terminal_knee_extension", "knee_rehab_chain"],
      addFrequency: "every session",
      phaseGate: 2,
    },
  },
  shoulder: {
    low: { // severity 1-2
      push: { block: ["overhead_press", "behind_neck_press", "military_press"], allow: ["landmine_press", "floor_press", "push_up", "db_bench_press"], message: "No overhead pressing in Phases 1-2. Landmine and floor press only." },
      pull: { block: ["behind_neck_pulldown"], message: "Lat pulldown to front only" },
      addExercises: ["external_rotation_warmup", "face_pull"],
      addFrequency: "before any pressing + every session",
      overheadPhase: 3, // introduce overhead only in Phase 3 if severity drops to 1
    },
    high: { // severity 3-5
      push: { allowOnly: ["floor_press", "push_up"], message: "Floor press and push-ups only — no bench press (extreme stretch risky)" },
      pull: { allowOnly: ["machine_row", "chest_supported_row", "seated_cable_row"], message: "Machine or supported rows only. No pull-ups or hanging." },
      blockIsolation: true,
      addExercises: ["pendulum_swing", "isometric_er_ir", "scapular_exercises"],
      addFrequency: "every session",
      phaseGate: 1, // cannot progress past Phase 1 until severity drops to 2
    },
  },
  ankle: {
    low: { // severity 1-2
      blockCategories: ["plyometric"],
      addExercises: ["ankle_dorsiflexion_mob", "calf_stretch", "ankle_alphabet"],
      addFrequency: "every session warm-up",
      message: "Ankle mobility work added to every warm-up. No jumping until cleared.",
    },
    high: { // severity 3-5
      blockCategories: ["plyometric"],
      blockPatterns: ["jump", "hop", "bound", "sprint", "running"],
      addExercises: ["ankle_dorsiflexion_mob", "calf_stretch", "ankle_alphabet", "single_leg_balance"],
      addFrequency: "every session",
      cardioOnly: ["bike", "pool", "upper_body_ergometer"],
      phaseGate: 2,
      message: "No impact activities. Cardio limited to bike, pool, or arm bike.",
    },
  },
  wrist: {
    low: { // severity 1-2
      push: { block: ["push_up"], allow: ["push_up_fists", "db_bench_press", "machine_chest_press"], message: "Modify push-ups to fists or use dumbbells. Avoid flat-hand weight bearing." },
      addExercises: ["wrist_ext_stretch", "wrist_flex_stretch", "median_nerve_glide"],
      addFrequency: "before and after any gripping exercises",
      message: "Use wrist wraps for heavy gripping. Neutral grip preferred.",
    },
    high: { // severity 3-5
      push: { block: ["push_up", "plank"], allow: ["machine_chest_press", "db_bench_press"], message: "No flat-hand weight bearing. Machine and DB pressing only." },
      blockPatterns: ["heavy_grip", "hang"],
      addExercises: ["wrist_ext_stretch", "wrist_flex_stretch", "median_nerve_glide"],
      addFrequency: "every session",
      message: "Avoid all exercises requiring sustained grip or wrist deviation.",
    },
  },
};

export function getInjuryAdjustments(injuries, mesoWeek = 1) {
  const adjustments = {
    blockedExerciseIds: new Set(),
    blockedPatterns: new Set(),
    blockedCategories: new Set(),
    allowedOnlyIds: {},    // { pattern: Set<id> }
    addExercises: [],
    maxRPE: null,          // if set, caps RPE for spinal exercises
    phaseGates: [],        // conditions preventing phase progression
    weeklyChecks: [],
    messages: [],
    coreRestriction: null, // "anti_extension_only" | "supine_only" | null
    squat: { maxFlexion: null, progressionPerWeek: null },
    cardioRestrictions: null,
  };

  if (!injuries || injuries.length === 0) return adjustments;

  for (const injury of injuries.filter(i => i.status !== "resolved")) {
    const gateKey = injury.gateKey || (injury.area || "").toLowerCase().replace(/\s+/g, "_");
    const severity = injury.severity || 2;
    const sevLevel = severity >= 3 ? "high" : "low";

    const rules = INJURY_ADJUSTMENTS[gateKey]?.[sevLevel];
    if (!rules) continue;

    // Blocked categories
    if (rules.blockCategories) rules.blockCategories.forEach(c => adjustments.blockedCategories.add(c));
    if (rules.blockPatterns) rules.blockPatterns.forEach(p => adjustments.blockedPatterns.add(p));

    // Push/Pull restrictions
    for (const movType of ["hinge", "squat", "push", "pull"]) {
      const movRules = rules[movType];
      if (!movRules) continue;
      if (movRules.block) movRules.block.forEach(id => adjustments.blockedExerciseIds.add(id));
      if (movRules.allowOnly) {
        if (!adjustments.allowedOnlyIds[movType]) adjustments.allowedOnlyIds[movType] = new Set();
        movRules.allowOnly.forEach(id => adjustments.allowedOnlyIds[movType].add(id));
      }
      if (movRules.message) adjustments.messages.push(movRules.message);
    }

    // Week-gated exercises (e.g., hingeWeek3)
    const hingeWeek3 = rules.hingeWeek3;
    if (hingeWeek3 && mesoWeek >= 3) {
      if (adjustments.allowedOnlyIds.hinge) {
        hingeWeek3.allow.forEach(id => adjustments.allowedOnlyIds.hinge.add(id));
      }
    }

    // Core restrictions (take most restrictive)
    if (rules.core) {
      const coreRules = rules.core;
      if (coreRules.pattern === "supine_only" || (coreRules.pattern === "anti_extension_only" && adjustments.coreRestriction !== "supine_only")) {
        adjustments.coreRestriction = coreRules.pattern;
      }
      if (coreRules.block) coreRules.block.forEach(id => adjustments.blockedExerciseIds.add(id));
    }

    // Squat ROM limits (take most restrictive)
    if (rules.squat?.maxFlexion) {
      if (!adjustments.squat.maxFlexion || rules.squat.maxFlexion < adjustments.squat.maxFlexion) {
        adjustments.squat.maxFlexion = rules.squat.maxFlexion;
      }
    }
    if (rules.squat_progressionPerWeek) {
      adjustments.squat.progressionPerWeek = rules.squat_progressionPerWeek;
    }

    // Max RPE cap
    if (rules.maxRPE) {
      if (!adjustments.maxRPE || rules.maxRPE < adjustments.maxRPE) {
        adjustments.maxRPE = rules.maxRPE;
      }
    }

    // Add exercises
    if (rules.addExercises) {
      rules.addExercises.forEach(id => {
        if (!adjustments.addExercises.find(a => a.id === id)) {
          adjustments.addExercises.push({ id, frequency: rules.addFrequency || "every session", condition: injury.area });
        }
      });
    }

    // Phase gates
    if (rules.phaseGate) {
      adjustments.phaseGates.push({
        condition: injury.area,
        severity,
        maxPhase: rules.phaseGate,
        message: `Cannot progress past Phase ${rules.phaseGate} until ${injury.area} severity drops to 2 or below`,
      });
    }

    // Weekly checks
    if (rules.weeklyCheck) {
      adjustments.weeklyChecks.push({ area: injury.area, question: rules.weeklyCheck, regressOnWorse: rules.regressOnWorse });
    }

    // Cardio restrictions
    if (rules.cardioOnly) {
      adjustments.cardioRestrictions = rules.cardioOnly;
    }
  }

  return adjustments;
}

// ═════════════��═════════════════════════════════════════════════
// 4. ASSESSMENT-DRIVEN EXERCISE ADDITIONS
// ═══════════════════════════════════════════════════════════════

export function getCompensationExercises(assessment) {
  if (!assessment) return [];
  const comps = assessment.compensations || [];
  const additions = [];

  const COMP_MAP = {
    comp_knees_cave_in: {
      add: ["hip_abduction", "clamshell", "band_squat"],
      remove: [], // wide-stance exercises — handled by exercise filter
      message: "Knees cave in — hip abduction work added every session",
    },
    comp_feet_turn_out: {
      add: ["medial_calf_raise", "ankle_mobility"],
      remove: [],
      message: "Feet turn out — ankle mobility and calf work added",
    },
    comp_excessive_forward_lean: {
      add: ["ankle_dorsiflexion_mob", "glute_activation", "heel_elevated_squat"],
      remove: [],
      message: "Forward lean — ankle mobility and glute activation added",
    },
    comp_arms_fall_forward: {
      add: ["thoracic_extension", "lat_stretch", "face_pull"],
      remove: [],
      pullToPushRatio: 2, // 2:1 pull-to-push ratio
      message: "Arms fall forward — 2:1 pull-to-push ratio, thoracic mobility added",
    },
    comp_low_back_arch: {
      add: ["hip_flexor_stretch", "dead_bug", "posterior_pelvic_tilt"],
      remove: ["back_extension"],
      message: "Low back arches — hip flexor stretching and anti-extension core added",
    },
    comp_shoulders_elevate: {
      add: ["upper_trap_stretch", "scapular_depression"],
      remove: [],
      message: "Shoulders elevate — upper trap release and scapular work added",
    },
    comp_head_forward: {
      add: ["chin_tuck", "deep_neck_flexor"],
      remove: [],
      message: "Head forward — cervical stabilization exercises added",
    },
  };

  for (const comp of comps) {
    const mapping = COMP_MAP[comp];
    if (mapping) {
      additions.push({
        compensation: comp,
        addExercises: mapping.add,
        removeExercises: mapping.remove,
        pullToPushRatio: mapping.pullToPushRatio || null,
        message: mapping.message,
      });
    }
  }

  return additions;
}

export function getROMExercises(assessment) {
  if (!assessment?.rom) return [];
  const rom = assessment.rom;
  const additions = [];

  const ROM_MAP = {
    shoulders: {
      limited: { add: ["shoulder_pass_through", "shoulder_flexion_rom"], frequency: "every warm-up" },
      mod_limited: { add: ["shoulder_pass_through", "shoulder_flexion_rom", "wall_slide"], frequency: "every session + daily" },
      painful: { add: ["pendulum_swing", "isometric_shoulder"], frequency: "every session, no loaded overhead" },
    },
    hips: {
      limited: { add: ["hip_circle", "hip_ir_stretch"], frequency: "every warm-up" },
      mod_limited: { add: ["hip_circle", "hip_ir_stretch", "90_90_stretch"], frequency: "every session" },
      painful: { add: ["hip_circle"], frequency: "gentle only, flag for impingement screen" },
    },
    ankles: {
      limited: { add: ["ankle_mobilization", "calf_stretch"], frequency: "every warm-up" },
      mod_limited: { add: ["ankle_mobilization", "calf_stretch", "heel_elevated_squat_cue"], frequency: "every session" },
      painful: { add: ["ankle_mobilization"], frequency: "gentle only" },
    },
    thoracic: {
      limited: { add: ["open_book", "thoracic_rotation"], frequency: "every warm-up" },
      mod_limited: { add: ["open_book", "thoracic_rotation", "foam_roll_thoracic"], frequency: "every session" },
      painful: { add: ["gentle_thoracic_rotation"], frequency: "gentle only" },
    },
    lumbar: {
      limited: { add: ["cat_cow", "pelvic_tilt"], frequency: "every warm-up" },
      mod_limited: { add: ["cat_cow", "pelvic_tilt", "mckenzie_extension"], frequency: "every session" },
      painful: { add: ["pelvic_tilt"], frequency: "gentle only — see PT if persistent" },
    },
  };

  for (const [joint, rating] of Object.entries(rom)) {
    if (rating === "full") continue;
    const mapping = ROM_MAP[joint]?.[rating];
    if (mapping) {
      additions.push({
        joint,
        rating,
        addExercises: mapping.add,
        frequency: mapping.frequency,
        severe: rating === "mod_limited" || rating === "painful",
      });
    }
  }

  return additions;
}

export function getBaselineExerciseRestrictions(baseline) {
  if (!baseline?.results) return [];
  const results = baseline.results;
  const restrictions = [];

  // Push-ups <5 → wall/incline push-ups for 2+ weeks
  if (results.pushups && !results.pushups.skipped && results.pushups.value < 5) {
    restrictions.push({
      test: "pushups",
      value: results.pushups.value,
      restriction: "Wall or incline push-ups only for first 2+ weeks",
      substitute: ["wall_push_up", "incline_push_up"],
      block: ["push_up"],
      unblockWeek: 3,
    });
  }

  // Pull-ups 0 or hang <10s → lat pulldown/band rows only
  if (results.pullups) {
    const pullVal = results.pullups.value || 0;
    const tier = results.pullups.tier || "D";
    if (pullVal === 0 || tier === "D") {
      restrictions.push({
        test: "pullups",
        value: pullVal,
        restriction: "Lat pulldown and band rows only — no pull-up attempts until hang reaches 20s+",
        substitute: ["lat_pulldown", "band_row"],
        block: ["pull_up", "chin_up"],
      });
    }
  }

  // Plank <15s → dead bug/bird dog only
  if (results.plank && !results.plank.skipped && results.plank.value < 15) {
    restrictions.push({
      test: "plank",
      value: results.plank.value,
      restriction: "Dead bug and bird dog only — no plank until core stability improves",
      substitute: ["dead_bug", "bird_dog"],
      block: ["plank", "side_plank"],
    });
  }

  // Single-leg balance <10s → balance work every session, no single-leg loaded
  if (results.balance) {
    const minBalance = Math.min(
      results.balance.left_open || 0,
      results.balance.right_open || 0
    );
    if (minBalance < 10) {
      restrictions.push({
        test: "balance",
        value: minBalance,
        restriction: "Balance work every session. No single-leg loaded exercises until balance reaches 20s+",
        addEverySession: ["single_leg_balance"],
        blockSingleLegLoaded: true,
      });
    }
  }

  // Squat with compensations → bodyweight with corrections for 2+ weeks
  if (results.squat?.compensations?.length > 0) {
    restrictions.push({
      test: "squat",
      compensations: results.squat.compensations,
      restriction: "Address compensations before adding load — bodyweight squat with corrections for 2+ weeks",
      unblockWeek: 3,
      bodyweightOnly: true,
    });
  }

  return restrictions;
}

// ═══════════════════════���═══════════════════════════════════════
// 5. FEEDBACK-DRIVEN AUTO-ADJUSTMENTS
// ═══════════════════════════════════════════════════════════════

export function analyzeFeedback(sessions, windowWeeks = 2) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - windowWeeks * 7);
  const recent = (sessions || []).filter(s => new Date(s.date) >= cutoff && s.session_type !== "supplemental");

  if (recent.length < 2) return { adjustments: [], trend: "insufficient_data" };

  const adjustments = [];

  // Pain ratings 7+ for 2 weeks → regress
  const highPainSessions = recent.filter(s => (s.reflection?.pain || 0) >= 7);
  if (highPainSessions.length >= 2) {
    adjustments.push({
      type: "regress",
      reason: `Pain rated 7+ for ${highPainSessions.length} sessions — regressing to previous week's parameters`,
      severity: "high",
    });
  }

  // Difficulty "Too Hard" for 2+ sessions → reduce volume
  const tooHard = recent.filter(s => s.overall === "too_hard");
  if (tooHard.length >= 2) {
    adjustments.push({
      type: "reduce_volume",
      reason: `"Too Hard" rated for ${tooHard.length} sessions — reducing volume 20% next week`,
      reduction: 0.2,
      severity: "medium",
    });
  }

  // Difficulty "Too Easy" for 2+ sessions → consider accelerating
  const tooEasy = recent.filter(s => s.overall === "too_easy");
  if (tooEasy.length >= 2) {
    adjustments.push({
      type: "accelerate",
      reason: `"Too Easy" rated for ${tooEasy.length} sessions — consider advancing progression`,
      severity: "low",
    });
  }

  // Enjoyment dropping → swap accessory exercises
  const enjoymentScores = recent.map(s => s.reflection?.enjoyment || 5);
  if (enjoymentScores.length >= 3) {
    const avg = enjoymentScores.reduce((a, b) => a + b, 0) / enjoymentScores.length;
    if (avg < 4) {
      adjustments.push({
        type: "swap_accessories",
        reason: `Average enjoyment ${avg.toFixed(1)}/10 — swapping accessory exercises for fresh alternatives`,
        severity: "low",
      });
    }
  }

  // Specific exercises flagged with pain → remove from mesocycle
  const painFlagged = new Set();
  recent.forEach(s => {
    (s.pain_flagged || []).forEach(pf => {
      const id = typeof pf === "string" ? pf : pf.exercise_id;
      if (id) painFlagged.add(id);
    });
  });
  if (painFlagged.size > 0) {
    adjustments.push({
      type: "remove_exercises",
      exerciseIds: [...painFlagged],
      reason: `${painFlagged.size} exercise(s) flagged with pain — removing and substituting`,
      severity: "high",
    });
  }

  // Overall trend
  const trend = adjustments.some(a => a.severity === "high") ? "regressing" :
    adjustments.some(a => a.type === "accelerate") ? "progressing" :
    adjustments.some(a => a.type === "reduce_volume") ? "holding" : "on_track";

  return { adjustments, trend };
}

// ���═════════════════════════════════════════════════════════��════
// 6. PHASE PROGRESSION — CRITERIA-BASED
// ═══════════════════��═══════════════════════════════════════════

const PHASE_CRITERIA = {
  // Phase 1 → Phase 2
  1: {
    1: { minSessions: 16, plankThreshold: 20 }, // Tier 1 Protected
    2: { minSessions: 12, plankThreshold: 25 }, // Tier 2 Cautious
    3: { minSessions: 8, plankThreshold: 30 },  // Tier 3 Standard
    4: { minSessions: 6, plankThreshold: 30 },  // Tier 4 Accelerated
  },
};

export function checkPhaseReadiness(currentPhase, tier) {
  const assessment = getAssessment();
  const sessions = getSessions() || [];
  const injuries = getInjuries().filter(i => i.status !== "resolved");
  const baseline = getLatestBaseline();
  const capabilities = getBaselineCapabilities() || [];

  const criteria = PHASE_CRITERIA[currentPhase]?.[tier];
  if (!criteria) return { ready: false, checks: [], message: "Phase progression criteria not defined" };

  const checks = [];
  let allMet = true;

  // 1. Minimum sessions completed
  const totalSessions = sessions.filter(s => s.session_type !== "supplemental").length;
  const sessionsMet = totalSessions >= criteria.minSessions;
  checks.push({
    label: "Sessions completed",
    met: sessionsMet,
    current: `${totalSessions} of ${criteria.minSessions}`,
    icon: sessionsMet ? "✅" : "❌",
  });
  if (!sessionsMet) allMet = false;

  // 2. Zero pain-flagged exercises for last 2 weeks
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const recentPainFlags = sessions
    .filter(s => new Date(s.date) >= twoWeeksAgo)
    .flatMap(s => s.pain_flagged || []);
  const painFreeMet = recentPainFlags.length === 0;
  checks.push({
    label: "Pain-free",
    met: painFreeMet,
    current: painFreeMet ? "2 weeks confirmed" : `${recentPainFlags.length} pain flag(s) in last 2 weeks`,
    icon: painFreeMet ? "✅" : "❌",
  });
  if (!painFreeMet) allMet = false;

  // 3. All condition severities stable or improving
  const conditionsStable = injuries.every(i => i.severity <= 2);
  checks.push({
    label: "Conditions stable",
    met: conditionsStable,
    current: conditionsStable ? "All improving or stable" : `${injuries.filter(i => i.severity > 2).length} condition(s) still elevated`,
    icon: conditionsStable ? "✅" : "❌",
  });
  if (!conditionsStable) allMet = false;

  // 4. Core stability capability
  const plankResult = baseline?.results?.plank;
  const plankTime = plankResult?.value || 0;
  const coreStabilityMet = plankTime >= criteria.plankThreshold || capabilities.includes("core_stability_basic");
  checks.push({
    label: "Core stability",
    met: coreStabilityMet,
    current: coreStabilityMet ? `Plank ${plankTime}s (need ${criteria.plankThreshold}s)` : `Plank ${plankTime}s (need ${criteria.plankThreshold}s)`,
    icon: coreStabilityMet ? "✅" : "❌",
  });
  if (!coreStabilityMet) allMet = false;

  // 5. Compensations improving (retest shows fewer)
  const comps = assessment?.compensations || [];
  const compsMet = comps.length <= 2;
  checks.push({
    label: "Compensations",
    met: compsMet,
    current: compsMet ? `${comps.length} remaining` : `${comps.length} compensations still present`,
    icon: compsMet ? "✅" : "❌",
  });
  if (!compsMet) allMet = false;

  // 6. RPE appropriate (not "too_hard" in last 2 weeks)
  const recentSessions = sessions.filter(s => new Date(s.date) >= twoWeeksAgo);
  const noTooHard = !recentSessions.some(s => s.overall === "too_hard");
  checks.push({
    label: "RPE appropriate",
    met: noTooHard,
    current: noTooHard ? "All sessions rated Just Right or easier" : "Recent sessions rated Too Hard",
    icon: noTooHard ? "✅" : "❌",
  });
  if (!noTooHard) allMet = false;

  // Injury phase gates
  const injuryAdjustments = getInjuryAdjustments(injuries);
  for (const gate of injuryAdjustments.phaseGates) {
    if (currentPhase >= gate.maxPhase) {
      checks.push({
        label: `${gate.condition} clearance`,
        met: false,
        current: gate.message,
        icon: "🚫",
      });
      allMet = false;
    }
  }

  const metCount = checks.filter(c => c.met).length;
  const totalCount = checks.length;

  // Estimate weeks to ready
  let estimateWeeks = null;
  if (!allMet) {
    const blockers = checks.filter(c => !c.met);
    // Rough estimate based on most common blockers
    if (!sessionsMet) estimateWeeks = Math.ceil((criteria.minSessions - totalSessions) / 3); // ~3 sessions/week
    else if (!coreStabilityMet) estimateWeeks = Math.ceil((criteria.plankThreshold - plankTime) / 5); // ~5s improvement/week
    else estimateWeeks = 2; // general buffer
  }

  return {
    ready: allMet,
    checks,
    metCount,
    totalCount,
    estimateWeeks,
    message: allMet
      ? "All criteria met — ready for Phase 2!"
      : `Phase 2 Readiness: ${metCount} of ${totalCount} criteria met${estimateWeeks ? `. Estimated: ${estimateWeeks} more week(s).` : ""}`,
  };
}

// ══════════════════════════════════════════���════════════════════
// 7. MESOCYCLE STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export function getMesocycle() {
  try {
    const raw = localStorage.getItem(LS_MESOCYCLE);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveMesocycle(meso) {
  try { localStorage.setItem(LS_MESOCYCLE, JSON.stringify(meso)); } catch {}
}

export function createMesocycle(phase, tier, tierInfo) {
  const assessment = getAssessment();
  const injuries = getInjuries().filter(i => i.status !== "resolved");
  const baseline = getLatestBaseline();
  const progression = TIER_PROGRESSIONS[tier];

  const meso = {
    id: `meso_${Date.now()}`,
    createdAt: new Date().toISOString(),
    phase,
    tier,
    tierName: tierInfo.name,
    mesoLength: tierInfo.mesoLength,
    currentWeek: 1,
    startDate: new Date().toISOString().split("T")[0],

    // Tier-specific configuration
    config: {
      safetyTiers: progression.safetyTiers,
      compoundsAllowed: progression.compoundsAllowed,
      compoundsWeek: progression.compoundsWeek,
      progressionRule: progression.progressionRule,
      progressionSessions: progression.progressionSessions,
      cardioZone: progression.cardioZone,
      cardioMaxMin: progression.cardioMaxMin,
      warmupMinutes: progression.warmupMinutes,
      ptMandatory: progression.ptMandatory,
      message: progression.message,
    },

    // Injury adjustments snapshot
    injuryAdjustments: getInjuryAdjustments(injuries, 1),

    // Assessment-driven additions
    compensationExercises: getCompensationExercises(assessment),
    romExercises: getROMExercises(assessment),
    baselineRestrictions: getBaselineExerciseRestrictions(baseline),

    // Tracking
    weeksCompleted: 0,
    sessionsCompleted: 0,
    feedbackHistory: [], // [{week, adjustment, applied}]
  };

  saveMesocycle(meso);
  return meso;
}

export function getOrCreateMesocycle(phase) {
  let meso = getMesocycle();
  if (meso && meso.phase === phase) return meso;

  // Archive old mesocycle
  if (meso) archiveMesocycle(meso);

  // Determine tier
  const assessment = getAssessment();
  const injuries = getInjuries().filter(i => i.status !== "resolved");
  const baseline = getLatestBaseline();
  const tierInfo = determineTrainingTier(assessment, injuries, baseline);

  return createMesocycle(phase, tierInfo.tier, tierInfo);
}

export function advanceMesocycleWeek(meso) {
  if (!meso) return null;
  meso.currentWeek = Math.min(meso.currentWeek + 1, meso.mesoLength);
  meso.weeksCompleted++;

  // Re-evaluate injury adjustments for new week
  const injuries = getInjuries().filter(i => i.status !== "resolved");
  meso.injuryAdjustments = getInjuryAdjustments(injuries, meso.currentWeek);

  // Check feedback and apply auto-adjustments
  const sessions = getSessions() || [];
  const feedback = analyzeFeedback(sessions);
  if (feedback.adjustments.length > 0) {
    meso.feedbackHistory.push({
      week: meso.currentWeek,
      adjustments: feedback.adjustments,
      trend: feedback.trend,
      appliedAt: new Date().toISOString(),
    });
  }

  saveMesocycle(meso);
  return meso;
}

function archiveMesocycle(meso) {
  try {
    const raw = localStorage.getItem(LS_MESOCYCLE_ARCHIVE);
    const archive = raw ? JSON.parse(raw) : [];
    archive.push({ ...meso, archivedAt: new Date().toISOString() });
    while (archive.length > 10) archive.shift();
    localStorage.setItem(LS_MESOCYCLE_ARCHIVE, JSON.stringify(archive));
  } catch {}
}

// Check if current mesocycle needs a new cycle
export function shouldStartNewMesocycle(meso) {
  if (!meso) return true;
  if (meso.currentWeek >= meso.mesoLength) return true;
  // Phase changed
  const assessment = getAssessment();
  if (assessment?.startingPhase && assessment.startingPhase !== meso.phase) return true;
  return false;
}

// ═══════════════════════════════════════════════════════════════
// 8. MESOCYCLE CONTEXT FOR WEEKLY PLANNER
// ═══════════════════════════════════════════════════════════════

// Returns the full context object that the weekly planner needs
export function getMesocycleContext(phase) {
  const meso = getOrCreateMesocycle(phase);
  const weekParams = getMesocycleWeekParams(meso.tier, meso.currentWeek);
  const sessions = getSessions() || [];
  const feedback = analyzeFeedback(sessions);

  // Apply feedback adjustments to week params
  let adjustedSets = weekParams.sets;
  let adjustedRPEMax = weekParams.rpeMax;

  for (const adj of feedback.adjustments) {
    if (adj.type === "regress") {
      // Drop to previous week's params
      const prevParams = getMesocycleWeekParams(meso.tier, Math.max(1, meso.currentWeek - 1));
      if (prevParams) {
        adjustedSets = prevParams.sets;
        adjustedRPEMax = prevParams.rpeMax;
      }
    } else if (adj.type === "reduce_volume") {
      adjustedSets = Math.max(1, Math.round(adjustedSets * (1 - adj.reduction)));
    } else if (adj.type === "accelerate") {
      // Advance to next week's params (cap at peak, not deload)
      const nextWeek = Math.min(meso.currentWeek + 1, meso.mesoLength - 1); // don't advance into deload
      const nextParams = getMesocycleWeekParams(meso.tier, nextWeek);
      if (nextParams && !nextParams.isDeload) {
        adjustedSets = nextParams.sets;
        adjustedRPEMax = nextParams.rpeMax;
      }
    }
  }

  // Apply injury RPE cap
  if (meso.injuryAdjustments.maxRPE) {
    adjustedRPEMax = Math.min(adjustedRPEMax, meso.injuryAdjustments.maxRPE);
  }

  return {
    mesocycle: meso,
    weekParams: {
      ...weekParams,
      sets: adjustedSets,
      rpeMax: adjustedRPEMax,
    },
    injuryAdjustments: meso.injuryAdjustments,
    compensationExercises: meso.compensationExercises,
    romExercises: meso.romExercises,
    baselineRestrictions: meso.baselineRestrictions,
    feedback,
    phaseReadiness: checkPhaseReadiness(phase, meso.tier),
  };
}

// ═══════════════════════════════════════════════════════════════
// 9. EXPORTS
// ═══════════════════════��═══════════════════════════════════════

export {
  TIERS,
  TIER_PROGRESSIONS,
  INJURY_ADJUSTMENTS,
};
