import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { getInjuries } from "../utils/injuries.js";

// ═══════════════════════════════════════════════════════════════
// Evening ROM Routine — 17 passive, gravity-assisted poses
// Wind-down mode: long holds (90s-5min), floor-based, restorative
// ═══════════════════════════════════════════════════════════════

// Calmer palette — warmer, dimmer than AM
const C = {
  bg: "#060b18", bgCard: "#0c1220", bgElevated: "#141d35",
  border: "rgba(255,255,255,0.06)", text: "#d8dce8",
  textMuted: "#6b7a96", textDim: "#3d4d68",
  accent: "#7c6df0", accentDark: "#5b4ec4", accentGlow: "rgba(124,109,240,0.12)",
  success: "#22c55e", danger: "#ef4444", warning: "#eab308",
  info: "#818cf8", calm: "#a78bfa",
};

// ── SVG HELPERS (same art style, slightly softer) ─────────────
const B = "#080e1e", T = "#a78bfa", L = "#3d4d68", W = "#c084fc", G = "#22c55e", I = "#818cf8";
const FLOOR = (y = 185) => `<line x1="20" y1="${y}" x2="280" y2="${y}" stroke="${L}" stroke-width="1.5" stroke-dasharray="4"/>`;
const HEAD = (cx, cy, r = 9) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${T}" stroke-width="2"/>`;
const LABEL = (text, y = 14) => `<text x="150" y="${y}" text-anchor="middle" fill="${L}" font-size="9" font-weight="600">${text}</text>`;
const pmSvg = (content, name) =>
  `<svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="200" rx="12" fill="${B}"/>${LABEL(name)}${FLOOR()}${content}</svg>`;

// ── SUPINE (lying on back) ──
const SUPINE = (y = 130) => `${HEAD(60, y)}
    <line x1="68" y1="${y}" x2="220" y2="${y}" stroke="${T}" stroke-width="2.5"/>
    <line x1="80" y1="${y}" x2="65" y2="${y + 15}" stroke="${T}" stroke-width="2"/>
    <line x1="80" y1="${y}" x2="95" y2="${y + 15}" stroke="${T}" stroke-width="2"/>
    <line x1="220" y1="${y}" x2="240" y2="${y + 5}" stroke="${T}" stroke-width="2"/>
    <line x1="220" y1="${y}" x2="240" y2="${y - 5}" stroke="${T}" stroke-width="2"/>`;

// ── PRONE (face down) ──
const PRONE = (y = 140) => `${HEAD(60, y)}
    <line x1="68" y1="${y}" x2="240" y2="${y}" stroke="${T}" stroke-width="2.5"/>
    <line x1="80" y1="${y}" x2="65" y2="${y - 12}" stroke="${T}" stroke-width="2"/>
    <line x1="80" y1="${y}" x2="95" y2="${y - 12}" stroke="${T}" stroke-width="2"/>
    <line x1="240" y1="${y}" x2="255" y2="${y + 5}" stroke="${T}" stroke-width="2"/>
    <line x1="240" y1="${y}" x2="255" y2="${y - 5}" stroke="${T}" stroke-width="2"/>`;

// ── WALL (vertical surface) ──
const WALL = (x = 260) => `<line x1="${x}" y1="20" x2="${x}" y2="185" stroke="${L}" stroke-width="2.5"/>
    <text x="${x - 4}" y="30" text-anchor="end" fill="${L}" font-size="7">WALL</text>`;

// ═══════════════════════════════════════════════════════════════
// 17 PM ROM EXERCISES — passive, gravity-assisted, restorative
// ═══════════════════════════════════════════════════════════════

