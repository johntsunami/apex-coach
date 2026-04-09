// ═══════════════════════════════════════════════════════════════
// APEX Coach — Multi-Profile Engine QA (Expanded)
// Auto-generates test profiles for every condition, physique
// category, age tier, and location type. Run from Dev tab.
// ═══════════════════════════════════════════════════════════════

// ── CORE PROFILES (always run) ──────────────────────────────
const CORE_PROFILES = [
  {
    id: "healthy_beginner_4day", label: "Healthy beginner, 4d/wk, gym",
    age: 28, fitnessLevel: "beginner", daysPerWeek: 4, location: "gym",
    conditions: [], injuries: [], sports: [], physiqueCategory: "general",
    expected: { minEx: 5, minPatterns: 4 },
  },
  {
    id: "physique_competitor", label: "Men's Physique, 4d, 3 injuries (sev 1)",
    age: 35, fitnessLevel: "intermediate", daysPerWeek: 4, location: "gym",
    conditions: [
      { id: "microdiscectomy", area: "lower_back", severity: 1 },
      { id: "labrum_tear_shoulder", area: "shoulder", severity: 1 },
      { id: "acl_post_op", area: "knee", severity: 1 },
    ],
    injuries: [
      { area: "lower_back", severity: 1, status: "active", gateKey: "lower_back" },
      { area: "left_shoulder", severity: 1, status: "active", gateKey: "shoulder" },
      { area: "left_knee", severity: 1, status: "active", gateKey: "knee" },
    ],
    sports: ["Snowboarding", "Hiking"], physiqueCategory: "mens_physique",
    expected: { minEx: 5, minPatterns: 4 },
  },
  {
    id: "home_only_bands", label: "Home only, bands+DB, healthy",
    age: 35, fitnessLevel: "beginner", daysPerWeek: 3, location: "home",
    conditions: [], injuries: [], sports: [], physiqueCategory: "general",
    expected: { minEx: 4, minPatterns: 3, noCableMachine: true },
  },
  {
    id: "outdoor_only", label: "Outdoor only, bodyweight, healthy",
    age: 30, fitnessLevel: "intermediate", daysPerWeek: 3, location: "outdoor",
    conditions: [], injuries: [], sports: [], physiqueCategory: "general",
    expected: { minEx: 4, minPatterns: 3 },
  },
  {
    id: "multi_condition", label: "RA + fibro + obesity, 2d/wk",
    age: 55, fitnessLevel: "beginner", daysPerWeek: 2, location: "gym",
    conditions: [
      { id: "rheumatoid_arthritis", area: "joints", severity: 2 },
      { id: "fibromyalgia", area: "full_body", severity: 2 },
      { id: "obesity", area: "full_body", severity: 2 },
    ],
    injuries: [], sports: [], physiqueCategory: "no_compete",
    expected: { minEx: 4, minPatterns: 3 },
  },
];

// ── PHYSIQUE CATEGORY PROFILES ──────────────────────────────
const PHYSIQUE_PROFILES = [
  "general", "mens_physique", "classic_physique", "bodybuilding",
  "bikini", "figure", "wellness", "womens_physique", "no_compete",
].map(cat => ({
  id: `physique_${cat}`, label: `Physique: ${cat.replace(/_/g, " ")}`,
  age: 28, fitnessLevel: "intermediate", daysPerWeek: 4, location: "gym",
  conditions: [], injuries: [], sports: [], physiqueCategory: cat,
  expected: { minEx: 5, minPatterns: 4 },
  _group: "physique",
}));

// ── AGE TIER PROFILES ───────────────────────────────────────
const AGE_PROFILES = [
  { age: 16, label: "Youth 16" }, { age: 25, label: "Young adult 25" },
  { age: 45, label: "Middle age 45" }, { age: 58, label: "Pre-senior 58" },
  { age: 67, label: "Senior 67" }, { age: 78, label: "Elderly 78" },
].map(a => ({
  id: `age_${a.age}`, label: `${a.label}, no conditions, 3d`,
  age: a.age, fitnessLevel: "beginner", daysPerWeek: 3, location: "gym",
  conditions: [], injuries: [], sports: [], physiqueCategory: "general",
  expected: { minEx: 4, minPatterns: 3 },
  _group: "age",
}));

