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
// CONCENTRIC CIRCLE BREATHING ANIMATION
// Pure CSS + JS. Rings expand on inhale, contract on exhale.
// ═══════════════════════════════════════════════════════════════

const RING_COLORS = ["#7EC8C8","#6BA8C4","#7B9EC8","#8F8DC8","#A08EC4","#B08DB8"];
const PHASE_COLORS = { INHALE: "#7EC8C8", SNIFF: "#7EC8C8", HOLD: "#C8C87E", EXHALE: "#8FB8C8", REST: "#A0B8A0" };

function ConcentricBreathAnimation({ phaseLabel, phaseSeconds, elapsedInPhase, reducedMotion }) {
  if (reducedMotion) {
    const label = phaseLabel === "INHALE" || phaseLabel === "SNIFF" ? "▲ Expanding" : phaseLabel === "EXHALE" ? "▼ Releasing" : phaseLabel === "HOLD" ? "◆ Holding" : "◇ Rest";
    return <div style={{ textAlign: "center", padding: "40px 0" }}><div style={{ fontSize: 24, fontWeight: 300, color: PHASE_COLORS[phaseLabel] || C.textMuted, letterSpacing: 4 }}>{label}</div></div>;
  }

  const maxRings = Math.min(5, Math.max(1, phaseSeconds - 1));
  const sec = Math.floor(elapsedInPhase);
  const isInhale = phaseLabel === "INHALE" || phaseLabel === "SNIFF";
  const isExhale = phaseLabel === "EXHALE";
  const isHoldFull = phaseLabel === "HOLD" && maxRings > 1;
  const isRest = phaseLabel === "REST";
  const coreR = 48;
  const ringStep = 22;
  const gap = 8;

  // Calculate visible rings
  let visibleRings;
  if (isInhale) visibleRings = Math.min(maxRings, sec + 1);
  else if (isExhale) visibleRings = Math.max(0, maxRings - sec);
  else if (isHoldFull) visibleRings = maxRings;
  else visibleRings = 0;

  // Core scale
  const coreScale = isExhale && visibleRings === 0 ? 0.94 + Math.sin(Date.now() / 2000) * 0.03 : isRest ? 0.92 : 1;
  const holdPulse = isHoldFull ? 1 + Math.sin(Date.now() / 1500) * 0.02 : 1;

  const totalSize = (coreR + (maxRings + 1) * (ringStep + gap)) * 2;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0", background: "radial-gradient(circle, rgba(126,200,200,0.04) 0%, transparent 70%)" }}>
      <div style={{ position: "relative", width: totalSize, height: totalSize, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Rings (outermost to innermost for z-order) */}
        {Array.from({ length: maxRings }, (_, i) => {
          const ringIdx = maxRings - 1 - i; // reverse for rendering order
          const r = coreR + (ringIdx + 1) * (ringStep + gap);
          const visible = ringIdx < visibleRings;
          const appearing = isInhale && ringIdx === visibleRings - 1;
          return <div key={ringIdx} style={{
            position: "absolute", width: r * 2, height: r * 2, borderRadius: "50%",
            background: RING_COLORS[ringIdx + 1] || RING_COLORS[5],
            opacity: visible ? 0.78 : 0, transform: `scale(${visible ? holdPulse : 0.5})`,
            transition: appearing ? "opacity 200ms ease-in, transform 200ms ease-in" : "opacity 300ms ease-out, transform 300ms ease-out",
            filter: "blur(0.5px)",
          }} />;
        })}
        {/* Core circle */}
        <div style={{
          position: "absolute", width: coreR * 2, height: coreR * 2, borderRadius: "50%",
          background: RING_COLORS[0], opacity: isRest ? 0.5 : 0.85,
          transform: `scale(${coreScale * holdPulse})`, transition: "transform 1s ease-in-out, opacity 0.5s ease",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10,
        }} />
      </div>
      {/* Phase label */}
      <div style={{ marginTop: 12, textAlign: "center" }}>
        <div style={{ fontSize: 28, fontWeight: 300, color: PHASE_COLORS[phaseLabel] || C.textMuted, letterSpacing: 4 }}>{phaseLabel}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "rgba(255,255,255,0.6)", fontFamily: "'Bebas Neue',sans-serif", marginTop: 4, transition: "opacity 100ms" }}>{Math.max(0, phaseSeconds - sec)}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// RELAXATION MATCH QUIZ
// 5 questions → scored recommendation of top 3 techniques
// ═══════════════════════════════════════════════════════════════

