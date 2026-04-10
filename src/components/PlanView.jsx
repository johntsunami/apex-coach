import { useState, useMemo, useCallback } from "react";
import exerciseDB from "../data/exercises.json";
import { getAssessment } from "./Onboarding.jsx";
import { getInjuries } from "../utils/injuries.js";
import { getStats, getSessions } from "../utils/storage.js";
import { getVolumeSummary, getTrainingWeek, getExerciseDisplayParams } from "../utils/volumeTracker.js";
import { getSafeExerciseParams } from "../utils/safeguards.js";
import ExerciseImage from "./ExerciseImage.jsx";
import SwapModal from "./ExerciseSwap.jsx";

// Import real plan data
let getWeeklyPlan, generateWeeklyPlan, getMesocycle, checkPhaseReadiness, TIERS, TIER_PROGRESSIONS, getMesocycleWeekParams, DAY_NAMES, getDayOfWeek;
try {
  const wp = require("../utils/weeklyPlanner.js");
  getWeeklyPlan = wp.getWeeklyPlan;
  generateWeeklyPlan = wp.generateWeeklyPlan;
  DAY_NAMES = wp.DAY_NAMES;
  getDayOfWeek = wp.getDayOfWeek;
} catch { getWeeklyPlan = () => null; generateWeeklyPlan = null; DAY_NAMES = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]; getDayOfWeek = () => 0; }
try {
  const mc = require("../utils/mesocycle.js");
  getMesocycle = mc.getMesocycle;
  checkPhaseReadiness = mc.checkPhaseReadiness;
  TIERS = mc.TIERS;
  TIER_PROGRESSIONS = mc.TIER_PROGRESSIONS;
  getMesocycleWeekParams = mc.getMesocycleWeekParams;
} catch { getMesocycle = () => null; checkPhaseReadiness = () => ({ checks: [], metCount: 0, totalCount: 0 }); TIERS = {}; TIER_PROGRESSIONS = {}; getMesocycleWeekParams = () => null; }

const C={bg:"#060b18",bgCard:"#0d1425",bgElevated:"#162040",bgGlass:"rgba(255,255,255,0.04)",border:"rgba(255,255,255,0.08)",text:"#e8ecf4",textMuted:"#7a8ba8",textDim:"#4a5a78",teal:"#00d2c8",tealBg:"rgba(0,210,200,0.08)",tealDark:"#00a89f",success:"#22c55e",danger:"#ef4444",warning:"#eab308",info:"#3b82f6",orange:"#f97316",purple:"#a855f7"};
const Card=({children,style})=><div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:16,padding:16,...style}}>{children}</div>;
const Badge=({children,color=C.teal})=><span style={{display:"inline-flex",padding:"3px 8px",borderRadius:6,fontSize:9,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color,background:color+"15"}}>{children}</span>;
const ProgressBar=({value,max=100,color=C.teal,height=5})=><div style={{width:"100%",height,background:C.border,borderRadius:height/2,overflow:"hidden"}}><div style={{width:`${Math.min(100,(value/max)*100)}%`,height:"100%",background:color,borderRadius:height/2}}/></div>;

// Cache version — increment when generation logic changes to invalidate stale cached weeks
const PLAN_GEN_VERSION = 12;

