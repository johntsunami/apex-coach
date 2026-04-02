import { useState, useEffect, useRef, useMemo } from "react";
import {
  getCardioPrescription, calcVO2Rockport, calcVO2Cooper, calcVO2StepTest,
  getVO2Category, getStepTestCategory, getStartingZoneFromStepTest,
  getNASMZones, RPE_ZONES, classifyHRZone, talkTestZone, classifyBP,
  saveCardioSession, getCardioSessions, getWeeklyCardioMinutes, getWeeklyZoneMinutes,
  saveVO2Test, getVO2Tests, getLatestVO2, getVO2Trend, getRetestDue,
  getHRSettings, setHRSettings, getRecommendedTest, estimateCalories,
  getHRMax,
} from "../utils/cardio.js";
import { getInjuries } from "../utils/injuries.js";

// ═══════════════════════════════════════════════════════════════
// NASM-Aligned Cardio Tracker — 4-option VO2 test, 3-zone model,
// enhanced session logging, zone distribution dashboard
// ═══════════════════════════════════════════════════════════════

const C = {
  bg: "#060b18", bgCard: "#0d1425", bgElevated: "#162040",
  bgGlass: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.08)",
  text: "#e8ecf4", textMuted: "#7a8ba8", textDim: "#4a5a78",
  teal: "#00d2c8", tealBg: "rgba(0,210,200,0.08)",
  success: "#22c55e", danger: "#ef4444", warning: "#eab308",
  info: "#3b82f6", orange: "#f97316", purple: "#a855f7",
};
function Badge({children,color=C.teal}){return <span style={{display:"inline-flex",padding:"3px 8px",borderRadius:6,fontSize:9,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color,background:color+"15",border:`1px solid ${color}25`}}>{children}</span>;}
function ProgressBar({value,max=100,color=C.teal,height=5}){return(<div style={{width:"100%",height,background:C.border,borderRadius:height/2,overflow:"hidden"}}><div style={{width:`${Math.min(100,(value/max)*100)}%`,height:"100%",background:color,borderRadius:height/2,transition:"width 0.6s ease"}}/></div>);}

// ── Countdown timer hook ──────────────────────────────────────
function useCountdown(initial) {
  const [seconds, setSeconds] = useState(initial);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (running && seconds > 0) {
      ref.current = setTimeout(() => setSeconds(s => s - 1), 1000);
    } else if (running && seconds === 0) {
      setRunning(false);
    }
    return () => clearTimeout(ref.current);
  }, [running, seconds]);
  const start = () => { setSeconds(initial); setRunning(true); };
  const stop = () => setRunning(false);
  const reset = () => { setRunning(false); setSeconds(initial); };
  return { seconds, running, done: !running && seconds === 0, start, stop, reset };
}

// ── Stopwatch hook ────────────────────────────────────────────
function useStopwatch() {
  const [ms, setMs] = useState(0);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);
  const startRef = useRef(0);
  useEffect(() => {
    if (running) {
      startRef.current = Date.now() - ms;
      const tick = () => { setMs(Date.now() - startRef.current); ref.current = requestAnimationFrame(tick); };
      ref.current = requestAnimationFrame(tick);
    } else { cancelAnimationFrame(ref.current); }
    return () => cancelAnimationFrame(ref.current);
  }, [running]);
  const start = () => setRunning(true);
  const stop = () => setRunning(false);
  const reset = () => { setRunning(false); setMs(0); };
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const timeMinutes = totalSeconds / 60;
  const fmt = `${minutes}:${secs.toString().padStart(2, "0")}`;
  return { ms, totalSeconds, minutes, secs, timeMinutes, running, fmt, start, stop, reset };
}

// ── Simple metronome (96 BPM) ─────────────────────────────────
function useMetronome(bpm = 96) {
  const [active, setActive] = useState(false);
  const ref = useRef(null);
  const ctxRef = useRef(null);
  useEffect(() => {
    if (active) {
      try {
        if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        const ctx = ctxRef.current;
        const interval = 60000 / bpm;
        const beep = () => {
          try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 800;
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.08);
          } catch { /* audio context issue */ }
        };
        beep();
        ref.current = setInterval(beep, interval);
      } catch { /* no audio support */ }
    } else {
      clearInterval(ref.current);
    }
    return () => clearInterval(ref.current);
  }, [active, bpm]);
  return { active, start: () => setActive(true), stop: () => setActive(false) };
}

