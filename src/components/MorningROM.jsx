import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { getInjuries } from "../utils/injuries.js";

// ═══════════════════════════════════════════════════════════════
// Morning ROM Routine — 30 exercises, head-to-toe, guided experience
// ═══════════════════════════════════════════════════════════════

const C = {
  bg: "#060b18", bgCard: "#0d1425", bgElevated: "#162040",
  border: "rgba(255,255,255,0.08)", text: "#e8ecf4",
  textMuted: "#7a8ba8", textDim: "#4a5a78",
  teal: "#00d2c8", tealDark: "#00a89f", tealGlow: "rgba(0,210,200,0.15)",
  success: "#22c55e", danger: "#ef4444", warning: "#eab308",
  info: "#3b82f6", purple: "#a855f7", orange: "#f97316",
};

// ── SVG HELPERS (match exerciseSvgs.js art style) ─────────────
const B = "#0a1628", T = "#2dd4bf", L = "#4a5a78", W = "#eab308", G = "#22c55e", I = "#3b82f6";
const FLOOR = (y = 185) => `<line x1="20" y1="${y}" x2="280" y2="${y}" stroke="${L}" stroke-width="1.5" stroke-dasharray="4"/>`;
const HEAD = (cx, cy, r = 9) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${T}" stroke-width="2"/>`;
const LABEL = (text, y = 14) => `<text x="150" y="${y}" text-anchor="middle" fill="${L}" font-size="9" font-weight="600">${text}</text>`;
const romSvg = (content, name) =>
  `<svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="200" rx="12" fill="${B}"/>${LABEL(name)}${FLOOR()}${content}</svg>`;

// ── Standing figure helper ──
const STAND = (x, headY = 50) => {
  const h = headY, neck = h + 12, hip = neck + 40, knee = hip + 35, foot = knee + 35;
  return `${HEAD(x, h)}
    <line x1="${x}" y1="${neck}" x2="${x}" y2="${hip}" stroke="${T}" stroke-width="2.5"/>
    <line x1="${x}" y1="${hip}" x2="${x - 8}" y2="${foot}" stroke="${T}" stroke-width="2"/>
    <line x1="${x}" y1="${hip}" x2="${x + 8}" y2="${foot}" stroke="${T}" stroke-width="2"/>
    <line x1="${x}" y1="${neck + 8}" x2="${x - 18}" y2="${neck + 25}" stroke="${T}" stroke-width="2"/>
    <line x1="${x}" y1="${neck + 8}" x2="${x + 18}" y2="${neck + 25}" stroke="${T}" stroke-width="2"/>`;
};

// ── SUPINE (lying on back) ──
const SUPINE = (y = 130) => `${HEAD(60, y)}
    <line x1="68" y1="${y}" x2="220" y2="${y}" stroke="${T}" stroke-width="2.5"/>
    <line x1="80" y1="${y}" x2="65" y2="${y + 15}" stroke="${T}" stroke-width="2"/>
    <line x1="80" y1="${y}" x2="95" y2="${y + 15}" stroke="${T}" stroke-width="2"/>
    <line x1="220" y1="${y}" x2="240" y2="${y + 5}" stroke="${T}" stroke-width="2"/>
    <line x1="220" y1="${y}" x2="240" y2="${y - 5}" stroke="${T}" stroke-width="2"/>`;

// ── PRONE (lying face down) ──
const PRONE = (y = 140) => `${HEAD(60, y)}
    <line x1="68" y1="${y}" x2="240" y2="${y}" stroke="${T}" stroke-width="2.5"/>
    <line x1="80" y1="${y}" x2="65" y2="${y - 12}" stroke="${T}" stroke-width="2"/>
    <line x1="80" y1="${y}" x2="95" y2="${y - 12}" stroke="${T}" stroke-width="2"/>
    <line x1="240" y1="${y}" x2="255" y2="${y + 5}" stroke="${T}" stroke-width="2"/>
    <line x1="240" y1="${y}" x2="255" y2="${y - 5}" stroke="${T}" stroke-width="2"/>`;

// ── ALL HANDS & KNEES ──
const HANDS_KNEES = () => `${HEAD(80, 80)}
    <line x1="88" y1="85" x2="140" y2="105" stroke="${T}" stroke-width="2.5"/>
    <line x1="80" y1="92" x2="65" y2="140" stroke="${T}" stroke-width="2"/>
    <line x1="80" y1="92" x2="95" y2="140" stroke="${T}" stroke-width="2"/>
    <line x1="140" y1="105" x2="125" y2="145" stroke="${T}" stroke-width="2"/>
    <line x1="125" y1="145" x2="125" y2="${185}" stroke="${T}" stroke-width="2"/>
    <line x1="140" y1="105" x2="160" y2="145" stroke="${T}" stroke-width="2"/>
    <line x1="160" y1="145" x2="160" y2="${185}" stroke="${T}" stroke-width="2"/>
    <line x1="65" y1="140" x2="65" y2="${185}" stroke="${T}" stroke-width="1.5"/>
    <line x1="95" y1="140" x2="95" y2="${185}" stroke="${T}" stroke-width="1.5"/>`;

// ── SEATED ──
const SEATED = (x = 150, seatY = 110) => {
  const h = seatY - 60;
  return `${HEAD(x, h)}
    <line x1="${x}" y1="${h + 12}" x2="${x}" y2="${seatY}" stroke="${T}" stroke-width="2.5"/>
    <line x1="${x}" y1="${seatY}" x2="${x + 30}" y2="${seatY}" stroke="${T}" stroke-width="2"/>
    <line x1="${x + 30}" y1="${seatY}" x2="${x + 30}" y2="${seatY + 40}" stroke="${T}" stroke-width="2"/>
    <rect x="${x - 20}" y="${seatY}" width="40" height="5" rx="2" fill="${L}" opacity="0.5"/>
    <line x1="${x}" y1="${h + 20}" x2="${x - 18}" y2="${h + 35}" stroke="${T}" stroke-width="2"/>
    <line x1="${x}" y1="${h + 20}" x2="${x + 18}" y2="${h + 35}" stroke="${T}" stroke-width="2"/>`;
};

// ═══════════════════════════════════════════════════════════════
// 30 ROM EXERCISES — head to toe
// ═══════════════════════════════════════════════════════════════

