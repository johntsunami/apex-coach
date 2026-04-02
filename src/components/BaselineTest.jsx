// ═══════════════════════════════════════════════════════════════
// APEX Coach — Baseline Fitness Assessment Component
// 7 standard tests with injury-aware alternatives, timers,
// immediate norm feedback, and retest comparison
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useMemo } from "react";
import { getInjuries } from "../utils/injuries.js";
import ExerciseImage from "./ExerciseImage.jsx";
import {
  BASELINE_TESTS,
  scoreTest,
  computeOverallScore,
  deriveCapabilityTags,
  compareBaselines,
  saveBaselineTest,
  getLatestBaseline,
  getPreviousBaseline,
  getRetestInfo,
} from "../utils/baselineTest.js";

// ── Theme (matches App.jsx) ────────────────────────────────────
const C={bg:"#060b18",bgCard:"#0d1425",bgElevated:"#162040",bgGlass:"rgba(255,255,255,0.04)",border:"rgba(255,255,255,0.08)",text:"#e8ecf4",textMuted:"#7a8ba8",textDim:"#4a5a78",teal:"#00d2c8",tealGlow:"rgba(0,210,200,0.15)",tealBg:"rgba(0,210,200,0.08)",success:"#22c55e",danger:"#ef4444",warning:"#eab308",info:"#3b82f6",orange:"#f97316",purple:"#a855f7"};
function Card({children,style,onClick,glow}){return(<div onClick={onClick} style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:16,padding:18,boxShadow:glow?`0 0 25px ${glow}`:"none",cursor:onClick?"pointer":"default",...style}}>{children}</div>);}
function Btn({children,onClick,disabled,style,variant="teal",size="lg",icon}){const v={teal:{background:`linear-gradient(135deg,${C.teal},#00a89f)`,color:"#000",fontWeight:700},dark:{background:C.bgElevated,color:C.text,border:`1px solid ${C.border}`},ghost:{background:"transparent",color:C.textMuted},purple:{background:`linear-gradient(135deg,${C.purple},#7c3aed)`,color:"#fff",fontWeight:700},danger:{background:C.danger,color:"#fff",fontWeight:700}};const s={sm:{padding:"8px 14px",fontSize:12},md:{padding:"12px 20px",fontSize:14},lg:{padding:"16px 24px",fontSize:16}};return(<button onClick={onClick} disabled={disabled} style={{...v[variant],...s[size],borderRadius:14,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.4:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,width:"100%",fontFamily:"inherit",border:v[variant]?.border||"none",...style}}>{icon&&<span>{icon}</span>}{children}</button>);}
function Badge({children,color=C.teal}){return <span style={{display:"inline-flex",padding:"4px 10px",borderRadius:8,fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color,background:color+"15",border:`1px solid ${color}25`}}>{children}</span>;}
function ProgressBar({value,max=100,color=C.teal,height=6}){return(<div style={{width:"100%",height,background:C.border,borderRadius:height/2,overflow:"hidden"}}><div style={{width:`${Math.min(100,(value/max)*100)}%`,height:"100%",background:color,borderRadius:height/2,transition:"width 0.6s ease"}}/></div>);}

// ── Timer Hook ─────────────────────────────────────────────────
function useTimer() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      clearInterval(ref.current);
    }
    return () => clearInterval(ref.current);
  }, [running]);

  const start = () => { setSeconds(0); setRunning(true); };
  const stop = () => setRunning(false);
  const reset = () => { setRunning(false); setSeconds(0); };
  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return { seconds, running, start, stop, reset, fmt };
}

// ── 30-Second Countdown Hook ──────────────────────────────────
function useCountdown(duration = 30) {
  const [seconds, setSeconds] = useState(duration);
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

  const start = () => { setSeconds(duration); setRunning(true); };
  const stop = () => setRunning(false);
  const reset = () => { setRunning(false); setSeconds(duration); };

  return { seconds, running, done: !running && seconds === 0, start, stop, reset };
}

