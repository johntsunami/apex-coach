// ═══════════════════════════════════════════════════════════════
// APEX Coach — NASM PES Needs Analysis Sport Profiles
// Comprehensive sport-specific training data for exercise selection,
// cardio prescription, injury prevention, and phase-specific emphasis
// ═══════════════════════════════════════════════════════════════

// ── Pattern-to-Plane heuristic (exercises lack a planeOfMotion field) ──
const PATTERN_TO_PLANE = {
  squat: "sagittal", lunge: "sagittal", hinge: "sagittal",
  push: "sagittal", pull: "sagittal", anti_extension: "sagittal",
  rotation: "transverse", anti_rotation: "transverse",
  locomotion: "sagittal", carry: "frontal",
  lateral_lunge: "frontal", isolation: "sagittal",
};

// ═══════════════════════════════════════════════════════════════
// SPORT PROFILES — NASM PES Needs Analysis Framework
// ═══════════════════════════════════════════════════════════════

const SPORT_PROFILES = {

  // ═══ BASKETBALL ═══════════════════════════════════════════════
  "Basketball": {
    label: "Basketball",
    energySystems: { phosphagen: 60, glycolytic: 30, oxidative: 10 },
    dominantPlanes: ["sagittal", "frontal", "transverse"],
    primaryMovements: ["vertical_jump", "lateral_shuffle", "sprint", "deceleration", "cutting", "overhead_reach"],
    primaryMuscles: ["Quadriceps", "Glute Max", "Hamstrings", "Calves", "Core", "Deltoids"],
    commonInjuries: ["ankle", "knee", "shoulder"],
    priorityTraining: {
      power: ["sport_box_jump", "pes_depth_jump", "pes_squat_jump", "sport_med_ball_slam"],
      agility: ["sport_pro_agility_5_10_5", "sport_lateral_shuffle"],
      strength: ["main_front_squat", "stab_single_leg_squat", "main_hip_thrust", "main_overhead_press"],
      conditioning: ["cardio_treadmill_sprint", "cardio_shuttle_run"],
      injury_prevention: ["rehab_ankle_4way", "bal_single_leg_stance", "stab_single_leg_squat", "rehab_vmo_activation"],
      mobility: ["mob_hip_flexor", "mob_ankle_df", "mob_thoracic_rot", "mob_shoulder_flex"],
    },
    cardio: { mode: "sprint_intervals", workRest: "1:3", preferredExercises: ["cardio_treadmill_sprint", "cardio_jump_rope"] },
    phaseEmphasis: {
      1: "Landing mechanics, single-leg stability, ankle proprioception",
      2: "Deceleration strength, lateral movement patterns, core anti-rotation",
      3: "Vertical jump development, upper body pressing/pulling balance",
      4: "Maximal strength for jump height, reactive agility",
      5: "Explosive power supersets, game-speed agility drills",
    },
    movementPatterns: ["squat", "lunge", "push", "rotation", "locomotion"],
    unlockPhase: 3,
  },

  // ═══ SOCCER ═══════════════════════════════════════════════════
  "Soccer": {
    label: "Soccer",
    energySystems: { phosphagen: 20, glycolytic: 40, oxidative: 40 },
    dominantPlanes: ["sagittal", "frontal", "transverse"],
    primaryMovements: ["sprint", "deceleration", "cutting", "kicking", "heading", "jumping"],
    primaryMuscles: ["Quadriceps", "Hamstrings", "Hip Flexors", "Adductors", "Calves", "Core"],
    commonInjuries: ["knee", "hamstring", "groin", "ankle"],
    priorityTraining: {
      power: ["pes_squat_jump", "sport_box_jump", "sport_med_ball_rot_throw"],
      agility: ["sport_pro_agility_5_10_5", "sport_lateral_shuffle"],
      strength: ["sport_nordic_hamstring", "bal_single_leg_rdl", "main_goblet_squat", "main_hip_thrust"],
      conditioning: ["cardio_treadmill_jog", "cardio_treadmill_run"],
      injury_prevention: ["sport_nordic_hamstring", "rehab_hip_adduction", "rehab_ankle_4way", "bal_single_leg_rdl"],
      mobility: ["mob_hip_flexor", "mob_adductor", "mob_hamstring", "mob_ankle_df"],
    },
    cardio: { mode: "mixed_intervals_and_sustained", workRest: "1:1", preferredExercises: ["cardio_treadmill_run", "cardio_jog_outdoor"] },
    phaseEmphasis: {
      1: "Ankle stability, hamstring eccentric control, hip adductor activation",
      2: "Deceleration mechanics, single-leg strength, core anti-rotation",
      3: "Lower body hypertrophy for sprint power, rotational core",
      4: "Maximal sprint speed, reactive cutting agility",
      5: "Game-speed intervals, multi-directional power",
    },
    movementPatterns: ["squat", "lunge", "hinge", "rotation", "locomotion"],
    unlockPhase: 2,
  },

  // ═══ BASEBALL/SOFTBALL ════════════════════════════════════════
  "Baseball/Softball": {
    label: "Baseball / Softball",
    energySystems: { phosphagen: 70, glycolytic: 20, oxidative: 10 },
    dominantPlanes: ["transverse", "sagittal"],
    primaryMovements: ["rotational_power", "sprint_short", "throwing", "overhead_arm_action", "lateral_movement"],
    primaryMuscles: ["Core Rotators", "Posterior Deltoid", "Hip Rotators", "Glute Max", "Forearms"],
    commonInjuries: ["shoulder", "elbow", "oblique", "hamstring", "lower_back"],
    priorityTraining: {
      power: ["sport_med_ball_rot_throw", "sport_forehand_cable_rot", "main_hip_thrust"],
      agility: ["sport_lateral_shuffle", "sport_pro_agility_5_10_5"],
      strength: ["stab_pallof_press", "bal_single_leg_rdl", "iso_band_ext_rotation", "main_hip_thrust"],
      conditioning: ["cardio_treadmill_sprint"],
      injury_prevention: ["iso_band_ext_rotation", "mob_thoracic_rot", "rehab_posterior_shoulder", "mob_wrist_flex_ext"],
      mobility: ["mob_thoracic_rot", "mob_shoulder_ir_er", "mob_hip_rotation"],
    },
    cardio: { mode: "short_sprint_intervals", workRest: "1:5", preferredExercises: ["cardio_treadmill_sprint"] },
    phaseEmphasis: {
      1: "Rotator cuff prehab, thoracic rotation mobility, core stability",
      2: "Rotational core strength, hip-shoulder separation drills",
      3: "Rotational power development, posterior chain hypertrophy",
      4: "Explosive rotational power, reactive first-step speed",
      5: "Sport-speed rotational power, throwing mechanics integration",
    },
    movementPatterns: ["rotation", "hinge", "pull", "anti_rotation"],
    unlockPhase: 3,
  },

  // ═══ TENNIS ═══════════════════════════════════════════════════
  "Tennis": {
    label: "Tennis",
    energySystems: { phosphagen: 40, glycolytic: 30, oxidative: 30 },
    dominantPlanes: ["transverse", "sagittal", "frontal"],
    primaryMovements: ["lateral_shuffle", "split_step", "rotational_power", "overhead_serve", "deceleration"],
    primaryMuscles: ["Shoulder Complex", "Core Rotators", "Quadriceps", "Calves", "Forearm Extensors"],
    commonInjuries: ["elbow", "shoulder", "ankle", "knee", "wrist"],
    priorityTraining: {
      power: ["sport_med_ball_rot_throw", "sport_overhead_serve_cable", "pes_lateral_bound"],
      agility: ["sport_split_step", "sport_lateral_shuffle", "sport_pro_agility_5_10_5"],
      strength: ["stab_single_leg_squat", "iso_band_ext_rotation", "stab_pallof_press"],
      conditioning: ["cardio_treadmill_sprint", "cardio_jump_rope"],
      injury_prevention: ["mob_wrist_flex_ext", "iso_band_ext_rotation", "rehab_ankle_4way", "rehab_scapular_stab"],
      mobility: ["mob_thoracic_rot", "mob_shoulder_flex", "mob_hip_rotation", "mob_wrist_flex_ext"],
    },
    cardio: { mode: "mixed_short_intervals", workRest: "1:1", preferredExercises: ["cardio_jump_rope", "cardio_treadmill_sprint"] },
    phaseEmphasis: {
      1: "Rotator cuff prehab, wrist/forearm conditioning, ankle stability",
      2: "Lateral movement patterns, split-step mechanics, core anti-rotation",
      3: "Shoulder complex hypertrophy, rotational core development",
      4: "Reactive agility, overhead power development",
      5: "Court-speed agility, explosive serve power",
    },
    movementPatterns: ["rotation", "lunge", "push", "anti_rotation", "locomotion"],
    unlockPhase: 3,
  },

  // ═══ GOLF ═════════════════════════════════════════════════════
  "Golf": {
    label: "Golf",
    energySystems: { phosphagen: 80, glycolytic: 10, oxidative: 10 },
    dominantPlanes: ["transverse"],
    primaryMovements: ["rotational_power_single_plane", "hip_rotation", "thoracic_rotation", "wrist_hinge"],
    primaryMuscles: ["Core Rotators", "Glute Max", "Hip Rotators", "Lats", "Forearms"],
    commonInjuries: ["lower_back", "elbow", "shoulder", "wrist", "hip"],
    priorityTraining: {
      power: ["sport_forehand_cable_rot", "sport_med_ball_rot_throw"],
      strength: ["stab_pallof_press", "main_glute_bridge", "bal_single_leg_rdl", "rehab_scapular_stab"],
      conditioning: ["cardio_treadmill_walk", "cardio_walk_outdoor"],
      injury_prevention: ["mob_thoracic_rot", "mob_hip_rotation", "mob_wrist_flex_ext", "stab_mcgill_big3"],
      mobility: ["sport_golf_thoracic_rot", "mob_hip_ir_er", "mob_shoulder_flex", "mob_wrist_flex_ext"],
    },
    cardio: { mode: "walking_sustained", workRest: null, preferredExercises: ["cardio_treadmill_walk", "cardio_walk_outdoor"] },
    phaseEmphasis: {
      1: "Thoracic mobility, hip rotation balance, low back stabilization",
      2: "Anti-rotation core strength, hip-shoulder separation",
      3: "Rotational power development, grip/forearm strength",
      4: "Maximal rotational power, club speed development",
      5: "Peak rotational power with swing-specific integration",
    },
    movementPatterns: ["rotation", "hinge", "anti_extension", "anti_rotation"],
    unlockPhase: 3,
  },

  // ═══ SWIMMING ═════════════════════════════════════════════════
  "Swimming": {
    label: "Swimming",
    energySystems: { phosphagen: 10, glycolytic: 40, oxidative: 50 },
    dominantPlanes: ["sagittal", "transverse"],
    primaryMovements: ["overhead_pull", "hip_extension", "core_rotation", "shoulder_IR", "ankle_plantarflexion"],
    primaryMuscles: ["Lats", "Posterior Deltoid", "Core", "Hip Flexors", "Ankle Plantarflexors"],
    commonInjuries: ["shoulder", "lower_back", "knee"],
    priorityTraining: {
      power: ["sport_swim_lat_pull", "sport_med_ball_slam"],
      strength: ["main_pull_up", "iso_band_ext_rotation", "stab_pallof_press", "main_hip_thrust"],
      conditioning: ["cardio_swim_freestyle", "cardio_swim_backstroke"],
      injury_prevention: ["iso_band_ext_rotation", "rehab_scapular_stab", "mob_thoracic_ext", "rehab_shoulder_er"],
      mobility: ["mob_shoulder_flex", "mob_ankle_pf", "mob_thoracic_ext", "mob_hip_flexor"],
    },
    cardio: { mode: "sustained_and_interval", workRest: "1:1", preferredExercises: ["cardio_swim_freestyle", "cardio_rower"] },
    phaseEmphasis: {
      1: "Rotator cuff prehab, scapular stability, thoracic extension",
      2: "Pull strength development, core anti-rotation, hip extension",
      3: "Lat and shoulder complex hypertrophy, core endurance",
      4: "Explosive pull power, streamline strength",
      5: "Peak stroke power, race-pace interval training",
    },
    movementPatterns: ["pull", "rotation", "anti_extension"],
    unlockPhase: 3,
  },

  // ═══ RUNNING / TRACK ═════════════════════════════════════════
  "Running/Track": {
    label: "Running / Track",
    energySystems: { phosphagen: 15, glycolytic: 25, oxidative: 60 },
    dominantPlanes: ["sagittal"],
    primaryMovements: ["hip_extension", "knee_drive", "ankle_plantarflexion", "arm_swing"],
    primaryMuscles: ["Glute Max", "Hamstrings", "Calves", "Hip Flexors", "Core"],
    commonInjuries: ["knee", "shin", "plantar_fascia", "achilles", "hip"],
    priorityTraining: {
      power: ["pes_squat_jump", "sport_box_jump"],
      strength: ["stab_single_leg_squat", "bal_single_leg_rdl", "main_calf_raise", "main_hip_thrust", "stab_pallof_press"],
      conditioning: ["cardio_treadmill_run", "cardio_run_outdoor", "cardio_treadmill_incline"],
      injury_prevention: ["rehab_eccentric_calf", "rehab_tibialis_raise", "rehab_hip_abduction", "rehab_foot_intrinsic"],
      mobility: ["mob_hip_flexor", "mob_ankle_df", "mob_hamstring", "mob_thoracic_rot"],
    },
    cardio: { mode: "zone_2_base_building", workRest: null, preferredExercises: ["cardio_treadmill_run", "cardio_run_outdoor"] },
    phaseEmphasis: {
      1: "Foot/ankle stability, hip abduction activation, calf eccentric control",
      2: "Single-leg strength, hip drive mechanics, core stability",
      3: "Lower body hypertrophy for stride power, calf development",
      4: "Maximal leg stiffness, reactive strength",
      5: "Explosive starts, race-pace power endurance",
    },
    movementPatterns: ["lunge", "hinge", "locomotion", "isolation"],
    unlockPhase: 2,
  },

  // ═══ CYCLING ══════════════════════════════════════════════════
  "Cycling": {
    label: "Cycling",
    energySystems: { phosphagen: 10, glycolytic: 30, oxidative: 60 },
    dominantPlanes: ["sagittal"],
    primaryMovements: ["pedal_stroke", "hip_flexion_extension", "core_stabilization"],
    primaryMuscles: ["Quadriceps", "Glute Max", "Hamstrings", "Calves", "Core", "Hip Flexors"],
    commonInjuries: ["knee", "lower_back", "neck", "wrist"],
    priorityTraining: {
      strength: ["main_leg_press", "main_hip_thrust", "stab_pallof_press", "main_upper_back_row"],
      conditioning: ["cardio_bike_upright", "cardio_cycle_outdoor"],
      injury_prevention: ["mob_hip_flexor", "mob_thoracic_ext", "rehab_neck_retraction", "rehab_it_band_fr"],
      mobility: ["mob_hip_extension", "mob_thoracic_ext", "mob_neck_rom", "mob_wrist_flex_ext"],
    },
    cardio: { mode: "sustained_zone_2", workRest: null, preferredExercises: ["cardio_bike_upright", "cardio_cycle_outdoor"] },
    phaseEmphasis: {
      1: "Hip flexor mobility, thoracic extension, knee tracking",
      2: "Single-leg press strength, core anti-flexion, upper back posture",
      3: "Quad and glute hypertrophy for pedal power",
      4: "Maximal leg strength, sprint intervals on bike",
      5: "Peak power output, race-simulation intervals",
    },
    movementPatterns: ["squat", "hinge", "locomotion"],
    unlockPhase: 2,
  },

  // ═══ HIKING / MOUNTAINEERING ═════════════════════════════════
  "Hiking": {
    label: "Hiking / Mountaineering",
    energySystems: { phosphagen: 5, glycolytic: 20, oxidative: 75 },
    dominantPlanes: ["sagittal"],
    primaryMovements: ["step_up", "descent_control", "loaded_carry", "core_stabilization"],
    primaryMuscles: ["Quadriceps", "Glute Max", "Calves", "Core", "Hip Stabilizers"],
    commonInjuries: ["knee", "ankle", "lower_back"],
    priorityTraining: {
      strength: ["main_step_up", "stab_single_leg_squat", "main_calf_raise", "main_farmers_carry", "stab_plank"],
      conditioning: ["cardio_treadmill_incline", "cardio_stairmaster", "cardio_walk_outdoor"],
      injury_prevention: ["rehab_ankle_4way", "rehab_eccentric_quad", "rehab_hip_abduction"],
      mobility: ["mob_ankle_df", "mob_hip_flexor", "mob_thoracic_ext"],
    },
    cardio: { mode: "sustained_incline", workRest: null, preferredExercises: ["cardio_treadmill_incline", "cardio_stairmaster"] },
    phaseEmphasis: {
      1: "Ankle proprioception, eccentric quad control for downhill, core endurance",
      2: "Loaded carry progression, single-leg step-up strength",
      3: "Quad and calf hypertrophy for sustained climbing",
      4: "Heavy loaded carries, extended duration training",
      5: "Altitude simulation, peak endurance with load",
    },
    movementPatterns: ["squat", "lunge", "carry"],
    unlockPhase: 2,
  },

  // ═══ ROCK CLIMBING ════════════════════════════════════════════
  // ═══ ROCK CLIMBING / BOULDERING ════════════════════════════
  // Comprehensive NASM PES Needs Analysis backed by sports science:
  // Gilmore et al. 2024, Hermans et al. 2022, Stien 2023/2024 meta-analyses,
  // Saeterbakken 2024, Dr. Jared Vagy "The Climbing Doctor", [P]rehab Guys
  "Rock Climbing": {
    label: "Rock Climbing / Bouldering",
    energySystems: { phosphagen: 50, glycolytic: 30, oxidative: 20 },
    dominantPlanes: ["sagittal", "frontal"],
    primaryMovements: ["pull_vertical", "grip_endurance", "hip_turnout", "core_tension", "dynamic_reach", "body_tension"],
    primaryMuscles: ["Forearms", "Finger Flexors", "Lats", "Biceps", "Core", "Hip Flexors", "Scapular Stabilizers"],
    commonInjuries: ["finger_pulley", "shoulder", "elbow_medial", "elbow_lateral", "wrist"],
    // 63-90% of climbing injuries are upper body, 93% are chronic overuse (2024 systematic review)
    priorityTraining: {
      // Phase-gated: finger training starts Phase 2, max hangs Phase 3, campus Phase 4+
      finger_strength: ["climb_dead_hang_jug", "climb_dead_hang_20mm", "climb_abrahangs", "climb_max_hangs", "climb_repeaters", "climb_pinch_hold"],
      pulling: ["climb_pullup_grip_var", "climb_lock_off", "climb_frenchies", "climb_typewriter_pullup", "sport_dead_hang_active"],
      core_tension: ["climb_front_lever_prog", "climb_hanging_leg_raise", "climb_body_tension_hold", "climb_flag_stem_drill"],
      // MANDATORY antagonist work — non-negotiable every session (Dr. Vagy framework)
      antagonist: ["climb_pushup_antagonist", "climb_db_shoulder_press", "climb_reverse_wrist_curl", "climb_scapular_pushup_plus", "climb_prone_ytw"],
      injury_prevention: ["climb_finger_extensor_band", "climb_rice_bucket", "climb_reverse_wrist_curl", "iso_band_ext_rotation", "climb_scapular_pushup_plus", "climb_prone_ytw"],
      mobility: ["climb_hip_turnout", "rehab_thoracic_ext_roller", "climb_shoulder_passthrough", "climb_wrist_flex_ext_stretch", "climb_forearm_massage", "climb_ankle_df_mob", "climb_hip_flexor_stretch", "sport_dead_hang_active"],
      conditioning: ["cardio_rower", "cardio_bike_upright"],
    },
    cardio: { mode: "sustained_moderate", workRest: null, preferredExercises: ["cardio_rower", "cardio_bike_upright"] },
    phaseEmphasis: {
      1: "Movement quality, dead hang endurance (jug), Abrahangs sub-max protocol, antagonist base (push-ups/ER/wrist extensors EVERY session), body tension basics, hip turnout mobility",
      2: "20mm edge hangs introduced (Hermans 2022: 7:3 repeaters), pull-up progression, lock-off holds, front lever tuck, offset pull-ups. Tendons adapt slower than muscles — patience prevents injury.",
      3: "Max hangs (Lopez-Rivera protocol: 5×10s at 80% max, 3min rest), weighted pull-ups, frenchies, typewriter pull-ups, front lever straddle, toes-to-bar. Power phase — tendons ready now.",
      4: "Combined Abrahangs + max hangs (additive gains per Gilmore 2024), campus board IF cleared (strict gating), one-arm pull-up progression, full front lever, dynamic coordination drills",
      5: "Peak performance: combined finger protocols, explosive dynamic pulling, muscle-up progression, competition-specific power endurance",
    },
    // Climbing-specific protocols injected into every session
    climbingProtocols: {
      preClimb: {
        description: "10 min minimum warm-up before ANY finger-intensive work",
        exercises: ["climb_wrist_flex_ext_stretch", "climb_shoulder_passthrough", "climb_finger_extensor_band", "sport_dead_hang_active", "climb_dead_hang_jug"],
        note: "Progressive finger loading: jug → large edge → moderate edge. NEVER start cold on small edges.",
      },
      postClimb: {
        description: "8 min minimum cooldown after every climbing session",
        exercises: ["climb_forearm_massage", "climb_wrist_flex_ext_stretch", "rehab_thoracic_ext_roller", "climb_pushup_antagonist", "iso_band_ext_rotation", "climb_hip_flexor_stretch"],
        note: "Antagonist push work MUST happen after every climbing session.",
      },
      weeklyAntagonist: {
        description: "Separate 20-30 min session, 2x/week — prevents #1 cause of climbing injuries",
        exercises: ["climb_pushup_antagonist", "climb_db_shoulder_press", "climb_reverse_wrist_curl", "climb_finger_extensor_band", "climb_scapular_pushup_plus", "climb_prone_ytw", "iso_band_ext_rotation"],
        note: "93% of climbing injuries are overuse from pull/push imbalance. This is your defense.",
      },
    },
    // Climbing-specific safety gates
    safetyGates: {
      hangboard_any: { minClimbingMonths: 6, note: "Beginners should climb only — tendons need 6+ months of adaptation before hangboard training." },
      max_hangs: { minHangboardMonths: 12, minPhase: 3, note: "Max hangs require 1+ year hangboard experience. Tendons adapt 3-10x slower than muscles." },
      campus_board: { minTrainingYears: 2, minPhase: 4, minAge: 18, maxShoulderSeverity: 0, maxElbowSeverity: 0, maxFingerSeverity: 0, note: "Campus board is the highest injury risk climbing exercise. Strict clearing required." },
      full_crimp: { NEVER: true, note: "Full crimp (thumb locked over fingers) puts 36x bodyweight force through A2 pulley. ALWAYS cue half-crimp or open hand." },
    },
    // Finger health monitoring
    fingerHealthCheck: {
      questions: ["Any finger soreness?", "Swelling in finger joints?", "Popping or clicking sounds?", "Pain when making a fist?"],
      ifPositive: "Reduce ALL finger-specific training intensity by 50%. Add extra finger extensor work. If swelling persists 1-2 weeks, see a hand specialist.",
    },
    // Climbing-specific tracking metrics
    trackingMetrics: [
      { id: "hang_time_jug", label: "Dead Hang (Jug)", unit: "seconds", description: "Max hang time on large hold" },
      { id: "edge_20mm_max", label: "20mm Edge Max", unit: "seconds or +lbs", description: "Max hold time or added weight at 7s" },
      { id: "pullup_max", label: "Pull-Up Max", unit: "reps", description: "Strict pull-up max reps" },
      { id: "lockoff_90", label: "Lock-Off at 90°", unit: "seconds", description: "Isometric hold at 90° elbow" },
      { id: "strength_weight_ratio", label: "Strength-to-Weight", unit: "ratio", description: "Added weight on 20mm / bodyweight" },
      { id: "pushup_max", label: "Push-Up Max", unit: "reps", description: "Antagonist strength tracking" },
      { id: "boulder_grade", label: "Boulder Grade", unit: "V-scale", description: "Highest grade sent" },
      { id: "route_grade", label: "Route Grade", unit: "YDS", description: "Highest route grade sent" },
    ],
    movementPatterns: ["pull", "carry", "anti_extension"],
    unlockPhase: 2, // Climbing-specific work starts Phase 2 (not 3) — base building in Phase 1
  },

  // ═══ CROSSFIT ═════════════════════════════════════════════════
  "CrossFit": {
    label: "CrossFit",
    energySystems: { phosphagen: 30, glycolytic: 40, oxidative: 30 },
    dominantPlanes: ["sagittal", "frontal", "transverse"],
    primaryMovements: ["olympic_lifts", "gymnastics", "metabolic_conditioning"],
    primaryMuscles: ["Full Body"],
    commonInjuries: ["shoulder", "lower_back", "knee", "wrist"],
    priorityTraining: {
      power: ["sport_power_clean", "sport_box_jump", "main_pull_up"],
      strength: ["main_back_squat", "main_deadlift", "main_overhead_press", "main_pull_up"],
      conditioning: ["cardio_assault_bike", "cardio_rower", "cardio_jump_rope"],
      injury_prevention: ["iso_band_ext_rotation", "mob_thoracic_rot", "mob_hip_flexor", "mob_wrist_flex_ext"],
      mobility: ["mob_overhead_squat", "mob_front_rack", "mob_ankle_df"],
    },
    cardio: { mode: "mixed_high_intensity", workRest: "1:1", preferredExercises: ["cardio_assault_bike", "cardio_rower"] },
    phaseEmphasis: {
      1: "Overhead mobility, front rack position, hip hinge mechanics",
      2: "Olympic lift progressions, strict gymnastics, core stability",
      3: "Strength base building for competition lifts",
      4: "Maximal strength, kipping progressions, conditioning capacity",
      5: "Competition simulation, AMRAP/EMOM pacing",
    },
    movementPatterns: ["squat", "hinge", "push", "pull"],
    unlockPhase: 3,
  },

  // ═══ BOXING / KICKBOXING ═════════════════════════════════════
  "Boxing/Kickboxing": {
    label: "Boxing / Kickboxing",
    energySystems: { phosphagen: 30, glycolytic: 50, oxidative: 20 },
    dominantPlanes: ["transverse", "sagittal"],
    primaryMovements: ["rotational_power", "hip_extension", "shoulder_endurance", "footwork"],
    primaryMuscles: ["Core Rotators", "Deltoids", "Hip Rotators", "Calves", "Forearms"],
    commonInjuries: ["shoulder", "wrist", "hand", "neck"],
    priorityTraining: {
      power: ["sport_med_ball_rot_throw", "sport_med_ball_slam"],
      agility: ["sport_lateral_shuffle", "sport_shadow_boxing"],
      strength: ["stab_pallof_press", "main_shoulder_press_high_rep", "sport_neck_iso_4way", "main_hip_thrust"],
      conditioning: ["cardio_jump_rope", "cardio_assault_bike"],
      injury_prevention: ["iso_band_ext_rotation", "mob_wrist_flex_ext", "sport_neck_iso_4way", "rehab_shoulder_er"],
      mobility: ["mob_thoracic_rot", "mob_hip_rotation", "mob_shoulder_flex", "mob_ankle_df"],
    },
    cardio: { mode: "round_intervals", workRest: "3:1", preferredExercises: ["cardio_jump_rope", "cardio_assault_bike"] },
    phaseEmphasis: {
      1: "Rotator cuff prehab, wrist conditioning, neck stability basics",
      2: "Rotational core strength, shoulder endurance, footwork patterns",
      3: "Rotational power development, shoulder complex hypertrophy",
      4: "Explosive rotational power, round-paced conditioning",
      5: "Fight-simulation intervals, peak power output",
    },
    movementPatterns: ["rotation", "push", "anti_rotation", "locomotion"],
    unlockPhase: 3,
  },

  // ═══ MMA / BJJ ═══════════════════════════════════════════════
  "MMA/BJJ": {
    label: "MMA / BJJ",
    energySystems: { phosphagen: 40, glycolytic: 40, oxidative: 20 },
    dominantPlanes: ["sagittal", "transverse", "frontal"],
    primaryMovements: ["hip_bridge_explosive", "sprawl", "rotation", "grip_endurance", "ground_to_standing"],
    primaryMuscles: ["Posterior Chain", "Grip/Forearms", "Neck", "Core All Planes", "Hip Flexors"],
    commonInjuries: ["neck", "shoulder", "knee", "finger"],
    priorityTraining: {
      power: ["main_hip_thrust", "sport_combat_sprawl", "sport_med_ball_slam"],
      agility: ["sport_shrimp_drill", "sport_combat_sprawl", "sport_bridge_roll"],
      strength: ["sport_neck_iso_4way", "sport_dead_hang_active", "main_pull_up", "main_hip_thrust"],
      conditioning: ["cardio_assault_bike", "cardio_rower"],
      injury_prevention: ["sport_neck_iso_4way", "iso_band_ext_rotation", "rehab_knee_mcl", "rehab_finger_ext"],
      mobility: ["mob_hip_flexor", "mob_thoracic_rot", "mob_shoulder_flex", "mob_neck_rom"],
    },
    cardio: { mode: "round_intervals", workRest: "5:1", preferredExercises: ["cardio_assault_bike", "cardio_rower"] },
    phaseEmphasis: {
      1: "Neck stability isometrics, shoulder stability, hip escape mechanics",
      2: "Grip endurance, hip bridge power, sprawl mechanics",
      3: "Posterior chain hypertrophy, grip/forearm development",
      4: "Explosive hip bridge, reactive sprawl speed, weighted pull-ups",
      5: "Grappling-simulation intervals, scramble power",
    },
    movementPatterns: ["rotation", "hinge", "pull", "carry"],
    unlockPhase: 3,
  },

  // ═══ VOLLEYBALL ═══════════════════════════════════════════════
  "Volleyball": {
    label: "Volleyball",
    energySystems: { phosphagen: 60, glycolytic: 25, oxidative: 15 },
    dominantPlanes: ["sagittal", "frontal"],
    primaryMovements: ["vertical_jump", "lateral_shuffle", "overhead_arm_swing", "diving", "quick_reaction"],
    primaryMuscles: ["Quadriceps", "Glute Max", "Calves", "Deltoids", "Core"],
    commonInjuries: ["knee", "shoulder", "ankle", "finger"],
    priorityTraining: {
      power: ["pes_depth_jump", "pes_squat_jump", "sport_approach_jump", "sport_overhead_serve_cable"],
      agility: ["sport_split_step", "sport_lateral_shuffle"],
      strength: ["main_front_squat", "stab_single_leg_squat", "iso_band_ext_rotation", "rehab_eccentric_calf"],
      conditioning: ["cardio_treadmill_sprint", "cardio_jump_rope"],
      injury_prevention: ["rehab_patellar_eccentric", "rehab_ankle_4way", "iso_band_ext_rotation", "rehab_landing_mech"],
      mobility: ["mob_shoulder_flex", "mob_ankle_df", "mob_hip_flexor", "mob_thoracic_ext"],
    },
    cardio: { mode: "sprint_intervals", workRest: "1:3", preferredExercises: ["cardio_jump_rope", "cardio_treadmill_sprint"] },
    phaseEmphasis: {
      1: "Landing mechanics, patellar tendon eccentric protocol, ankle stability",
      2: "Single-leg jump mechanics, shoulder ER strength, lateral agility",
      3: "Quad and calf hypertrophy for jump height, shoulder complex",
      4: "Maximal jump height, reactive block timing",
      5: "Approach jump power, game-speed transitions",
    },
    movementPatterns: ["squat", "lunge", "push", "locomotion"],
    unlockPhase: 3,
  },

  // ═══ AMERICAN FOOTBALL ════════════════════════════════════════
  "Football": {
    label: "American Football",
    energySystems: { phosphagen: 70, glycolytic: 20, oxidative: 10 },
    dominantPlanes: ["sagittal", "frontal", "transverse"],
    primaryMovements: ["sprint", "tackle", "cut", "jump", "push_block", "rotational_throw"],
    primaryMuscles: ["Full Body", "Neck", "Core", "Posterior Chain"],
    commonInjuries: ["knee", "ankle", "shoulder", "hamstring", "neck"],
    priorityTraining: {
      power: ["sport_power_clean", "sport_box_jump", "sport_sled_push", "sport_med_ball_slam"],
      agility: ["sport_pro_agility_5_10_5", "sport_lateral_shuffle"],
      strength: ["main_back_squat", "main_bench_press", "main_deadlift", "sport_neck_iso_4way", "main_pull_up"],
      conditioning: ["cardio_treadmill_sprint", "cardio_sled_push"],
      injury_prevention: ["rehab_acl_prevention", "sport_neck_iso_4way", "sport_nordic_hamstring", "rehab_ankle_4way"],
      mobility: ["mob_hip_flexor", "mob_thoracic_rot", "mob_ankle_df", "mob_shoulder_flex"],
    },
    cardio: { mode: "short_sprint_intervals", workRest: "1:5", preferredExercises: ["cardio_treadmill_sprint", "cardio_sled_push"] },
    phaseEmphasis: {
      1: "Neck stability, ACL prevention protocol, ankle proprioception",
      2: "Bilateral strength base, deceleration mechanics, core anti-rotation",
      3: "Muscle mass development for positional demands",
      4: "Maximal strength, explosive power development",
      5: "Position-specific power, game-speed agility",
    },
    movementPatterns: ["squat", "hinge", "push", "pull", "carry"],
    unlockPhase: 3,
  },

  // ═══ WRESTLING ════════════════════════════════════════════════
  "Wrestling": {
    label: "Wrestling",
    energySystems: { phosphagen: 35, glycolytic: 45, oxidative: 20 },
    dominantPlanes: ["sagittal", "transverse", "frontal"],
    primaryMovements: ["hip_hinge_explosive", "sprawl", "rotation", "grip_endurance", "level_change"],
    primaryMuscles: ["Posterior Chain", "Neck", "Grip/Forearms", "Core All Planes", "Hip Flexors"],
    commonInjuries: ["neck", "shoulder", "knee", "elbow", "lower_back"],
    priorityTraining: {
      power: ["main_hip_thrust", "sport_combat_sprawl", "sport_med_ball_slam"],
      agility: ["sport_combat_sprawl", "sport_lateral_shuffle"],
      strength: ["sport_neck_iso_4way", "sport_dead_hang_active", "main_pull_up", "main_deadlift"],
      conditioning: ["cardio_assault_bike", "cardio_rower"],
      injury_prevention: ["sport_neck_iso_4way", "iso_band_ext_rotation", "rehab_knee_mcl", "stab_mcgill_big3"],
      mobility: ["mob_hip_flexor", "mob_thoracic_rot", "mob_shoulder_flex", "mob_neck_rom"],
    },
    cardio: { mode: "round_intervals", workRest: "3:1", preferredExercises: ["cardio_assault_bike", "cardio_rower"] },
    phaseEmphasis: {
      1: "Neck stability, hip hinge mechanics, sprawl pattern learning",
      2: "Grip endurance development, hip power, core stability all planes",
      3: "Posterior chain hypertrophy, neck hypertrophy",
      4: "Explosive level changes, maximal grip and pull strength",
      5: "Match-simulation conditioning, scramble power",
    },
    movementPatterns: ["hinge", "pull", "carry", "rotation"],
    unlockPhase: 3,
  },

  // ═══ YOGA ═════════════════════════════════════════════════════
  "Yoga": {
    label: "Yoga",
    energySystems: { phosphagen: 5, glycolytic: 10, oxidative: 85 },
    dominantPlanes: ["sagittal", "frontal", "transverse"],
    primaryMovements: ["balance", "hip_opening", "spinal_flexion_extension", "overhead_reach", "twist"],
    primaryMuscles: ["Core", "Hip Flexors", "Shoulders", "Hamstrings", "Spinal Erectors"],
    commonInjuries: ["lower_back", "shoulder", "hamstring", "wrist"],
    priorityTraining: {
      strength: ["stab_plank", "stab_side_plank", "main_glute_bridge", "stab_bird_dog"],
      injury_prevention: ["stab_mcgill_big3", "mob_wrist_flex_ext", "rehab_shoulder_er"],
      mobility: ["mob_hip_flexor", "mob_hamstring", "mob_thoracic_ext", "mob_shoulder_flex", "mob_hip_rotation"],
    },
    cardio: { mode: "walking_sustained", workRest: null, preferredExercises: ["cardio_treadmill_walk", "cardio_walk_outdoor"] },
    phaseEmphasis: {
      1: "Wrist conditioning, core stability, hip flexor mobility",
      2: "Balance progression, inversions foundation, shoulder stability",
      3: "Upper body pressing strength for arm balances",
      4: "Advanced balance and hold strength",
      5: "Peak flexibility with stability, advanced asana support",
    },
    movementPatterns: ["anti_extension", "rotation", "squat"],
    unlockPhase: 2,
  },

  // ═══ PILATES ══════════════════════════════════════════════════
  "Pilates": {
    label: "Pilates",
    energySystems: { phosphagen: 5, glycolytic: 15, oxidative: 80 },
    dominantPlanes: ["sagittal", "transverse"],
    primaryMovements: ["core_control", "spinal_articulation", "hip_dissociation", "shoulder_stability"],
    primaryMuscles: ["Core", "Hip Flexors", "Glute Max", "Scapular Stabilizers"],
    commonInjuries: ["lower_back", "neck", "shoulder", "hip"],
    priorityTraining: {
      strength: ["stab_dead_bug", "stab_plank", "main_glute_bridge", "stab_bird_dog"],
      injury_prevention: ["stab_mcgill_big3", "rehab_neck_retraction", "rehab_scapular_stab"],
      mobility: ["mob_thoracic_ext", "mob_hip_flexor", "mob_hamstring", "mob_shoulder_flex"],
    },
    cardio: { mode: "walking_sustained", workRest: null, preferredExercises: ["cardio_treadmill_walk", "cardio_walk_outdoor"] },
    phaseEmphasis: {
      1: "Neutral spine awareness, pelvic floor activation, breath control",
      2: "Core endurance, hip dissociation, scapular stability",
      3: "Core strength development, full-body integration",
      4: "Advanced control exercises, apparatus progression",
      5: "Peak body control, fluid movement sequences",
    },
    movementPatterns: ["anti_extension", "anti_rotation", "hinge"],
    unlockPhase: 2,
  },

  // ═══ DANCE ════════════════════════════════════════════════════
  "Dance": {
    label: "Dance",
    energySystems: { phosphagen: 20, glycolytic: 40, oxidative: 40 },
    dominantPlanes: ["sagittal", "frontal", "transverse"],
    primaryMovements: ["jump_land", "turn", "balance", "hip_turnout", "overhead_reach"],
    primaryMuscles: ["Calves", "Core", "Hip Flexors", "Quadriceps", "Glute Med"],
    commonInjuries: ["ankle", "knee", "hip", "lower_back", "foot"],
    priorityTraining: {
      power: ["pes_squat_jump", "pes_lateral_bound"],
      strength: ["stab_single_leg_squat", "main_calf_raise", "stab_plank", "main_hip_thrust"],
      conditioning: ["cardio_jump_rope", "cardio_treadmill_jog"],
      injury_prevention: ["rehab_ankle_4way", "rehab_eccentric_calf", "rehab_hip_abduction", "rehab_foot_intrinsic"],
      mobility: ["mob_hip_turnout", "mob_ankle_df", "mob_hip_flexor", "mob_thoracic_rot"],
    },
    cardio: { mode: "mixed_intervals", workRest: "1:1", preferredExercises: ["cardio_jump_rope", "cardio_treadmill_jog"] },
    phaseEmphasis: {
      1: "Ankle stability, turnout mobility, foot intrinsic strength",
      2: "Single-leg balance, relevé endurance, core control",
      3: "Calf and quad hypertrophy for jump height",
      4: "Explosive jump power, turn stability",
      5: "Performance-level power, endurance for full routines",
    },
    movementPatterns: ["lunge", "squat", "rotation", "locomotion"],
    unlockPhase: 2,
  },

  // ═══ ROWING ═══════════════════════════════════════════════════
  "Rowing": {
    label: "Rowing",
    energySystems: { phosphagen: 10, glycolytic: 35, oxidative: 55 },
    dominantPlanes: ["sagittal"],
    primaryMovements: ["hip_hinge_drive", "pull_horizontal", "leg_drive", "core_stabilization"],
    primaryMuscles: ["Lats", "Quadriceps", "Glute Max", "Hamstrings", "Core", "Biceps"],
    commonInjuries: ["lower_back", "knee", "rib_stress", "wrist"],
    priorityTraining: {
      power: ["main_hip_thrust", "sport_med_ball_slam"],
      strength: ["main_deadlift", "main_barbell_row", "main_leg_press", "stab_pallof_press"],
      conditioning: ["cardio_rower", "cardio_rower_light"],
      injury_prevention: ["stab_mcgill_big3", "mob_thoracic_ext", "mob_hip_flexor", "mob_wrist_flex_ext"],
      mobility: ["mob_thoracic_ext", "mob_hamstring", "mob_hip_flexor", "mob_ankle_df"],
    },
    cardio: { mode: "sustained_and_interval", workRest: "1:1", preferredExercises: ["cardio_rower", "cardio_bike_upright"] },
    phaseEmphasis: {
      1: "Hip hinge mechanics, thoracic extension, low back stabilization",
      2: "Leg drive power, pull strength, core anti-flexion",
      3: "Lat and quad hypertrophy for stroke power",
      4: "Maximal drive power, interval rowing",
      5: "Race-pace power endurance, peak stroke rate",
    },
    movementPatterns: ["pull", "hinge", "anti_extension"],
    unlockPhase: 2,
  },

  // ═══ SKIING / SNOWBOARDING ════════════════════════════════════
  "Skiing/Snowboarding": {
    label: "Skiing / Snowboarding",
    energySystems: { phosphagen: 20, glycolytic: 40, oxidative: 40 },
    dominantPlanes: ["sagittal", "frontal"],
    primaryMovements: ["squat_endurance", "lateral_control", "rotation", "deceleration"],
    primaryMuscles: ["Quadriceps", "Glute Max", "Core", "Hip Abductors", "Calves"],
    commonInjuries: ["knee", "ankle", "lower_back", "shoulder", "wrist"],
    priorityTraining: {
      power: ["pes_squat_jump", "pes_lateral_bound"],
      strength: ["main_wall_sit", "stab_single_leg_squat", "main_hip_thrust", "stab_pallof_press"],
      conditioning: ["cardio_bike_upright", "cardio_stairmaster"],
      injury_prevention: ["rehab_acl_prevention", "rehab_ankle_4way", "stab_mcgill_big3", "mob_wrist_flex_ext"],
      mobility: ["mob_ankle_df", "mob_hip_flexor", "mob_thoracic_rot", "mob_hip_rotation"],
    },
    cardio: { mode: "sustained_moderate", workRest: null, preferredExercises: ["cardio_bike_upright", "cardio_stairmaster"] },
    phaseEmphasis: {
      1: "Knee stability, ankle proprioception, core endurance",
      2: "Quad endurance under load, rotational core, balance",
      3: "Lower body hypertrophy for sustained runs",
      4: "Reactive balance, lateral power",
      5: "Terrain-simulation intervals, peak quad endurance",
    },
    movementPatterns: ["squat", "rotation", "anti_rotation"],
    unlockPhase: 3,
  },

  // ═══ SURFING ══════════════════════════════════════════════════
  "Surfing": {
    label: "Surfing",
    energySystems: { phosphagen: 30, glycolytic: 30, oxidative: 40 },
    dominantPlanes: ["sagittal", "transverse"],
    primaryMovements: ["paddle", "pop_up", "rotation", "balance_unstable", "overhead_pull"],
    primaryMuscles: ["Lats", "Deltoids", "Core", "Hip Flexors", "Quadriceps"],
    commonInjuries: ["shoulder", "lower_back", "knee", "neck"],
    priorityTraining: {
      power: ["sport_popup_drill", "sport_med_ball_slam"],
      strength: ["main_pull_up", "sport_prone_paddle_sim", "stab_pallof_press", "main_hip_thrust"],
      conditioning: ["cardio_swim_freestyle", "cardio_rower"],
      injury_prevention: ["iso_band_ext_rotation", "stab_mcgill_big3", "mob_thoracic_ext", "rehab_neck_retraction"],
      mobility: ["mob_thoracic_ext", "mob_shoulder_flex", "mob_hip_flexor", "mob_thoracic_rot"],
    },
    cardio: { mode: "mixed_paddle_intervals", workRest: "1:2", preferredExercises: ["cardio_rower", "cardio_swim_freestyle"] },
    phaseEmphasis: {
      1: "Shoulder prehab, thoracic extension, pop-up mechanics",
      2: "Paddle endurance, core anti-extension, balance progression",
      3: "Lat and shoulder hypertrophy for paddle power",
      4: "Explosive pop-up power, rotational turns",
      5: "Wave-simulation power, sustained paddle endurance",
    },
    movementPatterns: ["push", "rotation", "anti_extension"],
    unlockPhase: 3,
  },

  // ═══ SKATEBOARDING ════════════════════════════════════════════
  "Skateboarding": {
    label: "Skateboarding",
    energySystems: { phosphagen: 40, glycolytic: 30, oxidative: 30 },
    dominantPlanes: ["sagittal", "frontal"],
    primaryMovements: ["single_leg_balance", "ollie_jump", "pushing", "landing_absorption"],
    primaryMuscles: ["Quadriceps", "Calves", "Core", "Hip Abductors", "Ankle Stabilizers"],
    commonInjuries: ["ankle", "wrist", "knee", "hip"],
    priorityTraining: {
      power: ["pes_squat_jump", "sport_box_jump"],
      strength: ["stab_single_leg_squat", "main_calf_raise", "stab_pallof_press"],
      conditioning: ["cardio_treadmill_jog", "cardio_jump_rope"],
      injury_prevention: ["rehab_ankle_4way", "mob_wrist_flex_ext", "rehab_hip_abduction"],
      mobility: ["mob_ankle_df", "mob_hip_flexor", "mob_wrist_flex_ext"],
    },
    cardio: { mode: "mixed_intervals", workRest: "1:2", preferredExercises: ["cardio_jump_rope", "cardio_treadmill_jog"] },
    phaseEmphasis: {
      1: "Ankle proprioception, single-leg balance, wrist conditioning",
      2: "Single-leg squat strength, landing mechanics, core stability",
      3: "Quad and calf hypertrophy for pop height",
      4: "Explosive single-leg jump, reactive balance",
      5: "Trick-specific power, impact absorption",
    },
    movementPatterns: ["squat", "anti_rotation", "carry"],
    unlockPhase: 3,
  },

  // ═══ PICKLEBALL ═══════════════════════════════════════════════
  "Pickleball": {
    label: "Pickleball",
    energySystems: { phosphagen: 35, glycolytic: 35, oxidative: 30 },
    dominantPlanes: ["transverse", "frontal", "sagittal"],
    primaryMovements: ["lateral_shuffle", "split_step", "rotational_power", "quick_reaction", "deceleration"],
    primaryMuscles: ["Core Rotators", "Quadriceps", "Calves", "Deltoids", "Forearms"],
    commonInjuries: ["elbow", "shoulder", "ankle", "knee"],
    priorityTraining: {
      power: ["sport_med_ball_rot_throw", "pes_lateral_bound"],
      agility: ["sport_split_step", "sport_lateral_shuffle"],
      strength: ["stab_pallof_press", "stab_single_leg_squat", "iso_band_ext_rotation"],
      conditioning: ["cardio_jump_rope", "cardio_treadmill_sprint"],
      injury_prevention: ["mob_wrist_flex_ext", "iso_band_ext_rotation", "rehab_ankle_4way", "rehab_scapular_stab"],
      mobility: ["mob_thoracic_rot", "mob_shoulder_flex", "mob_ankle_df", "mob_wrist_flex_ext"],
    },
    cardio: { mode: "mixed_short_intervals", workRest: "1:1", preferredExercises: ["cardio_jump_rope", "cardio_treadmill_sprint"] },
    phaseEmphasis: {
      1: "Elbow/wrist prehab, ankle stability, split-step mechanics",
      2: "Lateral agility, rotational core, shoulder endurance",
      3: "Core rotational power, shoulder complex development",
      4: "Reactive agility, quick-hands power",
      5: "Court-speed movement, sustained rally power",
    },
    movementPatterns: ["rotation", "lunge", "anti_rotation"],
    unlockPhase: 3,
  },

  // ═══ MARTIAL ARTS (GENERAL) ═══════════════════════════════════
  "Martial Arts": {
    label: "Martial Arts",
    energySystems: { phosphagen: 35, glycolytic: 40, oxidative: 25 },
    dominantPlanes: ["sagittal", "transverse", "frontal"],
    primaryMovements: ["kick", "punch", "rotation", "balance", "stance_work"],
    primaryMuscles: ["Core Rotators", "Hip Flexors", "Glute Max", "Calves", "Deltoids"],
    commonInjuries: ["shoulder", "knee", "ankle", "wrist", "lower_back"],
    priorityTraining: {
      power: ["sport_med_ball_rot_throw", "pes_squat_jump", "sport_med_ball_slam"],
      agility: ["sport_lateral_shuffle", "sport_shadow_boxing"],
      strength: ["stab_single_leg_squat", "stab_pallof_press", "main_hip_thrust"],
      conditioning: ["cardio_jump_rope", "cardio_assault_bike"],
      injury_prevention: ["iso_band_ext_rotation", "rehab_ankle_4way", "mob_wrist_flex_ext", "stab_mcgill_big3"],
      mobility: ["mob_hip_flexor", "mob_hip_rotation", "mob_thoracic_rot", "mob_ankle_df"],
    },
    cardio: { mode: "round_intervals", workRest: "3:1", preferredExercises: ["cardio_jump_rope", "cardio_assault_bike"] },
    phaseEmphasis: {
      1: "Ankle/wrist conditioning, hip mobility, core stability",
      2: "Single-leg balance for kicks, rotational core, stance endurance",
      3: "Hip flexor and core hypertrophy for kick power",
      4: "Explosive kick/punch power, reactive footwork",
      5: "Sparring-simulation conditioning, peak power",
    },
    movementPatterns: ["rotation", "push", "anti_rotation"],
    unlockPhase: 3,
  },

  // ═══ MUAY THAI ════════════════════════════════════════════════
  "Muay Thai": {
    label: "Muay Thai / Striking",
    energySystems: { phosphagen: 30, glycolytic: 45, oxidative: 25 },
    dominantPlanes: ["transverse", "sagittal", "frontal"],
    primaryMovements: ["kick_roundhouse", "knee_strike", "clinch", "rotation", "elbow_strike"],
    primaryMuscles: ["Hip Flexors", "Core Rotators", "Calves", "Deltoids", "Neck"],
    commonInjuries: ["shin", "shoulder", "knee", "hip", "neck"],
    priorityTraining: {
      power: ["sport_med_ball_rot_throw", "pes_squat_jump", "sport_med_ball_slam"],
      agility: ["sport_lateral_shuffle", "sport_shadow_boxing"],
      strength: ["main_hip_thrust", "sport_neck_iso_4way", "stab_pallof_press", "main_calf_raise"],
      conditioning: ["cardio_jump_rope", "cardio_assault_bike"],
      injury_prevention: ["sport_neck_iso_4way", "rehab_shin_conditioning", "iso_band_ext_rotation", "mob_hip_rotation"],
      mobility: ["mob_hip_flexor", "mob_hip_rotation", "mob_thoracic_rot", "mob_ankle_df"],
    },
    cardio: { mode: "round_intervals", workRest: "3:1", preferredExercises: ["cardio_jump_rope", "cardio_assault_bike"] },
    phaseEmphasis: {
      1: "Shin conditioning, hip rotation mobility, neck stability basics",
      2: "Rotational power development, clinch strength, kick mechanics",
      3: "Hip flexor and core hypertrophy for knee strikes",
      4: "Explosive kick and knee power, round-paced conditioning",
      5: "Fight-simulation intervals, peak striking power",
    },
    movementPatterns: ["rotation", "push", "anti_rotation", "locomotion"],
    unlockPhase: 3,
  },
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

// Alias map for fuzzy matching sport names to profile keys
const SPORT_ALIASES = {
  "bjj": "MMA/BJJ", "mma": "MMA/BJJ", "jiu jitsu": "MMA/BJJ", "grappling": "MMA/BJJ",
  "skiing": "Skiing/Snowboarding", "snowboarding": "Skiing/Snowboarding", "snowboard": "Skiing/Snowboarding",
  "kickboxing": "Boxing/Kickboxing", "boxing": "Boxing/Kickboxing",
  "running": "Running/Track", "track": "Running/Track", "jogging": "Running/Track",
  "baseball": "Baseball/Softball", "softball": "Baseball/Softball",
  "american football": "Football", "football (american)": "Football",
  "muay thai": "Muay Thai", "thai boxing": "Muay Thai",
  "hiking/mountaineering": "Hiking", "mountaineering": "Hiking", "backpacking": "Hiking",
  "rock climbing": "Rock Climbing", "bouldering": "Rock Climbing", "climbing": "Rock Climbing", "sport climbing": "Rock Climbing", "lead climbing": "Rock Climbing", "trad climbing": "Rock Climbing",
  "cross fit": "CrossFit", "crossfit": "CrossFit",
  "pickleball": "Pickleball", "paddle tennis": "Pickleball",
  "martial arts": "Martial Arts", "karate": "Martial Arts", "taekwondo": "Martial Arts", "kung fu": "Martial Arts",
  "ice skating": "Dance", "figure skating": "Dance",
  "soccer": "Soccer", "futbol": "Soccer",
};

/**
 * Look up a sport profile by name with fuzzy matching.
 * Falls back to a generic balanced profile for unknown sports.
 */
export function getSportProfile(sportName) {
  if (!sportName) return null;
  // Direct match
  if (SPORT_PROFILES[sportName]) return SPORT_PROFILES[sportName];
  // Alias match (case-insensitive)
  const lower = sportName.toLowerCase();
  if (SPORT_ALIASES[lower] && SPORT_PROFILES[SPORT_ALIASES[lower]]) {
    return SPORT_PROFILES[SPORT_ALIASES[lower]];
  }
  // Substring match — check if any profile key is contained in the input or vice versa
  for (const [key, profile] of Object.entries(SPORT_PROFILES)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return profile;
    }
  }
  // Generic balanced fallback
  return {
    label: sportName,
    energySystems: { phosphagen: 30, glycolytic: 35, oxidative: 35 },
    dominantPlanes: ["sagittal", "frontal", "transverse"],
    primaryMovements: ["push", "pull", "squat", "hinge", "carry"],
    primaryMuscles: ["Core", "Glute Max", "Quadriceps", "Deltoids"],
    commonInjuries: [],
    priorityTraining: {
      strength: ["main_goblet_squat", "main_push_up", "main_row", "stab_plank"],
      conditioning: ["cardio_treadmill_walk", "cardio_bike_upright"],
      injury_prevention: [],
      mobility: ["mob_hip_flexor", "mob_thoracic_ext", "mob_ankle_df"],
    },
    cardio: { mode: "mixed_intervals", workRest: "1:1", preferredExercises: [] },
    phaseEmphasis: {
      1: "General stability and mobility foundation",
      2: "Balanced strength development",
      3: "Muscle development across all patterns",
      4: "Power and performance",
      5: "Peak sport performance",
    },
    movementPatterns: ["push", "pull", "squat", "hinge", "carry"],
    unlockPhase: 3,
  };
}

