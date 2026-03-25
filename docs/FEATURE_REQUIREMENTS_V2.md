# APEX Coach — Feature Requirements V2
## All requirements from founder review — March 25, 2026

---

## INTAKE & ASSESSMENT (Priority: HIGH — Build First)

### Full NASM Initial Assessment Protocol
- Posture assessment questions (anterior pelvic tilt, kyphosis, forward head, etc.)
- Movement screen: overhead squat assessment, single-leg squat, push-up, pulling assessment
- Health history questionnaire (PAR-Q+ standard)
- Injury history with ability to ADD, EDIT, REMOVE injuries at any time
- Current fitness level auto-detection from assessment results
- ROM assessment for all major joints — flag restrictions
- VO2 max baseline estimation (talk test or step test protocol)

### Goal Selection at Intake
- User selects PRIMARY focus per muscle group: **Size vs Strength**
- App cross-references with compensatory muscle needs:
  - If user wants chest size → ensure rear delts, rotator cuff, and thoracic mobility are programmed to prevent shoulder impingement
  - If user wants quad strength → ensure hamstring and glute strength keeps pace (quad:hamstring ratio)
  - If user wants core aesthetics → ensure deep stabilizer training (TVA, multifidus) not just rectus abdominis
- App shows user WHY compensatory exercises are included: "You selected chest size. We've added face pulls and external rotations to protect your shoulders and maintain joint health."

### Location Selection
- Gym / Home / Outdoor — asked at check-in
- Adapts entire exercise selection based on available equipment
- Home: bodyweight + bands + dumbbells (user specifies what they have)
- Outdoor: bodyweight + minimal gear
- Gym: full equipment access

---

## DAILY WORKOUT LOGIC (Priority: HIGH)

### Transparency Layer — Show Your Work
When generating or recalculating the daily plan, show the user:
- "Today's plan was built considering: [list of factors]"
  - Your readiness score (RTT: X)
  - Your capacity score (CTP: X)  
  - Injury protocols active: [list]
  - Soreness reported in: [areas]
  - Stress level: X → volume adjusted by Y%
  - Location: [gym/home/outdoor]
  - Phase: X, Week: Y — progressive overload applied
  - Last session's reflection data incorporated
- Exercise-by-exercise: WHY this exercise was selected
- What was EXCLUDED and why (e.g., "Conventional deadlift excluded — post-surgical lower back. Trap bar deadlift substituted to reduce shear force by ~20%")
- Make it feel like a team of experts built this plan for them personally

### Difficulty Override
- After plan is generated, give option: "Want to push harder today?"
- Three levels: Standard (recommended) / Push It / Full Send
- App runs safety check before allowing upgrade:
  - Check injury severity + recent pain reports
  - Check if they've earned the capacity (enough sessions at current level)
  - If NOT safe: explain why and offer a middle ground
  - If safe: increase intensity/volume within safe parameters
- Option works per-exercise too (not just whole session)

### Quick-Complete Mode on Workout Overview
- On the Train page workout list, each exercise has a **checkbox**
- User can tap to mark exercises complete WITHOUT going through the full guided flow
- For users who already know the exercises
- Still tracks the workout as completed
- Option to toggle between "Guided Mode" (full step-by-step) and "Quick Mode" (checklist)

### Add-On Exercises
- After main workout is generated, option: "+ Add Extra Work"
- Categories:
  - **McKenzie Protocol** — Full exercises from "Treat Your Own Back", "Treat Your Own Neck", "Treat Your Own Knee/Hip"
  - **Foam Rolling** — Target areas based on today's workout + soreness
  - **Additional PT Exercises** — Specific rehab movements for active injuries
  - **Bodyweight Fundamentals** — Push-ups, pull-ups, squats, lunges, planks
  - **Mobility Flow** — Full body ROM routine
  - **Sport-Specific** — BJJ drills, shadow boxing, balance work
- Recalculate total workout time after add-ons
- NEVER remove core exercises to make room for add-ons
- If total time exceeds user's available time, suggest what to defer vs keep

### Core Movement Patterns Daily
- Ensure every session includes fundamental movement patterns:
  - Push (horizontal or vertical)
  - Pull (horizontal or vertical)
  - Hinge (deadlift pattern)
  - Squat (bilateral or unilateral)
  - Carry/Brace (core stabilization)
- If user wants bodyweight focus: push-ups, pull-ups, squats, lunges included as primary or add-on
- Don't duplicate if already in the main plan

---

## RECOVERY & REHAB (Priority: HIGH)

### Daily ROM + Stretching
- Every session starts with full-body ROM assessment moves
- Extra time on trouble areas (flagged injuries + reported soreness)
- Combines PT-informed movements with evidence-based mobility work
- Every session ENDS with static stretching:
  - All areas trained that day
  - Extra time on trouble areas
  - Include foam rolling as optional add-on
  - Include rehab-specific movements for active injuries
- Goal: user recovers well and is ready for next day

### McKenzie Protocol Library
Full exercise database from McKenzie Method books:
- **Back:** Extension in lying, extension in standing, flexion in lying, flexion in sitting, side gliding, rotation
- **Neck:** Retraction, extension, rotation, lateral flexion, protraction-retraction cycles
- **Hip:** Internal/external rotation progressions, flexion/extension cycles
- **Knee:** Terminal extension, flexion loading, patellar mobilization
Each with: description, illustration, sets/reps, frequency, contraindications, progression criteria

---

## OVERTRAINING PREVENTION (Priority: HIGH)