const LS_MATCH = "apex_wellness_match";
const MATCH_QUESTIONS = [
  { id: "q1", q: "Right now, how do you feel?", opts: [
    { v: "stressed", l: "😤 Stressed or anxious", w: { paced_breathing: 3, physiological_sigh: 2, box_breathing: 1 } },
    { v: "numb", l: "😶 Numb or disconnected", w: { q_grounding: 3, body_scan: 2 } },
    { v: "low", l: "😔 Low energy or flat", w: { r_pre_training: 3, box_breathing: 2 } },
    { v: "overwhelmed", l: "🤯 Overwhelmed — can't think", w: { q_grounding: 3, q_stop: 2, physiological_sigh: 2 } },
    { v: "wired", l: "😴 Tired but wired", w: { q_pmr_short: 3, four_six: 2, s_body_scan: 2 } },
  ]},
  { id: "q2", q: "What bothers you most right now?", opts: [
    { v: "thoughts", l: "💭 Racing thoughts", w: { focused_attention: 3, paced_breathing: 2 } },
    { v: "tension", l: "😤 Tension in my body", w: { q_pmr_short: 3, body_scan: 2, diaphragmatic: 1 } },
    { v: "control", l: "😰 Feeling out of control", w: { q_stop: 3, q_grounding: 3, dbt_tipp: 1 } },
    { v: "focus", l: "😑 Can't focus or feel present", w: { box_breathing: 3, breathing_space: 2, focused_attention: 2 } },
    { v: "nothing", l: "😩 Nothing feels like it will help", w: { q_grounding: 3, q_pmr_short: 2 } },
  ]},
  { id: "q3", q: "How much time do you have?", opts: [
    { v: "1-2", l: "⚡ 1–2 minutes", w: { physiological_sigh: 3, q_stop: 2, q_posture: 1 } },
    { v: "3-5", l: "🕐 3–5 minutes", w: { paced_breathing: 2, box_breathing: 2, q_grounding: 2 } },
    { v: "5-10", l: "🕙 5–10 minutes", w: { body_scan: 2, q_pmr_short: 2, focused_attention: 2 } },
    { v: "10+", l: "🌙 10+ minutes (winding down)", w: { four_six: 3, s_pmr: 3, s_body_scan: 3 } },
  ]},
  { id: "q4", q: "How do you feel about focusing on your breathing?", opts: [
    { v: "comfortable", l: "✅ Comfortable — I like breathwork", w: { paced_breathing: 2, box_breathing: 2, physiological_sigh: 1 } },
    { v: "neutral", l: "😐 Neutral — I'll try it", w: { paced_breathing: 1, diaphragmatic: 1 } },
    { v: "uncomfortable", l: "⚠️ Uncomfortable — sometimes makes me anxious", w: { q_grounding: 3, q_pmr_short: 2 }, exclude: "breathing" },
    { v: "no_body", l: "🚫 I'd rather not focus on my body", w: { q_grounding: 3, focused_attention: 3, q_stop: 2 }, exclude: "body" },
  ]},
  { id: "q5", q: "What outcome matters most right now?", opts: [
    { v: "calm", l: "🧘 Feel calm and settled", w: { paced_breathing: 3, diaphragmatic: 2, four_six: 2 } },
    { v: "focus", l: "🎯 Get focused and sharp", w: { box_breathing: 3, focused_attention: 2, r_pre_training: 2 } },
    { v: "sleep", l: "😴 Wind down and sleep", w: { four_six: 3, s_pmr: 3, s_body_scan: 2 } },
    { v: "grounded", l: "🌍 Feel grounded and present", w: { q_grounding: 3, breathing_space: 2 } },
    { v: "tension", l: "💪 Release tension from my body", w: { q_pmr_short: 3, body_scan: 2, diaphragmatic: 2 } },
  ]},
];

const MATCH_REASONS = {
  paced_breathing: "A simple, calming breath rhythm that may help you feel more settled.",
  physiological_sigh: "A quick reset many people find helpful when stress spikes suddenly.",
  box_breathing: "Structured breathing helps anchor attention when you need focus.",
  diaphragmatic: "A foundational breathing style that may support relaxation and body awareness.",
  four_six: "A longer exhale gently slows your system — ideal for winding down.",
  q_grounding: "When feeling overwhelmed, grounding brings you back to the present moment quickly.",
  q_pmr_short: "Your body is holding tension — this releases it muscle by muscle.",
  q_stop: "A quick pause to interrupt reactive patterns and choose your next step.",
  body_scan: "Gentle attention through body regions helps reconnect and release held tension.",
  focused_attention: "Resting attention on one anchor can quiet a busy mind over time.",
  s_pmr: "Systematic tension-release is well-studied for pre-sleep relaxation.",
  s_body_scan: "An extended body scan with slow pacing to transition into sleep.",
  breathing_space: "A brief 3-minute check-in to notice, narrow, and widen awareness.",
  r_pre_training: "Breathing, intention, and imagery to prepare for effort.",
  dbt_tipp: "Combines temperature, movement, and breathing for high emotional intensity.",
};

