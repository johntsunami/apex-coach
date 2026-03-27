// ═══════════════════════════════════════════════════════════════
// ExerciseImage — DEAD SIMPLE. Raw img tag. No loading state.
// If images render with this, the old loading logic was the bug.
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

export default function ExerciseImage({ exercise, size = "full", showBoth = false }) {
  const url = exercise?.gifUrl || exercise?.imageUrl;
  const url2 = exercise?.imageUrl2;
  const isThumbnail = size === "thumb";

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

  // ── SIDE-BY-SIDE (showBoth) ─────────────────────────────
  if (showBoth && url2) {
    return (
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
          <img src={url} alt="Start" referrerPolicy="no-referrer"
            style={{ width: "100%", height: 160, objectFit: "contain", borderRadius: 12, background: C.bgCard, border: `1px solid ${C.border}` }} />
          <img src={url2} alt="End" referrerPolicy="no-referrer"
            style={{ width: "100%", height: 160, objectFit: "contain", borderRadius: 12, background: C.bgCard, border: `1px solid ${C.border}` }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginTop: 2 }}>
          <div style={{ textAlign: "center", fontSize: 8, color: C.textDim }}>Start Position</div>
          <div style={{ textAlign: "center", fontSize: 8, color: C.textDim }}>End Position</div>
        </div>
      </div>
    );
  }

  // ── FULL SIZE — just an img tag ─────────────────────────
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

// Keep named export for backward compat (was FallbackSVG, now EmojiPlaceholder)
export { EmojiPlaceholder as FallbackSVG };
