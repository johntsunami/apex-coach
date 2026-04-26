// ═══════════════════════════════════════════════════════════════
// APEX Coach — Universal Safety Gate
// Single source of truth for whether an exercise is safe for a
// given profile. Layers post-op timeline, condition contraindications,
// severity gates, RTT regression, phase eligibility, and universal
// post-surgical guardrails. Called from EVERY exercise selector.
// ═══════════════════════════════════════════════════════════════

import conditionsDB from "../data/conditions.json";
import { isExerciseAllowedByPostOp, getCombinedPostOpRestrictions, getWeeksPostOp } from "./postOpTimeline.js";
import { isExerciseAllowedDuringRtt, getRttState } from "./detraining.js";

// Build a lookup keyed by both `condition` (the slug) and `id` (e.g., "A1")
const CONDITIONS_INDEX = (() => {
  const idx = {};
  for (const c of conditionsDB || []) {
    if (c.condition) idx[c.condition] = c;
    if (c.id) idx[c.id] = c;
  }
  return idx;
})();

function _conditionKey(c) {
  return c?.conditionId || c?.condition_key || c?.condition || (typeof c?.id === "string" && !c.id.startsWith("inj_") ? c.id : null) || null;
}

// Pattern matching for "avoid" entries from CONDITIONS_INDEX. Uses the
// raw avoid string and normalizes it to a comparable key.
// CRITICAL: must handle parentheses ("deadlifts (all variations)"),
// hyphens ("sit-ups/crunches"), slashes, and ALL/ANY prefix uniformly.
function _normalizeAvoid(avoid) {
  return String(avoid || "")
    .toLowerCase()
    .replace(/[-/()]/g, " ")          // hyphens, slashes, parens → spaces
    .replace(/[^a-z0-9\s]/g, "")      // strip remaining punctuation
    .replace(/\s+/g, "_")             // collapse all whitespace runs to single _
    .replace(/_+/g, "_")              // collapse multi-_ runs (defensive)
    .replace(/^_+|_+$/g, "")          // strip leading/trailing _
    .replace(/^all_/, "any_");        // unify ALL/ANY prefix
}

