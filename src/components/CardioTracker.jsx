import { useState } from "react";
import {
  getCardioPrescription, calcVO2Rockport, calcVO2Cooper, getVO2Category,
  getHRZones, RPE_ZONES, saveCardioSession, getCardioSessions,
  getWeeklyCardioMinutes, saveVO2Test, getVO2Tests, getLatestVO2,
  getVO2Trend, getNextTestDate, getHRSettings, setHRSettings,
} from "../utils/cardio.js";
import { getInjuries } from "../utils/injuries.js";

// ═══════════════════════════════════════════════════════════════
// Cardio Tracker — VO2 Max Test, Cardio Logger, HR Zones, Home Card
// ═══════════════════════════════════════════════════════════════

const C = {
  bg: "#060b18", bgCard: "#0d1425", bgElevated: "#162040",
  bgGlass: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.08)",
  text: "#e8ecf4", textMuted: "#7a8ba8", textDim: "#4a5a78",
  teal: "#00d2c8", tealBg: "rgba(0,210,200,0.08)",
  success: "#22c55e", danger: "#ef4444", warning: "#eab308",
  info: "#3b82f6", orange: "#f97316", purple: "#a855f7",
};

// ── Home Page Cardio Fitness Card ───────────────────────────

export function CardioFitnessCard({ phase, onTestFitness, onLogCardio }) {
  const injuries = getInjuries().filter(i => i.status !== "resolved");
  const rx = getCardioPrescription(phase, injuries);
  const weeklyMin = getWeeklyCardioMinutes();
  const latest = getLatestVO2();
  const trend = getVO2Trend();
  const nextTest = getNextTestDate();
  const hrSettings = getHRSettings();
  const pct = rx.weeklyTargetMinutes > 0 ? Math.min(100, Math.round(weeklyMin / rx.weeklyTargetMinutes * 100)) : 0;

  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>❤️</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Cardio Fitness</span>
        </div>
        {latest && <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 6, color: latest.category ? getVO2Category(latest.vo2max, 35, true).color : C.teal, background: (latest.category ? getVO2Category(latest.vo2max, 35, true).color : C.teal) + "15" }}>
          {latest.category || "—"}
        </span>}
      </div>

      {/* VO2 Max display */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        <div style={{ background: C.bgElevated, borderRadius: 10, padding: 10, textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: latest ? C.teal : C.textDim, fontFamily: "'Bebas Neue',sans-serif" }}>
            {latest ? latest.vo2max : "—"}
          </div>
          <div style={{ fontSize: 9, color: C.textDim, letterSpacing: 1 }}>VO2 MAX</div>
          {trend && <div style={{ fontSize: 9, color: trend.improving ? C.success : C.danger, marginTop: 2 }}>
            {trend.improving ? "↑" : "↓"} {Math.abs(trend.diff).toFixed(1)} from last
          </div>}
        </div>
        <div style={{ background: C.bgElevated, borderRadius: 10, padding: 10, textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: pct >= 100 ? C.success : pct > 50 ? C.teal : C.warning, fontFamily: "'Bebas Neue',sans-serif" }}>
            {weeklyMin}
          </div>
          <div style={{ fontSize: 9, color: C.textDim, letterSpacing: 1 }}>MIN THIS WEEK</div>
          <div style={{ fontSize: 9, color: C.textMuted, marginTop: 2 }}>
            / {rx.weeklyTargetMinutes} min target
          </div>
        </div>
      </div>

      {/* Weekly progress bar */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ width: "100%", height: 5, background: C.border, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: pct >= 100 ? C.success : C.teal, borderRadius: 3, transition: "width 0.6s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
          <span style={{ fontSize: 9, color: C.textDim }}>{pct}% of weekly goal</span>
          <span style={{ fontSize: 9, color: C.textMuted }}>{rx.type} · {rx.frequency}</span>
        </div>
      </div>

      {/* Rx summary */}
      <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 10, padding: "6px 8px", background: C.bgGlass, borderRadius: 6 }}>
        <span style={{ color: C.info, fontWeight: 600 }}>Rx: </span>
        {rx.activities.slice(0, 3).join(", ")} · {rx.duration} · {rx.intensity}
      </div>

      {/* Beta-blocker warning */}
      {hrSettings.betaBlocker && (
        <div style={{ fontSize: 9, color: C.warning, padding: "6px 8px", background: C.warning + "10", borderRadius: 6, marginBottom: 10 }}>
          ⚠️ Heart rate zones may not be accurate due to your medication. Use RPE instead.
        </div>
      )}

      {/* Next test reminder */}
      {nextTest && new Date() >= nextTest && (
        <div style={{ fontSize: 9, color: C.purple, padding: "6px 8px", background: C.purple + "10", borderRadius: 6, marginBottom: 10 }}>
          🔄 VO2 max retest due — last tested {Math.round((new Date() - new Date(getVO2Tests().slice(-1)[0]?.date)) / (1000 * 60 * 60 * 24))} days ago
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <button onClick={onTestFitness} style={{
          padding: "8px 12px", borderRadius: 10, fontSize: 11, fontWeight: 700,
          background: C.purple + "15", border: `1px solid ${C.purple}40`, color: C.purple,
          cursor: "pointer", fontFamily: "inherit",
        }}>🏃 Test Fitness</button>
        <button onClick={onLogCardio} style={{
          padding: "8px 12px", borderRadius: 10, fontSize: 11, fontWeight: 700,
          background: C.tealBg, border: `1px solid ${C.teal}40`, color: C.teal,
          cursor: "pointer", fontFamily: "inherit",
        }}>+ Log Cardio</button>
      </div>
    </div>
  );
}

