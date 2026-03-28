import { useState, useMemo } from "react";
import conditionsDB from "../data/conditions.json";
import exerciseDB from "../data/exercises.json";
import { getInjuries, addInjury, updateInjury, removeInjury, resolveInjury, reactivateInjury, setTempFlag, computeChangelog, conditionToGateKey } from "../utils/injuries.js";

// ═══════════════════════════════════════════════════════════════
// Injury & Condition Manager — add, edit, remove, temp flag
// ═══════════════════════════════════════════════════════════════

const C={bg:"#060b18",bgCard:"#0d1425",bgElevated:"#162040",bgGlass:"rgba(255,255,255,0.04)",border:"rgba(255,255,255,0.08)",text:"#e8ecf4",textMuted:"#7a8ba8",textDim:"#4a5a78",teal:"#00d2c8",tealBg:"rgba(0,210,200,0.08)",tealDark:"#00a89f",success:"#22c55e",danger:"#ef4444",warning:"#eab308",info:"#3b82f6",orange:"#f97316",purple:"#a855f7"};
const Card=({children,style,onClick})=><div onClick={onClick} style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:16,padding:18,cursor:onClick?"pointer":"default",...style}}>{children}</div>;
const Btn=({children,onClick,disabled,style,variant="teal",icon,size="lg"})=>{const v={teal:{background:`linear-gradient(135deg,${C.teal},${C.tealDark})`,color:"#000",fontWeight:700},dark:{background:C.bgElevated,color:C.text,border:`1px solid ${C.border}`},ghost:{background:"transparent",color:C.textMuted},danger:{background:C.danger+"20",color:C.danger,border:`1px solid ${C.danger}40`}};const s={sm:{padding:"8px 14px",fontSize:12},lg:{padding:"14px 24px",fontSize:15}};return<button onClick={onClick} disabled={disabled} style={{...v[variant],...s[size],borderRadius:14,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.4:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,width:"100%",fontFamily:"inherit",border:v[variant]?.border||"none",...style}}>{icon&&<span>{icon}</span>}{children}</button>;};
const Badge=({children,color=C.teal})=><span style={{display:"inline-flex",padding:"4px 10px",borderRadius:8,fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color,background:color+"15",border:`1px solid ${color}25`}}>{children}</span>;

const GATE_KEYS = [
  {id:"lower_back",label:"Lower Back"},{id:"knee",label:"Knee"},{id:"shoulder",label:"Shoulder"},{id:"other",label:"Other"},
];