// ── AUTO-GENERATED CONDITION PROFILES ───────────────────────
// One profile per condition at severity 2 (common) and severity 4 (edge case)
const CONDITION_AREA_MAP = {
  carpal_tunnel: "wrist", de_quervains: "wrist", trigger_finger: "wrist",
  rotator_cuff_tear: "shoulder", labrum_tear_shoulder: "shoulder",
  frozen_shoulder: "shoulder", shoulder_impingement: "shoulder",
  acl_post_op: "knee", meniscus_tear: "knee", patellar_tendinopathy: "knee",
  knee_osteoarthritis: "knee",
  disc_herniation_chronic: "lower_back", microdiscectomy: "lower_back",
  spinal_fusion: "lower_back", spinal_stenosis: "lower_back", sciatica: "lower_back",
  hip_labral_tear: "hip", hip_bursitis: "hip", hip_osteoarthritis: "hip",
  ankle_instability: "ankle", plantar_fasciitis: "ankle", achilles_tendinopathy: "ankle",
  tennis_elbow: "elbow", golfers_elbow: "elbow",
  rheumatoid_arthritis: "joints", osteoporosis: "full_body",
  fibromyalgia: "full_body", ehlers_danlos: "joints",
  heart_failure: "full_body", copd: "full_body", hypertension_uncontrolled: "full_body",
  obesity: "full_body", type2_diabetes: "full_body",
  parkinsons: "full_body", multiple_sclerosis: "full_body",
  stroke_post: "full_body", lupus: "full_body",
  ankylosing_spondylitis: "lower_back", scoliosis: "lower_back",
};

function generateConditionProfiles() {
  const profiles = [];
  for (const [condId, area] of Object.entries(CONDITION_AREA_MAP)) {
    // Severity 2 (moderate — common real-world case)
    profiles.push({
      id: `cond_${condId}_s2`, label: `${condId.replace(/_/g, " ")} (sev 2)`,
      age: 40, fitnessLevel: "intermediate", daysPerWeek: 3, location: "gym",
      conditions: [{ id: condId, area, severity: 2 }],
      injuries: [{ area, severity: 2, status: "active", gateKey: area }],
      sports: [], physiqueCategory: "general",
      expected: { minEx: 4, minPatterns: 3 },
      _group: "cond_sev2",
    });
    // Severity 4 (severe — most likely to produce empty sessions)
    profiles.push({
      id: `cond_${condId}_s4`, label: `${condId.replace(/_/g, " ")} (sev 4)`,
      age: 40, fitnessLevel: "beginner", daysPerWeek: 3, location: "gym",
      conditions: [{ id: condId, area, severity: 4 }],
      injuries: [{ area, severity: 4, status: "active", gateKey: area }],
      sports: [], physiqueCategory: "general",
      expected: { minEx: 4, minPatterns: 2 },
      _group: "cond_sev4",
    });
  }
  return profiles;
}

// ── COMBINE ALL ─────────────────────────────────────────────
function getAllProfiles() {
  return [...CORE_PROFILES, ...PHYSIQUE_PROFILES, ...AGE_PROFILES, ...generateConditionProfiles()];
}

// ── QUALITY CHECKS ──────────────────────────────────────────
function normalizePattern(mp) {
  if (!mp) return "other";
  const p = mp.toLowerCase();
  if (["anti_rotation", "anti_extension", "anti_flexion", "breathing"].includes(p)) return "core";
  if (p === "lunge") return "squat";
  if (p === "carry") return "core";
  if (p.includes("push")) return "push";
  if (p.includes("pull")) return "pull";
  return p;
}

