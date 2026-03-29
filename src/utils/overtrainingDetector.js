// ═══════════════════════════════════════════════════════════════
// APEX Coach — Overtraining Detection & Prevention Engine
// Monitors 9 signal patterns, triggers 4 intervention levels,
// auto-deloads, recovery recommendations, trend reversal detection
// ═══════════════════════════════════════════════════════════════

import { getSessions, getStats } from "./storage.js";
import { getInjuries } from "./injuries.js";
import { getTrainingWeek, getVolumeLimit, getWeeklyVolume } from "./volumeTracker.js";
import { supabase } from "./supabase.js";

const LS_KEY = "apex_overtraining";

// ═══════════════════════════════════════════════════════════════
// 1. SIGNAL DETECTION — 9 overtraining patterns
// ═══════════════════════════════════════════════════════════════

function detectSignals() {
  const sessions = getSessions() || [];
  if (sessions.length < 2) return { signals: [], severity: 0, level: 0 };

  const recent14 = sessions.slice(-14);
  const recent7 = sessions.slice(-7);
  const signals = [];

  // Helper: extract reflection values from last N sessions
  const getReflectionTrend = (field, count) => {
    return sessions.slice(-count).map(s => s.reflection?.[field]).filter(v => v != null);
  };
  const getCheckInTrend = (field, count) => {
    return sessions.slice(-count).map(s => s.check_in?.[field]).filter(v => v != null);
  };
  const isRising = (arr, minLen = 3) => {
    if (arr.length < minLen) return false;
    const tail = arr.slice(-minLen);
    for (let i = 1; i < tail.length; i++) { if (tail[i] <= tail[i - 1]) return false; }
    return true;
  };
  const isFalling = (arr, minLen = 3) => {
    if (arr.length < minLen) return false;
    const tail = arr.slice(-minLen);
    for (let i = 1; i < tail.length; i++) { if (tail[i] >= tail[i - 1]) return false; }
    return true;
  };

  // SIGNAL 1: Pain trending UP over 3+ consecutive sessions
  const painTrend = getReflectionTrend("pain", 5);
  if (isRising(painTrend, 3)) {
    signals.push({
      id: "pain_rising", severity: 3,
      label: "Pain scores trending up",
      detail: `Pain: ${painTrend.slice(-3).join(" → ")} over last 3 sessions`,
      recovery: "Focus on PT protocols and gentle mobility today",
    });
  }

  // SIGNAL 2: Difficulty 8-10 for 3+ consecutive sessions
  const diffTrend = getReflectionTrend("difficulty", 5);
  const highDiff = diffTrend.slice(-3);
  if (highDiff.length >= 3 && highDiff.every(d => d >= 8)) {
    signals.push({
      id: "difficulty_high", severity: 2,
      label: "Sessions consistently too hard",
      detail: `Difficulty rated ${highDiff.join(", ")} — all 8+ for 3 sessions`,
      recovery: "Volume and intensity need to come down to allow adaptation",
    });
  }

  // SIGNAL 3: Enjoyment dropping for 3+ consecutive sessions
  const enjoyTrend = getReflectionTrend("enjoyment", 5);
  if (isFalling(enjoyTrend, 3)) {
    signals.push({
      id: "enjoyment_dropping", severity: 1,
      label: "Enjoyment declining",
      detail: `Enjoyment: ${enjoyTrend.slice(-3).join(" → ")} — motivation may be fading`,
      recovery: "Variety helps motivation. We'll swap some exercises to keep things fresh.",
    });
  }

  // SIGNAL 4: Energy declining over 5+ days
  const energyTrend = getCheckInTrend("energy", 7);
  if (isFalling(energyTrend, 5)) {
    signals.push({
      id: "energy_declining", severity: 2,
      label: "Energy levels declining",
      detail: `Energy: ${energyTrend.slice(-5).join(" → ")} over last 5 sessions`,
      recovery: "Your body needs more recovery. Consider extra sleep and nutrition focus.",
    });
  }

  // SIGNAL 5: Sleep quality declining over 5+ days
  const sleepMap = { great: 4, good: 3, ok: 2, poor: 1 };
  const sleepTrend = sessions.slice(-7).map(s => sleepMap[s.check_in?.sleep]).filter(v => v != null);
  if (isFalling(sleepTrend, 5)) {
    signals.push({
      id: "sleep_declining", severity: 2,
      label: "Sleep quality declining",
      detail: "Sleep has gotten worse over the last 5 sessions",
      recovery: "Sleep is your #1 recovery tool. Consider earlier bedtime and screen limits.",
    });
  }

  // SIGNAL 6: "Too Hard" 2+ sessions in a row
  const overallRecent = sessions.slice(-3).map(s => s.overall);
  const tooHardStreak = overallRecent.filter(o => o === "too_hard").length;
  if (tooHardStreak >= 2) {
    signals.push({
      id: "too_hard_streak", severity: 2,
      label: "Sessions rated 'Too Hard' repeatedly",
      detail: `${tooHardStreak} of last ${overallRecent.length} sessions rated too hard`,
      recovery: "Workload needs adjustment — we're pushing past your current capacity",
    });
  }

  // SIGNAL 7: Weekly volume exceeded limits 2+ consecutive weeks
  const tw = getTrainingWeek();
  const vol = getWeeklyVolume();
  const limit = getVolumeLimit(1);
  const overVol = Object.values(vol).some(v => v > (limit?.max || 12));
  // Check if previous week also exceeded (approximate from session dates)
  const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const prevWeekSessions = sessions.filter(s => {
    const d = new Date(s.date);
    return d >= twoWeeksAgo && d < oneWeekAgo;
  });
  const prevWeekVol = {};
  prevWeekSessions.forEach(s => {
    if (s.total_volume) Object.entries(s.total_volume).forEach(([m, v]) => { prevWeekVol[m] = (prevWeekVol[m] || 0) + v; });
  });
  const prevOverVol = Object.values(prevWeekVol).some(v => v > (limit?.max || 12));
  if (overVol && prevOverVol) {
    signals.push({
      id: "volume_exceeded", severity: 2,
      label: "Volume limits exceeded 2+ weeks",
      detail: "Weekly sets have been above safe limits for consecutive weeks",
      recovery: "Volume needs to drop — more sets doesn't mean more growth past a point",
    });
  }

  // SIGNAL 8: Same exercise pain-flagged in 3+ sessions
  const painExMap = {};
  for (const s of recent14) {
    for (const pf of (s.pain_flagged || [])) {
      const id = pf.exercise_id || pf;
      painExMap[id] = (painExMap[id] || 0) + 1;
    }
  }
  const repeatedPain = Object.entries(painExMap).filter(([, c]) => c >= 3);
  if (repeatedPain.length > 0) {
    signals.push({
      id: "repeated_exercise_pain", severity: 3,
      label: "Repeated pain on same exercise",
      detail: `${repeatedPain.length} exercise(s) flagged for pain 3+ times in 14 sessions`,
      recovery: "These exercises need modification or substitution — pain is a signal, not a badge",
    });
  }

  // SIGNAL 9: Stress consistently high (7+)
  const stressTrend = getCheckInTrend("stress", 5);
  const highStress = stressTrend.slice(-3);
  if (highStress.length >= 3 && highStress.every(s => s >= 7)) {
    signals.push({
      id: "high_stress", severity: 1,
      label: "Stress levels consistently high",
      detail: `Stress: ${highStress.join(", ")} — sustained high stress impairs recovery`,
      recovery: "Stress affects recovery. Today emphasizes breathing and movement quality over intensity.",
    });
  }

  return { signals, severity: signals.reduce((s, sig) => s + sig.severity, 0) };
}

