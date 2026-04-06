// ═══════════════════════════════════════════════════════════════
// APEX Coach — Weight & Body Composition Tracking
// ═══════════════════════════════════════════════════════════════

const LS_WEIGHT_LOGS = "apex_weight_logs";
const LS_WEIGHT_PREFS = "apex_weight_prefs";

// ── Weight Log CRUD ─────────────────────────────────────────────

export function getWeightLogs() {
  try { return JSON.parse(localStorage.getItem(LS_WEIGHT_LOGS) || "[]"); } catch { return []; }
}

export function logWeight(weightKg, notes = "") {
  const logs = getWeightLogs();
  const entry = { id: `wl_${Date.now()}`, loggedAt: new Date().toISOString(), weightKg, notes };
  logs.push(entry);
  localStorage.setItem(LS_WEIGHT_LOGS, JSON.stringify(logs));
  // Fire-and-forget Supabase sync
  _syncWeightToSupabase(entry).catch(() => {});
  return entry;
}

async function _syncWeightToSupabase(entry) {
  try {
    const { supabase, isSupabaseAvailable } = await import("./supabase.js");
    if (!isSupabaseAvailable()) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    await supabase.from("weight_logs").insert({
      user_id: session.user.id,
      logged_at: entry.loggedAt,
      weight_kg: entry.weightKg,
      notes: entry.notes || null,
    });
  } catch (e) { console.warn("Weight sync to Supabase failed:", e); }
}

// ── Restore from Supabase ───────────────────────────────────────

export async function restoreWeightLogsFromSupabase() {
  try {
    const { supabase, isSupabaseAvailable } = await import("./supabase.js");
    if (!isSupabaseAvailable()) return false;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;
    const { data: rows, error } = await supabase.from("weight_logs").select("*").eq("user_id", session.user.id).order("logged_at", { ascending: true });
    if (error || !rows?.length) return false;
    const restored = rows.map(r => ({ id: r.id, loggedAt: r.logged_at, weightKg: r.weight_kg, notes: r.notes || "" }));
    localStorage.setItem(LS_WEIGHT_LOGS, JSON.stringify(restored));
    return true;
  } catch { return false; }
}

// ── Unit Preferences ────────────────────────────────────────────

export function getWeightUnit() {
  try {
    const assessment = JSON.parse(localStorage.getItem("apex_assessment") || "{}");
    return assessment.bodyComp?.unit || "imperial";
  } catch { return "imperial"; }
}

export function kgToLbs(kg) { return Math.round(kg * 2.2046 * 10) / 10; }
export function lbsToKg(lbs) { return Math.round(lbs * 0.4536 * 10) / 10; }
export function displayWeight(kg) { return getWeightUnit() === "imperial" ? `${kgToLbs(kg)} lbs` : `${kg} kg`; }

// ── BMI Calculation ─────────────────────────────────────────────

export function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const rounded = Math.round(bmi * 10) / 10;
  let label = "Healthy range";
  if (rounded < 18.5) label = "Underweight";
  else if (rounded >= 25 && rounded < 30) label = "Overweight";
  else if (rounded >= 30) label = "Obese range";
  return { bmi: rounded, label };
}

// ── Weight Trend Analysis ───────────────────────────────────────

export function getWeightTrend() {
  const logs = getWeightLogs();
  if (logs.length === 0) return null;

  const assessment = JSON.parse(localStorage.getItem("apex_assessment") || "{}");
  const bc = assessment.bodyComp || {};

  const latest = logs[logs.length - 1];
  const start = logs[0];
  const changeKg = Math.round((latest.weightKg - start.weightKg) * 10) / 10;

  // 7-day moving average
  const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recent = logs.filter(l => new Date(l.loggedAt) >= sevenDaysAgo);
  const movingAvg = recent.length > 0 ? Math.round(recent.reduce((s, l) => s + l.weightKg, 0) / recent.length * 10) / 10 : latest.weightKg;

  // Time to goal
  let weeksToGoal = null;
  if (bc.goalWeightKg && bc.weeklyGoalKg && bc.weeklyGoalKg > 0) {
    const remaining = Math.abs(latest.weightKg - bc.goalWeightKg);
    weeksToGoal = Math.round(remaining / bc.weeklyGoalKg);
  }

  // Direction check
  const goalType = bc.goalType;
  let onTrack = null;
  if (goalType === "lose") onTrack = changeKg < 0;
  else if (goalType === "gain") onTrack = changeKg > 0;
  else if (goalType === "maintain") onTrack = Math.abs(changeKg) < 2.3; // within ~5 lbs

  return {
    startWeight: start.weightKg,
    currentWeight: latest.weightKg,
    movingAvg,
    changeKg,
    goalWeightKg: bc.goalWeightKg,
    goalType,
    weeksToGoal,
    onTrack,
    totalLogs: logs.length,
    latestDate: latest.loggedAt,
  };
}

// ── Nudge Logic ─────────────────────────────────────────────────

export function shouldShowWeightNudge() {
  try {
    const assessment = JSON.parse(localStorage.getItem("apex_assessment") || "{}");
    if (!assessment.bodyComp?.goalType || assessment.bodyComp.goalType === "none") return false;
    const logs = getWeightLogs();
    if (logs.length === 0) return true; // never logged
    const latest = new Date(logs[logs.length - 1].loggedAt);
    const daysSince = Math.floor((Date.now() - latest.getTime()) / 86400000);
    if (daysSince < 7) return false;
    // Check if we already showed nudge today
    const lastNudge = localStorage.getItem("apex_weight_nudge_date");
    const today = new Date().toISOString().split("T")[0];
    if (lastNudge === today) return false;
    return true;
  } catch { return false; }
}

export function dismissWeightNudge() {
  localStorage.setItem("apex_weight_nudge_date", new Date().toISOString().split("T")[0]);
}
