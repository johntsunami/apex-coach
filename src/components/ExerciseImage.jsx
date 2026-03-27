import { useState } from "react";

// ═══════════════════════════════════════════════════════════════
// ExerciseImage — shows real photo or programmatic SVG fallback
// ═══════════════════════════════════════════════════════════════

const C = { bg: "#060b18", bgCard: "#0a1628", teal: "#00d2c8", textDim: "#4a5a78", border: "rgba(255,255,255,0.08)" };

// SVG stick figure positions based on movement pattern
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
  isolation: { body: "M50 25 L50 55 L35 80 M50 55 L65 80 M50 35 L30 30 M50 35 L70 30", label: "ISOLATE" },
  mobility: { body: "M50 25 L50 55 L30 80 M50 55 L70 80 M50 35 L25 25 M50 35 L75 25", label: "MOBILITY" },
  static_stretch: { body: "M50 25 L50 55 L30 80 M50 55 L70 80 M50 35 L25 35 M50 35 L75 35", label: "STRETCH" },
  foam_roll: { body: "M30 45 L80 45 M55 45 L55 30 M55 45 L70 60 M55 45 L40 60", label: "FOAM ROLL" },
  breathing: { body: "M50 30 L50 60 L35 80 M50 60 L65 80 M50 40 L35 40 M50 40 L65 40", label: "BREATHE" },
};

function FallbackSVG({ exercise, width = "100%", height = 140 }) {
  const pattern = exercise?.movementPattern || "isolation";
  const pos = SVG_POSITIONS[pattern] || SVG_POSITIONS.isolation;
  const bp = (exercise?.bodyPart || "").replace(/_/g, " ");

  return (
    <svg viewBox="0 0 100 100" style={{ width, height, display: "block" }}>
      <rect width="100" height="100" rx="8" fill={C.bgCard} />
      {/* Stick figure */}
      <circle cx="50" cy="18" r="7" fill="none" stroke={C.teal} strokeWidth="1.5" />
      <path d={pos.body} fill="none" stroke={C.teal} strokeWidth="1.5" strokeLinecap="round" />
      {/* Labels */}
      <text x="50" y="96" textAnchor="middle" fill={C.textDim} fontSize="5" fontWeight="600">{pos.label}</text>
      {bp && <text x="50" y="8" textAnchor="middle" fill={C.textDim} fontSize="4">{bp.toUpperCase()}</text>}
    </svg>
  );
}

export default function ExerciseImage({ exercise, size = "full", showBoth = false }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [loaded2, setLoaded2] = useState(false);
  const [error2, setError2] = useState(false);

  const url = exercise?.imageUrl;
  const url2 = exercise?.imageUrl2;
  const isThumbnail = size === "thumb";
  const w = isThumbnail ? 48 : "100%";
  const h = isThumbnail ? 48 : 180;

  // No URL — show SVG
  if (!url || error) {
    return <FallbackSVG exercise={exercise} width={w} height={h} />;
  }

  return (
    <div style={{ width: isThumbnail ? 48 : "100%", position: "relative" }}>
      {/* Loading skeleton */}
      {!loaded && <div style={{ width: w, height: h, background: C.bgCard, borderRadius: isThumbnail ? 8 : 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: isThumbnail ? 16 : 28, opacity: 0.3 }}>{exercise?.emoji || "💪"}</span>
      </div>}

      {/* Main image */}
      <div style={{ display: showBoth && url2 && !error2 ? "grid" : "block", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
        <img
          src={url}
          alt={exercise?.name || "Exercise"}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          style={{
            width: showBoth && url2 ? "100%" : w,
            height: isThumbnail ? 48 : showBoth ? 140 : h,
            objectFit: "cover",
            borderRadius: isThumbnail ? 8 : 14,
            display: loaded ? "block" : "none",
            border: `1px solid ${C.border}`,
          }}
        />
        {/* Second image (end position) */}
        {showBoth && url2 && !error2 && (
          <img
            src={url2}
            alt={`${exercise?.name || "Exercise"} — end position`}
            loading="lazy"
            onLoad={() => setLoaded2(true)}
            onError={() => setError2(true)}
            style={{
              width: "100%",
              height: 140,
              objectFit: "cover",
              borderRadius: 14,
              display: loaded2 ? "block" : "none",
              border: `1px solid ${C.border}`,
            }}
          />
        )}
      </div>
    </div>
  );
}

export { FallbackSVG };
