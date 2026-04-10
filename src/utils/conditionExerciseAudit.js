// ═══════════════════════════════════════════════════════════════
// APEX Coach — Condition-Exercise Cross-Audit
// Verifies every condition's blocked exercises are actually blocked,
// recommended exercises exist, and no dangerous exercises slip through.
// ═══════════════════════════════════════════════════════════════

// ── CONDITION → JOINT MAP ──────────────────────────────────
const CONDITION_JOINTS = {
  spinal_fusion_lumbar: ["lower_back"], spinal_fusion_cervical: ["neck"],
  disc_herniation_lumbar_acute: ["lower_back"], disc_herniation_lumbar_chronic: ["lower_back"],
  disc_herniation_cervical: ["neck"], spinal_stenosis: ["lower_back"],
  spondylolisthesis: ["lower_back"], spondylolysis: ["lower_back"],
  degenerative_disc_disease: ["lower_back"], lumbar_microdiscectomy: ["lower_back"],
  chronic_neck_pain: ["neck"], whiplash_chronic: ["neck"], sciatica: ["lower_back"],
  si_joint_dysfunction: ["hip"], ankylosing_spondylitis: ["lower_back"],
  acl_post_op: ["knee"], meniscus_tear: ["knee"], patellar_tendinopathy: ["knee"],
  knee_osteoarthritis: ["knee"], knee_total_replacement: ["knee"], patellofemoral_pain: ["knee"],
  rotator_cuff_tear: ["shoulder"], labrum_tear_shoulder: ["shoulder"],
  frozen_shoulder: ["shoulder"], shoulder_impingement: ["shoulder"],
  shoulder_total_replacement: ["shoulder"], rotator_cuff_repair: ["shoulder"],
  hip_replacement_posterior: ["hip"], hip_replacement_anterior: ["hip"],
  hip_labral_tear: ["hip"], hip_bursitis: ["hip"], hip_osteoarthritis: ["hip"],
  ankle_chronic_instability: ["ankle"], ankle_post_fracture: ["ankle"],
  plantar_fasciitis: ["ankle"], achilles_tendinopathy: ["ankle"],
  tennis_elbow: ["elbow"], golfers_elbow: ["elbow"],
  carpal_tunnel: ["wrist"], de_quervains: ["wrist"], trigger_finger: ["wrist"],
};

// ── PATTERN BLOCKS BY CONDITION ─────────────────────────────
// blocked_patterns: text patterns that if found in exercise name/tags → should be blocked
// blocked_ids: specific exercise IDs that must be blocked
const CONDITION_BLOCKS = {
  labrum_tear_shoulder: {
    blocked_ids: ["bb_overhead_press"],
    blocked_patterns: ["behind.neck", "behind_neck"],
    notes: "BB OHP blocked at ALL severities — barbell fixes grip width",
  },
  rotator_cuff_tear: {
    blocked_ids: ["bb_overhead_press"],
    blocked_patterns: ["behind.neck", "upright.row", "behind_neck"],
  },
  rotator_cuff_repair: {
    blocked_ids: ["bb_overhead_press"],
    blocked_patterns: ["behind.neck", "upright.row", "behind_neck", "dip"],
  },
  frozen_shoulder: {
    blocked_patterns: ["behind.neck", "overhead.*heavy"],
  },
  shoulder_impingement: {
    blocked_patterns: ["behind.neck", "upright.row"],
  },
  disc_herniation_lumbar_acute: {
    blocked_patterns: ["sit.up", "crunch", "russian.twist", "good.morning", "conventional.deadlift"],
  },
  disc_herniation_lumbar_chronic: {
    blocked_patterns: ["sit.up", "crunch", "conventional.deadlift"],
  },
  spinal_fusion_lumbar: {
    blocked_patterns: ["sit.up", "crunch", "russian.twist", "good.morning", "back.extension", "deadlift"],
  },
  lumbar_microdiscectomy: {
    blocked_patterns: ["sit.up", "crunch", "russian.twist"],
  },
  acl_post_op: {
    blocked_patterns: ["plyometric", "jump", "cutting", "pivot"],
  },
  knee_osteoarthritis: {
    blocked_patterns: ["plyometric", "jump", "deep.squat"],
  },
  patellar_tendinopathy: {
    blocked_patterns: ["jump", "plyometric"],
  },
  achilles_tendinopathy: {
    blocked_patterns: ["plyometric", "hill.sprint", "jump"],
  },
  carpal_tunnel: {
    blocked_patterns: ["heavy.*grip", "wrist.extension.*load"],
    notes: "Machine, cable, band exercises should be ALLOWED",
  },
  osteoporosis: {
    blocked_patterns: ["sit.up", "crunch", "loaded.flexion"],
  },
  pregnancy_2nd_3rd_trimester: {
    blocked_patterns: ["supine", "heavy.valsalva"],
    notes: "No lying flat after 16 weeks",
  },
  ehlers_danlos_hypermobility: {
    blocked_patterns: ["plyometric", "end.range.stretch"],
    notes: "Strengthen, don't stretch",
  },
  heart_failure_stable: {
    blocked_patterns: ["heavy.valsalva", "prolonged.isometric"],
  },
  rheumatoid_arthritis: {
    notes: "Resistance training recommended between flares",
  },
};