// ── VO2 Max Test Modal ──────────────────────────────────────

export function VO2TestModal({ onClose, onSaved }) {
  const [testType, setTestType] = useState("walk");
  const [time, setTime] = useState("");
  const [hr, setHR] = useState("");
  const [weight, setWeight] = useState("185");
  const [age, setAge] = useState("35");
  const [result, setResult] = useState(null);

  const calculate = () => {
    const t = parseFloat(time);
    if (!t || t <= 0) return;
    let vo2;
    if (testType === "walk") {
      const h = parseInt(hr) || 120;
      const w = parseFloat(weight) || 185;
      const a = parseInt(age) || 35;
      vo2 = calcVO2Rockport(w, a, true, t, h);
    } else {
      vo2 = calcVO2Cooper(t);
    }
    if (vo2 < 10 || vo2 > 80) vo2 = Math.max(10, Math.min(80, vo2)); // clamp
    const cat = getVO2Category(vo2, parseInt(age) || 35, true);
    setResult({ vo2, category: cat });
  };

  const save = () => {
    if (!result) return;
    saveVO2Test({
      testType: testType === "walk" ? "rockport" : "cooper",
      timeMinutes: parseFloat(time),
      heartRate: parseInt(hr) || null,
      vo2max: result.vo2,
      category: result.category.label,
    });
    if (onSaved) onSaved();
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: C.bg, borderRadius: "20px 20px 0 0", padding: "20px 16px", width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto", border: `1px solid ${C.border}`, borderBottom: "none" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>TEST MY FITNESS</div>
            <div style={{ fontSize: 11, color: C.textMuted }}>Estimate your VO2 max</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textDim, fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        {/* Test type selector */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          {[
            { id: "walk", label: "1-Mile Walk", desc: "Rockport Test", icon: "🚶" },
            { id: "run", label: "1.5-Mile Run", desc: "Cooper Test", icon: "🏃" },
          ].map(t => (
            <div key={t.id} onClick={() => { setTestType(t.id); setResult(null); }} style={{
              background: testType === t.id ? C.tealBg : C.bgCard, border: `1px solid ${testType === t.id ? C.teal : C.border}`,
              borderRadius: 12, padding: 12, cursor: "pointer", textAlign: "center",
            }}>
              <div style={{ fontSize: 24 }}>{t.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: testType === t.id ? C.teal : C.text, marginTop: 4 }}>{t.label}</div>
              <div style={{ fontSize: 9, color: C.textDim }}>{t.desc}</div>
            </div>
          ))}
        </div>

        {/* Input fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 10, color: C.textDim, fontWeight: 600, display: "block", marginBottom: 3 }}>
              Time to Complete (minutes)
            </label>
            <input value={time} onChange={e => { setTime(e.target.value); setResult(null); }} type="number" step="0.1" placeholder={testType === "walk" ? "e.g. 15.5" : "e.g. 12.0"} style={{
              width: "100%", padding: "10px 12px", borderRadius: 8, background: C.bgElevated,
              border: `1px solid ${C.border}`, color: C.text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
            }} />
          </div>

          {testType === "walk" && <>
            <div>
              <label style={{ fontSize: 10, color: C.textDim, fontWeight: 600, display: "block", marginBottom: 3 }}>Heart Rate at Finish (bpm)</label>
              <input value={hr} onChange={e => { setHR(e.target.value); setResult(null); }} type="number" placeholder="e.g. 140" style={{
                width: "100%", padding: "10px 12px", borderRadius: 8, background: C.bgElevated,
                border: `1px solid ${C.border}`, color: C.text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
              }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <label style={{ fontSize: 10, color: C.textDim, fontWeight: 600, display: "block", marginBottom: 3 }}>Weight (lbs)</label>
                <input value={weight} onChange={e => { setWeight(e.target.value); setResult(null); }} type="number" style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8, background: C.bgElevated,
                  border: `1px solid ${C.border}`, color: C.text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
                }} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: C.textDim, fontWeight: 600, display: "block", marginBottom: 3 }}>Age</label>
                <input value={age} onChange={e => { setAge(e.target.value); setResult(null); }} type="number" style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8, background: C.bgElevated,
                  border: `1px solid ${C.border}`, color: C.text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
                }} />
              </div>
            </div>
          </>}
        </div>

        {/* Calculate button */}
        <button onClick={calculate} disabled={!time} style={{
          width: "100%", padding: "14px", borderRadius: 12, fontSize: 14, fontWeight: 700,
          background: time ? `linear-gradient(135deg,${C.teal},${C.teal}dd)` : C.bgElevated,
          color: time ? "#000" : C.textDim, border: "none", cursor: time ? "pointer" : "not-allowed",
          fontFamily: "inherit", marginBottom: 12,
        }}>Calculate VO2 Max</button>

        {/* Result */}
        {result && (
          <div style={{ background: C.bgCard, border: `1px solid ${result.category.color}40`, borderRadius: 14, padding: 16, textAlign: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: result.category.color, fontFamily: "'Bebas Neue',sans-serif" }}>
              {result.vo2}
            </div>
            <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 2, marginBottom: 8 }}>ESTIMATED VO2 MAX (ml/kg/min)</div>
            <div style={{ display: "inline-flex", padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, color: result.category.color, background: result.category.color + "15" }}>
              {result.category.emoji} {result.category.label}
            </div>

            <button onClick={save} style={{
              width: "100%", padding: "12px", borderRadius: 12, fontSize: 13, fontWeight: 700,
              background: C.success + "15", border: `1px solid ${C.success}40`, color: C.success,
              cursor: "pointer", fontFamily: "inherit", marginTop: 12,
            }}>💾 Save Result</button>
          </div>
        )}

        {/* Test instructions */}
        <div style={{ fontSize: 10, color: C.textDim, lineHeight: 1.6, padding: "8px 10px", background: C.bgGlass, borderRadius: 8 }}>
          {testType === "walk" ? (
            <><b style={{ color: C.info }}>Rockport Walk Test:</b> Walk 1 mile as fast as possible (no running). Record your time and heart rate immediately at finish. Best on a track or treadmill.</>
          ) : (
            <><b style={{ color: C.info }}>Cooper Test:</b> Run 1.5 miles as fast as you can. Record total time. Warm up first. Best on a track. Not recommended if back or knee severity ≥ 3.</>
          )}
        </div>

        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}

