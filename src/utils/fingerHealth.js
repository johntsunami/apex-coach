// ═══════════════════════════════════════════════════════════════
// APEX Coach — Climbing Finger Health Monitoring System
// Evidence: Schöffl 2015, Vagy 2023 (Rock Rehab Pyramid),
// Cooper & LaStayo 2019, Lutter 2021 (BJSM), Hartnett 2024,
// Vigouroux 2006/2008, Saeterbakken 2024
// ══════════════════════════════════════════════════════════��════

import { getSportPrefs } from "./storage.js";
import { getClimbingProtocols } from "../data/sportProfiles.js";

const LS_FINGER_HEALTH = "apex_finger_health";
const LS_FINGER_LOG = "apex_finger_log";

// ── Check if user is a climber ────────────────────────────────
export function isClimber() {
  const prefs = getSportPrefs();
  return prefs.some(sp => {
    const l = sp.sport.toLowerCase();
    return l.includes("climb") || l.includes("boulder");
  });
}

// ── Pre-Session Finger Check-In ───────────────────────────────
// Returns a finger readiness object that modifies the workout
export function computeFingerReadiness(fingerCheckData) {
  if (!fingerCheckData) return { level: "full", score: 5, modifications: [] };

  const { soreness, popping, readiness } = fingerCheckData;
  const mods = [];
  let level = "full";

  // Readiness 1 or swelling or painful pop → STOP
  if (readiness <= 1 || soreness === "swelling" || popping === "painful_pop") {
    level = "stop";
    mods.push("remove_all_finger_loading");
    mods.push("activate_injury_protocol");
    mods.push("recommend_medical_eval");
  }
  // Readiness 2 or sharp pain → REDUCE HEAVY
  else if (readiness <= 2 || soreness === "sharp") {
    level = "reduced";
    mods.push("remove_hangboard");
    mods.push("remove_crimping");
    mods.push("open_hand_only");
    mods.push("add_finger_rehab");
    mods.push("pulling_with_straps");
  }
  // Readiness 3 or mild soreness → MODIFIED
  else if (readiness <= 3 || soreness === "mild") {
    level = "modified";
    mods.push("reduce_intensity_30pct");
    mods.push("extend_warmup");
    mods.push("no_max_hangs");
    mods.push("open_hand_preferred");
  }
  // Readiness 4-5 + no issues → FULL
  else {
    level = "full";
  }

  // Painless click → monitor
  if (popping === "painless_click") {
    mods.push("monitor_next_2_sessions");
  }

  return { level, score: readiness, modifications: mods };
}

// ── Exercise Filtering Based on Finger Readiness ──────────────
// Returns IDs of exercises that should be REMOVED from today's workout
export function getFingerBlockedExercises(fingerLevel, exerciseDB) {
  if (fingerLevel === "full") return new Set();
  const blocked = new Set();

  for (const ex of exerciseDB) {
    const id = ex.id || "";
    const tags = (ex.tags || []).join(",").toLowerCase();
    const name = (ex.name || "").toLowerCase();
    const isFingerIntensive = (
      id.includes("hang") || id.includes("crimp") || id.includes("pinch") ||
      id.includes("campus") || id.includes("max_hang") || id.includes("repeater") ||
      tags.includes("finger_strength") || tags.includes("grip") ||
      name.includes("hangboard") || name.includes("crimp") || name.includes("campus")
    );
    const isGripHeavy = (
      id.includes("farmer") || id.includes("carry") ||
      name.includes("dead hang") || name.includes("plate pinch")
    );

    if (fingerLevel === "stop") {
      // Block ALL finger-loading and grip-intensive exercises
      if (isFingerIntensive || isGripHeavy) blocked.add(id);
    } else if (fingerLevel === "reduced") {
      // Block hangboard, crimping, campus, heavy grip
      if (isFingerIntensive) blocked.add(id);
    } else if (fingerLevel === "modified") {
      // Block max hangs and campus only
      if (id.includes("max_hang") || id.includes("campus")) blocked.add(id);
    }
  }
  return blocked;
}

// ── Finger Rehab Exercises to ADD when pain detected ──────────
export function getFingerRehabExercises(fingerLevel, exerciseDB, phase) {
  if (fingerLevel === "full") return [];
  const rehabIds = [
    "climb_finger_tendon_glides",
    "climb_finger_extensor_band",
    "climb_finger_rom_isolation",
    "climb_wrist_flex_ext_stretch",
    "climb_forearm_massage",
    "climb_rice_bucket",
  ];

  const results = [];
  for (const id of rehabIds) {
    const ex = exerciseDB.find(e => e.id === id);
    if (!ex) continue;
    if (!(ex.phaseEligibility || []).includes(phase)) continue;
    results.push({
      ...ex,
      _reason: "Finger health protocol — rehab/recovery exercise",
      _fingerRehab: true,
    });
  }
  return results;
}

