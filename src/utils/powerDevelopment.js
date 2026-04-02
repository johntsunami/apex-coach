// ═══════════════════════════════════════════════════════════════
// APEX Coach — Power Development & Bodyweight Mastery Engine
// NASM OPT Phase 4-5 power chains, NSCA progressive overload,
// bodyweight mastery tracks, safety gates
// ═══════════════════════════════════════════════════════════════

import { getSessions } from "./storage.js";
import { getInjuries } from "./injuries.js";
import { getBaselineCapabilities, getLatestBaseline, getBaselineExerciseLevel } from "./baselineTest.js";
import exerciseDB from "../data/exercises.json";

const POWER_RECORDS_KEY = "apex_power_records";

// ── POWER PROGRESSION CHAINS (NASM Phase 5 superset model) ────
// Each: strength exercise immediately followed by power exercise for same pattern

export const POWER_CHAINS = {
  push: [
    { phase: 3, strength: "standard_pushup", power: "explosive_pushup", desc: "Push-Up → Explosive Push-Up (hands leave ground)", stabilize: true },
    { phase: 4, strength: "weighted_pushup", power: "plyo_pushup", desc: "Weighted Push-Up → Plyometric Push-Up" },
    { phase: 5, strength: "heavy_db_press", power: "med_ball_chest_pass", desc: "Heavy DB Press → Med Ball Chest Pass" },
    { phase: 5, strength: "clap_pushup", power: "superman_pushup", desc: "Clap Push-Up → Superman Push-Up", advanced: true },
  ],
  pull: [
    { phase: 3, strength: "pullup", power: "explosive_pullup", desc: "Pull-Up → Explosive Pull-Up (above bar)", stabilize: true },
    { phase: 4, strength: "weighted_pullup", power: "speed_pullup", desc: "Weighted Pull-Up → Speed Pull-Up" },
    { phase: 5, strength: "heavy_bent_row", power: "med_ball_slam", desc: "Heavy Bent Row → Med Ball Slam" },
  ],
  squat: [
    { phase: 3, strength: "goblet_squat", power: "squat_jump_hold", desc: "Goblet Squat → Squat Jump (land & hold 3s)", stabilize: true },
    { phase: 4, strength: "back_squat", power: "box_jump", desc: "Back Squat → Box Jump (depth appropriate)" },
    { phase: 5, strength: "heavy_back_squat", power: "depth_jump", desc: "Heavy Back Squat → Depth Jump → Reactive Jump", advanced: true },
  ],
  hinge: [
    { phase: 3, strength: "trap_bar_dl", power: "kb_swing", desc: "Trap Bar DL → Kettlebell Swing" },
    { phase: 4, strength: "heavy_trap_bar_dl", power: "broad_jump", desc: "Heavy Trap Bar DL → Broad Jump" },
    { phase: 5, strength: "barbell_dl", power: "hang_clean", desc: "Barbell DL → Hang Clean (if form permits)", advanced: true },
  ],
  core: [
    { phase: 3, strength: "pallof_press", power: "med_ball_rotation", desc: "Pallof Press → Med Ball Rotational Throw" },
    { phase: 4, strength: "landmine_rotation", power: "rotational_slam", desc: "Landmine Rotation → Rotational Med Ball Slam" },
    { phase: 5, strength: "anti_rotation_hold", power: "reactive_rotation", desc: "Anti-Rotation Hold → Reactive Rotational Throw" },
  ],
};

// ── BODYWEIGHT MASTERY PROGRESSIONS ───────────────────────────

