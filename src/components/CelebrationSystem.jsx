// ═══════════════════════════════════════════════════════════════
// APEX Coach — Celebration & Positive Reinforcement System
// Canvas particle confetti + contextual achievement messages.
// Two tiers: exercise-complete (subtle) and workout-complete (full).
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react";

const C={bg:"#060b18",bgCard:"#0d1425",border:"rgba(255,255,255,0.08)",text:"#e8ecf4",textMuted:"#7a8ba8",textDim:"#4a5a78",teal:"#00d2c8",tealDark:"#00a89f"};
const reducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

// ── Color palettes ──────────────────────────────────────────────

const PALETTE_EXERCISE = ["#7EC8C8","#6BA8C4","#8BC8A0","#C8C87E","#A08EC4"];
const PALETTE_WORKOUT = ["#7EC8C8","#A08EC4","#C87E9E","#E8C87E","#7EB8E8","#A8E87E","#E8A87E","#FFFFFF"];

// ── Messages ────────────────────────────────────────────────────

const EXERCISE_MESSAGES = [
  { emoji: "💪", title: "Set complete", sub: "Your body is responding. Trust the work." },
  { emoji: "🔥", title: "Nailed it", sub: "One more down. Stay locked in." },
  { emoji: "✅", title: "Strong set", sub: "Consistency beats perfection every time." },
  { emoji: "⚡", title: "Keep moving", sub: "Every rep is a choice to be better." },
  { emoji: "🎯", title: "Locked in", sub: "This is how progress happens — one set at a time." },
  { emoji: "🏋️", title: "Work done", sub: "Your future self feels every rep you put in today." },
  { emoji: "💥", title: "That's it", sub: "You showed up and did it. That's the whole game." },
  { emoji: "🌊", title: "Flowing", sub: "You're in a rhythm. Ride it." },
];

const WELLNESS_MESSAGES = [
  { emoji: "🧘", title: "Session complete", sub: "Your nervous system thanks you." },
  { emoji: "🌬️", title: "Well done", sub: "That's genuine self-care." },
  { emoji: "✨", title: "Practice complete", sub: "Small consistent moments add up to everything." },
];

function getWorkoutMessage(data) {
  if (!data) return { emoji: "🏆", title: "Workout Complete", message: "You showed up. You did the work. That's everything." };
  if (data.streak >= 7) return { emoji: "🏆", title: "Workout Complete", message: "Seven or more sessions in. You're past the hardest part — this is becoming who you are." };
  if (data.isFloorSession) return { emoji: "🏆", title: "Workout Complete", message: "You showed up on a hard day and did what you could. That counts for everything." };
  if (data.injuryModified) return { emoji: "🏆", title: "Workout Complete", message: "Training smart around your body is not a compromise — it's the whole strategy." };
  if (data.phase === 1) return { emoji: "🎯", title: "Workout Complete", message: "Every session in this phase is laying the foundation. You're building something solid." };
  if (data.safetyLevel === "CLEAR" && data.totalSets >= 15) return { emoji: "💪", title: "Workout Complete", message: "This was a strong session. Your body absorbed a real training stimulus today. Well done." };
  return { emoji: "🏆", title: "Workout Complete", message: "You showed up. You did the work. That's everything." };
}

const MILESTONES = {
  first_workout: { emoji: "🌟", title: "First workout done", message: "The hardest one is always the first. You just proved you're someone who starts. Everything builds from here." },
  streak_7: { emoji: "🔥", title: "7-day streak", message: "One week of consistent training. This is where habits form. You're doing it." },
  sessions_30: { emoji: "💎", title: "30 sessions", message: "Thirty sessions means thirty times you chose to show up. That's a real athlete's mindset." },
  phase_complete: { emoji: "🚀", title: "Phase complete", message: "You've built the foundation. Time to build on it." },
  personal_record: { emoji: "🏅", title: "New personal best", message: "" },
};

// ═══════════════════════════════════════════════════════════════
// PARTICLE ENGINE (canvas-based)
// ═══════════════════════════════════════════════════════════════

class ParticleEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.particles = [];
    this.running = false;
    this.maxParticles = 220;
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  spawn(count, opts = {}) {
    if (reducedMotion) return;
    const { palette = PALETTE_EXERCISE, spawnX, spawnY, spawnW, spawnH, sizeMin = 3, sizeMax = 8, speedYMin = 1.5, speedYMax = 3.5, driftX = 1.5, lifeMin = 2.5, lifeMax = 3.5, gravity = 0, staggerMs = 600, shapes = ["rect", "circle"] } = opts;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const sx = spawnX ?? 0, sy = spawnY ?? 0, sw = spawnW ?? w, sh = spawnH ?? h * 0.15;

    for (let i = 0; i < count; i++) {
      // Remove oldest if at cap
      while (this.particles.length >= this.maxParticles) this.particles.shift();
      const delay = (i / count) * staggerMs;
      const p = {
        x: sx + Math.random() * sw,
        y: sy + Math.random() * sh,
        size: sizeMin + Math.random() * (sizeMax - sizeMin),
        color: palette[Math.floor(Math.random() * palette.length)],
        speedY: speedYMin + Math.random() * (speedYMax - speedYMin),
        speedX: (Math.random() - 0.5) * driftX * 2,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.12,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.03 + Math.random() * 0.04,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        alpha: 1,
        life: 1,
        decay: 1 / ((lifeMin + Math.random() * (lifeMax - lifeMin)) * 60),
        gravity,
        delay: delay / 1000,
        age: 0,
      };
      this.particles.push(p);
    }
    if (!this.running) this.loop();
  }

  loop = () => {
    this.running = true;
    const { ctx, canvas, particles } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.age += 1 / 60;
      if (p.age < p.delay) continue; // stagger delay
      p.y += p.speedY;
      p.x += p.speedX + Math.sin(p.wobble) * 0.8;
      p.wobble += p.wobbleSpeed;
      p.rotation += p.rotSpeed;
      p.speedY += p.gravity;
      p.life -= p.decay;
      p.alpha = Math.max(0, p.life);
      if (p.life <= 0) { particles.splice(i, 1); continue; }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;

      if (p.shape === "rect") {
        ctx.fillRect(-p.size / 2, -p.size * 0.225, p.size, p.size * 0.45);
      } else if (p.shape === "circle") {
        ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill();
      } else if (p.shape === "star") {
        this.drawStar(ctx, 0, 0, 5, p.size / 2, p.size / 4);
      } else if (p.shape === "ribbon") {
        ctx.fillRect(-p.size * 0.15, -p.size * 0.6, p.size * 0.3, p.size * 1.2);
      }
      ctx.restore();
    }

    if (particles.length > 0) requestAnimationFrame(this.loop);
    else { this.running = false; ctx.clearRect(0, 0, canvas.width, canvas.height); }
  };

  drawStar(ctx, cx, cy, spikes, outerR, innerR) {
    let rot = Math.PI / 2 * 3, step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR); rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR); rot += step;
    }
    ctx.closePath(); ctx.fill();
  }
}

// ═══════════════════════════════════════════════════════════════
// CELEBRATION LAYER (React component — fixed overlay)
// ═══════════════════════════════════════════════════════════════

let _celebrationRef = null; // global ref for API access

