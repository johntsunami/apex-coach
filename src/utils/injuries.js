// ═══════════════════════════════════════════════════════════════
// APEX Coach — Injury & Condition Management (localStorage)
// ═══════════════════════════════════════════════════════════════

const KEY = "apex_injuries";
const HISTORY_KEY = "apex_injury_history";

// No hardcoded defaults — each user's conditions come from their own assessment via Supabase.
// Empty array means "no conditions reported" for new users.
const DEFAULTS = [];

function getInjuries() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY));
    return stored && stored.length > 0 ? stored : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function saveInjuries(injuries) {
  localStorage.setItem(KEY, JSON.stringify(injuries));
}

function addInjury(injury) {
  const injuries = getInjuries();
  const entry = {
    id: "inj_" + Date.now(),
    area: injury.area || "",
    type: injury.type || "",
    severity: injury.severity || 2,
    status: injury.status || "active",
    gateKey: injury.gateKey || "other",
    protocols: injury.protocols || [],
    notes: injury.notes || "",
    conditionId: injury.conditionId || null,
    tempFlag: null,
    createdAt: injury.createdAt || new Date().toISOString(),
    surgeryDate: injury.surgeryDate || null,
    painFreeStreak: 0,     // consecutive pain-free sessions for this area
    lastPainDate: null,     // last date pain was reported for this area
    lastSeverityChange: new Date().toISOString(),
  };
  injuries.push(entry);
  saveInjuries(injuries);
  _logChange("added", entry);
  return injuries;
}

// Get weeks since injury/surgery for healing timeline phase matching
function getWeeksSinceInjury(injury) {
  const refDate = injury.surgeryDate || injury.createdAt;
  if (!refDate) return null;
  const diff = Date.now() - new Date(refDate).getTime();
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
}

// Match current healing phase from conditions.json timeline
function getHealingPhase(injury, conditionsDB) {
  const weeks = getWeeksSinceInjury(injury);
  if (weeks === null) return null;
  const cond = conditionsDB?.find(c => c.condition === injury.conditionId || c.id === injury.conditionId);
  if (!cond?.phases) return null;
  // Find matching phase based on weeks
  const phaseKeys = Object.keys(cond.phases).sort();
  let matched = null;
  for (const key of phaseKeys) {
    const m = key.match(/(\d+)/);
    if (m) {
      const phaseStart = parseInt(m[1]);
      const isMonths = key.includes("month");
      const phaseWeeks = isMonths ? phaseStart * 4 : phaseStart;
      if (weeks >= phaseWeeks) matched = { key, description: cond.phases[key], weeksSince: weeks };
    }
  }
  return matched;
}

// Update pain-free streak for an injury area after a session
function updatePainTracking(injuryId, hadPain) {
  const injuries = getInjuries();
  const idx = injuries.findIndex(i => i.id === injuryId);
  if (idx === -1) return injuries;
  if (hadPain) {
    injuries[idx].painFreeStreak = 0;
    injuries[idx].lastPainDate = new Date().toISOString();
  } else {
    injuries[idx].painFreeStreak = (injuries[idx].painFreeStreak || 0) + 1;
  }
  saveInjuries(injuries);
  return injuries;
}

// Check if any injuries should suggest severity reduction
function getSeverityReductionSuggestions() {
  const injuries = getInjuries().filter(i => i.status !== "resolved" && i.severity > 1);
  const suggestions = [];
  for (const inj of injuries) {
    const streak = inj.painFreeStreak || 0;
    const weeks = getWeeksSinceInjury(inj);
    // Suggest reduction after 6+ pain-free sessions (roughly 2 weeks of training)
    if (streak >= 6 && inj.severity > 1) {
      suggestions.push({
        injuryId: inj.id,
        area: inj.area,
        currentSeverity: inj.severity,
        suggestedSeverity: inj.severity - 1,
        painFreeStreak: streak,
        weeksSinceInjury: weeks,
        message: `${inj.area} has been pain-free for ${streak} sessions. Consider reducing severity from ${inj.severity} to ${inj.severity - 1} to unlock more exercises.`,
      });
    }
  }
  return suggestions;
}

function updateInjury(id, updates) {
  const injuries = getInjuries();
  const idx = injuries.findIndex((i) => i.id === id);
  if (idx < 0) return injuries;
  const old = { ...injuries[idx] };
  injuries[idx] = { ...injuries[idx], ...updates };
  saveInjuries(injuries);
  _logChange("updated", injuries[idx], old);
  return injuries;
}

function removeInjury(id) {
  const injuries = getInjuries();
  const removed = injuries.find((i) => i.id === id);
  const updated = injuries.filter((i) => i.id !== id);
  saveInjuries(updated);
  if (removed) _logChange("removed", removed);
  return updated;
}

function setTempFlag(id, flag) {
  const injuries = getInjuries();
  const idx = injuries.findIndex((i) => i.id === id);
  if (idx < 0) return injuries;
  injuries[idx].tempFlag = flag; // e.g., "extra sensitive today"
  saveInjuries(injuries);
  _logChange("temp_flagged", injuries[idx]);
  return injuries;
}

function clearTempFlags() {
  const injuries = getInjuries();
  injuries.forEach((i) => (i.tempFlag = null));
  saveInjuries(injuries);
  return injuries;
}

// ── Contraindication calculator ───────────────────────────────

