// ═══════════════════════════════════════════════════════════════
// APEX Coach — Cardio Workout Engine
// NASM CPT 7th Ed Ch.8 & Ch.15: condition-specific routing,
// 5-stage training system, workout placement, progressive overload
// ═══════════════════════════════════════════════════════════════

import CARDIO_EXERCISES from "../data/cardioExercises.js";
import { getInjuries } from "./injuries.js";
import { getAssessment } from "../components/Onboarding.jsx";
import { getHRSettings, getNASMZones, getCardioPrescription } from "./cardio.js";
import { getSessions } from "./storage.js";

const LS_CARDIO_PREFS = "apex_cardio_prefs";
const exById = Object.fromEntries(CARDIO_EXERCISES.map(e => [e.id, e]));

// ═══════════════════════════════════════════════════════════════
// 1. CONDITION-SPECIFIC CARDIO ROUTING
// Maps conditions/injuries to safe, modified, and blocked cardio
// ═══════════════════════════════════════════════════════════════

const CONDITION_CARDIO_MAP = {
  // ── KNEE CONDITIONS ────────────────────────────────
  knee_low: { // severity 1-2
    safe: ["cardio_bike_upright", "cardio_bike_recumbent", "cardio_elliptical", "cardio_swim_freestyle", "cardio_rower_light", "cardio_treadmill_walk", "cardio_aqua_jog", "cardio_walk_outdoor"],
    modify: ["cardio_stairmaster"], // lower speed
    avoid: ["cardio_treadmill_run", "cardio_treadmill_sprint", "cardio_jump_rope", "cardio_burpees", "cardio_hill_sprints", "cardio_run_outdoor"],
    msg: "Joint-friendly cardio to protect your knee while building fitness.",
  },
  knee_high: { // severity 3-5
    safe: ["cardio_bike_recumbent", "cardio_swim_freestyle", "cardio_swim_backstroke", "cardio_aqua_jog", "cardio_water_walk", "cardio_ube"],
    avoid: ["cardio_treadmill_walk", "cardio_treadmill_incline", "cardio_treadmill_jog", "cardio_treadmill_run", "cardio_treadmill_sprint", "cardio_stairmaster", "cardio_elliptical", "cardio_rower", "cardio_jump_rope", "cardio_burpees", "cardio_jog_outdoor", "cardio_run_outdoor", "cardio_hill_sprints", "cardio_hiking", "cardio_jumping_jacks"],
    msg: "Your knee needs low-load cardio. Pool and bike work protect it while building cardiovascular fitness.",
  },

  // ── BACK CONDITIONS ────────────────────────────────
  back_low: { // severity 1-2
    safe: ["cardio_treadmill_walk", "cardio_treadmill_incline", "cardio_elliptical", "cardio_bike_upright", "cardio_swim_backstroke", "cardio_aqua_jog", "cardio_walk_outdoor", "cardio_brisk_walk"],
    modify: ["cardio_rower_light"], // technique must be excellent
    avoid: ["cardio_treadmill_run", "cardio_burpees", "cardio_stairmaster"],
    msg: "Cardio adapted for your back — low-impact, posture-friendly options.",
  },
  back_high: { // severity 3-5
    safe: ["cardio_treadmill_walk", "cardio_swim_freestyle", "cardio_swim_backstroke", "cardio_aqua_jog", "cardio_water_walk", "cardio_bike_recumbent", "cardio_ube", "cardio_walk_outdoor"],
    avoid: ["cardio_rower", "cardio_rower_light", "cardio_treadmill_incline", "cardio_stairmaster", "cardio_treadmill_run", "cardio_treadmill_sprint", "cardio_burpees", "cardio_jog_outdoor", "cardio_run_outdoor", "cardio_hill_sprints", "cardio_sled_push"],
    msg: "Protecting your back during cardio. Water-based and supported options keep you moving safely.",
  },

  // ── HIP REPLACEMENT ────────────────────────────────
  hip_replacement: {
    safe: ["cardio_treadmill_walk", "cardio_elliptical", "cardio_walk_outdoor", "cardio_brisk_walk"],
    modify: ["cardio_bike_upright"], // HIGH seat required — hip flexion <90°
    avoid: ["cardio_rower", "cardio_rower_light", "cardio_bike_recumbent", "cardio_stairmaster", "cardio_treadmill_run", "cardio_treadmill_sprint", "cardio_run_outdoor", "cardio_burpees"],
    msg: "Keeping your hip within safe range during cardio. Walking and elliptical are ideal.",
  },

  // ── SHOULDER CONDITIONS ────────────────────────────
  shoulder: {
    safe: ["cardio_treadmill_walk", "cardio_treadmill_incline", "cardio_treadmill_jog", "cardio_treadmill_run", "cardio_stairmaster", "cardio_bike_upright", "cardio_bike_recumbent", "cardio_walk_outdoor", "cardio_brisk_walk", "cardio_jog_outdoor", "cardio_run_outdoor", "cardio_cycle_outdoor"],
    modify: ["cardio_elliptical"], // legs only, no handles
    avoid: ["cardio_swim_freestyle", "cardio_battle_ropes", "cardio_ski_erg", "cardio_assault_bike"],
    msg: "All lower body cardio is fine. We're avoiding upper body involvement for your shoulder.",
  },

  // ── ANKLE INSTABILITY ──────────────────────────────
  ankle: {
    safe: ["cardio_bike_upright", "cardio_bike_recumbent", "cardio_swim_freestyle", "cardio_swim_backstroke", "cardio_aqua_jog", "cardio_ube", "cardio_rower_light"],
    modify: ["cardio_treadmill_walk"], // flat surfaces only
    avoid: ["cardio_treadmill_run", "cardio_treadmill_sprint", "cardio_jump_rope", "cardio_stairmaster", "cardio_hiking", "cardio_jog_outdoor", "cardio_run_outdoor", "cardio_hill_sprints", "cardio_burpees", "cardio_jumping_jacks"],
    msg: "Building ankle stability before impact cardio. Bike and pool work keep your heart strong.",
  },

  // ── CARDIAC CONDITIONS ─────────────────────────────
  cardiac: {
    safe: ["cardio_treadmill_walk", "cardio_bike_recumbent", "cardio_elliptical", "cardio_walk_outdoor"],
    avoid: ["cardio_treadmill_sprint", "cardio_stairmaster", "cardio_assault_bike", "cardio_burpees", "cardio_hill_sprints", "cardio_treadmill_run", "cardio_spin", "cardio_battle_ropes", "cardio_sled_push"],
    zoneRestriction: [1], // Zone 1 ONLY until clearance
    msg: "Heart-safe cardio — staying in Zone 1 while your cardiac system recovers. Stop if: chest pain, dizziness, excessive shortness of breath.",
  },

  // ── OBESITY ────────────────────────────────────────
  obesity: {
    safe: ["cardio_treadmill_walk", "cardio_bike_recumbent", "cardio_elliptical", "cardio_swim_freestyle", "cardio_aqua_jog", "cardio_water_walk", "cardio_walk_outdoor"],
    modify: ["cardio_stairmaster"], // start low level
    avoid: ["cardio_treadmill_run", "cardio_jump_rope", "cardio_burpees", "cardio_hill_sprints", "cardio_treadmill_sprint"],
    msg: "Joint-friendly cardio that builds your aerobic base. As fitness improves, we'll add more options.",
  },

  // ── LOWER CROSSED SYNDROME ─────────────────────────
  lower_crossed: {
    safe: ["cardio_treadmill_walk", "cardio_treadmill_incline", "cardio_elliptical", "cardio_swim_freestyle", "cardio_walk_outdoor"],
    avoid: ["cardio_bike_recumbent", "cardio_stairmaster", "cardio_spin", "cardio_bike_upright"],
    msg: "Avoiding seated cardio machines temporarily — they keep hip flexors shortened. Walking and elliptical are better until posture corrects.",
  },

  // ── WHEELCHAIR USER / AMPUTATION ───────────────────
  wheelchair: {
    safe: ["cardio_ube", "cardio_battle_ropes", "cardio_shadow_boxing", "cardio_swim_freestyle"],
    avoid: ["cardio_treadmill_walk", "cardio_stairmaster", "cardio_elliptical", "cardio_bike_upright", "cardio_treadmill_run", "cardio_walk_outdoor", "cardio_jog_outdoor", "cardio_run_outdoor", "cardio_hiking", "cardio_jump_rope", "cardio_burpees"],
    msg: "Upper body cardio builds the same heart fitness as lower body work. Arm ergometer is your treadmill.",
  },

  // ── FIBROMYALGIA / ME/CFS ──────────────────────────
  fibromyalgia: {
    safe: ["cardio_treadmill_walk", "cardio_water_walk", "cardio_swim_freestyle", "cardio_bike_recumbent", "cardio_walk_outdoor"],
    avoid: ["cardio_treadmill_run", "cardio_treadmill_sprint", "cardio_burpees", "cardio_hill_sprints", "cardio_assault_bike", "cardio_sled_push", "cardio_jump_rope"],
    zoneRestriction: [1],
    msg: "Gentle, paced cardio within your energy envelope. If you feel worse 24-48h after, we went too hard — tell us and we'll reduce.",
  },
};