// ── SVG Illustrations for baseline tests ──────────────────────
function TestIllustration({ testId }) {
  const illustrations = {
    pushups: (
      <svg viewBox="0 0 300 120" style={{width:"100%",height:100,display:"block"}}>
        <rect width="300" height="120" rx="14" fill="#0a1628"/>
        <text x="150" y="16" textAnchor="middle" fill="#4a5a78" fontSize="9" fontWeight="600">PUSH-UP FORM</text>
        <line x1="30" y1="105" x2="270" y2="105" stroke="#1a2a45" strokeWidth="2"/>
        {/* Top position */}
        <circle cx="80" cy="48" r="7" fill="none" stroke="#00d2c8" strokeWidth="2"/>
        <line x1="80" y1="55" x2="120" y2="62" stroke="#00d2c8" strokeWidth="2.5"/>
        <line x1="120" y1="62" x2="170" y2="62" stroke="#00d2c8" strokeWidth="2.5"/>
        <line x1="170" y1="62" x2="200" y2="105" stroke="#00d2c8" strokeWidth="2"/>
        <line x1="80" y1="55" x2="68" y2="105" stroke="#00d2c8" strokeWidth="2"/>
        <line x1="120" y1="62" x2="110" y2="105" stroke="#00d2c8" strokeWidth="2"/>
        <text x="60" y="38" fill="#22c55e" fontSize="8">✓ Straight line</text>
        {/* Bottom position */}
        <circle cx="230" cy="78" r="7" fill="none" stroke="#3b82f6" strokeWidth="2"/>
        <line x1="230" y1="85" x2="252" y2="92" stroke="#3b82f6" strokeWidth="2.5"/>
        <line x1="252" y1="92" x2="270" y2="92" stroke="#3b82f6" strokeWidth="2.5"/>
        <path d="M230 85 L218 105" stroke="#3b82f6" strokeWidth="2"/>
        <line x1="252" y1="92" x2="248" y2="105" stroke="#3b82f6" strokeWidth="2"/>
        <text x="220" y="70" fill="#3b82f6" fontSize="8">Chest to fist</text>
        <rect x="256" y="95" width="8" height="8" fill="#f97316" rx="1"/>
        <text x="260" y="115" textAnchor="middle" fill="#f97316" fontSize="7">Fist height</text>
      </svg>
    ),
    squat: (
      <svg viewBox="0 0 300 120" style={{width:"100%",height:100,display:"block"}}>
        <rect width="300" height="120" rx="14" fill="#0a1628"/>
        <text x="150" y="16" textAnchor="middle" fill="#4a5a78" fontSize="9" fontWeight="600">SQUAT FORM</text>
        <line x1="30" y1="110" x2="270" y2="110" stroke="#1a2a45" strokeWidth="2"/>
        {/* Standing */}
        <circle cx="80" cy="32" r="7" fill="none" stroke="#00d2c8" strokeWidth="2"/>
        <line x1="80" y1="39" x2="80" y2="72" stroke="#00d2c8" strokeWidth="2.5"/>
        <line x1="80" y1="72" x2="80" y2="110" stroke="#00d2c8" strokeWidth="2"/>
        <text x="80" y="120" textAnchor="middle" fill="#4a5a78" fontSize="7">START</text>
        {/* Parallel squat */}
        <circle cx="200" cy="42" r="7" fill="none" stroke="#3b82f6" strokeWidth="2"/>
        <line x1="200" y1="49" x2="200" y2="72" stroke="#3b82f6" strokeWidth="2.5"/>
        <line x1="200" y1="72" x2="180" y2="72" stroke="#3b82f6" strokeWidth="2"/>
        <line x1="180" y1="72" x2="180" y2="110" stroke="#3b82f6" strokeWidth="2"/>
        <line x1="193" y1="72" x2="178" y2="68" stroke="#eab308" strokeWidth="1" strokeDasharray="3"/>
        <text x="172" y="66" fill="#eab308" fontSize="7">Parallel</text>
        <text x="200" y="120" textAnchor="middle" fill="#4a5a78" fontSize="7">BOTTOM</text>
        {/* Check marks */}
        <text x="140" y="88" textAnchor="middle" fill="#22c55e" fontSize="8">✓ Knees track toes</text>
        <text x="140" y="100" textAnchor="middle" fill="#22c55e" fontSize="8">✓ Neutral spine</text>
      </svg>
    ),
    pullups: (
      <svg viewBox="0 0 300 120" style={{width:"100%",height:100,display:"block"}}>
        <rect width="300" height="120" rx="14" fill="#0a1628"/>
        <text x="150" y="16" textAnchor="middle" fill="#4a5a78" fontSize="9" fontWeight="600">PULL-UP / HANG</text>
        <line x1="60" y1="24" x2="240" y2="24" stroke="#7a8ba8" strokeWidth="3"/>
        {/* Dead hang */}
        <circle cx="100" cy="40" r="6" fill="none" stroke="#00d2c8" strokeWidth="2"/>
        <line x1="94" y1="32" x2="88" y2="24" stroke="#00d2c8" strokeWidth="2"/>
        <line x1="106" y1="32" x2="112" y2="24" stroke="#00d2c8" strokeWidth="2"/>
        <line x1="100" y1="46" x2="100" y2="80" stroke="#00d2c8" strokeWidth="2.5"/>
        <line x1="100" y1="80" x2="92" y2="110" stroke="#00d2c8" strokeWidth="2"/>
        <line x1="100" y1="80" x2="108" y2="110" stroke="#00d2c8" strokeWidth="2"/>
        <text x="100" y="118" textAnchor="middle" fill="#4a5a78" fontSize="7">DEAD HANG</text>
        {/* Top of pull-up */}
        <circle cx="200" cy="30" r="6" fill="none" stroke="#3b82f6" strokeWidth="2"/>
        <line x1="194" y1="26" x2="186" y2="24" stroke="#3b82f6" strokeWidth="2"/>
        <line x1="206" y1="26" x2="214" y2="24" stroke="#3b82f6" strokeWidth="2"/>
        <line x1="200" y1="36" x2="200" y2="70" stroke="#3b82f6" strokeWidth="2.5"/>
        <line x1="200" y1="70" x2="192" y2="100" stroke="#3b82f6" strokeWidth="2"/>
        <line x1="200" y1="70" x2="208" y2="100" stroke="#3b82f6" strokeWidth="2"/>
        <line x1="180" y1="24" x2="220" y2="24" stroke="#eab308" strokeWidth="2"/>
        <text x="200" y="118" textAnchor="middle" fill="#4a5a78" fontSize="7">CHIN OVER BAR</text>
      </svg>
    ),
    plank: (
      <svg viewBox="0 0 300 100" style={{width:"100%",height:80,display:"block"}}>
        <rect width="300" height="100" rx="14" fill="#0a1628"/>
        <text x="150" y="16" textAnchor="middle" fill="#4a5a78" fontSize="9" fontWeight="600">PLANK HOLD</text>
        <line x1="30" y1="85" x2="270" y2="85" stroke="#1a2a45" strokeWidth="2"/>
        <circle cx="80" cy="52" r="7" fill="none" stroke="#00d2c8" strokeWidth="2"/>
        <line x1="87" y1="55" x2="220" y2="55" stroke="#00d2c8" strokeWidth="3" strokeLinecap="round"/>
        <line x1="87" y1="55" x2="80" y2="85" stroke="#00d2c8" strokeWidth="2"/>
        <line x1="220" y1="55" x2="230" y2="85" stroke="#00d2c8" strokeWidth="2"/>
        <line x1="220" y1="55" x2="210" y2="85" stroke="#00d2c8" strokeWidth="2"/>
        <text x="150" y="48" textAnchor="middle" fill="#22c55e" fontSize="8">← Straight line →</text>
        <text x="150" y="95" textAnchor="middle" fill="#ef4444" fontSize="8">Stop if hips sag or pike</text>
      </svg>
    ),
    gluteBridge: (
      <svg viewBox="0 0 300 100" style={{width:"100%",height:80,display:"block"}}>
        <rect width="300" height="100" rx="14" fill="#0a1628"/>
        <text x="150" y="16" textAnchor="middle" fill="#4a5a78" fontSize="9" fontWeight="600">GLUTE BRIDGE HOLD</text>
        <line x1="30" y1="85" x2="270" y2="85" stroke="#1a2a45" strokeWidth="2"/>
        <circle cx="80" cy="68" r="7" fill="none" stroke="#00d2c8" strokeWidth="2"/>
        <line x1="87" y1="68" x2="140" y2="48" stroke="#00d2c8" strokeWidth="2.5"/>
        <line x1="140" y1="48" x2="190" y2="48" stroke="#00d2c8" strokeWidth="2.5"/>
        <line x1="190" y1="48" x2="210" y2="85" stroke="#00d2c8" strokeWidth="2"/>
        <line x1="200" y1="65" x2="220" y2="85" stroke="#00d2c8" strokeWidth="2"/>
        <text x="165" y="42" textAnchor="middle" fill="#22c55e" fontSize="8">Squeeze glutes!</text>
        <path d="M160 50 L165 38 L170 50" fill="none" stroke="#eab308" strokeWidth="1.5"/>
      </svg>
    ),
    balance: (
      <svg viewBox="0 0 300 120" style={{width:"100%",height:100,display:"block"}}>
        <rect width="300" height="120" rx="14" fill="#0a1628"/>
        <text x="150" y="16" textAnchor="middle" fill="#4a5a78" fontSize="9" fontWeight="600">SINGLE LEG BALANCE</text>
        <line x1="30" y1="110" x2="270" y2="110" stroke="#1a2a45" strokeWidth="2"/>
        <circle cx="150" cy="32" r="8" fill="none" stroke="#00d2c8" strokeWidth="2"/>
        <line x1="150" y1="40" x2="150" y2="75" stroke="#00d2c8" strokeWidth="2.5"/>
        <line x1="135" y1="55" x2="115" y2="50" stroke="#00d2c8" strokeWidth="2"/>
        <line x1="165" y1="55" x2="185" y2="50" stroke="#00d2c8" strokeWidth="2"/>
        <line x1="150" y1="75" x2="150" y2="110" stroke="#00d2c8" strokeWidth="2.5"/>
        <line x1="150" y1="82" x2="170" y2="90" stroke="#3b82f6" strokeWidth="2" strokeDasharray="3"/>
        <text x="185" y="93" fill="#3b82f6" fontSize="8">Lifted</text>
        <text x="150" y="118" textAnchor="middle" fill="#eab308" fontSize="7">Test BOTH sides</text>
      </svg>
    ),
    sitToStand: (
      <svg viewBox="0 0 300 120" style={{width:"100%",height:100,display:"block"}}>
        <rect width="300" height="120" rx="14" fill="#0a1628"/>
        <text x="150" y="16" textAnchor="middle" fill="#4a5a78" fontSize="9" fontWeight="600">30-SECOND SIT-TO-STAND</text>
        <line x1="30" y1="110" x2="270" y2="110" stroke="#1a2a45" strokeWidth="2"/>
        {/* Seated */}
        <rect x="55" y="70" width="40" height="30" rx="3" fill="none" stroke="#7a8ba8" strokeWidth="1.5"/>
        <circle cx="75" cy="48" r="6" fill="none" stroke="#00d2c8" strokeWidth="2"/>
        <line x1="75" y1="54" x2="75" y2="72" stroke="#00d2c8" strokeWidth="2"/>
        <line x1="75" y1="72" x2="85" y2="110" stroke="#00d2c8" strokeWidth="2"/>
        <text x="75" y="118" textAnchor="middle" fill="#4a5a78" fontSize="7">SIT</text>
        {/* Standing */}
        <circle cx="200" cy="32" r="6" fill="none" stroke="#3b82f6" strokeWidth="2"/>
        <line x1="200" y1="38" x2="200" y2="72" stroke="#3b82f6" strokeWidth="2.5"/>
        <line x1="200" y1="72" x2="192" y2="110" stroke="#3b82f6" strokeWidth="2"/>
        <line x1="200" y1="72" x2="208" y2="110" stroke="#3b82f6" strokeWidth="2"/>
        <text x="200" y="118" textAnchor="middle" fill="#4a5a78" fontSize="7">STAND</text>
        {/* Arrows */}
        <path d="M110 60 L160 60" stroke="#eab308" strokeWidth="1.5" markerEnd="url(#arrowY)"/>
        <path d="M160 70 L110 70" stroke="#eab308" strokeWidth="1.5" markerEnd="url(#arrowY)"/>
        <text x="135" y="55" textAnchor="middle" fill="#eab308" fontSize="8">30s</text>
        <defs><marker id="arrowY" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto"><path d="M0 0 L6 2 L0 4" fill="#eab308"/></marker></defs>
      </svg>
    ),
  };
  return illustrations[testId] || null;
}

