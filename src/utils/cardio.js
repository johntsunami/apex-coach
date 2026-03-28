// ═══════════════════════════════════════════════════════════════
// APEX Coach — Cardio Prescription, VO2 Max Estimation,
// Heart Rate Zones, and Cardio Session Tracking
// ═══════════════════════════════════════════════════════════════

import { supabase } from "./supabase.js";

const LS_CARDIO = "apex_cardio_sessions";
const LS_VO2 = "apex_vo2_tests";
const LS_HR = "apex_hr_settings";

// ═══════════════════════════════════════════════════════════════
// 1. CARDIO PRESCRIPTION ENGINE
// ═══════════════════════════════════════════════════════════════

const CARDIO_RX = {
  1: { type: "Zone 2", activities: ["Walking", "Cycling", "Swimming"], minDur: 20, maxDur: 30, freqPerWeek: 2, intensity: "Conversational pace — can talk easily" },
  2: { type: "Moderate", activities: ["Brisk Walking", "Cycling", "Rowing", "Elliptical"], minDur: 25, maxDur: 35, freqPerWeek: 3, intensity: "Can speak in short sentences" },
  3: { type: "HIIT + Steady", activities: ["Intervals", "Circuit Training", "Sport-Specific"], minDur: 20, maxDur: 40, freqPerWeek: 3, intensity: "Alternating hard effort and recovery" },
  4: { type: "Sport-Specific", activities: ["HIIT", "Conditioning Circuits", "Sport Drills"], minDur: 25, maxDur: 45, freqPerWeek: 4, intensity: "Sport-pace intervals" },
  5: { type: "Performance", activities: ["HIIT", "Tempo Runs", "Lactate Threshold"], minDur: 25, maxDur: 50, freqPerWeek: 4, intensity: "Race-pace efforts" },
};

// Injury-safe cardio alternatives
const INJURY_MODS = {
  knee: { avoid: ["Running", "Jumping", "Stairs"], prefer: ["Cycling", "Swimming", "Rowing", "Walking"], threshold: 3 },
  lower_back: { avoid: ["Running", "Rowing (heavy)", "Jumping"], prefer: ["Walking", "Cycling", "Swimming", "Elliptical"], threshold: 3 },
  shoulder: { avoid: ["Swimming (overhead)", "Battle Ropes"], prefer: ["Walking", "Cycling", "Elliptical"], threshold: 3 },
};

export function getCardioPrescription(phase = 1, injuries = []) {
  const rx = CARDIO_RX[phase] || CARDIO_RX[1];
  let activities = [...rx.activities];

  // Filter activities based on injuries
  for (const inj of injuries) {
    const gateKey = inj.gateKey || inj.area?.toLowerCase().replace(/\s+/g, "_");
    const mod = INJURY_MODS[gateKey];
    if (mod && inj.severity >= mod.threshold) {
      activities = activities.filter(a => !mod.avoid.some(av => a.toLowerCase().includes(av.toLowerCase())));
      // Add safe alternatives if list is empty
      if (activities.length === 0) activities = [...mod.prefer];
    }
  }

  // Calculate weekly target minutes
  const avgDur = Math.round((rx.minDur + rx.maxDur) / 2);
  const weeklyTarget = avgDur * rx.freqPerWeek;

  return {
    phase,
    type: rx.type,
    activities,
    duration: `${rx.minDur}-${rx.maxDur} min`,
    frequency: `${rx.freqPerWeek}x/week`,
    intensity: rx.intensity,
    weeklyTargetMinutes: weeklyTarget,
    sessionsPerWeek: rx.freqPerWeek,
  };
}

// ═══════════════════════════════════════════════════════════════
// 2. VO2 MAX ESTIMATION
// ═══════════════════════════════════════════════════════════════

// Rockport Walk Test: VO2max = 132.853 - (0.0769 × weight_lbs) - (0.3877 × age) + (6.315 × gender) - (3.2649 × time_min) - (0.1565 × HR)
// gender: 1 = male, 0 = female
export function calcVO2Rockport(weightLbs, age, genderMale, timeMinutes, heartRate) {
  const gender = genderMale ? 1 : 0;
  return Math.round(
    (132.853 - (0.0769 * weightLbs) - (0.3877 * age) + (6.315 * gender) - (3.2649 * timeMinutes) - (0.1565 * heartRate)) * 10
  ) / 10;
}

