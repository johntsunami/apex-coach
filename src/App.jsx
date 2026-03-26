import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import exerciseDB from "./data/exercises.json";

// ═══════════════════════════════════════════════════════════════
// APEX COACH V13 — Inline SVG exercise illustrations, Train page,
// Library body part filters, all V7 spec features
// ═══════════════════════════════════════════════════════════════

const USER={name:"John"};
const QUOTES=["Progress is not always adding weight. Sometimes it's just showing up.","Discipline is choosing between what you want now and what you want most.","You don't have to be extreme, just consistent.","Train smarter today so you can train harder tomorrow."];
const INJURIES=[{id:1,area:"Lower Back",type:"Post-Surgical",severity:3,status:"managing",protocols:["Avoid axial loading >70% 1RM","McGill Big 3 daily","Hip hinge pattern priority"]},{id:2,area:"Left Knee",type:"Post-Surgical",severity:2,status:"rehab",protocols:["Limited deep flexion","VMO activation pre-sets","No plyometrics yet"]},{id:3,area:"Left Shoulder",type:"Labrum Tear",severity:2,status:"managing",protocols:["No behind-neck pressing","External rotation warm-up","Avoid overhead at end-range"]}];
const BODY_PARTS=[{id:"head",label:"Head/Neck",icon:"😐"},{id:"lshoulder",label:"L. Shoulder",icon:"💪"},{id:"rshoulder",label:"R. Shoulder",icon:"💪"},{id:"chest",label:"Chest",icon:"🫁"},{id:"upperback",label:"Upper Back",icon:"🔙"},{id:"lowerback",label:"Lower Back",icon:"🔙"},{id:"lelbow",label:"L. Elbow",icon:"💪"},{id:"relbow",label:"R. Elbow",icon:"💪"},{id:"wrists",label:"Wrists/Hands",icon:"🤲"},{id:"core",label:"Core/Abs",icon:"⚫"},{id:"hips",label:"Hips/Glutes",icon:"🍑"},{id:"lknee",label:"L. Knee",icon:"🦵"},{id:"rknee",label:"R. Knee",icon:"🦵"},{id:"lquad",label:"L. Quad",icon:"🦵"},{id:"rquad",label:"R. Quad",icon:"🦵"},{id:"hamstrings",label:"Hamstrings",icon:"🦵"},{id:"calves",label:"Calves",icon:"🔻"},{id:"feet",label:"Feet/Ankles",icon:"🦶"}];