// ═══════════════════════════════════════════════════════════════
// 2. INTERVENTION LEVELS
// ═══════════════════════════════════════════════════════════════

const LEVELS = [
  { level: 0, name: "Clear", color: "#22c55e", icon: "✅", threshold: 0 },
  { level: 1, name: "Watch", color: "#eab308", icon: "👀", threshold: 2 },
  { level: 2, name: "Adjust", color: "#f97316", icon: "⚠️", threshold: 5 },
  { level: 3, name: "Deload", color: "#ef4444", icon: "🛑", threshold: 8 },
  { level: 4, name: "Stop", color: "#ef4444", icon: "🚨", threshold: 12 },
];

function getInterventionLevel(severity, signals) {
  // Level 4: pain 7+ for 3 sessions AND worsening
  const hasSeverePain = signals.some(s => s.id === "pain_rising" && s.severity >= 3);
  const hasRepeatedPain = signals.some(s => s.id === "repeated_exercise_pain");
  if (hasSeverePain && hasRepeatedPain) return LEVELS[4];

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (severity >= LEVELS[i].threshold) return LEVELS[i];
  }
  return LEVELS[0];
}

// ═══════════════════════════════════════════════════════════════
// 3. DELOAD TRACKING
// ═══════════════════════════════════════════════════════════════

function getDeloadStatus() {
  const tw = getTrainingWeek();
  const lastDeload = _getLastDeload();
  const weeksSinceDeload = lastDeload ? Math.floor((Date.now() - new Date(lastDeload).getTime()) / (7 * 24 * 60 * 60 * 1000)) : tw.week;
  return { weeksSinceDeload, isOverdue: weeksSinceDeload >= 4, currentWeek: tw.week, isDeload: tw.isDeload };
}

function _getLastDeload() {
  try {
    const data = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
    return data.lastDeloadDate || null;
  } catch { return null; }
}

