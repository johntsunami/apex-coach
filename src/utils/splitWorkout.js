// ═══════════════════════════════════════════════════════════════
// APEX Coach — Split Workout & Daily Progress Engine
// Persistent workout-in-progress, mini-session grouping,
// daily progress tracking, carryover logic
// ═══════════════════════════════════════════════════════════════

const LS_DAILY = "apex_daily_workout";
const LS_CARRYOVER = "apex_carryover";

// ═══════════════════════════════════════════════════════════════
// 1. DAILY WORKOUT PERSISTENCE
// Survives app close — expires at end of calendar day
// ═══════════════════════════════════════════════════════════════

function todayKey() {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
}

export function getDailyWorkout() {
  try {
    const raw = localStorage.getItem(LS_DAILY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Expire if different day
    if (data.date !== todayKey()) {
      // Check for incomplete — becomes carryover
      if (data.completed && data.workout) {
        const total = (data.workout.all || []).length;
        const done = Object.keys(data.completed).filter(k => data.completed[k]).length;
        if (done > 0 && done < total) {
          const remaining = (data.workout.all || []).filter(e => !data.completed[e.id]).map(e => e.id);
          saveCarryover(remaining);
        }
      }
      localStorage.removeItem(LS_DAILY);
      return null;
    }
    return data;
  } catch { return null; }
}

export function saveDailyWorkout(workout, completed = {}, checkInData = null, splitMode = false) {
  try {
    const existing = getDailyWorkout();
    const data = {
      date: todayKey(),
      workout,
      completed: { ...(existing?.completed || {}), ...completed },
      exerciseTimes: existing?.exerciseTimes || {},
      sessions: existing?.sessions || [],
      checkInData: checkInData || existing?.checkInData,
      splitMode: splitMode || existing?.splitMode || false,
      startedAt: existing?.startedAt || Date.now(),
    };
    localStorage.setItem(LS_DAILY, JSON.stringify(data));
    return data;
  } catch { return null; }
}

export function markExerciseDone(exerciseId, setData = null) {
  const daily = getDailyWorkout();
  if (!daily) return;
  daily.completed[exerciseId] = true;
  daily.exerciseTimes[exerciseId] = {
    completedAt: Date.now(),
    startedAt: daily.exerciseTimes[exerciseId]?.startedAt || Date.now(),
    setData,
  };
  localStorage.setItem(LS_DAILY, JSON.stringify(daily));
}

export function markExerciseStarted(exerciseId) {
  const daily = getDailyWorkout();
  if (!daily) return;
  if (!daily.exerciseTimes[exerciseId]) {
    daily.exerciseTimes[exerciseId] = { startedAt: Date.now() };
    localStorage.setItem(LS_DAILY, JSON.stringify(daily));
  }
}

export function clearDailyWorkout() {
  localStorage.removeItem(LS_DAILY);
}

// ═══════════════════════════════════════════════════════════════
// 2. DAILY PROGRESS STATS
// ═══════════════════════════════════════════════════════════════

export function getDailyProgress() {
  const daily = getDailyWorkout();
  if (!daily || !daily.workout) return { hasWorkout: false };

  const all = daily.workout.all || [];
  const total = all.length;
  const doneIds = Object.keys(daily.completed || {}).filter(k => daily.completed[k]);
  const doneCount = doneIds.length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  // Calculate time invested
  const times = daily.exerciseTimes || {};
  let totalMinutes = 0;
  let sessionCount = 0;
  const sessionStarts = new Set();
  for (const [, t] of Object.entries(times)) {
    if (t.completedAt && t.startedAt) {
      totalMinutes += (t.completedAt - t.startedAt) / 60000;
      // Group sessions by 30-minute gaps
      const startMin = Math.floor(t.startedAt / 1800000);
      sessionStarts.add(startMin);
    }
  }
  sessionCount = sessionStarts.size || (doneCount > 0 ? 1 : 0);

  // Estimate time for remaining
  const remainingCount = total - doneCount;
  const avgTimePerEx = doneCount > 0 && totalMinutes > 0 ? totalMinutes / doneCount : 3;
  const estimatedRemaining = Math.round(remainingCount * avgTimePerEx);

  return {
    hasWorkout: true,
    total,
    doneCount,
    remainingCount,
    pct,
    totalMinutes: Math.round(totalMinutes),
    sessionCount,
    estimatedRemaining,
    splitMode: daily.splitMode,
    doneIds: new Set(doneIds),
    workout: daily.workout,
    checkInData: daily.checkInData,
  };
}

// ═══════════════════════════════════════════════════════════════
// 3. MINI-SESSION SUGGESTIONS
// Group exercises into logical time blocks
// ═══════════════════════════════════════════════════════════════

export function getMiniSessions(workout, completedIds = new Set()) {
  if (!workout) return [];
  const blocks = workout.blocks || {};

  // Collect all remaining exercises grouped by phase
  const phases = [
    { label: "Warm-Up", exercises: [...(blocks.inhibit || []), ...(blocks.lengthen || []), ...(workout.warmup || [])], avgMin: 2 },
    { label: "Main Work", exercises: workout.main || [], avgMin: 4 },
    { label: "Cardio", exercises: blocks.cardio || [], avgMin: 15 },
    { label: "Cooldown", exercises: [...(blocks.cooldownStretches || []), ...(workout.cooldown || [])], avgMin: 1.5 },
  ];

  // Filter to remaining only
  const remaining = [];
  for (const phase of phases) {
    for (const ex of phase.exercises) {
      if (!completedIds.has(ex.id)) {
        remaining.push({ ...ex, _phase: phase.label, _avgMin: phase.avgMin });
      }
    }
  }

  if (remaining.length === 0) return [];

  // Group into mini-sessions
  const suggestions = [];

  // Morning: warm-up + first 2 main exercises
  const warmups = remaining.filter(e => e._phase === "Warm-Up");
  const mains = remaining.filter(e => e._phase === "Main Work");
  const cardio = remaining.filter(e => e._phase === "Cardio");
  const cooldowns = remaining.filter(e => e._phase === "Cooldown");

  if (warmups.length > 0 || mains.length > 0) {
    const morningExs = [...warmups, ...mains.slice(0, 2)];
    const morningMin = warmups.length * 2 + Math.min(2, mains.length) * 4;
    if (morningExs.length > 0) {
      suggestions.push({
        label: "Morning",
        icon: "🌅",
        desc: "Warm-up + first exercises",
        exercises: morningExs,
        estimatedMin: morningMin,
      });
    }
  }

  // Lunch: main exercises + cardio
  const lunchMains = mains.slice(2, 6);
  if (lunchMains.length > 0 || cardio.length > 0) {
    const lunchExs = [...lunchMains, ...cardio];
    const lunchMin = lunchMains.length * 4 + cardio.length * 15;
    suggestions.push({
      label: "Lunch Break",
      icon: "☀️",
      desc: "Main work" + (cardio.length > 0 ? " + cardio" : ""),
      exercises: lunchExs,
      estimatedMin: lunchMin,
    });
  }

  // Evening: remaining main + cooldown
  const eveningMains = mains.slice(6);
  if (eveningMains.length > 0 || cooldowns.length > 0) {
    const eveningExs = [...eveningMains, ...cooldowns];
    const eveningMin = eveningMains.length * 4 + cooldowns.length * 1.5;
    suggestions.push({
      label: "Evening",
      icon: "🌙",
      desc: "Remaining work + full cooldown",
      exercises: eveningExs,
      estimatedMin: Math.round(eveningMin),
    });
  }

  return suggestions;
}

// ═══════════════════════════════════════════════════════════════
// 4. BUILD PHASE-GROUPED EXERCISE LIST
// For the checklist view with all workout blocks
// ═══════════════════════════════════════════════════════════════

export function getPhaseGroupedExercises(workout) {
  if (!workout) return [];
  const blocks = workout.blocks || {};
  const groups = [];
  let globalIndex = 1;

  const addGroup = (label, exercises, color) => {
    if (!exercises || exercises.length === 0) return;
    const items = exercises.map(ex => ({ ...ex, _globalIndex: globalIndex++, _phaseLabel: label }));
    groups.push({ label, exercises: items, color });
  };

  addGroup("WARM-UP", [
    ...(blocks.inhibit || []),
    ...(blocks.lengthen || []),
    ...(workout.warmup || []),
  ], "#3b82f6");

  addGroup("MAIN WORK", workout.main || [], "#00d2c8");
  addGroup("CARDIO", blocks.cardio || [], "#ef4444");
  addGroup("COOLDOWN", [
    ...(blocks.cooldownStretches || []),
    ...(workout.cooldown || []),
  ], "#22c55e");

  return groups;
}

// ═══════════════════════════════════════════════════════════════
// 5. CARRYOVER — incomplete exercises added to next day
// ═══════════════════════════════════════════════════════════════

function saveCarryover(exerciseIds) {
  try {
    localStorage.setItem(LS_CARRYOVER, JSON.stringify({
      date: todayKey(),
      exercises: exerciseIds,
    }));
  } catch {}
}

export function getCarryover() {
  try {
    const raw = localStorage.getItem(LS_CARRYOVER);
    if (!raw) return [];
    const data = JSON.parse(raw);
    // Only valid if saved yesterday or today
    const saved = new Date(data.date);
    const now = new Date();
    const dayDiff = Math.floor((now - saved) / 86400000);
    if (dayDiff > 1) { localStorage.removeItem(LS_CARRYOVER); return []; }
    return data.exercises || [];
  } catch { return []; }
}

export function clearCarryover() {
  localStorage.removeItem(LS_CARRYOVER);
}

// ═══════════════════════════════════════════════════════════════
// 6. END-OF-DAY HANDLER
// Consolidate split sessions into one daily record
// ═══════════════════════════════════════════════════════════════

export function endDay(action = "skip") {
  // action: "skip" = skip remaining, "carryover" = add to tomorrow
  const daily = getDailyWorkout();
  if (!daily || !daily.workout) return null;

  const all = daily.workout.all || [];
  const completed = daily.completed || {};
  const doneExercises = all.filter(e => completed[e.id]);
  const skippedExercises = all.filter(e => !completed[e.id]);

  if (action === "carryover" && skippedExercises.length > 0) {
    saveCarryover(skippedExercises.map(e => e.id));
  }

  // Build consolidated session data
  const times = daily.exerciseTimes || {};
  const exercisesCompleted = doneExercises.map(e => ({
    exercise_id: e.id,
    sets_done: times[e.id]?.setData?.sets?.length || 1,
    sets: times[e.id]?.setData?.sets || [],
    reps_done: "—",
    load: null,
    pain_during: false,
  }));

  const exercisesSkipped = skippedExercises.map(e => ({
    exercise_id: e.id,
    reason: action === "carryover" ? "split_session_carryover" : "split_session_incomplete",
  }));

  clearDailyWorkout();

  return {
    exercisesCompleted,
    exercisesSkipped,
    splitMode: true,
    sessionCount: daily.sessions?.length || 1,
  };
}

// Time estimate for an exercise (minutes)
export function estimateExerciseTime(exercise, phase = 1) {
  const cat = exercise.category || "";
  if (cat === "foam_roll") return 2;
  if (cat === "mobility" || cat === "warmup") return 2;
  if (cat === "cooldown") return 1.5;
  if (cat === "cardio") return 15;
  // Main exercises: sets × ~1.5 min per set (including rest)
  const params = exercise.phaseParams?.[String(phase)] || {};
  const sets = parseInt(params.sets) || 2;
  return Math.round(sets * 1.5 + 0.5);
}
