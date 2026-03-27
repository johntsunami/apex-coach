import { useState, useMemo } from "react";
import conditionsDB from "../data/conditions.json";
import compensationsDB from "../data/compensations.json";
import exerciseDB from "../data/exercises.json";

// ═══════════════════════════════════════════════════════════════
// APEX Coach — Onboarding Assessment (14 screens)
// PAR-Q+ → Conditions → Pain Behavior → Directional Pref →
// Pain Timeline → Functional Limitations → Treatment History →
// Medications → Red Flags → Movement Screen → ROM → Goals →
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
  {id:"spinal",label:"Spine & Back",icon:"🔙",locations:["Upper Back","Mid Back","Lower Back","Tailbone","Left Side","Right Side"]},
  {id:"joint",label:"Joints (Knee, Shoulder, Hip, etc.)",icon:"🦴",locations:["Left Knee","Right Knee","Left Shoulder","Right Shoulder","Left Hip","Right Hip","Left Ankle","Right Ankle","Left Elbow","Right Elbow","Left Wrist","Right Wrist"]},
  {id:"systemic",label:"Autoimmune & Systemic",icon:"🧬"},
  {id:"neurological",label:"Neurological",icon:"🧠"},
  {id:"cardiopulmonary",label:"Heart & Lungs",icon:"🫀"},
  {id:"metabolic",label:"Metabolic & Endocrine",icon:"⚗️"},
  {id:"mental_health",label:"Mental Health",icon:"💆"},
  {id:"pregnancy",label:"Pregnancy & Postpartum",icon:"🤰"},
  {id:"age_related",label:"Age-Related",icon:"👴"},
  {id:"amputation",label:"Amputation / Limb Difference",icon:"🦿"},
];

const CONDITION_TYPES = ["Chronic Pain","Acute Injury","Post-Surgical","Managing"];