// Cooper Test (1.5-mile run): VO2max = (distance_meters - 504.9) / 44.73
// Or from time: VO2max = (483 / time_min) + 3.5
export function calcVO2Cooper(timeMinutes) {
  return Math.round(((483 / timeMinutes) + 3.5) * 10) / 10;
}

// ACSM Fitness Categories (Male, ages 20-69)
const VO2_NORMS_MALE = [
  // [ageMin, ageMax, veryPoor, poor, fair, good, excellent, superior]
  [20, 29, 0, 25, 33, 42, 52, 56],
  [30, 39, 0, 23, 31, 39, 48, 52],
  [40, 49, 0, 20, 27, 36, 44, 49],
  [50, 59, 0, 18, 24, 33, 41, 45],
  [60, 69, 0, 16, 21, 30, 37, 42],
];

const VO2_NORMS_FEMALE = [
  [20, 29, 0, 24, 29, 36, 44, 49],
  [30, 39, 0, 20, 27, 33, 41, 45],
  [40, 49, 0, 17, 24, 31, 38, 42],
  [50, 59, 0, 15, 21, 28, 35, 39],
  [60, 69, 0, 13, 18, 24, 33, 36],
];

export function getVO2Category(vo2, age, genderMale) {
  const norms = genderMale ? VO2_NORMS_MALE : VO2_NORMS_FEMALE;
  const row = norms.find(r => age >= r[0] && age <= r[1]) || norms[norms.length - 1];
  const [, , vp, poor, fair, good, exc, sup] = row;

  if (vo2 >= sup) return { label: "Superior", color: "#22c55e", emoji: "🏆" };
  if (vo2 >= exc) return { label: "Excellent", color: "#22c55e", emoji: "⭐" };
  if (vo2 >= good) return { label: "Good", color: "#00d2c8", emoji: "👍" };
  if (vo2 >= fair) return { label: "Fair", color: "#eab308", emoji: "😐" };
  if (vo2 >= poor) return { label: "Poor", color: "#f97316", emoji: "😟" };
  return { label: "Very Poor", color: "#ef4444", emoji: "⚠️" };
}

// ═══════════════════════════════════════════════════════════════
// 3. HEART RATE ZONES
// ═══════════════════════════════════════════════════════════════

export function getHRZones(age, maxHROverride = null) {
  const maxHR = maxHROverride || (220 - age);
  return {
    maxHR,
    zones: [
      { zone: 1, name: "Recovery", min: Math.round(maxHR * 0.50), max: Math.round(maxHR * 0.60), color: "#94a3b8", desc: "Very light — warm-up, cool-down" },
      { zone: 2, name: "Fat Burn / Base", min: Math.round(maxHR * 0.60), max: Math.round(maxHR * 0.70), color: "#22c55e", desc: "Light — conversational pace, aerobic base" },
      { zone: 3, name: "Aerobic", min: Math.round(maxHR * 0.70), max: Math.round(maxHR * 0.80), color: "#eab308", desc: "Moderate — can speak short sentences" },
      { zone: 4, name: "Threshold", min: Math.round(maxHR * 0.80), max: Math.round(maxHR * 0.90), color: "#f97316", desc: "Hard — labored breathing, short bursts" },
      { zone: 5, name: "Max Effort", min: Math.round(maxHR * 0.90), max: maxHR, color: "#ef4444", desc: "All-out — sprints, less than 1 minute" },
    ],
  };
}

// RPE to HR Zone rough mapping (for beta-blocker users)
export const RPE_ZONES = [
  { rpe: "1-2", zone: "Zone 1", desc: "Very easy — barely working" },
  { rpe: "3-4", zone: "Zone 2", desc: "Easy — can hold a conversation" },
  { rpe: "5-6", zone: "Zone 3", desc: "Moderate — can speak short sentences" },
  { rpe: "7-8", zone: "Zone 4", desc: "Hard — difficult to speak" },
  { rpe: "9-10", zone: "Zone 5", desc: "All-out — cannot speak" },
];

