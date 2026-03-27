import { useState } from "react";
import { useAuth } from "./AuthProvider.jsx";

// ═══════════════════════════════════════════════════════════════
// Landing Page + Sign Up + Log In + Forgot Password
// ═══════════════════════════════════════════════════════════════

const C={bg:"#060b18",bgCard:"#0d1425",bgElevated:"#162040",border:"rgba(255,255,255,0.08)",text:"#e8ecf4",textMuted:"#7a8ba8",textDim:"#4a5a78",teal:"#00d2c8",tealDark:"#00a89f",tealBg:"rgba(0,210,200,0.08)",tealGlow:"rgba(0,210,200,0.15)",success:"#22c55e",danger:"#ef4444",info:"#3b82f6",purple:"#a855f7"};

function Input({ value, onChange, placeholder, type = "text", style }) {
  return <input value={value} onChange={onChange} placeholder={placeholder} type={type}
    style={{ width: "100%", padding: "14px 16px", borderRadius: 14, background: C.bgCard, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", ...style }} />;
}

function Btn({ children, onClick, disabled, variant = "teal", icon, style }) {
  const v = { teal: { background: `linear-gradient(135deg,${C.teal},${C.tealDark})`, color: "#000", fontWeight: 700 }, dark: { background: C.bgElevated, color: C.text, border: `1px solid ${C.border}` }, ghost: { background: "transparent", color: C.textMuted } };
  return <button onClick={onClick} disabled={disabled} style={{ ...v[variant], padding: "16px 24px", borderRadius: 14, fontSize: 15, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", fontFamily: "inherit", border: v[variant]?.border || "none", ...style }}>{icon && <span>{icon}</span>}{children}</button>;
}

// ── Landing Page ──────────────────────────────────────────────
export function LandingPage({ onSignUp, onLogIn }) {
  const features = [
    { icon: "🔄", title: "Adaptive Workouts", desc: "Plans that adjust daily based on how you feel, sleep, stress, and soreness" },
    { icon: "🩺", title: "Injury-Aware Training", desc: "100 conditions mapped to safe exercises. Never guess what's safe again" },
    { icon: "📊", title: "PT-Grade Exercise Science", desc: "300 exercises from NASM, McKenzie, ACE, and NSCA — with full transparency" },
    { icon: "🎯", title: "Built For You", desc: "See exactly WHY each exercise was chosen and what was excluded" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, padding: "40px 0 20px", textAlign: "center" }}>
      <div>
        <div style={{ fontSize: 48, fontWeight: 800, color: C.teal, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 6 }}>APEX</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 4, marginTop: -4 }}>COACH</div>
        <div style={{ fontSize: 13, color: C.textMuted, marginTop: 8 }}>Your AI-Powered Training Team</div>
      </div>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
        {features.map(f => (
          <div key={f.title} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, textAlign: "left", display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 28, flexShrink: 0 }}>{f.icon}</span>
            <div><div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{f.title}</div><div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{f.desc}</div></div>
          </div>
        ))}
      </div>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
        <Btn onClick={onSignUp} icon="🚀">Create Account</Btn>
        <Btn onClick={onLogIn} variant="dark">Log In</Btn>
      </div>
      <div style={{ fontSize: 11, color: C.textDim, maxWidth: 300, lineHeight: 1.6 }}>Built by athletes, for athletes. Evidence-based. Never generic.</div>
    </div>
  );
}

// ── Sign Up ───────────────────────────────────────────────────
export function SignUpScreen({ onBack, onSuccess }) {
  const { signUp } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!firstName.trim()) return setError("First name is required");
    if (!email.trim()) return setError("Email is required");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    setLoading(true);
    try {
      const { data, error: err } = await signUp(email.trim(), password, firstName.trim());
      setLoading(false);
      if (err) {
        console.error("SignUp UI error:", err);
        if (err.message?.includes("already registered")) setError("An account with this email already exists. Try logging in.");
        else if (err.message?.includes("fetch") || err.message?.includes("load") || err.message?.includes("network")) setError("Network error — could not reach the server. Check your connection and try again.");
        else setError(err.message || "Sign up failed — check console for details");
      } else {
        console.log("SignUp UI success, user:", data?.user?.id);
        onSuccess?.();
      }
    } catch (e) {
      setLoading(false);
      console.error("SignUp UI exception:", e);
      setError("Unexpected error: " + (e.message || "unknown") + " — check browser console");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div><div style={{ fontSize: 28, fontWeight: 800, color: C.teal, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 3 }}>CREATE ACCOUNT</div><div style={{ fontSize: 12, color: C.textMuted }}>Start your personalized training journey</div></div>
      <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" />
      <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" />
      <Input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (6+ characters)" type="password" />
      {error && <div style={{ padding: 12, background: C.danger + "15", borderRadius: 10, border: `1px solid ${C.danger}30`, fontSize: 12, color: C.danger }}>{error}</div>}
      <Btn onClick={handleSubmit} disabled={loading} icon={loading ? "⏳" : "🚀"}>{loading ? "Creating..." : "Create Account"}</Btn>
      <Btn variant="ghost" onClick={onBack}>← Back</Btn>
    </div>
  );
}