/**
 * Merge multiple sport profiles based on ranked preferences.
 * Primary (rank 1): 60% weight, Secondary (rank 2): 30%, rest: 10% shared.
 * @param {Array} sportPrefs - [{sport: "Basketball", rank: 1}, ...]
 * @returns {Object} Merged profile with weighted values
 */
export function getMergedSportProfile(sportPrefs) {
  if (!sportPrefs || sportPrefs.length === 0) return null;
  const sorted = [...sportPrefs].sort((a, b) => a.rank - b.rank);
  const profiles = sorted.map(sp => ({ ...sp, profile: getSportProfile(sp.sport) })).filter(sp => sp.profile);
  if (profiles.length === 0) return null;

  // Assign weights based on sport count:
  // 1 sport: 100%. 2 sports: 70/30. 3 sports: 60/30/10.
  const weights = profiles.length === 1
    ? [1.0]
    : profiles.length === 2
      ? [0.7, 0.3]
      : profiles.map((_, i) => i === 0 ? 0.6 : i === 1 ? 0.3 : 0.1);

  // Blend energy systems
  const energySystems = { phosphagen: 0, glycolytic: 0, oxidative: 0 };
  profiles.forEach((sp, i) => {
    const es = sp.profile.energySystems || {};
    energySystems.phosphagen += (es.phosphagen || 0) * weights[i];
    energySystems.glycolytic += (es.glycolytic || 0) * weights[i];
    energySystems.oxidative += (es.oxidative || 0) * weights[i];
  });

  // Union of planes, movements, muscles (deduplicated)
  const dominantPlanes = [...new Set(profiles.flatMap(sp => sp.profile.dominantPlanes || []))];
  const primaryMovements = [...new Set(profiles.flatMap(sp => sp.profile.primaryMovements || []))];
  const primaryMuscles = [...new Set(profiles.flatMap(sp => sp.profile.primaryMuscles || []))];

  // Merge common injuries — count occurrences for doubling logic
  const injuryCounts = {};
  profiles.forEach(sp => {
    for (const inj of (sp.profile.commonInjuries || [])) {
      injuryCounts[inj] = (injuryCounts[inj] || 0) + 1;
    }
  });
  const commonInjuries = Object.keys(injuryCounts);

  // Merge movement patterns (weighted by sport priority)
  const movementPatterns = [...new Set(profiles.flatMap(sp => sp.profile.movementPatterns || []))];

  // Use primary sport's phase emphasis as dominant
  const phaseEmphasis = profiles[0].profile.phaseEmphasis || {};

  return {
    label: profiles.map(sp => sp.sport).join(" + "),
    energySystems,
    dominantPlanes,
    primaryMovements,
    primaryMuscles,
    commonInjuries,
    injuryCounts,
    movementPatterns,
    phaseEmphasis,
    _profiles: profiles,
    _weights: weights,
  };
}

