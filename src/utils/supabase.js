import { createClient } from "@supabase/supabase-js";

// Supabase public credentials (anon key is designed to be public — RLS protects data)
const SUPABASE_URL = "https://prwvkrftyeeshsgcfnay.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByd3ZrcmZ0eWVlc2hzZ2NmbmF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NDkzNDIsImV4cCI6MjA5MDEyNTM0Mn0.lfPTT0NS00JDRRuR3H5vV9aJKWysrIT1KQ8nb4esubo";

// Use env vars if available, fallback to hardcoded public credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function isSupabaseAvailable() {
  return true;
}
