// ═══════════════════════════════════════════════════════════════
// APEX Coach — Progress Analytics Engine
// Computes strength milestones, consistency, trends, insights
// ═══════════════════════════════════════════════════════════════

import { getSessions, getStats } from "./storage.js";
import { getInjuries } from "./injuries.js";
import exerciseDB from "../data/exercises.json";

const exById = Object.fromEntries(exerciseDB.map(e => [e.id, e]));

// ═══════════════════════════════════════════════════════════════
// 1. STRENGTH MILESTONES
// ═══════════════════════════════════════════════════════════════

export function getStrengthMilestones() {
  const sessions = getSessions() || [];
  const progressMap = {}; // exerciseId → { first, current, best, loads[] }

  for (const s of sessions) {
    for (const ec of (s.exercises_completed || [])) {
      const sets = ec.sets || [];
      if (sets.length === 0) continue;
      const maxLoad = Math.max(0, ...sets.map(st => st.load || 0));
      if (maxLoad <= 0) continue;

      const id = ec.exercise_id;
      if (!progressMap[id]) {
        progressMap[id] = { first: maxLoad, current: maxLoad, best: maxLoad, loads: [{ date: s.date, load: maxLoad }] };
      } else {
        progressMap[id].current = maxLoad;
        if (maxLoad > progressMap[id].best) progressMap[id].best = maxLoad;
        progressMap[id].loads.push({ date: s.date, load: maxLoad });
      }
    }
  }

  const milestones = Object.entries(progressMap).map(([id, data]) => {
    const ex = exById[id];
    const gain = data.first > 0 ? Math.round((data.current - data.first) / data.first * 100) : 0;
    return {
      exerciseId: id, name: ex?.name || id, exercise: ex,
      first: data.first, current: data.current, best: data.best,
      gainPct: gain, loads: data.loads,
    };
  });

  milestones.sort((a, b) => b.gainPct - a.gainPct);
  return milestones;
}

// ═══════════════════════════════════════════════════════════════
// 2. PHASE TIMELINE
// ═══════════════════════════════════════════════════════════════

const PHASE_DURATIONS = { 1: 8, 2: 8, 3: 8, 4: 12, 5: 16 }; // weeks per phase

export function getPhaseTimeline(currentPhase = 1) {
  const stats = getStats();
  const sessions = getSessions();
  const firstDate = sessions.length > 0 ? new Date(sessions[0].date) : new Date();
  const daysSinceStart = Math.floor((new Date() - firstDate) / (1000 * 60 * 60 * 24));
  const currentWeek = Math.max(1, Math.floor(daysSinceStart / 7) + 1);
  const phaseWeeks = PHASE_DURATIONS[currentPhase] || 8;
  const phasePct = Math.min(100, Math.round(currentWeek / phaseWeeks * 100));

  const phases = [
    { num: 1, name: "Stabilization", weeks: 8, unlocks: "Barbell loading, compound lifts, progressive overload" },
    { num: 2, name: "Strength", weeks: 8, unlocks: "Heavy loading, sport-specific drills, advanced core" },
    { num: 3, name: "Hypertrophy", weeks: 8, unlocks: "Pull-ups, plyometrics, high-volume training" },
    { num: 4, name: "Performance", weeks: 12, unlocks: "Olympic lifts, power training, competition prep" },
  ];

  return { currentPhase, currentWeek, phaseWeeks, phasePct, phases, totalSessions: stats.totalSessions };
}

// ═══════════════════════════════════════════════════════════════
// 3. CONSISTENCY HEAT MAP (12 weeks)
// ═══════════════════════════════════════════════════════════════