// ═══════════════════════════════════════════════════════════════
// 2. GET CONDITION KEY FOR ROUTING
// ═══════════════════════════════════════════════════════════════

function getConditionKeys(injuries) {
  const keys = [];
  for (const inj of injuries) {
    const area = (inj.area || "").toLowerCase();
    const sev = inj.severity || 0;
    const type = (inj.type || "").toLowerCase();

    if (area.includes("knee")) keys.push(sev >= 3 ? "knee_high" : "knee_low");
    if (area.includes("back") || area.includes("spine") || area.includes("lumbar")) keys.push(sev >= 3 ? "back_high" : "back_low");
    if (type.includes("replacement") && area.includes("hip")) keys.push("hip_replacement");
    if (area.includes("shoulder")) keys.push("shoulder");
    if (area.includes("ankle") || area.includes("feet")) keys.push("ankle");
    if (area.includes("heart") || area.includes("cardiac")) keys.push("cardiac");
  }
  return [...new Set(keys)];
}

// ═══════════════════════════════════════════════════════════════
// 3. SELECT SAFE CARDIO EXERCISES FOR USER
// ═══════════════════════════════════════════════════════════════

export function getAvailableCardio(phase = 1, location = "gym", injuries = null) {
  const activeInjuries = injuries || getInjuries().filter(i => i.status !== "resolved");
  const condKeys = getConditionKeys(activeInjuries);

  // Start with all exercises eligible for this phase and location
  let pool = CARDIO_EXERCISES.filter(ex =>
    (ex.phaseEligibility || []).includes(phase) &&
    (location === "gym" || (ex.locationCompatible || []).includes(location))
  );

  // Build blocked set from all condition maps
  const blocked = new Set();
  const messages = [];
  let zoneRestriction = null;

  for (const key of condKeys) {
    const map = CONDITION_CARDIO_MAP[key];
    if (!map) continue;
    (map.avoid || []).forEach(id => blocked.add(id));
    if (map.msg) messages.push(map.msg);
    if (map.zoneRestriction) zoneRestriction = map.zoneRestriction;
  }

  // Also check individual exercise severity gates
  pool = pool.filter(ex => {
    if (blocked.has(ex.id)) return false;
    const gates = ex.contraindications?.severity_gate || {};
    for (const inj of activeInjuries) {
      const gateKey = (inj.area || "").toLowerCase().replace(/\s+/g, "_");
      if (gates[gateKey] !== undefined && inj.severity > gates[gateKey]) return false;
    }
    return true;
  });

  // Apply zone restriction
  if (zoneRestriction) {
    pool = pool.filter(ex => (ex.targetZones || []).some(z => zoneRestriction.includes(z)));
  }

  return { exercises: pool, messages, zoneRestriction, conditionKeys: condKeys };
}

