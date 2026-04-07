// ═══════════════════════════════════════════════════════════════
// APEX Coach — Fitness Assessment Tracking
// 10 NASM standard baseline tests with reassessment scheduling
// ═══════════════════════════════════════════════════════════════

const LS_KEY = "apex_fitness_assessments";

export const ASSESSMENT_TYPES = [
  { id: "push_up", name: "Push-Up Test", unit: "reps", icon: "💪", dueWeeks: 6, desc: "Max reps with proper form" },
  { id: "squat", name: "Bodyweight Squat Test", unit: "reps", icon: "🦵", dueWeeks: 6, desc: "Max reps to parallel" },
  { id: "pull_up", name: "Pull-Up / Dead Hang", unit: "reps or seconds", icon: "🤸", dueWeeks: 6, desc: "Max pull-ups OR max hang time" },
  { id: "plank", name: "Plank Hold", unit: "seconds", icon: "🧱", dueWeeks: 6, desc: "Max time with proper form" },
  { id: "glute_bridge", name: "Glute Bridge Hold", unit: "seconds", icon: "🍑", dueWeeks: 6, desc: "Max hold at top" },
  { id: "balance", name: "Single-Leg Balance", unit: "seconds", icon: "⚖️", dueWeeks: 6, desc: "Time each leg, eyes open" },
  { id: "ohsa", name: "Overhead Squat Assessment", unit: "checkpoints", icon: "📐", dueWeeks: 4, desc: "5-checkpoint movement screen" },
  { id: "sit_reach", name: "Sit-and-Reach", unit: "inches", icon: "🧘", dueWeeks: 8, desc: "Distance from toes" },
  { id: "shoulder_rom", name: "Shoulder Flexion ROM", unit: "degrees", icon: "🤸", dueWeeks: 8, desc: "Arms overhead range" },
  { id: "rhr", name: "Resting Heart Rate", unit: "bpm", icon: "❤️", dueWeeks: 4, desc: "Seated 60-second count" },
];

export function getAssessmentResults() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; }
}

export function saveAssessmentResult(type, value, secondary = null, notes = "") {
  const results = getAssessmentResults();
  const prev = results[type];
  results[type] = {
    value, secondary, notes,
    assessedAt: new Date().toISOString(),
    nextDueAt: new Date(Date.now() + (ASSESSMENT_TYPES.find(a => a.id === type)?.dueWeeks || 6) * 7 * 86400000).toISOString(),
    previousValue: prev?.value || null,
  };
  localStorage.setItem(LS_KEY, JSON.stringify(results));
  // Fire-and-forget Supabase sync
  _syncToSupabase(type, results[type]).catch(() => {});
}

async function _syncToSupabase(type, data) {
  try {
    const { supabase, isSupabaseAvailable } = await import("./supabase.js");
    if (!isSupabaseAvailable()) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    await supabase.from("fitness_assessments").insert({
      user_id: session.user.id, assessment_type: type,
      result_value: data.value, result_unit: ASSESSMENT_TYPES.find(a => a.id === type)?.unit,
      result_secondary: data.secondary, notes: data.notes,
      assessed_at: data.assessedAt, next_due_at: data.nextDueAt,
    });
  } catch (e) { console.warn("Assessment sync failed:", e); }
}

export function getAssessmentProgress() {
  const results = getAssessmentResults();
  const completed = ASSESSMENT_TYPES.filter(a => results[a.id]);
  const incomplete = ASSESSMENT_TYPES.filter(a => !results[a.id]);
  const due = ASSESSMENT_TYPES.filter(a => {
    const r = results[a.id];
    return r && r.nextDueAt && new Date(r.nextDueAt) <= new Date();
  });
  const nextIncomplete = incomplete[0] || due[0] || null;
  return { completed: completed.length, total: ASSESSMENT_TYPES.length, incomplete, due, nextUp: nextIncomplete, results };
}

export function getDismissedToday() {
  try { return localStorage.getItem("apex_assessment_dismissed") === new Date().toISOString().split("T")[0]; } catch { return false; }
}

export function dismissForToday() {
  try { localStorage.setItem("apex_assessment_dismissed", new Date().toISOString().split("T")[0]); } catch {}
}
