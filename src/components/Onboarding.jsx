import { useState, useMemo } from "react";
import conditionsDB from "../data/conditions.json";
import compensationsDB from "../data/compensations.json";
import exerciseDB from "../data/exercises.json";

// ═══════════════════════════════════════════════════════════════
// APEX Coach — Onboarding Assessment (7 screens)
// PAR-Q+ → Conditions → Movement Screen → ROM → Goals →
// Preferences → Summary → generates first training plan
// ═══════════════════════════════════════════════════════════════

const STORAGE_KEY = "apex_assessment";

export function getAssessment() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
}
export function saveAssessment(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, completedAt: new Date().toISOString() }));
}
export function hasCompletedAssessment() {
  return !!getAssessment()?.completedAt;
}

// ── Shared styles (match App.jsx C object) ────────────────────
const C={bg:"#060b18",bgCard:"#0d1425",bgElevated:"#162040",bgGlass:"rgba(255,255,255,0.04)",border:"rgba(255,255,255,0.08)",text:"#e8ecf4",textMuted:"#7a8ba8",textDim:"#4a5a78",teal:"#00d2c8",tealGlow:"rgba(0,210,200,0.15)",tealDark:"#00a89f",tealBg:"rgba(0,210,200,0.08)",success:"#22c55e",danger:"#ef4444",warning:"#eab308",info:"#3b82f6",orange:"#f97316",purple:"#a855f7",purpleGlow:"rgba(168,85,247,0.12)"};
const Card=({children,style,onClick})=><div onClick={onClick} style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:16,padding:18,cursor:onClick?"pointer":"default",...style}}>{children}</div>;
const Btn=({children,onClick,disabled,style,variant="teal",icon})=>{const v={teal:{background:`linear-gradient(135deg,${C.teal},${C.tealDark})`,color:"#000",fontWeight:700},dark:{background:C.bgElevated,color:C.text,border:`1px solid ${C.border}`}};return<button onClick={onClick} disabled={disabled} style={{...v[variant],padding:"14px 24px",borderRadius:14,fontSize:15,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.4:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,width:"100%",fontFamily:"inherit",border:v[variant]?.border||"none",...style}}>{icon&&<span>{icon}</span>}{children}</button>;};
const Badge=({children,color=C.teal})=><span style={{display:"inline-flex",padding:"4px 10px",borderRadius:8,fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color,background:color+"15",border:`1px solid ${color}25`}}>{children}</span>;
const ProgressBar=({value,max=100,color=C.teal,height=6})=><div style={{width:"100%",height,background:C.border,borderRadius:height/2,overflow:"hidden"}}><div style={{width:`${Math.min(100,(value/max)*100)}%`,height:"100%",background:color,borderRadius:height/2,transition:"width 0.4s ease"}}/></div>;

const CONDITION_CATEGORIES = [
  {id:"spinal",label:"Spine & Back",icon:"🔙"},
  {id:"joint",label:"Joints (Knee, Shoulder, Hip, etc.)",icon:"🦴"},
  {id:"systemic",label:"Autoimmune & Systemic",icon:"🧬"},
  {id:"neurological",label:"Neurological",icon:"🧠"},
  {id:"cardiopulmonary",label:"Heart & Lungs",icon:"🫀"},
  {id:"metabolic",label:"Metabolic & Endocrine",icon:"⚗️"},
  {id:"mental_health",label:"Mental Health",icon:"💆"},
  {id:"pregnancy",label:"Pregnancy & Postpartum",icon:"🤰"},
  {id:"age_related",label:"Age-Related",icon:"👴"},
  {id:"amputation",label:"Amputation / Limb Difference",icon:"🦿"},
];

const COMPENSATIONS = [
  {id:"comp_knees_cave_in",q:"Do your knees cave inward when you squat?",icon:"🦵"},
  {id:"comp_feet_turn_out",q:"Do your feet turn out (duck feet) during squats?",icon:"🦶"},
  {id:"comp_excessive_forward_lean",q:"Do you lean forward excessively when squatting?",icon:"🏋️"},
  {id:"comp_low_back_arch",q:"Does your lower back arch excessively during movements?",icon:"🔙"},
  {id:"comp_arms_fall_forward",q:"Do your arms fall forward during overhead movements?",icon:"💪"},
  {id:"comp_shoulders_elevate",q:"Do your shoulders rise toward your ears during exercise?",icon:"🤷"},
  {id:"comp_head_forward",q:"Does your head push forward past your shoulders?",icon:"😐"},
];

