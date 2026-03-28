import { useState, useMemo } from "react";
import exerciseDB from "../data/exercises.json";
import ExerciseImage from "./ExerciseImage.jsx";
import { getInjuries } from "../utils/injuries.js";
import { supabase } from "../utils/supabase.js";

// ═══════════════════════════════════════════════════════════════
// ExerciseSwap — Request alternative exercises with safety checks
// Shows 3 valid swaps, tradeoff analysis, volume balance warnings
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

// ── Find 3 valid alternatives for an exercise ───────────────

function findAlternatives(exercise, phase = 1, location = "gym", excludeIds = new Set()) {
  const injuries = getInjuries().filter(i => i.status !== "resolved");
  const results = [];

  // Build candidate pool: same movementPattern + bodyPart first, then relaxed
  const candidates = [];

  // Tier 1: Same movement pattern + same body part
  exerciseDB.forEach(e => {
    if (e.id === exercise.id) return;
    if (excludeIds.has(e.id)) return;
    if (e.movementPattern === exercise.movementPattern && e.bodyPart === exercise.bodyPart) {
      candidates.push({ ...e, matchTier: 1 });
    }
  });

  // Tier 2: Same movement pattern, different body part
  exerciseDB.forEach(e => {
    if (e.id === exercise.id) return;
    if (excludeIds.has(e.id)) return;
    if (candidates.some(c => c.id === e.id)) return;
    if (e.movementPattern === exercise.movementPattern) {
      candidates.push({ ...e, matchTier: 2 });
    }
  });

  // Tier 3: Same body part, different movement pattern
  exerciseDB.forEach(e => {
    if (e.id === exercise.id) return;
    if (excludeIds.has(e.id)) return;
    if (candidates.some(c => c.id === e.id)) return;
    if (e.bodyPart === exercise.bodyPart) {
      candidates.push({ ...e, matchTier: 3 });
    }
  });

  // Filter candidates through safety checks
  for (const cand of candidates) {
    if (results.length >= 3) break;

    // Phase eligibility
    if (!(cand.phaseEligibility || []).includes(phase)) continue;

    // Safety tier
    if (cand.safetyTier === "red") continue;

    // Contraindication severity gates
    const sg = cand.contraindications?.severity_gate || {};
    let blocked = false;
    for (const inj of injuries) {
      const gateKey = inj.gateKey || inj.area?.toLowerCase().replace(/\s+/g, "_");
      if (sg[gateKey] !== undefined && inj.severity > sg[gateKey]) {
        blocked = true;
        break;
      }
    }
    if (blocked) continue;

    // Location compatibility
    if (location === "outdoor" && !(cand.locationCompatible || []).includes("outdoor")) continue;
    if (location === "home") {
      const HOME_EQ = new Set(["none", "mat", "band", "dumbbell", "kettlebell", "foam_roller", "towel", "strap", "wall", "bench", "stability_ball", "box"]);
      if (!(cand.equipmentRequired || []).every(eq => HOME_EQ.has(eq))) continue;
    }

    // Prerequisites check
    const pre = cand.prerequisites || {};
    if (pre.minPhase && phase < pre.minPhase) continue;

    // Generate tradeoff text
    const tradeoff = generateTradeoff(exercise, cand);
    const whyValid = generateWhyValid(exercise, cand);

    results.push({ ...cand, tradeoff, whyValid, matchTier: cand.matchTier });
  }

  return results;
}

// ── Generate tradeoff text ──────────────────────────────────

function generateTradeoff(original, alternative) {
  const parts = [];

  // Difficulty comparison
  const origDiff = original.difficultyLevel || 1;
  const altDiff = alternative.difficultyLevel || 1;
  if (altDiff < origDiff) parts.push("easier movement — good for building confidence");
  else if (altDiff > origDiff) parts.push("more challenging — ensure form is solid first");

  // Muscle activation comparison
  const origPrimary = new Set(original.primaryMuscles || []);
  const altPrimary = new Set(alternative.primaryMuscles || []);
  const missing = [...origPrimary].filter(m => !altPrimary.has(m));
  const added = [...altPrimary].filter(m => !origPrimary.has(m));
  if (missing.length > 0) parts.push(`slightly less ${missing[0].toLowerCase()} activation`);
  if (added.length > 0) parts.push(`adds ${added[0].toLowerCase()} work`);

  // Equipment difference
  const origEq = (original.equipmentRequired || []).join(", ");
  const altEq = (alternative.equipmentRequired || []).join(", ");
  if (origEq !== altEq && altEq) parts.push(`uses ${altEq.replace(/_/g, " ")}`);

  // Injury notes comparison
  const injNotes = alternative.injuryNotes || {};
  for (const [area, note] of Object.entries(injNotes)) {
    if (note && note.toLowerCase().includes("safe")) {
      parts.push(`${area.replace(/_/g, " ")}-friendly`);
      break;
    }
  }

  if (parts.length === 0) return "Similar activation and difficulty — a lateral swap";
  return parts.slice(0, 2).join(" but ");
}

