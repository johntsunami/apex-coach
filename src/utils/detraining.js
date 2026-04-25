// ═══════════════════════════════════════════════════════════════
// APEX Coach — Detraining Protocol Engine
// Evidence-based ring decay and NASM OPT phase regression.
// Sources: Mujika & Padilla 2000/2001, Coyle et al. 1984/1985,
// Houmard et al. 1992, Hortobágyi et al. 1993, NASM CPT 7th Ed.
// ═══════════════════════════════════════════════════════════════

const LS_RINGS = "apex_power_rings";
const LS_RETURN = "apex_return_to_training";

// ── Ring Decay Rates (peer-reviewed) ────────────────────────────

const DECAY_RATES = {
  endurance:  { grace: 10, weekly: 0.045, maxDecay: 0.55, rampWeek: 3, floor: 0.45 },
  strength:   { grace: 21, weekly: 0.03,  maxDecay: 0.40, rampWeek: 4, floor: 0.60 },
  mobility:   { grace: 28, weekly: 0.02,  maxDecay: 0.30, rampWeek: 6, floor: 0.70 },
  recovery:   { grace: 7,  weekly: 0.08,  maxDecay: 0.80, rampWeek: 2, floor: 0.20 },
};

export function calculateRingDecay(ringName, daysOff) {
  const r = DECAY_RATES[ringName];
  if (!r || daysOff <= r.grace) return 0;
  const decayWeeks = (daysOff - r.grace) / 7;
  let total;
  if (decayWeeks <= r.rampWeek) {
    total = decayWeeks * r.weekly;
  } else {
    total = (r.rampWeek * r.weekly) + ((decayWeeks - r.rampWeek) * r.weekly * 1.3);
  }
  return Math.min(total, r.maxDecay);
}

export function applyDecay(ringValues, daysOff) {
  if (daysOff <= 0) return { ...ringValues };
  return {
    strength:  Math.max(0, (ringValues.strength || 0)  - calculateRingDecay("strength", daysOff)),
    mobility:  Math.max(0, (ringValues.mobility || 0)  - calculateRingDecay("mobility", daysOff)),
    endurance: Math.max(0, (ringValues.endurance || 0) - calculateRingDecay("endurance", daysOff)),
    recovery:  Math.max(0, (ringValues.recovery || 0)  - calculateRingDecay("recovery", daysOff)),
  };
}

// ── Power Level ─────────────────────────────────────────────────

export function computePowerLevel(rings) {
  return Math.floor(
    ((rings.strength || 0) * 0.35 +
     (rings.mobility || 0) * 0.20 +
     (rings.endurance || 0) * 0.25 +
     (rings.recovery || 0) * 0.20) * 100
  );
}

// ── Ring Gains Per Workout ──────────────────────────────────────

const PHASE_MULTIPLIERS = { 1: 0.8, 2: 1.0, 3: 1.1, 4: 1.15, 5: 1.2 };

export function calculateRingGains(sessionData, phase) {
  const pm = PHASE_MULTIPLIERS[phase] || 1.0;
  const mainDone = sessionData.exercisesCompleted || 0;
  const mainTotal = sessionData.exercisesPlanned || mainDone || 1;
  const warmupDone = sessionData.warmupCompleted ? 1 : 0;
  const cardioMin = sessionData.cardioMinutes || 0;
  const cardioTarget = sessionData.cardioTarget || 20;
  const cooldownDone = sessionData.cooldownCompleted ? 1 : 0;

  return {
    strength:  Math.min(0.05, (mainDone / mainTotal) * 0.02 * pm),
    mobility:  Math.min(0.05, (warmupDone / 1) * 0.025 * pm),
    endurance: Math.min(0.05, (cardioMin / cardioTarget) * 0.018 * pm),
    recovery:  Math.min(0.04, (0.015 + (cooldownDone ? 0.005 : 0)) * pm),
  };
}

// ── Phase Regression (NASM OPT) ─────────────────────────────────

