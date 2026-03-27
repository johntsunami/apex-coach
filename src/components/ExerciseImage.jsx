import { useState } from "react";

// ═══════════════════════════════════════════════════════════════
// ExerciseImage — animated crossfade, static photo, or SVG fallback
// ═══════════════════════════════════════════════════════════════

const C = { bg: "#060b18", bgCard: "#0a1628", teal: "#00d2c8", textDim: "#4a5a78", border: "rgba(255,255,255,0.08)" };

const SVG_POSITIONS = {
  push: { body: "M50 25 L50 55 L30 80 M50 55 L70 80 M50 35 L25 50 M50 35 L75 45", label: "PUSH" },
  pull: { body: "M50 25 L50 55 L30 80 M50 55 L70 80 M50 35 L30 20 M50 35 L70 20", label: "PULL" },
  hinge: { body: "M50 25 L55 55 L35 85 M55 55 L75 85 M55 40 L30 50 M55 40 L80 50", label: "HINGE" },
  squat: { body: "M50 20 L50 45 L35 70 L35 85 M50 45 L65 70 L65 85 M50 30 L35 40 M50 30 L65 40", label: "SQUAT" },
  lunge: { body: "M50 20 L50 45 L30 75 L25 85 M50 45 L70 65 L75 85 M50 30 L35 35 M50 30 L65 35", label: "LUNGE" },
  carry: { body: "M50 20 L50 55 L35 80 M50 55 L65 80 M50 35 L35 55 M50 35 L65 55", label: "CARRY" },
  rotation: { body: "M50 25 L50 55 L30 80 M50 55 L70 80 M50 35 L25 30 M50 35 L75 40", label: "ROTATE" },
  anti_rotation: { body: "M50 25 L50 55 L30 80 M50 55 L70 80 M50 35 L30 45 M50 35 L70 45", label: "ANTI-ROT" },
  anti_extension: { body: "M30 40 L80 40 L80 55 M30 40 L30 55 M55 40 L55 25 M55 40 L75 55", label: "PLANK" },
  anti_flexion: { body: "M30 50 L80 50 M55 50 L55 30 M55 50 L40 65 M55 50 L70 65", label: "SIDE PLANK" },
  isolation: { body: "M50 25 L50 55 L35 80 M50 55 L65 80 M50 35 L30 30 M50 35 L70 30", label: "ISOLATE" },
  mobility: { body: "M50 25 L50 55 L30 80 M50 55 L70 80 M50 35 L25 25 M50 35 L75 25", label: "MOBILITY" },
  static_stretch: { body: "M50 25 L50 55 L30 80 M50 55 L70 80 M50 35 L25 35 M50 35 L75 35", label: "STRETCH" },
  foam_roll: { body: "M30 45 L80 45 M55 45 L55 30 M55 45 L70 60 M55 45 L40 60", label: "FOAM ROLL" },
  breathing: { body: "M50 30 L50 60 L35 80 M50 60 L65 80 M50 40 L35 40 M50 40 L65 40", label: "BREATHE" },
};

function FallbackSVG({ exercise, width = "100%", height = 160 }) {
  const pattern = exercise?.movementPattern || "isolation";
  const pos = SVG_POSITIONS[pattern] || SVG_POSITIONS.isolation;
  const bp = (exercise?.bodyPart || "").replace(/_/g, " ");
  return (
    <svg viewBox="0 0 100 100" style={{ width, height, display: "block", borderRadius: 14, border: `1px solid ${C.border}` }}>
      <rect width="100" height="100" rx="8" fill={C.bgCard} />
      <circle cx="50" cy="18" r="7" fill="none" stroke={C.teal} strokeWidth="1.5" />
      <path d={pos.body} fill="none" stroke={C.teal} strokeWidth="1.5" strokeLinecap="round" />
      <text x="50" y="96" textAnchor="middle" fill={C.teal} fontSize="4.5" fontWeight="700">{pos.label}</text>
      {bp && <text x="50" y="8" textAnchor="middle" fill={C.textDim} fontSize="3.5">{bp.toUpperCase()}</text>}
      {exercise?.emoji && <text x="88" y="14" textAnchor="middle" fontSize="8">{exercise.emoji}</text>}
    </svg>
  );
}