/**
 * Get deduplicated injury prevention exercise IDs from all selected sports.
 * Doubles prevention exercises for shared injury areas across multiple sports.
 * @returns {Array} [{id, area, doubled}]
 */
export function getSportPreventionIds(sportPrefs) {
  if (!sportPrefs || sportPrefs.length === 0) return [];
  const sorted = [...sportPrefs].sort((a, b) => a.rank - b.rank);
  const areaCounts = {};
  const areaExercises = {};

  for (const sp of sorted) {
    const profile = getSportProfile(sp.sport);
    if (!profile) continue;
    for (const inj of (profile.commonInjuries || [])) {
      areaCounts[inj] = (areaCounts[inj] || 0) + 1;
    }
    const prevExercises = profile.priorityTraining?.injury_prevention || [];
    for (const exId of prevExercises) {
      // Determine which injury area this exercise targets (heuristic from ID)
      const area = inferAreaFromExerciseId(exId, profile.commonInjuries);
      if (!areaExercises[area]) areaExercises[area] = [];
      if (!areaExercises[area].includes(exId)) {
        areaExercises[area].push(exId);
      }
    }
  }

  const result = [];
  const seen = new Set();
  for (const [area, exIds] of Object.entries(areaExercises)) {
    const doubled = (areaCounts[area] || 0) >= 2;
    const limit = doubled ? 2 : 1;
    let count = 0;
    for (const exId of exIds) {
      if (count >= limit) break;
      if (seen.has(exId)) continue;
      result.push({ id: exId, area, doubled });
      seen.add(exId);
      count++;
    }
  }
  return result;
}

