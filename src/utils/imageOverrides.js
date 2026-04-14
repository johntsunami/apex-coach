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
  // Clean up Supabase storage (try both old .jpg and new .webp paths) + DB row
  supabase.storage.from(BUCKET).remove([
    `${exerciseId}/0.jpg`, `${exerciseId}/1.jpg`,
    `${exerciseId}/0.webp`, `${exerciseId}/1.webp`,
  ]);
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

// ── Client-side image resize (800×600 WebP, cover-crop) ──────

function resizeImage(file, maxW = 800, maxH = 600) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = maxW; c.height = maxH;
      const ctx = c.getContext("2d");
      // Cover-fit: scale and center-crop to fill target dimensions
      const scale = Math.max(maxW / img.width, maxH / img.height);
      const sw = maxW / scale;
      const sh = maxH / scale;
      const sx = (img.width - sw) / 2;
      const sy = (img.height - sh) / 2;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, maxW, maxH);
      URL.revokeObjectURL(objectUrl);
      // Try WebP first, fallback to JPEG
      c.toBlob(
        blob => blob ? resolve(blob) : c.toBlob(resolve, "image/jpeg", 0.85),
        "image/webp", 0.85
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Image load failed")); };
    img.src = objectUrl;
  });
}

// ── Upload to Supabase Storage ────────────────────────────────

export async function uploadExerciseImage(exerciseId, file, slot = 0) {
  const blob = await resizeImage(file);
  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  const path = `${exerciseId}/${slot}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET)
    .upload(path, blob, { upsert: true, contentType: blob.type || "image/webp" });
  if (error) {
    console.error("[ImageOverride] Upload error:", error);
    if (error.message?.toLowerCase().includes("bucket") || error.statusCode === 404 || error.message?.includes("not found")) {
      throw new Error('Storage bucket "exercise-images" not found. Create it in Supabase Dashboard → Storage → New Bucket (name: exercise-images, Public: ON).');
    }
    throw new Error(error.message);
  }

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
