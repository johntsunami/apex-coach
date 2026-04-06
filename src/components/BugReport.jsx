import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthProvider.jsx";

const C={bg:"#060b18",bgCard:"#0d1425",bgElevated:"#162040",bgGlass:"rgba(255,255,255,0.04)",border:"rgba(255,255,255,0.08)",text:"#e8ecf4",textMuted:"#7a8ba8",textDim:"#4a5a78",teal:"#00d2c8",tealDark:"#00a89f",tealBg:"rgba(0,210,200,0.08)",success:"#22c55e",danger:"#ef4444",warning:"#eab308",info:"#3b82f6",orange:"#f97316",purple:"#a855f7"};

const DEV_EMAILS = ["johncarrus@gmail.com"];
const SEVERITIES = [
  { id: "minor", label: "Minor annoyance", color: C.textMuted },
  { id: "broken", label: "Broken feature", color: C.warning },
  { id: "blocking", label: "Can't use the app", color: C.danger },
  { id: "data_wrong", label: "Data looks wrong", color: C.orange },
];

function getDeviceInfo() {
  const ua = navigator.userAgent;
  const mobile = /Mobi|Android|iPhone|iPad/i.test(ua);
  const browser = /Chrome/i.test(ua) ? "Chrome" : /Firefox/i.test(ua) ? "Firefox" : /Safari/i.test(ua) ? "Safari" : /Edge/i.test(ua) ? "Edge" : "Other";
  return { platform: mobile ? "Mobile" : "Desktop", browser, screenWidth: window.innerWidth, screenHeight: window.innerHeight, userAgent: ua };
}

function getScreenLabel(screen, tab) {
  const labels = { home: "Home", train: "Train", library: "Exercise Library", coach: "AI Coach", tasks: "Tasks",
    checkin: "Check-In", perform: "Exercise Screen", reflect: "Session Reflection", recap: "Session Recap",
    plan: "Plan Preview", plan_view: "Full Plan View", onboarding: "Assessment", profile: "Settings",
    injuries: "Injury Manager", baseline: "Baseline Test", pt_session: "PT Session", pt_progress: "PT Progress",
    extra_work: "Extra Work", assessment_summary: "Assessment Summary", reassess_summary: "Reassessment Summary",
    quickmode: "Quick Mode", mindfulness: "Mindfulness Break" };
  return labels[screen] || labels[tab] || screen || "Unknown";
}

// ═══════════════════════════════════════════════════════════════
// BUG REPORT BUTTON (fixed bottom, every page)
// ═══════════════════════════════════════════════════════════════

export function BugReportButton({ screen, tab }) {
  const [open, setOpen] = useState(false);
  if (screen === "auth" || screen === "init") return null;
  return <>
    <button onClick={() => setOpen(true)} style={{ position: "fixed", bottom: 78, left: "50%", transform: "translateX(-50%)",
      zIndex: 201, background: "rgba(6,11,24,0.85)", border: `1px solid ${C.border}`, borderRadius: 8,
      color: C.textMuted, fontSize: 12, cursor: "pointer",
      fontFamily: "inherit", opacity: 0.5, padding: "4px 14px", letterSpacing: 0.5 }}>
      Report a Bug
    </button>
    {open && <BugReportModal screen={screen} tab={tab} onClose={() => setOpen(false)} />}
  </>;
}

// ═══════════════════════════════════════════════════════════════
// BUG REPORT MODAL
// ═══════════════════════════════════════════════════════════════

