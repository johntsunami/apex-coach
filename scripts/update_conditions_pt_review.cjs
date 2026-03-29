const fs = require("fs");
const d = JSON.parse(fs.readFileSync("./src/data/conditions.json", "utf8"));

const byCondition = Object.fromEntries(d.map(c => [c.condition, c]));
let updated = 0;
let added = 0;

function update(conditionKey, updates) {
  const c = byCondition[conditionKey];
  if (!c) { console.log("  SKIP (not found):", conditionKey); return; }
  Object.assign(c, updates);
  updated++;
}

// ═══ STRUCTURAL: Add severity_description to ALL ═══
d.forEach(c => {
  if (!c.severity_description) {
    c.severity_description = {
      1: "Minimal symptoms, full function",
      2: "Mild symptoms, slight limitation",
      3: "Moderate symptoms, functional impact",
      4: "Significant symptoms, major limitation",
      5: "Severe, needs medical clearance before exercise"
    };
  }
});

// ═══ FIX 3: SPINAL FUSION — staged progression ═══
update("spinal_fusion_lumbar", {
  phases: {
    weeks_0_6: "Breathing + ankle pumps + walking + gentle ROM. Strict BLT precautions (no Bending, Lifting, Twisting).",
    weeks_6_12: "Add isometrics + bodyweight core + glute activation. Surgeon clearance required.",
    weeks_12_24: "Progressive loading with fusion-safe exercises. Neutral spine mandatory.",
    months_6_plus: "Surgeon-specific progression toward broader loading with neutral spine control. Adjacent segment mobility work."
  },
  referOutIf: "New radiating pain, progressive numbness/weakness in legs, bowel/bladder changes, hardware pain, fever, wound changes",
  notes: "Staged progression replaces lifetime blanket ban. Early: strict BLT. Later: surgeon-guided progression toward loading WITH neutral control. Adjacent segment disease prevention is priority."
});

update("spinal_fusion_cervical", {
  referOutIf: "New radiating arm pain, progressive numbness/weakness, difficulty swallowing, voice changes, myelopathy signs (gait changes, hand clumsiness)",
});

// ═══ FIX 4: DISC HERNIATION — directional preference routing ═══
update("disc_herniation_lumbar_acute", {
  userMessage: "Acute disc herniation is routed through directional preference testing FIRST. Extension helps most (but not all) disc herniations. If symptoms peripheralize with extension, we switch to neutral-only or flexion-based protocol.",
  notes: "Do NOT hard-code extension. Route through directional preference testing. Some patients centralize with extension, others worsen. Cauda equina syndrome is a surgical emergency.",
  referOutIf: "Bowel/bladder changes (cauda equina emergency), saddle numbness, bilateral leg weakness, progressive neurological deficit, symptoms peripheralize with ALL directions",
  modifications: { testDirectionalPreferenceFirst: true, extensionBiasedProtocol: false, shortWalkingBouts: true },
});

// ═══ FIX 5: SCIATICA — force subtype classification ═══
update("sciatica", {
  userMessage: "Sciatica has three distinct causes requiring different treatments. We classify yours first: disc-related (extension may help), stenosis-related (flexion helps), or piriformis-related (stretching/release helps). Don't mix strategies.",
  notes: "MUST classify subtype before prescribing. Disc-related: extension bias. Stenosis-related: flexion bias. Piriformis: stretching + release. Mixing strategies is ineffective and potentially harmful.",
  subtypes: {
    disc_related: { bias: "extension", exercises: ["mck_back_prone_lying", "mck_back_press_up", "mck_back_ext_standing"], avoid: ["flexion", "prolonged sitting"] },
    stenosis_related: { bias: "flexion", exercises: ["williams_pelvic_tilt", "williams_single_knee_chest", "cardio_bike"], avoid: ["extension", "prolonged standing"] },
    piriformis_related: { bias: "neutral", exercises: ["stretch_piriformis", "fr_piriformis", "mob_90_90_hip", "corr_clamshell"], avoid: ["prolonged sitting on hard surfaces"] }
  },
  referOutIf: "Bowel/bladder changes, saddle numbness, bilateral symptoms, progressive weakness, no improvement after 6 weeks of appropriate treatment",
});

