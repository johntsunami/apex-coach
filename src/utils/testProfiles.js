// ═══════════════════════════════════════════════════════════════
// APEX Coach — QA Test Profiles (5 users for safety verification)
// ═══════════════════════════════════════════════════════════════

// Profile 1: Complex multi-condition — Lumbar fusion + Knee OA + Diabetes
export const PROFILE_LUMBAR_KNEE_DIABETES = {
  name: "Test: Lumbar Fusion + Knee OA + Diabetes",
  phase: 1,
  injuries: [
    { id: "test_inj_1", area: "Lower Back", type: "Post-Surgical", severity: 4, status: "managing", gateKey: "lower_back", protocols: ["No axial loading", "McGill Big 3 daily", "Fusion-safe movements only"], notes: "L4-L5 fusion", tempFlag: null },
    { id: "test_inj_2", area: "Right Knee", type: "Osteoarthritis", severity: 3, status: "managing", gateKey: "knee", protocols: ["No deep flexion past 90°", "VMO activation", "Low-impact only"], notes: "Grade II OA", tempFlag: null },
  ],
  conditions: [
    { conditionId: "A1", name: "Spinal Fusion (Post-Op — Lumbar)", severity: 4, bodyArea: "Lower Back", condType: "Post-Surgical", category: "spinal" },
    { conditionId: "J1", name: "Knee Osteoarthritis", severity: 3, bodyArea: "Right Knee", condType: "Chronic Pain", category: "joint" },
    { conditionId: "M1", name: "Type 2 Diabetes", severity: 1, bodyArea: "", condType: "Managing", category: "metabolic" },
  ],
  assessment: {
    directionalPreferences: {
      A1: { extension: "better", flexion: "worse", centralization: true },
    },
    painTimelines: {
      A1: { onset: "chronic", injuryType: "specific", surgery: true, surgeryTimeAgo: "1-2 years" },
      J1: { onset: "chronic_persistent", injuryType: "gradual", surgery: false },
    },
    painBehaviors: {
      A1: { painType: "Intermittent", worstTime: "Morning", triggers: ["Sitting", "Bending"], relievers: ["Movement", "Stretching"], trend: "same" },
      J1: { painType: "Activity-only", worstTime: "Evening", triggers: ["Standing", "Walking", "Stairs"], relievers: ["Rest", "Ice"], trend: "same" },
    },
    functionalLimitations: {
      sit_30: "difficulty", stand_30: "difficulty", walk_15: "easy",
      climb_stairs: "difficulty", lift_overhead: "cannot",
      reach_behind: "easy", get_up_floor: "difficulty",
      sleep_through: "difficulty", drive_30: "difficulty", exercise_moderate: "difficulty",
    },
    medications: ["diabetes_meds"],
    redFlags: [],
    redFlagCleared: false,
    conditions: [], // filled from conditions above
  },
  medications: ["diabetes_meds"],
  redFlags: [],
  redFlagCleared: true,
  sessionCount: 6,
  sessions: [],
  ptProtocols: [
    { condition_key: "A1", protocol_name: "Lumbar Spine Rehabilitation", protocol_type: "mckenzie_extension", current_phase: 1, exercises: ["mob_cat_cow", "stab_mcgill_curl_up", "stab_bird_dog", "stab_side_plank"], frequency_per_day: 2, session_duration_minutes: 15, graduation_criteria: [{ label: "Pain ≤2/10 for 2 weeks", met: false }] },
    { condition_key: "J1", protocol_name: "Right Knee Recovery", protocol_type: "joint_strengthening", current_phase: 1, exercises: ["rehab_vmo_wall_sit", "rehab_tke", "rehab_quad_set", "rehab_slr"], frequency_per_day: 2, session_duration_minutes: 15, graduation_criteria: [{ label: "Full ROM restored", met: false }] },
  ],
};
// Backfill assessment.conditions
PROFILE_LUMBAR_KNEE_DIABETES.assessment.conditions = PROFILE_LUMBAR_KNEE_DIABETES.conditions;

// Profile 2: No conditions beginner
export const PROFILE_HEALTHY_BEGINNER = {
  name: "Test: Healthy Beginner",
  phase: 1,
  injuries: [],
  conditions: [],
  assessment: {
    directionalPreferences: {},
    painTimelines: {},
    painBehaviors: {},
    functionalLimitations: {
      sit_30: "easy", stand_30: "easy", walk_15: "easy",
      climb_stairs: "easy", lift_overhead: "easy",
      reach_behind: "easy", get_up_floor: "easy",
      sleep_through: "easy", drive_30: "easy", exercise_moderate: "easy",
    },
    medications: ["none"],
    redFlags: [],
    redFlagCleared: false,
    conditions: [],
  },
  medications: [],
  redFlags: [],
  redFlagCleared: true,
  sessionCount: 0,
  sessions: [],
  ptProtocols: [],
};

