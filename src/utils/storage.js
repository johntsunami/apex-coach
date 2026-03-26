// ═══════════════════════════════════════════════════════════════
// APEX Coach — localStorage persistence layer
// Stores: sessions, preferences, streaks, weekly volume
// ═══════════════════════════════════════════════════════════════

const KEYS = {
  SESSIONS: "apex_sessions",
  PREFS: "apex_prefs",
  STATS: "apex_stats",
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

  return entry;
}

// ── Stats (derived from sessions) ─────────────────────────────

function _updateStats(sessions) {
  const stats = getStats();

  // Total session count
  stats.totalSessions = sessions.length;

  // Calculate streak (consecutive days with a session)
  const today = _dateKey(new Date());
  const sessionDates = new Set(sessions.map((s) => _dateKey(new Date(s.date))));
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
  stats.streak = streak;

  // Last session date
  if (sessions.length > 0) {
    stats.lastSessionDate = sessions[sessions.length - 1].date;
  }

  // Weekly volume per muscle group (last 7 days)
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
  stats.weeklyVolume = weeklyVolume;
  stats.sessionsThisWeek = recentSessions.length;

  set(KEYS.STATS, stats);
  return stats;
}

function getStats() {
  return get(KEYS.STATS) || {
    totalSessions: 0,
    streak: 0,
    lastSessionDate: null,
    weeklyVolume: {},
    sessionsThisWeek: 0,
  };
}

function _dateKey(d) {
  return d.toISOString().split("T")[0];
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
  getStats,
  getPrefs,
  setPref,
  toggleFavorite,
  addPainFlag,
  computeSessionVolume,
  KEYS,
};
