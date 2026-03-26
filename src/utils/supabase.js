import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug: log what env vars we received (redacted)
console.log("APEX Supabase config:", {
  url: supabaseUrl ? supabaseUrl.substring(0, 30) + "..." : "MISSING",
  keyPrefix: supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + "..." : "MISSING",
  keyLength: supabaseAnonKey?.length || 0,
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("APEX: Supabase env vars missing — running in offline/localStorage mode");
  console.warn("APEX: Expected VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env or Vercel env vars");
}

// Supabase anon keys are JWTs (start with 'eyJ'). Warn if format looks wrong.
if (supabaseAnonKey && !supabaseAnonKey.startsWith("eyJ")) {
  console.warn("APEX: Anon key doesn't look like a Supabase JWT (expected 'eyJ...'). Check your Supabase dashboard → Settings → API → anon/public key.");
}

let supabase = null;
try {
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("APEX: Supabase client created successfully");
  }
} catch (e) {
  console.error("APEX: Failed to create Supabase client:", e);
}

export { supabase };

export function isSupabaseAvailable() {
  return !!supabase;
}