const PM_EXERCISES = [
  // ── SECTION 1: SPINE — McKENZIE SUSTAINED EXTENSION ─────
  {
    id: "pm_mckenzie_sphinx", name: "McKenzie Prone on Elbows", subtitle: "Sphinx Pose — Sustained Extension",
    area: "Spine", section: 1,
    hold: 300, reps: "1 hold (work up from 2 min)", totalTime: 300,
    cues: [
      "Let your lower back SAG — don't hold it up with your muscles",
      "Elbows directly under shoulders — not forward",
      "Breathe slowly — each exhale deepens the sag",
      "This is passive time — read, listen to music, just relax",
      "If symptoms centralize (move toward midline), this is working",
    ],
    breathing: "Slow nasal breathing. Exhale fully — each exhale deepens the sag.",
    note: "McKenzie's sustained extension protocol. The gold standard for disc maintenance. Non-negotiable with microdiscectomy history.",
    injuryNotes: { lower_back: "⚠️ If pain radiates further into legs (peripheralizes), STOP. If it centralizes, stay longer." },
    svg: pmSvg(`
      ${PRONE(145)}
      <line x1="75" y1="145" x2="75" y2="185" stroke="${T}" stroke-width="2"/>
      <line x1="90" y1="145" x2="90" y2="185" stroke="${T}" stroke-width="2"/>
      ${HEAD(60, 95)}
      <line x1="68" y1="100" x2="80" y2="125" stroke="${T}" stroke-width="2.5"/>
      <line x1="80" y1="125" x2="80" y2="145" stroke="${T}" stroke-width="2"/>
      <line x1="68" y1="108" x2="60" y2="135" stroke="${T}" stroke-width="2"/>
      <line x1="60" y1="135" x2="60" y2="145" stroke="${T}" stroke-width="2"/>
      <line x1="80" y1="145" x2="200" y2="150" stroke="${T}" stroke-width="2"/>
      <path d="M80 140 Q140 130 200 148" stroke="${W}" stroke-width="1" fill="none" stroke-dasharray="3"/>
      <text x="140" y="125" text-anchor="middle" fill="${W}" font-size="8">Gravity sags belly</text>
      <text x="200" y="100" text-anchor="middle" fill="${G}" font-size="8">5 min hold</text>
      <text x="200" y="112" text-anchor="middle" fill="${I}" font-size="7">Elbows under shoulders</text>
    `, "McKENZIE SPHINX (5 MIN)"),
  },

  // ── SECTION 2: NECK ─────────────────────────────────────
  {
    id: "pm_neck_release", name: "Supine Neck Release", subtitle: "Gravity Traction",
    area: "Neck", section: 2,
    hold: 120, reps: "1 hold", totalTime: 120,
    cues: [
      "Zero effort — let the weight of your head do the work",
      "Jaw relaxed, tongue on roof of mouth, teeth apart",
      "If using towel: place it at the CURVE of your neck, not under your head",
    ],
    breathing: "Slow 4-count inhale, 6-count exhale",
    note: "Gentle cervical decompression. Gravity creates space between vertebrae — the opposite of active AM neck exercises.",
    injuryNotes: {},
    svg: pmSvg(`
      ${HEAD(60, 115)}
      <line x1="68" y1="115" x2="220" y2="115" stroke="${T}" stroke-width="2.5"/>
      <line x1="80" y1="115" x2="65" y2="130" stroke="${T}" stroke-width="2"/>
      <line x1="80" y1="115" x2="95" y2="130" stroke="${T}" stroke-width="2"/>
      <line x1="220" y1="115" x2="240" y2="120" stroke="${T}" stroke-width="2"/>
      <line x1="220" y1="115" x2="240" y2="110" stroke="${T}" stroke-width="2"/>
      <ellipse cx="60" cy="130" rx="25" ry="6" fill="none" stroke="${I}" stroke-width="1.5" stroke-dasharray="3"/>
      <text x="60" y="148" text-anchor="middle" fill="${I}" font-size="7">Rolled towel</text>
      <path d="M55 110 L50 100" stroke="${W}" stroke-width="1.5"/>
      <text x="40" y="95" text-anchor="end" fill="${W}" font-size="7">Gravity</text>
      <text x="200" y="175" text-anchor="middle" fill="${G}" font-size="8">2 min · zero effort</text>
    `, "SUPINE NECK RELEASE"),
  },
  {
    id: "pm_neck_rotation", name: "Supine Neck Rotation", subtitle: "Passive",
    area: "Neck", section: 2,
    hold: 30, reps: "3 each side", totalTime: 180,
    cues: [
      "Don't turn your head — let it FALL to the side",
      "Eyes closed",
      "Feel the weight of your skull stretching the opposite side",
    ],
    breathing: "Slow breathing throughout",
    note: "Passive cervical rotation. No muscular effort — gravity and your skull's weight create the stretch.",
    injuryNotes: {},
    svg: pmSvg(`
      ${HEAD(60, 120)}
      <line x1="68" y1="120" x2="220" y2="120" stroke="${T}" stroke-width="2.5"/>
      <line x1="80" y1="120" x2="65" y2="135" stroke="${T}" stroke-width="2"/>
      <line x1="80" y1="120" x2="95" y2="135" stroke="${T}" stroke-width="2"/>
      <line x1="220" y1="120" x2="240" y2="125" stroke="${T}" stroke-width="2"/>
      <line x1="220" y1="120" x2="240" y2="115" stroke="${T}" stroke-width="2"/>
      ${HEAD(60, 140)}
      <path d="M55 118 Q45 125 50 135" stroke="${W}" stroke-width="1.5" fill="none" stroke-dasharray="3"/>
      <text x="35" y="130" text-anchor="end" fill="${W}" font-size="7">FALL</text>
      <text x="200" y="175" text-anchor="middle" fill="${G}" font-size="8">30s each side · 3 reps</text>
    `, "SUPINE NECK ROTATION"),
  },

  // ── SECTION 3: SHOULDERS & CHEST ────────────────────────
  {
    id: "pm_chest_opener", name: "Supine Chest Opener", subtitle: "Lying on Rolled Towel",
    area: "Shoulders & Chest", section: 3,
    hold: 180, reps: "1 hold", totalTime: 180,
    cues: [
      "Arms relaxed — let gravity pull them toward the floor",
      "If arms don't touch the floor, that's fine — they'll get lower over weeks",
      "Breathe into the stretch — feel your ribcage expand sideways",
    ],
    breathing: "Deep diaphragmatic breathing — ribs expand laterally",
    note: "Passive pec major/minor stretch. Counters rounded posture from sitting, driving, and phone use. The towel creates gentle thoracic extension simultaneously.",
    injuryNotes: { shoulder: "⚠️ Cactus arms (elbows bent 90°) if shoulder pinches. This reduces end-range stress on the labrum." },
    svg: pmSvg(`
      ${HEAD(150, 100)}
      <line x1="150" y1="112" x2="150" y2="155" stroke="${T}" stroke-width="2.5"/>
      <line x1="150" y1="155" x2="140" y2="185" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="155" x2="160" y2="185" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="125" x2="90" y2="135" stroke="${T}" stroke-width="2"/>
      <line x1="90" y1="135" x2="60" y2="145" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="125" x2="210" y2="135" stroke="${T}" stroke-width="2"/>
      <line x1="210" y1="135" x2="240" y2="145" stroke="${T}" stroke-width="2"/>
      <ellipse cx="150" cy="155" rx="6" ry="30" fill="none" stroke="${I}" stroke-width="1.5" stroke-dasharray="3" transform="rotate(0 150 155)"/>
      <text x="150" y="178" text-anchor="middle" fill="${I}" font-size="7">Towel roll (spine)</text>
      <path d="M65 142 L55 150" stroke="${W}" stroke-width="1.5"/>
      <path d="M235 142 L245 150" stroke="${W}" stroke-width="1.5"/>
      <text x="45" y="155" text-anchor="end" fill="${W}" font-size="7">gravity</text>
      <text x="255" y="155" fill="${W}" font-size="7">gravity</text>
    `, "SUPINE CHEST OPENER"),
  },
  {
    id: "pm_arms_overhead", name: "Supine Arms Overhead", subtitle: "Gravity Lat Stretch",
    area: "Shoulders & Chest", section: 3,
    hold: 120, reps: "1 hold", totalTime: 120,
    cues: [
      "Thumbs up — externally rotated is safer for the labrum",
      "Keep ribs down — don't let your back arch off the floor",
      "Breathe into any tightness",
    ],
    breathing: "Slow breathing, exhale to relax deeper",
    note: "Passive lat and teres major stretch. Gravity does what active overhead reaching can't — sustained end-range hold without muscular effort.",
    injuryNotes: { shoulder: "⚠️ Thumbs up. Use a pillow to rest arms on if they don't reach the floor. Never force." },
    svg: pmSvg(`
      ${HEAD(150, 130)}
      <line x1="150" y1="142" x2="150" y2="175" stroke="${T}" stroke-width="2.5"/>
      <line x1="150" y1="175" x2="140" y2="185" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="175" x2="160" y2="185" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="148" x2="130" y2="115" stroke="${T}" stroke-width="2"/>
      <line x1="130" y1="115" x2="120" y2="85" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="148" x2="170" y2="115" stroke="${T}" stroke-width="2"/>
      <line x1="170" y1="115" x2="180" y2="85" stroke="${T}" stroke-width="2"/>
      <circle cx="118" cy="82" r="3" fill="${W}"/>
      <circle cx="182" cy="82" r="3" fill="${W}"/>
      <text x="105" y="78" text-anchor="end" fill="${W}" font-size="7">thumbs up</text>
      <path d="M120 90 L115 80" stroke="${W}" stroke-width="1"/>
      <path d="M180 90 L185 80" stroke="${W}" stroke-width="1"/>
      <text x="150" y="65" text-anchor="middle" fill="${G}" font-size="8">2 min · gravity pulls arms down</text>
    `, "SUPINE ARMS OVERHEAD"),
  },

  // ── SECTION 4: THORACIC SPINE ───────────────────────────
  {
    id: "pm_thoracic_roller", name: "Thoracic Extension Over Roller", subtitle: "Passive Drape",
    area: "Thoracic Spine", section: 4,
    hold: 120, reps: "Reposition roller 3 times (upper, mid, lower)", totalTime: 120,
    cues: [
      "Relax completely — let your body drape over the roller",
      "Move roller to 3 positions: upper back, mid back, lower thoracic",
      "Support your head with hands if neck is uncomfortable",
    ],
    breathing: "Exhale to sink deeper over the roller",
    note: "Passive thoracic extension. Your thoracic spine stiffens from sitting — this reverses it without effort. A stiff T-spine forces lumbar and cervical compensation.",
    injuryNotes: {},
    svg: pmSvg(`
      ${HEAD(150, 90)}
      <line x1="150" y1="102" x2="150" y2="140" stroke="${T}" stroke-width="2.5"/>
      <line x1="150" y1="140" x2="135" y2="175" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="140" x2="165" y2="175" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="110" x2="120" y2="125" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="110" x2="180" y2="125" stroke="${T}" stroke-width="2"/>
      <path d="M130 105 Q150 85 170 105" stroke="${T}" stroke-width="2" fill="none"/>
      <circle cx="150" cy="130" r="14" fill="none" stroke="${I}" stroke-width="2"/>
      <text x="150" y="134" text-anchor="middle" fill="${I}" font-size="7">ROLLER</text>
      <path d="M145 95 Q150 80 155 95" stroke="${W}" stroke-width="1" fill="none" stroke-dasharray="3"/>
      <text x="150" y="70" text-anchor="middle" fill="${W}" font-size="8">Drape back</text>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">2 min · 3 positions</text>
    `, "THORACIC DRAPE OVER ROLLER"),
  },

  // ── SECTION 5: LUMBAR SPINE ─────────────────────────────
  {
    id: "pm_spinal_twist", name: "Supine Spinal Twist", subtitle: "Gravity Rotation",
    area: "Lumbar Spine", section: 5,
    hold: 120, reps: "2 min each side", totalTime: 240,
    cues: [
      "Don't force knees to the floor — let gravity do it over time",
      "Keep BOTH shoulders on the ground",
      "The stretch should be in your lower back and obliques, not sharp",
      "Close your eyes — this is a relaxation pose",
    ],
    breathing: "Slow deep breathing. Exhale to let knees sink further.",
    note: "Restorative yoga staple (Supta Matsyendrasana). Gently rotates the lumbar spine while lying passively. The long hold stretches deep spinal fascia that short holds can't reach.",
    injuryNotes: { lower_back: "⚠️ Gentle range only. Don't force full rotation." },
    svg: pmSvg(`
      ${HEAD(60, 110)}
      <line x1="68" y1="110" x2="160" y2="110" stroke="${T}" stroke-width="2.5"/>
      <line x1="80" y1="110" x2="50" y2="100" stroke="${T}" stroke-width="2"/>
      <line x1="80" y1="110" x2="110" y2="100" stroke="${T}" stroke-width="2"/>
      <line x1="160" y1="110" x2="175" y2="130" stroke="${T}" stroke-width="2"/>
      <line x1="175" y1="130" x2="190" y2="150" stroke="${T}" stroke-width="2"/>
      <line x1="160" y1="110" x2="180" y2="125" stroke="${T}" stroke-width="2"/>
      <line x1="180" y1="125" x2="200" y2="145" stroke="${T}" stroke-width="2"/>
      <path d="M170 128 L185 155" stroke="${W}" stroke-width="1.5" stroke-dasharray="3"/>
      <text x="200" y="165" fill="${W}" font-size="7">Gravity pulls</text>
      <text x="80" y="85" text-anchor="middle" fill="${I}" font-size="7">Arms in T</text>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">2 min each side · eyes closed</text>
    `, "SUPINE SPINAL TWIST"),
  },

  // ── SECTION 6: HIPS ─────────────────────────────────────
  {
    id: "pm_legs_up_wall", name: "Legs Up the Wall", subtitle: "Viparita Karani",
    area: "Hips", section: 6,
    hold: 180, reps: "1 hold", totalTime: 180,
    cues: [
      "Butt doesn't have to touch the wall — get as close as comfortable",
      "Legs can be slightly bent if hamstrings are tight",
      "Close eyes — this is the single best restorative pose",
    ],
    breathing: "4-count inhale, 6-count exhale",
    note: "Drains fluid from legs, decompresses the spine, activates parasympathetic nervous system. Yoga therapists call this \"the great restorer.\"",
    injuryNotes: {},
    svg: pmSvg(`
      ${WALL(250)}
      ${HEAD(100, 145)}
      <line x1="108" y1="145" x2="200" y2="145" stroke="${T}" stroke-width="2.5"/>
      <line x1="115" y1="145" x2="105" y2="160" stroke="${T}" stroke-width="2"/>
      <line x1="115" y1="145" x2="125" y2="160" stroke="${T}" stroke-width="2"/>
      <line x1="200" y1="145" x2="220" y2="130" stroke="${T}" stroke-width="2"/>
      <line x1="220" y1="130" x2="245" y2="50" stroke="${T}" stroke-width="2"/>
      <line x1="200" y1="145" x2="230" y2="125" stroke="${T}" stroke-width="2"/>
      <line x1="230" y1="125" x2="248" y2="55" stroke="${T}" stroke-width="2"/>
      <text x="60" y="135" text-anchor="middle" fill="${I}" font-size="7">Palms up</text>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">3 min · the great restorer</text>
    `, "LEGS UP THE WALL"),
  },
  {
    id: "pm_wall_straddle", name: "Wall Straddle", subtitle: "Gravity Adductor Stretch",
    area: "Hips", section: 6,
    hold: 180, reps: "1 hold", totalTime: 180,
    cues: [
      "Do NOT force the legs apart — let gravity do ALL the work",
      "Start narrow and let them slowly drift wider",
      "If too intense, bend knees slightly or move butt from wall",
      "Gentle pull on inner thighs, not pain",
    ],
    breathing: "Slow breathing. Every exhale, legs may drift a tiny bit wider.",
    note: "Passive adductor and hip stretch using only gravity. Over weeks, range increases significantly without any muscular effort. The wall provides safety — legs can't go too far.",
    injuryNotes: {},
    svg: pmSvg(`
      ${WALL(260)}
      ${HEAD(100, 145)}
      <line x1="108" y1="145" x2="200" y2="145" stroke="${T}" stroke-width="2.5"/>
      <line x1="115" y1="145" x2="105" y2="160" stroke="${T}" stroke-width="2"/>
      <line x1="115" y1="145" x2="125" y2="160" stroke="${T}" stroke-width="2"/>
      <line x1="200" y1="145" x2="215" y2="120" stroke="${T}" stroke-width="2"/>
      <line x1="215" y1="120" x2="240" y2="40" stroke="${T}" stroke-width="2"/>
      <line x1="200" y1="145" x2="225" y2="130" stroke="${T}" stroke-width="2"/>
      <line x1="225" y1="130" x2="255" y2="100" stroke="${T}" stroke-width="2"/>
      <path d="M238 45 L250 55" stroke="${W}" stroke-width="1.5" stroke-dasharray="3"/>
      <path d="M252 95 L258 110" stroke="${W}" stroke-width="1.5" stroke-dasharray="3"/>
      <text x="150" y="60" text-anchor="middle" fill="${W}" font-size="8">Gravity pulls legs apart</text>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">3 min · slow drift wider</text>
    `, "WALL STRADDLE"),
  },
  {
    id: "pm_reclined_butterfly", name: "Reclined Butterfly", subtitle: "Supta Baddha Konasana",
    area: "Hips", section: 6,
    hold: 180, reps: "1 hold", totalTime: 180,
    cues: [
      "Support your knees — they should NOT be hanging unsupported",
      "The stretch should feel gentle, not intense",
      "Arms relaxed at sides or hands on belly",
      "Let everything melt into the floor",
    ],
    breathing: "Belly breathing — hands on belly to feel it rise and fall",
    note: "Restorative yoga favorite. Opens adductors and hip external rotators while completely passive. Pillow support means zero muscular effort. Different from AM butterfly (seated and active).",
    injuryNotes: { knee: "⚠️ Use extra pillow support under knees. Don't force knees down." },
    svg: pmSvg(`
      ${HEAD(150, 90)}
      <line x1="150" y1="102" x2="150" y2="140" stroke="${T}" stroke-width="2.5"/>
      <line x1="150" y1="115" x2="120" y2="125" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="115" x2="180" y2="125" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="140" x2="120" y2="160" stroke="${T}" stroke-width="2"/>
      <line x1="120" y1="160" x2="150" y2="175" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="140" x2="180" y2="160" stroke="${T}" stroke-width="2"/>
      <line x1="180" y1="160" x2="150" y2="175" stroke="${T}" stroke-width="2"/>
      <ellipse cx="150" cy="177" rx="8" ry="4" fill="${T}" opacity="0.3"/>
      <ellipse cx="115" cy="165" rx="18" ry="5" fill="none" stroke="${I}" stroke-width="1" stroke-dasharray="3"/>
      <ellipse cx="185" cy="165" rx="18" ry="5" fill="none" stroke="${I}" stroke-width="1" stroke-dasharray="3"/>
      <text x="115" y="178" text-anchor="middle" fill="${I}" font-size="6">pillow</text>
      <text x="185" y="178" text-anchor="middle" fill="${I}" font-size="6">pillow</text>
      <text x="150" y="60" text-anchor="middle" fill="${G}" font-size="8">3 min · supported · melt</text>
    `, "RECLINED BUTTERFLY"),
  },
  {
    id: "pm_supine_figure4", name: "Supine Figure-4", subtitle: "Gravity Piriformis Stretch",
    area: "Hips", section: 6,
    hold: 120, reps: "2 min each side", totalTime: 240,
    cues: [
      "Crossed ankle FLEXED (toes toward shin) to protect the knee",
      "Only pull the bottom leg in if the passive version isn't enough",
      "Head stays on the floor — relax your neck",
    ],
    breathing: "Slow breathing, exhale to relax deeper",
    note: "Different from AM seated figure-4. Lying down removes spinal load and allows gravity to create the stretch. Targets piriformis, glute medius, and deep external rotators.",
    injuryNotes: { knee: "⚠️ Keep ankle flexed. If knee pain, back off or skip." },
    svg: pmSvg(`
      ${HEAD(60, 120)}
      <line x1="68" y1="120" x2="160" y2="120" stroke="${T}" stroke-width="2.5"/>
      <line x1="80" y1="120" x2="65" y2="135" stroke="${T}" stroke-width="2"/>
      <line x1="80" y1="120" x2="95" y2="135" stroke="${T}" stroke-width="2"/>
      <line x1="160" y1="120" x2="170" y2="95" stroke="${T}" stroke-width="2"/>
      <line x1="170" y1="95" x2="185" y2="110" stroke="${T}" stroke-width="2"/>
      <line x1="160" y1="120" x2="180" y2="100" stroke="${T}" stroke-width="2"/>
      <line x1="180" y1="100" x2="200" y2="85" stroke="${T}" stroke-width="2"/>
      <text x="195" y="78" fill="${W}" font-size="7">4 shape</text>
      <path d="M175 92 L180 80" stroke="${W}" stroke-width="1.5" stroke-dasharray="3"/>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">2 min each side · passive</text>
    `, "SUPINE FIGURE-4"),
  },
  {
    id: "pm_happy_baby", name: "Happy Baby", subtitle: "Ananda Balasana",
    area: "Hips", section: 6,
    hold: 120, reps: "1 hold with gentle rocking", totalTime: 120,
    cues: [
      "Grab wherever you can reach — feet, ankles, or shins",
      "Tailbone stays on the floor (or close to it)",
      "Gentle rocking massages the sacrum",
      "Knees go toward armpits, not toward each other",
    ],
    breathing: "Slow belly breathing",
    note: "Opens hips in flexion + abduction + external rotation simultaneously. The gentle rocking provides a sacral massage. The deepest passive hip opener in the routine.",
    injuryNotes: { knee: "⚠️ Don't force deep knee flexion. Grab shins instead of feet if needed." },
    svg: pmSvg(`
      ${HEAD(150, 120)}
      <line x1="150" y1="132" x2="150" y2="155" stroke="${T}" stroke-width="2.5"/>
      <line x1="150" y1="155" x2="120" y2="140" stroke="${T}" stroke-width="2"/>
      <line x1="120" y1="140" x2="110" y2="115" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="155" x2="180" y2="140" stroke="${T}" stroke-width="2"/>
      <line x1="180" y1="140" x2="190" y2="115" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="140" x2="115" y2="120" stroke="${T}" stroke-width="1.5" stroke-dasharray="3"/>
      <line x1="150" y1="140" x2="185" y2="120" stroke="${T}" stroke-width="1.5" stroke-dasharray="3"/>
      <text x="100" y="108" text-anchor="end" fill="${W}" font-size="7">Grab feet</text>
      <text x="200" y="108" fill="${W}" font-size="7">Grab feet</text>
      <path d="M140 160 Q150 168 160 160" stroke="${I}" stroke-width="1" fill="none"/>
      <text x="150" y="178" text-anchor="middle" fill="${I}" font-size="7">Gentle rock</text>
      <text x="150" y="65" text-anchor="middle" fill="${G}" font-size="8">2 min · rock side to side</text>
    `, "HAPPY BABY"),
  },

  // ── SECTION 7: QUADS & HIP FLEXORS ─────────────────────
  {
    id: "pm_half_frog", name: "Supported Half Frog", subtitle: "Prone Passive Quad Stretch",
    area: "Quads & Hip Flexors", section: 7,
    hold: 120, reps: "2 min each side", totalTime: 240,
    cues: [
      "Don't pull actively — let the weight of the lower leg create the stretch",
      "If too intense, use a strap so your arm can relax",
      "Hips stay pressed into the floor",
      "Gentle quad pull, not a knee strain",
    ],
    breathing: "Slow breathing",
    note: "Different from AM prone quad stretch (which actively pulls). Here the leg weight and strap create the stretch passively. The long hold targets the rectus femoris and hip flexor fascia.",
    injuryNotes: { knee: "⚠️ Stop if knee is uncomfortable. Use a strap for gentler stretch." },
    svg: pmSvg(`
      ${PRONE(145)}
      <line x1="240" y1="145" x2="245" y2="115" stroke="${T}" stroke-width="2"/>
      <line x1="245" y1="115" x2="235" y2="95" stroke="${T}" stroke-width="2"/>
      <line x1="240" y1="145" x2="260" y2="150" stroke="${T}" stroke-width="2"/>
      <line x1="75" y1="145" x2="75" y2="185" stroke="${T}" stroke-width="2"/>
      <line x1="90" y1="145" x2="90" y2="185" stroke="${T}" stroke-width="2"/>
      <path d="M180 135 Q210 110 238 98" stroke="${I}" stroke-width="1" fill="none" stroke-dasharray="3"/>
      <text x="200" y="80" text-anchor="middle" fill="${W}" font-size="8">Gravity pulls heel</text>
      <text x="200" y="92" text-anchor="middle" fill="${I}" font-size="7">(strap optional)</text>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">2 min each side · passive</text>
    `, "SUPPORTED HALF FROG"),
  },

  // ── SECTION 8: HAMSTRINGS ───────────────────────────────
  {
    id: "pm_wall_hamstring", name: "Wall Hamstring Stretch", subtitle: "Supine — One Leg on Wall",
    area: "Hamstrings", section: 8,
    hold: 120, reps: "2 min each side", totalTime: 240,
    cues: [
      "Keep raised leg as straight as possible — knee can be slightly bent",
      "Scoot closer to wall for more intensity, further for less",
      "Head on the floor, arms relaxed",
      "Different from AM — here you do NOTHING",
    ],
    breathing: "Slow breathing, exhale to relax the hamstring",
    note: "The most effective passive hamstring stretch. Zero spinal load, zero effort. Research shows 2-min holds produce more lasting flexibility gains than 30s holds.",
    injuryNotes: { lower_back: "⚠️ Best hamstring stretch for your back — zero spinal load." },
    svg: pmSvg(`
      ${WALL(250)}
      ${HEAD(100, 140)}
      <line x1="108" y1="140" x2="200" y2="140" stroke="${T}" stroke-width="2.5"/>
      <line x1="115" y1="140" x2="105" y2="155" stroke="${T}" stroke-width="2"/>
      <line x1="115" y1="140" x2="125" y2="155" stroke="${T}" stroke-width="2"/>
      <line x1="200" y1="140" x2="245" y2="50" stroke="${T}" stroke-width="2.5"/>
      <line x1="200" y1="140" x2="220" y2="150" stroke="${T}" stroke-width="2"/>
      <line x1="220" y1="150" x2="240" y2="185" stroke="${T}" stroke-width="2"/>
      <text x="220" y="40" fill="${W}" font-size="7">Straight up</text>
      <text x="230" y="170" fill="${I}" font-size="7">Other leg flat</text>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">2 min each side · zero effort</text>
    `, "WALL HAMSTRING STRETCH"),
  },

  // ── SECTION 9: CALVES & ACHILLES ────────────────────────
  {
    id: "pm_wall_calf", name: "Wall Calf Stretch", subtitle: "Supine — Foot on Wall",
    area: "Calves & Achilles", section: 9,
    hold: 90, reps: "90s each side (straight + bent knee)", totalTime: 180,
    cues: [
      "Straight knee targets gastrocnemius, bent knee targets soleus — do both",
      "Don't push hard — let the wall and your foot weight create the stretch",
      "Keep heel on the wall",
    ],
    breathing: "Normal slow breathing",
    note: "Supine calf stretching removes the balance challenge of standing stretches and lets you hold longer. Covers both gastrocnemius (straight knee) and soleus (bent knee).",
    injuryNotes: {},
    svg: pmSvg(`
      ${WALL(250)}
      ${HEAD(100, 140)}
      <line x1="108" y1="140" x2="200" y2="140" stroke="${T}" stroke-width="2.5"/>
      <line x1="115" y1="140" x2="105" y2="155" stroke="${T}" stroke-width="2"/>
      <line x1="115" y1="140" x2="125" y2="155" stroke="${T}" stroke-width="2"/>
      <line x1="200" y1="140" x2="230" y2="100" stroke="${T}" stroke-width="2"/>
      <line x1="230" y1="100" x2="247" y2="80" stroke="${T}" stroke-width="2"/>
      <line x1="247" y1="80" x2="248" y2="70" stroke="${T}" stroke-width="1.5"/>
      <line x1="200" y1="140" x2="220" y2="150" stroke="${T}" stroke-width="2"/>
      <line x1="220" y1="150" x2="240" y2="185" stroke="${T}" stroke-width="2"/>
      <path d="M247 78 L250 68" stroke="${W}" stroke-width="2"/>
      <text x="230" y="60" text-anchor="end" fill="${W}" font-size="7">Ball of foot on wall</text>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">90s each · straight + bent knee</text>
    `, "WALL CALF STRETCH"),
  },

  // ── SECTION 10: FULL BODY RELEASE ───────────────────────
  {
    id: "pm_childs_pose", name: "Supported Child's Pose", subtitle: "Balasana with Pillow",
    area: "Full Body Release", section: 10,
    hold: 180, reps: "1 hold (turn head halfway)", totalTime: 180,
    cues: [
      "The pillow should support your entire torso — no effort to hold yourself up",
      "Knees can be wide or narrow — whatever feels best",
      "If knees hurt, place a blanket behind them",
      "This should feel like a full-body hug",
    ],
    breathing: "Breathe into your back — feel the ribs expand posteriorly",
    note: "Restorative yoga staple. Gently stretches lower back, hips, ankles, and shoulders while activating the parasympathetic nervous system. The supported version means zero effort.",
    injuryNotes: { knee: "⚠️ Place extra cushion behind knees. Skip if knee flexion is painful today." },
    svg: pmSvg(`
      ${HEAD(100, 120)}
      <line x1="108" y1="125" x2="150" y2="140" stroke="${T}" stroke-width="2.5"/>
      <line x1="100" y1="128" x2="75" y2="140" stroke="${T}" stroke-width="2"/>
      <line x1="100" y1="128" x2="85" y2="145" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="140" x2="180" y2="155" stroke="${T}" stroke-width="2"/>
      <line x1="180" y1="155" x2="185" y2="175" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="140" x2="185" y2="150" stroke="${T}" stroke-width="2"/>
      <line x1="185" y1="150" x2="195" y2="170" stroke="${T}" stroke-width="2"/>
      <ellipse cx="130" cy="140" rx="30" ry="10" fill="none" stroke="${I}" stroke-width="1.5" stroke-dasharray="3"/>
      <text x="130" y="160" text-anchor="middle" fill="${I}" font-size="7">pillow support</text>
      <text x="150" y="70" text-anchor="middle" fill="${G}" font-size="8">3 min · like a full-body hug</text>
    `, "SUPPORTED CHILD'S POSE"),
  },
  {
    id: "pm_savasana", name: "Savasana", subtitle: "Corpse Pose — Final Relaxation",
    area: "Full Body Release", section: 10,
    hold: 240, reps: "1 hold", totalTime: 240,
    cues: [
      "Scan from head to toes — release any tension you find",
      "Jaw unclenched, tongue relaxed, brow smooth",
      "Let every muscle surrender to gravity",
      "If thoughts arise, return to feeling your body's weight on the floor",
    ],
    breathing: "Natural breathing — don't control it. Let the body breathe itself.",
    note: "The most important pose in yoga. Savasana integrates everything — stretches settle, the nervous system downshifts, and the body prepares for sleep. Never skip this. This is where flexibility gains lock in.",
    injuryNotes: { lower_back: "⚠️ Pillow under knees — reduces lumbar lordosis and lets the spine fully relax." },
    svg: pmSvg(`
      ${HEAD(60, 120)}
      <line x1="68" y1="120" x2="240" y2="120" stroke="${T}" stroke-width="2.5"/>
      <line x1="80" y1="120" x2="55" y2="135" stroke="${T}" stroke-width="2"/>
      <line x1="80" y1="120" x2="95" y2="140" stroke="${T}" stroke-width="2"/>
      <line x1="240" y1="120" x2="255" y2="130" stroke="${T}" stroke-width="2"/>
      <line x1="240" y1="120" x2="260" y2="125" stroke="${T}" stroke-width="2"/>
      <ellipse cx="220" cy="115" rx="20" ry="6" fill="none" stroke="${I}" stroke-width="1" stroke-dasharray="3"/>
      <text x="220" y="105" text-anchor="middle" fill="${I}" font-size="6">pillow</text>
      <text x="60" y="105" text-anchor="middle" fill="${L}" font-size="7">Eyes closed</text>
      <text x="150" y="80" text-anchor="middle" fill="${W}" font-size="9">~ ~ ~ ~ ~ ~ ~ ~</text>
      <text x="150" y="65" text-anchor="middle" fill="${W}" font-size="7">Let go completely</text>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">3-5 min · do nothing · breathe</text>
    `, "SAVASANA"),
  },
];

