// ═══════════════════════════════════════════════════════════════
// APEX Coach — Session Time Estimator
// Pure function. Takes a workout (warmup/main/cooldown arrays) and a
// phase, returns minutes including realistic per-exercise overhead.
// Used by buildWorkoutList for budget enforcement and by the UI to
// display "⏱ ~X MIN" on the plan screen.
// ═══════════════════════════════════════════════════════════════

const TRANSITION = 45;       // seconds between exercises
const SETUP = 20;            // reading instructions / getting into position
const EQUIPMENT_CHANGE = 30; // when equipment differs from previous

/**
 * Estimate total session time in minutes.
 * @param {Object} workout - { warmup, main, cooldown } arrays of exercise rows
 * @param {number} phase - 1..5
 * @param {number|null} restOverride - seconds; if null, uses each exercise's phaseParams.rest
 */
export function estimateSessionMinutes(workout, phase, restOverride = null) {
  const all = [...(workout?.warmup || []), ...(workout?.main || []), ...(workout?.cooldown || [])];
  let total = 0;
  let prevEquip = null;
  for (const ex of all) {
    const pp = ex.phaseParams?.[String(phase)] || {};
    const sets = parseInt(pp.sets) || 2;
    const repsRaw = String(pp.reps || "");
    const isHold = /\bhold\b|\bs\b|isometric/i.test(repsRaw);
    const tempoSecs = (() => {
      const t = String(pp.tempo || "");
      const parts = t.split("/").map(s => parseFloat(s)).filter(n => !isNaN(n));
      return parts.length ? parts.reduce((a, b) => a + b, 0) : 4;
    })();
    const restSecs = restOverride != null ? restOverride : (parseInt(pp.rest) || 60);
    let exSecs;
    if (isHold) {
      const m = repsRaw.match(/(\d+)/);
      const holdSecs = m ? parseInt(m[1]) : 30;
      exSecs = sets * holdSecs + Math.max(0, sets - 1) * restSecs;
    } else {
      const reps = parseInt(repsRaw) || 12;
      exSecs = sets * reps * tempoSecs + Math.max(0, sets - 1) * restSecs;
    }
    exSecs += SETUP + TRANSITION;
    const curEquip = (ex.equipmentRequired || [])[0] || "none";
    if (prevEquip && prevEquip !== curEquip) exSecs += EQUIPMENT_CHANGE;
    prevEquip = curEquip;
    total += exSecs;
  }
  return Math.round(total / 60);
}
