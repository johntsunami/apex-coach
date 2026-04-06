import { useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthProvider.jsx";
import { supabase } from "../utils/supabase.js";
import { getSportPrefs, saveSportPrefs } from "../utils/storage.js";
import { getAssessment } from "./Onboarding.jsx";
import { exportProfile, exportWorkout, isDevExportEnabled, exportDevDiagnostic } from "../utils/dataExport.js";
import { isDeveloper } from "./BugReport.jsx";

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
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMsg, setResendMsg] = useState(null);
  const cooldownRef = useRef(null);
  // Clear all fields on mount to prevent stale data from previous user
  useEffect(() => { setFirstName(""); setEmail(""); setPassword(""); setError(null); }, []);
  useEffect(() => { return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }; }, []);

  // Poll for email confirmation when on confirmation screen
  useEffect(() => {
    if (!showConfirmation) return;
    const poll = setInterval(async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user?.email_confirmed_at) {
        clearInterval(poll);
        onSuccess?.();
      }
    }, 3000);
    return () => clearInterval(poll);
  }, [showConfirmation, onSuccess]);

  const startCooldown = () => {
    setResendCooldown(60);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => { if (prev <= 1) { clearInterval(cooldownRef.current); return 0; } return prev - 1; });
    }, 1000);
  };

  const handleResend = async () => {
    setResendMsg(null);
    const { error: err } = await supabase.auth.resend({ type: "signup", email: email.trim() });
    if (err) setResendMsg({ type: "error", text: err.message });
    else { setResendMsg({ type: "success", text: "Confirmation email resent!" }); startCooldown(); }
  };

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
        // If email confirmation is required, Supabase returns a user but no session
        // If email confirmation is disabled, user gets a session immediately
        if (data?.session) {
          // No email confirmation needed — proceed directly
          onSuccess?.();
        } else {
          // Email confirmation required — show confirmation screen
          setShowConfirmation(true);
          startCooldown();
        }
      }
    } catch (e) {
      setLoading(false);
      console.error("SignUp UI exception:", e);
      setError("Unexpected error: " + (e.message || "unknown") + " — check browser console");
    }
  };

  if (showConfirmation) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "center", paddingTop: 20 }}>
      <div style={{ fontSize: 56 }}>📧</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: C.teal, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 3 }}>CHECK YOUR EMAIL</div>
      <div style={{ fontSize: 14, color: C.text, lineHeight: 1.6 }}>
        We sent a confirmation link to<br/><b style={{ color: C.teal }}>{email}</b>
      </div>
      <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>
        Tap the link in your email to activate your account, then come back here.
      </div>
      <div style={{ padding: 16, background: C.bgCard, borderRadius: 14, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 11, color: C.textDim, lineHeight: 1.5 }}>
          Didn't get it? Check your <b style={{ color: C.textMuted }}>spam folder</b>.<br/>
          The email comes from <b style={{ color: C.textMuted }}>noreply@mail.app.supabase.io</b>
        </div>
      </div>
      {resendMsg && <div style={{ padding: 10, borderRadius: 10, fontSize: 12, background: resendMsg.type === "error" ? C.danger + "15" : C.success + "15", color: resendMsg.type === "error" ? C.danger : C.success, border: `1px solid ${resendMsg.type === "error" ? C.danger : C.success}30` }}>{resendMsg.text}</div>}
      <Btn variant="dark" onClick={handleResend} disabled={resendCooldown > 0}>
        {resendCooldown > 0 ? `Resend Email (${resendCooldown}s)` : "Resend Email"}
      </Btn>
      <Btn variant="ghost" onClick={onBack}>← Back</Btn>
    </div>
  );

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
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMsg, setResendMsg] = useState(null);
  const cooldownRef = useRef(null);
  useEffect(() => { setEmail(""); setPassword(""); setError(null); }, []);
  useEffect(() => { return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }; }, []);
  const [loading, setLoading] = useState(false);

  const startCooldown = () => {
    setResendCooldown(60);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => { if (prev <= 1) { clearInterval(cooldownRef.current); return 0; } return prev - 1; });
    }, 1000);
  };

  const handleResendFromLogin = async () => {
    setResendMsg(null);
    const { error: err } = await supabase.auth.resend({ type: "signup", email: email.trim() });
    if (err) setResendMsg({ type: "error", text: err.message });
    else { setResendMsg({ type: "success", text: "Confirmation email resent! Check your inbox." }); startCooldown(); }
  };

  const handleSubmit = async () => {
    setError(null);
    setUnconfirmed(false);
    setResendMsg(null);
    if (!email.trim() || !password) return setError("Email and password required");
    setLoading(true);
    const { error: err } = await signIn(email.trim(), password);
    setLoading(false);
    if (err) {
      if (err.message?.includes("Invalid login")) setError("Wrong email or password. Try again.");
      else if (err.message?.includes("Email not confirmed")) {
        setUnconfirmed(true);
        setError("Please confirm your email first. Check your inbox for the confirmation link.");
      }
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
      {unconfirmed && <>
        {resendMsg && <div style={{ padding: 10, borderRadius: 10, fontSize: 12, background: resendMsg.type === "error" ? C.danger + "15" : C.success + "15", color: resendMsg.type === "error" ? C.danger : C.success, border: `1px solid ${resendMsg.type === "error" ? C.danger : C.success}30` }}>{resendMsg.text}</div>}
        <Btn variant="dark" onClick={handleResendFromLogin} disabled={resendCooldown > 0}>
          {resendCooldown > 0 ? `Resend Confirmation (${resendCooldown}s)` : "Resend Confirmation Email"}
        </Btn>
        <div style={{ fontSize: 11, color: C.textDim, textAlign: "center" }}>
          Your link may have expired. Tap above to get a new one.
        </div>
      </>}
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
const ALL_SPORTS = ["Basketball","Soccer","Baseball/Softball","Tennis","Golf","Swimming","Running/Track","Cycling","Hiking","Rock Climbing","CrossFit","Boxing/Kickboxing","MMA/BJJ","Wrestling","Volleyball","Football","Yoga","Pilates","Dance","Rowing","Skiing/Snowboarding","Surfing","Skateboarding","Pickleball","Martial Arts","Muay Thai"];

export function ProfileScreen({ onClose, onRetakeAssessment, onEditInjuries, onViewSummary, onViewPlan, onStartFresh, onSportChange, onDevBugs, onDevTest }) {
  const { user, profile, signOut } = useAuth();
  const [showFreshConfirm, setShowFreshConfirm] = useState(false);
  const [freshInput, setFreshInput] = useState("");
  const [showCondHistory, setShowCondHistory] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  // ── Sport preferences state ──
  const [sportList, setSportList] = useState([]);
  const [showAddSport, setShowAddSport] = useState(false);
  const [sportSearch, setSportSearch] = useState("");
  const [customSport, setCustomSport] = useState("");

  // Initialize from localStorage or migrate from assessment
  useEffect(() => {
    let saved = getSportPrefs();
    if (saved.length === 0) {
      const assessment = getAssessment();
      const legacy = assessment?.preferences?.sports || [];
      if (legacy.length > 0) {
        saved = legacy.filter(s => s !== "None").map((s, i) => ({ sport: s, rank: i + 1 }));
        saveSportPrefs(saved);
      }
    }
    setSportList(saved);
  }, []);

  const updateSports = (newList) => {
    // Re-rank
    const ranked = newList.map((s, i) => ({ sport: s.sport, rank: i + 1 }));
    setSportList(ranked);
    saveSportPrefs(ranked);
    if (onSportChange) onSportChange();
  };

  const moveSport = (idx, dir) => {
    const next = [...sportList];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    updateSports(next);
  };

  const removeSport = (idx) => {
    const next = sportList.filter((_, i) => i !== idx);
    updateSports(next);
  };

  const addSport = (name) => {
    if (sportList.some(s => s.sport === name)) return;
    if (sportList.length >= 3) return; // Hard cap at 3
    updateSports([...sportList, { sport: name, rank: sportList.length + 1 }]);
    setShowAddSport(false);
    setSportSearch("");
  };

  const atMax = sportList.length >= 3;
  const rankColors = ["#FFD700", "#C0C0C0", "#CD7F32"]; // gold, silver, bronze
  const rankLabel = (rank) => {
    if (sportList.length === 1) return "PRIMARY — 100% focus";
    if (sportList.length === 2) return rank === 1 ? "PRIMARY — 70% focus" : "SECONDARY — 30% focus";
    return rank === 1 ? "PRIMARY — 60% focus" : rank === 2 ? "SECONDARY — 30% focus" : "TERTIARY — 10% focus";
  };
  const rankColor = (rank) => rankColors[rank - 1] || C.textDim;

  // Condition history from localStorage
  let condHistory = [];
  try { condHistory = JSON.parse(localStorage.getItem("apex_injury_history") || "[]"); } catch {}
  const resolvedEntries = condHistory.filter(h => h.action === "updated" && h.details?.status === "resolved");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: C.teal, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 3 }}>SETTINGS</div>
      {/* User card */}
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{profile?.first_name || "User"}</div>
        <div style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>{user?.email}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
          <div style={{ textAlign: "center", padding: 12, background: C.bgElevated, borderRadius: 10 }}><div style={{ fontSize: 18, fontWeight: 800, color: C.teal, fontFamily: "'Bebas Neue',sans-serif" }}>Phase {profile?.current_phase || 1}</div><div style={{ fontSize: 9, color: C.textDim }}>CURRENT PHASE</div></div>
          <div style={{ textAlign: "center", padding: 12, background: C.bgElevated, borderRadius: 10 }}><div style={{ fontSize: 18, fontWeight: 800, color: C.teal, fontFamily: "'Bebas Neue',sans-serif" }}>Week {profile?.current_week || 1}</div><div style={{ fontSize: 9, color: C.textDim }}>CURRENT WEEK</div></div>
        </div>
        <div style={{ fontSize: 10, color: C.textDim, marginTop: 10 }}>Account created: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</div>
      </div>

      {/* Quick actions */}
      {onViewSummary && <Btn variant="dark" onClick={onViewSummary} icon="📊">Review My Assessment</Btn>}
      {onViewPlan && <Btn variant="dark" onClick={onViewPlan} icon="📋">View 12-Month Plan</Btn>}

      {/* ═══ MY SPORTS & ACTIVITIES ═══ */}
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim, letterSpacing: 2, marginBottom: 8 }}>MY SPORTS & ACTIVITIES</div>
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14 }}>
          {sportList.length === 0 ? (
            <div style={{ fontSize: 12, color: C.textMuted, textAlign: "center", padding: "8px 0" }}>No sports selected. Add your sports to get sport-specific training.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {sportList.map((sp, idx) => (
                <div key={sp.sport} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: C.bgElevated, borderRadius: 10, border: `1px solid ${rankColor(sp.rank)}30` }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: rankColor(sp.rank) + "30", color: rankColor(sp.rank), fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>#{sp.rank}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{sp.sport}</div>
                    <div style={{ fontSize: 8, color: rankColor(sp.rank), fontWeight: 700, letterSpacing: 0.5 }}>{rankLabel(sp.rank)}</div>
                  </div>
                  <div style={{ display: "flex", gap: 2 }}>
                    <button onClick={() => moveSport(idx, -1)} disabled={idx === 0} style={{ width: 24, height: 24, borderRadius: 6, border: "none", background: idx === 0 ? "transparent" : C.bgCard, color: idx === 0 ? C.textDim : C.text, cursor: idx === 0 ? "default" : "pointer", fontSize: 12, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}>▲</button>
                    <button onClick={() => moveSport(idx, 1)} disabled={idx === sportList.length - 1} style={{ width: 24, height: 24, borderRadius: 6, border: "none", background: idx === sportList.length - 1 ? "transparent" : C.bgCard, color: idx === sportList.length - 1 ? C.textDim : C.text, cursor: idx === sportList.length - 1 ? "default" : "pointer", fontSize: 12, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}>▼</button>
                  </div>
                  <button onClick={() => removeSport(idx)} style={{ width: 24, height: 24, borderRadius: 6, border: "none", background: C.danger + "15", color: C.danger, cursor: "pointer", fontSize: 12, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => { if (!atMax) setShowAddSport(true); }} disabled={atMax} style={{ width: "100%", marginTop: 10, padding: "10px 14px", borderRadius: 10, background: atMax ? C.bgElevated : C.teal + "10", border: `1px dashed ${atMax ? C.border : C.teal + "40"}`, color: atMax ? C.textDim : C.teal, fontSize: 12, fontWeight: 600, cursor: atMax ? "default" : "pointer", fontFamily: "inherit", opacity: atMax ? 0.5 : 1 }}>{atMax ? "3 sport maximum reached" : "+ Add Sport"}</button>
          {sportList.length > 0 && <div style={{ fontSize: 9, color: C.textDim, marginTop: 8, lineHeight: 1.5 }}>{sportList.length === 1 ? "All sport-specific training focused on " + sportList[0].sport + ". This gives you the fastest improvement." : "Reorder to change priority. #1 gets the most training focus."}</div>}
        </div>
      </div>

      {/* ── Add Sport Modal ── */}
      {showAddSport && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => { setShowAddSport(false); setSportSearch(""); setCustomSport(""); }}>
          <div style={{ background: C.bg, borderRadius: "20px 20px 0 0", padding: 20, width: "100%", maxWidth: 420, maxHeight: "70vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.teal, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2, marginBottom: 10 }}>ADD SPORT</div>
            <input value={sportSearch} onChange={e => setSportSearch(e.target.value)} placeholder="Search sports..." style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: C.bgCard, border: `1px solid ${C.border}`, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 10 }} />
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexWrap: "wrap", gap: 6, alignContent: "flex-start" }}>
              {ALL_SPORTS.filter(s => {
                const q = sportSearch.toLowerCase();
                return (!q || s.toLowerCase().includes(q)) && !sportList.some(sp => sp.sport === s);
              }).map(s => (
                <button key={s} onClick={() => addSport(s)} style={{ padding: "8px 14px", borderRadius: 20, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>{s}</button>
              ))}
            </div>
            {/* Custom sport */}
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <input value={customSport} onChange={e => setCustomSport(e.target.value)} placeholder="Custom sport..." style={{ flex: 1, padding: "10px 12px", borderRadius: 10, background: C.bgCard, border: `1px solid ${C.border}`, color: C.text, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              <button onClick={() => { if (customSport.trim()) { addSport(customSport.trim()); setCustomSport(""); } }} disabled={!customSport.trim()} style={{ padding: "10px 16px", borderRadius: 10, background: customSport.trim() ? C.teal : C.bgElevated, color: customSport.trim() ? "#000" : C.textDim, border: "none", fontWeight: 700, fontSize: 12, cursor: customSport.trim() ? "pointer" : "default", fontFamily: "inherit" }}>+ Add</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ THREE UPDATE OPTIONS ═══ */}
      <div style={{ marginTop: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim, letterSpacing: 2, marginBottom: 8 }}>UPDATE YOUR PLAN</div>

        {/* OPTION 1: Update Conditions (Primary — teal) */}
        {onEditInjuries && <div style={{ marginBottom: 8 }}>
          <button onClick={onEditInjuries} style={{
            width: "100%", padding: "16px 20px", borderRadius: 14, cursor: "pointer", fontFamily: "inherit",
            background: `linear-gradient(135deg, ${C.teal}, ${C.teal}dd)`, color: "#000", border: "none",
            display: "flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 14,
          }}>
            <span style={{ fontSize: 18 }}>🩺</span>
            <div style={{ textAlign: "left" }}>
              <div>Update My Conditions</div>
              <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.7 }}>Add, heal, or adjust injury severity. Quick update — no full reassessment.</div>
            </div>
          </button>
        </div>}

        {/* OPTION 2: Retake Full Assessment (Secondary — outlined) */}
        {onRetakeAssessment && <div style={{ marginBottom: 8 }}>
          <button onClick={onRetakeAssessment} style={{
            width: "100%", padding: "14px 20px", borderRadius: 14, cursor: "pointer", fontFamily: "inherit",
            background: "transparent", color: C.teal, border: `1px solid ${C.teal}40`,
            display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600,
          }}>
            <span style={{ fontSize: 16 }}>🔄</span>
            <div style={{ textAlign: "left" }}>
              <div>Retake Full Assessment</div>
              <div style={{ fontSize: 10, fontWeight: 400, color: C.textMuted }}>Update goals, equipment, ROM, medications. History preserved.</div>
            </div>
          </button>
        </div>}

        {/* OPTION 3: Start Fresh (Small text link — red) */}
        <div style={{ textAlign: "center", marginTop: 4 }}>
          <button onClick={() => setShowFreshConfirm(true)} style={{
            background: "none", border: "none", color: C.danger, fontSize: 11,
            cursor: "pointer", fontFamily: "inherit", opacity: 0.7, textDecoration: "underline",
          }}>Erase all data and start over</button>
        </div>
      </div>

      {/* ═══ DATA EXPORT ═══ */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim, letterSpacing: 2, marginBottom: 8 }}>EXPORT MY DATA</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button onClick={() => { try { exportProfile(); } catch (e) { console.warn("Profile export error:", e); } }} style={{
            width: "100%", padding: "12px 16px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
            background: C.bgCard, border: `1px solid ${C.border}`, color: C.text,
            display: "flex", alignItems: "center", gap: 10, fontSize: 12, fontWeight: 600, textAlign: "left",
          }}>
            <span style={{ fontSize: 16 }}>📋</span>
            <div>
              <div>Export Profile & Assessment</div>
              <div style={{ fontSize: 9, fontWeight: 400, color: C.textMuted }}>Conditions, goals, ROM, baseline, preferences — easy-to-read summary</div>
            </div>
          </button>
          <button onClick={() => { try { exportWorkout(); } catch (e) { console.warn("Workout export error:", e); } }} style={{
            width: "100%", padding: "12px 16px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
            background: C.bgCard, border: `1px solid ${C.border}`, color: C.text,
            display: "flex", alignItems: "center", gap: 10, fontSize: 12, fontWeight: 600, textAlign: "left",
          }}>
            <span style={{ fontSize: 16 }}>🏋️</span>
            <div>
              <div>Export Workout Plan</div>
              <div style={{ fontSize: 9, fontWeight: 400, color: C.textMuted }}>Weekly plan, exercises, volume, PT protocols, adaptations — easy-to-read summary</div>
            </div>
          </button>
        </div>
        <div style={{ fontSize: 9, color: C.textDim, marginTop: 6, textAlign: "center" }}>Downloads a readable summary of your data</div>
        {isDevExportEnabled() && <button onClick={() => { try { exportDevDiagnostic(); } catch (e) { console.warn("Dev export error:", e); } }} style={{
          width: "100%", padding: "12px 16px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", marginTop: 6,
          background: C.bgElevated, border: `1px solid ${C.purple}40`, color: C.purple,
          display: "flex", alignItems: "center", gap: 10, fontSize: 12, fontWeight: 600, textAlign: "left",
        }}>
          <span style={{ fontSize: 16 }}>🔧</span>
          <div>
            <div>Developer Diagnostic Export</div>
            <div style={{ fontSize: 9, fontWeight: 400, color: C.textMuted }}>Full raw data, exercise schemas, overload history, substitutions, overtraining signals</div>
          </div>
        </button>}
      </div>

      {/* ═══ DEVELOPER TOOLS (whitelisted emails only) ═══ */}
      {isDeveloper(user) && <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.purple, letterSpacing: 2, marginBottom: 8 }}>DEVELOPER TOOLS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {onDevBugs && <button onClick={onDevBugs} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
            background: C.bgCard, border: `1px solid ${C.danger}30`, color: C.text, display: "flex", alignItems: "center", gap: 10, fontSize: 12, fontWeight: 600, textAlign: "left" }}>
            <span style={{ fontSize: 16 }}>🐛</span><div><div>Bug Report Dashboard</div><div style={{ fontSize: 9, fontWeight: 400, color: C.textMuted }}>View and manage all user-submitted bug reports</div></div>
          </button>}
          {onDevTest && <button onClick={onDevTest} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
            background: C.bgCard, border: `1px solid ${C.purple}30`, color: C.text, display: "flex", alignItems: "center", gap: 10, fontSize: 12, fontWeight: 600, textAlign: "left" }}>
            <span style={{ fontSize: 16 }}>🔧</span><div><div>Workout Generation Tester</div><div style={{ fontSize: 9, fontWeight: 400, color: C.textMuted }}>Test workout plans across 8 simulated user profiles</div></div>
          </button>}
          <div style={{ display: "flex", gap: 6 }}>
            <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "8px 10px", borderRadius: 8, background: C.bgCard, border: `1px solid ${C.border}`, color: C.textMuted, fontSize: 10, textAlign: "center", textDecoration: "none", fontFamily: "inherit" }}>Supabase</a>
            <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "8px 10px", borderRadius: 8, background: C.bgCard, border: `1px solid ${C.border}`, color: C.textMuted, fontSize: 10, textAlign: "center", textDecoration: "none", fontFamily: "inherit" }}>Vercel</a>
            <a href="https://github.com/johntsunami/apex-coach" target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "8px 10px", borderRadius: 8, background: C.bgCard, border: `1px solid ${C.border}`, color: C.textMuted, fontSize: 10, textAlign: "center", textDecoration: "none", fontFamily: "inherit" }}>GitHub</a>
          </div>
        </div>
      </div>}

      {/* ═══ CONDITION HISTORY ═══ */}
      {resolvedEntries.length > 0 && <div>
        <button onClick={() => setShowCondHistory(!showCondHistory)} style={{
          width: "100%", padding: "10px 14px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
          background: C.bgCard, border: `1px solid ${C.border}`, color: C.textMuted, fontSize: 11, fontWeight: 600,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span>📜 Condition History ({resolvedEntries.length} resolved)</span>
          <span style={{ transform: showCondHistory ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>▸</span>
        </button>
        {showCondHistory && <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderTop: "none", borderRadius: "0 0 12px 12px", padding: 12 }}>
          {resolvedEntries.map((h, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < resolvedEntries.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div>
                <div style={{ fontSize: 11, color: C.success, fontWeight: 600 }}>{h.area} — Resolved</div>
                <div style={{ fontSize: 9, color: C.textDim }}>Resolved {new Date(h.date).toLocaleDateString()}</div>
              </div>
              <span style={{ fontSize: 9, color: C.success, background: C.success + "15", padding: "2px 6px", borderRadius: 4, alignSelf: "center" }}>✓</span>
            </div>
          ))}
        </div>}
      </div>}

      {/* ═══ START FRESH CONFIRMATION ═══ */}
      {showFreshConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setShowFreshConfirm(false)}>
          <div style={{ background: C.bg, border: `1px solid ${C.danger}40`, borderRadius: 20, padding: 24, maxWidth: 380, width: "100%" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.danger, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2, marginBottom: 8 }}>START FRESH</div>
            <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6, marginBottom: 12 }}>
              This will delete <b>ALL</b> your data including workout history, exercise progress, strength records, PT session logs, and streaks. Your account stays but everything else resets to zero.
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.danger, marginBottom: 12 }}>This cannot be undone.</div>
            <div style={{ fontSize: 10, color: C.textDim, marginBottom: 8 }}>Type <b>RESET</b> to confirm:</div>
            <input value={freshInput} onChange={e => setFreshInput(e.target.value)} placeholder="Type RESET" style={{
              width: "100%", padding: "10px 14px", borderRadius: 10, background: C.bgElevated,
              border: `1px solid ${freshInput === "RESET" ? C.danger : C.border}`, color: C.text,
              fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 12,
              textAlign: "center", fontWeight: 700, letterSpacing: 3,
            }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setShowFreshConfirm(false); setFreshInput(""); }} style={{
                flex: 1, padding: "12px", borderRadius: 12, background: C.bgElevated,
                border: `1px solid ${C.border}`, color: C.textMuted, fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}>Cancel</button>
              <button onClick={() => { if (freshInput === "RESET" && onStartFresh) { onStartFresh(); setShowFreshConfirm(false); } }} disabled={freshInput !== "RESET"} style={{
                flex: 1, padding: "12px", borderRadius: 12,
                background: freshInput === "RESET" ? C.danger : C.bgElevated,
                border: `1px solid ${freshInput === "RESET" ? C.danger : C.border}`,
                color: freshInput === "RESET" ? "#fff" : C.textDim,
                fontSize: 13, fontWeight: 700, cursor: freshInput === "RESET" ? "pointer" : "not-allowed",
                fontFamily: "inherit", opacity: freshInput === "RESET" ? 1 : 0.4,
              }}>Erase Everything</button>
            </div>
          </div>
        </div>
      )}

      <Btn variant="dark" onClick={async () => { await signOut(); onClose(); }} icon="🚪" style={{ color: C.danger, borderColor: C.danger + "30" }}>Log Out</Btn>
      <Btn variant="ghost" onClick={onClose}>← Back to Home</Btn>

      {/* Delete account link — small, hard to accidentally tap */}
      <div style={{ textAlign: "center", marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
        <button onClick={() => setShowDeleteConfirm(true)} style={{
          background: "none", border: "none", color: C.danger, fontSize: 10,
          cursor: "pointer", fontFamily: "inherit", opacity: 0.5,
        }}>Delete my account permanently</button>
      </div>

      {/* ═══ DELETE ACCOUNT CONFIRMATION ═══ */}
      {showDeleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => { if (!deleting) { setShowDeleteConfirm(false); setDeleteInput(""); } }}>
          <div style={{ background: C.bg, border: `1px solid ${C.danger}60`, borderRadius: 20, padding: 24, maxWidth: 380, width: "100%" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.danger, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2, marginBottom: 8 }}>DELETE ACCOUNT</div>
            <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6, marginBottom: 8 }}>
              This permanently deletes your account and <b>ALL</b> data including workout history, exercise progress, strength records, PT session logs, streaks, and your profile.
            </div>
            <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6, marginBottom: 8 }}>
              You will be logged out and <b>cannot recover this account</b>.
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.danger, marginBottom: 12 }}>This cannot be undone.</div>
            <div style={{ fontSize: 10, color: C.textDim, marginBottom: 8 }}>Type <b>DELETE</b> to confirm:</div>
            <input value={deleteInput} onChange={e => setDeleteInput(e.target.value)} placeholder="Type DELETE" disabled={deleting} style={{
              width: "100%", padding: "10px 14px", borderRadius: 10, background: C.bgElevated,
              border: `1px solid ${deleteInput === "DELETE" ? C.danger : C.border}`, color: C.text,
              fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 12,
              textAlign: "center", fontWeight: 700, letterSpacing: 3,
            }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }} disabled={deleting} style={{
                flex: 1, padding: "12px", borderRadius: 12, background: C.bgElevated,
                border: `1px solid ${C.border}`, color: C.textMuted, fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}>Cancel</button>
              <button onClick={async () => {
                if (deleteInput !== "DELETE" || deleting) return;
                setDeleting(true);
                try {
                  // Import supabase dynamically to avoid circular deps
                  const { supabase } = await import("../utils/supabase.js");
                  const uid = user?.id;
                  if (uid) {
                    // Delete all user data from every table
                    const tables = ["sessions","session_reflections","user_exercise_progress","user_conditions","user_compensations","user_goals","user_equipment","user_rom","user_preferences","capability_tags","weekly_volume","pt_protocols","pt_sessions","pt_reminders","exercise_swaps","overtraining_assessments","cardio_sessions","vo2_tests","exercise_image_overrides","exercise_youtube_overrides","reassessment_logs"];
                    for (const t of tables) {
                      await supabase.from(t).delete().eq("user_id", uid).catch(() => {});
                    }
                    // Delete profile row
                    await supabase.from("profiles").delete().eq("id", uid).catch(() => {});
                  }
                  // Clear all localStorage
                  const lsKeys = Object.keys(localStorage).filter(k => k.startsWith("apex_"));
                  lsKeys.forEach(k => localStorage.removeItem(k));
                  localStorage.removeItem("apex_assessment");
                  // Sign out
                  await signOut();
                } catch (e) {
                  console.error("Account deletion error:", e);
                }
                setDeleting(false);
                setShowDeleteConfirm(false);
                onClose();
              }} disabled={deleteInput !== "DELETE" || deleting} style={{
                flex: 1, padding: "12px", borderRadius: 12,
                background: deleteInput === "DELETE" && !deleting ? C.danger : C.bgElevated,
                border: `1px solid ${deleteInput === "DELETE" ? C.danger : C.border}`,
                color: deleteInput === "DELETE" && !deleting ? "#fff" : C.textDim,
                fontSize: 13, fontWeight: 700, cursor: deleteInput === "DELETE" && !deleting ? "pointer" : "not-allowed",
                fontFamily: "inherit", opacity: deleteInput === "DELETE" && !deleting ? 1 : 0.4,
              }}>{deleting ? "Deleting..." : "Delete Forever"}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: 90 }} />
    </div>
  );
}

