// ═══════════════════════════════════════════════════════════════
// APEX Coach — Post-Op Timeline Engine
// Surgery-date-driven phase/exercise restrictions per surgeon
// and PT protocols. Layered ON TOP of severity-based safeguards.
// ═══════════════════════════════════════════════════════════════

// Conditions that should prompt for a surgery date during intake.
export const POST_SURGICAL_CONDITIONS = [
  "spinal_fusion_lumbar",
  "spinal_fusion_cervical",
  "microdiscectomy",
  "acl_post_op",
  "meniscus_post_op",
  "rotator_cuff_post_op",
  "rotator_cuff_repair",
  "labrum_repair",
  "shoulder_dislocation_post_op",
  "total_knee_replacement",
  "total_hip_replacement",
  "total_hip_replacement_posterior",
  "total_shoulder_replacement",
  "total_joint_replacement",
  "achilles_repair",
];

// Per-condition phased timelines. weeks: [start, end). end exclusive.
export const POST_OP_TIMELINES = {
  spinal_fusion_lumbar: [
    { weeks: [0, 6],     label: "Acute Healing",        maxPhase: 0, maxRPE: 3, allowedCategories: ["breathing","mobility"], mandatoryDaily: ["breath_diaphragmatic","bed_ankle_pumps","corr_supine_pelvic_tilt"], bannedPatterns: ["*"], message: "Acute healing phase. Walking + breathing exercises only. No resistance training. Continue weekly PT visits." },
    { weeks: [6, 12],    label: "Early Stabilization",  maxPhase: 1, maxRPE: 5, allowedCategories: ["breathing","mobility","core_isometric","walking"], mandatoryDaily: ["breath_diaphragmatic","corr_supine_pelvic_tilt"], bannedPatterns: ["squat_loaded","deadlift","deadlift_all","overhead_press","plyometric","hip_hinge_loaded","lunge_loaded"], message: "Early stabilization. Bodyweight core work only (McGill Big 3). No loaded movement. Walking 20-30 min daily." },
    { weeks: [12, 24],   label: "Progressive Loading",  maxPhase: 1, maxRPE: 6, allowedCategories: ["breathing","mobility","core_isometric","walking","bodyweight_basic"], bannedPatterns: ["squat_loaded_heavy","deadlift_all","overhead_press_barbell","plyometric","chin_up","pull_up"], message: "Progressive bodyweight loading. Adding hip/glute work (bridges, clamshells). Still no axial loading." },
    { weeks: [24, 52],   label: "Strength Building",    maxPhase: 2, maxRPE: 7, bannedPatterns: ["deadlift_all","overhead_press_barbell","plyometric","squat_loaded_heavy"], message: "Strength endurance phase. Light resistance allowed. Goblet squats, supported rows, modified pressing only." },
    { weeks: [52, 9999], label: "Maintenance",          maxPhase: 3, maxRPE: 8, bannedPatterns: ["deadlift_all","plyometric","overhead_press_barbell_heavy"], message: "Long-term maintenance. Permanent restrictions on heavy axial loading and plyometrics. Surgeon clearance recommended for any new exercise category." },
  ],

  spinal_fusion_cervical: [
    { weeks: [0, 6],     label: "Acute Healing (Collar)",     maxPhase: 0, maxRPE: 2, allowedCategories: ["breathing","gentle_hand_wrist"], mandatoryDaily: ["breath_diaphragmatic"], bannedPatterns: ["*"], message: "Collar protocol per surgeon. Hand/wrist exercises only. No neck movement." },
    { weeks: [6, 12],    label: "Isometric Phase",            maxPhase: 1, maxRPE: 4, bannedPatterns: ["neck_flexion_under_load","overhead_press","behind_neck","plyometric"], message: "Isometric neck work, scapular stabilization, gentle ROM. No overhead pressing." },
    { weeks: [12, 24],   label: "Progressive Strengthening",  maxPhase: 2, maxRPE: 6, bannedPatterns: ["behind_neck","overhead_press_barbell_heavy","plyometric","cervical_load"], message: "Progressive upper body work. No heavy overhead pressing. No behind-the-neck movements." },
    { weeks: [24, 9999], label: "Long-term Maintenance",      maxPhase: 3, maxRPE: 8, bannedPatterns: ["behind_neck","cervical_load_heavy","plyometric_overhead"], message: "Permanent restrictions on loaded cervical motion and behind-neck movements." },
  ],

  microdiscectomy: [
    { weeks: [0, 4],     label: "Acute Recovery",       maxPhase: 0, maxRPE: 3, allowedCategories: ["breathing","mobility","walking"], mandatoryDaily: ["breath_diaphragmatic","corr_supine_pelvic_tilt"], bannedPatterns: ["*"], message: "Walking + breathing. No resistance training until surgeon clearance." },
    { weeks: [4, 12],    label: "Early Strengthening",  maxPhase: 1, maxRPE: 5, bannedPatterns: ["deadlift_all","squat_loaded_heavy","overhead_press_barbell","plyometric"], message: "Bodyweight core stability. Hip hinge unloaded. No loaded spinal flexion." },
    { weeks: [12, 9999], label: "Progressive Return",   maxPhase: 3, maxRPE: 7, bannedPatterns: ["deadlift_all","plyometric","max_effort"], message: "Progressive return to loading. Permanent caution with heavy axial loading and plyometrics." },
  ],

  acl_post_op: [
    { weeks: [0, 6],     label: "ROM & Activation",     maxPhase: 0, maxRPE: 3, allowedCategories: ["breathing","mobility","isometric_quad"], mandatoryDaily: ["quad_set","ankle_pumps","heel_slides"], bannedPatterns: ["*"], message: "ROM recovery + quad activation. No loaded knee flexion. Follow surgeon's brace protocol." },
    { weeks: [6, 12],    label: "Progressive Strengthening", maxPhase: 1, maxRPE: 5, bannedPatterns: ["plyometric","open_chain_knee_extension","pivoting","deep_squat","cutting"], message: "Closed-chain strengthening. No plyometrics. No pivoting. Squat depth limited." },
    { weeks: [12, 24],   label: "Functional Training",  maxPhase: 2, maxRPE: 7, bannedPatterns: ["plyometric","pivoting_under_load","cutting"], message: "Functional strength. Plyometrics not yet — month 6+ for jumping. No cutting drills." },
    { weeks: [24, 36],   label: "Sport-Specific Prep",  maxPhase: 3, maxRPE: 8, bannedPatterns: ["cutting_unilateral","depth_jump"], message: "Sport-specific training. Plyometrics introduced gradually. No cutting until cleared." },
    { weeks: [36, 9999], label: "Return to Sport",      maxPhase: 5, maxRPE: 9, message: "Return to sport criteria-based. Surgeon clearance for high-impact and pivoting required." },
  ],

  meniscus_post_op: [
    { weeks: [0, 6],     label: "Protected Healing",    maxPhase: 0, maxRPE: 3, mandatoryDaily: ["quad_set","ankle_pumps","heel_slides"], bannedPatterns: ["*"], message: "Protected ROM per surgeon. Quad activation only." },
    { weeks: [6, 12],    label: "Progressive Loading",  maxPhase: 1, maxRPE: 5, bannedPatterns: ["plyometric","deep_squat","high_impact","cutting"], message: "Closed-chain loading. No deep flexion under load. No impact." },
    { weeks: [12, 9999], label: "Return to Function",   maxPhase: 3, maxRPE: 7, bannedPatterns: ["plyometric_high","deep_squat_loaded"], message: "Return to function. Caution with deep loaded knee flexion." },
  ],

  rotator_cuff_repair: [
    { weeks: [0, 6],     label: "Sling Phase",          maxPhase: 0, maxRPE: 2, allowedCategories: ["breathing"], mandatoryDaily: ["pendulum_swing","elbow_wrist_rom"], bannedPatterns: ["*"], message: "Sling protocol. Pendulum swings only. No active shoulder ROM." },
    { weeks: [6, 12],    label: "Passive ROM",          maxPhase: 0, maxRPE: 3, bannedPatterns: ["active_shoulder_ROM","overhead","pressing","plyometric"], message: "Passive ROM only. Therapist-assisted or table slides. No active reaching." },
    { weeks: [12, 24],   label: "Active ROM + Isometrics", maxPhase: 1, maxRPE: 5, bannedPatterns: ["overhead_pressing","lifting_heavy","plyometric","behind_neck"], message: "Active ROM + isometrics. No overhead pressing. No heavy loads." },
    { weeks: [24, 52],   label: "Strengthening",        maxPhase: 2, maxRPE: 7, bannedPatterns: ["overhead_barbell","behind_neck","plyometric","dips"], message: "Progressive strengthening. Surgeon clearance for overhead work." },
    { weeks: [52, 9999], label: "Maintenance",          maxPhase: 4, maxRPE: 8, bannedPatterns: ["behind_neck","dips_full_depth","plyometric_overhead"], message: "Long-term maintenance. Permanent: no behind-neck pressing, no full-depth dips." },
  ],

  rotator_cuff_post_op: [
    { weeks: [0, 6],     label: "Sling Phase",          maxPhase: 0, maxRPE: 2, mandatoryDaily: ["pendulum_swing"], bannedPatterns: ["*"], message: "Sling protocol per surgeon." },
    { weeks: [6, 12],    label: "Passive ROM",          maxPhase: 0, maxRPE: 3, bannedPatterns: ["active_shoulder_ROM","overhead","pressing","plyometric"], message: "Passive ROM only." },
    { weeks: [12, 24],   label: "Active ROM",           maxPhase: 1, maxRPE: 5, bannedPatterns: ["overhead_pressing","lifting_heavy","plyometric","behind_neck"], message: "Active ROM + isometrics." },
    { weeks: [24, 52],   label: "Strengthening",        maxPhase: 2, maxRPE: 7, bannedPatterns: ["overhead_barbell","behind_neck","plyometric"], message: "Progressive strengthening." },
    { weeks: [52, 9999], label: "Maintenance",          maxPhase: 4, maxRPE: 8, bannedPatterns: ["behind_neck","plyometric_overhead"], message: "Long-term: permanent restrictions on behind-neck and overhead plyo." },
  ],

  total_knee_replacement: [
    { weeks: [0, 6],     label: "Early Recovery",       maxPhase: 0, maxRPE: 3, allowedCategories: ["breathing","mobility"], mandatoryDaily: ["ankle_pumps","quad_set","heel_slides"], bannedPatterns: ["*"], message: "ROM recovery + basic strengthening. PT-supervised exercise only." },
    { weeks: [6, 12],    label: "Progressive Loading",  maxPhase: 1, maxRPE: 5, bannedPatterns: ["high_impact","deep_squat","kneeling","plyometric"], message: "Progressive loading. No deep knee flexion. Stationary bike OK." },
    { weeks: [12, 9999], label: "Long-term Maintenance",maxPhase: 3, maxRPE: 7, bannedPatterns: ["high_impact","deep_squat","kneeling","plyometric"], message: "Return to most activities except high-impact. Permanent: no plyometrics, no deep squats, no kneeling on the replaced knee." },
  ],

  total_hip_replacement: [
    { weeks: [0, 6],     label: "Posterior Precautions Active", maxPhase: 0, maxRPE: 3, mandatoryDaily: ["ankle_pumps","quad_set","glute_set"], bannedPatterns: ["hip_flexion_past_90","hip_internal_rotation","hip_adduction_past_midline","crossing_legs","*"], message: "Posterior precautions: no hip flexion past 90°, no internal rotation, no adduction past midline." },
    { weeks: [6, 12],    label: "Precautions Easing",   maxPhase: 1, maxRPE: 5, bannedPatterns: ["hip_flexion_past_90","hip_internal_rotation","plyometric"], message: "Posterior precautions still active. Walking, bike, gentle strengthening." },
    { weeks: [12, 9999], label: "Maintenance",          maxPhase: 3, maxRPE: 7, bannedPatterns: ["high_impact","plyometric","deep_combined_flexion_adduction_IR"], message: "Return to most activities. Permanent: avoid combined hip flexion + adduction + internal rotation." },
  ],

  total_joint_replacement: [
    { weeks: [0, 6],     label: "Early Recovery",       maxPhase: 0, maxRPE: 3, bannedPatterns: ["*"], message: "PT-supervised exercise only." },
    { weeks: [6, 12],    label: "Progressive Loading",  maxPhase: 1, maxRPE: 5, bannedPatterns: ["high_impact","plyometric","deep_squat"], message: "Progressive loading. Avoid high-impact." },
    { weeks: [12, 9999], label: "Maintenance",          maxPhase: 3, maxRPE: 7, bannedPatterns: ["high_impact","plyometric"], message: "Permanent: no plyometrics, no high-impact." },
  ],

  achilles_repair: [
    { weeks: [0, 6],     label: "Boot/Immobilization",  maxPhase: 0, maxRPE: 2, mandatoryDaily: ["ankle_pumps"], bannedPatterns: ["*"], message: "Boot per surgeon. Non-weight-bearing as prescribed." },
    { weeks: [6, 12],    label: "Progressive Loading",  maxPhase: 1, maxRPE: 4, bannedPatterns: ["plyometric","high_impact","cutting"], message: "Progressive weight-bearing. No impact." },
    { weeks: [12, 24],   label: "Strengthening",        maxPhase: 2, maxRPE: 6, bannedPatterns: ["plyometric","cutting","high_impact"], message: "Calf strengthening. No impact yet." },
    { weeks: [24, 9999], label: "Return to Sport",      maxPhase: 4, maxRPE: 8, bannedPatterns: [], message: "Return to sport criteria-based." },
  ],
};