// ═══ FIX 6: ACL POST-OP — criteria-based progression ═══
update("acl_post_op", {
  notes: "Replace month-based return with criteria-based. Pivoting when: quad strength >=90% uninvolved, hop test >=90% symmetry, no effusion. Graft type (BTB vs hamstring vs quad vs allograft) affects timeline and donor site precautions.",
  phases: {
    phase1: "ROM restoration, quad activation, gait normalization. Criteria: full extension, flexion >120deg, no effusion.",
    phase2: "Strengthening (OKC/CKC). Criteria: quad strength >70% uninvolved, single leg squat without deviation.",
    phase3: "Running progression. Criteria: quad >80%, hop tests >80%, no pain/effusion with plyometrics.",
    phase4: "Sport-specific + return. Criteria: quad >=90%, hop tests >=90% symmetry, passes sport-specific testing."
  },
  modifications: { criteriaBased: true, monthBasedReturn: false, graftTypeConsiderations: true },
  referOutIf: "New instability episodes, significant effusion, loss of ROM >10 degrees, graft site pain worsening, mechanical locking",
});

// ═══ FIX 7: MENISCUS — split protocols ═══
update("meniscus_tear", {
  notes: "Three distinct protocols: (1) Nonoperative: load management + quad strengthening. (2) Surgical repair: weight-bearing restrictions + limited ROM early. (3) Root/ramp repair: extended protection, slower progression. Protocol depends on tear type, location, and vascularity.",
  subtypes: {
    nonoperative: { description: "Load management + quad strengthening. May allow full activity if asymptomatic.", restrictions: "Avoid deep squat if symptomatic. Monitor for mechanical symptoms." },
    surgical_repair: { description: "Weight-bearing restrictions early. ROM limited per surgeon. Slower return.", restrictions: "No deep flexion 6-8 weeks. Progressive loading after 12 weeks." },
    root_ramp_repair: { description: "Extended protection. Slower progression than standard repair.", restrictions: "Partial WB 4-6 weeks. No deep squat 12+ weeks. Full return 6-9 months." }
  },
  referOutIf: "Mechanical locking, giving way, significant effusion, inability to bear weight, loss of ROM",
});

// ═══ FIX 8: PATELLAR TENDINOPATHY — tendon loading progression ═══
update("patellar_tendinopathy", {
  notes: "Use tendon-loading progression, NOT VMO-specific training. Pain monitoring: if pain increases >2/10 AND lasts >24 hours post-exercise, reduce load (24-hour pain rule). Allow graded jump return — blanket avoidance delays recovery.",
  recommended: ["rehab_eccentric_decline_squat", "rehab_spanish_squat", "iso_squat_hold", "rehab_step_down_low", "str_bw_squat"],
  modifications: { vmoSpecific: false, tendonLoadingProgression: true, twentyFourHourPainRule: true, gradedJumpReturn: true },
  userMessage: "Tendon loading is the treatment — not rest. We use the 24-hour pain rule: if pain increases >2/10 and lasts >24 hours after exercise, we reduce load. Gradual jump return is allowed as symptoms permit.",
  referOutIf: "Complete inability to load the tendon, significant swelling, night pain, pain at rest worsening",
});