function inferAreaFromExerciseId(exId, injuries) {
  const id = exId.toLowerCase();
  if (id.includes("ankle") || id.includes("4way")) return "ankle";
  if (id.includes("knee") || id.includes("vmo") || id.includes("patellar") || id.includes("acl") || id.includes("mcl")) return "knee";
  if (id.includes("shoulder") || id.includes("ext_rotation") || id.includes("scapular") || id.includes("rotator")) return "shoulder";
  if (id.includes("hip") || id.includes("adduct")) return "hip";
  if (id.includes("neck")) return "neck";
  if (id.includes("wrist") || id.includes("finger")) return "wrist";
  if (id.includes("calf") || id.includes("achilles") || id.includes("tibialis")) return "shin";
  if (id.includes("hamstring") || id.includes("nordic")) return "hamstring";
  if (id.includes("mcgill") || id.includes("back")) return "lower_back";
  // Default to first injury in the sport's list
  return injuries?.[0] || "general";
}

/**
 * Get blended cardio configuration based on sport energy system dominance.
 * Returns format, work:rest ratios, and preferred exercises.
 */
export function getSportCardioConfig(sportPrefs) {
  if (!sportPrefs || sportPrefs.length === 0) return null;
  const merged = getMergedSportProfile(sportPrefs);
  if (!merged) return null;

  const { phosphagen, glycolytic, oxidative } = merged.energySystems;

  // Determine dominant energy system
  let dominant, format;
  if (phosphagen >= 50) {
    dominant = "phosphagen";
    format = "sprint";
  } else if (oxidative >= 50) {
    dominant = "oxidative";
    format = "steady_state";
  } else if (glycolytic >= 40) {
    dominant = "glycolytic";
    format = "power_interval";
  } else {
    dominant = "mixed";
    format = "progressive";
  }

  // Collect preferred exercises from all sports (primary sport first)
  const preferredExercises = [];
  const seen = new Set();
  const sorted = [...sportPrefs].sort((a, b) => a.rank - b.rank);
  for (const sp of sorted) {
    const profile = getSportProfile(sp.sport);
    if (!profile?.cardio?.preferredExercises) continue;
    for (const exId of profile.cardio.preferredExercises) {
      if (!seen.has(exId)) { preferredExercises.push(exId); seen.add(exId); }
    }
  }

  // Build weekly schedule for multi-energy-system athletes
  let weeklySchedule = null;
  if (sportPrefs.length > 1) {
    const profiles = sorted.map(sp => getSportProfile(sp.sport)).filter(Boolean);
    const hasPhosphagen = profiles.some(p => (p.energySystems?.phosphagen || 0) >= 40);
    const hasOxidative = profiles.some(p => (p.energySystems?.oxidative || 0) >= 40);
    if (hasPhosphagen && hasOxidative) {
      weeklySchedule = [
        { dayType: "upper", mode: "sprint", note: "Sprint intervals match your power sport demands" },
        { dayType: "lower", mode: "steady_state", note: "Sustained Zone 2 builds your endurance base" },
        { dayType: "full", mode: "progressive", note: "Progressive build covers both energy systems" },
      ];
    }
  }

  return {
    dominant,
    format,
    energySystems: merged.energySystems,
    preferredExercises,
    weeklySchedule,
    workRest: sorted[0] ? getSportProfile(sorted[0].sport)?.cardio?.workRest : null,
  };
}