const PATTERN_MATCHERS = {
  any_spinal_flexion_under_load: (n) => /\b(crunch|sit.?up|leg raise|toe touch|good morning|deadlift)\b/i.test(n),
  any_spinal_rotation_under_load: (n) => /\b(russian twist|woodchop|cable rotation|landmine rotation)\b/i.test(n),
  any_spinal_extension_past_neutral: (n) => /\b(back extension|superman|hyperextension|jefferson curl)\b/i.test(n),
  deadlifts_all_variations: (n) => /\bdeadlift\b/i.test(n),
  any_deadlifts: (n) => /\bdeadlift\b/i.test(n),
  sit_ups: (n) => /\bsit.?up\b/i.test(n),
  sit_ups_crunches: (n) => /\b(sit.?up|crunch)\b/i.test(n),
  crunches: (n) => /\bcrunch\b/i.test(n),
  russian_twists: (n) => /\brussian twist\b/i.test(n),
  good_mornings: (n) => /\bgood morning\b/i.test(n),
  back_extension_machine: (n) => /\bback extension\b/i.test(n),
  plyometrics: (n, t, type) => type === "plyometric" || /\b(jump|hop|bound|plyo|sprint|depth)\b/i.test(n),
  plyometrics_all_variations: (n, t, type) => type === "plyometric" || /\b(jump|hop|bound|plyo|sprint|depth)\b/i.test(n),
  running: (n) => /\b(run|sprint|jog)\b/i.test(n),
  running_early: (n) => /\b(run|sprint|jog)\b/i.test(n),
  overhead_pressing: (n) => /\b(overhead.*press|press.*overhead|military press)\b/i.test(n),
  overhead_pressing_heavy: (n) => /\b(overhead.*press|press.*overhead).*(heavy|barbell)\b/i.test(n),
  heavy_overhead_pressing: (n) => /\b(overhead.*press|press.*overhead).*(heavy|barbell)\b/i.test(n),
  behind_neck: (n) => /\bbehind.?neck\b/i.test(n),
  behind_neck_anything: (n) => /\bbehind.?neck\b/i.test(n),
  behind_neck_pressing: (n) => /\bbehind.?neck.*press\b/i.test(n),
  headstands: (n) => /\bheadstand\b/i.test(n),
  cervical_rotation_under_load: (n) => /\bcervical.*(rotation|twist).*(load|weight)\b/i.test(n),
  neck_flexion_extension_against_resistance: (n) => /\bneck.*(flexion|extension|press)\b/i.test(n),
  toe_touches: (n) => /\btoe.?touch\b/i.test(n),
  hamstring_stretch_aggressive: (n) => /\bhamstring.*aggressive\b/i.test(n),
  high_impact: (n, t) => t.includes("high_impact") || /\b(jump|run|sprint|bound|impact)\b/i.test(n),
  high_impact_during_flares: (n, t) => t.includes("high_impact") || /\b(jump|run|sprint|bound|impact)\b/i.test(n),
  pivoting: (n) => /\bpivot\b/i.test(n),
  cutting: (n) => /\bcut\b/i.test(n),
  pivoting_cutting_before_month_9: (n) => /\b(pivot|cut)\b/i.test(n),
  deep_knee_flexion_under_load: (n) => /\b(deep squat|atg|ass.to.grass)\b/i.test(n),
  deep_squats_early: (n) => /\b(deep squat|atg|ass.to.grass)\b/i.test(n),
  deep_squats_if_painful: (n) => /\b(deep squat|atg|ass.to.grass)\b/i.test(n),
  deep_squat_past_90: (n) => /\b(deep squat|atg|ass.to.grass)\b/i.test(n),
  twisting_under_load: (n) => /\b(twist|rotation).*(weighted|loaded|barbell)\b/i.test(n),
  open_chain_knee_extension_early: (n) => /\bleg extension\b/i.test(n),
  kneeling_on_replaced_knee: (n) => /\bkneel\b/i.test(n),
  kneeling: (n) => /\bkneel\b/i.test(n),
  hip_flexion_past_90: (n) => /\bhip flexion.*(past|over).*90\b/i.test(n),
  crossing_legs: (n) => /\bcross.*leg\b/i.test(n),
  low_chairs: (n) => /\blow chair\b/i.test(n),
  heavy_axial_loading: (n) => /\b(barbell squat|barbell deadlift|heavy.*overhead|loaded.*spine)\b/i.test(n),
  heavy_axial_loading_early: (n) => /\b(barbell squat|barbell deadlift|heavy.*overhead)\b/i.test(n),
  repetitive_flexion_under_load: (n) => /\b(crunch|sit.?up).*(weighted|loaded|cable)\b/i.test(n),
  hyperextension: (n) => /\bhyperextension\b/i.test(n),
  rotation_under_load: (n) => /\b(rotation|twist).*(weighted|loaded|cable)\b/i.test(n),
  cricket_bowling_motion: (n) => /\bcricket\b/i.test(n),
  gymnastics_extension: (n) => /\bgymnastics\b/i.test(n),
  loaded_spinal_flexion: (n) => /\b(crunch|sit.?up|leg raise|cable.*flexion)\b/i.test(n),
  heavy_deadlifts_conventional: (n) => /\b(conventional deadlift|barbell deadlift)\b/i.test(n),
  conventional_deadlift: (n) => /\b(conventional deadlift|barbell deadlift)\b/i.test(n),
};

function matchesAvoidPattern(exercise, avoidStr) {
  const exId = (exercise.id || "").toLowerCase();
  const exName = (exercise.name || "").toLowerCase();
  const exTags = (exercise.tags || []).map(t => String(t).toLowerCase());
  const exType = (exercise.type || "").toLowerCase();
  const exMP = (exercise.movementPattern || "").toLowerCase();
  const key = _normalizeAvoid(avoidStr);
  if (!key) return false;
  if (exId === key) return true;
  if (exTags.includes(key)) return true;
  if (exMP === key) return true;
  if (PATTERN_MATCHERS[key]) return PATTERN_MATCHERS[key](exName, exTags, exType, exMP);
  // Substring fallback only against the avoid phrase (avoids false positives from short tokens).
  const phrase = String(avoidStr || "").toLowerCase();
  if (phrase.length >= 6 && exName.includes(phrase)) return true;
  return false;
}

