// ═══════════════════════════════════════════════════════════════
// APEX Coach — Performance Programs UI
// Selection, onboarding test, daily tracking, progress display
// ═══════════════════════════════════════════════════════════════
import { useState, useMemo, useRef, useEffect } from "react";
import { PERFORMANCE_PROGRAMS, BLOCKED_COMBOS, MAX_ACTIVE_PROGRAMS } from "../data/performancePrograms.js";
import { getInjuries } from "../utils/injuries.js";

const C = { bg: "#060b18", bgCard: "#0d1425", bgElevated: "#162040", bgGlass: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.08)", text: "#e8ecf4", textMuted: "#7a8ba8", textDim: "#4a5a78", teal: "#00d2c8", tealDark: "#00a89f", tealBg: "rgba(0,210,200,0.08)", success: "#22c55e", danger: "#ef4444", warning: "#eab308", info: "#3b82f6", purple: "#a855f7" };
const Card = ({ children, style, onClick }) => <div onClick={onClick} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, cursor: onClick ? "pointer" : "default", ...style }}>{children}</div>;

const LS_KEY = "apex_perf_programs";

function getActivePrograms() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
function saveActivePrograms(programs) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(programs)); } catch {}
}

function getTierForScore(program, score) {
  for (const tier of program.tiers) {
    if (score >= tier.maxRange[0] && score <= tier.maxRange[1]) return tier;
  }
  return program.tiers[0];
}

function getWeekParams(program, weekNum) {
  const prog = program.weeklyProgression || [];
  return prog[Math.min(weekNum - 1, prog.length - 1)] || prog[0] || {};
}

// ── PROGRAM SELECTION ──
export function ProgramSelector({ onSelect, onClose }) {
  const active = getActivePrograms();
  const activeIds = new Set(active.map(p => p.id));
  const injuries = getInjuries().filter(i => i.status !== "resolved");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.teal, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 3 }}>PERFORMANCE PROGRAMS</div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.textDim, fontSize: 18, cursor: "pointer" }}>×</button>
      </div>
      <div style={{ fontSize: 12, color: C.textMuted }}>Add a goal-specific program to your training. Max {MAX_ACTIVE_PROGRAMS} active at once.</div>

      {Object.values(PERFORMANCE_PROGRAMS).map(prog => {
        const isActive = activeIds.has(prog.id);
        const isBlocked = active.some(a => BLOCKED_COMBOS.some(combo => combo.includes(a.id) && combo.includes(prog.id)));
        const atMax = active.length >= MAX_ACTIVE_PROGRAMS && !isActive;
        // Check condition restrictions
        let condNote = null;
        if (prog.conditionRestrictions) {
          for (const inj of injuries) {
            const key = inj.conditionId || inj.gateKey || "";
            const rules = prog.conditionRestrictions[key];
            if (rules) {
              const sev = inj.severity || 2;
              const rule = rules[sev] || rules[Math.min(sev, 3)];
              if (rule?.allowed === false) condNote = `Blocked: ${inj.area} severity ${sev}`;
              else if (rule?.modification) condNote = `Modified: ${rule.modification}`;
            }
          }
        }
        const disabled = isActive || isBlocked || atMax || condNote?.startsWith("Blocked");

        return (
          <Card key={prog.id} style={{ borderColor: isActive ? C.teal + "60" : disabled ? C.border : C.border, opacity: disabled && !isActive ? 0.5 : 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 20 }}>{prog.icon}</span>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{prog.name}</div>
                </div>
                <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5, marginBottom: 8 }}>{prog.description}</div>
                <div style={{ display: "flex", gap: 8, fontSize: 10, color: C.textDim }}>
                  <span>{prog.duration} weeks</span>
                  <span>·</span>
                  <span>{prog.schedule || "Daily"}</span>
                </div>
                {condNote && <div style={{ fontSize: 10, color: condNote.startsWith("Blocked") ? C.danger : C.warning, marginTop: 4 }}>⚠️ {condNote}</div>}
                {isBlocked && <div style={{ fontSize: 10, color: C.danger, marginTop: 4 }}>Conflicts with active program</div>}
              </div>
            </div>
            {isActive ? (
              <div style={{ marginTop: 10, padding: "6px 10px", background: C.teal + "10", borderRadius: 8, fontSize: 11, color: C.teal, fontWeight: 600, textAlign: "center" }}>Active ✓</div>
            ) : (
              <button onClick={() => !disabled && onSelect(prog)} disabled={disabled}
                style={{ width: "100%", marginTop: 10, padding: 12, borderRadius: 10, border: "none", background: disabled ? C.bgElevated : `linear-gradient(135deg,${C.teal},${C.tealDark})`, color: disabled ? C.textDim : "#000", fontSize: 13, fontWeight: 700, cursor: disabled ? "default" : "pointer", fontFamily: "inherit" }}>
                Start Program →
              </button>
            )}
          </Card>
        );
      })}
      <div style={{ height: 90 }} />
    </div>
  );
}