// ── Log In ────────────────────────────────────────────────────
export function LogInScreen({ onBack, onForgot, onSuccess }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim() || !password) return setError("Email and password required");
    setLoading(true);
    const { error: err } = await signIn(email.trim(), password);
    setLoading(false);
    if (err) {
      if (err.message?.includes("Invalid login")) setError("Wrong email or password. Try again.");
      else if (err.message?.includes("Email not confirmed")) setError("Check your email to confirm your account first.");
      else setError(err.message || "Login failed");
    } else {
      onSuccess?.();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div><div style={{ fontSize: 28, fontWeight: 800, color: C.teal, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 3 }}>WELCOME BACK</div><div style={{ fontSize: 12, color: C.textMuted }}>Log in to continue training</div></div>
      <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" />
      <Input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" />
      {error && <div style={{ padding: 12, background: C.danger + "15", borderRadius: 10, border: `1px solid ${C.danger}30`, fontSize: 12, color: C.danger }}>{error}</div>}
      <Btn onClick={handleSubmit} disabled={loading} icon={loading ? "⏳" : "→"}>{loading ? "Logging in..." : "Log In"}</Btn>
      <button onClick={onForgot} style={{ background: "none", border: "none", color: C.teal, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Forgot password?</button>
      <Btn variant="ghost" onClick={onBack}>← Back</Btn>
    </div>
  );
}

// ── Forgot Password ───────────────────────────────────────────
export function ForgotPasswordScreen({ onBack }) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim()) return setError("Enter your email");
    setLoading(true);
    const { error: err } = await resetPassword(email.trim());
    setLoading(false);
    if (err) setError(err.message || "Reset failed");
    else setSent(true);
  };

  if (sent) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "center", paddingTop: 40 }}>
      <div style={{ fontSize: 48 }}>📧</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>CHECK YOUR EMAIL</div>
      <div style={{ fontSize: 13, color: C.textMuted }}>We sent a password reset link to <b style={{ color: C.teal }}>{email}</b></div>
      <Btn variant="dark" onClick={onBack}>← Back to Login</Btn>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div><div style={{ fontSize: 28, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>RESET PASSWORD</div><div style={{ fontSize: 12, color: C.textMuted }}>We'll send you a reset link</div></div>
      <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" />
      {error && <div style={{ padding: 12, background: C.danger + "15", borderRadius: 10, border: `1px solid ${C.danger}30`, fontSize: 12, color: C.danger }}>{error}</div>}
      <Btn onClick={handleSubmit} disabled={loading}>{loading ? "Sending..." : "Send Reset Link"}</Btn>
      <Btn variant="ghost" onClick={onBack}>← Back</Btn>
    </div>
  );
}

// ── Profile / Settings ────────────────────────────────────────
export function ProfileScreen({ onClose, onRetakeAssessment, onEditInjuries, onViewSummary, onViewPlan }) {
  const { user, profile, signOut } = useAuth();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: C.teal, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 3 }}>PROFILE</div>
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{profile?.first_name || "User"}</div>
        <div style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>{user?.email}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
          <div style={{ textAlign: "center", padding: 12, background: C.bgElevated, borderRadius: 10 }}><div style={{ fontSize: 18, fontWeight: 800, color: C.teal, fontFamily: "'Bebas Neue',sans-serif" }}>Phase {profile?.current_phase || 1}</div><div style={{ fontSize: 9, color: C.textDim }}>CURRENT PHASE</div></div>
          <div style={{ textAlign: "center", padding: 12, background: C.bgElevated, borderRadius: 10 }}><div style={{ fontSize: 18, fontWeight: 800, color: C.teal, fontFamily: "'Bebas Neue',sans-serif" }}>Week {profile?.current_week || 1}</div><div style={{ fontSize: 9, color: C.textDim }}>CURRENT WEEK</div></div>
        </div>
        <div style={{ fontSize: 10, color: C.textDim, marginTop: 10 }}>Account created: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</div>
      </div>
      {onViewSummary && <Btn variant="dark" onClick={onViewSummary} icon="📊">Review My Assessment Summary</Btn>}
      {onViewPlan && <Btn variant="dark" onClick={onViewPlan} icon="📋">View 12-Month Plan</Btn>}
      {onRetakeAssessment && <Btn variant="dark" onClick={onRetakeAssessment} icon="🔄">Retake Assessment</Btn>}
      {onEditInjuries && <Btn variant="dark" onClick={onEditInjuries} icon="🩺">Edit Injuries & Conditions</Btn>}
      <Btn variant="dark" onClick={async () => { await signOut(); onClose(); }} icon="🚪" style={{ color: C.danger, borderColor: C.danger + "30" }}>Log Out</Btn>
      <Btn variant="ghost" onClick={onClose}>← Back to Home</Btn>
    </div>
  );
}
