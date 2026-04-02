// ═══════════════════════════════════════════════════════════════
// APEX Coach — NASM CPT 7th Edition Cardiorespiratory Assessment
// HR zones (3-zone model), VO2 estimation (4 test options),
// cardio prescription per OPT phase, session tracking
// ═══════════════════════════════════════════════════════════════

import { supabase } from "./supabase.js";

const LS_CARDIO = "apex_cardio_sessions";
const LS_VO2 = "apex_vo2_tests";
const LS_HR = "apex_hr_settings";

// ═══════════════════════════════════════════════════════════════
// 1. RESTING MEASUREMENTS & HR MAX
// ═══════════════════════════════════════════════════════════════

// NASM recommended regression formula (more accurate)
export function calcHRMaxRegression(age) {
  return Math.round(208 - (0.7 * age));
}

// Traditional formula
export function calcHRMaxTraditional(age) {
  return 220 - age;
}

// Get HRmax using user preference
export function getHRMax(age, formula = "regression", override = null) {
  if (override) return override;
  return formula === "traditional" ? calcHRMaxTraditional(age) : calcHRMaxRegression(age);
}

// Blood pressure classification (NASM/AHA)
export function classifyBP(systolic, diastolic) {
  if (!systolic || !diastolic) return null;
  if (systolic >= 180 || diastolic >= 120) return { label: "Crisis", color: "#ef4444", flag: "immediate_medical", msg: "Hypertensive crisis — seek emergency care" };
  if (systolic >= 140 || diastolic >= 90) return { label: "High (Stage 2)", color: "#ef4444", flag: "medical_clearance", msg: "Medical clearance required before high-intensity exercise per NASM guidelines" };
  if (systolic >= 130 || diastolic >= 80) return { label: "High (Stage 1)", color: "#f97316", flag: "monitor", msg: "Elevated blood pressure — monitor during exercise, avoid heavy Valsalva" };
  if (systolic >= 120) return { label: "Elevated", color: "#eab308", flag: "watch", msg: "Slightly elevated — regular exercise helps improve this" };
  return { label: "Normal", color: "#22c55e", flag: null, msg: "Blood pressure is normal" };
}

// ═══════════════════════════════════════════════════════════════
// 2. NASM 3-ZONE HEART RATE MODEL
// ═══════════════════════════════════════════════════════════════

export function getNASMZones(age, formula = "regression", maxHROverride = null) {
  const maxHR = getHRMax(age, formula, maxHROverride);
  return {
    maxHR,
    formula,
    zones: [
      {
        zone: 1, name: "Building Base",
        min: Math.round(maxHR * 0.65), max: Math.round(maxHR * 0.75),
        color: "#22c55e",
        desc: "Comfortable pace, can hold full conversation",
        purpose: "Burns fat, builds aerobic foundation",
        prescribed: "Phase 1, deconditioned, cardiac conditions, recovery days",
      },
      {
        zone: 2, name: "Aerobic Development",
        min: Math.round(maxHR * 0.76), max: Math.round(maxHR * 0.85),
        color: "#eab308",
        desc: "Moderate effort, can talk in short sentences",
        purpose: "Improves heart efficiency, increases endurance",
        prescribed: "Phase 2-3, general fitness, weight management",
      },
      {
        zone: 3, name: "Anaerobic / Performance",
        min: Math.round(maxHR * 0.86), max: Math.round(maxHR * 0.95),
        color: "#ef4444",
        desc: "Hard effort, can only say a few words",
        purpose: "Improves VO2max, increases speed and power",
        prescribed: "Phase 4-5, athletes, HIIT intervals",
      },
    ],
  };
}

// RPE-based zones for beta-blocker users (replaces HR zones)
export const RPE_ZONES = [
  { zone: 1, rpe: "3-4", name: "Building Base", desc: "Light effort — can hold full conversation", color: "#22c55e" },
  { zone: 2, rpe: "5-6", name: "Aerobic Development", desc: "Moderate effort — can talk in short sentences", color: "#eab308" },
  { zone: 3, rpe: "7-8", name: "Anaerobic / Performance", desc: "Hard effort — can only say a few words", color: "#ef4444" },
];

