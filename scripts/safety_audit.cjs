const fs = require("fs");
const exerciseDB = JSON.parse(fs.readFileSync("./src/data/exercises.json", "utf8"));
const conditionsDB = JSON.parse(fs.readFileSync("./src/data/conditions.json", "utf8"));

// ═══ TEST 1: CONTRAINDICATION FILTERING ═══
function testContra(name, injuries, phase) {
  const pool = exerciseDB.filter(e =>
    (e.phaseEligibility || []).includes(phase) && e.safetyTier !== "red" && e.category === "main"
  );
  let blocked = 0;
  pool.forEach(ex => {
    const sg = ex.contraindications?.severity_gate || {};
    injuries.forEach(inj => {
      if (sg[inj.gateKey] !== undefined && inj.severity > sg[inj.gateKey]) blocked++;
    });
  });
  const safe = pool.length - blocked;
  const pass = injuries.length === 0 ? blocked === 0 : blocked > 0;
  console.log("  " + name + ": " + blocked + " blocked, " + safe + " safe / " + pool.length + " — " + (pass ? "PASS" : "FAIL"));
}

console.log("=== CHECK 1: CONTRAINDICATION FILTERING (5 PROFILES) ===");
testContra("P1 Lumbar(4)+Knee(3)", [{ gateKey: "lower_back", severity: 4 }, { gateKey: "knee", severity: 3 }], 1);
testContra("P2 Healthy Beginner", [], 1);
testContra("P3 Shoulder(2)", [{ gateKey: "shoulder", severity: 2 }], 1);
testContra("P4 Triple(3,2,2)", [{ gateKey: "lower_back", severity: 3 }, { gateKey: "knee", severity: 2 }, { gateKey: "shoulder", severity: 2 }], 1);
testContra("P5 High Sev(5,4,4)", [{ gateKey: "lower_back", severity: 5 }, { gateKey: "knee", severity: 4 }, { gateKey: "shoulder", severity: 4 }], 1);
console.log("");

// ═══ TEST 2: SCIATICA SUBTYPES ═══
console.log("=== CHECK 2: SCIATICA SUBTYPE ROUTING ===");
const sc = conditionsDB.find(c => c.condition === "sciatica");
const discEx = sc.subtypes.disc_related.exercises;
const pirifEx = sc.subtypes.piriformis_related.exercises;
const stenoEx = sc.subtypes.stenosis_related.exercises;
const discPirOverlap = discEx.filter(e => pirifEx.includes(e));
const discStenoOverlap = discEx.filter(e => stenoEx.includes(e));
console.log("  Disc exercises:      " + discEx.join(", "));
console.log("  Stenosis exercises:  " + stenoEx.join(", "));
console.log("  Piriformis exercises:" + pirifEx.join(", "));
console.log("  Disc↔Piriformis overlap: " + (discPirOverlap.length === 0 ? "NONE — PASS" : "FAIL: " + discPirOverlap.join(",")));
console.log("  Disc↔Stenosis overlap:   " + (discStenoOverlap.length === 0 ? "NONE — PASS" : "FAIL: " + discStenoOverlap.join(",")));
console.log("  Disc bias=extension:     " + (sc.subtypes.disc_related.bias === "extension" ? "PASS" : "FAIL"));
console.log("  Stenosis bias=flexion:   " + (sc.subtypes.stenosis_related.bias === "flexion" ? "PASS" : "FAIL"));
console.log("  Piriformis bias=neutral: " + (sc.subtypes.piriformis_related.bias === "neutral" ? "PASS" : "FAIL"));
console.log("");

// ═══ TEST 3: ACHILLES SUBTYPES ═══
console.log("=== CHECK 3: ACHILLES SUBTYPE PROTOCOLS ===");
const ach = conditionsDB.find(c => c.condition === "achilles_tendinopathy");
const mid = ach.subtypes.midportion;
const ins = ach.subtypes.insertional;
console.log("  Midportion allows drops: " + (mid.restrictions.includes("safe") ? "PASS" : "FAIL"));
console.log("  Insertional blocks drops below neutral: " + (ins.restrictions.includes("NO eccentric drops below") ? "PASS" : "FAIL"));
console.log("");