// ── Cardio Session Logger Modal ─────────────────────────────

export function CardioLogModal({ onClose, onSaved }) {
  const [type, setType] = useState("Walking");
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [avgHR, setAvgHR] = useState("");
  const [rpe, setRpe] = useState(5);

  const save = () => {
    if (!duration) return;
    saveCardioSession({
      type,
      duration: parseInt(duration),
      distance: distance ? parseFloat(distance) : null,
      avgHR: avgHR ? parseInt(avgHR) : null,
      rpe,
      zone: rpe <= 4 ? 2 : rpe <= 6 ? 3 : rpe <= 8 ? 4 : 5,
    });
    if (onSaved) onSaved();
    onClose();
  };

  const types = ["Walking", "Cycling", "Swimming", "Rowing", "Elliptical", "Running", "HIIT", "Sport-Specific"];

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

        {/* Cardio type */}
        <div style={{ fontSize: 10, color: C.textDim, fontWeight: 600, marginBottom: 4 }}>Type</div>
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
            <input value={duration} onChange={e => setDuration(e.target.value)} type="number" placeholder="25" style={{
              width: "100%", padding: "10px 12px", borderRadius: 8, background: C.bgElevated,
              border: `1px solid ${C.border}`, color: C.text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
            }} />
          </div>
          <div>
            <label style={{ fontSize: 10, color: C.textDim, fontWeight: 600, display: "block", marginBottom: 3 }}>Distance (mi)</label>
            <input value={distance} onChange={e => setDistance(e.target.value)} type="number" step="0.1" placeholder="optional" style={{
              width: "100%", padding: "10px 12px", borderRadius: 8, background: C.bgElevated,
              border: `1px solid ${C.border}`, color: C.text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
            }} />
          </div>
        </div>

        {/* HR + RPE */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 10, color: C.textDim, fontWeight: 600, display: "block", marginBottom: 3 }}>Avg Heart Rate (optional)</label>
          <input value={avgHR} onChange={e => setAvgHR(e.target.value)} type="number" placeholder="e.g. 135" style={{
            width: "100%", padding: "10px 12px", borderRadius: 8, background: C.bgElevated,
            border: `1px solid ${C.border}`, color: C.text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
          }} />
        </div>

        <div style={{ marginBottom: 16 }}>
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