export const BW_PROGRESSIONS = {
  pushup: {
    name: "Push-Up Mastery",
    phases: [
      { phase: 1, exercises: ["wall_pushup", "incline_pushup", "knee_pushup"], focus: "Stabilization", tempo: "4/2/1" },
      { phase: 2, exercises: ["standard_pushup"], focus: "Strength Endurance", tempo: "2/0/2" },
      { phase: 3, exercises: ["decline_pushup", "diamond_pushup", "wide_pushup"], focus: "Hypertrophy", tempo: "varied" },
      { phase: 4, exercises: ["weighted_pushup", "archer_pushup"], focus: "Maximal Strength", tempo: "controlled" },
      { phase: 5, exercises: ["plyo_pushup", "clap_pushup", "one_arm_progression"], focus: "Power", tempo: "explosive" },
    ],
  },
  pullup: {
    name: "Pull-Up Mastery",
    phases: [
      { phase: 1, exercises: ["dead_hang", "scapular_pulls", "band_pulldown"], focus: "Stabilization", tempo: "4/2/1" },
      { phase: 2, exercises: ["band_assisted_pullup", "eccentric_pullup"], focus: "Strength Endurance", tempo: "2/0/2" },
      { phase: 3, exercises: ["chinup", "standard_pullup", "wide_pullup"], focus: "Hypertrophy", tempo: "varied" },
      { phase: 4, exercises: ["weighted_pullup", "L_sit_pullup"], focus: "Maximal Strength", tempo: "controlled" },
      { phase: 5, exercises: ["muscle_up_progression", "explosive_pullup"], focus: "Power", tempo: "explosive" },
    ],
  },
  squat: {
    name: "Squat Mastery",
    phases: [
      { phase: 1, exercises: ["box_squat", "wall_sit", "assisted_squat"], focus: "Stabilization", tempo: "4/2/1" },
      { phase: 2, exercises: ["bodyweight_squat", "split_squat"], focus: "Strength Endurance", tempo: "2/0/2" },
      { phase: 3, exercises: ["goblet_squat", "bulgarian_split_squat"], focus: "Hypertrophy", tempo: "varied" },
      { phase: 4, exercises: ["pistol_squat_progression", "shrimp_squat"], focus: "Maximal Strength", tempo: "controlled" },
      { phase: 5, exercises: ["squat_jump", "tuck_jump"], focus: "Power", tempo: "explosive" },
    ],
  },
};

// ── BODYWEIGHT MASTERY APPROACHES ─────────────────────────────

export const BW_APPROACHES = {
  A: {
    id: "A",
    name: "Progressive Variation",
    desc: "Follow NASM push-up progression through all 5 OPT phases — focus on mastering harder variations",
    focus: "Bodyweight Strength",
    method: "Linear variation progression with tempo manipulation per phase",
  },
  B: {
    id: "B",
    name: "High-Rep Endurance",
    desc: "Grease-the-groove methodology + pyramid sets for max rep records",
    focus: "Muscular Endurance",
    method: "GTG (50-70% max, 4-6 daily sets) + weekly pyramid sessions",
    rules: {
      pyramidRest: "15-30s between sets",
      volumeIncrease: "Max 10% weekly total rep increase",
      frequency: "Practice sets throughout the day (GTG)",
      periodization: "3 weeks building → 1 week testing max → repeat",
      safetyMonitor: "If shoulder/elbow/wrist soreness trending up → auto-reduce 30%",
    },
  },
  C: {
    id: "C",
    name: "Power & Explosiveness",
    desc: "Rate of force development — fewer reps, maximum speed and height",
    focus: "Explosive Power",
    method: "Low-rep explosive sets, plyometrics, throws, sprints",
    rules: {
      reps: "3-6 per set max",
      rest: "Full recovery between sets (2-3 min)",
      load: "30-45% 1RM for speed (NSCA guideline)",
      tracking: "Height, distance, hang time",
    },
  },
};

// ── SAFETY GATES FOR POWER ────────────────────────────────────

export function checkPowerSafety(exercise, profile) {
  const issues = [];
  const injuries = profile.injuries || getInjuries();
  const phase = profile.phase || 1;
  const capabilities = profile.capabilities || getBaselineCapabilities();
  const isPlyometric = exercise.capabilityTag?.includes("plyometric") || exercise.tags?.includes("plyometric") || exercise._isPower;
  const isPower = exercise.capabilityTag?.includes("power") || exercise.tags?.includes("power") || exercise._isPower;

  // Gate 1: Phase requirement
  if ((isPlyometric || isPower) && phase < 3) {
    issues.push({ gate: "phase", msg: `Power/plyometric requires Phase 3+ (currently Phase ${phase})`, blocked: true });
  }

  // Gate 2: Plyometric readiness
  if (isPlyometric && !capabilities.includes("plyometric_ready_candidate") && !capabilities.includes("core_stability_basic")) {
    issues.push({ gate: "capability", msg: "Plyometric readiness not demonstrated — need core stability + movement competency from baseline", blocked: true });
  }

  // Gate 3: Joint condition blocks
  const activeInjuries = injuries.filter(i => i.status !== "resolved");
  for (const inj of activeInjuries) {
    const area = (inj.area || "").toLowerCase();
    const sev = inj.severity || 0;

    // Jump exercises blocked if knee ≥2, ankle ≥2, back ≥3, hip replacement, stress fracture
    if (exercise.tags?.includes("jump") || exercise.movementPattern === "plyometric") {
      if ((area.includes("knee") && sev >= 2) ||
          (area.includes("ankle") && sev >= 2) ||
          (area.includes("back") && sev >= 3) ||
          (inj.type || "").toLowerCase().includes("replacement") ||
          (inj.type || "").toLowerCase().includes("stress fracture")) {
        issues.push({ gate: "injury", msg: `Jump blocked: ${inj.area} (severity ${sev})`, blocked: true });
      }
    }
  }

  return {
    safe: issues.filter(i => i.blocked).length === 0,
    issues,
  };
}

