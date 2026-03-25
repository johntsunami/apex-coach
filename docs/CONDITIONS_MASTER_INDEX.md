# CONDITIONS MASTER INDEX — 100 Conditions
## Maps every condition to recommended exercises, contraindications, and clinical notes
## This file is the CONDITIONS lookup table for the exercise database

---

## HOW THIS WORKS

When a user reports a condition, the app:
1. Looks up the condition in this index
2. FILTERS OUT all exercises listed in `avoid`
3. PRIORITIZES exercises listed in `recommended`
4. ADDS mandatory exercises from `mandatory_daily` if any
5. ADJUSTS parameters per `modifications`
6. SHOWS the user `user_message` explaining what was adapted
7. FLAGS `refer_out_if` conditions that need medical clearance

---

## ADDITIONAL EXERCISES NEEDED (beyond the 287)

Some conditions require specific exercises not yet in the database. Add these:

288. Pendulum Shoulder Swing (Codman's) — frozen shoulder, post-op shoulder
289. Scapular Clock Exercise — scapular dyskinesis
290. Chin Tuck with Band Resistance — advanced cervical stabilization
291. Cervical SNAG (self-mobilization with towel) — chronic neck stiffness
292. Prone Press-Up with Exhale (McKenzie variant) — post-fusion adjacent segment
293. Hooklying March (post-fusion safe) — core activation without spinal motion
294. Pelvic Clock Exercise (supine) — lumbopelvic dissociation, post-fusion
295. Tall Kneeling Balance — hip/core integration without spinal load
296. Eccentric Squat on Decline Board — patellar tendinopathy gold standard
297. Spanish Squat (band behind knees) — patellar tendinopathy alternative
298. Serratus Anterior Punch (supine) — scapular protraction strengthening
299. Thoracic Extension over Foam Roller — thoracic kyphosis correction
300. Standing Hip Flexor March (band) — hip flexor strengthening without impingement

**Updated total: 300 exercises**

---

## CATEGORY A: SPINAL CONDITIONS (20 conditions)

### A1. Spinal Fusion (Post-Op — Lumbar)
```json
{
  "condition": "spinal_fusion_lumbar",
  "severity_range": "1-5",
  "recommended": ["hooklying_march", "pelvic_clock", "ankle_pumps", "glute_sets", "pelvic_tilt_supine", "dead_bug_modified", "bird_dog_modified", "glute_bridge_cautious", "walking_zone2", "seated_exercises"],
  "mandatory_daily": ["diaphragmatic_breathing", "ankle_pumps", "pelvic_tilt_supine"],
  "avoid": ["ANY_spinal_flexion_under_load", "ANY_spinal_rotation_under_load", "ANY_spinal_extension_past_neutral", "deadlifts_all_variations", "sit_ups_crunches", "russian_twists", "good_mornings", "back_extension_machine", "plyometrics", "running_early"],
  "modifications": { "core_exercises": "anti-movement ONLY (plank, pallof, dead bug)", "no_loaded_spinal_motion": true, "max_intensity": "RPE 5 for 12+ weeks post-op" },
  "phases": { "weeks_0_6": "breathing + ankle pumps + walking + gentle ROM only", "weeks_6_12": "add isometrics + bodyweight core + glute activation", "weeks_12_24": "progressive loading with fusion-safe exercises", "months_6_plus": "gradual return to full training with permanent restrictions on loaded spinal flexion/rotation" },
  "refer_out_if": "new radiating pain, numbness, weakness in legs, bowel/bladder changes, hardware pain",
  "user_message": "Your fusion means we protect the fused segments permanently. Core training is anti-movement only — we build a natural brace around the fusion. Adjacent segments need mobility work to prevent degeneration above/below the fusion.",
  "notes": "Fused segments cannot move — all motion transfers to adjacent segments. Adjacent segment disease is the #1 long-term concern. Exercises that load the spine in flexion/rotation are permanently restricted, not just temporarily."
}
```

### A2. Spinal Fusion (Post-Op — Cervical)
```json
{
  "recommended": ["chin_tuck", "scapular_exercises", "upper_body_seated_exercises", "walking", "gentle_shoulder_rom", "diaphragmatic_breathing"],
  "avoid": ["neck_flexion_extension_against_resistance", "overhead_pressing_heavy", "behind_neck_anything", "headstands", "cervical_rotation_under_load"],
  "phases": { "weeks_0_6": "collar protocol per surgeon, gentle hand/wrist exercises only", "weeks_6_12": "isometric neck, scapular stabilization, gentle ROM", "months_3_6": "progressive upper body strengthening", "months_6_plus": "return to most activities with permanent loaded cervical motion restriction" },
  "notes": "Similar adjacent segment concerns as lumbar fusion. Protect fused levels permanently."
}
```

### A3. Disc Herniation (Lumbar — Acute)
```json
{
  "recommended": ["mckenzie_extension_sequence", "prone_lying", "prone_on_elbows", "press_up", "extension_standing", "walking_short_bouts", "diaphragmatic_breathing"],
  "avoid": ["ALL_flexion", "sitting_prolonged", "deadlifts", "sit_ups", "toe_touches", "hamstring_stretch_aggressive"],
  "notes": "Extension-biased protocol. Goal is centralization of symptoms. If symptoms peripheralize with extension, STOP and refer out."
}
```

### A4. Disc Herniation (Lumbar — Chronic/Managed)
```json
{
  "recommended": ["mckenzie_full_sequence", "mcgill_big_3", "dead_bug", "bird_dog", "pallof_press", "glute_bridge", "walking", "swimming"],
  "avoid": ["loaded_spinal_flexion", "sit_ups", "heavy_deadlifts_conventional", "good_mornings"],
  "notes": "Maintenance phase. Daily McKenzie press-ups. Core endurance (not strength) is priority per McGill research."
}
```

### A5. Disc Herniation (Cervical)
```json
{
  "recommended": ["mckenzie_neck_sequence", "chin_tuck", "scapular_stabilization", "upper_trap_stretch", "nerve_glides_if_appropriate"],
  "avoid": ["behind_neck_pressing", "heavy_overhead", "cervical_flexion_under_load", "headstands"],
  "notes": "Same centralization principle as lumbar. Retraction is the foundation movement."
}
```

### A6. Spinal Stenosis
```json
{
  "recommended": ["williams_flexion_exercises", "posterior_pelvic_tilt", "knees_to_chest", "seated_flexion", "walking_with_flexion_bias", "stationary_bike", "aquatic_exercise"],
  "avoid": ["mckenzie_extension", "prone_press_ups", "back_extension", "prolonged_standing", "prolonged_walking_without_rest"],
  "notes": "FLEXION-biased protocol — OPPOSITE of disc herniation. Extension narrows the spinal canal. Bike and swimming are often better tolerated than walking."
}
```

### A7. Spondylolisthesis
```json
{
  "recommended": ["williams_flexion", "core_stabilization_anti_extension", "posterior_pelvic_tilt", "dead_bug", "plank", "glute_bridge"],
  "avoid": ["hyperextension", "heavy_axial_loading", "back_extension_machine", "overhead_press_heavy"],
  "notes": "Forward slip of vertebra worsened by extension. Flexion-biased + aggressive core stabilization."
}
```

### A8. Spondylolysis (Pars Fracture)
```json
{
  "recommended": ["core_stabilization", "hip_strengthening", "anti_extension_exercises", "aquatic_exercise"],
  "avoid": ["extension", "rotation_under_load", "hyperextension", "cricket_bowling_motion", "gymnastics_extension"],
  "notes": "Stress fracture of pars interarticularis. May need bracing period. Extension and rotation stress the fracture."
}
```

### A9. Degenerative Disc Disease
```json
{
  "recommended": ["walking", "core_stabilization", "mcgill_big_3", "mckenzie_press_ups", "swimming", "glute_strengthening"],
  "avoid": ["heavy_axial_loading_early", "repetitive_flexion_under_load", "high_impact"],
  "notes": "Depends on presentation — may be extension or flexion biased. Assess directional preference. General rule: movement is medicine, but protect under load."
}
```

### A10. Chronic Neck Pain (Non-Specific)
```json
{
  "recommended": ["chin_tuck", "mckenzie_neck_retraction", "cervical_snag", "upper_trap_stretch", "levator_stretch", "thoracic_extension_foam_roller", "scapular_exercises", "prone_cobra"],
  "avoid": ["behind_neck_pressing", "shrugs_if_trap_dominant", "heavy_overhead_initially"],
  "notes": "Usually upper crossed syndrome. Strengthen deep cervical flexors, lower traps. Stretch upper traps, pecs, SCM. Thoracic mobility is critical — stiff thoracic spine forces cervical compensations."
}
```

### A11. Whiplash (Chronic)
```json
{
  "recommended": ["gentle_cervical_rom", "chin_tuck_isometric", "scapular_stabilization", "deep_cervical_flexor_activation", "thoracic_mobility"],
  "avoid": ["aggressive_cervical_mobilization", "heavy_overhead", "contact_sports_until_cleared"],
  "notes": "Graded exposure to movement. Pain science education important. May have central sensitization component."
}
```

### A12. Sciatica
```json
{
  "recommended": ["mckenzie_extension_if_disc", "sciatic_nerve_glide", "piriformis_stretch", "glute_activation", "walking_short_bouts"],
  "avoid": ["loaded_spinal_flexion", "prolonged_sitting", "aggressive_hamstring_stretch"],
  "notes": "Determine cause: disc (extension helps) vs piriformis (stretching helps) vs stenosis (flexion helps). Treatment differs by cause."
}
```

### A13. SI Joint Dysfunction
```json
{
  "recommended": ["core_stabilization", "glute_strengthening", "hip_abduction", "pelvic_floor", "single_leg_work_for_symmetry"],
  "avoid": ["asymmetric_heavy_loading", "single_leg_deadlift_if_painful", "wide_stance_squats_if_painful"],
  "notes": "Stabilize the joint. Often coexists with hip weakness. May need SI belt initially."
}
```

### A14. Ankylosing Spondylitis
```json
{
  "recommended": ["thoracic_extension", "chest_stretching", "swimming", "deep_breathing_exercises", "posture_exercises", "walking"],
  "avoid": ["high_impact_during_flares", "spinal_flexion_exercises"],
  "notes": "Extension + posture is KEY to prevent progressive kyphosis. Swimming is gold standard. Chest expansion exercises for respiratory function."
}
```

### A15. Kyphosis (Excessive Thoracic)
```json
{
  "recommended": ["thoracic_extension_foam_roller", "prone_cobra", "wall_angel", "band_pull_apart", "face_pulls", "pec_stretch", "chin_tuck"],
  "avoid": ["excessive_pressing_without_pulling", "crunches", "exercises_that_reinforce_flexed_posture"],
  "notes": "2:1 pull-to-push ratio minimum. Thoracic extension mobility daily. Strengthen mid/lower traps, stretch pecs."
}
```

### A16. Lordosis (Excessive Lumbar)
```json
{
  "recommended": ["hip_flexor_stretch", "glute_bridge", "dead_bug", "posterior_pelvic_tilt", "plank", "hamstring_strengthening"],
  "avoid": ["heavy_back_extension", "deep_arching"],
  "notes": "Lower crossed syndrome. Lengthen hip flexors + erectors. Activate glutes + TVA."
}
```

### A17. Scoliosis
```json
{
  "recommended": ["core_stabilization_bilateral", "schroth_method_exercises_if_trained", "swimming", "yoga_modified", "unilateral_strengthening_for_weak_side"],
  "avoid": ["heavy_axial_loading_asymmetric", "one_sided_sports_exclusively"],
  "notes": "Depends on degree and type. Mild: normal exercise with awareness. Moderate+: Schroth-based PT. Strengthening the convex side's muscles."
}
```

### A18. Coccyx Pain (Coccydynia)
```json
{
  "recommended": ["standing_exercises", "pelvic_floor_relaxation", "hip_stretching", "cushion_for_seated_work"],
  "avoid": ["seated_exercises_on_hard_surface", "rowing_machine", "sit_ups", "cycling_if_painful"],
  "notes": "Avoid direct coccyx pressure. Standing or supine exercises preferred. May need donut cushion."
}
```

### A19. Failed Back Surgery Syndrome (FBSS)
```json
{
  "recommended": ["aquatic_therapy", "gentle_walking", "pain_education", "graded_activity", "relaxation_techniques", "isometric_core"],
  "avoid": ["determined_by_individual_assessment — varies widely"],
  "notes": "Complex chronic pain condition. Biopsychosocial approach essential. Graded exposure. May have central sensitization. Exercise is medicine but must be dosed carefully."
}
```

### A20. Thoracic Outlet Syndrome
```json
{
  "recommended": ["scalene_stretch", "pec_minor_stretch", "nerve_glides_upper_extremity", "scapular_retraction", "posture_correction"],
  "avoid": ["overhead_carrying", "heavy_overhead_press", "exercises_with_arms_overhead_prolonged"],
  "notes": "Nerve/vascular compression between scalenes or under pec minor. Open the thoracic outlet with stretching and posture work."
}
```

---

## CATEGORY B: JOINT-SPECIFIC CONDITIONS (25 conditions)

### B1. Knee — ACL Tear (Post-Op)
```json
{
  "recommended": ["quad_sets", "straight_leg_raise", "heel_slides", "VMO_activation", "glute_bridge", "step_downs_progressive", "single_leg_press"],
  "avoid": ["open_chain_knee_extension_early", "plyometrics_before_month_6", "pivoting_cutting_before_month_9", "deep_squats_early"],
  "phases": { "weeks_0_6": "ROM recovery + quad activation", "weeks_6_12": "progressive strengthening", "months_3_6": "functional training", "months_6_9": "sport-specific", "months_9_12": "return to sport criteria-based" }
}
```

### B2. Knee — Meniscus Tear/Repair
```json
{
  "recommended": ["quad_sets", "straight_leg_raise", "VMO_wall_sit", "terminal_knee_extension", "stationary_bike"],
  "avoid": ["deep_knee_flexion_under_load", "twisting_under_load", "squats_past_90_early"]
}
```

### B3. Knee — Patellar Tendinopathy
```json
{
  "recommended": ["eccentric_squat_decline_board", "spanish_squat", "isometric_wall_sit", "VMO_activation", "hip_strengthening"],
  "avoid": ["jumping", "running_downhill", "deep_squats_if_painful"]
}
```

### B4. Knee — Osteoarthritis
```json
{
  "recommended": ["quad_strengthening", "stationary_bike", "water_walking", "gentle_ROM", "isometric_quad_set"],
  "avoid": ["high_impact", "deep_squats_if_painful", "excessive_stair_climbing"]
}
```

### B5. Knee — Total Replacement (Post-Op)
```json
{
  "recommended": ["ankle_pumps", "quad_sets", "heel_slides", "straight_leg_raise", "knee_flexion_progressive", "walking_progressive", "stationary_bike"],
  "avoid": ["high_impact_permanently", "deep_squats", "kneeling_on_replaced_knee"],
  "phases": { "weeks_0_6": "ROM recovery + basic strengthening", "weeks_6_12": "progressive loading", "months_3_plus": "return to most activities except high impact" }
}
```

### B6. Shoulder — Rotator Cuff Tear/Repair
```json
{
  "recommended": ["pendulum_swing", "isometric_ER_IR", "passive_ROM_progressive", "scapular_exercises", "band_ER", "prone_YTW"],
  "avoid": ["active_ROM_before_clearance", "lifting_overhead_before_clearance", "behind_neck", "dips"]
}
```

### B7. Shoulder — Labrum Tear (SLAP/Bankart)
```json
{
  "recommended": ["scapular_stabilization", "band_ER", "face_pulls", "landmine_press", "prone_YTW"],
  "avoid": ["behind_neck", "overhead_end_range", "dips", "loaded_supination_bicep"]
}
```

### B8. Shoulder — Frozen Shoulder (Adhesive Capsulitis)
```json
{
  "recommended": ["pendulum_swing", "wall_walking_fingers", "towel_stretch_behind_back", "passive_ROM_gentle", "shoulder_pulley"],
  "avoid": ["aggressive_stretching_into_pain", "overhead_pressing", "heavy_loading"]
}
```

### B9. Shoulder — Impingement Syndrome
```json
{
  "recommended": ["scapular_exercises", "rotator_cuff_strengthening", "thoracic_extension", "pec_stretch", "face_pulls"],
  "avoid": ["upright_rows", "lateral_raises_above_90_with_internal_rotation", "behind_neck"]
}
```

### B10. Shoulder — Total Replacement
```json
{
  "recommended": ["pendulum_swing", "passive_ROM_per_protocol", "isometrics_progressive", "scapular_exercises"],
  "avoid": ["heavy_lifting_permanently", "overhead_sports_may_be_limited", "push_ups_may_be_limited"]
}
```

### B11. Hip — Total Replacement (Posterior Approach)
```json
{
  "recommended": ["ankle_pumps", "quad_sets", "glute_sets", "walking_progressive", "hip_abduction_gentle", "stationary_bike_high_seat"],
  "avoid": ["hip_flexion_past_90", "internal_rotation", "adduction_past_midline", "crossing_legs", "low_chairs"],
  "notes": "Posterior precautions for 6-12 weeks. No combined flexion + adduction + internal rotation."
}
```

### B12. Hip — Total Replacement (Anterior Approach)
```json
{
  "recommended": ["walking_early", "quad_strengthening", "glute_activation", "hip_abduction"],
  "avoid": ["hip_extension_past_neutral_early", "external_rotation_extreme_early"],
  "notes": "Fewer precautions than posterior approach. Faster return to function typically."
}
```

### B13. Hip — Labral Tear
```json
{
  "recommended": ["glute_strengthening", "hip_abduction", "core_stabilization", "quadruped_hip_circles"],
  "avoid": ["deep_squat_past_90", "hip_flexion_with_adduction_and_IR", "pigeon_pose"]
}
```

### B14. Hip — Bursitis (Trochanteric)
```json
{
  "recommended": ["gentle_glute_activation", "hip_flexor_stretch", "IT_band_foam_roll"],
  "avoid": ["side_lying_on_affected_side", "excessive_hip_abduction", "deep_lateral_lunges"]
}
```

### B15. Hip — Osteoarthritis
```json
{
  "recommended": ["water_exercise", "stationary_bike", "gentle_ROM", "glute_strengthening", "walking_flat"],
  "avoid": ["high_impact", "deep_squats_if_painful", "excessive_stair_climbing"]
}
```

### B16. Ankle — Chronic Instability
```json
{
  "recommended": ["ankle_alphabet", "single_leg_balance_progression", "peroneal_strengthening", "proprioception_training"],
  "avoid": ["uneven_surfaces_without_progression", "plyometrics_early"]
}
```

### B17. Ankle — Post-Fracture
```json
{
  "recommended": ["ankle_pumps", "ankle_alphabet", "gentle_dorsiflexion_mobilization", "calf_raises_progressive", "balance_training"],
  "avoid": ["impact_before_bone_healing_confirmed", "aggressive_ROM_early"]
}
```

### B18. Elbow — Tennis Elbow (Lateral Epicondylitis)
```json
{
  "recommended": ["eccentric_wrist_extension", "wrist_extensor_stretch", "grip_strengthening_graduated"],
  "avoid": ["heavy_gripping", "reverse_curls_heavy", "heavy_deadlifts_without_straps"]
}
```

### B19. Elbow — Golfer's Elbow (Medial Epicondylitis)
```json
{
  "recommended": ["eccentric_wrist_flexion", "wrist_flexor_stretch", "grip_strengthening"],
  "avoid": ["heavy_pulling_without_straps", "heavy_curls"]
}
```

### B20. Wrist — Carpal Tunnel Syndrome
```json
{
  "recommended": ["median_nerve_glide", "wrist_stretches_both_directions", "tendon_glides"],
  "avoid": ["prolonged_wrist_flexion_under_load", "heavy_front_rack_position"]
}
```

### B21. Wrist — De Quervain's Tenosynovitis
```json
{
  "recommended": ["thumb_stretches", "wrist_stretches", "eccentric_thumb_exercises"],
  "avoid": ["gripping_with_ulnar_deviation", "heavy_radial_deviation"]
}
```

### B22. Foot — Plantar Fasciitis
```json
{
  "recommended": ["calf_eccentric_drops", "plantar_fascia_ball_roll", "towel_scrunches", "toe_yoga", "calf_stretch"],
  "avoid": ["barefoot_running_initially", "plyometrics_on_hard_surfaces", "prolonged_standing"]
}
```

### B23. Foot — Achilles Tendinopathy
```json
{
  "recommended": ["alfredson_eccentric_protocol", "calf_eccentric_drops", "calf_stretch_gentle"],
  "avoid": ["hill_sprints", "plyometrics", "explosive_calf_work"]
}
```

### B24. Jaw — TMJ Disorder
```json
{
  "recommended": ["jaw_opening_controlled", "lateral_jaw_slides", "resisted_jaw_opening", "neck_retraction"],
  "avoid": ["exercises_causing_clenching — cue relaxed jaw during ALL exercises"]
}
```

### B25. Hand — Trigger Finger / Dupuytren's
```json
{
  "recommended": ["finger_tendon_glides", "gentle_finger_extension_stretches", "grip_strengthening_light"],
  "avoid": ["heavy_gripping_if_painful", "vibrating_tools"]
}
```

---

## CATEGORY C: SYSTEMIC / AUTOIMMUNE CONDITIONS (15 conditions)

### C1. Rheumatoid Arthritis
```json
{
  "recommended": ["gentle_ROM_daily", "water_exercise", "resistance_training_moderate", "walking", "flexibility"],
  "avoid": ["high_impact_during_flares", "exercising_acutely_inflamed_joints"],
  "notes": "Exercise between flares. Protect inflamed joints during flares (gentle ROM only). Resistance training shown to NOT worsen joint damage."
}
```

### C2. Psoriatic Arthritis
```json
{
  "recommended": ["same_as_RA", "swimming", "cycling", "yoga_modified"],
  "avoid": ["same_as_RA"],
  "notes": "Similar to RA management. May also have skin considerations for equipment contact."
}
```

### C3. Gout
```json
{
  "recommended": ["walking_between_flares", "gentle_ROM", "water_exercise", "resistance_training"],
  "avoid": ["exercise_during_acute_flare", "impact_on_affected_joint_during_flare"],
  "notes": "NO exercise during acute flare. Between flares, exercise normally. Stay hydrated."
}
```

### C4. Osteoporosis / Osteopenia
```json
{
  "recommended": ["weight_bearing_exercises", "resistance_training", "balance_training", "walking", "tai_chi"],
  "avoid": ["spinal_flexion_under_load", "explosive_twisting", "high_impact_if_severe"],
  "notes": "Load bones progressively. Falls prevention through balance training is critical. Spinal flexion increases vertebral fracture risk."
}
```

### C5. Lupus (SLE)
```json
{
  "recommended": ["gentle_aerobic_exercise", "water_exercise", "flexibility", "resistance_training_light"],
  "avoid": ["exercise_during_flares", "excessive_sun_exposure_outdoors", "overexertion"],
  "notes": "Fatigue management critical. Short bouts. Avoid photosensitivity triggers if exercising outdoors."
}
```

### C6. Fibromyalgia
```json
{
  "recommended": ["water_exercise_warm", "gentle_walking", "restorative_yoga", "tai_chi", "progressive_muscle_relaxation", "light_resistance_training"],
  "avoid": ["high_intensity_initially", "heavy_eccentrics", "any_exercise_causing_post_exertional_malaise"],
  "notes": "START EXTREMELY LOW. 5 min sessions. Build 10% per week max. Warm water is gold standard. Central sensitization — pain ≠ tissue damage."
}
```

### C7. Chronic Fatigue Syndrome (ME/CFS)
```json
{
  "recommended": ["pacing_based_gentle_movement", "gentle_stretching", "very_short_walks", "breathing_exercises"],
  "avoid": ["graded_exercise_therapy_if_causes_PEM", "pushing_through_fatigue", "heart_rate_above_anaerobic_threshold"],
  "notes": "CRITICAL: Post-exertional malaise (PEM) is the defining feature. Exercise must stay BELOW energy envelope. Heart rate monitoring may help. This is NOT deconditioning — do not push."
}
```

### C8. Ehlers-Danlos Syndrome (Hypermobility Type)
```json
{
  "recommended": ["isometric_exercises", "controlled_ROM_strengthening", "proprioception_training", "water_exercise", "pilates_modified"],
  "avoid": ["end_range_stretching", "plyometrics", "hypermobile_positions", "high_impact"],
  "notes": "Strengthen, don't stretch. Joints are already too mobile. Focus on stability and proprioception. Closed-chain preferred."
}
```

### C9. Polymyalgia Rheumatica
```json
{
  "recommended": ["gentle_ROM", "walking", "water_exercise", "gentle_resistance"],
  "avoid": ["high_intensity_during_active_disease", "exercises_causing_significant_pain"],
  "notes": "Often on corticosteroids — bone density concerns. Include weight-bearing for osteoporosis prevention."
}
```

### C10. Ankylosing Spondylitis — see A14 above

### C11. Sjögren's Syndrome
```json
{
  "recommended": ["regular_moderate_exercise", "water_exercise", "flexibility"],
  "avoid": ["overexertion_leading_to_extreme_fatigue"],
  "notes": "Stay hydrated. Joint pain similar to RA. Fatigue management."
}
```

### C12. Myasthenia Gravis
```json
{
  "recommended": ["gentle_resistance_below_fatigue", "walking_with_rest_breaks", "breathing_exercises"],
  "avoid": ["exercise_to_exhaustion", "excessive_heat_exposure"],
  "notes": "Muscle fatigue worsens with use. Short bouts with rest. Avoid overheating."
}
```

### C13. Polymyositis / Dermatomyositis
```json
{
  "recommended": ["gentle_ROM_during_active_disease", "progressive_resistance_during_remission", "water_exercise"],
  "avoid": ["heavy_resistance_during_active_inflammation"],
  "notes": "Inflammatory muscle disease. Exercise during remission builds back lost strength. During active disease: gentle ROM only."
}
```

### C14. Raynaud's Disease
```json
{
  "recommended": ["regular_aerobic_exercise", "indoor_exercise_in_cold_weather", "warm_up_thoroughly"],
  "avoid": ["cold_water_exercise", "outdoor_exercise_in_cold_without_protection"],
  "notes": "Exercise improves circulation. Avoid cold triggers. Warm hands before gripping."
}
```

### C15. Complex Regional Pain Syndrome (CRPS)
```json
{
  "recommended": ["graded_motor_imagery", "mirror_therapy", "gentle_desensitization", "graded_exposure_to_movement"],
  "avoid": ["forcing_movement_through_pain", "aggressive_PT", "immobilization_prolonged"],
  "notes": "Specialized pain condition. Movement is essential but must be graded extremely carefully. Pain science education critical."
}
```

---

## CATEGORY D: NEUROLOGICAL CONDITIONS (12 conditions)

### D1. Parkinson's Disease
```json
{
  "recommended": ["big_step_walking", "boxing_drills", "dual_task_training", "balance_training", "resistance_training", "dancing", "tai_chi"],
  "notes": "Amplitude-based training (LSVT BIG). Boxing excellent. Exercise may slow progression. Falls prevention critical."
}
```

### D2. Multiple Sclerosis
```json
{
  "recommended": ["water_exercise", "resistance_bands", "seated_exercises", "balance_training", "yoga_modified", "walking_with_cooling"],
  "avoid": ["overheating — Uhthoff's phenomenon", "exhaustive exercise"],
  "notes": "Cool environments. Short bouts. Fatigue management. Benefits: strength, balance, spasticity reduction."
}
```

### D3. Stroke (Post-CVA)
```json
{
  "recommended": ["affected_side_passive_ROM", "bilateral_training", "sit_to_stand", "walking_assisted", "task_specific_training"],
  "notes": "Neuroplasticity — repetition is key. Include affected side in every session. Constraint-induced principles."
}
```

### D4. Spinal Cord Injury (Incomplete)
```json
{
  "recommended": ["all_seated_upper_body", "respiratory_training", "ROM_below_injury_level", "standing_frame_if_available"],
  "notes": "Depends entirely on level and completeness. Autonomic dysreflexia risk above T6. Specialist guidance essential."
}
```

### D5. Peripheral Neuropathy
```json
{
  "recommended": ["balance_training_safe_environment", "gentle_walking", "resistance_training", "seated_exercises"],
  "avoid": ["barefoot_exercise_if_sensation_impaired", "exercises_with_fall_risk_without_support"],
  "notes": "Falls prevention paramount. Supervised balance training. Check feet daily."
}
```

### D6. Traumatic Brain Injury (Post-Acute)
```json
{
  "recommended": ["sub_symptom_threshold_aerobic_exercise", "balance_training", "gentle_resistance"],
  "avoid": ["contact_sports", "exercises_that_trigger_symptoms"],
  "notes": "Exercise below symptom exacerbation threshold. Gradually increase. Monitor for headache, dizziness, cognitive fog."
}
```

### D7. Cerebral Palsy
```json
{
  "recommended": ["resistance_training", "stretching_for_spasticity", "aquatic_therapy", "hippotherapy", "adapted_sport"],
  "notes": "Highly individualized. Strengthening does NOT increase spasticity (old myth disproven). Include flexibility for tight muscles."
}
```

### D8. Guillain-Barré Syndrome (Recovery)
```json
{
  "recommended": ["gentle_ROM", "progressive_resistance_as_reinnervation_occurs", "aerobic_conditioning", "fatigue_management"],
  "avoid": ["overexertion — can worsen fatigue"],
  "notes": "Recovery can take months-years. Progressive but must respect fatigue limits."
}
```

### D9. Essential Tremor
```json
{
  "recommended": ["resistance_training", "yoga", "tai_chi", "coordination_exercises"],
  "notes": "Exercise doesn't worsen tremor. Weight training may actually reduce tremor temporarily."
}
```

### D10. Vertigo / Vestibular Dysfunction
```json
{
  "recommended": ["vestibular_rehabilitation_exercises", "gaze_stabilization", "balance_training_progressive", "walking"],
  "avoid": ["exercises_requiring_rapid_head_movement_initially", "exercises_on_unstable_surfaces_without_support"],
  "notes": "Epley maneuver for BPPV. Gaze stabilization exercises for vestibular hypofunction."
}
```

### D11. Epilepsy
```json
{
  "recommended": ["regular_aerobic_exercise", "resistance_training", "yoga", "swimming_with_supervision"],
  "avoid": ["scuba_diving", "climbing_without_belay", "solo_swimming"],
  "notes": "Exercise generally REDUCES seizure frequency. Safety precautions for activities where seizure could be dangerous."
}
```

### D12. Migraine
```json
{
  "recommended": ["regular_moderate_aerobic_exercise", "yoga", "neck_strengthening", "relaxation_training"],
  "avoid": ["high_intensity_if_exercise_triggered", "dehydration"],
  "notes": "Regular aerobic exercise shown to reduce migraine frequency. Avoid triggers (dehydration, overheating, skipping meals)."
}
```

---

## CATEGORY E: CARDIOPULMONARY CONDITIONS (8 conditions)

### E1. COPD
```json
{
  "recommended": ["pursed_lip_breathing", "diaphragmatic_breathing", "upper_body_ergometer", "walking_with_rest", "resistance_training_light"],
  "avoid": ["breath_holding", "valsalva_maneuver"],
  "notes": "Integrate breathing with every exercise. Interval training may be better tolerated."
}
```

### E2. Heart Failure (Stable/Compensated)
```json
{
  "recommended": ["walking_progressive", "light_resistance_training", "breathing_exercises"],
  "avoid": ["heavy_valsalva", "isometric_exercises_prolonged", "exercising_during_decompensation"],
  "notes": "Medical clearance required. Monitor symptoms. Exercise improves function and quality of life."
}
```

### E3. Post-Cardiac Event (MI, CABG, Stent)
```json
{
  "recommended": ["cardiac_rehab_protocol", "walking_progressive", "light_resistance_after_clearance"],
  "avoid": ["heavy_lifting_early", "exercise_above_prescribed_HR"],
  "notes": "Cardiac rehab Phase I-IV protocol. HR monitoring essential. Medical clearance before independent exercise."
}
```

### E4. Hypertension
```json
{
  "recommended": ["aerobic_exercise_regular", "resistance_training_moderate", "walking", "swimming"],
  "avoid": ["heavy_valsalva", "very_heavy_isometrics"],
  "notes": "Exercise lowers BP. Avoid breath-holding. Monitor BP before exercise if uncontrolled."
}
```

### E5. Asthma (Exercise-Induced)
```json
{
  "recommended": ["swimming_warm_humid_air", "walking", "cycling", "extended_warm_up"],
  "avoid": ["cold_dry_air_exercise_without_management", "high_intensity_without_inhaler_access"],
  "notes": "Longer warm-up reduces EIB. Pre-exercise inhaler per physician. Swimming often best tolerated."
}
```

### E6. Peripheral Artery Disease
```json
{
  "recommended": ["walking_to_claudication_then_rest_then_repeat", "cycling", "resistance_training"],
  "notes": "Claudication-based walking program is gold standard. Walk until moderate pain, rest, repeat."
}
```

### E7. Pulmonary Fibrosis
```json
{
  "recommended": ["gentle_aerobic", "breathing_exercises", "resistance_training_light"],
  "avoid": ["exercise_causing_severe_desaturation"],
  "notes": "Supplemental O2 may be needed during exercise. Monitor SpO2."
}
```

### E8. Lymphedema
```json
{
  "recommended": ["gentle_resistance_training", "swimming", "walking", "compression_during_exercise"],
  "avoid": ["heavy_resistance_without_compression", "overheating_affected_limb"],
  "notes": "Exercise with compression garments. Resistance training does NOT worsen lymphedema (evidence-based)."
}
```

---

## CATEGORY F: METABOLIC / ENDOCRINE (5 conditions)

### F1. Type 2 Diabetes
```json
{
  "recommended": ["post_meal_walking", "resistance_training", "aerobic_exercise_150min_week", "HIIT_if_cleared"],
  "notes": "Exercise improves insulin sensitivity. Monitor blood glucose before/after. Carry fast-acting carbs."
}
```

### F2. Type 1 Diabetes
```json
{
  "recommended": ["regular_exercise_with_glucose_monitoring", "resistance_training", "aerobic"],
  "notes": "More complex glucose management. Adjust insulin and carbs based on exercise type/duration/intensity."
}
```

### F3. Thyroid Disorders (Hypo/Hyper)
```json
{
  "recommended": ["regular_moderate_exercise", "resistance_training", "walking"],
  "notes": "Hypothyroid: exercise helps fatigue and weight. Hyperthyroid: avoid overexertion, monitor HR."
}
```

### F4. Obesity
```json
{
  "recommended": ["walking_progressive", "water_exercise", "resistance_training", "seated_exercises_if_needed", "cycling"],
  "avoid": ["high_impact_initially", "exercises_requiring_floor_work_if_difficult"],
  "notes": "Start with what's comfortable. Aquatic exercise excellent. Progressive overload. Non-weight-bearing options available."
}
```

### F5. Metabolic Syndrome
```json
{
  "recommended": ["circuit_training", "walking", "resistance_training", "HIIT_if_cleared"],
  "notes": "Exercise addresses all components: BP, glucose, waist circumference, lipids."
}
```

---

## CATEGORY G: MENTAL HEALTH CONDITIONS (5 conditions)

### G1. Depression
```json
{
  "recommended": ["aerobic_exercise_regular", "resistance_training", "yoga", "group_exercise", "outdoor_walking"],
  "notes": "Exercise is as effective as antidepressants for mild-moderate depression (per NICE guidelines). 150 min/week aerobic. Social component helps."
}
```

### G2. Anxiety
```json
{
  "recommended": ["aerobic_exercise", "yoga", "tai_chi", "breathing_exercises", "progressive_muscle_relaxation"],
  "notes": "Exercise reduces state and trait anxiety. Breathing exercises for acute anxiety. Regular exercise for prevention."
}
```

### G3. PTSD
```json
{
  "recommended": ["yoga_trauma_informed", "martial_arts_structured", "aerobic_exercise", "mindfulness_movement"],
  "avoid": ["exercises_that_trigger_flashbacks — individualized"],
  "notes": "Trauma-informed approach. Body awareness exercises. Sense of control and empowerment through training."
}
```

### G4. ADHD
```json
{
  "recommended": ["aerobic_exercise_before_cognitive_tasks", "martial_arts", "complex_movement_patterns", "resistance_training"],
  "notes": "Exercise improves executive function, attention, and mood in ADHD. Morning exercise before work/school is optimal. Complex movements engage focus."
}
```

### G5. Insomnia
```json
{
  "recommended": ["moderate_aerobic_exercise", "yoga", "resistance_training"],
  "avoid": ["high_intensity_exercise_within_2hrs_of_bedtime"],
  "notes": "Regular exercise improves sleep quality. Morning/afternoon exercise preferred. Avoid intense evening workouts."
}
```

---

## CATEGORY H: PREGNANCY & POSTPARTUM (5 conditions)

### H1-H5 — see previous file (pregnancy 1st tri, 2nd/3rd tri, postpartum, diastasis recti, pelvic floor dysfunction)

Add:
### H6. Diastasis Recti
```json
{
  "recommended": ["diaphragmatic_breathing", "pelvic_floor_activation", "modified_plank", "heel_slides", "dead_bug_modified"],
  "avoid": ["crunches", "sit_ups", "front_loaded_planks_if_coning", "heavy_lifting_with_bearing_down"],
  "notes": "Check for coning during exercises. If midline bulges, modify or regress. PF + TVA co-activation is the foundation."
}
```

---

## CATEGORY I: AGE-RELATED (3 conditions)

### I1. Sarcopenia (Age-Related Muscle Loss)
```json
{
  "recommended": ["resistance_training_progressive", "protein_timing", "balance_training", "power_training_if_tolerated"],
  "notes": "Resistance training is the #1 intervention. Progressive overload essential. Protein 1.2-1.6g/kg/day."
}
```

### I2. Osteoporosis — see C4

### I3. Falls Risk / Balance Disorder
```json
{
  "recommended": ["balance_training_progressive", "tai_chi", "resistance_training", "walking", "hip_strengthening"],
  "notes": "Tai chi reduces falls 20-40%. Balance training 3x/week. Strengthen hips and ankles."
}
```

---

## CATEGORY J: AMPUTATION / LIMB DIFFERENCE (2 conditions)

### J1. Lower Limb Amputation
```json
{
  "recommended": ["upper_body_resistance", "core_training", "prosthetic_gait_training", "hip_strengthening_residual_limb", "balance_training"],
  "notes": "Prevent overuse of intact limb. Phantom pain may benefit from mirror therapy. Cardiovascular fitness important."
}
```

### J2. Upper Limb Amputation
```json
{
  "recommended": ["lower_body_full_training", "core_training", "unilateral_upper_body_exercises", "aerobic_exercise"],
  "notes": "Adapt exercises. Unilateral training. Machine-based may be easier than free weights."
}
```

---

## GRAND TOTAL

| Item | Count |
|---|---|
| Exercises | 300 |
| Condition Protocols | 100 |
| Compensation Corrections | 7 |
| Progression Chains | 10 families |
| Categories | 40 exercise categories + 10 condition categories |

---

## IMPORTANT CLINICAL NOTES FOR THE APP

1. **The app is NOT a replacement for medical care.** Every condition protocol includes a `refer_out_if` trigger.
2. **Conditions can coexist.** The app must handle multiple simultaneous conditions and find the INTERSECTION of safe exercises.
3. **Severity matters.** A condition at severity 1 has different restrictions than severity 5.
4. **Flare management.** Most chronic conditions have flares. The app needs a "I'm having a flare today" option that auto-reduces to the safest exercise subset.
5. **The user is the expert on their body.** If they say something hurts, BELIEVE THEM and adapt. Don't push through.
6. **Medications affect exercise.** Beta-blockers blunt HR response. Steroids affect bone density. Blood thinners increase bruising risk from foam rolling. The app should ask about key medications.
7. **"When in doubt, refer out"** — This is the NASM golden rule. If the app can't safely prescribe for a condition, direct to a qualified professional.
