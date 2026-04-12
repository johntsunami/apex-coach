import { useState, useEffect, useRef } from "react";
import { getOverrideForExercise, uploadExerciseImage, clearOverride } from "../utils/imageOverrides.js";
import YouTubePlayer, { VideoMapperModal, getVideoOverride, getNasmSlug } from "./YouTubePlayer.jsx";
import EXERCISE_SVGS from "../data/exerciseSvgs.js";
import { useAuth } from "./AuthProvider.jsx";
import { isDeveloper } from "./BugReport.jsx";

// ═══════════════════════════════════════════════════════════════
// ExerciseImage — two frames: side-by-side or crossfade + dev image editor
//                + YouTube video toggle + NASM exercise library link
// ═══════════════════════════════════════════════════════════════

const C = { bgCard: "#0a1628", teal: "#00d2c8", textDim: "#4a5a78", textMuted: "#8b95a7", border: "rgba(255,255,255,0.08)", info: "#3b82f6" };
// Dev mode: production devs (isDeveloper check) OR local dev with ?dev param
const isDevMode = () => import.meta.env.DEV && new URLSearchParams(window.location.search).has("dev");
// Images ALWAYS default — video is opt-in per interaction, not persisted
const getMediaPref = () => "images";
const setMediaPref = () => {};

// ── Emoji fallback ────────────────────────────────────────────

function EmojiPlaceholder({ emoji, width = "100%", height = 200 }) {
  return (
    <div style={{
      width, height, background: C.bgCard, borderRadius: 12,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: typeof height === "number" && height < 100 ? 20 : 48,
      border: `1px solid ${C.border}`,
    }}>
      {emoji || "💪"}
    </div>
  );
}

// ── Crossfade for narrow screens ──────────────────────────────

function Crossfade({ url, url2, name }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setFrame(f => (f === 0 ? 1 : 0)), 2000);
    return () => clearInterval(t);
  }, []);
  const imgStyle = (active) => ({
    width: "100%", height: 200, objectFit: "contain",
    borderRadius: 12, background: C.bgCard,
    border: `1px solid ${C.border}`,
    position: "absolute", top: 0, left: 0,
    opacity: active ? 1 : 0,
    transition: "opacity 0.6s ease-in-out",
  });
  return (
    <div style={{ position: "relative", width: "100%", height: 200 }}>
      <img src={url} alt={name + " — start"} referrerPolicy="no-referrer" style={imgStyle(frame === 0)} />
      <img src={url2} alt={name + " — end"} referrerPolicy="no-referrer" style={imgStyle(frame === 1)} />
      <div style={{
        position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)",
        background: "rgba(0,0,0,0.6)", borderRadius: 6, padding: "2px 8px",
        fontSize: 9, color: C.teal, fontWeight: 700, letterSpacing: 1,
      }}>{frame === 0 ? "START" : "END"}</div>
    </div>
  );
}

// ── Dev-only pencil icon ──────────────────────────────────────

function PencilIcon({ onClick }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        position: "absolute", top: 6, right: 6, width: 28, height: 28, zIndex: 10,
        borderRadius: "50%", background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.3)",
        color: "#fff", fontSize: 14, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
      ✏️
    </button>
  );
}

// ── Image Edit Modal ──────────────────────────────────────────

