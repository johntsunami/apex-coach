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

// ── Low-level helpers ──────────────────────────────────────────

function get(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function set(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("APEX storage write failed:", e);
  }
}

function clear(key) {
  if (key) {
    localStorage.removeItem(key);
  } else {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  }
}

// ── Sessions (completed workouts) ─────────────────────────────

function getSessions() {
  return get(KEYS.SESSIONS) || [];
}

function saveSession(session) {
  const sessions = getSessions();
  const entry = {
    session_id: `s_${Date.now()}`,
    date: new Date().toISOString(),
    exercises_completed: session.exercisesCompleted || [],
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
  };
  sessions.push(entry);
  set(KEYS.SESSIONS, sessions);

  // Update stats after saving session
  _updateStats(sessions);

  // Fire-and-forget sync to Supabase for cross-device persistence
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
    await supabase.from("sessions").insert({
      user_id: session.user.id,
      date: entry.date?.split("T")[0] || new Date().toISOString().split("T")[0],
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
      status: "completed",
      session_type: entry.session_type || "primary",
    });
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

// Restore sessions from Supabase on login (called from AuthProvider flow)
async function restoreSessionsFromSupabase() {
  try {
    const { supabase, isSupabaseAvailable } = await import("../utils/supabase.js");
    if (!isSupabaseAvailable()) return false;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;
    const { data: rows, error } = await supabase.from("sessions").select("*").eq("user_id", session.user.id).order("date", { ascending: true });
    if (error || !rows?.length) return false;
    // Only restore if localStorage has fewer sessions (don't overwrite newer local data)
    const local = getSessions();
    if (local.length >= rows.length) return false;
    const restored = rows.map(r => ({
      session_id: r.id,
      date: r.created_at || r.date,
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
    set(KEYS.SESSIONS, restored);
    _updateStats(restored);
    console.log("APEX: Restored", restored.length, "sessions from Supabase");
    return true;
  } catch (e) { console.warn("Session restore from Supabase failed:", e); return false; }
}

// ── Stats (derived from sessions) ─────────────────────────────

function _updateStats(sessions) {
  // Always compute fresh from session data — never use stale cached values
  return _computeFreshStats(sessions);
}

// Compute all stats fresh from session history — called on save AND on read
function _computeFreshStats(sessions) {
  if (!sessions) sessions = getSessions();

  // Filter to primary sessions only (exclude supplemental add-ons)
  const primary = sessions.filter(s => s.session_type !== "supplemental");

  // "Days Done" = unique calendar days with at least one primary session
  const sessionDates = new Set(primary.map((s) => _dateKey(new Date(s.date))));
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
  const recentDays = new Set(recentPrimary.map(s => _dateKey(new Date(s.date))));
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
    return {
      totalSessions: 0,
      streak: 0,
      lastSessionDate: null,
      weeklyVolume: {},
      sessionsThisWeek: 0,
    };
  }
  return _computeFreshStats(sessions);
}

// Local timezone date key (not UTC) — fixes midnight boundary issues
function _dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isTodayComplete() {
  const sessions = getSessions();
  if (!sessions.length) return null;
  const today = _dateKey(new Date());
  const todaySessions = sessions.filter(s => _dateKey(new Date(s.date)) === today);
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
// Returns "completed" | "in_progress" | "not_started"
function getTodayWorkoutStatus() {
  // Check completed sessions first
  if (isTodayComplete()) return "completed";
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
    volume[bp] = (volume[bp] || 0) + (ec.sets_done || 0);
  });
  return volume;
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
  getPrefs,
  setPref,
  toggleFavorite,
  addPainFlag,
  computeSessionVolume,
  restoreSessionsFromSupabase,
  KEYS,
};