// ═══ FIX 9: SHOULDER LABRUM — split SLAP and Bankart ═══
// Update existing labrum entry
const labrum = d.find(c => c.condition && c.condition.includes("labrum"));
if (labrum) {
  labrum.notes = "SLAP and Bankart lesions require separate protocols. SLAP: biceps loading restrictions, overhead return depends on repair type. Bankart: instability precautions, avoid positions of apprehension (ER + abduction + extension).";
  labrum.subtypes = {
    slap: { description: "Superior labrum tear. Biceps anchor involved.", restrictions: "Limit biceps loading early. Overhead return gradual. Type II repair most restrictive." },
    bankart: { description: "Anterior-inferior labrum. Instability precaution.", restrictions: "Avoid apprehension position. No behind-neck pressing. Gradual ER in abduction." }
  };
  labrum.referOutIf = "Recurrent instability, new catching/locking, significant strength loss, inability to perform ADLs";
  updated++;
}

// ═══ FIX 10: Add SHOULDER REPLACEMENT ═══
d.push({
  id: "B" + (d.filter(c => c.id.startsWith("B")).length + 1),
  condition: "shoulder_replacement_anatomic",
  name: "Total Shoulder Replacement (Anatomic TSA)",
  category: "joint",
  severityRange: "3-5",
  severity_description: { 1: "Minimal symptoms", 2: "Mild limitation", 3: "Moderate limitation", 4: "Significant limitation", 5: "Severe, needs clearance" },
  recommended: ["rehab_pendulum_swing", "rehab_scap_wall_slides", "rehab_prone_y", "seated_row"],
  mandatoryDaily: ["rehab_pendulum_swing"],
  avoid: ["Push-ups", "Bench press", "Heavy overhead pressing", "Behind-neck movements"],
  modifications: { liftingLimit: "No lifting >10lbs for 6 weeks, >25lbs for 12 weeks", pushUpRestriction: true },
  phases: { weeks_0_6: "Pendulum, passive ROM only", weeks_6_12: "Active-assist ROM, isometrics", months_3_6: "Active ROM, light resistance", months_6_plus: "Progressive strengthening, permanent overhead caution" },
  referOutIf: "New instability, sudden loss of motion, significant pain increase, signs of infection, component loosening symptoms",
  userMessage: "Anatomic TSA preserves normal shoulder mechanics. We progress through passive → active-assist → active → resisted phases. Lifting limits are strict early on.",
  notes: "Anatomic TSA: cuff must be intact. Different from reverse TSA. Lifting limits and push-up restrictions per surgeon.",
  source: "AAOS shoulder replacement rehabilitation guidelines"
});
added++;

d.push({
  id: "B" + (d.filter(c => c.id.startsWith("B")).length + 1),
  condition: "shoulder_replacement_reverse",
  name: "Reverse Total Shoulder Replacement",
  category: "joint",
  severityRange: "3-5",
  severity_description: { 1: "Minimal symptoms", 2: "Mild limitation", 3: "Moderate limitation", 4: "Significant limitation", 5: "Severe, needs clearance" },
  recommended: ["rehab_pendulum_swing", "rehab_scap_wall_slides", "seated_row"],
  mandatoryDaily: ["rehab_pendulum_swing"],
  avoid: ["Push-ups (permanent)", "Heavy bench press", "Combined adduction + IR", "Behind-neck movements", "Tricep dips"],
  modifications: { permanentPushUpBan: true, noAdductionIR: true, deltaoidDependentArm: true },
  phases: { weeks_0_6: "Sling, pendulum only", weeks_6_12: "Active-assist ROM, scapular exercises", months_3_6: "Light deltoid strengthening", months_6_plus: "Functional strengthening with permanent restrictions" },
  referOutIf: "Dislocation (combined adduction + IR position), sudden weakness, instability, infection signs",
  userMessage: "Reverse TSA relies on your deltoid instead of rotator cuff. Push-ups and dips are permanently restricted. We build deltoid strength safely.",
  notes: "Reverse TSA: deltoid-dependent arm. No push-ups permanently. Dislocation risk with combined adduction + internal rotation.",
  source: "AAOS reverse TSA rehabilitation protocols"
});
added++;