// ── BASELINE TEST ──
export function ProgramTest({ program, onComplete, onBack }) {
  const [phase, setPhase] = useState("intro"); // intro | testing | result
  const [score, setScore] = useState("");
  const [counting, setCounting] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!counting) return;
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [counting]);

  if (phase === "intro") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "20px 0" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: C.textDim, fontSize: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>← Back</button>
      <div style={{ textAlign: "center" }}><span style={{ fontSize: 48 }}>{program.icon}</span></div>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.text, textAlign: "center" }}>{program.name}</div>
      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.teal, marginBottom: 8 }}>Baseline Test</div>
        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>
          {program.testType === "max_reps" ? `Do as many ${program.testExercise.replace(/_/g, " ")}s as you can with good form. Stop when form breaks.` : `Jump as high as you can. Measure the height.`}
        </div>
        <div style={{ fontSize: 11, color: C.textDim, marginTop: 8 }}>{program.prerequisite}</div>
      </Card>
      <button onClick={() => setPhase("testing")} style={{ width: "100%", padding: 16, borderRadius: 12, background: `linear-gradient(135deg,${C.teal},${C.tealDark})`, border: "none", color: "#000", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Ready — Start Test →</button>
    </div>
  );

  if (phase === "testing") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "20px 0", textAlign: "center" }}>
      <div style={{ fontSize: 48, fontWeight: 800, color: C.teal, fontFamily: "'Bebas Neue',sans-serif" }}>{seconds}s</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>{counting ? "GO! Count your reps..." : "Tap Start when ready"}</div>
      {!counting && <button onClick={() => setCounting(true)} style={{ padding: 16, borderRadius: 12, background: C.success, border: "none", color: "#fff", fontSize: 18, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Start</button>}
      {counting && <div>
        <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>Stop when form breaks. Enter your count:</div>
        <input type="number" value={score} onChange={e => setScore(e.target.value)} placeholder={program.testType === "max_height" ? "Height (inches)" : "Total reps"} style={{ width: 120, padding: "12px 16px", borderRadius: 10, background: C.bgElevated, border: `1px solid ${C.teal}60`, color: C.text, fontSize: 24, fontFamily: "inherit", textAlign: "center", outline: "none" }} />
        <button onClick={() => { clearInterval(timerRef.current); setCounting(false); setPhase("result"); }} disabled={!score} style={{ display: "block", width: "100%", marginTop: 16, padding: 14, borderRadius: 10, background: !score ? C.bgElevated : `linear-gradient(135deg,${C.teal},${C.tealDark})`, border: "none", color: !score ? C.textDim : "#000", fontSize: 14, fontWeight: 700, cursor: !score ? "default" : "pointer", fontFamily: "inherit" }}>Done — Submit Score</button>
      </div>}
    </div>
  );

  // Result
  const numScore = parseInt(score) || 0;
  const tier = getTierForScore(program, numScore);
  const weekParams = getWeekParams(program, 1);
  const repsPerSet = Math.max(1, Math.round(numScore * (weekParams.repPct || 0.5)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "20px 0" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48 }}>{program.icon}</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: C.teal, fontFamily: "'Bebas Neue',sans-serif" }}>{numScore}</div>
        <div style={{ fontSize: 14, color: C.textMuted }}>{program.testType === "max_height" ? "inches" : "reps"} — {tier.name} tier</div>
      </div>
      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>Your Program</div>
        <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.6 }}>
          {program.weeklyProgression ? `Week 1: ${weekParams.sets || 5} sets × ${repsPerSet} reps — ${weekParams.note || ""}` : `${program.duration} weeks of structured progression`}
        </div>
        <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>{program.restBetweenSets || program.schedule || ""}</div>
      </Card>
      <button onClick={() => {
        const active = getActivePrograms();
        active.push({ id: program.id, startedAt: new Date().toISOString(), baseline: numScore, tier: tier.name, currentWeek: 1, setsToday: [], history: [] });
        saveActivePrograms(active);
        onComplete();
      }} style={{ width: "100%", padding: 16, borderRadius: 12, background: `linear-gradient(135deg,${C.teal},${C.tealDark})`, border: "none", color: "#000", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Begin Program →</button>
    </div>
  );
}

