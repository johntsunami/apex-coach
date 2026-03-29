import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import exerciseDB from "./data/exercises.json";
import { getSessions, saveSession, getStats, getPrefs, setPref, computeSessionVolume } from "./utils/storage.js";
import { getWeeklyVolume, getVolumeLimit, wouldExceedVolume, findVolumeSub, capExerciseParams, getVolumeSummary, getTrainingWeek } from "./utils/volumeTracker.js";
import { getWorkoutOverloads } from "./utils/overload.js";
import OnboardingFlow, { hasCompletedAssessment, getAssessment } from "./components/Onboarding.jsx";
import InjuryManager from "./components/InjuryManager.jsx";
import AssessmentSummary from "./components/AssessmentSummary.jsx";
import ExerciseImage from "./components/ExerciseImage.jsx";
import ExtraWork from "./components/ExtraWork.jsx";
import PlanView from "./components/PlanView.jsx";
import { getInjuries } from "./utils/injuries.js";
import AuthProvider, { useAuth } from "./components/AuthProvider.jsx";
import { LandingPage, SignUpScreen, LogInScreen, ForgotPasswordScreen, ProfileScreen } from "./components/AuthScreens.jsx";
import { checkExerciseImages, validateExerciseDB, testWorkoutEngine, getLocalStorageStats, checkSupabaseConnection, getErrorLog, clearErrorLog, log as debugLog } from "./utils/debug.js";
import { syncOverridesFromSupabase } from "./utils/imageOverrides.js";
import { PTProgressCard, PTMiniSession, PTProgressPage, saveAssessmentToSupabase, saveProtocolsToSupabase, generateProtocols, saveLocalProtocols } from "./components/PTSystem.jsx";
import { verifyAndFix, runAllChecks } from "./utils/safetyVerification.js";
import { ALL_TEST_PROFILES } from "./utils/testProfiles.js";
import { buildRoadmap, checkReadiness, getAllFavoriteRoadmaps, checkAutoAdvancements, getUnlockNotifications, markNotificationsSeen, prioritizeFavorites, recordExerciseCompletion, getProgressPercent } from "./utils/progressionRoadmap.js";
import SwapModal from "./components/ExerciseSwap.jsx";
import { CardioFitnessCard, VO2TestModal, CardioLogModal, HRZonesCard } from "./components/CardioTracker.jsx";
import { getCardioPrescription, getHRSettings } from "./utils/cardio.js";
import ProgressDashboard from "./components/ProgressDashboard.jsx";
import OvertrainingCard from "./components/OvertrainingCard.jsx";
import { assessOvertraining, applyOvertrainingModifiers } from "./utils/overtrainingDetector.js";
import { capturePreReassessmentSnapshot, processReassessment } from "./utils/reassessment.js";
import ReassessmentSummary from "./components/ReassessmentSummary.jsx";
import { getPESSuperset, PROGRAM_FILTERS, filterByProgram, detectPrograms, getSportMessage } from "./utils/programTracks.js";
import { getGreeting, getSetMessage, getRestTip, getRestTimerMessage, getSkipRestMessage, getRecapHeadline, getWorkoutCompleteMessage, getStreakMessage, getStreakEmoji, getCheckInSummary, checkEasterEgg } from "./utils/personality.js";

// ═══════════════════════════════════════════════════════════════
// APEX COACH V13 — Inline SVG exercise illustrations, Train page,
// Library body part filters, all V7 spec features
// ═══════════════════════════════════════════════════════════════

const USER={name:"John"};
const QUOTES=["Progress is not always adding weight. Sometimes it's just showing up.","Discipline is choosing between what you want now and what you want most.","You don't have to be extreme, just consistent.","Train smarter today so you can train harder tomorrow.","Recovery is when the magic happens. Trust the process.","The best workout is the one you actually do.","Your body keeps score. Every session counts.","Small hinges swing big doors. One rep at a time."];
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