// ═══ FIX 11: Add ROTATOR CUFF REPAIR ═══
d.push({
  id: "B" + (d.filter(c => c.id.startsWith("B")).length + 1),
  condition: "rotator_cuff_repair",
  name: "Rotator Cuff Repair (Post-Op)",
  category: "joint",
  severityRange: "3-5",
  severity_description: { 1: "Minimal symptoms", 2: "Mild limitation", 3: "Moderate limitation", 4: "Significant limitation", 5: "Severe, needs clearance" },
  recommended: ["rehab_pendulum_swing", "rehab_scap_wall_slides", "rehab_iso_ext_rotation"],
  mandatoryDaily: ["rehab_pendulum_swing"],
  avoid: ["Active ROM until cleared", "Band ER until phase 3", "Prone Y/T/W until phase 3", "Heavy lifting until phase 4", "Behind-neck pressing permanently"],
  modifications: { explicitPhases: true, tearSizeAffectsTimeline: true },
  phases: {
    phase1_passive: "Weeks 0-6: Passive ROM only. Pendulums, pulley, table slides. No active shoulder movement.",
    phase2_activeAssist: "Weeks 6-12: Active-assist ROM. Wand exercises, wall slides. Begin scapular exercises.",
    phase3_active: "Weeks 12-16: Active ROM. Begin band ER, prone Y/T/W. Light resistance.",
    phase4_resisted: "Weeks 16+: Progressive resistance. Tear size and tissue quality affect timeline."
  },
  referOutIf: "Sudden loss of active ROM (re-tear concern), significant pain increase, new weakness, signs of infection",
  userMessage: "Rotator cuff repair follows strict phases: passive → active-assist → active → resisted. Band ER and prone exercises wait until Phase 3. Tear size affects your timeline.",
  notes: "Explicit phase progression. Small tears progress faster than massive tears. Tissue quality (fatty infiltration) affects healing potential. Don't allow band ER or prone Y/T/W before Phase 3.",
  source: "AAOS rotator cuff repair rehabilitation guidelines"
});
added++;

// ═══ FIX 12: ACHILLES TENDINOPATHY — split midportion/insertional ═══
update("achilles_tendinopathy", {
  notes: "MUST split midportion from insertional. Alfredson eccentric drops BELOW neutral can aggravate insertional cases. Midportion: eccentric drops off step OK. Insertional: eccentric drops only to neutral (not below), add isometric loading first.",
  subtypes: {
    midportion: { description: "2-6cm above insertion. Classic Alfredson protocol appropriate.", exercises: ["rehab_eccentric_calf_drop"], restrictions: "Standard eccentric drop off step edge is safe." },
    insertional: { description: "At calcaneus attachment. Different protocol needed.", exercises: ["iso_calf_raise"], restrictions: "NO eccentric drops below neutral — aggravates insertion. Isometric loading first, flat-ground eccentrics only." }
  },
  referOutIf: "Complete inability to push off, palpable gap in tendon (rupture concern), sudden pop with pain",
});

// ═══ FIX 13: PLANTAR FASCIITIS ═══
update("plantar_fasciitis", {
  recommended: ["rehab_eccentric_calf_drop", "rehab_towel_scrunches", "rehab_toe_yoga", "rehab_tib_ant_raise", "stretch_standing_calf", "fr_calves", "fr_feet"],
  notes: "Calf eccentrics alone are incomplete. Add: plantar fascia-specific stretching (towel curls, toe yoga), intrinsic foot strengthening, taping for acute relief, and ankle/foot strengthening (tibialis raises).",
  userMessage: "Plantar fasciitis treatment includes calf work, foot intrinsic strengthening, specific stretches, and arch support. We address the whole kinetic chain, not just the calf.",
});

