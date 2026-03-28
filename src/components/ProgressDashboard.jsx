import { useState, useMemo } from "react";
import ExerciseImage from "./ExerciseImage.jsx";
import {
  getStrengthMilestones, getPhaseTimeline, getConsistencyData,
  getGoalProgress, getWeeklySummary, getInjuryRecovery, getReadinessTrend,
} from "../utils/progressAnalytics.js";
import { getAssessment } from "./Onboarding.jsx";

// ═══════════════════════════════════════════════════════════════
// Progress Dashboard — 7-section scrollable dashboard for Home
// Uses inline SVG for charts (no external dependency)
// ═══════════════════════════════════════════════════════════════

const C = {
  bg: "#060b18", bgCard: "#0d1425", bgElevated: "#162040",
  bgGlass: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.08)",
  text: "#e8ecf4", textMuted: "#7a8ba8", textDim: "#4a5a78",
  teal: "#00d2c8", tealBg: "rgba(0,210,200,0.08)",
  success: "#22c55e", danger: "#ef4444", warning: "#eab308",
  info: "#3b82f6", orange: "#f97316", purple: "#a855f7",
};

const Card = ({ children, style }) => (
  <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, ...style }}>{children}</div>
);

// ── Mini SVG Spark Line ─────────────────────────────────────

