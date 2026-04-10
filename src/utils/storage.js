// ═══════════════════════════════════════════════════════════════
// APEX Coach — localStorage persistence layer
// Stores: sessions, preferences, streaks, weekly volume
// ═══════════════════════════════════════════════════════════════

const KEYS = {
  SESSIONS: "apex_sessions",
  PREFS: "apex_prefs",
  STATS: "apex_stats",
  IMAGE_OVERRIDES: "apex_image_overrides",
  BASELINE_TESTS: "apex_baseline_tests",
  BASELINE_CAPABILITIES: "apex_baseline_capabilities",
  POWER_RECORDS: "apex_power_records",
};

// ── User-scoped key helper ────────────────────────────────────
// All localStorage keys are scoped by user ID to prevent data leaks
// between accounts on the same device.
function _uid() {
  try { return localStorage.getItem("apex_current_uid") || ""; } catch { return ""; }
}
function _scopedKey(key) {
  const uid = _uid();
  if (!uid) return key; // fallback: no user logged in yet
  return `${key}_${uid}`;
}
// Scoped read for use by any file — reads scoped key, falls back to unscoped + migrates
function scopedGet(key) {
  try {
    const sk = _scopedKey(key);
    const scoped = localStorage.getItem(sk);
    if (scoped) return JSON.parse(scoped);
    const unscoped = localStorage.getItem(key);
    if (unscoped && _uid()) {
      localStorage.setItem(sk, unscoped);
      localStorage.removeItem(key);
      return JSON.parse(unscoped);
    }
    return unscoped ? JSON.parse(unscoped) : null;
  } catch { return null; }
}
// Scoped write for use by any file
function scopedSet(key, value) {
  try { localStorage.setItem(_scopedKey(key), JSON.stringify(value)); } catch {}
}

// ── Low-level helpers (user-scoped) ───────────────────────────

function get(key) {
  try {
    // Try scoped key first, fall back to unscoped for migration
    const scoped = localStorage.getItem(_scopedKey(key));
    if (scoped) return JSON.parse(scoped);
    // Migration: if unscoped key exists and user is logged in, migrate it
    const unscoped = localStorage.getItem(key);
    if (unscoped && _uid()) {
      localStorage.setItem(_scopedKey(key), unscoped);
      localStorage.removeItem(key);
      console.log("[STORAGE] Migrated unscoped key:", key, "→", _scopedKey(key));
      return JSON.parse(unscoped);
    }
    return unscoped ? JSON.parse(unscoped) : null;
  } catch {
    return null;
  }
}

function set(key, value) {
  try {
    localStorage.setItem(_scopedKey(key), JSON.stringify(value));
  } catch (e) {
    console.warn("APEX storage write failed:", e);
  }
}

function clear(key) {
  if (key) {
    localStorage.removeItem(_scopedKey(key));
    localStorage.removeItem(key); // also clean unscoped if exists
  } else {
    Object.values(KEYS).forEach((k) => { localStorage.removeItem(_scopedKey(k)); localStorage.removeItem(k); });
  }
}

// ── Sessions (completed workouts) ─────────────────────────────

function getSessions() {
  return get(KEYS.SESSIONS) || [];
}