// ── Step Test SVG illustration ────────────────────────────────
function StepTestIllustration() {
  return (
    <svg viewBox="0 0 300 130" style={{width:"100%",height:110,display:"block"}}>
      <rect width="300" height="130" rx="14" fill="#0a1628"/>
      <text x="150" y="16" textAnchor="middle" fill="#4a5a78" fontSize="9" fontWeight="600">YMCA 3-MINUTE STEP TEST — 96 BPM</text>
      <line x1="30" y1="115" x2="270" y2="115" stroke="#1a2a45" strokeWidth="2"/>
      {/* Step bench */}
      <rect x="100" y="85" width="100" height="30" rx="4" fill="#1a2a45" stroke="#2a3a55" strokeWidth="1.5"/>
      <text x="150" y="105" textAnchor="middle" fill="#4a5a78" fontSize="8">12" BENCH</text>
      {/* Step 1: Up */}
      <circle cx="70" cy="50" r="7" fill="none" stroke="#00d2c8" strokeWidth="2"/>
      <line x1="70" y1="57" x2="70" y2="82" stroke="#00d2c8" strokeWidth="2"/>
      <line x1="70" y1="82" x2="62" y2="115" stroke="#00d2c8" strokeWidth="2"/>
      <line x1="70" y1="82" x2="90" y2="85" stroke="#00d2c8" strokeWidth="2" strokeDasharray="3"/>
      <text x="70" y="125" textAnchor="middle" fill="#00d2c8" fontSize="7">UP</text>
      {/* Step 2: Top */}
      <circle cx="150" cy="38" r="7" fill="none" stroke="#3b82f6" strokeWidth="2"/>
      <line x1="150" y1="45" x2="150" y2="68" stroke="#3b82f6" strokeWidth="2"/>
      <line x1="150" y1="68" x2="140" y2="85" stroke="#3b82f6" strokeWidth="2"/>
      <line x1="150" y1="68" x2="160" y2="85" stroke="#3b82f6" strokeWidth="2"/>
      <text x="150" y="30" textAnchor="middle" fill="#3b82f6" fontSize="7">UP-UP</text>
      {/* Step 3: Down */}
      <circle cx="230" cy="50" r="7" fill="none" stroke="#eab308" strokeWidth="2"/>
      <line x1="230" y1="57" x2="230" y2="82" stroke="#eab308" strokeWidth="2"/>
      <line x1="230" y1="82" x2="222" y2="115" stroke="#eab308" strokeWidth="2"/>
      <line x1="230" y1="82" x2="210" y2="90" stroke="#eab308" strokeWidth="2" strokeDasharray="3"/>
      <text x="230" y="125" textAnchor="middle" fill="#eab308" fontSize="7">DOWN-DOWN</text>
      {/* Arrows */}
      <path d="M90 60 L120 45" stroke="#7a8ba8" strokeWidth="1" markerEnd="url(#arrC)"/>
      <path d="M180 45 L210 60" stroke="#7a8ba8" strokeWidth="1" markerEnd="url(#arrC)"/>
      <defs><marker id="arrC" markerWidth="5" markerHeight="4" refX="4" refY="2" orient="auto"><path d="M0 0 L5 2 L0 4" fill="#7a8ba8"/></marker></defs>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// HOME PAGE CARDIO FITNESS CARD (enhanced with zone distribution)
// ═══════════════════════════════════════════════════════════════

export function CardioFitnessCard({ phase, onTestFitness, onLogCardio }) {
  const injuries = getInjuries().filter(i => i.status !== "resolved");
  const rx = getCardioPrescription(phase, injuries);
  const weeklyMin = getWeeklyCardioMinutes();
  const zoneMins = getWeeklyZoneMinutes();
  const latest = getLatestVO2();
  const trend = getVO2Trend();
  const retestInfo = getRetestDue();
  const hrSettings = getHRSettings();
  const age = hrSettings.age || 35;
  const pct = rx.weeklyTargetMinutes > 0 ? Math.min(100, Math.round(weeklyMin / rx.weeklyTargetMinutes * 100)) : 0;

  // NASM zones for display
  const zoneData = hrSettings.betaBlocker ? null : getNASMZones(age, hrSettings.formula || "regression", hrSettings.maxHR);

  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>❤️</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Cardio Fitness</span>
        </div>
        {latest && latest.category && <Badge color={
          typeof latest.category === "object" ? latest.category.color : getVO2Category(latest.vo2max || 0, age, true).color
        }>{typeof latest.category === "string" ? latest.category : latest.category.label}</Badge>}
      </div>

      {/* VO2 Max + Weekly Minutes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        <div style={{ background: C.bgElevated, borderRadius: 10, padding: 10, textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: latest?.vo2max ? C.teal : C.textDim, fontFamily: "'Bebas Neue',sans-serif" }}>
            {latest?.vo2max || "—"}
          </div>
          <div style={{ fontSize: 9, color: C.textDim, letterSpacing: 1 }}>VO2 MAX</div>
          {latest && <div style={{ fontSize: 8, color: C.textMuted }}>{latest.testType === "ymca_step" ? "Step Test" : latest.testType === "rockport" ? "Walk Test" : latest.testType === "cooper" ? "Run Test" : "Talk Test"}</div>}
          {trend && <div style={{ fontSize: 9, color: trend.improving ? C.success : C.danger, marginTop: 2 }}>
            {trend.improving ? "↑" : "↓"} {Math.abs(trend.diff).toFixed(1)} ({trend.pctChange > 0 ? "+" : ""}{trend.pctChange}%)
          </div>}
        </div>
        <div style={{ background: C.bgElevated, borderRadius: 10, padding: 10, textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: pct >= 100 ? C.success : pct > 50 ? C.teal : C.warning, fontFamily: "'Bebas Neue',sans-serif" }}>
            {weeklyMin}
          </div>
          <div style={{ fontSize: 9, color: C.textDim, letterSpacing: 1 }}>MIN THIS WEEK</div>
          <div style={{ fontSize: 9, color: C.textMuted, marginTop: 2 }}>/ {rx.weeklyTargetMinutes} min target</div>
        </div>
      </div>

      {/* Weekly progress bar */}
      <div style={{ marginBottom: 10 }}>
        <ProgressBar value={pct} max={100} color={pct >= 100 ? C.success : C.teal} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
          <span style={{ fontSize: 9, color: C.textDim }}>{pct}% of weekly goal</span>
          <span style={{ fontSize: 9, color: C.textMuted }}>{rx.type} · {rx.frequency}</span>
        </div>
      </div>

      {/* Zone distribution this week */}
      {(zoneMins[1] > 0 || zoneMins[2] > 0 || zoneMins[3] > 0) && (
        <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
          {[
            { z: 1, min: zoneMins[1], color: "#22c55e", label: "Z1" },
            { z: 2, min: zoneMins[2], color: "#eab308", label: "Z2" },
            { z: 3, min: zoneMins[3], color: "#ef4444", label: "Z3" },
          ].map(z => (
            <div key={z.z} style={{ flex: 1, textAlign: "center", padding: "4px 2px", background: z.min > 0 ? z.color + "10" : C.bgGlass, borderRadius: 6, border: `1px solid ${z.min > 0 ? z.color + "30" : C.border}` }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: z.min > 0 ? z.color : C.textDim, fontFamily: "'Bebas Neue',sans-serif" }}>{z.min}</div>
              <div style={{ fontSize: 7, color: C.textDim }}>{z.label} min</div>
            </div>
          ))}
        </div>
      )}

      {/* HR Zones display (compact) */}
      {zoneData && (
        <div style={{ display: "flex", gap: 2, marginBottom: 10 }}>
          {zoneData.zones.map(z => (
            <div key={z.zone} style={{ flex: 1, padding: "4px 3px", background: z.color + "08", borderRadius: 6, textAlign: "center", border: `1px solid ${z.color}20` }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: z.color }}>Z{z.zone}</div>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.text }}>{z.min}-{z.max}</div>
              <div style={{ fontSize: 6, color: C.textDim }}>bpm</div>
            </div>
          ))}
        </div>
      )}

      {/* Rx summary */}
      <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 10, padding: "6px 8px", background: C.bgGlass, borderRadius: 6 }}>
        <span style={{ color: C.info, fontWeight: 600 }}>Rx: </span>
        {rx.zoneLabel} · {rx.duration} · {rx.guidance}
      </div>

      {/* Beta-blocker warning */}
      {hrSettings.betaBlocker && (
        <div style={{ fontSize: 9, color: C.warning, padding: "6px 8px", background: C.warning + "10", borderRadius: 6, marginBottom: 10 }}>
          ⚠️ Your HR max calculation may not be accurate due to beta-blocker medication. We'll use RPE-based intensity instead of heart rate zones.
        </div>
      )}

      {/* Retest reminder */}
      {retestInfo.due && (
        <div style={{ fontSize: 9, color: C.purple, padding: "6px 8px", background: C.purple + "10", borderRadius: 6, marginBottom: 10 }}>
          🔄 VO2 max retest due — time to measure your progress!
        </div>
      )}
      {!retestInfo.due && retestInfo.daysUntil !== null && (
        <div style={{ fontSize: 8, color: C.textDim, marginBottom: 6 }}>
          Next retest in {retestInfo.daysUntil} days
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <button onClick={onTestFitness} style={{ padding: "8px 12px", borderRadius: 10, fontSize: 11, fontWeight: 700, background: C.purple + "15", border: `1px solid ${C.purple}40`, color: C.purple, cursor: "pointer", fontFamily: "inherit" }}>🏃 Test Fitness</button>
        <button onClick={onLogCardio} style={{ padding: "8px 12px", borderRadius: 10, fontSize: 11, fontWeight: 700, background: C.tealBg, border: `1px solid ${C.teal}40`, color: C.teal, cursor: "pointer", fontFamily: "inherit" }}>+ Log Cardio</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// VO2 MAX TEST MODAL — 4 OPTIONS (NASM-aligned)
// ═══════════════════════════════════════════════════════════════

export function VO2TestModal({ onClose, onSaved }) {
  const injuries = useMemo(() => getInjuries().filter(i => i.status !== "resolved"), []);
  const hrSettings = getHRSettings();
  const recommended = useMemo(() => getRecommendedTest(injuries, 1), [injuries]);

  const [testType, setTestType] = useState(recommended.test === "rockport" ? "walk" : recommended.test === "talk_test" ? "talk" : "step");
  const [step, setStep] = useState("choose"); // choose | test | result

  // Shared inputs
  const [hr, setHR] = useState("");
  const [weight, setWeight] = useState(String(hrSettings.weight || "185"));
  const [age, setAge] = useState(String(hrSettings.age || "35"));
  const [result, setResult] = useState(null);

  // Step test state
  const stepCountdown = useCountdown(180); // 3 minutes
  const metronome = useMetronome(96);
  const [recoveryHR, setRecoveryHR] = useState("");
  const recoveryCountdown = useCountdown(60); // 60-second recovery count

  // Walk/Run test state
  const stopwatch = useStopwatch();
  const [manualTime, setManualTime] = useState("");

  // Talk test state
  const [talkResponse, setTalkResponse] = useState(null);

  // Resting measurements
  const [restingHR, setRestingHR] = useState(String(hrSettings.restingHR || ""));
  const [bpSystolic, setBpSystolic] = useState(String(hrSettings.bpSystolic || ""));
  const [bpDiastolic, setBpDiastolic] = useState(String(hrSettings.bpDiastolic || ""));
  const [hrFormula, setHrFormula] = useState(hrSettings.formula || "regression");

  const bpClass = (bpSystolic && bpDiastolic) ? classifyBP(parseInt(bpSystolic), parseInt(bpDiastolic)) : null;
  const calcMaxHR = getHRMax(parseInt(age) || 35, hrFormula);

  const doCalculate = () => {
    let vo2, category, testLabel, startingZone;

    if (testType === "step") {
      const rhr = parseInt(recoveryHR);
      if (!rhr) return;
      vo2 = calcVO2StepTest(rhr, parseInt(age) || 35, true);
      category = getStepTestCategory(rhr, parseInt(age) || 35, true);
      startingZone = getStartingZoneFromStepTest(category.label);
      testLabel = "ymca_step";
    } else if (testType === "walk") {
      const t = parseFloat(manualTime) || stopwatch.timeMinutes;
      const h = parseInt(hr) || 120;
      if (!t) return;
      vo2 = calcVO2Rockport(parseFloat(weight) || 185, parseInt(age) || 35, true, t, h);
      vo2 = Math.max(10, Math.min(80, vo2));
      category = getVO2Category(vo2, parseInt(age) || 35, true);
      testLabel = "rockport";
    } else if (testType === "run") {
      const t = parseFloat(manualTime) || stopwatch.timeMinutes;
      if (!t) return;
      vo2 = calcVO2Cooper(t);
      vo2 = Math.max(10, Math.min(80, vo2));
      category = getVO2Category(vo2, parseInt(age) || 35, true);
      testLabel = "cooper";
    } else if (testType === "talk") {
      if (!talkResponse) return;
      const tz = talkTestZone(talkResponse);
      vo2 = null; // Talk test doesn't calculate VO2
      category = { label: `Zone ${tz.zone} Start`, color: tz.zone === 1 ? "#22c55e" : tz.zone === 2 ? "#eab308" : "#ef4444" };
      startingZone = { zone: tz.zone, desc: tz.guidance };
      testLabel = "talk_test";
    }

    setResult({ vo2, category, testLabel, startingZone });
    setStep("result");
  };

  const doSave = () => {
    if (!result) return;
    // Save HR settings
    setHRSettings({
      age: parseInt(age) || 35,
      weight: parseFloat(weight) || 185,
      restingHR: parseInt(restingHR) || null,
      bpSystolic: parseInt(bpSystolic) || null,
      bpDiastolic: parseInt(bpDiastolic) || null,
      formula: hrFormula,
      maxHR: calcMaxHR,
      betaBlocker: hrSettings.betaBlocker,
      lastTestType: result.testLabel,
    });
    saveVO2Test({
      testType: result.testLabel,
      timeMinutes: parseFloat(manualTime) || stopwatch.timeMinutes || null,
      heartRate: parseInt(hr) || null,
      recoveryHR: parseInt(recoveryHR) || null,
      vo2max: result.vo2,
      category: typeof result.category === "object" ? result.category.label : result.category,
      startingZone: result.startingZone?.zone || null,
    });
    onSaved?.();
    onClose();
  };

  const modalStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center" };
  const panelStyle = { background: C.bg, borderRadius: "20px 20px 0 0", padding: "20px 16px", width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", border: `1px solid ${C.border}`, borderBottom: "none" };
  const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
  const labelStyle = { fontSize: 10, color: C.textDim, fontWeight: 600, display: "block", marginBottom: 3 };

  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={panelStyle} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>CARDIO ASSESSMENT</div>
            <div style={{ fontSize: 11, color: C.textMuted }}>NASM CPT 7th Edition Protocol</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textDim, fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        {/* ── STEP 1: CHOOSE TEST ─────────────────────────── */}
        {step === "choose" && (<>
          {/* Resting Measurements */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.info, letterSpacing: 1.5, marginBottom: 6 }}>RESTING MEASUREMENTS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
              <div>
                <label style={labelStyle}>Resting HR</label>
                <input value={restingHR} onChange={e => setRestingHR(e.target.value)} type="number" placeholder="72" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>BP Systolic</label>
                <input value={bpSystolic} onChange={e => setBpSystolic(e.target.value)} type="number" placeholder="120" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>BP Diastolic</label>
                <input value={bpDiastolic} onChange={e => setBpDiastolic(e.target.value)} type="number" placeholder="80" style={inputStyle} />
              </div>
            </div>
            {bpClass && bpClass.flag && (
              <div style={{ fontSize: 9, padding: "6px 8px", borderRadius: 6, background: bpClass.color + "10", color: bpClass.color, marginBottom: 6 }}>
                ⚠️ {bpClass.label}: {bpClass.msg}
              </div>
            )}
            {/* HR Max Formula */}
            <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
              <div style={{ fontSize: 9, color: C.textDim, alignSelf: "center", marginRight: 4 }}>HRmax:</div>
              {[
                { id: "regression", label: `Regression: ${getHRMax(parseInt(age)||35, "regression")}`, desc: "208 − (0.7×age) — NASM recommended" },
                { id: "traditional", label: `Traditional: ${getHRMax(parseInt(age)||35, "traditional")}`, desc: "220 − age" },
              ].map(f => (
                <button key={f.id} onClick={() => setHrFormula(f.id)} style={{ flex: 1, padding: "5px 6px", borderRadius: 6, fontSize: 9, fontWeight: 600, background: hrFormula === f.id ? C.tealBg : "transparent", border: `1px solid ${hrFormula === f.id ? C.teal + "40" : C.border}`, color: hrFormula === f.id ? C.teal : C.textDim, cursor: "pointer", fontFamily: "inherit" }}>{f.label}</button>
              ))}
            </div>
            {hrSettings.betaBlocker && (
              <div style={{ fontSize: 9, color: C.warning, padding: "5px 8px", background: C.warning + "10", borderRadius: 6 }}>
                ⚠️ Beta-blocker detected — HR max may not be accurate. We'll use RPE-based intensity instead.
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              <div><label style={labelStyle}>Weight (lbs)</label><input value={weight} onChange={e => setWeight(e.target.value)} type="number" style={inputStyle} /></div>
              <div><label style={labelStyle}>Age</label><input value={age} onChange={e => setAge(e.target.value)} type="number" style={inputStyle} /></div>
            </div>
          </div>

          {/* Test Selection */}
          <div style={{ fontSize: 10, fontWeight: 700, color: C.purple, letterSpacing: 1.5, marginBottom: 6 }}>CHOOSE YOUR TEST</div>
          {recommended.reason && <div style={{ fontSize: 9, color: C.info, marginBottom: 8, padding: "4px 8px", background: C.info + "08", borderRadius: 6 }}>{recommended.reason}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            {[
              { id: "step", label: "Step Test", desc: "YMCA 3-Min", icon: "🪜", sub: "12\" bench + metronome", disabled: recommended.test === "rockport" || recommended.test === "talk_test" },
              { id: "walk", label: "1-Mile Walk", desc: "Rockport", icon: "🚶", sub: "Track or treadmill" },
              { id: "run", label: "1.5-Mile Run", desc: "Cooper", icon: "🏃", sub: "Max effort run", disabled: recommended.test === "talk_test" },
              { id: "talk", label: "Talk Test", desc: "Informal", icon: "💬", sub: "No equipment needed" },
            ].map(t => (
              <div key={t.id} onClick={() => !t.disabled && setTestType(t.id)} style={{
                background: testType === t.id ? C.tealBg : t.disabled ? C.bgGlass : C.bgCard,
                border: `1px solid ${testType === t.id ? C.teal : C.border}`,
                borderRadius: 12, padding: 10, cursor: t.disabled ? "not-allowed" : "pointer", textAlign: "center",
                opacity: t.disabled ? 0.4 : 1,
              }}>
                <div style={{ fontSize: 22 }}>{t.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: testType === t.id ? C.teal : C.text, marginTop: 2 }}>{t.label}</div>
                <div style={{ fontSize: 8, color: C.textDim }}>{t.desc}</div>
                <div style={{ fontSize: 7, color: C.textDim }}>{t.sub}</div>
                {t.disabled && <div style={{ fontSize: 7, color: C.warning, marginTop: 2 }}>Not recommended</div>}
              </div>
            ))}
          </div>

          <button onClick={() => setStep("test")} style={{ width: "100%", padding: "14px", borderRadius: 12, fontSize: 14, fontWeight: 700, background: `linear-gradient(135deg,${C.teal},${C.teal}dd)`, color: "#000", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            Start {testType === "step" ? "Step" : testType === "walk" ? "Walk" : testType === "run" ? "Run" : "Talk"} Test →
          </button>
        </>)}

        {/* ── STEP 2: PERFORM TEST ─────────────────────────── */}
        {step === "test" && testType === "step" && (<>
          <StepTestIllustration />
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, marginTop: 10, marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.info, marginBottom: 6 }}>INSTRUCTIONS</div>
            {["Step up-up-down-down on a 12-inch bench at 96 BPM", "Each beat = one foot movement (4 beats per cycle)", "That's 24 complete step cycles per minute", "Maintain rhythm for exactly 3 minutes", "Immediately sit and count pulse for 60 seconds"].map((s, i) => (
              <div key={i} style={{ fontSize: 11, color: C.text, padding: "2px 0" }}>{i + 1}. {s}</div>
            ))}
          </div>

          {/* Phase 1: 3-minute stepping with metronome */}
          {!stepCountdown.done && (
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: 2, marginBottom: 4 }}>STEP FOR 3 MINUTES</div>
              <div style={{ fontSize: 56, fontWeight: 800, color: stepCountdown.running ? C.teal : C.text, fontFamily: "'Bebas Neue',sans-serif" }}>
                {Math.floor(stepCountdown.seconds / 60)}:{(stepCountdown.seconds % 60).toString().padStart(2, "0")}
              </div>
              <ProgressBar value={180 - stepCountdown.seconds} max={180} color={C.teal} height={4} />
              {metronome.active && <div style={{ fontSize: 9, color: C.teal, marginTop: 4 }}>🔊 Metronome: 96 BPM — step on each beat</div>}
              {!stepCountdown.running && stepCountdown.seconds === 180 && (
                <button onClick={() => { stepCountdown.start(); metronome.start(); }} style={{ marginTop: 10, padding: "14px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700, background: `linear-gradient(135deg,${C.teal},#00a89f)`, color: "#000", border: "none", cursor: "pointer", fontFamily: "inherit" }}>▶ Start (with metronome)</button>
              )}
              {stepCountdown.running && (
                <button onClick={() => { stepCountdown.stop(); metronome.stop(); }} style={{ marginTop: 10, padding: "14px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700, background: C.danger, color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit" }}>⏹ Stop Early</button>
              )}
            </div>
          )}

          {/* Phase 2: 60-second recovery HR count */}
          {stepCountdown.done && (
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              {metronome.active && metronome.stop()}
              <div style={{ fontSize: 12, fontWeight: 700, color: C.success, marginBottom: 8 }}>3 minutes complete! Sit down immediately.</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.warning, letterSpacing: 2, marginBottom: 4 }}>COUNT YOUR PULSE FOR 60 SECONDS</div>
              {!recoveryCountdown.done && (
                <>
                  <div style={{ fontSize: 56, fontWeight: 800, color: recoveryCountdown.running ? C.warning : C.text, fontFamily: "'Bebas Neue',sans-serif" }}>
                    {recoveryCountdown.seconds}s
                  </div>
                  {!recoveryCountdown.running && recoveryCountdown.seconds === 60 && (
                    <button onClick={recoveryCountdown.start} style={{ padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700, background: C.warning + "20", border: `1px solid ${C.warning}`, color: C.warning, cursor: "pointer", fontFamily: "inherit" }}>Start 60s Pulse Count</button>
                  )}
                </>
              )}
              {recoveryCountdown.done && (
                <div style={{ fontSize: 13, color: C.success, fontWeight: 700, marginBottom: 8 }}>Time! Enter your pulse count:</div>
              )}
              <div style={{ marginTop: 8 }}>
                <label style={{ fontSize: 10, color: C.textDim, fontWeight: 600 }}>60-Second Recovery Heart Rate:</label>
                <input value={recoveryHR} onChange={e => setRecoveryHR(e.target.value)} type="number" placeholder="e.g. 104" style={{ ...inputStyle, textAlign: "center", fontSize: 24, fontWeight: 800, marginTop: 4 }} />
              </div>
              <button onClick={doCalculate} disabled={!recoveryHR} style={{ marginTop: 10, width: "100%", padding: "14px", borderRadius: 12, fontSize: 14, fontWeight: 700, background: recoveryHR ? `linear-gradient(135deg,${C.teal},#00a89f)` : C.bgElevated, color: recoveryHR ? "#000" : C.textDim, border: "none", cursor: recoveryHR ? "pointer" : "not-allowed", fontFamily: "inherit" }}>Calculate Result</button>
            </div>
          )}
        </>)}

        {step === "test" && (testType === "walk" || testType === "run") && (<>
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.info, marginBottom: 6 }}>
              {testType === "walk" ? "ROCKPORT 1-MILE WALK TEST" : "COOPER 1.5-MILE RUN TEST"}
            </div>
            {testType === "walk" ? (
              ["Walk 1 mile as fast as you can WITHOUT jogging", "Maintain a brisk walking pace the entire time", "Use a treadmill (set to 1.0 mile) or measured track", "Record heart rate immediately at finish (within 15 seconds)"].map((s, i) => (
                <div key={i} style={{ fontSize: 11, color: C.text, padding: "2px 0" }}>{i + 1}. {s}</div>
              ))
            ) : (
              ["Run 1.5 miles as fast as you can", "This is a MAXIMAL effort test — push hard", "Use a measured track or treadmill", "Warm up for 5-10 minutes first"].map((s, i) => (
                <div key={i} style={{ fontSize: 11, color: C.text, padding: "2px 0" }}>{i + 1}. {s}</div>
              ))
            )}
          </div>

          {/* Timer */}
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 56, fontWeight: 800, color: stopwatch.running ? C.teal : C.text, fontFamily: "'Bebas Neue',sans-serif" }}>{stopwatch.fmt}</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              {!stopwatch.running && stopwatch.totalSeconds === 0 && (
                <button onClick={stopwatch.start} style={{ padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700, background: `linear-gradient(135deg,${C.teal},#00a89f)`, color: "#000", border: "none", cursor: "pointer", fontFamily: "inherit" }}>▶ Start Timer</button>
              )}
              {stopwatch.running && (
                <button onClick={stopwatch.stop} style={{ padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700, background: C.danger, color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit" }}>⏹ Done!</button>
              )}
              {!stopwatch.running && stopwatch.totalSeconds > 0 && (
                <button onClick={stopwatch.reset} style={{ padding: "8px 16px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.textMuted, cursor: "pointer", fontFamily: "inherit" }}>Reset</button>
              )}
            </div>
          </div>

          {/* Manual time entry */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 10, color: C.textDim, fontWeight: 600 }}>Or enter time manually (minutes, e.g. 12.5):</label>
            <input value={manualTime} onChange={e => setManualTime(e.target.value)} type="number" step="0.1" placeholder={stopwatch.totalSeconds > 0 ? stopwatch.timeMinutes.toFixed(2) : testType === "walk" ? "e.g. 15.5" : "e.g. 12.0"} style={{ ...inputStyle, marginTop: 3 }} />
          </div>

          {testType === "walk" && (
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 10, color: C.textDim, fontWeight: 600 }}>Heart Rate at Finish (bpm):</label>
              <input value={hr} onChange={e => setHR(e.target.value)} type="number" placeholder="e.g. 140" style={{ ...inputStyle, marginTop: 3 }} />
            </div>
          )}

          <button onClick={doCalculate} disabled={!(manualTime || stopwatch.totalSeconds > 0)} style={{ width: "100%", padding: "14px", borderRadius: 12, fontSize: 14, fontWeight: 700, background: (manualTime || stopwatch.totalSeconds > 0) ? `linear-gradient(135deg,${C.teal},#00a89f)` : C.bgElevated, color: (manualTime || stopwatch.totalSeconds > 0) ? "#000" : C.textDim, border: "none", cursor: (manualTime || stopwatch.totalSeconds > 0) ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
            Calculate VO2 Max
          </button>
        </>)}

        {step === "test" && testType === "talk" && (<>
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.info, marginBottom: 6 }}>TALK TEST</div>
            <div style={{ fontSize: 11, color: C.text, lineHeight: 1.5 }}>
              During your next moderate walk or exercise, try talking normally. Then select the option that best describes your experience:
            </div>
          </div>
          {[
            { id: "easy", icon: "😊", label: "I can talk comfortably", desc: "Full sentences, no trouble at all", color: C.success },
            { id: "harder", icon: "😤", label: "I can talk but it's harder", desc: "Short sentences, need to pause for breath", color: C.warning },
            { id: "few_words", icon: "😰", label: "Only a few words at a time", desc: "Speaking takes real effort", color: C.orange },
            { id: "cant_talk", icon: "🥵", label: "I can't really talk", desc: "Too breathless to hold conversation", color: C.danger },
          ].map(opt => (
            <div key={opt.id} onClick={() => setTalkResponse(opt.id)} style={{
              display: "flex", alignItems: "center", gap: 12, padding: 12, marginBottom: 6,
              background: talkResponse === opt.id ? opt.color + "10" : C.bgCard,
              border: `1px solid ${talkResponse === opt.id ? opt.color + "40" : C.border}`,
              borderRadius: 12, cursor: "pointer",
            }}>
              <span style={{ fontSize: 24 }}>{opt.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: talkResponse === opt.id ? opt.color : C.text }}>{opt.label}</div>
                <div style={{ fontSize: 10, color: C.textMuted }}>{opt.desc}</div>
              </div>
            </div>
          ))}
          <button onClick={doCalculate} disabled={!talkResponse} style={{ marginTop: 8, width: "100%", padding: "14px", borderRadius: 12, fontSize: 14, fontWeight: 700, background: talkResponse ? `linear-gradient(135deg,${C.teal},#00a89f)` : C.bgElevated, color: talkResponse ? "#000" : C.textDim, border: "none", cursor: talkResponse ? "pointer" : "not-allowed", fontFamily: "inherit" }}>Determine My Zone</button>
        </>)}

        {/* Back button during test */}
        {step === "test" && (
          <button onClick={() => { setStep("choose"); metronome.stop(); }} style={{ marginTop: 8, width: "100%", padding: "10px", borderRadius: 10, fontSize: 11, background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted, cursor: "pointer", fontFamily: "inherit" }}>← Back to test selection</button>
        )}

        {/* ── STEP 3: RESULTS ──────────────────────────────── */}
        {step === "result" && result && (<>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            {result.vo2 ? (
              <>
                <div style={{ fontSize: 56, fontWeight: 800, color: typeof result.category === "object" ? result.category.color : C.teal, fontFamily: "'Bebas Neue',sans-serif" }}>{result.vo2}</div>
                <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 2, marginBottom: 6 }}>ESTIMATED VO2 MAX (ml/kg/min)</div>
              </>
            ) : (
              <div style={{ fontSize: 28, fontWeight: 800, color: C.teal, fontFamily: "'Bebas Neue',sans-serif", marginBottom: 6 }}>ZONE DETERMINED</div>
            )}
            <Badge color={typeof result.category === "object" ? result.category.color : C.teal}>
              {typeof result.category === "object" ? `${result.category.emoji || ""} ${result.category.label}` : result.category}
            </Badge>
          </div>

          {/* Starting zone recommendation */}
          {result.startingZone && (
            <div style={{ background: C.tealBg, border: `1px solid ${C.teal}30`, borderRadius: 12, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: 1.5, marginBottom: 4 }}>YOUR STARTING CARDIO ZONE</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Zone {result.startingZone.zone}{result.startingZone.range ? ` (${result.startingZone.range})` : ""}</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{result.startingZone.desc}</div>
            </div>
          )}

          {/* HR Zones display */}
          {!hrSettings.betaBlocker && (
            <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.danger, letterSpacing: 1.5, marginBottom: 6 }}>YOUR HEART RATE ZONES</div>
              {getNASMZones(parseInt(age) || 35, hrFormula).zones.map(z => (
                <div key={z.zone} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: z.color }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: z.color, minWidth: 22 }}>Z{z.zone}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.text, minWidth: 70 }}>{z.name}</span>
                  <span style={{ fontSize: 12, color: C.teal, fontWeight: 700, minWidth: 55 }}>{z.min}-{z.max}</span>
                  <span style={{ fontSize: 9, color: C.textDim, flex: 1 }}>{z.desc}</span>
                </div>
              ))}
            </div>
          )}

          {/* VO2 trend comparison */}
          {(() => {
            const trend = getVO2Trend();
            if (!trend || !result.vo2) return null;
            return (
              <div style={{ padding: 10, background: trend.improving ? C.success + "08" : C.warning + "08", borderRadius: 10, border: `1px solid ${trend.improving ? C.success : C.warning}30`, marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: trend.improving ? C.success : C.warning }}>
                  {trend.improving
                    ? `VO2max improved from ${trend.previous} to ${result.vo2} (+${trend.pctChange}%)`
                    : `VO2max: ${result.vo2} (prev: ${trend.previous}). Check overtraining signals — consider more Zone 1 base work.`}
                </div>
              </div>
            );
          })()}

          <button onClick={doSave} style={{ width: "100%", padding: "14px", borderRadius: 12, fontSize: 14, fontWeight: 700, background: `linear-gradient(135deg,${C.success},#16a34a)`, color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit", marginBottom: 8 }}>
            💾 Save Result
          </button>
          <button onClick={() => { setStep("choose"); setResult(null); }} style={{ width: "100%", padding: "10px", borderRadius: 10, fontSize: 11, background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted, cursor: "pointer", fontFamily: "inherit" }}>← Try a different test</button>
        </>)}

        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CARDIO SESSION LOGGER (enhanced with zone auto-classify, calories)
