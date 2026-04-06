import { useState, useMemo } from "react";
import conditionsDB from "../data/conditions.json";
import compensationsDB from "../data/compensations.json";
import exerciseDB from "../data/exercises.json";
import ExerciseImage from "./ExerciseImage.jsx";

// ═══════════════════════════════════════════════════════════════
// APEX Coach — Onboarding Assessment (14 screens)
// PAR-Q+ → Conditions → Pain Behavior → Directional Pref →
// Pain Timeline → Functional Limitations → Treatment History →
// Medications → Red Flags → Movement Screen → ROM → Goals →
// Preferences → Summary → generates first training plan
// ═══════════════════════════════════════════════════════════════

const STORAGE_KEY = "apex_assessment";

export function getAssessment() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
}
export function saveAssessment(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, completedAt: new Date().toISOString() }));
}
export function hasCompletedAssessment() {
  return !!getAssessment()?.completedAt;
}

// ── Shared styles (match App.jsx C object) ────────────────────
const C={bg:"#060b18",bgCard:"#0d1425",bgElevated:"#162040",bgGlass:"rgba(255,255,255,0.04)",border:"rgba(255,255,255,0.08)",text:"#e8ecf4",textMuted:"#7a8ba8",textDim:"#4a5a78",teal:"#00d2c8",tealGlow:"rgba(0,210,200,0.15)",tealDark:"#00a89f",tealBg:"rgba(0,210,200,0.08)",success:"#22c55e",danger:"#ef4444",warning:"#eab308",info:"#3b82f6",orange:"#f97316",purple:"#a855f7",purpleGlow:"rgba(168,85,247,0.12)"};
const Card=({children,style,onClick})=><div onClick={onClick} style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:14,padding:14,cursor:onClick?"pointer":"default",...style}}>{children}</div>;
const Btn=({children,onClick,disabled,style,variant="teal",icon})=>{const v={teal:{background:`linear-gradient(135deg,${C.teal},${C.tealDark})`,color:"#000",fontWeight:700},dark:{background:C.bgElevated,color:C.text,border:`1px solid ${C.border}`}};return<button onClick={onClick} disabled={disabled} style={{...v[variant],padding:"12px 20px",borderRadius:12,fontSize:14,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.4:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,width:"100%",fontFamily:"inherit",border:v[variant]?.border||"none",...style}}>{icon&&<span>{icon}</span>}{children}</button>;};
const Badge=({children,color=C.teal})=><span style={{display:"inline-flex",padding:"4px 10px",borderRadius:8,fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color,background:color+"15",border:`1px solid ${color}25`}}>{children}</span>;
const ProgressBar=({value,max=100,color=C.teal,height=6})=><div style={{width:"100%",height,background:C.border,borderRadius:height/2,overflow:"hidden"}}><div style={{width:`${Math.min(100,(value/max)*100)}%`,height:"100%",background:color,borderRadius:height/2,transition:"width 0.4s ease"}}/></div>;

const CONDITION_CATEGORIES = [
  {id:"spinal",label:"Spine & Back",icon:"🔙",locations:["Upper Back","Mid Back","Lower Back","Tailbone","Left Side","Right Side"]},
  {id:"joint",label:"Joints (Knee, Shoulder, Hip, etc.)",icon:"🦴",locations:["Left Knee","Right Knee","Left Shoulder","Right Shoulder","Left Hip","Right Hip","Left Ankle","Right Ankle","Left Elbow","Right Elbow","Left Wrist","Right Wrist"]},
  {id:"systemic",label:"Autoimmune & Systemic",icon:"🧬"},
  {id:"neurological",label:"Neurological",icon:"🧠"},
  {id:"cardiopulmonary",label:"Heart & Lungs",icon:"🫀"},
  {id:"metabolic",label:"Metabolic & Endocrine",icon:"⚗️"},
  {id:"mental_health",label:"Mental Health",icon:"💆"},
  {id:"pregnancy",label:"Pregnancy & Postpartum",icon:"🤰"},
  {id:"age_related",label:"Age-Related",icon:"👴"},
  {id:"amputation",label:"Amputation / Limb Difference",icon:"🦿"},
];

const CONDITION_TYPES = ["Chronic Pain","Acute Injury","Post-Surgical","Managing"];

// ── Per-condition anatomically correct locations ─────────────
const CONDITION_LOCATIONS = {
  // Spinal — lumbar
  A1:["Lower Back","Left Side","Right Side"], A3:["Lower Back","Left Side","Right Side"],
  A4:["Lower Back","Left Side","Right Side"], A7:["Lower Back"], A8:["Lower Back"],
  A12:["Lower Back","Left Side","Right Side"], A16:["Lower Back"],
  A19:["Lower Back","Left Side","Right Side"], A21:["Lower Back","Left Side","Right Side"],
  // Spinal — cervical
  A2:["Neck","Left Side","Right Side"], A5:["Neck","Left Side","Right Side"],
  A10:["Neck","Left Side","Right Side"], A11:["Neck"],
  // Spinal — multi-region
  A6:["Cervical","Thoracic","Lumbar"], A9:["Cervical","Thoracic","Lumbar"],
  A14:["Cervical","Thoracic","Lumbar","Full Spine"],
  A15:["Upper Back","Mid Back"], A17:["Upper Back","Mid Back","Lower Back"],
  A20:["Neck","Upper Back","Left Side","Right Side"],
  // Spinal — specific
  A13:["Left Side","Right Side"], A18:["Tailbone"],
  // Joint — knee
  B1:["Left Knee","Right Knee"], B2:["Left Knee","Right Knee"], B3:["Left Knee","Right Knee"],
  B4:["Left Knee","Right Knee"], B5:["Left Knee","Right Knee"], B30:["Left Knee","Right Knee"],
  // Joint — shoulder
  B6:["Left Shoulder","Right Shoulder"], B7:["Left Shoulder","Right Shoulder"],
  B8:["Left Shoulder","Right Shoulder"], B9:["Left Shoulder","Right Shoulder"],
  B10:["Left Shoulder","Right Shoulder"], B26:["Left Shoulder","Right Shoulder"],
  B27:["Left Shoulder","Right Shoulder"], B28:["Left Shoulder","Right Shoulder"],
  // Joint — hip
  B11:["Left Hip","Right Hip"], B12:["Left Hip","Right Hip"], B13:["Left Hip","Right Hip"],
  B14:["Left Hip","Right Hip"], B15:["Left Hip","Right Hip"],
  // Joint — ankle
  B16:["Left Ankle","Right Ankle"], B17:["Left Ankle","Right Ankle"], B23:["Left Ankle","Right Ankle"],
  // Joint — elbow
  B18:["Left Elbow","Right Elbow"], B19:["Left Elbow","Right Elbow"],
  // Joint — wrist
  B20:["Left Wrist","Right Wrist"], B21:["Left Wrist","Right Wrist"],
  // Joint — foot
  B22:["Left Foot","Right Foot"],
  // Joint — jaw
  B24:["Left Side","Right Side","Both"],
  // Joint — hand
  B25:["Left Hand","Right Hand"], B29:["Left Hand","Right Hand"],
  // Climbing — finger
  CLIMB1:["Left Index","Left Middle","Left Ring","Left Pinky","Right Index","Right Middle","Right Ring","Right Pinky"],
  CLIMB2:["Left Index","Left Middle","Left Ring","Left Pinky","Right Index","Right Middle","Right Ring","Right Pinky"],
  CLIMB3:["Left Index","Left Middle","Left Ring","Left Pinky","Right Index","Right Middle","Right Ring","Right Pinky"],
  CLIMB4:["Left Index","Left Middle","Left Ring","Left Pinky","Right Index","Right Middle","Right Ring","Right Pinky"],
  CLIMB5:["Left Index","Left Middle","Left Ring","Left Pinky","Right Index","Right Middle","Right Ring","Right Pinky"],
  // Amputation
  J1:["Left Leg","Right Leg","Below Knee","Above Knee"],
  J2:["Left Arm","Right Arm","Below Elbow","Above Elbow"],
};

// ── Category-specific sub-question configs ───────────────────
const CATEGORY_SUBQUESTIONS = {
  spinal: {
    statusLabel: "Status", statusOptions: ["Post-Surgical","Rehabilitating","Managing","Resolved but monitoring"],
    showSeverity: true,
  },
  joint: {
    statusLabel: "Status", statusOptions: ["Post-Surgical","Rehabilitating","Managing","Resolved but monitoring"],
    showSeverity: true,
  },
  climbing_finger: {
    statusLabel: "Status", statusOptions: ["Post-Surgical","Rehabilitating","Managing","Resolved but monitoring"],
    showSeverity: true,
  },
  neurological: {
    statusLabel: "Status", statusOptions: ["Newly diagnosed","Stable on medication","Progressive","In remission"],
    showSeverity: true,
  },
  mental_health: {
    statusLabel: "Status", statusOptions: ["Currently experiencing","Managing with treatment","In recovery","Mild-occasional"],
    extraFields: [
      { label:"Impact on exercise", key:"impact", options:["Affects my motivation","Affects my energy","Affects my sleep","Minimal impact"] },
    ],
    showSeverity: false,
  },
  systemic: {
    statusLabel: "Status", statusOptions: ["Active flare","Stable","In remission","Newly diagnosed"],
    extraFields: [
      { label:"Flare frequency", key:"flareFreq", options:["Daily","Weekly","Monthly","Rarely"] },
    ],
    showSeverity: true,
  },
  cardiopulmonary: {
    statusLabel: "Status", statusOptions: ["Controlled with medication","Uncontrolled","Newly diagnosed","Stable"],
    extraFields: [
      { label:"Medical clearance", key:"clearance", options:["Cleared for exercise","Awaiting clearance","No clearance yet"] },
      { label:"Medication affecting HR", key:"hrMeds", options:["Beta-blockers","Other cardiac meds","None"] },
    ],
    showSeverity: false,
  },
  metabolic: {
    statusLabel: "Status", statusOptions: ["Well controlled","Partially controlled","Uncontrolled"],
    extraFields: [
      { label:"Monitoring", key:"monitoring", options:["Blood glucose","A1C","Thyroid levels"] },
    ],
    showSeverity: false,
  },
  pregnancy: {
    statusLabel: "Status", statusOptions: ["Currently pregnant","Postpartum < 6 weeks","Postpartum 6+ weeks","Planning pregnancy"],
    showSeverity: false,
  },
  age_related: {
    statusLabel: "Status", statusOptions: ["Mild","Moderate","Significant","Progressive"],
    showSeverity: true,
  },
  amputation: {
    statusLabel: "Status", statusOptions: ["Recent (< 1 year)","Established (1+ years)","With prosthetic","Without prosthetic"],
    showSeverity: false,
  },
};

// Categories where pain behavior / pain timeline screens apply
const PAIN_APPLICABLE_CATEGORIES = new Set(["spinal","joint","climbing_finger"]);

const MENTAL_HEALTH_CONDITIONS = [
  "Depression","Generalized Anxiety","Social Anxiety","Panic Disorder","PTSD","ADHD","OCD",
  "Bipolar Disorder","Insomnia","Chronic Stress","Burnout","Grief","Eating Disorder (in recovery)",
  "Substance Recovery","Seasonal Affective Disorder","Agoraphobia","Body Dysmorphia",
  "Anger Management","Chronic Fatigue","Autism Spectrum",
];

const COMPENSATIONS = [
  {id:"comp_knees_cave_in",q:"Do your knees cave inward when you squat?",icon:"🦵"},
  {id:"comp_feet_turn_out",q:"Do your feet turn out (duck feet) during squats?",icon:"🦶"},
  {id:"comp_excessive_forward_lean",q:"Do you lean forward excessively when squatting?",icon:"🏋️"},
  {id:"comp_low_back_arch",q:"Does your lower back arch excessively during movements?",icon:"🔙"},
  {id:"comp_arms_fall_forward",q:"Do your arms fall forward during overhead movements?",icon:"💪"},
  {id:"comp_shoulders_elevate",q:"Do your shoulders rise toward your ears during exercise?",icon:"🤷"},
  {id:"comp_head_forward",q:"Does your head push forward past your shoulders?",icon:"😐"},
];

const MUSCLE_GROUPS = [
  {id:"chest",label:"Chest",icon:"🫁"},
  {id:"back",label:"Back",icon:"🔙"},
  {id:"shoulders",label:"Shoulders",icon:"💪"},
  {id:"arms",label:"Arms (Biceps/Triceps)",icon:"💪"},
  {id:"legs",label:"Legs (Quads/Hamstrings)",icon:"🦵"},
  {id:"glutes",label:"Glutes",icon:"🍑"},
  {id:"core",label:"Core",icon:"⚫"},
];

const GOAL_OPTIONS = [
  {v:"size",l:"Size",c:"#a855f7"},{v:"strength",l:"Strength",c:"#00d2c8"},{v:"endurance",l:"Endurance",c:"#3b82f6"},
  {v:"maintain",l:"Maintain",c:"#7a8ba8"},
];

const COMPENSATORY_LOGIC = {
  chest: { triggers:["size","strength"], add: ["shoulders","back"], reason: "Chest growth requires rear delt + rotator cuff work to prevent shoulder impingement" },
  back: { triggers:["size","strength"], add: ["core"], reason: "Back strength requires core stability to protect the spine under load" },
  shoulders: { triggers:["size","strength"], add: ["back"], reason: "Shoulder development requires upper back balance (2:1 pull-to-push ratio)" },
  legs: { triggers:["size","strength","endurance"], add: ["glutes","core"], reason: "Leg work requires glute activation and core stability for safe movement" },
  glutes: { triggers:["size","strength"], add: ["core","legs"], reason: "Glute development requires hip stabilizer and hamstring balance" },
};

const PARQ_QUESTIONS = [
  "Has a doctor ever said you have a heart condition and should only do physical activity recommended by a doctor?",
  "Do you feel pain in your chest when you do physical activity?",
  "In the past month, have you had chest pain when you were NOT doing physical activity?",
  "Do you lose your balance because of dizziness or do you ever lose consciousness?",
  "Do you have a bone or joint problem that could be made worse by a change in your physical activity?",
  "Is your doctor currently prescribing drugs for your blood pressure or heart condition?",
  "Do you know of any other reason why you should not do physical activity?",
];

const HOME_EQUIPMENT_OPTIONS = [
  {id:"band",label:"Resistance Bands"},
  {id:"dumbbell",label:"Dumbbells"},
  {id:"kettlebell",label:"Kettlebell"},
  {id:"pull_up_bar",label:"Pull-Up Bar"},
  {id:"foam_roller",label:"Foam Roller"},
  {id:"mat",label:"Exercise Mat"},
  {id:"bench",label:"Bench / Step"},
  {id:"stability_ball",label:"Stability Ball"},
  {id:"trx",label:"TRX / Suspension Trainer"},
  {id:"medicine_ball",label:"Medicine Ball"},
  {id:"bosu_ball",label:"BOSU Ball"},
  {id:"box",label:"Plyo Box / Step Box"},
  {id:"grip_ball",label:"Grip/Stress Ball"},
  {id:"ab_wheel",label:"Ab Wheel"},
  {id:"jump_rope",label:"Jump Rope"},
  {id:"none",label:"None — bodyweight only"},
];

