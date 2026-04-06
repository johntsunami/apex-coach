// ═══════════════════════════════════════════════════════════════
// APEX Coach — Wellness & Self-Regulation Module
// Evidence-informed stress management, breathing, mindfulness,
// DBT/ACT skills, sleep wind-down, recovery protocols.
// NOT crisis care or therapy replacement.
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react";

const C={bg:"#060b18",bgCard:"#0d1425",bgElevated:"#162040",bgGlass:"rgba(255,255,255,0.04)",border:"rgba(255,255,255,0.08)",text:"#e8ecf4",textMuted:"#7a8ba8",textDim:"#4a5a78",teal:"#00d2c8",tealDark:"#00a89f",tealBg:"rgba(0,210,200,0.08)",success:"#22c55e",danger:"#ef4444",warning:"#eab308",info:"#3b82f6",orange:"#f97316",purple:"#a855f7"};
const Card=({children,style,onClick})=><div onClick={onClick} style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:14,padding:14,cursor:onClick?"pointer":"default",...style}}>{children}</div>;

const LS_WELLNESS = "apex_wellness_sessions";
const LS_DISCLAIMER = "apex_wellness_disclaimer_ack";

// ── Wellness session logging ────────────────────────────────────

function logWellnessSession(data) {
  try {
    const sessions = JSON.parse(localStorage.getItem(LS_WELLNESS) || "[]");
    sessions.push({ ...data, id: `ws_${Date.now()}`, completedAt: new Date().toISOString() });
    while (sessions.length > 100) sessions.shift();
    localStorage.setItem(LS_WELLNESS, JSON.stringify(sessions));
  } catch {}
}

function getWellnessSessions() {
  try { return JSON.parse(localStorage.getItem(LS_WELLNESS) || "[]"); } catch { return []; }
}

function getWellnessStats() {
  const sessions = getWellnessSessions();
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeek = sessions.filter(s => new Date(s.completedAt) >= weekAgo);
  const totalMin = Math.round(sessions.reduce((s, w) => s + (w.durationSeconds || 0), 0) / 60);
  const weekMin = Math.round(thisWeek.reduce((s, w) => s + (w.durationSeconds || 0), 0) / 60);
  // Streak
  let streak = 0; const today = new Date().toISOString().split("T")[0];
  const dates = [...new Set(sessions.map(s => s.completedAt?.split("T")[0]).filter(Boolean))].sort().reverse();
  let d = new Date();
  while (true) {
    const key = d.toISOString().split("T")[0];
    if (dates.includes(key)) { streak++; d.setDate(d.getDate() - 1); }
    else if (key === today) { d.setDate(d.getDate() - 1); }
    else break;
  }
  return { thisWeek: thisWeek.length, streak, totalMin, weekMin, total: sessions.length };
}

// ═══════════════════════════════════════════════════════════════
// TECHNIQUE DATABASE
// ═══════════════════════════════════════════════════════════════

const CATEGORIES = [
  { id: "breathing", label: "Breathing & Downregulation", icon: "🌬️", sub: "Paced breathing, sighs, box breath", effort: "Very Easy" },
  { id: "mindfulness", label: "Mindfulness & Meditation", icon: "🧘", sub: "Body scan, focused attention, metta", effort: "Easy" },
  { id: "quick", label: "Quick Stress Reset", icon: "⚡", sub: "1-5 min resets for right now", effort: "Very Easy" },
  { id: "sleep", label: "Sleep Wind-Down", icon: "🌙", sub: "Gentle tools for better sleep", effort: "Very Easy" },
  { id: "dbt_act", label: "DBT / ACT Skills", icon: "🧠", sub: "STOP, grounding, defusion, values", effort: "Moderate" },
  { id: "recovery", label: "Recovery & Focus Protocols", icon: "🔄", sub: "Pre/post training, midday reset", effort: "Easy" },
];