// ═══════════════════════════════════════════════════════════════
// 4. NASM 5-STAGE CARDIO SELECTION
// ═══════════════════════════════════════════════════════════════

const NASM_STAGES = {
  1: { name: "Stage 1 — Stabilization", zones: [1], format: "steady_state", workMin: 15, maxMin: 30, desc: "Building your aerobic foundation. This should feel comfortable." },
  2: { name: "Stage 2 — Strength Endurance", zones: [1, 2], format: "interval_1_3", workMin: 20, maxMin: 30, desc: "Interval training — short pushes followed by recovery." },
  3: { name: "Stage 3 — Muscular Development", zones: [1, 2, 3], format: "progressive", workMin: 20, maxMin: 30, desc: "Pushing into higher zones. Recovery between intervals matters." },
  4: { name: "Stage 4 — Max Strength", zones: [1, 3], format: "power_interval", workMin: 20, maxMin: 25, desc: "High-intensity intervals. Short, hard efforts with full recovery." },
  5: { name: "Stage 5 — Power", zones: [3], format: "sprint", workMin: 15, maxMin: 20, desc: "Sprint training. Maximum effort, maximum recovery. Peak conditioning." },
};

export function getNASMStage(phase) {
  return NASM_STAGES[phase] || NASM_STAGES[1];
}

// ═══════════════════════════════════════════════════════════════
// 5. BUILD CARDIO FOR WORKOUT SESSION
// ═══════════════════════════════════════════════════════════════