const SPORTS = ["Basketball","Soccer","Baseball/Softball","Tennis","Golf","Swimming","Running/Track","Cycling","Hiking","Rock Climbing","CrossFit","Boxing/Kickboxing","MMA/BJJ","Wrestling","Volleyball","Football","Yoga","Pilates","Dance","Rowing","Skiing/Snowboarding","Surfing","Skateboarding","Pickleball","Martial Arts","Muay Thai","None"];

// 40 most common exercises — mapped to closest DB IDs
const FAVORITE_GRID = [
  {name:"Bench Press",emoji:"🏋️",dbId:"str_db_bench_press"},{name:"Squat",emoji:"🏋️",dbId:"str_bw_squat"},
  {name:"Deadlift",emoji:"🏋️",dbId:"str_trap_bar_dl_high"},{name:"Pull-Ups",emoji:"🤸",dbId:"outdoor_playground_pullup"},
  {name:"Push-Ups",emoji:"💪",dbId:"str_floor_push_up"},{name:"Lunges",emoji:"🦿",dbId:"dyn_walking_lunges"},
  {name:"Shoulder Press",emoji:"🏋️",dbId:"seated_shoulder_press"},{name:"Bicep Curls",emoji:"💪",dbId:"iso_bicep_curl"},
  {name:"Tricep Dips",emoji:"🪑",dbId:"seated_chair_dips"},{name:"Lat Pulldown",emoji:"🔽",dbId:"band_lat_pulldown"},
  {name:"Rows",emoji:"🚣",dbId:"str_chest_supported_row"},{name:"Plank",emoji:"🧱",dbId:"stab_plank"},
  {name:"Leg Press",emoji:"🦵",dbId:"rehab_sl_leg_press"},{name:"Calf Raises",emoji:"🦶",dbId:"iso_calf_raise"},
  {name:"Face Pulls",emoji:"🎯",dbId:"iso_face_pulls"},{name:"Romanian Deadlift",emoji:"🔽",dbId:"str_db_rdl"},
  {name:"Bulgarian Split Squat",emoji:"🦿",dbId:"str_bss_bw"},{name:"Goblet Squat",emoji:"🏆",dbId:"str_goblet_squat"},
  {name:"Hip Thrust",emoji:"🍑",dbId:"band_hip_thrust"},{name:"Glute Bridge",emoji:"🍑",dbId:"str_glute_bridge"},
  {name:"Farmer Carry",emoji:"🧑‍🌾",dbId:"func_farmer_carry_bilateral"},{name:"KB Swing",emoji:"🔔",dbId:"kb_swing"},
  {name:"Box Jump",emoji:"📦",dbId:"sport_box_jump"},{name:"Battle Ropes",emoji:"🪢",dbId:"sport_battle_ropes"},
  {name:"Med Ball Slam",emoji:"⚡",dbId:"sport_med_ball_slam"},{name:"Turkish Get-Up",emoji:"🏋️",dbId:"kb_turkish_getup"},
  {name:"Ab Wheel",emoji:"🎡",dbId:"core_ab_wheel"},{name:"Cable Fly",emoji:"🦅",dbId:"band_chest_press"},
  {name:"Lateral Raise",emoji:"🤷",dbId:"iso_lateral_raise"},{name:"Front Raise",emoji:"💪",dbId:"iso_lateral_raise"},
  {name:"Hammer Curl",emoji:"💪",dbId:"iso_bicep_curl"},{name:"Skull Crusher",emoji:"💀",dbId:"iso_tricep_pushdown"},
  {name:"Leg Curl",emoji:"🦵",dbId:"band_hamstring_curl"},{name:"Leg Extension",emoji:"🦵",dbId:"seated_leg_ext"},
  {name:"Step-Ups",emoji:"⬆️",dbId:"outdoor_bench_stepup"},{name:"Walking Lunges",emoji:"🚶",dbId:"dyn_walking_lunges"},
  {name:"Incline Bench",emoji:"📐",dbId:"str_incline_push_up"},{name:"Dips",emoji:"🪑",dbId:"seated_chair_dips"},
  {name:"Chin-Ups",emoji:"🤸",dbId:"outdoor_playground_pullup"},{name:"Barbell Row",emoji:"🚣",dbId:"str_inverted_row"},
];

// ═══════════════════════════════════════════════════════════════