export function getPhaseRegression(daysOff) {
  if (daysOff <= 13) return { action: "ramp_only", phase1Weeks: 0, revokedTags: [], volumeRamp: [0.5, 0.7, 1.0], message: null };
  if (daysOff <= 27) return { action: "shortened_phase1", phase1Weeks: 2, revokedTags: [], volumeRamp: [0.5, 0.6, 0.7, 0.8, 1.0], message: "Welcome back. We're rebuilding your base for 2 weeks before ramping up." };
  if (daysOff <= 56) return { action: "full_phase1", phase1Weeks: 4, revokedTags: ["plyometric_ready", "heavy_loading_ready", "barbell_competent"], volumeRamp: [0.5, 0.6, 0.7, 0.7, 0.8, 1.0], message: "It's been a while. Your body needs to rebuild its foundation. Phase 1 for 4 weeks — you'll be stronger for it." };
  if (daysOff <= 84) return { action: "extended_phase1", phase1Weeks: 6, revokedTags: ["plyometric_ready", "heavy_loading_ready", "barbell_competent", "overhead_cleared", "pull_up_ready", "shoulder_pressing_cleared"], volumeRamp: [0.5, 0.6, 0.6, 0.7, 0.7, 0.8, 1.0], message: "Extended break. We're starting from your foundation and building back smart. No shortcuts — that's how we protect you." };
  return { action: "full_reset", phase1Weeks: 8, revokedTags: ["ALL"], volumeRamp: [0.5, 0.5, 0.6, 0.6, 0.7, 0.7, 0.8, 1.0], message: "Fresh start. Everything you built before is still in your muscle memory — it comes back faster the second time." };
}

export function getReturnVolumeMultiplier(sessionsSinceReturn, daysOff) {
  const regression = getPhaseRegression(daysOff);
  const idx = Math.min(sessionsSinceReturn, regression.volumeRamp.length - 1);
  return regression.volumeRamp[idx];
}

export function getDetrainingWarning(daysOff) {
  if (daysOff < 14) return null;
  if (daysOff <= 27) return { severity: "mild", text: `${daysOff} days since your last session. Your endurance is slipping — cardio capacity drops first. Let's get moving.` };
  if (daysOff <= 56) return { severity: "moderate", text: `${daysOff} days off. Strength is starting to fade and your cardio has taken a hit. We've adjusted your program to rebuild safely.` };
  if (daysOff <= 84) return { severity: "significant", text: `${daysOff} days off. Significant detraining across all domains. Your program has been reset to Phase 1. The good news: muscle memory means you'll rebuild faster than the first time.` };
  return { severity: "full_reset", text: `${daysOff} days off. We're treating this as a fresh start. Full reassessment required. You've done this before — you know what to do.` };
}

// ── Ring Storage ─────────────────────────────────────────────────

const _defaultRings = { strength: 0, mobility: 0, endurance: 0, recovery: 0, powerLevel: 0, ascensionCount: 0, colorPalette: 0, lastSessionDate: null, lastDecayCheck: null };

export function getRings() {
  try { return JSON.parse(localStorage.getItem(LS_RINGS)) || { ..._defaultRings }; }
  catch { return { ..._defaultRings }; }
}

export function saveRings(rings) {
  const updated = { ...rings, powerLevel: computePowerLevel(rings), updatedAt: new Date().toISOString() };
  try { localStorage.setItem(LS_RINGS, JSON.stringify(updated)); } catch {}
  // Fire-and-forget Supabase sync
  _syncRingsToSupabase(updated).catch(() => {});
  return updated;
}

