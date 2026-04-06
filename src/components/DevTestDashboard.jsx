// ═══════════════════════════════════════════════════════════════
// APEX Coach — Developer Testing Dashboard
// Tests workout generation across simulated user profiles.
// Account-gated: only visible for johncarrus@gmail.com.
// All data in-memory — no Supabase reads/writes.
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";

const C={bg:"#060b18",bgCard:"#0d1425",bgElevated:"#162040",border:"rgba(255,255,255,0.08)",text:"#e8ecf4",textMuted:"#7a8ba8",textDim:"#4a5a78",teal:"#00d2c8",tealDark:"#00a89f",tealBg:"rgba(0,210,200,0.08)",success:"#22c55e",danger:"#ef4444",warning:"#eab308",info:"#3b82f6",purple:"#a855f7"};

// ── Test Profiles ───────────────────────────────────────────────

const PROFILES = [
  { id: 0, name: "Lumbar Fusion — 12wk Post-Op", desc: "Severity 4 · Home · 45 min · Phase 1 · Beginner",
    assessment: { userAge: 54, fitnessLevel: "beginner", startingPhase: 1, conditions: [{ conditionId: "A1", name: "Spinal Fusion (Post-Op — Lumbar)", severity: 4, bodyArea: "Lower Back", condType: "Post-Surgical", category: "spinal" }], rom: { lumbar: "mod_limited", lumbar_ext: "mod_limited" }, goals: { core: ["maintain"], glutes: ["strength"] }, preferences: { daysPerWeek: 3, sessionTime: 45, homeEquipment: ["mat","band","dumbbell"], favorites: [], blacklist: [], sports: [] }, weakPoints: [] },
    injuries: [{ id: "i1", area: "Lower Back", severity: 4, status: "post-surgical", gateKey: "lower_back" }],
    checkIn: { sleep: "ok", energy: 5, stress: 4, soreness: ["lowerback"], painTypes: { lowerback: "sharp" }, location: "home" },
    checks: [
      { label: "No spinal flexion under load", test: p => !(p.main||[]).some(e => ["sit-up","crunch","russian twist","good morning"].some(b => (e.name||"").toLowerCase().includes(b))) },
      { label: "No spinal rotation under load", test: p => !(p.main||[]).some(e => (e.name||"").toLowerCase().includes("russian twist") || (e.name||"").toLowerCase().includes("cable rotation")) },
      { label: "Core = anti-movement only", test: p => { const core = (p.main||[]).filter(e => e.bodyPart === "core"); return core.length === 0 || core.every(e => ["anti_extension","anti_rotation","anti_flexion","stability"].includes(e.movementPattern) || /dead bug|bird dog|plank|pallof/i.test(e.name||"")); } },
      { label: "No plyometrics", test: p => !(p.all||[]).some(e => (e.tags||[]).includes("plyometric") || /jump|sprint|explosive/i.test(e.name||"")) },
      { label: "No deadlifts", test: p => !(p.main||[]).some(e => /deadlift|good morning/i.test(e.name||"")) },
      { label: "Has warmup phase", test: p => (p.warmup||[]).length > 0 || (p.blocks?.lengthen||[]).length > 0 },
      { label: "Has cooldown phase", test: p => (p.cooldown||[]).length > 0 || (p.blocks?.cooldownStretches||[]).length > 0 },
    ],
  },
  { id: 1, name: "Severe Chronic Neck Pain", desc: "Severity 5 · Gym · 45 min · Phase 1 · High stress (8/10 pain)",
    assessment: { userAge: 47, fitnessLevel: "beginner", startingPhase: 1, conditions: [{ conditionId: "A10", name: "Chronic Neck Pain (Non-Specific)", severity: 5, bodyArea: "Neck", condType: "Managing", category: "spinal" }], rom: { neck: "mod_limited", thoracic: "limited", shoulders: "limited" }, goals: { back: ["maintain"], shoulders: ["maintain"] }, preferences: { daysPerWeek: 3, sessionTime: 45, homeEquipment: [], favorites: [], blacklist: [], sports: [] }, weakPoints: [] },
    injuries: [{ id: "i1", area: "Neck", severity: 5, status: "managing", gateKey: "neck" }, { id: "i2", area: "Shoulder", severity: 2, status: "managing", gateKey: "shoulder" }],
    checkIn: { sleep: "ok", energy: 4, stress: 7, soreness: ["neck","upperback","lshoulder","rshoulder"], painTypes: { neck: "sharp", upperback: "sharp" }, location: "gym" },
    checks: [
      { label: "No behind-neck pressing", test: p => !(p.all||[]).some(e => /behind.*neck/i.test(e.name||"")) },
      { label: "No heavy overhead pressing", test: p => !(p.main||[]).some(e => /overhead press/i.test(e.name||"") && e.safetyTier === "yellow") },
      { label: "No upright rows", test: p => !(p.main||[]).some(e => /upright row/i.test(e.name||"")) },
      { label: "Volume reduced (stress=7)", test: p => (p.main||[]).length <= 6 },
      { label: "Has warmup", test: p => (p.warmup||[]).length > 0 || (p.blocks?.lengthen||[]).length > 0 },
      { label: "Has cooldown", test: p => (p.cooldown||[]).length > 0 || (p.blocks?.cooldownStretches||[]).length > 0 },
    ],
  },
  { id: 2, name: "Senior — High Fall Risk", desc: "Age 78 · Home · 30 min · Osteoporosis · TUG 16s",
    assessment: { userAge: 78, fitnessLevel: "beginner", startingPhase: 1, conditions: [{ conditionId: "C4", name: "Osteoporosis / Osteopenia", severity: 3, category: "systemic" }, { conditionId: "B4", name: "Knee — Osteoarthritis", severity: 2, bodyArea: "Left Knee", category: "joint" }], seniorScreening: { fallCount: 2, unsteadiness: "often", fearOfFalling: "very_much", assistiveDevice: "cane", tugSeconds: 16, chairStandReps: 6, balanceStage: 2 }, rom: { hip_flexion: "limited", knee_left: "limited", ankles: "limited" }, goals: { legs: ["maintain"], core: ["maintain"] }, preferences: { daysPerWeek: 3, sessionTime: 30, homeEquipment: ["mat","band","chair"], favorites: [], blacklist: [], sports: [] }, weakPoints: [] },
    injuries: [{ id: "i1", area: "Left Knee", severity: 2, status: "managing", gateKey: "knee" }],
    checkIn: { sleep: "good", energy: 5, stress: 3, soreness: ["lknee","hips"], painTypes: { lknee: "sharp", hips: "sharp" }, location: "home" },
    checks: [
      { label: "No plyometrics", test: p => !(p.all||[]).some(e => (e.tags||[]).includes("plyometric") || /jump/i.test(e.name||"")) },
      { label: "No heavy axial loading", test: p => !(p.main||[]).some(e => /barbell squat|barbell deadlift/i.test(e.name||"")) },
      { label: "Strength floor preserved", test: p => (p.main||[]).length >= 3 },
      { label: "Session fits 30 min", test: p => (p.all||[]).length <= 10 },
      { label: "Has warmup", test: p => (p.warmup||[]).length > 0 || (p.blocks?.lengthen||[]).length > 0 },
      { label: "Has cooldown", test: p => (p.cooldown||[]).length > 0 || (p.blocks?.cooldownStretches||[]).length > 0 },
    ],
  },
  { id: 3, name: "ACL Post-Op — Month 5", desc: "Severity 3 · Gym · 60 min · Phase 2 · BJJ",
    assessment: { userAge: 26, fitnessLevel: "intermediate", startingPhase: 2, conditions: [{ conditionId: "B1", name: "Knee — ACL Tear (Post-Op)", severity: 3, bodyArea: "Left Knee", condType: "Post-Surgical", category: "joint" }], rom: { knee_left: "limited" }, goals: { legs: ["strength"], core: ["strength"] }, preferences: { daysPerWeek: 5, sessionTime: 60, homeEquipment: [], favorites: [], blacklist: [], sports: ["MMA/BJJ"] }, weakPoints: [] },
    injuries: [{ id: "i1", area: "Left Knee", severity: 3, status: "post-surgical", gateKey: "knee" }],
    checkIn: { sleep: "great", energy: 8, stress: 2, soreness: [], painTypes: {}, location: "gym" },
    checks: [
      { label: "No plyometrics (pre-6mo)", test: p => !(p.main||[]).some(e => (e.tags||[]).includes("plyometric") || /jump/i.test(e.name||"")) },
      { label: "No back squat", test: p => !(p.main||[]).some(e => /back squat/i.test(e.name||"")) },
      { label: "Has warmup", test: p => (p.warmup||[]).length > 0 },
      { label: "Has cooldown", test: p => (p.cooldown||[]).length > 0 },
    ],
  },
  { id: 4, name: "Fibromyalgia — Flare Day", desc: "Severity 5 · Home · 30 min · Full body soreness (8/10 pain)",
    assessment: { userAge: 41, fitnessLevel: "beginner", startingPhase: 1, conditions: [{ conditionId: "C6", name: "Fibromyalgia", severity: 5, category: "systemic", condType: "Active flare" }], rom: {}, goals: { core: ["maintain"] }, preferences: { daysPerWeek: 3, sessionTime: 30, homeEquipment: ["mat","band"], favorites: [], blacklist: [], sports: [] }, weakPoints: [] },
    injuries: [],
    checkIn: { sleep: "poor", energy: 2, stress: 8, soreness: ["lowerback","upperback","lshoulder","rshoulder","hips","lknee","rknee"], painTypes: { lowerback: "sharp", upperback: "sharp", lshoulder: "sharp", rshoulder: "sharp", hips: "sharp", lknee: "sharp", rknee: "sharp" }, location: "home" },
    checks: [
      { label: "Low volume for flare day", test: p => (p.main||[]).length <= 4 },
      { label: "Short session", test: p => (p.all||[]).length <= 8 },
      { label: "Has warmup", test: p => (p.warmup||[]).length > 0 || (p.blocks?.lengthen||[]).length > 0 },
    ],
  },
  { id: 5, name: "Shoulder Labrum — Managing", desc: "Left shoulder · Gym · 60 min · Phase 1 · Muay Thai",
    assessment: { userAge: 34, fitnessLevel: "intermediate", startingPhase: 1, conditions: [{ conditionId: "B7", name: "Shoulder — Labrum Tear (SLAP/Bankart)", severity: 2, bodyArea: "Left Shoulder", condType: "Managing", category: "joint" }], rom: { shoulders: "slight" }, goals: { chest: ["size"], back: ["size"], shoulders: ["size"] }, preferences: { daysPerWeek: 5, sessionTime: 60, homeEquipment: [], favorites: [], blacklist: [], sports: ["Muay Thai"] }, weakPoints: ["side_delts","rear_delts"] },
    injuries: [{ id: "i1", area: "Left Shoulder", severity: 2, status: "managing", gateKey: "shoulder" }],
    checkIn: { sleep: "good", energy: 7, stress: 3, soreness: ["lshoulder"], painTypes: { lshoulder: "sharp" }, location: "gym" },
    checks: [
      { label: "No behind-neck pressing", test: p => !(p.all||[]).some(e => /behind.*neck/i.test(e.name||"")) },
      { label: "No dips", test: p => !(p.main||[]).some(e => /\bdip\b/i.test(e.name||"") && !/drip/i.test(e.name||"")) },
      { label: "Has warmup", test: p => (p.warmup||[]).length > 0 },
      { label: "Has cooldown", test: p => (p.cooldown||[]).length > 0 },
    ],
  },
  { id: 6, name: "Healthy Bodybuilder — Phase 3", desc: "No injuries · Gym · 75 min · NPC comp prep",
    assessment: { userAge: 28, fitnessLevel: "advanced", startingPhase: 3, trainingExperience: "professional", trainingRecency: "very_consistent", conditions: [], rom: {}, goals: { chest: ["size"], back: ["size"], shoulders: ["size"], arms: ["size"], legs: ["size"], glutes: ["size"] }, physiqueCategory: "mens_physique", hypertrophyExperience: "advanced", preferences: { daysPerWeek: 6, sessionTime: 75, homeEquipment: [], favorites: [], blacklist: [], sports: [] }, weakPoints: ["side_delts","rear_delts","calves"] },
    injuries: [],
    checkIn: { sleep: "great", energy: 9, stress: 2, soreness: ["chest"], painTypes: { chest: "tightness" }, location: "gym" },
    checks: [
      { label: "Full exercise pool (6+ main)", test: p => (p.main||[]).length >= 6 },
      { label: "Volume within Phase 3 ceiling", test: p => (p.main||[]).length <= 10 },
      { label: "Has warmup", test: p => (p.warmup||[]).length > 0 },
    ],
  },
  { id: 7, name: "Rock Climber — A2 Pulley", desc: "Ring finger · Gym · 60 min · Phase 2",
    assessment: { userAge: 29, fitnessLevel: "intermediate", startingPhase: 2, conditions: [{ conditionId: "CLIMB2", name: "Finger Pulley Strain (Grade II — Moderate)", severity: 3, bodyArea: "Left Ring", condType: "Rehabilitating", category: "climbing_finger" }], rom: {}, goals: { back: ["strength"], core: ["strength"] }, preferences: { daysPerWeek: 5, sessionTime: 60, homeEquipment: [], favorites: [], blacklist: [], sports: ["Rock Climbing"] }, weakPoints: [] },
    injuries: [{ id: "i1", area: "Left Hand", severity: 3, status: "rehabilitating", gateKey: "finger" }],
    checkIn: { sleep: "great", energy: 7, stress: 2, soreness: ["wrists"], painTypes: {}, location: "gym" },
    checks: [
      { label: "No hangboard/campus", test: p => !(p.all||[]).some(e => /hangboard|campus/i.test(e.name||"")) },
      { label: "Lower body preserved", test: p => (p.main||[]).some(e => ["legs","glutes","hips"].includes(e.bodyPart)) },
      { label: "Has warmup", test: p => (p.warmup||[]).length > 0 },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// COMPONENT — all hooks declared unconditionally at the top
// ═══════════════════════════════════════════════════════════════

export default function DevTestDashboard({ onClose }) {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [expanded, setExpanded] = useState({});
  const [runningAll, setRunningAll] = useState(false);
  const [allDone, setAllDone] = useState(false);

  // Run a single profile test
  const runProfile = (profile) => {
    setLoading(prev => ({ ...prev, [profile.id]: true }));

    // Save originals
    const keys = ["apex_assessment", "apex_injuries", "apex_senior_profile", "apex_mesocycle"];
    const originals = {};
    keys.forEach(k => { originals[k] = localStorage.getItem(k); });

    try {
      // Inject mock data
      localStorage.setItem("apex_assessment", JSON.stringify(profile.assessment));
      localStorage.setItem("apex_injuries", JSON.stringify(profile.injuries || []));
      if (profile.assessment.seniorScreening) localStorage.setItem("apex_senior_profile", JSON.stringify({ age: profile.assessment.userAge, ...profile.assessment.seniorScreening, fallRiskLevel: "high" }));
      localStorage.setItem("apex_mesocycle", JSON.stringify({ phase: profile.assessment.startingPhase || 1, tier: 2, tierName: "Cautious", mesoLength: 6, currentWeek: 2 }));

      // Generate plan
      const plan = window._buildWorkoutList ? window._buildWorkoutList() : null;

      // Run audit checks
      const audit = (profile.checks || []).map(chk => {
        try { return { label: chk.label, passed: plan ? chk.test(plan) : false }; }
        catch (e) { return { label: chk.label, passed: false, error: e.message }; }
      });

      const passed = audit.filter(a => a.passed).length;
      const total = audit.length;

      setResults(prev => ({ ...prev, [profile.id]: { plan, audit, passed, total, exerciseCount: plan ? (plan.all || []).length : 0, mainCount: plan ? (plan.main || []).length : 0 } }));
    } catch (e) {
      setResults(prev => ({ ...prev, [profile.id]: { error: e.message, audit: [], passed: 0, total: 0, exerciseCount: 0, mainCount: 0 } }));
    } finally {
      // Restore originals
      keys.forEach(k => { if (originals[k]) localStorage.setItem(k, originals[k]); else localStorage.removeItem(k); });
      setLoading(prev => ({ ...prev, [profile.id]: false }));
    }
  };

  // Run all profiles sequentially
  const runAll = () => {
    setRunningAll(true);
    setAllDone(false);
    let i = 0;
    const next = () => {
      if (i >= PROFILES.length) { setRunningAll(false); setAllDone(true); return; }
      runProfile(PROFILES[i]);
      i++;
      setTimeout(next, 150);
    };
    setTimeout(next, 50);
  };

  // Export report
  const exportReport = () => {
    const lines = [`APEX QA Report — ${new Date().toISOString()}`, ""];
    let totalP = 0, totalT = 0;
    PROFILES.forEach(p => {
      const r = results[p.id];
      if (!r) { lines.push(`${p.name}: NOT RUN`); return; }
      totalP += r.passed; totalT += r.total;
      lines.push(`${r.passed === r.total ? "✅" : "❌"} ${p.name}: ${r.passed}/${r.total} passed (${r.mainCount} main exercises)`);
      r.audit.filter(a => !a.passed).forEach(a => lines.push(`   ❌ ${a.label}${a.error ? ` — ${a.error}` : ""}`));
    });
    lines.push("", `Overall: ${totalP}/${totalT} (${totalT > 0 ? Math.round(totalP / totalT * 100) : 0}%)`);
    navigator.clipboard?.writeText(lines.join("\n")).catch(() => {});
    alert("Report copied to clipboard");
  };

  // Compute overall stats
  const tested = Object.keys(results).length;
  const overallPassed = Object.values(results).reduce((s, r) => s + (r.passed || 0), 0);
  const overallTotal = Object.values(results).reduce((s, r) => s + (r.total || 0), 0);

  return (
    <div className="fade-in safe-bottom" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>DEV TESTING</div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 14, cursor: "pointer", padding: 8, fontFamily: "inherit" }}>← Back</button>
      </div>
      <div style={{ fontSize: 12, color: C.textMuted }}>Test workout generation across {PROFILES.length} simulated profiles. All in-memory — no real data affected.</div>

      {/* Overall score (if tests run) */}
      {tested > 0 && <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: C.bgCard, border: `1px solid ${(overallTotal > 0 && overallPassed === overallTotal ? C.success : C.warning)}30`, borderRadius: 14 }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: overallPassed === overallTotal ? C.success : C.warning, fontFamily: "'Bebas Neue',sans-serif" }}>{overallTotal > 0 ? Math.round(overallPassed / overallTotal * 100) : 0}%</div>
        <div><div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{overallPassed}/{overallTotal} checks passed</div><div style={{ fontSize: 11, color: C.textDim }}>{tested} of {PROFILES.length} profiles tested</div></div>
      </div>}

      {/* Profile cards */}
      {PROFILES.map(p => {
        const r = results[p.id];
        const isLoading = loading[p.id];
        const isExpanded = expanded[p.id];
        const sc = r ? (r.passed === r.total ? C.success : C.warning) : C.textDim;

        return (
          <div key={p.id} style={{ background: C.bgCard, border: `1px solid ${r ? sc + "30" : C.border}`, borderRadius: 14, padding: 12 }}>
            {/* Card header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{p.name}</div>
                <div style={{ fontSize: 11, color: C.textDim }}>{p.desc}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {r && <span style={{ fontSize: 16, fontWeight: 800, color: sc, fontFamily: "'Bebas Neue',sans-serif" }}>{r.passed}/{r.total}</span>}
                <button onClick={() => runProfile(p)} disabled={isLoading}
                  style={{ padding: "6px 12px", borderRadius: 8, background: C.tealBg, border: `1px solid ${C.teal}40`, color: C.teal, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: isLoading ? 0.5 : 1 }}>
                  {isLoading ? "..." : r ? "Rerun" : "Run"}
                </button>
              </div>
            </div>

            {/* Results */}
            {r && <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 11, color: C.textDim, marginBottom: 4 }}>{r.mainCount} main + {r.exerciseCount - r.mainCount} warmup/cooldown</div>
              {/* Audit checks */}
              {r.audit.map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0" }}>
                  <span style={{ fontSize: 12 }}>{a.passed ? "✅" : "❌"}</span>
                  <span style={{ fontSize: 12, color: a.passed ? C.success : C.danger }}>{a.label}</span>
                </div>
              ))}
              {r.error && <div style={{ fontSize: 11, color: C.danger, marginTop: 4 }}>{r.error}</div>}
              {/* Exercise list toggle */}
              <button onClick={() => setExpanded(prev => ({ ...prev, [p.id]: !isExpanded }))} style={{ background: "none", border: "none", color: C.info, fontSize: 10, cursor: "pointer", fontFamily: "inherit", padding: "4px 0" }}>{isExpanded ? "Hide exercises" : "Show exercises"}</button>
              {isExpanded && r.plan && <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.textDim, marginBottom: 2 }}>MAIN:</div>
                {(r.plan.main || []).map((e, i) => <div key={i} style={{ fontSize: 10, color: C.textMuted }}>{i + 1}. {e.name} ({e.bodyPart}) — {e.movementPattern}</div>)}
                <div style={{ fontSize: 9, fontWeight: 700, color: C.textDim, marginTop: 4, marginBottom: 2 }}>WARMUP:</div>
                {(r.plan.warmup || []).slice(0, 5).map((e, i) => <div key={i} style={{ fontSize: 10, color: C.textMuted }}>{e.name}</div>)}
              </div>}
            </div>}
          </div>
        );
      })}

      {/* Run all + export */}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={runAll} disabled={runningAll} style={{ flex: 1, padding: "12px", borderRadius: 12, background: `linear-gradient(135deg,${C.teal},${C.tealDark})`, border: "none", color: "#000", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: runningAll ? 0.5 : 1 }}>{runningAll ? `Testing ${Object.keys(loading).filter(k => loading[k]).length + 1} of ${PROFILES.length}...` : "Run all 8 profiles"}</button>
        {tested > 0 && <button onClick={exportReport} style={{ padding: "12px 16px", borderRadius: 12, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Copy report</button>}
      </div>

      <div style={{ height: 80 }} />
    </div>
  );
}