// ── INLINE SVG EXERCISE ILLUSTRATIONS ───────────────────────────
// Each shows accurate body position for the specific exercise
function ExerciseIllustration({exerciseId, width="100%", height=160}) {
  const illustrations = {
    w1: ( // Cat-Cow: person on all fours with arched spine
      <svg viewBox="0 0 300 140" style={{width,height,display:"block"}}>
        <rect width="300" height="140" rx="14" fill="#0a1628"/>
        <text x="150" y="18" textAnchor="middle" fill="#4a5a78" fontSize="10" fontWeight="600">CAT-COW POSITION</text>
        {/* Floor */}<line x1="30" y1="120" x2="270" y2="120" stroke="#1a2a45" strokeWidth="2"/>
        {/* COW position - left */}
        <text x="90" y="32" textAnchor="middle" fill="#00d2c8" fontSize="9" fontWeight="700">COW (INHALE)</text>
        <circle cx="130" cy="60" r="8" fill="none" stroke="#00d2c8" strokeWidth="2"/>{/* head */}
        <path d="M122 65 Q90 55 70 85" fill="none" stroke="#00d2c8" strokeWidth="2.5" strokeLinecap="round"/>{/* spine curved down */}
        <line x1="130" y1="68" x2="130" y2="95" stroke="#00d2c8" strokeWidth="2"/>{/* front arm */}
        <line x1="70" y1="85" x2="70" y2="120" stroke="#00d2c8" strokeWidth="2"/>{/* rear leg */}
        <line x1="130" y1="95" x2="130" y2="120" stroke="#00d2c8" strokeWidth="2"/>{/* front leg */}
        <path d="M85 48 L90 42 L95 48" fill="none" stroke="#f59e0b" strokeWidth="1.5"/>{/* arrow up - tailbone lifts */}
        {/* CAT position - right */}
        <text x="220" y="32" textAnchor="middle" fill="#3b82f6" fontSize="9" fontWeight="700">CAT (EXHALE)</text>
        <circle cx="255" cy="72" r="8" fill="none" stroke="#3b82f6" strokeWidth="2"/>{/* head tucked */}
        <path d="M248 75 Q225 50 200 80" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>{/* spine curved up */}
        <line x1="255" y1="80" x2="255" y2="120" stroke="#3b82f6" strokeWidth="2"/>
        <line x1="200" y1="80" x2="200" y2="120" stroke="#3b82f6" strokeWidth="2"/>
        <path d="M220 46 L225 52 L230 46" fill="none" stroke="#f59e0b" strokeWidth="1.5"/>{/* arrow down - belly pulls in */}
        <text x="150" y="135" textAnchor="middle" fill="#4a5a78" fontSize="8">Alternate slowly — 3s each direction</text>
      </svg>
    ),
    w2: ( // Dead Bug: person on back, opposite arm+leg extended
      <svg viewBox="0 0 300 140" style={{width,height,display:"block"}}>
        <rect width="300" height="140" rx="14" fill="#0a1628"/>
        <text x="150" y="18" textAnchor="middle" fill="#4a5a78" fontSize="10" fontWeight="600">DEAD BUG POSITION</text>
        <line x1="30" y1="105" x2="270" y2="105" stroke="#1a2a45" strokeWidth="2"/>
        {/* Body lying on back */}
        <circle cx="60" cy="95" r="8" fill="none" stroke="#00d2c8" strokeWidth="2"/>{/* head */}
        <line x1="68" y1="95" x2="170" y2="95" stroke="#00d2c8" strokeWidth="3" strokeLinecap="round"/>{/* torso */}
        {/* Right arm extended up */}
        <line x1="100" y1="95" x2="85" y2="45" stroke="#00d2c8" strokeWidth="2" strokeLinecap="round"/>
        <text x="78" y="40" fill="#f59e0b" fontSize="8">R arm up</text>
        {/* Left arm at 90° */}
        <line x1="130" y1="95" x2="130" y2="70" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4"/>
        {/* Left leg extended out */}
        <line x1="170" y1="95" x2="250" y2="90" stroke="#00d2c8" strokeWidth="2" strokeLinecap="round"/>
        <text x="248" y="85" fill="#f59e0b" fontSize="8">L leg out</text>
        {/* Right leg at 90° */}
        <line x1="170" y1="95" x2="190" y2="70" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4"/>
        <line x1="190" y1="70" x2="210" y2="70" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4"/>
        {/* Back flat indicator */}
        <text x="120" y="120" textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="700">⬇ BACK FLAT ON FLOOR — NO GAP</text>
      </svg>
    ),
    w3: ( // Banded External Rotation: standing, arm rotating out
      <svg viewBox="0 0 300 140" style={{width,height,display:"block"}}>
        <rect width="300" height="140" rx="14" fill="#0a1628"/>
        <text x="150" y="18" textAnchor="middle" fill="#4a5a78" fontSize="10" fontWeight="600">BANDED EXTERNAL ROTATION</text>
        <line x1="30" y1="130" x2="270" y2="130" stroke="#1a2a45" strokeWidth="2"/>
        {/* Standing figure */}
        <circle cx="150" cy="40" r="9" fill="none" stroke="#00d2c8" strokeWidth="2"/>
        <line x1="150" y1="49" x2="150" y2="90" stroke="#00d2c8" strokeWidth="2.5"/>
        <line x1="150" y1="90" x2="140" y2="130" stroke="#00d2c8" strokeWidth="2"/>
        <line x1="150" y1="90" x2="160" y2="130" stroke="#00d2c8" strokeWidth="2"/>
        {/* Arm pinned at 90° */}
        <line x1="150" y1="60" x2="150" y2="75" stroke="#00d2c8" strokeWidth="2"/>{/* upper arm down */}
        <line x1="150" y1="75" x2="120" y2="75" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4"/>{/* forearm start */}
        <line x1="150" y1="75" x2="200" y2="65" stroke="#00d2c8" strokeWidth="2.5"/>{/* forearm rotated out */}
        {/* Rotation arrow */}
        <path d="M130 68 Q140 55 155 62" fill="none" stroke="#f59e0b" strokeWidth="1.5"/>
        <polygon points="155,62 150,57 148,64" fill="#f59e0b"/>
        {/* Band */}
        <line x1="120" y1="75" x2="80" y2="75" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3"/>
        <text x="70" y="73" fill="#ef4444" fontSize="8">Band</text>
        <text x="150" y="115" textAnchor="middle" fill="#f59e0b" fontSize="9" fontWeight="600">Elbow PINNED to side</text>
      </svg>
    ),
    w4: ( // Glute Bridge: lying on back, hips raised
      <svg viewBox="0 0 300 140" style={{width,height,display:"block"}}>
        <rect width="300" height="140" rx="14" fill="#0a1628"/>
        <text x="150" y="18" textAnchor="middle" fill="#4a5a78" fontSize="10" fontWeight="600">GLUTE BRIDGE — TOP POSITION</text>
        <line x1="30" y1="120" x2="270" y2="120" stroke="#1a2a45" strokeWidth="2"/>
        {/* Body in bridge position */}
        <circle cx="60" cy="85" r="8" fill="none" stroke="#00d2c8" strokeWidth="2"/>{/* head on ground */}
        {/* Shoulders on ground, hips up */}
        <line x1="68" y1="85" x2="90" y2="85" stroke="#00d2c8" strokeWidth="2"/>{/* upper back */}
        <line x1="90" y1="85" x2="160" y2="55" stroke="#00d2c8" strokeWidth="3" strokeLinecap="round"/>{/* torso angled up */}
        {/* Legs bent */}
        <line x1="160" y1="55" x2="200" y2="100" stroke="#00d2c8" strokeWidth="2"/>{/* thigh */}
        <line x1="200" y1="100" x2="200" y2="120" stroke="#00d2c8" strokeWidth="2"/>{/* shin */}
        {/* Hip lift arrow */}
        <path d="M140 75 L140 48 L135 53 M140 48 L145 53" fill="none" stroke="#f59e0b" strokeWidth="2"/>
        <text x="155" y="42" fill="#f59e0b" fontSize="9" fontWeight="700">SQUEEZE</text>
        {/* Heel drive */}
        <text x="200" y="135" textAnchor="middle" fill="#22c55e" fontSize="8" fontWeight="600">Drive through HEELS</text>
        <text x="90" y="100" fill="#ef4444" fontSize="8">Straight line ↗</text>
      </svg>
    ),
    w5: ( // VMO Wall Sit
      <svg viewBox="0 0 300 140" style={{width,height,display:"block"}}>
        <rect width="300" height="140" rx="14" fill="#0a1628"/>
        <text x="150" y="18" textAnchor="middle" fill="#4a5a78" fontSize="10" fontWeight="600">VMO WALL SIT — 45° ONLY</text>
        {/* Wall */}
        <line x1="80" y1="25" x2="80" y2="130" stroke="#1a2a45" strokeWidth="4"/>
        <line x1="30" y1="130" x2="270" y2="130" stroke="#1a2a45" strokeWidth="2"/>
        {/* Figure against wall */}
        <circle cx="90" cy="42" r="8" fill="none" stroke="#00d2c8" strokeWidth="2"/>
        <line x1="85" y1="50" x2="85" y2="85" stroke="#00d2c8" strokeWidth="2.5"/>{/* back flat on wall */}
        <line x1="85" y1="85" x2="120" y2="105" stroke="#00d2c8" strokeWidth="2"/>{/* thigh */}
        <line x1="120" y1="105" x2="120" y2="130" stroke="#00d2c8" strokeWidth="2"/>{/* shin */}
        {/* 45° angle indicator */}
        <path d="M90 85 Q95 90 100 90" fill="none" stroke="#f59e0b" strokeWidth="1.5"/>
        <text x="105" y="88" fill="#f59e0b" fontSize="9" fontWeight="700">~45°</text>
        {/* VMO highlight */}
        <circle cx="115" cy="98" r="6" fill="rgba(0,210,200,0.2)" stroke="#00d2c8" strokeWidth="1"/>
        <text x="130" y="100" fill="#00d2c8" fontSize="8" fontWeight="700">VMO</text>
        <text x="200" y="70" fill="#ef4444" fontSize="9" fontWeight="600">NOT 90°!</text>
        <text x="200" y="82" fill="#ef4444" fontSize="9">That's too deep</text>
        <text x="200" y="94" fill="#ef4444" fontSize="9">for your knee</text>
      </svg>
    ),
    m1: ( // Trap Bar Deadlift
      <svg viewBox="0 0 300 140" style={{width,height,display:"block"}}>
        <rect width="300" height="140" rx="14" fill="#0a1628"/>
        <text x="150" y="18" textAnchor="middle" fill="#4a5a78" fontSize="10" fontWeight="600">TRAP BAR DEADLIFT — SETUP</text>
        <line x1="30" y1="130" x2="270" y2="130" stroke="#1a2a45" strokeWidth="2"/>
        {/* Hex bar outline */}
        <rect x="90" y="110" width="120" height="8" rx="2" fill="none" stroke="#7a8ba8" strokeWidth="2"/>
        <line x1="90" y1="114" x2="60" y2="114" stroke="#7a8ba8" strokeWidth="2"/>{/* bar extends */}
        <line x1="210" y1="114" x2="240" y2="114" stroke="#7a8ba8" strokeWidth="2"/>
        <circle cx="55" cy="114" r="8" fill="none" stroke="#7a8ba8" strokeWidth="2"/>{/* plate */}
        <circle cx="245" cy="114" r="8" fill="none" stroke="#7a8ba8" strokeWidth="2"/>
        {/* Figure inside bar - hip hinge position */}
        <circle cx="150" cy="42" r="9" fill="none" stroke="#00d2c8" strokeWidth="2"/>
        <line x1="150" y1="51" x2="150" y2="75" stroke="#00d2c8" strokeWidth="2.5"/>{/* torso */}
        <line x1="150" y1="75" x2="135" y2="100" stroke="#00d2c8" strokeWidth="2"/>{/* thigh L */}
        <line x1="150" y1="75" x2="165" y2="100" stroke="#00d2c8" strokeWidth="2"/>{/* thigh R */}
        <line x1="135" y1="100" x2="135" y2="130" stroke="#00d2c8" strokeWidth="2"/>
        <line x1="165" y1="100" x2="165" y2="130" stroke="#00d2c8" strokeWidth="2"/>
        {/* Arms to handles */}
        <line x1="140" y1="65" x2="115" y2="110" stroke="#00d2c8" strokeWidth="2"/>
        <line x1="160" y1="65" x2="185" y2="110" stroke="#00d2c8" strokeWidth="2"/>
        {/* Key cues */}
        <text x="40" y="42" fill="#f59e0b" fontSize="8" fontWeight="600">FLAT BACK</text>
        <text x="40" y="52" fill="#f59e0b" fontSize="8">Chest proud</text>
        <text x="230" y="42" fill="#22c55e" fontSize="8" fontWeight="600">PUSH FLOOR</text>
        <text x="230" y="52" fill="#22c55e" fontSize="8">Don't pull bar</text>
      </svg>
    ),
    m2: ( // Landmine Press
      <svg viewBox="0 0 300 140" style={{width,height,display:"block"}}>
        <rect width="300" height="140" rx="14" fill="#0a1628"/>
        <text x="150" y="18" textAnchor="middle" fill="#4a5a78" fontSize="10" fontWeight="600">LANDMINE PRESS — TOP POSITION</text>
        <line x1="30" y1="130" x2="270" y2="130" stroke="#1a2a45" strokeWidth="2"/>
        {/* Figure - staggered stance */}
        <circle cx="150" cy="40" r="9" fill="none" stroke="#00d2c8" strokeWidth="2"/>
        <line x1="150" y1="49" x2="150" y2="90" stroke="#00d2c8" strokeWidth="2.5"/>
        <line x1="150" y1="90" x2="135" y2="130" stroke="#00d2c8" strokeWidth="2"/>{/* back leg */}
        <line x1="150" y1="90" x2="165" y2="130" stroke="#00d2c8" strokeWidth="2"/>{/* front leg */}
        {/* Pressing arm - angled up */}
        <line x1="145" y1="60" x2="115" y2="35" stroke="#00d2c8" strokeWidth="2.5" strokeLinecap="round"/>
        {/* Barbell angle */}
        <line x1="115" y1="35" x2="50" y2="120" stroke="#7a8ba8" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="50" cy="125" r="4" fill="#7a8ba8"/>{/* pivot point */}
        {/* Arc arrow showing press path */}
        <path d="M120 55 Q105 35 115 30" fill="none" stroke="#f59e0b" strokeWidth="1.5"/>
        <polygon points="115,30 112,37 119,35" fill="#f59e0b"/>
        <text x="220" y="55" fill="#00d2c8" fontSize="8" fontWeight="600">Elbow 45°</text>
        <text x="220" y="67" fill="#00d2c8" fontSize="8">NOT flared</text>
        <text x="220" y="95" fill="#f59e0b" fontSize="8" fontWeight="600">Staggered</text>
        <text x="220" y="107" fill="#f59e0b" fontSize="8">stance</text>
      </svg>
    ),
    m3: ( // Bulgarian Split Squat
      <svg viewBox="0 0 300 140" style={{width,height,display:"block"}}>
        <rect width="300" height="140" rx="14" fill="#0a1628"/>
        <text x="150" y="18" textAnchor="middle" fill="#4a5a78" fontSize="10" fontWeight="600">BULGARIAN SPLIT SQUAT</text>
        <line x1="30" y1="130" x2="270" y2="130" stroke="#1a2a45" strokeWidth="2"/>
        {/* Bench */}
        <rect x="200" y="95" width="60" height="10" rx="3" fill="none" stroke="#7a8ba8" strokeWidth="2"/>
        <line x1="210" y1="105" x2="210" y2="130" stroke="#7a8ba8" strokeWidth="2"/>
        <line x1="250" y1="105" x2="250" y2="130" stroke="#7a8ba8" strokeWidth="2"/>
        {/* Figure */}
        <circle cx="130" cy="35" r="9" fill="none" stroke="#00d2c8" strokeWidth="2"/>
        <line x1="130" y1="44" x2="130" y2="80" stroke="#00d2c8" strokeWidth="2.5"/>{/* torso upright */}
        {/* Front leg bent */}
        <line x1="130" y1="80" x2="110" y2="105" stroke="#00d2c8" strokeWidth="2"/>{/* thigh */}
        <line x1="110" y1="105" x2="110" y2="130" stroke="#00d2c8" strokeWidth="2"/>{/* shin */}
        {/* Rear leg on bench */}
        <line x1="130" y1="80" x2="180" y2="90" stroke="#00d2c8" strokeWidth="2"/>
        <line x1="180" y1="90" x2="210" y2="95" stroke="#00d2c8" strokeWidth="2"/>
        {/* Knee cue */}
        <path d="M110 105 L110 95" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3"/>
        <text x="85" y="108" fill="#f59e0b" fontSize="8" fontWeight="600">Knee</text>
        <text x="85" y="118" fill="#f59e0b" fontSize="8">over toes</text>
        {/* Heel drive */}
        <text x="100" y="138" fill="#22c55e" fontSize="8" fontWeight="600">↓ HEEL</text>
        {/* Torso cue */}
        <text x="40" y="60" fill="#00d2c8" fontSize="8">Torso TALL</text>
      </svg>
    ),
    m4: ( // Chest-Supported Row
      <svg viewBox="0 0 300 140" style={{width,height,display:"block"}}>
        <rect width="300" height="140" rx="14" fill="#0a1628"/>
        <text x="150" y="18" textAnchor="middle" fill="#4a5a78" fontSize="10" fontWeight="600">CHEST-SUPPORTED ROW</text>
        <line x1="30" y1="130" x2="270" y2="130" stroke="#1a2a45" strokeWidth="2"/>
        {/* Incline bench */}
        <line x1="100" y1="50" x2="160" y2="110" stroke="#7a8ba8" strokeWidth="4" strokeLinecap="round"/>
        <line x1="130" y1="110" x2="130" y2="130" stroke="#7a8ba8" strokeWidth="2"/>
        {/* Figure face down on bench */}
        <circle cx="95" cy="43" r="8" fill="none" stroke="#00d2c8" strokeWidth="2"/>{/* head */}
        <line x1="100" y1="50" x2="155" y2="105" stroke="#00d2c8" strokeWidth="2.5"/>{/* body on bench */}
        {/* Arms pulling up */}
        <line x1="115" y1="65" x2="100" y2="85" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4"/>{/* arm start */}
        <line x1="120" y1="68" x2="135" y2="55" stroke="#00d2c8" strokeWidth="2.5"/>{/* arm pulled up */}
        {/* Dumbbell */}
        <rect x="132" y="50" width="10" height="4" rx="1" fill="#7a8ba8"/>
        {/* Pull direction arrows */}
        <path d="M108 82 L120 65" fill="none" stroke="#f59e0b" strokeWidth="1.5"/>
        <polygon points="120,65 115,70 122,70" fill="#f59e0b"/>
        <text x="200" y="50" fill="#f59e0b" fontSize="8" fontWeight="600">Elbows to</text>
        <text x="200" y="62" fill="#f59e0b" fontSize="8">"back pockets"</text>
        <text x="200" y="82" fill="#22c55e" fontSize="8" fontWeight="600">SQUEEZE 1s</text>
        <text x="200" y="94" fill="#22c55e" fontSize="8">at the top</text>
        <text x="200" y="112" fill="#ef4444" fontSize="8">Chest stays</text>
        <text x="200" y="124" fill="#ef4444" fontSize="8">ON the pad</text>
      </svg>
    ),
    m5: ( // Pallof Press
      <svg viewBox="0 0 300 140" style={{width,height,display:"block"}}>
        <rect width="300" height="140" rx="14" fill="#0a1628"/>
        <text x="150" y="18" textAnchor="middle" fill="#4a5a78" fontSize="10" fontWeight="600">PALLOF PRESS — ANTI-ROTATION</text>
        <line x1="30" y1="130" x2="270" y2="130" stroke="#1a2a45" strokeWidth="2"/>
        {/* Cable machine */}
        <rect x="30" y="30" width="12" height="100" rx="2" fill="none" stroke="#7a8ba8" strokeWidth="2"/>
        {/* Cable line */}
        <line x1="42" y1="70" x2="130" y2="70" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4"/>
        {/* Figure standing perpendicular */}
        <circle cx="160" cy="40" r="9" fill="none" stroke="#00d2c8" strokeWidth="2"/>
        <line x1="160" y1="49" x2="160" y2="95" stroke="#00d2c8" strokeWidth="2.5"/>
        <line x1="160" y1="95" x2="150" y2="130" stroke="#00d2c8" strokeWidth="2"/>
        <line x1="160" y1="95" x2="170" y2="130" stroke="#00d2c8" strokeWidth="2"/>
        {/* Arms pressing forward */}
        <line x1="155" y1="65" x2="130" y2="65" stroke="#00d2c8" strokeWidth="2"/>{/* arm at chest */}
        <line x1="160" y1="65" x2="220" y2="65" stroke="#00d2c8" strokeWidth="2.5" strokeLinecap="round"/>{/* arm pressed out */}
        <circle cx="220" cy="65" r="3" fill="#00d2c8"/>{/* handle */}
        {/* Anti-rotation indicator */}
        <path d="M175 85 Q185 80 185 90" fill="none" stroke="#ef4444" strokeWidth="2"/>
        <text x="190" y="90" fill="#ef4444" fontSize="9" fontWeight="700">NO rotation!</text>
        {/* Press arrow */}
        <path d="M170 58 L210 58" fill="none" stroke="#f59e0b" strokeWidth="1.5"/>
        <polygon points="210,58 205,55 205,61" fill="#f59e0b"/>
        <text x="185" y="52" fill="#f59e0b" fontSize="8">PRESS straight</text>
      </svg>
    ),
    m6: ( // Face Pulls
      <svg viewBox="0 0 300 140" style={{width,height,display:"block"}}>
        <rect width="300" height="140" rx="14" fill="#0a1628"/>
        <text x="150" y="18" textAnchor="middle" fill="#4a5a78" fontSize="10" fontWeight="600">FACE PULLS — END POSITION</text>
        <line x1="30" y1="130" x2="270" y2="130" stroke="#1a2a45" strokeWidth="2"/>
        {/* Cable high */}
        <rect x="30" y="25" width="12" height="35" rx="2" fill="none" stroke="#7a8ba8" strokeWidth="2"/>
        <line x1="42" y1="35" x2="100" y2="50" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3"/>{/* rope */}
        {/* Figure */}
        <circle cx="160" cy="42" r="9" fill="none" stroke="#00d2c8" strokeWidth="2"/>
        <line x1="160" y1="51" x2="160" y2="95" stroke="#00d2c8" strokeWidth="2.5"/>
        <line x1="160" y1="95" x2="150" y2="130" stroke="#00d2c8" strokeWidth="2"/>
        <line x1="160" y1="95" x2="170" y2="130" stroke="#00d2c8" strokeWidth="2"/>
        {/* Arms in "double bicep" end position - elbows HIGH and back */}
        <line x1="155" y1="62" x2="120" y2="50" stroke="#00d2c8" strokeWidth="2.5"/>{/* left upper arm */}
        <line x1="120" y1="50" x2="120" y2="30" stroke="#00d2c8" strokeWidth="2"/>{/* left forearm up */}
        <line x1="165" y1="62" x2="200" y2="50" stroke="#00d2c8" strokeWidth="2.5"/>{/* right upper arm */}
        <line x1="200" y1="50" x2="200" y2="30" stroke="#00d2c8" strokeWidth="2"/>{/* right forearm up */}
        {/* Elbows HIGH cue */}
        <text x="105" y="62" fill="#f59e0b" fontSize="8" fontWeight="600">Elbows</text>
        <text x="105" y="72" fill="#f59e0b" fontSize="8">HIGH</text>
        <text x="215" y="42" fill="#22c55e" fontSize="8" fontWeight="600">"Double</text>
        <text x="215" y="52" fill="#22c55e" fontSize="8">bicep pose"</text>
        <text x="80" y="42" fill="#00d2c8" fontSize="8">Pull APART →</text>
      </svg>
    ),
    c1: ( // 90/90 Hip Switch
      <svg viewBox="0 0 300 140" style={{width,height,display:"block"}}>
        <rect width="300" height="140" rx="14" fill="#0a1628"/>
        <text x="150" y="18" textAnchor="middle" fill="#4a5a78" fontSize="10" fontWeight="600">90/90 HIP SWITCH</text>
        <line x1="30" y1="120" x2="270" y2="120" stroke="#1a2a45" strokeWidth="2"/>
        {/* Seated figure */}
        <circle cx="150" cy="42" r="8" fill="none" stroke="#00d2c8" strokeWidth="2"/>
        <line x1="150" y1="50" x2="150" y2="80" stroke="#00d2c8" strokeWidth="2.5"/>
        {/* Legs in 90/90 position */}
        <line x1="150" y1="80" x2="110" y2="105" stroke="#00d2c8" strokeWidth="2"/>{/* right thigh */}
        <line x1="110" y1="105" x2="80" y2="105" stroke="#00d2c8" strokeWidth="2"/>{/* right shin */}
        <line x1="150" y1="80" x2="190" y2="105" stroke="#00d2c8" strokeWidth="2"/>{/* left thigh */}
        <line x1="190" y1="105" x2="220" y2="105" stroke="#00d2c8" strokeWidth="2"/>{/* left shin */}
        {/* Switch arrow */}
        <path d="M130 90 Q150 75 170 90" fill="none" stroke="#f59e0b" strokeWidth="2"/>
        <polygon points="170,90 165,85 165,95" fill="#f59e0b"/>
        <text x="150" y="135" textAnchor="middle" fill="#00d2c8" fontSize="9">Both knees at 90° — switch sides slowly</text>
      </svg>
    ),
    c2: ( // Child's Pose
      <svg viewBox="0 0 300 140" style={{width,height,display:"block"}}>
        <rect width="300" height="140" rx="14" fill="#0a1628"/>
        <text x="150" y="18" textAnchor="middle" fill="#4a5a78" fontSize="10" fontWeight="600">CHILD'S POSE + LAT REACH</text>
        <line x1="30" y1="120" x2="270" y2="120" stroke="#1a2a45" strokeWidth="2"/>
        {/* Figure kneeling, arms forward */}
        <circle cx="200" cy="82" r="7" fill="none" stroke="#00d2c8" strokeWidth="2"/>{/* head down */}
        <path d="M193 82 Q170 70 160 85" fill="none" stroke="#00d2c8" strokeWidth="2.5"/>{/* curved back */}
        <line x1="160" y1="85" x2="160" y2="115" stroke="#00d2c8" strokeWidth="2"/>{/* sitting back */}
        {/* Arms reaching forward */}
        <line x1="200" y1="85" x2="240" y2="90" stroke="#00d2c8" strokeWidth="2"/>{/* arm forward */}
        <line x1="200" y1="88" x2="250" y2="100" stroke="#3b82f6" strokeWidth="2" strokeDasharray="3"/>{/* lat reach side */}
        <text x="252" y="98" fill="#3b82f6" fontSize="8">Reach →</text>
        <text x="100" y="60" fill="#f59e0b" fontSize="9" fontWeight="600">Hips push BACK</text>
        <path d="M155 78 L145 85" fill="none" stroke="#f59e0b" strokeWidth="1.5"/>
        <text x="100" y="100" fill="#22c55e" fontSize="9">Exhale 6s</text>
        <text x="100" y="112" fill="#22c55e" fontSize="9">Inhale 4s</text>
      </svg>
    ),
    c3: ( // Hamstring Stretch
      <svg viewBox="0 0 300 140" style={{width,height,display:"block"}}>
        <rect width="300" height="140" rx="14" fill="#0a1628"/>
        <text x="150" y="18" textAnchor="middle" fill="#4a5a78" fontSize="10" fontWeight="600">SUPINE HAMSTRING STRETCH</text>
        <line x1="30" y1="110" x2="270" y2="110" stroke="#1a2a45" strokeWidth="2"/>
        {/* Lying on back */}
        <circle cx="60" cy="100" r="7" fill="none" stroke="#00d2c8" strokeWidth="2"/>
        <line x1="67" y1="100" x2="170" y2="100" stroke="#00d2c8" strokeWidth="2.5"/>{/* torso */}
        {/* Bottom leg flat */}
        <line x1="170" y1="100" x2="250" y2="100" stroke="#00d2c8" strokeWidth="2"/>
        {/* Top leg raised with strap */}
        <line x1="150" y1="100" x2="150" y2="35" stroke="#00d2c8" strokeWidth="2.5"/>{/* leg up */}
        <line x1="145" y1="35" x2="155" y2="35" stroke="#00d2c8" strokeWidth="2"/>{/* foot */}
        {/* Strap */}
        <path d="M150 35 Q130 40 120 70" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3"/>
        <text x="105" y="65" fill="#f59e0b" fontSize="8">Strap</text>
        {/* Cues */}
        <text x="200" y="55" fill="#00d2c8" fontSize="9" fontWeight="600">Knee straight</text>
        <text x="200" y="68" fill="#22c55e" fontSize="9">6/10 stretch</text>
        <text x="120" y="125" fill="#ef4444" fontSize="8" fontWeight="600">Back FLAT on floor</text>
      </svg>
    ),
  };
  return illustrations[exerciseId] || <div style={{width:"100%",height:160,borderRadius:14,background:"#0a1628",display:"flex",alignItems:"center",justifyContent:"center",fontSize:48,border:"1px solid #1a2a45"}}>💪</div>;
}