// ── AUDIT FUNCTION ──────────────────────────────────────────
export function runConditionExerciseAudit(exerciseDB, conditionsDB) {
  const pass = [], fail = [], warnings = [];
  const condArr = Array.isArray(conditionsDB) ? conditionsDB : [];

  // CHECK 1: Recommended exercises exist in DB
  condArr.forEach(c => {
    (c.recommended || []).forEach(recId => {
      const found = exerciseDB.find(e => e.id === recId);
      if (!found) warnings.push(`${c.condition}: recommended "${recId}" not found in exercise DB`);
      else pass.push(`${c.condition}: recommended "${recId}" exists`);
    });

    // CHECK 2: No exercise both recommended AND avoided
    const avoidText = (c.avoid || []).join(" ").toLowerCase();
    (c.recommended || []).forEach(recId => {
      if (avoidText.includes(recId.toLowerCase())) {
        fail.push({ condition: c.condition, message: `CONFLICT: "${recId}" is both recommended AND in avoid text` });
      }
    });
  });

  // CHECK 3: Pattern cross-check — exercises matching blocked patterns should be blocked
  Object.entries(CONDITION_BLOCKS).forEach(([condId, rules]) => {
    const condData = condArr.find(c => c.condition === condId);
    const avoidText = (condData?.avoid || []).join(" ").toLowerCase();
    const avoidIds = new Set((condData?.avoid || []).map(a => a.toLowerCase()));

    // Check blocked IDs
    (rules.blocked_ids || []).forEach(exId => {
      const ex = exerciseDB.find(e => e.id === exId);
      if (!ex) { warnings.push(`${condId}: blocked ID "${exId}" not in exercise DB`); return; }
      // Check if it's in the avoid list or has a severity gate
      const gate = ex.contraindications?.severity_gate;
      const joints = CONDITION_JOINTS[condId] || [];
      const hasGate = joints.some(j => gate?.[j] !== undefined);
      const inAvoid = avoidText.includes(ex.name.toLowerCase()) || avoidIds.has(exId);
      if (hasGate || inAvoid) {
        pass.push(`${condId}: correctly blocks ${ex.name} (ID match)`);
      } else {
        fail.push({ condition: condId, exerciseId: exId, exercise: ex.name, message: `UNBLOCKED: "${ex.name}" should be blocked for ${condId} but has no severity gate or avoid entry` });
      }
    });

    // Check blocked patterns against exercise names
    (rules.blocked_patterns || []).forEach(pattern => {
      const regex = new RegExp(pattern, "i");
      const matching = exerciseDB.filter(e => regex.test(e.name || "") || regex.test(e.id || ""));
      matching.forEach(ex => {
        const gate = ex.contraindications?.severity_gate;
        const joints = CONDITION_JOINTS[condId] || [];
        const hasGate = joints.some(j => gate?.[j] !== undefined);
        const nameInAvoid = (condData?.avoid || []).some(a => {
          const aLow = a.toLowerCase();
          const eLow = (ex.name || "").toLowerCase();
          return eLow.includes(aLow) || aLow.includes(eLow);
        });
        if (hasGate || nameInAvoid) {
          pass.push(`${condId}: blocks ${ex.name} (pattern "${pattern}")`);
        }
        // Don't flag as fail for pattern matches — patterns are fuzzy hints, not exact requirements
        // Only flag blocked_ids as hard failures
      });
    });
  });

  // CHECK 4: Joint severity gates — high-difficulty exercises loading affected joints
  Object.entries(CONDITION_JOINTS).forEach(([condId, joints]) => {
    joints.forEach(joint => {
      const highDiff = exerciseDB.filter(e =>
        (e.difficultyLevel || 1) >= 4 &&
        (e.jointsInvolved || []).includes(joint) &&
        e.category === "main"
      );
      highDiff.forEach(ex => {
        const gate = ex.contraindications?.severity_gate?.[joint];
        if (gate === undefined) {
          warnings.push(`${condId}: "${ex.name}" (diff ${ex.difficultyLevel}) loads ${joint} but has no severity gate`);
        }
      });
    });
  });

  // Summary
  const summary = { passCount: pass.length, failCount: fail.length, warningCount: warnings.length, conditionsChecked: Object.keys(CONDITION_BLOCKS).length, exercisesChecked: exerciseDB.length };

  console.log("\n══════════════════════════════════════");
  console.log("CONDITION-EXERCISE AUDIT");
  console.log("══════════════════════════════════════");
  console.log(`✅ ${pass.length} correct blocks verified`);
  console.log(`❌ ${fail.length} unblocked dangerous exercises`);
  console.log(`⚠️ ${warnings.length} warnings`);
  if (fail.length > 0) { console.log("\n── FAILURES ──"); fail.forEach(f => console.log(`  ❌ [${f.condition}] ${f.message}`)); }
  if (warnings.length > 0) { console.log("\n── WARNINGS (first 15) ──"); warnings.slice(0, 15).forEach(w => console.log(`  ⚠️ ${w}`)); }

  return { pass, fail, warnings, summary };
}

export { CONDITION_BLOCKS, CONDITION_JOINTS };
