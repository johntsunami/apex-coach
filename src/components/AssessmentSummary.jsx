import { useMemo, useState } from "react";
import exerciseDB from "../data/exercises.json";
import compensationsDB from "../data/compensations.json";
import { getAssessment } from "./Onboarding.jsx";
import { getInjuries } from "../utils/injuries.js";
import { buildWorkoutList } from "../utils/workoutHelpers.js";
import { generateProtocols, saveLocalProtocols } from "./PTSystem.jsx";
import { isMedicalClearanceConfirmed, confirmMedicalClearance } from "../utils/safetyGate.js";

function ClearanceBanner() {
  const [confirmed, setConfirmed] = useState(isMedicalClearanceConfirmed());
  if (confirmed) {
    return (
      <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 10, padding: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#22c55e", marginBottom: 2 }}>✓ MEDICAL CLEARANCE CONFIRMED</div>
        <div style={{ fontSize: 11, color: "#e8ecf4", lineHeight: 1.5 }}>You confirmed clearance from your medical team. Continue to follow their specific guidance.</div>
      </div>
    );
  }
  return (
    <div style={{ background: "rgba(239,68,68,0.1)", border: "2px solid #ef4444", borderRadius: 10, padding: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444", marginBottom: 6 }}>⚠️ MEDICAL CLEARANCE REQUIRED</div>
      <div style={{ fontSize: 11, color: "#e8ecf4", lineHeight: 1.5, marginBottom: 10 }}>Your profile shows a post-surgical or high-severity condition. Please review this plan with your surgeon or physical therapist before starting any exercises.</div>
      <button onClick={() => { confirmMedicalClearance(); setConfirmed(true); }} style={{ width: "100%", padding: 10, borderRadius: 8, background: "#ef4444", color: "#fff", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer", fontFamily: "inherit" }}>I have clearance from my medical team</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Post-Assessment Summary — comprehensive profile review
// ═══════════════════════════════════════════════════════════════

const C={bg:"#060b18",bgCard:"#0d1425",bgElevated:"#162040",bgGlass:"rgba(255,255,255,0.04)",border:"rgba(255,255,255,0.08)",text:"#e8ecf4",textMuted:"#7a8ba8",textDim:"#4a5a78",teal:"#00d2c8",tealBg:"rgba(0,210,200,0.08)",tealDark:"#00a89f",tealGlow:"rgba(0,210,200,0.15)",success:"#22c55e",danger:"#ef4444",warning:"#eab308",info:"#3b82f6",orange:"#f97316",purple:"#a855f7"};
const Card=({children,style})=><div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:16,padding:18,...style}}>{children}</div>;
const Badge=({children,color=C.teal})=><span style={{display:"inline-flex",padding:"3px 8px",borderRadius:6,fontSize:9,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color,background:color+"15",border:`1px solid ${color}25`}}>{children}</span>;
const Btn=({children,onClick,icon,style})=><button onClick={onClick} style={{background:`linear-gradient(135deg,${C.teal},${C.tealDark})`,color:"#000",fontWeight:700,padding:"16px 24px",borderRadius:14,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,width:"100%",fontFamily:"inherit",border:"none",...style}}>{icon&&<span>{icon}</span>}{children}</button>;

const WEEKLY_SPLITS = {
  2: "Full Body × 2",
  3: "Full Body × 3 (or Push-Pull-Legs)",
  4: "Upper-Lower × 2",
  5: "Push-Pull-Legs + Upper-Lower",
  6: "Push-Pull-Legs × 2",
};

const PHASES = [
  { num: 1, name: "Foundation", weeks: "1-8", focus: "Building movement quality and stability", sets: "1-3", reps: "12-20", style: "Slow tempos, high reps, injury-safe patterns",
    unlocks: "Core stability, hip hinge competency, single-leg balance",
    criteria: "8+ sessions, proper form, no pain increases, core stability basic earned" },
  { num: 2, name: "Strength", weeks: "9-16", focus: "Progressive loading and compound lifts", sets: "2-4", reps: "8-12", style: "Moderate tempos, progressive overload",
    unlocks: "Barbell exercises, heavier loading, sport-specific patterns",
    criteria: "Hip hinge competent, barbell competent, all injuries ≤2 severity" },
  { num: 3, name: "Hypertrophy", weeks: "17-24", focus: "Muscle development toward your size goals", sets: "3-5", reps: "6-12", style: "Volume focus, mind-muscle connection",
    unlocks: "Advanced exercises, higher volume, power training prep",
    criteria: "Strength benchmarks met, no compensations on retest" },
  { num: 4, name: "Performance", weeks: "25+", focus: "Sport-specific power and advanced training", sets: "4-6", reps: "1-10", style: "Power, plyometrics, sport-specific drills",
    unlocks: "Full exercise library, plyometrics, heavy loading",
    criteria: "Heavy loading ready, medical clearance for high intensity" },
];

export default function AssessmentSummary({ onContinue, userName }) {
  const assessment = getAssessment();
  const injuries = getInjuries();
  const activeInjuries = injuries.filter(i => i.status !== "resolved");

  const blocked = useMemo(() => {
    const result = {};
    activeInjuries.forEach(inj => {
      const blockedEx = exerciseDB.filter(e => {
        const sg = e.contraindications?.severity_gate || {};
        return sg[inj.gateKey] !== undefined && inj.severity > sg[inj.gateKey];
      });
      result[inj.area] = blockedEx.length;
    });
    return result;
  }, [activeInjuries]);

  const detectedComps = (assessment?.compensations || []).map(id => compensationsDB.find(c => c.id === id)).filter(Boolean);
  const goals = assessment?.goals || {};
  const prefs = assessment?.preferences || {};
  const phase = assessment?.startingPhase || 1;
  const level = assessment?.fitnessLevel || "beginner";
  const daysPerWeek = prefs.daysPerWeek || 3;
  const compAdds = assessment?.compensatoryAdditions || [];

  // First week preview exercises
  const firstWeek = useMemo(() => {
    const days = [];
    for (let d = 0; d < Math.min(daysPerWeek, 3); d++) {
      days.push({ day: d + 1, ...{ warmup: exerciseDB.filter(e => e.category === "warmup" && (e.phaseEligibility || []).includes(1)).slice(d * 2, d * 2 + 3), main: exerciseDB.filter(e => e.category === "main" && (e.phaseEligibility || []).includes(1) && e.safetyTier !== "red").slice(d * 3, d * 3 + 4), cooldown: exerciseDB.filter(e => e.category === "cooldown" && (e.phaseEligibility || []).includes(1)).slice(0, 2) } });
    }
    return days;
  }, [daysPerWeek]);

  // Favorite regression mapping
  const favRegressions = useMemo(() => {
    return (prefs.favorites || []).map(fid => {
      const ex = exerciseDB.find(e => e.id === fid);
      if (!ex) return null;
      const isBlocked = ex.safetyTier === "red" || !(ex.phaseEligibility || []).includes(1);
      if (!isBlocked) return null;
      const regress = ex.progressionChain?.regressTo ? exerciseDB.find(e => e.id === ex.progressionChain.regressTo) : null;
      return { name: ex.name, regress: regress?.name || "Foundation exercises", estimateWeek: ex.phaseEligibility?.includes(2) ? "8-12" : "17+" };
    }).filter(Boolean);
  }, [prefs.favorites]);

  // Medical clearance required for high-severity post-op or post-surgical conditions
  const _clearanceConditionIds = ["spinal_fusion_lumbar","spinal_fusion_cervical","acl_post_op","meniscus_post_op","rotator_cuff_post_op","total_joint_replacement"];
  const requiresClearance = activeInjuries.some(c => (c.severity || 0) >= 4 || _clearanceConditionIds.includes(c.conditionId || c.condition_key || c.condition || ""));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header */}
      <div style={{ textAlign: "center", padding: "10px 0" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: 3 }}>ASSESSMENT COMPLETE</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 3, marginTop: 4 }}>YOUR PLAN IS READY</div>
        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>Built by your coaching team. Evidence-based. Personalized.</div>
      </div>
      {requiresClearance && (
        <ClearanceBanner />
      )}

      {/* Section 1: Profile at a Glance */}
      <Card>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.teal, letterSpacing: 2, marginBottom: 10 }}>YOUR PROFILE</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif" }}>{(userName || "Athlete").toUpperCase()}</div><div style={{ fontSize: 8, color: C.textDim }}>ATHLETE</div></div>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 800, color: C.teal, fontFamily: "'Bebas Neue',sans-serif" }}>{level.toUpperCase()}</div><div style={{ fontSize: 8, color: C.textDim }}>FITNESS LEVEL</div></div>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 800, color: C.info, fontFamily: "'Bebas Neue',sans-serif" }}>PHASE {phase}</div><div style={{ fontSize: 8, color: C.textDim }}>STARTING</div></div>
        </div>
        {activeInjuries.length > 0 && <div style={{ marginBottom: 8 }}><div style={{ fontSize: 9, fontWeight: 700, color: C.danger, marginBottom: 4 }}>ACTIVE CONDITIONS</div>{activeInjuries.map(inj => (
          <div key={inj.id} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
            <span style={{ fontSize: 10, color: C.text }}>{inj.area} — {inj.type}</span><Badge color={inj.severity <= 2 ? C.success : inj.severity <= 3 ? C.warning : C.danger}>Sev {inj.severity}</Badge>
          </div>
        ))}</div>}
        {detectedComps.length > 0 && <div><div style={{ fontSize: 9, fontWeight: 700, color: C.warning, marginBottom: 4 }}>COMPENSATIONS DETECTED</div>{detectedComps.map(c => (
          <div key={c.id} style={{ fontSize: 10, color: C.text, padding: "2px 0" }}>{c.name} — <span style={{ color: C.textMuted }}>{c.description?.substring(0, 80)}...</span></div>
        ))}</div>}
      </Card>

      {/* Section 2: Training Strategy */}
      <Card>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.purple, letterSpacing: 2, marginBottom: 10 }}>YOUR TRAINING STRATEGY</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          <div style={{ background: C.bgElevated, borderRadius: 10, padding: 10, textAlign: "center" }}><div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{daysPerWeek}×/week</div><div style={{ fontSize: 8, color: C.textDim }}>TRAINING DAYS</div></div>
          <div style={{ background: C.bgElevated, borderRadius: 10, padding: 10, textAlign: "center" }}><div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{prefs.sessionTime || 45}min</div><div style={{ fontSize: 8, color: C.textDim }}>PER SESSION</div></div>
        </div>
        <div style={{ fontSize: 11, color: C.text, marginBottom: 6 }}>Split: <b style={{ color: C.teal }}>{WEEKLY_SPLITS[daysPerWeek] || "Full Body"}</b></div>
        {Object.entries(goals).filter(([, v]) => (Array.isArray(v) ? v.length > 0 : v)).length > 0 && <div style={{ marginTop: 6 }}><div style={{ fontSize: 9, fontWeight: 700, color: C.textDim, marginBottom: 4 }}>GOALS</div>{Object.entries(goals).filter(([, v]) => (Array.isArray(v) ? v.length > 0 : v)).map(([m, g]) => {
          const ga = Array.isArray(g) ? g : [g];
          return <div key={m} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}><span style={{ fontSize: 10, color: C.text }}>{m}</span><div style={{ display: "flex", gap: 2 }}>{ga.map(gg => <Badge key={gg} color={gg === "size" ? C.purple : gg === "strength" ? C.teal : C.info}>{gg.replace("_", " ")}</Badge>)}</div></div>;
        })}</div>}
        {compAdds.length > 0 && <div style={{ marginTop: 8, padding: 8, background: C.info + "08", borderRadius: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: C.info, marginBottom: 4 }}>AUTO-ADDED FOR SAFETY</div>
          {compAdds.map((a, i) => <div key={i} style={{ fontSize: 9, color: C.textMuted, padding: "2px 0" }}><b style={{ color: C.teal }}>{a.muscle}</b> ← {a.reason}</div>)}
        </div>}
      </Card>

      {/* Section 3: What We're Protecting */}
      {activeInjuries.length > 0 && <Card style={{ borderColor: C.danger + "20" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.danger, letterSpacing: 2, marginBottom: 10 }}>WHAT WE'RE PROTECTING</div>
        {activeInjuries.map(inj => (
          <div key={inj.id} style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{inj.area}</span>
              <Badge color={inj.severity <= 2 ? C.warning : C.danger}>Severity {inj.severity}/5</Badge>
            </div>
            <div style={{ fontSize: 10, color: C.textMuted }}>
              {blocked[inj.area] || 0} exercises blocked · {(inj.protocols || []).length > 0 ? inj.protocols.slice(0, 2).join(", ") : "Adapted exercise selection"}
            </div>
          </div>
        ))}
        <div style={{ fontSize: 9, color: C.textDim, marginTop: 6, fontStyle: "italic" }}>As conditions improve, exercises unlock automatically. Your plan adapts every session.</div>
      </Card>}

      {/* Section 4: 12-Month Roadmap */}
      <Card>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.orange, letterSpacing: 2, marginBottom: 12 }}>YOUR 12-MONTH ROADMAP</div>
        {PHASES.map(p => {
          const isCurrent = p.num === phase;
          return (
            <div key={p.num} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.border}`, opacity: p.num < phase ? 0.4 : 1 }}>
              <div style={{ width: 36, textAlign: "center", flexShrink: 0 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: isCurrent ? C.teal : C.bgElevated, border: `2px solid ${isCurrent ? C.teal : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: isCurrent ? "#000" : C.textDim }}>{p.num}</span>
                </div>
                {isCurrent && <div style={{ fontSize: 7, color: C.teal, fontWeight: 700, marginTop: 2 }}>YOU ARE HERE</div>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: isCurrent ? C.teal : C.text }}>{p.name}</div>
                <div style={{ fontSize: 9, color: C.textDim }}>Weeks {p.weeks} · {p.sets} sets × {p.reps} reps</div>
                <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{p.focus}</div>
                <div style={{ fontSize: 8, color: C.textDim, marginTop: 2 }}>Unlocks: {p.unlocks}</div>
                {p.num > phase && <div style={{ fontSize: 8, color: C.info, marginTop: 2 }}>Requires: {p.criteria}</div>}
              </div>
            </div>
          );
        })}
        <div style={{ fontSize: 9, color: C.textDim, marginTop: 8, fontStyle: "italic" }}>Timelines adapt based on your progress — we move you forward when you're ready, not on a fixed calendar.</div>
      </Card>

      {/* Section 5: First Week Preview — editable */}
      <Card>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.success, letterSpacing: 2, marginBottom: 4 }}>FIRST WEEK PREVIEW</div>
        <div style={{ fontSize: 10, color: C.textDim, marginBottom: 8 }}>Tap ✕ to remove an exercise — we'll find a replacement.</div>
        {firstWeek.map(day => (
          <div key={day.day} style={{ padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4 }}>Day {day.day} — ~{prefs.sessionTime || 45} min</div>
            {[{ label: "Warm-Up", exercises: day.warmup, color: C.info, key: "warmup" }, { label: "Main", exercises: day.main, color: C.teal, key: "main" }, { label: "Cooldown", exercises: day.cooldown, color: C.success, key: "cooldown" }].map(sec => (
              <div key={sec.label} style={{ marginLeft: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 8, fontWeight: 700, color: sec.color }}>{sec.label}: </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 2 }}>
                  {sec.exercises.map(e => (
                    <span key={e.id} style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 6px", borderRadius: 6, background: C.bgGlass, border: `1px solid ${C.border}`, fontSize: 9, color: C.textMuted }}>
                      {e.emoji} {e.name}
                      {sec.key === "main" && sec.exercises.length > 1 && <span onClick={() => {
                        // Check movement pattern minimum before removing
                        const mp = (e.movementPattern || "").toLowerCase();
                        const patterns = ["push","pull","hinge","squat","core"];
                        const thisPattern = patterns.find(p => mp.includes(p));
                        const othersWithPattern = sec.exercises.filter(x => x.id !== e.id && patterns.some(p => (x.movementPattern || "").toLowerCase().includes(p) && p === thisPattern));
                        if (thisPattern && othersWithPattern.length === 0) {
                          alert(`You need at least one ${thisPattern} exercise for balanced training. Try swapping it instead.`);
                          return;
                        }
                        // Find substitute
                        const sub = exerciseDB.find(s => s.category === sec.key && s.id !== e.id && !sec.exercises.find(x => x.id === s.id) && (s.bodyPart === e.bodyPart || (s.movementPattern || "").includes(thisPattern || "")) && (s.phaseEligibility || []).includes(1));
                        if (sub) {
                          const idx = sec.exercises.indexOf(e);
                          sec.exercises[idx] = sub;
                        } else {
                          sec.exercises.splice(sec.exercises.indexOf(e), 1);
                        }
                      }} style={{ cursor: "pointer", color: C.danger, fontSize: 9, fontWeight: 700, marginLeft: 2 }}>✕</span>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
        {favRegressions.length > 0 && <div style={{ marginTop: 8, padding: 8, background: C.warning + "08", borderRadius: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: C.warning, marginBottom: 4 }}>FAVORITE EXERCISE PROGRESSIONS</div>
          {favRegressions.map((fr, i) => <div key={i} style={{ fontSize: 9, color: C.textMuted, padding: "2px 0" }}>You favorited <b style={{ color: C.text }}>{fr.name}</b> — starting with {fr.regress} first. Estimated unlock: Week {fr.estimateWeek}</div>)}
        </div>}
      </Card>

      {/* Section 6: 6-Week Block Expectations */}
      <Card>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.info, letterSpacing: 2, marginBottom: 12 }}>WHAT TO EXPECT — 6-WEEK BLOCKS</div>
        {[
          { weeks: "1-2", title: "Neural Adaptation", color: C.info, items: [
            "Your body is learning new movement patterns",
            "Expect: slight soreness, improving form, building mind-muscle connection",
            "Sets are intentionally low (1-2 per exercise) — protects your joints while nervous system adapts",
            "Strength gains: 10-15% from neural efficiency alone (not muscle growth yet)",
          ]},
          { weeks: "3-4", title: "Foundation Building", color: C.teal, items: [
            "Movement quality improving — exercises feel more natural",
            "Volume increases to 2-3 sets — connective tissue ready",
            "Less soreness between sessions, better balance, improved confidence",
            "Stabilizer muscles engaging properly now",
          ]},
          { weeks: "5-6", title: "Phase 1 Completion", color: C.success, items: [
            "Testing readiness for Phase 2",
            "Core endurance: hold plank 30+ seconds",
            "Hip hinge: proper form with bodyweight → light load",
            "Balance: single-leg stance 20+ seconds",
            "Pain levels: stable or improved vs Week 1",
          ]},
        ].map(block => (
          <div key={block.weeks} style={{ marginBottom: 10, padding: 10, background: block.color + "08", borderRadius: 10, border: `1px solid ${block.color}15` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: block.color }}>Week {block.weeks}: {block.title}</span>
            </div>
            {block.items.map((item, i) => (
              <div key={i} style={{ fontSize: 10, color: C.textMuted, padding: "2px 0", paddingLeft: 8 }}>· {item}</div>
            ))}
          </div>
        ))}
        <div style={{ fontSize: 9, color: C.textDim, fontStyle: "italic" }}>Beyond Week 6: Phase 2 (Strength) introduces progressive loading, Phase 3 (Hypertrophy) targets size goals.</div>
      </Card>

      {/* Section 7: PT Protocol Details */}
      {(() => {
        const ptProtocols = assessment?.conditions?.length ? generateProtocols(assessment) : [];
        if (!ptProtocols.length) return null;
        // Save protocols for later use
        saveLocalProtocols(ptProtocols);
        const FREQ_LABELS = { acute: "3-6× per day · 5-10 min", subacute: "2-3× per day · 10-15 min", chronic: "1-2× per day · 15-20 min", chronic_persistent: "1× per day · 15-20 min" };
        const TYPE_LABELS = { mckenzie_extension: "McKenzie Extension Protocol", williams_flexion: "Williams Flexion Protocol", neutral_stabilization: "Neutral Stabilization (McGill Big 3)", joint_rom: "Joint ROM Recovery", joint_strengthening: "Joint Strengthening", shoulder_rehab: "Shoulder Rehabilitation", general: "General Rehabilitation" };
        return (
          <Card style={{ borderColor: C.purple + "20" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.purple, letterSpacing: 2, marginBottom: 12 }}>YOUR PHYSICAL THERAPY PLAN</div>
            {ptProtocols.map((proto, i) => {
              const tl = proto.timeline;
              const onset = tl?.onset || "chronic";
              return (
                <div key={i} style={{ marginBottom: i < ptProtocols.length - 1 ? 14 : 0, paddingBottom: i < ptProtocols.length - 1 ? 14 : 0, borderBottom: i < ptProtocols.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>{proto.protocol_name}</div>
                  <Badge color={C.purple}>{TYPE_LABELS[proto.protocol_type] || proto.protocol_type}</Badge>
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      <div style={{ padding: 8, background: C.bgElevated, borderRadius: 8, textAlign: "center" }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: C.purple }}>{proto.frequency_per_day}×/day</div>
                        <div style={{ fontSize: 8, color: C.textDim }}>FREQUENCY</div>
                      </div>
                      <div style={{ padding: 8, background: C.bgElevated, borderRadius: 8, textAlign: "center" }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: C.teal }}>{proto.session_duration_minutes}min</div>
                        <div style={{ fontSize: 8, color: C.textDim }}>PER SESSION</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: C.textMuted, marginTop: 6 }}>
                    Schedule: {FREQ_LABELS[onset] || "2× per day"} · {onset === "acute" ? "Gentle intensity — pain should not increase" : onset === "subacute" ? "Moderate — mild discomfort OK" : "Progressive — challenging but controlled"}
                  </div>
                  {/* Phase timeline */}
                  <div style={{ marginTop: 8 }}>
                    {[
                      { w: "1-4", n: "Pain Management", g: "Pain ≤4/10, exercises tolerated" },
                      { w: "5-8", n: "Stability Foundation", g: "Hold positions 30s+, pain-free exercise" },
                      { w: "9-12", n: "Functional Loading", g: "Daily activities pain-free" },
                      { w: "13-24", n: "Progressive Strengthening", g: "Return to full training" },
                    ].map((ph, pi) => (
                      <div key={pi} style={{ display: "flex", gap: 6, padding: "3px 0" }}>
                        <span style={{ fontSize: 9, color: pi === 0 ? C.purple : C.textDim, fontWeight: pi === 0 ? 700 : 400, minWidth: 50 }}>Wk {ph.w}</span>
                        <span style={{ fontSize: 9, color: pi === 0 ? C.text : C.textDim }}>{ph.n} — {ph.g}</span>
                      </div>
                    ))}
                  </div>
                  {/* Directional preference note */}
                  {proto.directional_preference && (
                    <div style={{ marginTop: 6, padding: 6, background: C.info + "08", borderRadius: 6 }}>
                      <div style={{ fontSize: 9, color: C.info }}>
                        {proto.directional_preference.extension === "better" ? "Extension-biased: McKenzie press-ups and standing extensions as primary PT exercises." :
                         proto.directional_preference.flexion === "better" ? "Flexion-biased: Williams flexion exercises (knee-to-chest, pelvic tilts) as primary PT exercises." :
                         "Neutral: McGill Big 3 (curl-up, side plank, bird dog) as primary PT protocol."}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ fontSize: 9, color: C.textDim, marginTop: 8, fontStyle: "italic" }}>PT sessions run independently from main workouts. Reminders appear on your Home screen.</div>
          </Card>
        );
      })()}

      {/* Section 8: Functional Goals */}
      {(() => {
        const fl = assessment?.functionalLimitations || {};
        const limited = Object.entries(fl).filter(([, v]) => v !== "easy");
        if (!limited.length) return null;
        const labels = { sit_30: "Sit for 30+ minutes", stand_30: "Stand for 30+ minutes", walk_15: "Walk for 15+ minutes", climb_stairs: "Climb stairs", lift_overhead: "Lift objects overhead", reach_behind: "Reach behind back", get_up_floor: "Get up from floor", sleep_through: "Sleep through the night", drive_30: "Drive for 30+ minutes", exercise_moderate: "Exercise at moderate intensity" };
        return (
          <Card style={{ borderColor: C.info + "20" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.info, letterSpacing: 2, marginBottom: 10 }}>YOUR FUNCTIONAL GOALS</div>
            <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 8 }}>These limitations become measurable targets. Reassessed every 4 weeks.</div>
            {limited.map(([key, val]) => (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                <div>
                  <div style={{ fontSize: 11, color: C.text }}>{labels[key] || key}</div>
                  <div style={{ fontSize: 9, color: C.textDim }}>Current: {val === "cannot" ? "Cannot do" : "With difficulty"} → Goal: Can do easily</div>
                </div>
                <Badge color={val === "cannot" ? C.danger : C.warning}>{val === "cannot" ? "CANNOT" : "DIFFICULT"}</Badge>
              </div>
            ))}
            <div style={{ fontSize: 9, color: C.textDim, marginTop: 6, fontStyle: "italic" }}>Your PT protocol and training program work together to improve each of these.</div>
          </Card>
        );
      })()}

      {/* Section 9: How We Verify This Plan */}
      <Card style={{ borderColor: C.success + "20" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.success, letterSpacing: 2, marginBottom: 10 }}>HOW WE VERIFY THIS PLAN</div>
        {[
          { icon: "📊", text: `Every exercise selected from a database of ${exerciseDB.length} evidence-based movements` },
          { icon: "🛡️", text: `Each exercise checked against your ${activeInjuries.length} active condition${activeInjuries.length !== 1 ? "s" : ""} — ${Object.values(blocked).reduce((s, v) => s + v, 0)} exercises blocked for safety` },
          { icon: "🔬", text: "Compensatory muscle work auto-calculated from your movement screen" },
          { icon: "📚", text: "Plan follows evidence-based exercise science protocols, McKenzie Method guidelines, and current PT research" },
          { icon: "🔄", text: "Plan recalculates daily based on your feedback, pain levels, and progress" },
          { icon: "⚠️", text: "If anything feels wrong — tell the coach. The app adapts immediately." },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 8, padding: "5px 0" }}>
            <span style={{ fontSize: 12, flexShrink: 0 }}>{item.icon}</span>
            <span style={{ fontSize: 10, color: C.textMuted }}>{item.text}</span>
          </div>
        ))}
      </Card>

      {/* CTA */}
      <Btn onClick={onContinue} icon="🚀" style={{ fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 3, fontSize: 18 }}>LOOKS GREAT — LET'S START</Btn>
      <div style={{ height: 40 }} />
    </div>
  );
}