// ── Restore rings from Supabase on app load (source of truth) ────
export async function restoreRingsFromSupabase() {
  try {
    const { supabase, isSupabaseAvailable } = await import("./supabase.js");
    if (!isSupabaseAvailable()) return false;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;
    const { data: row, error } = await supabase.from("power_rings").select("*").eq("user_id", session.user.id).single();
    if (error || !row) return false;
    const restored = {
      strength: parseFloat(row.strength_value) || 0,
      mobility: parseFloat(row.mobility_value) || 0,
      endurance: parseFloat(row.endurance_value) || 0,
      recovery: parseFloat(row.recovery_value) || 0,
      powerLevel: row.power_level || 0,
      ascensionCount: row.ascension_count || 0,
      colorPalette: row.color_palette || 0,
      lastSessionDate: row.last_session_date || null,
      lastDecayCheck: row.last_decay_check || null,
    };
    // Only restore if Supabase has meaningful data (power level > 0 or any ring > 0)
    const local = getRings();
    const supabaseHasData = restored.powerLevel > 0 || restored.strength > 0 || restored.ascensionCount > 0;
    const localHasData = local.powerLevel > 0 || local.strength > 0 || local.ascensionCount > 0;
    if (supabaseHasData && (!localHasData || restored.powerLevel >= local.powerLevel)) {
      localStorage.setItem(LS_RINGS, JSON.stringify({ ...restored, updatedAt: new Date().toISOString() }));
      console.log("[POWER RINGS] Restored from Supabase:", restored.powerLevel, "power level,", restored.ascensionCount, "ascensions");
      return true;
    }
    return false;
  } catch (e) { console.warn("Ring restore from Supabase failed:", e); return false; }
}

async function _syncRingsToSupabase(rings) {
  try {
    const { supabase, isSupabaseAvailable } = await import("./supabase.js");
    if (!isSupabaseAvailable()) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    await supabase.from("power_rings").upsert({
      user_id: session.user.id,
      strength_value: rings.strength, mobility_value: rings.mobility,
      endurance_value: rings.endurance, recovery_value: rings.recovery,
      power_level: rings.powerLevel, ascension_count: rings.ascensionCount,
      color_palette: rings.colorPalette, last_session_date: rings.lastSessionDate,
      last_decay_check: new Date().toISOString(), updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
  } catch (e) { console.warn("Ring sync failed:", e); }
}

// ── Decay Check (runs on app open) ──────────────────────────────

export function checkAndApplyDecay() {
  const rings = getRings();
  if (!rings.lastSessionDate) return rings; // no sessions yet
  const lastSession = new Date(rings.lastSessionDate);
  const now = new Date();
  const daysOff = Math.floor((now - lastSession) / 86400000);
  if (daysOff <= 0) return rings;

  // Only apply decay if we haven't checked today
  const lastCheck = rings.lastDecayCheck ? new Date(rings.lastDecayCheck) : null;
  if (lastCheck && lastCheck.toISOString().split("T")[0] === now.toISOString().split("T")[0]) return rings;

  const decayed = applyDecay(rings, daysOff);
  const updated = { ...rings, ...decayed, lastDecayCheck: now.toISOString(), daysOff };
  return saveRings(updated);
}

// ── Session Complete — Add Gains ────────────────────────────────

export function addSessionGains(sessionData, phase) {
  const rings = getRings();
  const gains = calculateRingGains(sessionData, phase);
  const updated = {
    ...rings,
    strength: Math.min(1.0, (rings.strength || 0) + gains.strength),
    mobility: Math.min(1.0, (rings.mobility || 0) + gains.mobility),
    endurance: Math.min(1.0, (rings.endurance || 0) + gains.endurance),
    recovery: Math.min(1.0, (rings.recovery || 0) + gains.recovery),
    lastSessionDate: new Date().toISOString(),
    daysOff: 0,
  };

  // Check for ascension
  const pl = computePowerLevel(updated);
  if (pl >= 100) {
    updated.ascensionCount = (updated.ascensionCount || 0) + 1;
    updated.colorPalette = updated.ascensionCount % 3;
    updated.strength = 0; updated.mobility = 0; updated.endurance = 0; updated.recovery = 0;
    updated.ascended = true;
  }

  return saveRings(updated);
}

// ── Return-to-Training State ────────────────────────────────────

export function getReturnState() {
  try { return JSON.parse(localStorage.getItem(LS_RETURN)) || null; } catch { return null; }
}

export function setReturnState(state) {
  try { localStorage.setItem(LS_RETURN, JSON.stringify(state)); } catch {}
}

export function clearReturnState() {
  try { localStorage.removeItem(LS_RETURN); } catch {}
}

// ═══════════════════════════════════════════════════════════════
// RTT TIER LAYER — User-facing names mapped to existing breakpoints.
// Volume reduction stays in getReturnVolumeMultiplier (single source).
// This layer adds: modal text, RPE cap, phase override, warmup
// extension, capability regression, session counter, auto-detect.
// ═══════════════════════════════════════════════════════════════

// Reuses the 14/28/57/85 breakpoints from getPhaseRegression.
// Tier names align with NASM detraining bands; adjustments below
// are layered ON TOP of the existing volumeRamp (no double-volume).
export const RTT_TIERS = [
  { name: "fresh",     min: 0,  max: 3,    sessionsToRebuild: 0, rpeCap: null, warmupExtraMinutes: 0,  weekOverride: null, phaseOverrideOffset: 0,  phaseOverrideTo: null },
  { name: "minor",     min: 4,  max: 13,   sessionsToRebuild: 2, rpeCap: 8,    warmupExtraMinutes: 0,  weekOverride: null, phaseOverrideOffset: 0,  phaseOverrideTo: null },
  { name: "moderate",  min: 14, max: 27,   sessionsToRebuild: 3, rpeCap: 7,    warmupExtraMinutes: 5,  weekOverride: null, phaseOverrideOffset: 0,  phaseOverrideTo: null },
  { name: "extended",  min: 28, max: 56,   sessionsToRebuild: 5, rpeCap: 6,    warmupExtraMinutes: 8,  weekOverride: 1,    phaseOverrideOffset: 0,  phaseOverrideTo: null },
  { name: "long",      min: 57, max: 84,   sessionsToRebuild: 7, rpeCap: 6,    warmupExtraMinutes: 10, weekOverride: 1,    phaseOverrideOffset: -1, phaseOverrideTo: null },
  { name: "extensive", min: 85, max: 9999, sessionsToRebuild: 7, rpeCap: 5,    warmupExtraMinutes: 10, weekOverride: 1,    phaseOverrideOffset: 0,  phaseOverrideTo: 1 },
];

export const RTT_TIERS_ORDERED = ["fresh","minor","moderate","extended","long","extensive"];

export function getDaysOff(lastWorkoutDate) {
  if (!lastWorkoutDate) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(lastWorkoutDate).getTime()) / 86400000));
}