function generateWhyValid(original, alternative) {
  const reasons = [];
  if (alternative.movementPattern === original.movementPattern && alternative.bodyPart === original.bodyPart) {
    reasons.push("Same movement pattern and target muscles");
  } else if (alternative.movementPattern === original.movementPattern) {
    reasons.push("Same movement pattern — maintains program balance");
  } else if (alternative.bodyPart === original.bodyPart) {
    reasons.push("Same target area — keeps volume balanced");
  }
  if (alternative.safetyTier === "green") reasons.push("green safety tier");
  if ((alternative.phaseEligibility || []).length > 3) reasons.push("available across multiple phases");
  return reasons.join(" · ");
}

// ── Check swap balance warnings ─────────────────────────────

function checkSwapBalance(swapHistory) {
  const patternCounts = {};
  for (const swap of swapHistory) {
    const pattern = swap.originalPattern || "unknown";
    patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
  }

  const warnings = [];
  for (const [pattern, count] of Object.entries(patternCounts)) {
    if (count >= 3) {
      const patternLabel = pattern.replace(/_/g, " ");
      warnings.push(
        `You've swapped ${count} ${patternLabel} exercises — your ${patternLabel} volume may be below the minimum for your goals. Consider keeping at least one ${patternLabel} movement.`
      );
    }
  }
  return warnings;
}

// ── Get swap history from localStorage ──────────────────────

const SWAP_KEY = "apex_exercise_swaps";

function getSwapHistory() {
  try { return JSON.parse(localStorage.getItem(SWAP_KEY) || "[]"); }
  catch { return []; }
}

function saveSwap(originalId, replacementId, reason, context) {
  const history = getSwapHistory();
  const original = exById[originalId];
  const entry = {
    originalId,
    replacementId,
    originalPattern: original?.movementPattern,
    originalBodyPart: original?.bodyPart,
    reason,
    context,
    date: new Date().toISOString(),
  };
  history.push(entry);
  try { localStorage.setItem(SWAP_KEY, JSON.stringify(history)); } catch {}

  // Fire-and-forget Supabase log
  supabase.from("exercise_swaps").insert({
    original_exercise_id: originalId,
    replacement_exercise_id: replacementId,
    original_pattern: original?.movementPattern,
    original_body_part: original?.bodyPart,
    reason,
    context,
    created_at: new Date().toISOString(),
  }).then(() => {});

  return entry;
}

// ═══════════════════════════════════════════════════════════════
// SwapModal — The UI for selecting an alternative
// ═══════════════════════════════════════════════════════════════