export function getConsistencyData() {
  const sessions = getSessions() || [];
  const stats = getStats() || {};
  const sessionDates = {};
  for (const s of sessions) {
    const key = s.date.split("T")[0];
    if (!sessionDates[key]) sessionDates[key] = { count: 0, overall: "just_right" };
    sessionDates[key].count++;
    sessionDates[key].overall = s.overall || "just_right";
  }

  // Build 12 weeks (84 days) of data
  const days = [];
  const now = new Date();
  for (let i = 83; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const dayOfWeek = d.getDay();
    const session = sessionDates[key];
    let status = "rest"; // default
    if (session) {
      status = session.overall === "too_hard" ? "partial" : "completed";
    }
    days.push({ date: key, dayOfWeek, status });
  }

  // Longest streak calculation
  let longest = 0, current = 0;
  const allDates = sessions.map(s => s.date.split("T")[0]).sort();
  const uniqueDates = [...new Set(allDates)];
  for (let i = 0; i < uniqueDates.length; i++) {
    if (i === 0) { current = 1; }
    else {
      const prev = new Date(uniqueDates[i - 1]);
      const curr = new Date(uniqueDates[i]);
      const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
      if (diffDays <= 1) current++;
      else current = 1;
    }
    if (current > longest) longest = current;
  }

  return { days, streak: stats.streak, longestStreak: longest, totalSessions: stats.totalSessions };
}

// ═══════════════════════════════════════════════════════════════
// 4. BODY COMPOSITION GOALS
// ═══════════════════════════════════════════════════════════════

export function getGoalProgress(assessment, currentPhase = 1) {
  if (!assessment?.goals) return [];
  const goals = [];
  for (const [muscle, types] of Object.entries(assessment.goals)) {
    for (const type of types) {
      let progress, estimate;
      if (type === "size") {
        progress = currentPhase >= 3 ? "Active hypertrophy training" : `Foundation building — hypertrophy begins Phase 3`;
        const weeksToPhase3 = currentPhase < 3 ? (3 - currentPhase) * 8 : 0;
        estimate = currentPhase >= 3 ? "In progress" : `est. Week ${weeksToPhase3 + 1}`;
      } else if (type === "strength") {
        progress = currentPhase >= 2 ? "Progressive overload active" : "Building movement quality first";
        estimate = currentPhase >= 2 ? "In progress" : "est. Week 9";
      } else {
        progress = "Active";
        estimate = "Ongoing";
      }
      goals.push({ muscle: muscle.replace(/_/g, " "), type, progress, estimate });
    }
  }
  return goals;
}

// ═══════════════════════════════════════════════════════════════
// 5. WEEKLY SUMMARY
// ═══════════════════════════════════════════════════════════════

export function getWeeklySummary() {
  const sessions = getSessions() || [];
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recent = sessions.filter(s => new Date(s.date) >= weekAgo);

  if (recent.length === 0) return null;

  const sessionsCount = recent.length;
  const totalVolume = {};
  let totalCardioMin = 0;
  let painSum = 0, diffSum = 0, painCount = 0, diffCount = 0;

  for (const s of recent) {
    // Volume
    if (s.total_volume) {
      for (const [m, v] of Object.entries(s.total_volume)) {
        totalVolume[m] = (totalVolume[m] || 0) + v;
      }
    }
    // Reflection trends
    if (s.reflection) {
      if (s.reflection.pain != null) { painSum += s.reflection.pain; painCount++; }
      if (s.reflection.difficulty != null) { diffSum += s.reflection.difficulty; diffCount++; }
    }
  }

  const musclesTrained = Object.keys(totalVolume);
  const avgPain = painCount > 0 ? (painSum / painCount).toFixed(1) : null;
  const avgDiff = diffCount > 0 ? (diffSum / diffCount).toFixed(1) : null;

  // Compare to previous week
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const prevWeek = sessions.filter(s => new Date(s.date) >= twoWeeksAgo && new Date(s.date) < weekAgo);
  const prevVol = {};
  for (const s of prevWeek) {
    if (s.total_volume) {
      for (const [m, v] of Object.entries(s.total_volume)) {
        prevVol[m] = (prevVol[m] || 0) + v;
      }
    }
  }
  const totalSetsThisWeek = Object.values(totalVolume).reduce((a, b) => a + b, 0);
  const totalSetsPrevWeek = Object.values(prevVol).reduce((a, b) => a + b, 0);
  const volChange = totalSetsPrevWeek > 0 ? Math.round((totalSetsThisWeek - totalSetsPrevWeek) / totalSetsPrevWeek * 100) : null;

  // Generate insight
  let insight = "Keep showing up — consistency is king.";
  if (volChange !== null && volChange > 5 && avgPain && parseFloat(avgPain) < 4) {
    insight = `Great week — volume up ${volChange}%, pain low, progressing on schedule.`;
  } else if (avgPain && parseFloat(avgPain) > 6) {
    insight = "Pain trending high this week — consider extra recovery or a deload.";
  } else if (volChange !== null && volChange < -10) {
    insight = "Volume dropped this week — that's OK if recovery was the priority.";
  } else if (sessionsCount >= 3) {
    insight = `Solid ${sessionsCount}-session week. Stay consistent and trust the process.`;
  }

  return {
    sessionsCount, musclesTrained, totalSetsThisWeek,
    avgPain, avgDiff, volChange, insight,
  };
}

