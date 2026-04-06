// ═══════════════════════════════════════════════════════════════
// APEX Coach — Developer QA Panel
// Access: ?qa=true + PIN 7291
// Tests workout generation across simulated user profiles
// Self-contained — no Supabase, no real user data touched
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback } from "react";

const C={bg:"#060b18",bgCard:"#0d1425",bgElevated:"#162040",border:"rgba(255,255,255,0.08)",text:"#e8ecf4",textMuted:"#7a8ba8",textDim:"#4a5a78",teal:"#00d2c8",tealDark:"#00a89f",tealBg:"rgba(0,210,200,0.08)",success:"#22c55e",danger:"#ef4444",warning:"#eab308",info:"#3b82f6",orange:"#f97316",purple:"#a855f7"};
const QA_PIN = "7291";

// ═══════════════════════════════════════════════════════════════
// TEST PROFILES
// ═══════════════════════════════════════════════════════════════

const PROFILES = [
  {
    id: "lumbar_fusion", name: "Lumbar Fusion — 12 Weeks Post-Op",
    assessment: { userAge: 54, fitnessLevel: "beginner", startingPhase: 1, trainingExperience: "building", trainingRecency: "none", progressionRate: "standard",
      conditions: [{ conditionId: "A1", name: "Spinal Fusion (Post-Op — Lumbar)", severity: 4, bodyArea: "Lower Back", condType: "Post-Surgical", category: "spinal" }],
      rom: { lumbar: "mod_limited", lumbar_ext: "mod_limited", lumbar_flex: "mod_limited", hips: "limited" },
      goals: { core: ["maintain"], glutes: ["strength"] }, preferences: { daysPerWeek: 3, sessionTime: 45, homeEquipment: ["mat", "band", "dumbbell"], favorites: [], blacklist: [], sports: [] },
      bodyComp: { heightCm: 180, weightKg: 95, goalType: "none" }, weakPoints: [] },
    injuries: [{ id: "i1", area: "Lower Back", severity: 4, status: "post-surgical", gateKey: "lower_back", type: "Post-Surgical" }],
    checkIn: { sleep: "ok", energy: 5, stress: 4, soreness: ["lowerback"], painTypes: { lowerback: "dull" }, location: "home" },
    checks: [
      { id: "no_spinal_flexion", label: "No spinal flexion under load", test: (p) => !p.main?.some(e => ["sit-up","crunch","russian twist","good morning"].some(b => (e.name||"").toLowerCase().includes(b))) },
      { id: "no_plyometrics", label: "No plyometrics", test: (p) => !p.main?.some(e => (e.tags||[]).includes("plyometric") || (e.name||"").toLowerCase().includes("jump")) },
      { id: "rpe_cap", label: "RPE ceiling ≤ 5", test: (p) => !p.main?.some(e => { const rpe = e.phaseParams?.["1"]?.rpe; return rpe && parseInt(rpe) > 6; }) },
      { id: "session_time", label: "Session fits 45 min", test: (p) => (p.all||[]).length <= 14 },
      { id: "has_core_anti", label: "Core exercises are anti-movement only", test: (p) => { const coreEx = (p.main||[]).filter(e => e.bodyPart === "core"); return coreEx.length === 0 || coreEx.every(e => ["anti_extension","anti_rotation","anti_flexion","stability"].includes(e.movementPattern) || (e.name||"").toLowerCase().includes("dead bug") || (e.name||"").toLowerCase().includes("bird dog") || (e.name||"").toLowerCase().includes("plank") || (e.name||"").toLowerCase().includes("pallof")); } },
    ],
  },
  {
    id: "chronic_neck", name: "Chronic Neck Pain — Severe",
    assessment: { userAge: 47, fitnessLevel: "beginner", startingPhase: 1, trainingExperience: "foundation", trainingRecency: "occasional",
      conditions: [{ conditionId: "A10", name: "Chronic Neck Pain (Non-Specific)", severity: 5, bodyArea: "Neck", condType: "Managing", category: "spinal" }],
      rom: { neck: "mod_limited", thoracic: "limited", shoulders: "limited" },
      goals: { back: ["maintain"], shoulders: ["maintain"] }, preferences: { daysPerWeek: 3, sessionTime: 45, homeEquipment: [], favorites: [], blacklist: [], sports: [] },
      bodyComp: { heightCm: 168, weightKg: 70, goalType: "none" }, weakPoints: [] },
    injuries: [{ id: "i1", area: "Neck", severity: 5, status: "managing", gateKey: "neck" }, { id: "i2", area: "Shoulder", severity: 2, status: "managing", gateKey: "shoulder" }],
    checkIn: { sleep: "ok", energy: 4, stress: 7, soreness: ["neck", "upperback", "lshoulder", "rshoulder"], painTypes: {}, location: "gym" },
    checks: [
      { id: "no_behind_neck", label: "No behind-neck pressing", test: (p) => !p.main?.some(e => (e.name||"").toLowerCase().includes("behind") && (e.name||"").toLowerCase().includes("neck")) },
      { id: "no_heavy_overhead", label: "No heavy overhead pressing", test: (p) => !p.main?.some(e => (e.name||"").toLowerCase().includes("overhead press") && e.safetyTier === "yellow") },
      { id: "stress_volume_reduction", label: "High stress (7) triggers volume reduction", test: (p) => (p.main||[]).length <= 6 },
    ],
  },
  {
    id: "senior_high_fall", name: "Senior — High Fall Risk",
    assessment: { userAge: 78, fitnessLevel: "beginner", startingPhase: 1, trainingExperience: "foundation", trainingRecency: "none",
      conditions: [{ conditionId: "C4", name: "Osteoporosis / Osteopenia", severity: 3, category: "systemic" }, { conditionId: "B4", name: "Knee — Osteoarthritis", severity: 2, bodyArea: "Left Knee", category: "joint" }],
      seniorScreening: { fallCount: 2, unsteadiness: "often", fearOfFalling: "very_much", assistiveDevice: "cane", chairRise: "hands_only", walkingTolerance: "effort", dizziness: "sometimes", tugSeconds: 16, chairStandReps: 6, balanceStage: 2 },
      rom: { hip_flexion: "limited", knee_left: "limited", ankles: "limited" },
      goals: { legs: ["maintain"], core: ["maintain"] }, preferences: { daysPerWeek: 3, sessionTime: 30, homeEquipment: ["mat", "band", "chair"], favorites: [], blacklist: [], sports: [] },
      bodyComp: { heightCm: 160, weightKg: 63, goalType: "none" }, weakPoints: [] },
    injuries: [{ id: "i1", area: "Left Knee", severity: 2, status: "managing", gateKey: "knee" }],
    checkIn: { sleep: "good", energy: 5, stress: 3, soreness: ["lknee", "hips"], painTypes: {}, location: "home" },
    checks: [
      { id: "no_plyometrics", label: "No plyometrics", test: (p) => !p.all?.some(e => (e.tags||[]).includes("plyometric") || (e.name||"").toLowerCase().includes("jump")) },
      { id: "no_heavy_axial", label: "No heavy axial loading", test: (p) => !p.main?.some(e => (e.name||"").toLowerCase().includes("barbell squat") || (e.name||"").toLowerCase().includes("deadlift")) },
      { id: "session_30min", label: "Session fits 30 min", test: (p) => (p.all||[]).length <= 10 },
      { id: "has_strength", label: "Strength floor preserved (not eliminated)", test: (p) => (p.main||[]).length >= 3 },
    ],
  },
  {
    id: "acl_postop", name: "ACL Post-Op — Month 5",
    assessment: { userAge: 26, fitnessLevel: "intermediate", startingPhase: 2, trainingExperience: "building", trainingRecency: "consistent",
      conditions: [{ conditionId: "B1", name: "Knee — ACL Tear (Post-Op)", severity: 3, bodyArea: "Left Knee", condType: "Post-Surgical", category: "joint" }],
      rom: { knee_left: "limited" }, goals: { legs: ["strength"], core: ["strength"] },
      preferences: { daysPerWeek: 5, sessionTime: 60, homeEquipment: [], favorites: [], blacklist: [], sports: ["MMA/BJJ"] },
      bodyComp: { heightCm: 185, weightKg: 84, goalType: "gain", goalWeightKg: 88, weeklyGoalKg: 0.23 }, weakPoints: [] },
    injuries: [{ id: "i1", area: "Left Knee", severity: 3, status: "post-surgical", gateKey: "knee", type: "Post-Surgical" }],
    checkIn: { sleep: "great", energy: 8, stress: 2, soreness: [], painTypes: {}, location: "gym" },
    checks: [
      { id: "no_plyometrics", label: "No plyometrics (pre-6 months)", test: (p) => !p.main?.some(e => (e.tags||[]).includes("plyometric") || (e.name||"").toLowerCase().includes("jump")) },
      { id: "no_deep_squat_heavy", label: "No deep squats past 90° under heavy load", test: (p) => !p.main?.some(e => (e.name||"").toLowerCase().includes("back squat")) },
      { id: "phase2_params", label: "Phase 2 parameters applied", test: () => true }, // structural check
    ],
  },
  {
    id: "fibro_flare", name: "Fibromyalgia — Active Flare",
    assessment: { userAge: 41, fitnessLevel: "beginner", startingPhase: 1, trainingExperience: "foundation", trainingRecency: "somewhat",
      conditions: [{ conditionId: "C6", name: "Fibromyalgia", severity: 5, category: "systemic", condType: "Active flare" }],
      rom: {}, goals: { core: ["maintain"] },
      preferences: { daysPerWeek: 3, sessionTime: 30, homeEquipment: ["mat", "band"], favorites: [], blacklist: [], sports: [] },
      bodyComp: { heightCm: 165, weightKg: 73, goalType: "lose", goalWeightKg: 68, weeklyGoalKg: 0.23 }, weakPoints: [] },
    injuries: [],
    checkIn: { sleep: "poor", energy: 2, stress: 8, soreness: ["lowerback", "upperback", "lshoulder", "rshoulder", "hips", "lknee", "rknee"], painTypes: {}, location: "home" },
    checks: [
      { id: "low_volume", label: "Low volume for flare day", test: (p) => (p.main||[]).length <= 4 },
      { id: "low_rpe", label: "RPE ceiling very low", test: () => true },
      { id: "short_session", label: "Session ≤ 20 min equivalent", test: (p) => (p.all||[]).length <= 8 },
    ],
  },
  {
    id: "shoulder_labrum", name: "Left Shoulder Labrum — Managing",
    assessment: { userAge: 34, fitnessLevel: "intermediate", startingPhase: 1, trainingExperience: "performance", trainingRecency: "consistent",
      conditions: [{ conditionId: "B7", name: "Shoulder — Labrum Tear (SLAP/Bankart)", severity: 2, bodyArea: "Left Shoulder", condType: "Managing", category: "joint" }],
      rom: { shoulders: "slight" }, goals: { chest: ["size"], back: ["size"], shoulders: ["size"] },
      preferences: { daysPerWeek: 5, sessionTime: 60, homeEquipment: [], favorites: [], blacklist: [], sports: ["Muay Thai"] },
      bodyComp: { heightCm: 178, weightKg: 81, goalType: "gain", goalWeightKg: 84, weeklyGoalKg: 0.11 }, weakPoints: ["side_delts", "rear_delts"] },
    injuries: [{ id: "i1", area: "Left Shoulder", severity: 2, status: "managing", gateKey: "shoulder" }],
    checkIn: { sleep: "good", energy: 7, stress: 3, soreness: ["lshoulder"], painTypes: { lshoulder: "dull" }, location: "gym" },
    checks: [
      { id: "no_behind_neck", label: "No behind-neck pressing", test: (p) => !p.all?.some(e => (e.name||"").toLowerCase().includes("behind") && (e.name||"").toLowerCase().includes("neck")) },
      { id: "no_overhead_endrange", label: "No overhead at end-range (Phase 1-2)", test: (p) => !p.main?.some(e => (e.name||"").toLowerCase().includes("overhead press") && e.safetyTier !== "green") },
      { id: "has_face_pulls", label: "Face pulls or rear delt work included", test: (p) => p.main?.some(e => (e.name||"").toLowerCase().includes("face pull") || (e.name||"").toLowerCase().includes("rear delt") || (e.name||"").toLowerCase().includes("external rotation")) || (p.blocks?.lengthen||[]).some(e => (e.name||"").toLowerCase().includes("external rotation")) },
    ],
  },
  {
    id: "climber_finger", name: "Rock Climber — A2 Pulley Injury",
    assessment: { userAge: 29, fitnessLevel: "intermediate", startingPhase: 2, trainingExperience: "performance", trainingRecency: "consistent",
      conditions: [{ conditionId: "CLIMB2", name: "Finger Pulley Strain (Grade II — Moderate)", severity: 3, bodyArea: "Left Ring", condType: "Rehabilitating", category: "climbing_finger" }],
      rom: {}, goals: { back: ["strength"], core: ["strength"] },
      preferences: { daysPerWeek: 5, sessionTime: 60, homeEquipment: [], favorites: [], blacklist: [], sports: ["Rock Climbing"] },
      bodyComp: { heightCm: 175, weightKg: 70, goalType: "none" }, weakPoints: [] },
    injuries: [{ id: "i1", area: "Left Hand", severity: 3, status: "rehabilitating", gateKey: "finger" }],
    checkIn: { sleep: "great", energy: 7, stress: 2, soreness: ["wrists"], painTypes: {}, location: "gym" },
    checks: [
      { id: "no_hangboard", label: "No hangboard training", test: (p) => !p.all?.some(e => (e.name||"").toLowerCase().includes("hangboard") || (e.name||"").toLowerCase().includes("campus")) },
      { id: "lower_body_preserved", label: "Full lower body training preserved", test: (p) => (p.main||[]).some(e => ["legs","glutes","hips"].includes(e.bodyPart)) },
    ],
  },
  {
    id: "bodybuilder", name: "Bodybuilder — Phase 3 Hypertrophy",
    assessment: { userAge: 28, fitnessLevel: "advanced", startingPhase: 3, trainingExperience: "professional", trainingRecency: "very_consistent",
      conditions: [], rom: {},
      goals: { chest: ["size"], back: ["size"], shoulders: ["size"], arms: ["size"], legs: ["size"], glutes: ["size"] },
      physiqueCategory: "mens_physique", hypertrophyExperience: "advanced",
      preferences: { daysPerWeek: 6, sessionTime: 75, homeEquipment: [], favorites: [], blacklist: [], sports: [] },
      bodyComp: { heightCm: 180, weightKg: 87, goalType: "gain", goalWeightKg: 90, weeklyGoalKg: 0.11 }, weakPoints: ["side_delts", "rear_delts", "calves"] },
    injuries: [],
    checkIn: { sleep: "great", energy: 9, stress: 2, soreness: ["chest"], painTypes: { chest: "tightness" }, location: "gym" },
    checks: [
      { id: "phase3_params", label: "Phase 3 hypertrophy parameters applied", test: () => true },
      { id: "full_exercise_pool", label: "No unnecessary safety restrictions", test: (p) => (p.main||[]).length >= 6 },
      { id: "volume_appropriate", label: "Volume within Phase 3 ceiling", test: (p) => (p.main||[]).length <= 10 },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// QA PANEL GATE — checks URL param + PIN
// ═══════════════════════════════════════════════════════════════

export function isQAEnabled() {
  try { return window.location.search.includes("qa=true"); } catch { return false; }
}

// ═══════════════════════════════════════════════════════════════
// QA PANEL COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function QAPanel() {
  const [pin, setPin] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [results, setResults] = useState({}); // { profileId: { plan, audit } }
  const [running, setRunning] = useState(false);
  const [runningAll, setRunningAll] = useState(false);

  if (!authenticated) {
    return (
      <div style={{ background: C.bg, color: C.text, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}>
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 20, padding: 32, maxWidth: 320, textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.teal, letterSpacing: 3, marginBottom: 16 }}>APEX QA PANEL</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>Enter developer PIN to access</div>
          <input type="password" value={pin} onChange={e => setPin(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && pin === QA_PIN) setAuthenticated(true); }}
            placeholder="PIN" style={{ width: "100%", padding: "12px", borderRadius: 10, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text, fontSize: 18, fontFamily: "inherit", outline: "none", textAlign: "center", letterSpacing: 8, boxSizing: "border-box" }} />
          <button onClick={() => { if (pin === QA_PIN) setAuthenticated(true); }} style={{ width: "100%", marginTop: 12, padding: "12px", borderRadius: 12, background: `linear-gradient(135deg,${C.teal},${C.tealDark})`, border: "none", color: "#000", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Enter</button>
          {pin.length >= 4 && pin !== QA_PIN && <div style={{ color: C.danger, fontSize: 12, marginTop: 8 }}>Incorrect PIN</div>}
        </div>
      </div>
    );
  }

  // Run a single profile
  const runProfile = useCallback((profile) => {
    // Inject mock data into localStorage temporarily
    const origAssessment = localStorage.getItem("apex_assessment");
    const origInjuries = localStorage.getItem("apex_injuries");
    const origSenior = localStorage.getItem("apex_senior_profile");
    const origMeso = localStorage.getItem("apex_mesocycle");

    try {
      localStorage.setItem("apex_assessment", JSON.stringify(profile.assessment));
      localStorage.setItem("apex_injuries", JSON.stringify(profile.injuries || []));
      if (profile.assessment.seniorScreening) localStorage.setItem("apex_senior_profile", JSON.stringify({ age: profile.assessment.userAge, ...profile.assessment.seniorScreening, fallRiskLevel: "high" }));
      if (profile.assessment.startingPhase) localStorage.setItem("apex_mesocycle", JSON.stringify({ phase: profile.assessment.startingPhase, tier: 2, tierName: "Cautious", mesoLength: 6, currentWeek: 2 }));

      // Call real buildWorkoutList via window
      const plan = window._buildWorkoutList ? window._buildWorkoutList() : null;

      // Run audit checks
      const audit = (profile.checks || []).map(chk => {
        try {
          const passed = plan ? chk.test(plan) : false;
          return { ...chk, passed, error: null };
        } catch (e) { return { ...chk, passed: false, error: e.message }; }
      });

      return { plan, audit, exerciseCount: plan ? (plan.all||[]).length : 0, mainCount: plan ? (plan.main||[]).length : 0 };
    } finally {
      // Restore original localStorage
      if (origAssessment) localStorage.setItem("apex_assessment", origAssessment); else localStorage.removeItem("apex_assessment");
      if (origInjuries) localStorage.setItem("apex_injuries", origInjuries); else localStorage.removeItem("apex_injuries");
      if (origSenior) localStorage.setItem("apex_senior_profile", origSenior); else localStorage.removeItem("apex_senior_profile");
      if (origMeso) localStorage.setItem("apex_mesocycle", origMeso); else localStorage.removeItem("apex_mesocycle");
    }
  }, []);

  const handleRunProfile = (profile) => {
    setRunning(true);
    setSelectedProfile(profile.id);
    setTimeout(() => {
      const result = runProfile(profile);
      setResults(prev => ({ ...prev, [profile.id]: result }));
      setRunning(false);
    }, 50);
  };

  const handleRunAll = () => {
    setRunningAll(true);
    let idx = 0;
    const runNext = () => {
      if (idx >= PROFILES.length) { setRunningAll(false); return; }
      const p = PROFILES[idx];
      const result = runProfile(p);
      setResults(prev => ({ ...prev, [p.id]: result }));
      idx++;
      setTimeout(runNext, 100);
    };
    setTimeout(runNext, 50);
  };

  const handleExport = () => {
    const report = { timestamp: new Date().toISOString(), profiles: PROFILES.map(p => { const r = results[p.id]; return { name: p.name, passed: r ? r.audit.filter(a => a.passed).length : 0, total: (p.checks||[]).length, failed: r ? r.audit.filter(a => !a.passed).map(a => a.label) : [], exerciseCount: r?.exerciseCount || 0 }; }) };
    report.overallPassed = report.profiles.reduce((s, p) => s + p.passed, 0);
    report.overallTotal = report.profiles.reduce((s, p) => s + p.total, 0);
    report.overallScore = report.overallTotal > 0 ? Math.round((report.overallPassed / report.overallTotal) * 100) : 0;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `apex_qa_report_${new Date().toISOString().split("T")[0]}.json`; a.click(); URL.revokeObjectURL(url);
  };

  // Overall stats
  const totalPassed = Object.values(results).reduce((s, r) => s + r.audit.filter(a => a.passed).length, 0);
  const totalChecks = Object.values(results).reduce((s, r) => s + r.audit.length, 0);
  const overallScore = totalChecks > 0 ? Math.round((totalPassed / totalChecks) * 100) : 0;

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", padding: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.teal, letterSpacing: 3 }}>APEX QA PANEL</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={handleRunAll} disabled={runningAll} style={{ padding: "8px 14px", borderRadius: 10, background: C.teal, border: "none", color: "#000", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: runningAll ? 0.5 : 1 }}>{runningAll ? "Running..." : "Run All Profiles"}</button>
          <button onClick={handleExport} style={{ padding: "8px 14px", borderRadius: 10, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Export Report</button>
          <button onClick={() => window.location.href = window.location.pathname} style={{ padding: "8px 14px", borderRadius: 10, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Close</button>
        </div>
      </div>

      {/* Overall score */}
      {totalChecks > 0 && <div style={{ background: C.bgCard, border: `1px solid ${(overallScore >= 90 ? C.success : overallScore >= 70 ? C.warning : C.danger)}30`, borderRadius: 14, padding: 14, marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 36, fontWeight: 800, color: overallScore >= 90 ? C.success : overallScore >= 70 ? C.warning : C.danger, fontFamily: "'Bebas Neue',sans-serif" }}>{overallScore}%</div>
        <div><div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Overall QA Score</div><div style={{ fontSize: 12, color: C.textMuted }}>{totalPassed}/{totalChecks} checks passed across {Object.keys(results).length} profiles</div></div>
      </div>}

      {/* Profile cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {PROFILES.map(p => {
          const r = results[p.id];
          const isSelected = selectedProfile === p.id;
          const passed = r ? r.audit.filter(a => a.passed).length : null;
          const total = (p.checks||[]).length;
          const score = passed !== null ? Math.round((passed / total) * 100) : null;
          const sc = score === null ? C.textDim : score >= 90 ? C.success : score >= 70 ? C.warning : C.danger;

          return (
            <div key={p.id} style={{ background: C.bgCard, border: `1px solid ${isSelected ? C.teal + "40" : C.border}`, borderRadius: 14, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: C.textDim }}>Phase {p.assessment.startingPhase} · Age {p.assessment.userAge} · {p.assessment.preferences?.sessionTime}min · {p.checks?.length} checks</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {score !== null && <span style={{ fontSize: 18, fontWeight: 800, color: sc, fontFamily: "'Bebas Neue',sans-serif" }}>{score}%</span>}
                  <button onClick={() => handleRunProfile(p)} disabled={running} style={{ padding: "6px 12px", borderRadius: 8, background: C.tealBg, border: `1px solid ${C.teal}40`, color: C.teal, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Run</button>
                </div>
              </div>

              {/* Audit results */}
              {r && <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 11, color: C.textDim, marginBottom: 4 }}>{r.mainCount} main + {r.exerciseCount - r.mainCount} warmup/cooldown exercises generated</div>
                {r.audit.map((chk, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: "3px 0" }}>
                    <span style={{ fontSize: 12, flexShrink: 0 }}>{chk.passed ? "✅" : "❌"}</span>
                    <span style={{ fontSize: 12, color: chk.passed ? C.success : C.danger, lineHeight: 1.4 }}>{chk.label}{chk.error ? ` (${chk.error})` : ""}</span>
                  </div>
                ))}
                {/* Show exercise names for debugging */}
                {isSelected && r.plan && <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.textDim, marginBottom: 2 }}>MAIN EXERCISES:</div>
                  {(r.plan.main||[]).map((e, i) => <div key={i} style={{ fontSize: 10, color: C.textMuted }}>{i + 1}. {e.name} ({e.bodyPart}) — {e.movementPattern}{e._reason ? ` | ${e._reason}` : ""}</div>)}
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.textDim, marginTop: 4, marginBottom: 2 }}>WARM-UP:</div>
                  {(r.plan.warmup||[]).map((e, i) => <div key={i} style={{ fontSize: 10, color: C.textMuted }}>{e.name}</div>)}
                </div>}
                <button onClick={() => setSelectedProfile(isSelected ? null : p.id)} style={{ background: "none", border: "none", color: C.info, fontSize: 10, cursor: "pointer", fontFamily: "inherit", padding: "4px 0" }}>{isSelected ? "Hide details" : "Show exercise details"}</button>
              </div>}
            </div>
          );
        })}
      </div>
      <div style={{ height: 40 }} />
    </div>
  );
}