// ── EXERCISE DATABASE (from JSON) ─────────────────────────────
// Adapters normalize the 300-exercise JSON schema for existing UI components
const CURRENT_PHASE = 1;
const BODY_GROUPS=["All","back","core","shoulders","legs","glutes","hips","full_body","chest","arms","neck","ankles","calves"];
const CATEGORIES=["All","warmup","main","cooldown","rehab","mobility","mckenzie","cardio","foam_roll"];
const MOVEMENT_PATTERNS=["All","push","pull","hinge","squat","lunge","carry","rotation","anti_rotation","anti_extension","isolation","mobility","static_stretch","foam_roll","breathing"];
const ABILITY_LEVELS=["All","any","standing","seated_only","supine_only","wheelchair_accessible","aquatic","bed_bound"];

// Extract phase-appropriate sets/reps/rest/intensity from phaseParams
function exParams(ex, phase=CURRENT_PHASE) {
  if (ex._legacy) return { sets: ex.sets||1, reps: ex.reps||"—", rest: ex.rest||0, intensity: ex.intensity||"", tempo: ex.tempo||"" };
  const p = ex.phaseParams?.[String(phase)] || Object.values(ex.phaseParams||{})[0] || {};
  return { sets: parseInt(p.sets)||1, reps: p.reps||"—", rest: parseInt(p.rest)||0, intensity: p.intensity||"", tempo: p.tempo||"" };
}

