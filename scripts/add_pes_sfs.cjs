const fs = require("fs");
const d = JSON.parse(fs.readFileSync("./src/data/exercises.json","utf8"));

const newExercises = [
  { id:"pes_depth_jump", name:"Depth Jump", category:"main", type:"plyometric", movementPattern:"squat", bodyPart:"legs", primaryMuscles:["Quadriceps","Glutes","Calves"], secondaryMuscles:["Hamstrings"], jointsInvolved:["knee","ankle","hip"], equipmentRequired:["box"], locationCompatible:["gym"], phaseEligibility:[4,5], difficultyLevel:5, safetyTier:"yellow", emoji:"⬇️", tags:["pes","plyometric","power","reactive"] },
  { id:"pes_lateral_bound", name:"Lateral Bound", category:"main", type:"plyometric", movementPattern:"lunge", bodyPart:"legs", primaryMuscles:["Glutes","Quadriceps","Adductors"], secondaryMuscles:["Calves","Core"], jointsInvolved:["hip","knee","ankle"], equipmentRequired:["none"], locationCompatible:["gym","home","outdoor"], phaseEligibility:[3,4,5], difficultyLevel:4, safetyTier:"yellow", emoji:"↔️", tags:["pes","plyometric","lateral","power"] },
  { id:"pes_sprint_interval", name:"Sprint Intervals (20m)", category:"cardio", type:"cardio", movementPattern:"locomotion", bodyPart:"full_body", primaryMuscles:["Quadriceps","Hamstrings","Glutes","Calves"], secondaryMuscles:["Core","Hip Flexors"], jointsInvolved:["hip","knee","ankle"], equipmentRequired:["none"], locationCompatible:["gym","outdoor"], phaseEligibility:[3,4,5], difficultyLevel:4, safetyTier:"yellow", emoji:"🏃", tags:["pes","sprint","hiit","conditioning"] },
  { id:"pes_shuttle_run", name:"Shuttle Run (5-10-5)", category:"main", type:"agility", movementPattern:"locomotion", bodyPart:"full_body", primaryMuscles:["Quadriceps","Calves","Glutes"], secondaryMuscles:["Core","Hamstrings"], jointsInvolved:["hip","knee","ankle"], equipmentRequired:["none"], locationCompatible:["gym","outdoor"], phaseEligibility:[3,4,5], difficultyLevel:4, safetyTier:"yellow", emoji:"🔀", tags:["pes","agility","saq"] },
  { id:"pes_agil_in_out", name:"Ladder In-Out", category:"main", type:"agility", movementPattern:"locomotion", bodyPart:"legs", primaryMuscles:["Calves","Quadriceps"], secondaryMuscles:["Hip Flexors","Core"], jointsInvolved:["ankle","knee","hip"], equipmentRequired:["agility_ladder"], locationCompatible:["gym","outdoor"], phaseEligibility:[2,3,4,5], difficultyLevel:3, safetyTier:"green", emoji:"🪜", tags:["pes","saq","ladder","footwork"] },
  { id:"pes_agil_lateral", name:"Ladder Lateral Shuffle", category:"main", type:"agility", movementPattern:"locomotion", bodyPart:"legs", primaryMuscles:["Adductors","Quadriceps","Calves"], secondaryMuscles:["Glutes","Core"], jointsInvolved:["ankle","knee","hip"], equipmentRequired:["agility_ladder"], locationCompatible:["gym","outdoor"], phaseEligibility:[2,3,4,5], difficultyLevel:3, safetyTier:"green", emoji:"🪜", tags:["pes","saq","lateral"] },
  { id:"pes_agil_icky", name:"Ladder Icky Shuffle", category:"main", type:"agility", movementPattern:"locomotion", bodyPart:"legs", primaryMuscles:["Calves","Quadriceps","Hip Flexors"], secondaryMuscles:["Core","Adductors"], jointsInvolved:["ankle","knee","hip"], equipmentRequired:["agility_ladder"], locationCompatible:["gym","outdoor"], phaseEligibility:[3,4,5], difficultyLevel:4, safetyTier:"green", emoji:"🪜", tags:["pes","saq","ladder"] },
  { id:"pes_agil_crossover", name:"Ladder Crossover", category:"main", type:"agility", movementPattern:"locomotion", bodyPart:"legs", primaryMuscles:["Adductors","Abductors","Calves"], secondaryMuscles:["Core","Hip Flexors"], jointsInvolved:["ankle","knee","hip"], equipmentRequired:["agility_ladder"], locationCompatible:["gym","outdoor"], phaseEligibility:[3,4,5], difficultyLevel:4, safetyTier:"green", emoji:"🪜", tags:["pes","saq","crossover"] },
  { id:"pes_cone_5_10_5", name:"Pro Agility (5-10-5)", category:"main", type:"agility", movementPattern:"locomotion", bodyPart:"full_body", primaryMuscles:["Quadriceps","Glutes","Calves"], secondaryMuscles:["Core","Hamstrings"], jointsInvolved:["hip","knee","ankle"], equipmentRequired:["none"], locationCompatible:["gym","outdoor"], phaseEligibility:[3,4,5], difficultyLevel:4, safetyTier:"yellow", emoji:"🔺", tags:["pes","saq","cone_drill"] },
  { id:"pes_cone_l_drill", name:"L-Drill (Cone)", category:"main", type:"agility", movementPattern:"locomotion", bodyPart:"full_body", primaryMuscles:["Quadriceps","Glutes","Calves"], secondaryMuscles:["Core","Hip Flexors"], jointsInvolved:["hip","knee","ankle"], equipmentRequired:["none"], locationCompatible:["gym","outdoor"], phaseEligibility:[3,4,5], difficultyLevel:4, safetyTier:"yellow", emoji:"🔺", tags:["pes","saq","cone_drill"] },
  { id:"pes_med_ball_overhead", name:"Medicine Ball Overhead Throw", category:"main", type:"plyometric", movementPattern:"push", bodyPart:"full_body", primaryMuscles:["Shoulders","Core","Triceps"], secondaryMuscles:["Lats","Chest"], jointsInvolved:["shoulder","elbow","hip"], equipmentRequired:["medicine_ball"], locationCompatible:["gym","outdoor"], phaseEligibility:[3,4,5], difficultyLevel:3, safetyTier:"yellow", emoji:"⬆️", tags:["pes","power","medicine_ball"] },
  { id:"pes_squat_jump", name:"Squat Jump", category:"main", type:"plyometric", movementPattern:"squat", bodyPart:"legs", primaryMuscles:["Quadriceps","Glutes","Calves"], secondaryMuscles:["Hamstrings","Core"], jointsInvolved:["hip","knee","ankle"], equipmentRequired:["none"], locationCompatible:["gym","home","outdoor"], phaseEligibility:[3,4,5], difficultyLevel:3, safetyTier:"yellow", emoji:"⬆️", tags:["pes","plyometric","power","squat"] },
];