export default function InjuryManager({ onClose }) {
  const [injuries, setInjuries] = useState(getInjuries);
  const [mode, setMode] = useState("list"); // list | add | confirm_remove
  const [search, setSearch] = useState("");
  const [addData, setAddData] = useState({ conditionId: null, name: "", severity: 2, gateKey: "other", notes: "" });
  const [removeTarget, setRemoveTarget] = useState(null);
  const [changelog, setChangelog] = useState(null);
  const [editId, setEditId] = useState(null);
  const [tempFlagId, setTempFlagId] = useState(null);
  const [tempFlagText, setTempFlagText] = useState("");

  const snapshotBefore = useMemo(() => [...injuries], []);

  const handleSave = () => {
    const log = computeChangelog(snapshotBefore, injuries, exerciseDB);
    setChangelog(log);
  };

  const handleAddCondition = (cond) => {
    setAddData({ conditionId: cond.id, name: cond.name, severity: 2, gateKey: conditionToGateKey(cond.category), notes: "" });
    setMode("add_detail");
  };

  const confirmAdd = () => {
    const updated = addInjury({
      area: addData.name,
      type: addData.conditionId ? "Condition" : "Injury",
      severity: addData.severity,
      gateKey: addData.gateKey,
      conditionId: addData.conditionId,
      notes: addData.notes,
      protocols: [],
    });
    setInjuries(updated);
    setMode("list");
    setSearch("");
  };

  const handleUpdate = (id, field, value) => {
    const updated = updateInjury(id, { [field]: value });
    setInjuries(updated);
  };

  const confirmRemove = () => {
    if (!removeTarget) return;
    const updated = removeInjury(removeTarget);
    setInjuries(updated);
    setRemoveTarget(null);
    setMode("list");
  };

  const handleTempFlag = () => {
    if (!tempFlagId) return;
    const updated = setTempFlag(tempFlagId, tempFlagText || "Extra sensitive today");
    setInjuries(updated);
    setTempFlagId(null);
    setTempFlagText("");
  };

  // ── Changelog view ──────────────────────────────────────
  if (changelog) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 3 }}>CHANGES SAVED</div>
        <Card glow={C.teal + "20"}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.teal, letterSpacing: 1.5, marginBottom: 10 }}>IMPACT ON YOUR PROGRAM</div>
          {changelog.unlocked.length > 0 && <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.success, marginBottom: 4 }}>{changelog.unlocked.length} EXERCISE{changelog.unlocked.length > 1 ? "S" : ""} UNLOCKED</div>
            {changelog.unlocked.slice(0, 5).map(e => (
              <div key={e.exerciseId} style={{ fontSize: 11, color: C.text, padding: "2px 0" }}>✅ {e.name}</div>
            ))}
            {changelog.unlocked.length > 5 && <div style={{ fontSize: 10, color: C.textDim }}>+{changelog.unlocked.length - 5} more</div>}
          </div>}
          {changelog.newlyBlocked.length > 0 && <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.danger, marginBottom: 4 }}>{changelog.newlyBlocked.length} NEW RESTRICTION{changelog.newlyBlocked.length > 1 ? "S" : ""}</div>
            {changelog.newlyBlocked.slice(0, 5).map(e => (
              <div key={e.exerciseId} style={{ fontSize: 11, color: C.text, padding: "2px 0" }}>🚫 {e.name} — {e.reason}</div>
            ))}
          </div>}
          {changelog.unlocked.length === 0 && changelog.newlyBlocked.length === 0 && <div style={{ fontSize: 11, color: C.textMuted }}>No changes to exercise restrictions.</div>}
          <div style={{ fontSize: 10, color: C.textDim, marginTop: 8, fontStyle: "italic" }}>Your next session will adapt accordingly. Total blocked: {changelog.totalBlocked}.</div>
        </Card>
        <Btn onClick={onClose} icon="🏠">Back to Home</Btn>
      </div>
    );
  }

  // ── Confirm remove dialog ───────────────────────────────
  if (mode === "confirm_remove") {
    const target = injuries.find(i => i.id === removeTarget);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.danger, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>REMOVE CONDITION?</div>
        <Card style={{ borderColor: C.danger + "40" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{target?.area}</div>
          <div style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>{target?.type} · Severity {target?.severity}/5</div>
          <div style={{ fontSize: 11, color: C.warning, marginTop: 10, padding: 10, background: C.warning + "10", borderRadius: 8 }}>
            ⚠️ Removing this means exercise restrictions will be lifted. Exercises previously blocked by this condition will become available. Are you sure?
          </div>
        </Card>
        <Btn variant="danger" onClick={confirmRemove} icon="🗑️">Yes — Remove and Lift Restrictions</Btn>
        <Btn variant="dark" onClick={() => { setRemoveTarget(null); setMode("list"); }}>Cancel</Btn>
      </div>
    );
  }

  // ── Add condition detail ────────────────────────────────
  if (mode === "add_detail") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>ADD CONDITION</div>
        <Card>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.teal, marginBottom: 12 }}>{addData.name}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 8 }}>Severity (1-5)</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} onClick={() => setAddData(p => ({ ...p, severity: s }))}
                style={{ flex: 1, padding: "10px 4px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer",
                  background: addData.severity === s ? (s <= 2 ? C.success : s <= 3 ? C.warning : C.danger) + "20" : "transparent",
                  border: `1px solid ${addData.severity === s ? (s <= 2 ? C.success : s <= 3 ? C.warning : C.danger) : C.border}`,
                  color: addData.severity === s ? C.text : C.textDim }}>{s}</button>
            ))}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 8 }}>Affects which body area?</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {GATE_KEYS.map(g => (
              <button key={g.id} onClick={() => setAddData(p => ({ ...p, gateKey: g.id }))}
                style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer",
                  background: addData.gateKey === g.id ? C.tealBg : "transparent",
                  border: `1px solid ${addData.gateKey === g.id ? C.teal : C.border}`,
                  color: addData.gateKey === g.id ? C.teal : C.textDim }}>{g.label}</button>
            ))}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 6 }}>Notes (optional)</div>
          <input value={addData.notes} onChange={e => setAddData(p => ({ ...p, notes: e.target.value }))} placeholder="e.g., flared up yesterday, PT says improving..."
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        </Card>
        <Btn onClick={confirmAdd} icon="➕">Add to My Profile</Btn>
        <Btn variant="dark" onClick={() => setMode("add")}>← Back to Search</Btn>
      </div>
    );
  }

  // ── Add search ──────────────────────────────────────────
  if (mode === "add") {
    const filtered = search.trim().length >= 2
      ? conditionsDB.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).slice(0, 15)
      : [];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>ADD CONDITION</div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search conditions (e.g., ACL, sciatica, fibromyalgia...)" autoFocus
          style={{ width: "100%", padding: "12px 16px", borderRadius: 12, background: C.bgCard, border: `1px solid ${C.border}`, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        {filtered.map(cond => (
          <Card key={cond.id} onClick={() => handleAddCondition(cond)} style={{ padding: 14, cursor: "pointer" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{cond.name}</div>
            <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>{cond.category} · {(cond.recommended || []).length} recommended exercises</div>
          </Card>
        ))}
        {search.trim().length >= 2 && filtered.length === 0 && <div style={{ fontSize: 11, color: C.textDim, textAlign: "center" }}>No matching conditions. Try different keywords.</div>}
        {search.trim().length < 2 && <div style={{ fontSize: 11, color: C.textDim, textAlign: "center" }}>Type at least 2 characters to search {conditionsDB.length} conditions.</div>}
        <Btn variant="dark" onClick={() => { setMode("list"); setSearch(""); }}>← Back</Btn>
      </div>
    );
  }

  // ── Temp flag dialog ────────────────────────────────────
  if (tempFlagId) {
    const target = injuries.find(i => i.id === tempFlagId);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.warning, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>TEMPORARY FLAG</div>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 8 }}>{target?.area}</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 12 }}>This adds extra caution for today's session without changing the permanent severity. Acts as +1 severity for exercise filtering.</div>
          <input value={tempFlagText} onChange={e => setTempFlagText(e.target.value)} placeholder="e.g., extra sensitive today, tweaked it yesterday..."
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        </Card>
        <Btn onClick={handleTempFlag} icon="⚡" style={{ background: `linear-gradient(135deg,${C.warning},${C.orange})`, color: "#000" }}>Flag for Today</Btn>
        <Btn variant="dark" onClick={() => { setTempFlagId(null); setTempFlagText(""); }}>Cancel</Btn>
      </div>
    );
  }

  // ── Main list ───────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 3 }}>INJURIES & CONDITIONS</div>
          <div style={{ fontSize: 11, color: C.textMuted }}>{injuries.filter(i => i.status !== "resolved").length} active · Tap to edit</div>
        </div>
      </div>

      {injuries.map(inj => {
        const isEditing = editId === inj.id;
        const sevColor = inj.severity <= 2 ? C.success : inj.severity <= 3 ? C.warning : C.danger;
        return (
          <Card key={inj.id} style={{ padding: isEditing ? 18 : 14, borderColor: inj.tempFlag ? C.warning + "60" : inj.status === "resolved" ? C.success + "30" : C.border, opacity: inj.status === "resolved" ? 0.5 : 1 }}>
            <div onClick={() => setEditId(isEditing ? null : inj.id)} style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{inj.area}</div>
                <div style={{ fontSize: 11, color: C.textDim }}>{inj.type}{inj.notes ? ` — ${inj.notes}` : ""}</div>
                {inj.tempFlag && <div style={{ fontSize: 10, color: C.warning, marginTop: 2 }}>⚡ {inj.tempFlag}</div>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Badge color={sevColor}>SEV {inj.severity}/5</Badge>
                <Badge color={inj.status === "resolved" ? C.success : inj.status === "rehab" ? C.info : C.warning}>{inj.status}</Badge>
              </div>
            </div>

            {isEditing && <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
              {/* Severity */}
              <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 6 }}>Severity</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => handleUpdate(inj.id, "severity", s)}
                    style={{ flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
                      background: inj.severity === s ? (s <= 2 ? C.success : s <= 3 ? C.warning : C.danger) + "20" : "transparent",
                      border: `1px solid ${inj.severity === s ? (s <= 2 ? C.success : s <= 3 ? C.warning : C.danger) : C.border}`,
                      color: inj.severity === s ? C.text : C.textDim }}>{s}</button>
                ))}
              </div>
              {/* Status */}
              <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 6 }}>Status</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {["active", "managing", "rehab", "resolved"].map(st => (
                  <button key={st} onClick={() => handleUpdate(inj.id, "status", st)}
                    style={{ flex: 1, padding: "6px 4px", borderRadius: 8, fontSize: 10, fontWeight: 600, cursor: "pointer",
                      background: inj.status === st ? C.tealBg : "transparent",
                      border: `1px solid ${inj.status === st ? C.teal : C.border}`,
                      color: inj.status === st ? C.teal : C.textDim }}>{st}</button>
                ))}
              </div>
              {/* Notes */}
              <input value={inj.notes || ""} onChange={e => handleUpdate(inj.id, "notes", e.target.value)} placeholder="Notes (flare-up, PT feedback...)"
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text, fontSize: 11, fontFamily: "inherit", outline: "none", marginBottom: 10, boxSizing: "border-box" }} />
              {/* Actions */}
              <div style={{ display: "flex", gap: 6 }}>
                {inj.status !== "resolved" && <button onClick={() => { const updated = resolveInjury(inj.id); setInjuries(updated); }} style={{ flex: 1, padding: "8px", borderRadius: 8, background: C.success + "15", border: `1px solid ${C.success}30`, color: C.success, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>✅ Mark Healed</button>}
                {inj.status === "resolved" && <button onClick={() => { const updated = reactivateInjury(inj.id, inj.severity); setInjuries(updated); }} style={{ flex: 1, padding: "8px", borderRadius: 8, background: C.warning + "15", border: `1px solid ${C.warning}30`, color: C.warning, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>↩ Reactivate</button>}
                <button onClick={() => setTempFlagId(inj.id)} style={{ flex: 1, padding: "8px", borderRadius: 8, background: C.warning + "15", border: `1px solid ${C.warning}30`, color: C.warning, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>⚡ Flag Today</button>
                <button onClick={() => { setRemoveTarget(inj.id); setMode("confirm_remove"); }} style={{ flex: 1, padding: "8px", borderRadius: 8, background: C.danger + "15", border: `1px solid ${C.danger}30`, color: C.danger, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>🗑️</button>
              </div>
            </div>}
          </Card>
        );
      })}

      <Btn variant="dark" onClick={() => setMode("add")} icon="➕">Add New Condition</Btn>
      <Btn onClick={() => { handleSave(); }} icon="💾">Save & See Impact</Btn>
      <Btn variant="ghost" onClick={onClose}>← Back to Home</Btn>
      <div style={{ height: 40 }} />
    </div>
  );
}