// Extract phase-appropriate sets/reps/rest/intensity from phaseParams (with volume caps)
function exParams(ex, phase=CURRENT_PHASE, diff="standard") {
  if (ex._legacy) return { sets: ex.sets||1, reps: ex.reps||"—", rest: ex.rest||0, intensity: ex.intensity||"", tempo: ex.tempo||"" };
  const cp = capExerciseParams(ex, phase, diff);
  return { sets: cp.sets, reps: cp.reps, rest: cp.rest, intensity: cp.intensity, tempo: cp.tempo, _capped: cp._capped, _deload: cp._deload };
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

// ── Location-aware workout builder with equipment filtering + substitutions ──
const HOME_EQUIPMENT = new Set(["none","mat","band","dumbbell","kettlebell","foam_roller","towel","strap","wall","bench","stability_ball","box"]);
const exById = Object.fromEntries(exerciseDB.map(e => [e.id, e]));

function locationFilter(ex, location) {
  if (location === "gym") return true;
  if (location === "outdoor") return (ex.locationCompatible || []).includes("outdoor");
  // home: every piece of equipmentRequired must be in HOME_EQUIPMENT
  return (ex.equipmentRequired || []).every(eq => HOME_EQUIPMENT.has(eq));
}

function trySubstitute(ex, location, phase) {
  const subKey = location === "outdoor" ? "outdoor" : "home";
  const subId = ex.substitutions?.[subKey];
  if (!subId) return null;
  const sub = exById[subId];
  if (!sub) return null;
  if (!(sub.phaseEligibility || []).includes(phase)) return null;
  if (!locationFilter(sub, location)) return null;
  // Return the substitute exercise with swap metadata
  return { ...sub, _swappedFor: ex.name, _swapReason: location === "outdoor" ? "outdoor — no gym equipment" : "home — equipment not available" };
}

// ── Dynamic session block builder (CEx Continuum) ─────────────
// Generates warm-up ROM + cooldown stretches from DB based on check-in
function buildSessionBlocks(phase, location, checkInData, mainExercises) {
  const soreAreas = (checkInData?.soreness || []);
  const injuries = getInjuries().filter(i => i.status !== "resolved");
  const locOk = e => locationFilter(e, location);

  // PHASE A: INHIBIT — foam rolling for sore areas + overactive muscles
  const foamPool = exerciseDB.filter(e => e.category === "foam_roll" && (e.phaseEligibility || []).includes(phase) && locOk(e));
  const inhibit = [];
  // Prioritize sore area foam rolls
  const soreMap = { lowerback: "back", upperback: "back", hips: "hips", lknee: "legs", rknee: "legs", calves: "calves", hamstrings: "legs", lquad: "legs", rquad: "legs", lshoulder: "shoulders", rshoulder: "shoulders" };
  const soreBps = new Set(soreAreas.map(s => soreMap[s]).filter(Boolean));
  foamPool.forEach(e => { if (inhibit.length < 5 && soreBps.has(e.bodyPart)) inhibit.push({ ...e, _reason: "Targets sore area — extra attention" }); });
  // Fill remaining with general foam rolling
  foamPool.forEach(e => { if (inhibit.length < 3 && !inhibit.find(x => x.id === e.id)) inhibit.push({ ...e, _reason: "General tissue prep" }); });

  // PHASE B: LENGTHEN — mobility + ROM for joints
  const mobPool = exerciseDB.filter(e => (e.category === "warmup" || e.category === "mobility") && e.type === "mobility" && (e.phaseEligibility || []).includes(phase) && locOk(e));
  const lengthen = [];
  // Injury-specific mobility
  injuries.forEach(inj => {
    const injMob = mobPool.find(e => e.bodyPart === (inj.gateKey === "lower_back" ? "back" : inj.gateKey === "knee" ? "legs" : "shoulders") && !lengthen.find(x => x.id === e.id));
    if (injMob && lengthen.length < 5) lengthen.push({ ...injMob, _reason: `${inj.area} — injury-specific mobility` });
  });
  // Sore area mobility
  mobPool.forEach(e => { if (lengthen.length < 5 && soreBps.has(e.bodyPart) && !lengthen.find(x => x.id === e.id)) lengthen.push({ ...e, _reason: "Extra ROM for sore area" }); });
  // Fill to 3-5 with general mobility
  mobPool.forEach(e => { if (lengthen.length < 4 && !lengthen.find(x => x.id === e.id)) lengthen.push({ ...e, _reason: "Dynamic joint prep" }); });

  // PHASE E: COOLDOWN — static stretches for ALL muscles trained
  const stretchPool = exerciseDB.filter(e => e.category === "cooldown" && (e.phaseEligibility || []).includes(phase) && locOk(e));
  const trainedBps = new Set((mainExercises || []).map(e => e.bodyPart).filter(Boolean));
  const cooldownStretches = [];
  // Stretch every trained muscle
  stretchPool.forEach(e => { if (trainedBps.has(e.bodyPart) && !cooldownStretches.find(x => x.id === e.id)) cooldownStretches.push({ ...e, _reason: "Stretch for trained muscles", _duration: soreAreas.length > 0 && soreBps.has(e.bodyPart) ? "60s (double — sore area)" : "30s" }); });
  // Extra for injuries
  injuries.forEach(inj => {
    const injStr = stretchPool.find(e => e.bodyPart === (inj.gateKey === "lower_back" ? "back" : inj.gateKey === "knee" ? "legs" : "shoulders") && !cooldownStretches.find(x => x.id === e.id));
    if (injStr) cooldownStretches.push({ ...injStr, _reason: `${inj.area} — injury recovery stretch`, _duration: "60s (double — injury area)" });
  });
  // Fill to minimum 3
  stretchPool.forEach(e => { if (cooldownStretches.length < 3 && !cooldownStretches.find(x => x.id === e.id)) cooldownStretches.push({ ...e, _reason: "General recovery", _duration: "30s" }); });

  // OPTIONAL: Foam rolling add-on
  const foamAddOn = foamPool.filter(e => !inhibit.find(x => x.id === e.id)).slice(0, 4).map(e => ({ ...e, _reason: "Optional recovery foam rolling" }));

  return { inhibit, lengthen, cooldownStretches, foamAddOn };
}

function buildWorkoutList(phase=1, location="gym", difficulty="standard", checkInData=null) {
  const weeklyVol = getWeeklyVolume();
  const runningVol = { ...weeklyVol }; // mutable copy for tracking within this session
  const volSwaps = []; // track volume-based substitutions
  const pick = (category, limit) => {
    const pool = exerciseDB.filter(e =>
      e.category === category &&
      (e.phaseEligibility || []).includes(phase) &&
      (category !== "main" || e.safetyTier !== "red")
    );
    const result = [];
    const usedIds = new Set();
    for (const ex of pool) {
      if (result.length >= limit) break;
      if (usedIds.has(ex.id)) continue;
      // Location filter
      let picked = null;
      if (locationFilter(ex, location)) {
        picked = ex;
      } else {
        const sub = trySubstitute(ex, location, phase);
        if (sub && !usedIds.has(sub.id)) picked = sub;
      }
      if (!picked) continue;
      // Volume check for main exercises
      if (category === "main") {
        const volCheck = wouldExceedVolume(picked, runningVol, phase);
        if (volCheck.exceeded) {
          const mobSub = findVolumeSub(picked, exerciseDB, phase, location);
          if (mobSub && !usedIds.has(mobSub.id)) {
            const swapNote = `${volCheck.muscle.replace(/_/g," ")} is at ${volCheck.current}/${volCheck.limit} sets this week`;
            volSwaps.push({ original: picked.name, reason: swapNote, replacement: mobSub.name });
            result.push({ ...mobSub, _swappedFor: picked.name, _swapReason: swapNote + " — swapped to prevent overtraining" });
            usedIds.add(mobSub.id);
          }
          continue;
        }
        // Track volume we're adding
        const bp = picked.bodyPart || "other";
        const cp = capExerciseParams(picked, phase, difficulty);
        runningVol[bp] = (runningVol[bp] || 0) + cp.sets;
      }
      result.push(picked);
      usedIds.add(picked.id);
    }
    return result;
  };
  const warmup = pick("warmup", 5);
  let main = pick("main", 6);
  const cooldown = pick("cooldown", 3);

  // Prioritize favorited exercises — include ready ones, regress unready ones
  const assessment = getAssessment();
  const favs = assessment?.preferences?.favorites || [];
  if (favs.length > 0) {
    const mainIds = new Set(main.map(e => e.id));
    const { additions, notes } = prioritizeFavorites({ main }, favs, phase);
    for (const add of additions) {
      if (!mainIds.has(add.id) && main.length < 8) {
        // Volume check before adding
        const bp = add.bodyPart || "other";
        const addSets = parseInt(add.phaseParams?.[String(phase)]?.sets) || 1;
        if ((runningVol[bp] || 0) + addSets <= (getVolumeLimit(phase).max || 12)) {
          main.push(add);
          mainIds.add(add.id);
          runningVol[bp] = (runningVol[bp] || 0) + addSets;
        }
      }
    }
  }

  // PES superset pairing (Phase 4-5): strength exercise → power exercise
  if (phase >= 4) {
    const supersets = [];
    for (const ex of main) {
      const power = getPESSuperset(ex, phase);
      if (power && !main.find(m => m.id === power.id) && !supersets.find(s => s.id === power.id)) {
        supersets.push(power);
      }
    }
    if (supersets.length > 0) main = [...main, ...supersets.slice(0, 3)];
  }

  // Build dynamic session blocks based on check-in + main exercises
  const blocks = buildSessionBlocks(phase, location, checkInData, main);

  // Enrich exercises with last-used load from session history
  const sessions = getSessions() || [];
  const lastLoads = {};
  for (let i = sessions.length - 1; i >= 0 && Object.keys(lastLoads).length < 50; i--) {
    for (const ec of (sessions[i].exercises_completed || [])) {
      if (lastLoads[ec.exercise_id]) continue;
      const maxLoad = Math.max(0, ...(ec.sets || []).map(s => s.load || 0));
      if (maxLoad > 0) lastLoads[ec.exercise_id] = maxLoad;
    }
  }
  const enrich = (ex) => lastLoads[ex.id] ? { ...ex, _lastLoad: lastLoads[ex.id] } : ex;
  const eWarmup = warmup.map(enrich), eMain = main.map(enrich), eCooldown = cooldown.map(enrich);

  return { warmup: eWarmup, main: eMain, cooldown: eCooldown, all: [...eWarmup, ...eMain, ...eCooldown], location, volSwaps, weeklyVol: runningVol, blocks };
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
function BottomNav({active,onNav}){const items=[{id:"home",label:"Home",icon:"🏠"},{id:"train",label:"Train",icon:"💪"},{id:"library",label:"Library",icon:"📚"},{id:"tasks",label:"Tasks",icon:"✅"},{id:"coach",label:"Coach",icon:"🤖"}];return(<div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"rgba(6,11,24,0.98)",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-around",padding:"10px 0 16px",zIndex:200,backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)"}}>{items.map(it=>(<button key={it.id} onClick={()=>onNav(it.id)} style={{background:"none",border:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",padding:"6px 14px",minHeight:48,transition:"transform 150ms ease"}}><span style={{fontSize:22,filter:active===it.id?"none":"brightness(0.5)",transition:"filter 200ms"}}>{it.icon}</span><span style={{fontSize:10,fontWeight:active===it.id?700:500,color:active===it.id?C.teal:C.textDim,transition:"color 200ms"}}>{it.label}</span>{active===it.id&&<div style={{width:4,height:4,borderRadius:2,background:C.teal}}/>}</button>))}</div>);}

// ── DEBUG PANEL (tap APEX 5x to reveal) ─────────────────────────
function DebugPanel({onClose}){
  const[tab,setTab]=useState("images");
  const[imgStatus,setImgStatus]=useState(null);
  const[dbStatus,setDbStatus]=useState(null);
  const[engineStatus,setEngineStatus]=useState(null);
  const[supa,setSupa]=useState(null);
  const[ls,setLs]=useState(null);
  const[errors,setErrors]=useState([]);
  const[imgLoading,setImgLoading]=useState(false);
  const[safetyAudit,setSafetyAudit]=useState(null);
  const[qaResults,setQaResults]=useState(null);
  const[qaRunning,setQaRunning]=useState(false);

  useEffect(()=>{
    setLs(getLocalStorageStats());
    setErrors(getErrorLog());
    checkSupabaseConnection().then(setSupa);
    const dbResult=validateExerciseDB(exerciseDB);
    setDbStatus(dbResult);
  },[]);

  const runImageCheck=()=>{setImgLoading(true);checkExerciseImages(exerciseDB).then(r=>{setImgStatus(r);setImgLoading(false);});};
  const runEngineTest=()=>{setEngineStatus(testWorkoutEngine(buildWorkoutList));};

  const tabs=[{id:"images",label:"Images"},{id:"db",label:"DB"},{id:"engine",label:"Engine"},{id:"safety",label:"Safety"},{id:"supa",label:"Supabase"},{id:"storage",label:"Storage"},{id:"errors",label:"Errors"}];
  const S={panel:{background:C.bg,border:`2px solid ${C.teal}40`,borderRadius:16,padding:16,marginBottom:16},
    tabRow:{display:"flex",gap:4,marginBottom:12,flexWrap:"wrap"},
    tab:(active)=>({padding:"4px 10px",borderRadius:8,fontSize:10,fontWeight:700,cursor:"pointer",border:`1px solid ${active?C.teal:C.border}`,background:active?C.teal+"20":"transparent",color:active?C.teal:C.textDim}),
    row:{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${C.border}`,fontSize:11},
    label:{color:C.textMuted},val:{color:C.text,fontWeight:600},
    btn:{padding:"6px 12px",borderRadius:8,border:`1px solid ${C.teal}`,background:C.teal+"15",color:C.teal,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"},
    stat:(color)=>({fontSize:24,fontWeight:800,color,fontFamily:"'Bebas Neue',sans-serif"}),
  };
  return(
    <div style={S.panel}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontSize:14,fontWeight:700,color:C.teal,letterSpacing:2}}>DEBUG PANEL</div>
        <button onClick={onClose} style={{background:"none",border:"none",color:C.textDim,fontSize:18,cursor:"pointer"}}>x</button>
      </div>
      <div style={S.tabRow}>{tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={S.tab(tab===t.id)}>{t.label}</button>)}</div>

      {tab==="images"&&<div>
        <button onClick={runImageCheck} disabled={imgLoading} style={S.btn}>{imgLoading?"Checking...":"Run Image Check"}</button>
        {imgStatus&&<div style={{marginTop:10}}>
          <div style={{display:"flex",gap:16,marginBottom:8}}>
            <div><span style={S.stat(C.success)}>{imgStatus.working.length}</span><div style={{fontSize:9,color:C.textDim}}>Working</div></div>
            <div><span style={S.stat(C.danger)}>{imgStatus.broken.length}</span><div style={{fontSize:9,color:C.textDim}}>Broken</div></div>
            <div><span style={S.stat(C.warning)}>{imgStatus.missing.length}</span><div style={{fontSize:9,color:C.textDim}}>No URL</div></div>
            <div><span style={S.stat(C.textMuted)}>{imgStatus.total}</span><div style={{fontSize:9,color:C.textDim}}>Total</div></div>
          </div>
          {imgStatus.broken.length>0&&<div style={{maxHeight:120,overflow:"auto"}}>{imgStatus.broken.map(b=><div key={b.id} style={S.row}><span style={S.label}>{b.name}</span><span style={{color:C.danger,fontSize:10}}>{b.error}</span></div>)}</div>}
        </div>}
      </div>}

      {tab==="db"&&<div>
        {dbStatus&&<div>
          <div style={{display:"flex",gap:16,marginBottom:8}}>
            <div><span style={S.stat(C.danger)}>{dbStatus.errors}</span><div style={{fontSize:9,color:C.textDim}}>Errors</div></div>
            <div><span style={S.stat(C.warning)}>{dbStatus.warnings}</span><div style={{fontSize:9,color:C.textDim}}>Warnings</div></div>
            <div><span style={S.stat(C.teal)}>{dbStatus.total}</span><div style={{fontSize:9,color:C.textDim}}>Exercises</div></div>
          </div>
          {dbStatus.issues.length>0&&<div style={{maxHeight:200,overflow:"auto"}}>{dbStatus.issues.slice(0,30).map((iss,i)=><div key={i} style={S.row}><span style={{color:iss.severity==="error"?C.danger:C.warning,fontSize:10,minWidth:40}}>{iss.severity}</span><span style={{color:C.textDim,fontSize:10}}>{iss.id}: {iss.msg}</span></div>)}</div>}
        </div>}
      </div>}

      {tab==="engine"&&<div>
        <button onClick={runEngineTest} style={S.btn}>Test Workout Engine</button>
        {engineStatus&&<div style={{marginTop:10}}>{engineStatus.map((r,i)=><div key={i} style={S.row}><span style={S.label}>{r.scenario}</span><span style={{color:r.status==="ok"?C.success:C.danger,fontSize:10}}>{r.status==="ok"?`W${r.warmup} M${r.main} C${r.cooldown} = ${r.total}`:r.error}</span></div>)}</div>}
      </div>}

      {tab==="safety"&&<div>
        <div style={{display:"flex",gap:6,marginBottom:10}}>
          <button onClick={()=>{const w=buildWorkoutList(CURRENT_PHASE,"gym");const rpt=runAllChecks(w);setSafetyAudit(rpt);}} style={S.btn}>Run Safety Audit</button>
          <button onClick={()=>{setQaRunning(true);const results=ALL_TEST_PROFILES.map(p=>{const w=buildWorkoutList(p.phase||1,"gym");const rpt=runAllChecks(w,p);return{name:p.name,passed:rpt.passed,failed:rpt.failed,total:rpt.totalChecks,blocked:rpt.blocked,issues:rpt.allIssues.length,corrections:rpt.allCorrections.length,checks:rpt.checks};});setQaResults(results);setQaRunning(false);}} disabled={qaRunning} style={{...S.btn,borderColor:C.purple,color:C.purple}}>{qaRunning?"Running...":"Run QA Tests (5 profiles)"}</button>
        </div>
        {safetyAudit&&<div>
          <div style={{display:"flex",gap:16,marginBottom:8}}>
            <div><span style={S.stat(C.success)}>{safetyAudit.passed}</span><div style={{fontSize:9,color:C.textDim}}>Passed</div></div>
            <div><span style={S.stat(safetyAudit.failed>0?C.danger:C.success)}>{safetyAudit.failed}</span><div style={{fontSize:9,color:C.textDim}}>Failed</div></div>
            <div><span style={S.stat(C.warning)}>{safetyAudit.allCorrections.length}</span><div style={{fontSize:9,color:C.textDim}}>Fixes</div></div>
            <div><span style={S.stat(C.info)}>{safetyAudit.totalChecks}</span><div style={{fontSize:9,color:C.textDim}}>Total</div></div>
          </div>
          <div style={{maxHeight:200,overflow:"auto"}}>
            {safetyAudit.checks.map(c=><div key={c.id} style={{...S.row,gap:4}}>
              <span style={{fontSize:12,minWidth:16}}>{c.passed?"✅":"❌"}</span>
              <span style={{fontSize:10,color:c.passed?C.success:C.danger,flex:1}}>{c.id}. {c.name}</span>
              <span style={{fontSize:9,color:C.textDim}}>{c.issueCount>0?`${c.issueCount} issues`:""}</span>
            </div>)}
          </div>
          {safetyAudit.allIssues.length>0&&<div style={{marginTop:8}}>
            <div style={{fontSize:10,fontWeight:700,color:C.danger,marginBottom:4}}>Issues ({safetyAudit.allIssues.length})</div>
            <div style={{maxHeight:120,overflow:"auto"}}>{safetyAudit.allIssues.slice(0,15).map((iss,i)=><div key={i} style={{fontSize:9,color:iss.severity==="critical"?C.danger:iss.severity==="warning"?C.warning:C.textMuted,padding:"2px 0",borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontWeight:700}}>[{iss.severity}]</span> {iss.exercise?`${iss.exercise}: `:"" }{iss.msg}
            </div>)}</div>
          </div>}
        </div>}
        {qaResults&&<div style={{marginTop:10}}>
          <div style={{fontSize:11,fontWeight:700,color:C.purple,letterSpacing:1,marginBottom:6}}>QA TEST RESULTS — {qaResults.length} PROFILES</div>
          {qaResults.map((r,i)=><div key={i} style={{padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
              <span style={{fontSize:10,fontWeight:600,color:C.text}}>{r.name}</span>
              <Badge color={r.failed===0?C.success:C.danger}>{r.passed}/{r.total}</Badge>
            </div>
            {r.failed>0&&<div style={{fontSize:9,color:C.textDim}}>{r.issues} issues · {r.corrections} corrections{r.blocked?" · BLOCKED":""}</div>}
            {r.failed>0&&r.checks.filter(c=>!c.passed).map(c=><div key={c.id} style={{fontSize:8,color:C.warning,paddingLeft:8}}>❌ {c.name}: {c.issues[0]?.msg?.substring(0,80)||"failed"}</div>)}
          </div>)}
          <div style={{marginTop:6,padding:6,background:qaResults.every(r=>r.failed===0)?C.success+"10":C.warning+"10",borderRadius:6}}>
            <div style={{fontSize:10,fontWeight:700,color:qaResults.every(r=>r.failed===0)?C.success:C.warning}}>
              {qaResults.every(r=>r.failed===0)?"ALL 5 PROFILES PASS ALL 12 CHECKS ✓":`${qaResults.filter(r=>r.failed>0).length} profile(s) have flagged checks`}
            </div>
          </div>
        </div>}
        {!safetyAudit&&!qaResults&&<div style={{fontSize:11,color:C.textDim}}>Run Safety Audit to check current plan, or QA Tests to verify all 5 test profiles.</div>}
      </div>}

      {tab==="supa"&&<div>
        {supa?<div>
          {[{l:"Status",v:supa.status,c:supa.status==="connected"?C.success:C.danger},{l:"Latency",v:supa.latency||"—"},{l:"Session",v:supa.hasSession?"Active":"None"},{l:"User",v:supa.user||supa.msg||"—"}].map(r=><div key={r.l} style={S.row}><span style={S.label}>{r.l}</span><span style={{...S.val,color:r.c||C.text}}>{r.v}</span></div>)}
        </div>:<div style={{fontSize:11,color:C.textDim}}>Checking...</div>}
      </div>}

      {tab==="storage"&&<div>
        {ls&&<div>
          <div style={{display:"flex",gap:16,marginBottom:8}}>
            <div><span style={S.stat(C.teal)}>{ls.totalItems}</span><div style={{fontSize:9,color:C.textDim}}>Keys</div></div>
            <div><span style={S.stat(C.info)}>{ls.totalKB}</span><div style={{fontSize:9,color:C.textDim}}>Used</div></div>
          </div>
          <div style={{maxHeight:150,overflow:"auto"}}>{ls.items.map(it=><div key={it.key} style={S.row}><span style={S.label}>{it.key}</span><span style={S.val}>{it.sizeKB}</span></div>)}</div>
        </div>}
      </div>}

      {tab==="errors"&&<div>
        {errors.length===0?<div style={{fontSize:11,color:C.textDim}}>No errors logged</div>:<div>
          <button onClick={()=>{clearErrorLog();setErrors([]);}} style={{...S.btn,borderColor:C.danger,color:C.danger,marginBottom:8}}>Clear Log</button>
          <div style={{maxHeight:200,overflow:"auto"}}>{errors.map((e,i)=><div key={i} style={{...S.row,flexDirection:"column",gap:2}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:C.danger,fontSize:10}}>{e.context||"unknown"}</span><span style={{color:C.textDim,fontSize:9}}>{new Date(e.ts).toLocaleTimeString()}</span></div><span style={{fontSize:10,color:C.textMuted}}>{e.msg}</span></div>)}</div>
        </div>}
      </div>}

      <div style={{marginTop:12,fontSize:9,color:C.textDim,textAlign:"center"}}>APEX Coach v13 | {exerciseDB.length} exercises | {import.meta.env.MODE}</div>
    </div>
  );
}

// ── HOME ────────────────────────────────────────────────────────
function HomeScreen({onStart,onRetakeAssessment,onEditInjuries,onProfile,onViewPlan,onViewSummary,onPTSession,onPTProgress}){const[si,setSi]=useState(null);const[debugTaps,setDebugTaps]=useState(0);const[showDebug,setShowDebug]=useState(false);const[showVO2Test,setShowVO2Test]=useState(false);const[showCardioLog,setShowCardioLog]=useState(false);const[cardioRev,setCardioRev]=useState(0);const stats=getStats();const dynamicInjuries=getInjuries().filter(i=>i.status!=="resolved");const auth=useAuth();const userName=auth?.profile?.first_name||USER.name;const handleApexTap=()=>{const next=debugTaps+1;setDebugTaps(next);if(next>=5){setShowDebug(true);setDebugTaps(0);}setTimeout(()=>setDebugTaps(0),2000);};const easterEgg=checkEasterEgg(stats);return(<div className="stagger safe-bottom" style={{display:"flex",flexDirection:"column",gap:20}}><div style={{display:"flex",justifyContent:"space-between"}}><div><div onClick={handleApexTap} style={{fontSize:28,fontWeight:800,color:C.teal,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:4,cursor:"default",userSelect:"none"}}>APEX<span style={{fontSize:9,color:C.textDim,letterSpacing:1,marginLeft:6}}>v13</span></div><div style={{fontSize:13,color:C.textMuted}}>{getGreeting(userName,stats).toUpperCase()} 👋</div>{easterEgg&&<div style={{fontSize:10,color:C.purple,marginTop:2,fontStyle:"italic"}}>{easterEgg}</div>}</div><div onClick={onProfile} style={{width:40,height:40,borderRadius:12,background:C.bgElevated,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,cursor:"pointer"}}>⚙️</div></div>
  {showDebug&&<DebugPanel onClose={()=>setShowDebug(false)}/>}
  <div style={{padding:"12px 16px",background:C.bgGlass,borderRadius:12,borderLeft:`3px solid ${C.teal}30`}}><p style={{fontSize:13,color:C.textMuted,fontStyle:"italic",margin:0}}>"{QUOTES[new Date().getDate()%QUOTES.length]}"</p></div>
  <Card glow={C.tealGlow}><div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><Badge>WEEK 1 · DAY 2</Badge><span style={{fontSize:32}}>💪</span></div><h2 style={{fontSize:22,fontWeight:800,color:C.text,margin:"0 0 8px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:2}}>UPPER BODY + CORE</h2><div style={{display:"flex",gap:12,fontSize:12,color:C.textMuted,marginBottom:4}}><span>⏱ ~45 min</span><span>🏋️ Gym</span><span>Phase 1</span></div><ProgressBar value={35} max={100} height={3} bg={C.bgElevated}/><div style={{fontSize:11,color:C.textDim,marginTop:4}}>Phase 1 · Stabilization Endurance</div><Btn onClick={onStart} style={{marginTop:16}} icon="→">Start Today's Workout</Btn></Card>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{onViewPlan&&<Card onClick={onViewPlan} style={{cursor:"pointer",padding:14,textAlign:"center"}}><span style={{fontSize:18}}>📋</span><div style={{fontSize:11,fontWeight:700,color:C.info,marginTop:4}}>View Full Plan</div><div style={{fontSize:9,color:C.textDim}}>12-month roadmap</div></Card>}{onViewSummary&&<Card onClick={onViewSummary} style={{cursor:"pointer",padding:14,textAlign:"center"}}><span style={{fontSize:18}}>📊</span><div style={{fontSize:11,fontWeight:700,color:C.purple,marginTop:4}}>My Assessment</div><div style={{fontSize:9,color:C.textDim}}>Review profile</div></Card>}</div>
  <OvertrainingCard/>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{[{v:String(stats.totalSessions),l:"Days Done"},{v:`${stats.streak} 🔥`,l:"Streak"},{v:String(stats.sessionsThisWeek),l:"This Week",c:C.teal},{v:stats.totalSessions>0?`${Math.min(100,Math.round(stats.streak/7*100))}%`:"—",l:"Consistency",c:C.success}].map(s=>(<Card key={s.l} style={{textAlign:"center",padding:16}}><div style={{fontSize:s.v.length>3?28:36,fontWeight:800,color:s.c||C.text,fontFamily:"'Bebas Neue',sans-serif"}}>{s.v}</div><div style={{fontSize:11,color:C.textMuted,textTransform:"uppercase",letterSpacing:1.5}}>{s.l}</div></Card>))}</div>
  {(()=>{const vs=getVolumeSummary(CURRENT_PHASE);const tw=getTrainingWeek();return(<div><SectionTitle icon="📊" title={`Weekly Volume — Week ${tw.week}`} sub={tw.isDeload?"DELOAD WEEK — 50% volume for recovery":vs.groups.length===0?"No sessions this week yet":"Sets completed vs limit per muscle"}/>{tw.isDeload&&<Card style={{background:C.info+"10",borderColor:C.info+"30",marginBottom:10,padding:14}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:20}}>🔄</span><div><div style={{fontSize:13,fontWeight:700,color:C.info}}>Deload Week Active</div><div style={{fontSize:11,color:C.textMuted}}>All volume reduced 50%. Focus on movement quality and recovery. Max {vs.limit.max} sets/muscle.</div></div></div></Card>}{vs.groups.length>0&&<Card style={{padding:14}}>{vs.groups.map(g=>(<div key={g.muscle} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:`1px solid ${C.border}`}}><span style={{fontSize:11,fontWeight:600,color:C.text,minWidth:70}}>{g.muscle}</span><div style={{flex:1}}><ProgressBar value={g.sets} max={g.limit} color={g.over?C.danger:g.pct>=80?C.warning:C.teal} height={5}/></div><span style={{fontSize:10,fontWeight:700,color:g.over?C.danger:g.pct>=80?C.warning:C.textMuted,minWidth:44,textAlign:"right"}}>{g.sets}/{g.limit}</span></div>))}</Card>}</div>);})()}
  <div><SectionTitle icon="🗓️" title="Your Plan"/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>{[{n:"Phase 1",s:"Foundation",a:true},{n:"Phase 2",s:"Strength",a:false},{n:"Phase 3",s:"Hypertrophy",a:false}].map(p=>(<Card key={p.n} style={{textAlign:"center",padding:14,borderColor:p.a?C.teal+"40":C.border,background:p.a?C.tealBg:C.bgCard}}><div style={{fontSize:14,fontWeight:700,color:p.a?C.text:C.textDim}}>{p.n}</div><div style={{fontSize:11,color:p.a?C.textMuted:C.textDim,marginTop:2}}>{p.s}</div></Card>))}</div></div>
  <div><SectionTitle icon="📋" title="Daily Minimums"/><Card>{[{i:"👟",l:"Steps",v:"4,200 / 8,000",p:52},{i:"🫀",l:"Cardio",v:"0 MIN",p:0},{i:"🧘",l:"Stretching",v:"0 MIN",p:0}].map(d=>(<div key={d.l} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}><div style={{display:"flex",alignItems:"center",gap:10}}><span>{d.i}</span><span style={{fontSize:14,color:C.text,fontWeight:600}}>{d.l}</span><span style={{fontSize:12,color:C.textMuted}}>— {d.v}</span></div><Badge color={d.p>0?C.teal:C.orange}>{d.p>0?`${d.p}%`:d.v.split(" ")[0]}</Badge></div>))}</Card></div>
  <CardioFitnessCard phase={CURRENT_PHASE} onTestFitness={()=>setShowVO2Test(true)} onLogCardio={()=>setShowCardioLog(true)} key={cardioRev}/>
  {showVO2Test&&<VO2TestModal onClose={()=>setShowVO2Test(false)} onSaved={()=>setCardioRev(r=>r+1)}/>}
  {showCardioLog&&<CardioLogModal onClose={()=>setShowCardioLog(false)} onSaved={()=>setCardioRev(r=>r+1)}/>}
  <ProgressDashboard phase={CURRENT_PHASE}/>
  <div><SectionTitle icon="🩺" title="Active Injury Protocols" sub="Tap to expand · Edit to manage"/>{dynamicInjuries.map(inj=>(<Card key={inj.id} onClick={()=>setSi(si===inj.id?null:inj.id)} style={{marginBottom:8,cursor:"pointer",borderColor:inj.tempFlag?C.warning+"60":C.border}}><div style={{display:"flex",justifyContent:"space-between"}}><div><div style={{fontSize:15,fontWeight:700,color:C.text}}>{inj.area}</div><div style={{fontSize:12,color:C.textDim}}>{inj.type}{inj.notes?` — ${inj.notes}`:""}</div>{inj.tempFlag&&<div style={{fontSize:10,color:C.warning,marginTop:2}}>⚡ {inj.tempFlag}</div>}</div><Badge color={inj.severity<=2?C.warning:C.danger}>SEV {inj.severity}/5</Badge></div>{si===inj.id&&<div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${C.border}`}}>{(inj.protocols||[]).map((p,i)=><div key={i} style={{display:"flex",gap:8,padding:"5px 0"}}><span style={{color:C.teal}}>▸</span><span style={{fontSize:13,color:C.textMuted}}>{p}</span></div>)}</div>}</Card>))}{onEditInjuries&&<button onClick={onEditInjuries} style={{background:C.bgElevated,border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 16px",color:C.textMuted,fontSize:11,cursor:"pointer",width:"100%",fontFamily:"inherit",marginTop:4}}>✏️ Edit Injuries & Conditions</button>}</div>
  <PTProgressCard onStartSession={(p)=>{onPTSession?.(p);}} onViewProgress={onPTProgress}/>
  {/* Unlock notifications */}
  {(()=>{const notifs=getUnlockNotifications().filter(n=>!n.seen);if(!notifs.length)return null;return(<Card style={{borderColor:C.success+"40",background:C.success+"08"}}><div style={{fontSize:11,fontWeight:700,color:C.success,letterSpacing:2,marginBottom:6}}>EXERCISE UNLOCKED!</div>{notifs.map((n,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0"}}><span style={{fontSize:16}}>🏆</span><div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:C.text}}>{n.unlockedName}</div><div style={{fontSize:9,color:C.textMuted}}>{n.msg||`Unlocked from ${n.fromName}`}</div></div></div>)}<button onClick={()=>{markNotificationsSeen();}} style={{background:"none",border:`1px solid ${C.success}30`,borderRadius:8,padding:"6px 12px",color:C.success,fontSize:10,fontWeight:700,cursor:"pointer",width:"100%",marginTop:6,fontFamily:"inherit"}}>Got it!</button></Card>);})()}
  {/* Favorite progression roadmaps */}
  {(()=>{const assessment=getAssessment();const favs=assessment?.preferences?.favorites||[];const roadmaps=getAllFavoriteRoadmaps(favs);if(!roadmaps.length)return null;return(<div><SectionTitle icon="🎯" title="Building Toward Your Goals" sub="Progress on favorited exercises"/>{roadmaps.slice(0,3).map(rm=><div key={rm.target.id} style={{marginBottom:8}}><ProgressionRoadmapCard targetId={rm.target.id} compact={false}/></div>)}</div>);})()}
  {onRetakeAssessment&&<div style={{marginTop:8}}><button onClick={onRetakeAssessment} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 16px",color:C.textDim,fontSize:11,cursor:"pointer",width:"100%",fontFamily:"inherit"}}>⚙️ Retake Assessment</button></div>}
  <div style={{height:90}}/></div>);}

// ── TRAIN PAGE ──────────────────────────────────────────────────
function TrainScreen({onStart,workout,mode,onModeChange,onExtraWork,onSwapExercise}){
  const w = workout || defaultWorkout;
  const loc = w.location || "gym";
  const totalEx = w.all.length;
  const m=mode||"guided";
  const[swapTarget,setSwapTarget]=useState(null);
  const planIds=useMemo(()=>new Set((w.all||[]).map(e=>e.id)),[w]);
  return(<div className="stagger safe-bottom" style={{display:"flex",flexDirection:"column",gap:16}}>
    <div><div style={{fontSize:28,fontWeight:800,color:C.teal,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:4}}>TODAY'S WORKOUT</div><div style={{fontSize:12,color:C.textMuted}}>Week 1 · Day 2 · Upper Body + Core · Phase {CURRENT_PHASE}</div></div>
    {/* Mode toggle */}
    <div style={{display:"flex",background:C.bgElevated,borderRadius:12,padding:3,border:`1px solid ${C.border}`}}>
      {[{id:"guided",label:"Guided Mode",icon:"📋",desc:"Step-by-step coaching"},{id:"quick",label:"Quick Mode",icon:"✅",desc:"Checklist — experienced users"}].map(o=>(<button key={o.id} onClick={()=>onModeChange?.(o.id)} style={{flex:1,padding:"10px 8px",borderRadius:10,background:m===o.id?C.tealBg:"transparent",border:m===o.id?`1px solid ${C.teal}30`:"1px solid transparent",cursor:"pointer",textAlign:"center"}}><div style={{fontSize:14}}>{o.icon}</div><div style={{fontSize:11,fontWeight:700,color:m===o.id?C.teal:C.textDim}}>{o.label}</div><div style={{fontSize:9,color:C.textDim}}>{o.desc}</div></button>))}
    </div>
    <Card style={{background:C.tealBg,borderColor:C.teal+"30"}}><div style={{display:"flex",justifyContent:"space-between"}}><div><div style={{fontSize:16,fontWeight:700,color:C.text}}>{totalEx} Exercises</div><div style={{fontSize:12,color:C.textMuted}}>~45 min · {loc.charAt(0).toUpperCase()+loc.slice(1)}{loc!=="gym"?" (adapted)":""}</div></div><Btn onClick={onStart} size="md" style={{width:"auto",padding:"10px 20px"}}>Start →</Btn></div></Card>
    {/* Dynamic CEx Continuum sections */}
    {(()=>{
      const b=w.blocks||{};
      const ExRow=({ex,reason,duration})=>{const p=exParams(ex);return(<Card key={ex.id} style={{padding:10,marginBottom:4}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <ExerciseImage exercise={ex} size="thumb"/>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{ex.name}</div><div style={{fontSize:10,color:C.textDim}}>{duration||p.reps} · {(ex.bodyPart||"").replace(/_/g," ")}</div>{reason&&<div style={{fontSize:8,color:C.info}}>{reason}</div>}</div>
        </div>
      </Card>);};
      const sections=[
        ...(b.inhibit?.length?[{label:"PHASE A: FOAM ROLLING",desc:"Inhibit overactive muscles",exercises:b.inhibit,color:C.orange}]:[]),
        ...(b.lengthen?.length?[{label:"PHASE B: ROM + MOBILITY",desc:"Dynamic joint prep + injury-specific",exercises:b.lengthen,color:"#8b5cf6"}]:[]),
        {label:"PHASE C: WARM-UP ACTIVATION",desc:"Prepare movement patterns",exercises:w.warmup,color:C.info},
        {label:"PHASE D: MAIN WORK",desc:"Compound + isolation training",exercises:w.main,color:C.teal},
        ...(b.cooldownStretches?.length?[{label:"PHASE E: STRETCH + RECOVERY",desc:"Static stretches for all trained muscles",exercises:b.cooldownStretches,color:C.success}]:[{label:"COOLDOWN",desc:"Recovery stretches",exercises:w.cooldown,color:C.success}]),
      ];
      return sections.map(section=>(
        <div key={section.label}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><div style={{width:8,height:8,borderRadius:4,background:section.color}}/><div><span style={{fontSize:11,fontWeight:700,color:section.color,letterSpacing:1.5}}>{section.label}</span><div style={{fontSize:9,color:C.textDim}}>{section.desc} · {section.exercises.length} exercises</div></div></div>
          {section.exercises.map(ex=>{const p=exParams(ex);const mu=exMuscles(ex);return(<Card key={ex.id+(ex._reason||"")} style={{padding:10,marginBottom:4}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <ExerciseImage exercise={ex} size="thumb"/>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{ex.name}</div><div style={{fontSize:10,color:C.textDim}}>{p.sets}×{ex._duration||p.reps}{p.tempo?` · ${p.tempo}`:""} · {exLocationLabel(ex)}{p.intensity?` · ${p.intensity}`:""}</div>{ex._reason&&<div style={{fontSize:8,color:C.info,marginTop:1}}>{ex._reason}</div>}</div>
              <div style={{display:"flex",alignItems:"center",gap:4}}>
                <div style={{display:"flex",flexWrap:"wrap",gap:2,maxWidth:50}}>{mu.primary.slice(0,1).map(m=><span key={m} style={{fontSize:8,color:C.teal,background:C.tealBg,padding:"1px 4px",borderRadius:3}}>{m}</span>)}</div>
                <button onClick={(e)=>{e.stopPropagation();setSwapTarget(ex);}} style={{width:26,height:26,borderRadius:8,background:C.bgElevated,border:`1px solid ${C.border}`,color:C.textDim,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}} title="Request Alternative">🔄</button>
              </div>
            </div>
            {ex._swappedFor&&<div style={{marginTop:4,padding:"4px 8px",background:C.warning+"10",borderRadius:6,borderLeft:`2px solid ${C.warning}`}}><span style={{fontSize:9,color:C.warning,fontWeight:700}}>🔄</span><span style={{fontSize:9,color:C.textMuted}}> Swapped for {ex._swappedFor}</span></div>}
            {ex._buildingTowardId&&<div style={{marginTop:4,padding:"4px 8px",background:C.purple+"10",borderRadius:6,borderLeft:`2px solid ${C.purple}`}}><span style={{fontSize:9,color:C.purple,fontWeight:700}}>🎯 {getProgressPercent(ex._buildingTowardId)}%</span><span style={{fontSize:9,color:C.textMuted}}> toward {ex._buildingToward}</span></div>}
          </Card>);})}
        </div>
      ));
    })()}
    {/* Cardio prescription */}
    {(()=>{const injuries=getInjuries().filter(i=>i.status!=="resolved");const rx=getCardioPrescription(CURRENT_PHASE,injuries);return(<div><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><div style={{width:8,height:8,borderRadius:4,background:C.danger}}/><div><span style={{fontSize:11,fontWeight:700,color:C.danger,letterSpacing:1.5}}>CARDIO</span><div style={{fontSize:9,color:C.textDim}}>{rx.type} · {rx.frequency} · {rx.intensity}</div></div></div><Card style={{padding:12,marginBottom:4,borderLeft:`3px solid ${C.danger}`}}><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:24}}>🫀</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>Cardio: {rx.type} {rx.activities[0]}</div><div style={{fontSize:10,color:C.textDim}}>{rx.duration} · {rx.intensity}</div></div><Badge color={C.danger}>{rx.type}</Badge></div>{rx.activities.length>1&&<div style={{marginTop:6,fontSize:9,color:C.textMuted}}>Alternatives: {rx.activities.slice(1).join(", ")}</div>}</Card></div>);})()}
    {/* Optional foam rolling add-on */}
    {w.blocks?.foamAddOn?.length>0&&<Card style={{padding:14,borderColor:C.orange+"30"}}>
      <div style={{fontSize:10,fontWeight:700,color:C.orange,letterSpacing:1.5,marginBottom:6}}>OPTIONAL: EXTRA FOAM ROLLING</div>
      <div style={{fontSize:9,color:C.textMuted,marginBottom:8}}>Tap to add recovery foam rolling to your session</div>
      {w.blocks.foamAddOn.map(ex=>(<div key={ex.id} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0",borderBottom:`1px solid ${C.border}`}}>
        <ExerciseImage exercise={ex} size="thumb"/>
        <span style={{fontSize:11,color:C.text,flex:1}}>{ex.name}</span>
        <span style={{fontSize:9,color:C.textDim}}>30s</span>
      </div>))}
    </Card>}
    {onExtraWork&&<Btn variant="dark" onClick={onExtraWork} icon="➕" style={{marginTop:8}}>Add Extra Work (McKenzie, Yoga, PT...)</Btn>}
    {w.addOns?.length>0&&<Card style={{borderColor:C.purple+"30"}}><div style={{fontSize:10,fontWeight:700,color:C.purple,letterSpacing:1.5,marginBottom:6}}>ADD-ONS ({w.addOns.length} exercises · ~{w.addOns.length*3} min)</div>{w.addOns.map(ex=>(<div key={ex.id} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0",borderBottom:`1px solid ${C.border}`}}><ExerciseImage exercise={ex} size="thumb"/><span style={{fontSize:11,color:C.text}}>{ex.name}</span></div>))}</Card>}
    <Btn onClick={onStart} icon="⚡" style={{marginTop:8}}>Begin Check-In →</Btn>
    {swapTarget&&<SwapModal exercise={swapTarget} phase={CURRENT_PHASE} location={loc} excludeIds={planIds} onClose={()=>setSwapTarget(null)} onSwap={(alt)=>{setSwapTarget(null);if(onSwapExercise)onSwapExercise(swapTarget,alt);}}/>}
    <div style={{height:90}}/>
  </div>);
}

// ── CHECK-IN ────────────────────────────────────────────────────
function CheckInScreen({onComplete}){const[step,setStep]=useState(0);const[location,setLocation]=useState(null);const[sleep,setSleep]=useState(null);const[sore,setSore]=useState([]);const[energy,setEnergy]=useState(5);const[stress,setStress]=useState(5);const toggle=id=>{if(id==="none"){setSore([]);return;}setSore(p=>p.includes(id)?p.filter(x=>x!==id):[...p.filter(x=>x!=="none"),id]);};const adapt=sv=>sv<=3?[{l:"Warm-up",v:"Standard"},{l:"Volume",v:"Full"},{l:"Rest",v:"Standard"},{l:"Tone",v:"Direct"},{l:"Length",v:"Standard"}]:sv<=6?[{l:"Warm-up",v:"+5 min"},{l:"Volume",v:"-20%"},{l:"Rest",v:"+15 sec"},{l:"Tone",v:"Supportive"},{l:"Length",v:"Can shorten"}]:[{l:"Warm-up",v:"+8 min"},{l:"Volume",v:"-40%"},{l:"Rest",v:"+30 sec"},{l:"Tone",v:"Gentle"},{l:"Length",v:"Shortened"}];const compute=()=>{const ss=sleep==="great"?10:sleep==="good"?7:sleep==="ok"?5:3;const so=sore.length===0?10:Math.max(2,10-sore.length*1.5);const r=Math.round((ss*0.3+so*0.2+energy*0.2+(11-stress)*0.15+6*0.15)*10);onComplete({readiness:r,capacity:Math.max(20,Math.min(100,r-INJURIES.reduce((s,i)=>s+i.severity*5,0))),location:location||"gym",sleep:sleep||"ok",soreness:sore,energy,stress});};
return(<div style={{display:"flex",flexDirection:"column",gap:16}}><div style={{display:"flex",justifyContent:"space-between"}}><div><h2 style={{fontSize:24,fontWeight:800,color:C.text,margin:0,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:2}}>CHECK-IN</h2><div style={{fontSize:12,color:C.textMuted}}>BEFORE WE START</div></div><button onClick={compute} style={{background:"none",border:"none",color:C.teal,fontSize:13,fontWeight:600,cursor:"pointer"}}>Skip →</button></div><Card style={{background:C.tealBg,borderColor:C.teal+"30",padding:14}}><Badge>DAY 2 · UPPER BODY + CORE</Badge><div style={{fontSize:12,color:C.textMuted,marginTop:6}}>5 quick questions to calibrate today's session.</div></Card>
{step===0&&<div><h3 style={{fontSize:18,fontWeight:700,color:C.text,margin:"0 0 12px"}}>📍 Where are you training?</h3>{[{id:"gym",i:"🏋️",l:"Gym",d:"Full equipment access"},{id:"home",i:"🏠",l:"Home",d:"Bodyweight + bands + DBs"},{id:"outdoor",i:"🌳",l:"Outdoor",d:"Bodyweight + minimal gear"}].map(o=>(<Card key={o.id} onClick={()=>{setLocation(o.id);setTimeout(()=>setStep(1),300);}} style={{display:"flex",alignItems:"center",gap:12,padding:14,marginBottom:8,cursor:"pointer",borderColor:location===o.id?C.teal:C.border,background:location===o.id?C.tealBg:C.bgCard}}><span style={{fontSize:24}}>{o.i}</span><div><div style={{fontSize:14,fontWeight:600,color:C.text}}>{o.l}</div><div style={{fontSize:11,color:C.textDim}}>{o.d}</div></div></Card>))}</div>}
{step===1&&<div><h3 style={{fontSize:18,fontWeight:700,color:C.text,margin:"0 0 12px"}}>😴 How did you sleep?</h3>{[{id:"great",i:"🌟",l:"Great — 8+ hrs"},{id:"good",i:"😊",l:"Good — 7-8 hrs"},{id:"ok",i:"😐",l:"OK — 5-6 hrs"},{id:"poor",i:"😩",l:"Poor — under 5 hrs"}].map(o=>(<Card key={o.id} onClick={()=>{setSleep(o.id);setTimeout(()=>setStep(2),300);}} style={{display:"flex",alignItems:"center",gap:12,padding:14,marginBottom:8,cursor:"pointer",borderColor:sleep===o.id?C.teal:C.border,background:sleep===o.id?C.tealBg:C.bgCard}}><span style={{fontSize:20}}>{o.i}</span><span style={{fontSize:14,fontWeight:600,color:C.text}}>{o.l}</span></Card>))}</div>}
{step===2&&<div><h3 style={{fontSize:18,fontWeight:700,color:C.text,margin:"0 0 4px"}}>💪 Any soreness?</h3><div style={{fontSize:12,color:C.textMuted,marginBottom:12}}>Select all that apply</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{BODY_PARTS.map(bp=>(<Card key={bp.id} onClick={()=>toggle(bp.id)} style={{display:"flex",alignItems:"center",gap:8,padding:10,cursor:"pointer",borderColor:sore.includes(bp.id)?C.teal:C.border,background:sore.includes(bp.id)?C.tealBg:C.bgCard}}><span style={{fontSize:14}}>{bp.icon}</span><span style={{fontSize:12,color:sore.includes(bp.id)?C.text:C.textMuted}}>{bp.label}</span></Card>))}</div><Card onClick={()=>setSore([])} style={{display:"flex",alignItems:"center",gap:8,padding:12,marginTop:8,cursor:"pointer",borderColor:sore.length===0?C.teal:C.border,background:sore.length===0?C.tealBg:C.bgCard}}><span>✅</span><span style={{fontSize:13,fontWeight:600,color:C.text}}>No Soreness Today</span></Card><Btn onClick={()=>setStep(3)} style={{marginTop:14}}>Next →</Btn><div style={{height:90}}/></div>}
{step===3&&<div><h3 style={{fontSize:18,fontWeight:700,color:C.text,margin:"0 0 16px"}}>⚡ Energy level?</h3><input type="range" min={1} max={10} value={energy} onChange={e=>setEnergy(parseInt(e.target.value))} style={{width:"100%",height:6,appearance:"none",background:C.border,borderRadius:3,accentColor:C.teal,cursor:"pointer"}}/><div style={{display:"flex",justifyContent:"space-between",marginTop:8}}><span style={{fontSize:11,color:C.textDim}}>Empty</span><span style={{fontSize:11,color:C.textDim}}>Charged</span></div><div style={{textAlign:"center",margin:"16px 0"}}><div style={{fontSize:48,fontWeight:800,color:C.teal,fontFamily:"'Bebas Neue',sans-serif"}}>{energy}</div></div><Btn onClick={()=>setStep(4)}>Next →</Btn></div>}
{step===4&&<div><h3 style={{fontSize:18,fontWeight:700,color:C.text,margin:"0 0 4px"}}>🧠 Stress level?</h3><div style={{fontSize:12,color:C.textMuted,marginBottom:16}}>Shapes coaching tone and volume</div><input type="range" min={1} max={10} value={stress} onChange={e=>setStress(parseInt(e.target.value))} style={{width:"100%",height:6,appearance:"none",background:C.border,borderRadius:3,accentColor:C.teal,cursor:"pointer"}}/><div style={{display:"flex",justifyContent:"space-between",marginTop:8}}><span style={{fontSize:11,color:C.textDim}}>Calm</span><span style={{fontSize:11,color:C.textDim}}>Overwhelmed</span></div><div style={{textAlign:"center",margin:"16px 0"}}><div style={{fontSize:48,fontWeight:800,color:C.teal,fontFamily:"'Bebas Neue',sans-serif"}}>{stress}</div></div><Card style={{borderColor:C.teal+"30"}}><div style={{fontSize:12,fontWeight:700,color:C.teal,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>HOW THIS SHAPES TODAY</div>{adapt(stress).map(a=>(<div key={a.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}><span style={{fontSize:13,color:C.textMuted}}>{a.l}</span><span style={{fontSize:13,color:C.teal,fontWeight:600}}>{a.v}</span></div>))}</Card><Btn onClick={compute} style={{marginTop:16}}>See My Plan →</Btn></div>}<div style={{height:90}}/></div>);}

// ── PLAN SCREEN (Transparency Report) ─────────────────────────
function PlanScreen({checkIn,workout,onGo,safetyReport}){
  const[diff,setDiff]=useState("standard");
  const rtt=checkIn?.readiness||50, ctp=checkIn?.capacity||50;
  const safetyLevel=rtt>=70?"CLEAR":rtt>=50?"CAUTION":rtt>=30?"RESTRICTED":"STOP";
  const safetyColor=rtt>=70?C.success:rtt>=50?C.warning:rtt>=30?C.orange:C.danger;
  const loc=(checkIn?.location||"gym");
  const locLabel=loc.charAt(0).toUpperCase()+loc.slice(1);
  const sleepLabel={great:"Great (8+ hrs)",good:"Good (7-8 hrs)",ok:"OK (5-6 hrs)",poor:"Poor (<5 hrs)"}[checkIn?.sleep]||"Not reported";
  const sleepImpact=checkIn?.sleep==="great"?"Full capacity":checkIn?.sleep==="good"?"Slight reduction possible":checkIn?.sleep==="ok"?"Moderate reduction — lighter loads":checkIn?.sleep==="poor"?"Significant reduction — focus on mobility":"Default capacity";
  const soreAreas=(checkIn?.soreness||[]);
  const soreLabel=soreAreas.length===0?"None reported":soreAreas.map(id=>{const bp=BODY_PARTS.find(b=>b.id===id);return bp?bp.label:id;}).join(", ");
  const soreImpact=soreAreas.length===0?"No adjustments needed":soreAreas.length<=2?"Minor adjustments — avoiding direct loading of sore areas":"Significant adjustments — reduced volume, extra warm-up for affected areas";
  const stressLvl=checkIn?.stress||5;
  const stressImpact=stressLvl<=3?"Standard volume and pace":stressLvl<=6?"-20% volume, +15s rest, supportive coaching tone":"-40% volume, +30s rest, simplified exercises, gentle tone";
  // Compute excluded exercises
  const excluded=useMemo(()=>{
    const selectedIds=new Set(workout.all.map(e=>e.id));
    const reasons=[];
    exerciseDB.forEach(e=>{
      if(selectedIds.has(e.id))return;
      if(!(e.phaseEligibility||[]).includes(CURRENT_PHASE)){if(e.category==="main")reasons.push({name:e.name,reason:"Phase "+Math.min(...(e.phaseEligibility||[9]))+"+ required"});return;}
      if(e.safetyTier==="red"){reasons.push({name:e.name,reason:"Red safety tier — requires clearance"});return;}
      const sg=e.contraindications?.severity_gate||{};
      if(sg.lower_back<3){reasons.push({name:e.name,reason:"Blocked by lower back severity ("+sg.lower_back+" gate)"});return;}
      if(sg.knee<2){reasons.push({name:e.name,reason:"Blocked by knee severity ("+sg.knee+" gate)"});return;}
      if(sg.shoulder<2){reasons.push({name:e.name,reason:"Blocked by shoulder severity ("+sg.shoulder+" gate)"});return;}
      if(loc!=="gym"&&!locationFilter(e,loc)){reasons.push({name:e.name,reason:locLabel+" — equipment not available"});return;}
    });
    return reasons.slice(0,12);
  },[workout,loc]);
  const injuryBlocked=exerciseDB.filter(e=>{const sg=e.contraindications?.severity_gate||{};return sg.lower_back<3||sg.knee<2||sg.shoulder<2;}).length;
  const lastSession=getSessions().slice(-1)[0];
  return(<div style={{display:"flex",flexDirection:"column",gap:14}}>
    {/* Header */}
    <div><div style={{fontSize:10,fontWeight:700,color:C.teal,letterSpacing:3,textTransform:"uppercase"}}>YOUR COACHING TEAM BUILT THIS</div><h2 style={{fontSize:26,fontWeight:800,color:C.text,margin:"4px 0 0",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:3}}>TODAY'S PLAN</h2></div>
    {/* Readiness scores */}
    <Card glow={safetyColor+"30"} style={{borderColor:safetyColor+"40"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontSize:11,fontWeight:700,color:safetyColor,letterSpacing:2,textTransform:"uppercase"}}>READINESS</div>
        <Badge color={safetyColor}>{safetyLevel}</Badge>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        <div style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:800,color:C.text,fontFamily:"'Bebas Neue',sans-serif"}}>{rtt}</div><div style={{fontSize:9,color:C.textDim,textTransform:"uppercase"}}>RTT Score</div></div>
        <div style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:800,color:C.text,fontFamily:"'Bebas Neue',sans-serif"}}>{ctp}</div><div style={{fontSize:9,color:C.textDim,textTransform:"uppercase"}}>CTP Score</div></div>
        <div style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:800,color:safetyColor,fontFamily:"'Bebas Neue',sans-serif"}}>{locLabel==="Gym"?"🏋️":locLabel==="Home"?"🏠":"🌳"}</div><div style={{fontSize:9,color:C.textDim,textTransform:"uppercase"}}>{locLabel}</div></div>
      </div>
      <div style={{textAlign:"center",marginTop:8}}><span style={{fontSize:11,color:C.textMuted}}>Phase {CURRENT_PHASE} · Week 1 · Stabilization Endurance</span></div>
    </Card>
    {/* Factors considered */}
    <Card>
      <div style={{fontSize:11,fontWeight:700,color:C.purple,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>FACTORS SHAPING TODAY</div>
      {[
        {icon:"😴",label:"Sleep",value:sleepLabel,impact:sleepImpact,color:checkIn?.sleep==="great"||checkIn?.sleep==="good"?C.success:C.warning},
        {icon:"💪",label:"Soreness",value:soreLabel,impact:soreImpact,color:soreAreas.length===0?C.success:soreAreas.length<=2?C.warning:C.danger},
        {icon:"🧠",label:"Stress",value:stressLvl+"/10",impact:stressImpact,color:stressLvl<=3?C.success:stressLvl<=6?C.warning:C.danger},
        {icon:"⚡",label:"Energy",value:(checkIn?.energy||5)+"/10",impact:checkIn?.energy>=7?"Full intensity cleared":checkIn?.energy>=4?"Standard intensity":"Reduced intensity — listen to your body",color:(checkIn?.energy||5)>=7?C.success:(checkIn?.energy||5)>=4?C.warning:C.danger},
        {icon:"🩺",label:"Injuries",value:INJURIES.length+" active",impact:injuryBlocked+" exercises blocked system-wide, "+workout.all.filter(e=>e._swappedFor).length+" swapped today",color:C.warning},
      ].map(f=>(<div key={f.label} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
        <span style={{fontSize:16,flexShrink:0}}>{f.icon}</span>
        <div style={{flex:1}}>
          <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:12,fontWeight:700,color:C.text}}>{f.label}</span><span style={{fontSize:11,color:f.color,fontWeight:600}}>{f.value}</span></div>
          <div style={{fontSize:10,color:C.textMuted,marginTop:2}}>{f.impact}</div>
        </div>
      </div>))}
      {lastSession&&<div style={{display:"flex",gap:10,padding:"8px 0"}}>
        <span style={{fontSize:16,flexShrink:0}}>📋</span>
        <div style={{flex:1}}>
          <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:12,fontWeight:700,color:C.text}}>Last Session</span><span style={{fontSize:11,color:C.info,fontWeight:600}}>{new Date(lastSession.date).toLocaleDateString()}</span></div>
          <div style={{fontSize:10,color:C.textMuted,marginTop:2}}>Difficulty {lastSession.reflection?.difficulty||"—"}/10, Pain {lastSession.reflection?.pain||"—"}/10 — {(lastSession.reflection?.pain||5)>=7?"reducing intensity today":(lastSession.reflection?.difficulty||5)<=3?"progressing load slightly":"maintaining current level"}</div>
        </div>
      </div>}
    </Card>
    {/* Exercise list with WHY */}
    {(()=>{const overloads=getWorkoutOverloads(workout,CURRENT_PHASE);const hasOverloads=Object.keys(overloads).length>0;return(<Card>
      <div style={{fontSize:11,fontWeight:700,color:C.teal,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>YOUR EXERCISES ({workout.all.length} total · ~{Math.round(workout.all.length*3.5)} min)</div>
      {hasOverloads&&<div style={{padding:8,background:C.tealBg,borderRadius:8,marginBottom:10,borderLeft:`3px solid ${C.teal}`}}><div style={{fontSize:9,fontWeight:700,color:C.teal,marginBottom:4}}>PROGRESSIVE OVERLOAD — Based on last session</div>{Object.entries(overloads).map(([id,rec])=>{const ex=exerciseDB.find(e=>e.id===id);return ex&&rec.action==="progress"?<div key={id} style={{fontSize:9,color:C.text,padding:"2px 0"}}><b>{ex.name}</b>: {rec.variable==="load"?`${rec.from} → ${rec.to} lbs`:rec.variable==="reps"?`${rec.from} → ${rec.to} reps`:rec.variable==="sets"?`${rec.from} → ${rec.to} sets`:"↓ rest"} — <span style={{color:C.teal}}>{rec.reason}</span></div>:rec.action==="regress"&&ex?<div key={id} style={{fontSize:9,color:C.danger,padding:"2px 0"}}><b>{ex.name}</b>: {rec.reason}</div>:null;})}</div>}
      {[{label:"WARM-UP",exercises:workout.warmup,color:C.info},{label:"MAIN",exercises:workout.main,color:C.teal},{label:"COOLDOWN",exercises:workout.cooldown,color:C.success}].map(sec=>(
        <div key={sec.label}>
          <div style={{display:"flex",alignItems:"center",gap:6,margin:"10px 0 6px"}}><div style={{width:6,height:6,borderRadius:3,background:sec.color}}/><span style={{fontSize:10,fontWeight:700,color:sec.color,letterSpacing:1.5}}>{sec.label}</span></div>
          {sec.exercises.map(ex=>{const ol=overloads[ex.id];return(<div key={ex.id} style={{display:"flex",gap:8,padding:"6px 0",borderBottom:`1px solid ${C.border}08`}}>
            <span style={{fontSize:16,flexShrink:0}}>{ex.emoji}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:600,color:C.text}}>{ex.name}</div>
              <div style={{fontSize:10,color:C.textMuted}}>{ex.whyForYou||ex.purpose}</div>
              {ol&&ol.action==="progress"&&<div style={{fontSize:8,color:C.teal,marginTop:2}}>📈 {ol.variable}: {ol.from}→{ol.to} {ol.variable==="load"?"lbs":ol.variable}</div>}
              {ol&&ol.action==="regress"&&<div style={{fontSize:8,color:C.danger,marginTop:2}}>⚠️ {ol.reason}</div>}
              {ex._swappedFor&&<div style={{fontSize:9,color:C.warning,marginTop:2}}>🔄 Swapped for {ex._swappedFor} — {ex._swapReason}</div>}
            </div>
          </div>);})}
        </div>
      ))}
    </Card>);})()}
    {/* Safety Verification Badge */}
    {safetyReport&&<Card style={{borderColor:safetyReport.failed===0?C.success+"40":C.warning+"40",background:safetyReport.failed===0?C.success+"06":C.warning+"06"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:18}}>{safetyReport.failed===0?"🛡️":"⚠️"}</span>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:safetyReport.failed===0?C.success:C.warning}}>
              {safetyReport.failed===0?"SAFETY VERIFIED ✓":`${safetyReport.failed} CHECK${safetyReport.failed>1?"S":""} FLAGGED`}
            </div>
            <div style={{fontSize:9,color:C.textDim}}>{safetyReport.passed}/{safetyReport.totalChecks} checks passed · {safetyReport.allCorrections.length} auto-corrections applied</div>
          </div>
        </div>
        <Badge color={safetyReport.failed===0?C.success:C.warning}>{safetyReport.passed}/{safetyReport.totalChecks}</Badge>
      </div>
      {safetyReport.allCorrections.length>0&&<div style={{marginTop:8,borderTop:`1px solid ${C.border}`,paddingTop:8}}>
        <div style={{fontSize:9,fontWeight:700,color:C.textDim,marginBottom:4}}>AUTO-CORRECTIONS</div>
        {safetyReport.allCorrections.slice(0,5).map((c,i)=><div key={i} style={{fontSize:9,color:C.textMuted,padding:"2px 0"}}>
          {c.action==="substitute"?`🔄 ${c.removedName} → ${c.replacementName}`:c.action==="remove"?`❌ Removed ${c.removedName}`:c.action==="add_exercise"?`➕ Added ${c.exerciseName}`:c.action==="modify_intensity"?`⚙️ ${c.exerciseName}: ${c.modification}`:c.reason} — {c.reason}
        </div>)}
        {safetyReport.allCorrections.length>5&&<div style={{fontSize:8,color:C.textDim}}>+{safetyReport.allCorrections.length-5} more</div>}
      </div>}
    </Card>}
    {/* Excluded exercises */}
    {excluded.length>0&&<Card style={{borderColor:C.danger+"20"}}>
      <div style={{fontSize:11,fontWeight:700,color:C.danger,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>EXCLUDED ({excluded.length}+ exercises)</div>
      {excluded.map((ex,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${C.border}`}}>
        <span style={{fontSize:11,color:C.textDim}}>{ex.name}</span>
        <span style={{fontSize:9,color:C.danger}}>{ex.reason}</span>
      </div>))}
      <div style={{fontSize:9,color:C.textDim,marginTop:6,fontStyle:"italic"}}>Showing top {excluded.length} — full list of {exerciseDB.length - workout.all.length} excluded available in Library filters.</div>
    </Card>}
    {/* Difficulty selector with safety gates */}
    {(()=>{
      const sessions=getSessions();
      const recent2=sessions.slice(-2);
      const maxSev=Math.max(...INJURIES.map(i=>i.severity));
      const recentPain=recent2.length>0?Math.max(...recent2.map(s=>s.reflection?.pain||0)):0;
      const sessionCount=sessions.length;
      const isDeload=sessionCount>0&&Math.ceil(sessionCount/12)!==Math.ceil((sessionCount+1)/12); // every 12th session approximates 4th week
      // Safety gate checks
      const pushGates=[
        {pass:maxSev<3,fail:`Back severity ${maxSev} is too high for increased intensity`},
        {pass:recentPain<4,fail:`Pain rating ${recentPain}/10 in recent sessions — reduce before pushing`},
        {pass:sessionCount>=4,fail:`Complete ${4-sessionCount} more session${4-sessionCount!==1?"s":""} at Standard first`},
        {pass:!isDeload,fail:"This is a deload period — stay at Standard for recovery"},
      ];
      const sendGates=[
        {pass:maxSev<2,fail:`Injury severity ${maxSev} must be below 2 for Full Send`},
        {pass:recentPain<3,fail:`Pain rating must be below 3 — currently ${recentPain}/10`},
        {pass:sessionCount>=8,fail:`Complete ${8-sessionCount} more session${8-sessionCount!==1?"s":""} at Standard/Push before unlocking`},
        {pass:!isDeload,fail:"Deload week — Full Send is blocked for recovery"},
        {pass:rtt>=70,fail:`RTT must be ≥70 (currently ${rtt}) — readiness too low`},
      ];
      const pushOk=pushGates.every(g=>g.pass);
      const sendOk=sendGates.every(g=>g.pass);
      const pushBlock=pushGates.find(g=>!g.pass);
      const sendBlock=sendGates.find(g=>!g.pass);
      const options=[
        {id:"standard",label:"Standard",desc:"Recommended",icon:"✅",color:C.success,ok:true,detail:null},
        {id:"push",label:"Push It",desc:"+15% vol, +1 set, -10s rest",icon:"💪",color:C.warning,ok:pushOk,detail:pushBlock?.fail,
         impact:"Main exercises: +1 set each. Rest periods: -10s. Volume: +15%. Stop if form breaks."},
        {id:"send",label:"Full Send",desc:"+25% vol, +2 sets, -20s rest",icon:"🔥",color:C.danger,ok:sendOk,detail:sendBlock?.fail,
         impact:"Main exercises: +2 sets each. Rest: -20s. Volume: +25%. May add progression chain exercises."},
      ];
      return(<Card>
        <div style={{fontSize:11,fontWeight:700,color:C.info,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>DIFFICULTY OVERRIDE</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {options.map(d=>(<div key={d.id} onClick={()=>d.ok&&setDiff(d.id)} style={{textAlign:"center",padding:12,borderRadius:12,border:`1px solid ${diff===d.id&&d.ok?d.color+"60":C.border}`,background:diff===d.id&&d.ok?d.color+"12":"transparent",cursor:d.ok?"pointer":"not-allowed",opacity:d.ok?1:0.4}}>
            <div style={{fontSize:18}}>{d.icon}</div>
            <div style={{fontSize:11,fontWeight:700,color:diff===d.id&&d.ok?d.color:d.ok?C.text:C.textDim,marginTop:4}}>{d.label}</div>
            <div style={{fontSize:8,color:C.textDim,marginTop:2}}>{d.desc}</div>
            {!d.ok&&<div style={{fontSize:8,color:C.danger,marginTop:4}}>🔒 Locked</div>}
          </div>))}
        </div>
        {diff!=="standard"&&options.find(o=>o.id===diff)?.impact&&<div style={{marginTop:10,padding:10,background:(diff==="push"?C.warning:C.danger)+"10",borderRadius:8,borderLeft:`3px solid ${diff==="push"?C.warning:C.danger}`}}>
          <div style={{fontSize:10,fontWeight:700,color:diff==="push"?C.warning:C.danger,marginBottom:4}}>CHANGES TO YOUR PLAN</div>
          <div style={{fontSize:10,color:C.text}}>{options.find(o=>o.id===diff).impact}</div>
          {diff==="push"&&<div style={{fontSize:10,color:C.textMuted,marginTop:4}}>Main sets: {workout.main.map(e=>{const p=exParams(e);return p.sets||1;}).join(",")} → {workout.main.map(e=>{const p=exParams(e);return(p.sets||1)+1;}).join(",")}</div>}
          {diff==="send"&&<div style={{fontSize:10,color:C.textMuted,marginTop:4}}>Main sets: {workout.main.map(e=>{const p=exParams(e);return p.sets||1;}).join(",")} → {workout.main.map(e=>{const p=exParams(e);return(p.sets||1)+2;}).join(",")}</div>}
        </div>}
        {!pushOk&&diff==="standard"&&<div style={{marginTop:8,padding:8,background:C.bgGlass,borderRadius:8}}><div style={{fontSize:9,color:C.textDim}}>🔒 <b>Push It</b>: {pushBlock.fail}</div>{!sendOk&&<div style={{fontSize:9,color:C.textDim,marginTop:2}}>🔒 <b>Full Send</b>: {sendBlock.fail}</div>}</div>}
      </Card>);
    })()}
    {/* Go button */}
    <Btn onClick={()=>onGo(diff)} icon="⚡" style={{fontFamily:"'Bebas Neue',sans-serif",letterSpacing:3,fontSize:18}}>LOOKS GOOD — LET'S GO</Btn>
    <div style={{height:90}}/>
  </div>);
}

// ── EXERCISE SCREEN ─────────────────────────────────────────────
function ExerciseScreen({exercise,index,total,phase,onDone,onSub,onBack,onEndEarly,onPause}){const ep=exParams(exercise);const em=exMuscles(exercise);const[timerOn,setTimerOn]=useState(false);const[tl,setTl]=useState(ep.rest||0);const[resting,setResting]=useState(false);const[cs,setCs]=useState(1);const[exp,setExp]=useState("steps");const[canUndo,setCanUndo]=useState(false);const tr=useRef(null);
// Determine tracking mode from exercise data
const WEIGHTED_EQ=new Set(["dumbbell","barbell","trap_bar","cable","kettlebell","machine","plate","ez_bar","weighted"]);
const exMode=(()=>{
  const cat=exercise.category||"";const typ=exercise.type||"";const eq=exercise.equipmentRequired||[];
  if(cat==="foam_roll"||cat==="cooldown"||typ==="foam_roll"||typ==="static_stretch"||typ==="mobility"||cat==="mobility")return"mobility";
  if(cat==="cardio"||typ==="cardio")return"cardio";
  if(typ==="isometric"||typ==="breathing"||(ep.reps||"").toString().toLowerCase().includes("s"))return"timed";
  if(eq.some(e=>WEIGHTED_EQ.has(e)))return"weighted";
  return"bodyweight";
})();
// Per-set tracking
const defaultReps=exMode==="timed"?parseInt(String(ep.reps).replace(/[^0-9]/g,''))||30:parseInt(String(ep.reps).replace(/[^0-9]/g,''))||12;
const[setLog,setSetLog]=useState([]);
const[curReps,setCurReps]=useState(defaultReps);
const[curLoad,setCurLoad]=useState(exercise._lastLoad||"");
const[curRpe,setCurRpe]=useState(0);
const[curPain,setCurPain]=useState(false);
const[curQuality,setCurQuality]=useState("");
useEffect(()=>{setCs(1);setResting(false);setTimerOn(false);setTl(ep.rest||0);setExp("steps");setSetLog([]);setCurReps(parseInt(String(ep.reps).replace(/[^0-9]/g,''))||12);setCurLoad(exercise._lastLoad||"");setCurRpe(0);setCurPain(false);setCurQuality("");},[exercise.id]);
useEffect(()=>{if(timerOn&&tl>0)tr.current=setTimeout(()=>setTl(t=>t-1),1000);else if(timerOn&&tl===0){setTimerOn(false);setResting(false);}return()=>clearTimeout(tr.current);},[timerOn,tl]);
const logAndAdvance=()=>{const entry={set_number:cs,reps_done:curReps,load:curLoad?parseFloat(curLoad):null,rpe:curRpe||null,pain:curPain,quality:curQuality||"good"};setSetLog(prev=>[...prev,entry]);setCurPain(false);setCurQuality("");};
const handleSet=()=>{logAndAdvance();if(cs<(ep.sets||1)){setCs(s=>s+1);setCanUndo(true);if(ep.rest){setResting(true);setTl(ep.rest);setTimerOn(true);}}else{onDone({sets:[...setLog,{set_number:cs,reps_done:curReps,load:curLoad?parseFloat(curLoad):null,rpe:curRpe||null,pain:curPain,quality:curQuality||"good"}]});}};
const undoSet=()=>{if(cs>1&&canUndo){setCs(s=>s-1);setSetLog(prev=>prev.slice(0,-1));setResting(false);setTimerOn(false);setCanUndo(false);}};
const fmt=s=>`${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;
const pc={warmup:C.info,main:C.teal,cooldown:C.success}[phase]||C.teal;
const Sec=({id,title,icon,color,children,collapsible})=>{const o=collapsible?exp===id:true;return(<div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:14,borderLeft:`3px solid ${color||pc}`,overflow:"hidden",marginBottom:2}}><div onClick={collapsible?()=>setExp(o?null:id):undefined} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 16px",cursor:collapsible?"pointer":"default"}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:15}}>{icon}</span><span style={{fontSize:11,fontWeight:700,color:color||pc,letterSpacing:1.5,textTransform:"uppercase"}}>{title}</span></div>{collapsible&&<span style={{color:C.textDim,fontSize:12,transform:o?"rotate(90deg)":"rotate(0)",transition:"transform 0.2s"}}>▸</span>}</div>{o&&<div style={{padding:"0 16px 16px"}}>{children}</div>}</div>);};
return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>{onBack?<button onClick={onBack} style={{background:"none",border:"none",color:C.textMuted,fontSize:11,cursor:"pointer",padding:"4px 8px"}}>← Back</button>:<div/>}<Badge color={pc}>{phase}</Badge><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:12,color:C.textDim}}>{index+1}/{total}</span>{onPause&&<button onClick={onPause} style={{background:C.bgElevated,border:`1px solid ${C.border}`,borderRadius:6,color:C.textDim,fontSize:10,padding:"4px 8px",cursor:"pointer",minHeight:28}}>⏸</button>}{onEndEarly&&<button onClick={onEndEarly} style={{background:C.bgElevated,border:`1px solid ${C.danger}30`,borderRadius:6,color:C.danger,fontSize:10,padding:"4px 8px",cursor:"pointer",minHeight:28}}>End</button>}</div></div>
  <ProgressBar value={index+1} max={total} color={pc} height={4}/>
  {/* Exercise image — animated crossfade between start/end positions */}
  <ExerciseImage exercise={exercise}/>
  <div style={{textAlign:"center"}}><h2 style={{fontSize:24,fontWeight:800,color:"#FFF",margin:0,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:3}}>{exercise.name.toUpperCase()}</h2><div style={{fontSize:12,color:C.textDim,marginTop:4}}>📍 {exLocationLabel(exercise)} · {exercise.difficultyLevel?`Level ${exercise.difficultyLevel}`:exercise.difficulty||""}</div></div>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6}}>
    <Card style={{textAlign:"center",padding:10}}><div style={{fontSize:10,color:C.textDim,textTransform:"uppercase"}}>Sets</div><div style={{fontSize:20,fontWeight:800,color:C.text,fontFamily:"'Bebas Neue',sans-serif"}}>{cs}/{ep.sets||1}</div></Card>
    <Card style={{textAlign:"center",padding:10}}><div style={{fontSize:10,color:C.textDim,textTransform:"uppercase"}}>Reps</div><div style={{fontSize:20,fontWeight:800,color:C.text,fontFamily:"'Bebas Neue',sans-serif"}}>{ep.reps}</div></Card>
    <Card style={{textAlign:"center",padding:10}}><div style={{fontSize:10,color:C.textDim,textTransform:"uppercase"}}>Tempo</div><div style={{fontSize:14,fontWeight:700,color:C.textMuted}}>{ep.tempo||exercise.tempo||"—"}</div></Card>
    {ep.intensity&&<Card style={{textAlign:"center",padding:10}}><div style={{fontSize:10,color:C.textDim,textTransform:"uppercase"}}>RPE</div><div style={{fontSize:20,fontWeight:800,color:C.teal,fontFamily:"'Bebas Neue',sans-serif"}}>{ep.intensity}</div></Card>}
  </div>
  {/* Per-set tracking inputs — context-aware by exercise type */}
  <Card style={{padding:12}}>
    <div style={{fontSize:10,fontWeight:700,color:C.teal,letterSpacing:1.5,marginBottom:8}}>{exMode==="mobility"?"TRACKING":exMode==="cardio"?"CARDIO TRACKING":`SET ${cs} TRACKING`}</div>

    {/* MOBILITY/STRETCH: duration + completed */}
    {exMode==="mobility"&&<div>
      <div style={{fontSize:9,color:C.textDim,marginBottom:3}}>Duration (seconds)</div>
      <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:8}}><button onClick={()=>setCurReps(r=>Math.max(5,r-5))} style={{width:32,height:32,borderRadius:6,background:C.bgElevated,border:`1px solid ${C.border}`,color:C.text,fontSize:14,cursor:"pointer"}}>-</button><span style={{fontSize:22,fontWeight:800,color:C.text,fontFamily:"'Bebas Neue',sans-serif",minWidth:40,textAlign:"center"}}>{curReps}s</span><button onClick={()=>setCurReps(r=>r+5)} style={{width:32,height:32,borderRadius:6,background:C.bgElevated,border:`1px solid ${C.border}`,color:C.text,fontSize:14,cursor:"pointer"}}>+</button></div>
    </div>}

    {/* TIMED: duration + effort */}
    {exMode==="timed"&&<div>
      <div style={{fontSize:9,color:C.textDim,marginBottom:3}}>Duration (seconds)</div>
      <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:8}}><button onClick={()=>setCurReps(r=>Math.max(5,r-5))} style={{width:32,height:32,borderRadius:6,background:C.bgElevated,border:`1px solid ${C.border}`,color:C.text,fontSize:14,cursor:"pointer"}}>-</button><span style={{fontSize:22,fontWeight:800,color:C.text,fontFamily:"'Bebas Neue',sans-serif",minWidth:40,textAlign:"center"}}>{curReps}s</span><button onClick={()=>setCurReps(r=>r+5)} style={{width:32,height:32,borderRadius:6,background:C.bgElevated,border:`1px solid ${C.border}`,color:C.text,fontSize:14,cursor:"pointer"}}>+</button></div>
    </div>}

    {/* BODYWEIGHT: reps + effort (no weight) */}
    {exMode==="bodyweight"&&<div style={{marginBottom:8}}>
      <div style={{fontSize:9,color:C.textDim,marginBottom:3}}>Reps</div>
      <div style={{display:"flex",alignItems:"center",gap:4}}><button onClick={()=>setCurReps(r=>Math.max(1,r-1))} style={{width:32,height:32,borderRadius:6,background:C.bgElevated,border:`1px solid ${C.border}`,color:C.text,fontSize:14,cursor:"pointer"}}>-</button><span style={{fontSize:22,fontWeight:800,color:C.text,fontFamily:"'Bebas Neue',sans-serif",minWidth:30,textAlign:"center"}}>{curReps}</span><button onClick={()=>setCurReps(r=>r+1)} style={{width:32,height:32,borderRadius:6,background:C.bgElevated,border:`1px solid ${C.border}`,color:C.text,fontSize:14,cursor:"pointer"}}>+</button></div>
    </div>}

    {/* WEIGHTED: reps + weight + effort */}
    {exMode==="weighted"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
      <div><div style={{fontSize:9,color:C.textDim,marginBottom:3}}>Reps</div><div style={{display:"flex",alignItems:"center",gap:4}}><button onClick={()=>setCurReps(r=>Math.max(1,r-1))} style={{width:28,height:28,borderRadius:6,background:C.bgElevated,border:`1px solid ${C.border}`,color:C.text,fontSize:14,cursor:"pointer"}}>-</button><span style={{fontSize:18,fontWeight:800,color:C.text,fontFamily:"'Bebas Neue',sans-serif",minWidth:24,textAlign:"center"}}>{curReps}</span><button onClick={()=>setCurReps(r=>r+1)} style={{width:28,height:28,borderRadius:6,background:C.bgElevated,border:`1px solid ${C.border}`,color:C.text,fontSize:14,cursor:"pointer"}}>+</button></div></div>
      <div><div style={{fontSize:9,color:C.textDim,marginBottom:3}}>Weight (lbs)</div><div style={{display:"flex",alignItems:"center",gap:2}}>{[{v:-50,l:"-50"},{v:-5,l:"-5"}].map(b=><button key={b.l} onClick={()=>setCurLoad(l=>String(Math.max(0,(parseFloat(l)||0)+b.v)))} style={{width:30,height:28,borderRadius:4,background:C.bgElevated,border:`1px solid ${C.border}`,color:C.textDim,fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{b.l}</button>)}<input value={curLoad} onChange={e=>setCurLoad(e.target.value)} placeholder="—" type="number" style={{flex:1,padding:"6px 4px",borderRadius:6,background:C.bgElevated,border:`1px solid ${C.border}`,color:C.text,fontSize:14,fontFamily:"inherit",outline:"none",textAlign:"center",boxSizing:"border-box",minWidth:0}}/>{[{v:5,l:"+5"},{v:50,l:"+50"}].map(b=><button key={b.l} onClick={()=>setCurLoad(l=>String(Math.max(0,(parseFloat(l)||0)+b.v)))} style={{width:30,height:28,borderRadius:4,background:C.bgElevated,border:`1px solid ${C.border}`,color:C.textDim,fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{b.l}</button>)}</div></div>
    </div>}

    {/* CARDIO: duration + distance + effort */}
    {exMode==="cardio"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
      <div><div style={{fontSize:9,color:C.textDim,marginBottom:3}}>Duration (min)</div><div style={{display:"flex",alignItems:"center",gap:4}}><button onClick={()=>setCurReps(r=>Math.max(1,r-5))} style={{width:28,height:28,borderRadius:6,background:C.bgElevated,border:`1px solid ${C.border}`,color:C.text,fontSize:14,cursor:"pointer"}}>-</button><span style={{fontSize:18,fontWeight:800,color:C.text,fontFamily:"'Bebas Neue',sans-serif",minWidth:24,textAlign:"center"}}>{curReps}</span><button onClick={()=>setCurReps(r=>r+5)} style={{width:28,height:28,borderRadius:6,background:C.bgElevated,border:`1px solid ${C.border}`,color:C.text,fontSize:14,cursor:"pointer"}}>+</button></div></div>
      <div><div style={{fontSize:9,color:C.textDim,marginBottom:3}}>Distance (mi, optional)</div><input value={curLoad} onChange={e=>setCurLoad(e.target.value)} placeholder="—" type="number" step="0.1" style={{width:"100%",padding:"6px 8px",borderRadius:6,background:C.bgElevated,border:`1px solid ${C.border}`,color:C.text,fontSize:14,fontFamily:"inherit",outline:"none",textAlign:"center",boxSizing:"border-box"}}/></div>
    </div>}

    {/* Effort Level — shown for weighted, bodyweight, timed, cardio (NOT mobility) */}
    {exMode!=="mobility"&&<div style={{display:"flex",gap:6,marginBottom:6}}>
      <div style={{flex:1}}><div style={{fontSize:9,color:C.textDim,marginBottom:3}}>Effort Level 1-10 (optional) <span title="RPE = how hard it felt. 5 = moderate, 7 = challenging, 9 = near max, 10 = absolute limit." style={{cursor:"help",color:C.info,fontWeight:700}}>ⓘ</span></div><div style={{display:"flex",gap:2}}>{[5,6,7,8,9,10].map(v=><button key={v} onClick={()=>setCurRpe(curRpe===v?0:v)} style={{flex:1,padding:"4px 0",borderRadius:4,fontSize:9,fontWeight:700,cursor:"pointer",background:curRpe===v?C.teal+"20":"transparent",border:`1px solid ${curRpe===v?C.teal:C.border}`,color:curRpe===v?C.teal:C.textDim}}>{v}</button>)}</div></div>
    </div>}

    {/* Pain + Quality — shown for weighted, bodyweight, timed (NOT mobility/cardio) */}
    {(exMode==="weighted"||exMode==="bodyweight"||exMode==="timed")&&<div style={{display:"flex",gap:6}}>
      <button onClick={()=>setCurPain(!curPain)} style={{flex:1,padding:"6px",borderRadius:6,fontSize:9,fontWeight:600,cursor:"pointer",background:curPain?C.danger+"15":"transparent",border:`1px solid ${curPain?C.danger:C.border}`,color:curPain?C.danger:C.textDim}}>{curPain?"⚠️ Pain":"No Pain"}</button>
      {[{v:"good",l:"Good Form",c:C.success},{v:"struggled",l:"Struggled",c:C.warning},{v:"failed",l:"Failed",c:C.danger}].map(q=><button key={q.v} onClick={()=>setCurQuality(curQuality===q.v?"":q.v)} style={{flex:1,padding:"6px",borderRadius:6,fontSize:8,fontWeight:600,cursor:"pointer",background:curQuality===q.v?q.c+"15":"transparent",border:`1px solid ${curQuality===q.v?q.c:C.border}`,color:curQuality===q.v?q.c:C.textDim}}>{q.l}</button>)}
    </div>}

    {/* Set history */}
    {setLog.length>0&&<div style={{marginTop:8,borderTop:`1px solid ${C.border}`,paddingTop:6}}>{setLog.map(s=><div key={s.set_number} style={{fontSize:9,color:C.textMuted,padding:"2px 0"}}>Set {s.set_number}: {exMode==="timed"||exMode==="mobility"?`${s.reps_done}s`:exMode==="cardio"?`${s.reps_done} min`:`${s.reps_done} reps`}{s.load?exMode==="cardio"?` · ${s.load} mi`:` × ${s.load} lbs`:""}{s.rpe?` — RPE ${s.rpe}`:""} {s.pain?"⚠️":"✅"}</div>)}</div>}
  </Card>
  <Card style={{padding:14}}><div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:6}}>{em.primary.map(m=><Badge key={m}>{m}</Badge>)}{em.secondary.map(m=><Badge key={m} color={C.textDim}>{m}</Badge>)}</div><div style={{fontSize:11,color:C.textMuted}}>🔧 {(exercise.equipmentRequired||[exercise.equipment]).join(", ")} · ⏱️ {ep.tempo||exercise.tempo||""}</div></Card>
  <Card style={{borderLeft:`3px solid ${pc}`}}><div style={{fontSize:12,fontWeight:700,color:pc,letterSpacing:1.5,textTransform:"uppercase",marginBottom:6}}>🎯 Why This Exercise</div><p style={{fontSize:13,color:C.textMuted,lineHeight:1.6,margin:0}}>{exercise.purpose}</p>{exercise.whyForYou&&<div style={{background:C.tealBg,borderRadius:10,padding:12,marginTop:10}}><div style={{fontSize:10,fontWeight:700,color:C.teal,textTransform:"uppercase",marginBottom:4}}>Personalized</div><p style={{fontSize:12,color:C.text,margin:0}}>{exercise.whyForYou}</p></div>}</Card>
  <Sec id="steps" title="Step-by-Step" icon="📋" color={C.info} collapsible>{exercise.steps.map((s,i)=>(<div key={i} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:i<exercise.steps.length-1?`1px solid ${C.border}`:"none"}}><div style={{minWidth:24,height:24,borderRadius:"50%",background:C.infoGlow,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:C.info,flexShrink:0}}>{i+1}</div><p style={{fontSize:13,color:C.text,lineHeight:1.65,margin:0}}>{s}</p></div>))}</Sec>
  <Sec id="form" title="Good Form" icon="✅" color={C.success}>{exercise.formCues.map((c,i)=><div key={i} style={{fontSize:13,color:C.text,padding:"5px 0"}}>{c}</div>)}</Sec>
  <Sec id="mistakes" title="Avoid These" icon="⚠️" color={C.danger}>{exercise.commonMistakes.map((m,i)=><div key={i} style={{fontSize:13,color:C.text,padding:"5px 0"}}>{m}</div>)}</Sec>
  <Sec id="bracing" title="Core Bracing" icon="🛡️" color={C.warning}><p style={{fontSize:13,color:C.text,margin:0}}>{exercise.coreBracing}</p></Sec>
  <Sec id="injury" title="Injury Notes" icon="🩺" color={C.danger}>{typeof exercise.injuryNotes==="object"?Object.entries(exercise.injuryNotes).filter(([,v])=>v).map(([k,v])=>(<div key={k} style={{fontSize:13,color:C.text,padding:"4px 0",borderBottom:`1px solid ${C.border}`}}><span style={{fontWeight:700,color:k==="lower_back"?C.danger:k==="knee"?C.warning:C.info}}>⚠️ {k==="lower_back"?"BACK":k.toUpperCase()}:</span> {v}</div>)):<p style={{fontSize:13,color:C.text,margin:0}}>{exercise.injuryNotes}</p>}</Sec>
  <Sec id="tips" title="Pro Tip" icon="💡" color={C.teal} collapsible><p style={{fontSize:13,color:C.text,margin:0}}>{exercise.proTip}</p></Sec>
  {exercise.breathing&&<Card style={{background:C.bgGlass}}><div style={{fontSize:11,fontWeight:700,color:C.info,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>🫁 BREATHING</div><div style={{display:"flex",justifyContent:"space-around"}}>{[{l:"In",v:exercise.breathing.inhale,c:C.info},...(exercise.breathing.hold&&exercise.breathing.hold!=="0"?[{l:"Hold",v:exercise.breathing.hold,c:C.warning}]:[]),{l:"Out",v:exercise.breathing.exhale,c:C.success}].map(b=>(<div key={b.l} style={{textAlign:"center"}}><div style={{fontSize:26,fontWeight:800,color:b.c,fontFamily:"'Bebas Neue',sans-serif"}}>{b.v}{String(b.v).match(/^\d+$/)?'s':''}</div><div style={{fontSize:10,color:C.textDim,textTransform:"uppercase"}}>{b.l}</div></div>))}</div>{exercise.breathing.pattern&&<div style={{fontSize:11,color:C.textMuted,textAlign:"center",marginTop:8,fontStyle:"italic"}}>{exercise.breathing.pattern}</div>}</Card>}
  {resting&&<Card glow={C.infoGlow} style={{textAlign:"center"}}><div style={{fontSize:12,fontWeight:700,color:C.info,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>{getRestTimerMessage(tl,ep.rest)||"REST — HYDRATE 💧"}</div><div style={{fontSize:48,fontWeight:800,color:tl<=10?C.teal:C.text,fontFamily:"'Bebas Neue',sans-serif",transition:"color 0.3s"}}>{fmt(tl)}</div><ProgressBar value={tl} max={ep.rest} color={tl<=10?C.teal:C.info} height={4}/><div style={{fontSize:10,color:C.textDim,marginTop:8,minHeight:16,fontStyle:"italic"}}>{getRestTip()}</div><Btn variant="ghost" size="sm" onClick={()=>{setTimerOn(false);setResting(false);}} style={{margin:"10px auto 0",width:"auto"}}>Skip →</Btn></Card>}
  {!resting&&<div style={{display:"flex",flexDirection:"column",gap:6,position:"sticky",bottom:76,background:C.bg,padding:"12px 0",zIndex:50}}><div style={{display:"grid",gridTemplateColumns:canUndo?"1fr 1fr 1fr":"1fr 1fr",gap:8}}>{canUndo&&<Btn variant="ghost" onClick={undoSet} size="sm" icon="↩">Undo</Btn>}<Btn onClick={handleSet} icon="✓" style={{fontFamily:"'Bebas Neue',sans-serif",letterSpacing:2}}>{cs<(ep.sets||1)?"SET DONE":"COMPLETE"}</Btn><Btn variant="dark" onClick={onSub} icon="🔄">Sub</Btn></div></div>}
  <div style={{height:90}}/>
</div>);}

// ── LIBRARY — 300 exercises with multi-filter ────────────────────
// ── PROGRESSION ROADMAP CARD ─────────────────────────────────
function ProgressionRoadmapCard({targetId,compact=false}){
  const roadmap=useMemo(()=>buildRoadmap(targetId),[targetId]);
  if(!roadmap||!roadmap.steps.length)return null;
  const{target,steps,progressPercent,currentStep,unlocked}=roadmap;
  if(unlocked&&compact)return null; // Don't show in compact mode if already unlocked
  return(<Card style={{borderColor:C.purple+"30",background:unlocked?C.success+"06":C.bgCard}}>
    {!compact&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <div style={{fontSize:11,fontWeight:700,color:C.purple,letterSpacing:2}}>PROGRESSION ROADMAP</div>
      <Badge color={unlocked?C.success:C.purple}>{unlocked?"UNLOCKED":progressPercent+"%"}</Badge>
    </div>}
    {!compact&&<ProgressBar value={progressPercent} max={100} color={C.purple} height={4}/>}
    <div style={{marginTop:compact?0:10}}>
      {steps.map((s,i)=>{
        const isLast=i===steps.length-1;
        return(<div key={s.exercise.id} style={{display:"flex",gap:10,padding:compact?"4px 0":"6px 0",opacity:s.isLocked?0.45:1}}>
          {/* Step indicator */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:24,flexShrink:0}}>
            <div style={{width:20,height:20,borderRadius:"50%",background:s.isMastered?C.success:s.isCurrent?C.purple:s.isTarget?C.teal+"20":C.bgElevated,border:`2px solid ${s.isMastered?C.success:s.isCurrent?C.purple:s.isTarget?C.teal:C.border}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:8,fontWeight:800,color:s.isMastered||s.isCurrent?"#fff":C.textDim}}>{s.isMastered?"✓":s.isTarget&&s.isLocked?"🔒":s.stepNumber}</span>
            </div>
            {!isLast&&<div style={{width:2,height:compact?12:18,background:s.isMastered?C.success:C.border,marginTop:2}}/>}
          </div>
          {/* Exercise info */}
          <div style={{flex:1,paddingBottom:isLast?0:compact?2:4}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <ExerciseImage exercise={s.exercise} size="thumb"/>
              <div style={{flex:1}}>
                <div style={{fontSize:compact?10:12,fontWeight:s.isCurrent||s.isTarget?700:400,color:s.isMastered?C.success:s.isCurrent?C.text:s.isTarget?C.teal:C.textDim}}>{s.exercise.name}</div>
                {s.isCurrent&&!compact&&<div style={{fontSize:9,color:C.purple,fontWeight:700,marginTop:1}}>← CURRENT · {s.painFreeCount}/{s.painFreeNeeded} pain-free</div>}
                {s.isMastered&&!compact&&<div style={{fontSize:9,color:C.success}}>Mastered ✓</div>}
                {s.isTarget&&s.isLocked&&!compact&&<div style={{fontSize:9,color:C.textDim}}>{s.readiness.reasons[0]||s.unlockCriteria}</div>}
                {s.isTarget&&!s.isLocked&&!compact&&<div style={{fontSize:9,color:C.teal,fontWeight:700}}>Ready to use!</div>}
              </div>
              {s.isCurrent&&<Badge color={C.purple}>NOW</Badge>}
              {s.isTarget&&<Badge color={s.isLocked?C.textDim:C.teal}>{s.isLocked?"GOAL":"READY"}</Badge>}
            </div>
          </div>
        </div>);
      })}
    </div>
    {currentStep&&!compact&&<div style={{marginTop:8,padding:8,background:C.purple+"08",borderRadius:8}}>
      <div style={{fontSize:10,color:C.purple}}>Building toward <b>{target.name}</b> — currently working <b>{currentStep.exercise.name}</b></div>
      <div style={{fontSize:9,color:C.textDim,marginTop:2}}>Next: {currentStep.unlockCriteria}</div>
    </div>}
  </Card>);
}

function LibraryScreen(){
  const[catFilter,setCatFilter]=useState("All");
  const[bodyFilter,setBodyFilter]=useState("All");
  const[moveFilter,setMoveFilter]=useState("All");
  const[abilityFilter,setAbilityFilter]=useState("All");
  const[phaseFilter,setPhaseFilter]=useState("All");
  const[locFilter,setLocFilter]=useState("All");
  const[progFilter,setProgFilter]=useState("All");
  const[search,setSearch]=useState("");
  const[sel,setSel]=useState(null);
  const filtered=useMemo(()=>{
    let list=exerciseDB;
    if(progFilter!=="All") list=filterByProgram(list,progFilter);
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
    <FilterRow label="Program" items={PROGRAM_FILTERS.map(p=>p.id)} value={progFilter} onChange={setProgFilter} color={C.purple}/>
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
        <ExerciseImage exercise={ex} size="thumb"/>
        <div style={{flex:1}}><div style={{fontSize:15,fontWeight:700,color:C.text}}>{ex.name}</div><div style={{fontSize:11,color:C.textDim}}>{ep2.sets}×{ep2.reps}{ep2.tempo?` · ${ep2.tempo}`:""} · {ex.bodyPart?.replace(/_/g," ")}{ep2.intensity?` · ${ep2.intensity}`:""}</div></div>
        <Badge color={ex.safetyTier==="green"?C.success:ex.safetyTier==="yellow"?C.warning:C.danger}>{ex.safetyTier||"—"}</Badge>
      </div>
      {sel===ex.id&&<div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${C.border}`}}>
        <ExerciseImage exercise={ex} showBoth={true}/>
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
        {/* Program badges */}
        {(ex.methodology||[]).length>0&&<div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:6}}>{(ex.methodology||[]).map(m=><Badge key={m} color={m==="pes"?C.orange:m==="sfs"?C.info:m==="ces"?C.warning:m==="rehab"?C.danger:C.teal}>{m.toUpperCase()}</Badge>)}</div>}
        {/* Prerequisites */}
        {ex.prerequisites?.minPhase>1&&<div style={{fontSize:10,color:C.textDim,marginTop:4}}>Requires: Phase {ex.prerequisites.minPhase}+{ex.prerequisites.minCompletedSessions>0?` · ${ex.prerequisites.minCompletedSessions} sessions`:""}</div>}
        {/* Progresses to */}
        {ex.progressionChain?.progressTo&&<div style={{fontSize:10,color:C.purple,marginTop:2}}>Progresses to: {exerciseDB.find(e2=>e2.id===ex.progressionChain.progressTo)?.name||ex.progressionChain.progressTo}</div>}
        {/* Progression roadmap for this exercise */}
        {ex.progressionChain?.chainFamily&&<div style={{marginTop:8}}><ProgressionRoadmapCard targetId={ex.id}/></div>}
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

// ── QUICK MODE ──────────────────────────────────────────────────
function QuickModeScreen({workout,onComplete}){
  const[checked,setChecked]=useState({});
  const[expanded,setExpanded]=useState(null);
  const[timerOn,setTimerOn]=useState(false);
  const[tl,setTl]=useState(0);
  const[timerFor,setTimerFor]=useState(null);
  const tr=useRef(null);
  useEffect(()=>{if(timerOn&&tl>0)tr.current=setTimeout(()=>setTl(t=>t-1),1000);else if(timerOn&&tl===0){setTimerOn(false);setTimerFor(null);}return()=>clearTimeout(tr.current);},[timerOn,tl]);
  const fmt=s=>`${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;
  const w=workout||defaultWorkout;
  const allDone=w.all.length>0&&w.all.every(e=>checked[e.id]);
  const doneCount=w.all.filter(e=>checked[e.id]).length;
  const toggleCheck=(id)=>setChecked(p=>({...p,[id]:!p[id]}));
  const startRest=(ex)=>{const ep2=exParams(ex);const r=ep2.rest||60;setTl(r);setTimerFor(ex.id);setTimerOn(true);};
  const handleComplete=()=>{
    const exercisesCompleted=w.all.filter(e=>checked[e.id]).map(e=>{const ep2=exParams(e);return{exercise_id:e.id,sets_done:ep2.sets||1,reps_done:ep2.reps||"—",load:null,pain_during:false};});
    onComplete(exercisesCompleted);
  };
  return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div><div style={{fontSize:24,fontWeight:800,color:C.teal,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:3}}>QUICK MODE</div><div style={{fontSize:11,color:C.textMuted}}>{doneCount}/{w.all.length} exercises · Tap name to expand</div></div>
      <Badge color={allDone?C.success:C.warning}>{Math.round(doneCount/Math.max(1,w.all.length)*100)}%</Badge>
    </div>
    <ProgressBar value={doneCount} max={w.all.length} color={C.teal} height={4}/>
    {/* Rest timer floating card */}
    {timerOn&&<Card glow={C.infoGlow} style={{textAlign:"center",position:"sticky",top:0,zIndex:50}}><div style={{fontSize:10,fontWeight:700,color:C.info,letterSpacing:2,textTransform:"uppercase"}}>REST — HYDRATE 💧</div><div style={{fontSize:36,fontWeight:800,color:C.text,fontFamily:"'Bebas Neue',sans-serif"}}>{fmt(tl)}</div><Btn variant="ghost" size="sm" onClick={()=>{setTimerOn(false);setTimerFor(null);}} style={{margin:"4px auto 0",width:"auto"}}>Skip →</Btn></Card>}
    {[{label:"WARM-UP",exercises:w.warmup,color:C.info},{label:"MAIN",exercises:w.main,color:C.teal},{label:"COOLDOWN",exercises:w.cooldown,color:C.success}].map(sec=>(
      <div key={sec.label}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><div style={{width:6,height:6,borderRadius:3,background:sec.color}}/><span style={{fontSize:10,fontWeight:700,color:sec.color,letterSpacing:1.5}}>{sec.label}</span></div>
        {sec.exercises.map(ex=>{const ep2=exParams(ex);const em2=exMuscles(ex);const done=checked[ex.id];const isExp=expanded===ex.id;return(<Card key={ex.id} style={{padding:0,marginBottom:4,opacity:done?0.6:1,borderColor:done?C.success+"40":C.border}}>
          {/* Main row */}
          <div style={{display:"flex",alignItems:"center",gap:0}}>
            {/* Checkbox */}
            <button onClick={()=>toggleCheck(ex.id)} style={{width:48,minHeight:48,display:"flex",alignItems:"center",justifyContent:"center",background:"none",border:"none",cursor:"pointer",flexShrink:0}}>
              <div style={{width:22,height:22,borderRadius:6,border:`2px solid ${done?C.success:C.border}`,background:done?C.success:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>{done&&<span style={{color:"#000",fontSize:14,fontWeight:800}}>✓</span>}</div>
            </button>
            {/* Exercise info — tap to expand */}
            <div onClick={()=>setExpanded(isExp?null:ex.id)} style={{flex:1,padding:"10px 12px 10px 0",cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:18,flexShrink:0}}>{ex.emoji}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:done?C.textDim:C.text,textDecoration:done?"line-through":"none"}}>{ex.name}</div>
                <div style={{fontSize:10,color:C.textDim}}>{ep2.sets}×{ep2.reps}{ep2.tempo?` · ${ep2.tempo}`:""} · {(ex.bodyPart||"").replace(/_/g," ")}{ep2.intensity?` · ${ep2.intensity}`:""}</div>
              </div>
              <span style={{color:C.textDim,fontSize:10,transform:isExp?"rotate(90deg)":"rotate(0)",transition:"transform 0.2s"}}>▸</span>
            </div>
          </div>
          {/* Expanded detail view */}
          {isExp&&<div style={{padding:"0 14px 14px",borderTop:`1px solid ${C.border}`}}>
            {/* SVG Illustration — CLAUDE.md Rule 3: always visible when expanded */}
            <div style={{marginTop:10}}><ExerciseImage exercise={ex} showBoth={true}/></div>
            {/* Muscles */}
            <div style={{display:"flex",flexWrap:"wrap",gap:3,marginTop:8}}>{em2.primary.map(mu=><Badge key={mu}>{mu}</Badge>)}{em2.secondary.slice(0,2).map(mu=><Badge key={mu} color={C.textDim}>{mu}</Badge>)}</div>
            {/* Key form cues */}
            <div style={{background:C.bgGlass,borderRadius:10,padding:10,marginTop:8}}><div style={{fontSize:10,fontWeight:700,color:C.success,marginBottom:4}}>KEY FORM CUES</div>{(ex.formCues||[]).slice(0,3).map((c,i)=><div key={i} style={{fontSize:11,color:C.text,padding:"2px 0"}}>{c}</div>)}</div>
            {/* Injury notes */}
            <div style={{background:C.bgGlass,borderRadius:10,padding:10,marginTop:6}}><div style={{fontSize:10,fontWeight:700,color:C.danger,marginBottom:4}}>INJURY NOTES</div>{typeof ex.injuryNotes==="object"?Object.entries(ex.injuryNotes).filter(([,v])=>v).map(([k,v])=><div key={k} style={{fontSize:10,color:C.text,padding:"2px 0"}}><b style={{color:k==="lower_back"?C.danger:k==="knee"?C.warning:C.info}}>{k==="lower_back"?"BACK":k.toUpperCase()}:</b> {v}</div>):<div style={{fontSize:11,color:C.text}}>{ex.injuryNotes}</div>}</div>
            {/* Breathing */}
            {ex.breathing&&<div style={{background:C.bgGlass,borderRadius:10,padding:10,marginTop:6}}><div style={{display:"flex",justifyContent:"space-around"}}>{[{l:"In",v:ex.breathing.inhale,c:C.info},...(ex.breathing.hold&&ex.breathing.hold!=="0"?[{l:"Hold",v:ex.breathing.hold,c:C.warning}]:[]),{l:"Out",v:ex.breathing.exhale,c:C.success}].map(b=>(<div key={b.l} style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:b.c,fontFamily:"'Bebas Neue',sans-serif"}}>{b.v}{String(b.v).match(/^\d+$/)?'s':''}</div><div style={{fontSize:8,color:C.textDim,textTransform:"uppercase"}}>{b.l}</div></div>))}</div>{ex.breathing.pattern&&<div style={{fontSize:9,color:C.textMuted,textAlign:"center",marginTop:4,fontStyle:"italic"}}>{ex.breathing.pattern}</div>}</div>}
            {/* Rest timer button */}
            {ep2.rest>0&&<Btn variant="dark" size="sm" onClick={()=>startRest(ex)} style={{marginTop:8}} icon="⏱️">{timerFor===ex.id&&timerOn?`Resting... ${fmt(tl)}`:`Start ${ep2.rest}s Rest Timer`}</Btn>}
          </div>}
        </Card>);})}
      </div>
    ))}
    {/* Complete button */}
    <div style={{position:"sticky",bottom:76,background:C.bg,padding:"12px 0",zIndex:50}}>
      <Btn onClick={handleComplete} disabled={!allDone} icon={allDone?"🏆":"🔒"} style={{fontFamily:"'Bebas Neue',sans-serif",letterSpacing:2}}>{allDone?"COMPLETE WORKOUT":"CHECK ALL EXERCISES TO FINISH"}</Btn>
      {!allDone&&<div style={{textAlign:"center",fontSize:10,color:C.textDim,marginTop:4}}>{w.all.length-doneCount} remaining</div>}
    </div>
    <div style={{height:90}}/>
  </div>);
}

// ── OTHER SCREENS ───────────────────────────────────────────────
function Mindfulness({onContinue,type}){
  const labels={warmupToMain:{t:"TRANSITION",s:"Warm-up done. Time for 3 deep breaths.",i:"🧘"},mainToCooldown:{t:"COOLDOWN TIME",s:"The hard part is done. You earned this.",i:"🌊"},midSession:{t:"HALFWAY CHECK-IN",s:"Pause. Reset. Finish strong.",i:"💭"}}[type]||{t:"BREATHE",s:"Reset your nervous system.",i:"🧘"};
  const LS="apex_breath_prefs";
  const saved=(()=>{try{return JSON.parse(localStorage.getItem(LS))||{};}catch{return{};}})();
  const[inh,setInh]=useState(saved.inh||7);
  const[hld,setHld]=useState(saved.hld||7);
  const[exh,setExh]=useState(saved.exh||7);
  const[phase,setPhase]=useState("idle");// idle|in|hold|out|done
  const[sec,setSec]=useState(0);
  const[cycle,setCycle]=useState(0);
  const[circleScale,setCircleScale]=useState(0.4);
  const totalCycles=3;
  const timerRef=useRef(null);

  // Save prefs on change
  useEffect(()=>{try{localStorage.setItem(LS,JSON.stringify({inh,hld,exh}));}catch{}},[inh,hld,exh]);

  // Auto-start breathing
  useEffect(()=>{if(phase==="idle"){setPhase("in");setSec(inh);setCycle(0);}},[]);

  // Timer tick
  useEffect(()=>{
    if(phase==="done"||phase==="idle")return;
    timerRef.current=setTimeout(()=>{
      if(sec>1){setSec(s=>s-1);}
      else{
        // Advance phase
        if(phase==="in"){setPhase("hold");setSec(hld);}
        else if(phase==="hold"){setPhase("out");setSec(exh);}
        else if(phase==="out"){
          const next=cycle+1;
          if(next>=totalCycles){setPhase("done");}
          else{setCycle(next);setPhase("in");setSec(inh);}
        }
      }
    },1000);
    return()=>clearTimeout(timerRef.current);
  },[phase,sec,cycle,inh,hld,exh]);

  // Circle animation
  useEffect(()=>{
    if(phase==="in")setCircleScale(1);
    else if(phase==="hold")setCircleScale(1);
    else if(phase==="out")setCircleScale(0.4);
    else if(phase==="done")setCircleScale(0.6);
  },[phase]);

  const phaseLabel=phase==="in"?"Breathe In":phase==="hold"?"Hold":phase==="out"?"Breathe Out":phase==="done"?"Done":"";
  const phaseColor=phase==="in"?C.info:phase==="hold"?C.warning:phase==="out"?C.success:C.teal;
  const Adj=({label,val,set})=>(<div style={{display:"flex",alignItems:"center",gap:4}}><span style={{fontSize:10,color:C.textDim,minWidth:36}}>{label}</span><button onClick={()=>set(v=>Math.max(2,v-1))} style={{width:24,height:24,borderRadius:6,background:C.bgElevated,border:`1px solid ${C.border}`,color:C.textDim,fontSize:12,cursor:"pointer"}}>-</button><span style={{fontSize:14,fontWeight:700,color:C.text,minWidth:20,textAlign:"center"}}>{val}s</span><button onClick={()=>set(v=>Math.min(15,v+1))} style={{width:24,height:24,borderRadius:6,background:C.bgElevated,border:`1px solid ${C.border}`,color:C.textDim,fontSize:12,cursor:"pointer"}}>+</button></div>);

  return(<div className="fade-in" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,minHeight:400,textAlign:"center"}}>
    <div style={{fontSize:48}}>{labels.i}</div>
    <h2 style={{fontSize:26,fontWeight:800,color:C.text,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:3,margin:0}}>{labels.t}</h2>
    <p style={{fontSize:14,color:C.textMuted,maxWidth:280}}>{labels.s}</p>
    {/* Breathing circle */}
    {phase!=="done"&&<div style={{position:"relative",width:160,height:160,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:140,height:140,borderRadius:"50%",border:`3px solid ${phaseColor}30`,position:"absolute",top:10,left:10}}/>
      <div style={{width:`${circleScale*140}px`,height:`${circleScale*140}px`,borderRadius:"50%",background:`${phaseColor}15`,border:`2px solid ${phaseColor}`,transition:"all 1s ease-in-out",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
        <div style={{fontSize:28,fontWeight:800,color:phaseColor,fontFamily:"'Bebas Neue',sans-serif"}}>{sec}</div>
      </div>
    </div>}
    {phase!=="done"&&<div style={{fontSize:16,fontWeight:700,color:phaseColor}}>{phaseLabel}...</div>}
    {phase!=="done"&&<div style={{fontSize:10,color:C.textDim}}>Breath {cycle+1} of {totalCycles}</div>}
    {/* Timing adjusters */}
    <Card style={{background:C.bgGlass,width:"100%",maxWidth:300,padding:12}}>
      <div style={{display:"flex",justifyContent:"space-around"}}>
        <Adj label="In" val={inh} set={setInh}/>
        <Adj label="Hold" val={hld} set={setHld}/>
        <Adj label="Out" val={exh} set={setExh}/>
      </div>
    </Card>
    {phase==="done"&&<div><div style={{fontSize:32,marginBottom:8}}>✨</div><div style={{fontSize:14,color:C.success,fontWeight:600,marginBottom:12}}>3 breaths complete. Ready to go.</div><Btn onClick={onContinue} style={{maxWidth:300}}>Continue →</Btn></div>}
    {phase!=="done"&&<Btn variant="ghost" onClick={onContinue} style={{maxWidth:300,opacity:0.6}}>Skip →</Btn>}
    <div style={{height:90}}/>
  </div>);
}
function ReflectScreen({onComplete,exercisesDone}){
  const qs=[{id:"d",label:"Difficulty",icon:"📊"},{id:"p",label:"Pain",icon:"⚠️"},{id:"e",label:"Enjoyment",icon:"😊"},{id:"f",label:"Form",icon:"🎯"}];
  const[r,setR]=useState(()=>{const o={};qs.forEach(q=>o[q.id]=5);return o;});
  const[starred,setStarred]=useState([]);
  const[flagged,setFlagged]=useState([]);
  const[painFlags,setPainFlags]=useState([]); // [{exercise_id, body_area, severity}]
  const[painSelecting,setPainSelecting]=useState(null);
  const[painArea,setPainArea]=useState("");
  const[painSev,setPainSev]=useState(3);
  const[overall,setOverall]=useState("just_right");
  const[notes,setNotes]=useState("");
  const exList=useMemo(()=>{
    const ids=new Set();
    return(exercisesDone||[]).map(ec=>{if(ids.has(ec.exercise_id))return null;ids.add(ec.exercise_id);return exerciseDB.find(e=>e.id===ec.exercise_id);}).filter(Boolean);
  },[exercisesDone]);
  const toggleStar=(id)=>setStarred(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const toggleFlag=(id)=>setFlagged(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const addPainFlag=()=>{if(!painSelecting||!painArea)return;setPainFlags(p=>[...p.filter(x=>x.exercise_id!==painSelecting),{exercise_id:painSelecting,body_area:painArea,severity:painSev}]);setPainSelecting(null);setPainArea("");setPainSev(3);};
  const handleSubmit=()=>onComplete({...r,starred,flagged,painFlags,overall,notes});
  return(<div style={{display:"flex",flexDirection:"column",gap:14}}>
    <h2 style={{fontSize:24,fontWeight:800,color:C.text,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:2,margin:0}}>REFLECT</h2>
    {/* Sliders */}
    <Card>{qs.map(q=>(<div key={q.id} style={{padding:"10px 0",borderBottom:`1px solid ${C.border}`}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,color:C.text}}>{q.icon} {q.label}</span><span style={{fontSize:14,fontWeight:700,color:C.teal,fontFamily:"'Bebas Neue',sans-serif"}}>{r[q.id]}/10</span></div><input type="range" min={1} max={10} value={r[q.id]} onChange={e=>setR(p=>({...p,[q.id]:parseInt(e.target.value)}))} style={{width:"100%",height:6,appearance:"none",background:C.border,borderRadius:3,accentColor:C.teal,cursor:"pointer"}}/></div>))}</Card>
    {/* Overall */}
    <Card><div style={{fontSize:11,fontWeight:700,color:C.info,letterSpacing:1.5,marginBottom:8}}>OVERALL SESSION</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
      {[{v:"too_easy",l:"Too Easy",i:"😴",c:C.info},{v:"just_right",l:"Just Right",i:"👌",c:C.success},{v:"too_hard",l:"Too Hard",i:"😰",c:C.danger}].map(o=>(<button key={o.v} onClick={()=>setOverall(o.v)} style={{padding:"10px 4px",borderRadius:10,textAlign:"center",cursor:"pointer",background:overall===o.v?o.c+"15":"transparent",border:`1px solid ${overall===o.v?o.c:C.border}`,color:overall===o.v?o.c:C.textDim}}><div style={{fontSize:18}}>{o.i}</div><div style={{fontSize:9,fontWeight:700,marginTop:2}}>{o.l}</div></button>))}
    </div></Card>
    {/* Starred exercises */}
    {exList.length>0&&<Card><div style={{fontSize:11,fontWeight:700,color:C.success,letterSpacing:1.5,marginBottom:8}}>EXERCISES I LOVED ⭐ (tap to star)</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:4}}>{exList.map(ex=>(<button key={ex.id} onClick={()=>toggleStar(ex.id)} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 8px",borderRadius:8,cursor:"pointer",background:starred.includes(ex.id)?C.success+"15":"transparent",border:`1px solid ${starred.includes(ex.id)?C.success:C.border}`}}>
        <ExerciseImage exercise={ex} size="thumb"/><span style={{fontSize:9,color:starred.includes(ex.id)?C.success:C.textDim}}>{ex.name}</span>{starred.includes(ex.id)&&<span style={{fontSize:10}}>⭐</span>}
      </button>))}</div>
    </Card>}
    {/* Flagged exercises */}
    {exList.length>0&&<Card><div style={{fontSize:11,fontWeight:700,color:C.warning,letterSpacing:1.5,marginBottom:8}}>DIDN'T LIKE 👎 (tap to flag)</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:4}}>{exList.map(ex=>(<button key={ex.id} onClick={()=>toggleFlag(ex.id)} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 8px",borderRadius:8,cursor:"pointer",background:flagged.includes(ex.id)?C.warning+"15":"transparent",border:`1px solid ${flagged.includes(ex.id)?C.warning:C.border}`}}>
        <ExerciseImage exercise={ex} size="thumb"/><span style={{fontSize:9,color:flagged.includes(ex.id)?C.warning:C.textDim}}>{ex.name}</span>{flagged.includes(ex.id)&&<span style={{fontSize:10}}>👎</span>}
      </button>))}</div>
    </Card>}
    {/* Pain-flagged exercises */}
    {exList.length>0&&<Card style={{borderColor:C.danger+"20"}}><div style={{fontSize:11,fontWeight:700,color:C.danger,letterSpacing:1.5,marginBottom:8}}>CAUSED PAIN? 🩺 (tap exercise, then specify)</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:4}}>{exList.map(ex=>{const pf=painFlags.find(p=>p.exercise_id===ex.id);return(<button key={ex.id} onClick={()=>setPainSelecting(ex.id)} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 8px",borderRadius:8,cursor:"pointer",background:pf?C.danger+"15":painSelecting===ex.id?C.danger+"08":"transparent",border:`1px solid ${pf?C.danger:painSelecting===ex.id?C.danger+"60":C.border}`}}>
        <ExerciseImage exercise={ex} size="thumb"/><span style={{fontSize:9,color:pf?C.danger:C.textDim}}>{ex.name}</span>{pf&&<span style={{fontSize:8,color:C.danger}}>⚠️ {pf.body_area} ({pf.severity})</span>}
      </button>);})}</div>
      {painSelecting&&<div style={{marginTop:8,padding:10,background:C.bgElevated,borderRadius:10}}>
        <div style={{fontSize:10,color:C.text,marginBottom:6}}>Where did <b>{exerciseDB.find(e=>e.id===painSelecting)?.name}</b> cause pain?</div>
        <input value={painArea} onChange={e=>setPainArea(e.target.value)} placeholder="Body area (e.g., left shoulder, lower back)" style={{width:"100%",padding:"6px 10px",borderRadius:8,background:C.bgCard,border:`1px solid ${C.border}`,color:C.text,fontSize:11,fontFamily:"inherit",outline:"none",marginBottom:6,boxSizing:"border-box"}}/>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><span style={{fontSize:9,color:C.textDim}}>Severity:</span>{[1,2,3,4,5].map(s=>(<button key={s} onClick={()=>setPainSev(s)} style={{width:22,height:22,borderRadius:4,fontSize:10,fontWeight:700,cursor:"pointer",background:painSev===s?(s<=2?C.success:s<=3?C.warning:C.danger)+"20":"transparent",border:`1px solid ${painSev===s?(s<=2?C.success:s<=3?C.warning:C.danger):C.border}`,color:painSev===s?C.text:C.textDim}}>{s}</button>))}</div>
        <div style={{display:"flex",gap:6}}><Btn onClick={addPainFlag} disabled={!painArea.trim()} size="sm" style={{flex:1}} icon="⚠️">Flag Pain</Btn><Btn variant="ghost" onClick={()=>setPainSelecting(null)} size="sm" style={{flex:1}}>Cancel</Btn></div>
      </div>}
    </Card>}
    {/* Notes */}
    <Card><div style={{fontSize:11,fontWeight:700,color:C.purple,letterSpacing:1.5,marginBottom:8}}>NOTES (optional)</div>
      <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Anything worth noting? Shoulder felt weird, loved the new exercise, etc..." rows={3} style={{width:"100%",padding:"10px 12px",borderRadius:10,background:C.bgElevated,border:`1px solid ${C.border}`,color:C.text,fontSize:12,fontFamily:"inherit",outline:"none",resize:"vertical",boxSizing:"border-box"}}/>
    </Card>
    <Btn onClick={handleSubmit} icon="🏆" style={{fontFamily:"'Bebas Neue',sans-serif",letterSpacing:2}}>COMPLETE SESSION</Btn>
    <div style={{height:90}}/>
  </div>);
}
function RecapScreen({onFinish,sessionData}){
  const[saved]=useState(()=>{
    if(!sessionData) return null;
    const volume=computeSessionVolume(sessionData.exercisesCompleted||[],exerciseDB);
    return saveSession({...sessionData,totalVolume:volume});
  });
  const otAssessment=useMemo(()=>assessOvertraining(),[saved]);
  const stats=getStats();
  const streakMsg=getStreakMessage(stats.streak);
  return(<div className="fade-in" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:20,textAlign:"center",paddingTop:24}}><div style={{fontSize:72}}>🏆</div><h2 style={{fontSize:32,fontWeight:800,color:C.text,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:3,margin:0}}>SESSION COMPLETE</h2><p style={{fontSize:14,color:C.textMuted,maxWidth:300}}>{getRecapHeadline()}</p>{streakMsg&&<div style={{fontSize:12,color:C.teal,fontWeight:600}}>{getStreakEmoji(stats.streak)} {streakMsg}</div>}<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,width:"100%"}}>{[{l:"Sessions",v:String(stats.totalSessions),c:C.info},{l:"This Week",v:String(stats.sessionsThisWeek),c:C.teal},{l:"Streak",v:`${stats.streak} 🔥`,c:C.success}].map(s=>(<Card key={s.l} style={{textAlign:"center",padding:16}}><div style={{fontSize:22,fontWeight:800,color:s.c,fontFamily:"'Bebas Neue',sans-serif"}}>{s.v}</div><div style={{fontSize:10,color:C.textDim,textTransform:"uppercase",marginTop:4}}>{s.l}</div></Card>))}</div>{Object.keys(stats.weeklyVolume||{}).length>0&&<Card style={{width:"100%"}}><div style={{fontSize:12,fontWeight:700,color:C.purple,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Weekly Volume (sets)</div>{Object.entries(stats.weeklyVolume).map(([m,v])=>(<div key={m} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${C.border}`}}><span style={{fontSize:12,color:C.textMuted}}>{m.replace(/_/g," ")}</span><span style={{fontSize:13,fontWeight:700,color:C.teal}}>{v}</span></div>))}</Card>}<Card style={{width:"100%"}}><div style={{fontSize:12,fontWeight:700,color:C.teal,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Recovery Protocol</div>{["💧 500ml water within the hour","🍗 30-40g protein within 90 min","😴 7-8 hours sleep tonight","🧊 Joint soreness → 10-15min ice","🚶 Light 10-min walk"].map((r,i)=>(<div key={i} style={{fontSize:13,color:C.textMuted,padding:"4px 0"}}>{r}</div>))}</Card>{otAssessment&&otAssessment.level>0&&<Card style={{width:"100%",borderLeft:`3px solid ${otAssessment.color}`,borderColor:otAssessment.color+"40"}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><span style={{fontSize:18}}>{otAssessment.icon}</span><div style={{fontSize:12,fontWeight:700,color:otAssessment.color}}>Recovery Alert — Level {otAssessment.level}</div></div><div style={{fontSize:11,color:C.text,lineHeight:1.6}}>{otAssessment.message}</div>{otAssessment.recoveryTips.slice(0,2).map((t,i)=><div key={i} style={{fontSize:10,color:C.textMuted,marginTop:4}}>💡 {t}</div>)}</Card>}{otAssessment?.reversal?.detected&&<Card style={{width:"100%",borderLeft:`3px solid ${C.success}`,borderColor:C.success+"40"}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18}}>📈</span><div style={{fontSize:11,color:C.success,fontWeight:600}}>{otAssessment.reversal.message}</div></div></Card>}<Btn onClick={onFinish} style={{marginTop:8}} icon="🏠">Back to Home</Btn><div style={{height:90}}/></div>);}
function TasksScreen(){return(<div style={{display:"flex",flexDirection:"column",gap:16}}><div style={{fontSize:28,fontWeight:800,color:C.teal,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:4}}>TASKS</div><Card style={{textAlign:"center",padding:24}}><div style={{fontSize:48}}>🚧</div><div style={{fontSize:16,fontWeight:700,color:C.text,marginTop:8}}>Coming Soon</div><div style={{fontSize:13,color:C.textMuted,marginTop:4}}>Task board with CTFAR coaching and integrity scoring.</div></Card><div style={{height:90}}/></div>);}

// ── INNER APP (authenticated) ───────────────────────────────────
function AppInner(){
  const{user,profile,loading}=useAuth();
  useEffect(()=>{syncOverridesFromSupabase();},[]);
  const _noRestore=new Set(["perform","mindfulness","reflect","recap","checkin","plan","quickmode","init","auth","onboarding"]);
  const[screen,_setScreen]=useState("init");const setScreen=useCallback((s)=>{_setScreen(s);window.scrollTo(0,0);if(!_noRestore.has(s))try{localStorage.setItem("apex_last_screen",s);}catch{}},[]);const _savedTab=(()=>{try{return localStorage.getItem("apex_last_tab")||"home";}catch{return"home";}})();const[tab,_setTab]=useState(_savedTab);const setTab=(t)=>{_setTab(t);try{localStorage.setItem("apex_last_tab",t);}catch{}};
  const[authView,setAuthView]=useState("landing"); // landing|signup|login|forgot
  const[exIdx,setExIdx]=useState(0);const[reflectData,setReflectData]=useState(null);
  const[checkInData,setCheckInData]=useState(null);
  const[completedExercises,setCompletedExercises]=useState([]);
  const[sessionStart,setSessionStart]=useState(null);
  const[workout,setWorkout]=useState(defaultWorkout);
  const[workoutMode,setWorkoutMode]=useState("guided");
  const[difficulty,setDifficulty]=useState("standard");
  const[ptProtocol,setPtProtocol]=useState(null); // active PT protocol for mini-session
  const[reassessSnap,setReassessSnap]=useState(null); // pre-reassessment snapshot
  const[reassessDiff,setReassessDiff]=useState(null); // post-reassessment comparison
  const[showPause,setShowPause]=useState(false);
  const[showEndConfirm,setShowEndConfirm]=useState(false);
  // Dev bypass: add ?dev to URL to skip auth (dev mode only)
  const devBypass=import.meta.env.DEV&&new URLSearchParams(window.location.search).has("dev");
  // Route logic: auth state → screen
  useEffect(()=>{
    if(loading&&!devBypass)return;
    if(!user&&!devBypass){setScreen("auth");return;}
    if(!devBypass&&profile&&!profile.assessment_completed&&!hasCompletedAssessment()){setScreen("onboarding");return;}
    if(screen==="auth"||screen==="init"){const saved=(()=>{try{return localStorage.getItem("apex_last_screen");}catch{return null;}})();const restorable=new Set(["home","train","library","tasks","coach","profile","plan_view"]);if(saved&&restorable.has(saved)){setScreen(saved);}else{setScreen("home");}}
  },[user,profile,loading,devBypass]);
  // Check for paused workout on mount
  const[resumePrompt,setResumePrompt]=useState(null);
  useEffect(()=>{try{const raw=localStorage.getItem("apex_paused_workout");if(!raw)return;const pw=JSON.parse(raw);const age=(Date.now()-pw.pausedAt)/3600000;if(age>4){localStorage.removeItem("apex_paused_workout");return;}setResumePrompt(pw);}catch{}},[]);
  // Derive exercise list + phase boundaries from current workout
  const wxAll=workout.all, wxWEnd=workout.warmup.length, wxMEnd=wxWEnd+workout.main.length;
  const wxPhase=i=>i<wxWEnd?"warmup":i<wxMEnd?"main":"cooldown";
  const navTo=useCallback(t=>{setTab(t);if(t==="home")setScreen("home");else if(t==="train")setScreen("train");else if(t==="library")setScreen("library");else if(t==="tasks")setScreen("tasks");else if(t==="coach")setScreen("coach");},[]);
  const[safetyReport,setSafetyReport]=useState(null);
  const handleCheckIn=(data)=>{const loc=data?.location||"gym";const w=buildWorkoutList(CURRENT_PHASE,loc,difficulty,data);const vf=verifyAndFix(w);setWorkout(vf.plan);setSafetyReport(vf.report);setCheckInData(data);setExIdx(0);setCompletedExercises([]);setSessionStart(Date.now());setScreen("plan");setTab("train");if(data?.location)setPref("lastLocation",data.location);};
  const[exHistory,setExHistory]=useState([]); // [{idx, completedSnapshot}] for undo
  const trackExDone=(exercise,setData)=>{const ep2=exParams(exercise);const sets=setData?.sets||[{set_number:1,reps_done:parseInt(String(ep2.reps).replace(/[^0-9]/g,''))||12,load:null,rpe:null,pain:false,quality:"good"}];const bestLoad=Math.max(...sets.map(s=>s.load||0),0);const painDuring=sets.some(s=>s.pain);setCompletedExercises(prev=>[...prev,{exercise_id:exercise.id,sets_done:sets.length,sets,reps_done:ep2.reps||"—",load:bestLoad||null,pain_during:painDuring}]);recordExerciseCompletion(exercise.id,!painDuring);};
  const handleExDone=(setData)=>{setExHistory(h=>[...h,{idx:exIdx,snapshot:[...completedExercises]}]);trackExDone(wxAll[exIdx],setData);const n=exIdx+1;window.scrollTo(0,0);if(n>=wxAll.length){setScreen("reflect");return;}if(n===wxWEnd||n===wxMEnd){setExIdx(n);setScreen("mindfulness");return;}const mid=wxWEnd+Math.floor(workout.main.length/2);if(n===mid&&wxPhase(exIdx)==="main"){setExIdx(n);setScreen("mindfulness");return;}setExIdx(n);};
  const handleExBack=()=>{if(exHistory.length===0)return;const prev=exHistory[exHistory.length-1];setExHistory(h=>h.slice(0,-1));setExIdx(prev.idx);setCompletedExercises(prev.snapshot);setScreen("perform");};
  const getMT=()=>exIdx===wxWEnd?"warmupToMain":exIdx===wxMEnd?"mainToCooldown":"midSession";
  const buildSessionData=(reflData)=>({exercisesCompleted:completedExercises,exercisesSkipped:[],readiness:checkInData?{RTT:checkInData.readiness,CTP:checkInData.capacity,safety_level:checkInData.readiness>=70?"CLEAR":checkInData.readiness>=50?"CAUTION":checkInData.readiness>=30?"RESTRICTED":"STOP"}:{},checkIn:checkInData?{sleep:checkInData.sleep,soreness_areas:checkInData.soreness||[],energy:checkInData.energy,stress:checkInData.stress,location:checkInData.location}:{},reflection:{difficulty:reflData?.d||5,pain:reflData?.p||5,enjoyment:reflData?.e||5,form_confidence:reflData?.f||5},starred:reflData?.starred||[],flagged:reflData?.flagged||[],painFlagged:reflData?.painFlags||[],notes:reflData?.notes||"",durationMinutes:sessionStart?Math.round((Date.now()-sessionStart)/60000):0,overall:reflData?.overall||"just_right",difficulty});
  const reset=()=>{setScreen("home");setTab("home");setExIdx(0);setReflectData(null);setCompletedExercises([]);setSessionStart(null);setCheckInData(null);setDifficulty("standard");setExHistory([]);const a=getAssessment();const favs=a?.preferences?.favorites||[];if(favs.length)checkAutoAdvancements(favs);};
  // Loading spinner
  if(loading||screen==="init")return(<div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:C.bg}}><div style={{textAlign:"center"}}><div style={{fontSize:48,fontWeight:800,color:C.teal,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:6}}>APEX</div><div style={{fontSize:12,color:C.textDim,marginTop:8}}>Loading...</div></div></div>);
  return(<>
    {/* Auth screens (unauthenticated) */}
    {screen==="auth"&&authView==="landing"&&<LandingPage onSignUp={()=>setAuthView("signup")} onLogIn={()=>setAuthView("login")}/>}
    {screen==="auth"&&authView==="signup"&&<SignUpScreen onBack={()=>setAuthView("landing")} onSuccess={()=>{setAuthView("landing");setScreen("onboarding");}}/>}
    {screen==="auth"&&authView==="login"&&<LogInScreen onBack={()=>setAuthView("landing")} onForgot={()=>setAuthView("forgot")} onSuccess={()=>setScreen("home")}/>}
    {screen==="auth"&&authView==="forgot"&&<ForgotPasswordScreen onBack={()=>setAuthView("login")}/>}
    {/* App screens (authenticated) */}
    {screen==="onboarding"&&<OnboardingFlow onComplete={(data)=>{
      if(reassessSnap){
        // REASSESSMENT: process diff, preserve data, show comparison
        const diff=processReassessment(reassessSnap,data);
        setReassessDiff(diff);
        if(data&&user){saveAssessmentToSupabase(user.id,data).catch(()=>{});}
        // Rebuild workout with new assessment
        setWorkout(buildWorkoutList(diff.phaseChange?diff.phaseChange.newPhase:CURRENT_PHASE,"gym"));
        setReassessSnap(null);
        setScreen("reassess_summary");
      }else{
        // FIRST ASSESSMENT: normal flow
        if(data&&user){
          saveAssessmentToSupabase(user.id,data).catch(()=>{});
          const protocols=generateProtocols(data);
          if(protocols.length){saveLocalProtocols(protocols);saveProtocolsToSupabase(user.id,protocols).catch(()=>{});}
        }
        setScreen("assessment_summary");
      }
    }}/>}
    {screen==="reassess_summary"&&reassessDiff&&<ReassessmentSummary diff={reassessDiff} onContinue={()=>{setReassessDiff(null);setScreen("home");setTab("home");}}/>}
    {screen==="assessment_summary"&&<AssessmentSummary onContinue={()=>{setScreen("home");setTab("home");}} userName={profile?.first_name||USER.name}/>}
    {screen==="plan_view"&&<PlanView onClose={()=>setScreen("home")}/>}
    {screen==="extra_work"&&<ExtraWork workout={workout} onClose={()=>setScreen("train")} onAddExercises={(exs)=>{setWorkout(w=>({...w,addOns:exs,all:[...w.all,...exs]}));setScreen("train");}}/>}
    {screen==="injuries"&&<InjuryManager onClose={()=>setScreen("home")}/>}
    {screen==="profile"&&<ProfileScreen onClose={()=>setScreen("home")} onRetakeAssessment={()=>{setReassessSnap(capturePreReassessmentSnapshot());setScreen("onboarding");}} onEditInjuries={()=>setScreen("injuries")} onViewSummary={()=>setScreen("assessment_summary")} onViewPlan={()=>setScreen("plan_view")} onStartFresh={()=>{["apex_sessions","apex_prefs","apex_stats","apex_image_overrides","apex_exercise_progress","apex_unlock_notifications","apex_exercise_swaps","apex_overtraining","apex_cardio_sessions","apex_vo2_tests","apex_hr_settings","apex_pt_protocols","apex_pt_sessions","apex_assessment","apex_youtube_overrides","apex_injuries","apex_injury_history","apex_media_pref"].forEach(k=>localStorage.removeItem(k));setWorkout(defaultWorkout);setScreen("onboarding");}}/>}
    {/* Resume paused workout prompt */}
    {resumePrompt&&screen==="home"&&<Card glow={C.tealGlow} style={{margin:"0 0 8px",borderColor:C.teal+"40"}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}><span style={{fontSize:24}}>⏸️</span><div><div style={{fontSize:14,fontWeight:700,color:C.text}}>Unfinished Workout</div><div style={{fontSize:11,color:C.textMuted}}>{resumePrompt.completedExercises?.length||0} exercises done · {Math.round((Date.now()-resumePrompt.pausedAt)/60000)} min ago</div></div></div><div style={{display:"flex",gap:8}}><Btn size="sm" onClick={()=>{setWorkout(resumePrompt.workout);setExIdx(resumePrompt.exIdx);setCompletedExercises(resumePrompt.completedExercises||[]);setSessionStart(resumePrompt.sessionStart);setCheckInData(resumePrompt.checkInData);localStorage.removeItem("apex_paused_workout");setResumePrompt(null);setScreen("perform");}} style={{flex:2}}>Resume →</Btn><Btn size="sm" variant="dark" onClick={()=>{localStorage.removeItem("apex_paused_workout");setResumePrompt(null);}}>Discard</Btn></div></Card>}
    {screen==="home"&&<HomeScreen onStart={()=>setScreen("checkin")} onRetakeAssessment={()=>{setReassessSnap(capturePreReassessmentSnapshot());setScreen("onboarding");}} onEditInjuries={()=>setScreen("injuries")} onProfile={()=>setScreen("profile")} onViewPlan={()=>setScreen("plan_view")} onViewSummary={()=>setScreen("assessment_summary")} onPTSession={(p)=>{setPtProtocol(p);setScreen("pt_session");}} onPTProgress={()=>setScreen("pt_progress")}/>}
    {screen==="train"&&<TrainScreen onStart={()=>setScreen("checkin")} workout={workout} mode={workoutMode} onModeChange={setWorkoutMode} onExtraWork={()=>setScreen("extra_work")} onSwapExercise={(orig,alt)=>{setWorkout(w=>{const swap={...alt,_swappedFor:orig.name,_swapReason:"User requested alternative"};const newAll=w.all.map(e=>e.id===orig.id?swap:e);const newWarmup=(w.warmup||[]).map(e=>e.id===orig.id?swap:e);const newMain=(w.main||[]).map(e=>e.id===orig.id?swap:e);const newCooldown=(w.cooldown||[]).map(e=>e.id===orig.id?swap:e);const newBlocks={...w.blocks};if(newBlocks.inhibit)newBlocks.inhibit=newBlocks.inhibit.map(e=>e.id===orig.id?swap:e);if(newBlocks.lengthen)newBlocks.lengthen=newBlocks.lengthen.map(e=>e.id===orig.id?swap:e);if(newBlocks.cooldownStretches)newBlocks.cooldownStretches=newBlocks.cooldownStretches.map(e=>e.id===orig.id?swap:e);return{...w,all:newAll,warmup:newWarmup,main:newMain,cooldown:newCooldown,blocks:newBlocks};});}}/>}
    {screen==="checkin"&&<CheckInScreen onComplete={(data)=>handleCheckIn(data)}/>}
    {screen==="plan"&&<PlanScreen checkIn={checkInData} workout={workout} safetyReport={safetyReport} onGo={(d)=>{const dd=d||"standard";setDifficulty(dd);if(dd!=="standard"){const loc=checkInData?.location||"gym";setWorkout(buildWorkoutList(CURRENT_PHASE,loc,dd));}setScreen(workoutMode==="quick"?"quickmode":"perform");}}/>}
    {screen==="quickmode"&&<QuickModeScreen workout={workout} onComplete={(exDone)=>{setCompletedExercises(exDone);setScreen("reflect");}}/>}
    {screen==="perform"&&<ExerciseScreen exercise={wxAll[exIdx]} index={exIdx} total={wxAll.length} phase={wxPhase(exIdx)} onDone={handleExDone} onSub={handleExDone} onBack={exHistory.length>0?handleExBack:null} onEndEarly={()=>setShowEndConfirm(true)} onPause={()=>setShowPause(true)}/>}
    {/* End Early confirm */}
    {showEndConfirm&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setShowEndConfirm(false)}><div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:20,padding:24,maxWidth:360,width:"100%"}} onClick={e=>e.stopPropagation()}><div style={{fontSize:20,fontWeight:800,color:C.text,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:2,marginBottom:8}}>END SESSION EARLY?</div><div style={{fontSize:13,color:C.textMuted,lineHeight:1.6,marginBottom:16}}>Your {completedExercises.length} completed exercise{completedExercises.length!==1?"s":""} will be saved. Remaining exercises will be logged as skipped.</div><div style={{display:"flex",gap:8}}><button onClick={()=>setShowEndConfirm(false)} style={{flex:1,padding:"12px",borderRadius:12,background:C.bgElevated,border:`1px solid ${C.border}`,color:C.textMuted,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Keep Going</button><button onClick={()=>{setShowEndConfirm(false);localStorage.removeItem("apex_paused_workout");setScreen("reflect");}} style={{flex:1,padding:"12px",borderRadius:12,background:C.danger,border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>End & Save</button></div></div></div>}
    {/* Pause overlay */}
    {showPause&&<div style={{position:"fixed",inset:0,background:"rgba(6,11,24,0.95)",zIndex:500,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20}}><div style={{fontSize:64}}>⏸️</div><div style={{fontSize:28,fontWeight:800,color:C.text,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:3}}>WORKOUT PAUSED</div><div style={{fontSize:13,color:C.textMuted}}>Exercise {exIdx+1}/{wxAll.length} · {completedExercises.length} completed</div>{sessionStart&&<div style={{fontSize:12,color:C.textDim}}>{Math.round((Date.now()-sessionStart)/60000)} min elapsed</div>}<Btn onClick={()=>{setShowPause(false);}} style={{maxWidth:300}} icon="▶">Resume Workout</Btn><Btn variant="dark" onClick={()=>{setShowPause(false);setShowEndConfirm(true);}} style={{maxWidth:300}} icon="🛑">End Workout</Btn><button onClick={()=>{try{localStorage.setItem("apex_paused_workout",JSON.stringify({exIdx,completedExercises,workout,sessionStart,checkInData,pausedAt:Date.now()}));}catch{}setShowPause(false);setScreen("home");setTab("home");}} style={{background:"none",border:"none",color:C.textDim,fontSize:12,cursor:"pointer",marginTop:8,fontFamily:"inherit"}}>Save & exit — resume later</button></div>}
    {screen==="mindfulness"&&<Mindfulness type={getMT()} onContinue={()=>setScreen("perform")}/>}
    {screen==="reflect"&&<ReflectScreen exercisesDone={completedExercises} onComplete={d=>{setReflectData(d);setScreen("recap");}}/>}
    {screen==="recap"&&<RecapScreen onFinish={reset} sessionData={reflectData?buildSessionData(reflectData):null}/>}
    {screen==="coach"&&<CoachScreen/>}
    {screen==="library"&&<LibraryScreen/>}
    {screen==="tasks"&&<TasksScreen/>}
    {screen==="pt_session"&&ptProtocol&&<PTMiniSession protocol={ptProtocol} onComplete={()=>{setScreen("home");setTab("home");setPtProtocol(null);}} onClose={()=>{setScreen("home");setTab("home");setPtProtocol(null);}}/>}
    {screen==="pt_progress"&&<PTProgressPage onClose={()=>{setScreen("home");setTab("home");}} onStartSession={(p)=>{setPtProtocol(p);setScreen("pt_session");}}/>}
    {screen!=="auth"&&screen!=="profile"&&<BottomNav active={tab} onNav={navTo}/>}
  </>);
}

// ── MAIN (wrapped in AuthProvider) ──────────────────────────────
export default function ApexCoach(){
  return(<AuthProvider><div style={{fontFamily:"'DM Sans',-apple-system,sans-serif",background:C.bg,color:C.text,minHeight:"100vh",maxWidth:480,margin:"0 auto",padding:"20px 16px 40px",boxSizing:"border-box"}}>
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
    <style>{`input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:${C.teal};cursor:pointer;border:3px solid ${C.bg};box-shadow:0 0 10px ${C.tealGlow}}input[type="range"]::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:${C.teal};cursor:pointer;border:3px solid ${C.bg}}*{box-sizing:border-box}@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}`}</style>
    <AppInner/>
  </div></AuthProvider>);
}
