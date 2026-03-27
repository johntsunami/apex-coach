import { useMemo } from "react";
import exerciseDB from "../data/exercises.json";
import compensationsDB from "../data/compensations.json";
import { getAssessment } from "./Onboarding.jsx";
import { getInjuries } from "../utils/injuries.js";
import { buildWorkoutList } from "../utils/workoutHelpers.js";

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header */}
      <div style={{ textAlign: "center", padding: "10px 0" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: 3 }}>ASSESSMENT COMPLETE</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 3, marginTop: 4 }}>YOUR PLAN IS READY</div>
        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>Built by your coaching team. Evidence-based. Personalized.</div>
      </div>

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

      {/* Section 5: First Week Preview */}
      <Card>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.success, letterSpacing: 2, marginBottom: 10 }}>FIRST WEEK PREVIEW</div>
        {firstWeek.map(day => (
          <div key={day.day} style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4 }}>Day {day.day} — ~{prefs.sessionTime || 45} min</div>
            {[{ label: "Warm-Up", exercises: day.warmup, color: C.info }, { label: "Main", exercises: day.main, color: C.teal }, { label: "Cooldown", exercises: day.cooldown, color: C.success }].map(sec => (
              <div key={sec.label} style={{ marginLeft: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 8, fontWeight: 700, color: sec.color }}>{sec.label}: </span>
                <span style={{ fontSize: 9, color: C.textMuted }}>{sec.exercises.map(e => e.emoji + " " + e.name).join(", ") || "—"}</span>
              </div>
            ))}
          </div>
        ))}
        {favRegressions.length > 0 && <div style={{ marginTop: 8, padding: 8, background: C.warning + "08", borderRadius: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: C.warning, marginBottom: 4 }}>FAVORITE EXERCISE PROGRESSIONS</div>
          {favRegressions.map((fr, i) => <div key={i} style={{ fontSize: 9, color: C.textMuted, padding: "2px 0" }}>You favorited <b style={{ color: C.text }}>{fr.name}</b> — starting with {fr.regress} first. Estimated unlock: Week {fr.estimateWeek}</div>)}
        </div>}
      </Card>

      {/* CTA */}
      <Btn onClick={onContinue} icon="🚀" style={{ fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 3, fontSize: 18 }}>LOOKS GREAT — LET'S START</Btn>
      <div style={{ height: 40 }} />
    </div>
  );
}