// ═══ FIX 14: HIP BURSITIS ═══
update("hip_bursitis", {
  notes: "Remove IT band foam rolling — it's often too provocative for greater trochanteric pain syndrome (GTPS). Focus on gluteal loading (clamshells, side-lying abduction) and avoiding compression positions (crossing legs, side-lying on affected side, standing on one leg).",
  recommended: ["corr_clamshell", "corr_side_lying_hip_abd", "str_glute_bridge", "corr_monster_walk", "cardio_walking"],
  avoid: ["IT band foam rolling (too provocative)", "Crossing legs", "Side-lying on affected side", "Prolonged standing on one leg", "Deep squats if symptomatic"],
  userMessage: "Hip bursitis (GTPS) responds to gluteal strengthening and avoiding compression. We've removed IT band foam rolling — research shows it can aggravate this condition.",
});

// ═══ FIX 15: THORACIC OUTLET ═══
update("thoracic_outlet_syndrome", {
  notes: "Must subtype: neurogenic (most common, nerve compression), venous (vein compression), arterial (artery compression — vascular emergency). Neurogenic: posture correction + scalene stretching. Venous/arterial: IMMEDIATE referral.",
  subtypes: {
    neurogenic: { description: "Nerve compression. Most common (95%).", exercises: ["corr_chin_tuck", "corr_pec_stretch", "corr_serratus_wall_slide"] },
    venous: { description: "Vein compression. Refer to vascular specialist.", exercises: [], referImmediately: true },
    arterial: { description: "Artery compression. Vascular emergency.", exercises: [], referImmediately: true }
  },
  referOutIf: "Arm/hand color changes (blue, white, mottled), significant swelling, cold hand, absent pulse, throbbing pain — these suggest vascular TOS requiring emergency evaluation",
});

// ═══ FIX 16: DE QUERVAIN'S ═══
update("de_quervains", {
  notes: "Activity modification and thumb-spica protection FIRST, not early eccentric loading for irritable cases. Isometric wrist loading after acute phase resolves. Early eccentrics can worsen irritable tendons.",
  modifications: { activityModificationFirst: true, thumbSpicaProtection: true, noEarlyEccentrics: true },
  phases: {
    acute: "Rest, ice, thumb-spica brace, activity modification. Avoid gripping/pinching.",
    subacute: "Gentle isometric wrist exercises. Continue bracing during aggravating activities.",
    chronic: "Progressive loading. Eccentric wrist exercises if non-irritable. Grip strengthening.",
  },
});

// ═══ FIX 17: TRIGGER FINGER ═══
update("trigger_finger", {
  notes: "Grip strengthening can WORSEN trigger finger. Focus on gentle ROM, tendon gliding exercises, and activity modification. Separate from Dupuytren's — different pathology, different treatment.",
  avoid: ["Heavy grip strengthening", "Repeated forceful gripping", "Power tools (vibration)"],
  recommended: ["rehab_wrist_flex_stretch", "rehab_wrist_ext_stretch"],
  userMessage: "Trigger finger needs gentle tendon gliding, NOT grip strengthening. Heavy gripping makes it worse.",
});

// ═══ Add DUPUYTREN'S ═══
d.push({
  id: "B" + (d.filter(c => c.id.startsWith("B")).length + 1),
  condition: "dupuytrens_contracture",
  name: "Dupuytren's Contracture",
  category: "joint",
  severityRange: "1-4",
  severity_description: { 1: "Minimal symptoms", 2: "Mild limitation", 3: "Moderate limitation", 4: "Significant limitation", 5: "Severe" },
  recommended: ["rehab_wrist_ext_stretch", "rehab_grip_strengthen"],
  mandatoryDaily: [],
  avoid: ["Forceful finger extension stretching (can aggravate)", "Heavy vibration tools"],
  modifications: { gentleROMOnly: true },
  referOutIf: "Rapid progression, tabletop test positive (can't flatten hand), functional limitation in daily activities",
  userMessage: "Dupuytren's is managed differently from trigger finger. Gentle ROM and grip work are appropriate. Forceful stretching can aggravate the condition.",
  notes: "Different from trigger finger. Grip strengthening IS appropriate here (unlike trigger finger). Refer if progressing rapidly or functional limitation.",
  source: "Hand therapy guidelines for Dupuytren's contracture"
});
added++;