// ── Pulling Exercise Strap Annotation ─────────────────────────
// When finger readiness is reduced/stop, annotate pulling exercises
export function annotateStrapsForPulling(exercises, fingerLevel) {
  if (fingerLevel === "full" || fingerLevel === "modified") return exercises;
  return exercises.map(ex => {
    const mp = (ex.movementPattern || "").toLowerCase();
    const bp = (ex.bodyPart || "").toLowerCase();
    if (mp.includes("pull") || bp === "back" || ex.name?.toLowerCase().includes("row") || ex.name?.toLowerCase().includes("pulldown")) {
      return { ...ex, _strapsCue: true, _strapNote: "Use lifting straps today to remove grip stress from your fingers" };
    }
    return ex;
  });
}

// ── Finger Health Logging ─────────────────────────────────────
export function logFingerCheck(checkData) {
  try {
    const log = JSON.parse(localStorage.getItem(LS_FINGER_LOG) || "[]");
    log.push({
      date: new Date().toISOString(),
      ...checkData,
    });
    // Keep last 90 days
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const trimmed = log.filter(e => new Date(e.date).getTime() > cutoff);
    localStorage.setItem(LS_FINGER_LOG, JSON.stringify(trimmed));
  } catch {}
}

export function getFingerLog() {
  try { return JSON.parse(localStorage.getItem(LS_FINGER_LOG) || "[]"); } catch { return []; }
}

// ── Post-Session Finger Feedback ──────────────────────────────
export function logFingerPostSession(feedback) {
  try {
    const log = getFingerLog();
    const today = new Date().toISOString().split("T")[0];
    const todayEntry = log.find(e => e.date.startsWith(today));
    if (todayEntry) {
      todayEntry.postSession = feedback; // "better" | "same" | "worse"
    } else {
      log.push({ date: new Date().toISOString(), postSession: feedback });
    }
    localStorage.setItem(LS_FINGER_LOG, JSON.stringify(log));
  } catch {}
}

// ── Weekly Finger Health Score ─────────────────────────────────
export function getWeeklyFingerHealthScore() {
  const log = getFingerLog();
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = log.filter(e => new Date(e.date).getTime() > weekAgo);
  if (recent.length === 0) return { score: 10, trend: "stable", sessions: 0 };

  let totalScore = 0;
  let sorenessCount = 0;
  let painEvents = 0;
  let worseCount = 0;

  for (const entry of recent) {
    totalScore += entry.readiness || 5;
    if (entry.soreness === "mild" || entry.soreness === "sharp" || entry.soreness === "swelling") sorenessCount++;
    if (entry.soreness === "sharp" || entry.soreness === "swelling" || entry.popping === "painful_pop") painEvents++;
    if (entry.postSession === "worse") worseCount++;
  }

  const avgReadiness = totalScore / recent.length;
  // Score 0-10: weighted composite
  const score = Math.max(0, Math.min(10, Math.round(
    avgReadiness * 1.0 - sorenessCount * 0.5 - painEvents * 2 - worseCount * 1
  )));

  // Trend: compare first half vs second half of the week
  const mid = Math.floor(recent.length / 2);
  const firstHalf = recent.slice(0, mid);
  const secondHalf = recent.slice(mid);
  const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((s, e) => s + (e.readiness || 5), 0) / firstHalf.length : 5;
  const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((s, e) => s + (e.readiness || 5), 0) / secondHalf.length : 5;
  const trend = secondAvg > firstAvg + 0.5 ? "improving" : secondAvg < firstAvg - 0.5 ? "declining" : "stable";

  return { score, trend, sessions: recent.length, sorenessCount, painEvents };
}

// ── Finger Strength Drop Detection ────────────────────────────
// Checks if hang time or edge weight dropped >15% — possible overtraining/injury
export function checkFingerStrengthDrop() {
  try {
    const sessions = JSON.parse(localStorage.getItem("apex_sessions") || "[]");
    const recentClimbSessions = sessions.filter(s =>
      (s.exercises_completed || []).some(e => e.exercise_id?.includes("hang") || e.exercise_id?.includes("climb"))
    ).slice(-10);

    if (recentClimbSessions.length < 4) return null;

    // Find best performance in first half vs second half
    const mid = Math.floor(recentClimbSessions.length / 2);
    const getHangPerf = (sessions) => {
      let best = 0;
      for (const s of sessions) {
        for (const e of (s.exercises_completed || [])) {
          if (e.exercise_id?.includes("hang")) {
            const maxLoad = Math.max(0, ...(e.sets || []).map(st => st.load || st.time || 0));
            if (maxLoad > best) best = maxLoad;
          }
        }
      }
      return best;
    };

    const earlyBest = getHangPerf(recentClimbSessions.slice(0, mid));
    const recentBest = getHangPerf(recentClimbSessions.slice(mid));

    if (earlyBest > 0 && recentBest > 0 && recentBest < earlyBest * 0.85) {
      return {
        drop: true,
        earlyBest,
        recentBest,
        dropPct: Math.round((1 - recentBest / earlyBest) * 100),
        message: `Your finger strength dropped ${Math.round((1 - recentBest / earlyBest) * 100)}%. This could indicate fatigue or early strain. Reducing hangboard intensity this week.`,
      };
    }
    return null;
  } catch { return null; }
}