// ═══════════════════════════════════════════════════════════════
// 4. CARDIO SESSION TRACKING
// ═══════════════════════════════════════════════════════════════

export function saveCardioSession(session) {
  const entry = {
    id: `cs_${Date.now()}`,
    date: new Date().toISOString(),
    type: session.type || "Walking",
    duration: session.duration || 0,
    distance: session.distance || null,
    avgHR: session.avgHR || null,
    rpe: session.rpe || 5,
    zone: session.zone || 2,
    notes: session.notes || "",
  };

  // Save to localStorage
  try {
    const sessions = JSON.parse(localStorage.getItem(LS_CARDIO) || "[]");
    sessions.push(entry);
    localStorage.setItem(LS_CARDIO, JSON.stringify(sessions));
  } catch { /* full */ }

  // Fire-and-forget Supabase save
  supabase.from("cardio_sessions").insert({
    session_type: entry.type,
    duration_minutes: entry.duration,
    distance: entry.distance,
    avg_heart_rate: entry.avgHR,
    rpe: entry.rpe,
    zone: entry.zone,
    notes: entry.notes,
    created_at: entry.date,
  }).then(() => {});

  return entry;
}

export function getCardioSessions() {
  try { return JSON.parse(localStorage.getItem(LS_CARDIO) || "[]"); }
  catch { return []; }
}

export function getWeeklyCardioMinutes() {
  const sessions = getCardioSessions();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return sessions
    .filter(s => new Date(s.date) >= weekAgo)
    .reduce((sum, s) => sum + (s.duration || 0), 0);
}

// ═══════════════════════════════════════════════════════════════
// 5. VO2 MAX TEST STORAGE
// ═══════════════════════════════════════════════════════════════

export function saveVO2Test(result) {
  const entry = {
    id: `v_${Date.now()}`,
    date: new Date().toISOString(),
    testType: result.testType,
    timeMinutes: result.timeMinutes,
    heartRate: result.heartRate || null,
    vo2max: result.vo2max,
    category: result.category,
  };

  try {
    const tests = JSON.parse(localStorage.getItem(LS_VO2) || "[]");
    tests.push(entry);
    localStorage.setItem(LS_VO2, JSON.stringify(tests));
  } catch { /* full */ }

  // Fire-and-forget Supabase save
  supabase.from("vo2_tests").insert({
    test_type: entry.testType,
    time_minutes: entry.timeMinutes,
    heart_rate: entry.heartRate,
    vo2_max: entry.vo2max,
    category: entry.category,
    created_at: entry.date,
  }).then(() => {});

  return entry;
}

export function getVO2Tests() {
  try { return JSON.parse(localStorage.getItem(LS_VO2) || "[]"); }
  catch { return []; }
}

export function getLatestVO2() {
  const tests = getVO2Tests();
  return tests.length > 0 ? tests[tests.length - 1] : null;
}

export function getVO2Trend() {
  const tests = getVO2Tests();
  if (tests.length < 2) return null;
  const last = tests[tests.length - 1].vo2max;
  const prev = tests[tests.length - 2].vo2max;
  const diff = last - prev;
  return { current: last, previous: prev, diff, improving: diff > 0 };
}

export function getNextTestDate() {
  const tests = getVO2Tests();
  if (tests.length === 0) return null;
  const lastDate = new Date(tests[tests.length - 1].date);
  lastDate.setDate(lastDate.getDate() + 56); // 8 weeks
  return lastDate;
}

// ═══════════════════════════════════════════════════════════════
// 6. HR SETTINGS (user-provided max HR, beta-blocker flag)
// ═══════════════════════════════════════════════════════════════

export function getHRSettings() {
  try { return JSON.parse(localStorage.getItem(LS_HR) || "{}"); }
  catch { return {}; }
}

export function setHRSettings(settings) {
  try { localStorage.setItem(LS_HR, JSON.stringify(settings)); }
  catch { /* full */ }
}
