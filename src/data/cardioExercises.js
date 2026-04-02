// ═══════════════════════════════════════════════════════════════
// APEX Coach — Cardio Exercise Database
// 38 cardio exercises with NASM CPT 7th Ed alignment
// Full metadata: contraindications, zones, muscles, settings
// ═══════════════════════════════════════════════════════════════

const CE = (id, name, opts) => ({
  id, name, category: "cardio", type: "cardio",
  movementPattern: opts.pattern || "locomotion",
  bodyPart: "full_body",
  primaryMuscles: opts.primary || [],
  secondaryMuscles: opts.secondary || [],
  jointsInvolved: opts.joints || ["hip", "knee", "ankle"],
  equipmentRequired: opts.equipment || ["none"],
  locationCompatible: opts.location || ["gym"],
  phaseEligibility: opts.phases || [1, 2, 3, 4, 5],
  difficultyLevel: opts.difficulty || 1,
  safetyTier: opts.safety || "green",
  impact: opts.impact || "low",
  targetZones: opts.zones || [1, 2],
  nasmStage: opts.stage || [1, 2, 3, 4, 5],
  contraindications: {
    severity_gate: opts.gates || {},
    conditions: opts.blockConditions || [],
    injuries: opts.blockInjuries || [],
  },
  substitutions: opts.subs || {},
  phaseParams: {
    "1": { sets: "1", reps: opts.duration1 || "15-25 min", tempo: opts.pace || "Steady state", rest: "N/A", intensity: opts.intensity1 || "Zone 1 (65-75% HRmax)" },
    "2": { sets: "1", reps: opts.duration2 || "20-30 min", tempo: opts.pace || "Steady state", rest: "N/A", intensity: opts.intensity2 || "Zone 1-2 intervals" },
    "3": { sets: "1", reps: opts.duration3 || "20-30 min", tempo: opts.pace3 || opts.pace || "Progressive", rest: "N/A", intensity: opts.intensity3 || "Zone 2 sustained" },
    "4": { sets: "1", reps: opts.duration4 || "20-25 min", tempo: "Intervals", rest: "N/A", intensity: opts.intensity4 || "Zone 2-3 intervals" },
    "5": { sets: "1", reps: opts.duration5 || "15-20 min", tempo: "Sprint intervals", rest: "N/A", intensity: opts.intensity5 || "Zone 3 sprints + Zone 1 recovery" },
  },
  settingsGuidance: opts.settings || null,
  nasmNote: opts.nasmNote || null,
  emoji: opts.emoji || "🫀",
  steps: opts.steps || [],
  formCues: opts.formCues || [],
  commonMistakes: opts.mistakes || [],
  coreBracing: opts.bracing || "LIGHT — natural engagement during movement.",
  breathing: { inhale: "Natural", exhale: "Natural", pattern: opts.breathPattern || "Rhythmic breathing matched to effort level" },
  injuryNotes: opts.injuryNotes || {},
  purpose: opts.purpose || "Cardiovascular conditioning",
  whyForYou: opts.why || "Prescribed cardio matched to your phase and conditions.",
  proTip: opts.tip || "",
  tags: ["cardio", ...(opts.tags || [])],
  methodology: ["cpt"],
  progressionChain: opts.progression || null,
});