const TECHNIQUES = [
  // ── BREATHING (Tier 1 — default/first-line) ──
  { id: "paced_breathing", name: "Paced Breathing", category: "breathing", tier: 1, durations: [2,3,5,10], defaultDuration: 3, bestFor: ["stress","recovery","pre-workout"],
    desc: "May help you feel calmer and more settled. Works best with regular use.", phases: [{label:"INHALE",seconds:4},{label:"EXHALE",seconds:6}], icon: "🌬️" },
  { id: "diaphragmatic", name: "Diaphragmatic Breathing", category: "breathing", tier: 1, durations: [3,5], defaultDuration: 3, bestFor: ["calm","recovery","grounding"],
    desc: "A foundational breathing style that may support relaxation and body awareness.", phases: [{label:"INHALE",seconds:4},{label:"EXHALE",seconds:5}], icon: "🫁" },
  { id: "physiological_sigh", name: "Physiological Sigh", category: "breathing", tier: 1, durations: [1,2], defaultDuration: 1, bestFor: ["acute stress","quick reset"],
    desc: "A quick breathing reset many people find helpful when stress spikes.", phases: [{label:"INHALE",seconds:3},{label:"SNIFF",seconds:1},{label:"EXHALE",seconds:6}], icon: "😮‍💨", rounds: 5 },
  { id: "pursed_lip", name: "Pursed Lip Breathing", category: "breathing", tier: 1, durations: [2,3], defaultDuration: 2, bestFor: ["breathlessness","post-exertion"],
    desc: "Slows breathing rate and may help with post-exertion recovery.", phases: [{label:"INHALE",seconds:2},{label:"EXHALE",seconds:4}], icon: "💨" },
  // ── BREATHING (Tier 2) ──
  { id: "box_breathing", name: "Box Breathing", category: "breathing", tier: 2, durations: [2,4,6], defaultDuration: 4, bestFor: ["focus","moderate stress"],
    desc: "A structured breathing pattern commonly used as a focus and regulation exercise.", phases: [{label:"INHALE",seconds:4},{label:"HOLD",seconds:4},{label:"EXHALE",seconds:4},{label:"HOLD",seconds:4}], icon: "📦" },
  { id: "coherence", name: "Coherence Breathing", category: "breathing", tier: 2, durations: [5,10], defaultDuration: 5, bestFor: ["sustained calm","recovery"],
    desc: "Often used to support a calm, settled state. Works best with 5+ minute sessions.", phases: [{label:"INHALE",seconds:5},{label:"EXHALE",seconds:5}], icon: "🌊" },
  { id: "four_six", name: "4-6 Relaxation Breathing", category: "breathing", tier: 2, durations: [3,5], defaultDuration: 5, bestFor: ["sleep","racing mind"],
    desc: "A gentle breathing pattern many find helpful before bed.", phases: [{label:"INHALE",seconds:4},{label:"EXHALE",seconds:6}], icon: "🌙" },
  // ── MINDFULNESS ──
  { id: "breathing_space", name: "3-Minute Breathing Space", category: "mindfulness", tier: 1, durations: [3], defaultDuration: 3, bestFor: ["transitions","stress reset"],
    desc: "A brief mindfulness check-in. Notice, narrow, widen.", icon: "🕐",
    steps: ["Notice what is here right now. Thoughts, feelings, sensations.","Narrow attention to your breath. Just breathing.","Widen to your full body and surroundings. You are here."] },
  { id: "body_scan", name: "Body Scan", category: "mindfulness", tier: 1, durations: [5,10,15], defaultDuration: 10, bestFor: ["stress","sleep prep","pain"],
    desc: "Gentle attention through body regions. Observe without judgment.", icon: "🧘" },
  { id: "focused_attention", name: "Focused Attention", category: "mindfulness", tier: 1, durations: [5,10,20], defaultDuration: 5, bestFor: ["ADHD","focus","clarity"],
    desc: "Rest attention on breath. When the mind wanders — gently return. The return IS the practice.", icon: "🎯" },
  { id: "visualization", name: "Performance Visualization", category: "mindfulness", tier: 2, durations: [5,10], defaultDuration: 5, bestFor: ["confidence","pre-competition"],
    desc: "Mental rehearsal can support focus and confidence as part of a broader preparation approach.", icon: "🏆" },
  // ── QUICK STRESS RESET ──
  { id: "q_sigh", name: "Physiological Sigh × 3", category: "quick", tier: 1, durations: [1], defaultDuration: 1, bestFor: ["acute stress"], desc: "3 quick sighs for immediate reset.", icon: "⚡", rounds: 3 },
  { id: "q_grounding", name: "5-4-3-2-1 Grounding", category: "quick", tier: 1, durations: [3], defaultDuration: 3, bestFor: ["overwhelm","panic","dissociation"],
    desc: "Sensory grounding to bring you back to the present moment.", icon: "🌍",
    steps: ["Name 5 things you can SEE","Name 4 things you can TOUCH","Name 3 things you can HEAR","Name 2 things you like to SMELL","Name 1 thing you can TASTE"] },
  { id: "q_stop", name: "STOP Skill", category: "quick", tier: 1, durations: [2], defaultDuration: 2, bestFor: ["impulse control","emotional reaction"],
    desc: "Pause before acting. DBT-inspired skill.", icon: "🛑",
    steps: ["STOP — Do not act. Pause.","TAKE A STEP BACK — Breathe. Remove yourself briefly.","OBSERVE — What am I feeling? What is happening?","PROCEED MINDFULLY — What action fits my values right now?"] },
  { id: "q_posture", name: "1-Minute Posture Reset", category: "quick", tier: 1, durations: [1], defaultDuration: 1, bestFor: ["quick centering"],
    desc: "Stand or sit tall. Slow exhale. Relax jaw and shoulders. Feel feet grounded.", icon: "📐" },
  { id: "q_pmr_short", name: "PMR Short", category: "quick", tier: 1, durations: [5], defaultDuration: 5, bestFor: ["tension","stress"],
    desc: "Brief progressive muscle relaxation — tense and release major muscle groups.", icon: "💪" },
  // ── SLEEP ──
  { id: "s_four_six", name: "4-6 Sleep Breathing", category: "sleep", tier: 1, durations: [5], defaultDuration: 5, bestFor: ["sleep"], desc: "Default bedtime breathing. Gentle and effective.", icon: "🌙",
    phases: [{label:"INHALE",seconds:4},{label:"EXHALE",seconds:6}] },
  { id: "s_pmr", name: "Progressive Muscle Relaxation", category: "sleep", tier: 1, durations: [10,15], defaultDuration: 10, bestFor: ["sleep","tension"],
    desc: "Systematic tension-release from feet to face. A well-studied relaxation method.", icon: "😴" },
  { id: "s_body_scan", name: "Body Scan for Sleep", category: "sleep", tier: 1, durations: [10,20], defaultDuration: 15, bestFor: ["sleep"],
    desc: "Extended body scan with slow pacing. Screen dims at end.", icon: "🛏️" },
  { id: "s_brain_dump", name: "Brain Dump / Worry Offload", category: "sleep", tier: 1, durations: [3], defaultDuration: 3, bestFor: ["racing mind","sleep"],
    desc: "Write out what's on your mind to close the mental loop before sleep.", icon: "📝",
    steps: ["What is on your mind right now?","What can wait until tomorrow?","What is one small next step?"] },
  // ── DBT / ACT ──
  { id: "dbt_stop", name: "STOP Skill", category: "dbt_act", tier: 1, durations: [2], defaultDuration: 2, bestFor: ["impulse control","emotional reaction"],
    desc: "DBT skill for pausing before acting on impulse.", icon: "🛑",
    steps: ["S — STOP: Do not act. Pause.","T — TAKE A STEP BACK: Breathe. Remove yourself briefly.","O — OBSERVE: What am I feeling? What is happening? What do I actually want here?","P — PROCEED MINDFULLY: What action fits my values and goals right now?"] },
  { id: "dbt_tipp", name: "TIPP (Emotion Regulation)", category: "dbt_act", tier: 1, durations: [5], defaultDuration: 5, bestFor: ["high emotion","overwhelm"],
    desc: "DBT skill combining temperature, movement, breathing, and relaxation.", icon: "🧊",
    steps: ["TEMPERATURE: Splash cold water on your face or hold something cold briefly.","INTENSE MOVEMENT: 30 seconds of brisk movement to discharge tension.","PACED BREATHING: Inhale 4 / Exhale 6. 10 rounds.","PAIRED MUSCLE RELAXATION: Tense whole body on inhale, release on exhale. 5 rounds."] },
  { id: "act_defusion", name: "Leaves on a Stream", category: "dbt_act", tier: 1, durations: [3,5], defaultDuration: 3, bestFor: ["negative self-talk","fear"],
    desc: "ACT defusion technique. Place each thought on a leaf and watch it float by.", icon: "🍃" },
  { id: "act_values", name: "Values Check", category: "dbt_act", tier: 1, durations: [2], defaultDuration: 2, bestFor: ["motivation","avoidance"],
    desc: "What matters to you in the next 10 minutes?", icon: "🎯" },
  // ── RECOVERY PROTOCOLS ──
  { id: "r_pre_training", name: "Pre-Training Reset", category: "recovery", tier: 1, durations: [5], defaultDuration: 5, bestFor: ["pre-workout","focus"],
    desc: "Breathing, intention, imagery, and posture reset before training.", icon: "🏋️",
    steps: ["1 min — Physiological sigh or paced breathing","1 min — Set one intention: What am I here to do today?","2 min — Brief performance imagery","1 min — Posture reset + movement prep"] },
  { id: "r_post_training", name: "Post-Training Downshift", category: "recovery", tier: 1, durations: [5], defaultDuration: 5, bestFor: ["recovery","post-workout"],
    desc: "Slow breathing, body scan, and reflection after training.", icon: "🧘",
    steps: ["2 min — Slow paced breathing","2 min — Brief body scan","1 min — How does your body feel? One thing that went well?"] },
  { id: "r_midday", name: "Midday Reset", category: "recovery", tier: 1, durations: [5], defaultDuration: 5, bestFor: ["focus","afternoon"],
    desc: "Brief reset for energy and focus midday.", icon: "☀️",
    steps: ["2 min — Paced breathing","1 min — Eyes-open mindful moment","1 min — Stand or walk briefly","1 min — What matters this afternoon?"] },
];