// ── POWER VOLUME & RECOVERY CHECKS ────────────────────────────

export function checkPowerVolume(plan) {
  const powerExercises = (plan.all || []).filter(e =>
    e.capabilityTag?.includes("power") ||
    e.capabilityTag?.includes("plyometric") ||
    e.tags?.includes("plyometric") ||
    e.tags?.includes("power") ||
    e._isPower
  );
  return {
    count: powerExercises.length,
    exceeded: powerExercises.length > 3,
    msg: powerExercises.length > 3
      ? `${powerExercises.length} power exercises exceed NSCA max of 3/session — CNS fatigue risk`
      : null,
  };
}

export function checkPowerRecovery() {
  const sessions = getSessions() || [];
  if (sessions.length === 0) return { safe: true, hoursSince: Infinity };

  // Find most recent session with power/plyometric work
  for (let i = sessions.length - 1; i >= 0; i--) {
    const s = sessions[i];
    const hasPower = (s.exercises_completed || []).some(e => {
      const dbEx = exerciseDB.find(ex => ex.id === e.exercise_id);
      return dbEx && (
        dbEx.capabilityTag?.includes("power") ||
        dbEx.capabilityTag?.includes("plyometric") ||
        dbEx.tags?.includes("plyometric") ||
        dbEx.tags?.includes("power")
      );
    });
    if (hasPower) {
      const hoursSince = (Date.now() - new Date(s.date).getTime()) / 3600000;
      return {
        safe: hoursSince >= 48,
        hoursSince: Math.round(hoursSince),
        msg: hoursSince < 48
          ? `Only ${Math.round(hoursSince)}h since last power session — NSCA recommends 48h minimum recovery`
          : null,
      };
    }
  }

  return { safe: true, hoursSince: Infinity };
}

// ── SELECT POWER CHAIN FOR CURRENT PHASE ──────────────────────

export function getPowerChainForPhase(pattern, phase) {
  const chain = POWER_CHAINS[pattern];
  if (!chain) return null;

  // Find highest available chain for this phase
  const available = chain.filter(c => c.phase <= phase && !c.advanced);
  if (available.length === 0) return null;
  return available[available.length - 1]; // Return highest phase match
}

// ── INTEGRATE POWER INTO WORKOUT ──────────────────────────────