export function getRttTier(daysOff) {
  return RTT_TIERS.find(t => daysOff >= t.min && daysOff <= t.max) || RTT_TIERS[0];
}

// Async — checks Supabase workout_sessions, falls back to ring lastSessionDate.
export async function detectReturnToTraining() {
  let lastDate = null;
  try {
    const { supabase, isSupabaseAvailable } = await import("./supabase.js");
    if (isSupabaseAvailable()) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from("workout_sessions")
          .select("completed_at")
          .eq("user_id", session.user.id)
          .not("completed_at", "is", null)
          .order("completed_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data?.completed_at) lastDate = data.completed_at;
      }
    }
  } catch {}
  if (!lastDate) {
    const rings = getRings();
    if (rings.lastSessionDate) lastDate = rings.lastSessionDate;
  }
  if (!lastDate) return { isReturning: false, daysOff: 0 };
  const daysOff = getDaysOff(lastDate);
  const tier = getRttTier(daysOff);
  return { isReturning: daysOff >= 4, daysOff, tier, lastSessionDate: lastDate };
}

export function activateRtt(tier, daysOff, opts = {}) {
  const state = {
    activatedAt: new Date().toISOString(),
    tier: tier.name,
    daysOff,
    sessionsCompleted: 0,
    sessionsToRebuild: tier.sessionsToRebuild || 2,
    modalShown: false,
    upgradedFrom: opts.upgradedFrom || null,
  };
  setReturnState(state);
  return state;
}