// ── Volume Tracking for Finger Loading ────────────────────────
export function getWeeklyFingerVolume() {
  try {
    const sessions = JSON.parse(localStorage.getItem("apex_sessions") || "[]");
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = sessions.filter(s => new Date(s.date).getTime() > weekAgo);

    let totalFingerSets = 0;
    let totalFingerTime = 0; // seconds

    for (const s of recent) {
      for (const e of (s.exercises_completed || [])) {
        if (e.exercise_id?.includes("hang") || e.exercise_id?.includes("crimp") || e.exercise_id?.includes("campus") || e.exercise_id?.includes("pinch")) {
          totalFingerSets += (e.sets || []).length;
          for (const set of (e.sets || [])) {
            totalFingerTime += set.time || 10; // default 10s per set if not tracked
          }
        }
      }
    }
    return { sets: totalFingerSets, timeSeconds: totalFingerTime };
  } catch { return { sets: 0, timeSeconds: 0 }; }
}

// ── Severity Self-Assessment Prompts ──────────────────────────
export const FINGER_SEVERITY_OPTIONS = [
  {
    level: "mild",
    label: "Mild",
    description: "Localized tenderness, full finger ROM, pain only with gripping, no swelling",
    conditionId: "finger_pulley_strain_mild",
    severity: 2,
  },
  {
    level: "moderate",
    label: "Moderate",
    description: "Significant tenderness, some ROM limitation, pain with daily activities, mild swelling, heard a small pop",
    conditionId: "finger_pulley_strain_moderate",
    severity: 3,
    note: "We recommend seeing a physical therapist to confirm the grade of your injury.",
  },
  {
    level: "severe",
    label: "Severe",
    description: "Intense pain, obvious swelling, heard a loud pop, can see tendon lifting from bone, difficulty making a fist",
    conditionId: "finger_pulley_rupture",
    severity: 5,
    note: "This appears to be a significant injury. Please see a hand specialist or go to urgent care. Do NOT attempt to climb or hang.",
    blockAllGrip: true,
  },
];

// ── Rock Rehab Pyramid Levels (Vagy) ──────────────────────────
export const REHAB_LEVELS = [
  {
    level: 1,
    name: "Unload",
    description: "H-taping during any activity, gentle ROM, tendon glides 4-5x daily, NO climbing or hangboard",
    criteria: "Pain-free ROM, no swelling, tenderness reducing",
    exercises: ["climb_finger_tendon_glides", "climb_finger_extensor_band", "climb_finger_rom_isolation"],
    durationWeeks: "1-2+",
  },
  {
    level: 2,
    name: "Mobility",
    description: "Full finger ROM, gentle tendon gliding with light resistance, continue taping, forearm stretching and massage",
    criteria: "Full pain-free ROM, no swelling, minimal tenderness with light pressure",
    exercises: ["climb_finger_tendon_glides", "climb_finger_extensor_band", "climb_wrist_flex_ext_stretch", "climb_forearm_massage"],
    durationWeeks: "2-4+",
  },
  {
    level: 3,
    name: "Strength",
    description: "Progressive loading: palm crimps → putty crimps → farmer crimps → open hand jug hangs → open hand edge hangs",
    criteria: "Pain-free at 80% bodyweight open hand hang for 10s",
    exercises: ["climb_palm_crimp", "climb_putty_crimp", "climb_farmer_crimp_db", "climb_iso_hangboard_loading", "climb_dead_hang_jug"],
    durationWeeks: "4-8+",
  },
  {
    level: 4,
    name: "Return to Climbing",
    description: "Climbing 3-4 grades below max, open hand only, tape affected finger, progressive increase 1 grade per 2 weeks",
    criteria: "Climbing at previous max grade pain-free with tape, pain-free 20mm edge hang at previous weight",
    exercises: ["climb_dead_hang_jug", "climb_dead_hang_20mm", "climb_abrahangs"],
    durationWeeks: "8-16+",
  },
];

// ── Prevention Rules (applied to all climbing plans) ──────────
export const CLIMBING_PREVENTION_RULES = {
  crimpWarning: "Use half-crimp or open hand grip. NEVER lock your thumb over your fingers — full crimp puts 36x bodyweight force through your pulleys.",
  volumeMaxIncrease: 15, // max % increase week-over-week
  minRestBetweenHangboard: 48, // hours
  minRestBetweenClimbing: 24, // hours
  warmupMandatory: true,
  middleRingFingerWarning: "Middle and ring fingers carry ~60% of total grip force and are most injury-prone. Extra caution with pocket holds.",
};
