import { createContext, useContext, useState, useEffect } from "react";
import { supabase, isSupabaseAvailable } from "../utils/supabase.js";

// ═══════════════════════════════════════════════════════════════
// Auth Context — wraps the app, provides user + session + profile
// ═══════════════════════════════════════════════════════════════

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  updateProfile: async () => {},
  refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── User-scoped localStorage management ────────────────────
  // Prevents user A's data from leaking to user B
  function _getLocalUid() { try { return localStorage.getItem("apex_current_uid"); } catch { return null; } }
  function _setLocalUid(uid) { try { localStorage.setItem("apex_current_uid", uid); } catch {} }
  function _clearUserLocalStorage() {
    const userKeys = [
      "apex_assessment","apex_injuries","apex_injury_history","apex_sessions","apex_stats",
      "apex_prefs","apex_paused_workout","apex_last_screen","apex_last_tab",
      "apex_image_overrides","apex_youtube_overrides","apex_baseline_tests",
      "apex_baseline_capabilities","apex_power_records","apex_current_uid",
      "apex_exercise_progress","apex_unlock_notifications","apex_exercise_swaps",
      "apex_overtraining","apex_cardio_sessions","apex_vo2_tests","apex_hr_settings",
      "apex_pt_protocols","apex_pt_sessions","apex_media_pref",
      "apex_hypertrophy_settings","apex_cardio_prefs","apex_daily_workout","apex_carryover",
      "apex_weekly_plan","apex_rotation_indices","apex_weekly_plan_archive",
      "apex_mesocycle","apex_mesocycle_archive",
    ];
    userKeys.forEach(k => { try { localStorage.removeItem(k); } catch {} });
  }

  // Check session on mount + listen for auth changes
  useEffect(() => {
    if (!isSupabaseAvailable()) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      const session = data?.session;
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    }).catch(() => { setLoading(false); });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      // Clear stale localStorage when user changes (prevents data leaking between accounts)
      const prevUid = _getLocalUid();
      if (newUser && prevUid && prevUid !== newUser.id) {
        _clearUserLocalStorage();
      }
      if (newUser) _setLocalUid(newUser.id);
      setUser(newUser);
      if (newUser) fetchProfile(newUser.id);
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (error) throw error;
      setProfile(data);
    } catch (e) {
      console.warn("APEX: Could not fetch profile:", e.message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  async function signUp(email, password, firstName) {
    if (!isSupabaseAvailable()) {
      console.error("APEX signUp: Supabase not available");
      return { error: { message: "Supabase not configured — check env vars" } };
    }
    try {
      console.log("APEX signUp: attempting for", email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { first_name: firstName } },
      });
      if (error) console.error("APEX signUp error:", error.message, error.status, error);
      else console.log("APEX signUp success:", data?.user?.id);
      return { data, error };
    } catch (e) {
      console.error("APEX signUp exception:", e);
      return { error: { message: "Sign up failed: " + (e.message || "unknown error") } };
    }
  }

  async function signIn(email, password) {
    if (!isSupabaseAvailable()) {
      console.error("APEX signIn: Supabase not available");
      return { error: { message: "Supabase not configured — check env vars" } };
    }
    try {
      console.log("APEX signIn: attempting for", email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) console.error("APEX signIn error:", error.message, error.status, error);
      else console.log("APEX signIn success:", data?.user?.id);
      return { data, error };
    } catch (e) {
      console.error("APEX signIn exception:", e);
      return { error: { message: "Login failed: " + (e.message || "unknown error") } };
    }
  }

  async function signOut() {
    if (!isSupabaseAvailable()) return;
    _clearUserLocalStorage();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  async function resetPassword(email) {
    if (!isSupabaseAvailable()) return { error: { message: "Supabase not configured" } };
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    return { data, error };
  }

  async function updateProfile(updates) {
    if (!isSupabaseAvailable() || !user) return { error: { message: "Not authenticated" } };
    const { data, error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select()
      .single();
    if (!error && data) setProfile(data);
    return { data, error };
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, resetPassword, updateProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