function ImageEditModal({ exercise, onClose, onUpdated }) {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null);
  const startRef = useRef(null);
  const endRef = useRef(null);
  const bothRef = useRef(null);

  const doUpload = async (file, slot) => {
    if (!file) return;
    if (file.size > 10485760) { setStatus("File too large (max 10MB — auto-resized on upload)"); return; }
    setUploading(true); setStatus(null);
    try {
      await uploadExerciseImage(exercise.id, file, slot);
      setStatus("Uploaded!");
      onUpdated();
    } catch (e) {
      setStatus("Error: " + e.message);
    }
    setUploading(false);
  };

  const doReset = () => {
    clearOverride(exercise.id);
    setStatus("Reset to default");
    onUpdated();
  };

  const S = {
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
    card: { background: "#0d1425", border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, width: "100%", maxWidth: 360 },
    title: { fontSize: 16, fontWeight: 700, color: "#e8ecf4", marginBottom: 4 },
    sub: { fontSize: 11, color: C.textDim, marginBottom: 16 },
    btn: (color = C.teal) => ({ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${color}40`, background: color + "15", color, fontSize: 13, fontWeight: 600, cursor: uploading ? "not-allowed" : "pointer", fontFamily: "inherit", marginBottom: 8, opacity: uploading ? 0.5 : 1 }),
    guide: { fontSize: 10, color: C.textDim, lineHeight: 1.6, padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8, marginBottom: 12 },
    status: { fontSize: 12, fontWeight: 600, color: status?.startsWith("Error") ? "#ef4444" : C.teal, textAlign: "center", marginTop: 8 },
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.card} onClick={e => e.stopPropagation()}>
        <div style={S.title}>Edit Image: {exercise.name}</div>
        <div style={S.sub}>{exercise.id}</div>

        <div style={S.guide}>
          <strong style={{ color: C.teal }}>Image Guidelines</strong><br />
          Target: 800 x 600px (4:3) &middot; Auto-resized on upload<br />
          Output: WebP &middot; Max ~200KB after resize<br />
          Landscape orientation &middot; Plain background<br />
          Becomes the default image for ALL users
        </div>

        {/* Upload same image as both start + end */}
        <input ref={bothRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
          onChange={async (e) => {
            const f = e.target.files[0]; if (!f) return;
            await doUpload(f, 0);
            await doUpload(f, 1);
          }} />
        <button style={S.btn()} disabled={uploading}
          onClick={() => bothRef.current?.click()}>
          📷 Upload Custom Image (both positions)
        </button>

        {/* Upload start position */}
        <input ref={startRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
          onChange={(e) => doUpload(e.target.files[0], 0)} />
        <button style={S.btn("#3b82f6")} disabled={uploading}
          onClick={() => startRef.current?.click()}>
          ① Upload Start Position
        </button>

        {/* Upload end position */}
        <input ref={endRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
          onChange={(e) => doUpload(e.target.files[0], 1)} />
        <button style={S.btn("#a855f7")} disabled={uploading}
          onClick={() => endRef.current?.click()}>
          ② Upload End Position
        </button>

        {/* Reset */}
        <button style={S.btn("#ef4444")} disabled={uploading} onClick={doReset}>
          ↩ Reset to Default
        </button>

        {/* Cancel */}
        <button style={{ ...S.btn(), background: "transparent", borderColor: C.border, color: C.textDim }} onClick={onClose}>
          Cancel
        </button>

        {status && <div style={S.status}>{status}</div>}
      </div>
    </div>
  );
}

// ── Media toggle buttons (video / images) ───────────────────

function MediaToggle({ showVideo, onToggle, hasVideo, dev, onVideoEdit }) {
  if (!hasVideo && !dev) return null;
  const btnStyle = (active) => ({
    padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit", border: `1px solid ${active ? C.info + "60" : C.border}`,
    background: active ? C.info + "15" : "transparent", color: active ? C.info : C.textDim,
    display: "flex", alignItems: "center", gap: 4,
  });
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center" }}>
      {hasVideo && <button onClick={() => onToggle("video")} style={btnStyle(showVideo)}>▶ Video</button>}
      <button onClick={() => onToggle("images")} style={btnStyle(!showVideo)}>🖼 Images</button>
      {dev && <button onClick={(e) => { e.stopPropagation(); onVideoEdit(); }} style={{
        marginLeft: "auto", width: 26, height: 26, borderRadius: "50%",
        background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)",
        color: "#fff", fontSize: 12, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>🎬</button>}
    </div>
  );
}

// ── Exercise link (removed NASM reference) ──────────────────

function NasmLink() { return null; }

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

export default function ExerciseImage({ exercise, size = "full", showBoth = false }) {
  const [showModal, setShowModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [rev, setRev] = useState(0); // bump to force re-read overrides
  const [videoRev, setVideoRev] = useState(0);
  const _auth = useAuth();
  const dev = isDevMode() || isDeveloper(_auth?.user);

  // Images always default — video is per-exercise opt-in
  const [showVideo, setShowVideo] = useState(false);
  const toggleMedia = (mode) => { setShowVideo(mode === "video"); };

  // Resolve video ID: localStorage override wins, then exercise data
  const videoOverride = getVideoOverride(exercise?.id);
  const videoId = videoOverride || exercise?.youtubeVideoId || null;
  const hasVideo = !!videoId;

  // Resolve URLs: override wins, then exercise data
  const override = getOverrideForExercise(exercise?.id);
  const url = override?.imageUrl || exercise?.gifUrl || exercise?.imageUrl;
  const url2 = override?.imageUrl2 || exercise?.imageUrl2;
  const isThumbnail = size === "thumb";
  const hasBoth = url && url2;

  const onUpdated = () => setRev(r => r + 1);

  // ── NO URL → check SVG map → video → emoji ──────────────
  const svgMarkup = EXERCISE_SVGS[exercise?.id];
  if (!url) {
    // SVG diagram available — render inline
    if (svgMarkup) {
      if (isThumbnail) {
        return <div style={{ width: 48, height: 48, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}`, flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: svgMarkup }} />;
      }
      return (
        <div>
          <div style={{ position: "relative", width: "100%", borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}` }} dangerouslySetInnerHTML={{ __html: svgMarkup }} />
          {dev && <PencilIcon onClick={() => setShowModal(true)} />}
          {showModal && <ImageEditModal exercise={exercise} onClose={() => setShowModal(false)} onUpdated={onUpdated} />}
        </div>
      );
    }
    if (isThumbnail) {
      return <EmojiPlaceholder emoji={exercise?.emoji} width={48} height={48} />;
    }
    // No image but has video → show video directly (no toggle needed)
    if (hasVideo) {
      return (
        <div>
          <YouTubePlayer videoId={videoId} title={exercise?.name} />
          {dev && <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
            <button onClick={() => setShowModal(true)} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 6, color: C.textDim, fontSize: 10, padding: "4px 8px", cursor: "pointer" }}>Upload Image</button>
            <button onClick={() => setShowVideoModal(true)} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 6, color: C.textDim, fontSize: 10, padding: "4px 8px", cursor: "pointer" }}>Edit Video</button>
          </div>}
          {showModal && <ImageEditModal exercise={exercise} onClose={() => setShowModal(false)} onUpdated={onUpdated} />}
          {showVideoModal && <VideoMapperModal exercise={exercise} onClose={() => setShowVideoModal(false)} onSaved={() => { setVideoRev(r => r + 1); setShowVideoModal(false); }} />}
        </div>
      );
    }
    // No image, no video, no SVG → emoji fallback
    return (
      <div>
        <div style={{ position: "relative" }}>
          <EmojiPlaceholder emoji={exercise?.emoji} width="100%" height={200} />
          {dev && <PencilIcon onClick={() => setShowModal(true)} />}
        </div>
        {dev && <button onClick={() => setShowVideoModal(true)} style={{ width: "100%", marginTop: 4, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 6, color: C.textDim, fontSize: 10, padding: "6px", cursor: "pointer", fontFamily: "inherit" }}>Add Video</button>}
        {showModal && <ImageEditModal exercise={exercise} onClose={() => setShowModal(false)} onUpdated={onUpdated} />}
        {showVideoModal && <VideoMapperModal exercise={exercise} onClose={() => setShowVideoModal(false)} onSaved={() => { setVideoRev(r => r + 1); setShowVideoModal(false); }} />}
      </div>
    );
  }

  // ── THUMBNAIL — tiny img (no pencil) ────────────────────
  if (isThumbnail) {
    return (
      <img
        src={url}
        alt={exercise?.name || ""}
        referrerPolicy="no-referrer"
        style={{
          width: 48, height: 48, objectFit: "cover", borderRadius: 8,
          border: `1px solid ${C.border}`, flexShrink: 0, background: C.bgCard,
        }}
      />
    );
  }

  // ── TWO IMAGES — side-by-side or crossfade ──────────────
  if (hasBoth) {
    return (
      <div>
        <MediaToggle showVideo={showVideo} onToggle={toggleMedia} hasVideo={hasVideo} dev={dev} onVideoEdit={() => setShowVideoModal(true)} />
        {hasVideo && showVideo ? (
          <YouTubePlayer videoId={videoId} title={exercise?.name} />
        ) : (
          <div style={{ position: "relative" }}>
            <div className="exercise-img-wide" style={{ display: "none" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <img src={url} alt="Start" referrerPolicy="no-referrer"
                  style={{ width: "100%", height: 180, objectFit: "contain", borderRadius: 12, background: C.bgCard, border: `1px solid ${C.border}` }} />
                <img src={url2} alt="End" referrerPolicy="no-referrer"
                  style={{ width: "100%", height: 180, objectFit: "contain", borderRadius: 12, background: C.bgCard, border: `1px solid ${C.border}` }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 3 }}>
                <div style={{ textAlign: "center", fontSize: 9, color: C.teal, fontWeight: 700, letterSpacing: 1 }}>START</div>
                <div style={{ textAlign: "center", fontSize: 9, color: C.teal, fontWeight: 700, letterSpacing: 1 }}>END</div>
              </div>
            </div>
            <div className="exercise-img-narrow">
              <Crossfade url={url} url2={url2} name={exercise?.name || ""} />
            </div>
            <style>{`
              @media(min-width:400px){
                .exercise-img-wide{display:block!important}
                .exercise-img-narrow{display:none!important}
              }
            `}</style>
            {dev && <PencilIcon onClick={() => setShowModal(true)} />}
          </div>
        )}
        <NasmLink name={exercise?.name} />
        {showModal && <ImageEditModal exercise={exercise} onClose={() => setShowModal(false)} onUpdated={onUpdated} />}
        {showVideoModal && <VideoMapperModal exercise={exercise} onClose={() => setShowVideoModal(false)} onSaved={() => { setVideoRev(r => r + 1); setShowVideoModal(false); }} />}
      </div>
    );
  }

  // ── SINGLE IMAGE ────────────────────────────────────────
  return (
    <div>
      <MediaToggle showVideo={showVideo} onToggle={toggleMedia} hasVideo={hasVideo} dev={dev} onVideoEdit={() => setShowVideoModal(true)} />
      {hasVideo && showVideo ? (
        <YouTubePlayer videoId={videoId} title={exercise?.name} />
      ) : (
        <div style={{ position: "relative" }}>
          <img
            src={url}
            alt={exercise?.name || ""}
            referrerPolicy="no-referrer"
            style={{
              width: "100%", maxHeight: 250, objectFit: "contain",
              borderRadius: 12, background: C.bgCard,
              border: `1px solid ${C.border}`, display: "block",
            }}
          />
          {dev && <PencilIcon onClick={() => setShowModal(true)} />}
        </div>
      )}
      <NasmLink name={exercise?.name} />
      {showModal && <ImageEditModal exercise={exercise} onClose={() => setShowModal(false)} onUpdated={onUpdated} />}
      {showVideoModal && <VideoMapperModal exercise={exercise} onClose={() => setShowVideoModal(false)} onSaved={() => { setVideoRev(r => r + 1); setShowVideoModal(false); }} />}
    </div>
  );
}

export { EmojiPlaceholder as FallbackSVG };