// ── UTILITY FUNCTIONS ──

export function getWeeksPostOp(surgeryDate, nowMs = Date.now()) {
  if (!surgeryDate) return 0;
  const surgery = new Date(surgeryDate).getTime();
  if (isNaN(surgery)) return 0;
  const days = Math.floor((nowMs - surgery) / 86400000);
  return Math.max(0, Math.floor(days / 7));
}

export function getCurrentTimelineTier(conditionId, surgeryDate, nowMs = Date.now()) {
  const timeline = POST_OP_TIMELINES[conditionId];
  if (!timeline || !surgeryDate) return null;
  const weeks = getWeeksPostOp(surgeryDate, nowMs);
  return timeline.find(t => weeks >= t.weeks[0] && weeks < t.weeks[1]) || timeline[timeline.length - 1];
}

export function getNextTier(conditionId, surgeryDate, nowMs = Date.now()) {
  const timeline = POST_OP_TIMELINES[conditionId];
  if (!timeline) return null;
  const weeks = getWeeksPostOp(surgeryDate, nowMs);
  return timeline.find(t => weeks < t.weeks[0]) || null;
}

// Combine restrictions across all post-op conditions. The most restrictive wins.
export function getCombinedPostOpRestrictions(conditions, nowMs = Date.now()) {
  let maxPhase = 5;
  let maxRPE = 10;
  const bannedPatterns = new Set();
  const mandatoryDaily = new Set();
  const messages = [];

  for (const c of conditions || []) {
    const cid = c.conditionId || c.condition_key || c.condition || c.id || "";
    if (!c.surgeryDate || !POST_OP_TIMELINES[cid]) continue;
    const tier = getCurrentTimelineTier(cid, c.surgeryDate, nowMs);
    if (!tier) continue;
    if (tier.maxPhase != null && tier.maxPhase < maxPhase) maxPhase = tier.maxPhase;
    if (tier.maxRPE != null && tier.maxRPE < maxRPE) maxRPE = tier.maxRPE;
    (tier.bannedPatterns || []).forEach(p => bannedPatterns.add(p));
    (tier.mandatoryDaily || []).forEach(e => mandatoryDaily.add(e));
    if (tier.message) messages.push(`${cid}: ${tier.message}`);
  }
  return { maxPhase, maxRPE, bannedPatterns: [...bannedPatterns], mandatoryDaily: [...mandatoryDaily], messages };
}

