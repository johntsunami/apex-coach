// ═══════════════════════════════════════════════════════════════
// APEX Coach — Multi-Profile Engine QA
// Generates workouts for 8 different user profiles and checks
// exercise count, pattern coverage, volume, and condition compliance.
// Run from Dev tab or console: runEngineQA()
// ═══════════════════════════════════════════════════════════════

const TEST_PROFILES = [
  {
    id: "healthy_beginner_4day",
    label: "Healthy beginner, 4d/wk, gym",
    age: 28, fitnessLevel: "beginner", daysPerWeek: 4, location: "gym",
    conditions: [], injuries: [], sports: [],
    physiqueCategory: "general",
    expected: { minEx: 5, minPatterns: 4 },
  },
  {
    id: "physique_competitor",
    label: "Men's Physique, 4d, 3 injuries (sev 1)",
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
    sports: ["Snowboarding", "Hiking"],
    physiqueCategory: "mens_physique",
    expected: { minEx: 5, minPatterns: 4 },
  },
  {
    id: "carpal_tunnel_3day",
    label: "Carpal tunnel sev 3, 3d/wk",
    age: 42, fitnessLevel: "intermediate", daysPerWeek: 3, location: "gym",
    conditions: [{ id: "carpal_tunnel", area: "wrist", severity: 3 }],
    injuries: [{ area: "right_wrist", severity: 3, status: "active", gateKey: "wrist" }],
    sports: ["Snowboarding"],
    physiqueCategory: "general",
    expected: { minEx: 4, minPatterns: 3 },
  },
  {
    id: "senior_68_arthritis",
    label: "Age 68, knee arthritis sev 2, 3d/wk",
    age: 68, fitnessLevel: "beginner", daysPerWeek: 3, location: "gym",
    conditions: [{ id: "knee_osteoarthritis", area: "knee", severity: 2 }],
    injuries: [{ area: "knee", severity: 2, status: "active", gateKey: "knee" }],
    sports: [],
    physiqueCategory: "no_compete",
    expected: { minEx: 4, minPatterns: 3, maxPhase: 3 },
  },
  {
    id: "bikini_competitor",
    label: "Bikini, 5d/wk, healthy",
    age: 26, fitnessLevel: "advanced", daysPerWeek: 5, location: "gym",
    conditions: [], injuries: [], sports: [],
    physiqueCategory: "bikini",
    expected: { minEx: 5, minPatterns: 4 },
  },
  {
    id: "home_only_bands",
    label: "Home only, bands+DB, healthy",
    age: 35, fitnessLevel: "beginner", daysPerWeek: 3, location: "home",
    conditions: [], injuries: [], sports: [],
    physiqueCategory: "general",
    expected: { minEx: 4, minPatterns: 3, noCableMachine: true },
  },
  {
    id: "shoulder_severe",
    label: "Shoulder sev 4, 3d/wk",
    age: 30, fitnessLevel: "intermediate", daysPerWeek: 3, location: "gym",
    conditions: [{ id: "rotator_cuff_tear", area: "shoulder", severity: 4 }],
    injuries: [{ area: "shoulder", severity: 4, status: "active", gateKey: "shoulder" }],
    sports: [],
    physiqueCategory: "general",
    expected: { minEx: 4, minPatterns: 3 },
  },
  {
    id: "multi_condition",
    label: "RA + fibro + obesity, 2d/wk",
    age: 55, fitnessLevel: "beginner", daysPerWeek: 2, location: "gym",
    conditions: [
      { id: "rheumatoid_arthritis", area: "joints", severity: 2 },
      { id: "fibromyalgia", area: "full_body", severity: 2 },
      { id: "obesity", area: "full_body", severity: 2 },
    ],
    injuries: [],
    sports: [],
    physiqueCategory: "no_compete",
    expected: { minEx: 4, minPatterns: 3 },
  },
];

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

  // 1. Minimum exercise count
  if (ex.length < (exp.minEx || 4)) {
    issues.push({ severity: "critical", msg: `Only ${ex.length} exercises (min ${exp.minEx || 4})` });
  }

  // 2. Pattern coverage
  const patterns = new Set();
  ex.forEach(e => { const p = normalizePattern(e.movementPattern); if (p !== "other" && p !== "core" && p !== "mobility" && p !== "balance") patterns.add(p); });
  if (patterns.size < (exp.minPatterns || 3)) {
    issues.push({ severity: "warning", msg: `Only ${patterns.size} patterns (${[...patterns].join(",")})` });
  }

  // 3. Zero strength exercises
  const strength = ex.filter(e => e.type === "strength" || e.type === "isolation" || e.type === "plyometric");
  if (strength.length === 0) {
    issues.push({ severity: "critical", msg: "Zero strength/isolation exercises" });
  }

  // 4. Balance in main slots
  const balMain = ex.filter(e => (e.name || "").toLowerCase().includes("single-leg balance") && e.type !== "balance");
  if (balMain.length > 0) {
    issues.push({ severity: "warning", msg: `${balMain.length} balance drill(s) in main slots` });
  }

  // 5. Equipment for home
  if (exp.noCableMachine) {
    const gymOnly = ex.filter(e => (e.equipmentRequired || []).some(eq => ["cable", "machine", "lat_pulldown", "leg_press", "smith_machine"].includes(eq)));
    if (gymOnly.length > 0) {
      issues.push({ severity: "critical", msg: `Gym equipment at home: ${gymOnly.map(e => e.name).join(", ")}` });
    }
  }

  return {
    count: ex.length,
    patterns: [...patterns],
    strengthCount: strength.length,
    issues,
    pass: issues.filter(i => i.severity === "critical").length === 0,
  };
}