// ═══ TEST 4: GLUCOSE SAFETY ═══
console.log("=== CHECK 4: TYPE 2 DIABETES GLUCOSE SAFETY ===");
const t2d = conditionsDB.find(c => c.condition === "type_2_diabetes");
console.log("  Glucose check flag:    " + (t2d?.modifications?.glucoseSafetyCheck ? "PASS" : "FAIL"));
console.log("  Blocks if <100:        " + ((t2d?.avoid || []).some(a => a.includes("<100")) ? "PASS" : "FAIL"));
console.log("  Blocks if >250:        " + ((t2d?.avoid || []).some(a => a.includes(">250")) ? "PASS" : "FAIL"));
console.log("  Refer if <70:          " + ((t2d?.referOutIf || "").includes("<70") ? "PASS" : "FAIL"));
console.log("  Refer if >250:         " + ((t2d?.referOutIf || "").includes(">250") ? "PASS" : "FAIL"));
console.log("  Foot checks:           " + (t2d?.modifications?.footChecks ? "PASS" : "FAIL"));
console.log("  Neuropathy screening:  " + (t2d?.modifications?.neuropathyScreening ? "PASS" : "FAIL"));
console.log("");

// ═══ TEST 5: TYPE 1 DIABETES ═══
console.log("=== CHECK 5: TYPE 1 DIABETES KETONE SAFETY ===");
const t1d = conditionsDB.find(c => c.condition === "type_1_diabetes");
console.log("  Condition exists:      " + (t1d ? "PASS" : "FAIL"));
console.log("  Ketone check required: " + (t1d?.modifications?.ketoneCheckBeforeExercise ? "PASS" : "FAIL"));
console.log("  CGM required:          " + (t1d?.modifications?.cgmRequired ? "PASS" : "FAIL"));
console.log("  Carb plan required:    " + (t1d?.modifications?.carbPlanRequired ? "PASS" : "FAIL"));
console.log("");

// ═══ TEST 6: REFER-OUT COVERAGE ═══
console.log("=== CHECK 6: REFER-OUT TRIGGERS (ALL 104) ===");
const withRefer = conditionsDB.filter(c => c.referOutIf && c.referOutIf.length > 10);
const missing = conditionsDB.filter(c => !c.referOutIf || c.referOutIf.length < 10);
console.log("  With referOutIf: " + withRefer.length + "/" + conditionsDB.length + " — " + (missing.length === 0 ? "PASS" : "FAIL"));
missing.forEach(c => console.log("    MISSING: " + c.condition));
console.log("");

// ═══ TEST 7: SEVERITY DESCRIPTIONS ═══
console.log("=== CHECK 7: SEVERITY DESCRIPTIONS (ALL 104) ===");
const withSev = conditionsDB.filter(c => c.severity_description);
console.log("  With severity_description: " + withSev.length + "/" + conditionsDB.length + " — " + (withSev.length === conditionsDB.length ? "PASS" : "FAIL"));
console.log("");

// ═══ TEST 8: PROTOCOL-SPECIFIC FIXES ═══
console.log("=== CHECK 8: PROTOCOL-SPECIFIC FIXES ===");

const disc = conditionsDB.find(c => c.condition === "disc_herniation_lumbar_acute");
console.log("  Disc NOT hard-coded extension: " + (disc?.modifications?.extensionBiasedProtocol === false ? "PASS" : "FAIL"));
console.log("  Disc directional pref first:   " + (disc?.modifications?.testDirectionalPreferenceFirst ? "PASS" : "FAIL"));
console.log("  Disc cauda equina referral:    " + ((disc?.referOutIf || "").includes("cauda equina") ? "PASS" : "FAIL"));

const acl = conditionsDB.find(c => c.condition === "acl_post_op");
console.log("  ACL criteria-based:            " + (acl?.modifications?.criteriaBased ? "PASS" : "FAIL"));
console.log("  ACL graft type considerations: " + (acl?.modifications?.graftTypeConsiderations ? "PASS" : "FAIL"));

const patella = conditionsDB.find(c => c.condition === "patellar_tendinopathy");
console.log("  Patellar NOT VMO-specific:     " + (patella?.modifications?.vmoSpecific === false ? "PASS" : "FAIL"));
console.log("  Patellar 24h pain rule:        " + (patella?.modifications?.twentyFourHourPainRule ? "PASS" : "FAIL"));
console.log("  Patellar graded jump return:   " + (patella?.modifications?.gradedJumpReturn ? "PASS" : "FAIL"));

const hipB = conditionsDB.find(c => c.condition === "hip_bursitis");
console.log("  Hip bursitis no IT band FR:    " + ((hipB?.avoid || []).some(a => a.toLowerCase().includes("it band foam")) ? "PASS" : "FAIL"));

const trig = conditionsDB.find(c => c.condition === "trigger_finger");
console.log("  Trigger finger no grip:        " + ((trig?.avoid || []).some(a => a.toLowerCase().includes("grip")) ? "PASS" : "FAIL"));