// ═══════════════════════════════════════════════════════════════
// STRESS CARD (injected on Home screen when stress >= 7)
// ═══════════════════════════════════════════════════════════════

export function StressResetCard({ stressLevel, onStartTechnique, onSkip, onWellness }) {
  if (!stressLevel || stressLevel < 7) return null;
  const isVeryHigh = stressLevel >= 9;
  const techniques = isVeryHigh
    ? [{ id: "q_grounding", name: "5-4-3-2-1 Grounding", time: "3 min" }, { id: "paced_breathing", name: "Paced Breathing + Temperature", time: "4 min" }, { id: "q_pmr_short", name: "Progressive Muscle Relaxation", time: "5 min" }]
    : [{ id: "physiological_sigh", name: "Physiological Sigh", time: "1 min" }, { id: "paced_breathing", name: "Paced Breathing", time: "3 min" }, { id: "q_stop", name: "STOP Skill", time: "2 min" }];

  return (
    <Card style={{ borderColor: (isVeryHigh ? C.danger : C.warning) + "40", background: (isVeryHigh ? C.danger : C.warning) + "06", marginBottom: 8 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: isVeryHigh ? C.danger : C.warning, marginBottom: 4 }}>{isVeryHigh ? "Very high stress today" : "High stress today"}</div>
      <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5, marginBottom: 10 }}>{isVeryHigh ? "Take a few minutes before training. If you feel unsafe or overwhelmed, skip today and use support resources." : "A short reset before training may help with focus and effort quality. Takes 1-5 min."}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
        {techniques.map(t => <button key={t.id} onClick={() => onStartTechnique?.(t.id)} style={{ padding: "8px 12px", borderRadius: 8, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textAlign: "left", display: "flex", justifyContent: "space-between" }}><span>{t.name}</span><span style={{ color: C.textDim }}>{t.time}</span></button>)}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={onSkip} style={{ flex: 1, padding: "8px", borderRadius: 8, background: "transparent", border: `1px solid ${C.border}`, color: C.textDim, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Skip and train</button>
        <button onClick={onWellness} style={{ flex: 1, padding: "8px", borderRadius: 8, background: C.tealBg, border: `1px solid ${C.teal}30`, color: C.teal, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>More options</button>
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// TECHNIQUE PLAYER (shared across all sessions)
// ═══════════════════════════════════════════════════════════════

function TechniquePlayer({ technique, onClose, onComplete }) {
  const [phase, setPhase] = useState(0);
  const [timer, setTimer] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [round, setRound] = useState(1);
  const [done, setDone] = useState(false);
  const [stressAfter, setStressAfter] = useState(null);
  const totalDuration = (technique.defaultDuration || 3) * 60;
  const phases = technique.phases || [];
  const steps = technique.steps || [];
  const maxRounds = technique.rounds || 999;
  const intervalRef = useRef(null);
  const reducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  useEffect(() => {
    if (paused || done) return;
    intervalRef.current = setInterval(() => {
      setTotalElapsed(prev => {
        if (prev + 1 >= totalDuration) { setDone(true); clearInterval(intervalRef.current); return totalDuration; }
        return prev + 1;
      });
      if (phases.length > 0) {
        setTimer(prev => {
          const currentPhase = phases[phase % phases.length];
          if (prev + 1 >= currentPhase.seconds) {
            setPhase(p => {
              const next = p + 1;
              if (next % phases.length === 0) { setRound(r => { if (r >= maxRounds) { setDone(true); clearInterval(intervalRef.current); } return r + 1; }); }
              return next;
            });
            return 0;
          }
          return prev + 1;
        });
      }
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [paused, done, phase, phases, totalDuration, maxRounds]);

  const handleComplete = () => {
    logWellnessSession({ techniqueId: technique.id, category: technique.category, durationSeconds: totalElapsed, stressAfter, completionStatus: "completed" });
    onComplete?.();
  };

  if (done) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "20px 0" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>✨</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Done — {Math.round(totalElapsed / 60)} minutes</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>{technique.name}</div>
        </div>
        <Card style={{ padding: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>How do you feel now?</div>
          <div style={{ display: "flex", gap: 4 }}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => <button key={n} onClick={() => setStressAfter(n)} style={{ flex: 1, padding: "8px 0", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              background: stressAfter === n ? C.teal + "20" : "transparent", border: `1px solid ${stressAfter === n ? C.teal : C.border}`, color: stressAfter === n ? C.teal : C.textDim }}>{n}</button>)}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.textDim, marginTop: 2 }}><span>Calm</span><span>Stressed</span></div>
        </Card>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleComplete} style={{ flex: 1, padding: "12px", borderRadius: 12, background: `linear-gradient(135deg,${C.teal},${C.tealDark})`, border: "none", color: "#000", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Done</button>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: 12, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.textMuted, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Close</button>
        </div>
      </div>
    );
  }

  const currentPhase = phases.length > 0 ? phases[phase % phases.length] : null;
  const currentStep = steps.length > 0 ? steps[Math.min(Math.floor(totalElapsed / (totalDuration / steps.length)), steps.length - 1)] : null;
  const phasePct = currentPhase ? (timer / currentPhase.seconds) * 100 : (totalElapsed / totalDuration) * 100;
  const breathSize = currentPhase?.label === "INHALE" || currentPhase?.label === "SNIFF" ? 60 + (phasePct * 0.4) : currentPhase?.label === "EXHALE" ? 100 - (phasePct * 0.4) : 80;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{technique.name}</div><div style={{ fontSize: 11, color: C.textDim }}>{technique.category.replace("_", " / ").toUpperCase()}</div></div>
        <button onClick={() => { logWellnessSession({ techniqueId: technique.id, category: technique.category, durationSeconds: totalElapsed, completionStatus: "exited_early" }); onClose(); }}
          style={{ padding: "6px 12px", borderRadius: 8, background: C.danger + "15", border: `1px solid ${C.danger}30`, color: C.danger, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Stop</button>
      </div>
      {/* Progress bar */}
      <div style={{ width: "100%", height: 4, background: C.border, borderRadius: 2 }}><div style={{ width: `${(totalElapsed / totalDuration) * 100}%`, height: "100%", background: C.teal, borderRadius: 2, transition: "width 1s linear" }} /></div>
      {/* Breathing circle */}
      {currentPhase && <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
        <div style={{ width: reducedMotion ? 80 : breathSize, height: reducedMotion ? 80 : breathSize, borderRadius: "50%", border: `3px solid ${C.teal}60`, background: C.tealBg, display: "flex", alignItems: "center", justifyContent: "center", transition: reducedMotion ? "none" : "width 1s ease, height 1s ease", flexDirection: "column" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.teal, letterSpacing: 2 }}>{currentPhase.label}</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif" }}>{currentPhase.seconds - timer}</div>
        </div>
      </div>}
      {/* Step-based display */}
      {currentStep && !currentPhase && <Card style={{ textAlign: "center", padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: C.text, lineHeight: 1.6 }}>{currentStep}</div>
      </Card>}
      {/* Round counter */}
      {phases.length > 0 && <div style={{ textAlign: "center", fontSize: 12, color: C.textDim }}>Round {round}{maxRounds < 999 ? ` of ${maxRounds}` : ""} · {Math.round(totalElapsed)}s elapsed</div>}
      {/* Controls */}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setPaused(p => !p)} style={{ flex: 1, padding: "10px", borderRadius: 10, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{paused ? "Resume" : "Pause"}</button>
        <button onClick={() => { setPhase(0); setTimer(0); setTotalElapsed(0); setRound(1); setDone(false); }} style={{ padding: "10px 16px", borderRadius: 10, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.textDim, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Restart</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN WELLNESS SCREEN
// ═══════════════════════════════════════════════════════════════

export default function WellnessScreen() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeTechnique, setActiveTechnique] = useState(null);
  const [showDisclaimer, setShowDisclaimer] = useState(!localStorage.getItem(LS_DISCLAIMER));
  const stats = getWellnessStats();

  // Disclaimer gate
  if (showDisclaimer) {
    return (
      <div className="fade-in safe-bottom" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>WELLNESS</div>
        <Card style={{ borderColor: C.info + "30" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.info, marginBottom: 8 }}>Before you start</div>
          <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.7 }}>
            These tools support general stress regulation and recovery. They are not a substitute for professional medical or mental health care.
            {"\n\n"}Some relaxation practices can occasionally increase anxiety or produce uncomfortable sensations in some people — if that happens, stop and try a different option.
          </div>
          <button onClick={() => { localStorage.setItem(LS_DISCLAIMER, "1"); setShowDisclaimer(false); }} style={{ width: "100%", marginTop: 12, padding: "12px", borderRadius: 12, background: `linear-gradient(135deg,${C.teal},${C.tealDark})`, border: "none", color: "#000", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>I understand</button>
        </Card>
      </div>
    );
  }

  // Active technique player
  if (activeTechnique) {
    const tech = TECHNIQUES.find(t => t.id === activeTechnique);
    if (tech) return (
      <div className="fade-in safe-bottom" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <TechniquePlayer technique={tech} onClose={() => setActiveTechnique(null)} onComplete={() => setActiveTechnique(null)} />
      </div>
    );
  }

  // Category detail view
  if (selectedCategory) {
    const cat = CATEGORIES.find(c => c.id === selectedCategory);
    const techs = TECHNIQUES.filter(t => t.category === selectedCategory);
    return (
      <div className="fade-in safe-bottom" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>{cat?.icon} {cat?.label?.toUpperCase()}</div></div>
          <button onClick={() => setSelectedCategory(null)} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
        </div>
        {selectedCategory === "sleep" && <div style={{ fontSize: 11, color: C.textDim, lineHeight: 1.5, padding: "6px 10px", background: C.bgGlass, borderRadius: 8 }}>Relaxation practices can help with general sleep quality. For persistent insomnia, CBT-I is the evidence-based first-line treatment.</div>}
        {techs.map(t => (
          <Card key={t.id} onClick={() => setActiveTechnique(t.id)} style={{ cursor: "pointer", padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 22 }}>{t.icon || cat?.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{t.name}</div>
                <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.4, marginTop: 2 }}>{t.desc}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: C.tealBg, color: C.teal }}>{t.defaultDuration} min</span>
                  {t.bestFor?.slice(0, 2).map(b => <span key={b} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: C.bgElevated, color: C.textDim }}>{b}</span>)}
                </div>
              </div>
              <span style={{ color: C.textDim, fontSize: 14 }}>→</span>
            </div>
          </Card>
        ))}
        <div style={{ height: 60 }} />
      </div>
    );
  }

  // Hub view
  return (
    <div className="fade-in safe-bottom" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>WELLNESS</div>
      <div style={{ fontSize: 13, color: C.textMuted }}>Stress management, breathing, mindfulness, and recovery tools.</div>
      {/* Stats bar */}
      {stats.total > 0 && <div style={{ display: "flex", gap: 8 }}>
        {[{ v: stats.thisWeek, l: "This Week" }, { v: stats.streak, l: "Streak" }, { v: `${stats.weekMin}m`, l: "Minutes" }].map(s => (
          <Card key={s.l} style={{ flex: 1, textAlign: "center", padding: 10 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.teal, fontFamily: "'Bebas Neue',sans-serif" }}>{s.v}</div>
            <div style={{ fontSize: 9, color: C.textDim, letterSpacing: 1 }}>{s.l}</div>
          </Card>
        ))}
      </div>}
      {/* Category cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {CATEGORIES.map(cat => (
          <Card key={cat.id} onClick={() => setSelectedCategory(cat.id)} style={{ cursor: "pointer", padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 28 }}>{cat.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{cat.label}</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>{cat.sub}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <span style={{ fontSize: 10, color: C.textDim }}>{cat.effort}</span>
                <span style={{ fontSize: 10, color: C.teal }}>{TECHNIQUES.filter(t => t.category === cat.id).length} tools</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div style={{ height: 60 }} />
    </div>
  );
}

// Export technique launcher for use from Home screen stress card
export function launchTechnique(id) {
  return TECHNIQUES.find(t => t.id === id) || null;
}