// ═══════════════════════════════════════════════════════════════
// 6. INJURY RECOVERY TRACKING
// ═══════════════════════════════════════════════════════════════

export function getInjuryRecovery() {
  const injuries = (getInjuries() || []).filter(i => i.status !== "resolved");
  const sessions = getSessions() || [];

  // Get PT sessions from localStorage
  let ptSessions = [];
  try { ptSessions = JSON.parse(localStorage.getItem("apex_pt_sessions") || "[]"); } catch {}

  return injuries.map(inj => {
    const gateKey = inj.gateKey || inj.area?.toLowerCase().replace(/\s+/g, "_");

    // Pain trend from PT sessions for this condition
    const condSessions = ptSessions.filter(p => p.condition_key === gateKey);
    const painBefore = condSessions.length > 0 ? condSessions.map(p => p.pain_before).filter(Boolean) : [];
    const painAfter = condSessions.length > 0 ? condSessions.map(p => p.pain_after).filter(Boolean) : [];
    const startPain = painBefore.length > 0 ? painBefore[0] : null;
    const currentPain = painAfter.length > 0 ? painAfter[painAfter.length - 1] : null;
    const painChange = startPain && currentPain ? Math.round((currentPain - startPain) / startPain * 100) : null;

    // Count exercises unlocked (available despite injury)
    const unlockedCount = exerciseDB.filter(e => {
      const sg = e.contraindications?.severity_gate || {};
      return sg[gateKey] !== undefined && inj.severity <= sg[gateKey] && (e.phaseEligibility || []).includes(1);
    }).length;

    return {
      ...inj, gateKey,
      startPain, currentPain, painChange,
      ptSessionCount: condSessions.length,
      unlockedExercises: unlockedCount,
    };
  });
}

// ═══════════════════════════════════════════════════════════════
// 7. READINESS TREND (30 days)
// ═══════════════════════════════════════════════════════════════

export function getReadinessTrend() {
  const sessions = getSessions() || [];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recent = sessions.filter(s => new Date(s.date) >= thirtyDaysAgo && s.readiness);

  const points = recent.map(s => ({
    date: s.date.split("T")[0],
    rtt: s.readiness?.RTT || s.readiness?.readiness || null,
    ctp: s.readiness?.CTP || s.readiness?.capacity || null,
    dayOfWeek: new Date(s.date).getDay(),
  }));

  // Find patterns
  let pattern = null;
  if (points.length >= 5) {
    const byDay = {};
    for (const p of points) {
      if (p.rtt == null) continue;
      const day = p.dayOfWeek;
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(p.rtt);
    }
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let lowestDay = null, lowestAvg = 999;
    for (const [day, vals] of Object.entries(byDay)) {
      if (vals.length >= 2) {
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        if (avg < lowestAvg) { lowestAvg = avg; lowestDay = parseInt(day); }
      }
    }
    if (lowestDay !== null && lowestAvg < 60) {
      pattern = `Your readiness dips on ${dayNames[lowestDay]}s — consider lighter sessions or better ${dayNames[(lowestDay + 6) % 7]} sleep.`;
    }
  }

  return { points, pattern };
}