// ═══ FIX 18: SCOLIOSIS ═══
update("scoliosis", {
  notes: "Add curve type (C vs S), magnitude (mild <25, moderate 25-45, severe >45), and skeletal maturity. 'Strengthen the convex side' alone is oversimplified. Focus on: spinal stabilization, bilateral symmetry, breathing mechanics, and functional movement. Schroth method is evidence-based.",
  modifications: { curveTypeMatters: true, magnitudeMatters: true, schrothMethodBased: true, strengthenConvexSideOversimplified: true },
  userMessage: "Scoliosis training is more nuanced than 'strengthen one side.' We focus on spinal stabilization, breathing mechanics, and functional symmetry based on YOUR curve pattern.",
});

// ═══ FIX 19-20: DIABETES ═══
// Find or add type 2 diabetes
let t2d = d.find(c => c.condition === "type_2_diabetes");
if (!t2d) {
  d.push({
    id: "F" + (d.filter(c => c.id.startsWith("F")).length + 1),
    condition: "type_2_diabetes",
    name: "Type 2 Diabetes",
    category: "metabolic",
    severityRange: "1-4",
    severity_description: { 1: "Well-controlled", 2: "Mild fluctuations", 3: "Moderate control issues", 4: "Significant complications" },
    recommended: ["cardio_walking", "str_glute_bridge", "str_bw_squat", "str_goblet_squat"],
    mandatoryDaily: ["cardio_walking"],
    avoid: ["Exercise if blood glucose <100 or >250 mg/dL", "High-intensity exercise with active retinopathy", "Heavy Valsalva with retinopathy"],
    modifications: { glucoseSafetyCheck: true, footChecks: true, neuropathyScreening: true },
    referOutIf: "Blood glucose <70 (hypoglycemia) or >250 (hyperglycemia), signs of ketoacidosis (nausea, vomiting, fruity breath), new foot wounds, vision changes, chest pain during exercise",
    userMessage: "Exercise is powerful medicine for type 2 diabetes. We check blood glucose before every session and modify intensity based on your numbers. Always check your feet before and after exercise.",
    notes: "Glucose safety: don't exercise if BG <100 or >250. Add foot checks before/after exercise. Screen for peripheral neuropathy (affects balance, sensation). Retinopathy limits heavy Valsalva and high-intensity exercise.",
    source: "ADA Standards of Care, ACSM Exercise and Type 2 Diabetes guidelines"
  });
  added++;
}

let t1d = d.find(c => c.condition === "type_1_diabetes");
if (!t1d) {
  d.push({
    id: "F" + (d.filter(c => c.id.startsWith("F")).length + 1),
    condition: "type_1_diabetes",
    name: "Type 1 Diabetes",
    category: "metabolic",
    severityRange: "2-5",
    severity_description: { 2: "Well-managed with CGM", 3: "Moderate variability", 4: "Significant variability", 5: "Frequent hypo/hyperglycemia" },
    recommended: ["cardio_walking", "cardio_bike", "str_glute_bridge", "str_bw_squat"],
    mandatoryDaily: ["cardio_walking"],
    avoid: ["Exercise if ketones present", "Exercise if blood glucose <100 without carb plan", "Exercise if blood glucose >250 with ketones"],
    modifications: { cgmRequired: true, carbPlanRequired: true, insulinAdjustment: true, ketoneCheckBeforeExercise: true },
    referOutIf: "Blood glucose <70 with symptoms, ketones present, blood glucose >300, signs of DKA, unexplained hypoglycemia during/after exercise, new foot wounds",
    userMessage: "Type 1 diabetes requires glucose and ketone monitoring before exercise. We plan carbohydrate intake around your sessions and adjust based on your insulin timing.",
    notes: "CGM/SMBG checks mandatory before exercise. No exercise if ketones present. Carbohydrate planning essential. Insulin-exercise interactions are complex — reduce basal for prolonged aerobic, may need carbs for anaerobic. Hypoglycemia risk continues 24+ hours post-exercise.",
    source: "ADA Standards of Care, Riddell et al. Lancet Diabetes 2017"
  });
  added++;
}

