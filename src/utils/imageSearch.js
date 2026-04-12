// ═══════════════════════════════════════════════════════════════
// Image Search — searches free image APIs for exercise photos
// Fallback chain: Google CSE → Pexels → Unsplash
// ═══════════════════════════════════════════════════════════════

import { uploadExerciseImage } from "./imageOverrides.js";

const SEARCH_APIS = [
  {
    name: "google",
    enabled: () => !!import.meta.env.VITE_GOOGLE_CSE_KEY && !!import.meta.env.VITE_GOOGLE_CSE_CX,
    search: async (query) => {
      const key = import.meta.env.VITE_GOOGLE_CSE_KEY;
      const cx = import.meta.env.VITE_GOOGLE_CSE_CX;
      const res = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${key}&cx=${cx}&searchType=image&q=${encodeURIComponent(query)}&num=12&imgSize=large&safe=active`
      );
      if (!res.ok) throw new Error("Google search failed");
      const data = await res.json();
      return (data.items || []).map(item => ({
        url: item.link,
        thumb: item.image?.thumbnailLink || item.link,
        width: item.image?.width,
        height: item.image?.height,
        source: (() => { try { return new URL(item.image?.contextLink || item.link).hostname; } catch { return "web"; } })(),
      }));
    },
  },
  {
    name: "pexels",
    enabled: () => !!import.meta.env.VITE_PEXELS_KEY,
    search: async (query) => {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape`,
        { headers: { Authorization: import.meta.env.VITE_PEXELS_KEY } }
      );
      if (!res.ok) throw new Error("Pexels search failed");
      const data = await res.json();
      return (data.photos || []).map(p => ({
        url: p.src.large,
        thumb: p.src.medium,
        width: p.width,
        height: p.height,
        source: "pexels.com",
        photographer: p.photographer,
      }));
    },
  },
  {
    name: "unsplash",
    enabled: () => !!import.meta.env.VITE_UNSPLASH_KEY,
    search: async (query) => {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape`,
        { headers: { Authorization: "Client-ID " + import.meta.env.VITE_UNSPLASH_KEY } }
      );
      if (!res.ok) throw new Error("Unsplash search failed");
      const data = await res.json();
      return (data.results || []).map(p => ({
        url: p.urls.regular,
        thumb: p.urls.small,
        width: p.width,
        height: p.height,
        source: "unsplash.com",
        photographer: p.user?.name,
      }));
    },
  },
];

export async function searchExerciseImages(query) {
  for (const api of SEARCH_APIS) {
    if (!api.enabled()) continue;
    try {
      const results = await api.search(query);
      if (results.length > 0) return { results, source: api.name };
    } catch (err) {
      console.warn(`[ImageSearch] ${api.name} failed:`, err.message);
    }
  }
  return { results: [], source: null };
}

export function isSearchAvailable() {
  return SEARCH_APIS.some(api => api.enabled());
}

// Build a smart search query from exercise data
export function getSearchQuery(exercise) {
  const name = (exercise?.name || "").replace(/\s*\(.*\)\s*$/, "").trim();
  return name + " exercise proper form";
}

// Download a web image, resize, upload to Supabase as the new default
export async function selectWebImage(exerciseId, imageUrl) {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error("Could not download image");
  const blob = await res.blob();
  const file = new File([blob], exerciseId + ".webp", { type: blob.type });
  return await uploadExerciseImage(exerciseId, file, 0);
}
