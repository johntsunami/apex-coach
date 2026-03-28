// ═══════════════════════════════════════════════════════════════
// APEX Coach — Personality & Microcopy Engine
// Smart, contextual messages that make the app feel alive
// Tone: knowledgeable coach, genuine, occasionally funny, never fake
// ═══════════════════════════════════════════════════════════════

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ── 1. HOME GREETINGS (time-aware) ─────────────────────────

export function getGreeting(name, stats = {}) {
  const h = new Date().getHours();
  const dayOfWeek = new Date().getDay();

  // Special contexts
  if (stats.streak >= 30) return `The legend returns, ${name}`;
  if (stats.lastSessionDate) {
    const daysSince = Math.floor((Date.now() - new Date(stats.lastSessionDate).getTime()) / 86400000);
    if (daysSince >= 3) return `Welcome back, ${name}! Your muscles are literally begging to work`;
  }

  if (h < 12) return pick([
    `Rise and grind, ${name}`,
    `Good morning, champion`,
    `Let's get after it today`,
    `Your muscles missed you overnight, ${name}`,
    `Morning, ${name}. Time to build`,
  ]);
  if (h < 17) return pick([
    `Afternoon check-in, ${name}`,
    `Back for round two?`,
    `The iron awaits, ${name}`,
    `Mid-day gains, ${name}`,
  ]);
  return pick([
    `Evening session, ${name}`,
    `Night owl gains, ${name}`,
    `While everyone else is on the couch...`,
    `After hours, ${name}. Let's work`,
  ]);
}

// ── 2. SET COMPLETION MESSAGES ──────────────────────────────

export function getSetMessage() {
  return pick([
    "Solid.", "That's the one.", "Clean reps.", "Money.",
    "Like butter.", "Textbook.", "Smooth.", "Locked in.",
    "Dialed.", "On point.", "Nice work.", "Strong.",
  ]);
}

// ── 3. EXERCISE COMPLETION ──────────────────────────────────

export function getExerciseCompleteMessage() {
  return pick([
    "Crushed it", "Exercise complete", "Moving on — you're on fire",
    "Nailed it", "That's another one down", "Check.",
  ]);
}

// ── 4. WORKOUT COMPLETION ───────────────────────────────────

export function getWorkoutCompleteMessage(rating) {
  if (rating === "too_easy") return "Noted! We're turning it up next time. You asked for it.";
  if (rating === "too_hard") return "Recovery incoming. Next session is dialed back. You still showed up — that's what matters.";
  return "Goldilocks zone. That's exactly where progress happens.";
}

export function getRecapHeadline() {
  return pick([
    "You just did what 90% of people didn't today — you showed up.",
    "Session locked in. Your future self thanks you.",
    "Another one in the books. Consistency wins every time.",
    "Done. That's what champions look like.",
  ]);
}

// ── 5. STREAK CELEBRATIONS ──────────────────────────────────

export function getStreakMessage(streak) {
  if (streak >= 100) return "Triple digits. LEGENDARY.";
  if (streak >= 50) return "50 sessions?! At this point you're basically a certified trainer.";
  if (streak >= 30) return "30 SESSIONS. You're not the same person who started.";
  if (streak >= 14) return "Two weeks strong! Your body is already changing.";
  if (streak >= 7) return "One full week! You're building a habit.";
  if (streak >= 3) return "Hat trick! 3 in a row.";
  if (streak === 0) return "Streak reset — but your muscles remember everything. Let's rebuild.";
  return null;
}

export function getStreakEmoji(streak) {
  if (streak >= 30) return "";
  if (streak >= 14) return "";
  if (streak >= 7) return "";
  if (streak >= 3) return "";
  return "";
}

// ── 6. REST TIMER TIPS ──────────────────────────────────────

export function getRestTip() {
  return pick([
    "Hydrate", "Shake out those arms", "Breathe: 4 in, 4 out",
    "Your muscles grow during rest, not during the set",
    "Check your form in the mirror — looking good",
    "This rest is building your next set's power",
    "Focus on what's next", "Relax your jaw and shoulders",
    "Pro tip: visualize the next set going perfectly",
    "Rest is training. Embrace it.",
  ]);
}

export function getRestTimerMessage(secondsLeft, totalRest) {
  if (secondsLeft <= 0) return "Let's go!";
  if (secondsLeft <= 10) return "Almost time...";
  if (secondsLeft <= 15) return "Get ready...";
  return null;
}

