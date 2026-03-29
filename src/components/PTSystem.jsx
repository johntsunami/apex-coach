import { useState, useEffect, useMemo } from "react";
import { getAssessment } from "./Onboarding.jsx";
import ExerciseImage from "./ExerciseImage.jsx";
import exerciseDB from "../data/exercises.json";
import { supabase } from "../utils/supabase.js";

// ═══════════════════════════════════════════════════════════════
// PT Protocol System — Mini-sessions, progress tracking, protocols
// ═══════════════════════════════════════════════════════════════

const C={bg:"#060b18",bgCard:"#0d1425",bgElevated:"#162040",bgGlass:"rgba(255,255,255,0.04)",border:"rgba(255,255,255,0.08)",text:"#e8ecf4",textMuted:"#7a8ba8",textDim:"#4a5a78",teal:"#00d2c8",tealBg:"rgba(0,210,200,0.08)",tealDark:"#00a89f",tealGlow:"rgba(0,210,200,0.15)",success:"#22c55e",danger:"#ef4444",warning:"#eab308",info:"#3b82f6",orange:"#f97316",purple:"#a855f7"};
const Card=({children,style,onClick})=><div onClick={onClick} style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:16,padding:18,cursor:onClick?"pointer":"default",...style}}>{children}</div>;
const Btn=({children,onClick,disabled,style,variant="teal",icon})=>{const v={teal:{background:`linear-gradient(135deg,${C.teal},${C.tealDark})`,color:"#000",fontWeight:700},dark:{background:C.bgElevated,color:C.text,border:`1px solid ${C.border}`}};return<button onClick={onClick} disabled={disabled} style={{...v[variant],padding:"14px 24px",borderRadius:14,fontSize:15,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.4:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,width:"100%",fontFamily:"inherit",border:v[variant]?.border||"none",...style}}>{icon&&<span>{icon}</span>}{children}</button>;};
const Badge=({children,color=C.teal})=><span style={{display:"inline-flex",padding:"4px 10px",borderRadius:8,fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color,background:color+"15",border:`1px solid ${color}25`}}>{children}</span>;
const ProgressBar=({value,max=100,color=C.teal,height=6})=><div style={{width:"100%",height,background:C.border,borderRadius:height/2,overflow:"hidden"}}><div style={{width:`${Math.min(100,(value/max)*100)}%`,height:"100%",background:color,borderRadius:height/2,transition:"width 0.4s ease"}}/></div>;

// ── PT Exercise mapping by protocol type ────────────────────
const PT_EXERCISES = {
  mckenzie_extension: {
    phase1: ["mck_back_prone_lying", "mck_back_prone_elbows", "stab_mcgill_curl_up", "stab_bird_dog"],
    phase2: ["mck_back_prone_elbows", "mck_back_press_up", "stab_mcgill_curl_up", "stab_bird_dog", "stab_plank"],
    phase3: ["mck_back_press_up", "mck_back_ext_standing", "stab_plank", "stab_side_plank", "stab_bird_dog"],
    phase4: ["mck_back_ext_standing", "stab_plank", "stab_side_plank", "stab_dead_bug", "stab_bird_dog"],
  },
  williams_flexion: {
    phase1: ["williams_pelvic_tilt", "williams_single_knee_chest", "stab_dead_bug", "mob_cat_cow"],
    phase2: ["williams_pelvic_tilt", "williams_single_knee_chest", "williams_double_knee_chest", "stab_dead_bug", "stab_bird_dog"],
    phase3: ["williams_double_knee_chest", "williams_partial_curl", "stab_dead_bug", "stab_plank", "stab_side_plank"],
    phase4: ["williams_partial_curl", "williams_seated_flexion", "stab_plank", "stab_side_plank", "stab_dead_bug"],
  },
  neutral_stabilization: {
    phase1: ["stab_mcgill_curl_up", "stab_side_plank", "stab_bird_dog"],
    phase2: ["stab_mcgill_curl_up", "stab_side_plank", "stab_bird_dog", "stab_dead_bug"],
    phase3: ["stab_mcgill_curl_up", "stab_side_plank", "stab_bird_dog", "stab_plank", "stab_dead_bug"],
    phase4: ["stab_plank", "stab_side_plank", "stab_dead_bug", "stab_bird_dog", "mob_cat_cow"],
  },
  joint_rom: {
    phase1: ["mob_cat_cow", "mob_90_90_hip", "mob_ankle_dorsiflexion"],
    phase2: ["mob_cat_cow", "mob_90_90_hip", "mob_worlds_greatest", "mob_ankle_dorsiflexion"],
    phase3: ["mob_worlds_greatest", "mob_thoracic_rotation", "mob_90_90_hip", "mob_shoulder_pass_through"],
    phase4: ["mob_worlds_greatest", "mob_thoracic_rotation", "mob_shoulder_pass_through"],
  },
  joint_strengthening: {
    phase1: ["rehab_vmo_wall_sit", "rehab_tke", "rehab_quad_set", "rehab_slr"],
    phase2: ["rehab_vmo_wall_sit", "rehab_tke", "rehab_step_down_low", "rehab_slr"],
    phase3: ["rehab_step_down_low", "rehab_step_down_high", "rehab_sl_leg_press"],
    phase4: ["rehab_step_down_high", "rehab_sl_leg_press", "stab_ball_squat"],
  },
  shoulder_rehab: {
    phase1: ["rehab_iso_ext_rotation", "rehab_prone_y", "rehab_scap_wall_slides"],
    phase2: ["rehab_iso_ext_rotation", "rehab_prone_y", "rehab_prone_t", "rehab_scap_wall_slides"],
    phase3: ["rehab_prone_y", "rehab_prone_t", "rehab_prone_w", "rehab_scap_wall_slides", "mob_shoulder_pass_through"],
    phase4: ["rehab_prone_y", "rehab_prone_t", "rehab_prone_w", "mob_shoulder_pass_through"],
  },
};

