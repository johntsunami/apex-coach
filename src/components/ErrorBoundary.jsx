import { Component } from "react";

// ═══════════════════════════════════════════════════════════════
// Global Error Boundary — catches ALL unhandled React errors
// Shows a friendly fallback instead of a blank screen
// ═══════════════════════════════════════════════════════════════

const C = {
  bg: "#060b18", bgCard: "#0d1425", text: "#e8ecf4",
  textMuted: "#7a8ba8", teal: "#00d2c8", danger: "#ef4444",
  border: "rgba(255,255,255,0.08)",
};

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log to console for debugging
    console.error("APEX Error Boundary caught:", error, errorInfo);
    // Try to log to Supabase (fire-and-forget)
    try {
      import("../utils/supabase.js").then(({ supabase }) => {
        supabase.from("error_logs").insert({
          error_message: error?.message || "Unknown error",
          error_stack: error?.stack?.slice(0, 500) || "",
          component_stack: errorInfo?.componentStack?.slice(0, 500) || "",
          created_at: new Date().toISOString(),
        }).then(() => {});
      });
    } catch { /* ignore */ }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh", background: C.bg, display: "flex",
          alignItems: "center", justifyContent: "center", padding: 24,
        }}>
          <div style={{
            background: C.bgCard, border: `1px solid ${C.border}`,
            borderRadius: 20, padding: 32, maxWidth: 380, width: "100%",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>😵</div>
            <h2 style={{
              fontSize: 22, fontWeight: 800, color: C.text,
              fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2, margin: "0 0 8px",
            }}>SOMETHING WENT WRONG</h2>
            <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6, marginBottom: 20 }}>
              The app hit an unexpected error. Your data is safe — just tap below to reload.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                width: "100%", padding: "16px 24px", borderRadius: 14,
                background: `linear-gradient(135deg, ${C.teal}, #00a89f)`,
                color: "#000", fontWeight: 700, fontSize: 16, border: "none",
                cursor: "pointer", fontFamily: "inherit", marginBottom: 12,
              }}
            >Reload App</button>
            <button
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              style={{
                width: "100%", padding: "12px 20px", borderRadius: 14,
                background: "transparent", color: C.textMuted, fontSize: 13,
                border: `1px solid ${C.border}`, cursor: "pointer", fontFamily: "inherit",
              }}
            >Try to Continue</button>
            {this.state.error && (
              <details style={{ marginTop: 16, textAlign: "left" }}>
                <summary style={{ fontSize: 10, color: C.textMuted, cursor: "pointer" }}>Error details</summary>
                <pre style={{
                  fontSize: 9, color: C.danger, background: "rgba(239,68,68,0.08)",
                  borderRadius: 8, padding: 8, marginTop: 4, overflow: "auto",
                  maxHeight: 120, whiteSpace: "pre-wrap", wordBreak: "break-all",
                }}>{this.state.error.toString()}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
