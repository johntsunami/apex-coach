import { useState, useMemo } from "react";
import exerciseDB from "../data/exercises.json";
import { getAssessment } from "./Onboarding.jsx";
import { getInjuries } from "../utils/injuries.js";
import { getStats } from "../utils/storage.js";
import { getVolumeSummary, getTrainingWeek } from "../utils/volumeTracker.js";

// ═══════════════════════════════════════════════════════════════
// Long-Term Plan View — This Week / Monthly / 12-Month / Blocked
// ═══════════════════════════════════════════════════════════════

const C={bg:"#060b18",bgCard:"#0d1425",bgElevated:"#162040",bgGlass:"rgba(255,255,255,0.04)",border:"rgba(255,255,255,0.08)",text:"#e8ecf4",textMuted:"#7a8ba8",textDim:"#4a5a78",teal:"#00d2c8",tealBg:"rgba(0,210,200,0.08)",tealDark:"#00a89f",success:"#22c55e",danger:"#ef4444",warning:"#eab308",info:"#3b82f6",orange:"#f97316",purple:"#a855f7"};
const Card=({children,style})=><div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:16,padding:16,...style}}>{children}</div>;
const Badge=({children,color=C.teal})=><span style={{display:"inline-flex",padding:"3px 8px",borderRadius:6,fontSize:9,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color,background:color+"15"}}>{children}</span>;
const ProgressBar=({value,max=100,color=C.teal,height=5})=><div style={{width:"100%",height,background:C.border,borderRadius:height/2,overflow:"hidden"}}><div style={{width:`${Math.min(100,(value/max)*100)}%`,height:"100%",background:color,borderRadius:height/2}}/></div>;

const PHASE = 1; // Current phase