// Normalize muscles access (new schema uses flat arrays)
function exMuscles(ex) {
  return { primary: ex.primaryMuscles || ex.muscles?.primary || [], secondary: ex.secondaryMuscles || ex.muscles?.secondary || [] };
}

// Normalize injury notes (new schema: object, old: string)
function exInjuryNotes(ex) {
  if (typeof ex.injuryNotes === "string") return ex.injuryNotes;
  const n = ex.injuryNotes || {};
  return [n.lower_back && `⚠️ BACK: ${n.lower_back}`, n.knee && `⚠️ KNEE: ${n.knee}`, n.shoulder && `⚠️ SHOULDER: ${n.shoulder}`].filter(Boolean).join("\n");
}

// Normalize location display
function exLocationLabel(ex) {
  if (typeof ex.location === "string") return ex.location;
  return (ex.locationCompatible || []).join(", ") || (ex.equipmentRequired || []).join(", ");
}

// Build workout exercise list for a given phase and location from the 300-exercise DB
function buildWorkoutList(phase=1, location="gym") {
  const warmup = exerciseDB.filter(e => e.category === "warmup" && e.phaseEligibility?.includes(phase) && (e.locationCompatible||[]).includes(location)).slice(0, 5);
  const main = exerciseDB.filter(e => e.category === "main" && e.phaseEligibility?.includes(phase) && (e.locationCompatible||[]).includes(location) && e.safetyTier !== "red").slice(0, 6);
  const cooldown = exerciseDB.filter(e => e.category === "cooldown" && e.phaseEligibility?.includes(phase) && (e.locationCompatible||[]).includes(location)).slice(0, 3);
  return { warmup, main, cooldown, all: [...warmup, ...main, ...cooldown] };
}

// Default workout for backward compat with session flow
const defaultWorkout = buildWorkoutList(CURRENT_PHASE, "gym");
const allEx = defaultWorkout.all;
const wEnd = defaultWorkout.warmup.length, mEnd = wEnd + defaultWorkout.main.length;
const getPhase = i => i < wEnd ? "warmup" : i < mEnd ? "main" : "cooldown";

const C={bg:"#060b18",bgCard:"#0d1425",bgElevated:"#162040",bgGlass:"rgba(255,255,255,0.04)",border:"rgba(255,255,255,0.08)",text:"#e8ecf4",textMuted:"#7a8ba8",textDim:"#4a5a78",teal:"#00d2c8",tealGlow:"rgba(0,210,200,0.15)",tealDark:"#00a89f",tealBg:"rgba(0,210,200,0.08)",success:"#22c55e",danger:"#ef4444",warning:"#eab308",info:"#3b82f6",infoGlow:"rgba(59,130,246,0.12)",orange:"#f97316",purple:"#a855f7",purpleGlow:"rgba(168,85,247,0.12)"};

function Badge({children,color=C.teal}){return <span style={{display:"inline-flex",padding:"4px 10px",borderRadius:8,fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color,background:color+"15",border:`1px solid ${color}25`}}>{children}</span>;}
function ProgressBar({value,max=100,color=C.teal,height=6,bg}){return(<div style={{width:"100%",height,background:bg||C.border,borderRadius:height/2,overflow:"hidden"}}><div style={{width:`${Math.min(100,(value/max)*100)}%`,height:"100%",background:color,borderRadius:height/2,transition:"width 0.6s ease"}}/></div>);}
function Card({children,style,onClick,glow}){return(<div onClick={onClick} style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:16,padding:18,boxShadow:glow?`0 0 25px ${glow}`:"none",cursor:onClick?"pointer":"default",...style}}>{children}</div>);}
function Btn({children,onClick,disabled,style,variant="teal",size="lg",icon}){const v={teal:{background:`linear-gradient(135deg,${C.teal},${C.tealDark})`,color:"#000",fontWeight:700},dark:{background:C.bgElevated,color:C.text,border:`1px solid ${C.border}`},ghost:{background:"transparent",color:C.textMuted},purple:{background:`linear-gradient(135deg,${C.purple},#7c3aed)`,color:"#fff",fontWeight:700}};const s={sm:{padding:"8px 14px",fontSize:12},md:{padding:"12px 20px",fontSize:14},lg:{padding:"16px 24px",fontSize:16}};return(<button onClick={onClick} disabled={disabled} style={{...v[variant],...s[size],borderRadius:14,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.4:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,width:"100%",fontFamily:"inherit",border:v[variant]?.border||"none",...style}}>{icon&&<span>{icon}</span>}{children}</button>);}
function SectionTitle({icon,title,sub}){return(<div style={{marginBottom:12}}><div style={{display:"flex",alignItems:"center",gap:8}}>{icon&&<span style={{fontSize:18}}>{icon}</span>}<span style={{fontSize:16,fontWeight:700,color:C.text}}>{title}</span></div>{sub&&<div style={{fontSize:12,color:C.textMuted,marginTop:2,marginLeft:icon?26:0}}>{sub}</div>}</div>);}
function BottomNav({active,onNav}){const items=[{id:"home",label:"Home",icon:"🏠"},{id:"train",label:"Train",icon:"💪"},{id:"library",label:"Library",icon:"📚"},{id:"tasks",label:"Tasks",icon:"✅"},{id:"coach",label:"Coach",icon:"🤖"}];return(<div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"rgba(6,11,24,0.97)",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-around",padding:"8px 0 12px",zIndex:200}}>{items.map(it=>(<button key={it.id} onClick={()=>onNav(it.id)} style={{background:"none",border:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer",padding:"4px 12px"}}><span style={{fontSize:20,filter:active===it.id?"none":"brightness(0.5)"}}>{it.icon}</span><span style={{fontSize:10,fontWeight:600,color:active===it.id?C.teal:C.textDim}}>{it.label}</span>{active===it.id&&<div style={{width:4,height:4,borderRadius:2,background:C.teal}}/>}</button>))}</div>);}

