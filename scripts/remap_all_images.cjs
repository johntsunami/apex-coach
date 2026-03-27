const fs = require('fs');
const exercises = require('../src/data/exercises.json');
const dirs = require('../src/data/tmp/exercise_image_dirs.json');
const BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
const dirSet = new Set(dirs);

// Comprehensive manual mapping — every exercise we can match
const MANUAL = {
  // Foam rolling
  'fr_calves': 'Calf_Press_On_The_Leg_Press_Machine',
  'fr_it_band': 'Iliotibial_Tract-SMR',
  'fr_thoracic': 'Upper_Back_Stretch',
  'fr_upper_back': 'Upper_Back_Stretch',
  'fr_quads': 'Quadriceps-SMR',
  'fr_hamstrings': 'Hamstrings-SMR',
  'fr_piriformis': 'Piriformis-SMR',
  'fr_pecs': 'Chest_Stretch_on_Stability_Ball',
  'fr_tfl': 'Iliotibial_Tract-SMR',
  'fr_glutes': 'Seated_Glute',
  'fr_peroneals': 'Ankle_Circles',
  'fr_biceps_forearms': 'Wrist_Roller',
  'fr_feet': 'Ankle_Circles',

  // Core / stabilization
  'stab_side_plank': 'Push_Up_to_Side_Plank',
  'stab_bird_dog': 'Alternating_Deltoid_Raise',
  'stab_mcgill_curl_up': 'Crunches',
  'stab_ball_squat': 'Thigh_Adductor',

  // Balance
  'bal_single_leg_reach': 'Single_Leg_Push-off',
  'bal_bosu_squat': 'Barbell_Full_Squat',
  'bal_sl_eyes_closed': 'Single_Leg_Push-off',
  'bal_sl_bosu': 'Single_Leg_Push-off',
  'bal_tandem_walk': 'Walking_Lunge',

  // Strength - hinge
  'str_db_rdl': 'Romanian_Deadlift',
  'str_sl_glute_bridge': 'Single_Leg_Glute_Bridge',

  // Strength - push
  'str_wall_push_up': 'Push-Ups_-_Wall',

  // Strength - pull
  'str_chest_supported_row': 'Incline_Dumbbell_Row',
  'str_sa_db_row': 'One-Arm_Dumbbell_Row',

  // Strength - squat/lunge
  'str_bss_bw': 'Bulgarian_Split_Squat',
  'str_bss_loaded': 'Bulgarian_Split_Squat',

  // Isolation
  'iso_lateral_raise': 'Side_Lateral_Raise',

  // Rehab
  'rehab_quad_set': 'Leg_Extensions',
  'rehab_slr': 'Lying_Leg_Raises',
  'rehab_step_down_low': 'Barbell_Step_Ups',
  'rehab_step_down_high': 'Barbell_Step_Ups',
  'rehab_iso_ext_rotation': 'External_Rotation_with_Band',
  'rehab_prone_y': 'Dumbbell_Prone_Incline_Curl',
  'rehab_prone_t': 'Dumbbell_Prone_Incline_Curl',
  'rehab_prone_w': 'Dumbbell_Prone_Incline_Curl',
  'rehab_scap_wall_slides': 'Wall_Slide',
  'rehab_pigeon_pose': 'Pigeon_Stretch',
  'rehab_fire_hydrant': 'Fire_Hydrant',
  'rehab_lateral_band_walk': 'Monster_Walk',
  'rehab_ankle_alphabet': 'Ankle_Circles',
  'rehab_eccentric_calf_drop': 'Standing_Calf_Raises',
  'rehab_tib_ant_raise': 'Ankle_Circles',
  'rehab_sl_balance_unstable': 'Single_Leg_Push-off',
  'rehab_grip_strengthen': 'Wrist_Roller',
  'rehab_eccentric_decline_squat': 'Barbell_Full_Squat',
  'rehab_spanish_squat': 'Barbell_Full_Squat',
  'rehab_pendulum_swing': 'Dumbbell_Alternate_Side_Press',
  'rehab_serratus_punch': 'Pushups',
  'rehab_thoracic_ext_roller': 'Upper_Back_Stretch',
  'rehab_hooklying_march': 'Pelvic_Tilt_Into_Bridge',
  'rehab_pelvic_clock': 'Pelvic_Tilt_Into_Bridge',
  'rehab_tall_kneeling_balance': 'Kneeling_Hip_Flexor',

  // Corrective
  'corr_chin_tuck': 'Neck-SMR',
  'corr_prone_cobra': 'Superman',
  'corr_serratus_wall_slide': 'Wall_Slide',
  'corr_pec_stretch': 'Chest_Stretch_on_Stability_Ball',
  'corr_upper_trap_stretch': 'Upper_Back_Stretch',
  'corr_levator_stretch': 'Neck-SMR',
  'corr_band_pull_apart_hr': 'Band_Pull_Apart',
  'corr_wall_angel': 'Wall_Slide',
  'corr_standing_hip_flexor_str': 'Kneeling_Hip_Flexor',
  'corr_kneeling_hip_flexor_str': 'Kneeling_Hip_Flexor',
  'corr_supine_pelvic_tilt': 'Pelvic_Tilt_Into_Bridge',
  'corr_glute_bridge_march': 'Barbell_Glute_Bridge',
  'corr_clamshell': 'Clam',
  'corr_side_lying_hip_abd': 'Side_Lying_Clam',
  'corr_monster_walk': 'Monster_Walk',
  'corr_cook_hip_lift': 'Barbell_Glute_Bridge',

  // Nerve glides
  'nerve_sciatic_glide': 'Lying_Leg_Raises',
  'nerve_femoral_glide': 'Lying_Quad_Stretch',
  'nerve_ulnar_glide': 'Wrist_Roller',
  'nerve_median_glide': 'Wrist_Roller',

  // Williams flexion
  'williams_pelvic_tilt': 'Pelvic_Tilt_Into_Bridge',
  'williams_single_knee_chest': 'Knee_Tuck_Jump',
  'williams_double_knee_chest': 'Knee_Tuck_Jump',
  'williams_partial_curl': 'Crunches',
  'williams_seated_flexion': 'Seated_Floor_Hamstring_Stretch',

  // Functional
  'func_squat_to_stand': 'Barbell_Full_Squat',
  'func_inchworm': 'Inchworm',
  'func_bear_crawl': 'Bear_Crawl_Shoulder_Tap',
  'func_turkish_getup': 'Turkish_Get-Up_(Kettlebell)',

  // Stretches
  'stretch_hamstring': 'Standing_Hamstring_Stretch',
  'stretch_hip_flexor': 'Kneeling_Hip_Flexor',
  'stretch_child_pose': 'Childs_Pose',
  'stretch_pec_doorway': 'Chest_Stretch_on_Stability_Ball',
  'stretch_upper_trap': 'Upper_Back_Stretch',
  'stretch_piriformis': 'Seated_Piriformis_Stretch',
  'stretch_quad': 'Lying_Quad_Stretch',
  'stretch_cross_body_shoulder': 'Cross-Body_Crunch',
  'stretch_adductor': 'Butterfly_Stretch',
  'stretch_standing_calf': 'Standing_Gastrocnemius_Calf_Stretch',
  'stretch_lat': 'Latissimus_Dorsi-SMR',
  'stretch_glute': 'Seated_Glute',
  'stretch_chest_behind_back': 'Chest_Stretch_on_Stability_Ball',
  'stretch_anterior_shoulder': 'Chest_Stretch_on_Stability_Ball',
  'stretch_wrist_flexor': 'Wrist_Roller',
  'stretch_neck_side_bend': 'Neck-SMR',

  // Breathing
  'breath_diaphragmatic': 'Stomach_Vacuum',
  'breath_crocodile': 'Stomach_Vacuum',

  // Seated/chair
  'seated_chest_press': 'Pushups',
  'seated_shoulder_press': 'Seated_Dumbbell_Press',
  'seated_lateral_raise': 'Seated_Side_Lateral_Raise',
  'seated_row': 'Seated_Cable_Rows',
  'seated_bicep_curl': 'Seated_Dumbbell_Curl',
  'seated_tricep_ext': 'Dumbbell_Tricep_Extension_-_Seated',
  'seated_band_pull_apart': 'Band_Pull_Apart',
  'seated_trunk_rotation': 'Seated_Barbell_Twist',
  'seated_punches': 'Jab_Cross',
  'seated_chair_dips': 'Bench_Dips',
  'seated_crunch': 'Crunches',
  'seated_oblique_twist': 'Seated_Barbell_Twist',
  'seated_leg_ext': 'Leg_Extensions',
  'seated_captains_lift': 'Bench_Dips',

  // Bed exercises
  'bed_pelvic_tilt': 'Pelvic_Tilt_Into_Bridge',
  'bed_glute_set': 'Barbell_Glute_Bridge',
  'bed_heel_slides': 'Lying_Leg_Raises',
  'bed_shoulder_flexion': 'Lying_Rear_Delt_Raise',

  // Aquatic
  'aqua_squat': 'Barbell_Full_Squat',

  // Kettlebell
  'kb_deadlift': 'Kettlebell_Sumo_Deadlift_High_Pull',
  'kb_halo': 'Kettlebell_Arnold_Press',
  'kb_turkish_getup': 'Turkish_Get-Up_(Kettlebell)',
  'kb_sa_press': 'Kettlebell_One-Legged_Deadlift',
  'kb_row': 'Alternating_Kettlebell_Row',

  // TRX
  'trx_squat': 'Bodyweight_Squat',
  'trx_lunge': 'Bulgarian_Split_Squat',
  'trx_pike': 'Inchworm',
  'trx_y_raise': 'Suspended_Row',

  // Band
  'band_overhead_press': 'Standing_Dumbbell_Press',
  'band_squat': 'Bodyweight_Squat',
  'band_deadlift': 'Barbell_Deadlift',
  'band_chest_press': 'Pushups',
  'band_hamstring_curl': 'Seated_Leg_Curl',
  'band_hip_thrust': 'Barbell_Hip_Thrust',

  // Isometric
  'iso_wall_push': 'Pushups',
  'iso_squat_hold': 'Bodyweight_Squat',
  'iso_row_hold': 'Seated_Cable_Rows',
  'iso_plank_variations': 'Plank',
  'iso_shoulder_abd': 'Side_Lateral_Raise',
  'iso_hip_adduction': 'Thigh_Adductor',

  // Dynamic warmup
  'dyn_leg_swings': 'Leg_Swings_Front',
  'dyn_walking_lunges': 'Walking_Lunge',
  'dyn_high_knees': 'High_Knee_Jog',
  'dyn_butt_kicks': 'Butt_Kicks',
  'dyn_lateral_shuffle': 'Side_To_Side_Chins',
  'dyn_carioca': 'Side_To_Side_Chins',
  'dyn_toy_soldiers': 'High_Knee_Jog',

  // Agility
  'agil_ladder_quick_feet': 'High_Knee_Jog',
  'agil_cone_shuffle': 'Side_To_Side_Chins',
  'agil_box_drill': 'Box_Jump_(Multiple_Response)',
  'agil_t_drill': 'Side_To_Side_Chins',
  'agil_sl_hop_stick': 'Box_Jump_(Multiple_Response)',
  'agil_reaction_ball': 'High_Knee_Jog',

  // Grip
  'grip_plate_pinch': 'Wrist_Roller',
  'grip_dead_hang': 'Pullups',
  'grip_wrist_roller': 'Wrist_Roller',
  'grip_rice_bucket': 'Wrist_Roller',

  // Conditions PT
  'cond_big_step_walk': 'Walking_Lunge',
  'cond_dual_task_walk': 'Walking_Lunge',
  'cond_boxing_drills': 'Jab_Cross',
  'cond_sit_to_stand': 'Bodyweight_Squat',
  'cond_modified_plank': 'Plank',
  'cond_iso_quad_set': 'Leg_Extensions',
  'cond_circuit_training': 'Barbell_Full_Squat',

  // Outdoor
  'outdoor_bench_stepup': 'Barbell_Step_Ups',
  'outdoor_bench_pushup': 'Incline_Push-Up',
  'outdoor_bench_dips': 'Bench_Dips',
  'outdoor_trail_walking': 'Walking_Lunge',
  'outdoor_hill_sprints': 'High_Knee_Jog',

  // Sport
  'sport_power_clean': 'Power_Clean',
  'sport_med_ball_slam': 'Dumbbell_Clean',
  'sport_med_ball_rot_throw': 'Seated_Barbell_Twist',
  'sport_sled_push': 'Prowler_Sprint',
  'sport_sled_pull': 'Prowler_Sprint',

  // McKenzie - back (use similar poses)
  'mck_back_prone_lying': 'Superman',
  'mck_back_prone_elbows': 'Superman',
  'mck_back_press_up': 'Pushups',
  'mck_back_ext_standing': 'Standing_Hamstring_Stretch',
  'mck_back_lying_flexion': 'Knee_Tuck_Jump',
  'mck_back_sitting_flexion': 'Seated_Floor_Hamstring_Stretch',
  'mck_back_standing_flexion': 'Standing_Hamstring_Stretch',
  'mck_prone_press_exhale': 'Pushups',

  // McKenzie - neck
  'mck_neck_retraction': 'Neck-SMR',
  'mck_neck_extension': 'Neck-SMR',
  'mck_neck_ret_ext': 'Neck-SMR',
  'mck_neck_side_bend': 'Neck-SMR',
  'mck_neck_rotation': 'Neck-SMR',
  'mck_neck_flexion': 'Neck-SMR',
  'mck_neck_ret_ext_lying': 'Neck-SMR',

  // McKenzie - shoulder
  'mck_sh_pendulum': 'Dumbbell_Alternate_Side_Press',
  'mck_sh_wall_walk': 'Wall_Slide',
  'mck_sh_abduction': 'Side_Lateral_Raise',
  'mck_sh_assisted_flexion': 'Standing_Dumbbell_Press',
  'mck_sh_er_stretch': 'External_Rotation_with_Band',
  'mck_sh_ir_stretch': 'External_Rotation_with_Band',
  'mck_sh_isometric': 'Side_Lateral_Raise',
  'mck_sh_active_rom': 'Standing_Dumbbell_Press',

  // McKenzie - knee
  'mck_kn_seated_ext': 'Leg_Extensions',
  'mck_kn_prone_flex': 'Seated_Leg_Curl',
  'mck_kn_standing_ext': 'Barbell_Step_Ups',
  'mck_kn_tke': 'Leg_Extensions',
  'mck_kn_flex_load': 'Bodyweight_Squat',
  'mck_kn_squat_prog': 'Barbell_Full_Squat',

  // McKenzie - hip
  'mck_hip_flexion': 'Knee_Tuck_Jump',
  'mck_hip_rotation': 'Lying_Crossover',
  'mck_hip_ext_prone': 'Superman',
  'mck_hip_flexor_str': 'Kneeling_Hip_Flexor',
  'mck_hip_abd': 'Side_Lying_Clam',
  'mck_hip_add_str': 'Butterfly_Stretch',
  'mck_hip_functional': 'Barbell_Full_Squat',

  // McKenzie - ankle
  'mck_ank_dorsi': 'Ankle_Circles',
  'mck_ank_plantar': 'Standing_Gastrocnemius_Calf_Stretch',
  'mck_ank_inversion': 'Ankle_Circles',
  'mck_ank_toe': 'Ankle_Circles',
  'mck_ank_eccentric': 'Standing_Calf_Raises',
  'mck_ank_balance': 'Single_Leg_Push-off',
  'mck_ank_functional': 'Walking_Lunge',

  // Yoga
  'yoga_child_pose': 'Childs_Pose',
  'yoga_cat_cow': 'Cat_Stretch',
  'yoga_supine_twist': 'Lying_Crossover',
  'yoga_legs_wall': 'Lying_Leg_Raises',
  'yoga_seated_fold': 'Seated_Floor_Hamstring_Stretch',
  'yoga_bridge': 'Barbell_Glute_Bridge',
  'yoga_reclined_butterfly': 'Butterfly_Stretch',
  'yoga_knees_chest': 'Knee_Tuck_Jump',
  'yoga_thread_needle': 'Lying_Crossover',
  'yoga_down_dog': 'Downward_Facing_Dog',
  'yoga_warrior1': 'Walking_Lunge',
  'yoga_warrior2': 'Walking_Lunge',
  'yoga_triangle': 'IT_Band_and_Glute_Stretch',
  'yoga_pigeon_mod': 'Pigeon_Stretch',
  'yoga_low_lunge': 'Kneeling_Hip_Flexor',
  'yoga_cobra': 'Superman',
  'yoga_chair': 'Bodyweight_Squat',
  'yoga_crow': 'Pushups',
  'yoga_wheel': 'Superman',
  'yoga_dancer': 'Standing_Hamstring_Stretch',
  'yoga_side_plank': 'Push_Up_to_Side_Plank',
};

// Apply mappings
let mapped = 0, alreadyHad = 0, noMatch = 0;
const updated = exercises.map(e => {
  if (e.imageUrl) { alreadyHad++; return e; }
  const folder = MANUAL[e.id];
  if (folder && dirSet.has(folder)) {
    mapped++;
    return { ...e, imageUrl: BASE + folder + '/0.jpg', imageUrl2: BASE + folder + '/1.jpg' };
  }
  noMatch++;
  return e;
});

const total = updated.filter(e => e.imageUrl).length;
console.log('Already had images:', alreadyHad);
console.log('Newly mapped:', mapped);
console.log('No match found:', noMatch);
console.log('TOTAL with images:', total, '/', updated.length);

// List what's still missing
const still = updated.filter(e => !e.imageUrl);
console.log('\nStill without images (' + still.length + '):');
still.forEach(e => console.log('  ' + e.id + ' — ' + e.name));

fs.writeFileSync('./src/data/exercises.json', JSON.stringify(updated, null, 2));
console.log('\nSaved to exercises.json');