function RelaxationMatchQuiz({ onResult, onSkip }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);

  const handleAnswer = (opt) => {
    const newAnswers = [...answers, opt];
    setAnswers(newAnswers);
    if (step + 1 >= MATCH_QUESTIONS.length) {
      // Score
      const scores = {};
      const excludes = new Set();
      newAnswers.forEach(a => {
        if (a.exclude === "breathing") TECHNIQUES.filter(t => t.category === "breathing").forEach(t => excludes.add(t.id));
        if (a.exclude === "body") ["body_scan", "s_body_scan", "q_pmr_short", "s_pmr"].forEach(id => excludes.add(id));
        Object.entries(a.w || {}).forEach(([tid, pts]) => { scores[tid] = (scores[tid] || 0) + pts; });
      });
      const sorted = Object.entries(scores).filter(([id]) => !excludes.has(id)).sort((a, b) => b[1] - a[1]);
      const top3 = sorted.slice(0, 3).map(([id]) => ({ id, technique: TECHNIQUES.find(t => t.id === id), reason: MATCH_REASONS[id] || "A good match for your current state." }));
      const res = { top3, answers: newAnswers.map(a => a.v), completedAt: new Date().toISOString() };
      try { localStorage.setItem(LS_MATCH, JSON.stringify(res)); } catch {}
      setResult(res);
    } else {
      setStep(step + 1);
    }
  };

  if (result) {
    const medals = ["🥇", "🥈", "🥉"];
    const labels = ["Best match", "Also works well", "Another option"];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>YOUR MATCH</div>
        {result.top3.map((r, i) => r.technique && (
          <Card key={r.id} style={{ borderColor: i === 0 ? C.teal + "40" : C.border, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 18 }}>{medals[i]}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textDim, letterSpacing: 1 }}>{labels[i]?.toUpperCase()}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{r.technique.name}</div>
              </div>
              <span style={{ fontSize: 10, color: C.textDim }}>{r.technique.defaultDuration} min</span>
            </div>
            <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5, marginBottom: 8 }}>{r.reason}</div>
            <button onClick={() => onResult?.(r.id)} style={{ width: "100%", padding: "10px", borderRadius: 10, background: i === 0 ? `linear-gradient(135deg,${C.teal},${C.tealDark})` : C.bgElevated, border: i === 0 ? "none" : `1px solid ${C.border}`, color: i === 0 ? "#000" : C.teal, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Start now</button>
          </Card>
        ))}
        <button onClick={onSkip} style={{ background: "none", border: "none", color: C.textDim, fontSize: 12, cursor: "pointer", fontFamily: "inherit", padding: "8px 0" }}>Explore all techniques</button>
      </div>
    );
  }

  const q = MATCH_QUESTIONS[step];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.teal, letterSpacing: 2 }}>QUESTION {step + 1} OF {MATCH_QUESTIONS.length}</div>
        <button onClick={onSkip} style={{ background: "none", border: "none", color: C.textDim, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Skip</button>
      </div>
      <div style={{ width: "100%", height: 4, background: C.border, borderRadius: 2 }}><div style={{ width: `${((step + 1) / MATCH_QUESTIONS.length) * 100}%`, height: "100%", background: C.teal, borderRadius: 2, transition: "width 0.3s ease" }} /></div>
      <div style={{ fontSize: 18, fontWeight: 700, color: C.text, lineHeight: 1.4 }}>{q.q}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {q.opts.map(o => (
          <button key={o.v} onClick={() => handleAnswer(o)} style={{ padding: "14px 16px", borderRadius: 12, background: C.bgCard, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "border-color 0.15s" }}>
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BREATHING TIMING STEPPER + SETUP SCREEN
// ═══════════════════════════════════════════════════════════════

const LS_BREATH_PREFS = "apex_breathing_preferences";

function getBreathPrefs() { try { return JSON.parse(localStorage.getItem(LS_BREATH_PREFS) || "{}"); } catch { return {}; } }
function saveBreathPref(techId, prefs) {
  try { const all = getBreathPrefs(); all[techId] = { ...prefs, lastUpdated: new Date().toISOString() }; localStorage.setItem(LS_BREATH_PREFS, JSON.stringify(all)); } catch {}
}

function getConditionDefaults(technique) {
  try {
    const a = JSON.parse(localStorage.getItem("apex_assessment") || "{}");
    const injuries = JSON.parse(localStorage.getItem("apex_injuries") || "[]");
    const hasCOPD = (a.conditions || []).some(c => (c.name || "").toLowerCase().includes("copd") || (c.name || "").toLowerCase().includes("asthma"));
    const isSenior = (a.userAge || 0) >= 65;
    const isAthlete = a.trainingExperience === "professional" || a.trainingExperience === "performance";
    if (hasCOPD) return { inhale: 2, holdFull: 0, exhale: 4, holdEmpty: 0, note: "Starting shorter — adjust up as feels comfortable." };
    if (isSenior) return { inhale: 3, holdFull: 0, exhale: 5, holdEmpty: 0 };
    if (isAthlete) return { inhale: 5, holdFull: 0, exhale: 7, holdEmpty: 0 };
    if (technique.id === "box_breathing") return { inhale: 4, holdFull: 4, exhale: 4, holdEmpty: 4 };
  } catch {}
  return null;
}

function TimingStepper({ label, value, onChange, min = 0, max = 10, color = "#7EC8C8" }) {
  const holdRef = useRef(null);
  const startHold = (delta) => { onChange(Math.max(min, Math.min(max, value + delta))); holdRef.current = setTimeout(() => { holdRef.current = setInterval(() => onChange(v => Math.max(min, Math.min(max, v + delta))), 200); }, 600); };
  const stopHold = () => { clearTimeout(holdRef.current); clearInterval(holdRef.current); };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
      <span style={{ fontSize: 14, color: "#8B9BB4", letterSpacing: "0.08em", textTransform: "uppercase", minWidth: 90 }}>{label}</span>
      <button onPointerDown={() => startHold(-1)} onPointerUp={stopHold} onPointerCancel={stopHold} disabled={value <= min}
        style={{ width: 44, height: 44, borderRadius: 22, background: "rgba(126,200,200,0.12)", border: "1px solid rgba(126,200,200,0.2)", color, fontSize: 20, cursor: value <= min ? "default" : "pointer", opacity: value <= min ? 0.3 : 1, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
      <div style={{ minWidth: 72, textAlign: "center", fontSize: 32, fontWeight: 300, color: "#E8EDF2" }}>{value}s</div>
      <button onPointerDown={() => startHold(1)} onPointerUp={stopHold} onPointerCancel={stopHold} disabled={value >= max}
        style={{ width: 44, height: 44, borderRadius: 22, background: "rgba(126,200,200,0.12)", border: "1px solid rgba(126,200,200,0.2)", color, fontSize: 20, cursor: value >= max ? "default" : "pointer", opacity: value >= max ? 0.3 : 1, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
    </div>
  );
}

function getGuidanceText(inhale, exhale) {
  if (exhale < inhale) return { text: "Try making your exhale at least as long as your inhale for a calming effect.", color: "#C8A87E" };
  if (exhale === inhale) return { text: "Equal breathing — good for balance and focus.", color: "#8BC8A0" };
  if (inhale >= 7) return { text: "Long inhale — take your time between cycles.", color: "#8BC8A0" };
  if (inhale <= 2) return { text: "Short cycles are fine — use what feels comfortable.", color: "#8B9BB4" };
  return { text: "Longer exhale — good for calming.", color: "#7EC8C8" };
}

function BreathingSetup({ technique, onStart, onClose }) {
  const hasHolds = technique.phases?.some(p => p.label === "HOLD");
  const defaults = getConditionDefaults(technique);
  const techDefaults = { inhale: technique.phases?.find(p => p.label === "INHALE")?.seconds || 4, holdFull: technique.phases?.find(p => p.label === "HOLD")?.seconds || 0, exhale: technique.phases?.find(p => p.label === "EXHALE")?.seconds || 6, holdEmpty: technique.phases?.filter(p => p.label === "HOLD")?.[1]?.seconds || 0 };
  const reducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  // Load saved prefs with 2s timeout fallback — never block the user
  const [saved, setSaved] = useState(() => { try { return getBreathPrefs()[technique.id] || null; } catch { return null; } });
  const [loadNotice, setLoadNotice] = useState(null); // amber notice if load failed
  const [saveNotice, setSaveNotice] = useState(null); // notice if save failed

  // View states: "saved" (has prefs) | "instructions" | "testing" | "results"
  const [view, setView] = useState(saved ? "saved" : "instructions");
  const [showAdjust, setShowAdjust] = useState(false);

  // Timeout: if saved is null and we suspect Supabase sync hasn't completed, fall through after 2s
  useEffect(() => {
    if (saved) return;
    const timer = setTimeout(() => {
      // Re-check after sync may have completed
      try {
        const fresh = getBreathPrefs()[technique.id];
        if (fresh) { setSaved(fresh); setView("saved"); return; }
      } catch {}
      // Still no saved data — show notice and use defaults
      if (view === "instructions") return; // already on instructions, no notice needed
      setLoadNotice("Couldn't load your saved rhythm — using recommended settings.");
      setTimeout(() => setLoadNotice(null), 4000);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Test state
  const [testState, setTestState] = useState(0); // 0=ready, 1=inhale, 2=exhale
  const [inhaleStart, setInhaleStart] = useState(null);
  const [inhaleEnd, setInhaleEnd] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [tooFast, setTooFast] = useState(false);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  // Results state
  const init = saved || defaults || techDefaults;
  const [inhale, setInhale] = useState(init.inhale || 4);
  const [holdFull, setHoldFull] = useState(init.holdFull || init.hold_full_seconds || 0);
  const [exhale, setExhale] = useState(init.exhale || 6);
  const [holdEmpty, setHoldEmpty] = useState(init.holdEmpty || init.hold_empty_seconds || 0);
  const [duration, setDuration] = useState(saved?.duration || technique.defaultDuration || 3);
  const [rawInhale, setRawInhale] = useState(saved?.baseline_inhale_raw || null);
  const [rawExhale, setRawExhale] = useState(saved?.baseline_exhale_raw || null);

  // Live elapsed counter during test
  useEffect(() => {
    if (testState === 0 || view !== "testing") { cancelAnimationFrame(rafRef.current); return; }
    const tick = () => { setElapsed(Math.round((Date.now() - startRef.current) / 100) / 10); rafRef.current = requestAnimationFrame(tick); };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [testState, view]);

  const handleTestTap = () => {
    const now = Date.now();
    if (testState === 0) {
      // Start inhale
      setInhaleStart(now); startRef.current = now; setElapsed(0); setTestState(1); setTooFast(false);
    } else if (testState === 1) {
      // End inhale, start exhale
      const ms = now - inhaleStart;
      if (ms < 1500) { setTooFast(true); setTestState(0); setTimeout(() => setTooFast(false), 2500); return; }
      setInhaleEnd(now); startRef.current = now; setElapsed(0); setTestState(2);
    } else if (testState === 2) {
      // End exhale — show results
      if (inhaleEnd && now - inhaleEnd < 1500) return; // debounce fumble
      const inhMs = inhaleEnd - inhaleStart;
      const exMs = now - inhaleEnd;
      const rawIn = Math.round(inhMs / 100) / 10;
      const rawEx = Math.round(exMs / 100) / 10;
      const clampIn = Math.max(2, Math.min(10, Math.round(rawIn)));
      const clampEx = Math.max(2, Math.min(12, Math.round(rawEx)));
      setRawInhale(rawIn); setRawExhale(rawEx); setInhale(clampIn); setExhale(clampEx);
      cancelAnimationFrame(rafRef.current); setTestState(0); setView("results");
    }
  };

  const handleLaunch = () => {
    const customPhases = [{ label: "INHALE", seconds: inhale }, ...(holdFull > 0 ? [{ label: "HOLD", seconds: holdFull }] : []), { label: "EXHALE", seconds: exhale }, ...(holdEmpty > 0 ? [{ label: "HOLD", seconds: holdEmpty }] : [])];
    // Save — but never block session start on failure
    try { saveBreathPref(technique.id, { inhale, holdFull, exhale, holdEmpty, duration, baseline_inhale_raw: rawInhale, baseline_exhale_raw: rawExhale, baseline_tested_at: new Date().toISOString() }); }
    catch { setSaveNotice("Couldn't save your settings — they'll apply this session only."); setTimeout(() => setSaveNotice(null), 3000); }
    onStart({ customPhases, customDuration: duration });
  };

  // Skip test at any point → condition-aware defaults → ready to start
  const useDefaults = () => { const d = defaults || techDefaults; setInhale(d.inhale); setExhale(d.exhale); setHoldFull(d.holdFull || 0); setHoldEmpty(d.holdEmpty || 0); setTestState(0); cancelAnimationFrame(rafRef.current); setView("results"); };
  const guidance = getGuidanceText(inhale, exhale);

  // Shared notices
  const NoticeBar = () => <>
    {loadNotice && <div style={{ fontSize: 12, color: "#C8A87E", padding: "6px 10px", background: "rgba(200,168,126,0.08)", borderRadius: 8, textAlign: "center" }}>{loadNotice}</div>}
    {saveNotice && <div style={{ fontSize: 12, color: "#C8A87E", padding: "6px 10px", background: "rgba(200,168,126,0.08)", borderRadius: 8, textAlign: "center" }}>{saveNotice}</div>}
  </>;
  const SkipLink = () => <button onClick={useDefaults} style={{ background: "none", border: "none", color: "#6B7A8D", fontSize: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "center", width: "100%", padding: "4px 0" }}>Skip — use recommended settings</button>;

  // ── SAVED VIEW (returning user) ──
  if (view === "saved") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <NoticeBar />
        <div><div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{technique.name}</div><div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{technique.desc}</div></div>
        <Card style={{ padding: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 6 }}>Your rhythm</div>
          <div style={{ fontSize: 20, fontWeight: 300, color: "#E8EDF2" }}>Inhale {inhale}s · Exhale {exhale}s{holdFull > 0 ? ` · Hold ${holdFull}s` : ""}</div>
          {!showAdjust && <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button onClick={() => setShowAdjust(true)} style={{ background: "none", border: "none", color: C.teal, fontSize: 12, cursor: "pointer", fontFamily: "inherit", padding: 0 }}>Adjust</button>
            <button onClick={() => { setView("instructions"); setTestState(0); }} style={{ background: "none", border: "none", color: C.textDim, fontSize: 12, cursor: "pointer", fontFamily: "inherit", padding: 0 }}>Retest baseline</button>
          </div>}
          {showAdjust && <div style={{ marginTop: 8 }}>
            <TimingStepper label="Inhale" value={inhale} onChange={setInhale} min={2} max={10} />
            {hasHolds && <TimingStepper label="Hold" value={holdFull} onChange={setHoldFull} min={0} max={10} color="#C8C87E" />}
            <TimingStepper label="Exhale" value={exhale} onChange={setExhale} min={2} max={12} />
            {hasHolds && <TimingStepper label="Hold empty" value={holdEmpty} onChange={setHoldEmpty} min={0} max={8} color="#A0B8A0" />}
            <div style={{ fontSize: 12, color: guidance.color, marginTop: 4 }}>{guidance.text}</div>
          </div>}
        </Card>
        <TimingStepper label="Duration" value={duration} onChange={setDuration} min={1} max={20} color={C.info} />
        {defaults?.note && <div style={{ fontSize: 11, color: "#C8A87E", padding: "6px 10px", background: "rgba(200,168,126,0.08)", borderRadius: 8 }}>{defaults.note}</div>}
        <button onClick={handleLaunch} style={{ width: "100%", padding: "14px", borderRadius: 12, background: `linear-gradient(135deg,${C.teal},${C.tealDark})`, border: "none", color: "#000", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Start session</button>
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.textDim, fontSize: 11, cursor: "pointer", fontFamily: "inherit", textAlign: "center" }}>Cancel</button>
      </div>
    );
  }

  // ── INSTRUCTIONS VIEW ──
  if (view === "instructions") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <NoticeBar />
        <div style={{ textAlign: "center", fontSize: 28, marginTop: 8 }}>🌬️</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.text, textAlign: "center" }}>Find your natural rhythm</div>
        <div style={{ fontSize: 13, color: C.textMuted, textAlign: "center", lineHeight: 1.6 }}>We'll measure one comfortable breath so your session matches what feels natural to you.</div>
        <div style={{ height: 1, background: C.border }} />
        <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 4 }}>How it works:</div>
        {[
          "Sit comfortably and relax",
          "Take one easy, natural breath — not forced, not held",
          "Press START when you begin to inhale",
          "Press again when inhale ends and exhale begins",
          "Press once more when the exhale is complete",
        ].map((step, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#7EC8C8", minWidth: 24 }}>{i + 1}</span>
            <span style={{ fontSize: 13, color: "#C8D6E5", lineHeight: 1.5 }}>{step}</span>
          </div>
        ))}
        <div style={{ fontSize: 12, color: "#6B7A8D", fontStyle: "italic", textAlign: "center", marginTop: 4 }}>Breathe as you normally would. There is no right or wrong.</div>
        <button onClick={() => setView("testing")} style={{ width: "100%", padding: "14px", borderRadius: 12, background: "#7EC8C8", border: "none", color: "#0D1117", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Begin test</button>
        <button onClick={useDefaults} style={{ background: "none", border: "none", color: "#6B7A8D", fontSize: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "center" }}>Use recommended settings instead</button>
      </div>
    );
  }

  // ── TESTING VIEW ──
  if (view === "testing") {
    const phaseLabel = testState === 0 ? "" : testState === 1 ? "INHALE" : "EXHALE";
    const phaseColor = testState === 1 ? "#7EC8C8" : testState === 2 ? "#8FB8C8" : C.textDim;
    const btnBg = testState === 0 ? "#7EC8C8" : testState === 1 ? "#6BA8C4" : "#8F8DC8";
    const btnText = testState === 0 ? "START" : testState === 1 ? "INHALE\nDONE" : "EXHALE\nDONE";
    const instruction = testState === 0 ? "Press when you begin to inhale" : testState === 1 ? "Inhale complete — press to exhale" : "Exhale complete — press when done";

    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, minHeight: 400 }}>
        {phaseLabel && <div style={{ fontSize: 28, fontWeight: 300, color: phaseColor, letterSpacing: 4 }}>{phaseLabel}</div>}
        {!phaseLabel && <div style={{ fontSize: 16, color: C.textMuted }}>Get ready to inhale</div>}
        {/* Freeform animation during test */}
        {testState > 0 && !reducedMotion && <div style={{ transform: "scale(0.7)", transformOrigin: "center" }}>
          <ConcentricBreathAnimation phaseLabel={phaseLabel} phaseSeconds={6} elapsedInPhase={Math.min(elapsed, 5.9)} reducedMotion={false} />
        </div>}
        {testState > 0 && reducedMotion && <div style={{ fontSize: 24, color: phaseColor, padding: "20px 0" }}>{elapsed.toFixed(1)}s</div>}
        {testState > 0 && !reducedMotion && <div style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", fontFamily: "'Bebas Neue',sans-serif" }}>{elapsed.toFixed(1)}s</div>}
        <div style={{ fontSize: 13, color: C.textMuted, textAlign: "center" }}>{instruction}</div>
        {tooFast && <div style={{ fontSize: 12, color: "#C8A87E", textAlign: "center" }}>That felt quick — let's try once more with a full natural breath.</div>}
        <button onClick={handleTestTap} style={{ width: 120, height: 120, borderRadius: 60, background: btnBg, border: "none", color: "#0D1117", fontSize: 18, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "pre-line", lineHeight: 1.3, animation: testState === 0 ? "pulse 2s ease-in-out infinite" : "none" }}>{btnText}</button>
        <SkipLink />
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.textDim, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
      </div>
    );
  }

  // ── RESULTS VIEW ──
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <NoticeBar />
      <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Your natural rhythm</div>
      <TimingStepper label="Inhale" value={inhale} onChange={setInhale} min={2} max={10} />
      {rawInhale && <div style={{ fontSize: 10, color: "#6B7A8D", marginTop: -8, paddingLeft: 98 }}>measured: {rawInhale}s</div>}
      {hasHolds && <TimingStepper label="Hold" value={holdFull} onChange={setHoldFull} min={0} max={10} color="#C8C87E" />}
      <TimingStepper label="Exhale" value={exhale} onChange={setExhale} min={2} max={12} />
      {rawExhale && <div style={{ fontSize: 10, color: "#6B7A8D", marginTop: -8, paddingLeft: 98 }}>measured: {rawExhale}s</div>}
      {hasHolds && <TimingStepper label="Hold empty" value={holdEmpty} onChange={setHoldEmpty} min={0} max={8} color="#A0B8A0" />}
      <div style={{ height: 1, background: C.border }} />
      <div style={{ fontSize: 12, color: guidance.color }}>{guidance.text}</div>
      <TimingStepper label="Duration" value={duration} onChange={setDuration} min={1} max={20} color={C.info} />
      <button onClick={handleLaunch} style={{ width: "100%", padding: "14px", borderRadius: 12, background: `linear-gradient(135deg,${C.teal},${C.tealDark})`, border: "none", color: "#000", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Use these settings</button>
      <button onClick={() => { setView("instructions"); setTestState(0); }} style={{ background: "none", border: "none", color: C.textDim, fontSize: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "center" }}>Retest</button>
    </div>
  );
}

// Mid-session timing adjustment bottom sheet
function TimingSheet({ phases, onUpdate, onClose }) {
  const inhaleP = phases.find(p => p.label === "INHALE");
  const exhaleP = phases.find(p => p.label === "EXHALE");
  const holds = phases.filter(p => p.label === "HOLD");
  const [inhale, setInhale] = useState(inhaleP?.seconds || 4);
  const [exhale, setExhale] = useState(exhaleP?.seconds || 6);
  const [holdFull, setHoldFull] = useState(holds[0]?.seconds || 0);
  const [holdEmpty, setHoldEmpty] = useState(holds[1]?.seconds || 0);
  const hasHolds = holds.length > 0;
  const guidance = getGuidanceText(inhale, exhale);

  const handleDone = () => {
    const newPhases = [{ label: "INHALE", seconds: inhale }, ...(holdFull > 0 ? [{ label: "HOLD", seconds: holdFull }] : []), { label: "EXHALE", seconds: exhale }, ...(holdEmpty > 0 ? [{ label: "HOLD", seconds: holdEmpty }] : [])];
    onUpdate(newPhases);
    onClose();
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 400, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#161B22", borderRadius: "20px 20px 0 0", padding: "12px 20px 24px", width: "100%", maxWidth: 480 }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", margin: "0 auto 12px" }} />
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>Adjust timing</div>
        <div style={{ fontSize: 11, color: C.textDim, marginBottom: 10 }}>Changes apply next breath</div>
        <TimingStepper label="Inhale" value={inhale} onChange={setInhale} min={2} max={10} />
        {hasHolds && <TimingStepper label="Hold" value={holdFull} onChange={setHoldFull} min={0} max={10} color="#C8C87E" />}
        <TimingStepper label="Exhale" value={exhale} onChange={setExhale} min={2} max={12} />
        {hasHolds && <TimingStepper label="Hold empty" value={holdEmpty} onChange={setHoldEmpty} min={0} max={8} color="#A0B8A0" />}
        <div style={{ fontSize: 11, color: guidance.color, marginTop: 4, marginBottom: 8 }}>{guidance.text}</div>
        <button onClick={handleDone} style={{ width: "100%", padding: "12px", borderRadius: 12, background: C.teal, border: "none", color: "#000", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Done</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TECHNIQUE PLAYER (shared across all sessions)
// ═══════════════════════════════════════════════════════════════

function TechniquePlayer({ technique, onClose, onComplete, customPhases, customDuration }) {
  const [phase, setPhase] = useState(0);
  const [timer, setTimer] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [round, setRound] = useState(1);
  const [done, setDone] = useState(false);
  const [stressAfter, setStressAfter] = useState(null);
  const [showTimingSheet, setShowTimingSheet] = useState(false);
  const [activePhases, setActivePhases] = useState(customPhases || technique.phases || []);
  const totalDuration = (customDuration || technique.defaultDuration || 3) * 60;
  const phases = activePhases;
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{technique.name}</div><div style={{ fontSize: 11, color: C.textDim }}>{technique.category.replace("_", " / ").toUpperCase()}</div></div>
        <div style={{ display: "flex", gap: 6 }}>
          {phases.length > 0 && <button onClick={() => setShowTimingSheet(true)} style={{ width: 32, height: 32, borderRadius: 8, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.textDim, fontSize: 14, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}>⚙️</button>}
          <button onClick={() => { logWellnessSession({ techniqueId: technique.id, category: technique.category, durationSeconds: totalElapsed, completionStatus: "exited_early" }); onClose(); }}
            style={{ padding: "6px 12px", borderRadius: 8, background: C.danger + "15", border: `1px solid ${C.danger}30`, color: C.danger, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Stop</button>
        </div>
      </div>
      {/* Mid-session timing adjustment */}
      {showTimingSheet && <TimingSheet phases={phases} onUpdate={setActivePhases} onClose={() => setShowTimingSheet(false)} />}
      {/* Progress bar */}
      <div style={{ width: "100%", height: 4, background: C.border, borderRadius: 2 }}><div style={{ width: `${(totalElapsed / totalDuration) * 100}%`, height: "100%", background: C.teal, borderRadius: 2, transition: "width 1s linear" }} /></div>
      {/* Concentric circle breathing animation */}
      {currentPhase && <ConcentricBreathAnimation phaseLabel={currentPhase.label} phaseSeconds={currentPhase.seconds} elapsedInPhase={timer} reducedMotion={reducedMotion} />}
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
  const [showMatchQuiz, setShowMatchQuiz] = useState(false);
  const [savedMatch, setSavedMatch] = useState(() => { try { return JSON.parse(localStorage.getItem(LS_MATCH)); } catch { return null; } });
  const [breathingSetup, setBreathingSetup] = useState(null); // technique object for setup screen
  const [customBreathParams, setCustomBreathParams] = useState(null); // { customPhases, customDuration }
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

  // Match quiz flow
  if (showMatchQuiz) {
    return (
      <div className="fade-in safe-bottom" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <RelaxationMatchQuiz onResult={(id) => { setShowMatchQuiz(false); setSavedMatch(JSON.parse(localStorage.getItem(LS_MATCH) || "null")); setActiveTechnique(id); }} onSkip={() => { setShowMatchQuiz(false); setSavedMatch(JSON.parse(localStorage.getItem(LS_MATCH) || "null")); }} />
      </div>
    );
  }

  // Breathing setup screen (pre-session timing adjustment)
  if (breathingSetup) {
    return (
      <div className="fade-in safe-bottom" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <BreathingSetup technique={breathingSetup} onStart={(params) => { setCustomBreathParams(params); setActiveTechnique(breathingSetup.id); setBreathingSetup(null); }} onClose={() => setBreathingSetup(null)} />
      </div>
    );
  }

  // Active technique player
  if (activeTechnique) {
    const tech = TECHNIQUES.find(t => t.id === activeTechnique);
    if (tech) return (
      <div className="fade-in safe-bottom" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <TechniquePlayer technique={tech} customPhases={customBreathParams?.customPhases} customDuration={customBreathParams?.customDuration} onClose={() => { setActiveTechnique(null); setCustomBreathParams(null); }} onComplete={() => { setActiveTechnique(null); setCustomBreathParams(null); }} />
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
          <Card key={t.id} onClick={() => { if (t.phases?.length > 0 && t.category === "breathing") setBreathingSetup(t); else setActiveTechnique(t.id); }} style={{ cursor: "pointer", padding: 12 }}>
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
      {/* Match quiz banner */}
      {savedMatch?.top3?.[0] ? (
        <Card style={{ padding: 12, borderColor: C.teal + "20", background: C.tealBg }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>✨</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Your match: {savedMatch.top3[0].technique?.name || TECHNIQUES.find(t => t.id === savedMatch.top3[0].id)?.name}</div>
              <button onClick={() => { localStorage.removeItem(LS_MATCH); setSavedMatch(null); setShowMatchQuiz(true); }} style={{ background: "none", border: "none", color: C.teal, fontSize: 11, cursor: "pointer", fontFamily: "inherit", padding: 0, marginTop: 2 }}>Retake match quiz</button>
            </div>
            <button onClick={() => setActiveTechnique(savedMatch.top3[0].id)} style={{ padding: "6px 12px", borderRadius: 8, background: C.teal + "20", border: `1px solid ${C.teal}40`, color: C.teal, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Start</button>
          </div>
        </Card>
      ) : (
        <Card style={{ padding: 12, borderColor: C.purple + "20" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🎯</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Not sure where to start?</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>Answer 5 quick questions and we'll find your best match.</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <button onClick={() => setShowMatchQuiz(true)} style={{ flex: 1, padding: "8px", borderRadius: 8, background: C.purple + "15", border: `1px solid ${C.purple}40`, color: C.purple, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Find my technique</button>
          </div>
        </Card>
      )}
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