// Add common fields
newExercises.forEach(e => {
  e.methodology = ["pes"];
  e.weekMinimum = 0;
  e.prerequisites = { minCompletedSessions: 8, requiredExercisesMastered: [], requiredCapabilities: [], minPhase: e.phaseEligibility[0], maxInjurySeverity: { lower_back: 3, knee: 2, shoulder: 3 }, painFreeROM: [], notes: "Requires Phase " + e.phaseEligibility[0] + " foundation" };
  e.progressionChain = { level: 3, regressTo: null, progressTo: null, unlockCriteria: "Phase " + e.phaseEligibility[0] + " + movement competency", chainFamily: "pes_" + e.movementPattern };
  e.contraindications = { injuries: [], conditions: [], movements_to_avoid: [], severity_gate: { lower_back: 3, knee: 2, shoulder: 3 } };
  e.substitutions = { home: null, outdoor: e.locationCompatible.includes("outdoor") ? e.id : null };
  e.phaseParams = {};
  e.phaseEligibility.forEach(p => {
    e.phaseParams[String(p)] = { sets: p <= 3 ? "2-3" : "3-5", reps: e.type === "plyometric" ? "5-8" : "3-5 rounds", tempo: "Explosive", rest: p <= 3 ? "60s" : "90s", intensity: "RPE " + (p <= 3 ? "7-8" : "8-9") };
  });
  e.steps = ["Set up in proper starting position", "Execute movement with maximum intent", "Land or decelerate with control", "Reset and repeat"];
  e.formCues = ["Drive through the ground with full force", "Maintain core bracing throughout", "Land softly with knees tracking toes", "Full hip extension on each rep"];
  e.commonMistakes = ["Insufficient warm-up before explosive work", "Landing with stiff knees", "Losing core stability on landing", "Too much volume too soon"];
  e.coreBracing = "HIGH — maintain neutral spine during all explosive movements.";
  e.breathing = { inhale: "2", hold: "0", exhale: "1", pattern: "Exhale on effort, inhale on reset" };
  e.injuryNotes = { lower_back: "Avoid if acute back pain. Ensure hip hinge competency first.", knee: "No plyometrics if knee severity 3+. Ensure pain-free jumping.", shoulder: "Overhead throws contraindicated if shoulder at end-range." };
  e.purpose = "Develops reactive power and sport-specific speed.";
  e.whyForYou = "Part of your Performance Enhancement track.";
  e.proTip = "Quality over quantity. Stop when speed drops.";
  e.source = "NASM PES Methodology";
  e.lastReviewed = "2026-03-29";
  e.abilityLevel = "standing";
  e.imageUrl = null;
  e.imageUrl2 = null;
  e.youtubeVideoId = null;
});