// ── Protocol generation from assessment data ─────────────────
function determineProtocolType(condition, directionalPref) {
  const cat = condition.category;
  if (cat === "spinal") {
    if (!directionalPref) return "neutral_stabilization";
    if (directionalPref.extension === "better") return "mckenzie_extension";
    if (directionalPref.flexion === "better") return "williams_flexion";
    return "neutral_stabilization";
  }
  if (cat === "joint") {
    const area = (condition.bodyArea || condition.name || "").toLowerCase();
    if (area.includes("shoulder")) return "shoulder_rehab";
    if (area.includes("knee") || area.includes("hip") || area.includes("ankle")) return "joint_strengthening";
    return "joint_rom";
  }
  return "general";
}

function determineFrequency(timeline) {
  if (!timeline?.onset) return { perDay: 2, duration: 15 };
  switch (timeline.onset) {
    case "acute": return { perDay: 4, duration: 10 };
    case "subacute": return { perDay: 3, duration: 12 };
    case "chronic": return { perDay: 2, duration: 15 };
    case "chronic_persistent": return { perDay: 1, duration: 20 };
    default: return { perDay: 2, duration: 15 };
  }
}

function protocolNameFromCondition(condition) {
  const area = condition.bodyArea || condition.name || "General";
  const cat = condition.category;
  if (cat === "spinal") return `${area} Spine Rehabilitation`;
  if (cat === "joint") return `${area} Joint Recovery`;
  return `${condition.name || area} Protocol`;
}

const SESSION_TYPES = ["morning", "midday", "evening", "as_needed"];
const PHASE_NAMES = ["Pain Management", "Stability Foundation", "Functional Loading", "Progressive Strengthening"];
const PHASE_GOALS = [
  ["Pain ≤4/10 during daily activities", "Basic exercises tolerated", "Movement patterns learned"],
  ["Core/joint stability improved", "Hold positions 30s+", "No pain during exercises"],
  ["Functional activities pain-free", "Light resistance tolerated", "Daily activities unrestricted"],
  ["Full training with awareness", "Loaded patterns established", "PT transitions to maintenance"],
];
const PHASE_WEEKS = [[1,4],[5,8],[9,12],[13,24]];

// ── Generate protocols from assessment ───────────────────────
export function generateProtocols(assessment) {
  if (!assessment?.conditions?.length) return [];
  const protocols = [];
  for (const cond of assessment.conditions) {
    const dp = assessment.directionalPreferences?.[cond.conditionId];
    const tl = assessment.painTimelines?.[cond.conditionId];
    const pb = assessment.painBehaviors?.[cond.conditionId];
    const type = determineProtocolType(cond, dp);
    const freq = determineFrequency(tl);
    const exMap = PT_EXERCISES[type] || PT_EXERCISES.neutral_stabilization;
    const exerciseIds = exMap.phase1 || [];
    const graduation = [
      { label: "Pain consistently ≤2/10 for 2 weeks", met: false },
      { label: "Full ROM restored vs baseline", met: false },
      { label: "Stability tests passed", met: false },
      { label: "No flare-ups in last 4 weeks", met: false },
      { label: "Cleared by PT/physician", met: false },
    ];
    protocols.push({
      condition_key: cond.conditionId,
      condition: cond,
      protocol_name: protocolNameFromCondition(cond),
      protocol_type: type,
      current_phase: 1,
      exercises: exerciseIds,
      frequency_per_day: freq.perDay,
      session_duration_minutes: freq.duration,
      graduation_criteria: graduation,
      pain_baseline: pb?.painType === "Constant" ? 6 : 4,
      functional_goals: [],
      timeline: tl,
      pain_behavior: pb,
      directional_preference: dp,
    });
  }
  return protocols;
}

