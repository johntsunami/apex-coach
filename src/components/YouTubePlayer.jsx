import { useState } from "react";
import { supabase } from "../utils/supabase.js";

// ═══════════════════════════════════════════════════════════════
// YouTubePlayer — expandable YouTube embed for exercise demos
// Shows "Watch Demo" button → expands to responsive 16:9 iframe
// ═══════════════════════════════════════════════════════════════

function supabaseSave(exerciseId, vid) {
  supabase
    .from("exercise_youtube_overrides")
    .upsert(
      { exercise_id: exerciseId, youtube_video_id: vid, updated_at: new Date().toISOString() },
      { onConflict: "exercise_id" }
    )
    .then(() => {});
}

const C = {
  bgCard: "#0a1628",
  bgElevated: "#0f1a2e",
  teal: "#00d2c8",
  textDim: "#4a5a78",
  textMuted: "#8b95a7",
  text: "#e8ecf4",
  border: "rgba(255,255,255,0.08)",
  info: "#3b82f6",
};

export default function YouTubePlayer({ videoId, title }) {
  if (!videoId) return null;

  return (
    <div style={{ marginBottom: 8 }}>
      <div>
        <div
          style={{
            position: "relative",
            paddingBottom: "56.25%",
            height: 0,
            overflow: "hidden",
            borderRadius: 12,
            background: C.bgCard,
            border: `1px solid ${C.border}`,
          }}
        >
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?rel=0`}
            title={title || "Exercise Demo"}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              border: "none",
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div
          style={{
            marginTop: 6,
            padding: "0 2px",
          }}
        >
          <div style={{ fontSize: 10, color: C.textDim }}>
            Exercise demonstration video
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Dev-mode Video Mapper Modal ─────────────────────────────────

export function VideoMapperModal({ exercise, onClose, onSaved }) {
  const [input, setInput] = useState(exercise?.youtubeVideoId || "");
  const [preview, setPreview] = useState(exercise?.youtubeVideoId || "");
  const [status, setStatus] = useState(null);

  const extractVideoId = (raw) => {
    if (!raw) return "";
    const trimmed = raw.trim();
    // Full YouTube URL patterns
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ];
    for (const p of patterns) {
      const m = trimmed.match(p);
      if (m) return m[1];
    }
    // Bare video ID (11 chars)
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    return trimmed;
  };

  const handlePreview = () => {
    const vid = extractVideoId(input);
    setPreview(vid);
  };

  const handleSave = () => {
    const vid = extractVideoId(input);
    if (!vid) {
      setStatus("Please enter a valid YouTube URL or video ID");
      return;
    }
    // Save to localStorage
    try {
      const key = "apex_youtube_overrides";
      const map = JSON.parse(localStorage.getItem(key) || "{}");
      map[exercise.id] = vid;
      localStorage.setItem(key, JSON.stringify(map));
      setStatus("Saved!");
      if (onSaved) onSaved(vid);
    } catch (e) {
      setStatus("Error: " + e.message);
    }
    // Fire-and-forget Supabase save
    try {
      supabaseSave(exercise.id, vid);
    } catch {
      /* table may not exist — that's fine */
    }
  };

  const handleClear = () => {
    try {
      const key = "apex_youtube_overrides";
      const map = JSON.parse(localStorage.getItem(key) || "{}");
      delete map[exercise.id];
      localStorage.setItem(key, JSON.stringify(map));
      setInput("");
      setPreview("");
      setStatus("Cleared!");
      if (onSaved) onSaved(null);
    } catch (e) {
      setStatus("Error: " + e.message);
    }
  };

  const S = {
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.85)",
      zIndex: 500,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    },
    card: {
      background: "#0d1425",
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      padding: 20,
      width: "100%",
      maxWidth: 400,
      maxHeight: "90vh",
      overflowY: "auto",
    },
    title: { fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 },
    sub: { fontSize: 11, color: C.textDim, marginBottom: 16 },
    btn: (color = C.teal) => ({
      width: "100%",
      padding: "10px 16px",
      borderRadius: 10,
      border: `1px solid ${color}40`,
      background: color + "15",
      color,
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: "inherit",
      marginBottom: 8,
    }),
    status: {
      fontSize: 12,
      fontWeight: 600,
      color: status?.startsWith("Error") ? "#ef4444" : C.teal,
      textAlign: "center",
      marginTop: 8,
    },
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.card} onClick={(e) => e.stopPropagation()}>
        <div style={S.title}>Add Video: {exercise.name}</div>
        <div style={S.sub}>{exercise.id}</div>

        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 10,
              color: C.textDim,
              marginBottom: 4,
              fontWeight: 600,
            }}
          >
            YouTube URL or Video ID
          </div>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://youtube.com/watch?v=... or video ID"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              background: C.bgElevated,
              border: `1px solid ${C.border}`,
              color: C.text,
              fontSize: 13,
              fontFamily: "inherit",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <button style={S.btn(C.info)} onClick={handlePreview}>
          👁 Preview
        </button>

        {preview && (
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                position: "relative",
                paddingBottom: "56.25%",
                height: 0,
                overflow: "hidden",
                borderRadius: 10,
                background: C.bgCard,
              }}
            >
              <iframe
                src={`https://www.youtube.com/embed/${preview}?rel=0`}
                title="Preview"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div
              style={{
                fontSize: 10,
                color: C.textDim,
                textAlign: "center",
                marginTop: 4,
              }}
            >
              ID: {preview}
            </div>
          </div>
        )}

        <button style={S.btn()} onClick={handleSave}>
          💾 Save Video ID
        </button>

        {(exercise?.youtubeVideoId || input) && (
          <button style={S.btn("#ef4444")} onClick={handleClear}>
            ✕ Clear Video
          </button>
        )}

        <button
          style={{
            ...S.btn(),
            background: "transparent",
            borderColor: C.border,
            color: C.textDim,
          }}
          onClick={onClose}
        >
          Cancel
        </button>

        {status && <div style={S.status}>{status}</div>}
      </div>
    </div>
  );
}

// ── Helper: get video override from localStorage ────────────────

export function getVideoOverride(exerciseId) {
  try {
    const map = JSON.parse(
      localStorage.getItem("apex_youtube_overrides") || "{}"
    );
    return map[exerciseId] || null;
  } catch {
    return null;
  }
}

// ── Helper: generate NASM exercise library slug ─────────────────

export function getNasmSlug(exerciseName) {
  if (!exerciseName) return "";
  return exerciseName
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