// Profile 3: Cervical disc + Shoulder impingement (upper body restrictions)
export const PROFILE_CERVICAL_SHOULDER = {
  name: "Test: Cervical Disc + Shoulder Impingement",
  phase: 1,
  injuries: [
    { id: "test_inj_3", area: "Neck", type: "Disc Herniation", severity: 3, status: "active", gateKey: "lower_back", protocols: ["No loaded cervical motion", "Chin tucks daily", "Scapular stabilization"], notes: "C5-C6 disc", tempFlag: null },
    { id: "test_inj_4", area: "Right Shoulder", type: "Impingement", severity: 2, status: "rehab", gateKey: "shoulder", protocols: ["No behind-neck pressing", "External rotation warm-up", "Face pulls mandatory"], notes: "Subacromial impingement", tempFlag: null },
  ],
  conditions: [
    { conditionId: "A2", name: "Cervical Disc Herniation", severity: 3, bodyArea: "Neck", condType: "Chronic Pain", category: "spinal" },
    { conditionId: "chronic_joint_Right Shoulder", name: "Shoulder Impingement", severity: 2, bodyArea: "Right Shoulder", condType: "Chronic Pain", category: "joint" },
  ],
  assessment: {
    directionalPreferences: {
      A2: { extension: "worse", flexion: "better", centralization: false },
    },
    painTimelines: {
      A2: { onset: "subacute", injuryType: "gradual", surgery: false },
      "chronic_joint_Right Shoulder": { onset: "chronic", injuryType: "gradual", surgery: false },
    },
    painBehaviors: {
      A2: { painType: "Intermittent", worstTime: "Morning", triggers: ["Sitting", "Lifting"], relievers: ["Movement", "Heat"], trend: "better" },
    },
    functionalLimitations: {
      sit_30: "difficulty", stand_30: "easy", walk_15: "easy",
      climb_stairs: "easy", lift_overhead: "cannot",
      reach_behind: "difficulty", get_up_floor: "easy",
      sleep_through: "difficulty", drive_30: "difficulty", exercise_moderate: "difficulty",
    },
    medications: ["nsaids"],
    redFlags: [],
    redFlagCleared: false,
    conditions: [],
  },
  medications: ["nsaids"],
  redFlags: [],
  redFlagCleared: true,
  sessionCount: 3,
  sessions: [],
  ptProtocols: [
    { condition_key: "A2", protocol_name: "Cervical Spine Rehabilitation", protocol_type: "williams_flexion", current_phase: 1, exercises: ["mob_cat_cow", "stab_dead_bug", "stab_mcgill_curl_up"], frequency_per_day: 3, session_duration_minutes: 12, graduation_criteria: [{ label: "Pain ≤2/10 for 2 weeks", met: false }] },
  ],
};
PROFILE_CERVICAL_SHOULDER.assessment.conditions = PROFILE_CERVICAL_SHOULDER.conditions;

