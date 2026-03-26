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

  // Check session on mount + listen for auth changes
  useEffect(() => {
    if (!isSupabaseAvailable()) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
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
      return { error: { message: e.message || "Network error — check your connection" } };
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
      return { error: { message: e.message || "Network error — check your connection" } };
    }
  }

  async function signOut() {
    if (!isSupabaseAvailable()) return;
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