const CARDIO_EXERCISES = [
  // ══════════ GYM MACHINES ══════════

  CE("cardio_treadmill_walk", "Treadmill Walking (Flat)", {
    primary: ["Quadriceps", "Hamstrings", "Calves", "Glutes"], secondary: ["TVA", "Hip Stabilizers"],
    equipment: ["treadmill"], location: ["gym"], phases: [1,2,3,4,5], difficulty: 1, impact: "low",
    zones: [1,2], stage: [1,2], gates: { lower_back: 5, knee: 5, shoulder: 5 },
    duration1: "20-30 min", duration2: "25-35 min",
    intensity1: "Zone 1 (65-75% HRmax) — conversational pace",
    intensity2: "Zone 1-2 — brisk walking intervals",
    settings: "Speed 2.5-3.5 mph. No incline. Stand upright, swing arms naturally.",
    emoji: "🚶", tags: ["walking", "beginner", "zone1", "zone2", "all_phases"],
    steps: ["Set treadmill to flat (0% incline)", "Start at 2.5 mph, increase to comfortable brisk pace", "Maintain upright posture — no leaning on handrails", "Swing arms naturally at your sides", "Target: can hold full conversation"],
    formCues: ["Head up, eyes forward", "Heel-to-toe gait pattern", "Shoulders relaxed, not hunched", "Core gently engaged"],
    mistakes: ["Holding handrails (reduces calorie burn 20-25%)", "Looking down at phone (neck strain)", "Shuffling feet instead of full stride"],
    purpose: "Zone 1-2 cardiovascular training. Safest cardio for nearly all conditions.",
    tip: "Post-meal walks (10-15 min) improve glucose response and digestion.",
    progression: { level: 1, chainFamily: "treadmill", progressTo: "cardio_treadmill_incline" },
  }),

  CE("cardio_treadmill_incline", "Treadmill Walking (Incline)", {
    primary: ["Glutes", "Hamstrings", "Calves", "Quadriceps"], secondary: ["Core", "Hip Flexors"],
    equipment: ["treadmill"], location: ["gym"], phases: [2,3,4,5], difficulty: 3, impact: "moderate",
    zones: [2,3], stage: [2,3], gates: { lower_back: 4, knee: 4 },
    duration2: "20-30 min", duration3: "20-30 min",
    intensity2: "Zone 2 (76-85% HRmax)", intensity3: "Zone 2-3 intervals",
    settings: "Incline 10-15%, speed 2.5-3.5 mph. Do NOT hold handrails — let your body work.",
    emoji: "⛰️", tags: ["incline", "glutes", "zone2", "zone3", "fat_loss"],
    steps: ["Set incline to 10-15%", "Speed 2.5-3.5 mph", "DO NOT hold handrails", "Lean slightly forward from ankles", "Drive through heels for glute activation"],
    formCues: ["Arms swinging freely — no rail grabbing", "Slight forward lean at ankles, not waist", "Full heel-to-toe steps", "Glutes should be working hard"],
    mistakes: ["Holding handrails (negates the incline benefit entirely)", "Speed too fast — walk, don't run", "Leaning too far forward from waist"],
    purpose: "Glute development + fat loss. High calorie burn without running impact.",
    tip: "12% incline at 3.0 mph burns similar calories to running 6 mph with far less joint stress.",
    progression: { level: 2, chainFamily: "treadmill", regressTo: "cardio_treadmill_walk", progressTo: "cardio_treadmill_jog" },
  }),

  CE("cardio_treadmill_jog", "Treadmill Jogging", {
    primary: ["Quadriceps", "Hamstrings", "Calves", "Glutes", "Hip Flexors"], secondary: ["Core", "Tibialis Anterior"],
    equipment: ["treadmill"], location: ["gym"], phases: [2,3,4,5], difficulty: 4, impact: "moderate",
    zones: [2,3], stage: [2,3,4], gates: { lower_back: 3, knee: 3 },
    settings: "Speed 4.5-6.0 mph. Flat or 1% incline (simulates outdoor air resistance).",
    emoji: "🏃", tags: ["jogging", "running", "zone2", "zone3"],
    progression: { level: 3, chainFamily: "treadmill", regressTo: "cardio_treadmill_incline", progressTo: "cardio_treadmill_run" },
  }),

  CE("cardio_treadmill_run", "Treadmill Running", {
    primary: ["Quadriceps", "Hamstrings", "Calves", "Glutes", "Hip Flexors"], secondary: ["Core"],
    equipment: ["treadmill"], location: ["gym"], phases: [3,4,5], difficulty: 6, impact: "high",
    zones: [3], stage: [3,4,5], gates: { lower_back: 3, knee: 2 },
    settings: "Speed 6.0-8.0+ mph.",
    emoji: "🏃", tags: ["running", "zone3", "high_impact"],
    progression: { level: 4, chainFamily: "treadmill", regressTo: "cardio_treadmill_jog", progressTo: "cardio_treadmill_sprint" },
  }),

  CE("cardio_treadmill_sprint", "Treadmill Sprint Intervals", {
    primary: ["Quadriceps", "Hamstrings", "Glutes", "Calves"], secondary: ["Core", "Hip Flexors"],
    equipment: ["treadmill"], location: ["gym"], phases: [4,5], difficulty: 8, impact: "high", safety: "yellow",
    zones: [3], stage: [5], gates: { lower_back: 2, knee: 2, ankle: 2 },
    duration4: "15-20 min", duration5: "15-20 min",
    intensity4: "30s sprint / 90s walk recovery", intensity5: "30s all-out / 90s Zone 1 walk",
    settings: "Sprint: 9-12+ mph. Recovery: 3.0 mph. 8-10 intervals total.",
    emoji: "⚡", tags: ["sprint", "HIIT", "zone3", "phase4", "phase5"],
    progression: { level: 5, chainFamily: "treadmill", regressTo: "cardio_treadmill_run" },
  }),

  CE("cardio_stairmaster", "StairMaster / Stair Climber", {
    primary: ["Glutes", "Quadriceps", "Hamstrings", "Calves"], secondary: ["Core", "Hip Flexors"],
    equipment: ["stairmaster"], location: ["gym"], phases: [2,3,4,5], difficulty: 5, impact: "low",
    zones: [2,3], stage: [2,3,4], gates: { knee: 3, hip: 3 },
    blockConditions: ["anterior_pelvic_tilt"],
    settings: "Moderate pace. Stand upright — no leaning on rails. Full step each time. Start level 4-6, progress to 8-12.",
    nasmNote: "Stair climbers place hips in constant flexion — contraindicated for anterior pelvic tilt (lower crossed syndrome) until corrected.",
    emoji: "🪜", tags: ["stairs", "glutes", "quads", "zone2", "zone3", "calorie_burn"],
    steps: ["Stand upright on the machine", "Step at moderate pace — full steps, not small shuffles", "DO NOT lean on handrails", "Light fingertip touch for balance only if needed", "Start level 4-6, increase as fitness improves"],
    formCues: ["Upright posture — no hunching over rails", "Full step depth each time", "Drive through heels for glute engagement", "Consistent pace, not rushing"],
    mistakes: ["Leaning heavily on handrails (reduces glute work 50%+)", "Taking tiny steps (less muscle activation)", "Setting level too high and compensating with poor form"],
    purpose: "Glute and quad development with high calorie burn. Less impact than running.",
    tip: "One of the highest calorie-burning machines. 30 minutes can burn 300-400 calories.",
    injuryNotes: { lower_back: "Good if posture maintained. Avoid if flexion-intolerant.", knee: "Moderate knee flexion. Avoid severity 3+." },
  }),

  CE("cardio_elliptical", "Elliptical Trainer", {
    primary: ["Quadriceps", "Hamstrings", "Glutes"], secondary: ["Chest", "Back", "Biceps", "Triceps"],
    equipment: ["elliptical"], location: ["gym"], phases: [1,2,3,4,5], difficulty: 2, impact: "zero",
    zones: [1,2,3], stage: [1,2,3,4], gates: { lower_back: 5, knee: 5, shoulder: 4 },
    settings: "Resistance 5-8, stride rate 130-160 SPM. Use handles for upper body engagement.",
    emoji: "🔄", tags: ["elliptical", "zero_impact", "all_phases", "knee_safe"],
    steps: ["Step onto pedals, grip handles", "Set resistance to 5-8", "Stride at 130-160 SPM", "Use handles to engage upper body", "Maintain upright posture"],
    formCues: ["Upright posture, not leaning forward", "Push and pull handles actively", "Keep weight in heels on pedals"],
    purpose: "Zero-impact full-body cardio. Safe for almost all knee and hip conditions.",
    tip: "Try reverse stride occasionally — emphasizes hamstrings and glutes more.",
    injuryNotes: { lower_back: "Excellent — zero impact, upright position.", knee: "Best machine for knee conditions — zero impact, controlled ROM.", shoulder: "Skip handles if shoulder pain. Legs-only mode works fine." },
  }),

  CE("cardio_elliptical_reverse", "Elliptical (Reverse Stride)", {
    primary: ["Hamstrings", "Glutes", "Calves"], secondary: ["Quadriceps", "Core"],
    equipment: ["elliptical"], location: ["gym"], phases: [2,3,4,5], difficulty: 3, impact: "zero",
    zones: [2], stage: [2,3], gates: { knee: 4 },
    settings: "Same machine, pedal backwards. Resistance 5-8. Emphasizes posterior chain.",
    emoji: "🔄", tags: ["elliptical", "reverse", "hamstrings", "glutes"],
  }),

  CE("cardio_bike_upright", "Stationary Bike (Upright)", {
    primary: ["Quadriceps", "Hamstrings", "Calves"], secondary: ["Glutes", "Core"],
    equipment: ["stationary_bike"], location: ["gym"], phases: [1,2,3,4,5], difficulty: 2, impact: "zero",
    zones: [1,2,3], stage: [1,2,3,4], gates: { lower_back: 4, knee: 5 },
    nasmNote: "Seated position may increase anterior pelvic tilt — monitor posture for lower crossed syndrome clients.",
    emoji: "🚴", tags: ["bike", "zero_impact", "knee_rehab", "warmup"],
    purpose: "Zero-impact lower body cardio. Ideal for knee rehab and cardiac conditions.",
    injuryNotes: { knee: "Excellent for knee rehab — zero impact, controlled ROM.", lower_back: "Good if posture maintained. Avoid if seated position aggravates." },
  }),

  CE("cardio_bike_recumbent", "Stationary Bike (Recumbent)", {
    primary: ["Quadriceps", "Hamstrings"], secondary: ["Calves"],
    equipment: ["recumbent_bike"], location: ["gym"], phases: [1,2,3,4,5], difficulty: 1, impact: "zero",
    zones: [1,2], stage: [1,2], gates: { lower_back: 5, knee: 5 },
    emoji: "🚲", tags: ["recumbent", "zero_impact", "back_safe", "elderly", "cardiac_rehab"],
    purpose: "Zero-impact, back-supported cardio. Ideal for back conditions, obese clients, elderly, cardiac rehab.",
    nasmNote: "Less glute activation than upright. Back supported reduces spinal load.",
    injuryNotes: { lower_back: "Best bike option for back conditions — fully supported.", knee: "Excellent — very low knee stress.", hip: "Caution for hip replacement — check flexion angle." },
  }),

  CE("cardio_spin", "Spin / Indoor Cycle", {
    primary: ["Quadriceps", "Hamstrings", "Glutes", "Core"], secondary: ["Calves", "Shoulders"],
    equipment: ["spin_bike"], location: ["gym"], phases: [2,3,4,5], difficulty: 5, impact: "zero",
    zones: [2,3], stage: [2,3,4,5], gates: { lower_back: 3, knee: 4 },
    settings: "Seated climbing, standing intervals, sprint efforts.",
    emoji: "🚴", tags: ["spin", "HIIT", "zero_impact", "high_intensity"],
  }),

  CE("cardio_rower", "Rowing Machine", {
    primary: ["Quadriceps", "Glutes", "Latissimus Dorsi", "Rhomboids"], secondary: ["Biceps", "Hamstrings", "Core", "Forearms"],
    equipment: ["rower"], location: ["gym"], phases: [2,3,4,5], difficulty: 4, impact: "zero",
    zones: [2,3], stage: [2,3,4,5], gates: { lower_back: 3 },
    blockConditions: ["acute_disc_herniation"],
    settings: "Drive with legs first, then lean back, then pull arms. Reverse on recovery. Damper 3-5.",
    emoji: "🚣", tags: ["rowing", "full_body", "zero_impact", "technique_critical"],
    steps: ["Feet strapped in, knees bent, arms extended", "DRIVE: push legs first (60% of power)", "LEAN: slight lean back from hips", "PULL: arms pull handle to lower chest", "RECOVER: arms extend, body rocks forward, knees bend"],
    formCues: ["Legs-back-arms sequence on drive", "Arms-back-legs sequence on recovery", "Keep back flat — no rounding", "Smooth rhythm, not jerky"],
    mistakes: ["Pulling with arms before legs (lose 60% power)", "Rounding lower back (injury risk)", "Yanking the handle", "Too high damper setting (not faster, just harder on back)"],
    purpose: "True full-body cardio — legs 60%, back 20%, arms 20%. Time-efficient.",
    injuryNotes: { lower_back: "AVOID if back severity ≥3. Spinal flexion under load.", knee: "Low impact but requires knee flexion.", shoulder: "Generally safe — pull to lower chest." },
  }),

  CE("cardio_rower_light", "Rowing Machine (Light/Recovery)", {
    primary: ["Quadriceps", "Latissimus Dorsi"], secondary: ["Glutes", "Core"],
    equipment: ["rower"], location: ["gym"], phases: [1,2,3,4,5], difficulty: 2, impact: "zero",
    zones: [1], stage: [1], gates: { lower_back: 4 },
    settings: "Very light resistance, damper 2-3. Focus on technique, not power.",
    emoji: "🚣", tags: ["rowing", "recovery", "zone1", "warmup"],
  }),

  CE("cardio_ski_erg", "Ski Erg", {
    primary: ["Latissimus Dorsi", "Triceps", "Core"], secondary: ["Hip Flexors", "Shoulders"],
    equipment: ["ski_erg"], location: ["gym"], phases: [3,4,5], difficulty: 5, impact: "zero",
    zones: [2,3], stage: [3,4,5], gates: { shoulder: 3 },
    emoji: "⛷️", tags: ["ski_erg", "upper_body_cardio", "lats", "zero_impact"],
    purpose: "Upper body dominant cardio. Great for swimmers and shoulder-safe overhead pulling.",
  }),

  CE("cardio_assault_bike", "Assault Bike (Air/Fan Bike)", {
    primary: ["Quadriceps", "Hamstrings", "Shoulders", "Biceps", "Triceps"], secondary: ["Core", "Glutes", "Chest"],
    equipment: ["assault_bike"], location: ["gym"], phases: [2,3,4,5], difficulty: 6, impact: "zero",
    zones: [2,3], stage: [2,3,4,5], gates: { shoulder: 3 },
    settings: "30s all-out / 90s easy for HIIT. Or steady pace for Zone 2.",
    emoji: "🌀", tags: ["assault_bike", "HIIT", "full_body", "zero_impact", "metabolic"],
    purpose: "Full body — arms and legs simultaneously. Brutal for HIIT intervals.",
  }),

  CE("cardio_ube", "Upper Body Ergometer (Arm Bike)", {
    primary: ["Shoulders", "Biceps", "Triceps", "Chest", "Upper Back"], secondary: ["Core"],
    joints: ["shoulder", "elbow", "wrist"],
    equipment: ["ube"], location: ["gym"], phases: [1,2,3,4,5], difficulty: 2, impact: "zero",
    zones: [1,2], stage: [1,2,3], gates: { shoulder: 4 },
    emoji: "💪", tags: ["ube", "arm_bike", "wheelchair", "lower_body_injury", "zero_lower_impact"],
    purpose: "Primary cardio for wheelchair users and lower body injuries. Builds same heart fitness as lower body work.",
    injuryNotes: { lower_back: "No lower body involvement — excellent.", knee: "No knee involvement — primary cardio option for severe knee conditions.", hip: "No hip involvement — ideal for hip replacement." },
    why: "This is your primary cardio option when lower body is restricted. Arm ergometer is your treadmill.",
  }),

  // ══════════ HOME/OUTDOOR CARDIO ══════════

  CE("cardio_walk_outdoor", "Walking Outdoors", {
    primary: ["Quadriceps", "Hamstrings", "Calves", "Glutes"], secondary: ["Core"],
    location: ["outdoor", "home"], phases: [1,2,3,4,5], difficulty: 1, impact: "low",
    zones: [1,2], stage: [1,2],
    emoji: "🚶", tags: ["walking", "outdoor", "beginner", "all_phases"],
    purpose: "Low-impact cardio accessible everywhere. Foundation of all cardio programming.",
  }),

  CE("cardio_brisk_walk", "Brisk Walking", {
    primary: ["Quadriceps", "Hamstrings", "Calves", "Glutes"], secondary: ["Core", "Hip Flexors"],
    location: ["outdoor", "home"], phases: [1,2,3,4,5], difficulty: 2, impact: "low",
    zones: [2], stage: [1,2],
    emoji: "🏃", tags: ["brisk_walking", "outdoor", "zone2"],
    purpose: "Moderate intensity walking. Can speak in short sentences but not sing.",
  }),

  CE("cardio_hiking", "Hiking (Trail with Incline)", {
    primary: ["Quadriceps", "Glutes", "Calves", "Ankle Stabilizers"], secondary: ["Hamstrings", "Core"],
    location: ["outdoor"], phases: [2,3,4,5], difficulty: 4, impact: "moderate",
    zones: [2,3], stage: [2,3], gates: { ankle: 3 },
    emoji: "🥾", tags: ["hiking", "outdoor", "glutes", "balance"],
    purpose: "Nature-based cardio with incline challenge. Ankle stability required.",
  }),

  CE("cardio_jog_outdoor", "Jogging Outdoors", {
    primary: ["Quadriceps", "Hamstrings", "Calves", "Glutes"], secondary: ["Core", "Hip Flexors"],
    location: ["outdoor"], phases: [2,3,4,5], difficulty: 4, impact: "moderate",
    zones: [2,3], stage: [2,3,4], gates: { lower_back: 3, knee: 3 },
    emoji: "🏃", tags: ["jogging", "outdoor", "zone2", "zone3"],
  }),

  CE("cardio_run_outdoor", "Running Outdoors", {
    primary: ["Quadriceps", "Hamstrings", "Calves", "Glutes"], secondary: ["Core"],
    location: ["outdoor"], phases: [3,4,5], difficulty: 6, impact: "high",
    zones: [3], stage: [3,4,5], gates: { lower_back: 3, knee: 2 },
    emoji: "🏃", tags: ["running", "outdoor", "zone3", "high_impact"],
  }),

  CE("cardio_hill_sprints", "Hill Sprints", {
    primary: ["Glutes", "Quadriceps", "Hamstrings", "Calves"], secondary: ["Core", "Hip Flexors"],
    location: ["outdoor"], phases: [4,5], difficulty: 9, impact: "high", safety: "yellow",
    zones: [3], stage: [5], gates: { lower_back: 2, knee: 2, ankle: 2 },
    settings: "Find a hill 30-50 yards. Sprint up, walk down. 6-10 reps.",
    emoji: "⛰️", tags: ["sprints", "hill", "outdoor", "zone3", "power"],
  }),

  CE("cardio_cycle_outdoor", "Cycling Outdoors", {
    primary: ["Quadriceps", "Hamstrings", "Calves", "Glutes"], secondary: ["Core"],
    equipment: ["bicycle"], location: ["outdoor"], phases: [2,3,4,5], difficulty: 3, impact: "zero",
    zones: [1,2,3], stage: [2,3,4],
    emoji: "🚴", tags: ["cycling", "outdoor", "zero_impact"],
  }),

  CE("cardio_jump_rope", "Jump Rope", {
    primary: ["Calves", "Shoulders", "Core"], secondary: ["Quadriceps", "Forearms", "Wrist Flexors"],
    equipment: ["jump_rope"], location: ["gym", "home", "outdoor"], phases: [3,4,5], difficulty: 5, impact: "high",
    zones: [2,3], stage: [3,4,5], gates: { knee: 2, ankle: 2 },
    blockConditions: ["plantar_fasciitis"],
    emoji: "🤸", tags: ["jump_rope", "high_impact", "coordination", "combat_prep"],
    purpose: "High-intensity coordination cardio. Great for boxing/combat prep.",
    injuryNotes: { knee: "HIGH impact — avoid with knee conditions severity ≥2.", ankle: "Requires ankle stability. Avoid if instability present." },
  }),

  CE("cardio_swim_freestyle", "Swimming (Freestyle/Crawl)", {
    primary: ["Latissimus Dorsi", "Shoulders", "Triceps", "Core", "Hip Flexors"], secondary: ["Chest", "Quadriceps", "Calves"],
    joints: ["shoulder", "hip", "ankle"],
    equipment: ["pool"], location: ["gym", "outdoor"], phases: [1,2,3,4,5], difficulty: 3, impact: "zero",
    zones: [1,2,3], stage: [1,2,3,4,5], gates: { shoulder: 3 },
    emoji: "🏊", tags: ["swimming", "zero_impact", "full_body", "all_conditions"],
    purpose: "Zero-impact full-body cardio. Buoyancy reduces load 50-90%. Best for ALL injury types.",
    injuryNotes: { lower_back: "Excellent — buoyancy decompresses spine.", knee: "Best cardio for knee conditions.", shoulder: "Avoid if impingement or acute rotator cuff. Try backstroke instead." },
  }),

  CE("cardio_swim_backstroke", "Swimming (Backstroke)", {
    primary: ["Latissimus Dorsi", "Shoulders", "Triceps", "Core"], secondary: ["Glutes", "Hamstrings"],
    equipment: ["pool"], location: ["gym", "outdoor"], phases: [1,2,3,4,5], difficulty: 3, impact: "zero",
    zones: [1,2], stage: [1,2,3],
    emoji: "🏊", tags: ["swimming", "backstroke", "back_safe", "shoulder_safe"],
    purpose: "Extension-based swimming. Great for back conditions and shoulder impingement.",
    injuryNotes: { lower_back: "Extension position — ideal for disc patients.", shoulder: "Open chain overhead — often tolerated better than freestyle." },
  }),

  CE("cardio_aqua_jog", "Aqua Jogging (with Belt)", {
    primary: ["Quadriceps", "Hamstrings", "Glutes", "Hip Flexors"], secondary: ["Core", "Calves"],
    equipment: ["pool", "aqua_belt"], location: ["gym"], phases: [1,2,3,4,5], difficulty: 2, impact: "zero",
    zones: [1,2], stage: [1,2],
    emoji: "🏊", tags: ["aqua", "zero_impact", "post_surgical", "rehab"],
    purpose: "Zero-impact running simulation. For acute injuries, post-surgical, high BMI.",
  }),

  CE("cardio_water_walk", "Water Walking", {
    primary: ["Quadriceps", "Hamstrings", "Glutes"], secondary: ["Core", "Calves"],
    equipment: ["pool"], location: ["gym"], phases: [1,2,3,4,5], difficulty: 1, impact: "zero",
    zones: [1], stage: [1],
    emoji: "🏊", tags: ["aqua", "zero_impact", "deconditioning", "mobility"],
    purpose: "Gentlest cardio option. For severe deconditioning, acute pain, mobility limitations.",
  }),

  CE("cardio_battle_ropes", "Battle Ropes", {
    primary: ["Shoulders", "Biceps", "Triceps", "Core"], secondary: ["Chest", "Forearms", "Hips"],
    equipment: ["battle_ropes"], location: ["gym", "outdoor"], phases: [3,4,5], difficulty: 6, impact: "zero",
    zones: [2,3], stage: [3,4,5], gates: { shoulder: 3 },
    settings: "30s work / 30s rest, alternating wave patterns.",
    emoji: "🪢", tags: ["battle_ropes", "upper_body", "metabolic", "HIIT"],
    purpose: "Upper body metabolic conditioning. Zero lower body impact.",
  }),

  CE("cardio_sled_push", "Sled Push", {
    primary: ["Quadriceps", "Glutes", "Core", "Shoulders"], secondary: ["Hamstrings", "Calves", "Triceps"],
    equipment: ["sled"], location: ["gym"], phases: [3,4,5], difficulty: 6, impact: "low",
    zones: [2,3], stage: [3,4,5], gates: { shoulder: 3 },
    settings: "Heavy sled for power, light sled for cardio. 40-yard pushes × 6-10.",
    emoji: "🛷", tags: ["sled", "power", "no_eccentric", "less_soreness"],
    purpose: "No eccentric = minimal soreness. High power output cardio.",
  }),

  CE("cardio_bear_crawl", "Bear Crawl Cardio", {
    primary: ["Shoulders", "Core", "Quadriceps", "Hip Flexors"], secondary: ["Triceps", "Chest"],
    location: ["gym", "home", "outdoor"], phases: [2,3,4,5], difficulty: 4, impact: "low",
    zones: [2], stage: [2,3],
    settings: "40-yard bear crawl, rest 30s, repeat 5x.",
    emoji: "🐻", tags: ["bear_crawl", "bodyweight", "full_body", "core"],
  }),

  CE("cardio_mountain_climbers", "Mountain Climbers", {
    primary: ["Core", "Hip Flexors", "Shoulders"], secondary: ["Quadriceps", "Calves"],
    location: ["gym", "home", "outdoor"], phases: [2,3,4,5], difficulty: 4, impact: "low",
    zones: [2,3], stage: [2,3,4],
    emoji: "🏔️", tags: ["mountain_climbers", "bodyweight", "core", "HIIT"],
  }),

  CE("cardio_jumping_jacks", "Jumping Jacks", {
    primary: ["Calves", "Shoulders", "Quadriceps"], secondary: ["Core", "Hip Abductors"],
    location: ["gym", "home", "outdoor"], phases: [2,3,4,5], difficulty: 2, impact: "moderate",
    zones: [2], stage: [2,3], gates: { knee: 3, ankle: 3 },
    emoji: "⭐", tags: ["jumping_jacks", "warmup", "moderate_impact"],
  }),

  CE("cardio_shadow_boxing", "Shadow Boxing", {
    primary: ["Shoulders", "Core", "Hip Rotators"], secondary: ["Triceps", "Obliques", "Calves"],
    location: ["gym", "home", "outdoor"], phases: [2,3,4,5], difficulty: 3, impact: "zero",
    zones: [2], stage: [2,3], gates: { shoulder: 3 },
    emoji: "🥊", tags: ["shadow_boxing", "combat", "coordination", "zero_impact"],
    purpose: "Zero-impact upper body cardio with coordination benefits. Great for combat sport athletes.",
  }),

  CE("cardio_dance", "Dance / Aerobic Movement", {
    primary: ["Quadriceps", "Calves", "Core"], secondary: ["Glutes", "Shoulders"],
    location: ["gym", "home", "outdoor"], phases: [1,2,3,4,5], difficulty: 1, impact: "low",
    zones: [1,2], stage: [1,2],
    emoji: "💃", tags: ["dance", "aerobics", "enjoyment", "mental_health", "elderly"],
    purpose: "Enjoyment-focused cardio. NASM emphasizes adherence through enjoyment. Mental health benefits.",
  }),

  CE("cardio_burpees", "Burpees", {
    primary: ["Quadriceps", "Chest", "Shoulders", "Core"], secondary: ["Triceps", "Hip Flexors", "Calves"],
    location: ["gym", "home", "outdoor"], phases: [3,4,5], difficulty: 8, impact: "high", safety: "yellow",
    zones: [3], stage: [4,5], gates: { lower_back: 2, knee: 2, shoulder: 2, wrist: 2 },
    emoji: "🔥", tags: ["burpees", "high_impact", "full_body", "advanced_only"],
    purpose: "Maximum intensity full-body cardio. Only for cleared, conditioned athletes.",
  }),

  // ══════════ SPECIALIZED ══════════

  CE("cardio_versaclimber", "Versaclimber", {
    primary: ["Quadriceps", "Glutes", "Shoulders", "Biceps"], secondary: ["Core", "Calves", "Triceps"],
    equipment: ["versaclimber"], location: ["gym"], phases: [3,4,5], difficulty: 7, impact: "zero",
    zones: [2,3], stage: [3,4,5],
    emoji: "🧗", tags: ["versaclimber", "full_body", "zero_impact", "metabolic"],
    purpose: "Total body vertical climbing. Less common but highly effective metabolic conditioning.",
  }),

  CE("cardio_jacobs_ladder", "Jacob's Ladder", {
    primary: ["Quadriceps", "Glutes", "Shoulders", "Core"], secondary: ["Hamstrings", "Biceps"],
    equipment: ["jacobs_ladder"], location: ["gym"], phases: [3,4,5], difficulty: 6, impact: "low",
    zones: [2,3], stage: [3,4,5],
    emoji: "🪜", tags: ["jacobs_ladder", "climbing", "functional"],
  }),
];

export default CARDIO_EXERCISES;