function LoadingSkeleton({ width, height, isThumbnail }) {
  return (
    <div style={{
      width, height,
      background: `linear-gradient(90deg, ${C.bgCard} 25%, #1a2a45 50%, ${C.bgCard} 75%)`,
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite",
      borderRadius: isThumbnail ? 8 : 14,
      border: `1px solid ${C.border}`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}@keyframes crossfade{0%,45%{opacity:1}50%,95%{opacity:0}100%{opacity:1}}`}</style>
      <span style={{ fontSize: isThumbnail ? 14 : 20, opacity: 0.3 }}>{isThumbnail ? "📷" : "⏳ Loading..."}</span>
    </div>
  );
}

export default function ExerciseImage({ exercise, size = "full", showBoth = false }) {
  const [loaded1, setLoaded1] = useState(false);
  const [loaded2, setLoaded2] = useState(false);
  const [err1, setErr1] = useState(false);
  const [err2, setErr2] = useState(false);

  const url = exercise?.gifUrl || exercise?.imageUrl;
  const url2 = exercise?.imageUrl2;
  const isThumbnail = size === "thumb";

  // No URL or failed — SVG fallback
  if (!url || err1) {
    return <FallbackSVG exercise={exercise} width={isThumbnail ? 48 : "100%"} height={isThumbnail ? 48 : 160} />;
  }

  const imgProps = { loading: "lazy", referrerPolicy: "no-referrer" };
  const h = isThumbnail ? 48 : 200;

  // ── THUMBNAIL ───────────────────────────────────────────
  if (isThumbnail) {
    return (
      <div style={{ width: 48, height: 48, flexShrink: 0 }}>
        {!loaded1 && <div style={{ width: 48, height: 48, borderRadius: 8, background: C.bgCard, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 16 }}>{exercise?.emoji || "📷"}</span></div>}
        <img src={url} alt={exercise?.name || ""} {...imgProps}
          onLoad={() => setLoaded1(true)} onError={() => setErr1(true)}
          style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8, display: loaded1 ? "block" : "none", border: `1px solid ${C.border}` }} />
      </div>
    );
  }

  // ── FULL SIZE — animated crossfade or static ────────────
  const bothLoaded = loaded1 && loaded2 && !err2 && url2;

  return (
    <div style={{ width: "100%", position: "relative" }}>
      {/* Loading skeleton */}
      {!loaded1 && <LoadingSkeleton width="100%" height={h} />}

      {/* Animated crossfade when both frames loaded */}
      {bothLoaded && !showBoth && (
        <div style={{ position: "relative", width: "100%", height: h }}>
          <img src={url} alt={exercise?.name + " — start"} style={{ width: "100%", height: h, objectFit: "cover", borderRadius: 14, border: `1px solid ${C.border}`, position: "absolute", top: 0, left: 0, animation: "crossfade 2.4s ease-in-out infinite" }} />
          <img src={url2} alt={exercise?.name + " — end"} style={{ width: "100%", height: h, objectFit: "cover", borderRadius: 14, border: `1px solid ${C.border}`, position: "absolute", top: 0, left: 0, animation: "crossfade 2.4s ease-in-out infinite", animationDelay: "1.2s" }} />
          <div style={{ position: "absolute", bottom: 6, right: 8, background: "rgba(0,0,0,0.6)", borderRadius: 6, padding: "2px 6px", fontSize: 8, color: C.teal, fontWeight: 700 }}>ANIMATED</div>
        </div>
      )}

      {/* Side-by-side when showBoth */}
      {bothLoaded && showBoth && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            <img src={url} alt="Start" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 14, border: `1px solid ${C.border}` }} />
            <img src={url2} alt="End" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 14, border: `1px solid ${C.border}` }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginTop: 2 }}>
            <div style={{ textAlign: "center", fontSize: 8, color: C.textDim }}>Start Position</div>
            <div style={{ textAlign: "center", fontSize: 8, color: C.textDim }}>End Position</div>
          </div>
        </div>
      )}

      {/* Single image when only first loaded (or no url2) */}
      {loaded1 && !bothLoaded && (
        <img src={url} alt={exercise?.name || ""} style={{ width: "100%", height: h, objectFit: "cover", borderRadius: 14, border: `1px solid ${C.border}`, display: "block" }} />
      )}

      {/* Hidden preloaders — NO crossOrigin to avoid CORS issues with GitHub CDN */}
      <img src={url} alt="" {...imgProps} onLoad={() => setLoaded1(true)} onError={() => setErr1(true)} style={{ display: "none" }} />
      {url2 && <img src={url2} alt="" {...imgProps} onLoad={() => setLoaded2(true)} onError={() => setErr2(true)} style={{ display: "none" }} />}
    </div>
  );
}

export { FallbackSVG };
