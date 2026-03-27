// ═══════════════════════════════════════════════════════════════
// Image Override layer — custom exercise images via Supabase Storage
// ═══════════════════════════════════════════════════════════════

import { supabase } from "./supabase.js";

const LS_KEY = "apex_image_overrides";
const BUCKET = "exercise-images";

// ── localStorage cache ────────────────────────────────────────

function getCache() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); }
  catch { return {}; }
}

function setCache(map) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(map)); }
  catch { /* full */ }
}

export function getOverrideForExercise(id) {
  if (!id) return null;
  const c = getCache()[id];
  return c || null;
}

export function setOverride(exerciseId, imageUrl, imageUrl2) {
  const map = getCache();
  map[exerciseId] = { imageUrl, imageUrl2 };
  setCache(map);
  // Persist to Supabase (fire-and-forget)
  supabase.from("exercise_image_overrides").upsert({
    exercise_id: exerciseId, image_url: imageUrl, image_url2: imageUrl2,
    updated_at: new Date().toISOString(),
  }, { onConflict: "exercise_id" }).then(() => {});
}

export function clearOverride(exerciseId) {
  const map = getCache();
  delete map[exerciseId];
  setCache(map);
  // Clean up Supabase storage + DB row
  supabase.storage.from(BUCKET).remove([`${exerciseId}/0.jpg`, `${exerciseId}/1.jpg`]);
  supabase.from("exercise_image_overrides").delete().eq("exercise_id", exerciseId);
}

// ── Sync from Supabase → localStorage (call on app init) ─────

export async function syncOverridesFromSupabase() {
  try {
    const { data, error } = await supabase.from("exercise_image_overrides").select("*");
    if (error || !data) return;
    const map = {};
    for (const row of data) {
      map[row.exercise_id] = { imageUrl: row.image_url, imageUrl2: row.image_url2 };
    }
    setCache(map);
  } catch { /* table may not exist yet — that's fine */ }
}

// ── Client-side image resize ──────────────────────────────────

function resizeImage(file, maxW = 400, maxH = 300) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width: w, height: h } = img;
      if (w <= maxW && h <= maxH) {
        // Already within bounds — convert to JPEG blob anyway
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0);
        c.toBlob(resolve, "image/jpeg", 0.85);
        return;
      }
      const ratio = Math.min(maxW / w, maxH / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      c.toBlob(resolve, "image/jpeg", 0.85);
    };
    img.src = URL.createObjectURL(file);
  });
}

// ── Upload to Supabase Storage ────────────────────────────────

export async function uploadExerciseImage(exerciseId, file, slot = 0) {
  const blob = await resizeImage(file);
  const path = `${exerciseId}/${slot}.jpg`;

  const { error } = await supabase.storage.from(BUCKET)
    .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
  if (error) throw new Error(error.message);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = urlData.publicUrl + "?t=" + Date.now(); // cache-bust

  // Update the override record
  const current = getOverrideForExercise(exerciseId) || {};
  const updated = {
    imageUrl: slot === 0 ? publicUrl : (current.imageUrl || null),
    imageUrl2: slot === 1 ? publicUrl : (current.imageUrl2 || null),
  };
  setOverride(exerciseId, updated.imageUrl, updated.imageUrl2);
  return publicUrl;
}