function markDeload() {
  try {
    const data = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
    data.lastDeloadDate = new Date().toISOString();
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {}
}

// ═══════════════════════════════════════════════════════════════
// 4. TREND REVERSAL DETECTION
// ═══════════════════════════════════════════════════════════════

function detectReversal() {
  const sessions = getSessions() || [];
  if (sessions.length < 4) return null;

  const last3 = sessions.slice(-3);
  const painTrend = last3.map(s => s.reflection?.pain).filter(v => v != null);
  const energyTrend = last3.map(s => s.check_in?.energy).filter(v => v != null);
  const enjoyTrend = last3.map(s => s.reflection?.enjoyment).filter(v => v != null);

  let improving = 0;
  if (painTrend.length >= 3 && painTrend[2] < painTrend[0]) improving++;
  if (energyTrend.length >= 3 && energyTrend[2] > energyTrend[0]) improving++;
  if (enjoyTrend.length >= 3 && enjoyTrend[2] > enjoyTrend[0]) improving++;

  if (improving >= 2) {
    return {
      detected: true,
      message: "Recovery is working — your numbers are trending back up. Great job listening to your body.",
    };
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// 5. MAIN ASSESSMENT — call after every session
// ═══════════════════════════════════════════════════════════════

export function assessOvertraining() {
  const { signals, severity } = detectSignals();
  const intervention = getInterventionLevel(severity, signals);
  const deload = getDeloadStatus();
  const reversal = detectReversal();

  // Auto-schedule deload if overdue AND any signal present
  let forceDeload = false;
  if (deload.isOverdue && intervention.level >= 1) {
    forceDeload = true;
  }
  if (intervention.level >= 3) {
    forceDeload = true;
    markDeload();
  }

  // Build recovery recommendations from active signals
  const recoveryTips = signals.map(s => s.recovery).filter(Boolean);

  // Intervention messages
  const messages = {
    0: null,
    1: "Your body is working hard — recovery matters as much as training. Consider an extra rest day this week.",
    2: "We've dialed back today's session based on your recent trends. Your body is telling us it needs more recovery.",
    3: "Your data shows clear signs of overtraining. This week is a recovery week — trust the process. You'll come back stronger.",
    4: "Your symptoms need professional evaluation. Please see your PT or doctor before continuing intense training.",
  };

  const result = {
    level: intervention.level,
    name: intervention.name,
    color: intervention.color,
    icon: intervention.icon,
    message: messages[intervention.level],
    signals,
    severity,
    recoveryTips,
    forceDeload,
    deload,
    reversal,
    assessedAt: new Date().toISOString(),
  };

  // Save to localStorage
  try {
    const data = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
    data.latestAssessment = result;
    data.history = (data.history || []).slice(-30);
    data.history.push({ level: result.level, severity, signals: signals.length, date: result.assessedAt });
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {}

  // Fire-and-forget Supabase save
  supabase.from("overtraining_assessments").insert({
    level: result.level,
    severity,
    signal_count: signals.length,
    signals: signals.map(s => s.id),
    force_deload: forceDeload,
    reversal_detected: !!reversal?.detected,
    created_at: result.assessedAt,
  }).then(() => {});

  return result;
}

// ═══════════════════════════════════════════════════════════════
// 6. GET LATEST ASSESSMENT (for UI reads without recomputing)
// ═══════════════════════════════════════════════════════════════

export function getLatestAssessment() {
  try {
    const data = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
    return data.latestAssessment || null;
  } catch { return null; }
}

export function getAssessmentHistory() {
  try {
    const data = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
    return data.history || [];
  } catch { return []; }
}

// ═══════════════════════════════════════════════════════════════
// 7. WORKOUT MODIFIERS — apply intervention to workout params
// ═══════════════════════════════════════════════════════════════

export function applyOvertrainingModifiers(workout, assessment) {
  if (!assessment || assessment.level === 0) return workout;

  const mod = { ...workout };

  if (assessment.level >= 2) {
    // Level 2: -20% volume, +30s rest, simpler exercises
    mod._volumeReduction = 0.2;
    mod._extraRest = 30;
    mod._simplify = true;
    mod._overtrainingNote = assessment.message;
  }

  if (assessment.level >= 3 || assessment.forceDeload) {
    // Level 3: forced deload — 50% volume, RPE 5 max
    mod._volumeReduction = 0.5;
    mod._maxRPE = 5;
    mod._extraRest = 30;
    mod._simplify = true;
    mod._overtrainingNote = assessment.message;
  }

  if (assessment.level >= 4) {
    // Level 4: floor session only
    mod._floorSessionOnly = true;
    mod._overtrainingNote = assessment.message;
  }

  return mod;
}

export { LEVELS, getDeloadStatus, markDeload, detectReversal };