function BugReportModal({ screen, tab, onClose }) {
  const { user } = useAuth();
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("minor");
  const [screenshot, setScreenshot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const pageContext = getScreenLabel(screen, tab);
  const deviceInfo = getDeviceInfo();
  const timestamp = new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" });
  const userId = user?.id || "anonymous";

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const { supabase } = await import("../utils/supabase.js");

      let screenshotUrl = null;
      if (screenshot) {
        const ext = screenshot.name.split(".").pop();
        const path = `${userId}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("bug-screenshots").upload(path, screenshot);
        if (!upErr) {
          const { data: urlData } = supabase.storage.from("bug-screenshots").getPublicUrl(path);
          screenshotUrl = urlData?.publicUrl || null;
        }
      }

      const { error: insertErr } = await supabase.from("bug_reports").insert({
        user_id: userId === "anonymous" ? null : userId,
        page_context: pageContext,
        description: description.trim(),
        severity,
        device_info: deviceInfo,
        screenshot_url: screenshotUrl,
      });

      if (insertErr) throw insertErr;
      setDone(true);
      setTimeout(onClose, 2000);
    } catch (e) {
      console.warn("Bug report submission failed:", e);
      setError("Couldn't submit — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 20, padding: 20, maxWidth: 400, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        {done ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.success }}>Bug reported!</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Thank you — this helps us improve APEX Coach.</div>
          </div>
        ) : <>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2, marginBottom: 12 }}>REPORT A BUG</div>

          {/* Auto-captured context */}
          <div style={{ background: C.bgElevated, borderRadius: 10, padding: 10, marginBottom: 12, fontSize: 11, color: C.textDim, lineHeight: 1.6 }}>
            <div>Page: <span style={{ color: C.textMuted }}>{pageContext}</span></div>
            <div>Time: <span style={{ color: C.textMuted }}>{timestamp}</span></div>
            <div>User: <span style={{ color: C.textMuted }}>{userId.slice(0, 8)}...{userId.slice(-4)}</span></div>
            <div>Device: <span style={{ color: C.textMuted }}>{deviceInfo.platform} · {deviceInfo.browser} · {deviceInfo.screenWidth}px</span></div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>What went wrong?</div>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe what happened, what you expected, and what you saw instead"
              rows={4} style={{ width: "100%", padding: 12, borderRadius: 10, background: C.bgCard, border: `1px solid ${description ? C.teal + "40" : C.border}`, color: C.text, fontSize: 14, fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
          </div>

          {/* Severity */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>How serious is this?</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              {SEVERITIES.map(s => (
                <button key={s.id} onClick={() => setSeverity(s.id)} style={{ padding: "8px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "left",
                  background: severity === s.id ? s.color + "15" : "transparent",
                  border: `1px solid ${severity === s.id ? s.color + "60" : C.border}`,
                  color: severity === s.id ? s.color : C.textDim, fontFamily: "inherit" }}>{s.label}</button>
              ))}
            </div>
          </div>

          {/* Screenshot */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>Screenshot (optional)</div>
            <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f && f.size <= 2 * 1024 * 1024) setScreenshot(f); else if (f) setError("Image must be under 2MB"); }}
              style={{ fontSize: 12, color: C.textMuted, fontFamily: "inherit" }} />
            {screenshot && <div style={{ fontSize: 11, color: C.teal, marginTop: 4 }}>Attached: {screenshot.name}</div>}
          </div>

          {error && <div style={{ fontSize: 12, color: C.danger, marginBottom: 8 }}>{error}</div>}

          {/* Buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "12px 16px", borderRadius: 12, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.textMuted, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
            <button onClick={handleSubmit} disabled={!description.trim() || submitting} style={{ flex: 1, padding: "12px 16px", borderRadius: 12, background: `linear-gradient(135deg,${C.teal},${C.tealDark})`, border: "none", color: "#000", fontSize: 14, fontWeight: 700, cursor: submitting ? "wait" : "pointer", fontFamily: "inherit", opacity: !description.trim() || submitting ? 0.4 : 1 }}>
              {submitting ? "Sending..." : "Submit"}
            </button>
          </div>
        </>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DEVELOPER DASHBOARD — Bug reports viewer
// ═══════════════════════════════════════════════════════════════

export function isDeveloper(user) {
  return user?.email && DEV_EMAILS.includes(user.email);
}

export function DevBugDashboard({ onClose }) {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, new, in_progress, resolved
  const [expanded, setExpanded] = useState(null);

  const fetchReports = useCallback(async () => {
    try {
      const { supabase } = await import("../utils/supabase.js");
      // Dev needs to see ALL reports — use service role or RLS policy for dev email
      // Fallback: query own reports if admin policy isn't set up yet
      const { data, error } = await supabase.from("bug_reports").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      setReports(data || []);
    } catch (e) {
      console.warn("Failed to fetch bug reports:", e);
      setReports([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const updateReport = async (id, updates) => {
    try {
      const { supabase } = await import("../utils/supabase.js");
      await supabase.from("bug_reports").update(updates).eq("id", id);
      setReports(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    } catch (e) { console.warn("Update failed:", e); }
  };

  const filtered = filter === "all" ? reports : reports.filter(r => r.status === filter);
  const counts = { new: reports.filter(r => r.status === "new").length, in_progress: reports.filter(r => r.status === "in_progress").length, resolved: reports.filter(r => r.status === "resolved").length };
  const sevColor = s => s === "blocking" ? C.danger : s === "broken" ? C.warning : s === "data_wrong" ? C.orange : C.textDim;

  return (
    <div className="fade-in safe-bottom" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>BUG REPORTS</div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 14, cursor: "pointer", padding: 8, fontFamily: "inherit" }}>← Back</button>
      </div>

      {/* Counts */}
      <div style={{ display: "flex", gap: 6 }}>
        {[{ id: "all", label: `All (${reports.length})` }, { id: "new", label: `New (${counts.new})`, color: C.danger }, { id: "in_progress", label: `In Progress (${counts.in_progress})`, color: C.warning }, { id: "resolved", label: `Resolved (${counts.resolved})`, color: C.success }].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{ padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            background: filter === f.id ? (f.color || C.teal) + "15" : "transparent",
            border: `1px solid ${filter === f.id ? (f.color || C.teal) + "60" : C.border}`,
            color: filter === f.id ? (f.color || C.teal) : C.textDim }}>{f.label}</button>
        ))}
      </div>

      {loading && <div style={{ textAlign: "center", padding: 20, color: C.textMuted }}>Loading...</div>}

      {!loading && filtered.length === 0 && <div style={{ textAlign: "center", padding: 20, color: C.textDim }}>No reports found.</div>}

      {filtered.map(r => {
        const isExpanded = expanded === r.id;
        const date = new Date(r.created_at).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" });
        return (
          <div key={r.id} onClick={() => setExpanded(isExpanded ? null : r.id)} style={{ background: C.bgCard, border: `1px solid ${r.status === "new" ? sevColor(r.severity) + "40" : C.border}`, borderRadius: 14, padding: 12, cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 4, background: sevColor(r.severity) }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{r.page_context}</span>
                  <span style={{ fontSize: 10, color: C.textDim }}>{date}</span>
                </div>
                <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.4, overflow: "hidden", maxHeight: isExpanded ? "none" : 40 }}>{r.description}</div>
              </div>
              <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, fontWeight: 700, letterSpacing: 0.5,
                background: (r.status === "new" ? C.danger : r.status === "in_progress" ? C.warning : C.success) + "15",
                color: r.status === "new" ? C.danger : r.status === "in_progress" ? C.warning : C.success,
              }}>{r.status?.toUpperCase()}</span>
            </div>

            {isExpanded && <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 11, color: C.textDim, marginBottom: 6 }}>
                User: {r.user_id?.slice(0, 8) || "anon"} | Severity: {r.severity} | Device: {r.device_info?.platform} {r.device_info?.browser} {r.device_info?.screenWidth}px
              </div>
              {r.screenshot_url && <a href={r.screenshot_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.info }}>View Screenshot</a>}
              {/* Status controls */}
              <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                {["new", "acknowledged", "in_progress", "resolved"].map(s => (
                  <button key={s} onClick={e => { e.stopPropagation(); updateReport(r.id, { status: s, ...(s === "resolved" ? { resolved_at: new Date().toISOString() } : {}) }); }}
                    style={{ padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                      background: r.status === s ? C.teal + "15" : "transparent", border: `1px solid ${r.status === s ? C.teal : C.border}`,
                      color: r.status === s ? C.teal : C.textDim }}>{s.replace("_", " ")}</button>
                ))}
              </div>
              {/* Developer notes */}
              <div style={{ marginTop: 8 }}>
                <textarea value={r.developer_notes || ""} onClick={e => e.stopPropagation()} onChange={e => { const v = e.target.value; setReports(prev => prev.map(rr => rr.id === r.id ? { ...rr, developer_notes: v } : rr)); }}
                  onBlur={() => updateReport(r.id, { developer_notes: r.developer_notes })}
                  placeholder="Developer notes..." rows={2}
                  style={{ width: "100%", padding: 8, borderRadius: 8, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text, fontSize: 12, fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>}
          </div>
        );
      })}
      <div style={{ height: 60 }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HOME SCREEN DEV BADGE (new bug reports count)
// ═══════════════════════════════════════════════════════════════

export function DevBugBadge({ onClick }) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isDeveloper(user)) return;
    (async () => {
      try {
        const { supabase } = await import("../utils/supabase.js");
        const { count: c, error } = await supabase.from("bug_reports").select("*", { count: "exact", head: true }).eq("status", "new");
        if (!error && c > 0) setCount(c);
      } catch {}
    })();
  }, [user]);

  if (!isDeveloper(user) || count === 0) return null;
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: C.danger + "10", border: `1px solid ${C.danger}30`, borderRadius: 10, cursor: "pointer", marginBottom: 8 }}>
      <span style={{ fontSize: 14 }}>🐛</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: C.danger }}>{count} new bug report{count !== 1 ? "s" : ""}</span>
      <span style={{ fontSize: 10, color: C.textDim, marginLeft: "auto" }}>Tap to review →</span>
    </div>
  );
}