const MUSCLE_GROUPS = [
  {id:"chest",label:"Chest",icon:"🫁"},
  {id:"back",label:"Back",icon:"🔙"},
  {id:"shoulders",label:"Shoulders",icon:"💪"},
  {id:"arms",label:"Arms (Biceps/Triceps)",icon:"💪"},
  {id:"legs",label:"Legs (Quads/Hamstrings)",icon:"🦵"},
  {id:"glutes",label:"Glutes",icon:"🍑"},
  {id:"core",label:"Core",icon:"⚫"},
];

const COMPENSATORY_LOGIC = {
  chest: { add: ["shoulders","back"], reason: "Chest growth requires rear delt + rotator cuff work to prevent shoulder impingement" },
  back: { add: ["core"], reason: "Back strength requires core stability to protect the spine under load" },
  shoulders: { add: ["back"], reason: "Shoulder development requires upper back balance (2:1 pull-to-push ratio)" },
  legs: { add: ["glutes","core"], reason: "Leg strength requires glute activation and core stability for safe movement" },
};

const PARQ_QUESTIONS = [
  "Has a doctor ever said you have a heart condition and should only do physical activity recommended by a doctor?",
  "Do you feel pain in your chest when you do physical activity?",
  "In the past month, have you had chest pain when you were NOT doing physical activity?",
  "Do you lose your balance because of dizziness or do you ever lose consciousness?",
  "Do you have a bone or joint problem that could be made worse by a change in your physical activity?",
  "Is your doctor currently prescribing drugs for your blood pressure or heart condition?",
  "Do you know of any other reason why you should not do physical activity?",
];

const HOME_EQUIPMENT_OPTIONS = [
  {id:"band",label:"Resistance Bands"},
  {id:"dumbbell",label:"Dumbbells"},
  {id:"kettlebell",label:"Kettlebell"},
  {id:"pull_up_bar",label:"Pull-Up Bar"},
  {id:"foam_roller",label:"Foam Roller"},
  {id:"mat",label:"Exercise Mat"},
  {id:"bench",label:"Bench"},
  {id:"stability_ball",label:"Stability Ball"},
  {id:"none",label:"None — bodyweight only"},
];

const SPORTS = ["BJJ","Surfing","Muay Thai","Snowboarding","Hiking","Running","Swimming","None"];

// ═══════════════════════════════════════════════════════════════