// ═══════════════════════════════════════════════════════════════

export function CardioLogModal({ onClose, onSaved }) {
  const hrSettings = getHRSettings();
  const age = hrSettings.age || 35;
  const [type, setType] = useState("Walking");
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [avgHR, setAvgHR] = useState("");
  const [rpe, setRpe] = useState(5);
  const [notes, setNotes] = useState("");
  const [route, setRoute] = useState("");

  // Auto-classify zone
  const autoZone = avgHR && !hrSettings.betaBlocker
    ? classifyHRZone(parseInt(avgHR), age, hrSettings.formula)
    : null;
  const rpeZone = rpe <= 4 ? 1 : rpe <= 6 ? 2 : 3;
  const displayZone = autoZone || { zone: rpeZone, name: RPE_ZONES[rpeZone - 1]?.name || "—", color: RPE_ZONES[rpeZone - 1]?.color || C.teal };

  // Calorie estimate
  const calories = duration ? estimateCalories(type, parseInt(duration), hrSettings.weight || 185) : 0;

  const save = () => {
    if (!duration) return;
    saveCardioSession({
      type, duration: parseInt(duration),
      distance: distance ? parseFloat(distance) : null,
      avgHR: avgHR ? parseInt(avgHR) : null,
      rpe, zone: displayZone.zone,
      notes, route, calories,
    });
    onSaved?.();
    onClose();
  };

  const types = ["Walking", "Cycling", "Swimming", "Rowing", "Elliptical", "Running", "Jogging", "HIIT", "Sport-Specific"];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: C.bg, borderRadius: "20px 20px 0 0", padding: "20px 16px", width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto", border: `1px solid ${C.border}`, borderBottom: "none" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>LOG CARDIO</div>
            <div style={{ fontSize: 11, color: C.textMuted }}>Track your cardio session</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textDim, fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        {/* Activity type */}
        <div style={{ fontSize: 10, color: C.textDim, fontWeight: 600, marginBottom: 4 }}>Activity</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
          {types.map(t => (
            <button key={t} onClick={() => setType(t)} style={{
              padding: "5px 10px", borderRadius: 8, fontSize: 10, fontWeight: 600, cursor: "pointer",
              background: type === t ? C.tealBg : "transparent", border: `1px solid ${type === t ? C.teal : C.border}`,
              color: type === t ? C.teal : C.textDim, fontFamily: "inherit",
            }}>{t}</button>
          ))}
        </div>

        {/* Duration + Distance */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 10, color: C.textDim, fontWeight: 600, display: "block", marginBottom: 3 }}>Duration (min) *</label>
            <input value={duration} onChange={e => setDuration(e.target.value)} type="number" placeholder="25" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 10, color: C.textDim, fontWeight: 600, display: "block", marginBottom: 3 }}>Distance (mi)</label>
            <input value={distance} onChange={e => setDistance(e.target.value)} type="number" step="0.1" placeholder="optional" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>

        {/* Heart Rate */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 10, color: C.textDim, fontWeight: 600, display: "block", marginBottom: 3 }}>Avg Heart Rate (optional — from wearable or manual check)</label>
          <input value={avgHR} onChange={e => setAvgHR(e.target.value)} type="number" placeholder="e.g. 135" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          {autoZone && (
            <div style={{ fontSize: 10, marginTop: 4, padding: "4px 8px", background: autoZone.color + "10", borderRadius: 6, color: autoZone.color, fontWeight: 600 }}>
              This session: Zone {autoZone.zone} ({autoZone.pctMax}% HRmax) — {autoZone.name}
            </div>
          )}
        </div>

        {/* RPE */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 10, color: C.textDim, fontWeight: 600, display: "block", marginBottom: 3 }}>RPE (1-10)</label>
          <div style={{ display: "flex", gap: 3 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => (
              <button key={v} onClick={() => setRpe(v)} style={{
                flex: 1, padding: "6px 0", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer",
                background: rpe === v ? C.teal + "20" : "transparent",
                border: `1px solid ${rpe === v ? C.teal : C.border}`,
                color: rpe === v ? C.teal : C.textDim, fontFamily: "inherit",
              }}>{v}</button>
            ))}
          </div>
        </div>

        {/* Route/Location note */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 10, color: C.textDim, fontWeight: 600, display: "block", marginBottom: 3 }}>Route / Location (optional)</label>
          <input value={route} onChange={e => setRoute(e.target.value)} placeholder="e.g. Neighborhood loop, Gym treadmill" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 10, color: C.textDim, fontWeight: 600, display: "block", marginBottom: 3 }}>Notes (optional)</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="How did it feel?" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        </div>

        {/* Summary before save */}
        {duration && (
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1, textAlign: "center", padding: 8, background: displayZone.color + "10", borderRadius: 8 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: displayZone.color, fontFamily: "'Bebas Neue',sans-serif" }}>Z{displayZone.zone}</div>
              <div style={{ fontSize: 8, color: C.textDim }}>{displayZone.name}</div>
            </div>
            <div style={{ flex: 1, textAlign: "center", padding: 8, background: C.bgGlass, borderRadius: 8 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.teal, fontFamily: "'Bebas Neue',sans-serif" }}>{duration}</div>
              <div style={{ fontSize: 8, color: C.textDim }}>minutes</div>
            </div>
            <div style={{ flex: 1, textAlign: "center", padding: 8, background: C.bgGlass, borderRadius: 8 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.orange, fontFamily: "'Bebas Neue',sans-serif" }}>~{calories}</div>
              <div style={{ fontSize: 8, color: C.textDim }}>cal</div>
            </div>
          </div>
        )}

        <button onClick={save} disabled={!duration} style={{
          width: "100%", padding: "14px", borderRadius: 12, fontSize: 14, fontWeight: 700,
          background: duration ? `linear-gradient(135deg,${C.teal},${C.teal}dd)` : C.bgElevated,
          color: duration ? "#000" : C.textDim, border: "none", cursor: duration ? "pointer" : "not-allowed",
          fontFamily: "inherit",
        }}>Save Cardio Session</button>
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HEART RATE ZONES CARD (NASM 3-Zone Model)
// ═══════════════════════════════════════════════════════════════