// ── MAIN GATE ──────────────────────────────────────────────────
// Returns { safe, reason, blockedBy }. Call from every exercise selector.
export function checkExerciseSafety(exercise, profile, options = {}) {
  const { phase = 1, simulatedWeeksPostOp = null, skipPhaseCheck = false } = options;
  const conditions = profile?.conditions || [];

  // Translate simulatedWeeksPostOp → simulated "now" timestamp for post-op tier lookups.
  // simulatedWeeksPostOp = absolute weeks-post-op for the user at the simulated point in time.
  // We pick the largest surgery-driven offset across conditions and pass that fakeNow through.
  let simNowMs = null;
  if (typeof simulatedWeeksPostOp === "number" && conditions.length) {
    const dated = conditions.filter(c => c.surgeryDate).map(c => getWeeksPostOp(c.surgeryDate));
    const currentMaxWeeks = dated.length ? Math.max(...dated) : 0;
    const deltaWeeks = simulatedWeeksPostOp - currentMaxWeeks;
    simNowMs = Date.now() + deltaWeeks * 7 * 86400000;
  }

  // 1. Post-op timeline check (highest priority — surgeon protocols)
  if (!isExerciseAllowedByPostOp(exercise, conditions, simNowMs ?? Date.now())) {
    return { safe: false, reason: "Post-op timeline restriction", blockedBy: "post_op" };
  }

  // 2. Condition-specific avoid list + severity gate
  for (const c of conditions) {
    const key = _conditionKey(c);
    const cdata = key ? CONDITIONS_INDEX[key] : null;
    if (cdata?.avoid?.length) {
      for (const avoid of cdata.avoid) {
        if (matchesAvoidPattern(exercise, avoid)) {
          return { safe: false, reason: `${key}: ${avoid}`, blockedBy: "condition" };
        }
      }
    }
    // Severity gate (per body area)
    const gates = exercise.contraindications?.severity_gate || {};
    const gateKey = c.bodyArea || c.gateKey || (cdata?.category || "").toLowerCase();
    const gate = gates[gateKey];
    if (gate != null && (c.severity || 0) > gate) {
      return { safe: false, reason: `${key} severity ${c.severity} exceeds gate ${gate}`, blockedBy: "severity" };
    }
  }

  // 3. RTT capability regression
  const rttState = getRttState();
  if (rttState && !isExerciseAllowedDuringRtt(exercise, rttState)) {
    return { safe: false, reason: "Return-to-Training restriction", blockedBy: "rtt" };
  }

  // 4. Phase eligibility (skippable for library-style "what's available" views)
  if (!skipPhaseCheck && !(exercise.phaseEligibility || []).includes(phase)) {
    return { safe: false, reason: `Not eligible for Phase ${phase}`, blockedBy: "phase" };
  }

  // 5. Universal banned patterns for ANY post-surgical condition
  const hasAnyPostSurgical = conditions.some(c => {
    const k = (_conditionKey(c) || "").toLowerCase();
    return /(fusion|post_op|repair|replacement)/.test(k);
  });
  if (hasAnyPostSurgical) {
    if (exercise.type === "plyometric") {
      return { safe: false, reason: "Plyometrics not allowed with post-surgical condition", blockedBy: "universal" };
    }
    if (/\b(1rm|max effort|depth jump|olympic|clean|snatch|jerk)\b/i.test(exercise.name || "")) {
      return { safe: false, reason: "Max-effort lift not allowed with post-surgical condition", blockedBy: "universal" };
    }
  }

  return { safe: true, reason: null, blockedBy: null };
}

export function filterSafeExercises(exercises, profile, options = {}) {
  const out = [];
  for (const ex of exercises || []) {
    const r = checkExerciseSafety(ex, profile, options);
    if (r.safe) out.push(ex);
    else if (typeof window !== "undefined" && (import.meta?.env?.DEV || window.__APEX_SAFETY_LOG)) {
      console.log(`[SAFETY] Blocked ${ex.id} (${ex.name}): ${r.reason}`);
    }
  }
  return out;
}

// ── MEDICAL CLEARANCE GATE ─────────────────────────────────────
export function requiresMedicalClearance(profile) {
  const conditions = profile?.conditions || [];
  return conditions.some(c => {
    if ((c.severity || 0) >= 4) return true;
    const k = (_conditionKey(c) || "").toLowerCase();
    return /(fusion|post_op|repair|replacement|acl_post|meniscus_post|rotator_cuff_post)/.test(k);
  });
}

const LS_CLEARANCE = "apex_medical_clearance_confirmed";

export function isMedicalClearanceConfirmed(profile) {
  if (profile?.medicalClearanceConfirmed) return true;
  try { return localStorage.getItem(LS_CLEARANCE) === "true"; } catch { return false; }
}

export function confirmMedicalClearance() {
  try { localStorage.setItem(LS_CLEARANCE, "true"); } catch {}
  // Fire-and-forget Supabase sync of the flag
  try {
    import("./supabase.js").then(({ supabase, isSupabaseAvailable }) => {
      if (!isSupabaseAvailable()) return;
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session?.user) return;
        supabase.from("user_profiles").update({ medical_clearance_confirmed: true, medical_clearance_at: new Date().toISOString() }).eq("user_id", session.user.id).then(() => {});
      });
    });
  } catch {}
}

export function revokeMedicalClearance() {
  try { localStorage.removeItem(LS_CLEARANCE); } catch {}
}
