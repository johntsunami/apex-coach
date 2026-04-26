// ═══════════════════════════════════════════════════════════════
// APEX Coach — Safety Audit
// Runs every exercise in exerciseDB through the actual filter chain
// (checkExerciseSafety + isExerciseBlockedByConditions + post-op
// timeline) for 10 safety-critical test profiles, reports any
// contraindicated exercise that slips through.
// ═══════════════════════════════════════════════════════════════

import exerciseDB from "../data/exercises.json";
import { checkExerciseEligibility } from "./exerciseEligibility.js";

const LS_LAST_AUDIT = "apex_last_audit";

function getDateMonthsAgo(months) {
  const d = new Date(); d.setMonth(d.getMonth() - months);
  return d.toISOString().split("T")[0];
}
function getDateWeeksAgo(weeks) {
  const d = new Date(); d.setDate(d.getDate() - weeks * 7);
  return d.toISOString().split("T")[0];
}

// Convert spec-style condition to the injury row shape the filters expect
// (conditionId is the key the safety gate uses for CONDITIONS_INDEX lookups).
function _toInjury(c) {
  return {
    id: "audit_" + c.id,
    conditionId: c.id,
    severity: c.severity || 2,
    surgeryDate: c.surgeryDate || null,
    bodyArea: c.bodyArea || null,
    status: "active",
  };
}

// ── 10 TEST PROFILES — most safety-critical conditions ──
export const TEST_PROFILES = [
  {
    id: "fusion_lumbar_severe",
    name: "Spinal Fusion Lumbar (Sev 5, 4mo post-op)",
    conditions: [{ id: "spinal_fusion_lumbar", severity: 5, surgeryDate: getDateMonthsAgo(4) }],
    expectations: {
      maxPhaseAllowed: 3,
      mustNeverInclude: ["plyometric", "deadlift", "spinal_flexion_loaded", "max_effort", "overhead_press_barbell", "chin_up", "pull_up", "barbell_bench"],
      minRepsFloor: 8,
    },
  },
  {
    id: "fusion_cervical_recent",
    name: "Spinal Fusion Cervical (Sev 4, 3mo post-op)",
    conditions: [{ id: "spinal_fusion_cervical", severity: 4, surgeryDate: getDateMonthsAgo(3) }],
    expectations: {
      maxPhaseAllowed: 3,
      mustNeverInclude: ["behind_neck", "overhead_press_heavy", "plyometric", "cervical_load"],
      minRepsFloor: 8,
    },
  },
  {
    id: "acl_post_op",
    name: "ACL Post-Op (Sev 4, 3mo post-op)",
    conditions: [{ id: "acl_post_op", severity: 4, surgeryDate: getDateMonthsAgo(3) }],
    expectations: {
      maxPhaseAllowed: 3,
      mustNeverInclude: ["plyometric", "pivoting", "cutting", "deep_squat_early"],
      minRepsFloor: 8,
    },
  },
  {
    id: "rotator_cuff_repair",
    name: "Rotator Cuff Repair (Sev 4, 8wk post-op)",
    conditions: [{ id: "rotator_cuff_repair", severity: 4, surgeryDate: getDateWeeksAgo(8) }],
    expectations: {
      maxPhaseAllowed: 2,
      mustNeverInclude: ["overhead_press", "behind_neck", "dips", "plyometric_overhead"],
    },
  },
  {
    id: "hip_replacement_posterior",
    name: "Hip Replacement Posterior (Sev 4, 6wk post-op)",
    conditions: [{ id: "total_hip_replacement", severity: 4, surgeryDate: getDateWeeksAgo(6) }],
    expectations: {
      maxPhaseAllowed: 2,
      mustNeverInclude: ["hip_flexion_past_90", "hip_internal_rotation", "crossing_legs", "deep_squat"],
    },
  },
  {
    id: "pregnant_third_trimester",
    name: "Pregnant 3rd Trimester (Healthy)",
    conditions: [{ id: "pregnancy_2nd_3rd", severity: 2 }],
    expectations: {
      maxPhaseAllowed: 2,
      mustNeverInclude: ["heavy_valsalva", "fall_risk", "contact_sports"],
    },
  },
  {
    id: "osteoporosis_severe",
    name: "Severe Osteoporosis (Sev 4)",
    conditions: [{ id: "osteoporosis", severity: 4 }],
    expectations: {
      maxPhaseAllowed: 3,
      mustNeverInclude: ["spinal_flexion_loaded", "explosive_twisting", "high_impact", "crunches"],
    },
  },
  {
    id: "fibromyalgia_flare_prone",
    name: "Fibromyalgia (Sev 4, flare-prone)",
    conditions: [{ id: "fibromyalgia", severity: 4 }],
    expectations: {
      maxPhaseAllowed: 2,
      mustNeverInclude: ["heavy_eccentric", "plyometric", "high_intensity_initially"],
      maxRPE: 6,
    },
  },
  {
    id: "multi_condition_complex",
    name: "Multi-Condition (Back + Shoulder + Knee)",
    conditions: [
      { id: "disc_herniation_chronic", severity: 3 },
      { id: "labrum_tear_shoulder", severity: 3 },
      { id: "meniscus_tear", severity: 2 },
    ],
    expectations: {
      mustNeverInclude: ["loaded_spinal_flexion", "overhead_pressing_heavy", "deep_knee_flexion_loaded"],
    },
  },
  {
    id: "healthy_baseline",
    name: "Healthy Baseline (Sanity Check)",
    conditions: [],
    expectations: {
      // Catches over-blocking: a healthy user should have access to most main exercises.
      mustHaveAtLeast: 80,
    },
  },
];