// Tag ALL existing exercises with methodology
let pesTagged = 0, sfsTagged = 0, cesTagged = 0, rehabTagged = 0, cptTagged = 0;
const pesExisting = ["agil_ladder_quick_feet","agil_cone_shuffle","agil_box_drill","agil_reaction_ball","agil_sl_hop_stick","agil_t_drill","sport_box_jump","sport_med_ball_slam","sport_med_ball_rot_throw","sport_battle_ropes","sport_sled_push","sport_sled_pull","sport_power_clean"];

d.forEach(e => {
  if (!e.methodology) e.methodology = [];
  if (pesExisting.includes(e.id) && !e.methodology.includes("pes")) { e.methodology.push("pes"); pesTagged++; }
  if ((e.abilityLevel === "seated_only" || e.abilityLevel === "wheelchair_accessible" || e.id.startsWith("seated_") || e.id.startsWith("bed_") || e.id.startsWith("aqua_")) && !e.methodology.includes("sfs")) { e.methodology.push("sfs"); sfsTagged++; }
  if ((e.id.startsWith("corr_") || e.id.startsWith("mob_")) && !e.methodology.includes("ces")) { e.methodology.push("ces"); cesTagged++; }
  if ((e.id.startsWith("rehab_") || e.id.startsWith("mck_") || e.id.startsWith("williams_") || e.id.startsWith("nerve_")) && !e.methodology.includes("rehab")) { e.methodology.push("rehab"); rehabTagged++; }
  if (e.methodology.length === 0) { e.methodology.push("cpt"); cptTagged++; }
});

d.push(...newExercises);
fs.writeFileSync("./src/data/exercises.json", JSON.stringify(d, null, 2));
console.log("Added " + newExercises.length + " PES exercises");
console.log("Tagged: PES=" + pesTagged + " SFS=" + sfsTagged + " CES=" + cesTagged + " Rehab=" + rehabTagged + " CPT=" + cptTagged);
console.log("Total exercises: " + d.length);