/**
 * Get plane of motion targets based on sport profiles.
 * Returns percentages for exercise selection targeting.
 */
export function getPlaneTargets(sportPrefs) {
  if (!sportPrefs || sportPrefs.length === 0) return null;
  const merged = getMergedSportProfile(sportPrefs);
  if (!merged) return null;

  const planeCounts = { sagittal: 0, frontal: 0, transverse: 0 };
  const sorted = [...sportPrefs].sort((a, b) => a.rank - b.rank);
  const weights = sorted.length === 1 ? [1.0] : sorted.length === 2 ? [0.7, 0.3] : sorted.map((_, i) => i === 0 ? 0.6 : i === 1 ? 0.3 : 0.1);

  sorted.forEach((sp, i) => {
    const profile = getSportProfile(sp.sport);
    if (!profile?.dominantPlanes) return;
    for (const plane of profile.dominantPlanes) {
      planeCounts[plane] = (planeCounts[plane] || 0) + weights[i];
    }
  });

  // Normalize to percentages
  const total = Object.values(planeCounts).reduce((sum, v) => sum + v, 0) || 1;
  return {
    sagittal: Math.round((planeCounts.sagittal / total) * 100),
    frontal: Math.round((planeCounts.frontal / total) * 100),
    transverse: Math.round((planeCounts.transverse / total) * 100),
  };
}