// Classify a heart rate into NASM zone
export function classifyHRZone(hr, age, formula = "regression", maxHROverride = null) {
  const { maxHR, zones } = getNASMZones(age, formula, maxHROverride);
  const pctMax = (hr / maxHR) * 100;
  if (pctMax >= 86) return { zone: 3, pctMax: Math.round(pctMax), ...zones[2] };
  if (pctMax >= 76) return { zone: 2, pctMax: Math.round(pctMax), ...zones[1] };
  if (pctMax >= 65) return { zone: 1, pctMax: Math.round(pctMax), ...zones[0] };
  return { zone: 0, pctMax: Math.round(pctMax), name: "Below Zone 1", color: "#94a3b8", desc: "Very light — warm-up intensity" };
}

// Talk test zone determination
export function talkTestZone(response) {
  // response: "easy" | "harder" | "few_words" | "cant_talk"
  switch (response) {
    case "easy": return { zone: 1, guidance: "You're in Zone 1. Pick up the pace slightly if you want Zone 2." };
    case "harder": return { zone: 2, guidance: "Zone 2 — perfect for today's prescription." };
    case "few_words": return { zone: 3, guidance: "Zone 3 — high intensity. Make sure this is prescribed today." };
    case "cant_talk": return { zone: 0, guidance: "Above Zone 3 — slow down unless doing prescribed HIIT intervals." };
    default: return { zone: 1, guidance: "Keep it conversational." };
  }
}

// ═══════════════════════════════════════════════════════════════
// 3. VO2 MAX ESTIMATION — 4 TEST OPTIONS
// ═══════════════════════════════════════════════════════════════

// OPTION A: YMCA 3-Minute Step Test
// Input: 60-second recovery HR after 3 min of stepping at 96 BPM on 12-inch bench
export function calcVO2StepTest(recoveryHR, age, genderMale) {
  // YMCA estimation: VO2max ≈ 65.81 − (0.1847 × recovery_HR)
  // This is an approximation; the primary use is norm-table classification
  const vo2 = Math.round((65.81 - (0.1847 * recoveryHR)) * 10) / 10;
  return Math.max(10, Math.min(80, vo2));
}

// YMCA 3-Minute Step Test Norms (recovery HR in 60 seconds)
// [Excellent, Good, Above Average, Average, Below Average, Poor, Very Poor]
// Lower HR = better recovery fitness
const STEP_NORMS_MALE = [
  // [ageMin, ageMax, excellent, good, aboveAvg, average, belowAvg, poor, veryPoor]
  [18, 25, 79, 89, 99, 105, 115, 128, 200],
  [26, 35, 81, 89, 99, 107, 117, 128, 200],
  [36, 45, 83, 95, 103, 111, 119, 130, 200],
  [46, 55, 87, 97, 105, 113, 121, 131, 200],
  [56, 65, 86, 97, 105, 112, 120, 130, 200],
  [66, 99, 88, 99, 107, 114, 121, 130, 200],
];
const STEP_NORMS_FEMALE = [
  [18, 25, 85, 93, 101, 108, 116, 128, 200],
  [26, 35, 88, 95, 102, 110, 118, 129, 200],
  [36, 45, 90, 98, 105, 112, 120, 131, 200],
  [46, 55, 94, 102, 108, 115, 122, 133, 200],
  [56, 65, 95, 104, 110, 117, 124, 134, 200],
  [66, 99, 96, 105, 112, 119, 127, 135, 200],
];

export function getStepTestCategory(recoveryHR, age, genderMale) {
  const norms = genderMale ? STEP_NORMS_MALE : STEP_NORMS_FEMALE;
  const row = norms.find(r => age >= r[0] && age <= r[1]) || norms[norms.length - 1];
  const [, , exc, good, abAvg, avg, belAvg, poor] = row;

  if (recoveryHR <= exc) return { label: "Excellent", color: "#22c55e", emoji: "🏆", startZone: "2-3" };
  if (recoveryHR <= good) return { label: "Good", color: "#22c55e", emoji: "⭐", startZone: "2" };
  if (recoveryHR <= abAvg) return { label: "Above Average", color: "#00d2c8", emoji: "👍", startZone: "2" };
  if (recoveryHR <= avg) return { label: "Average", color: "#eab308", emoji: "😐", startZone: "1-2" };
  if (recoveryHR <= belAvg) return { label: "Below Average", color: "#f97316", emoji: "😟", startZone: "1-2" };
  if (recoveryHR <= poor) return { label: "Poor", color: "#ef4444", emoji: "⚠️", startZone: "1" };
  return { label: "Very Poor", color: "#ef4444", emoji: "⚠️", startZone: "1" };
}