function computeContraindications(injuries, exerciseDB) {
  const active = injuries.filter((i) => i.status !== "resolved");
  const blocked = [];
  const unlocked = [];

  exerciseDB.forEach((ex) => {
    const sg = ex.contraindications?.severity_gate || {};
    let isBlocked = false;
    let blockReason = "";

    active.forEach((inj) => {
      const gate = sg[inj.gateKey];
      const effectiveSev = inj.tempFlag ? Math.min(5, inj.severity + 1) : inj.severity;
      if (gate !== undefined && effectiveSev > gate) {
        isBlocked = true;
        blockReason = `${inj.area} severity ${effectiveSev} > gate ${gate}`;
      }
    });

    if (isBlocked) {
      blocked.push({ exerciseId: ex.id, name: ex.name, reason: blockReason });
    }
  });

  return { blocked, totalBlocked: blocked.length };
}

function computeChangelog(oldInjuries, newInjuries, exerciseDB) {
  const oldResult = computeContraindications(oldInjuries, exerciseDB);
  const newResult = computeContraindications(newInjuries, exerciseDB);

  const oldBlockedIds = new Set(oldResult.blocked.map((b) => b.exerciseId));
  const newBlockedIds = new Set(newResult.blocked.map((b) => b.exerciseId));

  const unlocked = oldResult.blocked.filter((b) => !newBlockedIds.has(b.exerciseId));
  const newlyBlocked = newResult.blocked.filter((b) => !oldBlockedIds.has(b.exerciseId));

  return { unlocked, newlyBlocked, totalBlocked: newResult.totalBlocked };
}

// ── Change history ────────────────────────────────────────────

function _logChange(action, injury, oldValues) {
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    history.push({
      action,
      injuryId: injury.id,
      area: injury.area,
      date: new Date().toISOString(),
      details: action === "updated" ? { from: oldValues?.severity, to: injury.severity, status: injury.status } : null,
    });
    // Keep last 50 entries
    if (history.length > 50) history.splice(0, history.length - 50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {}
}

function getChangeHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

// Map condition to severity gate key — uses condition ID for precision, falls back to category
function conditionToGateKey(condCategoryOrId) {
  if (!condCategoryOrId) return "other";
  const id = condCategoryOrId.toLowerCase().replace(/\s+/g, "_");

  // Specific condition ID → gate key (most precise)
  // Shoulder conditions
  if (id.includes("shoulder") || id.includes("rotator") || id.includes("labrum") || id.includes("impingement") || id.includes("frozen_shoulder") || id.includes("slap") || id.includes("bankart")) return "shoulder";
  // Knee conditions
  if (id.includes("knee") || id.includes("acl") || id.includes("mcl") || id.includes("meniscus") || id.includes("patellar") || id.includes("patellofemoral")) return "knee";
  // Hip conditions
  if (id.includes("hip") || id.includes("trochanteric") || id.includes("bursitis") && id.includes("hip")) return "knee"; // hip maps to knee gate (closest lower body gate)
  // Ankle/foot conditions
  if (id.includes("ankle") || id.includes("plantar") || id.includes("achilles") || id.includes("foot")) return "ankle";
  // Finger/pulley conditions (climbing-specific — separate from wrist)
  if (id.includes("finger_pulley") || id.includes("finger_flexor") || id.includes("finger_tenosynov") || id.includes("pulley_strain") || id.includes("pulley_rupture")) return "finger";
  // Wrist/hand conditions
  if (id.includes("wrist") || id.includes("carpal") || id.includes("quervain") || id.includes("trigger_finger") || id.includes("dupuytren")) return "wrist";
  // Spinal conditions
  if (id.includes("spinal") || id.includes("disc") || id.includes("lumbar") || id.includes("cervical") || id.includes("thoracic") || id.includes("spondyl") || id.includes("stenosis") || id.includes("sciatica") || id.includes("neck") || id.includes("back") || id.includes("whiplash") || id.includes("kyphosis") || id.includes("lordosis") || id.includes("scoliosis") || id.includes("coccyx") || id.includes("si_joint") || id.includes("microdiscectomy") || id.includes("fusion")) return "lower_back";

  // Category-level fallback
  const categoryMap = {
    spinal: "lower_back",
    joint: "knee",
    neurological: "other",
    systemic: "other",
    cardiopulmonary: "other",
    metabolic: "other",
    mental_health: "other",
    pregnancy: "other",
    age_related: "other",
    amputation: "other",
  };
  return categoryMap[id] || "other";
}

// ── Resolve (heal) a condition — moves to history, doesn't delete ──

function resolveInjury(id) {
  const injuries = getInjuries();
  const idx = injuries.findIndex(i => i.id === id);
  if (idx < 0) return injuries;
  injuries[idx].status = "resolved";
  injuries[idx].resolvedAt = new Date().toISOString();
  saveInjuries(injuries);
  _logChange("updated", injuries[idx], { status: "resolved" });
  return injuries;
}

function reactivateInjury(id, severity) {
  const injuries = getInjuries();
  const idx = injuries.findIndex(i => i.id === id);
  if (idx < 0) return injuries;
  injuries[idx].status = "active";
  injuries[idx].severity = severity || injuries[idx].severity;
  injuries[idx].reactivatedAt = new Date().toISOString();
  delete injuries[idx].resolvedAt;
  saveInjuries(injuries);
  _logChange("updated", injuries[idx], { status: "active" });
  return injuries;
}

function getResolvedConditions() {
  return getInjuries().filter(i => i.status === "resolved");
}

export {
  getInjuries,
  saveInjuries,
  addInjury,
  updateInjury,
  removeInjury,
  resolveInjury,
  reactivateInjury,
  getResolvedConditions,
  setTempFlag,
  clearTempFlags,
  computeContraindications,
  computeChangelog,
  getChangeHistory,
  conditionToGateKey,
  getWeeksSinceInjury,
  getHealingPhase,
  updatePainTracking,
  getSeverityReductionSuggestions,
  DEFAULTS,
};