function checkSession(exercises, profile) {
  const issues = [];
  const ex = exercises || [];
  const exp = profile.expected || {};

  if (ex.length < (exp.minEx || 4))
    issues.push({ severity: "critical", msg: `Only ${ex.length} exercises (min ${exp.minEx || 4})` });

  const patterns = new Set();
  ex.forEach(e => { const p = normalizePattern(e.movementPattern); if (p !== "other" && p !== "core" && p !== "mobility" && p !== "balance") patterns.add(p); });
  if (patterns.size < (exp.minPatterns || 3))
    issues.push({ severity: "warning", msg: `Only ${patterns.size} patterns (${[...patterns].join(",")})` });

  const strength = ex.filter(e => e.type === "strength" || e.type === "isolation" || e.type === "plyometric");
  if (strength.length === 0)
    issues.push({ severity: "critical", msg: "Zero strength/isolation exercises" });

  const balMain = ex.filter(e => (e.name || "").toLowerCase().includes("single-leg balance"));
  if (balMain.length > 1)
    issues.push({ severity: "warning", msg: `${balMain.length} balance drills in main slots` });

  if (exp.noCableMachine) {
    const gymOnly = ex.filter(e => (e.equipmentRequired || []).some(eq => ["cable", "machine", "lat_pulldown", "leg_press", "smith_machine"].includes(eq)));
    if (gymOnly.length > 0)
      issues.push({ severity: "critical", msg: `Gym equipment at home: ${gymOnly.map(e => e.name).join(", ")}` });
  }

  return { count: ex.length, patterns: [...patterns], strengthCount: strength.length, issues, pass: issues.filter(i => i.severity === "critical").length === 0 };
}

function checkWeekVolume(days, profile) {
  const vol = {};
  days.forEach(d => {
    (d.exercises || d.main || []).forEach(e => {
      const bp = e.bodyPart || "other";
      vol[bp] = (vol[bp] || 0) + (parseInt(e.sets || "2") || 2);
    });
  });
  const issues = [];
  if (profile.physiqueCategory === "bikini" && (vol.glutes || 0) < 10)
    issues.push({ severity: "warning", msg: `Bikini glutes: ${vol.glutes || 0} sets (need 10+)` });
  if (profile.physiqueCategory === "mens_physique" && (vol.chest || 0) < 8)
    issues.push({ severity: "warning", msg: `Men's Physique chest: ${vol.chest || 0} sets (need 8+)` });
  return { volume: vol, issues };
}

// ── MASTER QA FUNCTION ──────────────────────────────────────
export function runEngineQA(exerciseDB, generateFn) {
  const allProfiles = getAllProfiles();
  const results = [];
  const groups = { core: [], physique: [], age: [], cond_sev2: [], cond_sev4: [] };

  for (const profile of allProfiles) {
    const phases = [1, Math.min(profile.expected?.maxPhase || 5, 3)];
    const phaseResults = {};

    for (const phase of phases) {
      try {
        const week = generateFn(exerciseDB, phase, profile.location || "gym");
        const training = (week?.days || []).filter(d => d.type === "training" && (d.exercises || []).length > 0);
        const sessionChecks = training.map(d => checkSession(d.exercises || [], profile));
        const volCheck = checkWeekVolume(training, profile);
        const allIssues = [...sessionChecks.flatMap(s => s.issues), ...volCheck.issues];
        const critical = allIssues.filter(i => i.severity === "critical").length;

        phaseResults[phase] = {
          days: training.length, exPerDay: sessionChecks.map(s => s.count),
          issues: allIssues, pass: critical === 0,
        };
      } catch (err) {
        phaseResults[phase] = { pass: false, issues: [{ severity: "critical", msg: `CRASH: ${err.message}` }] };
      }
    }

    const entry = { id: profile.id, label: profile.label, phases: phaseResults, _group: profile._group || "core" };
    results.push(entry);
    const grp = profile._group || "core";
    if (groups[grp]) groups[grp].push(entry);
  }

  const total = results.reduce((s, r) => s + Object.keys(r.phases).length, 0);
  const passed = results.reduce((s, r) => s + Object.values(r.phases).filter(p => p.pass).length, 0);

  console.log(`\n[ENGINE QA] ${passed}/${total} passed, ${total - passed} failed (${allProfiles.length} profiles)`);

  return { results, groups, passed, failed: total - passed, total, profileCount: allProfiles.length };
}

export { CORE_PROFILES, PHYSIQUE_PROFILES, AGE_PROFILES, CONDITION_AREA_MAP, getAllProfiles, checkSession, checkWeekVolume };