// Determine starting cardio zone from step test recovery HR category
export function getStartingZoneFromStepTest(category) {
  switch (category) {
    case "Very Poor": case "Poor": return { zone: 1, range: "65-75% HRmax", desc: "Start with Zone 1 base building" };
    case "Below Average": case "Average": return { zone: 1, range: "65-80% HRmax", desc: "Zone 1-2 — build base, introduce moderate work" };
    case "Above Average": case "Good": return { zone: 2, range: "76-85% HRmax", desc: "Zone 2 aerobic development" };
    case "Excellent": return { zone: 2, range: "76-95% HRmax", desc: "Zone 2-3 — ready for intervals" };
    default: return { zone: 1, range: "65-75% HRmax", desc: "Start conservative" };
  }
}

// OPTION B: Rockport 1-Mile Walk Test (NASM recommended for general population)
// gender: 1 = male, 0 = female
export function calcVO2Rockport(weightLbs, age, genderMale, timeMinutes, heartRate) {
  const gender = genderMale ? 1 : 0;
  return Math.round(
    (132.853 - (0.0769 * weightLbs) - (0.3877 * age) + (6.315 * gender) - (3.2649 * timeMinutes) - (0.1565 * heartRate)) * 10
  ) / 10;
}

// OPTION C: Cooper 1.5-Mile Run Test (active/athletic users)
export function calcVO2Cooper(timeMinutes) {
  return Math.round(((483 / timeMinutes) + 3.5) * 10) / 10;
}