export default function OnboardingFlow({ onComplete }) {
  const [screen, setScreen] = useState(0);
  const [parq, setParq] = useState(PARQ_QUESTIONS.map(() => null));
  const [parqWarning, setParqWarning] = useState(false);
  const [conditions, setConditions] = useState([]); // [{conditionId, severity}]
  const [condCatOpen, setCondCatOpen] = useState(null);
  const [compensations, setCompensations] = useState({}); // {comp_id: true/false}
  const [rom, setRom] = useState({ shoulders: "full", hips: "full", ankles: "full" });
  const [goals, setGoals] = useState({}); // {muscle: "size"|"strength"|"maintain"|"none"}
  const [prefs, setPrefs] = useState({ daysPerWeek: 3, sessionTime: 45, homeEquipment: [], favorites: [], sports: [] });
  const [search, setSearch] = useState("");

  const anyParqYes = parq.some(a => a === true);
  const detectedComps = Object.entries(compensations).filter(([, v]) => v).map(([k]) => compensationsDB.find(c => c.id === k)).filter(Boolean);

  // Determine fitness level from answers
  const fitnessLevel = useMemo(() => {
    const condCount = conditions.length;
    const compCount = detectedComps.length;
    const romLimited = Object.values(rom).filter(v => v !== "full").length;
    if (condCount >= 3 || compCount >= 4 || romLimited >= 2) return "beginner";
    if (condCount >= 1 || compCount >= 2) return "intermediate";
    return "advanced";
  }, [conditions, detectedComps, rom]);

  const startingPhase = fitnessLevel === "beginner" ? 1 : fitnessLevel === "intermediate" ? 1 : 2;

  // Compensatory muscle additions
  const compensatoryAdds = useMemo(() => {
    const adds = [];
    Object.entries(goals).forEach(([muscle, goal]) => {
      if ((goal === "size" || goal === "strength") && COMPENSATORY_LOGIC[muscle]) {
        const cl = COMPENSATORY_LOGIC[muscle];
        cl.add.forEach(a => {
          if (!adds.find(x => x.muscle === a && x.trigger === muscle)) {
            adds.push({ muscle: a, trigger: muscle, reason: cl.reason });
          }
        });
      }
    });
    return adds;
  }, [goals]);

  const handleComplete = () => {
    const data = {
      parq: { answers: parq, anyYes: anyParqYes, clearedWithCaution: parqWarning && anyParqYes },
      conditions,
      compensations: detectedComps.map(c => c.id),
      rom,
      goals,
      compensatoryAdditions: compensatoryAdds,
      fitnessLevel,
      startingPhase,
      preferences: prefs,
    };
    saveAssessment(data);
    onComplete(data);
  };

  const totalScreens = 7;
  const next = () => setScreen(s => Math.min(s + 1, totalScreens - 1));
  const prev = () => setScreen(s => Math.max(s - 1, 0));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Progress */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: 2 }}>ASSESSMENT {screen + 1}/{totalScreens}</div>
        {screen > 0 && <button onClick={prev} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 12, cursor: "pointer" }}>← Back</button>}
      </div>
      <ProgressBar value={screen + 1} max={totalScreens} color={C.teal} height={4} />

      {/* ── SCREEN 0: PAR-Q+ ──────────────────────────────── */}
      {screen === 0 && <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div><div style={{ fontSize: 24, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 3 }}>WELCOME TO APEX</div><div style={{ fontSize: 12, color: C.textMuted }}>Let's build your profile. First: a quick health screen.</div></div>
        <Card><div style={{ fontSize: 11, fontWeight: 700, color: C.info, letterSpacing: 2, marginBottom: 10 }}>PAR-Q+ HEALTH SCREENING</div>
          {PARQ_QUESTIONS.map((q, i) => (
            <div key={i} style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 12, color: C.text, marginBottom: 8 }}>{q}</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[true, false].map(v => (
                  <button key={String(v)} onClick={() => setParq(p => { const n = [...p]; n[i] = v; return n; })}
                    style={{ padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                      background: parq[i] === v ? (v ? C.danger + "20" : C.success + "20") : "transparent",
                      border: `1px solid ${parq[i] === v ? (v ? C.danger : C.success) : C.border}`,
                      color: parq[i] === v ? (v ? C.danger : C.success) : C.textDim }}>
                    {v ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </Card>
        {anyParqYes && <Card style={{ borderColor: C.danger + "40", background: C.danger + "08" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.danger, marginBottom: 6 }}>⚠️ Medical Clearance Recommended</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 10 }}>You answered YES to one or more PAR-Q+ questions. We recommend getting medical clearance before starting an exercise program.</div>
          <button onClick={() => setParqWarning(true)} style={{ background: "none", border: "none", color: C.warning, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {parqWarning ? "✅ Continuing with caution" : "I understand — continue with caution →"}
          </button>
        </Card>}
        <Btn onClick={next} disabled={parq.some(a => a === null) || (anyParqYes && !parqWarning)}>Next — Conditions →</Btn>
      </div>}

      {/* ── SCREEN 1: CONDITIONS ───────────────────────────── */}
      {screen === 1 && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>CONDITIONS & INJURIES</div><div style={{ fontSize: 11, color: C.textMuted }}>Select any active conditions. Tap a category to expand.</div></div>
        {CONDITION_CATEGORIES.map(cat => {
          const catConds = conditionsDB.filter(c => c.category === cat.id);
          const isOpen = condCatOpen === cat.id;
          const selectedInCat = conditions.filter(c => catConds.find(x => x.id === c.conditionId));
          return (
            <Card key={cat.id} style={{ padding: 0, overflow: "hidden" }}>
              <div onClick={() => setCondCatOpen(isOpen ? null : cat.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 16 }}>{cat.icon}</span><span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{cat.label}</span>
                  {selectedInCat.length > 0 && <Badge color={C.warning}>{selectedInCat.length}</Badge>}</div>
                <span style={{ color: C.textDim, fontSize: 11, transform: isOpen ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.2s" }}>▸</span>
              </div>
              {isOpen && <div style={{ padding: "0 16px 14px" }}>
                {catConds.map(cond => {
                  const sel = conditions.find(c => c.conditionId === cond.id);
                  return (
                    <div key={cond.id} style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <button onClick={() => {
                          if (sel) setConditions(p => p.filter(c => c.conditionId !== cond.id));
                          else setConditions(p => [...p, { conditionId: cond.id, name: cond.name, severity: 2 }]);
                        }} style={{ background: "none", border: "none", fontSize: 12, color: sel ? C.teal : C.textMuted, cursor: "pointer", textAlign: "left" }}>
                          {sel ? "✅ " : "○ "}{cond.name}
                        </button>
                      </div>
                      {sel && <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, paddingLeft: 20 }}>
                        <span style={{ fontSize: 10, color: C.textDim }}>Severity:</span>
                        {[1, 2, 3, 4, 5].map(s => (
                          <button key={s} onClick={() => setConditions(p => p.map(c => c.conditionId === cond.id ? { ...c, severity: s } : c))}
                            style={{ width: 26, height: 26, borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer",
                              background: sel.severity === s ? (s <= 2 ? C.success : s <= 3 ? C.warning : C.danger) + "20" : "transparent",
                              border: `1px solid ${sel.severity === s ? (s <= 2 ? C.success : s <= 3 ? C.warning : C.danger) : C.border}`,
                              color: sel.severity === s ? C.text : C.textDim }}>{s}</button>
                        ))}
                      </div>}
                    </div>
                  );
                })}
              </div>}
            </Card>
          );
        })}
        {conditions.length > 0 && <div style={{ fontSize: 11, color: C.teal }}>{conditions.length} condition{conditions.length !== 1 ? "s" : ""} selected</div>}
        <Btn onClick={next}>Next — Movement Screen →</Btn>
      </div>}

      {/* ── SCREEN 2: MOVEMENT SCREEN ──────────────────────── */}
      {screen === 2 && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>MOVEMENT SCREEN</div><div style={{ fontSize: 11, color: C.textMuted }}>Overhead squat assessment — answer honestly.</div></div>
        {COMPENSATIONS.map(comp => (
          <Card key={comp.id} onClick={() => setCompensations(p => ({ ...p, [comp.id]: !p[comp.id] }))}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, cursor: "pointer",
              borderColor: compensations[comp.id] ? C.warning + "60" : C.border,
              background: compensations[comp.id] ? C.warning + "08" : C.bgCard }}>
            <span style={{ fontSize: 24 }}>{comp.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{comp.q}</div>
              {compensations[comp.id] && (() => {
                const full = compensationsDB.find(c => c.id === comp.id);
                return full ? <div style={{ fontSize: 10, color: C.warning, marginTop: 4 }}>Detected: {full.name}. Overactive: {full.overactive.slice(0, 3).join(", ")}</div> : null;
              })()}
            </div>
            <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${compensations[comp.id] ? C.warning : C.border}`, background: compensations[comp.id] ? C.warning : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {compensations[comp.id] && <span style={{ color: "#000", fontSize: 12, fontWeight: 800 }}>✓</span>}
            </div>
          </Card>
        ))}
        <Btn onClick={next}>Next — ROM Assessment →</Btn>
      </div>}

      {/* ── SCREEN 3: ROM SELF-ASSESSMENT ───────────────────── */}
      {screen === 3 && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>RANGE OF MOTION</div><div style={{ fontSize: 11, color: C.textMuted }}>Rate your mobility for each joint.</div></div>
        {[{ id: "shoulders", label: "Shoulders", desc: "Can you reach both arms fully overhead?", icon: "🤸" },
          { id: "hips", label: "Hips", desc: "Can you sit in a deep squat comfortably?", icon: "🧘" },
          { id: "ankles", label: "Ankles", desc: "Can you touch your knee to the wall 4 inches from your foot?", icon: "🦶" }
        ].map(joint => (
          <Card key={joint.id}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}><span style={{ fontSize: 20 }}>{joint.icon}</span><div><div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{joint.label}</div><div style={{ fontSize: 10, color: C.textMuted }}>{joint.desc}</div></div></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[{ v: "full", l: "Full ROM", c: C.success }, { v: "limited", l: "Limited", c: C.warning }, { v: "painful", l: "Painful", c: C.danger }].map(opt => (
                <button key={opt.v} onClick={() => setRom(p => ({ ...p, [joint.id]: opt.v }))}
                  style={{ padding: "10px 6px", borderRadius: 10, fontSize: 11, fontWeight: 600, textAlign: "center", cursor: "pointer",
                    background: rom[joint.id] === opt.v ? opt.c + "15" : "transparent",
                    border: `1px solid ${rom[joint.id] === opt.v ? opt.c : C.border}`,
                    color: rom[joint.id] === opt.v ? opt.c : C.textDim }}>{opt.l}</button>
              ))}
            </div>
          </Card>
        ))}
        <Btn onClick={next}>Next — Goals →</Btn>
      </div>}

      {/* ── SCREEN 4: GOALS ────────────────────────────────── */}
      {screen === 4 && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>YOUR GOALS</div><div style={{ fontSize: 11, color: C.textMuted }}>What do you want for each muscle group?</div></div>
        {MUSCLE_GROUPS.map(mg => (
          <Card key={mg.id}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><span style={{ fontSize: 16 }}>{mg.icon}</span><span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{mg.label}</span></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
              {[{ v: "size", l: "Size", c: C.purple }, { v: "strength", l: "Strength", c: C.teal }, { v: "maintain", l: "Maintain", c: C.info }, { v: "none", l: "No pref", c: C.textDim }].map(opt => (
                <button key={opt.v} onClick={() => setGoals(p => ({ ...p, [mg.id]: opt.v }))}
                  style={{ padding: "8px 4px", borderRadius: 8, fontSize: 10, fontWeight: 600, textAlign: "center", cursor: "pointer",
                    background: goals[mg.id] === opt.v ? opt.c + "15" : "transparent",
                    border: `1px solid ${goals[mg.id] === opt.v ? opt.c + "60" : C.border}`,
                    color: goals[mg.id] === opt.v ? opt.c : C.textDim }}>{opt.l}</button>
              ))}
            </div>
          </Card>
        ))}
        {compensatoryAdds.length > 0 && <Card style={{ borderColor: C.info + "30", background: C.info + "08" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.info, letterSpacing: 1.5, marginBottom: 8 }}>AUTO-ADDED COMPENSATORY WORK</div>
          {compensatoryAdds.map((a, i) => (
            <div key={i} style={{ fontSize: 11, color: C.text, padding: "4px 0", borderBottom: `1px solid ${C.border}` }}>
              <b style={{ color: C.teal }}>{a.muscle}</b> added because you selected <b>{a.trigger}</b> → {a.reason}
            </div>
          ))}
        </Card>}
        <Btn onClick={next}>Next — Preferences →</Btn>
      </div>}

      {/* ── SCREEN 5: TRAINING PREFERENCES ──────────────────── */}
      {screen === 5 && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>TRAINING PREFERENCES</div></div>
        {/* Days per week */}
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 8 }}>Days per week available</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[2, 3, 4, 5, 6].map(d => (
              <button key={d} onClick={() => setPrefs(p => ({ ...p, daysPerWeek: d }))}
                style={{ flex: 1, padding: "10px 4px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer",
                  background: prefs.daysPerWeek === d ? C.tealBg : "transparent",
                  border: `1px solid ${prefs.daysPerWeek === d ? C.teal : C.border}`,
                  color: prefs.daysPerWeek === d ? C.teal : C.textDim }}>{d}</button>
            ))}
          </div>
        </Card>
        {/* Session time */}
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 8 }}>Session duration (minutes)</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[30, 45, 60, 90].map(t => (
              <button key={t} onClick={() => setPrefs(p => ({ ...p, sessionTime: t }))}
                style={{ flex: 1, padding: "10px 4px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  background: prefs.sessionTime === t ? C.tealBg : "transparent",
                  border: `1px solid ${prefs.sessionTime === t ? C.teal : C.border}`,
                  color: prefs.sessionTime === t ? C.teal : C.textDim }}>{t}</button>
            ))}
          </div>
        </Card>
        {/* Home equipment */}
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 8 }}>Equipment at home</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {HOME_EQUIPMENT_OPTIONS.map(eq => {
              const sel = prefs.homeEquipment.includes(eq.id);
              return (
                <button key={eq.id} onClick={() => setPrefs(p => {
                  if (eq.id === "none") return { ...p, homeEquipment: sel ? [] : ["none"] };
                  return { ...p, homeEquipment: sel ? p.homeEquipment.filter(x => x !== eq.id) : [...p.homeEquipment.filter(x => x !== "none"), eq.id] };
                })} style={{ padding: "8px 10px", borderRadius: 8, fontSize: 11, textAlign: "left", cursor: "pointer",
                  background: sel ? C.tealBg : "transparent", border: `1px solid ${sel ? C.teal + "60" : C.border}`, color: sel ? C.teal : C.textDim }}>
                  {sel ? "✅ " : "○ "}{eq.label}
                </button>
              );
            })}
          </div>
        </Card>
        {/* Sports */}
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 8 }}>Sport interests</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {SPORTS.map(s => {
              const sel = prefs.sports.includes(s);
              return (
                <button key={s} onClick={() => setPrefs(p => ({ ...p, sports: sel ? p.sports.filter(x => x !== s) : [...p.sports, s] }))}
                  style={{ padding: "6px 12px", borderRadius: 16, fontSize: 11, fontWeight: 600, cursor: "pointer",
                    background: sel ? C.purple + "15" : "transparent",
                    border: `1px solid ${sel ? C.purple + "60" : C.border}`,
                    color: sel ? C.purple : C.textDim }}>{sel ? "✓ " : ""}{s}</button>
              );
            })}
          </div>
        </Card>
        {/* Favorite exercises (searchable) */}
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 8 }}>Favorite exercises (optional)</div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search exercises..."
            style={{ width: "100%", padding: "8px 12px", borderRadius: 10, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text, fontSize: 12, fontFamily: "inherit", outline: "none", marginBottom: 8, boxSizing: "border-box" }} />
          {search.trim().length >= 2 && <div style={{ maxHeight: 160, overflowY: "auto" }}>
            {exerciseDB.filter(e => e.name.toLowerCase().includes(search.toLowerCase())).slice(0, 8).map(e => {
              const fav = prefs.favorites.includes(e.id);
              return (
                <div key={e.id} onClick={() => setPrefs(p => ({ ...p, favorites: fav ? p.favorites.filter(x => x !== e.id) : [...p.favorites, e.id] }))}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", cursor: "pointer", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 14 }}>{e.emoji}</span>
                  <span style={{ fontSize: 11, color: fav ? C.teal : C.text, flex: 1 }}>{e.name}</span>
                  {fav && <span style={{ fontSize: 10, color: C.teal }}>⭐</span>}
                </div>
              );
            })}
          </div>}
          {prefs.favorites.length > 0 && <div style={{ fontSize: 10, color: C.teal, marginTop: 4 }}>{prefs.favorites.length} favorited</div>}
        </Card>
        <Btn onClick={next}>Next — Summary →</Btn>
      </div>}

      {/* ── SCREEN 6: SUMMARY ──────────────────────────────── */}
      {screen === 6 && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><div style={{ fontSize: 24, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 3 }}>YOUR ASSESSMENT</div><div style={{ fontSize: 11, color: C.textMuted }}>Here's what we found. Your first plan is ready.</div></div>

        {/* Fitness level */}
        <Card glow={C.tealGlow} style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: 2, marginBottom: 6 }}>DETECTED FITNESS LEVEL</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif" }}>{fitnessLevel.toUpperCase()}</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>Starting Phase {startingPhase} — {startingPhase === 1 ? "Stabilization Endurance" : "Strength"}</div>
        </Card>

        {/* PAR-Q */}
        {anyParqYes && <Card style={{ borderColor: C.warning + "40" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.warning }}>⚠️ PAR-Q+ FLAGS</div>
          <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>You flagged {parq.filter(a => a).length} health concern{parq.filter(a => a).length > 1 ? "s" : ""}. Proceeding with caution — lower intensity, more monitoring.</div>
        </Card>}

        {/* Conditions */}
        {conditions.length > 0 && <Card>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.danger, letterSpacing: 1.5, marginBottom: 6 }}>ACTIVE CONDITIONS ({conditions.length})</div>
          {conditions.map(c => (
            <div key={c.conditionId} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 11, color: C.text }}>{c.name}</span>
              <Badge color={c.severity <= 2 ? C.success : c.severity <= 3 ? C.warning : C.danger}>Sev {c.severity}</Badge>
            </div>
          ))}
          <div style={{ fontSize: 9, color: C.textMuted, marginTop: 6 }}>Each condition shapes exercise selection, contraindications, and mandatory protocols.</div>
        </Card>}

        {/* Compensations */}
        {detectedComps.length > 0 && <Card>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.warning, letterSpacing: 1.5, marginBottom: 6 }}>COMPENSATIONS DETECTED ({detectedComps.length})</div>
          {detectedComps.map(c => (
            <div key={c.id} style={{ padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{c.name}</div>
              <div style={{ fontSize: 9, color: C.textMuted }}>Correction: foam roll {(c.protocol?.inhibit?.exercises || []).length} areas → stretch {(c.protocol?.lengthen?.exercises || []).length} → activate {(c.protocol?.activate?.exercises || []).length} → integrate {(c.protocol?.integrate?.exercises || []).length}</div>
            </div>
          ))}
        </Card>}

        {/* ROM */}
        <Card>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.info, letterSpacing: 1.5, marginBottom: 6 }}>ROM ASSESSMENT</div>
          {Object.entries(rom).map(([joint, status]) => (
            <div key={joint} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
              <span style={{ fontSize: 11, color: C.text }}>{joint.charAt(0).toUpperCase() + joint.slice(1)}</span>
              <Badge color={status === "full" ? C.success : status === "limited" ? C.warning : C.danger}>{status}</Badge>
            </div>
          ))}
        </Card>

        {/* Goals + compensatory */}
        <Card>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.purple, letterSpacing: 1.5, marginBottom: 6 }}>GOALS</div>
          {Object.entries(goals).filter(([, v]) => v && v !== "none").map(([m, g]) => (
            <div key={m} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
              <span style={{ fontSize: 11, color: C.text }}>{m.charAt(0).toUpperCase() + m.slice(1)}</span>
              <Badge color={g === "size" ? C.purple : g === "strength" ? C.teal : C.info}>{g}</Badge>
            </div>
          ))}
          {compensatoryAdds.length > 0 && <div style={{ marginTop: 8, padding: 8, background: C.info + "08", borderRadius: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.info, marginBottom: 4 }}>COMPENSATORY ADDITIONS</div>
            {compensatoryAdds.map((a, i) => <div key={i} style={{ fontSize: 9, color: C.textMuted }}>{a.muscle} ← {a.reason}</div>)}
          </div>}
        </Card>

        {/* Preferences summary */}
        <Card>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.teal, letterSpacing: 1.5, marginBottom: 6 }}>TRAINING PLAN</div>
          <div style={{ fontSize: 11, color: C.text }}>{prefs.daysPerWeek} days/week · {prefs.sessionTime} min sessions</div>
          {prefs.homeEquipment.length > 0 && <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>Home equipment: {prefs.homeEquipment.join(", ")}</div>}
          {prefs.sports.length > 0 && <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>Sports: {prefs.sports.join(", ")}</div>}
          {prefs.favorites.length > 0 && <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{prefs.favorites.length} favorite exercises prioritized</div>}
        </Card>

        {/* First week preview */}
        <Card style={{ borderColor: C.teal + "30" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.teal, letterSpacing: 1.5, marginBottom: 6 }}>WEEK 1 PREVIEW</div>
          <div style={{ fontSize: 11, color: C.textMuted }}>
            Phase {startingPhase} · {prefs.daysPerWeek} sessions · 1-2 sets per exercise (neural adaptation)
          </div>
          <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>
            Focus: Movement quality, core activation, injury-safe patterns.
            {detectedComps.length > 0 && ` Corrective warm-ups for ${detectedComps.length} compensation(s).`}
            {conditions.length > 0 && ` Modified for ${conditions.length} condition(s).`}
          </div>
          <div style={{ fontSize: 10, color: C.textDim, marginTop: 6, fontStyle: "italic" }}>Your plan adapts every session based on check-in data.</div>
        </Card>

        <Btn onClick={handleComplete} icon="🚀" style={{ fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 3, fontSize: 18 }}>BUILD MY FIRST PLAN</Btn>
      </div>}

      <div style={{ height: 40 }} />
    </div>
  );
}