// ── Save protocols to Supabase ───────────────────────────────
export async function saveProtocolsToSupabase(userId, protocols) {
  const results = [];
  for (const p of protocols) {
    const { data, error } = await supabase.from("pt_protocols").upsert({
      user_id: userId,
      condition_key: p.condition_key,
      protocol_name: p.protocol_name,
      protocol_type: p.protocol_type,
      current_phase: p.current_phase,
      exercises: p.exercises,
      frequency_per_day: p.frequency_per_day,
      session_duration_minutes: p.session_duration_minutes,
      graduation_criteria: p.graduation_criteria,
      pain_baseline: p.pain_baseline,
      functional_goals: p.functional_goals,
    }, { onConflict: "user_id,condition_key" }).select();
    if (data) results.push(...data);
  }
  return results;
}

// ── Save assessment clinical data to Supabase ────────────────
export async function saveAssessmentToSupabase(userId, assessment) {
  // Update profiles with new clinical fields
  await supabase.from("profiles").update({
    functional_limitations: assessment.functionalLimitations || {},
    treatment_history: assessment.treatmentHistory || {},
    medications: assessment.medications || [],
    red_flags: assessment.redFlags || [],
    medical_clearance: assessment.redFlagCleared || false,
  }).eq("id", userId);

  // Update each condition with pain behavior, directional pref, timeline
  for (const cond of (assessment.conditions || [])) {
    const pb = assessment.painBehaviors?.[cond.conditionId];
    const dp = assessment.directionalPreferences?.[cond.conditionId];
    const tl = assessment.painTimelines?.[cond.conditionId];
    const dpType = dp?.extension === "better" ? "extension" : dp?.flexion === "better" ? "flexion" : dp ? "neutral" : null;

    await supabase.from("user_conditions").update({
      pain_behavior: pb || {},
      directional_preference: dpType,
      timeline: tl || {},
    }).eq("user_id", userId).eq("condition_key", cond.conditionId);
  }
}

// ── Load protocols from Supabase ─────────────────────────────
export async function loadProtocols(userId) {
  const { data } = await supabase.from("pt_protocols").select("*").eq("user_id", userId).is("graduated_at", null);
  return data || [];
}

export async function loadPTSessions(userId, protocolId, days = 30) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data } = await supabase.from("pt_sessions").select("*")
    .eq("user_id", userId)
    .eq("protocol_id", protocolId)
    .gte("completed_at", since)
    .order("completed_at", { ascending: false });
  return data || [];
}

export async function savePTSession(userId, session) {
  const { data, error } = await supabase.from("pt_sessions").insert({
    user_id: userId,
    protocol_id: session.protocol_id,
    session_type: session.session_type,
    exercises_completed: session.exercises_completed,
    pain_before: session.pain_before,
    pain_after: session.pain_after,
    rom_measurement: session.rom_measurement,
    notes: session.notes,
  }).select();
  return { data, error };
}

// ── Local storage fallback for PT data ───────────────────────
const PT_STORAGE_KEY = "apex_pt_protocols";
const PT_SESSIONS_KEY = "apex_pt_sessions";

export function getLocalProtocols() {
  try { return JSON.parse(localStorage.getItem(PT_STORAGE_KEY)) || []; } catch { return []; }
}
export function saveLocalProtocols(protocols) {
  localStorage.setItem(PT_STORAGE_KEY, JSON.stringify(protocols));
}
export function getLocalPTSessions() {
  try { return JSON.parse(localStorage.getItem(PT_SESSIONS_KEY)) || []; } catch { return []; }
}
export function saveLocalPTSession(session) {
  const all = getLocalPTSessions();
  all.push({ ...session, completed_at: new Date().toISOString(), id: crypto.randomUUID?.() || Date.now().toString() });
  localStorage.setItem(PT_SESSIONS_KEY, JSON.stringify(all));
}

// ═══════════════════════════════════════════════════════════════
// PT PROGRESS CARD — shown on Home page
// ═══════════════════════════════════════════════════════════════

