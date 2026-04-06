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

export function getRings() {
  try { return JSON.parse(localStorage.getItem(LS_RINGS)) || { strength: 0, mobility: 0, endurance: 0, recovery: 0, powerLevel: 0, ascensionCount: 0, colorPalette: 0, lastSessionDate: null, lastDecayCheck: null }; }
  catch { return { strength: 0, mobility: 0, endurance: 0, recovery: 0, powerLevel: 0, ascensionCount: 0, colorPalette: 0, lastSessionDate: null, lastDecayCheck: null }; }
}

export function saveRings(rings) {
  const updated = { ...rings, powerLevel: computePowerLevel(rings), updatedAt: new Date().toISOString() };
  try { localStorage.setItem(LS_RINGS, JSON.stringify(updated)); } catch {}
  // Fire-and-forget Supabase sync
  _syncRingsToSupabase(updated).catch(() => {});
  return updated;
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