// Section labels
const SECTIONS = {
  1: "SPINE · McKenzie Extension", 2: "NECK · Passive Release",
  3: "SHOULDERS & CHEST · Gravity Openers", 4: "THORACIC SPINE · Passive Drape",
  5: "LUMBAR SPINE · Restorative Twist", 6: "HIPS · Gravity Openers",
  7: "QUADS & HIP FLEXORS · Passive", 8: "HAMSTRINGS · Wall Stretch",
  9: "CALVES & ACHILLES · Supine", 10: "FULL BODY RELEASE",
};

// ═══════════════════════════════════════════════════════════════
// EVENING ROM SCREEN — guided wind-down experience
// ═══════════════════════════════════════════════════════════════

export default function EveningROMScreen({ onComplete, onClose }) {
  const [phase, setPhase] = useState("intro"); // "intro" | "exercise" | "transition" | "done"
  const [idx, setIdx] = useState(0);
  const [timer, setTimer] = useState(0);
  const [timerOn, setTimerOn] = useState(false);
  const timerRef = useRef(null);
  const startTime = useRef(Date.now());
  const [completedIds, setCompletedIds] = useState(new Set());

  // Get active injuries for injury notes
  const injuries = useMemo(() => {
    try { return getInjuries().filter(i => i.status !== "resolved"); } catch { return []; }
  }, []);
  const injuryKeys = useMemo(() => {
    const keys = new Set();
    injuries.forEach(i => {
      const gk = (i.gateKey || "").toLowerCase();
      if (gk) keys.add(gk);
      const area = (i.area || "").toLowerCase();
      if (area.includes("back") || area.includes("lumbar") || area.includes("spine")) keys.add("lower_back");
      if (area.includes("shoulder")) keys.add("shoulder");
      if (area.includes("knee")) keys.add("knee");
      if (area.includes("hip")) keys.add("hip");
    });
    return keys;
  }, [injuries]);

  const exercises = PM_EXERCISES;
  const ex = exercises[idx];
  const isLast = idx === exercises.length - 1;
  const progress = ((idx + (phase === "done" ? 1 : 0)) / exercises.length) * 100;

  // Timer countdown
  useEffect(() => {
    if (!timerOn || timer <= 0) {
      if (timerOn && timer <= 0) setTimerOn(false);
      return;
    }
    timerRef.current = setTimeout(() => setTimer(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timerOn, timer]);

  // Auto-advance when timer hits 0 — 5s preview (longer than AM's 3s)
  useEffect(() => {
    if (phase === "exercise" && timer === 0 && !timerOn) {
      if (!isLast) {
        setPhase("transition");
        const t = setTimeout(() => {
          setCompletedIds(s => new Set([...s, ex.id]));
          setIdx(i => i + 1);
          setPhase("exercise");
          window.scrollTo(0, 0);
        }, 5000);
        return () => clearTimeout(t);
      }
    }
  }, [timer, timerOn, phase, isLast, ex?.id]);

  // Reset timer when exercise changes
  useEffect(() => {
    if (phase === "exercise" && ex) {
      setTimer(ex.totalTime);
      setTimerOn(false);
    }
  }, [idx, phase]);

  const handleNext = useCallback(() => {
    setCompletedIds(s => new Set([...s, ex.id]));
    if (isLast) {
      setPhase("done");
    } else {
      setIdx(i => i + 1);
      setPhase("exercise");
      window.scrollTo(0, 0);
    }
  }, [isLast, ex?.id]);

  const handlePrev = useCallback(() => {
    if (idx > 0) {
      setIdx(i => i - 1);
      setPhase("exercise");
      window.scrollTo(0, 0);
    }
  }, [idx]);

  const handleComplete = useCallback(() => {
    try {
      const completions = JSON.parse(localStorage.getItem("apex_rom_completions") || "[]");
      completions.push({
        date: new Date().toISOString().split("T")[0],
        exercises: exercises.length,
        durationMinutes: Math.round((Date.now() - startTime.current) / 60000),
        type: "evening_rom",
      });
      while (completions.length > 90) completions.shift();
      localStorage.setItem("apex_rom_completions", JSON.stringify(completions));
    } catch {}
    onComplete();
  }, [exercises.length, onComplete]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${sec.toString().padStart(2, "0")}` : `${sec}s`;
  };

  const getInjuryNotes = (exercise) => {
    if (!exercise.injuryNotes) return [];
    const notes = [];
    Object.entries(exercise.injuryNotes).forEach(([key, note]) => {
      if (injuryKeys.has(key)) notes.push(note);
    });
    return notes;
  };

  // ── INTRO SCREEN ──
  if (phase === "intro") {
    return (
      <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16, padding: "0 0 90px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textDim, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: 2 }}>EVENING ROM</div>
          <div style={{ width: 40 }} />
        </div>

        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌙</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: "0 0 8px", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>EVENING ROM ROUTINE</h2>
          <div style={{ fontSize: 14, color: C.textMuted, marginBottom: 4 }}>Passive · Gravity-Assisted · Restorative</div>
          <div style={{ fontSize: 12, color: C.textDim }}>17 exercises · ~20-25 min · Floor-based</div>
        </div>

        <div style={{ background: C.bgCard, borderRadius: 16, padding: 14, border: `1px solid ${C.accent}15` }}>
          <div style={{ fontSize: 11, color: C.textMuted, fontStyle: "italic", lineHeight: 1.5, textAlign: "center", padding: "4px 8px" }}>
            Lie down and let gravity do the work. Long holds, slow breathing, zero effort. This routine winds down your nervous system and prepares your body for sleep.
          </div>
        </div>

        <div style={{ background: C.bgCard, borderRadius: 16, padding: 16, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: 1.5, marginBottom: 10 }}>SECTIONS</div>
          {Object.entries(SECTIONS).map(([num, name]) => {
            const count = exercises.filter(e => e.section === Number(num)).length;
            return (
              <div key={num} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${C.border}22` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: C.accent, fontWeight: 700, minWidth: 20 }}>{num}.</span>
                  <span style={{ fontSize: 12, color: C.text }}>{name}</span>
                </div>
                <span style={{ fontSize: 10, color: C.textDim }}>{count} ex</span>
              </div>
            );
          })}
        </div>

        {injuries.length > 0 && (
          <div style={{ background: C.bgCard, borderRadius: 16, padding: 14, border: `1px solid ${C.warning}20` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.warning, letterSpacing: 1.5, marginBottom: 6 }}>⚠️ ACTIVE CONDITIONS</div>
            <div style={{ fontSize: 11, color: C.textMuted }}>
              Exercises will include injury-specific notes for: {injuries.map(i => i.area || i.name).join(", ")}
            </div>
          </div>
        )}

        <button onClick={() => { setPhase("exercise"); setTimer(exercises[0].totalTime); }} style={{
          padding: "18px 24px", borderRadius: 14, border: "none", cursor: "pointer", width: "100%",
          background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`, color: "#fff",
          fontSize: 18, fontWeight: 800, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        }}>
          <span>🌙</span> BEGIN WIND-DOWN
        </button>
      </div>
    );
  }

  // ── DONE SCREEN ──
  if (phase === "done") {
    const duration = Math.round((Date.now() - startTime.current) / 60000);
    return (
      <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16, padding: "0 0 90px", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginTop: 30 }}>🌙</div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: C.calm, margin: 0, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>EVENING ROM COMPLETE</h2>
        <div style={{ fontSize: 14, color: C.textMuted }}>
          {exercises.length} poses · {duration || "< 1"} min
        </div>
        <div style={{ background: C.bgCard, borderRadius: 16, padding: 16, border: `1px solid ${C.accent}15`, margin: "8px 0" }}>
          <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7 }}>
            Your body is stretched, your spine is decompressed, and your nervous system has downshifted. Time to rest.
          </div>
        </div>
        <button onClick={handleComplete} style={{
          padding: "18px 24px", borderRadius: 14, border: "none", cursor: "pointer", width: "100%",
          background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`, color: "#fff",
          fontSize: 18, fontWeight: 800, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        }}>
          <span>✓</span> DONE — MARK COMPLETE
        </button>
      </div>
    );
  }

  // ── TRANSITION SCREEN (5s preview — slower than AM) ──
  if (phase === "transition" && !isLast) {
    const next = exercises[idx + 1];
    const isNewSection = next && ex && next.section !== ex.section;
    return (
      <div className="fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, minHeight: 300, padding: "0 0 90px" }}>
        {isNewSection && (
          <div style={{ fontSize: 11, fontWeight: 700, color: C.calm, letterSpacing: 2, marginBottom: 4 }}>
            NEXT SECTION
          </div>
        )}
        <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: 2 }}>
          UP NEXT · {idx + 2} of {exercises.length}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.textMuted, letterSpacing: 1 }}>
          {next?.area?.toUpperCase()}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1 }}>
          {next?.name}
        </div>
        {next?.subtitle && <div style={{ fontSize: 12, color: C.textDim, fontStyle: "italic" }}>{next.subtitle}</div>}
        <div style={{ width: "60%", borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}` }} dangerouslySetInnerHTML={{ __html: next?.svg || "" }} />
        <div style={{ fontSize: 11, color: C.textDim }}>Breathe and release</div>
      </div>
    );
  }

  // ── EXERCISE SCREEN ──
  if (!ex) return <div style={{ padding: 20, textAlign: "center", color: C.textMuted }}>No exercises available.</div>;

  const isNewSection = idx === 0 || exercises[idx - 1]?.section !== ex.section;
  const activeInjuryNotes = getInjuryNotes(ex);

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 0 90px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.textDim, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: 2 }}>EVENING ROM</div>
        <div style={{ fontSize: 11, color: C.textMuted }}>{idx + 1}/{exercises.length}</div>
      </div>

      {/* Progress bar — purple accent */}
      <div style={{ width: "100%", height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${progress}%`, height: "100%", background: C.accent, borderRadius: 2, transition: "width 0.6s ease" }} />
      </div>

      {/* Section header */}
      {isNewSection && (
        <div style={{ textAlign: "center", padding: "4px 0" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.calm, letterSpacing: 2, background: C.calm + "12", padding: "4px 12px", borderRadius: 6 }}>
            {SECTIONS[ex.section]}
          </span>
        </div>
      )}

      {/* Exercise card */}
      <div style={{ background: C.bgCard, borderRadius: 16, padding: 16, border: `1px solid ${C.border}` }}>
        {/* Area label */}
        <div style={{ fontSize: 11, color: C.accent, fontWeight: 600, marginBottom: 8, letterSpacing: 1 }}>
          {ex.area?.toUpperCase()} · {idx + 1} of {exercises.length}
        </div>

        {/* SVG illustration */}
        <div style={{ width: "100%", borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}`, marginBottom: 12 }} dangerouslySetInnerHTML={{ __html: ex.svg }} />

        {/* Exercise name + subtitle */}
        <h3 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: "0 0 2px", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1 }}>{ex.name}</h3>
        {ex.subtitle && <div style={{ fontSize: 12, color: C.textDim, fontStyle: "italic", marginBottom: 8 }}>{ex.subtitle}</div>}

        {/* Hold & reps */}
        <div style={{ display: "flex", gap: 12, fontSize: 12, color: C.textMuted, marginBottom: 10, flexWrap: "wrap" }}>
          <span>⏱ Hold: {formatTime(ex.hold)}</span>
          <span>🔄 {ex.reps}</span>
        </div>

        {/* Form cues */}
        <div style={{ marginBottom: 10 }}>
          {ex.cues.map((c, i) => (
            <div key={i} style={{ fontSize: 12, color: C.success, padding: "3px 0", display: "flex", gap: 6 }}>
              <span>✅</span><span>{c}</span>
            </div>
          ))}
        </div>

        {/* Breathing */}
        <div style={{ fontSize: 11, color: C.info, padding: "6px 10px", background: C.info + "08", borderRadius: 8, marginBottom: 8 }}>
          💨 {ex.breathing}
        </div>

        {/* Injury notes */}
        {activeInjuryNotes.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            {activeInjuryNotes.map((note, i) => (
              <div key={i} style={{ fontSize: 11, color: C.warning, padding: "6px 10px", background: C.warning + "10", borderRadius: 8, marginBottom: 4 }}>
                {note}
              </div>
            ))}
          </div>
        )}

        {/* Why it matters */}
        <div style={{ fontSize: 11, color: C.textDim, fontStyle: "italic", padding: "4px 0", borderTop: `1px solid ${C.border}22`, marginTop: 4 }}>
          {ex.note}
        </div>
      </div>

      {/* Timer — calm style */}
      <div style={{ background: C.bgCard, borderRadius: 16, padding: 16, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontSize: 36, fontWeight: 800, fontFamily: "'Bebas Neue',sans-serif",
            color: timer <= 10 && timer > 0 ? C.calm : timer === 0 ? C.success : C.accent,
          }}>
            {formatTime(timer)}
          </div>
          <div style={{ fontSize: 10, color: C.textDim }}>{timer === 0 ? "Let gravity settle" : "Remaining"}</div>
        </div>
        <button onClick={() => {
          if (timer === 0) { setTimer(ex.totalTime); setTimerOn(false); return; }
          setTimerOn(!timerOn);
        }} style={{
          width: 56, height: 56, borderRadius: 28,
          background: timerOn ? C.calm + "20" : timer === 0 ? C.textDim + "20" : C.accent + "20",
          border: `2px solid ${timerOn ? C.calm : timer === 0 ? C.textDim : C.accent}`,
          color: timerOn ? C.calm : timer === 0 ? C.textDim : C.accent,
          fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit",
        }}>
          {timer === 0 ? "↻" : timerOn ? "⏸" : "▶"}
        </button>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: 10 }}>
        {idx > 0 && (
          <button onClick={handlePrev} style={{
            flex: 1, padding: "14px 16px", borderRadius: 14, border: `1px solid ${C.border}`,
            background: C.bgElevated, color: C.text, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>← Prev</button>
        )}
        <button onClick={handleNext} style={{
          flex: 2, padding: "14px 16px", borderRadius: 14, border: "none",
          background: isLast ? `linear-gradient(135deg, ${C.accent}, ${C.accentDark})` : `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,
          color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          {isLast ? "✓ Complete" : "Next →"}
        </button>
      </div>

      {/* Skip */}
      <button onClick={handleNext} style={{
        background: "none", border: "none", color: C.textDim, fontSize: 11, cursor: "pointer",
        textAlign: "center", padding: "4px 0", fontFamily: "inherit",
      }}>
        Skip this exercise
      </button>
    </div>
  );
}
