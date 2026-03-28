import { useState } from "react";
import {
  assessOvertraining, getLatestAssessment, LEVELS,
} from "../utils/overtrainingDetector.js";

// ═══════════════════════════════════════════════════════════════
// OvertrainingCard — Home page risk indicator + detail panel
// ═══════════════════════════════════════════════════════════════

const C = {
  bg: "#060b18", bgCard: "#0d1425", bgElevated: "#162040",
  bgGlass: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.08)",
  text: "#e8ecf4", textMuted: "#7a8ba8", textDim: "#4a5a78",
  teal: "#00d2c8", tealBg: "rgba(0,210,200,0.08)",
  success: "#22c55e", danger: "#ef4444", warning: "#eab308",
  info: "#3b82f6", orange: "#f97316", purple: "#a855f7",
};

export default function OvertrainingCard() {
  const [expanded, setExpanded] = useState(false);

  // Compute fresh assessment
  const assessment = assessOvertraining();
  if (!assessment) return null;

  const { level, name, color, icon, message, signals, recoveryTips, forceDeload, deload, reversal } = assessment;

  return (
    <div style={{
      background: C.bgCard,
      border: `1px solid ${level === 0 ? C.border : color + "40"}`,
      borderRadius: 16, padding: 14,
      borderLeft: level > 0 ? `3px solid ${color}` : undefined,
    }}>
      {/* Header row */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Recovery Status</div>
            <div style={{ fontSize: 10, color: C.textMuted }}>
              {level === 0 ? "All systems clear — keep training" : `Level ${level}: ${name}`}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
            color, background: color + "15",
          }}>
            {level === 0 ? "CLEAR" : name.toUpperCase()}
          </span>
          <span style={{ fontSize: 10, color: C.textDim, transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>▸</span>
        </div>
      </div>

      {/* Reversal celebration */}
      {reversal?.detected && level <= 1 && (
        <div style={{ marginTop: 8, padding: "6px 10px", background: C.success + "10", borderRadius: 8, border: `1px solid ${C.success}30` }}>
          <div style={{ fontSize: 10, color: C.success, fontWeight: 600 }}>📈 {reversal.message}</div>
        </div>
      )}

      {/* Warning message */}
      {level > 0 && message && !expanded && (
        <div style={{ marginTop: 8, fontSize: 10, color, lineHeight: 1.5 }}>{message}</div>
      )}

      {/* Expanded detail panel */}
      {expanded && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
          {/* Intervention message */}
          {message && (
            <div style={{ padding: "8px 10px", background: color + "10", borderRadius: 8, marginBottom: 10, borderLeft: `3px solid ${color}` }}>
              <div style={{ fontSize: 11, color: C.text, lineHeight: 1.6 }}>{message}</div>
            </div>
          )}

          {/* Signals detected */}
          {signals.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.textDim, letterSpacing: 1.5, marginBottom: 6 }}>
                SIGNALS DETECTED ({signals.length})
              </div>
              {signals.map((sig, i) => (
                <div key={sig.id} style={{ padding: "6px 0", borderBottom: i < signals.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{sig.label}</span>
                    <span style={{
                      fontSize: 8, fontWeight: 700, padding: "2px 5px", borderRadius: 4,
                      color: sig.severity >= 3 ? C.danger : sig.severity >= 2 ? C.orange : C.warning,
                      background: (sig.severity >= 3 ? C.danger : sig.severity >= 2 ? C.orange : C.warning) + "15",
                    }}>SEV {sig.severity}</span>
                  </div>
                  <div style={{ fontSize: 9, color: C.textMuted, marginTop: 2 }}>{sig.detail}</div>
                </div>
              ))}
            </div>
          )}

          {/* Recovery recommendations */}
          {recoveryTips.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.textDim, letterSpacing: 1.5, marginBottom: 6 }}>
                RECOVERY RECOMMENDATIONS
              </div>
              {recoveryTips.map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: 6, padding: "4px 0" }}>
                  <span style={{ color: C.info, fontSize: 10 }}>💡</span>
                  <span style={{ fontSize: 10, color: C.textMuted, lineHeight: 1.5 }}>{tip}</span>
                </div>
              ))}
            </div>
          )}

          {/* Deload status */}
          <div style={{ padding: "6px 10px", background: C.bgGlass, borderRadius: 8, fontSize: 10, color: C.textMuted }}>
            {forceDeload ? (
              <span style={{ color: C.danger, fontWeight: 700 }}>⚡ Deload week activated — 50% volume, RPE 5 max</span>
            ) : deload.isOverdue ? (
              <span style={{ color: C.warning }}>⏰ {deload.weeksSinceDeload} weeks since last deload — scheduled deload coming</span>
            ) : (
              <span>Last deload: {deload.weeksSinceDeload} week{deload.weeksSinceDeload !== 1 ? "s" : ""} ago — next at week 4</span>
            )}
          </div>

          {/* What the app is doing */}
          {level >= 2 && (
            <div style={{ marginTop: 8, padding: "6px 10px", background: C.info + "08", borderRadius: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.info, marginBottom: 3 }}>WHAT WE'RE DOING</div>
              <div style={{ fontSize: 10, color: C.textMuted, lineHeight: 1.6 }}>
                {level === 2 && "Reducing volume 20%, adding extra rest between sets, extending warm-up, simplifying exercise selection."}
                {level === 3 && "Forcing deload week: 50% volume, RPE 5 max, extra mobility and foam rolling."}
                {level === 4 && "Training plan blocked. Only Floor Session (gentle movement) available. Please see your PT or doctor."}
              </div>
            </div>
          )}

          {/* Level 0: all clear details */}
          {signals.length === 0 && (
            <div style={{ textAlign: "center", padding: 12 }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>🌟</div>
              <div style={{ fontSize: 11, color: C.success, fontWeight: 600 }}>All systems clear</div>
              <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                No overtraining signals detected. Keep up the good work!
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