// ── HOME ────────────────────────────────────────────────────────
function HomeScreen({onStart}){const[si,setSi]=useState(null);return(<div style={{display:"flex",flexDirection:"column",gap:16}}><div style={{display:"flex",justifyContent:"space-between"}}><div><div style={{fontSize:28,fontWeight:800,color:C.teal,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:4}}>APEX</div><div style={{fontSize:13,color:C.textMuted}}>GOOD MORNING, {USER.name.toUpperCase()} 👋</div></div><div style={{width:40,height:40,borderRadius:12,background:C.bgElevated,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🤖</div></div>
  <div style={{padding:"12px 16px",background:C.bgGlass,borderRadius:12,borderLeft:`3px solid ${C.teal}30`}}><p style={{fontSize:13,color:C.textMuted,fontStyle:"italic",margin:0}}>"{QUOTES[new Date().getDate()%QUOTES.length]}"</p></div>
  <Card glow={C.tealGlow}><div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><Badge>WEEK 1 · DAY 2</Badge><span style={{fontSize:32}}>💪</span></div><h2 style={{fontSize:22,fontWeight:800,color:C.text,margin:"0 0 8px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:2}}>UPPER BODY + CORE</h2><div style={{display:"flex",gap:12,fontSize:12,color:C.textMuted,marginBottom:4}}><span>⏱ ~45 min</span><span>🏋️ Gym</span><span>Phase 1</span></div><ProgressBar value={35} max={100} height={3} bg={C.bgElevated}/><div style={{fontSize:11,color:C.textDim,marginTop:4}}>Phase 1 · Stabilization Endurance</div><Btn onClick={onStart} style={{marginTop:16}} icon="→">Start Today's Workout</Btn></Card>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{[{v:"1",l:"Days Done"},{v:"1 🔥",l:"Streak"},{v:"4.2K",l:"Steps",c:C.teal},{v:"68%",l:"Integrity",c:C.success}].map(s=>(<Card key={s.l} style={{textAlign:"center",padding:16}}><div style={{fontSize:s.v.length>3?28:36,fontWeight:800,color:s.c||C.text,fontFamily:"'Bebas Neue',sans-serif"}}>{s.v}</div><div style={{fontSize:11,color:C.textMuted,textTransform:"uppercase",letterSpacing:1.5}}>{s.l}</div></Card>))}</div>
  <div><SectionTitle icon="🗓️" title="Your Plan"/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>{[{n:"Phase 1",s:"Foundation",a:true},{n:"Phase 2",s:"Strength",a:false},{n:"Phase 3",s:"Hypertrophy",a:false}].map(p=>(<Card key={p.n} style={{textAlign:"center",padding:14,borderColor:p.a?C.teal+"40":C.border,background:p.a?C.tealBg:C.bgCard}}><div style={{fontSize:14,fontWeight:700,color:p.a?C.text:C.textDim}}>{p.n}</div><div style={{fontSize:11,color:p.a?C.textMuted:C.textDim,marginTop:2}}>{p.s}</div></Card>))}</div></div>
  <div><SectionTitle icon="📋" title="Daily Minimums"/><Card>{[{i:"👟",l:"Steps",v:"4,200 / 8,000",p:52},{i:"🫀",l:"Cardio",v:"0 MIN",p:0},{i:"🧘",l:"Stretching",v:"0 MIN",p:0}].map(d=>(<div key={d.l} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}><div style={{display:"flex",alignItems:"center",gap:10}}><span>{d.i}</span><span style={{fontSize:14,color:C.text,fontWeight:600}}>{d.l}</span><span style={{fontSize:12,color:C.textMuted}}>— {d.v}</span></div><Badge color={d.p>0?C.teal:C.orange}>{d.p>0?`${d.p}%`:d.v.split(" ")[0]}</Badge></div>))}</Card></div>
  <div><SectionTitle icon="🩺" title="Active Injury Protocols" sub="Tap to expand"/>{INJURIES.map(inj=>(<Card key={inj.id} onClick={()=>setSi(si===inj.id?null:inj.id)} style={{marginBottom:8,cursor:"pointer"}}><div style={{display:"flex",justifyContent:"space-between"}}><div><div style={{fontSize:15,fontWeight:700,color:C.text}}>{inj.area}</div><div style={{fontSize:12,color:C.textDim}}>{inj.type}</div></div><Badge color={inj.severity<=2?C.warning:C.danger}>SEV {inj.severity}/5</Badge></div>{si===inj.id&&<div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${C.border}`}}>{inj.protocols.map((p,i)=><div key={i} style={{display:"flex",gap:8,padding:"5px 0"}}><span style={{color:C.teal}}>▸</span><span style={{fontSize:13,color:C.textMuted}}>{p}</span></div>)}</div>}</Card>))}</div>
  <div style={{height:90}}/></div>);}

// ── TRAIN PAGE ──────────────────────────────────────────────────
function TrainScreen({onStart}){
  const workout = defaultWorkout;
  const totalEx = workout.all.length;
  return(<div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div><div style={{fontSize:28,fontWeight:800,color:C.teal,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:4}}>TODAY'S WORKOUT</div><div style={{fontSize:12,color:C.textMuted}}>Week 1 · Day 2 · Upper Body + Core · Phase {CURRENT_PHASE}</div></div>
    <Card style={{background:C.tealBg,borderColor:C.teal+"30"}}><div style={{display:"flex",justifyContent:"space-between"}}><div><div style={{fontSize:16,fontWeight:700,color:C.text}}>{totalEx} Exercises</div><div style={{fontSize:12,color:C.textMuted}}>~45 min · Gym · from 300-exercise DB</div></div><Btn onClick={onStart} size="md" style={{width:"auto",padding:"10px 20px"}}>Start →</Btn></div></Card>
    {[{label:"WARM-UP",exercises:workout.warmup,color:C.info},{label:"MAIN WORK",exercises:workout.main,color:C.teal},{label:"COOLDOWN",exercises:workout.cooldown,color:C.success}].map(section=>(
      <div key={section.label}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><div style={{width:8,height:8,borderRadius:4,background:section.color}}/><span style={{fontSize:12,fontWeight:700,color:section.color,letterSpacing:2}}>{section.label}</span><span style={{fontSize:11,color:C.textDim}}>· {section.exercises.length} exercises</span></div>
        {section.exercises.map(ex=>{const p=exParams(ex);const m=exMuscles(ex);return(<Card key={ex.id} style={{padding:12,marginBottom:6}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:44,height:44,borderRadius:10,background:C.bgElevated,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{ex.emoji}</div>
            <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:C.text}}>{ex.name}</div><div style={{fontSize:11,color:C.textDim}}>{p.sets}×{p.reps} · {exLocationLabel(ex)}{p.intensity?` · ${p.intensity}`:""}</div></div>
            <div style={{display:"flex",flexWrap:"wrap",gap:3,maxWidth:90}}>{m.primary.slice(0,2).map(mu=><span key={mu} style={{fontSize:9,color:C.teal,background:C.tealBg,padding:"2px 6px",borderRadius:4}}>{mu}</span>)}</div>
          </div>
        </Card>);})}
      </div>
    ))}
    <Btn onClick={onStart} icon="⚡" style={{marginTop:8}}>Begin Check-In →</Btn>
    <div style={{height:90}}/>
  </div>);
}

// ── CHECK-IN ────────────────────────────────────────────────────
function CheckInScreen({onComplete}){const[step,setStep]=useState(0);const[location,setLocation]=useState(null);const[sleep,setSleep]=useState(null);const[sore,setSore]=useState([]);const[energy,setEnergy]=useState(5);const[stress,setStress]=useState(5);const toggle=id=>{if(id==="none"){setSore([]);return;}setSore(p=>p.includes(id)?p.filter(x=>x!==id):[...p.filter(x=>x!=="none"),id]);};const adapt=sv=>sv<=3?[{l:"Warm-up",v:"Standard"},{l:"Volume",v:"Full"},{l:"Rest",v:"Standard"},{l:"Tone",v:"Direct"},{l:"Length",v:"Standard"}]:sv<=6?[{l:"Warm-up",v:"+5 min"},{l:"Volume",v:"-20%"},{l:"Rest",v:"+15 sec"},{l:"Tone",v:"Supportive"},{l:"Length",v:"Can shorten"}]:[{l:"Warm-up",v:"+8 min"},{l:"Volume",v:"-40%"},{l:"Rest",v:"+30 sec"},{l:"Tone",v:"Gentle"},{l:"Length",v:"Shortened"}];const compute=()=>{const ss=sleep==="great"?10:sleep==="good"?7:sleep==="ok"?5:3;const so=sore.length===0?10:Math.max(2,10-sore.length*1.5);const r=Math.round((ss*0.3+so*0.2+energy*0.2+(11-stress)*0.15+6*0.15)*10);onComplete({readiness:r,capacity:Math.max(20,Math.min(100,r-INJURIES.reduce((s,i)=>s+i.severity*5,0))),location:location||"gym"});};
return(<div style={{display:"flex",flexDirection:"column",gap:16}}><div style={{display:"flex",justifyContent:"space-between"}}><div><h2 style={{fontSize:24,fontWeight:800,color:C.text,margin:0,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:2}}>CHECK-IN</h2><div style={{fontSize:12,color:C.textMuted}}>BEFORE WE START</div></div><button onClick={compute} style={{background:"none",border:"none",color:C.teal,fontSize:13,fontWeight:600,cursor:"pointer"}}>Skip →</button></div><Card style={{background:C.tealBg,borderColor:C.teal+"30",padding:14}}><Badge>DAY 2 · UPPER BODY + CORE</Badge><div style={{fontSize:12,color:C.textMuted,marginTop:6}}>5 quick questions to calibrate today's session.</div></Card>
{step===0&&<div><h3 style={{fontSize:18,fontWeight:700,color:C.text,margin:"0 0 12px"}}>📍 Where are you training?</h3>{[{id:"gym",i:"🏋️",l:"Gym",d:"Full equipment access"},{id:"home",i:"🏠",l:"Home",d:"Bodyweight + bands + DBs"},{id:"outdoor",i:"🌳",l:"Outdoor",d:"Bodyweight + minimal gear"}].map(o=>(<Card key={o.id} onClick={()=>{setLocation(o.id);setTimeout(()=>setStep(1),300);}} style={{display:"flex",alignItems:"center",gap:12,padding:14,marginBottom:8,cursor:"pointer",borderColor:location===o.id?C.teal:C.border,background:location===o.id?C.tealBg:C.bgCard}}><span style={{fontSize:24}}>{o.i}</span><div><div style={{fontSize:14,fontWeight:600,color:C.text}}>{o.l}</div><div style={{fontSize:11,color:C.textDim}}>{o.d}</div></div></Card>))}</div>}
{step===1&&<div><h3 style={{fontSize:18,fontWeight:700,color:C.text,margin:"0 0 12px"}}>😴 How did you sleep?</h3>{[{id:"great",i:"🌟",l:"Great — 8+ hrs"},{id:"good",i:"😊",l:"Good — 7-8 hrs"},{id:"ok",i:"😐",l:"OK — 5-6 hrs"},{id:"poor",i:"😩",l:"Poor — under 5 hrs"}].map(o=>(<Card key={o.id} onClick={()=>{setSleep(o.id);setTimeout(()=>setStep(2),300);}} style={{display:"flex",alignItems:"center",gap:12,padding:14,marginBottom:8,cursor:"pointer",borderColor:sleep===o.id?C.teal:C.border,background:sleep===o.id?C.tealBg:C.bgCard}}><span style={{fontSize:20}}>{o.i}</span><span style={{fontSize:14,fontWeight:600,color:C.text}}>{o.l}</span></Card>))}</div>}
{step===2&&<div><h3 style={{fontSize:18,fontWeight:700,color:C.text,margin:"0 0 4px"}}>💪 Any soreness?</h3><div style={{fontSize:12,color:C.textMuted,marginBottom:12}}>Select all that apply</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{BODY_PARTS.map(bp=>(<Card key={bp.id} onClick={()=>toggle(bp.id)} style={{display:"flex",alignItems:"center",gap:8,padding:10,cursor:"pointer",borderColor:sore.includes(bp.id)?C.teal:C.border,background:sore.includes(bp.id)?C.tealBg:C.bgCard}}><span style={{fontSize:14}}>{bp.icon}</span><span style={{fontSize:12,color:sore.includes(bp.id)?C.text:C.textMuted}}>{bp.label}</span></Card>))}</div><Card onClick={()=>setSore([])} style={{display:"flex",alignItems:"center",gap:8,padding:12,marginTop:8,cursor:"pointer",borderColor:sore.length===0?C.teal:C.border,background:sore.length===0?C.tealBg:C.bgCard}}><span>✅</span><span style={{fontSize:13,fontWeight:600,color:C.text}}>No Soreness Today</span></Card><Btn onClick={()=>setStep(3)} style={{marginTop:14}}>Next →</Btn><div style={{height:90}}/></div>}
{step===3&&<div><h3 style={{fontSize:18,fontWeight:700,color:C.text,margin:"0 0 16px"}}>⚡ Energy level?</h3><input type="range" min={1} max={10} value={energy} onChange={e=>setEnergy(parseInt(e.target.value))} style={{width:"100%",height:6,appearance:"none",background:C.border,borderRadius:3,accentColor:C.teal,cursor:"pointer"}}/><div style={{display:"flex",justifyContent:"space-between",marginTop:8}}><span style={{fontSize:11,color:C.textDim}}>Empty</span><span style={{fontSize:11,color:C.textDim}}>Charged</span></div><div style={{textAlign:"center",margin:"16px 0"}}><div style={{fontSize:48,fontWeight:800,color:C.teal,fontFamily:"'Bebas Neue',sans-serif"}}>{energy}</div></div><Btn onClick={()=>setStep(4)}>Next →</Btn></div>}
{step===4&&<div><h3 style={{fontSize:18,fontWeight:700,color:C.text,margin:"0 0 4px"}}>🧠 Stress level?</h3><div style={{fontSize:12,color:C.textMuted,marginBottom:16}}>Shapes coaching tone and volume</div><input type="range" min={1} max={10} value={stress} onChange={e=>setStress(parseInt(e.target.value))} style={{width:"100%",height:6,appearance:"none",background:C.border,borderRadius:3,accentColor:C.teal,cursor:"pointer"}}/><div style={{display:"flex",justifyContent:"space-between",marginTop:8}}><span style={{fontSize:11,color:C.textDim}}>Calm</span><span style={{fontSize:11,color:C.textDim}}>Overwhelmed</span></div><div style={{textAlign:"center",margin:"16px 0"}}><div style={{fontSize:48,fontWeight:800,color:C.teal,fontFamily:"'Bebas Neue',sans-serif"}}>{stress}</div></div><Card style={{borderColor:C.teal+"30"}}><div style={{fontSize:12,fontWeight:700,color:C.teal,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>HOW THIS SHAPES TODAY</div>{adapt(stress).map(a=>(<div key={a.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}><span style={{fontSize:13,color:C.textMuted}}>{a.l}</span><span style={{fontSize:13,color:C.teal,fontWeight:600}}>{a.v}</span></div>))}</Card><Btn onClick={compute} style={{marginTop:16}}>See My Plan →</Btn></div>}<div style={{height:90}}/></div>);}

// ── EXERCISE SCREEN ─────────────────────────────────────────────
function ExerciseScreen({exercise,index,total,phase,onDone,onSub}){const ep=exParams(exercise);const em=exMuscles(exercise);const[timerOn,setTimerOn]=useState(false);const[tl,setTl]=useState(ep.rest||0);const[resting,setResting]=useState(false);const[cs,setCs]=useState(1);const[exp,setExp]=useState("steps");const tr=useRef(null);
useEffect(()=>{setCs(1);setResting(false);setTimerOn(false);setExp("steps");},[exercise.id]);
useEffect(()=>{if(timerOn&&tl>0)tr.current=setTimeout(()=>setTl(t=>t-1),1000);else if(timerOn&&tl===0){setTimerOn(false);setResting(false);}return()=>clearTimeout(tr.current);},[timerOn,tl]);
const handleSet=()=>{if(cs<(ep.sets||1)){setCs(s=>s+1);if(ep.rest){setResting(true);setTl(ep.rest);setTimerOn(true);}}else onDone();};
const fmt=s=>`${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;
const pc={warmup:C.info,main:C.teal,cooldown:C.success}[phase]||C.teal;
const Sec=({id,title,icon,color,children})=>{const o=exp===id;return(<div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:14,borderLeft:`3px solid ${color||pc}`,overflow:"hidden",marginBottom:2}}><div onClick={()=>setExp(o?null:id)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 16px",cursor:"pointer"}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:15}}>{icon}</span><span style={{fontSize:11,fontWeight:700,color:color||pc,letterSpacing:1.5,textTransform:"uppercase"}}>{title}</span></div><span style={{color:C.textDim,fontSize:12,transform:o?"rotate(90deg)":"rotate(0)",transition:"transform 0.2s"}}>▸</span></div>{o&&<div style={{padding:"0 16px 16px"}}>{children}</div>}</div>);};
return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
  <div style={{display:"flex",justifyContent:"space-between"}}><Badge color={pc}>{phase}</Badge><span style={{fontSize:12,color:C.textDim}}>{index+1}/{total}</span></div>
  <ProgressBar value={index+1} max={total} color={pc} height={4}/>
  {/* INLINE SVG ILLUSTRATION — always loads, always accurate */}
  <ExerciseIllustration exerciseId={exercise.id}/>
  <div style={{textAlign:"center"}}><h2 style={{fontSize:24,fontWeight:800,color:"#FFF",margin:0,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:3}}>{exercise.name.toUpperCase()}</h2><div style={{fontSize:12,color:C.textDim,marginTop:4}}>📍 {exLocationLabel(exercise)} · {exercise.difficultyLevel?`Level ${exercise.difficultyLevel}`:exercise.difficulty||""}</div></div>
  <div style={{display:"grid",gridTemplateColumns:ep.intensity?"1fr 1fr 1fr":"1fr 1fr",gap:8}}>
    <Card style={{textAlign:"center",padding:12}}><div style={{fontSize:10,color:C.textDim,textTransform:"uppercase"}}>Sets</div><div style={{fontSize:22,fontWeight:800,color:C.text,fontFamily:"'Bebas Neue',sans-serif"}}>{cs}/{ep.sets||1}</div></Card>
    <Card style={{textAlign:"center",padding:12}}><div style={{fontSize:10,color:C.textDim,textTransform:"uppercase"}}>Reps</div><div style={{fontSize:22,fontWeight:800,color:C.text,fontFamily:"'Bebas Neue',sans-serif"}}>{ep.reps}</div></Card>
    {ep.intensity&&<Card style={{textAlign:"center",padding:12}}><div style={{fontSize:10,color:C.textDim,textTransform:"uppercase"}}>RPE</div><div style={{fontSize:22,fontWeight:800,color:C.teal,fontFamily:"'Bebas Neue',sans-serif"}}>{ep.intensity}</div></Card>}
  </div>
  <Card style={{padding:14}}><div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:6}}>{em.primary.map(m=><Badge key={m}>{m}</Badge>)}{em.secondary.map(m=><Badge key={m} color={C.textDim}>{m}</Badge>)}</div><div style={{fontSize:11,color:C.textMuted}}>🔧 {(exercise.equipmentRequired||[exercise.equipment]).join(", ")} · ⏱️ {ep.tempo||exercise.tempo||""}</div></Card>
  <Card style={{borderLeft:`3px solid ${pc}`}}><div style={{fontSize:12,fontWeight:700,color:pc,letterSpacing:1.5,textTransform:"uppercase",marginBottom:6}}>🎯 Why This Exercise</div><p style={{fontSize:13,color:C.textMuted,lineHeight:1.6,margin:0}}>{exercise.purpose}</p>{exercise.whyForYou&&<div style={{background:C.tealBg,borderRadius:10,padding:12,marginTop:10}}><div style={{fontSize:10,fontWeight:700,color:C.teal,textTransform:"uppercase",marginBottom:4}}>Personalized</div><p style={{fontSize:12,color:C.text,margin:0}}>{exercise.whyForYou}</p></div>}</Card>
  <Sec id="steps" title="Step-by-Step" icon="📋" color={C.info}>{exercise.steps.map((s,i)=>(<div key={i} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:i<exercise.steps.length-1?`1px solid ${C.border}`:"none"}}><div style={{minWidth:24,height:24,borderRadius:"50%",background:C.infoGlow,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:C.info,flexShrink:0}}>{i+1}</div><p style={{fontSize:13,color:C.text,lineHeight:1.65,margin:0}}>{s}</p></div>))}</Sec>
  <Sec id="form" title="Good Form" icon="✅" color={C.success}>{exercise.formCues.map((c,i)=><div key={i} style={{fontSize:13,color:C.text,padding:"5px 0"}}>{c}</div>)}</Sec>
  <Sec id="mistakes" title="Avoid These" icon="⚠️" color={C.danger}>{exercise.commonMistakes.map((m,i)=><div key={i} style={{fontSize:13,color:C.text,padding:"5px 0"}}>{m}</div>)}</Sec>
  <Sec id="bracing" title="Core Bracing" icon="🛡️" color={C.warning}><p style={{fontSize:13,color:C.text,margin:0}}>{exercise.coreBracing}</p></Sec>
  <Sec id="injury" title="Injury Notes" icon="🩺" color={C.danger}>{typeof exercise.injuryNotes==="object"?Object.entries(exercise.injuryNotes).filter(([,v])=>v).map(([k,v])=>(<div key={k} style={{fontSize:13,color:C.text,padding:"4px 0",borderBottom:`1px solid ${C.border}`}}><span style={{fontWeight:700,color:k==="lower_back"?C.danger:k==="knee"?C.warning:C.info}}>⚠️ {k==="lower_back"?"BACK":k.toUpperCase()}:</span> {v}</div>)):<p style={{fontSize:13,color:C.text,margin:0}}>{exercise.injuryNotes}</p>}</Sec>
  <Sec id="tips" title="Pro Tip" icon="💡" color={C.teal}><p style={{fontSize:13,color:C.text,margin:0}}>{exercise.proTip}</p></Sec>
  {exercise.breathing&&<Card style={{background:C.bgGlass}}><div style={{fontSize:11,fontWeight:700,color:C.info,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>🫁 BREATHING</div><div style={{display:"flex",justifyContent:"space-around"}}>{[{l:"In",v:exercise.breathing.inhale,c:C.info},...(exercise.breathing.hold&&exercise.breathing.hold!=="0"?[{l:"Hold",v:exercise.breathing.hold,c:C.warning}]:[]),{l:"Out",v:exercise.breathing.exhale,c:C.success}].map(b=>(<div key={b.l} style={{textAlign:"center"}}><div style={{fontSize:26,fontWeight:800,color:b.c,fontFamily:"'Bebas Neue',sans-serif"}}>{b.v}{String(b.v).match(/^\d+$/)?'s':''}</div><div style={{fontSize:10,color:C.textDim,textTransform:"uppercase"}}>{b.l}</div></div>))}</div>{exercise.breathing.pattern&&<div style={{fontSize:11,color:C.textMuted,textAlign:"center",marginTop:8,fontStyle:"italic"}}>{exercise.breathing.pattern}</div>}</Card>}
  {resting&&<Card glow={C.infoGlow} style={{textAlign:"center"}}><div style={{fontSize:12,fontWeight:700,color:C.info,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>REST — HYDRATE 💧</div><div style={{fontSize:48,fontWeight:800,color:C.text,fontFamily:"'Bebas Neue',sans-serif"}}>{fmt(tl)}</div><ProgressBar value={tl} max={ep.rest} color={C.info} height={4}/><Btn variant="ghost" size="sm" onClick={()=>{setTimerOn(false);setResting(false);}} style={{margin:"10px auto 0",width:"auto"}}>Skip →</Btn></Card>}
  {!resting&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,position:"sticky",bottom:76,background:C.bg,padding:"12px 0",zIndex:50}}><Btn onClick={handleSet} icon="✓" style={{fontFamily:"'Bebas Neue',sans-serif",letterSpacing:2}}>{cs<(ep.sets||1)?"SET DONE":"COMPLETE"}</Btn><Btn variant="dark" onClick={onSub} icon="🔄">Substitute</Btn></div>}
  <div style={{height:90}}/>
</div>);}

// ── LIBRARY — 300 exercises with multi-filter ────────────────────
function LibraryScreen(){
  const[catFilter,setCatFilter]=useState("All");
  const[bodyFilter,setBodyFilter]=useState("All");
  const[moveFilter,setMoveFilter]=useState("All");
  const[abilityFilter,setAbilityFilter]=useState("All");
  const[phaseFilter,setPhaseFilter]=useState("All");
  const[locFilter,setLocFilter]=useState("All");
  const[search,setSearch]=useState("");
  const[sel,setSel]=useState(null);
  const filtered=useMemo(()=>{
    let list=exerciseDB;
    if(catFilter!=="All") list=list.filter(e=>e.category===catFilter);
    if(bodyFilter!=="All") list=list.filter(e=>e.bodyPart===bodyFilter);
    if(moveFilter!=="All") list=list.filter(e=>e.movementPattern===moveFilter);
    if(abilityFilter!=="All") list=list.filter(e=>e.abilityLevel===abilityFilter);
    if(phaseFilter!=="All") list=list.filter(e=>(e.phaseEligibility||[]).includes(parseInt(phaseFilter)));
    if(locFilter!=="All") list=list.filter(e=>(e.locationCompatible||[]).includes(locFilter));
    if(search.trim()) { const q=search.toLowerCase(); list=list.filter(e=>e.name.toLowerCase().includes(q)||(e.tags||[]).some(t=>t.includes(q))); }
    return list;
  },[catFilter,bodyFilter,moveFilter,abilityFilter,phaseFilter,locFilter,search]);
  const FilterRow=({label,items,value,onChange,color=C.teal})=>(<div><div style={{fontSize:10,fontWeight:700,color:C.textDim,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>{label}</div><div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:4}}>{items.map(p=>(<button key={p} onClick={()=>onChange(p)} style={{padding:"5px 10px",borderRadius:16,border:`1px solid ${value===p?color+"60":C.border}`,background:value===p?color+"15":"transparent",color:value===p?color:C.textDim,fontSize:10,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>{p==="All"?"All":p.replace(/_/g," ")}</button>))}</div></div>);
  return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
    <div><div style={{fontSize:28,fontWeight:800,color:C.teal,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:4}}>EXERCISE LIBRARY</div><div style={{fontSize:12,color:C.textMuted}}>{exerciseDB.length} total · {filtered.length} shown</div></div>
    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search exercises or tags..." style={{padding:"10px 14px",borderRadius:12,background:C.bgCard,border:`1px solid ${C.border}`,color:C.text,fontSize:13,fontFamily:"inherit",outline:"none"}}/>
    <FilterRow label="Category" items={CATEGORIES} value={catFilter} onChange={setCatFilter} color={C.teal}/>
    <FilterRow label="Body Part" items={BODY_GROUPS} value={bodyFilter} onChange={setBodyFilter} color={C.purple}/>
    <FilterRow label="Movement" items={MOVEMENT_PATTERNS} value={moveFilter} onChange={setMoveFilter} color={C.info}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
      <FilterRow label="Phase" items={["All","1","2","3","4","5"]} value={phaseFilter} onChange={setPhaseFilter} color={C.success}/>
      <FilterRow label="Location" items={["All","gym","home","outdoor"]} value={locFilter} onChange={setLocFilter} color={C.orange}/>
      <FilterRow label="Ability" items={ABILITY_LEVELS} value={abilityFilter} onChange={setAbilityFilter} color={C.warning}/>
    </div>
    {filtered.length>50&&<div style={{fontSize:11,color:C.warning,padding:8,background:C.warning+"10",borderRadius:8}}>Showing first 50 of {filtered.length}. Use filters to narrow.</div>}
    {filtered.slice(0,50).map(ex=>{const ep2=exParams(ex);const em2=exMuscles(ex);return(<Card key={ex.id} onClick={()=>setSel(sel===ex.id?null:ex.id)} style={{cursor:"pointer",padding:sel===ex.id?18:14}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:44,height:44,borderRadius:10,background:C.bgElevated,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{ex.emoji}</div>
        <div style={{flex:1}}><div style={{fontSize:15,fontWeight:700,color:C.text}}>{ex.name}</div><div style={{fontSize:11,color:C.textDim}}>{ep2.sets}×{ep2.reps} · {ex.bodyPart?.replace(/_/g," ")}{ep2.intensity?` · ${ep2.intensity}`:""}</div></div>
        <Badge color={ex.safetyTier==="green"?C.success:ex.safetyTier==="yellow"?C.warning:C.danger}>{ex.safetyTier||"—"}</Badge>
      </div>
      {sel===ex.id&&<div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${C.border}`}}>
        <ExerciseIllustration exerciseId={ex.id}/>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:10,marginBottom:10}}>{em2.primary.map(m=><Badge key={m}>{m}</Badge>)}{em2.secondary.map(m=><Badge key={m} color={C.textDim}>{m}</Badge>)}</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:10}}>{(ex.tags||[]).slice(0,6).map(t=><span key={t} style={{fontSize:9,color:C.info,background:C.infoGlow,padding:"2px 6px",borderRadius:4}}>#{t}</span>)}</div>
        <p style={{fontSize:13,color:C.textMuted,lineHeight:1.6,margin:"0 0 8px"}}>{ex.purpose}</p>
        {ex.whyForYou&&<div style={{background:C.tealBg,borderRadius:10,padding:10,marginBottom:10}}><div style={{fontSize:10,fontWeight:700,color:C.teal,textTransform:"uppercase",marginBottom:3}}>Personalized</div><p style={{fontSize:12,color:C.text,margin:0}}>{ex.whyForYou}</p></div>}
        <div style={{fontSize:12,fontWeight:700,color:C.info,marginTop:8,marginBottom:4}}>STEPS:</div>
        {(ex.steps||[]).map((s,i)=><div key={i} style={{fontSize:12,color:C.text,padding:"4px 0",paddingLeft:16}}>{i+1}. {s}</div>)}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginTop:8}}>
          <div style={{background:C.bgGlass,borderRadius:10,padding:10}}><span style={{fontSize:10,fontWeight:700,color:C.success}}>✅ FORM</span>{(ex.formCues||[]).map((c,i)=><div key={i} style={{fontSize:11,color:C.text,padding:"2px 0"}}>{c}</div>)}</div>
          <div style={{background:C.bgGlass,borderRadius:10,padding:10}}><span style={{fontSize:10,fontWeight:700,color:C.danger}}>❌ AVOID</span>{(ex.commonMistakes||[]).map((m,i)=><div key={i} style={{fontSize:11,color:C.text,padding:"2px 0"}}>{m}</div>)}</div>
        </div>
        <div style={{background:C.bgGlass,borderRadius:10,padding:10,marginTop:6}}><span style={{fontSize:11,fontWeight:700,color:C.warning}}>🛡️ CORE: </span><span style={{fontSize:12,color:C.text}}>{ex.coreBracing}</span></div>
        <div style={{background:C.bgGlass,borderRadius:10,padding:10,marginTop:6}}><span style={{fontSize:11,fontWeight:700,color:C.danger}}>🩺 INJURY: </span>{typeof ex.injuryNotes==="object"?Object.entries(ex.injuryNotes).filter(([,v])=>v).map(([k,v])=><div key={k} style={{fontSize:11,color:C.text,marginTop:2}}><b>{k==="lower_back"?"BACK":k.toUpperCase()}:</b> {v}</div>):<span style={{fontSize:12,color:C.text}}>{ex.injuryNotes}</span>}</div>
        {ex.proTip&&<div style={{background:C.tealBg,borderRadius:10,padding:10,marginTop:6}}><span style={{fontSize:11,fontWeight:700,color:C.teal}}>💡 PRO TIP: </span><span style={{fontSize:12,color:C.text}}>{ex.proTip}</span></div>}
      </div>}
    </Card>);})}
    <div style={{height:90}}/>
  </div>);
}

// ── AI COACH — Dual Mode ────────────────────────────────────────
function CoachScreen(){const[mode,setMode]=useState(null);const[msgs,setMsgs]=useState([]);const[input,setInput]=useState("");const[loading,setLoading]=useState(false);const end=useRef(null);
  useEffect(()=>{end.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  const start=m=>{setMode(m);setMsgs([{role:"assistant",content:m==="health"?`Hey ${USER.name}! 💪 I'm your Health Coach.\n\nYour profile:\n• Lower back — post-surgical (sev 3)\n• Left knee — post-surgical (sev 2)\n• Left shoulder — labrum tear (sev 2)\n\nAsk about exercises, form, modifications, pain, recovery, nutrition. I'll include exercise diagrams when relevant.\n\nWhat do you need?`:`Hey ${USER.name}. 🧠 Welcome to Mental Performance.\n\nI use:\n• **Cognitive Behavioral** techniques\n• **Self-Coaching Model** (C→T→F→A→R→Flip)\n• **Dialectical Behavior** skills (TIPP, DEAR MAN)\n• **ACT** — values + committed action\n\nI know you're managing stress, ADHD, and using training as therapy.\n\nWhat's on your mind?`}]);};
  const sys=mode==="health"?`You are APEX Coach Health Expert. Deep knowledge of exercise science, biomechanics, corrective exercise, injury rehabilitation. Never say "NASM". Use current evidence-based principles.\n\nWhen discussing exercises, describe the position clearly so the user can visualize. Include breathing counts.\n\nCLIENT: ${USER.name}. Injuries: Lower back post-surgical (sev 3), Left knee post-surgical (sev 2), Left shoulder labrum tear (sev 2). Goals: Physique, combat sports, action sports. Phase 1. ADHD. Style: warm, direct, brief. 2-3 paragraphs max.`:`You are APEX Coach Mental Performance. Use: CBT (cognitive distortions), Self-Coaching Model (Brooke Castillo CTFAR), DBT (Distress Tolerance TIPP/STOP, Emotion Regulation, Interpersonal DEAR MAN/GIVE/FAST, Mindfulness), ACT (values, defusion, committed action), Motivational Interviewing.\n\nCLIENT: ${USER.name}, high stress (court case), ADHD (task initiation, emotional regulation, time blindness), training as therapy. Style: warm, direct, brief. Name the technique. Give ONE actionable tool. Never diagnose. 2-3 paragraphs max.`;
  const send=async()=>{if(!input.trim()||loading)return;const msg=input.trim();setInput("");setMsgs(p=>[...p,{role:"user",content:msg}]);setLoading(true);try{const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:sys,messages:[...msgs.slice(-8).map(m=>({role:m.role,content:m.content})),{role:"user",content:msg}]})});const data=await res.json();setMsgs(p=>[...p,{role:"assistant",content:data.content?.map(c=>c.text||"").join("\n")||"Connection issue."}]);}catch{setMsgs(p=>[...p,{role:"assistant",content:"Connection issue — try again."}]);}setLoading(false);};
  const renderMsg=text=>text.split("\n").map((line,i)=>{const b=line.replace(/\*\*(.*?)\*\*/g,'<b>$1</b>');return <div key={i} style={{paddingLeft:line.startsWith("•")||line.startsWith("-")?12:0,marginBottom:3}} dangerouslySetInnerHTML={{__html:b||"&nbsp;"}}/>;});
  const mc=mode==="health"?C.teal:C.purple;
  if(!mode)return(<div style={{display:"flex",flexDirection:"column",gap:16}}><div><div style={{fontSize:28,fontWeight:800,color:C.teal,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:4}}>AI COACH</div><div style={{fontSize:12,color:C.textMuted}}>Your personal expert</div></div>
    <Card onClick={()=>start("health")} glow={C.tealGlow} style={{cursor:"pointer"}}><div style={{display:"flex",alignItems:"center",gap:14}}><div style={{width:56,height:56,borderRadius:16,background:C.tealBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>💪</div><div><div style={{fontSize:18,fontWeight:700,color:C.text}}>Health Coach</div><div style={{fontSize:12,color:C.textMuted,marginTop:2}}>Exercise science · Injury rehab · Form · Recovery</div></div></div><div style={{display:"flex",gap:6,marginTop:12,flexWrap:"wrap"}}><Badge>Exercise Science</Badge><Badge color={C.info}>Injury Rehab</Badge><Badge color={C.success}>Recovery</Badge></div></Card>
    <Card onClick={()=>start("mental")} glow={C.purpleGlow} style={{cursor:"pointer"}}><div style={{display:"flex",alignItems:"center",gap:14}}><div style={{width:56,height:56,borderRadius:16,background:C.purpleGlow,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>🧠</div><div><div style={{fontSize:18,fontWeight:700,color:C.text}}>Mental Health Coach</div><div style={{fontSize:12,color:C.textMuted,marginTop:2}}>CBT · Self-Coaching · DBT · ACT · ADHD</div></div></div><div style={{display:"flex",gap:6,marginTop:12,flexWrap:"wrap"}}><Badge color={C.purple}>CBT</Badge><Badge color={C.purple}>Castillo</Badge><Badge color={C.purple}>DBT</Badge><Badge color={C.purple}>ACT</Badge></div></Card>
    <div style={{height:90}}/></div>);
  return(<div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 120px)"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div><div style={{fontSize:22,fontWeight:800,color:mc,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:3}}>{mode==="health"?"💪 HEALTH":"🧠 MENTAL"} COACH</div></div><button onClick={()=>{setMode(null);setMsgs([]);}} style={{background:C.bgElevated,border:`1px solid ${C.border}`,borderRadius:10,padding:"6px 12px",color:C.textMuted,fontSize:11,cursor:"pointer"}}>Switch ←</button></div>
    <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:12,paddingBottom:8}}>{msgs.map((m,i)=>(<div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}><div style={{maxWidth:"85%",padding:"12px 16px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.role==="user"?(mode==="health"?C.tealBg:C.purpleGlow):C.bgCard,border:`1px solid ${m.role==="user"?mc+"30":C.border}`,fontSize:14,color:C.text,lineHeight:1.6}}>{m.role==="assistant"&&<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><span style={{fontSize:14}}>{mode==="health"?"💪":"🧠"}</span><span style={{fontSize:11,fontWeight:700,color:mc,letterSpacing:1}}>APEX COACH</span></div>}<div>{renderMsg(m.content)}</div></div></div>))}
      {loading&&<div style={{padding:"12px 16px",borderRadius:16,background:C.bgCard,border:`1px solid ${C.border}`,alignSelf:"flex-start"}}><div style={{display:"flex",gap:4}}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:mc,opacity:0.5,animation:`pulse 1.2s ease ${i*0.2}s infinite`}}/>)}</div></div>}
      <div ref={end}/>
    </div>
    <div style={{display:"flex",gap:8,padding:"12px 0",borderTop:`1px solid ${C.border}`}}><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder={mode==="health"?"Form, pain, recovery...":"Stress, motivation, overwhelm..."} style={{flex:1,padding:"12px 16px",borderRadius:14,background:C.bgCard,border:`1px solid ${C.border}`,color:C.text,fontSize:14,fontFamily:"inherit",outline:"none"}}/><button onClick={send} disabled={loading||!input.trim()} style={{padding:"12px 18px",borderRadius:14,background:mc,color:mode==="health"?"#000":"#fff",fontWeight:700,border:"none",cursor:"pointer",opacity:loading?0.5:1}}>→</button></div>
  </div>);
}

// ── OTHER SCREENS ───────────────────────────────────────────────
function Mindfulness({onContinue,type}){const b={warmupToMain:{t:"TRANSITION",s:"Warm-up done. 3 deep breaths.",i:"🧘",br:{i:4,h:4,e:6}},mainToCooldown:{t:"DELOAD",s:"Main work done.",i:"🌊",br:{i:4,h:2,e:8}},midSession:{t:"CHECK-IN",s:"Halfway.",i:"💭",br:{i:3,h:3,e:5}}}[type]||{t:"PAUSE",s:"Breathe.",i:"🧘",br:{i:4,h:4,e:6}};return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:24,minHeight:400,textAlign:"center"}}><div style={{fontSize:64}}>{b.i}</div><h2 style={{fontSize:28,fontWeight:800,color:C.text,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:3,margin:0}}>{b.t}</h2><p style={{fontSize:14,color:C.textMuted,maxWidth:280}}>{b.s}</p><Card style={{background:C.bgGlass,width:"100%",maxWidth:300}}><div style={{display:"flex",justifyContent:"space-around"}}>{[{l:"In",v:b.br.i,c:C.info},{l:"Hold",v:b.br.h,c:C.warning},{l:"Out",v:b.br.e,c:C.success}].map(x=>(<div key={x.l} style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:800,color:x.c,fontFamily:"'Bebas Neue',sans-serif"}}>{x.v}s</div><div style={{fontSize:10,color:C.textDim,textTransform:"uppercase"}}>{x.l}</div></div>))}</div></Card><Btn onClick={onContinue} style={{maxWidth:300}}>Continue →</Btn><div style={{height:90}}/></div>);}
function ReflectScreen({onComplete}){const qs=[{id:"d",label:"Difficulty",icon:"📊"},{id:"p",label:"Pain",icon:"⚠️"},{id:"e",label:"Enjoyment",icon:"😊"},{id:"f",label:"Form",icon:"🎯"}];const[r,setR]=useState(()=>{const o={};qs.forEach(q=>o[q.id]=5);return o;});return(<div style={{display:"flex",flexDirection:"column",gap:16}}><h2 style={{fontSize:24,fontWeight:800,color:C.text,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:2,margin:0}}>REFLECT</h2><Card>{qs.map(q=>(<div key={q.id} style={{padding:"12px 0",borderBottom:`1px solid ${C.border}`}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:13,color:C.text}}>{q.icon} {q.label}</span><span style={{fontSize:14,fontWeight:700,color:C.teal,fontFamily:"'Bebas Neue',sans-serif"}}>{r[q.id]}/10</span></div><input type="range" min={1} max={10} value={r[q.id]} onChange={e=>setR(p=>({...p,[q.id]:parseInt(e.target.value)}))} style={{width:"100%",height:6,appearance:"none",background:C.border,borderRadius:3,accentColor:C.teal,cursor:"pointer"}}/></div>))}</Card><Btn onClick={()=>onComplete(r)}>Complete Session →</Btn><div style={{height:90}}/></div>);}
function RecapScreen({onFinish}){return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:20,textAlign:"center",paddingTop:24}}><div style={{fontSize:72}}>🏆</div><h2 style={{fontSize:32,fontWeight:800,color:C.text,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:3,margin:0}}>SESSION COMPLETE</h2><p style={{fontSize:14,color:C.textMuted,maxWidth:300}}>Every session makes the next one smarter.</p><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,width:"100%"}}>{[{l:"Duration",v:"52m",c:C.info},{l:"XP",v:"+135",c:C.teal},{l:"Streak",v:"2 🔥",c:C.success}].map(s=>(<Card key={s.l} style={{textAlign:"center",padding:16}}><div style={{fontSize:22,fontWeight:800,color:s.c,fontFamily:"'Bebas Neue',sans-serif"}}>{s.v}</div><div style={{fontSize:10,color:C.textDim,textTransform:"uppercase",marginTop:4}}>{s.l}</div></Card>))}</div><Card style={{width:"100%"}}><div style={{fontSize:12,fontWeight:700,color:C.teal,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Recovery Protocol</div>{["💧 500ml water within the hour","🍗 30-40g protein within 90 min","😴 7-8 hours sleep tonight","🧊 Joint soreness → 10-15min ice","🚶 Light 10-min walk"].map((r,i)=>(<div key={i} style={{fontSize:13,color:C.textMuted,padding:"4px 0"}}>{r}</div>))}</Card><div style={{height:90}}/></div>);}
function TasksScreen(){return(<div style={{display:"flex",flexDirection:"column",gap:16}}><div style={{fontSize:28,fontWeight:800,color:C.teal,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:4}}>TASKS</div><Card style={{textAlign:"center",padding:24}}><div style={{fontSize:48}}>🚧</div><div style={{fontSize:16,fontWeight:700,color:C.text,marginTop:8}}>Coming Soon</div><div style={{fontSize:13,color:C.textMuted,marginTop:4}}>Task board with CTFAR coaching and integrity scoring.</div></Card><div style={{height:90}}/></div>);}

// ── MAIN ────────────────────────────────────────────────────────
export default function ApexCoach(){
  const[screen,setScreen]=useState("home");const[tab,setTab]=useState("home");
  const[exIdx,setExIdx]=useState(0);const[reflectData,setReflectData]=useState(null);
  const navTo=useCallback(t=>{setTab(t);if(t==="home")setScreen("home");else if(t==="train")setScreen("train");else if(t==="library")setScreen("library");else if(t==="tasks")setScreen("tasks");else if(t==="coach")setScreen("coach");},[]);
  const handleCheckIn=()=>{setExIdx(0);setScreen("perform");setTab("train");};
  const handleExDone=()=>{const n=exIdx+1;if(n>=allEx.length){setScreen("reflect");return;}if(n===wEnd||n===mEnd){setExIdx(n);setScreen("mindfulness");return;}const mid=wEnd+Math.floor(EX.main.length/2);if(n===mid&&getPhase(exIdx)==="main"){setExIdx(n);setScreen("mindfulness");return;}setExIdx(n);};
  const getMT=()=>exIdx===wEnd?"warmupToMain":exIdx===mEnd?"mainToCooldown":"midSession";
  const reset=()=>{setScreen("home");setTab("home");setExIdx(0);setReflectData(null);};
  return(<div style={{fontFamily:"'DM Sans',-apple-system,sans-serif",background:C.bg,color:C.text,minHeight:"100vh",maxWidth:480,margin:"0 auto",padding:"20px 16px 40px",boxSizing:"border-box"}}>
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
    <style>{`input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:${C.teal};cursor:pointer;border:3px solid ${C.bg};box-shadow:0 0 10px ${C.tealGlow}}input[type="range"]::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:${C.teal};cursor:pointer;border:3px solid ${C.bg}}*{box-sizing:border-box}@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}`}</style>
    {screen==="home"&&<HomeScreen onStart={()=>setScreen("checkin")}/>}
    {screen==="train"&&<TrainScreen onStart={()=>setScreen("checkin")}/>}
    {screen==="checkin"&&<CheckInScreen onComplete={handleCheckIn}/>}
    {screen==="perform"&&<ExerciseScreen exercise={allEx[exIdx]} index={exIdx} total={allEx.length} phase={getPhase(exIdx)} onDone={handleExDone} onSub={handleExDone}/>}
    {screen==="mindfulness"&&<Mindfulness type={getMT()} onContinue={()=>setScreen("perform")}/>}
    {screen==="reflect"&&<ReflectScreen onComplete={d=>{setReflectData(d);setScreen("recap");}}/>}
    {screen==="recap"&&<RecapScreen onFinish={reset}/>}
    {screen==="coach"&&<CoachScreen/>}
    {screen==="library"&&<LibraryScreen/>}
    {screen==="tasks"&&<TasksScreen/>}
    <BottomNav active={tab} onNav={navTo}/>
  </div>);
}