export function buildCardioBlock(phase = 1, location = "gym", sessionIndex = 0, daysPerWeek = 3) {
  const assessment = getAssessment() || {};
  const injuries = getInjuries().filter(i => i.status !== "resolved");
  const hrSettings = getHRSettings();
  const age = hrSettings.age || 35;
  const prefs = getCardioPrefs();

  // Determine if this session should include cardio
  const includeCardio = shouldIncludeCardio(sessionIndex, daysPerWeek, assessment);
  if (!includeCardio) return null;

  // Get available exercises
  const { exercises, messages, zoneRestriction } = getAvailableCardio(phase, location, injuries);
  if (exercises.length === 0) return null;

  // Get NASM stage for this phase
  const stage = getNASMStage(phase);
  const rx = getCardioPrescription(phase, injuries);

  // Select exercise — prefer user favorites, avoid dislikes, rotate
  const selected = selectCardioExercise(exercises, prefs, sessionIndex);
  if (!selected) return null;

  // Calculate duration based on stage
  const sessions = getSessions();
  const duration = calcProgressiveDuration(stage, sessions.length);

  // Build zone display
  const zones = zoneRestriction || stage.zones;
  const zoneDisplay = hrSettings.betaBlocker
    ? zones.map(z => `RPE ${z <= 1 ? "3-4" : z <= 2 ? "5-6" : "7-8"}`).join(" / ")
    : (() => {
        const nasmZones = getNASMZones(age, hrSettings.formula || "regression", hrSettings.maxHR);
        return zones.map(z => {
          const zd = nasmZones.zones[z - 1];
          return zd ? `Zone ${z}: ${zd.min}-${zd.max} bpm` : `Zone ${z}`;
        }).join(" | ");
      })();

  // Build interval protocol if applicable
  const protocol = buildProtocol(stage, zones, duration);

  return {
    exercise: {
      ...selected,
      _reason: messages[0] || `NASM ${stage.name}: ${rx.guidance}`,
      _duration: `${duration} min`,
      _cardioMeta: {
        stage: stage.name,
        zones,
        zoneDisplay,
        protocol,
        duration,
        format: stage.format,
        settings: selected.settingsGuidance,
        nasmNote: selected.nasmNote,
      },
    },
    alternatives: exercises.filter(e => e.id !== selected.id).slice(0, 3),
    messages,
    stage,
    prescription: rx,
  };
}

// ═══════════════════════════════════════════════════════════════
// 6. SESSION PLACEMENT LOGIC
// ═══════════════════════════════════════════════════════════════

function shouldIncludeCardio(sessionIndex, daysPerWeek, assessment) {
  const goals = assessment?.goals || {};
  const hasCardioGoal = Object.values(goals).some(g => {
    const arr = Array.isArray(g) ? g : [g];
    return arr.includes("endurance");
  });
  const hasSizeGoal = Object.values(goals).some(g => {
    const arr = Array.isArray(g) ? g : [g];
    return arr.includes("size");
  });

  // Minimum: 2 sessions per week include cardio (ACSM/NASM minimum)
  // Endurance goals: 3-5 per week
  // Size goals: 2 per week (preserve muscle)
  let cardioSessions;
  if (hasCardioGoal) cardioSessions = Math.min(daysPerWeek, Math.max(3, Math.floor(daysPerWeek * 0.7)));
  else if (hasSizeGoal) cardioSessions = 2;
  else cardioSessions = Math.min(daysPerWeek, Math.max(2, Math.floor(daysPerWeek * 0.5)));

  // Distribute evenly: first N sessions include cardio
  return sessionIndex < cardioSessions;
}

// ═══════════════════════════════════════════════════════════════
// 7. EXERCISE SELECTION (preference-aware, rotating)
// ═══════════════════════════════════════════════════════════════

function selectCardioExercise(pool, prefs, sessionIndex) {
  if (pool.length === 0) return null;

  // Filter by preferences
  const liked = prefs.liked || [];
  const disliked = prefs.disliked || [];

  let preferred = pool.filter(e => liked.includes(e.id));
  let neutral = pool.filter(e => !liked.includes(e.id) && !disliked.includes(e.id));
  let available = preferred.length > 0 ? preferred : neutral.length > 0 ? neutral : pool;

  // Rotate to provide variety
  const idx = sessionIndex % available.length;
  return available[idx];
}

// ═══════════════════════════════════════════════════════════════
// 8. PROGRESSIVE DURATION
// ═══════════════════════════════════════════════════════════════

