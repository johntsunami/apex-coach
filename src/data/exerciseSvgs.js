// ═══════════════════════════════════════════════════════════════
// APEX Coach — SVG Diagrams for exercises without photos
// Each shows a stick figure in the START position
// Dark theme: navy #0a1628 bg, teal #2dd4bf figure, #4a5a78 labels
// ═══════════════════════════════════════════════════════════════

const B = "#0a1628", T = "#2dd4bf", L = "#4a5a78", W = "#eab308", G = "#22c55e", R = "#ef4444", I = "#3b82f6";
const FLOOR = (y=185) => `<line x1="20" y1="${y}" x2="280" y2="${y}" stroke="${L}" stroke-width="1.5" stroke-dasharray="4"/>`;
const HEAD = (cx, cy, r=9) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${T}" stroke-width="2"/>`;
const LABEL = (text, y=14) => `<text x="150" y="${y}" text-anchor="middle" fill="${L}" font-size="9" font-weight="600">${text}</text>`;

// Helper: standing figure
const STAND = (x, headY=50) => {
  const h = headY, neck = h+12, hip = neck+40, knee = hip+35, foot = knee+35;
  return `${HEAD(x,h)}
    <line x1="${x}" y1="${neck}" x2="${x}" y2="${hip}" stroke="${T}" stroke-width="2.5"/>
    <line x1="${x}" y1="${hip}" x2="${x-8}" y2="${foot}" stroke="${T}" stroke-width="2"/>
    <line x1="${x}" y1="${hip}" x2="${x+8}" y2="${foot}" stroke="${T}" stroke-width="2"/>
    <line x1="${x}" y1="${neck+8}" x2="${x-18}" y2="${neck+25}" stroke="${T}" stroke-width="2"/>
    <line x1="${x}" y1="${neck+8}" x2="${x+18}" y2="${neck+25}" stroke="${T}" stroke-width="2"/>`;
};

// Helper: supine figure (lying on back)
const SUPINE = (y=130) => {
  return `${HEAD(60, y)}
    <line x1="68" y1="${y}" x2="220" y2="${y}" stroke="${T}" stroke-width="2.5"/>
    <line x1="220" y1="${y}" x2="250" y2="${y-20}" stroke="${T}" stroke-width="2"/>
    <line x1="250" y1="${y-20}" x2="265" y2="${y}" stroke="${T}" stroke-width="2"/>
    <line x1="80" y1="${y}" x2="65" y2="${y+15}" stroke="${T}" stroke-width="2"/>
    <line x1="80" y1="${y}" x2="95" y2="${y+15}" stroke="${T}" stroke-width="2"/>`;
};

// Helper: seated figure
const SEATED = (x=150, seatY=110) => {
  const h = seatY-60;
  return `${HEAD(x, h)}
    <line x1="${x}" y1="${h+12}" x2="${x}" y2="${seatY}" stroke="${T}" stroke-width="2.5"/>
    <line x1="${x}" y1="${seatY}" x2="${x+30}" y2="${seatY}" stroke="${T}" stroke-width="2"/>
    <line x1="${x+30}" y1="${seatY}" x2="${x+30}" y2="${seatY+40}" stroke="${T}" stroke-width="2"/>
    <rect x="${x-20}" y="${seatY}" width="40" height="5" rx="2" fill="${L}" opacity="0.5"/>`;
};

const svg = (w, h, content, name) =>
  `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><rect width="${w}" height="${h}" rx="12" fill="${B}"/>${LABEL(name)}${FLOOR(h-15)}${content}</svg>`;

