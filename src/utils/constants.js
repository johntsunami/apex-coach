// ═══════════════════════════════════════════════════════════════
// APEX Coach — Shared Constants
// Colors, phase parameters, timing values, configuration
// Single source of truth — import in any file that needs these
// ═══════════════════════════════════════════════════════════════

// ── Theme Colors ────────────────────────────────────────────────
export const COLORS = {
  bg: "#060b18",
  bgCard: "#0d1425",
  bgElevated: "#162040",
  bgGlass: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  text: "#e8ecf4",
  textMuted: "#7a8ba8",
  textDim: "#4a5a78",
  teal: "#00d2c8",
  tealGlow: "rgba(0,210,200,0.15)",
  tealDark: "#00a89f",
  tealBg: "rgba(0,210,200,0.08)",
  success: "#22c55e",
  danger: "#ef4444",
  warning: "#eab308",
  info: "#3b82f6",
  infoGlow: "rgba(59,130,246,0.12)",
  orange: "#f97316",
  purple: "#a855f7",
  purpleGlow: "rgba(168,85,247,0.12)",
};

// Shorthand alias (matches existing codebase usage)
export const C = COLORS;

// ── Phase Parameters (NASM OPT Model) ───────────────────────────
export const PHASE_PARAMS = {
  1: { label: "Stabilization Endurance", sets: "1-3", reps: "12-20", tempo: "4/2/1", rest: 60, rpe: "5-7" },
  2: { label: "Strength Endurance", sets: "2-4", reps: "8-12", tempo: "2/0/2", rest: 60, rpe: "6-8" },
  3: { label: "Hypertrophy", sets: "3-5", reps: "6-12", tempo: "2/0/2", rest: 90, rpe: "7-9" },
  4: { label: "Maximal Strength", sets: "4-6", reps: "1-5", tempo: "X/0/2", rest: 180, rpe: "8-10" },
  5: { label: "Power", sets: "3-5", reps: "1-5", tempo: "X/0/X", rest: 180, rpe: "8-10" },
};

// ── Rest Timer Defaults (per phase) ─────────────────────────────
export const REST_DEFAULTS = { 1: 60, 2: 60, 3: 90, 4: 180, 5: 180 };

// ── Session Time → Exercise Count ───────────────────────────────
export const SESSION_EXERCISE_COUNTS = {
  30: { warmup: 3, main: 4, cooldown: 2 },
  45: { warmup: 4, main: 6, cooldown: 3 },
  60: { warmup: 5, main: 7, cooldown: 3 },
  90: { warmup: 5, main: 8, cooldown: 3 },
};

// ── Volume Limits (per phase, sets/muscle/week) ─────────────────
export const VOLUME_LIMITS = {
  1: { min: 10, max: 12 },
  2: { min: 14, max: 18 },
  3: { min: 18, max: 24 },
  4: { min: 12, max: 16 },
  5: { min: 10, max: 15 },
};

// ── Phase Weights for Exercise Scoring ──────────────────────────
export const PHASE_EXERCISE_WEIGHTS = {
  1: { stabilization: 2.0, mobility: 1.5, rehab: 1.5, strength: 0.5, isolation: 0.3, plyometric: 0.0 },
  2: { stabilization: 1.2, mobility: 1.0, rehab: 1.0, strength: 1.5, isolation: 0.8, plyometric: 0.3 },
  3: { stabilization: 0.4, mobility: 0.3, rehab: 0.8, strength: 2.0, isolation: 1.8, plyometric: 0.8 },
  4: { stabilization: 0.3, mobility: 0.3, rehab: 0.8, strength: 2.5, isolation: 0.8, plyometric: 1.5 },
  5: { stabilization: 0.3, mobility: 0.3, rehab: 0.8, strength: 1.5, isolation: 0.5, plyometric: 2.5 },
};

// ── Equipment Tiers (for location-smart scheduling) ─────────────
export const EQUIPMENT_TIERS = {
  tier1: new Set(["cable","machine","lat_pulldown","leg_press","smith_machine","hack_squat","cable_machine","leg_extension","leg_curl","pec_deck","chest_press_machine"]),
  tier2: new Set(["barbell","trap_bar","squat_rack","pull_up_bar","dip_bars","landmine","olympic_bar"]),
  tier3: new Set(["dumbbell","kettlebell","bench","box","step","medicine_ball","ab_wheel"]),
  tier4: new Set(["band","trx","stability_ball","foam_roller","bosu_ball","yoga_block","suspension_trainer"]),
};

// ── Location Boost Multipliers ──────────────────────────────────
export const LOCATION_BOOSTS = {
  gym:     { 1: 0.25, 2: 0.20, 3: 0.10, 4: 0.0, 5: 0.0 },
  home:    { 1: 0.0,  2: 0.0,  3: 0.10, 4: 0.20, 5: 0.25 },
  outdoor: { 1: 0.0,  2: 0.0,  3: 0.0,  4: 0.10, 5: 0.30 },
};

// ── Phase Parameter Defaults (fallback when exercise lacks phaseParams) ──
export const PHASE_DEFAULTS = {
  1: { sets: "2", reps: "12-20", tempo: "4/2/1", rest: "60s", intensity: "RPE 5-7" },
  2: { sets: "3", reps: "8-12", tempo: "2/0/2", rest: "60s", intensity: "RPE 6-8" },
  3: { sets: "4", reps: "6-12", tempo: "2/0/2", rest: "90s", intensity: "RPE 7-9" },
  4: { sets: "5", reps: "1-5", tempo: "X/0/2", rest: "180s", intensity: "RPE 8-10" },
  5: { sets: "4", reps: "1-5", tempo: "X/0/X", rest: "180s", intensity: "RPE 8-10" },
};

// ── Developer Whitelist ─────────────────────────────────────────
export const DEV_EMAILS = ["johncarrus@gmail.com"];