### Volume Regulation Engine
- Follow evidence-based volume guidelines per muscle group per week:
  - Beginners: 10-12 sets/muscle group/week
  - Intermediate: 14-18 sets/muscle group/week  
  - Advanced: 18-24 sets/muscle group/week
- Phase-appropriate set limits:
  - Phase 1 (first 2 weeks): 1-2 sets per exercise MAX
  - Phase 1 (weeks 3-4): 2-3 sets per exercise
  - Phase 2+: progressive increase based on adaptation
- NEVER exceed user's earned volume even if they have extra time
- If user has 2 hours but is Week 1: fill extra time with mobility, foam rolling, cardio — NOT extra sets
- Track weekly volume per muscle group and flag if approaching overtraining threshold
- Deload week every 4th week (reduce volume 40-50%)

### Burnout Prevention
- Monitor session-to-session trends:
  - Declining energy scores
  - Increasing soreness
  - Decreasing enjoyment scores
  - Pain scores increasing
- If 3+ sessions show declining trend → auto-suggest deload or recovery week
- Never allow sudden volume jumps (>10% increase week-to-week)

---

## USER FEEDBACK & FAVORITES (Priority: MEDIUM)

### Post-Session Feedback
- After each session, option to give feedback:
  - "Too easy" / "Just right" / "Too hard"
  - "Loved [exercise]" / "Didn't like [exercise]"
  - Free-text: "My shoulder felt weird during landmine press"
- Feedback feeds into next session's generation
- Updates the exercise database if relevant (e.g., marks exercise as problematic for user)

### Favorite Exercises
- User can "star" any exercise from library
- If assessment shows they're not ready for a favorite:
  - Show: "Great choice! Here's our plan to get you there."
  - Include a simplified/regressed version NOW
  - Show estimated timeline for when they can do the full version
  - Track progression toward the favorite
- Example: User favorites barbell bench press but has labrum tear
  - NOW: Floor press with light DBs (limited ROM, shoulder-safe)
  - Week 4: Incline DB press (if pain-free progression met)
  - Week 8: Flat DB press
  - Week 12+: Barbell bench (if all criteria met)
  - User sees this roadmap and feels invested

### Exercise Plan Review
- After long-term plan is generated, user can review each exercise
- Option to request alternatives: "I don't have access to this equipment" or "I don't like this exercise"
- App suggests replacement from same movement pattern + muscle group
- Alternative must pass injury safety check before being offered

---

## VO2 MAX & CARDIO (Priority: MEDIUM)

### VO2 Max Tracking
- Initial assessment: estimated from resting heart rate or step test
- Progressive cardio prescription based on current VO2 estimate
- Include in routines: zone 2 cardio, interval training (when ready)
- Track improvements over time
- Home page widget showing VO2 progress toward goal
- Visual: "You are HERE on your cardiovascular fitness journey"

### Home Page Progress Visuals
- VO2 max progress (with goal marker)
- Strength goals progress (deadlift, bench, mile time)
- Body composition trend (if user tracks)
- Phase progression timeline
- Injury recovery progress per protocol

---

## EXERCISE DATABASE (Priority: HIGH for MVP)

### Architecture
- Build a structured database of exercises (JSON or SQLite)
- Each exercise includes:
  - Name, description, step-by-step instructions
  - SVG illustration or image reference
  - Primary/secondary muscles
  - Equipment required
  - Phase eligibility
  - Contraindications (injury-specific)
  - Substitution map (what to swap if user can't do it)
  - Regression/progression options
  - Sport tags
  - Evidence rating
  - Last updated date + source
- Database loads once, not re-parsed every session
- AI generates coaching LANGUAGE from the database (not the exercise selection itself)

### Keeping Database Current
- Version the database with dates
- Flag exercises for review if medical/science literature changes
- Option for manual updates
- For v1: curated database of 50-100 exercises covering all movement patterns
- For v2: automated updates from evidence review

### Where to Build It
For a 1-week MVP with family/friends testing:
- **Database**: JSON file in the project (simple, fast, no server needed)
- **Hosting**: Vercel (free, instant deploys)
- **Auth**: None for v1 — each person's data stays in their browser (localStorage)
- **Multi-user for v2**: Supabase (free tier, adds auth + database)

---

## DEPLOYMENT — LIVE IN 1 WEEK

### MVP Feature Set (What to build this week)
1. Check-in with location selector ✅
2. Exercise database (JSON, 50 exercises) 
3. Workout generation from database + user profile
4. Quick-complete mode on workout list
5. Rest timers on all exercises ✅
6. Post-session feedback
7. localStorage persistence
8. Static stretching cooldown for every session
9. Deploy to Vercel with shareable URL

### Family & Friends Access
- Deploy to Vercel → get URL like `apex-coach.vercel.app`
- Share URL with family/friends
- Each person's data stored in their own browser (localStorage)
- They bookmark it as a PWA on their phones
- For v2: add Supabase for proper user accounts + cloud data

---

## NASM PROTOCOL COMPLIANCE CHECKLIST

The app must follow these NASM standards:
- [ ] OPT Model phase parameters (sets, reps, tempo, rest per phase)
- [ ] CEx Continuum every session: Inhibit → Lengthen → Activate → Integrate
- [ ] Acute variables match phase (not arbitrary)
- [ ] Progressive overload follows 2-10% rule
- [ ] Volume starts conservative and builds (1-2 sets week 1)
- [ ] Deload programmed every 4th week
- [ ] Movement assessments inform exercise selection
- [ ] Contraindicated exercises auto-excluded per injury
- [ ] Core training included every session
- [ ] Flexibility training included every session
- [ ] Cardio prescription matches fitness level and phase