export default function SwapModal({ exercise, phase, location, excludeIds, onSwap, onClose }) {
  const [selected, setSelected] = useState(null);

  const alternatives = useMemo(
    () => findAlternatives(exercise, phase || 1, location || "gym", excludeIds || new Set()),
    [exercise?.id, phase, location]
  );

  const swapHistory = getSwapHistory();
  const balanceWarnings = checkSwapBalance(swapHistory);

  const handleConfirm = () => {
    if (!selected) return;
    const alt = alternatives.find(a => a.id === selected);
    if (!alt) return;
    saveSwap(exercise.id, alt.id, alt.whyValid, "user_request");
    onSwap(alt);
  };

  const S = {
    overlay: {
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)",
      zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center",
      padding: 0,
    },
    sheet: {
      background: C.bg, borderRadius: "20px 20px 0 0", padding: "20px 16px",
      width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto",
      border: `1px solid ${C.border}`, borderBottom: "none",
    },
    btn: (color = C.teal, active = false) => ({
      padding: "10px 16px", borderRadius: 12, fontSize: 13, fontWeight: 700,
      cursor: "pointer", fontFamily: "inherit", width: "100%",
      background: active ? `linear-gradient(135deg,${color},${color}dd)` : C.bgElevated,
      color: active ? "#000" : color, border: `1px solid ${active ? color : C.border}`,
    }),
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.sheet} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>
              SWAP EXERCISE
            </div>
            <div style={{ fontSize: 11, color: C.textMuted }}>
              Replace: <span style={{ color: C.teal }}>{exercise.name}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textDim, fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        {/* Current exercise */}
        <div style={{ background: C.bgCard, borderRadius: 12, padding: 10, marginBottom: 16, border: `1px solid ${C.danger}30`, borderLeft: `3px solid ${C.danger}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ExerciseImage exercise={exercise} size="thumb" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{exercise.name}</div>
              <div style={{ fontSize: 9, color: C.textDim }}>
                {(exercise.movementPattern || "").replace(/_/g, " ")} · {(exercise.bodyPart || "").replace(/_/g, " ")}
              </div>
            </div>
            <span style={{ fontSize: 9, color: C.danger, fontWeight: 700, padding: "2px 6px", background: C.danger + "15", borderRadius: 4 }}>REMOVING</span>
          </div>
        </div>

        {/* Balance warnings */}
        {balanceWarnings.length > 0 && (
          <div style={{ background: C.warning + "10", border: `1px solid ${C.warning}30`, borderRadius: 10, padding: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.warning, marginBottom: 4 }}>BALANCE WARNING</div>
            {balanceWarnings.map((w, i) => (
              <div key={i} style={{ fontSize: 10, color: C.text, lineHeight: 1.5 }}>{w}</div>
            ))}
          </div>
        )}

        {/* Alternatives */}
        {alternatives.length === 0 ? (
          <div style={{ textAlign: "center", padding: 24 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
            <div style={{ fontSize: 13, color: C.textMuted }}>No safe alternatives found</div>
            <div style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>
              All similar exercises are either blocked by safety checks, already in your plan, or not available for your current phase/location.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: 1.5, marginBottom: 2 }}>
              {alternatives.length} ALTERNATIVE{alternatives.length !== 1 ? "S" : ""} FOUND
            </div>

            {alternatives.map(alt => {
              const isSelected = selected === alt.id;
              const diffColor = (alt.difficultyLevel || 1) <= 2 ? C.success : (alt.difficultyLevel || 1) <= 3 ? C.warning : C.danger;
              return (
                <div
                  key={alt.id}
                  onClick={() => setSelected(isSelected ? null : alt.id)}
                  style={{
                    background: isSelected ? C.tealBg : C.bgCard,
                    border: `1px solid ${isSelected ? C.teal : C.border}`,
                    borderRadius: 14, padding: 12, cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <ExerciseImage exercise={alt} size="thumb" />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? C.teal : C.text }}>{alt.name}</span>
                        <span style={{
                          fontSize: 8, fontWeight: 700, padding: "2px 5px", borderRadius: 4,
                          color: diffColor, background: diffColor + "15",
                        }}>
                          LVL {alt.difficultyLevel || 1}
                        </span>
                      </div>
                      <div style={{ fontSize: 9, color: C.textDim, marginTop: 2 }}>
                        {(alt.movementPattern || "").replace(/_/g, " ")} · {(alt.bodyPart || "").replace(/_/g, " ")}
                      </div>
                    </div>
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%",
                      border: `2px solid ${isSelected ? C.teal : C.border}`,
                      background: isSelected ? C.teal : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {isSelected && <span style={{ fontSize: 12, color: "#000" }}>✓</span>}
                    </div>
                  </div>

                  {/* Why it's valid */}
                  <div style={{ marginTop: 6, padding: "4px 8px", background: C.success + "08", borderRadius: 6 }}>
                    <span style={{ fontSize: 9, color: C.success, fontWeight: 600 }}>✓ </span>
                    <span style={{ fontSize: 9, color: C.textMuted }}>{alt.whyValid}</span>
                  </div>

                  {/* Tradeoffs */}
                  <div style={{ marginTop: 3, padding: "4px 8px", background: C.info + "08", borderRadius: 6 }}>
                    <span style={{ fontSize: 9, color: C.info, fontWeight: 600 }}>↔ </span>
                    <span style={{ fontSize: 9, color: C.textMuted }}>{alt.tradeoff}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Confirm button */}
        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ ...S.btn(C.textDim), flex: 1 }}>Cancel</button>
          {alternatives.length > 0 && (
            <button
              onClick={handleConfirm}
              disabled={!selected}
              style={{ ...S.btn(C.teal, !!selected), flex: 2, opacity: selected ? 1 : 0.4 }}
            >
              {selected ? "Confirm Swap" : "Select an alternative"}
            </button>
          )}
        </div>

        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}

// Re-export utilities for use in other components
export { findAlternatives, getSwapHistory, saveSwap, checkSwapBalance };