function saveSession(session) {
  const sessions = getSessions();
  // Ensure every completed exercise has usable sets_done (fallback to sets array length or 1)
  const exercisesCompleted = (session.exercisesCompleted || []).map(ec => ({
    ...ec,
    sets_done: ec.sets_done || (ec.sets || []).length || 1,
    _source: (ec.sets || []).some(s => s.load > 0 || s.reps_done > 0) ? "logged" : "planned_default",
  }));
  const _hasLoggedData = exercisesCompleted.some(ec => ec._source === "logged");
  const entry = {
    session_id: `s_${Date.now()}`,
    date: new Date().toISOString(),
    _dateKey: _dateKey(new Date()), // explicit local date for reliable same-day matching
    exercises_completed: exercisesCompleted,
    exercises_skipped: session.exercisesSkipped || [],
    readiness: session.readiness || {},
    check_in: session.checkIn || {},
    reflection: session.reflection || {},
    starred: session.starred || [],
    flagged: session.flagged || [],
    pain_flagged: session.painFlagged || [],
    notes: session.notes || "",
    overall: session.overall || "just_right",
    duration_minutes: session.durationMinutes || 0,
    total_volume: session.totalVolume || {},
    _hasLoggedData,
  };
  sessions.push(entry);
  set(KEYS.SESSIONS, sessions);

  // Verify write succeeded
  const verify = getSessions();
  console.log(`[COMPLETION] Session saved to localStorage: ${verify.length} sessions total. Today: ${_dateKey(new Date())}. Latest: ${_dateKey(verify[verify.length - 1]?.date)}`);

  // Update stats after saving session
  _updateStats(sessions);

  // Sync to Supabase for cross-device persistence
  _syncSessionToSupabase(entry);

  return entry;
}

// ── Supabase session sync (fire-and-forget) ───────────────────
async function _syncSessionToSupabase(entry) {
  try {
    const { supabase, isSupabaseAvailable } = await import("../utils/supabase.js");
    if (!isSupabaseAvailable()) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const sessionPayload = {
      user_id: session.user.id,
      date: entry._dateKey || _dateKey(new Date()),
      location: entry.check_in?.location || "gym",
      duration_minutes: entry.duration_minutes || 0,
      safety_level: entry.readiness?.safety_level || "CLEAR",
      difficulty_selected: entry.difficulty || "standard",
      rtt_score: entry.readiness?.RTT || null,
      ctp_score: entry.readiness?.CTP || null,
      check_in_data: entry.check_in || {},
      exercises_completed: entry.exercises_completed || [],
      exercises_skipped: entry.exercises_skipped || [],
      volume_data: entry.total_volume || {},
    };
    const { error: insertError } = await supabase.from("sessions").insert(sessionPayload);
    if (insertError) {
      console.error("[SUPABASE SESSION ERROR]", {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
        sentColumns: Object.keys(sessionPayload),
      });
      return; // Don't try to sync reflection if session insert failed
    }
    console.log("[SYNC] Session synced to Supabase successfully");
    // Also sync reflection
    if (entry.reflection) {
      const { data: sessRows } = await supabase.from("sessions").select("id").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(1);
      if (sessRows?.[0]) {
        await supabase.from("session_reflections").insert({
          session_id: sessRows[0].id,
          user_id: session.user.id,
          difficulty_rating: entry.reflection?.difficulty || null,
          pain_rating: entry.reflection?.pain || null,
          enjoyment_rating: entry.reflection?.enjoyment || null,
          form_confidence: entry.reflection?.form_confidence || null,
          overall: entry.overall || "just_right",
          starred_exercises: entry.starred || [],
          flagged_exercises: entry.flagged || [],
          pain_flagged_exercises: entry.pain_flagged || [],
          notes: entry.notes || "",
        });
      }
    }
  } catch (e) { console.warn("Session sync to Supabase failed (non-blocking):", e); }
}

// One-time migration: clear stale stats cache (NOT sessions — sessions are the source of truth)
function _runStatsMigration() {
  try {
    if (localStorage.getItem("supabase_stats_migration_v2") === "done") return;
    console.log("APEX: Running stats migration v2 — clearing stale stats cache (sessions preserved)");
    localStorage.removeItem(KEYS.STATS); // stats cache only — will be recomputed from sessions
    // NOTE: Do NOT remove KEYS.SESSIONS — that destroys workout history!
    // Sessions are the source of truth; stats are derived from them.
    localStorage.setItem("supabase_stats_migration_v2", "done");
  } catch {}
}
_runStatsMigration();