const MENTAL_HEALTH_CONDITIONS = [
  "Depression","Generalized Anxiety","Social Anxiety","Panic Disorder","PTSD","ADHD","OCD",
  "Bipolar Disorder","Insomnia","Chronic Stress","Burnout","Grief","Eating Disorder (in recovery)",
  "Substance Recovery","Seasonal Affective Disorder","Agoraphobia","Body Dysmorphia",
  "Anger Management","Chronic Fatigue","Autism Spectrum",
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

const GOAL_OPTIONS = [
  {v:"size",l:"Size",c:"#a855f7"},{v:"strength",l:"Strength",c:"#00d2c8"},{v:"endurance",l:"Endurance",c:"#3b82f6"},
  {v:"injury_prevention",l:"Injury Prev",c:"#eab308"},{v:"maintain",l:"Maintain",c:"#7a8ba8"},
];

const COMPENSATORY_LOGIC = {
  chest: { triggers:["size","strength"], add: ["shoulders","back"], reason: "Chest growth requires rear delt + rotator cuff work to prevent shoulder impingement" },
  back: { triggers:["size","strength"], add: ["core"], reason: "Back strength requires core stability to protect the spine under load" },
  shoulders: { triggers:["size","strength"], add: ["back"], reason: "Shoulder development requires upper back balance (2:1 pull-to-push ratio)" },
  legs: { triggers:["size","strength","endurance"], add: ["glutes","core"], reason: "Leg work requires glute activation and core stability for safe movement" },
  glutes: { triggers:["size","strength"], add: ["core","legs"], reason: "Glute development requires hip stabilizer and hamstring balance" },
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

const SPORTS = ["BJJ","Surfing","Muay Thai","Snowboarding","Hiking","Running","Swimming","Cycling","Rock Climbing","Yoga","CrossFit","None"];

// 40 most common exercises — mapped to closest DB IDs
const FAVORITE_GRID = [
  {name:"Bench Press",emoji:"🏋️",dbId:"str_db_bench_press"},{name:"Squat",emoji:"🏋️",dbId:"str_bw_squat"},
  {name:"Deadlift",emoji:"🏋️",dbId:"str_trap_bar_dl_high"},{name:"Pull-Ups",emoji:"🤸",dbId:"outdoor_playground_pullup"},
  {name:"Push-Ups",emoji:"💪",dbId:"str_floor_push_up"},{name:"Lunges",emoji:"🦿",dbId:"dyn_walking_lunges"},
  {name:"Shoulder Press",emoji:"🏋️",dbId:"seated_shoulder_press"},{name:"Bicep Curls",emoji:"💪",dbId:"iso_bicep_curl"},
  {name:"Tricep Dips",emoji:"🪑",dbId:"seated_chair_dips"},{name:"Lat Pulldown",emoji:"🔽",dbId:"band_lat_pulldown"},
  {name:"Rows",emoji:"🚣",dbId:"str_chest_supported_row"},{name:"Plank",emoji:"🧱",dbId:"stab_plank"},
  {name:"Leg Press",emoji:"🦵",dbId:"rehab_sl_leg_press"},{name:"Calf Raises",emoji:"🦶",dbId:"iso_calf_raise"},
  {name:"Face Pulls",emoji:"🎯",dbId:"iso_face_pulls"},{name:"Romanian Deadlift",emoji:"🔽",dbId:"str_db_rdl"},
  {name:"Bulgarian Split Squat",emoji:"🦿",dbId:"str_bss_bw"},{name:"Goblet Squat",emoji:"🏆",dbId:"str_goblet_squat"},
  {name:"Hip Thrust",emoji:"🍑",dbId:"band_hip_thrust"},{name:"Glute Bridge",emoji:"🍑",dbId:"str_glute_bridge"},
  {name:"Farmer Carry",emoji:"🧑‍🌾",dbId:"func_farmer_carry_bilateral"},{name:"KB Swing",emoji:"🔔",dbId:"kb_swing"},
  {name:"Box Jump",emoji:"📦",dbId:"sport_box_jump"},{name:"Battle Ropes",emoji:"🪢",dbId:"sport_battle_ropes"},
  {name:"Med Ball Slam",emoji:"⚡",dbId:"sport_med_ball_slam"},{name:"Turkish Get-Up",emoji:"🏋️",dbId:"kb_turkish_getup"},
  {name:"Ab Wheel",emoji:"🎡",dbId:"core_ab_wheel"},{name:"Cable Fly",emoji:"🦅",dbId:"band_chest_press"},
  {name:"Lateral Raise",emoji:"🤷",dbId:"iso_lateral_raise"},{name:"Front Raise",emoji:"💪",dbId:"iso_lateral_raise"},
  {name:"Hammer Curl",emoji:"💪",dbId:"iso_bicep_curl"},{name:"Skull Crusher",emoji:"💀",dbId:"iso_tricep_pushdown"},
  {name:"Leg Curl",emoji:"🦵",dbId:"band_hamstring_curl"},{name:"Leg Extension",emoji:"🦵",dbId:"seated_leg_ext"},
  {name:"Step-Ups",emoji:"⬆️",dbId:"outdoor_bench_stepup"},{name:"Walking Lunges",emoji:"🚶",dbId:"dyn_walking_lunges"},
  {name:"Incline Bench",emoji:"📐",dbId:"str_incline_push_up"},{name:"Dips",emoji:"🪑",dbId:"seated_chair_dips"},
  {name:"Chin-Ups",emoji:"🤸",dbId:"outdoor_playground_pullup"},{name:"Barbell Row",emoji:"🚣",dbId:"str_inverted_row"},
];

// ═══════════════════════════════════════════════════════════════

export default function OnboardingFlow({ onComplete }) {
  const [screen, setScreen] = useState(0);
  const [parq, setParq] = useState(PARQ_QUESTIONS.map(() => null));
  const [parqWarning, setParqWarning] = useState(false);
  const [conditions, setConditions] = useState([]); // [{conditionId, severity}]
  const [condCatOpen, setCondCatOpen] = useState(null);
  const [compensations, setCompensations] = useState({}); // {comp_id: true/false}
  const [rom, setRom] = useState({ neck:"full", thoracic:"full", lumbar:"full", shoulders:"full", elbows:"full", wrists:"full", hips:"full", knee_left:"full", knee_right:"full", ankles:"full", feet:"full" });
  const [goals, setGoals] = useState({}); // {muscle: ["size","injury_prevention",...]}
  const [prefs, setPrefs] = useState({ daysPerWeek: 3, sessionTime: 45, homeEquipment: [], favorites: [], sports: [], customSport: "" });
  const [search, setSearch] = useState("");

  // ── New clinical assessment state ──────────────────────────
  const [painBehaviors, setPainBehaviors] = useState({}); // {conditionId: {painType, worstTime, triggers[], relievers[], trend}}
  const [directionalPrefs, setDirectionalPrefs] = useState({}); // {conditionId: {extension, flexion, centralization}}
  const [painTimelines, setPainTimelines] = useState({}); // {conditionId: {onset, injuryType, surgery, surgeryTimeAgo}}
  const [funcLimitations, setFuncLimitations] = useState({});
  const [treatmentHistory, setTreatmentHistory] = useState({ seenPT: null, whatHelped: "", whatWorse: "", currentPT: null, doctorCleared: null });
  const [medications, setMedications] = useState([]);
  const [redFlags, setRedFlags] = useState([]);
  const [redFlagCleared, setRedFlagCleared] = useState(false);

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

  // Compensatory muscle additions (multi-select aware)
  const compensatoryAdds = useMemo(() => {
    const adds = [];
    Object.entries(goals).forEach(([muscle, goalArr]) => {
      const ga = Array.isArray(goalArr) ? goalArr : [goalArr];
      if (COMPENSATORY_LOGIC[muscle] && ga.some(g => (COMPENSATORY_LOGIC[muscle].triggers||[]).includes(g))) {
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
      painBehaviors,
      directionalPreferences: directionalPrefs,
      painTimelines,
      functionalLimitations: funcLimitations,
      treatmentHistory,
      medications,
      redFlags,
      redFlagCleared,
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

  const hasConditions = conditions.length > 0;
  const hasSpinalConditions = conditions.some(c => c.category === "spinal");
  const hasRedFlags = redFlags.length > 0;

  // Screens: 0=PAR-Q, 1=Conditions, 2=PainBehavior, 3=DirectionalPref, 4=PainTimeline,
  // 5=FunctionalLimitations, 6=PreviousTreatment, 7=Medications, 8=RedFlags,
  // 9=Movement, 10=ROM, 11=Goals, 12=Preferences, 13=Summary
  const totalScreens = 14;
  const shouldSkip = (s) => {
    if (s === 2 && !hasConditions) return true; // Pain behavior — only if conditions
    if (s === 3 && !hasSpinalConditions) return true; // Directional pref — only spinal
    if (s === 4 && !hasConditions) return true; // Pain timeline — only if conditions
    return false;
  };
  const next = () => setScreen(s => { let n = s + 1; while (n < totalScreens && shouldSkip(n)) n++; return Math.min(n, totalScreens - 1); });
  const prev = () => setScreen(s => { let n = s - 1; while (n > 0 && shouldSkip(n)) n--; return Math.max(n, 0); });

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
        <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>CONDITIONS & INJURIES</div><div style={{ fontSize: 11, color: C.textMuted }}>Select any active conditions. Specify location and type.</div></div>
        {CONDITION_CATEGORIES.map(cat => {
          const catConds = cat.id === "mental_health"
            ? [...conditionsDB.filter(c => c.category === cat.id), ...MENTAL_HEALTH_CONDITIONS.map(mh => ({ id: "mh_" + mh.toLowerCase().replace(/[^a-z]/g, "_"), name: mh, category: "mental_health" }))]
            : conditionsDB.filter(c => c.category === cat.id);
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
                {/* Chronic Pain quick-select for physical categories */}
                {cat.locations && <div style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}`, marginBottom: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.orange, marginBottom: 6 }}>QUICK: General chronic pain in this area?</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {cat.locations.map(loc => {
                      const qid = "chronic_" + cat.id + "_" + loc.toLowerCase().replace(/\s/g, "_");
                      const qsel = conditions.find(c => c.conditionId === qid);
                      return <button key={loc} onClick={() => {
                        if (qsel) setConditions(p => p.filter(c => c.conditionId !== qid));
                        else setConditions(p => [...p, { conditionId: qid, name: "Chronic Pain — " + loc, severity: 2, bodyArea: loc, condType: "Chronic Pain", category: cat.id }]);
                      }} style={{ padding: "4px 8px", borderRadius: 6, fontSize: 9, cursor: "pointer", background: qsel ? C.orange + "20" : "transparent", border: `1px solid ${qsel ? C.orange : C.border}`, color: qsel ? C.orange : C.textDim }}>{qsel ? "✓ " : ""}{loc}</button>;
                    })}
                  </div>
                </div>}
                {catConds.map(cond => {
                  const sel = conditions.find(c => c.conditionId === cond.id);
                  return (
                    <div key={cond.id} style={{ padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                      <button onClick={() => {
                        if (sel) setConditions(p => p.filter(c => c.conditionId !== cond.id));
                        else setConditions(p => [...p, { conditionId: cond.id, name: cond.name, severity: 2, bodyArea: "", condType: "", category: cat.id }]);
                      }} style={{ background: "none", border: "none", fontSize: 12, color: sel ? C.teal : C.textMuted, cursor: "pointer", textAlign: "left" }}>
                        {sel ? "✅ " : "○ "}{cond.name}
                      </button>
                      {sel && <div style={{ paddingLeft: 20, marginTop: 4 }}>
                        {/* Location sub-select */}
                        {cat.locations && <div style={{ marginBottom: 6 }}>
                          <span style={{ fontSize: 9, color: C.textDim }}>Location: </span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 2 }}>
                            {cat.locations.map(loc => <button key={loc} onClick={() => setConditions(p => p.map(c => c.conditionId === cond.id ? { ...c, bodyArea: loc } : c))}
                              style={{ padding: "2px 6px", borderRadius: 4, fontSize: 8, cursor: "pointer", background: sel.bodyArea === loc ? C.tealBg : "transparent", border: `1px solid ${sel.bodyArea === loc ? C.teal : C.border}`, color: sel.bodyArea === loc ? C.teal : C.textDim }}>{loc}</button>)}
                          </div>
                        </div>}
                        {/* Condition type */}
                        <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                          {CONDITION_TYPES.map(ct => <button key={ct} onClick={() => setConditions(p => p.map(c => c.conditionId === cond.id ? { ...c, condType: ct } : c))}
                            style={{ padding: "3px 6px", borderRadius: 4, fontSize: 8, cursor: "pointer", background: sel.condType === ct ? C.info + "20" : "transparent", border: `1px solid ${sel.condType === ct ? C.info : C.border}`, color: sel.condType === ct ? C.info : C.textDim }}>{ct}</button>)}
                        </div>
                        {/* Severity */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 9, color: C.textDim }}>Severity:</span>
                          {[1, 2, 3, 4, 5].map(s => (
                            <button key={s} onClick={() => setConditions(p => p.map(c => c.conditionId === cond.id ? { ...c, severity: s } : c))}
                              style={{ width: 22, height: 22, borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: "pointer",
                                background: sel.severity === s ? (s <= 2 ? C.success : s <= 3 ? C.warning : C.danger) + "20" : "transparent",
                                border: `1px solid ${sel.severity === s ? (s <= 2 ? C.success : s <= 3 ? C.warning : C.danger) : C.border}`,
                                color: sel.severity === s ? C.text : C.textDim }}>{s}</button>
                          ))}
                        </div>
                      </div>}
                    </div>
                  );
                })}
              </div>}
            </Card>
          );
        })}
        {conditions.length > 0 && <div style={{ fontSize: 11, color: C.teal }}>{conditions.length} condition{conditions.length !== 1 ? "s" : ""} selected</div>}
        <Btn onClick={next}>{hasConditions ? "Next — Pain Assessment →" : "Next — Functional Screen →"}</Btn>
      </div>}

      {/* ── SCREEN 2: PAIN BEHAVIOR (per condition) ────────── */}
      {screen === 2 && hasConditions && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>PAIN BEHAVIOR</div><div style={{ fontSize: 11, color: C.textMuted }}>Tell us about your pain patterns for each condition.</div></div>
        {conditions.map(cond => {
          const pb = painBehaviors[cond.conditionId] || {};
          const update = (field, val) => setPainBehaviors(p => ({ ...p, [cond.conditionId]: { ...p[cond.conditionId], [field]: val } }));
          const toggleArr = (field, val) => {
            const cur = pb[field] || [];
            update(field, cur.includes(val) ? cur.filter(x => x !== val) : [...cur, val]);
          };
          return (
            <Card key={cond.conditionId}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.teal, marginBottom: 10 }}>{cond.name}{cond.bodyArea ? ` — ${cond.bodyArea}` : ""}</div>
              {/* Pain type */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textDim, marginBottom: 4 }}>PAIN TYPE</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {["Constant", "Intermittent", "Activity-only", "Rest-only"].map(t => (
                    <button key={t} onClick={() => update("painType", t)} style={{ padding: "5px 10px", borderRadius: 8, fontSize: 10, cursor: "pointer", background: pb.painType === t ? C.teal + "20" : "transparent", border: `1px solid ${pb.painType === t ? C.teal : C.border}`, color: pb.painType === t ? C.teal : C.textDim }}>{t}</button>
                  ))}
                </div>
              </div>
              {/* Worst time */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textDim, marginBottom: 4 }}>WORST TIME OF DAY</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {["Morning", "Midday", "Evening", "Night", "No pattern"].map(t => (
                    <button key={t} onClick={() => update("worstTime", t)} style={{ padding: "5px 10px", borderRadius: 8, fontSize: 10, cursor: "pointer", background: pb.worstTime === t ? C.warning + "20" : "transparent", border: `1px solid ${pb.worstTime === t ? C.warning : C.border}`, color: pb.worstTime === t ? C.warning : C.textDim }}>{t}</button>
                  ))}
                </div>
              </div>
              {/* Triggers */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textDim, marginBottom: 4 }}>PAIN TRIGGERS (select all)</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {["Sitting", "Standing", "Walking", "Lifting", "Bending", "Twisting", "Lying down"].map(t => {
                    const sel = (pb.triggers || []).includes(t);
                    return <button key={t} onClick={() => toggleArr("triggers", t)} style={{ padding: "5px 10px", borderRadius: 8, fontSize: 10, cursor: "pointer", background: sel ? C.danger + "20" : "transparent", border: `1px solid ${sel ? C.danger : C.border}`, color: sel ? C.danger : C.textDim }}>{sel ? "✓ " : ""}{t}</button>;
                  })}
                </div>
              </div>
              {/* Relievers */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textDim, marginBottom: 4 }}>WHAT HELPS (select all)</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {["Rest", "Movement", "Heat", "Ice", "Stretching", "Nothing helps"].map(t => {
                    const sel = (pb.relievers || []).includes(t);
                    return <button key={t} onClick={() => toggleArr("relievers", t)} style={{ padding: "5px 10px", borderRadius: 8, fontSize: 10, cursor: "pointer", background: sel ? C.success + "20" : "transparent", border: `1px solid ${sel ? C.success : C.border}`, color: sel ? C.success : C.textDim }}>{sel ? "✓ " : ""}{t}</button>;
                  })}
                </div>
              </div>
              {/* Trend */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textDim, marginBottom: 4 }}>TREND OVER LAST 2 WEEKS</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[{ v: "better", l: "Getting Better", c: C.success }, { v: "same", l: "Staying Same", c: C.warning }, { v: "worse", l: "Getting Worse", c: C.danger }].map(t => (
                    <button key={t.v} onClick={() => update("trend", t.v)} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 10, fontWeight: 600, textAlign: "center", cursor: "pointer", background: pb.trend === t.v ? t.c + "15" : "transparent", border: `1px solid ${pb.trend === t.v ? t.c : C.border}`, color: pb.trend === t.v ? t.c : C.textDim }}>{t.l}</button>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
        <Btn onClick={next}>{hasSpinalConditions ? "Next — Directional Preference →" : "Next — Pain Timeline →"}</Btn>
      </div>}

      {/* ── SCREEN 3: DIRECTIONAL PREFERENCE (spinal only) ── */}
      {screen === 3 && hasSpinalConditions && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>DIRECTIONAL PREFERENCE</div><div style={{ fontSize: 11, color: C.textMuted }}>Critical for spinal conditions — determines your PT protocol direction.</div></div>
        <Card style={{ borderColor: C.danger + "30", background: C.danger + "06" }}>
          <div style={{ fontSize: 11, color: C.danger, fontWeight: 700, marginBottom: 4 }}>⚠️ IMPORTANT</div>
          <div style={{ fontSize: 10, color: C.textMuted }}>Wrong direction exercises can worsen spinal pain. Answer honestly — this determines whether you get extension-based (McKenzie) or flexion-based (Williams) therapy.</div>
        </Card>
        {conditions.filter(c => c.category === "spinal").map(cond => {
          const dp = directionalPrefs[cond.conditionId] || {};
          const update = (field, val) => setDirectionalPrefs(p => ({ ...p, [cond.conditionId]: { ...p[cond.conditionId], [field]: val } }));
          return (
            <Card key={cond.conditionId}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.teal, marginBottom: 12 }}>{cond.name}{cond.bodyArea ? ` — ${cond.bodyArea}` : ""}</div>
              {/* Extension */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: C.text, marginBottom: 6 }}>Does <b>arching your back</b> (backward bending) make pain:</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[{ v: "better", l: "Better", c: C.success }, { v: "worse", l: "Worse", c: C.danger }, { v: "no_change", l: "No Change", c: C.textDim }].map(o => (
                    <button key={o.v} onClick={() => update("extension", o.v)} style={{ flex: 1, padding: "10px 4px", borderRadius: 10, fontSize: 11, fontWeight: 600, textAlign: "center", cursor: "pointer", background: dp.extension === o.v ? o.c + "15" : "transparent", border: `1px solid ${dp.extension === o.v ? o.c : C.border}`, color: dp.extension === o.v ? o.c : C.textDim }}>{o.l}</button>
                  ))}
                </div>
              </div>
              {/* Flexion */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: C.text, marginBottom: 6 }}>Does <b>bending forward</b> (touching toes) make pain:</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[{ v: "better", l: "Better", c: C.success }, { v: "worse", l: "Worse", c: C.danger }, { v: "no_change", l: "No Change", c: C.textDim }].map(o => (
                    <button key={o.v} onClick={() => update("flexion", o.v)} style={{ flex: 1, padding: "10px 4px", borderRadius: 10, fontSize: 11, fontWeight: 600, textAlign: "center", cursor: "pointer", background: dp.flexion === o.v ? o.c + "15" : "transparent", border: `1px solid ${dp.flexion === o.v ? o.c : C.border}`, color: dp.flexion === o.v ? o.c : C.textDim }}>{o.l}</button>
                  ))}
                </div>
              </div>
              {/* Centralization */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: C.text, marginBottom: 6 }}>Does pain <b>move toward your spine</b> with backward bending? (centralization)</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[{ v: true, l: "Yes — pain centralizes" }, { v: false, l: "No" }, { v: "unsure", l: "Not sure" }].map(o => (
                    <button key={String(o.v)} onClick={() => update("centralization", o.v)} style={{ flex: 1, padding: "10px 4px", borderRadius: 10, fontSize: 10, fontWeight: 600, textAlign: "center", cursor: "pointer", background: dp.centralization === o.v ? C.info + "15" : "transparent", border: `1px solid ${dp.centralization === o.v ? C.info : C.border}`, color: dp.centralization === o.v ? C.info : C.textDim }}>{o.l}</button>
                  ))}
                </div>
              </div>
              {/* Show determined protocol */}
              {dp.extension && dp.flexion && (() => {
                const proto = dp.extension === "better" ? "McKenzie Extension" : dp.flexion === "better" ? "Williams Flexion" : "Neutral Stabilization";
                const protoColor = dp.extension === "better" ? C.teal : dp.flexion === "better" ? C.purple : C.info;
                return <div style={{ marginTop: 8, padding: 10, background: protoColor + "10", borderRadius: 8, border: `1px solid ${protoColor}25` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: protoColor, letterSpacing: 1 }}>PROTOCOL DIRECTION: {proto.toUpperCase()}</div>
                  <div style={{ fontSize: 9, color: C.textMuted, marginTop: 4 }}>
                    {dp.extension === "better" ? "Extension helps — indicates disc-related issue. McKenzie press-ups and standing extensions will be your primary PT exercises." :
                     dp.flexion === "better" ? "Flexion helps — indicates stenosis/facet issue. Williams flexion exercises (knee-to-chest, pelvic tilts) will be your primary PT exercises." :
                     "Neither direction clearly helps. Neutral spine stabilization with McGill Big 3 (curl-up, side plank, bird dog) will be your protocol."}
                  </div>
                </div>;
              })()}
            </Card>
          );
        })}
        <Btn onClick={next}>Next — Pain Timeline →</Btn>
      </div>}

      {/* ── SCREEN 4: PAIN TIMELINE (per condition) ─────────── */}
      {screen === 4 && hasConditions && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>PAIN TIMELINE</div><div style={{ fontSize: 11, color: C.textMuted }}>When did each condition start? This determines PT session frequency.</div></div>
        {conditions.map(cond => {
          const pt = painTimelines[cond.conditionId] || {};
          const update = (field, val) => setPainTimelines(p => ({ ...p, [cond.conditionId]: { ...p[cond.conditionId], [field]: val } }));
          return (
            <Card key={cond.conditionId}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.teal, marginBottom: 10 }}>{cond.name}{cond.bodyArea ? ` — ${cond.bodyArea}` : ""}</div>
              {/* Onset */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textDim, marginBottom: 4 }}>WHEN DID THIS START?</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {[{ v: "acute", l: "Less than 6 weeks ago", c: C.danger, sub: "ACUTE — gentle, frequent sessions" },
                    { v: "subacute", l: "6-12 weeks ago", c: C.warning, sub: "SUBACUTE — moderate, 2-3x/day" },
                    { v: "chronic", l: "3+ months ago", c: C.info, sub: "CHRONIC — progressive, 1-2x/day" },
                    { v: "chronic_persistent", l: "1+ year ago", c: C.purple, sub: "CHRONIC PERSISTENT — integrated approach" },
                  ].map(o => (
                    <button key={o.v} onClick={() => update("onset", o.v)} style={{ padding: "10px 12px", borderRadius: 10, textAlign: "left", cursor: "pointer", background: pt.onset === o.v ? o.c + "12" : "transparent", border: `1px solid ${pt.onset === o.v ? o.c : C.border}` }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: pt.onset === o.v ? o.c : C.text }}>{o.l}</div>
                      <div style={{ fontSize: 9, color: C.textDim, marginTop: 2 }}>{o.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
              {/* Injury type */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textDim, marginBottom: 4 }}>HOW DID IT START?</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[{ v: "specific", l: "Specific Injury" }, { v: "gradual", l: "Gradual Onset" }].map(o => (
                    <button key={o.v} onClick={() => update("injuryType", o.v)} style={{ flex: 1, padding: "10px 4px", borderRadius: 10, fontSize: 11, fontWeight: 600, textAlign: "center", cursor: "pointer", background: pt.injuryType === o.v ? C.teal + "15" : "transparent", border: `1px solid ${pt.injuryType === o.v ? C.teal : C.border}`, color: pt.injuryType === o.v ? C.teal : C.textDim }}>{o.l}</button>
                  ))}
                </div>
              </div>
              {/* Surgery */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textDim, marginBottom: 4 }}>HAVE YOU HAD SURGERY FOR THIS?</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[{ v: true, l: "Yes" }, { v: false, l: "No" }].map(o => (
                    <button key={String(o.v)} onClick={() => update("surgery", o.v)} style={{ flex: 1, padding: "10px 4px", borderRadius: 10, fontSize: 11, fontWeight: 600, textAlign: "center", cursor: "pointer", background: pt.surgery === o.v ? C.info + "15" : "transparent", border: `1px solid ${pt.surgery === o.v ? C.info : C.border}`, color: pt.surgery === o.v ? C.info : C.textDim }}>{o.l}</button>
                  ))}
                </div>
              </div>
              {pt.surgery === true && <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textDim, marginBottom: 4 }}>HOW LONG AGO?</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {["<3 months", "3-6 months", "6-12 months", "1-2 years", "2+ years"].map(t => (
                    <button key={t} onClick={() => update("surgeryTimeAgo", t)} style={{ padding: "6px 10px", borderRadius: 8, fontSize: 10, cursor: "pointer", background: pt.surgeryTimeAgo === t ? C.warning + "20" : "transparent", border: `1px solid ${pt.surgeryTimeAgo === t ? C.warning : C.border}`, color: pt.surgeryTimeAgo === t ? C.warning : C.textDim }}>{t}</button>
                  ))}
                </div>
              </div>}
              {/* Frequency preview */}
              {pt.onset && <div style={{ marginTop: 8, padding: 8, background: C.tealBg, borderRadius: 8, border: `1px solid ${C.teal}20` }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.teal }}>PT SESSION FREQUENCY</div>
                <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                  {pt.onset === "acute" ? "3-6× per day · 5-10 min sessions · Gentle intensity" :
                   pt.onset === "subacute" ? "2-3× per day · 10-15 min sessions · Moderate intensity" :
                   "1-2× per day · 15-20 min sessions · Progressive intensity"}
                </div>
              </div>}
            </Card>
          );
        })}
        <Btn onClick={next}>Next — Functional Limitations →</Btn>
      </div>}

      {/* ── SCREEN 5: FUNCTIONAL LIMITATIONS ────────────────── */}
      {screen === 5 && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>FUNCTIONAL ABILITIES</div><div style={{ fontSize: 11, color: C.textMuted }}>Rate each activity. These become your measurable PT goals — reassessed every 4 weeks.</div></div>
        {[
          { id: "sit_30", label: "Sit for 30+ minutes", icon: "🪑" },
          { id: "stand_30", label: "Stand for 30+ minutes", icon: "🧍" },
          { id: "walk_15", label: "Walk for 15+ minutes", icon: "🚶" },
          { id: "climb_stairs", label: "Climb stairs", icon: "🪜" },
          { id: "lift_overhead", label: "Lift objects overhead", icon: "🏋️" },
          { id: "reach_behind", label: "Reach behind back", icon: "🔄" },
          { id: "get_up_floor", label: "Get up from floor", icon: "⬆️" },
          { id: "sleep_through", label: "Sleep through the night", icon: "😴" },
          { id: "drive_30", label: "Drive for 30+ minutes", icon: "🚗" },
          { id: "exercise_moderate", label: "Exercise at moderate intensity", icon: "💪" },
        ].map(item => (
          <Card key={item.id} style={{ padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.label}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              {[{ v: "easy", l: "Can Do Easily", c: C.success }, { v: "difficulty", l: "With Difficulty", c: C.warning }, { v: "cannot", l: "Cannot Do", c: C.danger }].map(opt => (
                <button key={opt.v} onClick={() => setFuncLimitations(p => ({ ...p, [item.id]: opt.v }))}
                  style={{ padding: "8px 4px", borderRadius: 8, fontSize: 10, fontWeight: 600, textAlign: "center", cursor: "pointer",
                    background: funcLimitations[item.id] === opt.v ? opt.c + "15" : "transparent",
                    border: `1px solid ${funcLimitations[item.id] === opt.v ? opt.c : C.border}`,
                    color: funcLimitations[item.id] === opt.v ? opt.c : C.textDim }}>{opt.l}</button>
              ))}
            </div>
          </Card>
        ))}
        {Object.values(funcLimitations).filter(v => v !== "easy").length > 0 && (
          <div style={{ fontSize: 10, color: C.info }}>
            {Object.values(funcLimitations).filter(v => v !== "easy").length} limitation{Object.values(funcLimitations).filter(v => v !== "easy").length !== 1 ? "s" : ""} identified — these become your PT goals.
          </div>
        )}
        <Btn onClick={next}>Next — Treatment History →</Btn>
      </div>}

      {/* ── SCREEN 6: PREVIOUS TREATMENT ────────────────────── */}
      {screen === 6 && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>TREATMENT HISTORY</div><div style={{ fontSize: 11, color: C.textMuted }}>Previous treatment helps us build on what worked.</div></div>
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 8 }}>Have you seen a physical therapist?</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[true, false].map(v => (
              <button key={String(v)} onClick={() => setTreatmentHistory(p => ({ ...p, seenPT: v }))}
                style={{ flex: 1, padding: "12px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  background: treatmentHistory.seenPT === v ? C.teal + "15" : "transparent",
                  border: `1px solid ${treatmentHistory.seenPT === v ? C.teal : C.border}`,
                  color: treatmentHistory.seenPT === v ? C.teal : C.textDim }}>{v ? "Yes" : "No"}</button>
            ))}
          </div>
        </Card>
        {treatmentHistory.seenPT && <>
          <Card>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 6 }}>What exercises or treatments helped?</div>
            <textarea value={treatmentHistory.whatHelped} onChange={e => setTreatmentHistory(p => ({ ...p, whatHelped: e.target.value }))} placeholder="e.g., McKenzie press-ups, swimming, heat therapy..."
              style={{ width: "100%", minHeight: 60, padding: "8px 10px", borderRadius: 8, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text, fontSize: 11, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </Card>
          <Card>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 6 }}>What made it worse?</div>
            <textarea value={treatmentHistory.whatWorse} onChange={e => setTreatmentHistory(p => ({ ...p, whatWorse: e.target.value }))} placeholder="e.g., deep squats, running, prolonged sitting..."
              style={{ width: "100%", minHeight: 60, padding: "8px 10px", borderRadius: 8, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text, fontSize: 11, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </Card>
        </>}
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 8 }}>Are you currently seeing a PT?</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[true, false].map(v => (
              <button key={String(v)} onClick={() => setTreatmentHistory(p => ({ ...p, currentPT: v }))}
                style={{ flex: 1, padding: "12px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  background: treatmentHistory.currentPT === v ? (v ? C.success : C.info) + "15" : "transparent",
                  border: `1px solid ${treatmentHistory.currentPT === v ? (v ? C.success : C.info) : C.border}`,
                  color: treatmentHistory.currentPT === v ? (v ? C.success : C.info) : C.textDim }}>{v ? "Yes" : "No"}</button>
            ))}
          </div>
          {treatmentHistory.currentPT && <div style={{ marginTop: 8, padding: 8, background: C.success + "08", borderRadius: 8 }}>
            <div style={{ fontSize: 10, color: C.success }}>Great — the app will complement your PT's plan, not replace it.</div>
          </div>}
        </Card>
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 8 }}>Has a doctor cleared you for exercise?</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[{ v: "yes", l: "Yes" }, { v: "no", l: "No" }, { v: "not_asked", l: "Haven't asked" }].map(o => (
              <button key={o.v} onClick={() => setTreatmentHistory(p => ({ ...p, doctorCleared: o.v }))}
                style={{ flex: 1, padding: "12px 4px", borderRadius: 10, fontSize: 12, fontWeight: 600, textAlign: "center", cursor: "pointer",
                  background: treatmentHistory.doctorCleared === o.v ? C.teal + "15" : "transparent",
                  border: `1px solid ${treatmentHistory.doctorCleared === o.v ? C.teal : C.border}`,
                  color: treatmentHistory.doctorCleared === o.v ? C.teal : C.textDim }}>{o.l}</button>
            ))}
          </div>
        </Card>
        <Btn onClick={next}>Next — Medications →</Btn>
      </div>}

      {/* ── SCREEN 7: MEDICATIONS ───────────────────────────── */}
      {screen === 7 && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>MEDICATIONS</div><div style={{ fontSize: 11, color: C.textMuted }}>Some medications affect how we prescribe exercise. Select all that apply.</div></div>
        {[
          { id: "bp_meds", label: "Blood pressure medication", icon: "🫀", note: "Affects heart rate response — we won't use HR for intensity" },
          { id: "blood_thinners", label: "Blood thinners", icon: "🩸", note: "Caution with foam rolling — bruising risk" },
          { id: "steroids", label: "Steroids / Prednisone", icon: "💊", note: "Bone density concern — we add weight-bearing exercises" },
          { id: "nsaids", label: "NSAIDs (ibuprofen, etc.)", icon: "💊", note: "Can mask pain signals — we track pain more carefully" },
          { id: "opioids", label: "Opioid pain medication", icon: "⚠️", note: "Impairs coordination — balance exercises need extra caution" },
          { id: "diabetes_meds", label: "Diabetes medication", icon: "🩺", note: "Blood sugar monitoring needed during exercise" },
          { id: "muscle_relaxants", label: "Muscle relaxants", icon: "💤", note: "Affects coordination — simplified exercise selection" },
          { id: "none", label: "None of these", icon: "✅", note: "" },
        ].map(med => {
          const sel = medications.includes(med.id);
          return (
            <Card key={med.id} onClick={() => {
              if (med.id === "none") { setMedications(sel ? [] : ["none"]); return; }
              setMedications(p => sel ? p.filter(x => x !== med.id) : [...p.filter(x => x !== "none"), med.id]);
            }} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, cursor: "pointer",
              borderColor: sel ? C.warning + "60" : C.border,
              background: sel ? C.warning + "06" : C.bgCard }}>
              <span style={{ fontSize: 20 }}>{med.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: sel ? C.text : C.textMuted }}>{med.label}</div>
                {sel && med.note && <div style={{ fontSize: 9, color: C.warning, marginTop: 2 }}>{med.note}</div>}
              </div>
              <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${sel ? C.warning : C.border}`, background: sel ? C.warning : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {sel && <span style={{ color: "#000", fontSize: 12, fontWeight: 800 }}>✓</span>}
              </div>
            </Card>
          );
        })}
        <Btn onClick={next}>Next — Safety Screening →</Btn>
      </div>}

      {/* ── SCREEN 8: RED FLAG SCREENING ────────────────────── */}
      {screen === 8 && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>SAFETY SCREENING</div><div style={{ fontSize: 11, color: C.textMuted }}>These symptoms require medical evaluation. Check any that apply.</div></div>
        <Card style={{ borderColor: C.danger + "20" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.danger, letterSpacing: 1.5, marginBottom: 10 }}>DO YOU HAVE ANY OF THESE?</div>
          {[
            { id: "weight_loss", label: "Unexplained weight loss (10+ lbs without trying)" },
            { id: "night_pain", label: "Pain that wakes you from sleep every night" },
            { id: "fever", label: "Fever or chills with your pain" },
            { id: "bowel_bladder", label: "Loss of bowel or bladder control" },
            { id: "progressive_numbness", label: "Progressive numbness or weakness in arms/legs" },
            { id: "position_independent", label: "Pain that doesn't change with any position or movement" },
            { id: "cancer_bone_pain", label: "History of cancer with new bone/back pain" },
          ].map(flag => {
            const sel = redFlags.includes(flag.id);
            return (
              <div key={flag.id} style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                <button onClick={() => setRedFlags(p => sel ? p.filter(x => x !== flag.id) : [...p, flag.id])}
                  style={{ background: "none", border: "none", fontSize: 12, color: sel ? C.danger : C.textMuted, cursor: "pointer", textAlign: "left", width: "100%", padding: 0 }}>
                  {sel ? "🔴 " : "○ "}{flag.label}
                </button>
              </div>
            );
          })}
        </Card>
        {hasRedFlags && <Card style={{ borderColor: C.danger + "60", background: C.danger + "10" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.danger, marginBottom: 6 }}>⚠️ MEDICAL EVALUATION NEEDED</div>
          <div style={{ fontSize: 12, color: C.text, marginBottom: 10 }}>These symptoms need medical evaluation before starting an exercise program. Please see your doctor first.</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 10 }}>If your doctor has already evaluated these symptoms and cleared you, you may continue.</div>
          <button onClick={() => setRedFlagCleared(true)} style={{ background: "none", border: "none", color: C.warning, fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}>
            {redFlagCleared ? "✅ I confirm medical clearance — continue" : "I have been evaluated and cleared by my doctor →"}
          </button>
        </Card>}
        <Btn onClick={next} disabled={hasRedFlags && !redFlagCleared}>
          {hasRedFlags && !redFlagCleared ? "Medical Clearance Required" : "Next — Movement Screen →"}
        </Btn>
      </div>}

      {/* ── SCREEN 9: MOVEMENT SCREEN (was 2) ────────────────── */}
      {screen === 9 && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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

      {/* ── SCREEN 10: ROM SELF-ASSESSMENT (was 3) ───────── */}
      {screen === 10 && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>RANGE OF MOTION</div><div style={{ fontSize: 11, color: C.textMuted }}>Rate mobility for each joint. Limited/Painful areas get adapted exercises.</div></div>
        {[
          { id:"neck", label:"Neck", desc:"Can you look fully up, down, left, right?", icon:"😐" },
          { id:"thoracic", label:"Thoracic Spine", desc:"Can you rotate your upper back while hips stay still?", icon:"🔄" },
          { id:"lumbar", label:"Lumbar Spine", desc:"Can you bend forward and touch your toes?", icon:"🙇" },
          { id:"shoulders", label:"Shoulders", desc:"Can you reach both arms fully overhead?", icon:"🤸" },
          { id:"elbows", label:"Elbows", desc:"Can you fully straighten and bend both elbows?", icon:"💪" },
          { id:"wrists", label:"Wrists", desc:"Can you bend wrists fully forward and back?", icon:"🤲" },
          { id:"hips", label:"Hips", desc:"Can you sit in a deep squat comfortably?", icon:"🧘" },
          { id:"knee_left", label:"Left Knee", desc:"Can you fully bend and straighten without pain?", icon:"🦵" },
          { id:"knee_right", label:"Right Knee", desc:"Same — right side", icon:"🦵" },
          { id:"ankles", label:"Ankles", desc:"Can you touch knee to wall 4 inches from foot?", icon:"🦶" },
          { id:"feet", label:"Toes / Feet", desc:"Can you pull toes up toward shin (dorsiflexion)?", icon:"🦶" },
        ].map(joint => (
          <Card key={joint.id} style={{ padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><span style={{ fontSize: 16 }}>{joint.icon}</span><div><div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{joint.label}</div><div style={{ fontSize: 9, color: C.textDim }}>{joint.desc}</div></div></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              {[{ v:"full", l:"Full", c:C.success }, { v:"limited", l:"Limited", c:C.warning }, { v:"painful", l:"Painful", c:C.danger }].map(opt => (
                <button key={opt.v} onClick={() => setRom(p => ({ ...p, [joint.id]: opt.v }))}
                  style={{ padding: "8px 4px", borderRadius: 8, fontSize: 10, fontWeight: 600, textAlign: "center", cursor: "pointer",
                    background: rom[joint.id] === opt.v ? opt.c + "15" : "transparent",
                    border: `1px solid ${rom[joint.id] === opt.v ? opt.c : C.border}`,
                    color: rom[joint.id] === opt.v ? opt.c : C.textDim }}>{opt.l}</button>
              ))}
            </div>
          </Card>
        ))}
        {Object.values(rom).some(v => v !== "full") && <div style={{ fontSize: 10, color: C.warning }}>{Object.values(rom).filter(v => v !== "full").length} joint{Object.values(rom).filter(v => v !== "full").length !== 1 ? "s" : ""} flagged — exercises requiring that ROM will be blocked until improved.</div>}
        <Btn onClick={next}>Next — Goals →</Btn>
      </div>}

      {/* ── SCREEN 11: GOALS (was 4) ─────────────────────── */}
      {screen === 11 && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>YOUR GOALS</div><div style={{ fontSize: 11, color: C.textMuted }}>Select ALL that apply per muscle group. Multiple goals OK.</div></div>
        {MUSCLE_GROUPS.map(mg => {
          const sel = Array.isArray(goals[mg.id]) ? goals[mg.id] : [];
          return (
            <Card key={mg.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><span style={{ fontSize: 16 }}>{mg.icon}</span><span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{mg.label}</span>{sel.length > 0 && <Badge color={C.teal}>{sel.length}</Badge>}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {GOAL_OPTIONS.map(opt => {
                  const active = sel.includes(opt.v);
                  return <button key={opt.v} onClick={() => setGoals(p => {
                    const cur = Array.isArray(p[mg.id]) ? p[mg.id] : [];
                    return { ...p, [mg.id]: active ? cur.filter(x => x !== opt.v) : [...cur, opt.v] };
                  })} style={{ padding: "6px 10px", borderRadius: 8, fontSize: 10, fontWeight: 600, cursor: "pointer",
                    background: active ? opt.c + "20" : "transparent",
                    border: `1px solid ${active ? opt.c + "60" : C.border}`,
                    color: active ? opt.c : C.textDim }}>{active ? "✓ " : ""}{opt.l}</button>;
                })}
              </div>
            </Card>
          );
        })}
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

      {/* ── SCREEN 12: TRAINING PREFERENCES (was 5) ─────── */}
      {screen === 12 && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
        {/* Sports + custom */}
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
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <input value={prefs.customSport} onChange={e => setPrefs(p => ({ ...p, customSport: e.target.value }))} placeholder="Other sport..."
              style={{ flex: 1, padding: "6px 10px", borderRadius: 8, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text, fontSize: 11, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            {prefs.customSport.trim() && <button onClick={() => { if (prefs.customSport.trim() && !prefs.sports.includes(prefs.customSport.trim())) setPrefs(p => ({ ...p, sports: [...p.sports, p.customSport.trim()], customSport: "" })); }}
              style={{ padding: "6px 10px", borderRadius: 8, background: C.tealBg, border: `1px solid ${C.teal}40`, color: C.teal, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>+ Add</button>}
          </div>
        </Card>
        {/* Favorite exercises — curated grid + search */}
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4 }}>Favorite exercises</div>
          <div style={{ fontSize: 9, color: C.textMuted, marginBottom: 10 }}>Tap to select. Grayed = building toward it (injury/phase gate).</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 5 }}>
            {FAVORITE_GRID.map(fe => {
              const fav = prefs.favorites.includes(fe.dbId);
              const dbEx = exerciseDB.find(e => e.id === fe.dbId);
              const blocked = dbEx && (dbEx.safetyTier === "red" || !(dbEx.phaseEligibility || []).includes(1));
              return <button key={fe.dbId+fe.name} onClick={() => setPrefs(p => ({ ...p, favorites: fav ? p.favorites.filter(x => x !== fe.dbId) : [...p.favorites, fe.dbId] }))}
                style={{ padding: "8px 2px", borderRadius: 8, textAlign: "center", cursor: "pointer", opacity: blocked && !fav ? 0.4 : 1,
                  background: fav ? C.tealBg : "transparent", border: `1px solid ${fav ? C.teal + "60" : C.border}`, position: "relative" }}>
                <div style={{ fontSize: 16 }}>{fe.emoji}</div>
                <div style={{ fontSize: 8, color: fav ? C.teal : C.text, fontWeight: fav ? 700 : 400, marginTop: 2, lineHeight: 1.2 }}>{fe.name}</div>
                {blocked && !fav && <div style={{ fontSize: 7, color: C.orange, marginTop: 1 }}>Building →</div>}
                {fav && <div style={{ position: "absolute", top: 2, right: 2, fontSize: 8 }}>⭐</div>}
              </button>;
            })}
          </div>
          {/* Advanced search */}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search all 300 exercises..."
            style={{ width: "100%", padding: "8px 12px", borderRadius: 10, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text, fontSize: 11, fontFamily: "inherit", outline: "none", marginTop: 10, boxSizing: "border-box" }} />
          {search.trim().length >= 2 && <div style={{ maxHeight: 120, overflowY: "auto", marginTop: 4 }}>
            {exerciseDB.filter(e => e.name.toLowerCase().includes(search.toLowerCase())).slice(0, 6).map(e => {
              const fav = prefs.favorites.includes(e.id);
              return <div key={e.id} onClick={() => setPrefs(p => ({ ...p, favorites: fav ? p.favorites.filter(x => x !== e.id) : [...p.favorites, e.id] }))}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", cursor: "pointer", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 12 }}>{e.emoji}</span><span style={{ fontSize: 10, color: fav ? C.teal : C.text, flex: 1 }}>{e.name}</span>{fav && <span style={{ fontSize: 8 }}>⭐</span>}
              </div>;
            })}
          </div>}
          {prefs.favorites.length > 0 && <div style={{ fontSize: 10, color: C.teal, marginTop: 6 }}>{prefs.favorites.length} exercise{prefs.favorites.length !== 1 ? "s" : ""} favorited</div>}
        </Card>
        <Btn onClick={next}>Next — Summary →</Btn>
      </div>}

      {/* ── SCREEN 13: SUMMARY (was 6) ─────────────────── */}
      {screen === 13 && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
          {Object.entries(goals).filter(([, v]) => (Array.isArray(v) ? v.length > 0 : v && v !== "none")).map(([m, g]) => {
            const ga = Array.isArray(g) ? g : [g];
            return <div key={m} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0" }}>
              <span style={{ fontSize: 11, color: C.text }}>{m.charAt(0).toUpperCase() + m.slice(1)}</span>
              <div style={{ display: "flex", gap: 3 }}>{ga.map(gg => <Badge key={gg} color={gg === "size" ? C.purple : gg === "strength" ? C.teal : gg === "injury_prevention" ? C.warning : C.info}>{gg.replace("_"," ")}</Badge>)}</div>
            </div>;
          })}
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