export default function PlanView({ onClose }) {
  const [tab, setTab] = useState("week");
  const [swapTarget, setSwapTarget] = useState(null);
  const [swaps, setSwaps] = useState({});
  const [expandedWeeks, setExpandedWeeks] = useState(new Set());
  const [generatedWeeks, setGeneratedWeeks] = useState({}); // cache: { weekNum: { days: [...], _v } }
  const [generating, setGenerating] = useState(new Set());

  const assessment = getAssessment();
  const injuries = getInjuries().filter(i => i.status !== "resolved");
  const stats = getStats();
  const sessions = getSessions();
  const tw = getTrainingWeek();
  const daysPerWeek = assessment?.preferences?.daysPerWeek || 3;
  const currentWeekNum = tw.week || 1;

  // Generate plan for a single week (cached with version — stale cache auto-invalidated)
  const generateWeek = useCallback((weekNum, phaseNum) => {
    if (generatedWeeks[weekNum]?._v === PLAN_GEN_VERSION || weekNum === currentWeekNum) return;
    setGenerating(prev => new Set(prev).add(weekNum));
    try {
      if (generateWeeklyPlan) {
        const gen = generateWeeklyPlan(exerciseDB, phaseNum, "gym");
        if (gen?.days) {
          const exCount = gen.days.filter(d => d.type === "training").reduce((n, d) => n + (d.exercises?.length || 0), 0);
          console.log("[PLAN GEN] Week", weekNum, "Phase", phaseNum, "— generated", exCount, "exercises across", gen.days.filter(d => d.type === "training").length, "training days");
          setGeneratedWeeks(prev => ({ ...prev, [weekNum]: { days: gen.days, _v: PLAN_GEN_VERSION } }));
        } else {
          setGeneratedWeeks(prev => ({ ...prev, [weekNum]: { error: true, message: "No exercises generated", _v: PLAN_GEN_VERSION } }));
        }
      }
    } catch (e) {
      console.warn("[PLAN ERROR] Week", weekNum, e.message);
      setGeneratedWeeks(prev => ({ ...prev, [weekNum]: { error: true, message: e.message, _v: PLAN_GEN_VERSION } }));
    }
    setGenerating(prev => { const n = new Set(prev); n.delete(weekNum); return n; });
  }, [generatedWeeks, currentWeekNum]);

  // Bulk generate all weeks in a phase
  const generatePhaseWeeks = useCallback((phaseObj) => {
    for (let w = phaseObj.weeks[0]; w <= phaseObj.weeks[1]; w++) {
      generateWeek(w, phaseObj.num);
    }
  }, [generateWeek]);

  // Get REAL data from weekly planner and mesocycle
  const weekPlan = getWeeklyPlan?.() || null;
  const meso = getMesocycle?.() || null;
  // Apply same sanity checks as App.jsx getCurrentPhase()
  let CURRENT_PHASE = meso?.phase || assessment?.startingPhase || 1;
  // Sanity: < 6 sessions = Phase 1
  if ((sessions || []).length < 6 && CURRENT_PHASE > 1) {
    console.warn('[PLANVIEW PHASE SANITY] Resetting from', CURRENT_PHASE, 'to 1 —', (sessions || []).length, 'sessions');
    CURRENT_PHASE = 1;
  }
  // Safeguard ceiling (age/conditions)
  try {
    const { checkSafeguardPhaseReadiness } = require("../utils/safeguards.js");
    const sg = checkSafeguardPhaseReadiness(CURRENT_PHASE, assessment?.userAge, assessment?.fitnessLevel, injuries);
    if (!sg.allowed) { console.log('[PLANVIEW PHASE CAP]', CURRENT_PHASE, '→', sg.maxPhase); CURRENT_PHASE = sg.maxPhase; }
  } catch {}
  const vs = getVolumeSummary(CURRENT_PHASE);
  const tierInfo = meso ? { tier: meso.tier, ...(TIERS[meso.tier] || {}) } : null;
  const readiness = checkPhaseReadiness?.(CURRENT_PHASE, tierInfo?.tier || 2) || null;
  const dow = getDayOfWeek?.() || 0;

  const TABS = [
    { id: "week", label: "This Week" },
    { id: "cycle", label: "Mesocycle" },
    { id: "roadmap", label: "12-Month" },
    { id: "blocked", label: "Blocked" },
  ];

  // Blocked exercises with reasons
  const blockedExercises = useMemo(() => {
    const results = [];
    exerciseDB.forEach(e => {
      const reasons = [];
      if (!(e.phaseEligibility || []).includes(CURRENT_PHASE)) reasons.push(`Phase ${Math.min(...(e.phaseEligibility || [9]))}+ required`);
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
  }, [injuries, stats, CURRENT_PHASE]);

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
          <div style={{ fontSize: 11, color: C.textMuted }}>
            Week {tw.week} · Phase {CURRENT_PHASE}
            {tw.isDeload ? " · DELOAD" : ""}
            {tierInfo ? ` · Tier ${tierInfo.tier}: ${tierInfo.name}` : ""}
          </div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 12, cursor: "pointer" }}>← Back</button>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", background: C.bgElevated, borderRadius: 10, padding: 2 }}>
        {TABS.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: "pointer", background: tab === t.id ? C.tealBg : "transparent", border: tab === t.id ? `1px solid ${C.teal}30` : "1px solid transparent", color: tab === t.id ? C.teal : C.textDim }}>{t.label}</button>)}
      </div>

      {/* ── TAB: THIS WEEK — from real weekly plan ──────────── */}
      {tab === "week" && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {weekPlan?.isDeload && <Card style={{ background: C.info + "10", borderColor: C.info + "30" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 18 }}>🔄</span><div><div style={{ fontSize: 12, fontWeight: 700, color: C.info }}>Deload Week</div><div style={{ fontSize: 10, color: C.textMuted }}>50% volume. Focus on movement quality and recovery.</div></div></div>
        </Card>}

        {weekPlan?.rpeRange && <div style={{ fontSize: 10, color: C.textDim, padding: "4px 0" }}>
          {weekPlan.split} · {weekPlan.weekLabel || ""} · {weekPlan.rpeRange}{weekPlan.setsPerExercise ? ` · ${weekPlan.setsPerExercise} sets/exercise` : ""}
        </div>}

        {weekPlan ? weekPlan.days.filter(day => day.type !== "rest").map((day, i) => {
          const isToday = day.dayOfWeek === dow;
          const isDone = day.status === "completed";
          return (
            <Card key={i} style={{ borderColor: isToday ? C.teal + "60" : isDone ? C.success + "30" : C.border, background: isToday ? C.tealBg : isDone ? C.success + "05" : C.bgCard }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: isToday ? C.teal : isDone ? C.success : C.text }}>{day.dayName}</span>
                  {isToday && <Badge color={C.teal}>TODAY</Badge>}
                  {isDone && <Badge color={C.success}>DONE</Badge>}
                </div>
                <div style={{ fontSize: 10, color: C.textDim }}>
                  {`${day.exercises?.length || 0} exercises · ~${day.estimatedMinutes} min`}
                </div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 4 }}>{day.label}</div>
              <div>
                  {/* Warmup exercises for this day */}
                  {(() => { const bps = new Set((day.exercises || []).map(e => { const f = exerciseDB.find(x => x.id === e.id); return f?.bodyPart; }).filter(Boolean)); const wu = exerciseDB.filter(e => (e.category === "foam_roll" || (e.category === "warmup" && e.type === "mobility")) && (e.phaseEligibility || []).includes(CURRENT_PHASE) && bps.has(e.bodyPart)).slice(0, 4); return wu.length > 0 ? <div style={{ marginBottom: 6 }}><div style={{ fontSize: 9, fontWeight: 700, color: C.info, letterSpacing: 0.5, marginBottom: 2 }}>WARM-UP</div>{wu.map((we, wi) => <div key={wi} style={{ fontSize: 9, color: C.textDim, paddingLeft: 4 }}>{we.name}</div>)}</div> : null; })()}
                  <div style={{ fontSize: 9, fontWeight: 700, color: C.teal, letterSpacing: 0.5, marginBottom: 2 }}>MAIN EXERCISES</div>
                  {day.exercises?.map((e, ei) => {
                    const fullEx = exerciseDB.find(x => x.id === e.id) || e;
                    const display = swaps[e.id] || fullEx;
                    const wasSwapped = !!swaps[e.id];
                    const pp = getSafeExerciseParams(fullEx, CURRENT_PHASE, injuries, injuries, assessment?.userAge, assessment?.fitnessLevel, getExerciseDisplayParams);
                    return (
                      <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", borderBottom: ei < day.exercises.length - 1 ? `1px solid ${C.border}` : "none" }}>
                        <ExerciseImage exercise={display} size="thumb" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, color: C.text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{display.name}</div>
                          <div style={{ fontSize: 9, color: C.textDim }}>{pp.sets || "2"} sets × {pp.reps || "12"}{pp.tempo ? ` · ${pp.tempo}` : ""} · {(fullEx.bodyPart || "").replace(/_/g, " ")}{pp.intensity ? ` · ${pp.intensity}` : ""}</div>
                          {pp._safeguarded && <div style={{ fontSize: 8, color: C.warning, marginTop: 1 }}>🛡️ {pp._reasons?.[0]}</div>}
                          {wasSwapped && <div style={{ fontSize: 8, color: C.warning }}>🔄 was {e.name}</div>}
                        </div>
                        <button onClick={() => setSwapTarget(fullEx)} style={{ width: 22, height: 22, borderRadius: 6, background: "transparent", border: "none", color: C.textDim, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: 0.5 }} title="Options">⋯</button>
                      </div>
                    );
                  })}
                  {/* Cooldown exercises */}
                  {(() => { const bps = new Set((day.exercises || []).map(e => { const f = exerciseDB.find(x => x.id === e.id); return f?.bodyPart; }).filter(Boolean)); const cd = exerciseDB.filter(e => e.category === "cooldown" && e.stretch_type === "static" && (e.phaseEligibility || []).includes(CURRENT_PHASE) && bps.has(e.bodyPart)).slice(0, 3); return cd.length > 0 ? <div style={{ marginTop: 6 }}><div style={{ fontSize: 9, fontWeight: 700, color: C.success, letterSpacing: 0.5, marginBottom: 2 }}>COOLDOWN</div>{cd.map((ce, ci) => <div key={ci} style={{ fontSize: 9, color: C.textDim, paddingLeft: 4 }}>{ce.name} · 30s hold</div>)}</div> : null; })()}
                  {day.muscleGroups?.length > 0 && <div style={{ display: "flex", gap: 3, marginTop: 4, flexWrap: "wrap" }}>
                    {day.muscleGroups.map(m => <span key={m} style={{ fontSize: 8, color: C.teal, background: C.tealBg, padding: "1px 4px", borderRadius: 3 }}>{m}</span>)}
                  </div>}
                </div>
            </Card>
          );
        }) : (
          /* Fallback if no weekly plan generated yet */
          <Card style={{ textAlign: "center", padding: 24 }}>
            <div style={{ fontSize: 14, color: C.textMuted }}>Weekly plan not generated yet. Start your first check-in to build your plan.</div>
          </Card>
        )}

        {/* Planned weekly volume from schedule */}
        {weekPlan && (() => {
          const planned = {};
          weekPlan.days.forEach(day => { if (day.type !== "rest") (day.exercises || []).forEach(e => { const full = exerciseDB.find(x => x.id === e.id) || e; const bp = (full.bodyPart || e.bodyPart || "other").replace(/_/g, " "); const pp = getExerciseDisplayParams(full, CURRENT_PHASE); const sets = parseInt(pp.sets) || 2; planned[bp] = (planned[bp] || 0) + sets; }); });
          const entries = Object.entries(planned).sort((a, b) => b[1] - a[1]);
          if (entries.length === 0) return null;
          return <Card>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: 1.5, marginBottom: 6 }}>PLANNED WEEKLY SETS (from schedule)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {entries.map(([bp, sets]) => <span key={bp} style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: C.tealBg, color: C.teal, border: `1px solid ${C.teal}20` }}>{bp}: {sets} sets</span>)}
            </div>
            <div style={{ fontSize: 8, color: C.textDim, marginTop: 4 }}>Total: {entries.reduce((s, [, v]) => s + v, 0)} sets across {entries.length} body parts</div>
          </Card>;
        })()}
        {/* Completed volume (actual) */}
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

      {/* ── TAB: MESOCYCLE — real tier/week progression ──────── */}
      {tab === "cycle" && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Tier info */}
        {tierInfo && <Card style={{ borderColor: (tierInfo.color || C.teal) + "40" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 24 }}>{tierInfo.icon || "💪"}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: tierInfo.color || C.teal }}>Tier {tierInfo.tier}: {tierInfo.name}</div>
              <div style={{ fontSize: 10, color: C.textMuted }}>{meso?.config?.message || ""}</div>
            </div>
          </div>
          {meso && <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.textDim, marginBottom: 4 }}>
              <span>Mesocycle Week {meso.currentWeek} of {meso.mesoLength}</span>
              <span>{meso.sessionsCompleted || 0} sessions completed</span>
            </div>
            <ProgressBar value={meso.currentWeek} max={meso.mesoLength} color={tierInfo.color || C.teal} height={6} />
          </div>}
        </Card>}

        {/* Week-by-week progression */}
        {meso && (() => {
          const progression = TIER_PROGRESSIONS[meso.tier];
          if (!progression) return null;
          return progression.weeks.map((week, i) => {
            const weekNum = i + 1;
            const isCurrent = weekNum === meso.currentWeek;
            const isPast = weekNum < meso.currentWeek;
            const isDeload = i === progression.weeks.length - 1;
            const sets = Array.isArray(week.sets) ? `${week.sets[0]}-${week.sets[1]}` : week.sets;
            return (
              <Card key={i} style={{ borderColor: isCurrent ? C.teal + "40" : C.border, opacity: isPast ? 0.6 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: isCurrent ? C.teal : isPast ? C.success : C.text }}>Week {weekNum}</span>
                    {isCurrent && <Badge color={C.teal}>CURRENT</Badge>}
                    {isPast && <Badge color={C.success}>DONE</Badge>}
                    {isDeload && <Badge color={C.info}>DELOAD</Badge>}
                  </div>
                  <span style={{ fontSize: 10, color: C.textDim }}>{sets} sets · RPE {week.rpeMin}-{week.rpeMax}</span>
                </div>
                <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>{week.label}</div>
                {isCurrent && <div style={{ fontSize: 9, color: C.teal, marginTop: 4 }}>
                  {progression.progressionRule} · {progression.warmupMinutes} min warm-up · Zone {progression.cardioZone} cardio
                </div>}
              </Card>
            );
          });
        })()}

        {!meso && <Card style={{ textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 14, color: C.textMuted }}>Mesocycle not initialized yet. Complete your first workout to begin.</div>
        </Card>}

        {/* Phase readiness */}
        {readiness && CURRENT_PHASE === 1 && <Card style={{ borderColor: C.info + "30" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.info, letterSpacing: 2 }}>PHASE 2 READINESS</div>
            <Badge color={readiness.ready ? C.success : C.info}>{readiness.metCount}/{readiness.totalCount}</Badge>
          </div>
          {readiness.checks?.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: i < readiness.checks.length - 1 ? `1px solid ${C.border}` : undefined }}>
              <span style={{ fontSize: 12, width: 20, textAlign: "center" }}>{c.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: c.met ? C.success : C.text }}>{c.label}</div>
                <div style={{ fontSize: 9, color: C.textDim }}>{c.current}</div>
              </div>
            </div>
          ))}
          {readiness.ready && <div style={{ marginTop: 8, padding: "6px 10px", background: C.success + "10", borderRadius: 6, fontSize: 10, color: C.success, fontWeight: 600 }}>All criteria met — ready for Phase 2!</div>}
        </Card>}
      </div>}

      {/* ── TAB: 12-MONTH ROADMAP ───────────────────────────── */}
      {tab === "roadmap" && (() => {
        const phases = [
          { num: 1, name: "Stabilization", weeks: [1,8], style: "1-3 sets · 12-20 reps · 4/2/1 tempo", unlocks: ["Core stability","Hip hinge competent"], criteria: "8+ sessions, no pain, core earned" },
          { num: 2, name: "Strength Endurance", weeks: [9,16], style: "2-4 sets · 8-12 reps · 2/0/2 tempo", unlocks: ["Barbell competent","Heavy loading ready"], criteria: "All injuries ≤2, barbell competent" },
          { num: 3, name: "Hypertrophy", weeks: [17,32], style: "3-5 sets · 6-12 reps · controlled", unlocks: ["Pull-up ready","Plyometric ready"], criteria: "Strength benchmarks met" },
          { num: 4, name: "Max Strength", weeks: [33,44], style: "3-5 sets · 4-6 reps · explosive", unlocks: ["Full exercise library","Power lifts"], criteria: "Heavy loading ready" },
          { num: 5, name: "Power", weeks: [45,52], style: "3-5 sets · 1-5 reps · max intent", unlocks: ["Olympic lifts","Advanced plyometrics"], criteria: "All Phase 4 criteria met" },
        ];
        const totalWeeks = 52;
        const currentWeek = tw.week || 1;
        return <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Progress bar */}
          <Card style={{ padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.textDim, marginBottom: 4 }}><span>Week {currentWeek} of {totalWeeks}</span><span>{Math.round(currentWeek / totalWeeks * 100)}%</span></div>
            <ProgressBar value={currentWeek} max={totalWeeks} color={C.teal} height={6} />
          </Card>
          {/* Bulk expand/collapse buttons */}
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => { const all = new Set(); for (let w = 1; w <= totalWeeks; w++) all.add(w); setExpandedWeeks(all); phases.forEach(ph => generatePhaseWeeks(ph)); }} style={{ flex: 1, padding: "6px", borderRadius: 8, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: C.bgElevated, border: `1px solid ${C.border}`, color: C.textMuted }}>Expand All</button>
            <button onClick={() => setExpandedWeeks(new Set())} style={{ flex: 1, padding: "6px", borderRadius: 8, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: C.bgElevated, border: `1px solid ${C.border}`, color: C.textMuted }}>Collapse All</button>
            <button onClick={() => { const cp = phases.find(ph => ph.num === CURRENT_PHASE); if (cp) { const s = new Set(expandedWeeks); for (let w = cp.weeks[0]; w <= cp.weeks[1]; w++) s.add(w); setExpandedWeeks(s); generatePhaseWeeks(cp); } }} style={{ flex: 1, padding: "6px", borderRadius: 8, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: C.tealBg, border: `1px solid ${C.teal}30`, color: C.teal }}>Expand Current Phase</button>
          </div>
          {/* Phase cards */}
          {phases.map(p => {
            const isCurrent = p.num === CURRENT_PHASE;
            const isPast = p.num < CURRENT_PHASE;
            const isFuture = p.num > CURRENT_PHASE;
            const phaseWeeks = [];
            for (let w = p.weeks[0]; w <= p.weeks[1]; w++) phaseWeeks.push(w);
            return <Card key={p.num} style={{ padding: 0, overflow: "hidden", borderColor: isCurrent ? C.teal + "40" : C.border, opacity: isFuture ? 0.7 : 1 }}>
              <div style={{ padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 12, background: isCurrent ? C.teal : isPast ? C.success : C.bgElevated, border: `2px solid ${isCurrent ? C.teal : isPast ? C.success : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: isCurrent || isPast ? "#000" : C.textDim }}>{isPast ? "✓" : p.num}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: isCurrent ? C.teal : C.text }}>Phase {p.num}: {p.name}</div>
                      <div style={{ fontSize: 10, color: C.textDim }}>Weeks {p.weeks[0]}-{p.weeks[1]} · {p.style}</div>
                    </div>
                  </div>
                  {isCurrent && <Badge color={C.teal}>CURRENT</Badge>}
                </div>
                {/* Week rows — tappable to expand and see exercises */}
                <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 8 }}>
                  {phaseWeeks.map(w => {
                    const isThisWeek = w === currentWeek;
                    const isDoneWeek = w < currentWeek;
                    const isDeload = w % 4 === 0;
                    const isExpanded = expandedWeeks.has(w);
                    const weekColor = isThisWeek ? C.teal : isDoneWeek ? C.success : C.textDim;
                    // For current week, use real plan data
                    const weekExercises = isThisWeek && weekPlan ? weekPlan.days : null;
                    // For past weeks, pull from session history
                    const pastSessions = isDoneWeek ? (sessions || []).filter(s => { try { const sd = new Date(s.date); const weekNum = Math.floor((sd - new Date(sessions[0]?.date || sd)) / (7 * 86400000)) + 1; return weekNum === w; } catch { return false; } }) : [];

                    // Toggle expand + generate exercises on demand
                    const handleExpandWeek = (weekNum) => {
                      setExpandedWeeks(prev => {
                        const next = new Set(prev);
                        if (next.has(weekNum)) next.delete(weekNum); else next.add(weekNum);
                        return next;
                      });
                      generateWeek(weekNum, p.num);
                    };

                    return <div key={w}>
                      <div onClick={() => handleExpandWeek(w)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px", cursor: "pointer", borderRadius: 6, background: isExpanded ? C.bgElevated : "transparent" }}>
                        <div style={{ width: 22, height: 22, borderRadius: 4, fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          background: isThisWeek ? C.teal : isDoneWeek ? C.success + "30" : isDeload ? C.info + "15" : C.bgElevated,
                          color: isThisWeek ? "#000" : weekColor, border: isThisWeek ? `1px solid ${C.teal}` : "none" }}>{w}</div>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 11, fontWeight: isThisWeek ? 700 : 500, color: weekColor }}>Week {w}</span>
                          {isDeload && <span style={{ fontSize: 8, color: C.info, marginLeft: 4 }}>DELOAD</span>}
                          {isThisWeek && <span style={{ fontSize: 8, color: C.teal, marginLeft: 4 }}>CURRENT</span>}
                        </div>
                        <span style={{ fontSize: 9, color: C.textDim, transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>▸</span>
                      </div>
                      {/* Expanded week detail — render from generated plan (ALL weeks use the same renderer) */}
                      {isExpanded && <div style={{ marginLeft: 30, paddingBottom: 6, borderLeft: `2px solid ${weekColor}20` }}>
                        {generating.has(w) ? (
                          <div style={{ padding: "8px", fontSize: 10, color: C.teal, textAlign: "center" }}>Generating exercises...</div>
                        ) : generatedWeeks[w]?.error ? (
                          <div style={{ padding: "4px 8px", fontSize: 9, color: C.danger }}>⚠ {generatedWeeks[w].message || "Generation failed"}</div>
                        ) : (() => {
                          // Use current week's real plan, or generated plan, in that order
                          const dayData = isThisWeek && weekExercises ? weekExercises : generatedWeeks[w]?.days;
                          if (!dayData) return <div style={{ padding: "4px 8px", fontSize: 9, color: C.textDim, fontStyle: "italic" }}>Click to generate plan</div>;
                          // Calculate weekly volume summary
                          const volSummary = {};
                          dayData.forEach(day => { if (day.type !== "rest") (day.exercises || []).forEach(e => { const full = exerciseDB.find(x => x.id === e.id) || e; const bp = (full.bodyPart || e.bodyPart || "other").replace(/_/g, " "); const pp = getExerciseDisplayParams(full, p.num); const sets = parseInt(pp.sets) || 2; volSummary[bp] = (volSummary[bp] || 0) + sets; }); });
                          // ── Inline verification: log what the UI will show ──
                          if ([21,37,47].includes(w)) {
                            const allEx = dayData.filter(d => d.type !== "rest").flatMap(d => (d.exercises || []).map(e => { const f = exerciseDB.find(x => x.id === e.id) || e; return { name: f.name, diff: f.difficultyLevel, bp: f.bodyPart, type: f.type, mp: f.movementPattern, pp: getExerciseDisplayParams(f, p.num) }; }));
                            const issues = [];
                            if (p.num >= 3 && allEx.some(e => e.name.includes("Wall Push"))) issues.push("Wall Push-Up in Phase " + p.num);
                            if (p.num >= 4 && allEx.some(e => e.name.includes("Goblet Squat"))) issues.push("Goblet Squat in Phase " + p.num);
                            allEx.forEach(e => {
                              if (e.bp === "core" && e.pp.reps?.includes("3-5")) issues.push(e.name + " has 3-5 reps");
                              if (e.name.includes("Plank") && !e.pp.reps?.includes("hold") && !e.pp.reps?.includes("s")) issues.push(e.name + " not timed hold");
                            });
                            if (p.num >= 3 && !allEx.some(e => e.mp === "isolation")) issues.push("Zero isolation exercises");
                            if (p.num === 5 && !allEx.some(e => e.type === "plyometric")) issues.push("Zero plyometrics");
                            const names = allEx.map(e => e.name);
                            const dupes = names.filter((n,i) => names.indexOf(n) !== i);
                            if (dupes.length) issues.push("Repeats: " + [...new Set(dupes)].join(", "));
                            console.log("[PLANVIEW " + (issues.length ? "FAIL" : "PASS") + "] Wk" + w + " Ph" + p.num, issues.length ? issues.join(" | ") : "all checks pass");
                          }
                          const _trainingDays = dayData.filter(day => day.type !== "rest");
                          return <>
                            {_trainingDays.map((day, di) => (
                              <div key={di} style={{ padding: "4px 0 4px 8px", borderBottom: di < _trainingDays.length - 1 ? `1px solid ${C.border}` : "none" }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: day.status === "completed" ? C.success : C.text }}>{day.dayName} — {day.label} {day.status === "completed" ? "✅" : ""}{day.muscleGroups?.length > 0 ? ` (${day.muscleGroups.join(", ")})` : ""}</div>
                                {(() => {
                                  // Get body parts trained today for warmup/cooldown targeting
                                  const trainedBps = new Set((day.exercises || []).map(e => { const f = exerciseDB.find(x => x.id === e.id); return f?.bodyPart; }).filter(Boolean));
                                  // Generate warmup: foam roll + mobility for trained areas
                                  const warmup = exerciseDB.filter(e => (e.category === "foam_roll" || (e.category === "warmup" && e.type === "mobility")) && (e.phaseEligibility || []).includes(p.num) && trainedBps.has(e.bodyPart)).slice(0, 4);
                                  // Generate cooldown: static stretches for trained areas
                                  const cooldown = exerciseDB.filter(e => e.category === "cooldown" && e.stretch_type === "static" && (e.phaseEligibility || []).includes(p.num) && trainedBps.has(e.bodyPart)).slice(0, 3);
                                  return <>
                                    {/* Warmup */}
                                    {warmup.length > 0 && <div style={{ paddingLeft: 8, marginTop: 2 }}>
                                      <div style={{ fontSize: 8, fontWeight: 700, color: C.info, letterSpacing: 0.5, marginBottom: 1 }}>WARM-UP</div>
                                      {warmup.map((we, wi) => <div key={wi} style={{ fontSize: 8, color: C.textDim, padding: "0 0 0 4px" }}>{we.name}</div>)}
                                    </div>}
                                    {/* Main exercises */}
                                    <div style={{ paddingLeft: 8, marginTop: 2 }}>
                                      <div style={{ fontSize: 8, fontWeight: 700, color: C.teal, letterSpacing: 0.5, marginBottom: 1 }}>MAIN</div>
                                      {(day.exercises || []).map((e, ei) => {
                                        const full = exerciseDB.find(x => x.id === e.id) || e;
                                        const pp = getSafeExerciseParams(full, p.num, injuries, injuries, assessment?.userAge, assessment?.fitnessLevel, getExerciseDisplayParams);
                                        return <div key={ei} style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.textMuted, padding: "1px 0", paddingLeft: 4 }}>
                                          <span>{ei + 1}. {full.name} <span style={{ color: C.textDim }}>({(full.bodyPart || e.bodyPart || "").replace(/_/g, " ")})</span>{pp._safeguarded && <span style={{ color: C.warning, marginLeft: 3 }} title={pp._reasons?.[0]}>🛡️</span>}</span>
                                          <span style={{ color: C.textDim, flexShrink: 0, marginLeft: 4 }}>{pp.sets || "2"}×{pp.reps || "12"}</span>
                                        </div>;
                                      })}
                                    </div>
                                    {/* Cooldown */}
                                    {cooldown.length > 0 && <div style={{ paddingLeft: 8, marginTop: 2 }}>
                                      <div style={{ fontSize: 8, fontWeight: 700, color: C.success, letterSpacing: 0.5, marginBottom: 1 }}>COOLDOWN</div>
                                      {cooldown.map((ce, ci) => <div key={ci} style={{ fontSize: 8, color: C.textDim, padding: "0 0 0 4px" }}>{ce.name} · 30s</div>)}
                                    </div>}
                                  </>;
                                })()}
                              </div>
                            ))}
                            {/* Weekly volume summary */}
                            {Object.keys(volSummary).length > 0 && <div style={{ padding: "6px 8px", marginTop: 4, background: C.bgGlass, borderRadius: 6 }}>
                              <div style={{ fontSize: 8, fontWeight: 700, color: C.textDim, letterSpacing: 1, marginBottom: 3 }}>WEEKLY SETS</div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {Object.entries(volSummary).sort((a, b) => b[1] - a[1]).map(([bp, sets]) => <span key={bp} style={{ fontSize: 8, padding: "1px 5px", borderRadius: 3, background: C.tealBg, color: C.teal }}>{bp}: {sets}</span>)}
                              </div>
                            </div>}
                          </>;
                        })()}
                      </div>}
                    </div>;
                  })}
                </div>
                {/* Unlocks */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 6 }}>
                  {p.unlocks.map(u => <span key={u} style={{ fontSize: 8, padding: "2px 5px", borderRadius: 4, background: isPast ? C.success + "15" : C.bgElevated, color: isPast ? C.success : C.textDim }}>{isPast ? "✓ " : ""}{u}</span>)}
                </div>
                {isFuture && <div style={{ fontSize: 8, color: C.textDim, marginTop: 4 }}>Requires: {p.criteria}</div>}
              </div>
              {/* Phase transition */}
              {isCurrent && readiness && <div style={{ padding: "8px 14px", borderTop: `1px solid ${C.border}`, background: C.bgGlass }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.info, letterSpacing: 1, marginBottom: 4 }}>PHASE {CURRENT_PHASE + 1} READINESS</div>
                {readiness.checks?.slice(0, 4).map((c, j) => <div key={j} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: c.met ? C.success : C.textMuted, padding: "1px 0" }}><span>{c.met ? "✅" : "⬜"}</span>{c.label}</div>)}
                <div style={{ fontSize: 8, color: C.teal, marginTop: 4 }}>{readiness.metCount}/{readiness.totalCount} criteria met</div>
              </div>}
            </Card>;
          })}
          <Card style={{ background: C.bgGlass, padding: 12 }}>
            <div style={{ fontSize: 10, color: C.textDim, fontStyle: "italic" }}>This plan adapts every session. Phase advancement is criteria-based, not time-based. Projected timelines may shift based on your progress.</div>
          </Card>
        </div>;
      })()}

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

      {swapTarget && <SwapModal
        exercise={swapTarget}
        phase={CURRENT_PHASE}
        location="gym"
        excludeIds={new Set(weekPlan?.days?.flatMap(d => (d.exercises || []).map(e => e.id)) || [])}
        onClose={() => setSwapTarget(null)}
        onSwap={(alt) => {
          setSwaps(prev => ({ ...prev, [swapTarget.id]: { ...alt, _swappedFor: swapTarget.name } }));
          setSwapTarget(null);
        }}
      />}
      <div style={{ height: 90 }} />
    </div>
  );
}