// ── Heart Rate Zones Display ────────────────────────────────

export function HRZonesCard({ age, maxHROverride, betaBlocker }) {
  if (betaBlocker) {
    return (
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.warning, letterSpacing: 1.5, marginBottom: 8 }}>INTENSITY ZONES (RPE-BASED)</div>
        <div style={{ fontSize: 9, color: C.warning, padding: "6px 8px", background: C.warning + "10", borderRadius: 6, marginBottom: 10 }}>
          ⚠️ Heart rate zones may not be accurate due to beta-blocker medication. Use RPE (Rate of Perceived Exertion) instead.
        </div>
        {RPE_ZONES.map(z => (
          <div key={z.rpe} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.teal, minWidth: 32 }}>{z.rpe}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.text, minWidth: 50 }}>{z.zone}</span>
            <span style={{ fontSize: 10, color: C.textMuted }}>{z.desc}</span>
          </div>
        ))}
      </div>
    );
  }

  const { maxHR, zones } = getHRZones(age || 35, maxHROverride);
  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.danger, letterSpacing: 1.5 }}>HEART RATE ZONES</div>
        <span style={{ fontSize: 9, color: C.textDim }}>Max HR: {maxHR} bpm</span>
      </div>
      {zones.map(z => (
        <div key={z.zone} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: z.color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: z.color, minWidth: 18 }}>Z{z.zone}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: C.text, minWidth: 80 }}>{z.name}</span>
          <span style={{ fontSize: 10, color: C.teal, fontWeight: 700, minWidth: 60 }}>{z.min}-{z.max}</span>
          <span style={{ fontSize: 9, color: C.textDim, flex: 1 }}>{z.desc}</span>
        </div>
      ))}
    </div>
  );
}