// ═══════════════════════════════════════════════════════════════
// MULTI-SPORT VOLUME MANAGEMENT HELPERS
// ═══════════════════════════════════════════════════════════════

/** Enforce 3-sport active cap (Rule 6). Returns the top 3 ranked prefs. */
export function capSportPrefs(sportPrefs) {
  if (!sportPrefs || sportPrefs.length <= 3) return sportPrefs || [];
  return [...sportPrefs].sort((a, b) => a.rank - b.rank).slice(0, 3);
}

/**
 * Determine which sport gets the dedicated sport-specific slots for this session (Rule 3).
 * Primary sport: 50-60% of sessions, Secondary: 25-30%, Tertiary: 10-15%.
 * No session has sport work from more than one sport.
 * @param {Array} sportPrefs - [{sport, rank}] (max 3)
 * @param {number} sessionIdx - current session index (0-based, mod by daysPerWeek)
 * @param {number} daysPerWeek - training frequency
 * @returns {{ sport, profile, label, rank } | null}
 */
export function getTodaySportFocus(sportPrefs, sessionIdx, daysPerWeek) {
  const capped = capSportPrefs(sportPrefs);
  if (capped.length === 0) return null;
  if (capped.length === 1) {
    const p = getSportProfile(capped[0].sport);
    return { sport: capped[0].sport, profile: p, label: p?.label || capped[0].sport, rank: 1 };
  }

  // Build rotation schedule based on sport count and training frequency.
  // 2 sports: #1 gets ~70%, #2 gets ~30%
  // 3 sports: #1 gets ~60%, #2 gets ~30%, #3 gets ~10%
  const schedules2 = { // 2-sport schedules (70/30)
    2: [0, 1], 3: [0, 0, 1], 4: [0, 1, 0, 0], 5: [0, 0, 1, 0, 0], 6: [0, 1, 0, 0, 1, 0],
  };
  const schedules3 = { // 3-sport schedules (60/30/10)
    2: [0, 1], 3: [0, 0, 1], 4: [0, 1, 0, 2], 5: [0, 0, 1, 0, 2], 6: [0, 1, 0, 0, 2, 1],
  };
  const scheduleMap = capped.length === 2 ? schedules2 : schedules3;
  const schedule = scheduleMap[daysPerWeek] || scheduleMap[4];
  const sportIdx = schedule[sessionIdx % schedule.length];

  // Clamp to available sports
  const pickIdx = Math.min(sportIdx, capped.length - 1);
  const pick = capped[pickIdx];
  const profile = getSportProfile(pick.sport);
  return { sport: pick.sport, profile, label: profile?.label || pick.sport, rank: pick.rank };
}