// Restore sessions from Supabase on login (called from AuthProvider flow)
// RULE: Supabase is source of truth — always overwrite localStorage with Supabase data
async function restoreSessionsFromSupabase() {
  try {
    const { supabase, isSupabaseAvailable } = await import("../utils/supabase.js");
    if (!isSupabaseAvailable()) return false;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;
    const { data: rows, error } = await supabase.from("sessions").select("*").eq("user_id", session.user.id).order("date", { ascending: true });
    if (error) { console.warn("APEX: Supabase session query error:", error.message); return false; }
    if (!rows?.length) {
      // Supabase has no sessions — but DON'T wipe localStorage!
      // Local sessions may exist from a recent workout that hasn't synced yet.
      // Backfill local → Supabase instead of clearing local.
      const local = getSessions();
      if (local.length > 0) {
        console.log("APEX: Supabase has 0 sessions but localStorage has", local.length, "— keeping local, will backfill");
        return false; // keep local data, backfill will push it to Supabase
      }
      console.log("APEX: No sessions in Supabase or localStorage");
      return false;
    }
    // Merge Supabase data with local — NEVER drop local sessions that haven't synced yet
    const local = getSessions();
    const restored = rows.map(r => ({
      session_id: r.id,
      // Prefer created_at (timestamptz with TZ) over date (bare date, UTC-parsed)
      // For bare date fallback, append T12:00:00 to avoid UTC midnight shift
      date: r.created_at || (r.date ? r.date + "T12:00:00" : new Date().toISOString()),
      exercises_completed: r.exercises_completed || [],
      exercises_skipped: r.exercises_skipped || [],
      readiness: { RTT: r.rtt_score, CTP: r.ctp_score, safety_level: r.safety_level },
      check_in: r.check_in_data || {},
      reflection: {},
      starred: [],
      flagged: [],
      pain_flagged: [],
      notes: "",
      overall: r.difficulty_selected || "just_right",
      duration_minutes: r.duration_minutes || 0,
      total_volume: r.volume_data || {},
      session_type: r.session_type || "primary",
    }));
    // Build a Set of Supabase session dates to detect local-only sessions
    const supabaseDates = new Set(restored.map(s => _dateKey(s.date)));
    // Keep any local sessions from TODAY that aren't in Supabase yet (async sync race condition)
    const today = _dateKey(new Date());
    const localOnlyToday = local.filter(s => _dateKey(s.date) === today && !supabaseDates.has(today));
    const merged = [...restored, ...localOnlyToday];
    if (localOnlyToday.length > 0) {
      console.log(`APEX: Session restore — keeping ${localOnlyToday.length} local-only session(s) from today that haven't synced yet`);
    }
    console.log(`APEX: Session restore — local: ${local.length}, supabase: ${rows.length}, merged: ${merged.length}`);
    set(KEYS.SESSIONS, merged);
    _updateStats(merged);
    return true;
  } catch (e) { console.warn("Session restore from Supabase failed:", e); return false; }
}

// Backfill: sync any localStorage sessions that are missing from Supabase
let _backfillAttempts = 0;
const MAX_BACKFILL_ATTEMPTS = 3;
let _lastBackfillTime = 0;

async function backfillSessionsToSupabase() {
  try {
    // Prevent rapid retry loops
    const now = Date.now();
    if (now - _lastBackfillTime < 60000 && _backfillAttempts >= MAX_BACKFILL_ATTEMPTS) {
      console.warn("[BACKFILL] Max attempts reached. Sessions are safe in localStorage but not synced to cloud. Will retry on next app load.");
      return;
    }
    if (now - _lastBackfillTime >= 60000) _backfillAttempts = 0; // Reset after cooldown
    _lastBackfillTime = now;
    _backfillAttempts++;

    const { supabase, isSupabaseAvailable } = await import("../utils/supabase.js");
    if (!isSupabaseAvailable()) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const local = getSessions();
    if (!local.length) return;
    const { data: remote } = await supabase.from("sessions").select("date").eq("user_id", session.user.id);
    const remoteDates = new Set((remote || []).map(r => r.date));
    let synced = 0;
    let failed = 0;
    for (const entry of local) {
      const entryDate = entry.date?.split("T")[0] || "";
      if (!remoteDates.has(entryDate)) {
        await _syncSessionToSupabase(entry);
        synced++;
      }
    }
    if (synced > 0) console.log(`APEX: Backfilled ${synced} sessions to Supabase`);
    if (synced > 0) _backfillAttempts = 0; // Reset on success
  } catch (e) { console.warn("APEX: Session backfill failed:", e); }
}