export function getSkipRestMessage() {
  return pick(["Eager! Just make sure you're recovered.", "Ready early? Let's go.", "Skipping rest — you know your body."]);
}

export function getExtraRestMessage() {
  return "Taking your time? Smart. Recovery is gains.";
}

// ── 7. CHECK-IN RESPONSES ───────────────────────────────────

export function getCheckInSummary(data) {
  const sleep = data?.sleep;
  const energy = data?.energy || 5;
  const stress = data?.stress || 5;
  const sore = data?.soreness?.length || 0;

  if (sleep === "great" && energy >= 7 && stress <= 3 && sore === 0) {
    return "You're looking PRIME today. Let's make it count.";
  }
  if (sleep === "poor" || energy <= 3 || stress >= 8) {
    return "Tough day? That's OK. We've got a gentler plan ready. Showing up is the win.";
  }
  if (sore >= 3) {
    return "Lots of soreness — we'll work around it. Smart training, not hard training.";
  }
  return "Solid check-in. Let's build on this.";
}

// ── 8. PT SESSION MESSAGES ──────────────────────────────────

export function getPTResultMessage(painBefore, painAfter) {
  if (painAfter < painBefore) return `Pain went from ${painBefore} to ${painAfter}. Your body is healing. Keep at it!`;
  if (painAfter === painBefore) return "Same pain level — that's normal. Consistency is what moves the needle.";
  return "Pain increased. Let's note that and adjust. Your body is talking — we're listening.";
}

// ── 9. LOADING MESSAGES ─────────────────────────────────────

export function getLoadingMessage() {
  return pick([
    "Calculating your optimal plan...",
    "Cross-referencing 300+ exercises...",
    "Running 12 safety checks...",
    "Building something great...",
    "Almost there — science, not guesswork",
  ]);
}

// ── 10. EMPTY STATE MESSAGES ────────────────────────────────

export const EMPTY_STATES = {
  sessions: "Your first workout is waiting. It doesn't have to be perfect — it just has to happen.",
  pt: "Start your first therapy session to see your recovery journey here. Small steps, big results.",
  cardio: "Log your first walk, run, or bike ride. Even 10 minutes counts.",
  strength: "Complete a workout with weight tracking to see your strength milestones. Future you will thank present you.",
};

// ── 11. OVERTRAINING MESSAGES (with care) ───────────────────

export const OVERTRAINING_MESSAGES = {
  1: "Your body is whispering — let's listen before it starts yelling. Consider extra rest.",
  2: "We've dialed things back today. Think of it as a strategic retreat, not a step back.",
  3: "Forced recovery week. The greatest athletes in the world take these. You're in good company.",
  deload: "Deload week! Lighter weights, same great form. Your muscles are growing RIGHT NOW because of this.",
};

// ── 12. EASTER EGGS ─────────────────────────────────────────

export function checkEasterEgg(stats) {
  const now = new Date();
  const h = now.getHours();
  const day = now.getDay();

  if (h < 6) return "5 AM club! While the world sleeps, you build.";
  if (h >= 22) return "Late night grind! Don't forget to sleep though.";
  if (day === 5) return "Friday session? That's rare dedication. Most people quit by Wednesday.";
  if (day === 1) return "Monday? First? Let's set the tone for the whole week.";

  // Volume easter egg
  if (stats?.volumePct === 100) return "Perfectly balanced. Thanos would be proud.";

  return null;
}

// ── 13. SECTION DONE MESSAGES ───────────────────────────────

export function getSectionDoneMessage(section) {
  if (section === "main") return "The hard part is done. Cooldown time — you earned it.";
  if (section === "warmup") return "Warmed up and ready. Time for the main event.";
  return null;
}

// ── 14. PR CELEBRATION ──────────────────────────────────────

export function getPRMessage(exerciseName, newWeight, oldWeight) {
  const diff = newWeight - oldWeight;
  return `NEW PR! ${exerciseName}: ${newWeight} lbs — that's ${diff} lbs more than your last best!`;
}

// ── 15. FIRST TIME EXERCISE ─────────────────────────────────

export function getFirstTimeMessage(exerciseName) {
  return `First time doing ${exerciseName}! Welcome to the club.`;
}
