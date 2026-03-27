// ═══════════════════════════════════════════════════════════════
// Debug Utilities — hidden diagnostic tools for APEX Coach
// Access: tap "APEX" on Home screen 5 times
// ═══════════════════════════════════════════════════════════════

const isDev = import.meta.env.DEV;

// ── Dev-only console logger ───────────────────────────────────
export const log = {
  info: (...args) => isDev && console.log("[APEX]", ...args),
  warn: (...args) => isDev && console.warn("[APEX]", ...args),
  error: (...args) => isDev && console.error("[APEX]", ...args),
  table: (...args) => isDev && console.table(...args),
};

// ── Check all exercise image URLs ─────────────────────────────
// Returns { working: [...], broken: [...], missing: [...] }
export async function checkExerciseImages(exerciseDB) {
  const results = { working: [], broken: [], missing: [], total: exerciseDB.length };
  log.info(`Checking ${exerciseDB.length} exercises for image URLs...`);

  const checks = exerciseDB.map(async (ex) => {
    if (!ex.imageUrl) {
      results.missing.push({ id: ex.id, name: ex.name });
      return;
    }
    try {
      const res = await fetch(ex.imageUrl, { method: "HEAD", mode: "no-cors" });
      // no-cors returns opaque response (status 0) but means the request didn't fail
      results.working.push({ id: ex.id, name: ex.name, url: ex.imageUrl });
    } catch (e) {
      results.broken.push({ id: ex.id, name: ex.name, url: ex.imageUrl, error: e.message });
    }
  });

  // Process in batches of 20 to avoid hammering the server
  for (let i = 0; i < checks.length; i += 20) {
    await Promise.all(checks.slice(i, i + 20));
  }

  log.info(`Images — working: ${results.working.length}, broken: ${results.broken.length}, missing: ${results.missing.length}`);
  return results;
}

// ── Validate exercise database integrity ──────────────────────
export function validateExerciseDB(exerciseDB) {
  const issues = [];
  const ids = new Set();
  const requiredFields = ["id", "name", "category", "bodyPart", "primaryMuscles", "phaseEligibility"];

  for (const ex of exerciseDB) {
    // Duplicate IDs
    if (ids.has(ex.id)) {
      issues.push({ severity: "error", id: ex.id, msg: `Duplicate ID: ${ex.id}` });
    }
    ids.add(ex.id);

    // Missing required fields
    for (const field of requiredFields) {
      if (!ex[field] || (Array.isArray(ex[field]) && ex[field].length === 0)) {
        issues.push({ severity: "warn", id: ex.id, msg: `Missing or empty field: ${field}` });
      }
    }

    // Broken progression references
    if (ex.progressionFrom && !exerciseDB.some(e => e.id === ex.progressionFrom)) {
      issues.push({ severity: "error", id: ex.id, msg: `Broken progressionFrom ref: ${ex.progressionFrom}` });
    }
    if (ex.progressionTo && !exerciseDB.some(e => e.id === ex.progressionTo)) {
      issues.push({ severity: "error", id: ex.id, msg: `Broken progressionTo ref: ${ex.progressionTo}` });
    }

    // Broken substitution references
    if (ex.substitutions) {
      for (const subId of ex.substitutions) {
        if (!exerciseDB.some(e => e.id === subId)) {
          issues.push({ severity: "error", id: ex.id, msg: `Broken substitution ref: ${subId}` });
        }
      }
    }

    // Invalid phase eligibility values
    if (ex.phaseEligibility) {
      for (const p of ex.phaseEligibility) {
        if (p < 1 || p > 5) {
          issues.push({ severity: "warn", id: ex.id, msg: `Invalid phase: ${p}` });
        }
      }
    }

    // Category validation
    const validCategories = ["warmup", "main", "cooldown", "foam_roll", "activation", "stretch", "mobility", "breathing"];
    if (ex.category && !validCategories.includes(ex.category)) {
      issues.push({ severity: "warn", id: ex.id, msg: `Unusual category: ${ex.category}` });
    }
  }

  const errors = issues.filter(i => i.severity === "error").length;
  const warnings = issues.filter(i => i.severity === "warn").length;
  log.info(`DB validation — ${errors} errors, ${warnings} warnings out of ${exerciseDB.length} exercises`);
  return { issues, errors, warnings, total: exerciseDB.length };
}

// ── Test workout generation engine ────────────────────────────
export function testWorkoutEngine(buildWorkoutFn) {
  const scenarios = [
    { label: "Gym Phase 1 Standard", args: [1, "gym", "standard", null] },
    { label: "Home Phase 1 Standard", args: [1, "home", "standard", null] },
    { label: "Outdoor Phase 1 Standard", args: [1, "outdoor", "standard", null] },
    { label: "Gym Phase 1 w/ High Stress", args: [1, "gym", "standard", { sleep: 2, energy: 3, stress: 8, soreness: ["lower_back", "left_knee"] }] },
    { label: "Gym Phase 2 Standard", args: [2, "gym", "standard", null] },
  ];

  const results = [];
  for (const s of scenarios) {
    try {
      const workout = buildWorkoutFn(...s.args);
      results.push({
        scenario: s.label,
        status: "ok",
        warmup: workout.warmup?.length || 0,
        main: workout.main?.length || 0,
        cooldown: workout.cooldown?.length || 0,
        total: workout.all?.length || 0,
        volSwaps: workout.volSwaps?.length || 0,
      });
    } catch (e) {
      results.push({ scenario: s.label, status: "error", error: e.message });
    }
  }

  log.info("Workout engine test results:");
  log.table(results);
  return results;
}

// ── Get localStorage usage stats ──────────────────────────────
export function getLocalStorageStats() {
  let totalSize = 0;
  const items = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    const size = new Blob([value]).size;
    totalSize += size;
    items.push({ key, size, sizeKB: (size / 1024).toFixed(1) + " KB" });
  }
  items.sort((a, b) => b.size - a.size);
  return {
    totalItems: localStorage.length,
    totalSize,
    totalKB: (totalSize / 1024).toFixed(1) + " KB",
    totalMB: (totalSize / (1024 * 1024)).toFixed(2) + " MB",
    items,
  };
}

// ── Check Supabase connection ─────────────────────────────────
export async function checkSupabaseConnection() {
  try {
    const { supabase } = await import("./supabase.js");
    const start = performance.now();
    const { data, error } = await supabase.auth.getSession();
    const latency = Math.round(performance.now() - start);
    if (error) return { status: "error", msg: error.message, latency };
    return {
      status: "connected",
      latency: latency + "ms",
      hasSession: !!data?.session,
      user: data?.session?.user?.email || "none",
    };
  } catch (e) {
    return { status: "unreachable", msg: e.message };
  }
}

// ── Error log (captures last N errors) ────────────────────────
const ERROR_LOG_KEY = "apex_error_log";
const MAX_ERRORS = 20;

export function captureError(error, context = "") {
  try {
    const log = JSON.parse(localStorage.getItem(ERROR_LOG_KEY) || "[]");
    log.unshift({
      ts: new Date().toISOString(),
      msg: error?.message || String(error),
      stack: error?.stack?.split("\n").slice(0, 3).join("\n"),
      context,
    });
    localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(log.slice(0, MAX_ERRORS)));
  } catch (_) { /* localStorage full or unavailable */ }
}

export function getErrorLog() {
  try {
    return JSON.parse(localStorage.getItem(ERROR_LOG_KEY) || "[]");
  } catch (_) {
    return [];
  }
}

export function clearErrorLog() {
  localStorage.removeItem(ERROR_LOG_KEY);
}