export function PTProgressCard({ onStartSession, onViewProgress }) {
  const assessment = getAssessment();
  const protocols = useMemo(() => {
    const local = getLocalProtocols();
    if (local.length > 0) return local;
    if (assessment?.conditions?.length) {
      const gen = generateProtocols(assessment);
      saveLocalProtocols(gen);
      return gen;
    }
    return [];
  }, [assessment]);

  const sessions = getLocalPTSessions();
  const today = new Date().toDateString();
  const todaySessions = sessions.filter(s => new Date(s.completed_at).toDateString() === today);

  if (!protocols.length) return null;

  // Calculate streak
  let streak = 0;
  const daySet = new Set(sessions.map(s => new Date(s.completed_at).toDateString()));
  let d = new Date();
  while (daySet.has(d.toDateString())) { streak++; d.setDate(d.getDate() - 1); }

  // Average pain trend (last 7 days vs first 7 days)
  const sorted = [...sessions].sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at));
  const first7 = sorted.slice(0, Math.min(7, sorted.length));
  const last7 = sorted.slice(-Math.min(7, sorted.length));
  const avgFirst = first7.length ? first7.reduce((s, x) => s + (x.pain_before || 0), 0) / first7.length : 0;
  const avgLast = last7.length ? last7.reduce((s, x) => s + (x.pain_after || 0), 0) / last7.length : 0;

  return (
    <Card style={{ borderColor: C.purple + "30" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.purple, letterSpacing: 2 }}>MY THERAPY PROTOCOLS</div>
        {onViewProgress && <button onClick={onViewProgress} style={{ background: "none", border: "none", color: C.teal, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>View All →</button>}
      </div>

      {protocols.map((proto, idx) => {
        const phaseWeeks = PHASE_WEEKS[proto.current_phase - 1] || [1, 4];
        const daysSinceStart = Math.floor((Date.now() - new Date(proto.phase_started_at || Date.now()).getTime()) / 86400000);
        const weekInPhase = Math.max(1, Math.ceil(daysSinceStart / 7));
        const totalWeeks = phaseWeeks[1] - phaseWeeks[0] + 1;
        const phasePct = Math.min(100, Math.round((weekInPhase / totalWeeks) * 100));
        const todayForProto = todaySessions.filter(s => s.condition_key === proto.condition_key || s.protocol_id === proto.condition_key);
        const doneToday = todayForProto.length;

        return (
          <div key={idx} style={{ marginBottom: idx < protocols.length - 1 ? 12 : 0, paddingBottom: idx < protocols.length - 1 ? 12 : 0, borderBottom: idx < protocols.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>{proto.protocol_name}</div>
            <div style={{ fontSize: 10, color: C.textDim, marginBottom: 6 }}>
              Phase {proto.current_phase} of 4 — Week {weekInPhase} of {totalWeeks} · {PHASE_NAMES[proto.current_phase - 1]}
            </div>
            <ProgressBar value={phasePct} max={100} color={C.purple} height={4} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <div style={{ fontSize: 10, color: C.textMuted }}>
                Today: {doneToday}/{proto.frequency_per_day} sessions
              </div>
              {streak > 0 && <div style={{ fontSize: 10, color: C.success }}>Streak: {streak} days</div>}
            </div>
            {/* Today's session status */}
            <div style={{ marginTop: 6 }}>
              {SESSION_TYPES.slice(0, proto.frequency_per_day).map((st, i) => {
                const done = todayForProto[i];
                return (
                  <div key={st} style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 0" }}>
                    <span style={{ fontSize: 10 }}>{done ? "✅" : "⬜"}</span>
                    <span style={{ fontSize: 10, color: done ? C.textMuted : C.text, textTransform: "capitalize" }}>{st}</span>
                    {done && <span style={{ fontSize: 9, color: C.success }}>Pain: {done.pain_before}→{done.pain_after}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Pain trend */}
      {sessions.length >= 3 && (
        <div style={{ marginTop: 8, padding: 8, background: avgLast < avgFirst ? C.success + "10" : C.warning + "10", borderRadius: 8 }}>
          <div style={{ fontSize: 10, color: avgLast < avgFirst ? C.success : C.warning }}>
            Average pain trend: {avgFirst.toFixed(1)} → {avgLast.toFixed(1)}
            {avgLast < avgFirst ? ` (↓${Math.round((1 - avgLast / avgFirst) * 100)}% since start)` : " (monitoring)"}
          </div>
        </div>
      )}

      {onStartSession && <Btn onClick={() => onStartSession(protocols[0])} icon="🩺" style={{ marginTop: 10, fontSize: 13 }}>Start PT Session</Btn>}
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// PT MINI-SESSION FLOW — guided PT exercise session
// ═══════════════════════════════════════════════════════════════

export function PTMiniSession({ protocol, onComplete, onClose }) {
  const [step, setStep] = useState("pain_before"); // pain_before → exercises → pain_after → summary
  const [painBefore, setPainBefore] = useState(5);
  const [painAfter, setPainAfter] = useState(5);
  const [exIdx, setExIdx] = useState(0);
  const [completedExercises, setCompletedExercises] = useState([]);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [notes, setNotes] = useState("");

  const exerciseIds = protocol?.exercises || [];
  const exercises = exerciseIds.map(id => exerciseDB.find(e => e.id === id)).filter(Boolean);

  // Timer
  useEffect(() => {
    if (!timerActive || timer <= 0) return;
    const t = setTimeout(() => setTimer(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, timerActive]);

  const currentEx = exercises[exIdx];
  const sessionType = (() => {
    const h = new Date().getHours();
    if (h < 12) return "morning";
    if (h < 17) return "midday";
    return "evening";
  })();

  const handleExDone = () => {
    setCompletedExercises(prev => [...prev, { exercise_id: currentEx.id, name: currentEx.name }]);
    window.scrollTo(0, 0);
    if (exIdx + 1 < exercises.length) {
      setExIdx(exIdx + 1);
      setTimer(0);
      setTimerActive(false);
    } else {
      setStep("pain_after");
    }
  };

  const handleComplete = () => {
    const session = {
      protocol_id: protocol.condition_key || protocol.id,
      condition_key: protocol.condition_key,
      session_type: sessionType,
      exercises_completed: completedExercises,
      pain_before: painBefore,
      pain_after: painAfter,
      notes,
    };
    saveLocalPTSession(session);
    onComplete?.(session);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.purple, letterSpacing: 2 }}>PT SESSION</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>
            {protocol?.protocol_name || "Therapy Session"}
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, textTransform: "capitalize" }}>{sessionType} session · ~{protocol?.session_duration_minutes || 15} min</div>
        </div>
        {onClose && <button onClick={onClose} style={{ background: C.bgElevated, border: `1px solid ${C.border}`, borderRadius: 10, padding: "6px 12px", color: C.textMuted, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>✕</button>}
      </div>

      {/* Progress */}
      {step === "exercises" && (
        <ProgressBar value={exIdx + 1} max={exercises.length} color={C.purple} height={4} />
      )}

      {/* ── STEP: Pain Before ──────────────────────────── */}
      {step === "pain_before" && (
        <Card style={{ borderColor: C.purple + "30" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>Rate your pain right now</div>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: painBefore <= 3 ? C.success : painBefore <= 6 ? C.warning : C.danger, fontFamily: "'Bebas Neue',sans-serif" }}>{painBefore}</div>
            <div style={{ fontSize: 10, color: C.textDim }}>/10</div>
          </div>
          <input type="range" min="0" max="10" value={painBefore} onChange={e => setPainBefore(+e.target.value)}
            style={{ width: "100%", accentColor: C.purple }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.textDim, marginTop: 4 }}>
            <span>No pain</span><span>Worst possible</span>
          </div>
          <Btn onClick={() => setStep("exercises")} style={{ marginTop: 16 }}>Begin Exercises →</Btn>
        </Card>
      )}

      {/* ── STEP: Exercises ────────────────────────────── */}
      {step === "exercises" && currentEx && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <Badge color={C.purple}>Exercise {exIdx + 1} of {exercises.length}</Badge>
              <Badge>{protocol?.protocol_type?.replace(/_/g, " ") || "PT"}</Badge>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1, marginBottom: 8 }}>{currentEx.name}</div>
            {/* Sets / Reps / Tempo */}
            {(()=>{ const pp = currentEx.phaseParams?.[String(protocol?.current_phase || 1)] || currentEx.phaseParams?.["1"] || {}; return (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
                <div style={{ textAlign: "center", padding: "8px 4px", background: C.bgElevated, borderRadius: 8 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.teal, fontFamily: "'Bebas Neue',sans-serif" }}>{pp.sets || "1-2"}</div>
                  <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 1, textTransform: "uppercase" }}>Sets</div>
                </div>
                <div style={{ textAlign: "center", padding: "8px 4px", background: C.bgElevated, borderRadius: 8 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif" }}>{pp.reps || "10-15"}</div>
                  <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 1, textTransform: "uppercase" }}>Reps</div>
                </div>
                <div style={{ textAlign: "center", padding: "8px 4px", background: C.bgElevated, borderRadius: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.textMuted }}>{pp.tempo || "Slow"}</div>
                  <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 1, textTransform: "uppercase" }}>Tempo</div>
                </div>
              </div>
            ); })()}
            <ExerciseImage exercise={currentEx} size="full" />
            <button onClick={handleExDone} style={{ width: "100%", padding: "12px", borderRadius: 10, marginTop: 10, background: C.success + "15", border: `1px solid ${C.success}40`, color: C.success, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              ✅ {exIdx + 1 < exercises.length ? "Complete — Next" : "Complete — Rate Pain"}
            </button>
          </Card>

          {/* Instructions */}
          <Card>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: 1.5, marginBottom: 8 }}>INSTRUCTIONS</div>
            {(currentEx.steps || []).map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 8, padding: "4px 0" }}>
                <span style={{ color: C.teal, fontWeight: 700, fontSize: 11, minWidth: 18 }}>{i + 1}.</span>
                <span style={{ fontSize: 11, color: C.textMuted }}>{s}</span>
              </div>
            ))}
          </Card>

          {/* Form cues */}
          {currentEx.formCues && (
            <Card>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.success, letterSpacing: 1.5, marginBottom: 6 }}>GOOD FORM</div>
              {(currentEx.formCues || []).slice(0, 3).map((c, i) => (
                <div key={i} style={{ fontSize: 10, color: C.textMuted, padding: "2px 0" }}>✅ {c}</div>
              ))}
              {currentEx.commonMistakes && <>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.danger, letterSpacing: 1.5, marginTop: 8, marginBottom: 6 }}>AVOID</div>
                {(currentEx.commonMistakes || []).slice(0, 3).map((m, i) => (
                  <div key={i} style={{ fontSize: 10, color: C.textMuted, padding: "2px 0" }}>❌ {m}</div>
                ))}
              </>}
            </Card>
          )}

          {/* Injury notes */}
          {currentEx.injuryNotes && Object.keys(currentEx.injuryNotes).length > 0 && (
            <Card style={{ borderColor: C.warning + "30" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.warning, letterSpacing: 1.5, marginBottom: 6 }}>INJURY NOTES</div>
              {Object.entries(currentEx.injuryNotes).map(([area, note]) => (
                <div key={area} style={{ fontSize: 10, color: C.textMuted, padding: "2px 0" }}>⚠️ <b style={{ color: C.warning }}>{area}:</b> {note}</div>
              ))}
            </Card>
          )}

          {/* Timer */}
          <Card style={{ textAlign: "center" }}>
            {timer > 0 ? (
              <>
                <div style={{ fontSize: 36, fontWeight: 800, color: C.teal, fontFamily: "'Bebas Neue',sans-serif" }}>{Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")}</div>
                <div style={{ fontSize: 10, color: C.textDim, marginBottom: 8 }}>Hold / perform exercise</div>
                <button onClick={() => setTimerActive(!timerActive)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 16px", color: C.textMuted, cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>
                  {timerActive ? "⏸ Pause" : "▶ Resume"}
                </button>
              </>
            ) : (
              <div>
                <div style={{ fontSize: 11, color: C.textDim, marginBottom: 8 }}>⏱ Start Timer</div>
                <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                  {[{s:30,l:"30s"},{s:60,l:"60s"},{s:90,l:"90s"},{s:120,l:"2 min"}].map(opt => (
                    <button key={opt.s} onClick={() => { setTimer(opt.s); setTimerActive(true); }} style={{ padding: "10px 14px", borderRadius: 10, background: C.teal + "10", border: `1px solid ${C.teal}40`, color: C.teal, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <div style={{ position: "sticky", bottom: 76, background: "#060b18", padding: "10px 0", zIndex: 50 }}>
            <Btn onClick={handleExDone} icon="✅" style={{ fontSize: 14 }}>
              {exIdx + 1 < exercises.length ? "Done — Next Exercise →" : "Done — Rate Pain →"}
            </Btn>
          </div>
        </div>
      )}

      {/* ── STEP: Pain After ───────────────────────────── */}
      {step === "pain_after" && (
        <Card style={{ borderColor: C.purple + "30" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>Rate your pain now</div>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: painAfter <= 3 ? C.success : painAfter <= 6 ? C.warning : C.danger, fontFamily: "'Bebas Neue',sans-serif" }}>{painAfter}</div>
            <div style={{ fontSize: 10, color: C.textDim }}>/10</div>
          </div>
          <input type="range" min="0" max="10" value={painAfter} onChange={e => setPainAfter(+e.target.value)}
            style={{ width: "100%", accentColor: C.purple }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.textDim, marginTop: 4 }}>
            <span>No pain</span><span>Worst possible</span>
          </div>
          {/* Notes */}
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes about this session..."
            style={{ width: "100%", minHeight: 50, padding: "8px 10px", borderRadius: 8, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text, fontSize: 11, fontFamily: "inherit", outline: "none", resize: "vertical", marginTop: 12, boxSizing: "border-box" }} />
          <Btn onClick={() => setStep("summary")} style={{ marginTop: 12 }}>See Results →</Btn>
        </Card>
      )}

      {/* ── STEP: Summary ──────────────────────────────── */}
      {step === "summary" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card style={{ textAlign: "center", borderColor: painAfter < painBefore ? C.success + "40" : C.warning + "40" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.purple, letterSpacing: 2, marginBottom: 8 }}>SESSION COMPLETE</div>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16 }}>
              <div>
                <div style={{ fontSize: 10, color: C.textDim }}>Before</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: painBefore <= 3 ? C.success : painBefore <= 6 ? C.warning : C.danger, fontFamily: "'Bebas Neue',sans-serif" }}>{painBefore}</div>
              </div>
              <div style={{ fontSize: 24, color: C.textDim }}>→</div>
              <div>
                <div style={{ fontSize: 10, color: C.textDim }}>After</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: painAfter <= 3 ? C.success : painAfter <= 6 ? C.warning : C.danger, fontFamily: "'Bebas Neue',sans-serif" }}>{painAfter}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: painAfter < painBefore ? C.success : painAfter === painBefore ? C.info : C.warning, marginTop: 8 }}>
              {painAfter < painBefore ? `Pain reduced by ${painBefore - painAfter} points. That's progress!` :
               painAfter === painBefore ? "Pain stable — consistency matters." :
               "Pain increased slightly — monitor and report if persistent."}
            </div>
          </Card>
          <Card>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: 1.5, marginBottom: 6 }}>EXERCISES COMPLETED</div>
            {completedExercises.map((ex, i) => (
              <div key={i} style={{ fontSize: 11, color: C.textMuted, padding: "3px 0" }}>✅ {ex.name}</div>
            ))}
          </Card>
          {painAfter > painBefore + 2 && (
            <Card style={{ borderColor: C.danger + "40", background: C.danger + "08" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.danger }}>⚠️ Pain Increased Significantly</div>
              <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>If this persists, consider consulting your PT. We'll flag this in your progress tracking.</div>
            </Card>
          )}
          <Btn onClick={handleComplete} icon="✅">Done — Back to Home</Btn>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PT PROGRESS PAGE — full timeline and progress view