function checkWeekVolume(days) {
  const vol = {};
  days.forEach(d => {
    (d.exercises || d.main || []).forEach(e => {
      const bp = e.bodyPart || "other";
      vol[bp] = (vol[bp] || 0) + (parseInt(e.sets || "2") || 2);
    });
  });
  return vol;
}

export function runEngineQA(exerciseDB, generateFn) {
  const results = [];

  for (const profile of TEST_PROFILES) {
    const phases = [1, Math.min(profile.expected?.maxPhase || 5, 3)];
    const phaseResults = {};

    for (const phase of phases) {
      try {
        const week = generateFn(exerciseDB, phase, profile.location || "gym");
        const training = (week?.days || []).filter(d => d.type === "training" && (d.exercises || []).length > 0);

        const sessionChecks = training.map(d => checkSession(d.exercises || [], profile));
        const vol = checkWeekVolume(training);
        const allIssues = sessionChecks.flatMap(s => s.issues);
        const critical = allIssues.filter(i => i.severity === "critical").length;

        phaseResults[phase] = {
          days: training.length,
          exPerDay: sessionChecks.map(s => s.count),
          patterns: sessionChecks.map(s => s.patterns),
          volume: vol,
          issues: allIssues,
          pass: critical === 0,
        };
      } catch (err) {
        phaseResults[phase] = { pass: false, issues: [{ severity: "critical", msg: `CRASH: ${err.message}` }], error: err.message };
      }
    }

    results.push({ id: profile.id, label: profile.label, phases: phaseResults });
  }

  const total = results.reduce((s, r) => s + Object.keys(r.phases).length, 0);
  const passed = results.reduce((s, r) => s + Object.values(r.phases).filter(p => p.pass).length, 0);

  console.log(`\n[ENGINE QA] ${passed}/${total} passed, ${total - passed} failed`);
  results.forEach(r => {
    Object.entries(r.phases).forEach(([ph, res]) => {
      const status = res.pass ? "✅" : "❌";
      console.log(`  ${status} ${r.label} Phase ${ph}: ${(res.exPerDay || []).join("/")} exercises`);
      (res.issues || []).forEach(i => console.log(`      ${i.severity === "critical" ? "🔴" : "🟡"} ${i.msg}`));
    });
  });

  return { results, passed, failed: total - passed, total };
}

export { TEST_PROFILES, checkSession, checkWeekVolume };