// Hard-coded pattern matchers — kept conservative; defers to weeklyPlanner's
// permanent contraindication filter for the comprehensive list.
export function isExerciseAllowedByPostOp(exercise, conditions, nowMs = Date.now()) {
  if (!conditions?.length || !exercise) return true;
  const restrictions = getCombinedPostOpRestrictions(conditions, nowMs);

  if (restrictions.bannedPatterns.includes("*")) {
    // In the strictest tier, only mandatoryDaily IDs (or matched-by-substring) pass through.
    if (!restrictions.mandatoryDaily.length) return false;
    return restrictions.mandatoryDaily.some(m => exercise.id === m || exercise.id?.includes(m));
  }

  const exName = (exercise.name || "").toLowerCase();
  const exTags = (exercise.tags || []).map(t => String(t).toLowerCase());
  const exType = (exercise.type || "").toLowerCase();

  for (const banned of restrictions.bannedPatterns) {
    const b = String(banned).toLowerCase();
    if (b === "plyometric" && (exType === "plyometric" || /\b(jump|hop|bound|plyo|sprint)\b/i.test(exName))) return false;
    if (b === "deadlift_all" && /\bdeadlift\b/i.test(exName)) return false;
    if (b === "deadlift" && /\bdeadlift\b/i.test(exName)) return false;
    if (b === "squat_loaded_heavy" && /\bsquat\b/i.test(exName) && /\b(barbell|heavy|loaded|back squat|front squat)\b/i.test(exName)) return false;
    if (b === "squat_loaded" && /\bsquat\b/i.test(exName) && !/\bbodyweight\b/i.test(exName) && !/\bgoblet\b/i.test(exName)) return false;
    if (b === "overhead_press_barbell" && /\b(overhead.*press|press.*overhead|military press)\b/i.test(exName) && /\bbarbell\b/i.test(exName)) return false;
    if (b === "overhead_press_barbell_heavy" && /\b(overhead.*press|press.*overhead)\b/i.test(exName) && /\bbarbell\b/i.test(exName)) return false;
    if (b === "overhead_press" && /\b(overhead.*press|press.*overhead|military press)\b/i.test(exName)) return false;
    if (b === "overhead_pressing" && /\b(overhead.*press|press.*overhead)\b/i.test(exName)) return false;
    if (b === "overhead_barbell" && /\b(overhead|press)\b/i.test(exName) && /\bbarbell\b/i.test(exName)) return false;
    if (b === "chin_up" && /\bchin.?up\b/i.test(exName)) return false;
    if (b === "pull_up" && /\bpull.?up\b/i.test(exName)) return false;
    if (b === "cutting" && /\bcut\b/i.test(exName)) return false;
    if (b === "pivoting" && /\bpivot\b/i.test(exName)) return false;
    if (b === "high_impact" && (exTags.includes("high_impact") || /\b(jump|run|sprint|impact)\b/i.test(exName))) return false;
    if (b === "kneeling" && /\bkneel\b/i.test(exName)) return false;
    if (b === "deep_squat" && /\bsquat\b/i.test(exName) && /\b(deep|full|atg|ass.to.grass)\b/i.test(exName)) return false;
    if (b === "behind_neck" && /\bbehind.?neck\b/i.test(exName)) return false;
    if (b === "lifting_heavy" && /\b(heavy|max effort|1rm)\b/i.test(exName)) return false;
    if (b === "dips" && /\bdips?\b/i.test(exName)) return false;
    if (b === "active_shoulder_rom" && exTags.includes("shoulder")) return false;
    if (b === "pressing" && /\bpress\b/i.test(exName)) return false;
    if (b === "lunge_loaded" && /\blunge\b/i.test(exName) && /\b(loaded|barbell|dumbbell)\b/i.test(exName)) return false;
    if (b === "hip_hinge_loaded" && /\b(rdl|romanian|hip hinge|good morning)\b/i.test(exName) && !/\bbodyweight\b/i.test(exName)) return false;
    if (exTags.includes(b)) return false;
  }
  return true;
}

export function getPostOpTimelineMessage(conditions, nowMs = Date.now()) {
  const out = [];
  for (const c of conditions || []) {
    const cid = c.conditionId || c.condition_key || c.condition || c.id || "";
    if (!c.surgeryDate || !POST_OP_TIMELINES[cid]) continue;
    const tier = getCurrentTimelineTier(cid, c.surgeryDate, nowMs);
    const next = getNextTier(cid, c.surgeryDate, nowMs);
    const weeks = getWeeksPostOp(c.surgeryDate, nowMs);
    if (!tier) continue;
    out.push({
      conditionId: cid,
      conditionName: c.name || cid,
      weeks,
      currentTier: tier.label,
      nextTier: next?.label || null,
      weeksUntilNext: next ? Math.max(0, next.weeks[0] - weeks) : null,
      message: tier.message,
    });
  }
  return out;
}

// For roadmap simulation: compute restrictions as they'll be at a future plan-week.
export function getRestrictionsAtWeekOffset(conditions, weekOffset) {
  const fakeNow = Date.now() + (weekOffset * 7 * 86400000);
  return getCombinedPostOpRestrictions(conditions, fakeNow);
}