const ROM_EXERCISES = [
  // ── SECTION 1: NECK (4) ──────────────────────────────────
  {
    id: "rom_neck_rotation", name: "Neck Rotation", area: "Neck", section: 1,
    hold: 3, reps: "5 each side", totalTime: 30,
    cues: ["Chin stays level — don't tilt", "Shoulders stay still", "Move slowly through stiffness"],
    breathing: "Exhale as you rotate, inhale at center",
    note: "Restores cervical rotation lost from screen time and sleeping positions.",
    injuryNotes: {},
    svg: romSvg(`
      ${STAND(120, 50)}
      ${HEAD(200, 50)}
      <path d="M135 46 Q160 35 190 46" stroke="${W}" stroke-width="1.5" fill="none" stroke-dasharray="4"/>
      <path d="M180 43 L190 46 L183 52" stroke="${W}" stroke-width="1.5" fill="none"/>
      <text x="160" y="30" text-anchor="middle" fill="${W}" font-size="8">ROTATE</text>
      <line x1="120" y1="62" x2="120" y2="102" stroke="${T}" stroke-width="2.5"/>
      <line x1="120" y1="102" x2="112" y2="150" stroke="${T}" stroke-width="2"/>
      <line x1="120" y1="102" x2="128" y2="150" stroke="${T}" stroke-width="2"/>
      <line x1="120" y1="70" x2="102" y2="87" stroke="${T}" stroke-width="2"/>
      <line x1="120" y1="70" x2="138" y2="87" stroke="${T}" stroke-width="2"/>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">Hold 3s each side</text>
    `, "NECK ROTATION"),
  },
  {
    id: "rom_neck_flex_ext", name: "Neck Flexion / Extension", area: "Neck", section: 1,
    hold: 2, reps: "5 full cycles", totalTime: 30,
    cues: ["Retract chin first — this is the foundation", "Don't force the end range", "If looking up causes dizziness, reduce range"],
    breathing: "Exhale during each movement, inhale at neutral",
    note: "McKenzie retraction is the #1 cervical self-treatment. Extension and flexion restore full sagittal plane motion.",
    injuryNotes: {},
    svg: romSvg(`
      ${STAND(90, 55)}
      ${HEAD(200, 40)}
      <line x1="200" y1="52" x2="200" y2="70" stroke="${T}" stroke-width="2"/>
      <path d="M200 35 L200 25" stroke="${W}" stroke-width="1.5"/>
      <text x="215" y="25" fill="${W}" font-size="7">UP</text>
      ${HEAD(200, 100)}
      <line x1="200" y1="112" x2="200" y2="130" stroke="${T}" stroke-width="2"/>
      <path d="M200 105 L200 115" stroke="${W}" stroke-width="1.5"/>
      <text x="215" y="118" fill="${W}" font-size="7">DOWN</text>
      <text x="90" y="175" text-anchor="middle" fill="${I}" font-size="8">Chin tuck first</text>
      <text x="200" y="175" text-anchor="middle" fill="${G}" font-size="8">2s each position</text>
    `, "NECK FLEXION / EXTENSION"),
  },
  {
    id: "rom_neck_lateral", name: "Neck Lateral Flexion", area: "Neck", section: 1,
    hold: 3, reps: "5 each side", totalTime: 30,
    cues: ["Shoulder stays DOWN — don't shrug to meet your ear", "Feel the stretch on the opposite side", "Keep face forward — don't rotate"],
    breathing: "Exhale as you tilt, inhale as you return",
    note: "Releases SCM, scalenes, and upper trap — the muscles that create tension headaches and forward head posture.",
    injuryNotes: {},
    svg: romSvg(`
      ${STAND(150, 50)}
      <path d="M155 46 Q168 38 175 50" stroke="${W}" stroke-width="1.5" fill="none"/>
      <text x="185" y="45" fill="${W}" font-size="8">TILT</text>
      <path d="M145 46 Q132 38 125 50" stroke="${W}" stroke-width="1.5" fill="none"/>
      <text x="105" y="45" fill="${W}" font-size="8">TILT</text>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">Ear to shoulder · 3s hold</text>
    `, "NECK LATERAL FLEXION"),
  },
  {
    id: "rom_neck_retraction", name: "Neck Retraction (Chin Tuck)", area: "Neck", section: 1,
    hold: 5, reps: "10", totalTime: 50,
    cues: ["Imagine a string pulling the back of your head up", "Don't look down — stay level", "You should feel a stretch at the base of the skull"],
    breathing: "Normal breathing throughout",
    note: "McKenzie foundation exercise. Corrects forward head posture and decompresses cervical discs. Do 10 reps every hour at your desk.",
    injuryNotes: {},
    svg: romSvg(`
      ${HEAD(120, 50)}
      <line x1="120" y1="62" x2="120" y2="102" stroke="${T}" stroke-width="2.5"/>
      <line x1="120" y1="70" x2="102" y2="87" stroke="${T}" stroke-width="2"/>
      <line x1="120" y1="70" x2="138" y2="87" stroke="${T}" stroke-width="2"/>
      <line x1="120" y1="102" x2="112" y2="150" stroke="${T}" stroke-width="2"/>
      <line x1="120" y1="102" x2="128" y2="150" stroke="${T}" stroke-width="2"/>
      ${HEAD(200, 50)}
      <path d="M130 50 L190 50" stroke="${W}" stroke-width="1.5" stroke-dasharray="4"/>
      <path d="M180 47 L190 50 L180 53" stroke="${W}" stroke-width="1.5" fill="none"/>
      <text x="160" y="42" text-anchor="middle" fill="${W}" font-size="8">RETRACT</text>
      <text x="200" y="70" text-anchor="middle" fill="${G}" font-size="7">"Double chin"</text>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">Hold 5s · 10 reps</text>
    `, "CHIN TUCK (McKENZIE)"),
  },

  // ── SECTION 2: SHOULDERS (4) ─────────────────────────────
  {
    id: "rom_shoulder_shrugs", name: "Shoulder Shrugs + Rolls", area: "Shoulders", section: 2,
    hold: 2, reps: "5 shrugs + 5 rolls back + 5 forward", totalTime: 40,
    cues: ["Exaggerate the circles", "Pull shoulder blades DOWN and BACK on each roll", "Release all tension on the drop"],
    breathing: "Inhale on shrug up, exhale on drop",
    note: "Resets upper trap tension accumulated overnight. The backward roll activates lower traps.",
    injuryNotes: { shoulder: "⚠️ If shrugs cause pinching, reduce range. Rolls should be pain-free." },
    svg: romSvg(`
      ${STAND(150, 45)}
      <path d="M132 60 L125 50 L132 55" stroke="${W}" stroke-width="1.5" fill="none"/>
      <path d="M168 60 L175 50 L168 55" stroke="${W}" stroke-width="1.5" fill="none"/>
      <text x="115" y="45" text-anchor="end" fill="${W}" font-size="8">UP</text>
      <text x="185" y="45" fill="${W}" font-size="8">UP</text>
      <path d="M100 80 Q95 65 105 55 Q115 45 125 55" stroke="${I}" stroke-width="1" fill="none" stroke-dasharray="3"/>
      <text x="85" y="70" fill="${I}" font-size="7">ROLL</text>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">Shrug, drop, then roll</text>
    `, "SHOULDER SHRUGS + ROLLS"),
  },
  {
    id: "rom_y_raise", name: "Y-Raise (Thumbs Up)", area: "Shoulders", section: 2,
    hold: 3, reps: "8", totalTime: 40,
    cues: ["THUMBS UP the entire time — this externally rotates the shoulder", "Don't arch your back — keep ribs down", "Arms at ~45° from ears, not straight overhead"],
    breathing: "Inhale as arms rise, exhale as they lower",
    note: "Activates lower traps and serratus anterior — the muscles that prevent shoulder impingement. Thumbs-up position is critical for labrum safety.",
    injuryNotes: { shoulder: "⚠️ Thumbs UP. Stay below pain threshold." },
    svg: romSvg(`
      ${HEAD(150, 50)}
      <line x1="150" y1="62" x2="150" y2="102" stroke="${T}" stroke-width="2.5"/>
      <line x1="150" y1="102" x2="142" y2="150" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="102" x2="158" y2="150" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="70" x2="115" y2="35" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="70" x2="185" y2="35" stroke="${T}" stroke-width="2"/>
      <circle cx="112" cy="32" r="3" fill="${W}"/>
      <circle cx="188" cy="32" r="3" fill="${W}"/>
      <text x="105" y="25" text-anchor="end" fill="${W}" font-size="7">👍</text>
      <text x="195" y="25" fill="${W}" font-size="7">👍</text>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">Y shape · thumbs up · 3s hold</text>
    `, "Y-RAISE (THUMBS UP)"),
  },
  {
    id: "rom_shoulder_passthrough", name: "Shoulder Pass-Through", area: "Shoulders", section: 2,
    hold: 0, reps: "10 full arcs", totalTime: 40,
    cues: ["Go WIDE enough that there's no pain", "Move slowly — this isn't a speed drill", "If shoulder pinches, widen your grip"],
    breathing: "Inhale arms overhead, exhale behind back",
    note: "Full shoulder circumduction ROM. Stretches pecs, anterior deltoid, and opens the thoracic spine.",
    injuryNotes: { shoulder: "⚠️ Use widest grip possible. Stop if pinching. Skip if severity 3+." },
    svg: romSvg(`
      ${HEAD(150, 55)}
      <line x1="150" y1="67" x2="150" y2="107" stroke="${T}" stroke-width="2.5"/>
      <line x1="150" y1="107" x2="142" y2="155" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="107" x2="158" y2="155" stroke="${T}" stroke-width="2"/>
      <line x1="100" y1="75" x2="200" y2="75" stroke="${I}" stroke-width="2" stroke-dasharray="3"/>
      <text x="95" y="72" text-anchor="end" fill="${I}" font-size="7">TOWEL</text>
      <line x1="150" y1="75" x2="100" y2="75" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="75" x2="200" y2="75" stroke="${T}" stroke-width="2"/>
      <path d="M100 75 Q80 40 100 20 Q150 -10 200 20 Q220 40 200 75" stroke="${W}" stroke-width="1.5" fill="none" stroke-dasharray="4"/>
      <path d="M195 25 L200 20 L205 28" stroke="${W}" stroke-width="1.5" fill="none"/>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">Wide grip · slow arc over head</text>
    `, "SHOULDER PASS-THROUGH"),
  },
  {
    id: "rom_cross_body_stretch", name: "Cross-Body Shoulder Stretch", area: "Shoulders", section: 2,
    imageUrl: "https://images.pexels.com/photos/5132103/pexels-photo-5132103.jpeg?auto=compress&cs=tinysrgb&w=600",
    hold: 15, reps: "2 each side", totalTime: 60,
    cues: ["Keep the stretching arm straight", "Pull at the elbow, not the wrist", "Don't let the shoulder hike up"],
    breathing: "Slow breathing, exhale deeper into stretch",
    note: "Stretches posterior deltoid and infraspinatus. Important for shoulder internal rotation ROM.",
    injuryNotes: { shoulder: "⚠️ Don't pull aggressively — moderate stretch only." },
    svg: romSvg(`
      ${HEAD(150, 50)}
      <line x1="150" y1="62" x2="150" y2="102" stroke="${T}" stroke-width="2.5"/>
      <line x1="150" y1="102" x2="142" y2="155" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="102" x2="158" y2="155" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="75" x2="100" y2="80" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="75" x2="120" y2="75" stroke="${T}" stroke-width="2"/>
      <line x1="120" y1="75" x2="105" y2="80" stroke="${W}" stroke-width="2"/>
      <path d="M110 72 L100 80 L108 85" stroke="${W}" stroke-width="1.5" fill="none"/>
      <text x="85" y="75" text-anchor="end" fill="${W}" font-size="8">PULL</text>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">15s each side · 2 reps</text>
    `, "CROSS-BODY STRETCH"),
  },

  // ── SECTION 3: WRISTS & HANDS (2) ───────────────────────
  {
    id: "rom_wrist_circles", name: "Wrist Circles", area: "Wrists & Hands", section: 3,
    hold: 0, reps: "10 each direction", totalTime: 30,
    cues: ["Full range — big circles", "Keep forearms still, only wrists move"],
    breathing: "Normal breathing",
    note: "Critical for anyone who types, lifts, or grips. Prevents carpal tunnel and wrist tendinitis.",
    injuryNotes: {},
    svg: romSvg(`
      <line x1="100" y1="80" x2="150" y2="100" stroke="${T}" stroke-width="2.5"/>
      <line x1="200" y1="80" x2="150" y2="100" stroke="${T}" stroke-width="2.5"/>
      ${HEAD(150, 55)}
      <line x1="150" y1="67" x2="150" y2="100" stroke="${T}" stroke-width="2.5"/>
      <line x1="150" y1="100" x2="142" y2="155" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="100" x2="158" y2="155" stroke="${T}" stroke-width="2"/>
      <circle cx="85" cy="80" r="12" fill="none" stroke="${W}" stroke-width="1.5" stroke-dasharray="3"/>
      <path d="M90 69 L93 67 L95 72" stroke="${W}" stroke-width="1.5" fill="none"/>
      <circle cx="215" cy="80" r="12" fill="none" stroke="${W}" stroke-width="1.5" stroke-dasharray="3"/>
      <path d="M220 69 L223 67 L225 72" stroke="${W}" stroke-width="1.5" fill="none"/>
      <text x="85" y="100" text-anchor="middle" fill="${W}" font-size="7">CW+CCW</text>
      <text x="215" y="100" text-anchor="middle" fill="${W}" font-size="7">CW+CCW</text>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">10 each direction</text>
    `, "WRIST CIRCLES"),
  },
  {
    id: "rom_finger_glides", name: "Finger Tendon Glides", area: "Wrists & Hands", section: 3,
    hold: 2, reps: "5 full cycles", totalTime: 30,
    cues: ["Move through each position deliberately", "Should feel a gentle pull, not pain"],
    breathing: "Normal breathing",
    note: "Keeps finger tendons gliding smoothly in their sheaths. Prevents trigger finger and carpal tunnel.",
    injuryNotes: {},
    svg: romSvg(`
      <line x1="60" y1="60" x2="60" y2="100" stroke="${T}" stroke-width="2"/>
      <line x1="60" y1="100" x2="55" y2="120" stroke="${T}" stroke-width="1.5"/>
      <line x1="60" y1="100" x2="58" y2="122" stroke="${T}" stroke-width="1.5"/>
      <line x1="60" y1="100" x2="62" y2="122" stroke="${T}" stroke-width="1.5"/>
      <line x1="60" y1="100" x2="65" y2="120" stroke="${T}" stroke-width="1.5"/>
      <text x="60" y="140" text-anchor="middle" fill="${G}" font-size="7">STRAIGHT</text>
      <line x1="130" y1="60" x2="130" y2="100" stroke="${T}" stroke-width="2"/>
      <line x1="130" y1="100" x2="125" y2="115" stroke="${T}" stroke-width="1.5"/>
      <line x1="125" y1="115" x2="128" y2="120" stroke="${T}" stroke-width="1"/>
      <line x1="130" y1="100" x2="135" y2="115" stroke="${T}" stroke-width="1.5"/>
      <line x1="135" y1="115" x2="132" y2="120" stroke="${T}" stroke-width="1"/>
      <text x="130" y="140" text-anchor="middle" fill="${W}" font-size="7">HOOK</text>
      <line x1="200" y1="60" x2="200" y2="100" stroke="${T}" stroke-width="2"/>
      <path d="M195 100 Q195 115 200 115 Q205 115 205 100" stroke="${T}" stroke-width="1.5" fill="none"/>
      <text x="200" y="140" text-anchor="middle" fill="${I}" font-size="7">FULL FIST</text>
      <line x1="250" y1="60" x2="250" y2="100" stroke="${T}" stroke-width="2"/>
      <line x1="245" y1="100" x2="240" y2="105" stroke="${T}" stroke-width="1.5"/>
      <line x1="255" y1="100" x2="260" y2="105" stroke="${T}" stroke-width="1.5"/>
      <text x="250" y="140" text-anchor="middle" fill="${L}" font-size="7">TABLE</text>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">5 cycles · 2s each position</text>
    `, "FINGER TENDON GLIDES"),
  },

  // ── SECTION 4: THORACIC SPINE (3) ───────────────────────
  {
    id: "rom_standing_extension", name: "Standing Extension (McKenzie)", area: "Thoracic Spine", section: 4,
    hold: 2, reps: "10 extension, 5 flexion", totalTime: 45,
    cues: ["Push hips FORWARD as you arch back", "Exhale and relax into the extension", "Forward lean: STRAIGHT back, bend at hips only"],
    breathing: "Exhale as you extend back, inhale as you return",
    note: "McKenzie standing extension. Centralizes disc material, opens the anterior spine.",
    injuryNotes: { lower_back: "⚠️ If pain radiates into legs during extension, reduce range. Stop if peripheralization." },
    svg: romSvg(`
      ${HEAD(100, 45)}
      <line x1="100" y1="57" x2="100" y2="97" stroke="${T}" stroke-width="2.5"/>
      <line x1="100" y1="65" x2="82" y2="82" stroke="${T}" stroke-width="2"/>
      <line x1="82" y1="82" x2="85" y2="97" stroke="${T}" stroke-width="1.5"/>
      <line x1="100" y1="65" x2="118" y2="82" stroke="${T}" stroke-width="2"/>
      <line x1="118" y1="82" x2="115" y2="97" stroke="${T}" stroke-width="1.5"/>
      <line x1="100" y1="97" x2="92" y2="150" stroke="${T}" stroke-width="2"/>
      <line x1="100" y1="97" x2="108" y2="150" stroke="${T}" stroke-width="2"/>
      ${HEAD(210, 65)}
      <path d="M210 72 Q215 85 210 100" stroke="${T}" stroke-width="2.5"/>
      <line x1="210" y1="100" x2="202" y2="150" stroke="${T}" stroke-width="2"/>
      <line x1="210" y1="100" x2="218" y2="150" stroke="${T}" stroke-width="2"/>
      <line x1="210" y1="80" x2="225" y2="95" stroke="${T}" stroke-width="2"/>
      <line x1="225" y1="95" x2="218" y2="102" stroke="${T}" stroke-width="1.5"/>
      <path d="M205 60 L200 50" stroke="${W}" stroke-width="1.5"/>
      <text x="195" y="45" text-anchor="end" fill="${W}" font-size="8">ARCH</text>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">Hands on hips · arch back</text>
    `, "STANDING EXTENSION (McKENZIE)"),
  },
  {
    id: "rom_lateral_flexion", name: "Standing Lateral Flexion", area: "Thoracic Spine", section: 4,
    hold: 3, reps: "5 each side", totalTime: 30,
    cues: ["Keep hips square — don't shift sideways", "Reach UP and OVER, not just to the side", "Feel the stretch along the entire side body"],
    breathing: "Inhale to reach up, exhale as you lean",
    note: "Opens the quadratus lumborum and lateral obliques. Critical for rotation sports.",
    injuryNotes: {},
    svg: romSvg(`
      ${HEAD(150, 50)}
      <line x1="150" y1="62" x2="150" y2="102" stroke="${T}" stroke-width="2.5"/>
      <line x1="150" y1="102" x2="142" y2="155" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="102" x2="158" y2="155" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="70" x2="180" y2="70" stroke="${T}" stroke-width="2"/>
      <path d="M150 70 Q145 50 120 40" stroke="${T}" stroke-width="2" fill="none"/>
      <path d="M125 38 L120 40 L125 45" stroke="${W}" stroke-width="1.5" fill="none"/>
      <text x="108" y="35" text-anchor="end" fill="${W}" font-size="8">LEAN</text>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">Reach up and over · 3s hold</text>
    `, "STANDING LATERAL FLEXION"),
  },
  {
    id: "rom_thoracic_rotation", name: "Standing Thoracic Rotation", area: "Thoracic Spine", section: 4,
    hold: 3, reps: "5 each side", totalTime: 30,
    cues: ["HIPS STAY FORWARD — only your ribcage rotates", "Look behind you as you rotate", "If your lower back is moving, you're going too far"],
    breathing: "Exhale as you rotate, inhale at center",
    note: "Your lumbar spine should NOT rotate under load — your thoracic spine does the rotating. If T-spine is stiff, the lumbar compensates. This prevents that.",
    injuryNotes: { lower_back: "⚠️ Keep hips completely still. Only upper back rotates." },
    svg: romSvg(`
      ${HEAD(150, 50)}
      <line x1="150" y1="62" x2="150" y2="102" stroke="${T}" stroke-width="2.5"/>
      <line x1="150" y1="102" x2="142" y2="155" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="102" x2="158" y2="155" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="70" x2="130" y2="80" stroke="${T}" stroke-width="2"/>
      <line x1="130" y1="80" x2="140" y2="85" stroke="${T}" stroke-width="1.5"/>
      <line x1="150" y1="70" x2="170" y2="80" stroke="${T}" stroke-width="2"/>
      <line x1="170" y1="80" x2="160" y2="85" stroke="${T}" stroke-width="1.5"/>
      <path d="M140 62 Q120 55 110 65" stroke="${W}" stroke-width="1.5" fill="none" stroke-dasharray="3"/>
      <path d="M160 62 Q180 55 190 65" stroke="${W}" stroke-width="1.5" fill="none" stroke-dasharray="3"/>
      <text x="95" y="62" text-anchor="end" fill="${W}" font-size="8">ROTATE</text>
      <text x="205" y="62" fill="${W}" font-size="8">ROTATE</text>
      <line x1="142" y1="110" x2="158" y2="110" stroke="${I}" stroke-width="3"/>
      <text x="150" y="125" text-anchor="middle" fill="${I}" font-size="7">HIPS FIXED</text>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">Arms crossed · rotate upper body</text>
    `, "STANDING THORACIC ROTATION"),
  },

  // ── SECTION 5: LUMBAR SPINE (2) ─────────────────────────
  {
    id: "rom_mckenzie_pressup", name: "McKenzie Press-Up", area: "Lumbar Spine", section: 5,
    imageUrl: "https://images.pexels.com/photos/4708411/pexels-photo-4708411.jpeg?auto=compress&cs=tinysrgb&w=600",
    hold: 2, reps: "10", totalTime: 40,
    cues: ["HIPS STAY ON THE FLOOR — this is not a push-up", "Exhale and let your back sag at the top", "If symptoms centralize (move toward midline), this is working"],
    breathing: "Exhale at top of extension, inhale as you lower",
    note: "McKenzie's most important back exercise. Extension-biased protocol for disc maintenance. Do daily — non-negotiable with microdiscectomy history.",
    injuryNotes: { lower_back: "⚠️ If pain radiates further into legs (peripheralizes), STOP and report to PT." },
    svg: romSvg(`
      ${PRONE(140)}
      <line x1="75" y1="140" x2="75" y2="185" stroke="${T}" stroke-width="2"/>
      <line x1="90" y1="140" x2="90" y2="185" stroke="${T}" stroke-width="2"/>
      ${HEAD(60, 85)}
      <path d="M68 90 Q90 105 95 130" stroke="${T}" stroke-width="2.5" fill="none"/>
      <line x1="75" y1="100" x2="75" y2="140" stroke="${T}" stroke-width="2"/>
      <line x1="85" y1="105" x2="85" y2="140" stroke="${T}" stroke-width="2"/>
      <path d="M60 80 L55 70" stroke="${W}" stroke-width="1.5"/>
      <text x="45" y="65" text-anchor="end" fill="${W}" font-size="8">PRESS UP</text>
      <text x="200" y="110" text-anchor="middle" fill="${I}" font-size="8">Hips stay down</text>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">10 reps · 2s hold at top</text>
    `, "McKENZIE PRESS-UP"),
  },
  {
    id: "rom_cat_cow", name: "Cat-Cow", area: "Lumbar Spine", section: 5,
    hold: 2, reps: "10 full cycles", totalTime: 40,
    cues: ["Move one vertebra at a time", "Exhale on cat (round up), inhale on cow (arch down)", "Keep arms straight — move through your spine only"],
    breathing: "Exhale rounding up, inhale arching down",
    note: "Gentle spinal segmental motion that lubricates the facet joints and discs. Safe for post-surgical backs at slow speed.",
    injuryNotes: { lower_back: "⚠️ Move slowly. No pain at end range." },
    svg: romSvg(`
      ${HANDS_KNEES()}
      <path d="M88 85 Q110 70 140 80" stroke="${W}" stroke-width="1.5" fill="none" stroke-dasharray="3"/>
      <text x="115" y="65" text-anchor="middle" fill="${W}" font-size="7">CAT ↑</text>
      <path d="M88 95 Q110 110 140 100" stroke="${I}" stroke-width="1.5" fill="none" stroke-dasharray="3"/>
      <text x="115" y="120" text-anchor="middle" fill="${I}" font-size="7">COW ↓</text>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">10 cycles · 2s each position</text>
    `, "CAT-COW"),
  },

  // ── SECTION 6: HIPS (6) ─────────────────────────────────
  {
    id: "rom_hip_kneeling_ext", name: "Hip Extension in Kneeling (McKenzie)", area: "Hips", section: 6,
    imageUrl: "https://images.pexels.com/photos/5331197/pexels-photo-5331197.jpeg?auto=compress&cs=tinysrgb&w=600",
    hold: 15, reps: "3 each side", totalTime: 90,
    cues: ["Squeeze the glute of the BACK leg", "Don't arch your lower back — tuck pelvis slightly", "Feel the stretch in the front of the back hip"],
    breathing: "Exhale as you push forward, breathe normally during hold",
    note: "McKenzie hip exercise #1. Hip extension is the most commonly lost hip ROM from sitting. This is your priority hip stretch.",
    injuryNotes: { knee: "⚠️ Place a pad under the kneeling knee. Don't let front knee travel past toes if painful." },
    svg: romSvg(`
      ${HEAD(130, 40)}
      <line x1="130" y1="52" x2="130" y2="90" stroke="${T}" stroke-width="2.5"/>
      <line x1="130" y1="60" x2="112" y2="75" stroke="${T}" stroke-width="2"/>
      <line x1="130" y1="60" x2="148" y2="75" stroke="${T}" stroke-width="2"/>
      <line x1="130" y1="90" x2="110" y2="120" stroke="${T}" stroke-width="2"/>
      <line x1="110" y1="120" x2="105" y2="185" stroke="${T}" stroke-width="2"/>
      <line x1="130" y1="90" x2="170" y2="130" stroke="${T}" stroke-width="2"/>
      <line x1="170" y1="130" x2="200" y2="185" stroke="${T}" stroke-width="2"/>
      <line x1="170" y1="130" x2="170" y2="185" stroke="${T}" stroke-width="1.5"/>
      <path d="M135 88 L145 80" stroke="${W}" stroke-width="1.5"/>
      <text x="155" y="78" fill="${W}" font-size="8">PUSH FWD</text>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">Half-kneeling · 15s hold</text>
    `, "HIP EXTENSION KNEELING"),
  },
  {
    id: "rom_knee_to_chest", name: "Single Knee to Chest", area: "Hips", section: 6,
    hold: 15, reps: "3 each side", totalTime: 90,
    cues: ["Keep the other leg flat on the floor", "Pull knee toward your armpit, not your midline", "Relax your neck and shoulders"],
    breathing: "Exhale as you pull knee in, breathe normally during hold",
    note: "Stretches glute max and lower back. Also decompresses the lumbar spine.",
    injuryNotes: { lower_back: "⚠️ Keep non-working leg bent if back is tight today." },
    svg: romSvg(`
      ${SUPINE(130)}
      <line x1="220" y1="130" x2="200" y2="100" stroke="${T}" stroke-width="2"/>
      <line x1="200" y1="100" x2="180" y2="120" stroke="${T}" stroke-width="2"/>
      <line x1="100" y1="120" x2="180" y2="115" stroke="${T}" stroke-width="2" stroke-dasharray="3"/>
      <path d="M195 105 L190 95" stroke="${W}" stroke-width="1.5"/>
      <text x="185" y="90" text-anchor="end" fill="${W}" font-size="8">PULL</text>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">Knee to chest · 15s each side</text>
    `, "SINGLE KNEE TO CHEST"),
  },
  {
    id: "rom_double_knees", name: "Double Knees to Chest", area: "Hips", section: 6,
    hold: 20, reps: "3", totalTime: 60,
    cues: ["Wrap arms around shins or behind knees", "Gentle rocking massages the lumbar paraspinals", "Keep head on the floor"],
    breathing: "Slow deep breaths",
    note: "Full lumbar flexion. Opens the posterior disc space. Complements the McKenzie extension work.",
    injuryNotes: { lower_back: "⚠️ Gentle — don't force full flexion if back is irritated today." },
    svg: romSvg(`
      ${HEAD(60, 120)}
      <line x1="68" y1="120" x2="130" y2="120" stroke="${T}" stroke-width="2.5"/>
      <line x1="130" y1="120" x2="130" y2="90" stroke="${T}" stroke-width="2"/>
      <line x1="130" y1="90" x2="110" y2="100" stroke="${T}" stroke-width="2"/>
      <line x1="130" y1="120" x2="145" y2="90" stroke="${T}" stroke-width="2"/>
      <line x1="145" y1="90" x2="125" y2="95" stroke="${T}" stroke-width="2"/>
      <path d="M90 110 Q110 80 130 88" stroke="${I}" stroke-width="1.5" fill="none" stroke-dasharray="3"/>
      <text x="100" y="80" text-anchor="middle" fill="${I}" font-size="7">Arms wrap</text>
      <path d="M115 125 Q120 135 125 125" stroke="${W}" stroke-width="1" fill="none"/>
      <text x="180" y="130" fill="${W}" font-size="7">Rock gently</text>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">Both knees · 20s hold · rock</text>
    `, "DOUBLE KNEES TO CHEST"),
  },
  {
    id: "rom_figure_4", name: "Seated Figure-4 (Piriformis)", area: "Hips", section: 6,
    hold: 15, reps: "3 each side", totalTime: 90,
    cues: ["Keep the crossed ankle FLEXED to protect the knee", "Lean forward from the hips — don't round your back", "Press the knee gently — don't force"],
    breathing: "Exhale as you lean forward",
    note: "Stretches piriformis, glute medius, and hip external rotators. Prevents piriformis syndrome that mimics sciatica.",
    injuryNotes: { knee: "⚠️ Keep ankle flexed. If knee pain occurs, back off." },
    svg: romSvg(`
      ${SEATED(130, 105)}
      <line x1="160" y1="105" x2="175" y2="105" stroke="${T}" stroke-width="2"/>
      <line x1="175" y1="105" x2="175" y2="145" stroke="${T}" stroke-width="2"/>
      <line x1="160" y1="105" x2="170" y2="90" stroke="${T}" stroke-width="2"/>
      <line x1="170" y1="90" x2="145" y2="90" stroke="${T}" stroke-width="2"/>
      <text x="155" y="85" text-anchor="middle" fill="${W}" font-size="7">4-shape</text>
      <path d="M130 75 L125 82" stroke="${W}" stroke-width="1.5"/>
      <text x="115" y="82" text-anchor="end" fill="${W}" font-size="7">LEAN</text>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">Ankle on knee · lean forward · 15s</text>
    `, "SEATED FIGURE-4"),
  },
  {
    id: "rom_butterfly", name: "Butterfly Stretch (Adductors)", area: "Hips", section: 6,
    imageUrl: "https://images.pexels.com/photos/7592487/pexels-photo-7592487.jpeg?auto=compress&cs=tinysrgb&w=600",
    hold: 20, reps: "3", totalTime: 60,
    cues: ["Sit up TALL — don't round forward", "Use elbows on inner thighs for gentle pressure", "Feet closer to body = more intense"],
    breathing: "Slow breathing, exhale deeper into stretch",
    note: "Opens adductors and hip internal rotation. Critical for squat depth and lateral movement in sports.",
    injuryNotes: { knee: "⚠️ Don't force knees down. Use gentle elbow pressure only." },
    svg: romSvg(`
      ${HEAD(150, 40)}
      <line x1="150" y1="52" x2="150" y2="100" stroke="${T}" stroke-width="2.5"/>
      <line x1="150" y1="60" x2="132" y2="75" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="60" x2="168" y2="75" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="100" x2="120" y2="130" stroke="${T}" stroke-width="2"/>
      <line x1="120" y1="130" x2="150" y2="145" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="100" x2="180" y2="130" stroke="${T}" stroke-width="2"/>
      <line x1="180" y1="130" x2="150" y2="145" stroke="${T}" stroke-width="2"/>
      <ellipse cx="150" cy="145" rx="5" ry="3" fill="${T}"/>
      <path d="M125 128 L115 135" stroke="${W}" stroke-width="1.5"/>
      <path d="M175 128 L185 135" stroke="${W}" stroke-width="1.5"/>
      <text x="105" y="140" text-anchor="end" fill="${W}" font-size="7">DOWN</text>
      <text x="195" y="140" fill="${W}" font-size="7">DOWN</text>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">Soles together · 20s hold</text>
    `, "BUTTERFLY STRETCH"),
  },
  {
    id: "rom_hip_abd_er", name: "Hip Abduction/ER in Sitting (McKenzie)", area: "Hips", section: 6,
    hold: 5, reps: "10 each side", totalTime: 100,
    cues: ["This is REPEATED end-range loading — the McKenzie principle for hips", "Each rep should reach slightly further", "Stop if sharp pain in the groin"],
    breathing: "Exhale on each push",
    note: "McKenzie hip exercise #3. Repeated end-range loading restores hip abduction/ER ROM. Key for anyone with hip stiffness from sitting.",
    injuryNotes: {},
    svg: romSvg(`
      ${SEATED(130, 105)}
      <line x1="160" y1="105" x2="175" y2="105" stroke="${T}" stroke-width="2"/>
      <line x1="175" y1="105" x2="175" y2="145" stroke="${T}" stroke-width="2"/>
      <line x1="160" y1="105" x2="170" y2="88" stroke="${T}" stroke-width="2"/>
      <line x1="170" y1="88" x2="148" y2="88" stroke="${T}" stroke-width="2"/>
      <line x1="130" y1="75" x2="155" y2="85" stroke="${T}" stroke-width="2"/>
      <path d="M168 85 L175 75" stroke="${W}" stroke-width="1.5"/>
      <text x="180" y="72" fill="${W}" font-size="8">PUSH OUT</text>
      <text x="220" y="100" fill="${I}" font-size="7">Repeated</text>
      <text x="220" y="110" fill="${I}" font-size="7">end-range</text>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">5s push · 10 reps each side</text>
    `, "HIP ABD/ER (McKENZIE)"),
  },

  // ── SECTION 7: QUADS (2) ────────────────────────────────
  {
    id: "rom_prone_quad", name: "Prone Quad Stretch", area: "Quads", section: 7,
    hold: 20, reps: "3 each side", totalTime: 120,
    cues: ["Keep hips pressed into the floor — don't let the hip lift", "If you can't reach your foot, use a towel or strap", "Feel the stretch in the front of the thigh"],
    breathing: "Slow breathing, exhale deeper into stretch",
    note: "The most effective quad stretch — gravity assists and the prone position prevents lumbar compensation.",
    injuryNotes: { knee: "⚠️ Don't force knee flexion past comfortable range." },
    svg: romSvg(`
      ${PRONE(140)}
      <line x1="240" y1="140" x2="250" y2="110" stroke="${T}" stroke-width="2"/>
      <line x1="250" y1="110" x2="240" y2="90" stroke="${T}" stroke-width="2"/>
      <line x1="240" y1="140" x2="260" y2="145" stroke="${T}" stroke-width="2"/>
      <path d="M180 130 Q200 100 235 93" stroke="${I}" stroke-width="1" fill="none" stroke-dasharray="3"/>
      <text x="200" y="80" text-anchor="middle" fill="${W}" font-size="8">Heel to glute</text>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">Prone · 20s each side</text>
    `, "PRONE QUAD STRETCH"),
  },
  {
    id: "rom_standing_quad", name: "Standing Quad Stretch", area: "Quads", section: 7,
    hold: 20, reps: "2 each side", totalTime: 80,
    cues: ["Keep knees together — don't let knee drift outward", "Tuck pelvis slightly to increase the stretch", "Stand tall — don't lean forward"],
    breathing: "Normal breathing",
    note: "Standing alternative if prone position is uncomfortable. Also trains single-leg balance.",
    injuryNotes: { knee: "⚠️ Don't force knee flexion past comfortable range." },
    svg: romSvg(`
      ${HEAD(150, 40)}
      <line x1="150" y1="52" x2="150" y2="95" stroke="${T}" stroke-width="2.5"/>
      <line x1="150" y1="60" x2="132" y2="75" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="60" x2="168" y2="75" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="95" x2="150" y2="155" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="95" x2="165" y2="130" stroke="${T}" stroke-width="2"/>
      <line x1="165" y1="130" x2="160" y2="100" stroke="${T}" stroke-width="2"/>
      <path d="M168 75 Q175 85 165 95" stroke="${I}" stroke-width="1" fill="none" stroke-dasharray="3"/>
      <text x="180" y="90" fill="${W}" font-size="7">GRAB</text>
      <line x1="130" y1="50" x2="130" y2="90" stroke="${L}" stroke-width="2"/>
      <text x="120" y="70" text-anchor="end" fill="${L}" font-size="7">WALL</text>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">Hold wall · 20s each side</text>
    `, "STANDING QUAD STRETCH"),
  },

  // ── SECTION 8: HAMSTRINGS (2) ───────────────────────────
  {
    id: "rom_standing_hamstring", name: "Standing Hamstring Stretch", area: "Hamstrings", section: 8,
    hold: 20, reps: "3 each side", totalTime: 120,
    cues: ["FLAT BACK is critical — don't round your spine", "Hinge at the hips like a deadlift", "Point toes up to increase the stretch"],
    breathing: "Exhale as you hinge forward",
    note: "The single biggest modifiable factor for your back pain. Tight hamstrings tilt the pelvis and load the lumbar spine. Stretch daily — non-negotiable.",
    injuryNotes: { lower_back: "⚠️ Keep back FLAT. If you can't maintain flat back, reduce depth." },
    svg: romSvg(`
      ${HEAD(150, 45)}
      <line x1="150" y1="57" x2="150" y2="95" stroke="${T}" stroke-width="2.5"/>
      <line x1="150" y1="65" x2="132" y2="80" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="65" x2="168" y2="80" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="95" x2="140" y2="155" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="95" x2="190" y2="95" stroke="${T}" stroke-width="2"/>
      <line x1="190" y1="95" x2="190" y2="155" stroke="${T}" stroke-width="2"/>
      <rect x="185" y="85" width="20" height="8" rx="3" fill="${L}" opacity="0.4"/>
      <text x="195" y="82" text-anchor="middle" fill="${L}" font-size="7">STEP</text>
      <path d="M155 55 Q165 50 170 60" stroke="${W}" stroke-width="1.5" fill="none"/>
      <text x="178" y="55" fill="${W}" font-size="7">HINGE</text>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">Heel on step · flat back · 20s</text>
    `, "STANDING HAMSTRING STRETCH"),
  },
  {
    id: "rom_supine_hamstring", name: "Supine Hamstring Stretch (Strap)", area: "Hamstrings", section: 8,
    hold: 20, reps: "3 each side", totalTime: 120,
    cues: ["Keep the leg as straight as possible", "The other leg stays flat on the floor", "Pull gently — don't yank"],
    breathing: "Exhale as you pull deeper",
    note: "Safest hamstring stretch for post-surgical backs — supine position eliminates spinal load.",
    injuryNotes: { lower_back: "⚠️ Best hamstring stretch for your back. Keep opposite leg flat." },
    svg: romSvg(`
      ${HEAD(60, 130)}
      <line x1="68" y1="130" x2="150" y2="130" stroke="${T}" stroke-width="2.5"/>
      <line x1="150" y1="130" x2="200" y2="130" stroke="${T}" stroke-width="2"/>
      <line x1="200" y1="130" x2="220" y2="135" stroke="${T}" stroke-width="1.5"/>
      <line x1="150" y1="130" x2="150" y2="50" stroke="${T}" stroke-width="2"/>
      <line x1="150" y1="50" x2="145" y2="45" stroke="${T}" stroke-width="1.5"/>
      <line x1="90" y1="120" x2="145" y2="45" stroke="${I}" stroke-width="1" stroke-dasharray="3"/>
      <text x="105" y="75" fill="${I}" font-size="7" transform="rotate(-55 105 75)">STRAP</text>
      <line x1="80" y1="130" x2="65" y2="${130 + 15}" stroke="${T}" stroke-width="2"/>
      <line x1="80" y1="130" x2="95" y2="${130 + 15}" stroke="${T}" stroke-width="2"/>
      <path d="M155 55 L160 45" stroke="${W}" stroke-width="1.5"/>
      <text x="170" y="42" fill="${W}" font-size="8">PULL</text>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">Strap around foot · 20s each</text>
    `, "SUPINE HAMSTRING (STRAP)"),
  },

  // ── SECTION 9: CALVES & ACHILLES (2) ────────────────────
  {
    id: "rom_calf_stretch", name: "Runner's Calf Stretch", area: "Calves & Achilles", section: 9,
    hold: 20, reps: "3 each side", totalTime: 120,
    cues: ["BACK LEG STRAIGHT — this targets the gastrocnemius", "Heel stays DOWN on the floor", "Both feet point straight forward"],
    breathing: "Normal breathing",
    note: "Tight calves restrict ankle dorsiflexion, which causes compensations all the way up the chain (knee valgus, hip shift, back rounding in squats).",
    injuryNotes: {},
    svg: romSvg(`
      ${HEAD(130, 45)}
      <line x1="130" y1="57" x2="135" y2="95" stroke="${T}" stroke-width="2.5"/>
      <line x1="130" y1="65" x2="110" y2="80" stroke="${T}" stroke-width="2"/>
      <line x1="110" y1="80" x2="100" y2="85" stroke="${T}" stroke-width="1.5"/>
      <line x1="130" y1="65" x2="120" y2="80" stroke="${T}" stroke-width="2"/>
      <line x1="135" y1="95" x2="125" y2="135" stroke="${T}" stroke-width="2"/>
      <line x1="125" y1="135" x2="120" y2="185" stroke="${T}" stroke-width="2"/>
      <line x1="135" y1="95" x2="190" y2="155" stroke="${T}" stroke-width="2"/>
      <line x1="190" y1="155" x2="200" y2="185" stroke="${T}" stroke-width="2"/>
      <line x1="100" y1="40" x2="100" y2="185" stroke="${L}" stroke-width="2"/>
      <text x="90" y="100" text-anchor="end" fill="${L}" font-size="7">WALL</text>
      <text x="195" y="150" fill="${W}" font-size="7">STRAIGHT</text>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">Back leg straight · heel down · 20s</text>
    `, "RUNNER'S CALF STRETCH"),
  },
  {
    id: "rom_soleus_stretch", name: "Soleus / Achilles Stretch", area: "Calves & Achilles", section: 9,
    hold: 20, reps: "3 each side", totalTime: 120,
    cues: ["BEND the back knee — shifts stretch to soleus and Achilles", "Push knee TOWARD the wall over your toes", "Heel stays on the floor the entire time"],
    breathing: "Normal breathing",
    note: "The soleus and Achilles tendon are only stretched with a bent knee. This is different from the straight-leg calf stretch — you need BOTH.",
    injuryNotes: {},
    svg: romSvg(`
      ${HEAD(130, 45)}
      <line x1="130" y1="57" x2="135" y2="95" stroke="${T}" stroke-width="2.5"/>
      <line x1="130" y1="65" x2="110" y2="80" stroke="${T}" stroke-width="2"/>
      <line x1="110" y1="80" x2="100" y2="85" stroke="${T}" stroke-width="1.5"/>
      <line x1="130" y1="65" x2="120" y2="80" stroke="${T}" stroke-width="2"/>
      <line x1="135" y1="95" x2="125" y2="135" stroke="${T}" stroke-width="2"/>
      <line x1="125" y1="135" x2="120" y2="185" stroke="${T}" stroke-width="2"/>
      <line x1="135" y1="95" x2="175" y2="140" stroke="${T}" stroke-width="2"/>
      <line x1="175" y1="140" x2="195" y2="185" stroke="${T}" stroke-width="2"/>
      <line x1="100" y1="40" x2="100" y2="185" stroke="${L}" stroke-width="2"/>
      <text x="90" y="100" text-anchor="end" fill="${L}" font-size="7">WALL</text>
      <text x="185" y="135" fill="${W}" font-size="7">BENT</text>
      <path d="M180 138 Q170 150 180 155" stroke="${W}" stroke-width="1" fill="none"/>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">Back knee BENT · heel down · 20s</text>
    `, "SOLEUS / ACHILLES STRETCH"),
  },

  // ── SECTION 10: ANKLES & FEET (2) ──────────────────────
  {
    id: "rom_ankle_circles", name: "Ankle Circles", area: "Ankles & Feet", section: 10,
    hold: 0, reps: "10 each direction, each foot", totalTime: 40,
    cues: ["Full range — big circles", "Move from the ankle, not the knee", "Reverse direction halfway"],
    breathing: "Normal breathing",
    note: "Restores multi-planar ankle mobility. Critical for anyone with ankle instability history or who wears stiff shoes.",
    injuryNotes: {},
    svg: romSvg(`
      ${SEATED(120, 110)}
      <line x1="150" y1="110" x2="165" y2="140" stroke="${T}" stroke-width="2"/>
      <line x1="165" y1="140" x2="175" y2="155" stroke="${T}" stroke-width="1.5"/>
      <circle cx="178" cy="158" r="15" fill="none" stroke="${W}" stroke-width="1.5" stroke-dasharray="3"/>
      <path d="M185 145 L190 143 L188 150" stroke="${W}" stroke-width="1.5" fill="none"/>
      <text x="200" y="160" fill="${W}" font-size="7">CW+CCW</text>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">10 each direction · each foot</text>
    `, "ANKLE CIRCLES"),
  },
  {
    id: "rom_ankle_dorsiflexion", name: "Ankle Dorsiflexion Mobilization", area: "Ankles & Feet", section: 10,
    hold: 5, reps: "10 each side", totalTime: 100,
    cues: ["Knee tracks over the 2nd toe", "Heel MUST stay on the ground", "Try to get knee past your toes"],
    breathing: "Exhale on each push",
    note: "The #1 test and stretch for ankle mobility. If your knee can't pass your toes, your squat will compensate at the knees and back.",
    injuryNotes: {},
    svg: romSvg(`
      ${HEAD(160, 45)}
      <line x1="160" y1="57" x2="155" y2="95" stroke="${T}" stroke-width="2.5"/>
      <line x1="160" y1="65" x2="142" y2="80" stroke="${T}" stroke-width="2"/>
      <line x1="160" y1="65" x2="178" y2="80" stroke="${T}" stroke-width="2"/>
      <line x1="155" y1="95" x2="140" y2="140" stroke="${T}" stroke-width="2"/>
      <line x1="140" y1="140" x2="135" y2="185" stroke="${T}" stroke-width="2"/>
      <line x1="155" y1="95" x2="180" y2="140" stroke="${T}" stroke-width="2"/>
      <line x1="180" y1="140" x2="185" y2="185" stroke="${T}" stroke-width="2"/>
      <line x1="120" y1="40" x2="120" y2="185" stroke="${L}" stroke-width="2"/>
      <text x="110" y="100" text-anchor="end" fill="${L}" font-size="7">WALL</text>
      <path d="M143 135 L125 120" stroke="${W}" stroke-width="1.5"/>
      <text x="120" y="115" text-anchor="end" fill="${W}" font-size="7">KNEE →</text>
      <text x="135" y="175" fill="${I}" font-size="7">Heel down!</text>
      <text x="200" y="175" fill="${G}" font-size="8">5s · 10 reps</text>
    `, "ANKLE DORSIFLEXION MOB"),
  },

  // ── SECTION 11: CLOSING (1) ─────────────────────────────
  {
    id: "rom_diaphragmatic_breathing", name: "Diaphragmatic Breathing", area: "Closing", section: 11,
    hold: 12, reps: "5 breaths", totalTime: 60,
    cues: ["Belly rises FIRST — if your chest rises, you're breathing wrong", "Exhale longer than inhale", "Let your shoulders drop on each exhale"],
    breathing: "4 in · 2 hold · 6 out",
    note: "Resets the nervous system from sympathetic to parasympathetic. The diaphragm is the roof of your core — training it to move properly is the foundation of all bracing.",
    injuryNotes: {},
    svg: romSvg(`
      ${STAND(150, 50)}
      <ellipse cx="142" cy="95" rx="6" ry="4" fill="none" stroke="${I}" stroke-width="1.5"/>
      <text x="125" y="98" text-anchor="end" fill="${I}" font-size="7">BELLY</text>
      <ellipse cx="158" cy="75" rx="6" ry="4" fill="none" stroke="${L}" stroke-width="1" stroke-dasharray="2"/>
      <text x="175" y="78" fill="${L}" font-size="7">CHEST</text>
      <text x="78" y="60" text-anchor="end" fill="${G}" font-size="9">IN 4</text>
      <text x="78" y="75" text-anchor="end" fill="${W}" font-size="9">HOLD 2</text>
      <text x="78" y="90" text-anchor="end" fill="${I}" font-size="9">OUT 6</text>
      <path d="M140 100 Q145 110 150 100" stroke="${G}" stroke-width="1.5" fill="none"/>
      <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">5 breaths · belly breathing</text>
    `, "DIAPHRAGMATIC BREATHING"),
  },
];

