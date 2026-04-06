// ═══════════════════════════════════════════════════════════════
// APEX Coach — Power Rings Progress Visualization
// 4 concentric rings: Strength, Mobility, Endurance, Recovery
// Canvas-based rendering with post-workout animation
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from "react";
import { getRings, computePowerLevel, getDetrainingWarning, checkAndApplyDecay } from "../utils/detraining.js";

const C = { bg: "#060b18", bgCard: "#0d1425", border: "rgba(255,255,255,0.08)", text: "#e8ecf4", textMuted: "#7a8ba8", textDim: "#4a5a78", teal: "#00d2c8", warning: "#eab308", danger: "#ef4444" };

const PALETTES = [
  { strength: "#00C8F0", mobility: "#34D399", endurance: "#818CF8", recovery: "#F59E0B" },
  { strength: "#F472B6", mobility: "#FB923C", endurance: "#A78BFA", recovery: "#38BDF8" },
  { strength: "#FBBF24", mobility: "#4ADE80", endurance: "#F87171", recovery: "#C084FC" },
];

const RING_LABELS = [
  { key: "strength", label: "Strength" },
  { key: "mobility", label: "Mobility" },
  { key: "endurance", label: "Endurance" },
  { key: "recovery", label: "Recovery" },
];

const TRACK_COLOR = "rgba(255,255,255,0.06)";
const RING_WIDTH = 14;
const GAP = 6;
const CANVAS_SIZE = 200;
const CENTER = CANVAS_SIZE / 2;

// ── Canvas Ring Drawer ──────────────────────────────────────────

function drawRings(ctx, rings, palette, ascensionCount) {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  const startAngle = -Math.PI / 2;

  RING_LABELS.forEach((r, i) => {
    const radius = CENTER - RING_WIDTH / 2 - i * (RING_WIDTH + GAP) - 10;
    const value = Math.max(0, Math.min(1, rings[r.key] || 0));
    const color = palette[r.key];

    // Track
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, radius, 0, Math.PI * 2);
    ctx.strokeStyle = TRACK_COLOR;
    ctx.lineWidth = RING_WIDTH;
    ctx.lineCap = "round";
    ctx.stroke();

    // Filled arc
    if (value > 0.005) {
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, radius, startAngle, startAngle + Math.PI * 2 * value);
      ctx.strokeStyle = color;
      ctx.lineWidth = RING_WIDTH;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    // Ghost outlines for previous ascensions
    if (ascensionCount > 0) {
      const prevPalette = PALETTES[(ascensionCount - 1) % PALETTES.length];
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, radius, 0, Math.PI * 2);
      ctx.strokeStyle = prevPalette[r.key] + "15";
      ctx.lineWidth = RING_WIDTH + 2;
      ctx.lineCap = "round";
      ctx.stroke();
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// POWER RINGS COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function PowerRingsCard({ onStartWorkout }) {
  const canvasRef = useRef(null);
  const [rings, setRings] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const current = checkAndApplyDecay();
    setRings(current);
  }, []);

  useEffect(() => {
    if (!rings || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    const palette = PALETTES[rings.colorPalette || 0] || PALETTES[0];
    drawRings(ctx, rings, palette, rings.ascensionCount || 0);
  }, [rings]);

  if (!rings) return null;

  const powerLevel = computePowerLevel(rings);
  const palette = PALETTES[rings.colorPalette || 0] || PALETTES[0];
  const warning = getDetrainingWarning(rings.daysOff || 0);
  const hasSession = !!rings.lastSessionDate;
  const warningColor = warning?.severity === "full_reset" ? C.danger : warning?.severity === "significant" ? C.danger : C.warning;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
      {/* Detraining warning */}
      {warning && <div style={{ background: C.bgCard, border: `1px solid ${warningColor}30`, borderLeft: `3px solid ${warningColor}`, borderRadius: 14, padding: "12px 14px" }}>
        <div style={{ fontSize: 13, color: warningColor, fontWeight: 600, marginBottom: 4 }}>⚠️ {warning.text}</div>
        {onStartWorkout && <button onClick={onStartWorkout} style={{ marginTop: 6, padding: "8px 16px", borderRadius: 10, background: C.teal + "15", border: `1px solid ${C.teal}40`, color: C.teal, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Start comeback session</button>}
      </div>}

      {/* Power Rings Card */}
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim, letterSpacing: 2 }}>POWER RINGS</div>
          <button onClick={() => setShowInfo(!showInfo)} style={{ background: "none", border: "none", color: C.textDim, fontSize: 14, cursor: "pointer", padding: 0 }}>ℹ️</button>
        </div>

        {showInfo && <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.5, marginBottom: 10, padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>Your power level tracks strength, mobility, endurance, and recovery. Complete workouts to fill each ring. Reach level 100 to ascend.</div>}

        {/* Ascension stars */}
        {(rings.ascensionCount || 0) > 0 && <div style={{ textAlign: "center", marginBottom: 4, fontSize: 12, color: "#FBBF24" }}>{"★".repeat(Math.min(rings.ascensionCount, 10))} × {rings.ascensionCount}</div>}

        {/* Canvas + center number */}
        <div style={{ position: "relative", width: CANVAS_SIZE, height: CANVAS_SIZE, margin: "0 auto" }}>
          <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif" }}>{powerLevel}</div>
            <div style={{ fontSize: 9, fontWeight: 500, color: C.textDim, letterSpacing: 2 }}>POWER LEVEL</div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 8 }}>
          {RING_LABELS.map(r => (
            <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: palette[r.key] }} />
              <span style={{ fontSize: 10, color: C.textDim }}>{r.label}</span>
            </div>
          ))}
        </div>

        {/* Ring values */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 6 }}>
          {RING_LABELS.map(r => (
            <div key={r.key} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: palette[r.key], fontFamily: "'Bebas Neue',sans-serif" }}>{Math.round((rings[r.key] || 0) * 100)}%</div>
            </div>
          ))}
        </div>

        {!hasSession && <div style={{ textAlign: "center", fontSize: 11, color: C.textDim, marginTop: 8 }}>Complete your first workout to start filling your power rings.</div>}
      </div>
    </div>
  );
}

// Export for use in session completion
export { PALETTES, RING_LABELS };