// ── Save to Home Screen Modal ────────────────────────────────
export function SaveToHomeScreenModal({ onDismiss, onRemindLater }) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(navigator.userAgent);

  const stepStyle = { display: "flex", gap: 10, alignItems: "flex-start", textAlign: "left" };
  const numStyle = { width: 24, height: 24, borderRadius: 12, background: C.teal, color: "#000", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onDismiss}>
      <div style={{ background: C.bg, border: `1px solid ${C.teal}30`, borderRadius: 20, padding: 24, maxWidth: 380, width: "100%", maxHeight: "85vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📱</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.teal, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 3 }}>ADD TO HOME SCREEN</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Access your workouts instantly — no app store needed.</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          {isIOS ? (<>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text, letterSpacing: 1 }}>IPHONE / IPAD (SAFARI)</div>
            <div style={stepStyle}><div style={numStyle}>1</div><div style={{ fontSize: 12, color: C.text }}>Tap the <b style={{ color: C.teal }}>Share button</b> <span style={{ fontSize: 16 }}>⬆</span> at the bottom of Safari</div></div>
            <div style={stepStyle}><div style={numStyle}>2</div><div style={{ fontSize: 12, color: C.text }}>Scroll down and tap <b style={{ color: C.teal }}>"Add to Home Screen"</b></div></div>
            <div style={stepStyle}><div style={numStyle}>3</div><div style={{ fontSize: 12, color: C.text }}>Tap <b style={{ color: C.teal }}>"Add"</b> — the app icon appears on your home screen</div></div>
          </>) : isAndroid ? (<>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text, letterSpacing: 1 }}>ANDROID (CHROME)</div>
            <div style={stepStyle}><div style={numStyle}>1</div><div style={{ fontSize: 12, color: C.text }}>Tap the <b style={{ color: C.teal }}>three-dot menu</b> <span style={{ fontSize: 14, fontWeight: 800 }}>⋮</span> in the top right</div></div>
            <div style={stepStyle}><div style={numStyle}>2</div><div style={{ fontSize: 12, color: C.text }}>Tap <b style={{ color: C.teal }}>"Add to Home Screen"</b> or <b style={{ color: C.teal }}>"Install App"</b></div></div>
            <div style={stepStyle}><div style={numStyle}>3</div><div style={{ fontSize: 12, color: C.text }}>Tap <b style={{ color: C.teal }}>"Add"</b> — the app icon appears on your home screen</div></div>
          </>) : (<>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text, letterSpacing: 1 }}>DESKTOP</div>
            <div style={stepStyle}><div style={numStyle}>1</div><div style={{ fontSize: 12, color: C.text }}>Press <b style={{ color: C.teal }}>Ctrl+D</b> (or Cmd+D on Mac) to bookmark this page</div></div>
            <div style={stepStyle}><div style={numStyle}>2</div><div style={{ fontSize: 12, color: C.text }}>Or look for the <b style={{ color: C.teal }}>install icon</b> in your browser's address bar</div></div>
          </>)}
        </div>

        <div style={{ padding: 12, background: C.bgCard, borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 16, textAlign: "center" }}>
          <div style={{ fontSize: 10, color: C.textDim }}>BOOKMARK THIS LINK</div>
          <div style={{ fontSize: 12, color: C.teal, fontWeight: 600, marginTop: 4, wordBreak: "break-all" }}>apex-coach-five.vercel.app</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Btn onClick={onDismiss}>Got It</Btn>
          <Btn variant="dark" onClick={onRemindLater}>Remind Me Later</Btn>
          <button onClick={() => { onDismiss("never"); }} style={{ background: "none", border: "none", color: C.textDim, fontSize: 11, cursor: "pointer", fontFamily: "inherit", padding: 8 }}>Don't show again</button>
        </div>
      </div>
    </div>
  );
}
