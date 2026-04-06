// ═══════════════════════════════════════════════════════════════
// APEX Coach — Senior Fitness Engine
// Evidence-based multicomponent model: NASM Senior / OPT,
// CDC STEADI fall-risk, WHO older-adult guidelines, ACSM
// resistance-training, Otago Exercise Program concepts.
//
// DESIGN: Fall prevention + full physical capacity. Balance is
// prioritized when fall risk is elevated — but strength, gait,
// posture, and aerobic capacity remain co-primary at ALL risk levels.
// ═══════════════════════════════════════════════════════════════

const LS_SENIOR = "apex_senior_profile";

// ── Age Tier ────────────────────────────────────────────────────

export function getAgeTier(age) {
  if (!age || age < 60) return null; // standard adult
  if (age < 65) return "active_older"; // 60-64
  if (age < 75) return "senior"; // 65-74
  return "senior_advanced"; // 75+
}

export function deriveAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function isSeniorUser() {
  try {
    const p = JSON.parse(localStorage.getItem(LS_SENIOR) || "null");
    if (!p) return false;
    const age = p.age || deriveAge(p.dob);
    return age >= 65;
  } catch { return false; }
}

// ── Fall Risk Scoring (CDC STEADI-aligned) ──────────────────────

export function computeFallRisk(screening) {
  if (!screening) return { level: "low", score: 0, referOut: false };

  let score = 0;
  const flags = [];

  // Falls history
  if (screening.fallCount >= 3) { score += 4; flags.push("3+ falls in 12 months"); }
  else if (screening.fallCount === 2) { score += 3; flags.push("2 falls in 12 months"); }
  else if (screening.fallCount === 1) { score += 1; flags.push("1 fall in 12 months"); }

  // Unsteadiness
  if (screening.unsteadiness === "almost_always") { score += 3; flags.push("Almost always unsteady"); }
  else if (screening.unsteadiness === "often") { score += 2; flags.push("Often unsteady"); }
  else if (screening.unsteadiness === "sometimes") { score += 1; }

  // Fear of falling
  if (screening.fearOfFalling === "very_much") { score += 2; flags.push("Very afraid of falling"); }
  else if (screening.fearOfFalling === "moderately") { score += 1; }

  // Assistive device
  if (screening.assistiveDevice === "wheelchair") { score += 4; flags.push("Uses wheelchair"); }
  else if (screening.assistiveDevice === "walker") { score += 3; flags.push("Uses walker"); }
  else if (screening.assistiveDevice === "cane") { score += 1; }

  // Chair rise
  if (screening.chairRise === "unable") { score += 3; flags.push("Cannot rise from chair"); }
  else if (screening.chairRise === "hands_only") { score += 2; }
  else if (screening.chairRise === "difficulty") { score += 1; }

  // Walking tolerance
  if (screening.walkingTolerance === "no") { score += 3; flags.push("Cannot walk 10 min"); }
  else if (screening.walkingTolerance === "few_minutes") { score += 2; }

  // Dizziness
  if (screening.dizziness === "often") { score += 2; flags.push("Frequent dizziness"); }
  else if (screening.dizziness === "sometimes") { score += 1; }

  // Objective tests
  if (screening.tugSeconds > 20) { score += 3; flags.push("TUG > 20s"); }
  else if (screening.tugSeconds >= 12) { score += 1; }

  if (screening.balanceStage <= 2) { score += 2; flags.push("Failed balance at stage " + screening.balanceStage); }

  // Chair stand (below average for age)
  if (screening.chairStandFlag === "below_average") { score += 1; }

  // Determine level
  let level = "low";
  if (score >= 6) level = "high";
  else if (score >= 2) level = "moderate";

  // Refer out check
  const referOut = screening.dizziness === "often" ||
    (screening.fallCount >= 1 && screening.recentInjuriousFall) ||
    screening.chestPainDuringActivity ||
    screening.syncope ||
    screening.newNeuroSymptoms ||
    screening.rapidGaitWorsening;

  return { level, score, flags, referOut };
}

// ── Senior Profile Storage ──────────────────────────────────────

export function getSeniorProfile() {
  try { return JSON.parse(localStorage.getItem(LS_SENIOR) || "null"); } catch { return null; }
}

export function saveSeniorProfile(data) {
  try { localStorage.setItem(LS_SENIOR, JSON.stringify({ ...data, updatedAt: new Date().toISOString() })); } catch {}
}

// ── Session Volume Weighting ────────────────────────────────────

export function getSeniorVolumeWeights(fallRisk) {
  if (fallRisk === "high") return { balance: 0.32, strength: 0.35, gait: 0.22, aerobic: 0.11, power: 0 };
  if (fallRisk === "moderate") return { balance: 0.27, strength: 0.40, gait: 0.20, aerobic: 0.13, power: 0 };
  return { balance: 0.18, strength: 0.50, gait: 0.17, aerobic: 0.15, power: 0 }; // low
}

// ── Senior Exercise Slot Allocation ─────────────────────────────
// Given total exercise slots and fall risk, return how many per category

export function allocateSeniorSlots(totalSlots, fallRisk) {
  const w = getSeniorVolumeWeights(fallRisk);
  return {
    balance: Math.max(fallRisk === "low" ? 2 : 3, Math.round(totalSlots * w.balance)),
    strength: Math.max(4, Math.round(totalSlots * w.strength)), // minimum 4 strength exercises always
    gait: Math.max(1, Math.round(totalSlots * w.gait)),
    aerobic: Math.max(1, Math.round(totalSlots * w.aerobic)),
    power: 0, // unlocked later via progression
  };
}