function calcProgressiveDuration(stage, totalSessions) {
  // Start at minimum, add 2 min every 2 weeks (per NASM 10% rule)
  const baseDuration = stage.workMin;
  const weekEstimate = Math.floor(totalSessions / 3); // ~3 sessions/week
  const progressionBlocks = Math.floor(weekEstimate / 2); // every 2 weeks
  const added = Math.min(progressionBlocks * 2, stage.maxMin - baseDuration);
  return baseDuration + added;
}

// ═══════════════════════════════════════════════════════════════
// 9. INTERVAL PROTOCOLS
// ═══════════════════════════════════════════════════════════════

function buildProtocol(stage, zones, totalMinutes) {
  switch (stage.format) {
    case "steady_state":
      return { type: "steady", desc: `${totalMinutes} min steady Zone 1`, intervals: [{ zone: 1, duration: totalMinutes * 60 }] };

    case "interval_1_3": {
      // 1 min Zone 2 → 3 min Zone 1, repeat
      const cycles = Math.floor(totalMinutes / 4);
      const intervals = [];
      for (let i = 0; i < cycles; i++) {
        intervals.push({ zone: 2, duration: 60, label: "PUSH" });
        intervals.push({ zone: 1, duration: 180, label: "RECOVER" });
      }
      return { type: "interval", desc: `1 min Zone 2 / 3 min Zone 1 × ${cycles}`, intervals };
    }

    case "progressive": {
      // Build through zones progressively
      const third = Math.floor(totalMinutes / 3);
      return {
        type: "progressive",
        desc: `${third} min Z1 → ${third} min Z2 → ${third} min Z3 → cooldown`,
        intervals: [
          { zone: 1, duration: third * 60, label: "WARM UP" },
          { zone: 2, duration: third * 60, label: "BUILD" },
          { zone: 3, duration: third * 60, label: "PUSH" },
          { zone: 1, duration: 120, label: "COOL DOWN" },
        ],
      };
    }

    case "power_interval": {
      // Warm-up → Zone 3 × 1 min → Zone 1 recovery × 2 min
      const cycles = Math.floor((totalMinutes - 5) / 3);
      const intervals = [{ zone: 1, duration: 300, label: "WARM UP" }];
      for (let i = 0; i < cycles; i++) {
        intervals.push({ zone: 3, duration: 60, label: "POWER" });
        intervals.push({ zone: 1, duration: 120, label: "RECOVER" });
      }
      return { type: "power", desc: `5 min warmup + ${cycles} × (1 min Z3 / 2 min Z1)`, intervals };
    }

    case "sprint": {
      // 30s all-out → 90s recovery
      const cycles = Math.min(10, Math.floor((totalMinutes - 3) / 2));
      const intervals = [{ zone: 1, duration: 180, label: "WARM UP" }];
      for (let i = 0; i < cycles; i++) {
        intervals.push({ zone: 3, duration: 30, label: "SPRINT" });
        intervals.push({ zone: 1, duration: 90, label: "RECOVER" });
      }
      return { type: "sprint", desc: `30s sprint / 90s walk × ${cycles}`, intervals };
    }

    default:
      return { type: "steady", desc: `${totalMinutes} min steady`, intervals: [{ zone: 1, duration: totalMinutes * 60 }] };
  }
}

// ═══════════════════════════════════════════════════════════════
// 10. CARDIO PREFERENCES STORAGE
// ═══════════════════════════════════════════════════════════════

export function getCardioPrefs() {
  try { return JSON.parse(localStorage.getItem(LS_CARDIO_PREFS) || "{}"); }
  catch { return {}; }
}

export function setCardioPrefs(prefs) {
  try {
    const current = getCardioPrefs();
    localStorage.setItem(LS_CARDIO_PREFS, JSON.stringify({ ...current, ...prefs }));
  } catch {}
}

// ═══════════════════════════════════════════════════════════════
// 11. TALK TEST PROMPTS (for in-workout checks)
// ═══════════════════════════════════════════════════════════════

export const TALK_TEST_PROMPTS = [
  { response: "easy", zone: 1, feedback: "You're in Zone 1. Pick up the pace slightly if you want Zone 2." },
  { response: "harder", zone: 2, feedback: "Zone 2 — perfect for today's prescription." },
  { response: "few_words", zone: 3, feedback: "Zone 3 — high intensity. Make sure this is prescribed today." },
  { response: "cant_talk", zone: 0, feedback: "Above Zone 3 — slow down unless doing prescribed HIIT intervals." },
];

// ═══════════════════════════════════════════════════════════════
// 12. EXPORT ALL CARDIO EXERCISES (for merging into main DB)
// ═══════════════════════════════════════════════════════════════

export { CARDIO_EXERCISES };
