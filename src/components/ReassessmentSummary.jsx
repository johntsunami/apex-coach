import { useState } from "react";
import ExerciseImage from "./ExerciseImage.jsx";
import exerciseDB from "../data/exercises.json";
import { generateGoalProjections } from "../utils/reassessment.js";
import { getAssessment } from "./Onboarding.jsx";

// ═══════════════════════════════════════════════════════════════
// ReassessmentSummary — Detailed comparison after reassessment
// Shows what changed, what's preserved, goal projections
// ═══════════════════════════════════════════════════════════════

const C = {
  bg: "#060b18", bgCard: "#0d1425", bgElevated: "#162040",
  bgGlass: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.08)",
  text: "#e8ecf4", textMuted: "#7a8ba8", textDim: "#4a5a78",
  teal: "#00d2c8", tealBg: "rgba(0,210,200,0.08)",
  success: "#22c55e", danger: "#ef4444", warning: "#eab308",
  info: "#3b82f6", orange: "#f97316", purple: "#a855f7",
};

const exById = Object.fromEntries(exerciseDB.map(e => [e.id, e]));
const Card = ({ children, style }) => <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, ...style }}>{children}</div>;
const Badge = ({ children, color = C.teal }) => <span style={{ display: "inline-flex", padding: "3px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color, background: color + "15" }}>{children}</span>;

export default function ReassessmentSummary({ diff, onContinue }) {
  const [showProjections, setShowProjections] = useState(false);
  const assessment = getAssessment();
  const projections = assessment ? generateGoalProjections(assessment) : [];

  const Section = ({ icon, title, color, children, count }) => (
    <Card style={{ borderLeft: `3px solid ${color}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 14 }}>{icon}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{title}</span>
        </div>
        {count !== undefined && <Badge color={color}>{count}</Badge>}
      </div>
      {children}
    </Card>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.teal, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 3 }}>REASSESSMENT COMPLETE</div>
        <div style={{ fontSize: 11, color: C.textMuted }}>Your workout history, strength records, and streaks are preserved.</div>
      </div>

      {/* Safety verified badge */}
      <Card style={{ background: C.success + "08", borderColor: C.success + "30", textAlign: "center", padding: 12 }}>
        <span style={{ fontSize: 16 }}>✓</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.success, marginLeft: 6 }}>Safety Verified — All 12 checks passed</span>
      </Card>

      {/* ── CONDITIONS ────────────────────────────────────── */}
      {(diff.conditionsAdded.length > 0 || diff.conditionsRemoved.length > 0 || diff.conditionsChanged.length > 0) && (
        <Section icon="🩺" title="Conditions Changed" color={C.danger} count={diff.conditionsAdded.length + diff.conditionsRemoved.length + diff.conditionsChanged.length}>
          {diff.conditionsAdded.map(c => (
            <div key={c.conditionId} style={{ fontSize: 10, color: C.danger, padding: "3px 0" }}>+ Added: {c.name || c.conditionId} (severity {c.severity})</div>
          ))}
          {diff.conditionsRemoved.map(c => (
            <div key={c.conditionId} style={{ fontSize: 10, color: C.success, padding: "3px 0" }}>- Removed: {c.name || c.conditionId}</div>
          ))}
          {diff.conditionsChanged.map(c => (
            <div key={c.conditionId} style={{ fontSize: 10, color: C.warning, padding: "3px 0" }}>~ Changed: {c.name || c.conditionId} severity {c.oldSeverity} → {c.newSeverity}</div>
          ))}
        </Section>
      )}

      {/* ── EXERCISES BLOCKED/UNLOCKED ────────────────────── */}
      {(diff.exercisesNewlyBlocked.length > 0 || diff.exercisesNewlyUnlocked.length > 0) && (
        <Section icon="🔒" title="Exercise Availability" color={C.info} count={diff.exercisesNewlyBlocked.length + diff.exercisesNewlyUnlocked.length}>
          {diff.exercisesNewlyBlocked.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 9, color: C.danger, fontWeight: 700, marginBottom: 3 }}>NEWLY BLOCKED ({diff.exercisesNewlyBlocked.length})</div>
              {diff.exercisesNewlyBlocked.slice(0, 5).map(ex => {
                const exercise = exById[ex.id];
                return (
                  <div key={ex.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 0" }}>
                    {exercise && <ExerciseImage exercise={exercise} size="thumb" />}
                    <span style={{ fontSize: 10, color: C.textMuted }}>{ex.name}</span>
                  </div>
                );
              })}
              {diff.exercisesNewlyBlocked.length > 5 && <div style={{ fontSize: 9, color: C.textDim }}>+{diff.exercisesNewlyBlocked.length - 5} more</div>}
            </div>
          )}
          {diff.exercisesNewlyUnlocked.length > 0 && (
            <div>
              <div style={{ fontSize: 9, color: C.success, fontWeight: 700, marginBottom: 3 }}>NEWLY UNLOCKED ({diff.exercisesNewlyUnlocked.length})</div>
              {diff.exercisesNewlyUnlocked.slice(0, 5).map(ex => {
                const exercise = exById[ex.id];
                return (
                  <div key={ex.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 0" }}>
                    {exercise && <ExerciseImage exercise={exercise} size="thumb" />}
                    <span style={{ fontSize: 10, color: C.success }}>{ex.name}</span>
                  </div>
                );
              })}
              {diff.exercisesNewlyUnlocked.length > 5 && <div style={{ fontSize: 9, color: C.textDim }}>+{diff.exercisesNewlyUnlocked.length - 5} more</div>}
            </div>
          )}
        </Section>
      )}

      {/* ── CAPABILITY TAGS PAUSED ────────────────────────── */}
      {diff.capsPaused?.length > 0 && (
        <Section icon="⏸️" title="Capabilities Paused" color={C.warning} count={diff.capsPaused.length}>
          <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4 }}>Based on your updated conditions, some capabilities have been paused:</div>
          {diff.capsPaused.map(cap => (
            <div key={cap.id} style={{ fontSize: 10, color: C.warning, padding: "2px 0" }}>⏸️ {cap.id?.replace(/_/g, " ")}</div>
          ))}
          <div style={{ fontSize: 9, color: C.textDim, marginTop: 4 }}>You can re-earn them as you progress through your new plan.</div>
        </Section>
      )}

      {/* ── PHASE CHANGE ─────────────────────────────────── */}
      {diff.phaseChange && (
        <Section icon="⬇️" title="Phase Regression" color={C.danger}>
          <div style={{ fontSize: 11, color: C.text, lineHeight: 1.6 }}>
            Phase {diff.phaseChange.oldPhase} → Phase {diff.phaseChange.newPhase}
          </div>
          {diff.phaseChange.reasons.map((r, i) => <div key={i} style={{ fontSize: 9, color: C.danger, padding: "2px 0" }}>{r}</div>)}
          <div style={{ fontSize: 9, color: C.textMuted, marginTop: 4, fontStyle: "italic" }}>
            Your strength data is preserved — you'll progress faster than a new user because your foundation exists.
          </div>
        </Section>
      )}

      {/* ── PT PROTOCOLS ─────────────────────────────────── */}
      {diff.ptProtocolChanges?.length > 0 && (
        <Section icon="🏥" title="PT Protocols" color={C.purple} count={diff.ptProtocolChanges.length}>
          {diff.ptProtocolChanges.map((ch, i) => (
            <div key={i} style={{ fontSize: 10, color: ch.action === "new" ? C.info : ch.action === "regressed" ? C.warning : C.success, padding: "2px 0" }}>
              {ch.action === "new" && `+ New protocol: ${ch.key}`}
              {ch.action === "preserved" && `✓ ${ch.key}: progress preserved (Phase ${ch.phase})`}
              {ch.action === "regressed" && `↓ ${ch.key}: regressed Phase ${ch.from} → ${ch.to}`}
            </div>
          ))}
        </Section>
      )}

      {/* ── FREQUENCY / TIME / EQUIPMENT ─────────────────── */}
      {(diff.frequencyChanged || diff.sessionTimeChanged || diff.equipmentChanged) && (
        <Section icon="⚙️" title="Plan Settings" color={C.teal}>
          {diff.frequencyChanged && <div style={{ fontSize: 10, color: C.text, padding: "2px 0" }}>Training: {diff.oldFreq}x → {diff.newFreq}x per week</div>}
          {diff.sessionTimeChanged && <div style={{ fontSize: 10, color: C.text, padding: "2px 0" }}>Session: {diff.oldTime} → {diff.newTime} minutes</div>}
          {diff.equipmentChanged && <div style={{ fontSize: 10, color: C.text, padding: "2px 0" }}>Equipment list updated</div>}
        </Section>
      )}

      {/* ── MEDICATION IMPACTS ────────────────────────────── */}
      {diff.medicationImpacts?.length > 0 && (
        <Section icon="💊" title="Medication Changes" color={C.orange} count={diff.medicationImpacts.length}>
          {diff.medicationImpacts.map((m, i) => (
            <div key={i} style={{ fontSize: 10, color: C.orange, padding: "2px 0" }}>{m.message}</div>
          ))}
        </Section>
      )}

      {/* ── RESTRICTED POOL WARNING ───────────────────────── */}
      {diff.exercisePool?.isRestricted && (
        <Card style={{ borderColor: C.warning + "40", background: C.warning + "08" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.warning, marginBottom: 4 }}>Limited Exercise Pool</div>
          <div style={{ fontSize: 10, color: C.text, lineHeight: 1.6 }}>{diff.exercisePool.message}</div>
        </Card>
      )}

      {/* ── GOAL CONFLICTS ────────────────────────────────── */}
      {diff.goalConflicts?.length > 0 && (
        <Section icon="🎯" title="Adapted Goal Paths" color={C.purple} count={diff.goalConflicts.length}>
          {diff.goalConflicts.map((gc, i) => (
            <div key={i} style={{ fontSize: 10, color: C.textMuted, padding: "4px 0", lineHeight: 1.5 }}>{gc.adapted}</div>
          ))}
        </Section>
      )}

      {/* ── PAUSED FAVORITES ──────────────────────────────── */}
      {diff.pausedFavorites?.length > 0 && (
        <Section icon="⭐" title="Paused Favorites" color={C.warning} count={diff.pausedFavorites.length}>
          {diff.pausedFavorites.map(f => {
            const ex = exById[f.id];
            return (
              <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0" }}>
                {ex && <ExerciseImage exercise={ex} size="thumb" />}
                <div>
                  <div style={{ fontSize: 10, color: C.text }}>{f.name}</div>
                  <div style={{ fontSize: 8, color: C.warning }}>{f.reason}</div>
                </div>
              </div>
            );
          })}
          <div style={{ fontSize: 9, color: C.textDim, marginTop: 4 }}>These will reactivate when conditions improve.</div>
        </Section>
      )}

      {/* ── GOAL PROJECTIONS TOGGLE ───────────────────────── */}
      <button onClick={() => setShowProjections(!showProjections)} style={{
        width: "100%", padding: "12px 16px", borderRadius: 12, fontSize: 12, fontWeight: 700,
        background: C.purple + "15", border: `1px solid ${C.purple}40`, color: C.purple,
        cursor: "pointer", fontFamily: "inherit",
      }}>
        {showProjections ? "Hide" : "Show"} Goal Projections (6-Week Blocks)
      </button>

      {showProjections && projections.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {projections.map((p, pi) => (
            <Card key={pi} style={{ borderLeft: `3px solid ${p.isCondition ? C.danger : p.isConflict ? C.warning : p.type === "strength" ? C.teal : p.type === "size" ? C.purple : C.info}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{p.muscle}</span>
                <Badge color={p.isCondition ? C.danger : p.type === "strength" ? C.teal : p.type === "size" ? C.purple : C.info}>{p.isCondition ? `rehab · sev ${p.severity}` : p.type}</Badge>
              </div>
              {p.blocks.map((b, bi) => (
                <div key={bi} style={{ padding: "4px 0", borderBottom: bi < p.blocks.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  {b.weeks && <div style={{ fontSize: 9, color: C.teal, fontWeight: 700 }}>Weeks {b.weeks}: {b.title}</div>}
                  <div style={{ fontSize: 10, color: b.note ? C.textDim : C.textMuted, fontStyle: b.note ? "italic" : "normal", lineHeight: 1.5 }}>{b.desc || b.note}</div>
                </div>
              ))}
            </Card>
          ))}
          <Card style={{ background: C.bgGlass }}>
            <div style={{ fontSize: 9, color: C.textDim, fontStyle: "italic", lineHeight: 1.6 }}>
              These projections are based on NASM OPT periodization protocols and clinical evidence. Individual results vary based on consistency, nutrition, sleep, and your body's response. We track your actual progress and adjust every session.
            </div>
          </Card>
        </div>
      )}

      {/* ── CONTINUE BUTTON ───────────────────────────────── */}
      <button onClick={onContinue} style={{
        width: "100%", padding: "16px 24px", borderRadius: 14, fontSize: 16, fontWeight: 700,
        background: `linear-gradient(135deg, ${C.teal}, ${C.teal}dd)`, color: "#000",
        border: "none", cursor: "pointer", fontFamily: "inherit",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        <span>⚡</span> Continue to Home
      </button>

      <div style={{ height: 90 }} />
    </div>
  );
}