export default function PlanView({ onClose }) {
  const [tab, setTab] = useState("week");
  const assessment = getAssessment();
  const injuries = getInjuries().filter(i => i.status !== "resolved");
  const stats = getStats();
  const tw = getTrainingWeek();
  const vs = getVolumeSummary(PHASE);
  const daysPerWeek = assessment?.preferences?.daysPerWeek || 3;

  const TABS = [
    { id: "week", label: "This Week" },
    { id: "monthly", label: "Monthly" },
    { id: "roadmap", label: "12-Month" },
    { id: "blocked", label: "Blocked" },
  ];

  // Weekly plan — generate exercise lists per day
  const weekPlan = useMemo(() => {
    const days = [];
    const pool = exerciseDB.filter(e => (e.phaseEligibility || []).includes(PHASE) && e.safetyTier !== "red");
    for (let d = 0; d < daysPerWeek; d++) {
      const warmup = pool.filter(e => e.category === "warmup").slice(d * 2, d * 2 + 3);
      const main = pool.filter(e => e.category === "main").slice(d * 3, d * 3 + 4);
      const cooldown = pool.filter(e => e.category === "cooldown").slice(0, 2);
      days.push({ day: d + 1, warmup, main, cooldown, total: warmup.length + main.length + cooldown.length });
    }
    return days;
  }, [daysPerWeek]);

  // Blocked exercises with reasons
  const blockedExercises = useMemo(() => {
    const results = [];
    exerciseDB.forEach(e => {
      const reasons = [];
      if (!(e.phaseEligibility || []).includes(PHASE)) reasons.push(`Phase ${Math.min(...(e.phaseEligibility || [9]))}+ required`);
      if (e.safetyTier === "red") reasons.push("Red safety tier — clearance needed");
      const sg = e.contraindications?.severity_gate || {};
      injuries.forEach(inj => {
        if (sg[inj.gateKey] !== undefined && inj.severity > sg[inj.gateKey]) reasons.push(`${inj.area} severity ${inj.severity} > gate ${sg[inj.gateKey]}`);
      });
      const pre = e.prerequisites || {};
      if (pre.minCompletedSessions && stats.totalSessions < pre.minCompletedSessions) reasons.push(`Need ${pre.minCompletedSessions} sessions (have ${stats.totalSessions})`);
      if (reasons.length > 0) results.push({ id: e.id, name: e.name, emoji: e.emoji, reasons, category: e.category, bodyPart: e.bodyPart });
    });
    return results;
  }, [injuries, stats]);

  const blockedByReason = {
    phase: blockedExercises.filter(e => e.reasons.some(r => r.includes("Phase"))).length,
    injury: blockedExercises.filter(e => e.reasons.some(r => r.includes("severity"))).length,
    safety: blockedExercises.filter(e => e.reasons.some(r => r.includes("Red"))).length,
    sessions: blockedExercises.filter(e => e.reasons.some(r => r.includes("sessions"))).length,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.teal, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 3 }}>MY PLAN</div>
          <div style={{ fontSize: 11, color: C.textMuted }}>Week {tw.week} · Phase {PHASE}{tw.isDeload ? " · DELOAD" : ""}</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 12, cursor: "pointer" }}>← Back</button>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", background: C.bgElevated, borderRadius: 10, padding: 2 }}>
        {TABS.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: "pointer", background: tab === t.id ? C.tealBg : "transparent", border: tab === t.id ? `1px solid ${C.teal}30` : "1px solid transparent", color: tab === t.id ? C.teal : C.textDim }}>{t.label}</button>)}
      </div>

      {/* ── TAB: THIS WEEK ──────────────────────────────────── */}
      {tab === "week" && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {tw.isDeload && <Card style={{ background: C.info + "10", borderColor: C.info + "30" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 18 }}>🔄</span><div><div style={{ fontSize: 12, fontWeight: 700, color: C.info }}>Deload Week</div><div style={{ fontSize: 10, color: C.textMuted }}>50% volume. Focus on movement quality and recovery.</div></div></div>
        </Card>}
        {weekPlan.map(day => (
          <Card key={day.day}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Day {day.day}</div>
              <div style={{ fontSize: 10, color: C.textDim }}>{day.total} exercises · ~{assessment?.preferences?.sessionTime || 45}min</div>
            </div>
            {[{ label: "Inhibit + Lengthen", ex: day.warmup, c: C.info }, { label: "Activate + Integrate", ex: day.main, c: C.teal }, { label: "Cooldown", ex: day.cooldown, c: C.success }].map(sec => (
              <div key={sec.label} style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: sec.c, letterSpacing: 1, marginBottom: 2 }}>{sec.label}</div>
                <div style={{ fontSize: 10, color: C.textMuted }}>{sec.ex.map(e => e.emoji + " " + e.name).join("  ·  ") || "—"}</div>
              </div>
            ))}
          </Card>
        ))}
        {/* Rest days */}
        {daysPerWeek < 7 && <Card style={{ textAlign: "center", opacity: 0.6 }}>
          <div style={{ fontSize: 11, color: C.textMuted }}>{7 - daysPerWeek} rest day{7 - daysPerWeek !== 1 ? "s" : ""} this week — recovery is training</div>
        </Card>}
        {/* Volume summary */}
        {vs.groups.length > 0 && <Card>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.purple, letterSpacing: 1.5, marginBottom: 8 }}>WEEKLY VOLUME</div>
          {vs.groups.map(g => (
            <div key={g.muscle} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0" }}>
              <span style={{ fontSize: 10, color: C.text, minWidth: 60 }}>{g.muscle}</span>
              <div style={{ flex: 1 }}><ProgressBar value={g.sets} max={g.limit} color={g.over ? C.danger : g.pct >= 80 ? C.warning : C.teal} /></div>
              <span style={{ fontSize: 9, color: g.over ? C.danger : C.textDim, minWidth: 36, textAlign: "right" }}>{g.sets}/{g.limit}</span>
            </div>
          ))}
        </Card>}
      </div>}

      {/* ── TAB: MONTHLY ────────────────────────────────────── */}
      {tab === "monthly" && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[1, 2, 3, 4].map(w => {
          const isCurrent = tw.week % 4 === w || (tw.week % 4 === 0 && w === 4);
          const isDeload = w === 4;
          return (
            <Card key={w} style={{ borderColor: isCurrent ? C.teal + "40" : C.border }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: isCurrent ? C.teal : C.text }}>Week {w}</span>
                  {isCurrent && <Badge color={C.teal}>CURRENT</Badge>}
                  {isDeload && <Badge color={C.info}>DELOAD</Badge>}
                </div>
                <span style={{ fontSize: 10, color: C.textDim }}>{daysPerWeek} sessions</span>
              </div>
              <div style={{ fontSize: 10, color: C.textMuted }}>
                {isDeload ? "50% volume reduction. Focus on recovery, mobility, form review." :
                  w <= 2 ? "1-2 sets/exercise. Neural adaptation. Movement quality focus." :
                    "2-3 sets/exercise. Building volume progressively."}
              </div>
              {w === 1 && <div style={{ fontSize: 9, color: C.info, marginTop: 4 }}>New exercises introduced: core stability, hip hinge pattern, balance work</div>}
              {w === 3 && <div style={{ fontSize: 9, color: C.success, marginTop: 4 }}>Volume increases. Progressive overload begins on compound movements.</div>}
            </Card>
          );
        })}
        <Card style={{ background: C.bgGlass }}>
          <div style={{ fontSize: 10, color: C.textDim, fontStyle: "italic" }}>Each 4-week block follows: build → build → peak → deload. Volume increases ~10% week-to-week, then drops 50% for recovery.</div>
        </Card>
      </div>}

      {/* ── TAB: 12-MONTH ROADMAP ───────────────────────────── */}
      {tab === "roadmap" && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { num: 1, name: "Foundation", weeks: "1-8", focus: "Movement quality, core stability, injury-safe patterns", style: "1-3 sets, 12-20 reps, slow tempos",
            unlocks: ["Core stability basic", "Hip hinge competent", "Single-leg stable"], newEx: "Dead bug, bird dog, glute bridge, goblet squat, band pull-apart",
            injuryMilestone: null, sportAdd: null,
            criteria: "8+ sessions, proper form, no pain, core stability earned" },
          { num: 2, name: "Strength", weeks: "9-16", focus: "Progressive overload, compound lifts, sport patterns", style: "2-4 sets, 8-12 reps, moderate tempos",
            unlocks: ["Barbell competent", "Heavy loading ready", "Shoulder pressing cleared"], newEx: "Trap bar deadlift, landmine press, cable rows, front squat",
            injuryMilestone: "If back drops to severity 2 → conventional deadlift unlocks",
            sportAdd: "BJJ: guard mobility drills. Surfing: shoulder endurance circuits",
            criteria: "All injuries ≤2, barbell competent, no compensations" },
          { num: 3, name: "Hypertrophy", weeks: "17-24", focus: "Muscle development, volume accumulation, mind-muscle", style: "3-5 sets, 6-12 reps, controlled tempos",
            unlocks: ["Pull-up ready", "Plyometric ready (if knee allows)"], newEx: "Bench press, pull-ups, barbell hip thrust, advanced core",
            injuryMilestone: "If knee drops to severity 1 → plyometrics and box jumps unlock",
            sportAdd: "Muay Thai: rotational power. Hiking: ankle stability + quad endurance",
            criteria: "Strength benchmarks met, no compensations on retest" },
          { num: 4, name: "Performance", weeks: "25+", focus: "Sport-specific power, advanced training, competition prep", style: "4-6 sets, 1-10 reps, explosive tempos",
            unlocks: ["Full exercise library", "Olympic lifts", "Advanced plyometrics"], newEx: "Power clean, box jumps, sled work, sport-specific drills",
            injuryMilestone: "Full athletic clearance based on ongoing assessment",
            sportAdd: "Full sport-specific periodization available",
            criteria: "Heavy loading ready, medical clearance for high intensity" },
        ].map(p => {
          const isCurrent = p.num === PHASE;
          const isPast = p.num < PHASE;
          return (
            <Card key={p.num} style={{ borderColor: isCurrent ? C.teal + "40" : C.border, opacity: isPast ? 0.5 : 1 }}>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ width: 32, textAlign: "center", flexShrink: 0 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: isCurrent ? C.teal : isPast ? C.success : C.bgElevated, border: `2px solid ${isCurrent ? C.teal : isPast ? C.success : C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: isCurrent || isPast ? "#000" : C.textDim }}>{isPast ? "✓" : p.num}</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: isCurrent ? C.teal : C.text }}>{p.name}</span>
                    <span style={{ fontSize: 9, color: C.textDim }}>Weeks {p.weeks}</span>
                  </div>
                  <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{p.focus}</div>
                  <div style={{ fontSize: 9, color: C.textDim, marginTop: 2 }}>{p.style}</div>
                  <div style={{ fontSize: 9, color: C.success, marginTop: 4 }}>Unlocks: {p.unlocks.join(", ")}</div>
                  <div style={{ fontSize: 9, color: C.info, marginTop: 2 }}>New exercises: {p.newEx}</div>
                  {p.injuryMilestone && <div style={{ fontSize: 9, color: C.warning, marginTop: 2 }}>{p.injuryMilestone}</div>}
                  {p.sportAdd && <div style={{ fontSize: 9, color: C.purple, marginTop: 2 }}>{p.sportAdd}</div>}
                  {!isCurrent && !isPast && <div style={{ fontSize: 8, color: C.textDim, marginTop: 4, padding: 4, background: C.bgGlass, borderRadius: 4 }}>Requires: {p.criteria}</div>}
                  {isCurrent && <Badge color={C.teal}>YOU ARE HERE</Badge>}
                </div>
              </div>
            </Card>
          );
        })}
        <Card style={{ background: C.bgGlass }}>
          <div style={{ fontSize: 10, color: C.textDim, fontStyle: "italic" }}>This plan updates every session based on your progress and feedback. Nothing is locked — if you progress faster, we adapt. If you need more time, we slow down.</div>
        </Card>
      </div>}

      {/* ── TAB: BLOCKED & WHY ──────────────────────────────── */}
      {tab === "blocked" && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Card>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.danger, letterSpacing: 1.5, marginBottom: 8 }}>BLOCKED EXERCISES SUMMARY</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ background: C.bgElevated, borderRadius: 8, padding: 10, textAlign: "center" }}><div style={{ fontSize: 20, fontWeight: 800, color: C.danger }}>{blockedExercises.length}</div><div style={{ fontSize: 8, color: C.textDim }}>TOTAL BLOCKED</div></div>
            <div style={{ background: C.bgElevated, borderRadius: 8, padding: 10, textAlign: "center" }}><div style={{ fontSize: 20, fontWeight: 800, color: C.success }}>{exerciseDB.length - blockedExercises.length}</div><div style={{ fontSize: 8, color: C.textDim }}>AVAILABLE</div></div>
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
            {blockedByReason.phase > 0 && <Badge color={C.info}>{blockedByReason.phase} phase-gated</Badge>}
            {blockedByReason.injury > 0 && <Badge color={C.danger}>{blockedByReason.injury} injury-gated</Badge>}
            {blockedByReason.safety > 0 && <Badge color={C.warning}>{blockedByReason.safety} safety-gated</Badge>}
            {blockedByReason.sessions > 0 && <Badge color={C.purple}>{blockedByReason.sessions} session-gated</Badge>}
          </div>
        </Card>
        {blockedExercises.slice(0, 30).map(ex => (
          <Card key={ex.id} style={{ padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>{ex.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{ex.name}</div>
                <div style={{ fontSize: 9, color: C.textDim }}>{(ex.bodyPart || "").replace(/_/g, " ")} · {ex.category}</div>
              </div>
            </div>
            {ex.reasons.map((r, i) => <div key={i} style={{ fontSize: 9, color: C.danger, marginTop: 2, paddingLeft: 24 }}>🚫 {r}</div>)}
          </Card>
        ))}
        {blockedExercises.length > 30 && <div style={{ fontSize: 10, color: C.textDim, textAlign: "center" }}>+{blockedExercises.length - 30} more — use Library filters to explore</div>}
      </div>}

      <div style={{ height: 90 }} />
    </div>
  );
}