export function CelebrationLayer() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [toast, setToast] = useState(null); // { emoji, title, sub, type }
  const [card, setCard] = useState(null); // workout complete card data
  const toastTimer = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    engineRef.current = new ParticleEngine(canvasRef.current);
    engineRef.current.resize();
    const handleResize = () => engineRef.current?.resize();
    window.addEventListener("resize", handleResize);

    // Expose global API
    _celebrationRef = {
      exerciseComplete: () => {
        const idx = Math.floor(Math.random() * EXERCISE_MESSAGES.length);
        const msg = EXERCISE_MESSAGES[idx];
        engineRef.current?.spawn(48, { palette: PALETTE_EXERCISE, staggerMs: 600, shapes: ["rect", "circle"] });
        clearTimeout(toastTimer.current);
        setToast({ ...msg, type: "exercise" });
        toastTimer.current = setTimeout(() => setToast(null), 2800);
      },
      wellnessComplete: () => {
        const idx = Math.floor(Math.random() * WELLNESS_MESSAGES.length);
        const msg = WELLNESS_MESSAGES[idx];
        engineRef.current?.spawn(40, { palette: PALETTE_EXERCISE, staggerMs: 600, shapes: ["rect", "circle"] });
        clearTimeout(toastTimer.current);
        setToast({ ...msg, type: "wellness" });
        toastTimer.current = setTimeout(() => setToast(null), 2800);
      },
      workoutComplete: (sessionData) => {
        const w = window.innerWidth;
        // Phase 1: initial burst
        engineRef.current?.spawn(80, { palette: PALETTE_WORKOUT, sizeMin: 5, sizeMax: 14, speedYMin: 1, speedYMax: 3, gravity: 0.06, staggerMs: 400, shapes: ["rect", "circle", "star", "ribbon"] });
        // Phase 2: side waves
        setTimeout(() => {
          engineRef.current?.spawn(30, { palette: PALETTE_WORKOUT, spawnX: 0, spawnW: w * 0.2, spawnH: w * 0.4, sizeMin: 4, sizeMax: 10, driftX: 3, shapes: ["star", "ribbon"] });
          engineRef.current?.spawn(30, { palette: PALETTE_WORKOUT, spawnX: w * 0.8, spawnW: w * 0.2, spawnH: w * 0.4, sizeMin: 4, sizeMax: 10, driftX: 3, shapes: ["star", "ribbon"] });
        }, 500);
        // Phase 3: final shower
        setTimeout(() => {
          engineRef.current?.spawn(40, { palette: PALETTE_WORKOUT, sizeMin: 3, sizeMax: 7, speedYMin: 0.8, speedYMax: 2, lifeMin: 4, lifeMax: 6, staggerMs: 600, shapes: ["rect", "circle"] });
        }, 1100);
        // Show card
        setTimeout(() => {
          const msg = getWorkoutMessage(sessionData);
          setCard({ ...msg, sessionData });
        }, 300);
      },
      milestone: (type, data) => {
        const m = MILESTONES[type];
        if (!m) return;
        const msg = { ...m };
        if (type === "personal_record" && data) msg.message = `${data.exercise} — ${data.weight} for ${data.reps} reps. That's a record.`;
        if (type === "phase_complete" && data) { msg.title = `Phase ${data.from} complete`; msg.message = `You've built the foundation. Time to build on it. Phase ${data.to} starts now.`; }
        engineRef.current?.spawn(type === "first_workout" ? 220 : 180, { palette: PALETTE_WORKOUT, sizeMin: 5, sizeMax: 14, gravity: 0.06, staggerMs: 400, shapes: ["rect", "circle", "star", "ribbon"] });
        setTimeout(() => setCard({ ...msg, isMilestone: true }), 300);
      },
      dismiss: () => { setCard(null); setToast(null); },
    };

    return () => { window.removeEventListener("resize", handleResize); _celebrationRef = null; };
  }, []);

  return <>
    {/* Canvas layer — always present, pointer-events: none */}
    <canvas ref={canvasRef} style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", pointerEvents: "none", zIndex: 9999 }} />

    {/* Tier 1: Exercise/wellness toast */}
    {toast && <div role="status" aria-live="polite" aria-label={toast.title} style={{ position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", zIndex: 10000, background: "rgba(13,17,23,0.92)", border: `1px solid rgba(126,200,200,0.25)`, borderRadius: 20, padding: "16px 24px", maxWidth: 320, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", textAlign: "center", animation: "celebToastIn 350ms cubic-bezier(0.34,1.56,0.64,1) forwards" }}>
      <div style={{ fontSize: 28 }}>{toast.emoji}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginTop: 4 }}>{toast.title}</div>
      <div style={{ fontSize: 13, color: C.teal, marginTop: 2, lineHeight: 1.4 }}>{toast.sub}</div>
    </div>}

    {/* Tier 2: Workout complete / milestone card */}
    {card && <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setCard(null)}>
      <div role="status" aria-live="polite" aria-label={card.title} onClick={e => e.stopPropagation()} style={{ width: "min(420px, 88vw)", background: "rgba(13,17,23,0.95)", border: `1px solid rgba(126,200,200,0.3)`, borderRadius: 28, padding: "40px 32px", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", textAlign: "center", animation: reducedMotion ? "celebFadeIn 300ms ease forwards" : "celebCardIn 500ms cubic-bezier(0.34,1.56,0.64,1) forwards" }}>
        <div style={{ fontSize: 64, animation: reducedMotion ? "none" : "celebEmojiPop 600ms cubic-bezier(0.34,1.56,0.64,1) forwards" }}>{card.emoji}</div>
        <div style={{ fontSize: 26, fontWeight: 600, color: C.text, marginTop: 8 }}>{card.title}</div>
        {/* Stats row */}
        {card.sessionData && <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 16 }}>
          {[{ v: card.sessionData.exerciseCount || "—", l: "EXERCISES" }, { v: card.sessionData.totalSets || "—", l: "SETS" }, { v: card.sessionData.durationMinutes ? `${card.sessionData.durationMinutes}m` : "—", l: "TIME" }].map(s => (
            <div key={s.l}><div style={{ fontSize: 22, fontWeight: 600, color: C.text }}>{s.v}</div><div style={{ fontSize: 11, color: C.teal, letterSpacing: "0.1em" }}>{s.l}</div></div>
          ))}
        </div>}
        <div style={{ fontSize: 15, color: "#C8D6E5", lineHeight: 1.6, marginTop: 16, maxWidth: 340, margin: "16px auto 0" }}>{card.message}</div>
        <div style={{ height: 1, background: "rgba(126,200,200,0.15)", margin: "20px 0" }} />
        <button onClick={() => setCard(null)} style={{ width: "100%", padding: 14, borderRadius: 14, background: `linear-gradient(135deg,${C.teal},${C.tealDark})`, border: "none", color: "#000", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{card.isMilestone ? "Continue" : "View my recap"}</button>
        <div style={{ fontSize: 11, color: "#4A5568", marginTop: 12 }}>Rest well. You earned it.</div>
      </div>
    </div>}

    {/* Keyframe animations */}
    <style>{`
      @keyframes celebToastIn { from { transform: translateX(-50%) translateY(40px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
      @keyframes celebCardIn { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      @keyframes celebFadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes celebEmojiPop { 0% { transform: scale(0); } 60% { transform: scale(1.3); } 100% { transform: scale(1); } }
    `}</style>
  </>;
}

// ═══════════════════════════════════════════════════════════════
// GLOBAL API — any component can call these
// ═══════════════════════════════════════════════════════════════

export const CelebrationAPI = {
  exerciseComplete: () => _celebrationRef?.exerciseComplete(),
  wellnessComplete: () => _celebrationRef?.wellnessComplete(),
  workoutComplete: (data) => _celebrationRef?.workoutComplete(data),
  milestone: (type, data) => _celebrationRef?.milestone(type, data),
  dismiss: () => _celebrationRef?.dismiss(),
};

// Also expose on window for console testing
if (typeof window !== "undefined") window.CelebrationSystem = CelebrationAPI;