// Section labels for headers
const SECTIONS = {
  1: "NECK", 2: "SHOULDERS", 3: "WRISTS & HANDS", 4: "THORACIC SPINE",
  5: "LUMBAR SPINE", 6: "HIPS", 7: "QUADS", 8: "HAMSTRINGS",
  9: "CALVES & ACHILLES", 10: "ANKLES & FEET", 11: "CLOSING",
};

// ═══════════════════════════════════════════════════════════════
// MORNING ROM SCREEN — guided experience
// ═══════════════════════════════════════════════════════════════

const STORAGE_KEY = "apex_morning_rom_progress";

export default function MorningROMScreen({ onComplete, onClose }) {
  // Restore progress from localStorage if user left mid-routine
  const savedProgress = useMemo(() => {
    try {
      const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (s && s.date === new Date().toISOString().split("T")[0] && s.idx > 0) return s;
    } catch {}
    return null;
  }, []);

  const [phase, setPhase] = useState(savedProgress ? "exercise" : "intro");
  const [idx, setIdx] = useState(savedProgress ? savedProgress.idx : 0);
  // On resume, initialize timer to the exercise's totalTime so auto-advance doesn't fire immediately
  const [timer, setTimer] = useState(() => savedProgress ? (ROM_EXERCISES[savedProgress.idx]?.totalTime || 30) : 0);
  const [timerOn, setTimerOn] = useState(false);
  const timerRef = useRef(null);
  const startTime = useRef(Date.now());
  const [completedIds, setCompletedIds] = useState(new Set());

  // Save progress on every exercise change
  useEffect(() => {
    if (phase === "exercise" || phase === "transition") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: new Date().toISOString().split("T")[0], idx }));
      } catch {}
    }
  }, [idx, phase]);

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

  const exercises = ROM_EXERCISES;
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

  // Auto-advance when timer hits 0
  useEffect(() => {
    if (phase === "exercise" && timer === 0 && !timerOn) {
      // Timer finished — show brief transition then advance
      if (!isLast) {
        setPhase("transition");
        const t = setTimeout(() => {
          setCompletedIds(s => new Set([...s, ex.id]));
          setIdx(i => i + 1);
          setPhase("exercise");
          window.scrollTo(0, 0);
        }, 3000);
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
      localStorage.removeItem(STORAGE_KEY);
      const completions = JSON.parse(localStorage.getItem("apex_rom_completions") || "[]");
      completions.push({
        date: new Date().toISOString().split("T")[0],
        exercises: exercises.length,
        durationMinutes: Math.round((Date.now() - startTime.current) / 60000),
        type: "morning_rom",
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

  // Get injury notes for current exercise
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
          <div style={{ fontSize: 11, fontWeight: 700, color: C.teal, letterSpacing: 2 }}>☀️ MORNING ROM</div>
          <div style={{ width: 40 }} />
        </div>

        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>☀️</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: "0 0 8px", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>MORNING ROM ROUTINE</h2>
          <div style={{ fontSize: 14, color: C.textMuted, marginBottom: 4 }}>Head-to-Toe Mobility</div>
          <div style={{ fontSize: 12, color: C.textDim }}>30 exercises · ~15-20 min</div>
        </div>

        <div style={{ background: C.bgCard, borderRadius: 16, padding: 16, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.teal, letterSpacing: 1.5, marginBottom: 10 }}>SECTIONS</div>
          {Object.entries(SECTIONS).map(([num, name]) => {
            const count = exercises.filter(e => e.section === Number(num)).length;
            return (
              <div key={num} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${C.border}22` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: C.teal, fontWeight: 700, minWidth: 20 }}>{num}.</span>
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
          background: `linear-gradient(135deg, ${C.teal}, ${C.tealDark})`, color: "#000",
          fontSize: 18, fontWeight: 800, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        }}>
          <span>▶</span> START ROM ROUTINE
        </button>
      </div>
    );
  }

  // ── DONE SCREEN ──
  if (phase === "done") {
    const duration = Math.round((Date.now() - startTime.current) / 60000);
    return (
      <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16, padding: "0 0 90px", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginTop: 30 }}>✅</div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: C.success, margin: 0, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>MORNING ROM COMPLETE</h2>
        <div style={{ fontSize: 14, color: C.textMuted }}>
          {exercises.length} exercises · {duration || "< 1"} min
        </div>
        <div style={{ background: C.bgCard, borderRadius: 16, padding: 16, border: `1px solid ${C.success}20`, margin: "8px 0" }}>
          <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>
            Morning ROM complete. You're ready for the day.
          </div>
        </div>
        <button onClick={handleComplete} style={{
          padding: "18px 24px", borderRadius: 14, border: "none", cursor: "pointer", width: "100%",
          background: `linear-gradient(135deg, ${C.success}, #16a34a)`, color: "#fff",
          fontSize: 18, fontWeight: 800, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        }}>
          <span>✓</span> DONE — MARK COMPLETE
        </button>
      </div>
    );
  }

  // ── TRANSITION SCREEN (3s preview of next exercise) ──
  if (phase === "transition" && !isLast) {
    const next = exercises[idx + 1];
    const isNewSection = next && ex && next.section !== ex.section;
    return (
      <div className="fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, minHeight: 300, padding: "0 0 90px" }}>
        {isNewSection && (
          <div style={{ fontSize: 11, fontWeight: 700, color: C.purple, letterSpacing: 2, marginBottom: 4 }}>
            NEXT SECTION
          </div>
        )}
        <div style={{ fontSize: 11, fontWeight: 700, color: C.teal, letterSpacing: 2 }}>
          UP NEXT · {idx + 2} of {exercises.length}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.textMuted, letterSpacing: 1 }}>
          {next?.area?.toUpperCase()}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1 }}>
          {next?.name}
        </div>
        {next?.imageUrl
          ? <img src={next.imageUrl} alt={next.name} style={{ width: "60%", borderRadius: 12, border: `1px solid ${C.border}`, display: "block", objectFit: "cover", maxHeight: 160, background: "#0a1628" }} />
          : <div style={{ width: "60%", borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}` }} dangerouslySetInnerHTML={{ __html: next?.svg || "" }} />}
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
        <div style={{ fontSize: 11, fontWeight: 700, color: C.teal, letterSpacing: 2 }}>☀️ Morning ROM · {idx + 1} of {exercises.length}</div>
        <div style={{ width: 40 }} />
      </div>

      {/* Progress bar */}
      <div style={{ width: "100%", height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${progress}%`, height: "100%", background: C.teal, borderRadius: 2, transition: "width 0.6s ease" }} />
      </div>

      {/* Section header (shown when entering new section) */}
      {isNewSection && (
        <div style={{ textAlign: "center", padding: "4px 0" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.purple, letterSpacing: 2, background: C.purple + "15", padding: "4px 12px", borderRadius: 6 }}>
            {SECTIONS[ex.section]}
          </span>
        </div>
      )}

      {/* Exercise card */}
      <div style={{ background: C.bgCard, borderRadius: 16, padding: 16, border: `1px solid ${C.border}` }}>
        {/* Area label */}
        <div style={{ fontSize: 11, color: C.teal, fontWeight: 600, marginBottom: 8, letterSpacing: 1 }}>
          {ex.area?.toUpperCase()} · {idx + 1} of {exercises.length}
        </div>

        {/* Exercise illustration — real image if available, SVG fallback */}
        {ex.imageUrl
          ? <img src={ex.imageUrl} alt={ex.name} style={{ width: "100%", borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: ex.videoUrl ? 6 : 12, display: "block", objectFit: "cover", maxHeight: 260, background: "#0a1628" }} onError={(e) => { e.target.style.display = "none"; e.target.nextSibling && (e.target.nextSibling.style.display = "block"); }} />
          : null}
        <div style={{ width: "100%", borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}`, marginBottom: ex.videoUrl ? 6 : 12, display: ex.imageUrl ? "none" : "block" }} dangerouslySetInnerHTML={{ __html: ex.svg }} />
        {ex.videoUrl && <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.info, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 8 }}>▶ Watch demo</a>}

        {/* Exercise name */}
        <h3 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: "0 0 4px", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1 }}>{ex.name}</h3>

        {/* Reps & breathing */}
        <div style={{ display: "flex", gap: 12, fontSize: 12, color: C.textMuted, marginBottom: 10, flexWrap: "wrap" }}>
          {ex.hold > 0 && <span>⏱ Hold: {ex.hold}s</span>}
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
        <div style={{ fontSize: 11, color: C.info, padding: "6px 10px", background: C.info + "10", borderRadius: 8, marginBottom: 8 }}>
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

      {/* Timer */}
      <div style={{ background: C.bgCard, borderRadius: 16, padding: 16, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontSize: 36, fontWeight: 800, fontFamily: "'Bebas Neue',sans-serif",
            color: timer <= 5 && timer > 0 ? C.warning : timer === 0 ? C.success : C.teal,
          }}>
            {formatTime(timer)}
          </div>
          <div style={{ fontSize: 10, color: C.textDim }}>{timer === 0 ? "Complete" : "Remaining"}</div>
        </div>
        <button onClick={() => {
          if (timer === 0) { setTimer(ex.totalTime); setTimerOn(false); return; }
          setTimerOn(!timerOn);
        }} style={{
          width: 56, height: 56, borderRadius: 28,
          background: timerOn ? C.warning + "20" : timer === 0 ? C.textDim + "20" : C.teal + "20",
          border: `2px solid ${timerOn ? C.warning : timer === 0 ? C.textDim : C.teal}`,
          color: timerOn ? C.warning : timer === 0 ? C.textDim : C.teal,
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
          background: isLast ? `linear-gradient(135deg, ${C.success}, #16a34a)` : `linear-gradient(135deg, ${C.teal}, ${C.tealDark})`,
          color: isLast ? "#fff" : "#000", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          {isLast ? "✓ Complete ROM" : "Next →"}
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

// ── Library metadata & export ─────────────────────────────────
// Shared defaults for all AM ROM exercises
const AM_ROM_DEFAULTS = {
  category: "mobility", type: "mobility",
  locationCompatible: ["gym", "home", "outdoor"],
  phaseEligibility: [1, 2, 3, 4, 5],
  difficultyLevel: 1,
};

// Export tagged exercises for Library integration
export const AM_ROM_EXERCISES = ROM_EXERCISES.map(ex => ({
  ...AM_ROM_DEFAULTS,
  ...ex,
  bodyPart: ex.area?.toLowerCase().replace(/ & /g, "_").replace(/ /g, "_"),
  equipmentRequired: ["none"],
  tags: [
    "rom_morning",
    ex.area?.toLowerCase().replace(/ & /g, "_").replace(/ /g, "_"),
    ...(ex.id.includes("mckenzie") ? ["mckenzie_back"] : []),
    ...(ex.area === "Neck" && ex.id.includes("retraction") ? ["mckenzie_neck"] : []),
    ...(ex.id.includes("hip_abd_er") || ex.id.includes("hip_kneeling") ? ["mckenzie_hip"] : []),
  ].filter(Boolean),
}));