// ═══ FIX 21: DEPRESSION ═══
update("depression", {
  userMessage: "Strong evidence that regular exercise improves mood and function in depression. Exercise is a powerful adjunct to treatment — we'll build consistency with activities you actually enjoy.",
  notes: "Removed 'as effective as antidepressants' claim. Evidence supports exercise as effective adjunct with strong effect sizes for mood improvement. Behavioral activation principles apply — start small, build consistency.",
});

// ═══ FIX 22: POST-CARDIAC EVENT ═══
update("post_cardiac_event", {
  notes: "Add cardiac rehab phases with vitals thresholds and symptom monitoring. Phase I (inpatient), Phase II (supervised outpatient), Phase III (independent). Sternotomy precautions if CABG: no pushing/pulling/lifting >5lbs for 8-12 weeks.",
  modifications: { cardiacRehabPhases: true, vitalsMonitoring: true, sternotomyPrecautions: true },
  referOutIf: "Chest pain/pressure, severe dyspnea, dizziness/syncope, heart rate >120 or irregular rhythm, BP >180/110 or drop >20mmHg systolic, SpO2 <90%",
});

// ═══ FIX 23: HEART FAILURE ═══
update("heart_failure", {
  notes: "Vitals and symptom thresholds: STOP if systolic BP drops >20mmHg, HR >120, SpO2 <88%, or new/worsening dyspnea at rest. Start with interval training (exercise 2-6 min, rest 1-2 min). RPE-based intensity (HR unreliable if on beta-blockers).",
  modifications: { vitalsThresholds: { stopIfSystolicDrops: 20, maxHR: 120, minSpO2: 88 }, intervalTraining: true, rpeBased: true },
  referOutIf: "Systolic BP drops >20mmHg during exercise, HR >120 or new irregular rhythm, SpO2 <88%, new/worsening dyspnea at rest, weight gain >3lbs overnight (fluid retention), new lower extremity edema",
});

// ═══ FIX 24: STROKE ═══
update("stroke", {
  notes: "Add shoulder protection (subluxation risk on affected side), fall risk screening, cognition screening (affects exercise instruction comprehension), and explicit referral triggers. Affected-side shoulder is at risk — support during all activities.",
  modifications: { shoulderProtection: true, fallRiskScreening: true, cognitionScreening: true, affectedSideSupport: true },
  referOutIf: "New neurological symptoms (sudden weakness, vision changes, severe headache, speech difficulty), falls, shoulder subluxation signs, significant BP changes during exercise",
});

// ═══ FIX 25: SPINAL CORD INJURY ═══
update("spinal_cord_injury", {
  notes: "Add pressure-relief (weight shifts every 15-30 min), skin checks (before/after exercise), autonomic dysreflexia triggers (level T6 and above — EMERGENCY if BP rises >20mmHg with headache/flushing), orthostatic precautions (sit up slowly), and fracture risk (osteoporotic bones below level of injury).",
  modifications: { pressureRelief: true, skinChecks: true, autonomicDysreflexia: true, orthostaticPrecautions: true, fractureRisk: true },
  referOutIf: "Autonomic dysreflexia signs (sudden BP spike >20mmHg, pounding headache, flushing, sweating above level) — THIS IS AN EMERGENCY. Also: new pressure sores, new neurological changes, fracture signs, UTI symptoms",
});

// Save
fs.writeFileSync("./src/data/conditions.json", JSON.stringify(d, null, 2));
console.log("Updated:", updated, "conditions");
console.log("Added:", added, "new conditions");
console.log("Total:", d.length, "conditions");
console.log("All have referOutIf:", d.filter(c => c.referOutIf).length === d.length);
console.log("All have severity_description:", d.filter(c => c.severity_description).length === d.length);