// ── Senior Dosing Parameters ────────────────────────────────────

export function getSeniorDosing(fallRisk, phase) {
  if (fallRisk === "high") return { sets: "1-2", reps: "8-12", rpeMin: 4, rpeMax: 6, rest: "90-120s", balanceHold: "10-20s" };
  if (fallRisk === "moderate") return { sets: "1-3", reps: "8-12", rpeMin: 5, rpeMax: 7, rest: "60-120s", balanceHold: "15-30s" };
  return { sets: "2-3", reps: "6-12", rpeMin: 6, rpeMax: 7, rest: "60-90s", balanceHold: "20-30s" }; // low
}

// ── Power Unlock Check ──────────────────────────────────────────

export function isPowerUnlocked(seniorProfile) {
  if (!seniorProfile) return false;
  const s = seniorProfile;
  return (
    s.fallRiskLevel === "low" &&
    (s.recentFalls || 0) === 0 &&
    (s.tugSeconds || 99) <= 14 &&
    (s.chairStandFlag === "average" || s.chairStandFlag === "above_average") &&
    (s.confidenceLevel || 0) >= 3
  );
}

// ── Balance Progression Level ───────────────────────────────────

export function getBalanceProgressionLevel(seniorProfile) {
  if (!seniorProfile) return 1;
  const s = seniorProfile;
  if (s.balanceStage >= 4 && s.fallRiskLevel === "low") return 5;
  if (s.balanceStage >= 3 && (s.fallRiskLevel === "low" || s.fallRiskLevel === "moderate")) return 4;
  if (s.balanceStage >= 3) return 3;
  if (s.balanceStage >= 2) return 2;
  return 1;
}

// ── Senior-Specific Check-In Additions ──────────────────────────

export function getSeniorCheckInQuestions() {
  return [
    { id: "pain_today", q: "Any pain today?", opts: ["None", "Mild", "Moderate", "Severe"] },
    { id: "dizzy_today", q: "Feeling dizzy or lightheaded?", opts: ["No", "A little", "Yes — significant"] },
    { id: "energy_today", q: "How is your energy?", opts: ["Good", "OK", "Low", "Very low"] },
    { id: "safe_environment", q: "Is your environment safe? Chair and support available?", opts: ["Yes", "No — I'll find support"] },
  ];
}

// ── Chair Stand Normative Tables (CDC STEADI) ───────────────────

const CHAIR_STAND_NORMS = {
  // [age_group]: { male: { below, average, above }, female: { below, average, above } }
  "65-69": { male: { below: 11, average: 14, above: 17 }, female: { below: 10, average: 13, above: 16 } },
  "70-74": { male: { below: 10, average: 13, above: 16 }, female: { below: 9, average: 12, above: 15 } },
  "75-79": { male: { below: 9, average: 12, above: 15 }, female: { below: 8, average: 11, above: 14 } },
  "80+":   { male: { below: 7, average: 10, above: 14 }, female: { below: 6, average: 9, above: 13 } },
};

export function scoreChairStand(reps, age, gender = "male") {
  const group = age >= 80 ? "80+" : age >= 75 ? "75-79" : age >= 70 ? "70-74" : "65-69";
  const norms = CHAIR_STAND_NORMS[group]?.[gender] || CHAIR_STAND_NORMS["65-69"].male;
  if (reps >= norms.above) return "above_average";
  if (reps >= norms.below) return "average";
  return "below_average";
}

// ── Strength Floor — minimum patterns per session ───────────────
// These patterns CANNOT be removed even for HIGH fall risk users.
// Instead, exercises are selected from supported/seated versions.

export const SENIOR_STRENGTH_FLOOR = [
  { pattern: "knee_dominant", label: "Squat/leg press/step-up", examples: ["sit_to_stand", "goblet_squat_to_chair", "leg_press", "step_up_low"] },
  { pattern: "hip_dominant", label: "Bridge/hip extension", examples: ["glute_bridge", "hip_extension_standing", "deadlift_supported"] },
  { pattern: "pull", label: "Row/pulldown", examples: ["seated_row", "band_row", "lat_pulldown"] },
  { pattern: "push", label: "Push-up/press", examples: ["wall_push_up", "incline_push_up", "seated_press"] },
  { pattern: "calf_ankle", label: "Heel/toe raises", examples: ["calf_raise_standing", "toe_raise"] },
  { pattern: "functional", label: "Sit-to-stand/carry/step", examples: ["sit_to_stand", "farmer_carry", "step_practice"] },
];

// ── Senior Session Template Labels ──────────────────────────────

export const SENIOR_SESSION_PHASES = [
  { id: "readiness", label: "Safety Check", duration: "1-3 min", icon: "🩺" },
  { id: "mobility", label: "Movement Prep", duration: "4-8 min", icon: "🧘" },
  { id: "balance", label: "Balance & Stability", duration: "6-15 min", icon: "⚖️" },
  { id: "strength", label: "Strength & Function", duration: "15-30 min", icon: "💪" },
  { id: "aerobic", label: "Aerobic & Gait", duration: "5-20 min", icon: "🚶" },
  { id: "cooldown", label: "Cooldown & Recovery", duration: "3-8 min", icon: "🌿" },
];