// ═══════════════════════════════════════════════════════════════

export function PTProgressPage({ onClose, onStartSession }) {
  const protocols = getLocalProtocols();
  const sessions = getLocalPTSessions();
  const assessment = getAssessment();
  const funcLim = assessment?.functionalLimitations || {};

  if (!protocols.length) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 3 }}>PT PROGRESS</div>
        <button onClick={onClose} style={{ background: C.bgElevated, border: `1px solid ${C.border}`, borderRadius: 10, padding: "6px 12px", color: C.textMuted, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
      </div>
      <Card><div style={{ textAlign: "center", color: C.textMuted, padding: 20 }}>No active protocols. Complete your assessment to generate PT protocols.</div></Card>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.purple, letterSpacing: 2 }}>THERAPY</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 3 }}>PT PROGRESS</div>
        </div>
        <button onClick={onClose} style={{ background: C.bgElevated, border: `1px solid ${C.border}`, borderRadius: 10, padding: "6px 12px", color: C.textMuted, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
      </div>

      {/* Per-protocol progress */}
      {protocols.map((proto, pIdx) => {
        const protoSessions = sessions.filter(s => s.condition_key === proto.condition_key || s.protocol_id === proto.condition_key);
        const painData = protoSessions.filter(s => s.pain_before != null && s.pain_after != null);
        const avgPainBefore = painData.length ? (painData.reduce((s, x) => s + x.pain_before, 0) / painData.length).toFixed(1) : "—";
        const avgPainAfter = painData.length ? (painData.reduce((s, x) => s + x.pain_after, 0) / painData.length).toFixed(1) : "—";

        return (
          <Card key={pIdx} style={{ borderColor: C.purple + "20" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>{proto.protocol_name}</div>
            <Badge color={C.purple}>{(proto.protocol_type || "general").replace(/_/g, " ")}</Badge>

            {/* Phase timeline */}
            <div style={{ marginTop: 12 }}>
              {PHASE_NAMES.map((pName, i) => {
                const phaseNum = i + 1;
                const isCurrent = proto.current_phase === phaseNum;
                const isComplete = proto.current_phase > phaseNum;
                const isLocked = proto.current_phase < phaseNum;
                return (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}`, opacity: isLocked ? 0.4 : 1 }}>
                    <div style={{ width: 30, textAlign: "center", flexShrink: 0 }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: isComplete ? C.success : isCurrent ? C.purple : C.bgElevated, border: `2px solid ${isComplete ? C.success : isCurrent ? C.purple : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: isComplete || isCurrent ? "#fff" : C.textDim }}>{isComplete ? "✓" : phaseNum}</span>
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: isCurrent ? C.purple : isComplete ? C.success : C.text }}>{pName}</span>
                        <span style={{ fontSize: 9, color: C.textDim }}>Weeks {PHASE_WEEKS[i][0]}-{PHASE_WEEKS[i][1]}</span>
                      </div>
                      {isCurrent && <div style={{ fontSize: 8, color: C.purple, fontWeight: 700, marginTop: 1 }}>← YOU ARE HERE</div>}
                      <div style={{ fontSize: 9, color: C.textDim, marginTop: 2 }}>
                        {PHASE_GOALS[i].map((g, gi) => <div key={gi}>· {g}</div>)}
                      </div>
                      {isLocked && <div style={{ fontSize: 8, color: C.info, marginTop: 2 }}>Unlocks when Phase {phaseNum - 1} graduated</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pain stats */}
            {painData.length > 0 && (
              <div style={{ marginTop: 12, padding: 10, background: C.bgElevated, borderRadius: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: 1.5, marginBottom: 6 }}>PAIN TRACKING</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
                  <div><div style={{ fontSize: 18, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif" }}>{protoSessions.length}</div><div style={{ fontSize: 8, color: C.textDim }}>SESSIONS</div></div>
                  <div><div style={{ fontSize: 18, fontWeight: 800, color: C.warning, fontFamily: "'Bebas Neue',sans-serif" }}>{avgPainBefore}</div><div style={{ fontSize: 8, color: C.textDim }}>AVG BEFORE</div></div>
                  <div><div style={{ fontSize: 18, fontWeight: 800, color: C.success, fontFamily: "'Bebas Neue',sans-serif" }}>{avgPainAfter}</div><div style={{ fontSize: 8, color: C.textDim }}>AVG AFTER</div></div>
                </div>
              </div>
            )}

            {/* Recent sessions */}
            {protoSessions.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textDim, letterSpacing: 1.5, marginBottom: 4 }}>RECENT SESSIONS</div>
                {protoSessions.slice(0, 5).map((s, si) => (
                  <div key={si} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 10, color: C.textMuted }}>{new Date(s.completed_at).toLocaleDateString()} · {s.session_type}</span>
                    <span style={{ fontSize: 10, color: s.pain_after < s.pain_before ? C.success : C.textMuted }}>
                      Pain: {s.pain_before}→{s.pain_after}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <Btn onClick={() => onStartSession?.(proto)} icon="🩺" variant="dark" style={{ marginTop: 10, fontSize: 12 }}>Start Session</Btn>
          </Card>
        );
      })}

      {/* Functional Goals */}
      {Object.keys(funcLim).length > 0 && (
        <Card>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.info, letterSpacing: 2, marginBottom: 10 }}>FUNCTIONAL GOALS</div>
          <div style={{ fontSize: 9, color: C.textDim, marginBottom: 8 }}>Reassessed every 4 weeks. Limitations become measurable targets.</div>
          {Object.entries(funcLim).filter(([, v]) => v !== "easy").map(([key, val]) => {
            const labels = { sit_30: "Sit 30+ min", stand_30: "Stand 30+ min", walk_15: "Walk 15+ min", climb_stairs: "Climb stairs", lift_overhead: "Lift overhead", reach_behind: "Reach behind back", get_up_floor: "Get up from floor", sleep_through: "Sleep through night", drive_30: "Drive 30+ min", exercise_moderate: "Exercise moderately" };
            return (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 11, color: C.text }}>{labels[key] || key}</span>
                <Badge color={val === "cannot" ? C.danger : C.warning}>{val === "cannot" ? "Cannot" : "Difficulty"}</Badge>
              </div>
            );
          })}
          <div style={{ fontSize: 9, color: C.textDim, marginTop: 6, fontStyle: "italic" }}>Goal: All items move to "Can do easily." Next reassessment in 4 weeks.</div>
        </Card>
      )}

      {/* Graduation criteria */}
      {protocols[0]?.graduation_criteria?.length > 0 && (
        <Card>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.success, letterSpacing: 2, marginBottom: 10 }}>GRADUATION CRITERIA</div>
          {protocols[0].graduation_criteria.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
              <span style={{ fontSize: 12 }}>{c.met ? "✅" : "⬜"}</span>
              <span style={{ fontSize: 11, color: c.met ? C.success : C.textMuted }}>{c.label}</span>
            </div>
          ))}
        </Card>
      )}

      <div style={{ height: 90 }} />
    </div>
  );
}