// Profile 4: Wheelchair user + Chronic pain (seated-only exercises)
export const PROFILE_WHEELCHAIR_CHRONIC = {
  name: "Test: Wheelchair User + Chronic Pain",
  phase: 1,
  injuries: [
    { id: "test_inj_5", area: "Lower Body", type: "Paralysis", severity: 5, status: "managing", gateKey: "knee", protocols: ["Seated exercises only", "Upper body focus", "Core stability from chair"], notes: "T10 SCI", tempFlag: null },
    { id: "test_inj_6", area: "Shoulders", type: "Chronic Pain", severity: 3, status: "active", gateKey: "shoulder", protocols: ["Avoid overhead fatigue", "Rotator cuff maintenance", "Pain monitoring"], notes: "Wheelchair propulsion overuse", tempFlag: null },
  ],
  conditions: [
    { conditionId: "chronic_neurological_paralysis", name: "Spinal Cord Injury — T10", severity: 5, bodyArea: "Lower Body", condType: "Managing", category: "neurological" },
    { conditionId: "chronic_joint_shoulders", name: "Chronic Shoulder Pain", severity: 3, bodyArea: "Shoulders", condType: "Chronic Pain", category: "joint" },
  ],
  assessment: {
    directionalPreferences: {},
    painTimelines: {
      chronic_neurological_paralysis: { onset: "chronic_persistent", injuryType: "specific", surgery: true, surgeryTimeAgo: "2+ years" },
      chronic_joint_shoulders: { onset: "chronic", injuryType: "gradual", surgery: false },
    },
    painBehaviors: {
      chronic_joint_shoulders: { painType: "Activity-only", worstTime: "Evening", triggers: ["Lifting", "Pushing"], relievers: ["Rest", "Ice", "Stretching"], trend: "same" },
    },
    functionalLimitations: {
      sit_30: "easy", stand_30: "cannot", walk_15: "cannot",
      climb_stairs: "cannot", lift_overhead: "difficulty",
      reach_behind: "difficulty", get_up_floor: "cannot",
      sleep_through: "difficulty", drive_30: "easy", exercise_moderate: "difficulty",
    },
    medications: ["muscle_relaxants"],
    redFlags: [],
    redFlagCleared: false,
    conditions: [],
  },
  medications: ["muscle_relaxants"],
  redFlags: [],
  redFlagCleared: true,
  sessionCount: 10,
  sessions: [],
  ptProtocols: [
    { condition_key: "chronic_joint_shoulders", protocol_name: "Shoulder Maintenance Protocol", protocol_type: "shoulder_rehab", current_phase: 1, exercises: ["rehab_iso_ext_rotation", "rehab_prone_y", "rehab_scap_wall_slides"], frequency_per_day: 1, session_duration_minutes: 15, graduation_criteria: [{ label: "Pain ≤2/10 for 2 weeks", met: false }] },
  ],
};
PROFILE_WHEELCHAIR_CHRONIC.assessment.conditions = PROFILE_WHEELCHAIR_CHRONIC.conditions;

// Profile 5: Post-ACL surgery + ADHD (joint rehab + mental health)
export const PROFILE_ACL_ADHD = {
  name: "Test: Post-ACL + ADHD",
  phase: 1,
  injuries: [
    { id: "test_inj_7", area: "Left Knee", type: "Post-Surgical", severity: 3, status: "rehab", gateKey: "knee", protocols: ["ACL protocol phases", "No plyometrics", "Quad/hamstring strength balance", "Progressive loading"], notes: "ACL reconstruction — 4 months post-op", tempFlag: null },
  ],
  conditions: [
    { conditionId: "J_acl", name: "ACL Reconstruction (Post-Op)", severity: 3, bodyArea: "Left Knee", condType: "Post-Surgical", category: "joint" },
    { conditionId: "mh_adhd", name: "ADHD", severity: 1, bodyArea: "", condType: "Managing", category: "mental_health" },
  ],
  assessment: {
    directionalPreferences: {},
    painTimelines: {
      J_acl: { onset: "subacute", injuryType: "specific", surgery: true, surgeryTimeAgo: "3-6 months" },
    },
    painBehaviors: {
      J_acl: { painType: "Activity-only", worstTime: "No pattern", triggers: ["Walking", "Bending", "Stairs"], relievers: ["Rest", "Ice", "Movement"], trend: "better" },
    },
    functionalLimitations: {
      sit_30: "easy", stand_30: "easy", walk_15: "difficulty",
      climb_stairs: "difficulty", lift_overhead: "easy",
      reach_behind: "easy", get_up_floor: "difficulty",
      sleep_through: "easy", drive_30: "easy", exercise_moderate: "difficulty",
    },
    medications: ["none"],
    redFlags: [],
    redFlagCleared: false,
    conditions: [],
  },
  medications: [],
  redFlags: [],
  redFlagCleared: true,
  sessionCount: 12,
  sessions: [],
  ptProtocols: [
    { condition_key: "J_acl", protocol_name: "Left Knee ACL Rehabilitation", protocol_type: "joint_strengthening", current_phase: 2, exercises: ["rehab_vmo_wall_sit", "rehab_tke", "rehab_step_down_low", "rehab_slr"], frequency_per_day: 2, session_duration_minutes: 15, graduation_criteria: [{ label: "Full ROM restored", met: false }, { label: "Single-leg balance 20s", met: false }] },
  ],
};
PROFILE_ACL_ADHD.assessment.conditions = PROFILE_ACL_ADHD.conditions;

// All profiles for batch testing
export const ALL_TEST_PROFILES = [
  PROFILE_LUMBAR_KNEE_DIABETES,
  PROFILE_HEALTHY_BEGINNER,
  PROFILE_CERVICAL_SHOULDER,
  PROFILE_WHEELCHAIR_CHRONIC,
  PROFILE_ACL_ADHD,
];