export function addPowerElements(plan, phase, goals) {
  if (phase < 3) return plan; // No power below Phase 3

  const hasPowerGoal = goals?.includes("power") || goals?.includes("performance");
  const hasBWMastery = goals?.includes("bodyweight_mastery");
  const capabilities = getBaselineCapabilities();
  const injuries = getInjuries().filter(i => i.status !== "resolved");
  const profile = { phase, capabilities, injuries };

  const additions = [];

  if (phase >= 4 && (hasPowerGoal || phase >= 5)) {
    // Add ONE power superset per session (strength → power pair)
    const patterns = ["push", "squat", "hinge", "pull", "core"];
    let added = 0;

    for (const pat of patterns) {
      if (added >= 1) break; // Only 1 power superset per session
      const chain = getPowerChainForPhase(pat, phase);
      if (!chain) continue;

      // Create a power exercise placeholder
      const powerEx = {
        id: `power_${chain.power}`,
        name: chain.desc.split(" → ")[1] || chain.power.replace(/_/g, " "),
        category: "main",
        movementPattern: pat,
        bodyPart: pat === "push" ? "chest" : pat === "pull" ? "back" : pat === "squat" ? "legs" : pat === "hinge" ? "legs" : "core",
        _isPower: true,
        _powerChain: chain,
        tags: chain.stabilize ? ["plyometric", "stabilization"] : ["plyometric", "power"],
        phaseParams: { [String(phase)]: { sets: 2, reps: "5-8", rest: 90, intensity: "explosive", tempo: "X/0/X" } },
        capabilityTag: ["power", "plyometric"],
        safetyTier: "yellow",
      };

      const safety = checkPowerSafety(powerEx, profile);
      if (safety.safe) {
        additions.push(powerEx);
        added++;
      }
    }
  }

  // Phase 5 default: even without power goal, add brief power element
  if (phase >= 5 && additions.length === 0 && !hasPowerGoal) {
    const lightPower = {
      id: "power_phase5_default",
      name: "Box Jump (low height)",
      category: "main",
      movementPattern: "squat",
      bodyPart: "legs",
      _isPower: true,
      _reason: "Power training is part of Phase 5. Even if your goal is size, explosive movements recruit fast-twitch fibers that drive growth.",
      tags: ["plyometric"],
      phaseParams: { "5": { sets: 2, reps: "3-5", rest: 120, intensity: "explosive" } },
      capabilityTag: ["power"],
      safetyTier: "yellow",
    };
    const safety = checkPowerSafety(lightPower, { phase, capabilities, injuries });
    if (safety.safe) additions.push(lightPower);
  }

  if (additions.length === 0) return plan;

  return {
    ...plan,
    main: [...plan.main, ...additions],
    all: [...plan.warmup, ...plan.main, ...additions, ...plan.cooldown],
  };
}

// ── BODYWEIGHT MASTERY INTEGRATION ────────────────────────────

export function getBWMasteryExercise(pattern, phase, baselineResults) {
  const prog = BW_PROGRESSIONS[pattern === "push" ? "pushup" : pattern === "pull" ? "pullup" : "squat"];
  if (!prog) return null;

  const phaseData = prog.phases.find(p => p.phase === phase) || prog.phases[0];
  const level = getBaselineExerciseLevel(
    pattern === "push" ? "pushups" : pattern === "pull" ? "pullups" : "squat",
    baselineResults || {}
  );

  return {
    progression: prog.name,
    currentPhase: phaseData,
    baselineLevel: level,
    exercises: phaseData.exercises,
    focus: phaseData.focus,
    tempo: phaseData.tempo,
  };
}

// ── POWER RECORDS STORAGE ─────────────────────────────────────

export function getPowerRecords() {
  try {
    return JSON.parse(localStorage.getItem(POWER_RECORDS_KEY)) || {};
  } catch {
    return {};
  }
}

export function savePowerRecord(exerciseId, record) {
  const records = getPowerRecords();
  const existing = records[exerciseId] || { history: [] };

  // Update PR fields
  if (record.maxReps && (!existing.single_set_max_reps || record.maxReps > existing.single_set_max_reps)) {
    existing.single_set_max_reps = record.maxReps;
    existing.prDate = new Date().toISOString();
  }
  if (record.maxHeight && (!existing.max_height_inches || record.maxHeight > existing.max_height_inches)) {
    existing.max_height_inches = record.maxHeight;
  }
  if (record.maxDistance && (!existing.max_distance_feet || record.maxDistance > existing.max_distance_feet)) {
    existing.max_distance_feet = record.maxDistance;
  }

  // Append to history
  existing.history.push({
    date: new Date().toISOString(),
    ...record,
  });

  // Keep last 50 entries
  if (existing.history.length > 50) existing.history = existing.history.slice(-50);

  records[exerciseId] = existing;
  localStorage.setItem(POWER_RECORDS_KEY, JSON.stringify(records));
  return existing;
}

export function getTopPRs() {
  const records = getPowerRecords();
  const prs = [];

  for (const [exId, data] of Object.entries(records)) {
    if (data.single_set_max_reps) {
      prs.push({ exerciseId: exId, type: "reps", value: data.single_set_max_reps, date: data.prDate });
    }
    if (data.max_height_inches) {
      prs.push({ exerciseId: exId, type: "height", value: data.max_height_inches, unit: "in" });
    }
    if (data.max_distance_feet) {
      prs.push({ exerciseId: exId, type: "distance", value: data.max_distance_feet, unit: "ft" });
    }
  }

  return prs.sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 10);
}