export function getRttState() {
  const state = getReturnState();
  if (!state) return null;
  // Auto-deactivate when rebuild complete (only for the new schema)
  if (typeof state.sessionsToRebuild === "number" && state.sessionsCompleted >= state.sessionsToRebuild) {
    clearReturnState();
    return null;
  }
  return state;
}

export function incrementRttSessions() {
  const state = getRttState();
  if (!state) return null;
  state.sessionsCompleted = (state.sessionsCompleted || 0) + 1;
  if (state.sessionsCompleted >= state.sessionsToRebuild) {
    clearReturnState();
    return null;
  }
  setReturnState(state);
  return state;
}

export function deactivateRtt() { clearReturnState(); }

export function shouldShowRttModal() {
  const state = getRttState();
  return !!state && !state.modalShown;
}

export function markRttModalShown() {
  const state = getRttState();
  if (!state) return;
  state.modalShown = true;
  setReturnState(state);
}

// Returns NON-volume adjustments only — volume is handled by getReturnVolumeMultiplier.
export function applyRttAdjustments(sessionParams, rttState, currentPhase) {
  if (!rttState) return sessionParams;
  const tier = RTT_TIERS.find(t => t.name === rttState.tier);
  if (!tier) return sessionParams;
  const out = { ...sessionParams };
  if (tier.rpeCap != null) out.rpeCap = tier.rpeCap;
  if (tier.warmupExtraMinutes) out.warmupExtraMinutes = tier.warmupExtraMinutes;
  if (tier.weekOverride) out.weekOverride = tier.weekOverride;
  if (tier.phaseOverrideTo != null) out.phaseOverride = tier.phaseOverrideTo;
  else if (tier.phaseOverrideOffset) out.phaseOverride = Math.max(1, currentPhase + tier.phaseOverrideOffset);
  return out;
}

export function getRttMessage(daysOff, tier) {
  const messages = {
    minor:     `Welcome back! ${daysOff} days off — easing in slightly today.`,
    moderate:  `Welcome back! It's been ${daysOff} days. We're cutting volume and capping intensity for the first ${tier.sessionsToRebuild} sessions, then rebuilding from there.`,
    extended:  `Welcome back! ${daysOff} days off. Resetting to Week 1 of your current phase — your motor patterns need a refresh. We'll rebuild over the next ${tier.sessionsToRebuild} sessions.`,
    long:      `Welcome back! ${daysOff} days is a real break. Dropping you back one phase and restarting from Week 1. NASM principle: rebuild before reload. ${tier.sessionsToRebuild} sessions to return to where you left off.`,
    extensive: `Welcome back! ${daysOff} days off requires a true reset. Restarting Phase 1 — stabilization and movement quality first. Don't rush this. ${tier.sessionsToRebuild}+ sessions to assess where you really are.`,
  };
  return messages[tier.name] || `Welcome back! ${daysOff} days since your last session.`;
}

// ── CAPABILITY REGRESSION ──────────────────────────────────────
const CAPABILITY_TIERS = {
  beginner:     ["bodyweight_basic","stretching","mobility"],
  intermediate: ["core_stability_basic","single_leg_stable","hip_hinge_competent","shoulder_pressing_cleared"],
  advanced:     ["barbell_competent","pull_up_ready","overhead_cleared","core_stability_intermediate"],
  elite:        ["plyometric_ready","heavy_loading_ready","olympic_lift_ready","power_ready","depth_jump_ready"],
};

const CAPABILITY_REGRESSION = {
  fresh:     { revoke: [] },
  minor:     { revoke: [] },
  moderate:  { revoke: ["plyometric_ready","power_ready","depth_jump_ready"] },
  extended:  { revoke: ["plyometric_ready","power_ready","depth_jump_ready","olympic_lift_ready","heavy_loading_ready"] },
  long:      { revoke: [...CAPABILITY_TIERS.elite, ...CAPABILITY_TIERS.advanced] },
  extensive: { revoke: [...CAPABILITY_TIERS.elite, ...CAPABILITY_TIERS.advanced, ...CAPABILITY_TIERS.intermediate] },
};

