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
  };
  injuries.push(entry);
  saveInjuries(injuries);
  _logChange("added", entry);
  return injuries;
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

// Map condition category to severity gate key
function conditionToGateKey(condCategory) {
  const map = {
    spinal: "lower_back",
    joint: "knee", // default for joint — user can override
    neurological: "other",
    systemic: "other",
    cardiopulmonary: "other",
    metabolic: "other",
    mental_health: "other",
    pregnancy: "other",
    age_related: "other",
    amputation: "other",
  };
  return map[condCategory] || "other";
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
  DEFAULTS,
};