// ── Stats (derived from sessions) ─────────────────────────────

function _updateStats(sessions) {
  // Always compute fresh from session data — never use stale cached values
  return _computeFreshStats(sessions);
}

// Compute all stats fresh from session history — called on save AND on read
function _computeFreshStats(sessions) {
  if (!sessions) sessions = getSessions();

  // Filter to primary sessions only (exclude supplemental add-ons and secondary two-a-days for day count)
  const primary = sessions.filter(s => s.session_type !== "supplemental" && s.session_type !== "secondary");

  // "Days Done" = unique calendar days with at least one primary session
  // Use _dateKey field if available (explicit local date), else derive from ISO timestamp
  const sessionDates = new Set(primary.map((s) => s._dateKey || _dateKey(s.date)));
  const totalSessions = sessionDates.size;

  // Calculate streak (consecutive days with a session, using LOCAL timezone)
  const today = _dateKey(new Date());
  let streak = 0;
  let d = new Date();
  // Check today first, then go backward
  while (true) {
    const key = _dateKey(d);
    if (sessionDates.has(key)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else if (key === today) {
      // Today hasn't been done yet — still check yesterday
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  // Last session date
  let lastSessionDate = null;
  if (primary.length > 0) {
    lastSessionDate = primary[primary.length - 1].date;
  }

  // Weekly volume per muscle group (last 7 days) — includes supplemental
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentSessions = sessions.filter(
    (s) => new Date(s.date) >= weekAgo
  );
  const weeklyVolume = {};
  recentSessions.forEach((s) => {
    if (s.total_volume) {
      Object.entries(s.total_volume).forEach(([muscle, sets]) => {
        weeklyVolume[muscle] = (weeklyVolume[muscle] || 0) + sets;
      });
    }
  });

  // "This Week" = unique days with primary sessions in the last 7 days
  const recentPrimary = recentSessions.filter(s => s.session_type !== "supplemental");
  const recentDays = new Set(recentPrimary.map(s => s._dateKey || _dateKey(s.date)));
  const sessionsThisWeek = recentDays.size;

  const stats = {
    totalSessions,
    streak,
    lastSessionDate,
    weeklyVolume,
    sessionsThisWeek,
  };

  set(KEYS.STATS, stats);
  return stats;
}

// getStats now recomputes fresh every time — streak is always accurate
function getStats() {
  const sessions = getSessions();
  if (!sessions.length) {
    console.log("APEX Stats: 0 sessions in localStorage — awaiting Supabase restore if applicable");
    return {
      totalSessions: 0,
      streak: 0,
      lastSessionDate: null,
      weeklyVolume: {},
      sessionsThisWeek: 0,
    };
  }
  const stats = _computeFreshStats(sessions);
  console.log(`APEX Stats: days=${stats.totalSessions} streak=${stats.streak} thisWeek=${stats.sessionsThisWeek} from ${sessions.length} sessions in localStorage`);
  return stats;
}

// Local timezone date key — ALWAYS returns the LOCAL calendar date
function _dateKey(d) {
  // For bare date strings like "2026-04-03" (no time component), return as-is
  if (typeof d === "string" || d instanceof String) {
    const s = String(d);
    // Bare date (no T) — treat as local directly
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    // ISO timestamp with T — parse to Date to get LOCAL date, not UTC date
    // "2026-04-05T03:00:00.000Z" at UTC-7 is actually April 4 local time
  }
  if (!(d instanceof Date)) d = new Date(d);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isTodayComplete() {
  const sessions = getSessions();
  if (!sessions.length) return null;
  const today = _dateKey(new Date());
  // Use _dateKey field if available (explicit local date), else derive from ISO timestamp
  const todaySessions = sessions.filter(s => (s._dateKey || _dateKey(s.date)) === today);
  if (!todaySessions.length) return null;
  // Only count primary sessions (not supplemental add-ons)
  const primarySessions = todaySessions.filter(s => s.session_type !== "supplemental");
  if (!primarySessions.length) return null;
  const last = primarySessions[primarySessions.length - 1];
  const totalExercises = primarySessions.reduce((sum, s) => sum + (s.exercises_completed?.length || 0), 0);
  const totalMinutes = primarySessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  return { done: true, exerciseCount: totalExercises, durationMinutes: totalMinutes, sessionCount: primarySessions.length, lastSession: last };
}

// ── Today's workout status ────────────────────────────────────
// Returns "completed" | "completed_can_add" | "in_progress" | "not_started"
function getTodayWorkoutStatus() {
  const todayDone = isTodayComplete();
  if (todayDone) {
    // Check if a safe second workout is possible
    try {
      const today = _dateKey(new Date());
      const sessions = getSessions();
      const todaySessions = sessions.filter(s => (s._dateKey || _dateKey(s.date)) === today);

      // Already did a secondary? No three-a-days
      const secondaryCount = todaySessions.filter(s => s.session_type === "secondary").length;
      if (secondaryCount >= 1) return "completed";

      // Check time since completion — minimum 4 hours
      const completionTime = getTodaySessionCompletionTime();
      if (completionTime) {
        const hoursSince = (Date.now() - new Date(completionTime).getTime()) / (3600 * 1000);
        if (hoursSince < 4) return "completed";
      }

      // Overtraining check is done at the App.jsx level before showing the card
      // (can't import overtrainingDetector here without circular dependency)

      return "completed_can_add";
    } catch { return "completed"; }
  }
  // Check for in-progress workout in localStorage
  try {
    const raw = localStorage.getItem("apex_daily_workout");
    if (raw) {
      const data = JSON.parse(raw);
      if (data.date === _dateKey(new Date()) && data.completed) {
        const doneCount = Object.values(data.completed).filter(Boolean).length;
        if (doneCount > 0) return "in_progress";
      }
    }
    const paused = localStorage.getItem("apex_paused_workout");
    if (paused) {
      const p = JSON.parse(paused);
      if (p.completedExercises?.length > 0) return "in_progress";
    }
  } catch {}
  return "not_started";
}

// ── Get completion time of today's primary session ─────────────
function getTodaySessionCompletionTime() {
  const sessions = getSessions();
  const today = _dateKey(new Date());
  const todayPrimary = sessions.filter(s =>
    (s._dateKey || _dateKey(s.date)) === today && s.session_type !== "supplemental" && s.session_type !== "secondary"
  );
  if (!todayPrimary.length) return null;
  return todayPrimary[todayPrimary.length - 1].date;
}

// ── Get muscle groups trained in today's first session ──────────
function getFirstSessionMuscles(exerciseDB) {
  const sessions = getSessions();
  const today = _dateKey(new Date());
  const todayPrimary = sessions.filter(s =>
    (s._dateKey || _dateKey(s.date)) === today && s.session_type !== "supplemental"
  );
  if (!todayPrimary.length || !exerciseDB) return new Set();
  const muscles = new Set();
  for (const sess of todayPrimary) {
    for (const ec of (sess.exercises_completed || [])) {
      const ex = exerciseDB.find(e => e.id === ec.exercise_id);
      if (ex?.bodyPart) muscles.add(ex.bodyPart);
    }
  }
  return muscles;
}

// ── Save a supplemental (add-on) session ──────────────────────
function saveSupplementalSession(session) {
  const sessions = getSessions();
  const entry = {
    session_id: `s_addon_${Date.now()}`,
    date: new Date().toISOString(),
    session_type: "supplemental",
    exercises_completed: session.exercisesCompleted || [],
    exercises_skipped: [],
    readiness: {},
    check_in: {},
    reflection: {},
    starred: [],
    flagged: [],
    pain_flagged: [],
    notes: session.notes || "",
    overall: "just_right",
    duration_minutes: session.durationMinutes || 0,
    total_volume: session.totalVolume || {},
    addon_type: session.addonType || "general",
  };
  sessions.push(entry);
  set(KEYS.SESSIONS, sessions);
  return entry;
}

// ── User Preferences ──────────────────────────────────────────

function getPrefs() {
  return get(KEYS.PREFS) || {
    lastLocation: "gym",
    favorites: [],
    flagged: [],
    painFlagged: [],
  };
}

function setPref(key, value) {
  const prefs = getPrefs();
  prefs[key] = value;
  set(KEYS.PREFS, prefs);
  return prefs;
}

function toggleFavorite(exerciseId) {
  const prefs = getPrefs();
  const idx = prefs.favorites.indexOf(exerciseId);
  if (idx >= 0) prefs.favorites.splice(idx, 1);
  else prefs.favorites.push(exerciseId);
  set(KEYS.PREFS, prefs);
  return prefs;
}

function addPainFlag(exerciseId, bodyArea, severity) {
  const prefs = getPrefs();
  prefs.painFlagged = prefs.painFlagged.filter((p) => p.exercise_id !== exerciseId);
  prefs.painFlagged.push({ exercise_id: exerciseId, body_area: bodyArea, severity, date: new Date().toISOString() });
  set(KEYS.PREFS, prefs);
  return prefs;
}

// ── Volume tracking helper ────────────────────────────────────

function computeSessionVolume(exercisesCompleted, exerciseDB) {
  const volume = {};
  exercisesCompleted.forEach((ec) => {
    const dbEx = exerciseDB.find((e) => e.id === ec.exercise_id);
    if (!dbEx) return;
    const bp = dbEx.bodyPart || "other";
    // Use sets_done, fall back to sets array length, fall back to planned sets from DB, minimum 1
    let sets = ec.sets_done || (ec.sets || []).length || parseInt(dbEx.phaseParams?.["1"]?.sets) || 1;
    // Plyometric exercises count at half volume (explosive, less mechanical tension)
    if (dbEx.type === "plyometric") sets = Math.ceil(sets * 0.5);
    volume[bp] = (volume[bp] || 0) + sets;
  });
  return volume;
}

// ── Stretch tracker (tracks when each body part was last stretched) ──

const LS_STRETCH_TRACK = "apex_stretch_tracker";

function getStretchTracker() {
  return get(LS_STRETCH_TRACK) || {};
}

function updateStretchTracker(bodyPartsStretched) {
  try {
    const tracker = getStretchTracker();
    const today = new Date().toISOString().split("T")[0];
    for (const bp of bodyPartsStretched) { tracker[bp] = today; }
    set(LS_STRETCH_TRACK, tracker);
  } catch {}
}

// ── Sport Preferences (user-scoped via get/set) ──────────────
const LS_SPORT_PREFS = "apex_sports";

function getSportPrefs() {
  return get(LS_SPORT_PREFS) || [];
}

function saveSportPrefs(prefs) {
  set(LS_SPORT_PREFS, prefs);
}

export {
  get,
  set,
  clear,
  getSessions,
  saveSession,
  saveSupplementalSession,
  getStats,
  isTodayComplete,
  getTodayWorkoutStatus,
  getTodaySessionCompletionTime,
  getFirstSessionMuscles,
  getPrefs,
  setPref,
  toggleFavorite,
  addPainFlag,
  computeSessionVolume,
  restoreSessionsFromSupabase,
  getStretchTracker,
  updateStretchTracker,
  getSportPrefs,
  saveSportPrefs,
  backfillSessionsToSupabase,
  _scopedKey,
  scopedGet,
  scopedSet,
  KEYS,
};
