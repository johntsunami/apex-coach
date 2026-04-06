// ═══════════════════════════════════════════════════════════════
// APEX Coach — Data Sync Utility
// Ensures critical user data persists in Supabase, not just localStorage.
// localStorage serves as a fast CACHE; Supabase is the SOURCE OF TRUTH.
// ═══════════════════════════════════════════════════════════════

// Keys that contain critical user data — MUST be synced to Supabase
const CRITICAL_KEYS = [
  "apex_injuries",
  "apex_injury_history",
  "apex_prefs",
  "apex_baseline_tests",
  "apex_baseline_capabilities",
  "apex_power_records",
  "apex_exercise_effort",
  "apex_exercise_progress",
  "apex_hypertrophy_settings",
  "apex_sports",
  "apex_finger_log",
  "apex_hr_settings",
  "apex_cardio_prefs",
  "apex_mesocycle",
  "apex_unlock_notifications",
  "apex_senior_profile",
  "apex_power_rings",
];

// Keys that are ephemeral or derived — safe to stay localStorage-only
// apex_last_screen, apex_last_tab, apex_paused_workout, apex_daily_workout,
// apex_stats (derived), apex_current_uid, apex_error_log, apex_media_pref,
// apex_breath_prefs, apex_stretch_tracker, apex_carryover, apex_rotation_indices,
// apex_weekly_plan (regenerated), apex_weekly_plan_archive (rebuild from sessions)

/**
 * Sync all critical localStorage data TO Supabase.
 * Bundles into a single JSON blob stored in profiles.client_data.
 * Called after session completion, injury changes, and periodically.
 */
export async function syncCriticalDataToSupabase() {
  try {
    const { supabase, isSupabaseAvailable } = await import("./supabase.js");
    if (!isSupabaseAvailable()) return { synced: false, reason: "supabase_unavailable" };
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return { synced: false, reason: "not_authenticated" };

    const bundle = {};
    let hasData = false;
    for (const key of CRITICAL_KEYS) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          bundle[key] = JSON.parse(raw);
          hasData = true;
        }
      } catch {}
    }

    if (!hasData) return { synced: false, reason: "no_data" };

    const { error } = await supabase
      .from("profiles")
      .update({
        client_data: bundle,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.user.id);

    if (error) {
      console.warn("APEX DataSync: Supabase write failed:", error.message);
      return { synced: false, reason: "write_error", error: error.message };
    }

    console.log(`APEX DataSync: Synced ${Object.keys(bundle).length} critical data keys to Supabase`);
    return { synced: true, keys: Object.keys(bundle).length };
  } catch (e) {
    console.warn("APEX DataSync: sync failed:", e.message);
    return { synced: false, reason: "exception", error: e.message };
  }
}

/**
 * Restore all critical data FROM Supabase into localStorage.
 * Called on login when localStorage is empty (cache clear, new device, user switch).
 */
export async function restoreCriticalDataFromSupabase() {
  try {
    const { supabase, isSupabaseAvailable } = await import("./supabase.js");
    if (!isSupabaseAvailable()) return { restored: false, reason: "supabase_unavailable" };
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return { restored: false, reason: "not_authenticated" };

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("client_data")
      .eq("id", session.user.id)
      .single();

    if (error || !profile?.client_data) {
      return { restored: false, reason: error ? "query_error" : "no_client_data" };
    }

    const bundle = profile.client_data;
    let restoredCount = 0;

    for (const [key, value] of Object.entries(bundle)) {
      if (!CRITICAL_KEYS.includes(key)) continue;
      try {
        // Only restore if localStorage is empty for this key (don't overwrite newer local data)
        const existing = localStorage.getItem(key);
        if (!existing || existing === "[]" || existing === "{}" || existing === "null") {
          localStorage.setItem(key, JSON.stringify(value));
          restoredCount++;
        }
      } catch {}
    }

    if (restoredCount > 0) {
      console.log(`APEX DataSync: Restored ${restoredCount} critical data keys from Supabase`);
    }
    return { restored: true, keys: restoredCount };
  } catch (e) {
    console.warn("APEX DataSync: restore failed:", e.message);
    return { restored: false, reason: "exception", error: e.message };
  }
}

/**
 * Verify data integrity — compare localStorage against Supabase.
 * Supabase wins on conflict (it's the source of truth).
 * Returns a report of any mismatches found.
 */
export async function verifyDataIntegrity() {
  try {
    const { supabase, isSupabaseAvailable } = await import("./supabase.js");
    if (!isSupabaseAvailable()) return null;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("client_data")
      .eq("id", session.user.id)
      .single();

    if (!profile?.client_data) return { status: "no_remote_data" };

    const bundle = profile.client_data;
    const mismatches = [];

    for (const key of CRITICAL_KEYS) {
      try {
        const local = localStorage.getItem(key);
        const remote = bundle[key];
        const localEmpty = !local || local === "[]" || local === "{}" || local === "null";
        const remoteEmpty = !remote || (Array.isArray(remote) && remote.length === 0) || (typeof remote === "object" && Object.keys(remote).length === 0);

        if (localEmpty && !remoteEmpty) {
          // Local is empty but remote has data → restore from remote
          localStorage.setItem(key, JSON.stringify(remote));
          mismatches.push({ key, action: "restored_from_supabase" });
        } else if (!localEmpty && remoteEmpty) {
          // Local has data but remote doesn't → sync to remote (will happen on next sync)
          mismatches.push({ key, action: "pending_sync_to_supabase" });
        }
      } catch {}
    }

    if (mismatches.length > 0) {
      console.log("APEX DataSync: Integrity check found", mismatches.length, "mismatches:", mismatches);
    }
    return { status: "checked", mismatches };
  } catch (e) {
    return { status: "error", error: e.message };
  }
}

/**
 * Full sync cycle — restore + verify + sync.
 * Call on app load after authentication.
 */
export async function fullSyncCycle() {
  const restoreResult = await restoreCriticalDataFromSupabase();
  if (restoreResult.restored && restoreResult.keys > 0) {
    console.log("APEX DataSync: Full cycle — restored data from Supabase");
  }

  // After restoring, sync anything local that's missing from remote
  const syncResult = await syncCriticalDataToSupabase();
  return { restore: restoreResult, sync: syncResult };
}

export { CRITICAL_KEYS };