// ACSM VO2 Fitness Categories
const VO2_NORMS_MALE = [
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
// 4. CARDIO PRESCRIPTION — NASM OPT-ALIGNED
// ═══════════════════════════════════════════════════════════════

const NASM_CARDIO_RX = {
  1: {
    zones: [1], zoneLabel: "Zone 1 only",
    minDur: 20, maxDur: 30, freqPerWeek: 2, freqMax: 3,
    activities: ["Walking", "Cycling", "Swimming", "Elliptical"],
    intensity: "Conversational pace — can talk easily",
    guidance: "Build your aerobic base. Keep it comfortable.",
    type: "Base Building",
  },
  2: {
    zones: [1, 2], zoneLabel: "Zone 1-2",
    minDur: 25, maxDur: 35, freqPerWeek: 3, freqMax: 4,
    activities: ["Brisk Walking", "Cycling", "Rowing", "Elliptical", "Swimming"],
    intensity: "Can speak in short sentences",
    guidance: "Pushing into moderate territory. You should be able to talk in sentences.",
    type: "Endurance",
  },
  3: {
    zones: [2], zoneLabel: "Zone 2",
    minDur: 25, maxDur: 35, freqPerWeek: 3, freqMax: 4,
    activities: ["Brisk Walking", "Cycling", "Rowing", "Elliptical", "Jogging"],
    intensity: "Moderate sustained effort",
    guidance: "Moderate sustained effort. This is where heart efficiency improves.",
    type: "Aerobic",
  },
  4: {
    zones: [2, 3], zoneLabel: "Zone 2-3 intervals",
    minDur: 20, maxDur: 30, freqPerWeek: 2, freqMax: 3,
    activities: ["HIIT Intervals", "Cycling Intervals", "Rowing Intervals", "Circuit Training"],
    intensity: "Alternating moderate and hard effort",
    guidance: "Interval training: alternate Zone 2 and Zone 3 efforts.",
    type: "Interval",
  },
  5: {
    zones: [3, 1], zoneLabel: "Zone 3 intervals + Zone 1 recovery",
    minDur: 20, maxDur: 25, freqPerWeek: 2, freqMax: 3,
    activities: ["HIIT", "Sprint Intervals", "Tempo Runs", "Sport-Specific Drills"],
    intensity: "High-intensity with full recovery",
    guidance: "High-intensity intervals with full recovery between. Short and explosive.",
    type: "Performance",
  },
};

const INJURY_MODS = {
  knee: { avoid: ["Running", "Jogging", "Jumping", "Sprint Intervals", "Stairs"], prefer: ["Cycling", "Swimming", "Rowing", "Walking", "Elliptical"], threshold: 3 },
  lower_back: { avoid: ["Running", "Rowing Intervals", "Jumping"], prefer: ["Walking", "Cycling", "Swimming", "Elliptical"], threshold: 3 },
  shoulder: { avoid: ["Swimming", "Battle Ropes"], prefer: ["Walking", "Cycling", "Elliptical", "Rowing"], threshold: 3 },
};

export function getCardioPrescription(phase = 1, injuries = []) {
  const rx = NASM_CARDIO_RX[phase] || NASM_CARDIO_RX[1];
  let activities = [...rx.activities];

  for (const inj of injuries) {
    const gateKey = inj.gateKey || inj.area?.toLowerCase().replace(/\s+/g, "_");
    const mod = INJURY_MODS[gateKey];
    if (mod && inj.severity >= mod.threshold) {
      activities = activities.filter(a => !mod.avoid.some(av => a.toLowerCase().includes(av.toLowerCase())));
      if (activities.length === 0) activities = [...mod.prefer];
    }
  }

  const avgDur = Math.round((rx.minDur + rx.maxDur) / 2);
  const weeklyTarget = avgDur * rx.freqPerWeek;

  return {
    phase,
    type: rx.type,
    activities,
    duration: `${rx.minDur}-${rx.maxDur} min`,
    frequency: `${rx.freqPerWeek}-${rx.freqMax}x/week`,
    intensity: rx.intensity,
    guidance: rx.guidance,
    zones: rx.zones,
    zoneLabel: rx.zoneLabel,
    weeklyTargetMinutes: weeklyTarget,
    sessionsPerWeek: rx.freqPerWeek,
  };
}

// ═══════════════════════════════════════════════════════════════
// 5. CALORIE ESTIMATION (ACSM MET × weight × duration)
// ═══════════════════════════════════════════════════════════════

const MET_VALUES = {
  Walking: 3.5, "Brisk Walking": 4.5, Cycling: 6.0, Swimming: 7.0,
  Rowing: 7.0, Elliptical: 5.5, Running: 8.0, Jogging: 7.0,
  HIIT: 8.0, "HIIT Intervals": 8.0, "Cycling Intervals": 7.5,
  "Rowing Intervals": 7.5, "Circuit Training": 6.0, "Sprint Intervals": 10.0,
  "Tempo Runs": 9.0, "Sport-Specific Drills": 7.0, "Sport-Specific": 7.0,
};

export function estimateCalories(activityType, durationMinutes, weightLbs) {
  const met = MET_VALUES[activityType] || 5.0;
  const weightKg = weightLbs / 2.205;
  // Calories = MET × weight_kg × duration_hours
  return Math.round(met * weightKg * (durationMinutes / 60));
}

// ═══════════════════════════════════════════════════════════════
// 6. CARDIO SESSION TRACKING (enhanced)
// ═══════════════════════════════════════════════════════════════

export function saveCardioSession(session) {
  const hrSettings = getHRSettings();
  const age = hrSettings.age || 35;

  // Auto-classify zone from HR if provided
  let autoZone = session.zone || null;
  let autoZoneLabel = null;
  if (session.avgHR && !hrSettings.betaBlocker) {
    const classified = classifyHRZone(session.avgHR, age, hrSettings.formula);
    autoZone = classified.zone;
    autoZoneLabel = `Zone ${classified.zone} (${classified.pctMax}% HRmax)`;
  } else if (session.rpe) {
    autoZone = session.rpe <= 4 ? 1 : session.rpe <= 6 ? 2 : 3;
    autoZoneLabel = `Zone ${autoZone} (RPE ${session.rpe})`;
  }

  // Estimate calories
  const calories = session.calories || estimateCalories(session.type, session.duration, hrSettings.weight || 185);

  const entry = {
    id: `cs_${Date.now()}`,
    date: new Date().toISOString(),
    type: session.type || "Walking",
    duration: session.duration || 0,
    distance: session.distance || null,
    avgHR: session.avgHR || null,
    rpe: session.rpe || 5,
    zone: autoZone,
    zoneLabel: autoZoneLabel,
    calories,
    notes: session.notes || "",
    route: session.route || "",
  };

  try {
    const sessions = JSON.parse(localStorage.getItem(LS_CARDIO) || "[]");
    sessions.push(entry);
    localStorage.setItem(LS_CARDIO, JSON.stringify(sessions));
  } catch { /* full */ }

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

// Get weekly zone distribution
export function getWeeklyZoneMinutes() {
  const sessions = getCardioSessions();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recent = sessions.filter(s => new Date(s.date) >= weekAgo);
  const zones = { 1: 0, 2: 0, 3: 0 };
  for (const s of recent) {
    const z = s.zone || 1;
    if (z >= 1 && z <= 3) zones[z] += (s.duration || 0);
  }
  return zones;
}

// ═══════════════════════════════════════════════════════════════
// 7. VO2 MAX TEST STORAGE
// ═══════════════════════════════════════════════════════════════

export function saveVO2Test(result) {
  const entry = {
    id: `v_${Date.now()}`,
    date: new Date().toISOString(),
    testType: result.testType, // "ymca_step" | "rockport" | "cooper" | "talk_test"
    timeMinutes: result.timeMinutes || null,
    heartRate: result.heartRate || null,
    recoveryHR: result.recoveryHR || null,
    vo2max: result.vo2max || null,
    category: result.category,
    startingZone: result.startingZone || null,
  };

  try {
    const tests = JSON.parse(localStorage.getItem(LS_VO2) || "[]");
    tests.push(entry);
    localStorage.setItem(LS_VO2, JSON.stringify(tests));
  } catch { /* full */ }

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
  const last = tests[tests.length - 1];
  const prev = tests[tests.length - 2];
  // Compare VO2 if both have it, otherwise compare categories
  if (last.vo2max && prev.vo2max) {
    const diff = last.vo2max - prev.vo2max;
    const pctChange = Math.round((diff / prev.vo2max) * 100);
    return { current: last.vo2max, previous: prev.vo2max, diff, pctChange, improving: diff > 0 };
  }
  return null;
}

export function getNextTestDate() {
  const tests = getVO2Tests();
  if (tests.length === 0) return null;
  const lastDate = new Date(tests[tests.length - 1].date);
  lastDate.setDate(lastDate.getDate() + 56); // 8 weeks
  return lastDate;
}

export function getRetestDue() {
  const nextDate = getNextTestDate();
  if (!nextDate) return { due: false, daysUntil: null };
  const now = new Date();
  const diff = Math.ceil((nextDate - now) / 86400000);
  return { due: diff <= 0, daysUntil: diff, nextDate };
}

// ═══════════════════════════════════════════════════════════════
// 8. HR SETTINGS (resting HR, max HR, BP, beta-blocker, formula)
// ═══════════════════════════════════════════════════════════════

export function getHRSettings() {
  try { return JSON.parse(localStorage.getItem(LS_HR) || "{}"); }
  catch { return {}; }
}

export function setHRSettings(settings) {
  try {
    const current = getHRSettings();
    const merged = { ...current, ...settings };
    localStorage.setItem(LS_HR, JSON.stringify(merged));
  } catch { /* full */ }
}

// ═══════════════════════════════════════════════════════════════
// 9. STEP TEST CONTRAINDICATION CHECK
// ═══════════════════════════════════════════════════════════════

export function getRecommendedTest(injuries = [], phase = 1) {
  const hasKnee = injuries.some(i => (i.area || "").toLowerCase().includes("knee") && i.severity >= 3);
  const hasHip = injuries.some(i => (i.type || "").toLowerCase().includes("replacement"));
  const hasBalance = injuries.some(i => (i.area || "").toLowerCase().includes("balance"));
  const hasAnkle = injuries.some(i => (i.area || "").toLowerCase().includes("ankle") && i.severity >= 3);
  const hasCardiac = injuries.some(i => (i.area || "").toLowerCase().includes("cardio") || (i.area || "").toLowerCase().includes("heart"));
  const hasLowerBody = injuries.some(i => {
    const a = (i.area || "").toLowerCase();
    return (a.includes("knee") || a.includes("ankle") || a.includes("hip") || a.includes("back")) && i.severity >= 3;
  });

  if (hasCardiac) return { test: "talk_test", reason: "Cardiac condition — the Talk Test is safest for determining your training zone." };
  if (hasKnee || hasHip || hasBalance || hasAnkle) return { test: "rockport", reason: "The step test isn't recommended for your condition. Let's use the walking test instead." };
  if (hasLowerBody && phase < 2) return { test: "rockport", reason: "Walking test recommended during Phase 1 with lower body conditions." };
  if (phase >= 3 && !hasLowerBody) return { test: "any", reason: "All tests available — choose based on your preference and equipment." };
  return { test: "any", reason: "Choose the test that best fits your equipment and fitness level." };
}

// Legacy compatibility: old 5-zone getHRZones still exported for any remaining references
export function getHRZones(age, maxHROverride = null) {
  return getNASMZones(age, "regression", maxHROverride);
}
