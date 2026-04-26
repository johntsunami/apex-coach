import { useState } from "react";
import { runSafetyAudit, TEST_PROFILES } from "../utils/safetyAudit.js";

export default function SafetyAudit() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [expandedProfile, setExpandedProfile] = useState(null);

  const handleRun = async () => {
    setRunning(true);
    setResults(null);
    await new Promise(r => setTimeout(r, 50)); // let UI paint
    try {
      setResults(runSafetyAudit());
    } catch (err) {
      setResults({
        runAt: new Date().toISOString(),
        profilesPassed: 0,
        profilesFailed: TEST_PROFILES.length,
        totalViolations: 1,
        totalWarnings: 0,
        profiles: [],
        error: err.message,
      });
    }
    setRunning(false);
  };

  const exportJson = () => {
    if (!results) return;
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `safety-audit-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#e8ecf4", marginBottom: 4 }}>🔍 Safety Audit</div>
      <div style={{ fontSize: 11, color: "#7a8ba8", marginBottom: 16, lineHeight: 1.5 }}>
        Runs every exercise in exerciseDB through the actual safety filter chain (permanent contraindications + post-op timeline + universal gate) for {TEST_PROFILES.length} safety-critical test profiles. Reports any contraindicated exercise that slips through. Run after any change to workout generation, condition logic, or safety filters.
      </div>

      <button
        onClick={handleRun}
        disabled={running}
        style={{
          width: "100%", padding: 14, borderRadius: 10,
          background: running ? "#162040" : "linear-gradient(135deg, #00d2c8, #00a89f)",
          color: running ? "#7a8ba8" : "#000",
          fontWeight: 700, fontSize: 14, border: "none",
          cursor: running ? "wait" : "pointer", fontFamily: "inherit", marginBottom: 16,
        }}
      >
        {running ? "Running audit…" : "▶ Run Safety Audit"}
      </button>

      {results && (
        <>
          <div style={{
            background: results.profilesFailed === 0 ? "rgba(34,197,94,0.05)" : "rgba(239,68,68,0.05)",
            border: `1px solid ${results.profilesFailed === 0 ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
            borderRadius: 10, padding: 14, marginBottom: 14,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: results.profilesFailed === 0 ? "#22c55e" : "#ef4444", marginBottom: 6 }}>
              {results.profilesFailed === 0 ? "✅ ALL CHECKS PASSED" : `❌ ${results.profilesFailed} PROFILES FAILED`}
            </div>
            <div style={{ fontSize: 11, color: "#e8ecf4", lineHeight: 1.6 }}>
              {results.profilesPassed} of {TEST_PROFILES.length} profiles passed<br/>
              {results.totalViolations} critical violations · {results.totalWarnings} warnings<br/>
              Run at: {new Date(results.runAt).toLocaleTimeString()}{results.durationMs ? ` · ${results.durationMs}ms` : ""}
            </div>
          </div>

          {results.profiles.map((p) => (
            <div key={p.id} style={{
              background: "#0d1425",
              border: `1px solid ${p.passed ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.4)"}`,
              borderRadius: 10, padding: 12, marginBottom: 8,
            }}>
              <div onClick={() => setExpandedProfile(expandedProfile === p.id ? null : p.id)} style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#e8ecf4" }}>{p.passed ? "✅" : "❌"} {p.name}</div>
                    <div style={{ fontSize: 10, color: "#7a8ba8", marginTop: 2 }}>
                      {p.violations.length} violations · {p.warnings.length} warnings · {p.stats.exercisesChecked} exercises checked · {p.stats.exercisesAllowed} allowed
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "#4a5a78" }}>{expandedProfile === p.id ? "▾" : "▸"}</div>
                </div>
              </div>

              {expandedProfile === p.id && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  {p.violations.length === 0 && p.warnings.length === 0 && (
                    <div style={{ fontSize: 10, color: "#22c55e" }}>No issues found.</div>
                  )}
                  {p.violations.map((v, i) => (
                    <div key={`v-${i}`} style={{ background: "rgba(239,68,68,0.05)", borderLeft: "2px solid #ef4444", padding: 8, marginBottom: 6, borderRadius: 4 }}>
                      <div style={{ fontSize: 10, color: "#ef4444", fontWeight: 700, marginBottom: 2 }}>
                        {(v.severity || "critical").toUpperCase()}{v.phase ? ` · Phase ${v.phase}` : ""}
                      </div>
                      <div style={{ fontSize: 11, color: "#e8ecf4", marginBottom: 2 }}>{v.exercise || v.message || "Plan generation"}</div>
                      <div style={{ fontSize: 10, color: "#7a8ba8" }}>{v.reason || ""}</div>
                      {v.blockedBy && <div style={{ fontSize: 9, color: "#4a5a78", marginTop: 2 }}>Source: {v.blockedBy}</div>}
                    </div>
                  ))}
                  {p.warnings.map((w, i) => (
                    <div key={`w-${i}`} style={{ background: "rgba(251,191,36,0.05)", borderLeft: "2px solid #fbbf24", padding: 8, marginBottom: 6, borderRadius: 4 }}>
                      <div style={{ fontSize: 10, color: "#fbbf24", fontWeight: 700, marginBottom: 2 }}>WARNING{w.phase ? ` · Phase ${w.phase}` : ""}</div>
                      <div style={{ fontSize: 10, color: "#e8ecf4" }}>{w.exercise ? `${w.exercise}: ` : ""}{w.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <button onClick={exportJson} style={{
            width: "100%", marginTop: 8, padding: 10, borderRadius: 8,
            background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
            color: "#7a8ba8", fontSize: 11, cursor: "pointer", fontFamily: "inherit",
          }}>📥 Export Results as JSON</button>
        </>
      )}
    </div>
  );
}