// ── PATTERN MATCHER (audit-side) ─────────────────────────────
// Mirrors the spec's mustNeverInclude keys → exercise-name regex.
const AUDIT_KEYWORDS = {
  plyometric: [/\bjump\b/i, /\bhop\b/i, /\bbound\b/i, /\bplyo\b/i, /\bsprint\b/i, /\bdepth jump\b/i],
  deadlift: [/\bdeadlift\b/i],
  spinal_flexion_loaded: [/\bcrunch\b/i, /\bsit.?up\b/i, /\bleg raise\b/i, /\bgood morning\b/i, /\bcable.*flex\b/i],
  overhead_press_barbell: [/\bbarbell.*overhead\b/i, /\bbarbell.*press\b/i, /\barnold press\b/i, /\boverhead.*barbell\b/i],
  overhead_press_heavy: [/\bbarbell.*overhead\b/i, /\bheavy.*overhead\b/i],
  overhead_pressing_heavy: [/\bbarbell.*overhead\b/i, /\bheavy.*overhead\b/i, /\boverhead.*press.*heavy\b/i],
  overhead_press: [/\boverhead.?press\b/i, /\bshoulder press\b/i],
  behind_neck: [/\bbehind.?neck\b/i],
  cervical_load: [/\bneck press\b/i, /\bneck.*flexion\b/i, /\bneck.*extension\b/i],
  pivoting: [/\bpivot\b/i],
  cutting: [/\bcutting drill\b/i],
  deep_squat_early: [/\bdeep squat\b/i, /\batg\b/i, /\bass.to.grass\b/i],
  deep_squat: [/\bdeep squat\b/i, /\batg\b/i],
  hip_flexion_past_90: [/\bdeep squat\b/i, /\bpistol\b/i],
  hip_internal_rotation: [/\binternal rotation\b/i],
  crossing_legs: [/\bcross.*leg\b/i],
  high_impact: [/\bjump\b/i, /\brun\b/i, /\bsprint\b/i, /\bbound\b/i],
  explosive_twisting: [/\brussian twist\b/i, /\bmedicine ball.*throw\b/i, /\brotational throw\b/i],
  crunches: [/\bcrunch\b/i],
  max_effort: [/\b1rm\b/i, /\bmax effort\b/i, /\b1 rep max\b/i],
  heavy_eccentric: [/\bheavy eccentric\b/i, /\btempo eccentric\b/i],
  high_intensity_initially: [/\bhiit\b/i, /\bsprint\b/i, /\btabata\b/i],
  heavy_valsalva: [/\b1rm\b/i, /\bmax effort\b/i, /\bheavy deadlift\b/i],
  fall_risk: [/\bbosu\b/i, /\bunstable\b/i, /\bsingle leg.*eyes closed\b/i],
  contact_sports: [/\bboxing\b/i, /\bsparring\b/i, /\bmma\b/i],
  dips: [/\bdips?\b/i],
  plyometric_overhead: [/\bmed ball.*overhead\b/i, /\boverhead.*throw\b/i],
  loaded_spinal_flexion: [/\bcrunch\b/i, /\bsit.?up\b/i, /\bcable.*flex\b/i, /\bweighted.*crunch\b/i],
  deep_knee_flexion_loaded: [/\bdeep squat.*barbell\b/i, /\bpistol.*loaded\b/i, /\bdeep lunge.*loaded\b/i],
  chin_up: [/\bchin.?up\b/i],
  pull_up: [/\bpull.?up\b/i],
  barbell_bench: [/\bbarbell.*bench\b/i, /\bbench.*barbell\b/i],
};

function matchesBannedPattern(exercise, pattern) {
  const name = (exercise.name || "").toLowerCase();
  const id = (exercise.id || "").toLowerCase();
  const tags = (exercise.tags || []).map(t => String(t).toLowerCase());
  const type = (exercise.type || "").toLowerCase();
  const p = String(pattern).toLowerCase();
  if (id.includes(p) || tags.includes(p) || type === p) return true;
  const regs = AUDIT_KEYWORDS[p];
  if (regs) return regs.some(rx => rx.test(name));
  return name.includes(p);
}

