import { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════
// ExerciseImage — two frames: side-by-side (wide) or crossfade (narrow)
// ═══════════════════════════════════════════════════════════════

const C = { bgCard: "#0a1628", teal: "#00d2c8", textDim: "#4a5a78", border: "rgba(255,255,255,0.08)" };

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

export default function ExerciseImage({ exercise, size = "full", showBoth = false }) {
  const url = exercise?.gifUrl || exercise?.imageUrl;
  const url2 = exercise?.imageUrl2;
  const isThumbnail = size === "thumb";
  const hasBoth = url && url2;

  // ── NO URL → emoji fallback ─────────────────────────────
  if (!url) {
    return <EmojiPlaceholder emoji={exercise?.emoji} width={isThumbnail ? 48 : "100%"} height={isThumbnail ? 48 : 200} />;
  }

  // ── THUMBNAIL — tiny img ────────────────────────────────
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
        {/* Side-by-side for wider screens, crossfade for narrow */}
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
      </div>
    );
  }

  // ── SINGLE IMAGE ────────────────────────────────────────
  return (
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
  );
}

export { EmojiPlaceholder as FallbackSVG };