// ── ACTIVE PROGRAM CARD (for home screen) ──
export function ActiveProgramCard({ onLogSet, onViewDetails }) {
  const programs = getActivePrograms();
  if (programs.length === 0) return null;

  return (
    <>{programs.map(prog => {
      const def = PERFORMANCE_PROGRAMS[prog.id];
      if (!def) return null;
      const weeksSinceStart = Math.max(1, Math.ceil((Date.now() - new Date(prog.startedAt).getTime()) / (7 * 86400000)));
      const currentWeek = Math.min(weeksSinceStart, def.duration);
      const pct = Math.round((currentWeek / def.duration) * 100);
      const weekParams = getWeekParams(def, currentWeek);
      const repsPerSet = Math.max(1, Math.round((prog.baseline || 10) * (weekParams.repPct || 0.5)));
      const targetSets = weekParams.sets || 5;
      const today = new Date().toISOString().split("T")[0];
      const todaySets = (prog.setsToday || []).filter(s => s.date === today).length;
      const isRetest = (def.retestWeeks || []).includes(currentWeek);

      return (
        <Card key={prog.id} style={{ borderColor: C.purple + "30", marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 16 }}>{def.icon}</span>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{def.name}</div>
            </div>
            <span style={{ fontSize: 10, color: C.purple, fontWeight: 600 }}>Week {currentWeek}/{def.duration}</span>
          </div>
          <div style={{ width: "100%", height: 4, background: C.border, borderRadius: 2, marginBottom: 8 }}><div style={{ width: `${pct}%`, height: "100%", background: C.purple, borderRadius: 2 }} /></div>
          <div style={{ fontSize: 12, color: C.text, marginBottom: 4 }}>Today: {targetSets} sets × {repsPerSet} reps</div>
          <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>{Array.from({ length: targetSets }).map((_, i) => <div key={i} style={{ width: 24, height: 24, borderRadius: 6, background: i < todaySets ? C.success + "30" : C.bgElevated, border: `1px solid ${i < todaySets ? C.success : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: i < todaySets ? C.success : C.textDim }}>{i < todaySets ? "✓" : ""}</div>)}</div>
          {isRetest && <div style={{ fontSize: 10, color: C.warning, marginBottom: 6 }}>📊 Retest week — test your new max at end of week!</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => {
              const all = getActivePrograms();
              const idx = all.findIndex(p => p.id === prog.id);
              if (idx >= 0) {
                if (!all[idx].setsToday) all[idx].setsToday = [];
                all[idx].setsToday.push({ date: today, reps: repsPerSet, time: new Date().toISOString() });
                saveActivePrograms(all);
              }
              onLogSet?.();
            }} style={{ flex: 1, padding: 10, borderRadius: 10, background: todaySets >= targetSets ? C.bgElevated : `linear-gradient(135deg,${C.teal},${C.tealDark})`, border: "none", color: todaySets >= targetSets ? C.textDim : "#000", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{todaySets >= targetSets ? "All sets done ✓" : `Log Set (${todaySets + 1}/${targetSets})`}</button>
          </div>
          <div style={{ fontSize: 10, color: C.textDim, marginTop: 6 }}>Baseline: {prog.baseline} · Tier: {prog.tier}</div>
        </Card>
      );
    })}</>
  );
}

// ── PROGRAM MANAGEMENT (stop/remove) ──
export function stopProgram(programId) {
  const all = getActivePrograms().filter(p => p.id !== programId);
  saveActivePrograms(all);
}

export { getActivePrograms, saveActivePrograms, PERFORMANCE_PROGRAMS };