// ── Individual Test Screen ────────────────────────────────────
function TestScreen({ test, injuries, onComplete, onSkip, previousResult, gender, age }) {
  const alternative = test.getAlternative(injuries);
  const shouldSkip = test.shouldSkip(injuries);
  const [useAlt, setUseAlt] = useState(!!shouldSkip);
  const [value, setValue] = useState("");
  const [tier, setTier] = useState(test.tiers ? "A" : null);
  const [depth, setDepth] = useState("parallel");
  const [compensations, setCompensations] = useState([]);
  const [fault, setFault] = useState("");
  const [balanceData, setBalanceData] = useState({ left_open: "", right_open: "", left_closed: "", right_closed: "" });
  const [balanceSide, setBalanceSide] = useState("left_open");
  const timer = useTimer();
  const countdown = useCountdown(30);

  const activeTest = useAlt && alternative ? { ...test, name: alternative.name, modification: alternative.modification } : test;
  const testType = (useAlt && alternative?.type) || test.type;

  const handleSubmit = () => {
    let resultValue;
    if (test.id === "balance") {
      resultValue = Math.max(
        parseInt(balanceData.left_open) || 0,
        parseInt(balanceData.right_open) || 0
      );
    } else if (testType === "time") {
      resultValue = timer.seconds || parseInt(value) || 0;
    } else {
      resultValue = parseInt(value) || 0;
    }

    const result = {
      value: resultValue,
      modification: useAlt ? alternative?.modification : null,
      skipped: false,
    };

    // Test-specific extras
    if (test.id === "squat") {
      result.depth = depth;
      result.compensations = compensations;
    }
    if (test.id === "pullups") {
      result.tier = tier;
    }
    if (test.id === "plank") {
      result.fault = fault;
    }
    if (test.id === "balance") {
      result.left_open = parseInt(balanceData.left_open) || 0;
      result.right_open = parseInt(balanceData.right_open) || 0;
      result.left_closed = parseInt(balanceData.left_closed) || 0;
      result.right_closed = parseInt(balanceData.right_closed) || 0;
    }

    onComplete(test.id, result);
  };

  // Score preview
  const previewValue = test.id === "balance"
    ? Math.max(parseInt(balanceData.left_open) || 0, parseInt(balanceData.right_open) || 0)
    : (testType === "time" ? timer.seconds : parseInt(value) || 0);
  const score = previewValue > 0 ? scoreTest(test.id, previewValue, gender, age) : null;

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.purple, letterSpacing: 2, textTransform: "uppercase" }}>{test.category} — {test.standard}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>{activeTest.name}</div>
        <div style={{ fontSize: 12, color: C.textMuted }}>{test.description}</div>
      </div>

      {/* Illustration */}
      <TestIllustration testId={test.id} />

      {/* Skip warning for medical restriction */}
      {shouldSkip && (
        <Card style={{ background: C.danger + "10", borderColor: C.danger + "40" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.danger }}>⚕️ Medical Restriction</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{test.skipReason}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <Btn size="sm" variant="dark" onClick={() => onSkip(test.id, test.skipReason)}>Skip (Recommended)</Btn>
            {alternative && <Btn size="sm" variant="ghost" onClick={() => setUseAlt(true)}>Try Alternative</Btn>}
          </div>
        </Card>
      )}

      {/* Alternative available */}
      {!shouldSkip && alternative && (
        <Card style={{ background: C.warning + "08", borderColor: C.warning + "30", padding: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.warning, letterSpacing: 1 }}>INJURY MODIFICATION AVAILABLE</div>
          <div style={{ fontSize: 12, color: C.text, marginTop: 4 }}>{alternative.name}: {alternative.note}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={() => setUseAlt(false)} style={{ flex: 1, padding: "8px 12px", borderRadius: 10, background: !useAlt ? C.tealBg : "transparent", border: `1px solid ${!useAlt ? C.teal + "40" : C.border}`, color: !useAlt ? C.teal : C.textDim, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Standard</button>
            <button onClick={() => setUseAlt(true)} style={{ flex: 1, padding: "8px 12px", borderRadius: 10, background: useAlt ? C.warning + "15" : "transparent", border: `1px solid ${useAlt ? C.warning + "40" : C.border}`, color: useAlt ? C.warning : C.textDim, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Modified: {alternative.name}</button>
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card style={{ padding: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.info, letterSpacing: 1.5, marginBottom: 6 }}>INSTRUCTIONS</div>
        {test.instructions.map((step, i) => (
          <div key={i} style={{ display: "flex", gap: 8, padding: "4px 0", fontSize: 12, color: C.text }}>
            <span style={{ color: C.teal, fontWeight: 700, minWidth: 16 }}>{i + 1}.</span>
            <span>{step}</span>
          </div>
        ))}
      </Card>

      {/* Form cues + common faults */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Card style={{ padding: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.success, marginBottom: 4 }}>✅ GOOD FORM</div>
          {test.formCues.map((c, i) => <div key={i} style={{ fontSize: 10, color: C.text, padding: "2px 0" }}>{c}</div>)}
        </Card>
        <Card style={{ padding: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.danger, marginBottom: 4 }}>❌ COMMON FAULTS</div>
          {test.commonFaults.map((f, i) => <div key={i} style={{ fontSize: 10, color: C.text, padding: "2px 0" }}>{f}</div>)}
        </Card>
      </div>

      {/* Input area — varies by test type */}
      <Card glow={C.tealGlow} style={{ padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.teal, letterSpacing: 2, marginBottom: 10 }}>RECORD YOUR RESULT</div>

        {/* Tiered test (pull-ups) */}
        {test.tiers && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: C.textDim, marginBottom: 6 }}>SELECT TIER:</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {test.tiers.map(t => (
                <button key={t.id} onClick={() => setTier(t.id)} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${tier === t.id ? C.teal + "60" : C.border}`, background: tier === t.id ? C.tealBg : "transparent", color: tier === t.id ? C.teal : C.textDim, fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>
                  {t.id}: {t.name}
                </button>
              ))}
            </div>
            {tier && <div style={{ fontSize: 9, color: C.textMuted, marginTop: 4 }}>{test.tiers.find(t => t.id === tier)?.desc}</div>}
          </div>
        )}

        {/* Rep-based input */}
        {(testType === "reps" || testType === "count" || testType === "tiered") && test.id !== "balance" && test.id !== "sitToStand" && (
          <div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>
              {tier === "C" ? "Hold time (seconds):" : `Total ${test.unit || "reps"} with proper form:`}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => setValue(v => String(Math.max(0, (parseInt(v) || 0) - 1)))} style={{ width: 44, height: 44, borderRadius: 12, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text, fontSize: 20, cursor: "pointer" }}>-</button>
              <input type="number" inputMode="numeric" value={value} onChange={e => setValue(e.target.value)} style={{ flex: 1, padding: "12px 16px", borderRadius: 12, background: C.bg, border: `1px solid ${C.teal}40`, color: C.teal, fontSize: 28, fontWeight: 800, textAlign: "center", fontFamily: "'Bebas Neue',sans-serif", outline: "none" }} placeholder="0"/>
              <button onClick={() => setValue(v => String((parseInt(v) || 0) + 1))} style={{ width: 44, height: 44, borderRadius: 12, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text, fontSize: 20, cursor: "pointer" }}>+</button>
            </div>
          </div>
        )}

        {/* Sit-to-stand: countdown + count */}
        {test.id === "sitToStand" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: countdown.running ? C.warning : countdown.done ? C.success : C.text, fontFamily: "'Bebas Neue',sans-serif" }}>{countdown.seconds}s</div>
              {!countdown.running && !countdown.done && <Btn onClick={countdown.start} icon="⏱️">Start 30-Second Timer</Btn>}
              {countdown.running && <Btn variant="danger" onClick={countdown.stop} icon="⏹️">STOP</Btn>}
              {countdown.done && <div style={{ fontSize: 14, color: C.success, fontWeight: 700 }}>Time's up! Enter your count:</div>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => setValue(v => String(Math.max(0, (parseInt(v) || 0) - 1)))} style={{ width: 44, height: 44, borderRadius: 12, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text, fontSize: 20, cursor: "pointer" }}>-</button>
              <input type="number" inputMode="numeric" value={value} onChange={e => setValue(e.target.value)} style={{ flex: 1, padding: "12px 16px", borderRadius: 12, background: C.bg, border: `1px solid ${C.teal}40`, color: C.teal, fontSize: 28, fontWeight: 800, textAlign: "center", fontFamily: "'Bebas Neue',sans-serif", outline: "none" }} placeholder="0"/>
              <button onClick={() => setValue(v => String((parseInt(v) || 0) + 1))} style={{ width: 44, height: 44, borderRadius: 12, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text, fontSize: 20, cursor: "pointer" }}>+</button>
            </div>
          </div>
        )}

        {/* Time-based input */}
        {testType === "time" && test.id !== "balance" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: timer.running ? C.teal : C.text, fontFamily: "'Bebas Neue',sans-serif", marginBottom: 8 }}>{timer.fmt(timer.seconds)}</div>
            {!timer.running && timer.seconds === 0 && <Btn onClick={timer.start} icon="▶️">Start Timer</Btn>}
            {timer.running && <Btn variant="danger" onClick={timer.stop} icon="⏹️">STOP — Form Broke</Btn>}
            {!timer.running && timer.seconds > 0 && (
              <div>
                <div style={{ fontSize: 14, color: C.success, fontWeight: 700, marginBottom: 8 }}>{timer.seconds} seconds recorded</div>
                <Btn variant="ghost" size="sm" onClick={timer.reset}>Reset & Try Again</Btn>
              </div>
            )}
          </div>
        )}

        {/* Balance test — 4 measurements */}
        {test.id === "balance" && (
          <div>
            <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
              {[
                { key: "left_open", label: "L Open" },
                { key: "right_open", label: "R Open" },
                { key: "left_closed", label: "L Closed" },
                { key: "right_closed", label: "R Closed" },
              ].map(s => (
                <button key={s.key} onClick={() => setBalanceSide(s.key)} style={{ flex: 1, padding: "6px 8px", borderRadius: 8, border: `1px solid ${balanceSide === s.key ? C.purple + "60" : C.border}`, background: balanceSide === s.key ? C.purple + "15" : "transparent", color: balanceSide === s.key ? C.purple : C.textDim, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", minWidth: 60 }}>
                  {s.label}
                  {balanceData[s.key] && <div style={{ fontSize: 14, fontWeight: 800, color: C.teal }}>{balanceData[s.key]}s</div>}
                </button>
              ))}
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4 }}>
                {balanceSide.includes("left") ? "LEFT" : "RIGHT"} leg, eyes {balanceSide.includes("open") ? "OPEN" : "CLOSED"}
              </div>
              <div style={{ fontSize: 48, fontWeight: 800, color: timer.running ? C.purple : C.text, fontFamily: "'Bebas Neue',sans-serif", marginBottom: 8 }}>{timer.fmt(timer.seconds)}</div>
              {!timer.running && (
                <Btn onClick={() => { timer.reset(); timer.start(); }} icon="▶️" variant="purple" size="md">
                  Start {balanceSide.replace("_", " ").replace("left", "Left").replace("right", "Right")}
                </Btn>
              )}
              {timer.running && (
                <Btn variant="danger" onClick={() => { timer.stop(); setBalanceData(d => ({ ...d, [balanceSide]: String(timer.seconds) })); }} icon="⏹️">
                  STOP — Lost Balance
                </Btn>
              )}
            </div>
            {/* Asymmetry check */}
            {balanceData.left_open && balanceData.right_open && (() => {
              const lo = parseInt(balanceData.left_open) || 0;
              const ro = parseInt(balanceData.right_open) || 0;
              const asymmetry = Math.abs(lo - ro) / Math.max(lo, ro, 1);
              if (asymmetry > 0.2) return (
                <div style={{ marginTop: 8, padding: 8, background: C.warning + "10", borderRadius: 8, borderLeft: `3px solid ${C.warning}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.warning }}>⚠️ Asymmetry: {Math.round(asymmetry * 100)}%</div>
                  <div style={{ fontSize: 9, color: C.textMuted }}>&gt;20% asymmetry flags compensation — feeds into unilateral programming</div>
                </div>
              );
              return null;
            })()}
          </div>
        )}

        {/* Squat depth + compensations */}
        {test.id === "squat" && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 10, color: C.textDim, marginBottom: 4 }}>DEPTH REACHED:</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {(test.depthOptions || []).map(d => (
                <button key={d} onClick={() => setDepth(d)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${depth === d ? C.teal + "60" : C.border}`, background: depth === d ? C.tealBg : "transparent", color: depth === d ? C.teal : C.textDim, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" }}>{d}</button>
              ))}
            </div>
            <div style={{ fontSize: 10, color: C.textDim, marginBottom: 4 }}>COMPENSATIONS OBSERVED:</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {(test.compensationOptions || []).map(comp => {
                const active = compensations.includes(comp);
                return (
                  <button key={comp} onClick={() => setCompensations(c => active ? c.filter(x => x !== comp) : [...c, comp])} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${active ? C.danger + "60" : C.border}`, background: active ? C.danger + "15" : "transparent", color: active ? C.danger : C.textDim, fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>{comp.replace(/_/g, " ")}</button>
                );
              })}
            </div>
          </div>
        )}

        {/* Plank fault */}
        {test.id === "plank" && !timer.running && timer.seconds > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 10, color: C.textDim, marginBottom: 4 }}>WHAT ENDED THE HOLD:</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {(test.faultOptions || []).map(f => (
                <button key={f} onClick={() => setFault(f)} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${fault === f ? C.warning + "60" : C.border}`, background: fault === f ? C.warning + "15" : "transparent", color: fault === f ? C.warning : C.textDim, fontSize: 10, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" }}>{f}</button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Score preview */}
      {score && previewValue > 0 && (
        <Card style={{ borderColor: score.rating.color + "40", background: score.rating.color + "08", padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.textDim, letterSpacing: 1 }}>YOUR RANKING</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: score.rating.color, fontFamily: "'Bebas Neue',sans-serif" }}>
                {score.rating.emoji} {score.rating.label}
              </div>
              <div style={{ fontSize: 11, color: C.textMuted }}>{score.percentile}th percentile</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: score.rating.color, fontFamily: "'Bebas Neue',sans-serif" }}>{previewValue}</div>
              <div style={{ fontSize: 9, color: C.textDim }}>{test.unit || "reps"}</div>
            </div>
          </div>
          {/* Previous comparison */}
          {previousResult && !previousResult.skipped && (
            <div style={{ marginTop: 8, padding: 8, background: C.bgGlass, borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: previewValue > previousResult.value ? C.success : previewValue < previousResult.value ? C.warning : C.textMuted, fontWeight: 700 }}>
                {previewValue > previousResult.value
                  ? `⬆ Up from ${previousResult.value} (+${Math.round(((previewValue - previousResult.value) / Math.max(1, previousResult.value)) * 100)}%) ${previewValue > previousResult.value ? "🏆 New PR!" : ""}`
                  : previewValue < previousResult.value
                  ? `⬇ Down from ${previousResult.value} — normal fluctuation during training`
                  : `→ Same as last time — consistency is strength`}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Needs Work encouragement */}
      {score && score.percentile < 20 && previewValue > 0 && (
        <div style={{ padding: 12, background: C.purple + "08", borderRadius: 12, borderLeft: `3px solid ${C.purple}` }}>
          <div style={{ fontSize: 12, color: C.purple, fontWeight: 600 }}>This is your starting point — watch these numbers climb 📈</div>
          <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>Every expert was once a beginner. Your consistency will drive improvement.</div>
        </div>
      )}

      {/* Submit button */}
      <div style={{ display: "flex", gap: 8 }}>
        <Btn onClick={handleSubmit} disabled={
          test.id === "balance"
            ? !(parseInt(balanceData.left_open) > 0 && parseInt(balanceData.right_open) > 0)
            : testType === "time"
            ? timer.seconds === 0 && !parseInt(value)
            : !parseInt(value)
        } icon="✓">Save Result</Btn>
        <Btn variant="ghost" onClick={() => onSkip(test.id, "User skipped")} style={{ width: "auto", minWidth: 80 }}>Skip</Btn>
      </div>
    </div>
  );
}

// ── Results Summary Screen ────────────────────────────────────
function ResultsSummary({ results, overallScore, capabilityTags, comparisons, onComplete }) {
  const gender = "male"; // TODO: pull from assessment
  const age = 35;

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.purple, letterSpacing: 2 }}>BASELINE COMPLETE</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: C.teal, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 3 }}>FITNESS SCORE</div>
        <div style={{ fontSize: 72, fontWeight: 800, color: overallScore >= 70 ? C.success : overallScore >= 50 ? C.teal : overallScore >= 30 ? C.warning : C.danger, fontFamily: "'Bebas Neue',sans-serif" }}>{overallScore}</div>
        <div style={{ fontSize: 13, color: C.textMuted }}>out of 100</div>
      </div>

      <ProgressBar value={overallScore} max={100} color={overallScore >= 70 ? C.success : overallScore >= 50 ? C.teal : overallScore >= 30 ? C.warning : C.danger} height={8} />

      {/* Individual test results */}
      {BASELINE_TESTS.map(test => {
        const result = results[test.id];
        if (!result) return null;
        if (result.skipped) return (
          <Card key={test.id} style={{ opacity: 0.5, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.textDim }}>{test.name}</div>
                <div style={{ fontSize: 10, color: C.textDim }}>Skipped{result.skipReason ? `: ${result.skipReason}` : ""}</div>
              </div>
              <Badge color={C.textDim}>SKIPPED</Badge>
            </div>
          </Card>
        );

        const score = scoreTest(test.id, result.value, gender, age);
        const comp = comparisons?.[test.id];
        return (
          <Card key={test.id} style={{ borderColor: score.rating.color + "30", padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{test.name}</div>
                <div style={{ fontSize: 10, color: C.textMuted }}>{test.category}{result.modification ? ` (Modified: ${result.modification.replace(/_/g, " ")})` : ""}</div>
                {comp && (
                  <div style={{ fontSize: 10, color: comp.improved ? C.success : comp.declined ? C.warning : C.textMuted, fontWeight: 600, marginTop: 2 }}>
                    {comp.message}
                  </div>
                )}
              </div>
              <div style={{ textAlign: "center", minWidth: 60 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: score.rating.color, fontFamily: "'Bebas Neue',sans-serif" }}>{result.value}</div>
                <div style={{ fontSize: 8, color: C.textDim }}>{test.unit}</div>
                <Badge color={score.rating.color}>{score.rating.label}</Badge>
              </div>
            </div>
            {/* Squat extras */}
            {test.id === "squat" && result.depth && (
              <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
                <Badge color={C.info}>Depth: {result.depth}</Badge>
                {(result.compensations || []).map(c => <Badge key={c} color={C.warning}>{c.replace(/_/g, " ")}</Badge>)}
              </div>
            )}
            {/* Pull-up tier */}
            {test.id === "pullups" && result.tier && <Badge color={C.info}>Tier {result.tier}</Badge>}
            {/* Balance details */}
            {test.id === "balance" && (
              <div style={{ marginTop: 6, display: "flex", gap: 8, fontSize: 10 }}>
                <span style={{ color: C.textMuted }}>L-Open: {result.left_open}s</span>
                <span style={{ color: C.textMuted }}>R-Open: {result.right_open}s</span>
                <span style={{ color: C.textMuted }}>L-Closed: {result.left_closed}s</span>
                <span style={{ color: C.textMuted }}>R-Closed: {result.right_closed}s</span>
              </div>
            )}
          </Card>
        );
      })}

      {/* Capability tags earned */}
      {capabilityTags.length > 0 && (
        <Card style={{ borderColor: C.success + "30", background: C.success + "05" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.success, letterSpacing: 2, marginBottom: 6 }}>CAPABILITIES UNLOCKED</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {capabilityTags.map(tag => <Badge key={tag} color={C.success}>{tag.replace(/_/g, " ")}</Badge>)}
          </div>
          <div style={{ fontSize: 9, color: C.textMuted, marginTop: 6 }}>These unlock exercise progressions and feed into your workout programming.</div>
        </Card>
      )}

      <Btn onClick={onComplete} icon="→">Save & Continue</Btn>
      <div style={{ height: 90 }} />
    </div>
  );
}

// ── MAIN BASELINE TEST FLOW ───────────────────────────────────
export default function BaselineTestFlow({ onComplete, onClose }) {
  const [step, setStep] = useState("intro"); // intro | test_0..6 | results
  const [testIndex, setTestIndex] = useState(0);
  const [results, setResults] = useState({});
  const injuries = useMemo(() => getInjuries().filter(i => i.status !== "resolved"), []);
  const previousBaseline = useMemo(() => getLatestBaseline(), []);
  const previousResults = previousBaseline?.results || {};

  const gender = "male"; // TODO: pull from assessment profile
  const age = 35;

  const handleTestComplete = (testId, result) => {
    setResults(r => ({ ...r, [testId]: result }));
    if (testIndex < BASELINE_TESTS.length - 1) {
      setTestIndex(i => i + 1);
      setStep(`test_${testIndex + 1}`);
      window.scrollTo(0, 0);
    } else {
      setStep("results");
      window.scrollTo(0, 0);
    }
  };

  const handleSkip = (testId, reason) => {
    setResults(r => ({ ...r, [testId]: { skipped: true, skipReason: reason, value: 0 } }));
    if (testIndex < BASELINE_TESTS.length - 1) {
      setTestIndex(i => i + 1);
      setStep(`test_${testIndex + 1}`);
      window.scrollTo(0, 0);
    } else {
      setStep("results");
      window.scrollTo(0, 0);
    }
  };

  const handleFinish = () => {
    const overallScore = computeOverallScore(results, gender, age);
    const capabilityTags = deriveCapabilityTags(results);
    saveBaselineTest(results, overallScore, capabilityTags);
    onComplete?.({ results, overallScore, capabilityTags });
  };

  const overallScore = useMemo(() => computeOverallScore(results, gender, age), [results]);
  const capabilityTags = useMemo(() => deriveCapabilityTags(results), [results]);
  const comparisons = useMemo(() => previousResults ? compareBaselines(results, previousResults) : null, [results, previousResults]);

  // ── Intro Screen ─────────────────────────────────────
  if (step === "intro") {
    const retestInfo = getRetestInfo();
    return (
      <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.teal, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 3 }}>FITNESS BASELINE</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>7 standard tests · ~15 minutes</div>
          </div>
          {onClose && <button onClick={onClose} style={{ background: C.bgElevated, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", color: C.textMuted, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>← Back</button>}
        </div>

        {retestInfo.hasPrevious && (
          <Card style={{ borderColor: C.info + "30", background: C.info + "08" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.info }}>
              {retestInfo.isDue ? "📋 Retest is due!" : `📊 Last tested ${retestInfo.daysSince} days ago`}
            </div>
            <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>
              Previous score: {retestInfo.overallScore}/100 · {retestInfo.isDue ? "Time to measure your progress!" : `Next retest in ${retestInfo.dueInDays} days`}
            </div>
          </Card>
        )}

        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 8 }}>What You'll Test:</div>
          {BASELINE_TESTS.map((test, i) => {
            const alt = test.getAlternative(injuries);
            const skip = test.shouldSkip(injuries);
            return (
              <div key={test.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < BASELINE_TESTS.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ width: 24, height: 24, borderRadius: 12, background: skip ? C.danger + "20" : C.tealBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: skip ? C.danger : C.teal }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: skip ? C.textDim : C.text }}>{test.name}</div>
                  <div style={{ fontSize: 10, color: C.textDim }}>{test.category} — {test.standard}</div>
                </div>
                {skip && <Badge color={C.danger}>SKIP</Badge>}
                {!skip && alt && <Badge color={C.warning}>MOD</Badge>}
              </div>
            );
          })}
        </Card>

        {injuries.length > 0 && (
          <Card style={{ background: C.warning + "08", borderColor: C.warning + "30", padding: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.warning, letterSpacing: 1 }}>⚠️ INJURY-AWARE</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>Tests will be modified for your {injuries.length} active condition{injuries.length > 1 ? "s" : ""}. Medical restrictions are noted — skipped tests won't count against your score.</div>
          </Card>
        )}

        <Btn onClick={() => { setStep("test_0"); setTestIndex(0); }} icon="💪">Begin Assessment</Btn>
        {onClose && <Btn variant="ghost" onClick={onClose}>Cancel</Btn>}
        <div style={{ height: 90 }} />
      </div>
    );
  }

  // ── Test Screens ─────────────────────────────────────
  if (step.startsWith("test_")) {
    const test = BASELINE_TESTS[testIndex];
    return (
      <div>
        {/* Progress bar */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div style={{ fontSize: 10, color: C.textDim }}>Test {testIndex + 1} of {BASELINE_TESTS.length}</div>
            <div style={{ fontSize: 10, color: C.teal, fontWeight: 700 }}>{Math.round(((testIndex) / BASELINE_TESTS.length) * 100)}%</div>
          </div>
          <ProgressBar value={testIndex} max={BASELINE_TESTS.length} color={C.purple} height={4} />
        </div>
        <TestScreen
          test={test}
          injuries={injuries}
          onComplete={handleTestComplete}
          onSkip={handleSkip}
          previousResult={previousResults[test.id]}
          gender={gender}
          age={age}
        />
        <div style={{ height: 90 }} />
      </div>
    );
  }

  // ── Results Screen ───────────────────────────────────
  if (step === "results") {
    return (
      <ResultsSummary
        results={results}
        overallScore={overallScore}
        capabilityTags={capabilityTags}
        comparisons={comparisons}
        onComplete={handleFinish}
      />
    );
  }

  return null;
}

// ── BASELINE PROGRESS CARD (for Home dashboard) ───────────────
export function BaselineProgressCard({ onStartBaseline, onViewHistory }) {
  const retestInfo = getRetestInfo();
  const latest = getLatestBaseline();
  const previous = getPreviousBaseline();

  if (!latest) {
    return (
      <Card style={{ borderColor: C.purple + "30" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: C.purple + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📐</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Fitness Baseline Test</div>
            <div style={{ fontSize: 11, color: C.textMuted }}>7 tests · ~15 min · Track your progress over time</div>
          </div>
        </div>
        <Btn onClick={onStartBaseline} variant="purple" size="md" style={{ marginTop: 12 }} icon="📐">Take Baseline Test</Btn>
      </Card>
    );
  }

  const comparisons = previous ? compareBaselines(latest.results, previous.results) : null;

  return (
    <Card style={{ borderColor: C.purple + "30" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.purple, letterSpacing: 2 }}>BASELINE PROGRESS</div>
        <Badge color={C.purple}>Score: {latest.overallScore}/100</Badge>
      </div>

      {/* Test summaries with trend */}
      {BASELINE_TESTS.slice(0, 5).map(test => {
        const result = latest.results[test.id];
        if (!result || result.skipped) return null;
        const comp = comparisons?.[test.id];
        return (
          <div key={test.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 11, color: C.textMuted, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{test.name}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text, minWidth: 30, textAlign: "right" }}>{result.value}</span>
            {comp && (
              <span style={{ fontSize: 10, fontWeight: 700, color: comp.improved ? C.success : comp.declined ? C.danger : C.textDim, minWidth: 40 }}>
                {comp.improved ? `+${comp.pctChange}%` : comp.declined ? `${comp.pctChange}%` : "—"}
              </span>
            )}
            {!comp && <span style={{ fontSize: 10, color: C.textDim, minWidth: 40 }}>—</span>}
          </div>
        );
      })}

      {/* Retest reminder */}
      {retestInfo.isDue ? (
        <div style={{ marginTop: 8, padding: 8, background: C.purple + "10", borderRadius: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.purple }}>📋 Retest due! It's been {retestInfo.daysSince} days since your last baseline.</div>
        </div>
      ) : (
        <div style={{ fontSize: 9, color: C.textDim, marginTop: 6 }}>Retest due in {retestInfo.dueInDays} days</div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <Btn variant="purple" size="sm" onClick={onStartBaseline} style={{ flex: 1 }} icon="📐">{retestInfo.isDue ? "Retest Now" : "Retest"}</Btn>
        {onViewHistory && <Btn variant="dark" size="sm" onClick={onViewHistory} style={{ flex: 1 }} icon="📊">History</Btn>}
      </div>
    </Card>
  );
}

// ── POWER & BODYWEIGHT RECORDS CARD (for Home dashboard) ──────
export function PowerRecordsCard() {
  const latest = getLatestBaseline();
  if (!latest) return null;

  const { results } = latest;
  const prs = [];

  if (results.pushups && !results.pushups.skipped) prs.push({ name: "Push-Ups", value: results.pushups.value, unit: "reps" });
  if (results.pullups && !results.pullups.skipped) prs.push({ name: results.pullups.tier === "A" ? "Pull-Ups" : results.pullups.tier === "B" ? "Chin-Ups" : "Dead Hang", value: results.pullups.value, unit: results.pullups.tier === "C" ? "sec" : "reps" });
  if (results.plank && !results.plank.skipped) prs.push({ name: "Plank", value: results.plank.value, unit: "sec" });
  if (results.squat && !results.squat.skipped) prs.push({ name: "Squats", value: results.squat.value, unit: "reps" });

  if (prs.length === 0) return null;

  return (
    <Card style={{ borderColor: C.teal + "20" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: 2, marginBottom: 8 }}>BODYWEIGHT RECORDS</div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(4, prs.length)}, 1fr)`, gap: 8 }}>
        {prs.slice(0, 4).map(pr => (
          <div key={pr.name} style={{ textAlign: "center", padding: 8, background: C.bgGlass, borderRadius: 10 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.teal, fontFamily: "'Bebas Neue',sans-serif" }}>{pr.value}</div>
            <div style={{ fontSize: 8, color: C.textDim, textTransform: "uppercase" }}>{pr.unit}</div>
            <div style={{ fontSize: 9, color: C.textMuted, marginTop: 2 }}>{pr.name}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