export default function OnboardingFlow({ onComplete, initialData }) {
  const isReassessment = !!initialData;
  const _d = initialData || {};
  const _p = _d.preferences || {};
  // Intro screen: show only for first-time users who haven't seen it
  const _introSeen = isReassessment || !!localStorage.getItem("apex_intro_seen");
  const [showIntro, setShowIntro] = useState(!_introSeen);
  const [screen, _setScreen] = useState(0);
  const setScreen = (s) => { _setScreen(s); window.scrollTo(0, 0); };
  const [parq, setParq] = useState(_d.parq?.answers || PARQ_QUESTIONS.map(() => null));
  const [parqWarning, setParqWarning] = useState(!!_d.parq?.clearedWithCaution);
  const [conditions, setConditions] = useState(_d.conditions || []); // [{conditionId, severity}]
  const [condCatOpen, setCondCatOpen] = useState(null);
  const [condSearch, setCondSearch] = useState("");
  const [customCondText, setCustomCondText] = useState("");
  // Build full flat conditions list for search (memoized)
  const allConditions = useMemo(() => {
    const fromDB = conditionsDB.map(c => ({ id: c.id, name: c.name, category: c.category }));
    const fromMH = MENTAL_HEALTH_CONDITIONS.map(mh => ({ id: "mh_" + mh.toLowerCase().replace(/[^a-z]/g, "_"), name: mh, category: "mental_health" }));
    return [...fromDB, ...fromMH];
  }, []);
  const [compensations, setCompensations] = useState(() => {
    if (_d.compensations?.length) { const m = {}; _d.compensations.forEach(id => { m[id] = true; }); return m; }
    return {};
  }); // {comp_id: true/false}
  const _romDefault = { neck:"full", cervical_retraction:"full", thoracic:"full", lumbar:"full", lumbar_ext:"full", lumbar_flex:"full", shoulders:"full", elbows:"full", wrists:"full", hip_flexion:"full", hip_ir:"full", hip_er:"full", hip_ext:"full", knee_left:"full", knee_right:"full", ankles:"full", feet:"full" };
  const [rom, setRom] = useState(_d.rom ? { ..._romDefault, ..._d.rom } : _romDefault);
  const [goals, setGoals] = useState(_d.goals || {}); // {muscle: ["size","injury_prevention",...]}
  const [physiqueCategory, setPhysiqueCategory] = useState(_d.physiqueCategory || null);
  const [hypertrophyExperience, setHypertrophyExperience] = useState(_d.hypertrophyExperience || null);
  const [weakPoints, setWeakPoints] = useState(_d.weakPoints || []);
  const [prefs, setPrefs] = useState({
    daysPerWeek: _p.daysPerWeek || 3, sessionTime: _p.sessionTime || 45,
    homeEquipment: _p.homeEquipment || [], favorites: _p.favorites || [],
    blacklist: _p.blacklist || [], blacklistCustom: "", sports: _p.sports || [], customSport: "",
    ..._p.strengthLevel ? { strengthLevel: _p.strengthLevel } : {},
  });
  const [search, setSearch] = useState("");

  // ── Training experience + recency (detraining assessment) ──
  const [trainingExperience, setTrainingExperience] = useState(_d.trainingExperience || null);
  const [trainingRecency, setTrainingRecency] = useState(_d.trainingRecency || null);
  const [trainingHistory, setTrainingHistory] = useState(_d.trainingHistory || null);

  // ── New clinical assessment state ──────────────────────────
  const [painBehaviors, setPainBehaviors] = useState(_d.painBehaviors || {}); // {conditionId: {painType, worstTime, triggers[], relievers[], trend}}
  const [directionalPrefs, setDirectionalPrefs] = useState(_d.directionalPreferences || {}); // {conditionId: {extension, flexion, centralization}}
  const [painTimelines, setPainTimelines] = useState(_d.painTimelines || {}); // {conditionId: {onset, injuryType, surgery, surgeryTimeAgo}}
  const [funcLimitations, setFuncLimitations] = useState(_d.functionalLimitations || {});
  const [treatmentHistory, setTreatmentHistory] = useState(_d.treatmentHistory || { seenPT: null, whatHelped: "", whatWorse: "", currentPT: null, doctorCleared: null });
  const [medications, setMedications] = useState(_d.medications || []);
  const [redFlags, setRedFlags] = useState(_d.redFlags || []);
  const [redFlagCleared, setRedFlagCleared] = useState(!!_d.redFlagCleared);

  const anyParqYes = parq.some(a => a === true);
  const detectedComps = Object.entries(compensations).filter(([, v]) => v).map(([k]) => compensationsDB.find(c => c.id === k)).filter(Boolean);

  // Determine fitness level + progression rate from experience, recency, conditions
  // NASM detraining: recency matters more than history for starting point
  const { fitnessLevel, progressionRate, detrainingNote } = useMemo(() => {
    const condCount = conditions.length;
    const compCount = detectedComps.length;

    // Experience score: 0-3
    const expScore = trainingExperience === "professional" ? 3 : trainingExperience === "performance" ? 2 : trainingExperience === "building" ? 1 : 0;
    // Recency score: 0-4 (recent training is the dominant factor)
    const recScore = trainingRecency === "very_consistent" ? 4 : trainingRecency === "consistent" ? 3 : trainingRecency === "somewhat" ? 2 : trainingRecency === "occasional" ? 1 : 0;
    // History score: 0-4 (affects progression speed, not starting point)
    const histScore = trainingHistory === "years" ? 4 : trainingHistory === "6_plus_months" ? 3 : trainingHistory === "3_6_months" ? 2 : trainingHistory === "1_3_months" ? 1 : 0;

    // Conditions/compensations cap the level regardless of experience
    const condCap = condCount >= 3 || compCount >= 4 ? "beginner" : condCount >= 2 || compCount >= 3 ? "intermediate" : null;

    let level, rate, note;

    // NASM detraining rules applied to recency:
    // recScore 0 (none in 6wk = 6+ weeks off) → significant detraining, near-beginner start
    // recScore 1 (occasional) → 4+ weeks off effectively, measurable strength loss
    // recScore 2+ → currently training, credit for experience

    if (recScore >= 3 && expScore >= 2) {
      // Currently consistent + experienced → full credit
      level = "advanced"; rate = "standard"; note = null;
    } else if (recScore >= 2 && expScore >= 1) {
      // Somewhat consistent + some experience → intermediate
      level = "intermediate"; rate = "standard"; note = null;
    } else if (recScore <= 1 && expScore >= 2) {
      // Experienced but NOT training recently → detraining applies
      // Start at intermediate but with accelerated progression (muscle memory)
      level = "intermediate";
      rate = "accelerated"; // Faster phase progression: 3-4 weeks instead of 6-8
      note = expScore >= 3
        ? "You have professional experience but haven't trained consistently recently. Starting moderate with accelerated progression — your body remembers the movements."
        : "You have solid experience but need to rebuild your base. Progressing faster than a beginner — you'll be back in 4-6 weeks.";
    } else if (recScore <= 1 && expScore <= 1) {
      // Limited experience AND not training → true beginner approach
      level = "beginner"; rate = "standard";
      note = histScore >= 2 ? "Some training history detected — we'll progress at a steady pace as your body adapts." : null;
    } else {
      // Default: somewhat active with some background
      level = "intermediate"; rate = "standard"; note = null;
    }

    // Condition/compensation cap overrides
    if (condCap === "beginner" || (condCap === "intermediate" && level === "advanced")) {
      if (level === "advanced" || level === "intermediate") rate = rate === "accelerated" ? "accelerated" : "standard";
      level = condCap;
    }

    return { fitnessLevel: level, progressionRate: rate, detrainingNote: note };
  }, [conditions, detectedComps, trainingExperience, trainingRecency, trainingHistory]);

  const startingPhase = fitnessLevel === "beginner" ? 1 : fitnessLevel === "intermediate" ? 1 : 2;

  // Compensatory muscle additions (multi-select aware)
  const compensatoryAdds = useMemo(() => {
    const adds = [];
    Object.entries(goals).forEach(([muscle, goalArr]) => {
      const ga = Array.isArray(goalArr) ? goalArr : [goalArr];
      if (COMPENSATORY_LOGIC[muscle] && ga.some(g => (COMPENSATORY_LOGIC[muscle].triggers||[]).includes(g))) {
        const cl = COMPENSATORY_LOGIC[muscle];
        cl.add.forEach(a => {
          if (!adds.find(x => x.muscle === a && x.trigger === muscle)) {
            adds.push({ muscle: a, trigger: muscle, reason: cl.reason });
          }
        });
      }
    });
    return adds;
  }, [goals]);

  const handleComplete = () => {
    const data = {
      parq: { answers: parq, anyYes: anyParqYes, clearedWithCaution: parqWarning && anyParqYes },
      conditions,
      painBehaviors,
      directionalPreferences: directionalPrefs,
      painTimelines,
      functionalLimitations: funcLimitations,
      treatmentHistory,
      medications,
      redFlags,
      redFlagCleared,
      compensations: detectedComps.map(c => c.id),
      rom,
      goals,
      physiqueCategory,
      hypertrophyExperience,
      weakPoints,
      compensatoryAdditions: compensatoryAdds,
      fitnessLevel,
      progressionRate,
      detrainingNote,
      trainingExperience,
      trainingRecency,
      trainingHistory,
      startingPhase,
      preferences: prefs,
    };
    saveAssessment(data);
    onComplete(data);
  };

  const hasConditions = conditions.length > 0;
  const hasPainConditions = conditions.some(c => PAIN_APPLICABLE_CATEGORIES.has(c.category));
  const painConditions = conditions.filter(c => PAIN_APPLICABLE_CATEGORIES.has(c.category));
  const hasSpinalConditions = conditions.some(c => c.category === "spinal");
  const hasRedFlags = redFlags.length > 0;

  // Screens: 0=PAR-Q, 1=Conditions, 2=PainBehavior, 3=DirectionalPref, 4=PainTimeline,
  // 5=FunctionalLimitations, 6=PreviousTreatment, 7=Medications, 8=RedFlags,
  // 9=Movement, 10=ROM, 11=Goals, 12=Preferences, 13=Summary
  const totalScreens = 14;
  const shouldSkip = (s) => {
    if (s === 2 && !hasPainConditions) return true; // Pain behavior — only musculoskeletal
    if (s === 3 && !hasSpinalConditions) return true; // Directional pref — only spinal
    if (s === 4 && !hasPainConditions) return true; // Pain timeline — only musculoskeletal
    return false;
  };
  const next = () => setScreen(s => { let n = s + 1; while (n < totalScreens && shouldSkip(n)) n++; return Math.min(n, totalScreens - 1); });
  const prev = () => setScreen(s => { let n = s - 1; while (n > 0 && shouldSkip(n)) n--; return Math.max(n, 0); });

  // "Why are we asking?" helper
  const WHY_TEXTS = {
    0: "The PAR-Q+ is a standard pre-exercise screening used worldwide. It identifies anything that needs medical clearance before you start training.",
    1: "Each condition has specific exercises to avoid and specific protocols that help. The more accurate you are, the safer and more effective your plan.",
    5: "Functional limitations help us understand what movements need modification. We adapt every exercise to what YOUR body can do right now.",
    7: "Some medications affect how your body responds to exercise. Beta-blockers change your heart rate response, blood thinners mean we adjust foam rolling intensity.",
    8: "Red flags are symptoms that need medical evaluation before exercise. This protects you — not a diagnosis, just a safety gate.",
    9: "Movement compensations tell us which muscles are overactive or underactive. We use this to build corrective warm-ups specific to your patterns.",
    10: "Limited range of motion means certain exercises need modification. We adapt every movement to what YOUR body can currently do safely.",
    11: "Your goals shape exercise selection, volume, and progression speed. We balance what you want with what your body needs right now.",
    12: "Training frequency, session length, and equipment determine which exercises make it into your plan and how volume is distributed across your week.",
  };
  const WhyHelper = ({ screenNum }) => {
    const [open, setOpen] = useState(false);
    const text = WHY_TEXTS[screenNum];
    if (!text) return null;
    return (<div style={{ marginBottom: 4 }}>
      <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", color: C.info, fontSize: 15, cursor: "pointer", fontFamily: "inherit", padding: 0, opacity: 0.8 }}>{open ? "Hide" : "Why are we asking this?"}</button>
      {open && <div style={{ fontSize: 16, color: C.textMuted, lineHeight: 1.6, padding: "6px 0", marginTop: 4 }}>{text}</div>}
    </div>);
  };

  return (
    <div className="fade-in safe-bottom" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── INTRO / WELCOME SCREEN (first-time only) ──────── */}
      {showIntro && <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ textAlign: "center", paddingTop: 8 }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: C.teal, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 6 }}>APEX COACH</div>
          <div style={{ fontSize: 16, color: C.text, fontWeight: 600, marginTop: 6 }}>This isn't your average workout app.</div>
        </div>
        <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.7, textAlign: "center", padding: "0 4px" }}>
          Most fitness apps give everyone the same generic plan. APEX builds a plan scientifically designed around <em>your</em> body — factoring in your conditions, goals, movement limitations, and sport.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { icon: "🧬", title: "Adaptive Programming", desc: "Workouts change based on how you feel each day — sleep, energy, and soreness shape your session in real time." },
            { icon: "🏥", title: "Injury-Intelligent", desc: "Report any condition from a bad knee to a spinal fusion — the app filters unsafe exercises and adds rehab protocols." },
            { icon: "📐", title: "Evidence-Based", desc: "Every exercise follows the NASM Optimum Performance Training model — the same system used by pro sports teams." },
            { icon: "🎯", title: "Built For You", desc: "Your ROM limitations, movement compensations, and sport demands all feed into a plan that's uniquely yours." },
            { icon: "📈", title: "Continuously Evolving", desc: "Your plan adapts every session, every week, every cycle. This isn't a 30-day program — it's a long-term training system." },
          ].map((f, i) => (
            <Card key={f.title} style={{ padding: 12, display: "flex", alignItems: "flex-start", gap: 10, animationDelay: `${i * 0.15}s` }}>
              <span style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>{f.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{f.title}</div>
                <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5, marginTop: 2 }}>{f.desc}</div>
              </div>
            </Card>
          ))}
        </div>
        <Card style={{ padding: 12, background: C.bgGlass, borderColor: C.teal + "20" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 6 }}>To build your plan, we need to learn about you.</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>This assessment takes about 10-15 minutes and covers:</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {["Health screening & conditions", "Movement & range of motion check", "Fitness baseline", "Your goals & sport interests", "Equipment & schedule"].map(item => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.textMuted }}>
                <span style={{ color: C.teal, fontSize: 11 }}>✓</span>{item}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: C.textDim, marginTop: 8, lineHeight: 1.5 }}>Your answers are private and stored securely. You can update any of these anytime from Settings.</div>
        </Card>
        <Btn onClick={() => { localStorage.setItem("apex_intro_seen", "1"); setShowIntro(false); }} icon="→" style={{ fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 3, fontSize: 18, padding: "16px 20px" }}>LET'S BUILD YOUR PLAN</Btn>
        <div style={{ textAlign: "center", fontSize: 11, color: C.textDim }}>You can pause and come back anytime — your progress saves automatically.</div>
      </div>}

      {/* ── ASSESSMENT FLOW (hidden during intro) ──────────── */}
      {!showIntro && <>
      {/* Progress */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.teal, letterSpacing: 2 }}>STEP {screen + 1} OF {totalScreens}</div>
        {screen > 0 && <button onClick={prev} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 16, cursor: "pointer", padding: "8px" }}>← Back</button>}
      </div>
      <ProgressBar value={screen + 1} max={totalScreens} color={C.teal} height={5} />

      {/* ── SCREEN 0: PAR-Q+ ──────────────────────────────── */}
      {screen === 0 && <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div><div style={{ fontSize: 24, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 3 }}>{isReassessment ? "REASSESSMENT" : "WELCOME TO APEX"}</div><div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.5, marginTop: 4 }}>{isReassessment ? "Your current selections are pre-filled. Change anything that's different — everything else stays as-is." : "Let's build your profile. First: a quick health screen."}</div></div>
        <WhyHelper screenNum={0} />
        <Card><div style={{ fontSize: 15, fontWeight: 700, color: C.info, letterSpacing: 2, marginBottom: 10 }}>PAR-Q+ HEALTH SCREENING</div>
          {PARQ_QUESTIONS.map((q, i) => (
            <div key={i} style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 16, color: C.text, marginBottom: 8 }}>{q}</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[true, false].map(v => (
                  <button key={String(v)} onClick={() => setParq(p => { const n = [...p]; n[i] = v; return n; })}
                    style={{ padding: "6px 16px", borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: "pointer",
                      background: parq[i] === v ? (v ? C.danger + "20" : C.success + "20") : "transparent",
                      border: `1px solid ${parq[i] === v ? (v ? C.danger : C.success) : C.border}`,
                      color: parq[i] === v ? (v ? C.danger : C.success) : C.textDim }}>
                    {v ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </Card>
        {anyParqYes && <Card style={{ borderColor: C.danger + "40", background: C.danger + "08" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.danger, marginBottom: 6 }}>⚠️ Medical Clearance Recommended</div>
          <div style={{ fontSize: 15, color: C.textMuted, marginBottom: 10 }}>You answered YES to one or more PAR-Q+ questions. We recommend getting medical clearance before starting an exercise program.</div>
          <button onClick={() => setParqWarning(true)} style={{ background: "none", border: "none", color: C.warning, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>
            {parqWarning ? "✅ Continuing with caution" : "I understand — continue with caution →"}
          </button>
        </Card>}
        <Btn onClick={next} disabled={parq.some(a => a === null) || (anyParqYes && !parqWarning)}>Next — Conditions →</Btn>
      </div>}

      {/* ── SCREEN 1: CONDITIONS ───────────────────────────── */}
      {screen === 1 && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>CONDITIONS & INJURIES</div><div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.5, marginTop: 4 }}>Search for your condition or browse by category. Select all that apply.</div></div>
        <WhyHelper screenNum={1} />
        {conditions.length > 0 && <div style={{ padding: "6px 10px", background: C.tealBg, borderRadius: 8, fontSize: 15, color: C.teal }}>{conditions.length} condition{conditions.length > 1 ? "s" : ""} selected — {conditions.length * 8}+ exercises will be adapted for your safety</div>}
        {/* Search/autocomplete */}
        <input value={condSearch} onChange={e => setCondSearch(e.target.value)} placeholder="Type your condition... (e.g. knee, carpal, anxiety)" style={{ width: "100%", padding: "14px 16px", borderRadius: 14, background: C.bgElevated, border: `1px solid ${condSearch ? C.teal + "60" : C.border}`, color: C.text, fontSize: 15, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        {condSearch.trim().length >= 2 && (() => {
          const q = condSearch.toLowerCase();
          const matches = allConditions.filter(c => c.name.toLowerCase().includes(q));
          return <Card style={{ padding: 8, maxHeight: 250, overflowY: "auto" }}>
            {matches.length > 0 ? matches.slice(0, 15).map(cond => {
              const sel = conditions.find(c => c.conditionId === cond.id);
              const cat = CONDITION_CATEGORIES.find(c => c.id === cond.category);
              return <button key={cond.id} onClick={() => {
                if (sel) setConditions(p => p.filter(c => c.conditionId !== cond.id));
                else setConditions(p => [...p, { conditionId: cond.id, name: cond.name, severity: 2, bodyArea: "", condType: "", category: cond.category }]);
              }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 12px", background: sel ? C.tealBg : "transparent", border: "none", borderBottom: `1px solid ${C.border}`, color: sel ? C.teal : C.text, fontSize: 14, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                <span style={{ fontSize: 11 }}>{sel ? "✅" : "○"}</span>
                <span style={{ flex: 1 }}>{cond.name}</span>
                {cat && <span style={{ fontSize: 10, color: C.textDim }}>{cat.icon}</span>}
              </button>;
            }) : <div style={{ padding: 12 }}>
              <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 8 }}>No matching conditions found.</div>
              <div style={{ fontSize: 12, color: C.textDim, marginBottom: 8 }}>Don't see your condition? Describe it here:</div>
              <input value={customCondText} onChange={e => setCustomCondText(e.target.value)} placeholder="Describe your condition..." style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: C.bgCard, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
              {customCondText.trim().length > 2 && <Btn variant="dark" onClick={() => {
                const id = "custom_" + Date.now();
                setConditions(p => [...p, { conditionId: id, name: customCondText.trim(), severity: 2, bodyArea: "", condType: "", category: "custom", isCustom: true }]);
                setCustomCondText(""); setCondSearch("");
              }}>Add "{customCondText.trim()}"</Btn>}
            </div>}
          </Card>;
        })()}
        {/* Custom conditions note */}
        {conditions.some(c => c.isCustom) && <Card style={{ padding: 12, borderColor: C.warning + "40", background: C.warning + "08" }}>
          <div style={{ fontSize: 11, color: C.warning, fontWeight: 600 }}>Custom conditions noted</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>We've applied conservative safety measures — reduced intensity and added general joint protection. For specific adaptations, consult your healthcare provider.</div>
        </Card>}
        {/* Body region cards — browse alternative */}
        <div style={{ fontSize: 11, color: C.textDim, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>Or browse by category</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {CONDITION_CATEGORIES.map(cat => {
          const catConds = cat.id === "mental_health"
            ? [...conditionsDB.filter(c => c.category === cat.id), ...MENTAL_HEALTH_CONDITIONS.map(mh => ({ id: "mh_" + mh.toLowerCase().replace(/[^a-z]/g, "_"), name: mh, category: "mental_health" }))]
            : conditionsDB.filter(c => c.category === cat.id);
          const isOpen = condCatOpen === cat.id;
          const selectedInCat = conditions.filter(c => catConds.find(x => x.id === c.conditionId));
          if (!isOpen) return (
            <div key={cat.id} onClick={() => setCondCatOpen(cat.id)} style={{ background: selectedInCat.length > 0 ? C.tealBg : C.bgCard, border: `1px solid ${selectedInCat.length > 0 ? C.teal + "40" : C.border}`, borderRadius: 14, padding: 16, cursor: "pointer", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 28 }}>{cat.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{cat.label}</span>
              {selectedInCat.length > 0 && <Badge color={C.teal}>{selectedInCat.length} selected</Badge>}
            </div>
          );
          return null;
        })}
        </div>
        {/* Expanded region — shows conditions for selected body region */}
        {CONDITION_CATEGORIES.map(cat => {
          const catConds = cat.id === "mental_health"
            ? [...conditionsDB.filter(c => c.category === cat.id), ...MENTAL_HEALTH_CONDITIONS.map(mh => ({ id: "mh_" + mh.toLowerCase().replace(/[^a-z]/g, "_"), name: mh, category: "mental_health" }))]
            : conditionsDB.filter(c => c.category === cat.id);
          const isOpen = condCatOpen === cat.id;
          const selectedInCat = conditions.filter(c => catConds.find(x => x.id === c.conditionId));
          if (!isOpen) return null;
          return (
            <Card key={cat.id} style={{ padding: 0, overflow: "hidden" }}>
              <div onClick={() => setCondCatOpen(null)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", cursor: "pointer", background: C.tealBg }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 20 }}>{cat.icon}</span><span style={{ fontSize: 15, fontWeight: 700, color: C.teal }}>{cat.label}</span>
                  {selectedInCat.length > 0 && <Badge color={C.teal}>{selectedInCat.length}</Badge>}</div>
                <span style={{ color: C.teal, fontSize: 14 }}>✕ Close</span>
              </div>
              {isOpen && <div style={{ padding: "0 16px 14px" }}>
                {/* Chronic Pain quick-select for physical categories */}
                {cat.locations && <div style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}`, marginBottom: 4 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.orange, marginBottom: 6 }}>QUICK: General chronic pain in this area?</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {cat.locations.map(loc => {
                      const qid = "chronic_" + cat.id + "_" + loc.toLowerCase().replace(/\s/g, "_");
                      const qsel = conditions.find(c => c.conditionId === qid);
                      return <button key={loc} onClick={() => {
                        if (qsel) setConditions(p => p.filter(c => c.conditionId !== qid));
                        else setConditions(p => [...p, { conditionId: qid, name: "Chronic Pain — " + loc, severity: 2, bodyArea: loc, condType: "Chronic Pain", category: cat.id }]);
                      }} style={{ padding: "4px 8px", borderRadius: 6, fontSize: 14, cursor: "pointer", background: qsel ? C.orange + "20" : "transparent", border: `1px solid ${qsel ? C.orange : C.border}`, color: qsel ? C.orange : C.textDim }}>{qsel ? "✓ " : ""}{loc}</button>;
                    })}
                  </div>
                </div>}
                {catConds.map(cond => {
                  const sel = conditions.find(c => c.conditionId === cond.id);
                  return (
                    <div key={cond.id} style={{ padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                      <button onClick={() => {
                        if (sel) setConditions(p => p.filter(c => c.conditionId !== cond.id));
                        else setConditions(p => [...p, { conditionId: cond.id, name: cond.name, severity: 2, bodyArea: "", condType: "", category: cat.id }]);
                      }} style={{ background: "none", border: "none", fontSize: 16, color: sel ? C.teal : C.textMuted, cursor: "pointer", textAlign: "left" }}>
                        {sel ? "✅ " : "○ "}{cond.name}
                      </button>
                      {sel && (() => {
                        const condLocs = CONDITION_LOCATIONS[cond.id];
                        const catCfg = CATEGORY_SUBQUESTIONS[cond.category || cat.id] || CATEGORY_SUBQUESTIONS.joint;
                        return <div style={{ paddingLeft: 20, marginTop: 4 }}>
                        {/* Location sub-select — condition-specific */}
                        {condLocs && <div style={{ marginBottom: 6 }}>
                          <span style={{ fontSize: 14, color: C.textDim }}>Location: </span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 2 }}>
                            {condLocs.map(loc => <button key={loc} onClick={() => setConditions(p => p.map(c => c.conditionId === cond.id ? { ...c, bodyArea: loc } : c))}
                              style={{ padding: "2px 6px", borderRadius: 4, fontSize: 14, cursor: "pointer", background: sel.bodyArea === loc ? C.tealBg : "transparent", border: `1px solid ${sel.bodyArea === loc ? C.teal : C.border}`, color: sel.bodyArea === loc ? C.teal : C.textDim }}>{loc}</button>)}
                          </div>
                        </div>}
                        {/* Status — category-specific */}
                        <div style={{ marginBottom: 6 }}>
                          <span style={{ fontSize: 14, color: C.textDim }}>{catCfg.statusLabel}: </span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
                            {catCfg.statusOptions.map(ct => <button key={ct} onClick={() => setConditions(p => p.map(c => c.conditionId === cond.id ? { ...c, condType: ct } : c))}
                              style={{ padding: "3px 6px", borderRadius: 4, fontSize: 14, cursor: "pointer", background: sel.condType === ct ? C.info + "20" : "transparent", border: `1px solid ${sel.condType === ct ? C.info : C.border}`, color: sel.condType === ct ? C.info : C.textDim }}>{ct}</button>)}
                          </div>
                        </div>
                        {/* Extra fields — category-specific (impact, flare freq, clearance, HR meds, monitoring) */}
                        {catCfg.extraFields && catCfg.extraFields.map(ef => <div key={ef.key} style={{ marginBottom: 6 }}>
                          <span style={{ fontSize: 14, color: C.textDim }}>{ef.label}: </span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
                            {ef.options.map(opt => <button key={opt} onClick={() => setConditions(p => p.map(c => c.conditionId === cond.id ? { ...c, [ef.key]: opt } : c))}
                              style={{ padding: "3px 6px", borderRadius: 4, fontSize: 14, cursor: "pointer", background: sel[ef.key] === opt ? C.purple + "20" : "transparent", border: `1px solid ${sel[ef.key] === opt ? C.purple : C.border}`, color: sel[ef.key] === opt ? C.purple : C.textDim }}>{opt}</button>)}
                          </div>
                        </div>)}
                        {/* Severity — only for categories that use it */}
                        {catCfg.showSeverity && <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 14, color: C.textDim }}>Severity:</span>
                          {[1, 2, 3, 4, 5].map(s => (
                            <button key={s} onClick={() => setConditions(p => p.map(c => c.conditionId === cond.id ? { ...c, severity: s } : c))}
                              style={{ width: 22, height: 22, borderRadius: 4, fontSize: 14, fontWeight: 700, cursor: "pointer",
                                background: sel.severity === s ? (s <= 2 ? C.success : s <= 3 ? C.warning : C.danger) + "20" : "transparent",
                                border: `1px solid ${sel.severity === s ? (s <= 2 ? C.success : s <= 3 ? C.warning : C.danger) : C.border}`,
                                color: sel.severity === s ? C.text : C.textDim }}>{s}</button>
                          ))}
                        </div>}
                      </div>;
                      })()}
                    </div>
                  );
                })}
              </div>}
            </Card>
          );
        })}
        {conditions.length > 0 && <div style={{ fontSize: 15, color: C.teal }}>{conditions.length} condition{conditions.length !== 1 ? "s" : ""} selected</div>}
        <Btn onClick={next}>{hasPainConditions ? "Next — Pain Assessment →" : hasConditions ? "Next — Functional Screen →" : "Next — Functional Screen →"}</Btn>
      </div>}

      {/* ── SCREEN 2: PAIN BEHAVIOR (per condition — musculoskeletal only) */}
      {screen === 2 && hasPainConditions && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>PAIN BEHAVIOR</div><div style={{ fontSize: 15, color: C.textMuted }}>Tell us about your pain patterns for each condition.</div></div>
        {painConditions.map(cond => {
          const pb = painBehaviors[cond.conditionId] || {};
          const update = (field, val) => setPainBehaviors(p => ({ ...p, [cond.conditionId]: { ...p[cond.conditionId], [field]: val } }));
          const toggleArr = (field, val) => {
            const cur = pb[field] || [];
            update(field, cur.includes(val) ? cur.filter(x => x !== val) : [...cur, val]);
          };
          return (
            <Card key={cond.conditionId}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.teal, marginBottom: 10 }}>{cond.name}{cond.bodyArea ? ` — ${cond.bodyArea}` : ""}</div>
              {/* Pain type */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.textDim, marginBottom: 4 }}>PAIN TYPE</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {["Constant", "Intermittent", "Activity-only", "Rest-only"].map(t => (
                    <button key={t} onClick={() => update("painType", t)} style={{ padding: "5px 10px", borderRadius: 8, fontSize: 14, cursor: "pointer", background: pb.painType === t ? C.teal + "20" : "transparent", border: `1px solid ${pb.painType === t ? C.teal : C.border}`, color: pb.painType === t ? C.teal : C.textDim }}>{t}</button>
                  ))}
                </div>
              </div>
              {/* Worst time */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.textDim, marginBottom: 4 }}>WORST TIME OF DAY</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {["Morning", "Midday", "Evening", "Night", "No pattern"].map(t => (
                    <button key={t} onClick={() => update("worstTime", t)} style={{ padding: "5px 10px", borderRadius: 8, fontSize: 14, cursor: "pointer", background: pb.worstTime === t ? C.warning + "20" : "transparent", border: `1px solid ${pb.worstTime === t ? C.warning : C.border}`, color: pb.worstTime === t ? C.warning : C.textDim }}>{t}</button>
                  ))}
                </div>
              </div>
              {/* Triggers */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.textDim, marginBottom: 4 }}>PAIN TRIGGERS (select all)</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {["Sitting", "Standing", "Walking", "Lifting", "Bending", "Twisting", "Lying down"].map(t => {
                    const sel = (pb.triggers || []).includes(t);
                    return <button key={t} onClick={() => toggleArr("triggers", t)} style={{ padding: "5px 10px", borderRadius: 8, fontSize: 14, cursor: "pointer", background: sel ? C.danger + "20" : "transparent", border: `1px solid ${sel ? C.danger : C.border}`, color: sel ? C.danger : C.textDim }}>{sel ? "✓ " : ""}{t}</button>;
                  })}
                </div>
              </div>
              {/* Relievers */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.textDim, marginBottom: 4 }}>WHAT HELPS (select all)</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {["Rest", "Movement", "Heat", "Ice", "Stretching", "Nothing helps"].map(t => {
                    const sel = (pb.relievers || []).includes(t);
                    return <button key={t} onClick={() => toggleArr("relievers", t)} style={{ padding: "5px 10px", borderRadius: 8, fontSize: 14, cursor: "pointer", background: sel ? C.success + "20" : "transparent", border: `1px solid ${sel ? C.success : C.border}`, color: sel ? C.success : C.textDim }}>{sel ? "✓ " : ""}{t}</button>;
                  })}
                </div>
              </div>
              {/* Trend */}
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.textDim, marginBottom: 4 }}>TREND OVER LAST 2 WEEKS</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[{ v: "better", l: "Getting Better", c: C.success }, { v: "same", l: "Staying Same", c: C.warning }, { v: "worse", l: "Getting Worse", c: C.danger }].map(t => (
                    <button key={t.v} onClick={() => update("trend", t.v)} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 14, fontWeight: 600, textAlign: "center", cursor: "pointer", background: pb.trend === t.v ? t.c + "15" : "transparent", border: `1px solid ${pb.trend === t.v ? t.c : C.border}`, color: pb.trend === t.v ? t.c : C.textDim }}>{t.l}</button>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
        <Btn onClick={next}>{hasSpinalConditions ? "Next — Directional Preference →" : "Next — Pain Timeline →"}</Btn>
      </div>}

      {/* ── SCREEN 3: DIRECTIONAL PREFERENCE (spinal only) ── */}
      {screen === 3 && hasSpinalConditions && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>DIRECTIONAL PREFERENCE</div><div style={{ fontSize: 15, color: C.textMuted }}>Critical for spinal conditions — determines your PT protocol direction.</div></div>
        <Card style={{ borderColor: C.danger + "30", background: C.danger + "06" }}>
          <div style={{ fontSize: 15, color: C.danger, fontWeight: 700, marginBottom: 4 }}>⚠️ IMPORTANT</div>
          <div style={{ fontSize: 14, color: C.textMuted }}>Wrong direction exercises can worsen spinal pain. Answer honestly — this determines whether you get extension-based (McKenzie) or flexion-based (Williams) therapy.</div>
        </Card>
        {conditions.filter(c => c.category === "spinal").map(cond => {
          const dp = directionalPrefs[cond.conditionId] || {};
          const update = (field, val) => setDirectionalPrefs(p => ({ ...p, [cond.conditionId]: { ...p[cond.conditionId], [field]: val } }));
          return (
            <Card key={cond.conditionId}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.teal, marginBottom: 12 }}>{cond.name}{cond.bodyArea ? ` — ${cond.bodyArea}` : ""}</div>
              {/* Extension */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 15, color: C.text, marginBottom: 6 }}>Does <b>arching your back</b> (backward bending) make pain:</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[{ v: "better", l: "Better", c: C.success }, { v: "worse", l: "Worse", c: C.danger }, { v: "no_change", l: "No Change", c: C.textDim }].map(o => (
                    <button key={o.v} onClick={() => update("extension", o.v)} style={{ flex: 1, padding: "10px 4px", borderRadius: 10, fontSize: 15, fontWeight: 600, textAlign: "center", cursor: "pointer", background: dp.extension === o.v ? o.c + "15" : "transparent", border: `1px solid ${dp.extension === o.v ? o.c : C.border}`, color: dp.extension === o.v ? o.c : C.textDim }}>{o.l}</button>
                  ))}
                </div>
              </div>
              {/* Flexion */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 15, color: C.text, marginBottom: 6 }}>Does <b>bending forward</b> (touching toes) make pain:</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[{ v: "better", l: "Better", c: C.success }, { v: "worse", l: "Worse", c: C.danger }, { v: "no_change", l: "No Change", c: C.textDim }].map(o => (
                    <button key={o.v} onClick={() => update("flexion", o.v)} style={{ flex: 1, padding: "10px 4px", borderRadius: 10, fontSize: 15, fontWeight: 600, textAlign: "center", cursor: "pointer", background: dp.flexion === o.v ? o.c + "15" : "transparent", border: `1px solid ${dp.flexion === o.v ? o.c : C.border}`, color: dp.flexion === o.v ? o.c : C.textDim }}>{o.l}</button>
                  ))}
                </div>
              </div>
              {/* Centralization */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 15, color: C.text, marginBottom: 6 }}>Does pain <b>move toward your spine</b> with backward bending? (centralization)</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[{ v: true, l: "Yes — pain centralizes" }, { v: false, l: "No" }, { v: "unsure", l: "Not sure" }].map(o => (
                    <button key={String(o.v)} onClick={() => update("centralization", o.v)} style={{ flex: 1, padding: "10px 4px", borderRadius: 10, fontSize: 14, fontWeight: 600, textAlign: "center", cursor: "pointer", background: dp.centralization === o.v ? C.info + "15" : "transparent", border: `1px solid ${dp.centralization === o.v ? C.info : C.border}`, color: dp.centralization === o.v ? C.info : C.textDim }}>{o.l}</button>
                  ))}
                </div>
              </div>
              {/* Show determined protocol */}
              {dp.extension && dp.flexion && (() => {
                const proto = dp.extension === "better" ? "McKenzie Extension" : dp.flexion === "better" ? "Williams Flexion" : "Neutral Stabilization";
                const protoColor = dp.extension === "better" ? C.teal : dp.flexion === "better" ? C.purple : C.info;
                return <div style={{ marginTop: 8, padding: 10, background: protoColor + "10", borderRadius: 8, border: `1px solid ${protoColor}25` }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: protoColor, letterSpacing: 1 }}>PROTOCOL DIRECTION: {proto.toUpperCase()}</div>
                  <div style={{ fontSize: 14, color: C.textMuted, marginTop: 4 }}>
                    {dp.extension === "better" ? "Extension helps — indicates disc-related issue. McKenzie press-ups and standing extensions will be your primary PT exercises." :
                     dp.flexion === "better" ? "Flexion helps — indicates stenosis/facet issue. Williams flexion exercises (knee-to-chest, pelvic tilts) will be your primary PT exercises." :
                     "Neither direction clearly helps. Neutral spine stabilization with McGill Big 3 (curl-up, side plank, bird dog) will be your protocol."}
                  </div>
                </div>;
              })()}
            </Card>
          );
        })}
        <Btn onClick={next}>Next — Pain Timeline →</Btn>
      </div>}

      {/* ── SCREEN 4: PAIN TIMELINE (per condition) ─────────── */}
      {screen === 4 && hasPainConditions && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>PAIN TIMELINE</div><div style={{ fontSize: 15, color: C.textMuted }}>When did each condition start? This determines PT session frequency.</div></div>
        {painConditions.map(cond => {
          const pt = painTimelines[cond.conditionId] || {};
          const update = (field, val) => setPainTimelines(p => ({ ...p, [cond.conditionId]: { ...p[cond.conditionId], [field]: val } }));
          return (
            <Card key={cond.conditionId}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.teal, marginBottom: 10 }}>{cond.name}{cond.bodyArea ? ` — ${cond.bodyArea}` : ""}</div>
              {/* Onset */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.textDim, marginBottom: 4 }}>WHEN DID THIS START?</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {[{ v: "acute", l: "Less than 6 weeks ago", c: C.danger, sub: "ACUTE — gentle, frequent sessions" },
                    { v: "subacute", l: "6-12 weeks ago", c: C.warning, sub: "SUBACUTE — moderate, 2-3x/day" },
                    { v: "chronic", l: "3+ months ago", c: C.info, sub: "CHRONIC — progressive, 1-2x/day" },
                    { v: "chronic_persistent", l: "1+ year ago", c: C.purple, sub: "CHRONIC PERSISTENT — integrated approach" },
                  ].map(o => (
                    <button key={o.v} onClick={() => update("onset", o.v)} style={{ padding: "10px 12px", borderRadius: 10, textAlign: "left", cursor: "pointer", background: pt.onset === o.v ? o.c + "12" : "transparent", border: `1px solid ${pt.onset === o.v ? o.c : C.border}` }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: pt.onset === o.v ? o.c : C.text }}>{o.l}</div>
                      <div style={{ fontSize: 14, color: C.textDim, marginTop: 2 }}>{o.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
              {/* Injury type */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.textDim, marginBottom: 4 }}>HOW DID IT START?</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[{ v: "specific", l: "Specific Injury" }, { v: "gradual", l: "Gradual Onset" }].map(o => (
                    <button key={o.v} onClick={() => update("injuryType", o.v)} style={{ flex: 1, padding: "10px 4px", borderRadius: 10, fontSize: 15, fontWeight: 600, textAlign: "center", cursor: "pointer", background: pt.injuryType === o.v ? C.teal + "15" : "transparent", border: `1px solid ${pt.injuryType === o.v ? C.teal : C.border}`, color: pt.injuryType === o.v ? C.teal : C.textDim }}>{o.l}</button>
                  ))}
                </div>
              </div>
              {/* Surgery */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.textDim, marginBottom: 4 }}>HAVE YOU HAD SURGERY FOR THIS?</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[{ v: true, l: "Yes" }, { v: false, l: "No" }].map(o => (
                    <button key={String(o.v)} onClick={() => update("surgery", o.v)} style={{ flex: 1, padding: "10px 4px", borderRadius: 10, fontSize: 15, fontWeight: 600, textAlign: "center", cursor: "pointer", background: pt.surgery === o.v ? C.info + "15" : "transparent", border: `1px solid ${pt.surgery === o.v ? C.info : C.border}`, color: pt.surgery === o.v ? C.info : C.textDim }}>{o.l}</button>
                  ))}
                </div>
              </div>
              {pt.surgery === true && <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.textDim, marginBottom: 4 }}>HOW LONG AGO?</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {["<3 months", "3-6 months", "6-12 months", "1-2 years", "2+ years"].map(t => (
                    <button key={t} onClick={() => update("surgeryTimeAgo", t)} style={{ padding: "6px 10px", borderRadius: 8, fontSize: 14, cursor: "pointer", background: pt.surgeryTimeAgo === t ? C.warning + "20" : "transparent", border: `1px solid ${pt.surgeryTimeAgo === t ? C.warning : C.border}`, color: pt.surgeryTimeAgo === t ? C.warning : C.textDim }}>{t}</button>
                  ))}
                </div>
              </div>}
              {/* Frequency preview */}
              {pt.onset && <div style={{ marginTop: 8, padding: 8, background: C.tealBg, borderRadius: 8, border: `1px solid ${C.teal}20` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.teal }}>PT SESSION FREQUENCY</div>
                <div style={{ fontSize: 14, color: C.textMuted, marginTop: 2 }}>
                  {pt.onset === "acute" ? "3-6× per day · 5-10 min sessions · Gentle intensity" :
                   pt.onset === "subacute" ? "2-3× per day · 10-15 min sessions · Moderate intensity" :
                   "1-2× per day · 15-20 min sessions · Progressive intensity"}
                </div>
              </div>}
            </Card>
          );
        })}
        <Btn onClick={next}>Next — Functional Limitations →</Btn>
      </div>}

      {/* ── SCREEN 5: FUNCTIONAL LIMITATIONS ────────────────── */}
      {screen === 5 && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>FUNCTIONAL ABILITIES</div><div style={{ fontSize: 15, color: C.textMuted }}>Rate each activity. These become your measurable PT goals — reassessed every 4 weeks.</div></div>
        {[
          { id: "sit_30", label: "Sit for 30+ minutes", icon: "🪑" },
          { id: "stand_30", label: "Stand for 30+ minutes", icon: "🧍" },
          { id: "walk_15", label: "Walk for 15+ minutes", icon: "🚶" },
          { id: "climb_stairs", label: "Climb stairs", icon: "🪜" },
          { id: "lift_overhead", label: "Lift objects overhead", icon: "🏋️" },
          { id: "reach_behind", label: "Reach behind back", icon: "🔄" },
          { id: "get_up_floor", label: "Get up from floor", icon: "⬆️" },
          { id: "sleep_through", label: "Sleep through the night", icon: "😴" },
          { id: "drive_30", label: "Drive for 30+ minutes", icon: "🚗" },
          { id: "exercise_moderate", label: "Exercise at moderate intensity", icon: "💪" },
        ].map(item => (
          <Card key={item.id} style={{ padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span style={{ fontSize: 16, fontWeight: 600, color: C.text }}>{item.label}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              {[{ v: "easy", l: "Can Do Easily", c: C.success }, { v: "difficulty", l: "With Difficulty", c: C.warning }, { v: "cannot", l: "Cannot Do", c: C.danger }].map(opt => (
                <button key={opt.v} onClick={() => setFuncLimitations(p => ({ ...p, [item.id]: opt.v }))}
                  style={{ padding: "8px 4px", borderRadius: 8, fontSize: 14, fontWeight: 600, textAlign: "center", cursor: "pointer",
                    background: funcLimitations[item.id] === opt.v ? opt.c + "15" : "transparent",
                    border: `1px solid ${funcLimitations[item.id] === opt.v ? opt.c : C.border}`,
                    color: funcLimitations[item.id] === opt.v ? opt.c : C.textDim }}>{opt.l}</button>
              ))}
            </div>
          </Card>
        ))}
        {Object.values(funcLimitations).filter(v => v !== "easy").length > 0 && (
          <div style={{ fontSize: 14, color: C.info }}>
            {Object.values(funcLimitations).filter(v => v !== "easy").length} limitation{Object.values(funcLimitations).filter(v => v !== "easy").length !== 1 ? "s" : ""} identified — these become your PT goals.
          </div>
        )}
        <Btn onClick={next}>Next — Treatment History →</Btn>
      </div>}

      {/* ── SCREEN 6: PREVIOUS TREATMENT ────────────────────── */}
      {screen === 6 && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>TREATMENT HISTORY</div><div style={{ fontSize: 15, color: C.textMuted }}>Previous treatment helps us build on what worked.</div></div>
        <Card>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>Have you seen a physical therapist?</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[true, false].map(v => (
              <button key={String(v)} onClick={() => setTreatmentHistory(p => ({ ...p, seenPT: v }))}
                style={{ flex: 1, padding: "12px", borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: "pointer",
                  background: treatmentHistory.seenPT === v ? C.teal + "15" : "transparent",
                  border: `1px solid ${treatmentHistory.seenPT === v ? C.teal : C.border}`,
                  color: treatmentHistory.seenPT === v ? C.teal : C.textDim }}>{v ? "Yes" : "No"}</button>
            ))}
          </div>
        </Card>
        {treatmentHistory.seenPT && <>
          <Card>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>What exercises or treatments helped?</div>
            <textarea value={treatmentHistory.whatHelped} onChange={e => setTreatmentHistory(p => ({ ...p, whatHelped: e.target.value }))} placeholder="e.g., McKenzie press-ups, swimming, heat therapy..."
              style={{ width: "100%", minHeight: 60, padding: "8px 10px", borderRadius: 8, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text, fontSize: 15, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </Card>
          <Card>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>What made it worse?</div>
            <textarea value={treatmentHistory.whatWorse} onChange={e => setTreatmentHistory(p => ({ ...p, whatWorse: e.target.value }))} placeholder="e.g., deep squats, running, prolonged sitting..."
              style={{ width: "100%", minHeight: 60, padding: "8px 10px", borderRadius: 8, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text, fontSize: 15, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </Card>
        </>}
        <Card>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>Are you currently seeing a PT?</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[true, false].map(v => (
              <button key={String(v)} onClick={() => setTreatmentHistory(p => ({ ...p, currentPT: v }))}
                style={{ flex: 1, padding: "12px", borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: "pointer",
                  background: treatmentHistory.currentPT === v ? (v ? C.success : C.info) + "15" : "transparent",
                  border: `1px solid ${treatmentHistory.currentPT === v ? (v ? C.success : C.info) : C.border}`,
                  color: treatmentHistory.currentPT === v ? (v ? C.success : C.info) : C.textDim }}>{v ? "Yes" : "No"}</button>
            ))}
          </div>
          {treatmentHistory.currentPT && <div style={{ marginTop: 8, padding: 8, background: C.success + "08", borderRadius: 8 }}>
            <div style={{ fontSize: 14, color: C.success }}>Great — the app will complement your PT's plan, not replace it.</div>
          </div>}
        </Card>
        <Card>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>Has a doctor cleared you for exercise?</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[{ v: "yes", l: "Yes" }, { v: "no", l: "No" }, { v: "not_asked", l: "Haven't asked" }].map(o => (
              <button key={o.v} onClick={() => setTreatmentHistory(p => ({ ...p, doctorCleared: o.v }))}
                style={{ flex: 1, padding: "12px 4px", borderRadius: 10, fontSize: 16, fontWeight: 600, textAlign: "center", cursor: "pointer",
                  background: treatmentHistory.doctorCleared === o.v ? C.teal + "15" : "transparent",
                  border: `1px solid ${treatmentHistory.doctorCleared === o.v ? C.teal : C.border}`,
                  color: treatmentHistory.doctorCleared === o.v ? C.teal : C.textDim }}>{o.l}</button>
            ))}
          </div>
        </Card>
        <Btn onClick={next}>Next — Medications →</Btn>
      </div>}

      {/* ── SCREEN 7: MEDICATIONS ───────────────────────────── */}
      {screen === 7 && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>MEDICATIONS</div><div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.5, marginTop: 4 }}>Some medications affect how we prescribe exercise. Select all that apply.</div></div>
        <WhyHelper screenNum={7} />
        {[
          { id: "bp_meds", label: "Blood pressure medication", icon: "🫀", note: "Affects heart rate response — we won't use HR for intensity" },
          { id: "blood_thinners", label: "Blood thinners", icon: "🩸", note: "Caution with foam rolling — bruising risk" },
          { id: "steroids", label: "Steroids / Prednisone", icon: "💊", note: "Bone density concern — we add weight-bearing exercises" },
          { id: "nsaids", label: "NSAIDs (ibuprofen, etc.)", icon: "💊", note: "Can mask pain signals — we track pain more carefully" },
          { id: "opioids", label: "Opioid pain medication", icon: "⚠️", note: "Impairs coordination — balance exercises need extra caution" },
          { id: "diabetes_meds", label: "Diabetes medication", icon: "🩺", note: "Blood sugar monitoring needed during exercise" },
          { id: "muscle_relaxants", label: "Muscle relaxants", icon: "💤", note: "Affects coordination — simplified exercise selection" },
          { id: "none", label: "None of these", icon: "✅", note: "" },
        ].map(med => {
          const sel = medications.includes(med.id);
          return (
            <Card key={med.id} onClick={() => {
              if (med.id === "none") { setMedications(sel ? [] : ["none"]); return; }
              setMedications(p => sel ? p.filter(x => x !== med.id) : [...p.filter(x => x !== "none"), med.id]);
            }} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, cursor: "pointer",
              borderColor: sel ? C.warning + "60" : C.border,
              background: sel ? C.warning + "06" : C.bgCard }}>
              <span style={{ fontSize: 20 }}>{med.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: sel ? C.text : C.textMuted }}>{med.label}</div>
                {sel && med.note && <div style={{ fontSize: 14, color: C.warning, marginTop: 2 }}>{med.note}</div>}
              </div>
              <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${sel ? C.warning : C.border}`, background: sel ? C.warning : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {sel && <span style={{ color: "#000", fontSize: 16, fontWeight: 800 }}>✓</span>}
              </div>
            </Card>
          );
        })}
        <Btn onClick={next}>Next — Safety Screening →</Btn>
      </div>}

      {/* ── SCREEN 8: RED FLAG SCREENING ────────────────────── */}
      {screen === 8 && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>SAFETY SCREENING</div><div style={{ fontSize: 15, color: C.textMuted }}>These symptoms require medical evaluation. Check any that apply.</div></div>
        <Card style={{ borderColor: C.danger + "20" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.danger, letterSpacing: 1.5, marginBottom: 10 }}>DO YOU HAVE ANY OF THESE?</div>
          {[
            { id: "weight_loss", label: "Unexplained weight loss (10+ lbs without trying)" },
            { id: "night_pain", label: "Pain that wakes you from sleep every night" },
            { id: "fever", label: "Fever or chills with your pain" },
            { id: "bowel_bladder", label: "Loss of bowel or bladder control" },
            { id: "progressive_numbness", label: "Progressive numbness or weakness in arms/legs" },
            { id: "position_independent", label: "Pain that doesn't change with any position or movement" },
            { id: "cancer_bone_pain", label: "History of cancer with new bone/back pain" },
          ].map(flag => {
            const sel = redFlags.includes(flag.id);
            return (
              <div key={flag.id} style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                <button onClick={() => setRedFlags(p => sel ? p.filter(x => x !== flag.id) : [...p, flag.id])}
                  style={{ background: "none", border: "none", fontSize: 16, color: sel ? C.danger : C.textMuted, cursor: "pointer", textAlign: "left", width: "100%", padding: 0 }}>
                  {sel ? "🔴 " : "○ "}{flag.label}
                </button>
              </div>
            );
          })}
        </Card>
        {hasRedFlags && <Card style={{ borderColor: C.danger + "60", background: C.danger + "10" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.danger, marginBottom: 6 }}>⚠️ MEDICAL EVALUATION NEEDED</div>
          <div style={{ fontSize: 16, color: C.text, marginBottom: 10 }}>These symptoms need medical evaluation before starting an exercise program. Please see your doctor first.</div>
          <div style={{ fontSize: 15, color: C.textMuted, marginBottom: 10 }}>If your doctor has already evaluated these symptoms and cleared you, you may continue.</div>
          <button onClick={() => setRedFlagCleared(true)} style={{ background: "none", border: "none", color: C.warning, fontSize: 16, fontWeight: 600, cursor: "pointer", padding: 0 }}>
            {redFlagCleared ? "✅ I confirm medical clearance — continue" : "I have been evaluated and cleared by my doctor →"}
          </button>
        </Card>}
        <Btn onClick={next} disabled={hasRedFlags && !redFlagCleared}>
          {hasRedFlags && !redFlagCleared ? "Medical Clearance Required" : "Next — Movement Screen →"}
        </Btn>
      </div>}

      {/* ── SCREEN 9: MOVEMENT SCREEN (was 2) ────────────────── */}
      {screen === 9 && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>MOVEMENT SCREEN</div><div style={{ fontSize: 15, color: C.textMuted }}>Overhead squat assessment — answer honestly.</div></div>
        {COMPENSATIONS.map(comp => (
          <Card key={comp.id} onClick={() => setCompensations(p => ({ ...p, [comp.id]: !p[comp.id] }))}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, cursor: "pointer",
              borderColor: compensations[comp.id] ? C.warning + "60" : C.border,
              background: compensations[comp.id] ? C.warning + "08" : C.bgCard }}>
            <span style={{ fontSize: 24 }}>{comp.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>{comp.q}</div>
              {compensations[comp.id] && (() => {
                const full = compensationsDB.find(c => c.id === comp.id);
                return full ? <div style={{ fontSize: 14, color: C.warning, marginTop: 4 }}>Detected: {full.name}. Overactive: {full.overactive.slice(0, 3).join(", ")}</div> : null;
              })()}
            </div>
            <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${compensations[comp.id] ? C.warning : C.border}`, background: compensations[comp.id] ? C.warning : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {compensations[comp.id] && <span style={{ color: "#000", fontSize: 16, fontWeight: 800 }}>✓</span>}
            </div>
          </Card>
        ))}
        <Btn onClick={next}>Next — ROM Assessment →</Btn>
      </div>}

      {/* ── SCREEN 10: ROM SELF-ASSESSMENT (was 3) ───────── */}
      {screen === 10 && (() => {
        const ROM_TESTS = [
          // ── NECK ──
          { id:"neck", label:"Neck Rotation", icon:"😐", group:"Neck & Cervical", test:"Slowly turn your head fully left, then fully right. Then look up and down.",
            opts:[{v:"full",l:"Full rotation easily"},{v:"slight",l:"Full rotation with difficulty"},{v:"limited",l:"Noticeably restricted"},{v:"mod_limited",l:"Can't turn past 45°"},{v:"painful",l:"Pain prevented it"}] },
          { id:"cervical_retraction", label:"Cervical Retraction", icon:"😐", group:"Neck & Cervical", test:"Sitting tall, pull your chin straight back (make a double chin). How far does it go?",
            opts:[{v:"full",l:"Full retraction easily"},{v:"slight",l:"Retraction with difficulty"},{v:"limited",l:"Moderate retraction"},{v:"mod_limited",l:"Minimal movement"},{v:"painful",l:"Pain prevented it"}] },
          // ── UPPER BACK ──
          { id:"thoracic", label:"Upper Back Rotation", icon:"🔄", group:"Thoracic Spine", test:"Sit in a chair, cross arms on chest. Rotate your upper body left and right while keeping hips still.",
            opts:[{v:"full",l:"Rotated easily both ways"},{v:"slight",l:"Rotated with some effort"},{v:"limited",l:"Noticeably stiff one side"},{v:"mod_limited",l:"Significantly limited"},{v:"painful",l:"Pain prevented it"}] },
          // ── LOWER BACK / McKENZIE ──
          { id:"lumbar", label:"Lower Back — Forward Bend", icon:"🙇", group:"Lumbar Spine", test:"Stand with feet together. Bend forward and reach for your toes. How far did you get?",
            opts:[{v:"full",l:"Touched toes easily"},{v:"slight",l:"Touched toes with difficulty"},{v:"limited",l:"Reached shins"},{v:"mod_limited",l:"Only reached knees"},{v:"painful",l:"Pain prevented it"}] },
          { id:"lumbar_ext", label:"Lumbar Extension (McKenzie)", icon:"🐍", group:"Lumbar Spine", test:"Lying face down, press up through your hands (cobra position). How far can you go?",
            opts:[{v:"full",l:"Full press-up easily"},{v:"slight",l:"Press-up with difficulty"},{v:"limited",l:"Halfway up"},{v:"mod_limited",l:"Barely off the ground"},{v:"painful",l:"Pain prevented it"}] },
          { id:"lumbar_flex", label:"Lumbar Flexion (Seated)", icon:"🙇", group:"Lumbar Spine", test:"Seated, bend forward and reach toward your toes. How far?",
            opts:[{v:"full",l:"Past toes easily"},{v:"slight",l:"Reached toes with difficulty"},{v:"limited",l:"Reached shins"},{v:"mod_limited",l:"Only reached knees"},{v:"painful",l:"Pain prevented it"}] },
          // ── SHOULDERS ──
          { id:"shoulders", label:"Shoulder Flexion", icon:"🤸", group:"Shoulders", test:"Stand facing a wall, arms straight. Raise both arms overhead and try to touch the wall with your thumbs.",
            opts:[{v:"full",l:"Touched wall easily"},{v:"slight",l:"Touched wall with difficulty"},{v:"limited",l:"Almost touched"},{v:"mod_limited",l:"Couldn't reach"},{v:"painful",l:"Pain prevented it"}] },
          // ── ELBOWS ──
          { id:"elbows", label:"Elbow Flexion/Extension", icon:"💪", group:"Elbows & Wrists", test:"Fully straighten both arms, then bend them to touch your shoulders.",
            opts:[{v:"full",l:"Full range both ways"},{v:"slight",l:"Full range with effort"},{v:"limited",l:"Slightly restricted"},{v:"mod_limited",l:"Can't fully straighten or bend"},{v:"painful",l:"Pain prevented it"}] },
          // ── WRISTS ──
          { id:"wrists", label:"Wrist Flexion/Extension", icon:"🤲", group:"Elbows & Wrists", test:"Place palms together in prayer position. Push hands down while keeping palms flat. Then reverse (backs of hands together).",
            opts:[{v:"full",l:"Both directions comfortable"},{v:"slight",l:"Comfortable with some effort"},{v:"limited",l:"Some stiffness"},{v:"mod_limited",l:"Very limited bend"},{v:"painful",l:"Pain prevented it"}] },
          // ── HIPS (4 sub-tests) ──
          { id:"hip_flexion", label:"Hip Flexion", icon:"🧘", group:"Hips", test:"Lying on your back, pull one knee toward your chest. How far does it go?",
            opts:[{v:"full",l:"Knee touches chest easily"},{v:"slight",l:"Touches with difficulty"},{v:"limited",l:"Close but not there"},{v:"mod_limited",l:"Significantly limited"},{v:"painful",l:"Pain prevented it"}] },
          { id:"hip_ir", label:"Hip Internal Rotation", icon:"🔄", group:"Hips", test:"Sitting with knee bent 90°, let your foot swing outward (rotating shin out). How far does it go?",
            opts:[{v:"full",l:"Full rotation easily"},{v:"slight",l:"Rotates with difficulty"},{v:"limited",l:"Noticeably limited"},{v:"mod_limited",l:"Very limited"},{v:"painful",l:"Pain prevented it"}] },
          { id:"hip_er", label:"Hip External Rotation", icon:"🔄", group:"Hips", test:"Sitting with knee bent 90°, let your foot swing inward (rotating shin in). How far?",
            opts:[{v:"full",l:"Full rotation easily"},{v:"slight",l:"Rotates with difficulty"},{v:"limited",l:"Noticeably limited"},{v:"mod_limited",l:"Very limited"},{v:"painful",l:"Pain prevented it"}] },
          { id:"hip_ext", label:"Hip Extension", icon:"🦵", group:"Hips", test:"Lying face down, lift one straight leg up behind you. How high?",
            opts:[{v:"full",l:"Good lift easily"},{v:"slight",l:"Lifts with difficulty"},{v:"limited",l:"Moderate lift only"},{v:"mod_limited",l:"Barely lifts"},{v:"painful",l:"Pain prevented it"}] },
          // ── KNEES ──
          { id:"knee_left", label:"Left Knee", icon:"🦵", group:"Knees", test:"Stand on one leg. Slowly bend your left knee as deep as you can (hold a wall for balance).",
            opts:[{v:"full",l:"Deep bend easily"},{v:"slight",l:"Deep bend with difficulty"},{v:"limited",l:"Moderate bend only"},{v:"mod_limited",l:"Very shallow bend"},{v:"painful",l:"Pain prevented it"}] },
          { id:"knee_right", label:"Right Knee", icon:"🦵", group:"Knees", test:"Same test — right leg.",
            opts:[{v:"full",l:"Deep bend easily"},{v:"slight",l:"Deep bend with difficulty"},{v:"limited",l:"Moderate bend only"},{v:"mod_limited",l:"Very shallow bend"},{v:"painful",l:"Pain prevented it"}] },
          // ── ANKLES ──
          { id:"ankles", label:"Ankle Dorsiflexion", icon:"🦶", group:"Ankles & Feet", test:"Face a wall, foot 4 inches away. Push your knee toward the wall while keeping heel down.",
            opts:[{v:"full",l:"Knee touched wall easily"},{v:"slight",l:"Touched wall with difficulty"},{v:"limited",l:"Close but not there"},{v:"mod_limited",l:"Heel lifted"},{v:"painful",l:"Pain prevented it"}] },
          // ── FEET ──
          { id:"feet", label:"Toe / Foot Dorsiflexion", icon:"🦶", group:"Ankles & Feet", test:"Sitting, pull your toes up toward your shin as far as you can.",
            opts:[{v:"full",l:"Good pull-up range"},{v:"slight",l:"Full range with effort"},{v:"limited",l:"Slightly limited"},{v:"mod_limited",l:"Very stiff"},{v:"painful",l:"Pain prevented it"}] },
        ];
        const optColor = v => v === "full" ? C.success : v === "slight" ? "#4ade80" : v === "limited" ? C.warning : v === "mod_limited" ? (C.orange || "#f97316") : C.danger;
        const tierMsg = v => v === "slight" ? { color: "#4ade80", text: "Light tightness detected — adding mobility work to maintain and improve." }
          : v === "limited" ? { color: C.warning, text: "Moderate limitation — adding focused mobility work. You'll see improvement in 4-6 weeks." }
          : v === "mod_limited" ? { color: C.orange || "#f97316", text: "Significant limitation — daily mobility work prescribed. This is priority for your joint health." }
          : v === "painful" ? { color: C.danger, text: "Pain is limiting your ROM. We're adding gentle mobility work. If pain persists after 2 weeks, consider seeing a PT." }
          : null;
        const flagged = Object.entries(rom).filter(([, v]) => v !== "full");
        const groups = [...new Set(ROM_TESTS.map(t => t.group))];
        return <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>RANGE OF MOTION</div><div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.5, marginTop: 4 }}>Try each self-test and pick the closest result. Limited areas get mobility work added — exercises are modified, not removed.</div><div style={{ fontSize: 11, color: C.textDim, marginTop: 4, fontStyle: "italic" }}>For the most accurate assessment, have someone watch you or record yourself.</div></div>
          <WhyHelper screenNum={10} />
          {groups.map(grp => <div key={grp}>
            <div style={{ fontSize: 11, color: C.textDim, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600, margin: "6px 0 4px" }}>{grp}</div>
            {ROM_TESTS.filter(t => t.group === grp).map(joint => {
              const msg = tierMsg(rom[joint.id]);
              return <Card key={joint.id} style={{ padding: 12, marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}><span style={{ fontSize: 14 }}>{joint.icon}</span><div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{joint.label}</div></div>
                <div style={{ fontSize: 12, color: C.info, lineHeight: 1.5, marginBottom: 8, padding: "6px 8px", background: C.info + "08", borderRadius: 8, borderLeft: `2px solid ${C.info}30` }}>{joint.test}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {joint.opts.map(opt => {
                    const oc = optColor(opt.v);
                    return <button key={opt.v} onClick={() => setRom(p => ({ ...p, [joint.id]: p[joint.id] === opt.v ? "full" : opt.v }))}
                      style={{ padding: "7px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600, textAlign: "left", cursor: "pointer", lineHeight: 1.3,
                        background: rom[joint.id] === opt.v ? oc + "15" : "transparent",
                        border: `1px solid ${rom[joint.id] === opt.v ? oc : C.border}`,
                        color: rom[joint.id] === opt.v ? oc : C.textDim }}>{opt.l}</button>;
                  })}
                </div>
                {msg && <div style={{ fontSize: 11, color: msg.color, marginTop: 6, lineHeight: 1.4 }}>{msg.text}</div>}
              </Card>;
            })}
          </div>)}
          {flagged.length > 0 && <Card style={{ padding: 10, borderColor: C.info + "40", background: C.info + "08" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.info, marginBottom: 4 }}>{flagged.length} area{flagged.length !== 1 ? "s" : ""} flagged for mobility work</div>
            <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.5 }}>Limited ROM won't block exercises — we modify movements to work within your current range and add targeted mobility to improve it.</div>
          </Card>}
          <Btn onClick={next}>Next — Goals →</Btn>
        </div>;
      })()}

      {/* ── SCREEN 11: GOALS (was 4) ─────────────────────── */}
      {screen === 11 && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>GOALS FOR YOUR BODY & FITNESS</div><div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.5, marginTop: 4 }}>What do you want to achieve? Select goals for each area of your body. This shapes your entire training plan.</div><div style={{ fontSize: 11, color: C.textDim, marginTop: 4, fontStyle: "italic" }}>Tap to select. Tap again to deselect. Select all that apply.</div></div>
        <WhyHelper screenNum={11} />
        {MUSCLE_GROUPS.map(mg => {
          const sel = Array.isArray(goals[mg.id]) ? goals[mg.id] : [];
          return (
            <Card key={mg.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><span style={{ fontSize: 16 }}>{mg.icon}</span><span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{mg.label}</span>{sel.length > 0 && <Badge color={C.teal}>{sel.length}</Badge>}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {GOAL_OPTIONS.map(opt => {
                  const active = sel.includes(opt.v);
                  return <button key={opt.v} onClick={() => setGoals(p => {
                    const cur = Array.isArray(p[mg.id]) ? p[mg.id] : [];
                    return { ...p, [mg.id]: active ? cur.filter(x => x !== opt.v) : [...cur, opt.v] };
                  })} style={{ padding: "6px 10px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer",
                    background: active ? opt.c + "20" : "transparent",
                    border: `1px solid ${active ? opt.c + "60" : C.border}`,
                    color: active ? opt.c : C.textDim }}>{active ? "✓ " : ""}{opt.l}</button>;
                })}
              </div>
            </Card>
          );
        })}
        {compensatoryAdds.length > 0 && <Card style={{ borderColor: C.info + "30", background: C.info + "08" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.info, letterSpacing: 1.5, marginBottom: 4 }}>BUILDING YOUR PERSONALIZED WORKOUT</div>
          <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5, marginBottom: 8 }}>We've also added exercises to protect the areas you're NOT training — this prevents muscle imbalances and injury.</div>
          {compensatoryAdds.map((a, i) => (
            <div key={i} style={{ fontSize: 12, color: C.text, padding: "3px 0", borderBottom: `1px solid ${C.border}` }}>
              <b style={{ color: C.teal }}>{a.muscle}</b> — {a.reason}
            </div>
          ))}
        </Card>}
        {/* Lower body minimum guarantee */}
        {!(goals.legs?.length > 0 || goals.glutes?.length > 0) && <Card style={{ borderColor: C.warning + "30", background: C.warning + "06" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.warning, marginBottom: 4 }}>FOUNDATIONAL BALANCE WORK INCLUDED</div>
          <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>Even though lower body isn't your focus, we've included foundational hip and core work to keep you balanced and injury-free. You can't build a strong house on a weak foundation.</div>
        </Card>}
        {/* Physique sub-questions — shown when any muscle has 'size' goal */}
        {Object.values(goals).some(g => (Array.isArray(g) ? g : [g]).includes("size")) && <>
          <Card style={{ borderColor: "#a855f7" + "30", background: "#a855f7" + "05" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#a855f7", letterSpacing: 1.5, marginBottom: 8 }}>PHYSIQUE GOAL</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 10 }}>What's your physique goal?</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {[
                { id: "general", l: "General Muscle Building", d: "Want to look better, no competition plans", i: "💪" },
                { id: "mens_physique", l: "NPC Men's Physique", d: "V-taper: shoulders, back, chest, arms", i: "🏖️" },
                { id: "classic_physique", l: "NPC Classic Physique", d: "Balanced full-body, golden era", i: "🏛️" },
                { id: "bodybuilding", l: "NPC Bodybuilding", d: "Maximum mass & conditioning", i: "🏋️" },
                { id: "bikini", l: "NPC Bikini", d: "Toned, lean, glute/shoulder emphasis", i: "👙" },
                { id: "figure", l: "NPC Figure", d: "Athletic, muscular, balanced", i: "🏆" },
                { id: "wellness", l: "NPC Wellness", d: "Lower body emphasis: glutes, quads, hams", i: "🍑" },
                { id: "womens_physique", l: "NPC Women's Physique", d: "Muscular, symmetrical, full", i: "💎" },
                { id: "no_compete", l: "Not Competing", d: "Just maximize muscle growth", i: "📈" },
              ].map(opt => (
                <button key={opt.id} onClick={() => setPhysiqueCategory(opt.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, textAlign: "left", cursor: "pointer",
                  background: physiqueCategory === opt.id ? "#a855f7" + "15" : "transparent",
                  border: `1px solid ${physiqueCategory === opt.id ? "#a855f7" + "60" : C.border}`,
                  color: physiqueCategory === opt.id ? "#a855f7" : C.textDim }}>
                  <span style={{ fontSize: 18 }}>{opt.i}</span>
                  <div><div style={{ fontSize: 13, fontWeight: 600 }}>{opt.l}</div><div style={{ fontSize: 10, color: C.textDim }}>{opt.d}</div></div>
                </button>
              ))}
            </div>
          </Card>
          <Card style={{ borderColor: "#f97316" + "30" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#f97316", letterSpacing: 1.5, marginBottom: 8 }}>TRAINING EXPERIENCE</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 10 }}>Your hypertrophy training experience?</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {[
                { id: "beginner", l: "New (< 1 yr)", i: "🌱" },
                { id: "intermediate", l: "Intermediate (1-3 yr)", i: "📊" },
                { id: "advanced", l: "Advanced (3+ yr)", i: "🔥" },
                { id: "competitor", l: "Competitor", i: "🏆" },
              ].map(opt => (
                <button key={opt.id} onClick={() => setHypertrophyExperience(opt.id)} style={{ flex: 1, minWidth: 100, padding: "8px 6px", borderRadius: 10, textAlign: "center", cursor: "pointer",
                  background: hypertrophyExperience === opt.id ? "#f97316" + "15" : "transparent",
                  border: `1px solid ${hypertrophyExperience === opt.id ? "#f97316" + "60" : C.border}`,
                  color: hypertrophyExperience === opt.id ? "#f97316" : C.textDim, fontSize: 12, fontWeight: 600 }}>
                  {opt.i} {opt.l}
                </button>
              ))}
            </div>
          </Card>
          <Card style={{ borderColor: C.danger + "30" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.danger, letterSpacing: 1.5, marginBottom: 4 }}>PICK UP TO 3 PRIORITY WEAK POINTS</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8, lineHeight: 1.5 }}>Which muscles need the most attention? We'll add extra volume for these areas while keeping your training balanced. Rank them — #1 gets the most focus.</div>
            {/* Selected weak points with rank badges */}
            {weakPoints.length > 0 && <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
              {weakPoints.map((wpId, i) => {
                const rankColors = ["#FFD700", "#C0C0C0", "#CD7F32"];
                const rankLabels = weakPoints.length === 1 ? ["TOP PRIORITY — 100% extra volume"] : weakPoints.length === 2 ? ["TOP PRIORITY — 70% extra volume", "HIGH PRIORITY — 30% extra volume"] : ["TOP PRIORITY — 50% extra volume", "HIGH PRIORITY — 30% extra volume", "MODERATE — 20% extra volume"];
                const wpLabel = wpId.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                return <div key={wpId} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: C.bgElevated, borderRadius: 8, border: `1px solid ${rankColors[i] || C.border}30` }}>
                  <span style={{ width: 20, height: 20, borderRadius: 10, background: (rankColors[i] || C.textDim) + "30", color: rankColors[i] || C.textDim, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>#{i + 1}</span>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: C.text }}>{wpLabel}</span>
                  <span style={{ fontSize: 8, color: rankColors[i] || C.textDim, fontWeight: 700, letterSpacing: 0.5 }}>{rankLabels[i] || ""}</span>
                  <button onClick={() => setWeakPoints(p => p.filter(x => x !== wpId))} style={{ width: 20, height: 20, borderRadius: 6, border: "none", background: "#ef444415", color: "#ef4444", cursor: "pointer", fontSize: 11, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>;
              })}
              <div style={{ fontSize: 9, color: C.textDim, marginTop: 2 }}>Order = priority. First selected = #1 (most extra volume).</div>
            </div>}
            {weakPoints.length >= 3 && <div style={{ fontSize: 11, color: C.warning, marginBottom: 6 }}>3 maximum. Remove one to add a different area.</div>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {["Chest","Back Width","Back Thickness","Front Delts","Side Delts","Rear Delts","Biceps","Triceps","Forearms","Quads","Hamstrings","Glutes","Calves","Abs","Traps"].map(wp => {
                const id = wp.toLowerCase().replace(/\s+/g, "_");
                const active = weakPoints.includes(id);
                const maxed = weakPoints.length >= 3 && !active;
                return <button key={id} disabled={maxed} onClick={() => setWeakPoints(p => active ? p.filter(x => x !== id) : [...p, id])} style={{ padding: "5px 9px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: maxed ? "not-allowed" : "pointer", opacity: maxed ? 0.35 : 1,
                  background: active ? C.danger + "15" : "transparent",
                  border: `1px solid ${active ? C.danger + "60" : C.border}`,
                  color: active ? C.danger : C.textDim }}>{active ? "✓ " : ""}{wp}</button>;
              })}
            </div>
            {weakPoints.length > 0 && <div style={{ fontSize: 11, color: C.teal, marginTop: 6 }}>Priority muscles get +3-4 extra sets/week (#1), +2-3 (#2), or +1-2 (#3) from accessory slots.</div>}
            <div style={{ fontSize: 10, color: C.textDim, marginTop: 6, lineHeight: 1.5, fontStyle: "italic" }}>Why only 3? Training everything as a priority means nothing is a priority. Focusing extra volume on 3 areas produces faster visible results. You can change these anytime.</div>
          </Card>
        </>}
        <Btn onClick={next}>Next — Preferences →</Btn>
      </div>}

      {/* ── SCREEN 12: TRAINING PREFERENCES (was 5) ─────── */}
      {screen === 12 && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>TRAINING PREFERENCES</div><div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.5, marginTop: 4 }}>How do you want to train? We'll build your plan around these choices.</div></div>
        <WhyHelper screenNum={12} />
        {/* Training experience + recency (detraining-aware) */}
        <Card>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>What's your training experience?</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>Your overall history with structured exercise.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {[{v:"foundation",l:"Foundation — new to structured exercise"},{v:"building",l:"Building — 1-3 years experience"},{v:"performance",l:"Performance — 3+ years experience"},{v:"professional",l:"Professional / Competitive athlete"}].map(opt => {
              const sel = trainingExperience === opt.v;
              return <button key={opt.v} onClick={() => setTrainingExperience(opt.v)} style={{ padding: "8px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left", background: sel ? C.teal + "20" : "transparent", border: `1px solid ${sel ? C.teal + "60" : C.border}`, color: sel ? C.teal : C.textDim }}>{sel ? "✓ " : ""}{opt.l}</button>;
            })}
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>How consistently have you trained in the LAST 6 WEEKS?</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>Recent training matters more than history for where we start you.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {[{v:"none",l:"Not at all (0 sessions in 6 weeks)"},{v:"occasional",l:"Occasionally (1-4 sessions total)"},{v:"somewhat",l:"Somewhat consistent (1-2x per week)"},{v:"consistent",l:"Consistent (3-4x per week)"},{v:"very_consistent",l:"Very consistent (5+ per week)"}].map(opt => {
              const sel = trainingRecency === opt.v;
              return <button key={opt.v} onClick={() => setTrainingRecency(opt.v)} style={{ padding: "8px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left", background: sel ? C.teal + "20" : "transparent", border: `1px solid ${sel ? C.teal + "60" : C.border}`, color: sel ? C.teal : C.textDim }}>{sel ? "✓ " : ""}{opt.l}</button>;
            })}
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>Before these last 6 weeks, how long were you training consistently?</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>This tells us how much muscle memory you have to draw on.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {[{v:"months_off",l:"Haven't been consistent for months"},{v:"1_3_months",l:"Was consistent for 1-3 months before slowing"},{v:"3_6_months",l:"Was consistent for 3-6 months"},{v:"6_plus_months",l:"Was consistent for 6+ months"},{v:"years",l:"Was consistent for years"}].map(opt => {
              const sel = trainingHistory === opt.v;
              return <button key={opt.v} onClick={() => setTrainingHistory(opt.v)} style={{ padding: "8px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left", background: sel ? C.teal + "20" : "transparent", border: `1px solid ${sel ? C.teal + "60" : C.border}`, color: sel ? C.teal : C.textDim }}>{sel ? "✓ " : ""}{opt.l}</button>;
            })}
          </div>
        </Card>
        {/* Detraining insight message */}
        {trainingExperience && trainingRecency && (() => {
          const expHigh = trainingExperience === "performance" || trainingExperience === "professional";
          const recentLow = trainingRecency === "none" || trainingRecency === "occasional";
          const historyHigh = trainingHistory === "6_plus_months" || trainingHistory === "years";
          if (expHigh && recentLow) return <Card style={{ padding: 10, borderColor: C.info + "40", background: C.info + "08" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.info, marginBottom: 4 }}>Returning athlete detected</div>
            <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>You have {trainingExperience === "professional" ? "professional" : "advanced"} experience but haven't trained consistently recently. We're starting you at a moderate level and progressing faster than a beginner because your body remembers the movements. {historyHigh ? "With your training history, you'll be back to your level in 4-6 weeks." : "You'll rebuild your base quickly."}</div>
          </Card>;
          if (!expHigh && recentLow) return <Card style={{ padding: 10, borderColor: C.warning + "40", background: C.warning + "08" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.warning, marginBottom: 4 }}>Building your foundation</div>
            <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>We'll start with movement quality and build intensity gradually. Consistency is more important than intensity right now.</div>
          </Card>;
          return null;
        })()}
        {/* Days per week */}
        <Card>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>Days per week available</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[2, 3, 4, 5, 6].map(d => (
              <button key={d} onClick={() => setPrefs(p => ({ ...p, daysPerWeek: d }))}
                style={{ flex: 1, padding: "10px 4px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer",
                  background: prefs.daysPerWeek === d ? C.tealBg : "transparent",
                  border: `1px solid ${prefs.daysPerWeek === d ? C.teal : C.border}`,
                  color: prefs.daysPerWeek === d ? C.teal : C.textDim }}>{d}</button>
            ))}
          </div>
        </Card>
        {/* Session time */}
        <Card>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>Session duration (minutes)</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[30, 45, 60, 90].map(t => (
              <button key={t} onClick={() => setPrefs(p => ({ ...p, sessionTime: t }))}
                style={{ flex: 1, padding: "10px 4px", borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: "pointer",
                  background: prefs.sessionTime === t ? C.tealBg : "transparent",
                  border: `1px solid ${prefs.sessionTime === t ? C.teal : C.border}`,
                  color: prefs.sessionTime === t ? C.teal : C.textDim }}>{t}</button>
            ))}
          </div>
        </Card>
        {/* Home equipment */}
        <Card>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>Equipment at home</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {HOME_EQUIPMENT_OPTIONS.map(eq => {
              const sel = prefs.homeEquipment.includes(eq.id);
              return (
                <button key={eq.id} onClick={() => setPrefs(p => {
                  if (eq.id === "none") return { ...p, homeEquipment: sel ? [] : ["none"] };
                  return { ...p, homeEquipment: sel ? p.homeEquipment.filter(x => x !== eq.id) : [...p.homeEquipment.filter(x => x !== "none"), eq.id] };
                })} style={{ padding: "8px 10px", borderRadius: 8, fontSize: 15, textAlign: "left", cursor: "pointer",
                  background: sel ? C.tealBg : "transparent", border: `1px solid ${sel ? C.teal + "60" : C.border}`, color: sel ? C.teal : C.textDim }}>
                  {sel ? "✅ " : "○ "}{eq.label}
                </button>
              );
            })}
          </div>
        </Card>
        {/* Sports — Max 3, ranked by priority */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>Pick Your Top 3 Sports or Activities</div>
          <div style={{ fontSize: 11, color: C.textDim, marginBottom: 6, lineHeight: 1.5 }}>Training for fewer sports = faster improvement in each. We'll shape your workouts around these. Rank them by how often you play — #1 gets the most training focus.</div>
          {/* Selected sports with rank badges */}
          {prefs.sports.length > 0 && <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
            {prefs.sports.filter(s => s !== "None").map((s, i) => {
              const rankColors = ["#FFD700", "#C0C0C0", "#CD7F32"];
              const rankLabels = prefs.sports.filter(x => x !== "None").length === 1 ? ["PRIMARY — 100% focus"] : prefs.sports.filter(x => x !== "None").length === 2 ? ["PRIMARY — 70% focus", "SECONDARY — 30% focus"] : ["PRIMARY — 60% focus", "SECONDARY — 30% focus", "TERTIARY — 10% focus"];
              return (<div key={s} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: C.bgElevated, borderRadius: 8, border: `1px solid ${rankColors[i] || C.border}30` }}>
                <span style={{ width: 20, height: 20, borderRadius: 10, background: (rankColors[i] || C.textDim) + "30", color: rankColors[i] || C.textDim, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>#{i + 1}</span>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: C.text }}>{s}</span>
                <span style={{ fontSize: 8, color: rankColors[i] || C.textDim, fontWeight: 700, letterSpacing: 0.5 }}>{rankLabels[i] || "SUPPORT"}</span>
                <button onClick={() => setPrefs(p => ({ ...p, sports: p.sports.filter(x => x !== s) }))} style={{ width: 20, height: 20, borderRadius: 6, border: "none", background: "#ef444415", color: "#ef4444", cursor: "pointer", fontSize: 11, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              </div>);
            })}
            <div style={{ fontSize: 9, color: C.textDim, marginTop: 2 }}>Order = priority. First selected = #1 (most focus).</div>
          </div>}
          {prefs.sports.filter(s => s !== "None").length >= 3 && <div style={{ padding: "6px 10px", background: C.purple + "10", borderRadius: 8, borderLeft: `3px solid ${C.purple}`, marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: C.purple, fontWeight: 600 }}>3 sport maximum reached. Remove one to add a different sport.</div>
          </div>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {SPORTS.filter(s => s !== "None" && (!prefs.customSport || s.toLowerCase().includes(prefs.customSport.toLowerCase()))).map(s => {
              const sel = prefs.sports.includes(s);
              const atMax = prefs.sports.filter(x => x !== "None").length >= 3 && !sel;
              return (
                <button key={s} onClick={() => { if (atMax) return; setPrefs(p => ({ ...p, sports: sel ? p.sports.filter(x => x !== s) : [...p.sports.filter(x => x !== "None"), s] })); }}
                  style={{ padding: "5px 10px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: atMax ? "default" : "pointer",
                    opacity: atMax ? 0.35 : 1,
                    background: sel ? C.purple + "15" : "transparent",
                    border: `1px solid ${sel ? C.purple + "60" : C.border}`,
                    color: sel ? C.purple : C.textDim }}>{sel ? "✓ " : ""}{s}</button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <input value={prefs.customSport} onChange={e => setPrefs(p => ({ ...p, customSport: e.target.value }))} placeholder="Other sport..."
              style={{ flex: 1, padding: "6px 10px", borderRadius: 8, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text, fontSize: 15, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            {prefs.customSport.trim() && prefs.sports.filter(s => s !== "None").length < 3 && <button onClick={() => { if (prefs.customSport.trim() && !prefs.sports.includes(prefs.customSport.trim())) setPrefs(p => ({ ...p, sports: [...p.sports.filter(x => x !== "None"), p.customSport.trim()], customSport: "" })); }}
              style={{ padding: "6px 10px", borderRadius: 8, background: C.tealBg, border: `1px solid ${C.teal}40`, color: C.teal, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>+ Add</button>}
          </div>
          <button onClick={() => setPrefs(p => ({ ...p, sports: ["None"] }))} style={{ display: "block", marginTop: 6, padding: "6px 10px", borderRadius: 8, background: prefs.sports.includes("None") ? C.tealBg : "transparent", border: `1px solid ${prefs.sports.includes("None") ? C.teal + "40" : C.border}`, color: prefs.sports.includes("None") ? C.teal : C.textDim, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{prefs.sports.includes("None") ? "✓ " : ""}No sports — general fitness only</button>
        </Card>
        {/* Favorite exercises — curated grid + search */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>Favorite Exercises</div>
          <div style={{ fontSize: 16, color: C.textMuted, marginBottom: 10, lineHeight: 1.5 }}>Select exercises you enjoy or want to work toward. We'll prioritize these in your plan, or build a progression roadmap if you're not ready for them yet.</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            {FAVORITE_GRID.map(fe => {
              const fav = prefs.favorites.includes(fe.dbId);
              const dbEx = exerciseDB.find(e => e.id === fe.dbId);
              const blocked = dbEx && (dbEx.safetyTier === "red" || !(dbEx.phaseEligibility || []).includes(1));
              return <button key={fe.dbId+fe.name} onClick={() => setPrefs(p => ({ ...p, favorites: fav ? p.favorites.filter(x => x !== fe.dbId) : [...p.favorites, fe.dbId] }))}
                style={{ padding: "10px 4px", borderRadius: 10, textAlign: "center", cursor: "pointer",
                  background: fav ? C.tealBg : blocked ? C.bgGlass : "transparent", border: `1px solid ${fav ? C.teal + "60" : C.border}`, position: "relative" }}>
                {dbEx && <ExerciseImage exercise={dbEx} size="thumb" />}
                {!dbEx && <div style={{ fontSize: 20, marginBottom: 2 }}>{fe.emoji}</div>}
                <div style={{ fontSize: 15, color: fav ? C.teal : C.text, fontWeight: fav ? 700 : 500, marginTop: 4, lineHeight: 1.2 }}>{fe.name}</div>
                {dbEx && <div style={{ fontSize: 14, color: C.textDim, marginTop: 2 }}>{(dbEx.bodyPart || "").replace(/_/g, " ")}</div>}
                {blocked && !fav && <span style={{ display: "inline-block", marginTop: 3, fontSize: 14, fontWeight: 700, color: C.purple, background: C.purple + "15", padding: "1px 5px", borderRadius: 4 }}>GOAL</span>}
                {fav && <div style={{ position: "absolute", top: 3, right: 3, fontSize: 14 }}>⭐</div>}
              </button>;
            })}
          </div>
          {/* Advanced search */}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search all 300 exercises..."
            style={{ width: "100%", padding: "8px 12px", borderRadius: 10, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text, fontSize: 15, fontFamily: "inherit", outline: "none", marginTop: 10, boxSizing: "border-box" }} />
          {search.trim().length >= 2 && <div style={{ maxHeight: 120, overflowY: "auto", marginTop: 4 }}>
            {exerciseDB.filter(e => e.name.toLowerCase().includes(search.toLowerCase())).slice(0, 6).map(e => {
              const fav = prefs.favorites.includes(e.id);
              return <div key={e.id} onClick={() => setPrefs(p => ({ ...p, favorites: fav ? p.favorites.filter(x => x !== e.id) : [...p.favorites, e.id] }))}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", cursor: "pointer", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 16 }}>{e.emoji}</span><span style={{ fontSize: 14, color: fav ? C.teal : C.text, flex: 1 }}>{e.name}</span>{fav && <span style={{ fontSize: 14 }}>⭐</span>}
              </div>;
            })}
          </div>}
          {prefs.favorites.length > 0 && <div style={{ fontSize: 14, color: C.teal, marginTop: 6 }}>{prefs.favorites.length} exercise{prefs.favorites.length !== 1 ? "s" : ""} favorited</div>}
          {prefs.favorites.length > 8 && <div style={{ fontSize: 12, color: "#f97316", marginTop: 4, padding: "8px 10px", background: "#f97316" + "10", borderRadius: 8, lineHeight: 1.5 }}>You've selected {prefs.favorites.length} favorites. We'll rotate them through your workouts to maintain balanced muscle development. Not all favorites will appear in every session — this prevents overtraining one area.</div>}
        </Card>
        {/* Exercise Blacklist */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.danger, marginBottom: 4 }}>Exercises You Want to Avoid</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8, lineHeight: 1.5 }}>Any exercises you dislike or want removed from your plan? We'll find alternatives.</div>
          <input value={prefs.blacklistCustom||""} onChange={e => setPrefs(p => ({ ...p, blacklistCustom: e.target.value }))} placeholder="Search exercises to avoid..." style={{ width: "100%", padding: "8px 12px", borderRadius: 10, background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          {(prefs.blacklistCustom||"").trim().length >= 2 && <div style={{ maxHeight: 120, overflowY: "auto", marginTop: 4 }}>
            {exerciseDB.filter(e => e.name.toLowerCase().includes(prefs.blacklistCustom.toLowerCase())).slice(0, 6).map(e => {
              const bl = prefs.blacklist.includes(e.id);
              return <div key={e.id} onClick={() => setPrefs(p => ({ ...p, blacklist: bl ? p.blacklist.filter(x => x !== e.id) : [...p.blacklist, e.id], blacklistCustom: "" }))}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 0", cursor: "pointer", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 12, color: bl ? C.danger : C.textDim }}>{bl ? "✕" : "○"}</span>
                <span style={{ fontSize: 13, color: bl ? C.danger : C.text, flex: 1 }}>{e.name}</span>
              </div>;
            })}
          </div>}
          {prefs.blacklist.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
            {prefs.blacklist.map(id => { const ex = exerciseDB.find(e => e.id === id); return ex ? <span key={id} onClick={() => setPrefs(p => ({ ...p, blacklist: p.blacklist.filter(x => x !== id) }))} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 8, background: C.danger + "15", border: `1px solid ${C.danger}30`, color: C.danger, fontSize: 11, cursor: "pointer" }}>{ex.name} ✕</span> : null; })}
          </div>}
        </Card>
        <Btn onClick={next}>Next — Summary →</Btn>
      </div>}

      {/* ── SCREEN 13: SUMMARY (was 6) ─────────────────── */}
      {screen === 13 && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><div style={{ fontSize: 24, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 3 }}>{isReassessment ? "UPDATED ASSESSMENT" : "YOUR ASSESSMENT"}</div><div style={{ fontSize: 15, color: C.textMuted }}>{isReassessment ? "Your changes are ready. Plan will be updated immediately." : "Here's what we found. Your first plan is ready."}</div></div>

        {/* Fitness level + progression rate */}
        <Card glow={C.tealGlow} style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.teal, letterSpacing: 2, marginBottom: 6 }}>STARTING LEVEL</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: C.text, fontFamily: "'Bebas Neue',sans-serif" }}>{fitnessLevel === "beginner" ? "FOUNDATION" : fitnessLevel === "intermediate" ? "BUILDING" : "PERFORMANCE"}</div>
          <div style={{ fontSize: 16, color: C.textMuted, marginTop: 4 }}>Starting Phase {startingPhase} — {startingPhase === 1 ? "Stabilization Endurance" : "Strength"}{progressionRate === "accelerated" ? " (accelerated progression)" : ""}</div>
          <div style={{ fontSize: 14, color: C.textDim, marginTop: 8, padding: "8px 10px", background: C.bgGlass, borderRadius: 8, textAlign: "left", lineHeight: 1.6 }}>
            Based on: {trainingExperience ? `${trainingExperience} experience` : "experience"} · {trainingRecency === "none" || trainingRecency === "occasional" ? "recent detraining" : "currently training"} · {conditions.length > 0 ? `${conditions.length} condition${conditions.length > 1 ? "s" : ""}` : "no conditions"} · {Object.values(rom).filter(v => v !== "full").length} ROM areas flagged. This is about protecting you, not ranking you.
          </div>
          {detrainingNote && <div style={{ fontSize: 12, color: C.info, marginTop: 8, padding: "8px 10px", background: C.info + "08", borderRadius: 8, textAlign: "left", lineHeight: 1.5, borderLeft: `3px solid ${C.info}` }}>{detrainingNote}</div>}
        </Card>

        {/* PAR-Q */}
        {anyParqYes && <Card style={{ borderColor: C.warning + "40" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.warning }}>⚠️ PAR-Q+ FLAGS</div>
          <div style={{ fontSize: 14, color: C.textMuted, marginTop: 4 }}>You flagged {parq.filter(a => a).length} health concern{parq.filter(a => a).length > 1 ? "s" : ""}. Proceeding with caution — lower intensity, more monitoring.</div>
        </Card>}

        {/* Conditions */}
        {conditions.length > 0 && <Card>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.danger, letterSpacing: 1.5, marginBottom: 6 }}>ACTIVE CONDITIONS ({conditions.length})</div>
          {conditions.map(c => (
            <div key={c.conditionId} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 15, color: C.text }}>{c.name}</span>
              <Badge color={c.severity <= 2 ? C.success : c.severity <= 3 ? C.warning : C.danger}>Sev {c.severity}</Badge>
            </div>
          ))}
          <div style={{ fontSize: 14, color: C.textMuted, marginTop: 6 }}>Each condition shapes exercise selection, contraindications, and mandatory protocols.</div>
        </Card>}

        {/* Compensations */}
        {detectedComps.length > 0 && <Card>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.warning, letterSpacing: 1.5, marginBottom: 6 }}>COMPENSATIONS DETECTED ({detectedComps.length})</div>
          {detectedComps.map(c => (
            <div key={c.id} style={{ padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>{c.name}</div>
              <div style={{ fontSize: 14, color: C.textMuted }}>Correction: foam roll {(c.protocol?.inhibit?.exercises || []).length} areas → stretch {(c.protocol?.lengthen?.exercises || []).length} → activate {(c.protocol?.activate?.exercises || []).length} → integrate {(c.protocol?.integrate?.exercises || []).length}</div>
            </div>
          ))}
        </Card>}

        {/* ROM */}
        <Card>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.info, letterSpacing: 1.5, marginBottom: 6 }}>ROM ASSESSMENT</div>
          {Object.entries(rom).map(([joint, status]) => (
            <div key={joint} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
              <span style={{ fontSize: 15, color: C.text }}>{joint.charAt(0).toUpperCase() + joint.slice(1)}</span>
              <Badge color={status === "full" ? C.success : status === "limited" ? C.warning : C.danger}>{status}</Badge>
            </div>
          ))}
        </Card>

        {/* Goals + compensatory */}
        <Card>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.purple, letterSpacing: 1.5, marginBottom: 6 }}>GOALS</div>
          {Object.entries(goals).filter(([, v]) => (Array.isArray(v) ? v.length > 0 : v && v !== "none")).map(([m, g]) => {
            const ga = Array.isArray(g) ? g : [g];
            return <div key={m} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0" }}>
              <span style={{ fontSize: 15, color: C.text }}>{m.charAt(0).toUpperCase() + m.slice(1)}</span>
              <div style={{ display: "flex", gap: 3 }}>{ga.map(gg => <Badge key={gg} color={gg === "size" ? C.purple : gg === "strength" ? C.teal : gg === "injury_prevention" ? C.warning : C.info}>{gg.replace("_"," ")}</Badge>)}</div>
            </div>;
          })}
          {compensatoryAdds.length > 0 && <div style={{ marginTop: 8, padding: 8, background: C.info + "08", borderRadius: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.info, marginBottom: 4 }}>COMPENSATORY ADDITIONS</div>
            {compensatoryAdds.map((a, i) => <div key={i} style={{ fontSize: 14, color: C.textMuted }}>{a.muscle} ← {a.reason}</div>)}
          </div>}
        </Card>

        {/* Preferences summary */}
        <Card>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.teal, letterSpacing: 1.5, marginBottom: 6 }}>TRAINING PLAN</div>
          <div style={{ fontSize: 15, color: C.text }}>{prefs.daysPerWeek} days/week · {prefs.sessionTime} min sessions</div>
          {prefs.homeEquipment.length > 0 && <div style={{ fontSize: 14, color: C.textMuted, marginTop: 2 }}>Home equipment: {prefs.homeEquipment.join(", ")}</div>}
          {prefs.sports.length > 0 && <div style={{ fontSize: 14, color: C.textMuted, marginTop: 2 }}>Sports: {prefs.sports.join(", ")}</div>}
          {prefs.favorites.length > 0 && <div style={{ fontSize: 14, color: C.textMuted, marginTop: 2 }}>{prefs.favorites.length} favorite exercises prioritized</div>}
        </Card>

        {/* First week preview */}
        <Card style={{ borderColor: C.teal + "30" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.teal, letterSpacing: 1.5, marginBottom: 6 }}>WEEK 1 PREVIEW</div>
          <div style={{ fontSize: 15, color: C.textMuted }}>
            Phase {startingPhase} · {prefs.daysPerWeek} sessions · 1-2 sets per exercise{progressionRate === "accelerated" ? " (accelerated — muscle memory)" : " (neural adaptation)"}
          </div>
          <div style={{ fontSize: 14, color: C.textMuted, marginTop: 4 }}>
            Focus: Movement quality, core activation, injury-safe patterns.
            {detectedComps.length > 0 && ` Corrective warm-ups for ${detectedComps.length} compensation(s).`}
            {conditions.length > 0 && ` Modified for ${conditions.length} condition(s).`}
          </div>
          <div style={{ fontSize: 14, color: C.textDim, marginTop: 6, fontStyle: "italic" }}>Your plan adapts every session based on check-in data.</div>
        </Card>

        <Card style={{ background: C.bgGlass, padding: 14 }}>
          <div style={{ fontSize: 15, color: C.textMuted, lineHeight: 1.7 }}>
            Your plan is built by our algorithm that cross-references your goals, conditions, ROM, and 300+ exercises through 12 safety checks. Every exercise is verified safe for <b style={{ color: C.text }}>your specific situation</b> before you see it.
          </div>
        </Card>
        <Btn onClick={handleComplete} icon="🚀" style={{ fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 3, fontSize: 18 }}>{isReassessment ? "UPDATE MY PLAN" : "BUILD MY FIRST PLAN"}</Btn>
      </div>}

      <div style={{ height: 40 }} />
      </>}
    </div>
  );
}