export function HRZonesCard({ age, maxHROverride, betaBlocker }) {
  if (betaBlocker) {
    return (
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.warning, letterSpacing: 1.5, marginBottom: 8 }}>INTENSITY ZONES (RPE-BASED)</div>
        <div style={{ fontSize: 9, color: C.warning, padding: "6px 8px", background: C.warning + "10", borderRadius: 6, marginBottom: 10 }}>
          ⚠️ Your HR max calculation may not be accurate due to beta-blocker medication. We'll use RPE-based intensity instead of heart rate zones.
        </div>
        {RPE_ZONES.map(z => (
          <div key={z.zone} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: z.color }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: z.color, minWidth: 22 }}>Z{z.zone}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.text, minWidth: 40 }}>RPE {z.rpe}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: C.text, minWidth: 80 }}>{z.name}</span>
            <span style={{ fontSize: 9, color: C.textDim, flex: 1 }}>{z.desc}</span>
          </div>
        ))}
      </div>
    );
  }

  const { maxHR, zones } = getNASMZones(age || 35, "regression", maxHROverride);
  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.danger, letterSpacing: 1.5 }}>NASM HEART RATE ZONES</div>
        <span style={{ fontSize: 9, color: C.textDim }}>Max HR: {maxHR} bpm</span>
      </div>
      {zones.map(z => (
        <div key={z.zone} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ width: 10, height: 10, borderRadius: 5, background: z.color, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: z.color, minWidth: 22 }}>Z{z.zone}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.text, minWidth: 90 }}>{z.name}</span>
          <span style={{ fontSize: 12, color: C.teal, fontWeight: 700, minWidth: 55 }}>{z.min}-{z.max}</span>
          <span style={{ fontSize: 9, color: C.textDim, flex: 1 }}>{z.desc}</span>
        </div>
      ))}
      <div style={{ marginTop: 8, fontSize: 9, color: C.textDim, lineHeight: 1.5 }}>
        Based on NASM CPT 7th Edition 3-zone model. HRmax = 208 − (0.7 × age).
      </div>
    </div>
  );
}