/**
 * Get sport-specific slot limits based on session time (Rule 2).
 * These slots are carved FROM the main workout, not added on top.
 * @param {number} sessionTime - minutes
 * @returns {number} maximum dedicated sport-specific exercise slots
 */
export function getSportSlotLimit(sessionTime) {
  if (sessionTime <= 30) return 1;
  if (sessionTime <= 45) return 2;
  if (sessionTime <= 60) return 3;
  return 4; // 90+ minutes
}

/**
 * Get dedicated sport-specific drill exercises for today's focus sport.
 * Returns exercises from the sport's priorityTraining (power, agility) that are
 * distinct from the main pool's general exercises.
 * @returns {Array} exercise objects with _sportDrill metadata
 */
export function getSportDrillExercises(focusSport, exerciseDB, phase, location) {
  if (!focusSport?.profile) return [];
  const profile = focusSport.profile;
  const drillCategories = ["power", "agility"];
  const drillIds = [];
  for (const cat of drillCategories) {
    for (const id of (profile.priorityTraining?.[cat] || [])) {
      if (!drillIds.includes(id)) drillIds.push(id);
    }
  }

  const results = [];
  for (const id of drillIds) {
    const ex = exerciseDB.find(e => e.id === id);
    if (!ex) continue;
    if (!(ex.phaseEligibility || []).includes(phase)) continue;
    if (location === "home" && !(ex.locationCompatible || []).includes("home")) continue;
    if (location === "outdoor" && !(ex.locationCompatible || []).includes("outdoor")) continue;
    results.push({
      ...ex,
      _sportDrill: true,
      _sportFocus: focusSport.sport,
      _reason: `${focusSport.label} drill — ${ex.type || "sport-specific"} training`,
    });
  }
  return results;
}