const EXERCISE_SVGS = {
  // ══════════ STABILITY / MAIN ══════════
  stab_ball_squat: svg(300, 200, `
    ${HEAD(150, 45)}
    <line x1="150" y1="57" x2="150" y2="100" stroke="${T}" stroke-width="2.5"/>
    <line x1="150" y1="100" x2="140" y2="140" stroke="${T}" stroke-width="2"/>
    <line x1="140" y1="140" x2="140" y2="185" stroke="${T}" stroke-width="2"/>
    <line x1="150" y1="100" x2="160" y2="140" stroke="${T}" stroke-width="2"/>
    <line x1="160" y1="140" x2="160" y2="185" stroke="${T}" stroke-width="2"/>
    <circle cx="150" cy="80" r="20" fill="none" stroke="${W}" stroke-width="2" stroke-dasharray="4"/>
    <text x="150" y="84" text-anchor="middle" fill="${W}" font-size="8">BALL</text>
    <line x1="130" y1="80" x2="105" y2="80" stroke="${L}" stroke-width="1.5"/>
    <text x="90" y="83" text-anchor="end" fill="${L}" font-size="7">WALL</text>
    <line x1="105" y1="30" x2="105" y2="185" stroke="${L}" stroke-width="2"/>
  `, "STABILITY BALL WALL SQUAT"),

  seated_hip_abd: svg(300, 200, `
    ${SEATED(150, 110)}
    <line x1="150" y1="110" x2="120" y2="110" stroke="${T}" stroke-width="2"/>
    <line x1="120" y1="110" x2="110" y2="150" stroke="${T}" stroke-width="2"/>
    <path d="M130 108 L115 100" stroke="${W}" stroke-width="1.5" stroke-dasharray="3"/>
    <text x="100" y="95" fill="${W}" font-size="8">PUSH OUT</text>
    <text x="150" y="170" text-anchor="middle" fill="${I}" font-size="8">Band around knees</text>
  `, "SEATED HIP ABDUCTION (BAND)"),

  seated_captains_lift: svg(300, 200, `
    ${HEAD(150, 40)}
    <line x1="150" y1="52" x2="150" y2="95" stroke="${T}" stroke-width="2.5"/>
    <line x1="150" y1="70" x2="125" y2="90" stroke="${T}" stroke-width="2"/>
    <line x1="150" y1="70" x2="175" y2="90" stroke="${T}" stroke-width="2"/>
    <line x1="125" y1="90" x2="115" y2="95" stroke="${T}" stroke-width="2"/>
    <line x1="175" y1="90" x2="185" y2="95" stroke="${T}" stroke-width="2"/>
    <line x1="150" y1="95" x2="150" y2="130" stroke="${T}" stroke-width="2"/>
    <line x1="150" y1="130" x2="140" y2="160" stroke="${T}" stroke-width="2"/>
    <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">Knees to chest</text>
    <rect x="110" y="93" width="80" height="6" rx="2" fill="${L}" opacity="0.4"/>
  `, "CAPTAIN'S CHAIR LEG RAISE"),

  // ══════════ MCKENZIE / REHAB ══════════
  mck_neck_side_bend: svg(300, 200, `
    ${HEAD(150, 55)}
    <line x1="150" y1="67" x2="150" y2="120" stroke="${T}" stroke-width="2.5"/>
    <line x1="150" y1="80" x2="120" y2="100" stroke="${T}" stroke-width="2"/>
    <line x1="150" y1="80" x2="180" y2="100" stroke="${T}" stroke-width="2"/>
    <path d="M155 50 Q170 40 175 55" stroke="${W}" stroke-width="1.5" fill="none"/>
    <text x="185" y="50" fill="${W}" font-size="8">TILT</text>
    <line x1="150" y1="120" x2="140" y2="185" stroke="${T}" stroke-width="2"/>
    <line x1="150" y1="120" x2="160" y2="185" stroke="${T}" stroke-width="2"/>
  `, "SIDE BENDING (IN RETRACTION)"),

  mck_neck_rotation: svg(300, 200, `
    ${HEAD(150, 55)}
    <line x1="150" y1="67" x2="150" y2="120" stroke="${T}" stroke-width="2.5"/>
    <path d="M142 50 Q130 45 135 60" stroke="${W}" stroke-width="1.5" fill="none"/>
    <text x="115" y="45" fill="${W}" font-size="8">ROTATE</text>
    <line x1="150" y1="80" x2="120" y2="100" stroke="${T}" stroke-width="2"/>
    <line x1="150" y1="80" x2="180" y2="100" stroke="${T}" stroke-width="2"/>
    <line x1="150" y1="120" x2="140" y2="185" stroke="${T}" stroke-width="2"/>
    <line x1="150" y1="120" x2="160" y2="185" stroke="${T}" stroke-width="2"/>
    <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">Chin tucked first</text>
  `, "ROTATION IN RETRACTION"),

  mck_sh_assisted_flexion: svg(300, 200, `
    ${SUPINE(130)}
    <line x1="100" y1="130" x2="100" y2="80" stroke="${T}" stroke-width="2"/>
    <path d="M100 80 L105 60" stroke="${T}" stroke-width="2"/>
    <text x="120" y="65" fill="${W}" font-size="8">Towel assist</text>
    <line x1="105" y1="60" x2="130" y2="55" stroke="${W}" stroke-width="1" stroke-dasharray="3"/>
  `, "ACTIVE-ASSISTED FLEXION"),

  mck_sh_isometric: svg(300, 200, `
    ${STAND(150, 55)}
    <line x1="168" y1="75" x2="200" y2="75" stroke="${T}" stroke-width="2"/>
    <line x1="200" y1="60" x2="200" y2="90" stroke="${L}" stroke-width="3"/>
    <text x="215" y="78" fill="${W}" font-size="8">WALL</text>
    <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">Push into wall, hold 5-10s</text>
  `, "ISOMETRIC STRENGTHENING"),

  mck_sh_active_rom: svg(300, 200, `
    ${STAND(150, 55)}
    <path d="M168 73 Q190 50 180 35" stroke="${T}" stroke-width="2" fill="none"/>
    <path d="M175 40 L180 35 L185 42" stroke="${W}" stroke-width="1.5" fill="none"/>
    <text x="200" y="35" fill="${W}" font-size="8">Pain-free arc</text>
  `, "ACTIVE ROM (PAIN-FREE RANGE)"),

  mck_kn_prone_flex: svg(300, 200, `
    <text x="150" y="14" text-anchor="middle" fill="${L}" font-size="9" font-weight="600">PRONE KNEE FLEXION</text>
    ${HEAD(60, 130)}
    <line x1="68" y1="130" x2="240" y2="130" stroke="${T}" stroke-width="2.5"/>
    <line x1="240" y1="130" x2="240" y2="80" stroke="${T}" stroke-width="2"/>
    <path d="M240 85 L245 75" stroke="${T}" stroke-width="2"/>
    <text x="250" y="70" fill="${W}" font-size="8">Heel to butt</text>
    ${FLOOR(145)}
  `, "PRONE KNEE FLEXION"),

  mck_kn_flex_load: svg(300, 200, `
    ${SEATED(150, 110)}
    <line x1="180" y1="110" x2="190" y2="150" stroke="${T}" stroke-width="2"/>
    <line x1="190" y1="150" x2="180" y2="165" stroke="${T}" stroke-width="2"/>
    <text x="200" y="160" fill="${W}" font-size="8">Flex + load</text>
  `, "KNEE FLEXION LOADING"),

  mck_hip_abd: svg(300, 200, `
    ${HEAD(70, 80)}
    <line x1="70" y1="92" x2="70" y2="130" stroke="${T}" stroke-width="2.5"/>
    <line x1="70" y1="130" x2="70" y2="185" stroke="${T}" stroke-width="2"/>
    <line x1="70" y1="130" x2="100" y2="150" stroke="${T}" stroke-width="2"/>
    <path d="M100 150 L130 120" stroke="${T}" stroke-width="2"/>
    <path d="M115 130 L125 120 L130 130" stroke="${W}" stroke-width="1.5" fill="none"/>
    <text x="145" y="125" fill="${W}" font-size="8">LIFT</text>
    <text x="150" y="175" text-anchor="middle" fill="${I}" font-size="8">Side-lying</text>
    ${FLOOR()}
  `, "HIP ABDUCTION (SIDE-LYING)"),

  // ══════════ MOBILITY / WARMUP ══════════
  mob_90_90_hip: svg(300, 200, `
    ${HEAD(150, 40)}
    <line x1="150" y1="52" x2="150" y2="100" stroke="${T}" stroke-width="2.5"/>
    <line x1="150" y1="100" x2="110" y2="100" stroke="${T}" stroke-width="2"/>
    <line x1="110" y1="100" x2="110" y2="140" stroke="${T}" stroke-width="2"/>
    <line x1="150" y1="100" x2="190" y2="100" stroke="${T}" stroke-width="2"/>
    <line x1="190" y1="100" x2="190" y2="140" stroke="${T}" stroke-width="2"/>
    <text x="110" y="155" text-anchor="middle" fill="${W}" font-size="7">90deg</text>
    <text x="190" y="155" text-anchor="middle" fill="${W}" font-size="7">90deg</text>
    <text x="150" y="175" text-anchor="middle" fill="${I}" font-size="8">Seated on floor</text>
  `, "90/90 HIP SWITCH"),

  mob_shoulder_pass_through: svg(300, 200, `
    ${STAND(150, 45)}
    <line x1="130" y1="65" x2="90" y2="40" stroke="${T}" stroke-width="2"/>
    <line x1="170" y1="65" x2="210" y2="40" stroke="${T}" stroke-width="2"/>
    <line x1="90" y1="40" x2="210" y2="40" stroke="${W}" stroke-width="2" stroke-dasharray="4"/>
    <text x="150" y="34" text-anchor="middle" fill="${W}" font-size="8">BAND / DOWEL</text>
    <path d="M100 45 Q150 25 200 45" stroke="${W}" stroke-width="1" fill="none" stroke-dasharray="3"/>
  `, "SHOULDER PASS-THROUGHS"),

  dyn_leg_swings: svg(300, 200, `
    ${HEAD(150, 40)}
    <line x1="150" y1="52" x2="150" y2="100" stroke="${T}" stroke-width="2.5"/>
    <line x1="150" y1="100" x2="150" y2="185" stroke="${T}" stroke-width="2.5"/>
    <line x1="150" y1="100" x2="100" y2="130" stroke="${T}" stroke-width="2" stroke-dasharray="4"/>
    <line x1="150" y1="100" x2="200" y2="130" stroke="${T}" stroke-width="2" stroke-dasharray="4"/>
    <path d="M100 135 Q150 155 200 135" stroke="${W}" stroke-width="1.5" fill="none"/>
    <text x="150" y="160" text-anchor="middle" fill="${W}" font-size="8">SWING</text>
  `, "LEG SWINGS (FWD/BACK + LATERAL)"),

  dyn_carioca: svg(300, 200, `
    ${HEAD(100, 50)}
    <line x1="100" y1="62" x2="100" y2="105" stroke="${T}" stroke-width="2.5"/>
    <line x1="100" y1="105" x2="85" y2="150" stroke="${T}" stroke-width="2"/>
    <line x1="100" y1="105" x2="130" y2="140" stroke="${T}" stroke-width="2"/>
    <line x1="130" y1="140" x2="130" y2="185" stroke="${T}" stroke-width="2"/>
    <path d="M140 100 L200 100" stroke="${W}" stroke-width="1.5" marker-end="url(#arr)"/>
    <text x="170" y="92" fill="${W}" font-size="8">LATERAL</text>
    <defs><marker id="arr" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto"><path d="M0 0L6 2L0 4" fill="${W}"/></marker></defs>
    <text x="150" y="175" text-anchor="middle" fill="${I}" font-size="8">Crossover grapevine steps</text>
  `, "CARIOCA / GRAPEVINE"),

  dyn_toy_soldiers: svg(300, 200, `
    ${HEAD(150, 40)}
    <line x1="150" y1="52" x2="150" y2="100" stroke="${T}" stroke-width="2.5"/>
    <line x1="150" y1="100" x2="150" y2="185" stroke="${T}" stroke-width="2"/>
    <line x1="150" y1="100" x2="130" y2="60" stroke="${T}" stroke-width="2"/>
    <line x1="150" y1="68" x2="175" y2="55" stroke="${T}" stroke-width="2"/>
    <text x="185" y="52" fill="${W}" font-size="8">Touch toe</text>
    <text x="150" y="175" text-anchor="middle" fill="${I}" font-size="8">Straight leg kicks while walking</text>
  `, "TOY SOLDIERS"),

  // ══════════ REHAB ══════════
  rehab_hip_ir_er: svg(300, 200, `
    ${SUPINE(120)}
    <path d="M180 120 Q200 100 220 120" stroke="${W}" stroke-width="1.5" fill="none"/>
    <path d="M180 120 Q200 140 220 120" stroke="${W}" stroke-width="1.5" fill="none"/>
    <text x="200" y="90" text-anchor="middle" fill="${W}" font-size="8">IR / ER</text>
    <text x="150" y="170" text-anchor="middle" fill="${I}" font-size="8">Rotate hip in and out gently</text>
  `, "SUPINE HIP IR/ER"),

  rehab_hip_ir_stretch: svg(300, 200, `
    ${HEAD(80, 80)}
    <line x1="80" y1="92" x2="80" y2="130" stroke="${T}" stroke-width="2.5"/>
    <line x1="80" y1="130" x2="80" y2="185" stroke="${T}" stroke-width="2"/>
    <line x1="80" y1="130" x2="130" y2="150" stroke="${T}" stroke-width="2"/>
    <line x1="130" y1="150" x2="130" y2="185" stroke="${T}" stroke-width="2"/>
    <path d="M120 155 L140 170" stroke="${W}" stroke-width="1.5"/>
    <text x="155" y="170" fill="${W}" font-size="8">Rotate</text>
    <text x="150" y="175" text-anchor="middle" fill="${I}" font-size="7">Side-lying</text>
  `, "SIDE-LYING HIP IR STRETCH"),

  rehab_hip_flexor_march: svg(300, 200, `
    ${SUPINE(130)}
    <line x1="160" y1="130" x2="160" y2="85" stroke="${T}" stroke-width="2"/>
    <line x1="160" y1="85" x2="180" y2="85" stroke="${T}" stroke-width="2"/>
    <path d="M155 90 L150 75" stroke="${W}" stroke-width="1.5"/>
    <text x="140" y="70" fill="${W}" font-size="8">MARCH</text>
    <text x="150" y="170" text-anchor="middle" fill="${I}" font-size="8">Banded, alternate legs</text>
  `, "HIP FLEXOR MARCH (SUPINE)"),

  rehab_towel_scrunches: svg(300, 200, `
    <text x="150" y="14" text-anchor="middle" fill="${L}" font-size="9" font-weight="600">TOWEL SCRUNCHES</text>
    <line x1="80" y1="120" x2="220" y2="120" stroke="${L}" stroke-width="1"/>
    <rect x="80" y="120" width="140" height="4" rx="1" fill="${W}" opacity="0.3"/>
    <text x="150" y="115" text-anchor="middle" fill="${W}" font-size="8">TOWEL</text>
    <line x1="130" y1="90" x2="130" y2="120" stroke="${T}" stroke-width="3"/>
    <line x1="125" y1="120" x2="135" y2="120" stroke="${T}" stroke-width="3"/>
    <line x1="170" y1="90" x2="170" y2="120" stroke="${T}" stroke-width="3"/>
    <line x1="165" y1="120" x2="175" y2="120" stroke="${T}" stroke-width="3"/>
    <path d="M128 122 Q130 130 135 122" stroke="${W}" stroke-width="1" fill="none"/>
    <text x="150" y="150" text-anchor="middle" fill="${G}" font-size="8">Scrunch toes to pull towel</text>
  `, "TOWEL SCRUNCHES"),

  rehab_toe_yoga: svg(300, 200, `
    <text x="150" y="14" text-anchor="middle" fill="${L}" font-size="9" font-weight="600">TOE YOGA</text>
    <rect x="80" y="130" width="60" height="20" rx="4" fill="none" stroke="${T}" stroke-width="2"/>
    <line x1="100" y1="125" x2="100" y2="115" stroke="${T}" stroke-width="2.5"/>
    <text x="100" y="110" text-anchor="middle" fill="${G}" font-size="7">BIG TOE UP</text>
    <rect x="160" y="130" width="60" height="20" rx="4" fill="none" stroke="${T}" stroke-width="2"/>
    <line x1="170" y1="145" x2="170" y2="125" stroke="${T}" stroke-width="2"/>
    <line x1="180" y1="145" x2="180" y2="128" stroke="${T}" stroke-width="2"/>
    <line x1="190" y1="145" x2="190" y2="130" stroke="${T}" stroke-width="2"/>
    <line x1="200" y1="145" x2="200" y2="132" stroke="${T}" stroke-width="2"/>
    <text x="185" y="120" text-anchor="middle" fill="${W}" font-size="7">LITTLE TOES DOWN</text>
  `, "TOE YOGA"),

  rehab_tib_ant_raise: svg(300, 200, `
    ${STAND(150, 50)}
    <line x1="200" y1="40" x2="200" y2="185" stroke="${L}" stroke-width="3"/>
    <text x="215" y="110" fill="${L}" font-size="8">WALL</text>
    <path d="M148 180 L148 170" stroke="${W}" stroke-width="2"/>
    <text x="120" y="175" fill="${W}" font-size="7">TOES UP</text>
  `, "TIBIALIS ANTERIOR RAISE"),

  rehab_grip_strengthen: svg(300, 200, `
    <text x="150" y="14" text-anchor="middle" fill="${L}" font-size="9" font-weight="600">GRIP STRENGTHENING</text>
    <circle cx="150" cy="100" r="25" fill="none" stroke="${W}" stroke-width="2"/>
    <text x="150" y="104" text-anchor="middle" fill="${W}" font-size="8">BALL</text>
    <path d="M130 80 Q125 95 130 110" stroke="${T}" stroke-width="2"/>
    <path d="M140 75 Q135 95 140 115" stroke="${T}" stroke-width="2"/>
    <path d="M160 75 Q165 95 160 115" stroke="${T}" stroke-width="2"/>
    <path d="M170 80 Q175 95 170 110" stroke="${T}" stroke-width="2"/>
    <text x="150" y="160" text-anchor="middle" fill="${G}" font-size="8">Squeeze and hold 5-10s</text>
  `, "GRIP STRENGTHENING"),

  rehab_scapular_clock: svg(300, 200, `
    ${STAND(150, 50)}
    <circle cx="165" cy="70" r="25" fill="none" stroke="${W}" stroke-width="1" stroke-dasharray="4"/>
    <line x1="165" y1="45" x2="165" y2="50" stroke="${W}" stroke-width="1.5"/>
    <line x1="190" y1="70" x2="185" y2="70" stroke="${W}" stroke-width="1.5"/>
    <line x1="165" y1="95" x2="165" y2="90" stroke="${W}" stroke-width="1.5"/>
    <line x1="140" y1="70" x2="145" y2="70" stroke="${W}" stroke-width="1.5"/>
    <text x="210" y="45" fill="${W}" font-size="7">12</text>
    <text x="210" y="75" fill="${W}" font-size="7">3</text>
    <text x="210" y="100" fill="${W}" font-size="7">6</text>
  `, "SCAPULAR CLOCK"),

  rehab_cervical_snag: svg(300, 200, `
    ${HEAD(150, 55)}
    <line x1="150" y1="67" x2="150" y2="120" stroke="${T}" stroke-width="2.5"/>
    <line x1="160" y1="60" x2="200" y2="55" stroke="${W}" stroke-width="2"/>
    <text x="210" y="52" fill="${W}" font-size="7">TOWEL</text>
    <path d="M200 55 Q210 60 200 65" stroke="${W}" stroke-width="1.5" fill="none"/>
    <text x="150" y="170" text-anchor="middle" fill="${G}" font-size="8">Self-mobilization with towel</text>
  `, "CERVICAL SNAG (TOWEL)"),

  rehab_serratus_punch: svg(300, 200, `
    ${SUPINE(130)}
    <line x1="120" y1="130" x2="120" y2="70" stroke="${T}" stroke-width="2"/>
    <path d="M118 75 L122 65" stroke="${T}" stroke-width="2"/>
    <path d="M118 80 L112 70" stroke="${W}" stroke-width="1.5"/>
    <text x="100" y="60" fill="${W}" font-size="8">PUNCH UP</text>
    <text x="150" y="170" text-anchor="middle" fill="${I}" font-size="8">Reach ceiling, protract shoulder blade</text>
  `, "SERRATUS PUNCH (SUPINE)"),

  rehab_standing_hip_march: svg(300, 200, `
    ${STAND(150, 45)}
    <text x="150" y="175" text-anchor="middle" fill="${W}" font-size="8">Banded hip march</text>
  `, "STANDING HIP MARCH (BAND)"),

  // ══════════ BED / SUPINE REHAB ══════════
  bed_hip_abd_add: svg(300, 200, `
    ${SUPINE(120)}
    <path d="M200 120 Q220 100 240 120" stroke="${W}" stroke-width="1.5" fill="none"/>
    <path d="M200 120 Q220 140 240 120" stroke="${W}" stroke-width="1.5" fill="none"/>
    <text x="220" y="90" text-anchor="middle" fill="${W}" font-size="8">OPEN/CLOSE</text>
  `, "SUPINE HIP ABD/ADD"),

  bed_diaphragmatic: svg(300, 200, `
    ${SUPINE(120)}
    <ellipse cx="150" cy="115" rx="20" ry="10" fill="none" stroke="${G}" stroke-width="1.5"/>
    <path d="M150 105 L150 95" stroke="${G}" stroke-width="1.5"/>
    <text x="150" y="88" text-anchor="middle" fill="${G}" font-size="8">BELLY RISES</text>
    <text x="150" y="160" text-anchor="middle" fill="${I}" font-size="8">Breathe into belly, not chest</text>
  `, "DIAPHRAGMATIC BREATHING"),

  bed_neck_rotation: svg(300, 200, `
    ${SUPINE(120)}
    <path d="M55 115 Q50 110 55 105" stroke="${W}" stroke-width="1.5" fill="none"/>
    <text x="40" y="100" fill="${W}" font-size="8">TURN</text>
    <text x="150" y="160" text-anchor="middle" fill="${I}" font-size="8">Gentle rotation, supine</text>
  `, "GENTLE NECK ROTATION"),

  // ══════════ AQUATIC ══════════
  aqua_wall_pushup: svg(300, 200, `
    ${HEAD(150, 50)}
    <line x1="150" y1="62" x2="170" y2="100" stroke="${T}" stroke-width="2.5"/>
    <line x1="170" y1="100" x2="170" y2="185" stroke="${T}" stroke-width="2"/>
    <line x1="150" y1="72" x2="120" y2="62" stroke="${T}" stroke-width="2"/>
    <line x1="120" y1="62" x2="110" y2="80" stroke="${T}" stroke-width="2"/>
    <line x1="110" y1="60" x2="110" y2="185" stroke="${L}" stroke-width="3"/>
    <rect x="30" y="100" width="250" height="85" rx="0" fill="${I}" opacity="0.1"/>
    <text x="60" y="115" fill="${I}" font-size="8">WATER LINE</text>
  `, "POOL WALL PUSH-UP"),

  aqua_flutter_kicks: svg(300, 200, `
    ${HEAD(60, 100)}
    <line x1="68" y1="100" x2="200" y2="100" stroke="${T}" stroke-width="2.5"/>
    <line x1="200" y1="100" x2="240" y2="85" stroke="${T}" stroke-width="2"/>
    <line x1="200" y1="100" x2="240" y2="115" stroke="${T}" stroke-width="2"/>
    <path d="M230 80 L250 90" stroke="${W}" stroke-width="1.5"/>
    <rect x="30" y="95" width="250" height="90" rx="0" fill="${I}" opacity="0.1"/>
    <text x="150" y="160" text-anchor="middle" fill="${I}" font-size="8">Hold pool edge, flutter kick</text>
  `, "POOL FLUTTER KICKS"),

  aqua_arm_circles: svg(300, 200, `
    ${HEAD(150, 60)}
    <line x1="150" y1="72" x2="150" y2="130" stroke="${T}" stroke-width="2.5"/>
    <circle cx="120" cy="85" r="20" fill="none" stroke="${W}" stroke-width="1.5" stroke-dasharray="4"/>
    <circle cx="180" cy="85" r="20" fill="none" stroke="${W}" stroke-width="1.5" stroke-dasharray="4"/>
    <rect x="30" y="110" width="250" height="75" rx="0" fill="${I}" opacity="0.1"/>
    <text x="150" y="125" text-anchor="middle" fill="${I}" font-size="8">Submerged arms</text>
  `, "WATER ARM CIRCLES"),

  // ══════════ TRX ══════════
  trx_lunge: svg(300, 200, `
    ${HEAD(130, 40)}
    <line x1="130" y1="52" x2="130" y2="100" stroke="${T}" stroke-width="2.5"/>
    <line x1="130" y1="100" x2="120" y2="150" stroke="${T}" stroke-width="2"/>
    <line x1="120" y1="150" x2="120" y2="185" stroke="${T}" stroke-width="2"/>
    <line x1="130" y1="100" x2="170" y2="120" stroke="${T}" stroke-width="2"/>
    <line x1="170" y1="120" x2="200" y2="130" stroke="${T}" stroke-width="2"/>
    <line x1="200" y1="130" x2="200" y2="100" stroke="${W}" stroke-width="1.5" stroke-dasharray="3"/>
    <text x="210" y="95" fill="${W}" font-size="7">TRX</text>
    <text x="150" y="175" text-anchor="middle" fill="${I}" font-size="8">Rear foot in strap</text>
  `, "TRX LUNGE"),

  trx_pike: svg(300, 200, `
    ${HEAD(100, 60)}
    <line x1="100" y1="72" x2="130" y2="100" stroke="${T}" stroke-width="2.5"/>
    <line x1="130" y1="100" x2="200" y2="130" stroke="${T}" stroke-width="2"/>
    <line x1="100" y1="72" x2="90" y2="120" stroke="${T}" stroke-width="2"/>
    <line x1="90" y1="120" x2="90" y2="185" stroke="${T}" stroke-width="2"/>
    <line x1="200" y1="130" x2="200" y2="100" stroke="${W}" stroke-width="1.5" stroke-dasharray="3"/>
    <text x="210" y="95" fill="${W}" font-size="7">TRX</text>
    <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">Feet in straps, pike hips up</text>
  `, "TRX PIKE"),

  // ══════════ AGILITY / PES ══════════
  agil_cone_shuffle: svg(300, 200, `
    ${HEAD(150, 50)}
    <line x1="150" y1="62" x2="150" y2="105" stroke="${T}" stroke-width="2.5"/>
    <line x1="150" y1="105" x2="135" y2="150" stroke="${T}" stroke-width="2"/>
    <line x1="150" y1="105" x2="165" y2="150" stroke="${T}" stroke-width="2"/>
    <polygon points="80,180 85,165 90,180" fill="${W}"/>
    <polygon points="220,180 225,165 230,180" fill="${W}"/>
    <path d="M95 172 L215 172" stroke="${W}" stroke-width="1" stroke-dasharray="4"/>
    <text x="150" y="175" text-anchor="middle" fill="${W}" font-size="8">SHUFFLE</text>
  `, "CONE SHUFFLE DRILL"),

  agil_reaction_ball: svg(300, 200, `
    ${STAND(150, 50)}
    <circle cx="200" cy="60" r="10" fill="none" stroke="${W}" stroke-width="2"/>
    <path d="M200 70 L195 100 L210 85 L190 110" stroke="${W}" stroke-width="1" fill="none" stroke-dasharray="3"/>
    <text x="200" y="130" fill="${W}" font-size="8">Bounces randomly</text>
  `, "REACTION BALL CATCHES"),

  agil_sl_hop_stick: svg(300, 200, `
    ${HEAD(150, 35)}
    <line x1="150" y1="47" x2="150" y2="90" stroke="${T}" stroke-width="2.5"/>
    <line x1="150" y1="90" x2="150" y2="140" stroke="${T}" stroke-width="2"/>
    <line x1="150" y1="90" x2="175" y2="120" stroke="${T}" stroke-width="2" stroke-dasharray="4"/>
    <path d="M145 135 L155 120 L160 140" stroke="${W}" stroke-width="1.5" fill="none"/>
    <text x="150" y="165" text-anchor="middle" fill="${G}" font-size="8">Hop and STICK the landing</text>
  `, "SINGLE-LEG HOP & STICK"),

  agil_t_drill: svg(300, 200, `
    <text x="150" y="14" text-anchor="middle" fill="${L}" font-size="9" font-weight="600">T-DRILL</text>
    <line x1="150" y1="150" x2="150" y2="80" stroke="${W}" stroke-width="2"/>
    <line x1="80" y1="80" x2="220" y2="80" stroke="${W}" stroke-width="2"/>
    <polygon points="147,80 153,80 150,75" fill="${W}"/>
    <polygon points="80,77 80,83 75,80" fill="${W}"/>
    <polygon points="220,77 220,83 225,80" fill="${W}"/>
    <circle cx="150" cy="155" r="4" fill="${T}"/>
    <circle cx="150" cy="80" r="4" fill="${T}"/>
    <circle cx="80" cy="80" r="4" fill="${T}"/>
    <circle cx="220" cy="80" r="4" fill="${T}"/>
    <text x="150" y="170" text-anchor="middle" fill="${I}" font-size="8">Sprint fwd, shuffle L/R, backpedal</text>
  `, "T-DRILL"),

  // ══════════ CARDIO ══════════
  cardio_walking: svg(300, 200, `
    ${HEAD(120, 45)}
    <line x1="120" y1="57" x2="120" y2="100" stroke="${T}" stroke-width="2.5"/>
    <line x1="120" y1="100" x2="105" y2="150" stroke="${T}" stroke-width="2"/>
    <line x1="105" y1="150" x2="105" y2="185" stroke="${T}" stroke-width="2"/>
    <line x1="120" y1="100" x2="140" y2="145" stroke="${T}" stroke-width="2"/>
    <line x1="140" y1="145" x2="145" y2="185" stroke="${T}" stroke-width="2"/>
    <line x1="120" y1="70" x2="100" y2="90" stroke="${T}" stroke-width="2"/>
    <line x1="120" y1="70" x2="145" y2="85" stroke="${T}" stroke-width="2"/>
    <path d="M160 100 L210 100" stroke="${W}" stroke-width="1.5" marker-end="url(#arr2)"/>
    <defs><marker id="arr2" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto"><path d="M0 0L6 2L0 4" fill="${W}"/></marker></defs>
    <text x="185" y="92" fill="${W}" font-size="8">WALK</text>
  `, "WALKING (ZONE 2)"),

  cardio_incline_treadmill: svg(300, 200, `
    <text x="150" y="14" text-anchor="middle" fill="${L}" font-size="9" font-weight="600">INCLINE TREADMILL WALK</text>
    <line x1="60" y1="170" x2="240" y2="130" stroke="${L}" stroke-width="3"/>
    ${HEAD(150, 60)}
    <line x1="150" y1="72" x2="155" y2="110" stroke="${T}" stroke-width="2.5"/>
    <line x1="155" y1="110" x2="140" y2="148" stroke="${T}" stroke-width="2"/>
    <line x1="155" y1="110" x2="170" y2="148" stroke="${T}" stroke-width="2"/>
    <text x="250" y="125" fill="${W}" font-size="8">10-15%</text>
    <text x="150" y="175" text-anchor="middle" fill="${R}" font-size="8">NO handrails!</text>
  `, "INCLINE TREADMILL WALK"),

  cond_boxing_drills: svg(300, 200, `
    ${HEAD(130, 50)}
    <line x1="130" y1="62" x2="130" y2="110" stroke="${T}" stroke-width="2.5"/>
    <line x1="130" y1="75" x2="100" y2="80" stroke="${T}" stroke-width="2"/>
    <line x1="130" y1="75" x2="175" y2="70" stroke="${T}" stroke-width="2"/>
    <line x1="175" y1="70" x2="190" y2="65" stroke="${T}" stroke-width="2"/>
    <circle cx="195" cy="63" r="4" fill="none" stroke="${W}" stroke-width="1.5"/>
    <text x="150" y="145" text-anchor="middle" fill="${W}" font-size="8">Jab-Cross-Hook</text>
    <line x1="130" y1="110" x2="120" y2="160" stroke="${T}" stroke-width="2"/>
    <line x1="130" y1="110" x2="140" y2="160" stroke="${T}" stroke-width="2"/>
  `, "BOXING DRILLS"),

  cond_ub_ergometer: svg(300, 200, `
    ${SEATED(140, 110)}
    <line x1="155" y1="70" x2="190" y2="80" stroke="${T}" stroke-width="2"/>
    <circle cx="200" cy="80" r="20" fill="none" stroke="${L}" stroke-width="2"/>
    <line x1="200" y1="60" x2="200" y2="100" stroke="${L}" stroke-width="1.5"/>
    <line x1="180" y1="80" x2="220" y2="80" stroke="${L}" stroke-width="1.5"/>
    <text x="200" y="125" text-anchor="middle" fill="${W}" font-size="8">ARM BIKE</text>
  `, "UPPER BODY ERGOMETER"),

  cond_post_meal_walk: svg(300, 200, `
    ${HEAD(120, 50)}
    <line x1="120" y1="62" x2="120" y2="105" stroke="${T}" stroke-width="2.5"/>
    <line x1="120" y1="105" x2="110" y2="155" stroke="${T}" stroke-width="2"/>
    <line x1="120" y1="105" x2="135" y2="155" stroke="${T}" stroke-width="2"/>
    <text x="200" y="80" fill="${G}" font-size="9">10-15 min</text>
    <text x="200" y="95" fill="${G}" font-size="9">after meals</text>
    <text x="150" y="175" text-anchor="middle" fill="${I}" font-size="8">Improves glucose response</text>
  `, "POST-MEAL WALK"),

  outdoor_hill_sprints: svg(300, 200, `
    <text x="150" y="14" text-anchor="middle" fill="${L}" font-size="9" font-weight="600">HILL SPRINTS</text>
    <line x1="40" y1="170" x2="260" y2="60" stroke="${L}" stroke-width="3"/>
    ${HEAD(140, 65)}
    <line x1="140" y1="77" x2="145" y2="110" stroke="${T}" stroke-width="2.5"/>
    <line x1="145" y1="110" x2="130" y2="140" stroke="${T}" stroke-width="2"/>
    <line x1="145" y1="110" x2="160" y2="135" stroke="${T}" stroke-width="2"/>
    <path d="M170 90 L220 60" stroke="${W}" stroke-width="1.5" marker-end="url(#arr3)"/>
    <defs><marker id="arr3" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto"><path d="M0 0L6 2L0 4" fill="${W}"/></marker></defs>
    <text x="230" y="55" fill="${W}" font-size="8">SPRINT</text>
    <text x="150" y="185" text-anchor="middle" fill="${I}" font-size="8">30-50 yards, walk back down</text>
  `, "HILL SPRINTS"),

  pes_sprint_interval: svg(300, 200, `
    ${HEAD(100, 45)}
    <line x1="100" y1="57" x2="110" y2="95" stroke="${T}" stroke-width="2.5"/>
    <line x1="110" y1="95" x2="90" y2="140" stroke="${T}" stroke-width="2"/>
    <line x1="110" y1="95" x2="135" y2="130" stroke="${T}" stroke-width="2"/>
    <line x1="100" y1="65" x2="75" y2="80" stroke="${T}" stroke-width="2"/>
    <line x1="100" y1="65" x2="130" y2="60" stroke="${T}" stroke-width="2"/>
    <path d="M150 80 L230 80" stroke="${W}" stroke-width="2" marker-end="url(#arr4)"/>
    <defs><marker id="arr4" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto"><path d="M0 0L6 2L0 4" fill="${W}"/></marker></defs>
    <text x="190" y="72" fill="${W}" font-size="9">20m SPRINT</text>
    <text x="150" y="175" text-anchor="middle" fill="${I}" font-size="8">30s sprint / 90s walk</text>
  `, "SPRINT INTERVALS"),

  // ══════════ FOAM ROLL ══════════
  fr_peroneals: svg(300, 200, `
    <text x="150" y="14" text-anchor="middle" fill="${L}" font-size="9" font-weight="600">FOAM ROLL PERONEALS</text>
    ${HEAD(80, 80)}
    <line x1="80" y1="92" x2="80" y2="120" stroke="${T}" stroke-width="2.5"/>
    <line x1="80" y1="120" x2="200" y2="130" stroke="${T}" stroke-width="2"/>
    <ellipse cx="170" cy="135" rx="15" ry="8" fill="none" stroke="${W}" stroke-width="2"/>
    <text x="170" y="155" text-anchor="middle" fill="${W}" font-size="8">ROLLER</text>
    <text x="200" y="115" fill="${I}" font-size="7">Outer calf</text>
  `, "FOAM ROLL PERONEALS"),

  fr_feet: svg(300, 200, `
    <text x="150" y="14" text-anchor="middle" fill="${L}" font-size="9" font-weight="600">FOAM ROLL FEET</text>
    ${STAND(150, 50)}
    <circle cx="155" cy="180" r="10" fill="none" stroke="${W}" stroke-width="2"/>
    <text x="155" y="184" text-anchor="middle" fill="${W}" font-size="7">BALL</text>
    <text x="230" y="175" fill="${I}" font-size="8">Roll arch</text>
  `, "FOAM ROLL PLANTAR FASCIA"),

  // ══════════ CONDITIONS / SPECIALIZED ══════════
  cond_affected_arm_rom: svg(300, 200, `
    ${SEATED(150, 110)}
    <line x1="165" y1="70" x2="195" y2="55" stroke="${T}" stroke-width="2"/>
    <path d="M190 60 Q200 45 195 35" stroke="${W}" stroke-width="1.5" fill="none"/>
    <text x="150" y="170" text-anchor="middle" fill="${I}" font-size="8">Gentle passive movement</text>
  `, "AFFECTED ARM PASSIVE ROM"),

  cond_bilateral_arm: svg(300, 200, `
    ${SEATED(150, 110)}
    <line x1="135" y1="70" x2="110" y2="50" stroke="${T}" stroke-width="2"/>
    <line x1="165" y1="70" x2="190" y2="50" stroke="${T}" stroke-width="2"/>
    <line x1="110" y1="50" x2="150" y2="30" stroke="${W}" stroke-width="1" stroke-dasharray="3"/>
    <line x1="190" y1="50" x2="150" y2="30" stroke="${W}" stroke-width="1" stroke-dasharray="3"/>
    <text x="150" y="170" text-anchor="middle" fill="${I}" font-size="8">Mirror both arms together</text>
  `, "BILATERAL ARM TRAINING"),

  cond_pursed_lip: svg(300, 200, `
    ${HEAD(150, 60)}
    <line x1="150" y1="72" x2="150" y2="130" stroke="${T}" stroke-width="2.5"/>
    <path d="M142 65 Q138 70 142 75" stroke="${G}" stroke-width="1.5" fill="none"/>
    <path d="M158 65 Q162 70 158 75" stroke="${R}" stroke-width="1.5" fill="none"/>
    <text x="120" y="68" fill="${G}" font-size="8">IN</text>
    <text x="175" y="68" fill="${R}" font-size="8">OUT</text>
    <text x="150" y="160" text-anchor="middle" fill="${I}" font-size="8">Inhale nose, exhale pursed lips</text>
  `, "PURSED LIP BREATHING"),

  cond_clamshell_preg: svg(300, 200, `
    ${HEAD(80, 80)}
    <line x1="80" y1="92" x2="80" y2="130" stroke="${T}" stroke-width="2.5"/>
    <line x1="80" y1="130" x2="130" y2="130" stroke="${T}" stroke-width="2"/>
    <line x1="130" y1="130" x2="130" y2="160" stroke="${T}" stroke-width="2"/>
    <line x1="80" y1="130" x2="130" y2="110" stroke="${T}" stroke-width="2" stroke-dasharray="4"/>
    <path d="M120 115 L135 105" stroke="${W}" stroke-width="1.5"/>
    <text x="145" y="105" fill="${W}" font-size="8">OPEN</text>
    <text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">Pregnancy-safe, side-lying</text>
  `, "CLAMSHELL (PREGNANCY-SAFE)"),

  cond_joint_rom_cycling: svg(300, 200, `
    <text x="150" y="14" text-anchor="middle" fill="${L}" font-size="9" font-weight="600">JOINT ROM CYCLING</text>
    <circle cx="100" cy="100" r="30" fill="none" stroke="${T}" stroke-width="2" stroke-dasharray="6"/>
    <circle cx="200" cy="100" r="30" fill="none" stroke="${T}" stroke-width="2" stroke-dasharray="6"/>
    <path d="M85 80 L80 72" stroke="${W}" stroke-width="1.5"/>
    <path d="M215 80 L220 72" stroke="${W}" stroke-width="1.5"/>
    <text x="100" y="145" text-anchor="middle" fill="${I}" font-size="7">Shoulder</text>
    <text x="200" y="145" text-anchor="middle" fill="${I}" font-size="7">Hip/Knee</text>
    <text x="150" y="170" text-anchor="middle" fill="${G}" font-size="8">Gentle circles through range</text>
  `, "JOINT ROM CYCLING"),

  cond_iso_quad_set: svg(300, 200, `
    ${SUPINE(120)}
    <rect x="180" y="115" width="40" height="10" rx="3" fill="none" stroke="${W}" stroke-width="1.5"/>
    <text x="200" y="113" text-anchor="middle" fill="${W}" font-size="7">TOWEL</text>
    <path d="M195 115 L195 105" stroke="${G}" stroke-width="1.5"/>
    <text x="195" y="100" text-anchor="middle" fill="${G}" font-size="7">PRESS</text>
    <text x="150" y="165" text-anchor="middle" fill="${I}" font-size="8">Push knee into towel, hold 5-10s</text>
  `, "ISOMETRIC QUAD SET"),

  // ══════════ YOGA ══════════
  yoga_seated_eagle_arms: svg(300, 200, `
    ${SEATED(150, 120)}
    <line x1="140" y1="80" x2="140" y2="60" stroke="${T}" stroke-width="2"/>
    <line x1="160" y1="80" x2="160" y2="60" stroke="${T}" stroke-width="2"/>
    <path d="M140 65 Q150 55 160 65" stroke="${W}" stroke-width="1.5" fill="none"/>
    <text x="150" y="50" text-anchor="middle" fill="${W}" font-size="8">WRAP</text>
  `, "SEATED EAGLE ARMS"),

  yoga_legs_wall: svg(300, 200, `
    ${HEAD(80, 170)}
    <line x1="80" y1="158" x2="80" y2="120" stroke="${T}" stroke-width="2.5"/>
    <line x1="80" y1="120" x2="110" y2="120" stroke="${T}" stroke-width="2"/>
    <line x1="110" y1="120" x2="110" y2="40" stroke="${T}" stroke-width="2"/>
    <line x1="115" y1="120" x2="115" y2="40" stroke="${T}" stroke-width="2"/>
    <line x1="120" y1="30" x2="120" y2="185" stroke="${L}" stroke-width="3"/>
    <text x="130" y="100" fill="${L}" font-size="8">WALL</text>
  `, "LEGS UP THE WALL"),

  yoga_savasana: svg(300, 200, `
    ${HEAD(60, 100)}
    <line x1="68" y1="100" x2="240" y2="100" stroke="${T}" stroke-width="2.5"/>
    <line x1="80" y1="100" x2="65" y2="120" stroke="${T}" stroke-width="2"/>
    <line x1="80" y1="100" x2="95" y2="120" stroke="${T}" stroke-width="2"/>
    <line x1="220" y1="100" x2="240" y2="120" stroke="${T}" stroke-width="2"/>
    <line x1="220" y1="100" x2="200" y2="120" stroke="${T}" stroke-width="2"/>
    <text x="150" y="80" text-anchor="middle" fill="${G}" font-size="9">Complete relaxation</text>
    <text x="150" y="150" text-anchor="middle" fill="${I}" font-size="8">5-10 minutes, eyes closed</text>
  `, "SAVASANA (CORPSE POSE)"),

  yoga_crow: svg(300, 200, `
    ${HEAD(150, 60)}
    <line x1="150" y1="72" x2="150" y2="100" stroke="${T}" stroke-width="2.5"/>
    <line x1="150" y1="80" x2="130" y2="120" stroke="${T}" stroke-width="2"/>
    <line x1="130" y1="120" x2="130" y2="185" stroke="${T}" stroke-width="2"/>
    <line x1="150" y1="80" x2="170" y2="120" stroke="${T}" stroke-width="2"/>
    <line x1="170" y1="120" x2="170" y2="185" stroke="${T}" stroke-width="2"/>
    <line x1="150" y1="100" x2="120" y2="95" stroke="${T}" stroke-width="2"/>
    <line x1="150" y1="100" x2="180" y2="95" stroke="${T}" stroke-width="2"/>
    <text x="150" y="145" text-anchor="middle" fill="${W}" font-size="8">Knees on triceps</text>
  `, "CROW POSE"),

  yoga_wheel: svg(300, 200, `
    <text x="150" y="14" text-anchor="middle" fill="${L}" font-size="9" font-weight="600">WHEEL POSE (FULL BACKBEND)</text>
    <path d="M80 160 Q150 40 220 160" stroke="${T}" stroke-width="2.5" fill="none"/>
    <line x1="80" y1="160" x2="80" y2="185" stroke="${T}" stroke-width="2"/>
    <line x1="220" y1="160" x2="220" y2="185" stroke="${T}" stroke-width="2"/>
    ${HEAD(150, 90)}
  `, "WHEEL POSE"),

  yoga_headstand_prep: svg(300, 200, `
    <text x="150" y="14" text-anchor="middle" fill="${L}" font-size="9" font-weight="600">HEADSTAND PREP (WALL)</text>
    ${HEAD(150, 170)}
    <line x1="150" y1="158" x2="150" y2="110" stroke="${T}" stroke-width="2.5"/>
    <line x1="150" y1="110" x2="130" y2="80" stroke="${T}" stroke-width="2"/>
    <line x1="150" y1="110" x2="170" y2="80" stroke="${T}" stroke-width="2"/>
    <line x1="140" y1="165" x2="120" y2="170" stroke="${T}" stroke-width="2"/>
    <line x1="160" y1="165" x2="180" y2="170" stroke="${T}" stroke-width="2"/>
    <line x1="200" y1="30" x2="200" y2="185" stroke="${L}" stroke-width="3"/>
    <text x="215" y="100" fill="${L}" font-size="8">WALL</text>
  `, "HEADSTAND PREP"),

  yoga_dancer: svg(300, 200, `
    ${HEAD(140, 40)}
    <line x1="140" y1="52" x2="140" y2="100" stroke="${T}" stroke-width="2.5"/>
    <line x1="140" y1="100" x2="140" y2="185" stroke="${T}" stroke-width="2.5"/>
    <line x1="140" y1="100" x2="180" y2="80" stroke="${T}" stroke-width="2"/>
    <line x1="180" y1="80" x2="200" y2="60" stroke="${T}" stroke-width="2"/>
    <line x1="140" y1="65" x2="175" y2="55" stroke="${T}" stroke-width="2"/>
    <text x="210" y="55" fill="${W}" font-size="8">Grab foot</text>
  `, "DANCER'S POSE"),

  cond_restorative_yoga: svg(300, 200, `
    ${SUPINE(120)}
    <rect x="140" y="105" width="50" height="12" rx="3" fill="${L}" opacity="0.4"/>
    <text x="165" y="113" text-anchor="middle" fill="${L}" font-size="6">BOLSTER</text>
    <text x="150" y="160" text-anchor="middle" fill="${G}" font-size="9">Supported, gentle holds</text>
    <text x="150" y="175" text-anchor="middle" fill="${I}" font-size="8">5-10 min per pose</text>
  `, "RESTORATIVE YOGA"),

  // ══════════ PES / POWER ══════════
  pes_depth_jump: svg(300, 200, `
    <text x="150" y="14" text-anchor="middle" fill="${L}" font-size="9" font-weight="600">DEPTH JUMP</text>
    <rect x="40" y="120" width="60" height="65" rx="3" fill="${L}" opacity="0.4"/>
    <text x="70" y="155" text-anchor="middle" fill="${L}" font-size="7">BOX</text>
    ${HEAD(170, 55)}
    <line x1="170" y1="67" x2="170" y2="110" stroke="${T}" stroke-width="2.5"/>
    <line x1="170" y1="110" x2="160" y2="155" stroke="${T}" stroke-width="2"/>
    <line x1="170" y1="110" x2="180" y2="155" stroke="${T}" stroke-width="2"/>
    <path d="M100 115 Q135 80 170 110" stroke="${W}" stroke-width="1.5" fill="none" stroke-dasharray="4"/>
    <text x="135" y="80" fill="${W}" font-size="7">DROP</text>
    <path d="M175 100 L190 70" stroke="${W}" stroke-width="1.5"/>
    <text x="200" y="65" fill="${W}" font-size="7">JUMP</text>
  `, "DEPTH JUMP"),

  pes_lateral_bound: svg(300, 200, `
    ${HEAD(100, 50)}
    <line x1="100" y1="62" x2="100" y2="100" stroke="${T}" stroke-width="2.5"/>
    <line x1="100" y1="100" x2="85" y2="145" stroke="${T}" stroke-width="2"/>
    <line x1="100" y1="100" x2="120" y2="140" stroke="${T}" stroke-width="2" stroke-dasharray="4"/>
    <path d="M130 90 L200 70" stroke="${W}" stroke-width="1.5" marker-end="url(#arr5)"/>
    <defs><marker id="arr5" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto"><path d="M0 0L6 2L0 4" fill="${W}"/></marker></defs>
    <text x="170" y="60" fill="${W}" font-size="8">BOUND</text>
    <text x="150" y="175" text-anchor="middle" fill="${I}" font-size="8">Single-leg lateral leap & stick</text>
  `, "LATERAL BOUND"),

  pes_shuttle_run: svg(300, 200, `
    <text x="150" y="14" text-anchor="middle" fill="${L}" font-size="9" font-weight="600">SHUTTLE RUN (5-10-5)</text>
    <line x1="60" y1="100" x2="240" y2="100" stroke="${L}" stroke-width="1" stroke-dasharray="4"/>
    <line x1="60" y1="90" x2="60" y2="110" stroke="${W}" stroke-width="2"/>
    <line x1="150" y1="90" x2="150" y2="110" stroke="${W}" stroke-width="2"/>
    <line x1="240" y1="90" x2="240" y2="110" stroke="${W}" stroke-width="2"/>
    <text x="60" y="80" text-anchor="middle" fill="${W}" font-size="8">5yd</text>
    <text x="150" y="80" text-anchor="middle" fill="${T}" font-size="8">START</text>
    <text x="240" y="80" text-anchor="middle" fill="${W}" font-size="8">10yd</text>
    <path d="M150 105 L70 105" stroke="${W}" stroke-width="1" marker-end="url(#arr6)"/>
    <path d="M70 110 L240 110" stroke="${W}" stroke-width="1" marker-end="url(#arr6)"/>
    <defs><marker id="arr6" markerWidth="5" markerHeight="4" refX="4" refY="2" orient="auto"><path d="M0 0L5 2L0 4" fill="${W}"/></marker></defs>
  `, "SHUTTLE RUN"),

  pes_squat_jump: svg(300, 200, `
    ${HEAD(150, 40)}
    <line x1="150" y1="52" x2="150" y2="90" stroke="${T}" stroke-width="2.5"/>
    <line x1="150" y1="90" x2="140" y2="130" stroke="${T}" stroke-width="2"/>
    <line x1="140" y1="130" x2="140" y2="160" stroke="${T}" stroke-width="2"/>
    <line x1="150" y1="90" x2="160" y2="130" stroke="${T}" stroke-width="2"/>
    <line x1="160" y1="130" x2="160" y2="160" stroke="${T}" stroke-width="2"/>
    <path d="M145 155 L150 140 L155 155" stroke="${W}" stroke-width="1.5" fill="none"/>
    <text x="150" y="178" text-anchor="middle" fill="${W}" font-size="8">EXPLODE UP</text>
  `, "SQUAT JUMP"),

  pes_med_ball_overhead: svg(300, 200, `
    ${HEAD(150, 50)}
    <line x1="150" y1="62" x2="150" y2="110" stroke="${T}" stroke-width="2.5"/>
    <line x1="140" y1="65" x2="140" y2="40" stroke="${T}" stroke-width="2"/>
    <line x1="160" y1="65" x2="160" y2="40" stroke="${T}" stroke-width="2"/>
    <circle cx="150" cy="35" r="10" fill="none" stroke="${W}" stroke-width="2"/>
    <text x="150" y="39" text-anchor="middle" fill="${W}" font-size="7">MB</text>
    <path d="M150 25 L150 18" stroke="${W}" stroke-width="1.5" marker-end="url(#arr7)"/>
    <defs><marker id="arr7" markerWidth="5" markerHeight="4" refX="4" refY="2" orient="auto"><path d="M0 0L5 2L0 4" fill="${W}"/></marker></defs>
    <line x1="150" y1="110" x2="140" y2="160" stroke="${T}" stroke-width="2"/>
    <line x1="150" y1="110" x2="160" y2="160" stroke="${T}" stroke-width="2"/>
  `, "MED BALL OVERHEAD THROW"),

  // Agility ladder
  pes_agil_in_out: svg(300, 200, `<text x="150" y="14" text-anchor="middle" fill="${L}" font-size="9" font-weight="600">LADDER IN-OUT</text><rect x="120" y="30" width="60" height="150" fill="none" stroke="${L}" stroke-width="1.5"/>${[0,1,2,3,4].map(i=>`<line x1="120" y1="${50+i*30}" x2="180" y2="${50+i*30}" stroke="${L}" stroke-width="1"/>`).join("")}<circle cx="150" cy="45" r="4" fill="${T}"/><circle cx="100" cy="75" r="4" fill="${T}" opacity="0.5"/><circle cx="150" cy="105" r="4" fill="${T}"/><path d="M150 49 L100 71 L150 101" stroke="${W}" stroke-width="1" fill="none" stroke-dasharray="3"/>`, "LADDER IN-OUT"),

  pes_agil_lateral: svg(300, 200, `<text x="150" y="14" text-anchor="middle" fill="${L}" font-size="9" font-weight="600">LADDER LATERAL SHUFFLE</text><rect x="120" y="30" width="60" height="150" fill="none" stroke="${L}" stroke-width="1.5"/>${[0,1,2,3,4].map(i=>`<line x1="120" y1="${50+i*30}" x2="180" y2="${50+i*30}" stroke="${L}" stroke-width="1"/>`).join("")}<path d="M90 40 L150 40 L90 70 L150 70 L90 100" stroke="${W}" stroke-width="1.5" fill="none"/>`, "LADDER LATERAL SHUFFLE"),

  pes_agil_icky: svg(300, 200, `<text x="150" y="14" text-anchor="middle" fill="${L}" font-size="9" font-weight="600">LADDER ICKY SHUFFLE</text><rect x="120" y="30" width="60" height="150" fill="none" stroke="${L}" stroke-width="1.5"/>${[0,1,2,3,4].map(i=>`<line x1="120" y1="${50+i*30}" x2="180" y2="${50+i*30}" stroke="${L}" stroke-width="1"/>`).join("")}<path d="M100 35 L150 55 L200 35 L150 75 L100 55 L150 95" stroke="${W}" stroke-width="1.5" fill="none"/>`, "LADDER ICKY SHUFFLE"),

  pes_agil_crossover: svg(300, 200, `<text x="150" y="14" text-anchor="middle" fill="${L}" font-size="9" font-weight="600">LADDER CROSSOVER</text><rect x="120" y="30" width="60" height="150" fill="none" stroke="${L}" stroke-width="1.5"/>${[0,1,2,3,4].map(i=>`<line x1="120" y1="${50+i*30}" x2="180" y2="${50+i*30}" stroke="${L}" stroke-width="1"/>`).join("")}<path d="M100 40 L160 60 L100 80 L160 100" stroke="${W}" stroke-width="1.5" fill="none"/>`, "LADDER CROSSOVER"),

  pes_cone_5_10_5: svg(300, 200, `<text x="150" y="14" text-anchor="middle" fill="${L}" font-size="9" font-weight="600">PRO AGILITY (5-10-5)</text><polygon points="60,155 65,140 70,155" fill="${W}"/><polygon points="145,155 150,140 155,155" fill="${W}"/><polygon points="230,155 235,140 240,155" fill="${W}"/><line x1="70" y1="148" x2="230" y2="148" stroke="${L}" stroke-width="1" stroke-dasharray="4"/><path d="M150 145 L70 145" stroke="${T}" stroke-width="1.5" marker-end="url(#arr8)"/><path d="M70 150 L235 150" stroke="${T}" stroke-width="1.5" marker-end="url(#arr8)"/><path d="M235 155 L150 155" stroke="${T}" stroke-width="1.5" marker-end="url(#arr8)"/><defs><marker id="arr8" markerWidth="5" markerHeight="4" refX="4" refY="2" orient="auto"><path d="M0 0L5 2L0 4" fill="${T}"/></marker></defs>`, "PRO AGILITY"),

  pes_cone_l_drill: svg(300, 200, `<text x="150" y="14" text-anchor="middle" fill="${L}" font-size="9" font-weight="600">L-DRILL (CONE)</text><polygon points="80,155 85,140 90,155" fill="${W}"/><polygon points="80,75 85,60 90,75" fill="${W}"/><polygon points="200,155 205,140 210,155" fill="${W}"/><line x1="85" y1="150" x2="85" y2="70" stroke="${T}" stroke-width="1.5"/><line x1="85" y1="150" x2="205" y2="150" stroke="${T}" stroke-width="1.5"/><path d="M90 148 L200 148" stroke="${W}" stroke-width="1" stroke-dasharray="3"/>`, "L-DRILL (CONE)"),

  grip_plate_pinch: svg(300, 200, `
    <text x="150" y="14" text-anchor="middle" fill="${L}" font-size="9" font-weight="600">PLATE PINCH HOLD</text>
    ${STAND(150, 50)}
    <rect x="135" y="120" width="8" height="40" rx="2" fill="${W}" opacity="0.6"/>
    <rect x="157" y="120" width="8" height="40" rx="2" fill="${W}" opacity="0.6"/>
    <path d="M133 130 Q130 140 133 150" stroke="${T}" stroke-width="2"/>
    <path d="M167 130 Q170 140 167 150" stroke="${T}" stroke-width="2"/>
    <text x="150" y="175" text-anchor="middle" fill="${I}" font-size="8">Pinch plates together, hold</text>
  `, "PLATE PINCH HOLD"),

  // ══════════ NASM EXPANSION — Stability Ball ══════════
  stab_ball_pushup: svg(300,200,`${HEAD(150,60)}<line x1="150" y1="72" x2="150" y2="120" stroke="${T}" stroke-width="2.5"/><line x1="150" y1="120" x2="200" y2="160" stroke="${T}" stroke-width="2"/><line x1="150" y1="120" x2="100" y2="160" stroke="${T}" stroke-width="2"/><line x1="140" y1="75" x2="115" y2="100" stroke="${T}" stroke-width="2"/><line x1="160" y1="75" x2="185" y2="100" stroke="${T}" stroke-width="2"/><ellipse cx="150" cy="100" rx="22" ry="14" fill="none" stroke="${W}" stroke-width="2"/><text x="150" y="104" text-anchor="middle" fill="${W}" font-size="7">BALL</text>`,"STABILITY BALL PUSH-UP"),
  stab_ball_row: svg(300,200,`${HEAD(100,70)}<line x1="100" y1="82" x2="180" y2="95" stroke="${T}" stroke-width="2.5"/><line x1="180" y1="95" x2="220" y2="130" stroke="${T}" stroke-width="2"/><ellipse cx="150" cy="105" rx="25" ry="15" fill="none" stroke="${W}" stroke-width="2"/><line x1="100" y1="82" x2="75" y2="120" stroke="${T}" stroke-width="2"/><path d="M72 115 L68 130" stroke="${T}" stroke-width="1.5"/><text x="60" y="135" fill="${W}" font-size="7">DB</text><text x="150" y="175" text-anchor="middle" fill="${I}" font-size="8">Chest on ball, row up</text>`,"STAB BALL DB ROW"),
  stab_ball_back_ext: svg(300,200,`${HEAD(100,65)}<line x1="100" y1="77" x2="170" y2="100" stroke="${T}" stroke-width="2.5"/><line x1="170" y1="100" x2="230" y2="130" stroke="${T}" stroke-width="2"/><ellipse cx="145" cy="110" rx="28" ry="16" fill="none" stroke="${W}" stroke-width="2"/><path d="M95 62 L90 50" stroke="${W}" stroke-width="1.5"/><text x="80" y="48" fill="${W}" font-size="7">EXTEND</text>`,"STAB BALL BACK EXTENSION"),
  stab_ball_ham_curl: svg(300,200,`${SUPINE(120)}<ellipse cx="220" cy="115" rx="20" ry="12" fill="none" stroke="${W}" stroke-width="2"/><text x="220" y="119" text-anchor="middle" fill="${W}" font-size="6">BALL</text><path d="M220 108 L200 105" stroke="${T}" stroke-width="2"/><text x="150" y="170" text-anchor="middle" fill="${G}" font-size="8">Curl ball toward glutes</text>`,"STAB BALL HAM CURL"),
  stab_ball_russian_twist: svg(300,200,`${HEAD(150,50)}<line x1="150" y1="62" x2="150" y2="100" stroke="${T}" stroke-width="2.5"/><ellipse cx="150" cy="108" rx="25" ry="14" fill="none" stroke="${W}" stroke-width="2"/><line x1="150" y1="72" x2="115" y2="60" stroke="${T}" stroke-width="2"/><line x1="150" y1="72" x2="185" y2="60" stroke="${T}" stroke-width="2"/><path d="M110 55 Q150 45 190 55" stroke="${W}" stroke-width="1.5" fill="none" stroke-dasharray="3"/><text x="150" y="170" text-anchor="middle" fill="${W}" font-size="8">Rotate torso side to side</text>`,"STAB BALL RUSSIAN TWIST"),
  stab_ball_plank: svg(300,200,`${HEAD(100,80)}<line x1="100" y1="92" x2="230" y2="92" stroke="${T}" stroke-width="2.5"/><line x1="230" y1="92" x2="240" y2="140" stroke="${T}" stroke-width="2"/><line x1="230" y1="92" x2="220" y2="140" stroke="${T}" stroke-width="2"/><ellipse cx="115" cy="100" rx="22" ry="12" fill="none" stroke="${W}" stroke-width="2"/><text x="115" y="104" text-anchor="middle" fill="${W}" font-size="6">BALL</text><text x="160" y="75" text-anchor="middle" fill="${G}" font-size="8">Forearms on ball</text>`,"STAB BALL PLANK"),
  stab_ball_ytw: svg(300,200,`${HEAD(80,70)}<line x1="80" y1="82" x2="160" y2="95" stroke="${T}" stroke-width="2.5"/><ellipse cx="120" cy="100" rx="25" ry="14" fill="none" stroke="${W}" stroke-width="2"/><line x1="80" y1="82" x2="50" y2="50" stroke="${T}" stroke-width="2"/><line x1="80" y1="82" x2="110" y2="50" stroke="${T}" stroke-width="2"/><text x="50" y="45" fill="${W}" font-size="9">Y</text><text x="110" y="45" fill="${I}" font-size="9">T</text><text x="80" y="45" fill="${G}" font-size="9">W</text>`,"STAB BALL Y-T-W RAISES"),
  stab_ball_fly: svg(300,200,`${HEAD(150,50)}<line x1="150" y1="62" x2="150" y2="95" stroke="${T}" stroke-width="2.5"/><ellipse cx="150" cy="100" rx="25" ry="14" fill="none" stroke="${W}" stroke-width="2"/><line x1="140" y1="70" x2="100" y2="55" stroke="${T}" stroke-width="2"/><line x1="160" y1="70" x2="200" y2="55" stroke="${T}" stroke-width="2"/><path d="M105 60 Q150 40 195 60" stroke="${W}" stroke-width="1" fill="none" stroke-dasharray="3"/><text x="150" y="170" text-anchor="middle" fill="${I}" font-size="8">Fly motion on ball</text>`,"STAB BALL DB FLY"),
  stab_ball_tri_ext: svg(300,200,`${HEAD(150,45)}<line x1="150" y1="57" x2="150" y2="95" stroke="${T}" stroke-width="2.5"/><ellipse cx="150" cy="102" rx="22" ry="12" fill="none" stroke="${W}" stroke-width="2"/><line x1="145" y1="55" x2="140" y2="30" stroke="${T}" stroke-width="2"/><line x1="155" y1="55" x2="160" y2="30" stroke="${T}" stroke-width="2"/><rect x="138" y="25" width="24" height="8" rx="3" fill="${L}" opacity="0.5"/><text x="150" y="170" text-anchor="middle" fill="${I}" font-size="8">Overhead extension seated on ball</text>`,"STAB BALL TRICEP EXT"),
  stab_ball_reverse_hyper: svg(300,200,`${HEAD(80,90)}<line x1="80" y1="102" x2="160" y2="110" stroke="${T}" stroke-width="2.5"/><ellipse cx="130" cy="115" rx="25" ry="14" fill="none" stroke="${W}" stroke-width="2"/><line x1="160" y1="110" x2="200" y2="90" stroke="${T}" stroke-width="2"/><line x1="200" y1="90" x2="230" y2="85" stroke="${T}" stroke-width="2"/><path d="M215 82 L225 75" stroke="${W}" stroke-width="1.5"/><text x="240" y="78" fill="${W}" font-size="7">LIFT</text>`,"STAB BALL REV HYPER"),

  // ══════════ BOSU ══════════
  bosu_pushup: svg(300,200,`${HEAD(150,55)}<line x1="150" y1="67" x2="150" y2="110" stroke="${T}" stroke-width="2.5"/><line x1="150" y1="110" x2="200" y2="155" stroke="${T}" stroke-width="2"/><line x1="150" y1="110" x2="100" y2="155" stroke="${T}" stroke-width="2"/><line x1="140" y1="72" x2="115" y2="95" stroke="${T}" stroke-width="2"/><line x1="160" y1="72" x2="185" y2="95" stroke="${T}" stroke-width="2"/><path d="M110 100 Q150 85 190 100" stroke="${W}" stroke-width="2.5" fill="none"/><line x1="110" y1="100" x2="190" y2="100" stroke="${W}" stroke-width="1.5"/>`,"BOSU PUSH-UP"),
  bosu_reverse_lunge: svg(300,200,`${STAND(130,45)}<path d="M100 170 Q130 155 160 170" stroke="${W}" stroke-width="2.5" fill="none"/><line x1="100" y1="170" x2="160" y2="170" stroke="${W}" stroke-width="1.5"/><line x1="145" y1="130" x2="190" y2="160" stroke="${T}" stroke-width="2" stroke-dasharray="4"/><text x="200" y="155" fill="${W}" font-size="7">STEP BACK</text>`,"BOSU REVERSE LUNGE"),
  bosu_plank: svg(300,200,`${HEAD(100,75)}<line x1="100" y1="87" x2="230" y2="87" stroke="${T}" stroke-width="2.5"/><line x1="230" y1="87" x2="240" y2="135" stroke="${T}" stroke-width="2"/><line x1="230" y1="87" x2="220" y2="135" stroke="${T}" stroke-width="2"/><path d="M80 98 Q110 85 140 98" stroke="${W}" stroke-width="2.5" fill="none"/><line x1="80" y1="98" x2="140" y2="98" stroke="${W}" stroke-width="1.5"/><text x="110" y="112" text-anchor="middle" fill="${W}" font-size="7">BOSU</text>`,"BOSU PLANK"),
  bosu_sl_rdl: svg(300,200,`${HEAD(140,40)}<line x1="140" y1="52" x2="155" y2="100" stroke="${T}" stroke-width="2.5"/><line x1="155" y1="100" x2="155" y2="155" stroke="${T}" stroke-width="2"/><line x1="155" y1="100" x2="200" y2="80" stroke="${T}" stroke-width="2" stroke-dasharray="4"/><path d="M130 160 Q155 145 180 160" stroke="${W}" stroke-width="2.5" fill="none"/><line x1="130" y1="160" x2="180" y2="160" stroke="${W}" stroke-width="1.5"/>`,"BOSU SL RDL"),

  // ══════════ Single-Leg ══════════
  sl_squat_box: svg(300,200,`${HEAD(130,40)}<line x1="130" y1="52" x2="130" y2="95" stroke="${T}" stroke-width="2.5"/><line x1="130" y1="95" x2="120" y2="140" stroke="${T}" stroke-width="2"/><line x1="120" y1="140" x2="120" y2="175" stroke="${T}" stroke-width="2"/><line x1="130" y1="95" x2="165" y2="115" stroke="${T}" stroke-width="2" stroke-dasharray="4"/><rect x="100" y="140" width="60" height="30" rx="3" fill="${L}" opacity="0.4"/><text x="130" y="160" text-anchor="middle" fill="${L}" font-size="7">BOX</text>`,"SL SQUAT TO BOX"),
  sl_rdl_bw: svg(300,200,`${HEAD(130,45)}<line x1="130" y1="57" x2="145" y2="100" stroke="${T}" stroke-width="2.5"/><line x1="145" y1="100" x2="145" y2="175" stroke="${T}" stroke-width="2"/><line x1="145" y1="100" x2="210" y2="75" stroke="${T}" stroke-width="2" stroke-dasharray="4"/><line x1="130" y1="60" x2="110" y2="90" stroke="${T}" stroke-width="2"/><text x="220" y="72" fill="${W}" font-size="7">LEG BACK</text>`,"SL RDL (BODYWEIGHT)"),
  sl_rdl_db: svg(300,200,`${HEAD(130,45)}<line x1="130" y1="57" x2="145" y2="100" stroke="${T}" stroke-width="2.5"/><line x1="145" y1="100" x2="145" y2="175" stroke="${T}" stroke-width="2"/><line x1="145" y1="100" x2="210" y2="75" stroke="${T}" stroke-width="2" stroke-dasharray="4"/><line x1="130" y1="62" x2="115" y2="95" stroke="${T}" stroke-width="2"/><rect x="110" y="95" width="8" height="15" rx="2" fill="${W}" opacity="0.6"/><text x="105" y="120" fill="${W}" font-size="7">DB</text>`,"SL RDL (DUMBBELL)"),
  sl_cable_row: svg(300,200,`${HEAD(170,50)}<line x1="170" y1="62" x2="170" y2="110" stroke="${T}" stroke-width="2.5"/><line x1="170" y1="110" x2="170" y2="175" stroke="${T}" stroke-width="2"/><line x1="170" y1="110" x2="195" y2="130" stroke="${T}" stroke-width="2" stroke-dasharray="4"/><line x1="170" y1="75" x2="130" y2="80" stroke="${T}" stroke-width="2"/><line x1="130" y1="80" x2="60" y2="80" stroke="${W}" stroke-width="1" stroke-dasharray="3"/><text x="55" y="75" fill="${W}" font-size="7">CABLE</text>`,"SL CABLE ROW"),
  sl_db_press: svg(300,200,`${HEAD(150,35)}<line x1="150" y1="47" x2="150" y2="95" stroke="${T}" stroke-width="2.5"/><line x1="150" y1="95" x2="150" y2="175" stroke="${T}" stroke-width="2"/><line x1="150" y1="95" x2="175" y2="115" stroke="${T}" stroke-width="2" stroke-dasharray="4"/><line x1="155" y1="55" x2="165" y2="30" stroke="${T}" stroke-width="2"/><rect x="162" y="22" width="8" height="12" rx="2" fill="${W}" opacity="0.6"/>`,"SL DB SHOULDER PRESS"),
  sl_db_curl: svg(300,200,`${HEAD(150,40)}<line x1="150" y1="52" x2="150" y2="100" stroke="${T}" stroke-width="2.5"/><line x1="150" y1="100" x2="150" y2="175" stroke="${T}" stroke-width="2"/><line x1="150" y1="100" x2="175" y2="120" stroke="${T}" stroke-width="2" stroke-dasharray="4"/><line x1="150" y1="65" x2="130" y2="75" stroke="${T}" stroke-width="2"/><line x1="130" y1="75" x2="130" y2="60" stroke="${T}" stroke-width="2"/><rect x="126" y="53" width="8" height="10" rx="2" fill="${W}" opacity="0.6"/>`,"SL DB CURL"),

  // ══════════ Compound Lifts ══════════
  t_bar_row: svg(300,200,`${HEAD(150,50)}<line x1="150" y1="62" x2="160" y2="110" stroke="${T}" stroke-width="2.5"/><line x1="160" y1="110" x2="145" y2="170" stroke="${T}" stroke-width="2"/><line x1="160" y1="110" x2="175" y2="170" stroke="${T}" stroke-width="2"/><line x1="150" y1="72" x2="120" y2="100" stroke="${T}" stroke-width="2"/><line x1="120" y1="100" x2="80" y2="160" stroke="${W}" stroke-width="2"/><text x="70" y="170" fill="${W}" font-size="7">BAR</text>`,"T-BAR ROW"),
  pike_pushup: svg(300,200,`${HEAD(150,55)}<line x1="150" y1="67" x2="150" y2="100" stroke="${T}" stroke-width="2.5"/><line x1="150" y1="100" x2="200" y2="170" stroke="${T}" stroke-width="2"/><line x1="150" y1="72" x2="120" y2="100" stroke="${T}" stroke-width="2"/><line x1="150" y1="72" x2="180" y2="100" stroke="${T}" stroke-width="2"/><line x1="120" y1="100" x2="120" y2="175" stroke="${T}" stroke-width="2"/><line x1="180" y1="100" x2="180" y2="175" stroke="${T}" stroke-width="2"/><text x="150" y="175" text-anchor="middle" fill="${G}" font-size="8">Hips HIGH, head between arms</text>`,"PIKE PUSH-UP"),
  cable_fly_low: svg(300,200,`${STAND(150,50)}<line x1="132" y1="70" x2="80" y2="100" stroke="${T}" stroke-width="2"/><line x1="168" y1="70" x2="220" y2="100" stroke="${T}" stroke-width="2"/><line x1="80" y1="100" x2="50" y2="150" stroke="${W}" stroke-width="1" stroke-dasharray="3"/><line x1="220" y1="100" x2="250" y2="150" stroke="${W}" stroke-width="1" stroke-dasharray="3"/><text x="40" y="160" fill="${W}" font-size="7">LOW</text><text x="240" y="160" fill="${W}" font-size="7">LOW</text><text x="150" y="175" text-anchor="middle" fill="${I}" font-size="8">Arc up and together</text>`,"CABLE FLY (LOW TO HIGH)"),
  cable_fly_high: svg(300,200,`${STAND(150,50)}<line x1="132" y1="70" x2="80" y2="50" stroke="${T}" stroke-width="2"/><line x1="168" y1="70" x2="220" y2="50" stroke="${T}" stroke-width="2"/><line x1="80" y1="50" x2="50" y2="30" stroke="${W}" stroke-width="1" stroke-dasharray="3"/><line x1="220" y1="50" x2="250" y2="30" stroke="${W}" stroke-width="1" stroke-dasharray="3"/><text x="40" y="25" fill="${W}" font-size="7">HIGH</text><text x="240" y="25" fill="${W}" font-size="7">HIGH</text><text x="150" y="175" text-anchor="middle" fill="${I}" font-size="8">Arc down and together</text>`,"CABLE FLY (HIGH TO LOW)"),
  cable_pull_through: svg(300,200,`${HEAD(150,45)}<line x1="150" y1="57" x2="160" y2="100" stroke="${T}" stroke-width="2.5"/><line x1="160" y1="100" x2="150" y2="155" stroke="${T}" stroke-width="2"/><line x1="160" y1="100" x2="170" y2="155" stroke="${T}" stroke-width="2"/><line x1="150" y1="70" x2="130" y2="100" stroke="${T}" stroke-width="2"/><line x1="130" y1="100" x2="100" y2="140" stroke="${W}" stroke-width="1" stroke-dasharray="3"/><text x="80" y="145" fill="${W}" font-size="7">CABLE</text><text x="150" y="175" text-anchor="middle" fill="${I}" font-size="8">Hinge, drive hips forward</text>`,"CABLE PULL-THROUGH"),
  pistol_squat: svg(300,200,`${HEAD(150,35)}<line x1="150" y1="47" x2="150" y2="90" stroke="${T}" stroke-width="2.5"/><line x1="150" y1="90" x2="140" y2="135" stroke="${T}" stroke-width="2"/><line x1="140" y1="135" x2="140" y2="175" stroke="${T}" stroke-width="2"/><line x1="150" y1="90" x2="200" y2="100" stroke="${T}" stroke-width="2" stroke-dasharray="4"/><text x="210" y="97" fill="${W}" font-size="7">LEG FWD</text><line x1="150" y1="60" x2="125" y2="80" stroke="${T}" stroke-width="2"/><line x1="150" y1="60" x2="175" y2="80" stroke="${T}" stroke-width="2"/>`,"PISTOL SQUAT"),
  overhead_carry: svg(300,200,`${HEAD(150,45)}<line x1="150" y1="57" x2="150" y2="110" stroke="${T}" stroke-width="2.5"/><line x1="150" y1="110" x2="140" y2="175" stroke="${T}" stroke-width="2"/><line x1="150" y1="110" x2="160" y2="175" stroke="${T}" stroke-width="2"/><line x1="155" y1="60" x2="160" y2="25" stroke="${T}" stroke-width="2"/><rect x="155" y="15" width="12" height="14" rx="3" fill="${W}" opacity="0.6"/><path d="M170 90 L200 90" stroke="${W}" stroke-width="1.5" marker-end="url(#arrOC)"/><defs><marker id="arrOC" markerWidth="5" markerHeight="4" refX="4" refY="2" orient="auto"><path d="M0 0L5 2L0 4" fill="${W}"/></marker></defs><text x="210" y="87" fill="${W}" font-size="7">WALK</text>`,"OVERHEAD CARRY"),

  // ══════════ Core ══════════
  renegade_row: svg(300,200,`${HEAD(90,70)}<line x1="90" y1="82" x2="220" y2="82" stroke="${T}" stroke-width="2.5"/><line x1="220" y1="82" x2="230" y2="140" stroke="${T}" stroke-width="2"/><line x1="220" y1="82" x2="210" y2="140" stroke="${T}" stroke-width="2"/><line x1="100" y1="82" x2="90" y2="140" stroke="${T}" stroke-width="2"/><rect x="85" y="140" width="8" height="15" rx="2" fill="${W}" opacity="0.6"/><line x1="100" y1="82" x2="100" y2="55" stroke="${T}" stroke-width="2"/><rect x="96" y="40" width="8" height="15" rx="2" fill="${W}" opacity="0.6"/><text x="115" y="45" fill="${W}" font-size="7">ROW</text>`,"RENEGADE ROW"),
  cable_woodchop: svg(300,200,`${STAND(150,50)}<line x1="155" y1="65" x2="200" y2="40" stroke="${T}" stroke-width="2"/><line x1="200" y1="40" x2="250" y2="30" stroke="${W}" stroke-width="1" stroke-dasharray="3"/><text x="255" y="25" fill="${W}" font-size="7">HIGH</text><line x1="145" y1="65" x2="100" y2="130" stroke="${T}" stroke-width="2" stroke-dasharray="4"/><path d="M200 40 Q150 80 100 130" stroke="${W}" stroke-width="1" fill="none" stroke-dasharray="3"/><text x="80" y="135" fill="${G}" font-size="7">CHOP</text>`,"CABLE WOODCHOP"),
  cable_reverse_woodchop: svg(300,200,`${STAND(150,50)}<line x1="145" y1="65" x2="100" y2="130" stroke="${T}" stroke-width="2"/><line x1="100" y1="130" x2="50" y2="160" stroke="${W}" stroke-width="1" stroke-dasharray="3"/><text x="40" y="168" fill="${W}" font-size="7">LOW</text><line x1="155" y1="65" x2="200" y2="40" stroke="${T}" stroke-width="2" stroke-dasharray="4"/><path d="M100 130 Q150 80 200 40" stroke="${W}" stroke-width="1" fill="none" stroke-dasharray="3"/><text x="210" y="35" fill="${G}" font-size="7">LIFT</text>`,"REVERSE WOODCHOP"),

  // ══════════ Plyometrics ══════════
  pes_tuck_jump: svg(300,200,`${HEAD(150,30)}<line x1="150" y1="42" x2="150" y2="75" stroke="${T}" stroke-width="2.5"/><line x1="150" y1="75" x2="130" y2="80" stroke="${T}" stroke-width="2"/><line x1="130" y1="80" x2="125" y2="60" stroke="${T}" stroke-width="2"/><line x1="150" y1="75" x2="170" y2="80" stroke="${T}" stroke-width="2"/><line x1="170" y1="80" x2="175" y2="60" stroke="${T}" stroke-width="2"/><text x="150" y="110" text-anchor="middle" fill="${W}" font-size="9">KNEES TO CHEST</text><text x="150" y="175" text-anchor="middle" fill="${I}" font-size="8">Explosive jump, tuck at peak</text>`,"TUCK JUMP"),
  pes_broad_jump: svg(300,200,`${HEAD(80,55)}<line x1="80" y1="67" x2="85" y2="110" stroke="${T}" stroke-width="2.5"/><line x1="85" y1="110" x2="75" y2="155" stroke="${T}" stroke-width="2"/><line x1="85" y1="110" x2="100" y2="155" stroke="${T}" stroke-width="2"/><path d="M100 80 L220 60" stroke="${W}" stroke-width="2" marker-end="url(#arrBJ)"/><defs><marker id="arrBJ" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto"><path d="M0 0L6 2L0 4" fill="${W}"/></marker></defs><text x="160" y="50" fill="${W}" font-size="8">MAX DISTANCE</text>`,"BROAD JUMP"),

  // ══════════ Integrated Stretches ══════════
  mob_spiderman_lunge: svg(300,200,`${HEAD(120,50)}<line x1="120" y1="62" x2="130" y2="100" stroke="${T}" stroke-width="2.5"/><line x1="130" y1="100" x2="100" y2="150" stroke="${T}" stroke-width="2"/><line x1="100" y1="150" x2="100" y2="175" stroke="${T}" stroke-width="2"/><line x1="130" y1="100" x2="185" y2="140" stroke="${T}" stroke-width="2"/><line x1="185" y1="140" x2="210" y2="175" stroke="${T}" stroke-width="2"/><line x1="120" y1="70" x2="90" y2="110" stroke="${T}" stroke-width="2"/><line x1="120" y1="70" x2="160" y2="50" stroke="${T}" stroke-width="2"/><path d="M155 55 L165 35" stroke="${W}" stroke-width="1.5"/><text x="175" y="32" fill="${W}" font-size="7">ROTATE</text>`,"SPIDERMAN LUNGE + ROTATION"),
  mob_squat_to_stand: svg(300,200,`${HEAD(150,55)}<line x1="150" y1="67" x2="150" y2="105" stroke="${T}" stroke-width="2.5"/><line x1="150" y1="105" x2="135" y2="145" stroke="${T}" stroke-width="2"/><line x1="135" y1="145" x2="135" y2="175" stroke="${T}" stroke-width="2"/><line x1="150" y1="105" x2="165" y2="145" stroke="${T}" stroke-width="2"/><line x1="165" y1="145" x2="165" y2="175" stroke="${T}" stroke-width="2"/><text x="150" y="170" text-anchor="middle" fill="${G}" font-size="8">Grab toes, pull to deep squat</text>`,"SQUAT TO STAND"),
  mob_lunge_elbow_instep: svg(300,200,`${HEAD(120,45)}<line x1="120" y1="57" x2="130" y2="95" stroke="${T}" stroke-width="2.5"/><line x1="130" y1="95" x2="105" y2="145" stroke="${T}" stroke-width="2"/><line x1="105" y1="145" x2="105" y2="175" stroke="${T}" stroke-width="2"/><line x1="130" y1="95" x2="190" y2="135" stroke="${T}" stroke-width="2"/><line x1="190" y1="135" x2="210" y2="175" stroke="${T}" stroke-width="2"/><line x1="120" y1="65" x2="100" y2="95" stroke="${T}" stroke-width="2"/><line x1="100" y1="95" x2="115" y2="140" stroke="${T}" stroke-width="2" stroke-dasharray="3"/><text x="125" y="145" fill="${W}" font-size="7">ELBOW DOWN</text>`,"LUNGE ELBOW TO INSTEP"),

  // ══════════ ACE IFT ══════════
  ace_transverse_lunge: svg(300,200,`${STAND(150,45)}<line x1="158" y1="130" x2="200" y2="150" stroke="${T}" stroke-width="2" stroke-dasharray="4"/><line x1="200" y1="150" x2="210" y2="175" stroke="${T}" stroke-width="2" stroke-dasharray="4"/><path d="M165 80 Q200 70 210 90" stroke="${W}" stroke-width="1.5" fill="none"/><text x="220" y="88" fill="${W}" font-size="7">ROTATE</text>`,"TRANSVERSE LUNGE + REACH"),
  ace_hk_cable_chop: svg(300,200,`${HEAD(150,50)}<line x1="150" y1="62" x2="150" y2="105" stroke="${T}" stroke-width="2.5"/><line x1="150" y1="105" x2="140" y2="140" stroke="${T}" stroke-width="2"/><line x1="140" y1="140" x2="140" y2="175" stroke="${T}" stroke-width="2"/><line x1="150" y1="105" x2="165" y2="175" stroke="${T}" stroke-width="2"/><line x1="155" y1="70" x2="200" y2="50" stroke="${T}" stroke-width="2"/><line x1="200" y1="50" x2="250" y2="40" stroke="${W}" stroke-width="1" stroke-dasharray="3"/><line x1="145" y1="70" x2="100" y2="120" stroke="${T}" stroke-width="2" stroke-dasharray="4"/><text x="85" y="125" fill="${G}" font-size="7">CHOP</text>`,"HALF-KNEELING CABLE CHOP"),
  ace_tall_kn_pallof: svg(300,200,`${HEAD(150,45)}<line x1="150" y1="57" x2="150" y2="105" stroke="${T}" stroke-width="2.5"/><line x1="150" y1="105" x2="140" y2="140" stroke="${T}" stroke-width="2"/><line x1="150" y1="105" x2="160" y2="140" stroke="${T}" stroke-width="2"/><line x1="155" y1="70" x2="200" y2="70" stroke="${T}" stroke-width="2"/><line x1="200" y1="70" x2="250" y2="70" stroke="${W}" stroke-width="1" stroke-dasharray="3"/><text x="255" y="67" fill="${W}" font-size="7">CABLE</text><text x="200" y="60" fill="${G}" font-size="7">PRESS OUT</text>`,"TALL-KNEELING PALLOF"),

  // ══════════ SPORT-SPECIFIC EXERCISES ══════════
  sport_shrimp_drill: svg(300,200,`${HEAD(80,110)}<line x1="80" y1="122" x2="170" y2="115" stroke="${T}" stroke-width="2.5"/><line x1="170" y1="115" x2="200" y2="90" stroke="${T}" stroke-width="2"/><line x1="200" y1="90" x2="210" y2="110" stroke="${T}" stroke-width="2"/><line x1="170" y1="115" x2="210" y2="140" stroke="${T}" stroke-width="2"/><line x1="210" y1="140" x2="200" y2="170" stroke="${T}" stroke-width="2"/><path d="M100 120 L60 100" stroke="${T}" stroke-width="2"/><path d="M90 115 L50 130" stroke="${T}" stroke-width="2"/><path d="M140 115 Q160 80 200 90" stroke="${W}" stroke-width="1.5" fill="none"/><text x="170" y="75" fill="${W}" font-size="8">HIP ESCAPE</text>`,"SHRIMP DRILL (BJJ)"),
  sport_bridge_roll: svg(300,200,`${HEAD(100,120)}${FLOOR(175)}<line x1="108" y1="120" x2="180" y2="120" stroke="${T}" stroke-width="2.5"/><line x1="180" y1="120" x2="190" y2="175" stroke="${T}" stroke-width="2"/><line x1="180" y1="120" x2="170" y2="175" stroke="${T}" stroke-width="2"/><line x1="108" y1="120" x2="80" y2="130" stroke="${T}" stroke-width="2"/><line x1="108" y1="120" x2="120" y2="100" stroke="${T}" stroke-width="2"/><path d="M150 110 L150 80" stroke="${W}" stroke-width="1.5"/><text x="150" y="75" fill="${W}" font-size="8" text-anchor="middle">BRIDGE UP</text>`,"BRIDGE & ROLL (BJJ)"),
  sport_combat_sprawl: svg(300,200,`${STAND(100,45)}<path d="M100 137 L180 160" stroke="${T}" stroke-width="2" stroke-dasharray="4"/><path d="M100 137 L160 175" stroke="${T}" stroke-width="2" stroke-dasharray="4"/><path d="M100 70 L140 90" stroke="${T}" stroke-width="2" stroke-dasharray="4"/><path d="M100 70 L60 100" stroke="${T}" stroke-width="2" stroke-dasharray="4"/><text x="200" y="165" fill="${W}" font-size="8">SPRAWL</text><path d="M120 100 Q160 130 180 160" stroke="${W}" stroke-width="1.5" fill="none" marker-end="url(#a)"/>`,"COMBAT SPRAWL"),
  sport_shadow_boxing: svg(300,200,`${STAND(120,45)}<line x1="118" y1="70" x2="80" y2="60" stroke="${T}" stroke-width="2"/><line x1="122" y1="70" x2="190" y2="55" stroke="${T}" stroke-width="2.5"/><circle cx="195" cy="52" r="4" fill="${W}"/><path d="M140 80 Q165 60 190 55" stroke="${W}" stroke-width="1.5" fill="none"/><text x="200" y="45" fill="${W}" font-size="8">CROSS</text><text x="70" y="55" fill="${G}" font-size="7">GUARD</text>`,"SHADOW BOXING — JAB/CROSS"),
  sport_neck_iso_4way: svg(300,200,`${HEAD(150,55)}<line x1="150" y1="67" x2="150" y2="110" stroke="${T}" stroke-width="2.5"/><line x1="150" y1="110" x2="130" y2="175" stroke="${T}" stroke-width="2"/><line x1="150" y1="110" x2="170" y2="175" stroke="${T}" stroke-width="2"/><line x1="155" y1="75" x2="185" y2="70" stroke="${T}" stroke-width="2"/><circle cx="190" cy="68" r="6" fill="none" stroke="${W}" stroke-width="1.5"/><text x="200" y="67" fill="${W}" font-size="7">RESIST</text><path d="M150 48 L150 30" stroke="${R}" stroke-width="1.5"/><path d="M150 62 L150 75" stroke="${R}" stroke-width="1.5"/><path d="M140 55 L125 55" stroke="${R}" stroke-width="1.5"/><path d="M160 55 L175 55" stroke="${R}" stroke-width="1.5"/><text x="150" y="25" fill="${R}" font-size="7" text-anchor="middle">4-WAY</text>`,"NECK ISOMETRICS 4-WAY"),
  sport_split_step: svg(300,200,`${STAND(150,50)}<line x1="130" y1="137" x2="115" y2="175" stroke="${T}" stroke-width="2" stroke-dasharray="4"/><line x1="170" y1="137" x2="185" y2="175" stroke="${T}" stroke-width="2" stroke-dasharray="4"/><path d="M150 165 L150 150" stroke="${W}" stroke-width="1.5"/><text x="150" y="145" fill="${W}" font-size="8" text-anchor="middle">HOP</text><text x="50" y="170" fill="${G}" font-size="7">REACT LEFT</text><text x="230" y="170" fill="${G}" font-size="7">REACT RIGHT</text><path d="M110 170 L80 170" stroke="${G}" stroke-width="1" marker-end="url(#a)"/><path d="M190 170 L220 170" stroke="${G}" stroke-width="1"/>`,"SPLIT STEP DRILL"),
  sport_forehand_cable_rot: svg(300,200,`${STAND(130,45)}<line x1="125" y1="70" x2="70" y2="60" stroke="${T}" stroke-width="2"/><line x1="135" y1="70" x2="210" y2="65" stroke="${T}" stroke-width="2.5"/><line x1="210" y1="65" x2="260" y2="65" stroke="${W}" stroke-width="1" stroke-dasharray="3"/><text x="265" y="62" fill="${W}" font-size="7">CABLE</text><path d="M130 90 Q170 70 210 65" stroke="${W}" stroke-width="1.5" fill="none"/><text x="170" y="55" fill="${G}" font-size="7">ROTATE</text>`,"FOREHAND CABLE ROTATION"),
  sport_overhead_serve_cable: svg(300,200,`${STAND(120,50)}<line x1="125" y1="75" x2="160" y2="40" stroke="${T}" stroke-width="2.5"/><line x1="160" y1="40" x2="200" y2="30" stroke="${W}" stroke-width="1" stroke-dasharray="3"/><line x1="115" y1="75" x2="80" y2="90" stroke="${T}" stroke-width="2"/><text x="210" y="28" fill="${W}" font-size="7">CABLE</text><path d="M160 40 L170 100" stroke="${T}" stroke-width="2" stroke-dasharray="4"/><text x="185" y="80" fill="${G}" font-size="8">SERVE</text>`,"OVERHEAD SERVE SIMULATION"),
  sport_pro_agility_5_10_5: svg(300,200,`${FLOOR(170)}<rect x="70" y="160" width="8" height="20" rx="2" fill="${W}"/><rect x="146" y="160" width="8" height="20" rx="2" fill="${W}"/><rect x="222" y="160" width="8" height="20" rx="2" fill="${W}"/><text x="74" y="155" fill="${W}" font-size="8" text-anchor="middle">5yd</text><text x="150" y="155" fill="${W}" font-size="8" text-anchor="middle">START</text><text x="226" y="155" fill="${W}" font-size="8" text-anchor="middle">5yd</text>${HEAD(150,70)}<line x1="150" y1="82" x2="150" y2="120" stroke="${T}" stroke-width="2.5"/><line x1="150" y1="120" x2="135" y2="155" stroke="${T}" stroke-width="2"/><line x1="150" y1="120" x2="165" y2="155" stroke="${T}" stroke-width="2"/><path d="M150 100 L75 130 L225 130 L150 100" stroke="${G}" stroke-width="1.5" fill="none" stroke-dasharray="4"/>`,"PRO AGILITY 5-10-5"),
  sport_nordic_hamstring: svg(300,200,`${FLOOR(185)}<rect x="200" y="170" width="30" height="15" rx="3" fill="${L}"/>${HEAD(130,50)}<line x1="130" y1="62" x2="135" y2="110" stroke="${T}" stroke-width="2.5"/><line x1="135" y1="110" x2="150" y2="155" stroke="${T}" stroke-width="2"/><line x1="150" y1="155" x2="210" y2="170" stroke="${T}" stroke-width="2"/><line x1="150" y1="155" x2="210" y2="180" stroke="${T}" stroke-width="2"/><path d="M130 80 L80 100" stroke="${T}" stroke-width="2"/><path d="M130 80 L100 120" stroke="${T}" stroke-width="2"/><path d="M140 100 L140 60" stroke="${W}" stroke-width="1.5"/><text x="145" y="55" fill="${W}" font-size="7">SLOW LOWER</text>`,"NORDIC HAMSTRING CURL"),
  sport_approach_jump: svg(300,200,`${STAND(100,55)}<path d="M80 140 L160 130 L160 50" stroke="${G}" stroke-width="1.5" fill="none" stroke-dasharray="4"/><text x="170" y="48" fill="${G}" font-size="8">JUMP</text><line x1="155" y1="75" x2="180" y2="45" stroke="${T}" stroke-width="2" stroke-dasharray="3"/><line x1="145" y1="75" x2="120" y2="45" stroke="${T}" stroke-width="2" stroke-dasharray="3"/><text x="80" y="155" fill="${W}" font-size="7">APPROACH</text>`,"APPROACH JUMP (VOLLEYBALL)"),
  sport_prone_paddle_sim: svg(300,200,`<rect x="60" y="100" width="180" height="8" rx="3" fill="${L}" opacity="0.5"/>${HEAD(80,85)}<line x1="88" y1="85" x2="220" y2="90" stroke="${T}" stroke-width="2.5"/><line x1="100" y1="85" x2="80" y2="130" stroke="${T}" stroke-width="2"/><line x1="120" y1="88" x2="130" y2="50" stroke="${T}" stroke-width="2.5"/><line x1="220" y1="90" x2="245" y2="110" stroke="${T}" stroke-width="2"/><line x1="220" y1="90" x2="250" y2="85" stroke="${T}" stroke-width="2"/><path d="M130 50 Q140 70 120 88" stroke="${W}" stroke-width="1.5" fill="none"/><text x="145" y="45" fill="${W}" font-size="7">PADDLE</text>`,"PRONE PADDLE SIMULATION"),
  sport_popup_drill: svg(300,200,`<line x1="50" y1="140" x2="130" y2="140" stroke="${T}" stroke-width="2.5"/>${HEAD(55,128)}<line x1="63" y1="128" x2="130" y2="135" stroke="${T}" stroke-width="2"/><line x1="100" y1="135" x2="90" y2="155" stroke="${T}" stroke-width="2"/><line x1="100" y1="135" x2="110" y2="120" stroke="${T}" stroke-width="2"/><path d="M140 130 L170 100" stroke="${W}" stroke-width="2" marker-end="url(#a)"/><text x="175" y="95" fill="${W}" font-size="8">POP UP</text>${STAND(230,55)}<text x="230" y="175" fill="${G}" font-size="7" text-anchor="middle">SURF STANCE</text>`,"POP-UP DRILL (SURFING)"),
  sport_swim_lat_pull: svg(300,200,`${SEATED(150,110)}<line x1="145" y1="65" x2="115" y2="40" stroke="${T}" stroke-width="2"/><line x1="155" y1="65" x2="185" y2="40" stroke="${T}" stroke-width="2"/><line x1="115" y1="40" x2="115" y2="25" stroke="${W}" stroke-width="1" stroke-dasharray="3"/><line x1="185" y1="40" x2="185" y2="25" stroke="${W}" stroke-width="1" stroke-dasharray="3"/><text x="150" y="22" fill="${W}" font-size="7" text-anchor="middle">CABLE</text><path d="M115 40 L130 80" stroke="${T}" stroke-width="2" stroke-dasharray="4"/><path d="M185 40 L170 80" stroke="${T}" stroke-width="2" stroke-dasharray="4"/><text x="150" y="90" fill="${G}" font-size="7" text-anchor="middle">EXPLOSIVE PULL</text>`,"SWIM-SPECIFIC LAT PULLDOWN"),
  sport_dead_hang_active: svg(300,200,`<rect x="80" y="25" width="140" height="8" rx="3" fill="${L}"/>${HEAD(150,48)}<line x1="150" y1="60" x2="150" y2="115" stroke="${T}" stroke-width="2.5"/><line x1="150" y1="115" x2="140" y2="170" stroke="${T}" stroke-width="2"/><line x1="150" y1="115" x2="160" y2="170" stroke="${T}" stroke-width="2"/><line x1="148" y1="68" x2="120" y2="33" stroke="${T}" stroke-width="2"/><line x1="152" y1="68" x2="180" y2="33" stroke="${T}" stroke-width="2"/><path d="M135 75 L125 60" stroke="${G}" stroke-width="1.5"/><path d="M165 75 L175 60" stroke="${G}" stroke-width="1.5"/><text x="150" y="185" fill="${G}" font-size="8" text-anchor="middle">SHOULDERS DOWN + BACK</text>`,"ACTIVE DEAD HANG"),

  // ══════════ CLIMBING EXERCISES ══════════
  climb_dead_hang_jug: svg(300,200,`<rect x="80" y="22" width="140" height="10" rx="3" fill="${L}"/><rect x="110" y="18" width="80" height="8" rx="2" fill="${I}" opacity="0.5"/><text x="150" y="15" fill="${I}" font-size="7" text-anchor="middle">JUG HOLD</text>${HEAD(150,48)}<line x1="150" y1="60" x2="150" y2="115" stroke="${T}" stroke-width="2.5"/><line x1="150" y1="115" x2="140" y2="170" stroke="${T}" stroke-width="2"/><line x1="150" y1="115" x2="160" y2="170" stroke="${T}" stroke-width="2"/><line x1="148" y1="68" x2="122" y2="30" stroke="${T}" stroke-width="2"/><line x1="152" y1="68" x2="178" y2="30" stroke="${T}" stroke-width="2"/><text x="150" y="185" fill="${G}" font-size="8" text-anchor="middle">OPEN HAND — FULL HANG</text>`,"DEAD HANG — JUG HOLD"),
  climb_dead_hang_20mm: svg(300,200,`<rect x="80" y="22" width="140" height="10" rx="3" fill="${L}"/><rect x="125" y="18" width="50" height="5" rx="1" fill="${W}"/><text x="150" y="15" fill="${W}" font-size="7" text-anchor="middle">20mm EDGE</text>${HEAD(150,48)}<line x1="150" y1="60" x2="150" y2="115" stroke="${T}" stroke-width="2.5"/><line x1="150" y1="115" x2="140" y2="170" stroke="${T}" stroke-width="2"/><line x1="150" y1="115" x2="160" y2="170" stroke="${T}" stroke-width="2"/><line x1="148" y1="68" x2="130" y2="28" stroke="${T}" stroke-width="2"/><line x1="152" y1="68" x2="170" y2="28" stroke="${T}" stroke-width="2"/><text x="150" y="185" fill="${R}" font-size="7" text-anchor="middle">HALF CRIMP — NEVER FULL CRIMP</text>`,"DEAD HANG — 20mm EDGE"),
  climb_abrahangs: svg(300,200,`<rect x="80" y="22" width="140" height="10" rx="3" fill="${L}"/>${HEAD(150,55)}<line x1="150" y1="67" x2="150" y2="115" stroke="${T}" stroke-width="2.5"/><line x1="150" y1="115" x2="140" y2="150" stroke="${T}" stroke-width="2"/><line x1="140" y1="150" x2="140" y2="175" stroke="${T}" stroke-width="2"/><line x1="150" y1="115" x2="160" y2="150" stroke="${T}" stroke-width="2"/><line x1="160" y1="150" x2="160" y2="175" stroke="${T}" stroke-width="2"/><line x1="148" y1="75" x2="125" y2="30" stroke="${T}" stroke-width="2"/><line x1="152" y1="75" x2="175" y2="30" stroke="${T}" stroke-width="2"/><text x="150" y="185" fill="${G}" font-size="7" text-anchor="middle">FEET ON GROUND — ~40% LOAD</text><text x="60" y="80" fill="${I}" font-size="7">7 GRIPS</text><text x="60" y="90" fill="${I}" font-size="7">× 3 REPS</text>`,"ABRAHANGS SUB-MAX PROTOCOL"),
  climb_max_hangs: svg(300,200,`<rect x="80" y="22" width="140" height="10" rx="3" fill="${L}"/><rect x="125" y="18" width="50" height="5" rx="1" fill="${R}"/>${HEAD(150,48)}<line x1="150" y1="60" x2="150" y2="115" stroke="${T}" stroke-width="2.5"/><line x1="150" y1="115" x2="140" y2="170" stroke="${T}" stroke-width="2"/><line x1="150" y1="115" x2="160" y2="170" stroke="${T}" stroke-width="2"/><line x1="148" y1="68" x2="130" y2="28" stroke="${T}" stroke-width="2"/><line x1="152" y1="68" x2="170" y2="28" stroke="${T}" stroke-width="2"/><rect x="140" y="155" width="20" height="15" rx="3" fill="${W}" opacity="0.4"/><text x="150" y="185" fill="${R}" font-size="7" text-anchor="middle">80-90% MAX — WEIGHTED</text>`,"MAX HANGS PROTOCOL"),
  climb_repeaters: svg(300,200,`<rect x="80" y="22" width="140" height="10" rx="3" fill="${L}"/>${HEAD(150,48)}<line x1="150" y1="60" x2="150" y2="115" stroke="${T}" stroke-width="2.5"/><line x1="150" y1="115" x2="140" y2="170" stroke="${T}" stroke-width="2"/><line x1="150" y1="115" x2="160" y2="170" stroke="${T}" stroke-width="2"/><line x1="148" y1="68" x2="130" y2="28" stroke="${T}" stroke-width="2"/><line x1="152" y1="68" x2="170" y2="28" stroke="${T}" stroke-width="2"/><rect x="30" y="80" width="50" height="25" rx="4" fill="${I}" opacity="0.15"/><text x="55" y="92" fill="${I}" font-size="8" text-anchor="middle">7s ON</text><text x="55" y="102" fill="${I}" font-size="8" text-anchor="middle">3s OFF</text><text x="150" y="185" fill="${G}" font-size="7" text-anchor="middle">× 6-7 REPS = 1 SET</text>`,"REPEATERS — 7:3 PROTOCOL"),
  climb_finger_extensor_band: svg(300,200,`<circle cx="150" cy="90" r="30" fill="none" stroke="${T}" stroke-width="2" stroke-dasharray="5"/><line x1="150" y1="60" x2="150" y2="40" stroke="${T}" stroke-width="3"/><line x1="175" y1="75" x2="195" y2="60" stroke="${T}" stroke-width="3"/><line x1="175" y1="105" x2="195" y2="120" stroke="${T}" stroke-width="3"/><line x1="125" y1="75" x2="105" y2="60" stroke="${T}" stroke-width="3"/><line x1="125" y1="105" x2="105" y2="120" stroke="${T}" stroke-width="3"/><circle cx="150" cy="90" r="18" fill="none" stroke="${W}" stroke-width="2"/><text x="150" y="145" fill="${W}" font-size="8" text-anchor="middle">RUBBER BAND</text><text x="150" y="160" fill="${G}" font-size="8" text-anchor="middle">SPREAD ALL 5 FINGERS</text><text x="150" y="185" fill="${R}" font-size="7" text-anchor="middle">MANDATORY — EVERY SESSION</text>`,"FINGER EXTENSOR BAND"),
  climb_rice_bucket: svg(300,200,`<rect x="100" y="80" width="100" height="80" rx="6" fill="${L}" opacity="0.3"/><rect x="95" y="78" width="110" height="5" rx="2" fill="${L}"/><text x="150" y="115" fill="${W}" font-size="20" text-anchor="middle">🍚</text><line x1="130" y1="70" x2="120" y2="100" stroke="${T}" stroke-width="2.5"/><line x1="170" y1="70" x2="180" y2="100" stroke="${T}" stroke-width="2.5"/>${HEAD(150,40)}<line x1="150" y1="52" x2="150" y2="70" stroke="${T}" stroke-width="2.5"/><text x="150" y="175" fill="${G}" font-size="8" text-anchor="middle">DIG · TWIST · GRAB · SPREAD</text>`,"RICE BUCKET TRAINING"),
  climb_pinch_hold: svg(300,200,`${STAND(120,50)}<line x1="125" y1="78" x2="170" y2="85" stroke="${T}" stroke-width="2.5"/><rect x="165" y="75" width="6" height="30" rx="2" fill="${W}"/><line x1="115" y1="78" x2="80" y2="95" stroke="${T}" stroke-width="2"/><text x="190" y="95" fill="${W}" font-size="8">PLATE</text><text x="150" y="185" fill="${G}" font-size="7" text-anchor="middle">THUMB vs 4 FINGERS — PINCH</text>`,"PINCH GRIP — PLATE HOLD"),
  climb_pullup_grip_var: svg(300,200,`<rect x="60" y="22" width="180" height="8" rx="3" fill="${L}"/>${HEAD(100,48)}<line x1="100" y1="60" x2="100" y2="100" stroke="${T}" stroke-width="2.5"/><line x1="98" y1="68" x2="80" y2="30" stroke="${T}" stroke-width="2"/><line x1="102" y1="68" x2="120" y2="30" stroke="${T}" stroke-width="2"/>${HEAD(200,48)}<line x1="200" y1="60" x2="200" y2="100" stroke="${T}" stroke-width="2.5"/><line x1="198" y1="68" x2="160" y2="30" stroke="${T}" stroke-width="2"/><line x1="202" y1="68" x2="230" y2="30" stroke="${T}" stroke-width="2"/><text x="100" y="120" fill="${G}" font-size="7" text-anchor="middle">NARROW</text><text x="200" y="120" fill="${G}" font-size="7" text-anchor="middle">WIDE</text><text x="150" y="155" fill="${W}" font-size="8" text-anchor="middle">+ OFFSET · TOWEL · ROPE</text>`,"PULL-UP — GRIP VARIATIONS"),
  climb_lock_off: svg(300,200,`<rect x="80" y="22" width="140" height="8" rx="3" fill="${L}"/>${HEAD(120,48)}<line x1="120" y1="60" x2="120" y2="90" stroke="${T}" stroke-width="2.5"/><line x1="118" y1="65" x2="100" y2="30" stroke="${T}" stroke-width="2"/><line x1="122" y1="65" x2="140" y2="30" stroke="${T}" stroke-width="2"/><line x1="120" y1="90" x2="110" y2="130" stroke="${T}" stroke-width="2"/><line x1="120" y1="90" x2="130" y2="130" stroke="${T}" stroke-width="2"/><rect x="160" y="50" width="80" height="50" rx="6" fill="${I}" opacity="0.1"/><text x="200" y="68" fill="${I}" font-size="8" text-anchor="middle">HOLD AT:</text><text x="200" y="80" fill="${G}" font-size="7" text-anchor="middle">TOP · 90° · 120°</text><text x="200" y="92" fill="${G}" font-size="7" text-anchor="middle">5-10s each</text>`,"LOCK-OFF TRAINING"),
  climb_frenchies: svg(300,200,`<rect x="80" y="22" width="140" height="8" rx="3" fill="${L}"/>${HEAD(130,48)}<line x1="130" y1="60" x2="130" y2="90" stroke="${T}" stroke-width="2.5"/><line x1="128" y1="65" x2="110" y2="30" stroke="${T}" stroke-width="2"/><line x1="132" y1="65" x2="150" y2="30" stroke="${T}" stroke-width="2"/><text x="55" y="55" fill="${G}" font-size="7">1. TOP 5s</text><text x="55" y="80" fill="${G}" font-size="7">2. 90° 5s</text><text x="55" y="105" fill="${G}" font-size="7">3. 120° 5s</text><text x="55" y="125" fill="${G}" font-size="7">4. LOWER</text><path d="M90 50 L90 125" stroke="${W}" stroke-width="1" stroke-dasharray="3"/>`,"FRENCHIES"),
  climb_campus_touches: svg(300,200,`<rect x="90" y="20" width="12" height="165" rx="3" fill="${L}"/>${[0,1,2,3,4,5,6].map(i=>`<rect x="88" y="${25+i*22}" width="16" height="6" rx="1" fill="${W}"/>`).join("")}${HEAD(130,60)}<line x1="130" y1="72" x2="130" y2="110" stroke="${T}" stroke-width="2.5"/><line x1="128" y1="80" x2="102" y2="50" stroke="${T}" stroke-width="2"/><line x1="132" y1="80" x2="104" y2="90" stroke="${T}" stroke-width="2"/><path d="M104 90 L102 50" stroke="${W}" stroke-width="2" stroke-dasharray="4"/><text x="145" y="80" fill="${W}" font-size="7">EXPLODE UP</text><text x="150" y="185" fill="${R}" font-size="7" text-anchor="middle">PHASE 4+ ONLY — STRICT GATING</text>`,"CAMPUS BOARD TOUCHES"),
  climb_typewriter_pullup: svg(300,200,`<rect x="60" y="22" width="180" height="8" rx="3" fill="${L}"/>${HEAD(120,48)}<line x1="120" y1="60" x2="120" y2="90" stroke="${T}" stroke-width="2.5"/><line x1="118" y1="65" x2="80" y2="30" stroke="${T}" stroke-width="2"/><line x1="122" y1="65" x2="160" y2="30" stroke="${T}" stroke-width="2"/><path d="M120 48 L180 48" stroke="${W}" stroke-width="2" stroke-dasharray="4"/><path d="M120 48 L60 48" stroke="${W}" stroke-width="2" stroke-dasharray="4"/><text x="60" y="42" fill="${G}" font-size="7">←</text><text x="185" y="42" fill="${G}" font-size="7">→</text><text x="150" y="120" fill="${W}" font-size="8" text-anchor="middle">SHIFT SIDE TO SIDE</text>`,"TYPEWRITER PULL-UP"),
  climb_front_lever_prog: svg(300,200,`<rect x="130" y="30" width="10" height="8" rx="2" fill="${L}"/><line x1="135" y1="38" x2="135" y2="50" stroke="${T}" stroke-width="2"/>${HEAD(135,58)}<line x1="135" y1="70" x2="60" y2="70" stroke="${T}" stroke-width="2.5"/><line x1="60" y1="70" x2="30" y2="65" stroke="${T}" stroke-width="2"/><line x1="60" y1="70" x2="30" y2="75" stroke="${T}" stroke-width="2"/><text x="150" y="100" fill="${G}" font-size="8">BODY HORIZONTAL</text><text x="150" y="115" fill="${I}" font-size="7">TUCK → SINGLE LEG → STRADDLE → FULL</text>`,"FRONT LEVER PROGRESSION"),
  climb_hanging_leg_raise: svg(300,200,`<rect x="80" y="22" width="140" height="8" rx="3" fill="${L}"/>${HEAD(150,48)}<line x1="150" y1="60" x2="150" y2="110" stroke="${T}" stroke-width="2.5"/><line x1="148" y1="68" x2="130" y2="30" stroke="${T}" stroke-width="2"/><line x1="152" y1="68" x2="170" y2="30" stroke="${T}" stroke-width="2"/><line x1="150" y1="110" x2="140" y2="80" stroke="${T}" stroke-width="2" stroke-dasharray="4"/><line x1="150" y1="110" x2="160" y2="80" stroke="${T}" stroke-width="2" stroke-dasharray="4"/><path d="M140 140 Q145 100 140 80" stroke="${W}" stroke-width="1.5" fill="none"/><text x="180" y="95" fill="${W}" font-size="7">TOES TO BAR</text>`,"HANGING LEG RAISE"),
  climb_body_tension_hold: svg(300,200,`${FLOOR(170)}<rect x="220" y="100" width="8" height="70" rx="2" fill="${L}"/>${HEAD(80,115)}<line x1="88" y1="115" x2="180" y2="110" stroke="${T}" stroke-width="2.5"/><line x1="180" y1="110" x2="215" y2="100" stroke="${T}" stroke-width="2"/><line x1="180" y1="110" x2="215" y2="115" stroke="${T}" stroke-width="2"/><line x1="88" y1="110" x2="65" y2="130" stroke="${T}" stroke-width="2"/><line x1="88" y1="115" x2="65" y2="140" stroke="${T}" stroke-width="2"/><text x="150" y="145" fill="${G}" font-size="8" text-anchor="middle">RIGID — NO SAGGING</text>`,"BODY TENSION HOLD"),
  climb_flag_stem_drill: svg(300,200,`${HEAD(150,45)}<line x1="150" y1="57" x2="150" y2="110" stroke="${T}" stroke-width="2.5"/><line x1="150" y1="110" x2="150" y2="170" stroke="${T}" stroke-width="2"/><line x1="150" y1="110" x2="200" y2="140" stroke="${T}" stroke-width="2" stroke-dasharray="4"/><line x1="155" y1="75" x2="200" y2="60" stroke="${T}" stroke-width="2"/><line x1="145" y1="75" x2="100" y2="55" stroke="${T}" stroke-width="2"/><text x="210" y="145" fill="${W}" font-size="7">FLAG LEG</text><text x="90" y="50" fill="${G}" font-size="7">BALANCE</text><circle cx="150" cy="172" r="4" fill="${W}"/>`,"FLAG & STEM DRILL"),
  climb_pushup_antagonist: svg(300,200,`${FLOOR(170)}${HEAD(90,110)}<line x1="98" y1="110" x2="200" y2="112" stroke="${T}" stroke-width="2.5"/><line x1="200" y1="112" x2="220" y2="160" stroke="${T}" stroke-width="2"/><line x1="200" y1="112" x2="190" y2="160" stroke="${T}" stroke-width="2"/><line x1="100" y1="108" x2="85" y2="155" stroke="${T}" stroke-width="2"/><line x1="85" y1="155" x2="85" y2="170" stroke="${T}" stroke-width="1.5"/><line x1="100" y1="112" x2="110" y2="155" stroke="${T}" stroke-width="2"/><line x1="110" y1="155" x2="110" y2="170" stroke="${T}" stroke-width="1.5"/><text x="150" y="185" fill="${R}" font-size="7" text-anchor="middle">MANDATORY AFTER EVERY CLIMB</text>`,"PUSH-UP — CLIMBING ANTAGONIST"),
  climb_db_shoulder_press: svg(300,200,`${STAND(150,50)}<line x1="145" y1="75" x2="120" y2="60" stroke="${T}" stroke-width="2"/><line x1="120" y1="60" x2="120" y2="35" stroke="${T}" stroke-width="2.5"/><rect x="115" y="28" width="10" height="10" rx="2" fill="${W}"/><line x1="155" y1="75" x2="180" y2="60" stroke="${T}" stroke-width="2"/><line x1="180" y1="60" x2="180" y2="35" stroke="${T}" stroke-width="2.5"/><rect x="175" y="28" width="10" height="10" rx="2" fill="${W}"/><text x="150" y="185" fill="${G}" font-size="7" text-anchor="middle">OVERHEAD ANTAGONIST</text>`,"DB SHOULDER PRESS"),
  climb_reverse_wrist_curl: svg(300,200,`<rect x="60" y="100" width="100" height="6" rx="2" fill="${L}" opacity="0.5"/>${HEAD(110,50)}<line x1="110" y1="62" x2="110" y2="100" stroke="${T}" stroke-width="2.5"/><line x1="110" y1="100" x2="110" y2="155" stroke="${T}" stroke-width="2"/><line x1="108" y1="70" x2="85" y2="95" stroke="${T}" stroke-width="2"/><line x1="112" y1="70" x2="160" y2="95" stroke="${T}" stroke-width="2.5"/><line x1="160" y1="95" x2="175" y2="80" stroke="${T}" stroke-width="2" stroke-dasharray="4"/><rect x="172" y="75" width="8" height="12" rx="2" fill="${W}"/><text x="190" y="72" fill="${W}" font-size="7">PALM DOWN</text><path d="M175 90 L175 75" stroke="${G}" stroke-width="1.5"/><text x="195" y="95" fill="${G}" font-size="7">EXTEND</text>`,"REVERSE WRIST CURL"),
  climb_scapular_pushup_plus: svg(300,200,`${FLOOR(170)}${HEAD(90,110)}<line x1="98" y1="110" x2="200" y2="112" stroke="${T}" stroke-width="2.5"/><line x1="100" y1="108" x2="95" y2="155" stroke="${T}" stroke-width="2"/><line x1="95" y1="155" x2="95" y2="170" stroke="${T}" stroke-width="1.5"/><path d="M130 105 L130 95" stroke="${G}" stroke-width="2"/><text x="140" y="92" fill="${G}" font-size="7">PUSH THROUGH</text><text x="150" y="185" fill="${W}" font-size="7" text-anchor="middle">+ PROTRACT AT TOP</text>`,"SCAPULAR PUSH-UP PLUS"),
  climb_prone_ytw: svg(300,200,`<rect x="60" y="110" width="180" height="8" rx="3" fill="${L}" opacity="0.5"/>${HEAD(80,98)}<line x1="88" y1="98" x2="220" y2="100" stroke="${T}" stroke-width="2.5"/><line x1="100" y1="96" x2="60" y2="60" stroke="${T}" stroke-width="2"/><text x="55" y="55" fill="${W}" font-size="10" font-weight="700">Y</text><line x1="100" y1="100" x2="55" y2="100" stroke="${T}" stroke-width="2" stroke-dasharray="4"/><text x="45" y="97" fill="${W}" font-size="10" font-weight="700">T</text><line x1="100" y1="96" x2="65" y2="80" stroke="${T}" stroke-width="2" stroke-dasharray="4"/><line x1="65" y1="80" x2="55" y2="90" stroke="${T}" stroke-width="1.5" stroke-dasharray="4"/><text x="45" y="78" fill="${W}" font-size="10" font-weight="700">W</text>`,"PRONE Y-T-W RAISE"),
  climb_hip_turnout: svg(300,200,`${HEAD(150,50)}<line x1="150" y1="62" x2="150" y2="110" stroke="${T}" stroke-width="2.5"/><line x1="150" y1="110" x2="110" y2="140" stroke="${T}" stroke-width="2"/><line x1="110" y1="140" x2="80" y2="130" stroke="${T}" stroke-width="2"/><line x1="150" y1="110" x2="190" y2="140" stroke="${T}" stroke-width="2"/><line x1="190" y1="140" x2="220" y2="130" stroke="${T}" stroke-width="2"/><circle cx="150" cy="145" r="15" fill="none" stroke="${W}" stroke-width="1.5" stroke-dasharray="4"/><text x="150" y="180" fill="${G}" font-size="8" text-anchor="middle">BUTTERFLY — KNEES OUT</text>`,"HIP TURNOUT STRETCH"),
  climb_thoracic_foam_ext: svg(300,200,`${FLOOR(170)}<circle cx="150" cy="140" r="12" fill="${I}" opacity="0.3"/><text x="150" y="145" fill="${I}" font-size="7" text-anchor="middle">ROLLER</text>${HEAD(110,100)}<line x1="118" y1="100" x2="190" y2="130" stroke="${T}" stroke-width="2.5"/><line x1="190" y1="130" x2="210" y2="165" stroke="${T}" stroke-width="2"/><line x1="190" y1="130" x2="200" y2="165" stroke="${T}" stroke-width="2"/><line x1="115" y1="95" x2="95" y2="80" stroke="${T}" stroke-width="2"/><line x1="115" y1="98" x2="130" y2="80" stroke="${T}" stroke-width="2"/><path d="M115 95 L115 70" stroke="${W}" stroke-width="1.5"/><text x="120" y="65" fill="${W}" font-size="7">EXTEND</text>`,"THORACIC EXTENSION — FOAM ROLLER"),
  climb_shoulder_passthrough: svg(300,200,`${STAND(150,55)}<line x1="145" y1="78" x2="90" y2="45" stroke="${T}" stroke-width="2"/><line x1="155" y1="78" x2="210" y2="45" stroke="${T}" stroke-width="2"/><line x1="90" y1="45" x2="210" y2="45" stroke="${W}" stroke-width="1.5"/><path d="M90 45 Q70 80 90 130" stroke="${T}" stroke-width="1.5" stroke-dasharray="4"/><path d="M210 45 Q230 80 210 130" stroke="${T}" stroke-width="1.5" stroke-dasharray="4"/><text x="150" y="35" fill="${W}" font-size="8" text-anchor="middle">BAND/DOWEL</text><text x="55" y="90" fill="${G}" font-size="7">OVER</text><text x="240" y="90" fill="${G}" font-size="7">BACK</text>`,"SHOULDER PASS-THROUGH"),
  climb_wrist_flex_ext_stretch: svg(300,200,`<line x1="80" y1="100" x2="160" y2="100" stroke="${T}" stroke-width="3"/><line x1="160" y1="100" x2="190" y2="80" stroke="${T}" stroke-width="2.5"/><line x1="80" y1="95" x2="60" y2="95" stroke="${T}" stroke-width="2"/><text x="195" y="78" fill="${G}" font-size="7">PULL BACK</text><path d="M170 95 L185 80" stroke="${G}" stroke-width="1.5"/><line x1="80" y1="140" x2="160" y2="140" stroke="${T}" stroke-width="3"/><line x1="160" y1="140" x2="185" y2="160" stroke="${T}" stroke-width="2.5"/><line x1="80" y1="135" x2="60" y2="135" stroke="${T}" stroke-width="2"/><text x="195" y="162" fill="${G}" font-size="7">PUSH DOWN</text><text x="40" y="100" fill="${W}" font-size="7">FLEXOR</text><text x="40" y="140" fill="${W}" font-size="7">EXTENSOR</text>`,"WRIST STRETCHES — BOTH DIRECTIONS"),
  climb_forearm_massage: svg(300,200,`<line x1="60" y1="110" x2="230" y2="110" stroke="${T}" stroke-width="6"/><circle cx="150" cy="105" r="8" fill="${W}"/><text x="150" y="108" fill="${B}" font-size="7" text-anchor="middle">●</text><path d="M120 100 L180 100" stroke="${G}" stroke-width="1" stroke-dasharray="3"/><text x="150" y="85" fill="${G}" font-size="8" text-anchor="middle">ROLL SLOWLY</text><text x="80" y="135" fill="${W}" font-size="7">FLEXOR SIDE</text><text x="200" y="135" fill="${W}" font-size="7">EXTENSOR SIDE</text><text x="150" y="165" fill="${I}" font-size="7" text-anchor="middle">2 MIN EACH ARM — BOTH SIDES</text>`,"FOREARM SELF-MASSAGE"),
  climb_ankle_df_mob: svg(300,200,`${FLOOR(170)}<rect x="200" y="40" width="10" height="130" rx="2" fill="${L}"/>${HEAD(130,50)}<line x1="130" y1="62" x2="140" y2="105" stroke="${T}" stroke-width="2.5"/><line x1="140" y1="105" x2="160" y2="140" stroke="${T}" stroke-width="2"/><line x1="160" y1="140" x2="160" y2="170" stroke="${T}" stroke-width="2"/><line x1="140" y1="105" x2="120" y2="150" stroke="${T}" stroke-width="2"/><line x1="120" y1="150" x2="120" y2="170" stroke="${T}" stroke-width="2"/><path d="M160 140 L200 90" stroke="${W}" stroke-width="1.5" stroke-dasharray="3"/><text x="175" y="80" fill="${W}" font-size="7">KNEE</text><text x="175" y="90" fill="${W}" font-size="7">TO WALL</text>`,"ANKLE DORSIFLEXION MOB"),
  climb_hip_flexor_stretch: svg(300,200,`${FLOOR(170)}${HEAD(130,50)}<line x1="130" y1="62" x2="135" y2="105" stroke="${T}" stroke-width="2.5"/><line x1="135" y1="105" x2="160" y2="140" stroke="${T}" stroke-width="2"/><line x1="160" y1="140" x2="160" y2="170" stroke="${T}" stroke-width="2"/><line x1="135" y1="105" x2="100" y2="140" stroke="${T}" stroke-width="2"/><line x1="100" y1="140" x2="90" y2="170" stroke="${T}" stroke-width="2"/><path d="M120 110 L100 80" stroke="${G}" stroke-width="1.5"/><text x="85" y="75" fill="${G}" font-size="7">PRESS</text><text x="85" y="85" fill="${G}" font-size="7">HIP FWD</text>`,"HIP FLEXOR STRETCH — COUCH"),
  climb_active_hang_scap: svg(300,200,`<rect x="80" y="22" width="140" height="8" rx="3" fill="${L}"/>${HEAD(150,48)}<line x1="150" y1="60" x2="150" y2="115" stroke="${T}" stroke-width="2.5"/><line x1="150" y1="115" x2="140" y2="170" stroke="${T}" stroke-width="2"/><line x1="150" y1="115" x2="160" y2="170" stroke="${T}" stroke-width="2"/><line x1="148" y1="68" x2="120" y2="30" stroke="${T}" stroke-width="2"/><line x1="152" y1="68" x2="180" y2="30" stroke="${T}" stroke-width="2"/><path d="M135 75 L125 65" stroke="${G}" stroke-width="2"/><path d="M165 75 L175 65" stroke="${G}" stroke-width="2"/><text x="150" y="185" fill="${G}" font-size="8" text-anchor="middle">SHOULDERS DOWN + BACK</text><text x="50" y="75" fill="${G}" font-size="7">ACTIVE</text><text x="230" y="75" fill="${R}" font-size="7">NOT PASSIVE</text>`,"ACTIVE HANG — SCAPULAR"),
  climb_ext_rotation_band: svg(300,200,`${STAND(150,50)}<line x1="145" y1="78" x2="130" y2="78" stroke="${T}" stroke-width="2"/><line x1="130" y1="78" x2="130" y2="100" stroke="${T}" stroke-width="2"/><line x1="155" y1="78" x2="170" y2="78" stroke="${T}" stroke-width="2"/><line x1="170" y1="78" x2="200" y2="78" stroke="${T}" stroke-width="2" stroke-dasharray="4"/><line x1="200" y1="78" x2="250" y2="78" stroke="${W}" stroke-width="1" stroke-dasharray="3"/><text x="255" y="76" fill="${W}" font-size="7">BAND</text><path d="M170 78 Q180 60 200 78" stroke="${G}" stroke-width="1.5" fill="none"/><text x="185" y="55" fill="${G}" font-size="7">ROTATE</text><text x="185" y="65" fill="${G}" font-size="7">OUT</text>`,"EXTERNAL ROTATION — BAND"),

  // ══════════ FINGER REHAB EXERCISES ══════════
  climb_finger_tendon_glides: svg(300,200,`<text x="50" y="60" fill="${T}" font-size="28">🖐️</text><text x="110" y="55" fill="${W}" font-size="8">→</text><text x="130" y="60" fill="${T}" font-size="22">✊</text><text x="170" y="55" fill="${W}" font-size="8">→</text><text x="190" y="60" fill="${T}" font-size="22">👊</text><text x="230" y="55" fill="${W}" font-size="8">→</text><text x="245" y="60" fill="${T}" font-size="22">🤚</text><text x="60" y="100" fill="${G}" font-size="8">STRAIGHT</text><text x="128" y="100" fill="${G}" font-size="8">HOOK</text><text x="190" y="100" fill="${G}" font-size="8">FIST</text><text x="235" y="100" fill="${G}" font-size="8">TABLE</text><text x="150" y="140" fill="${I}" font-size="8" text-anchor="middle">10 SLOW CYCLES — 3-5x DAILY</text><text x="150" y="160" fill="${W}" font-size="7" text-anchor="middle">3 seconds per position</text>`,"TENDON GLIDE SEQUENCE"),
  climb_finger_rom_isolation: svg(300,200,`<line x1="80" y1="120" x2="80" y2="70" stroke="${T}" stroke-width="3"/><line x1="110" y1="120" x2="110" y2="60" stroke="${T}" stroke-width="3"/><line x1="140" y1="120" x2="140" y2="55" stroke="${T}" stroke-width="3"/><line x1="170" y1="120" x2="170" y2="65" stroke="${T}" stroke-width="3"/><line x1="200" y1="120" x2="200" y2="80" stroke="${T}" stroke-width="3"/><rect x="65" y="120" width="150" height="12" rx="4" fill="${T}" opacity="0.3"/><text x="80" y="145" fill="${W}" font-size="7">thumb</text><text x="110" y="145" fill="${W}" font-size="7">index</text><text x="137" y="145" fill="${W}" font-size="7">middle</text><text x="170" y="145" fill="${W}" font-size="7">ring</text><text x="197" y="145" fill="${W}" font-size="7">pinky</text><path d="M140 55 L140 90" stroke="${G}" stroke-width="1.5" stroke-dasharray="3"/><text x="155" y="75" fill="${G}" font-size="7">FLEX/EXT</text><text x="150" y="175" fill="${I}" font-size="7" text-anchor="middle">EACH FINGER INDIVIDUALLY — 10 REPS</text>`,"FINGER ISOLATION ROM"),
  climb_palm_crimp: svg(300,200,`<rect x="80" y="120" width="140" height="8" rx="3" fill="${L}"/><text x="150" y="115" fill="${W}" font-size="8" text-anchor="middle">FLAT SURFACE</text><line x1="100" y1="120" x2="90" y2="100" stroke="${T}" stroke-width="3"/><line x1="125" y1="118" x2="120" y2="95" stroke="${T}" stroke-width="3"/><line x1="150" y1="118" x2="150" y2="93" stroke="${T}" stroke-width="3"/><line x1="175" y1="118" x2="180" y2="95" stroke="${T}" stroke-width="3"/><path d="M130 100 L130 112" stroke="${G}" stroke-width="2"/><text x="150" y="80" fill="${G}" font-size="8" text-anchor="middle">PRESS — 3-5s HOLD</text><text x="150" y="165" fill="${R}" font-size="7" text-anchor="middle">PAIN-FREE ONLY — Level 1</text>`,"PALM CRIMP — LEVEL 1"),
  climb_putty_crimp: svg(300,200,`<ellipse cx="150" cy="100" rx="30" ry="20" fill="${G}" opacity="0.2" stroke="${G}" stroke-width="1.5"/><text x="150" y="105" fill="${G}" font-size="8" text-anchor="middle">PUTTY</text><line x1="120" y1="85" x2="115" y2="65" stroke="${T}" stroke-width="3"/><line x1="140" y1="82" x2="138" y2="60" stroke="${T}" stroke-width="3"/><line x1="160" y1="82" x2="162" y2="60" stroke="${T}" stroke-width="3"/><line x1="180" y1="85" x2="185" y2="65" stroke="${T}" stroke-width="3"/><path d="M130 78 L150 90" stroke="${T}" stroke-width="1.5"/><path d="M170 78 L150 90" stroke="${T}" stroke-width="1.5"/><text x="150" y="140" fill="${I}" font-size="8" text-anchor="middle">SQUEEZE WITH FINGERTIPS</text><text x="150" y="165" fill="${W}" font-size="7" text-anchor="middle">Soft → Medium → Firm — Level 2</text>`,"PUTTY CRIMP — LEVEL 2"),
  climb_farmer_crimp_db: svg(300,200,`${STAND(120,50)}<line x1="125" y1="78" x2="160" y2="85" stroke="${T}" stroke-width="2"/><rect x="155" y="80" width="8" height="30" rx="2" fill="${W}"/><text x="175" y="100" fill="${W}" font-size="7">DUMBBELL</text><text x="175" y="112" fill="${W}" font-size="7">FINGERTIP</text><text x="175" y="124" fill="${W}" font-size="7">GRIP ONLY</text><text x="150" y="185" fill="${I}" font-size="7" text-anchor="middle">START 5 lbs — +2.5 lbs/week — Level 3</text>`,"FARMER CRIMP — LEVEL 3"),
  climb_iso_hangboard_loading: svg(300,200,`<rect x="80" y="22" width="140" height="10" rx="3" fill="${L}"/><rect x="100" y="18" width="100" height="8" rx="2" fill="${I}" opacity="0.4"/><text x="150" y="15" fill="${I}" font-size="7" text-anchor="middle">JUG HOLD</text>${HEAD(150,55)}<line x1="150" y1="67" x2="150" y2="115" stroke="${T}" stroke-width="2.5"/><line x1="150" y1="115" x2="140" y2="150" stroke="${T}" stroke-width="2"/><line x1="140" y1="150" x2="140" y2="175" stroke="${T}" stroke-width="2"/><line x1="150" y1="115" x2="160" y2="150" stroke="${T}" stroke-width="2"/><line x1="160" y1="150" x2="160" y2="175" stroke="${T}" stroke-width="2"/><line x1="148" y1="75" x2="125" y2="30" stroke="${T}" stroke-width="2"/><line x1="152" y1="75" x2="175" y2="30" stroke="${T}" stroke-width="2"/><text x="60" y="80" fill="${G}" font-size="7">30-70%</text><text x="60" y="92" fill="${G}" font-size="7">LOAD</text><text x="150" y="185" fill="${W}" font-size="7" text-anchor="middle">OPEN HAND ONLY — FEET ASSIST — Level 4</text>`,"ISOMETRIC HANGBOARD — LEVEL 4"),
  climb_eccentric_wrist_curl: svg(300,200,`<rect x="60" y="100" width="100" height="6" rx="2" fill="${L}" opacity="0.5"/>${HEAD(110,50)}<line x1="110" y1="62" x2="110" y2="100" stroke="${T}" stroke-width="2.5"/><line x1="112" y1="70" x2="160" y2="95" stroke="${T}" stroke-width="2.5"/><line x1="160" y1="95" x2="175" y2="115" stroke="${T}" stroke-width="2" stroke-dasharray="4"/><rect x="170" y="112" width="8" height="12" rx="2" fill="${W}"/><text x="195" y="120" fill="${R}" font-size="7">SLOW 4-5s</text><path d="M175 100 L175 115" stroke="${R}" stroke-width="1.5"/><text x="150" y="155" fill="${G}" font-size="8" text-anchor="middle">ECCENTRIC = HEALING</text><text x="150" y="170" fill="${I}" font-size="7" text-anchor="middle">Palm UP — lower slowly</text>`,"ECCENTRIC WRIST CURL"),
  climb_forearm_flexor_massage: svg(300,200,`<line x1="60" y1="110" x2="230" y2="110" stroke="${T}" stroke-width="6"/><circle cx="140" cy="105" r="8" fill="${W}"/><path d="M110 100 L170 100" stroke="${G}" stroke-width="1" stroke-dasharray="3"/><text x="150" y="85" fill="${G}" font-size="8" text-anchor="middle">SLOW ROLL — FLEXOR SIDE</text><text x="150" y="140" fill="${I}" font-size="7" text-anchor="middle">HOLD ON TENDER SPOTS 10s</text><text x="150" y="165" fill="${W}" font-size="7" text-anchor="middle">2 min each arm — reduces pump</text>`,"FOREARM FLEXOR MASSAGE"),
  stab_side_plank: svg(300,200,`${FLOOR(175)}${HEAD(80,72)}
<line x1="80" y1="81" x2="90" y2="120" stroke="${T}" stroke-width="2.5"/>
<line x1="90" y1="120" x2="100" y2="145" stroke="${T}" stroke-width="2.5"/>
<line x1="100" y1="145" x2="80" y2="175" stroke="${T}" stroke-width="2.5"/>
<line x1="80" y1="175" x2="60" y2="175" stroke="${T}" stroke-width="2.5"/>
<line x1="90" y1="120" x2="120" y2="145" stroke="${T}" stroke-width="2.5"/>
<line x1="120" y1="145" x2="100" y2="175" stroke="${T}" stroke-width="2.5"/>
<line x1="82" y1="100" x2="60" y2="175" stroke="${T}" stroke-width="2.5"/>
<line x1="82" y1="100" x2="100" y2="80" stroke="${T}" stroke-width="2.5"/>
<path d="M60 175 L60 170" stroke="${T}" stroke-width="3"/>
<text x="150" y="90" fill="${G}" font-size="8" text-anchor="middle">HIPS LIFTED</text>
<path d="M120 95 L105 110" stroke="${G}" stroke-width="1" marker-end="url(#arr)"/>
<text x="150" y="110" fill="${I}" font-size="7" text-anchor="middle">FOREARM FLAT</text>
<text x="150" y="125" fill="${I}" font-size="7" text-anchor="middle">KNEES BENT 90°</text>
<text x="200" y="165" fill="${W}" font-size="7" text-anchor="middle">Body straight: ear–shoulder–hip</text>`,"SIDE PLANK (FROM KNEES)"),
  climb_contrast_therapy: svg(300,200,`<rect x="40" y="60" width="90" height="80" rx="10" fill="${R}" opacity="0.15"/><text x="85" y="95" fill="${R}" font-size="10" text-anchor="middle">WARM</text><text x="85" y="110" fill="${R}" font-size="8" text-anchor="middle">3 min</text><rect x="170" y="60" width="90" height="80" rx="10" fill="${I}" opacity="0.15"/><text x="215" y="95" fill="${I}" font-size="10" text-anchor="middle">COLD</text><text x="215" y="110" fill="${I}" font-size="8" text-anchor="middle">1 min</text><path d="M135 100 L165 100" stroke="${W}" stroke-width="2"/><text x="150" y="95" fill="${W}" font-size="12" text-anchor="middle">→</text><text x="150" y="165" fill="${G}" font-size="8" text-anchor="middle">× 3 CYCLES</text><text x="150" y="180" fill="${W}" font-size="7" text-anchor="middle">Promotes blood flow · reduces swelling</text>`,"CONTRAST THERAPY — HOT/COLD"),
};

export default EXERCISE_SVGS;