const deq = conditionsDB.find(c => c.condition === "de_quervains");
console.log("  De Quervain activity mod first:" + (deq?.modifications?.activityModificationFirst ? "PASS" : "FAIL"));

const dep = conditionsDB.find(c => c.condition === "depression");
console.log("  Depression no antidep claim:   " + (!(dep?.userMessage || "").toLowerCase().includes("as effective as antidepressant") ? "PASS" : "FAIL"));

const hf = conditionsDB.find(c => c.condition === "heart_failure_stable");
console.log("  Heart failure SpO2 threshold:  " + (hf?.modifications?.vitalsThresholds?.minSpO2 === 88 ? "PASS" : "FAIL"));
console.log("  Heart failure max HR:          " + (hf?.modifications?.vitalsThresholds?.maxHR === 120 ? "PASS" : "FAIL"));

const sci = conditionsDB.find(c => c.condition === "spinal_cord_injury");
console.log("  SCI autonomic dysreflexia:     " + (sci?.modifications?.autonomicDysreflexia ? "PASS" : "FAIL"));
console.log("  SCI pressure relief:           " + (sci?.modifications?.pressureRelief ? "PASS" : "FAIL"));

const stroke = conditionsDB.find(c => c.condition === "post_stroke");
console.log("  Stroke shoulder protection:    " + (stroke?.modifications?.shoulderProtection ? "PASS" : "FAIL"));
console.log("  Stroke fall risk screening:    " + (stroke?.modifications?.fallRiskScreening ? "PASS" : "FAIL"));

const scol = conditionsDB.find(c => c.condition === "scoliosis");
console.log("  Scoliosis Schroth-based:       " + (scol?.modifications?.schrothMethodBased ? "PASS" : "FAIL"));
console.log("");

// ═══ TEST 9: NEW CONDITIONS EXIST ═══
console.log("=== CHECK 9: NEW CONDITIONS EXIST ===");
["shoulder_replacement_anatomic", "shoulder_replacement_reverse", "rotator_cuff_repair", "dupuytrens_contracture", "type_2_diabetes", "type_1_diabetes"].forEach(k => {
  const found = conditionsDB.find(c => c.condition === k);
  console.log("  " + k + ": " + (found ? "PASS" : "FAIL"));
});
console.log("");

// ═══ TEST 10: MENISCUS SUBTYPES ═══
console.log("=== CHECK 10: MENISCUS SUBTYPES ===");
const men = conditionsDB.find(c => c.condition === "meniscus_tear");
console.log("  Has subtypes:        " + (men?.subtypes ? "PASS" : "FAIL"));
if (men?.subtypes) {
  console.log("  Nonoperative:        " + (men.subtypes.nonoperative ? "PASS" : "FAIL"));
  console.log("  Surgical repair:     " + (men.subtypes.surgical_repair ? "PASS" : "FAIL"));
  console.log("  Root/ramp repair:    " + (men.subtypes.root_ramp_repair ? "PASS" : "FAIL"));
}
console.log("");

// ═══ TEST 11: SHOULDER LABRUM SUBTYPES ═══
console.log("=== CHECK 11: SHOULDER LABRUM SUBTYPES ===");
const lab = conditionsDB.find(c => c.condition && c.condition.includes("labrum"));
console.log("  Has subtypes:        " + (lab?.subtypes ? "PASS" : "FAIL"));
if (lab?.subtypes) {
  console.log("  SLAP:                " + (lab.subtypes.slap ? "PASS" : "FAIL"));
  console.log("  Bankart:             " + (lab.subtypes.bankart ? "PASS" : "FAIL"));
}
console.log("");

// ═══ TEST 12: TOS SUBTYPES ═══
console.log("=== CHECK 12: THORACIC OUTLET SYNDROME SUBTYPES ===");
const tos = conditionsDB.find(c => c.condition === "thoracic_outlet_syndrome");
console.log("  Has subtypes:        " + (tos?.subtypes ? "PASS" : "FAIL"));
if (tos?.subtypes) {
  console.log("  Neurogenic:          " + (tos.subtypes.neurogenic ? "PASS" : "FAIL"));
  console.log("  Venous (refer):      " + (tos.subtypes.venous?.referImmediately ? "PASS" : "FAIL"));
  console.log("  Arterial (refer):    " + (tos.subtypes.arterial?.referImmediately ? "PASS" : "FAIL"));
}
console.log("");

// ═══ FINAL SUMMARY ═══
console.log("════════════════════════════════════════");
console.log("SAFETY AUDIT COMPLETE");
console.log("Total conditions: " + conditionsDB.length);
console.log("Exercises: " + exerciseDB.length);
console.log("════════════════════════════════════════");