const MAX_DIFFICULTY_BY_TIER = { fresh: 5, minor: 5, moderate: 4, extended: 3, long: 2, extensive: 1 };

export function isExerciseAllowedDuringRtt(exercise, rttState) {
  if (!rttState) return true;
  const tierName = rttState.tier;
  const maxDifficulty = MAX_DIFFICULTY_BY_TIER[tierName] || 5;
  const exDifficulty = exercise.difficultyLevel || 1;
  if (exDifficulty > maxDifficulty) return false;

  const stillRevoked = getRevokedCapabilities();
  const requiredCaps = exercise.prerequisites?.requiredCapabilities || [];
  for (const cap of requiredCaps) if (stillRevoked.has(cap)) return false;

  const exName = (exercise.name || "").toLowerCase();
  if (tierName !== "minor" && tierName !== "fresh") {
    if (exercise.type === "plyometric" || /\b(jump|plyo|hop|bound|throw|slam|sprint)\b/i.test(exName)) return false;
  }
  if (["extended","long","extensive"].includes(tierName)) {
    if (/\b(clean|snatch|jerk|kipping|muscle.up|pistol|depth jump)\b/i.test(exName)) return false;
  }
  if (["long","extensive"].includes(tierName)) {
    if (/\b(1rm|max effort|heavy|barbell)\b/i.test(exName) && exercise.type !== "stabilization") return false;
  }
  return true;
}

export function getCapabilityRegressionMessage(tier) {
  const messages = {
    fresh: null,
    minor: null,
    moderate:  "Plyometrics paused for the rebuild — explosive movements need a fresh nervous system.",
    extended:  "Advanced exercises (heavy loading, plyometrics, complex lifts) are paused. Mastery degrades with time off — we'll re-earn them as you rebuild.",
    long:      "Returning to intermediate exercises only. Your motor patterns need to be re-established before complex or heavy movements. This is the NASM principle: rebuild the foundation first.",
    extensive: "Restarting at beginner level. After this much time off, even unlocked exercises need to be re-earned through movement quality. Expect to progress quickly back to your previous level over 4-6 weeks.",
  };
  return messages[tier.name] || null;
}

export function getRevokedCapabilities() {
  const state = getReturnState();
  if (!state) return new Set();
  if (typeof state.sessionsToRebuild === "number" && state.sessionsCompleted >= state.sessionsToRebuild) return new Set();
  const revoked = CAPABILITY_REGRESSION[state.tier]?.revoke || [];
  if (revoked.length === 0) return new Set();
  const rebuildProgress = state.sessionsToRebuild > 0 ? state.sessionsCompleted / state.sessionsToRebuild : 1;
  const numToRestore = Math.floor(rebuildProgress * revoked.length);
  return new Set(revoked.slice(0, revoked.length - numToRestore));
}

// ── AUTO-DETECT BEFORE EVERY WORKOUT ──────────────────────────
export async function autoDetectAndApplyRtt() {
  const detection = await detectReturnToTraining();
  const currentState = getRttState();

  if (!detection.isReturning && !currentState) return null;
  if (detection.isReturning && !currentState) return activateRtt(detection.tier, detection.daysOff);

  if (detection.isReturning && currentState) {
    const newIdx = RTT_TIERS_ORDERED.indexOf(detection.tier.name);
    const curIdx = RTT_TIERS_ORDERED.indexOf(currentState.tier);
    if (newIdx > curIdx) {
      console.log(`[RTT] Upgrading tier: ${currentState.tier} → ${detection.tier.name} (${detection.daysOff} days off)`);
      return activateRtt(detection.tier, detection.daysOff, { upgradedFrom: currentState.tier });
    }
    return currentState;
  }
  if (!detection.isReturning && currentState) return currentState;
  return null;
}