function parseMinRep(repsStr) {
  if (!repsStr) return null;
  const m = String(repsStr).match(/(\d+)/);
  return m ? parseInt(m[1]) : null;
}

// ── RUN AUDIT ────────────────────────────────────────────────
// For each profile + phase 1..min(5, maxPhaseAllowed||5), iterate the
// full exerciseDB and ask the same filter chain the planners use.
// Any exercise that PASSES all filters but matches a profile's
// mustNeverInclude pattern is a violation — meaning the safety gate
// has a hole that contraindicated exercises can slip through.
export function runSafetyAudit() {
  const results = [];
  const startMs = Date.now();

  for (const test of TEST_PROFILES) {
    const profileResult = {
      id: test.id,
      name: test.name,
      passed: true,
      violations: [],
      warnings: [],
      stats: { exercisesChecked: 0, exercisesAllowed: 0, phasesChecked: 0 },
    };

    try {
      const injuries = (test.conditions || []).map(_toInjury);
      const profileForGate = { conditions: injuries };
      const phaseCeiling = Math.min(5, test.expectations.maxPhaseAllowed || 5);
      profileResult.stats.phasesChecked = phaseCeiling;

      for (let phase = 1; phase <= phaseCeiling; phase++) {
        for (const ex of exerciseDB) {
          // Only audit "main" category — warmup/cooldown/foam-roll have separate rules
          if (ex.category !== "main") continue;
          if (!(ex.phaseEligibility || []).includes(phase)) continue;
          profileResult.stats.exercisesChecked++;

          // Run the actual filter chain used by the planners — single source of truth
          let blocked = false;
          let blockedBy = null;
          if (injuries.length > 0) {
            const elig = checkExerciseEligibility(ex, profileForGate, { phase, skipPhaseCheck: true });
            if (!elig.eligible) { blocked = true; blockedBy = elig.blockedBy; }
          }

          if (!blocked) profileResult.stats.exercisesAllowed++;

          // VIOLATION: exercise allowed despite matching a mustNeverInclude pattern
          if (!blocked) {
            for (const banned of (test.expectations.mustNeverInclude || [])) {
              if (matchesBannedPattern(ex, banned)) {
                profileResult.passed = false;
                profileResult.violations.push({
                  severity: "critical",
                  phase,
                  exercise: ex.name,
                  exerciseId: ex.id,
                  reason: `Allowed despite matching banned pattern "${banned}"`,
                  blockedBy: "missed_filter",
                });
                break;
              }
            }
          }

          // VIOLATION: phase ceiling — exercise allowed in a phase above the cap
          if (!blocked && test.expectations.maxPhaseAllowed && phase > test.expectations.maxPhaseAllowed) {
            profileResult.passed = false;
            profileResult.violations.push({
              severity: "critical",
              phase,
              exercise: ex.name,
              exerciseId: ex.id,
              reason: `Phase ${phase} exceeds max ${test.expectations.maxPhaseAllowed} for this condition`,
              blockedBy: "phase_ceiling",
            });
          }

          // VIOLATION: rep floor (e.g., spinal fusion = 8)
          if (!blocked && test.expectations.minRepsFloor) {
            const pp = ex.phaseParams?.[String(phase)] || {};
            const minRep = parseMinRep(pp.reps);
            if (minRep != null && minRep < test.expectations.minRepsFloor) {
              profileResult.warnings.push({
                severity: "high",
                phase,
                exercise: ex.name,
                message: `Exercise's Phase ${phase} reps "${pp.reps}" min ${minRep} is below floor ${test.expectations.minRepsFloor}`,
              });
            }
          }
        }
      }

      // Sanity check: healthy baseline shouldn't be over-blocked
      if (test.expectations.mustHaveAtLeast && profileResult.stats.exercisesAllowed < test.expectations.mustHaveAtLeast) {
        profileResult.warnings.push({
          severity: "medium",
          message: `Only ${profileResult.stats.exercisesAllowed} exercises allowed (expected at least ${test.expectations.mustHaveAtLeast}). May be over-blocking.`,
        });
      }
    } catch (err) {
      profileResult.passed = false;
      profileResult.violations.push({ severity: "critical", message: `Audit threw: ${err.message}` });
    }

    results.push(profileResult);
  }

  const audit = {
    runAt: new Date().toISOString(),
    durationMs: Date.now() - startMs,
    profilesPassed: results.filter(r => r.passed).length,
    profilesFailed: results.filter(r => !r.passed).length,
    totalViolations: results.reduce((s, r) => s + r.violations.length, 0),
    totalWarnings: results.reduce((s, r) => s + r.warnings.length, 0),
    profiles: results,
  };

  try { localStorage.setItem(LS_LAST_AUDIT, JSON.stringify(audit)); } catch {}
  return audit;
}

export function getLastAudit() {
  try { return JSON.parse(localStorage.getItem(LS_LAST_AUDIT) || "null"); } catch { return null; }
}