function SparkLine({ data, width = 100, height = 24, color = C.teal }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Consistency Heat Map (SVG) ──────────────────────────────

function HeatMap({ days }) {
  const cellSize = 10;
  const gap = 2;
  const cols = 12; // 12 weeks
  const rows = 7;  // 7 days per week

  const colorMap = {
    completed: C.success,
    partial: C.warning,
    rest: C.bgElevated,
    missed: C.danger + "40",
  };

  return (
    <svg width={(cellSize + gap) * cols} height={(cellSize + gap) * rows} style={{ display: "block" }}>
      {days.map((d, i) => {
        const col = Math.floor(i / 7);
        const row = i % 7;
        return (
          <rect
            key={d.date}
            x={col * (cellSize + gap)}
            y={row * (cellSize + gap)}
            width={cellSize}
            height={cellSize}
            rx={2}
            fill={colorMap[d.status] || colorMap.rest}
          />
        );
      })}
    </svg>
  );
}

// ── Readiness Trend Chart (SVG) ─────────────────────────────

function ReadinessChart({ points, width = 300, height = 80 }) {
  if (points.length < 2) return <div style={{ fontSize: 10, color: C.textDim, textAlign: "center", padding: 16 }}>Complete 2+ sessions to see trends</div>;

  const rttVals = points.map(p => p.rtt || 0);
  const ctpVals = points.map(p => p.ctp || 0);
  const allVals = [...rttVals, ...ctpVals].filter(v => v > 0);
  const min = Math.min(...allVals, 20);
  const max = Math.max(...allVals, 100);
  const range = max - min || 1;

  const toPoints = (vals) => vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * (width - 8) + 4;
    const y = height - 4 - ((v - min) / range) * (height - 12);
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block", width: "100%" }}>
      {/* Grid lines */}
      {[30, 50, 70].map(v => {
        const y = height - 4 - ((v - min) / range) * (height - 12);
        return <line key={v} x1="0" y1={y} x2={width} y2={y} stroke={C.border} strokeDasharray="4,4" />;
      })}
      {/* CTP line */}
      <polyline points={toPoints(ctpVals)} fill="none" stroke={C.info} strokeWidth="1.5" opacity="0.6" />
      {/* RTT line */}
      <polyline points={toPoints(rttVals)} fill="none" stroke={C.teal} strokeWidth="2" />
      {/* Dots */}
      {rttVals.map((v, i) => {
        const x = (i / (rttVals.length - 1)) * (width - 8) + 4;
        const y = height - 4 - ((v - min) / range) * (height - 12);
        return <circle key={i} cx={x} cy={y} r="2.5" fill={C.teal} />;
      })}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main Dashboard Component
// ═══════════════════════════════════════════════════════════════

export default function ProgressDashboard({ phase }) {
  const [expandedSection, setExpandedSection] = useState(null);

  const milestones = useMemo(() => getStrengthMilestones(), []);
  const timeline = useMemo(() => getPhaseTimeline(phase), [phase]);
  const consistency = useMemo(() => getConsistencyData(), []);
  const assessment = getAssessment();
  const goals = useMemo(() => getGoalProgress(assessment, phase), [phase]);
  const weeklySummary = useMemo(() => getWeeklySummary(), []);
  const injuryRecovery = useMemo(() => getInjuryRecovery(), []);
  const readiness = useMemo(() => getReadinessTrend(), []);

  const toggle = (id) => setExpandedSection(expandedSection === id ? null : id);

  const SectionHeader = ({ id, icon, title, badge, color = C.teal }) => (
    <div onClick={() => toggle(id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "4px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{title}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {badge && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, color, background: color + "15" }}>{badge}</span>}
        <span style={{ fontSize: 10, color: C.textDim, transform: expandedSection === id ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>▸</span>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.purple, letterSpacing: 2, marginBottom: 2 }}>PROGRESS DASHBOARD</div>

      {/* ── 1. WEEKLY SUMMARY ──────────────────────────────── */}
      {weeklySummary && (
        <Card style={{ borderLeft: `3px solid ${C.teal}` }}>
          <SectionHeader id="weekly" icon="📊" title="This Week" badge={`${weeklySummary.sessionsCount} sessions`} />
          {(expandedSection === "weekly" || expandedSection === null) && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
                <div style={{ background: C.bgElevated, borderRadius: 8, padding: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.teal, fontFamily: "'Bebas Neue',sans-serif" }}>{weeklySummary.totalSetsThisWeek}</div>
                  <div style={{ fontSize: 8, color: C.textDim }}>TOTAL SETS</div>
                </div>
                <div style={{ background: C.bgElevated, borderRadius: 8, padding: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: weeklySummary.avgPain && parseFloat(weeklySummary.avgPain) > 5 ? C.danger : C.success, fontFamily: "'Bebas Neue',sans-serif" }}>{weeklySummary.avgPain || "—"}</div>
                  <div style={{ fontSize: 8, color: C.textDim }}>AVG PAIN</div>
                </div>
                <div style={{ background: C.bgElevated, borderRadius: 8, padding: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.info, fontFamily: "'Bebas Neue',sans-serif" }}>{weeklySummary.volChange !== null ? `${weeklySummary.volChange > 0 ? "+" : ""}${weeklySummary.volChange}%` : "—"}</div>
                  <div style={{ fontSize: 8, color: C.textDim }}>VOL CHANGE</div>
                </div>
              </div>
              <div style={{ fontSize: 10, color: C.textMuted, padding: "6px 8px", background: C.bgGlass, borderRadius: 6 }}>
                💡 {weeklySummary.insight}
              </div>
              {weeklySummary.musclesTrained.length > 0 && (
                <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 6 }}>
                  {weeklySummary.musclesTrained.map(m => (
                    <span key={m} style={{ fontSize: 8, color: C.teal, background: C.tealBg, padding: "2px 5px", borderRadius: 3 }}>{m}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* ── 2. STRENGTH MILESTONES ────────────────────────── */}
      <Card>
        <SectionHeader id="strength" icon="💪" title="Strength Milestones" badge={milestones.length > 0 ? `${milestones.length} tracked` : "no data"} color={C.success} />
        {expandedSection === "strength" && (
          <div style={{ marginTop: 8 }}>
            {milestones.length === 0 ? (
              <div style={{ fontSize: 10, color: C.textDim, textAlign: "center", padding: 12 }}>Complete workouts with weight tracking to see milestones</div>
            ) : (
              milestones.slice(0, 5).map((m, i) => (
                <div key={m.exerciseId} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: i < 4 ? `1px solid ${C.border}` : "none" }}>
                  {m.exercise && <ExerciseImage exercise={m.exercise} size="thumb" />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                    <div style={{ fontSize: 9, color: C.textMuted }}>{m.first} lbs → {m.current} lbs</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <SparkLine data={m.loads.map(l => l.load)} width={50} height={18} color={m.gainPct > 0 ? C.success : C.danger} />
                    <div style={{ fontSize: 10, fontWeight: 700, color: m.gainPct > 0 ? C.success : C.danger }}>
                      {m.gainPct > 0 ? "+" : ""}{m.gainPct}%
                    </div>
                  </div>
                  {i < 3 && m.gainPct > 0 && <span style={{ fontSize: 8, color: C.warning }}>🏆</span>}
                </div>
              ))
            )}
          </div>
        )}
      </Card>

      {/* ── 3. PHASE TIMELINE ─────────────────────────────── */}
      <Card>
        <SectionHeader id="phase" icon="🗺️" title="Phase Timeline" badge={`Phase ${timeline.currentPhase}`} color={C.info} />
        {expandedSection === "phase" && (
          <div style={{ marginTop: 8 }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.textMuted, marginBottom: 4 }}>
                <span>Phase {timeline.currentPhase}: {timeline.phases[timeline.currentPhase - 1]?.name}</span>
                <span>Week {timeline.currentWeek} of {timeline.phaseWeeks}</span>
              </div>
              <div style={{ width: "100%", height: 8, background: C.bgElevated, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${timeline.phasePct}%`, height: "100%", background: `linear-gradient(90deg, ${C.teal}, ${C.info})`, borderRadius: 4, transition: "width 0.6s" }} />
              </div>
              <div style={{ fontSize: 10, color: C.teal, fontWeight: 700, textAlign: "center", marginTop: 4 }}>{timeline.phasePct}%</div>
            </div>
            {timeline.phases.map(p => {
              const isCurrent = p.num === timeline.currentPhase;
              const isPast = p.num < timeline.currentPhase;
              return (
                <div key={p.num} style={{ display: "flex", gap: 8, padding: "4px 0", opacity: isPast ? 0.5 : 1 }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: isCurrent ? C.teal : isPast ? C.success : C.bgElevated, border: `2px solid ${isCurrent ? C.teal : isPast ? C.success : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 8, fontWeight: 800, color: isCurrent || isPast ? "#000" : C.textDim }}>{isPast ? "✓" : p.num}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: isCurrent ? 700 : 400, color: isCurrent ? C.teal : C.text }}>{p.name}</div>
                    {isCurrent && <div style={{ fontSize: 8, color: C.info }}>Unlocks next: {p.unlocks}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── 4. CONSISTENCY TRACKER ────────────────────────── */}
      <Card>
        <SectionHeader id="consistency" icon="🔥" title="Consistency" badge={`${consistency.streak} streak`} color={C.orange} />
        {expandedSection === "consistency" && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
              <HeatMap days={consistency.days} />
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 6 }}>
              {[{ c: C.success, l: "Trained" }, { c: C.warning, l: "Partial" }, { c: C.bgElevated, l: "Rest" }].map(k => (
                <div key={k.l} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: k.c }} />
                  <span style={{ fontSize: 8, color: C.textDim }}>{k.l}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10, color: C.textMuted, textAlign: "center" }}>
              Current streak: <b style={{ color: C.teal }}>{consistency.streak}</b> | Best: <b style={{ color: C.orange }}>{consistency.longestStreak}</b> | Total: <b>{consistency.totalSessions}</b>
            </div>
          </div>
        )}
      </Card>

      {/* ── 5. INJURY RECOVERY ────────────────────────────── */}
      {injuryRecovery.length > 0 && (
        <Card>
          <SectionHeader id="injury" icon="🩺" title="Injury Recovery" badge={`${injuryRecovery.length} active`} color={C.danger} />
          {expandedSection === "injury" && (
            <div style={{ marginTop: 8 }}>
              {injuryRecovery.map(inj => (
                <div key={inj.id} style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{inj.area}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, color: inj.severity <= 2 ? C.warning : C.danger, background: (inj.severity <= 2 ? C.warning : C.danger) + "15" }}>SEV {inj.severity}/5</span>
                  </div>
                  <div style={{ fontSize: 9, color: C.textMuted, marginTop: 3 }}>
                    {inj.startPain !== null && inj.currentPain !== null ? (
                      <>Pain: {inj.startPain} → {inj.currentPain} <span style={{ color: inj.painChange < 0 ? C.success : C.danger }}>({inj.painChange > 0 ? "+" : ""}{inj.painChange}%)</span></>
                    ) : (
                      <>No PT pain data yet — complete PT sessions to track</>
                    )}
                  </div>
                  <div style={{ fontSize: 9, color: C.info, marginTop: 2 }}>{inj.unlockedExercises} exercises available | {inj.ptSessionCount} PT sessions logged</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── 6. BODY COMPOSITION GOALS ─────────────────────── */}
      {goals.length > 0 && (
        <Card>
          <SectionHeader id="goals" icon="🎯" title="Goal Progress" badge={`${goals.length} goals`} color={C.purple} />
          {expandedSection === "goals" && (
            <div style={{ marginTop: 8 }}>
              {goals.slice(0, 6).map((g, i) => (
                <div key={`${g.muscle}-${g.type}`} style={{ padding: "5px 0", borderBottom: i < goals.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{g.muscle} <span style={{ color: g.type === "size" ? C.purple : C.teal, fontSize: 9 }}>({g.type})</span></span>
                    <span style={{ fontSize: 9, color: C.textDim }}>{g.estimate}</span>
                  </div>
                  <div style={{ fontSize: 9, color: C.textMuted }}>{g.progress}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── 7. READINESS TREND ────────────────────────────── */}
      <Card>
        <SectionHeader id="readiness" icon="📈" title="Readiness Trend" badge="30 days" color={C.teal} />
        {expandedSection === "readiness" && (
          <div style={{ marginTop: 8 }}>
            <ReadinessChart points={readiness.points} />
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 12, height: 2, background: C.teal, borderRadius: 1 }} />
                <span style={{ fontSize: 8, color: C.textDim }}>RTT</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 12, height: 2, background: C.info, borderRadius: 1, opacity: 0.6 }} />
                <span style={{ fontSize: 8, color: C.textDim }}>CTP</span>
              </div>
            </div>
            {readiness.pattern && (
              <div style={{ fontSize: 9, color: C.info, padding: "6px 8px", background: C.info + "08", borderRadius: 6, marginTop: 6 }}>
                💡 {readiness.pattern}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