/**
 * Get the energy system session type for today based on multi-sport rotation (Rule 5).
 * Instead of blending every session, dedicates sessions to specific energy systems.
 * @returns {{ format, note, sport } | null}
 */
export function getEnergySystemForSession(sportPrefs, sessionIdx, daysPerWeek) {
  const capped = capSportPrefs(sportPrefs);
  if (capped.length === 0) return null;

  // Single sport — just use that sport's energy system
  if (capped.length === 1) {
    const profile = getSportProfile(capped[0].sport);
    if (!profile) return null;
    const es = profile.energySystems || {};
    const dominant = es.phosphagen >= 50 ? "phosphagen" : es.oxidative >= 50 ? "oxidative" : es.glycolytic >= 40 ? "glycolytic" : "mixed";
    const formatMap = { phosphagen: "sprint", oxidative: "steady_state", glycolytic: "power_interval", mixed: "progressive" };
    return { format: formatMap[dominant], note: `${profile.label} energy system: ${dominant}`, sport: capped[0].sport };
  }

  // Multi-sport: check if energy systems conflict
  const profiles = capped.map(sp => ({ sport: sp.sport, profile: getSportProfile(sp.sport) })).filter(sp => sp.profile);
  const hasExplosive = profiles.some(p => (p.profile.energySystems?.phosphagen || 0) >= 40);
  const hasEndurance = profiles.some(p => (p.profile.energySystems?.oxidative || 0) >= 40);

  if (hasExplosive && hasEndurance) {
    // Conflicting systems — rotate across the week
    const rotation = [];
    for (let i = 0; i < daysPerWeek; i++) {
      if (i % 3 === 0) rotation.push({ format: "sprint", note: "Sprint day — explosive power for " + profiles.find(p => (p.profile.energySystems?.phosphagen || 0) >= 40)?.profile.label, sport: profiles.find(p => (p.profile.energySystems?.phosphagen || 0) >= 40)?.sport });
      else if (i % 3 === 1) rotation.push({ format: "steady_state", note: "Endurance day — aerobic base for " + profiles.find(p => (p.profile.energySystems?.oxidative || 0) >= 40)?.profile.label, sport: profiles.find(p => (p.profile.energySystems?.oxidative || 0) >= 40)?.sport });
      else rotation.push({ format: "power_interval", note: "Bridge day — glycolytic intervals for both sports", sport: null });
    }
    return rotation[sessionIdx % rotation.length];
  }

  // Similar systems — no conflict, use primary sport's system
  const primary = profiles[0];
  const es = primary.profile.energySystems || {};
  const dominant = es.phosphagen >= 50 ? "phosphagen" : es.oxidative >= 50 ? "oxidative" : es.glycolytic >= 40 ? "glycolytic" : "mixed";
  const formatMap = { phosphagen: "sprint", oxidative: "steady_state", glycolytic: "power_interval", mixed: "progressive" };
  return { format: formatMap[dominant], note: `Both sports demand similar energy — ${dominant}-focused cardio`, sport: primary.sport };
}

/**
 * Get deduplicated injury prevention for session, respecting per-session cap (Rule 4).
 * Max 2-3 per session, rotates excess areas across the week.
 * @param {number} maxPerSession - typically 2-3
 * @param {number} sessionIdx - for rotation of excess areas
 * @returns {Array} [{id, area}]
 */
export function getRotatedPreventionIds(sportPrefs, maxPerSession, sessionIdx) {
  // Get all unique prevention areas with one exercise each (deduplicated)
  const capped = capSportPrefs(sportPrefs);
  if (capped.length === 0) return [];

  const areaMap = {}; // area -> [exerciseIds]
  for (const sp of capped) {
    const profile = getSportProfile(sp.sport);
    if (!profile) continue;
    for (const exId of (profile.priorityTraining?.injury_prevention || [])) {
      const area = inferAreaFromExerciseId(exId, profile.commonInjuries);
      if (!areaMap[area]) areaMap[area] = [];
      if (!areaMap[area].includes(exId)) areaMap[area].push(exId);
    }
  }

  // One exercise per area (deduplicated)
  const allAreas = Object.entries(areaMap).map(([area, ids]) => ({ area, id: ids[0] }));

  // If within cap, return all
  if (allAreas.length <= maxPerSession) return allAreas;

  // Rotate: pick a window of maxPerSession starting at sessionIdx
  const offset = sessionIdx % allAreas.length;
  const rotated = [];
  for (let i = 0; i < maxPerSession; i++) {
    rotated.push(allAreas[(offset + i) % allAreas.length]);
  }
  return rotated;
}

/**
 * Get climbing-specific protocols if any of the user's sports is climbing/bouldering.
 * Returns pre-climb, post-climb, and antagonist session exercise IDs if applicable.
 * @returns {{ preClimb, postClimb, weeklyAntagonist, isClimber } | null}
 */
export function getClimbingProtocols(sportPrefs) {
  if (!sportPrefs || sportPrefs.length === 0) return null;
  const climbingSport = sportPrefs.find(sp => {
    const lower = sp.sport.toLowerCase();
    return lower.includes("climb") || lower.includes("boulder");
  });
  if (!climbingSport) return null;
  const profile = getSportProfile(climbingSport.sport);
  if (!profile?.climbingProtocols) return null;
  return {
    isClimber: true,
    rank: climbingSport.rank,
    preClimb: profile.climbingProtocols.preClimb,
    postClimb: profile.climbingProtocols.postClimb,
    weeklyAntagonist: profile.climbingProtocols.weeklyAntagonist,
    safetyGates: profile.safetyGates || {},
    fingerHealthCheck: profile.fingerHealthCheck || null,
    trackingMetrics: profile.trackingMetrics || [],
  };
}

export { SPORT_PROFILES, PATTERN_TO_PLANE };
