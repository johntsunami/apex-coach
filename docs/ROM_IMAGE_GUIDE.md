# ROM Exercise Image Sourcing Guide

## How Images Work

Both `MorningROM.jsx` and `EveningROM.jsx` support an `imageUrl` field on each exercise.
- If `imageUrl` is set: shows the photo with the SVG as a hidden fallback (auto-shows SVG if image fails to load)
- If `imageUrl` is not set: shows the stick-figure SVG as before

To add an image to any exercise, just add `imageUrl: "https://..."` to its data object.

---

## Image Specs

- **Aspect ratio**: Landscape or square (the UI crops to `max-height: 260px` with `object-fit: cover`)
- **Min resolution**: 600px wide (displays at 100% container width, max ~480px on mobile)
- **Format**: JPEG or WebP preferred (smaller file size than PNG)
- **File size**: Under 200KB ideally — these load on mobile during a timed exercise flow
- **Background**: Any — the UI has rounded corners and a dark border
- **Content**: Single person demonstrating the exercise, clear body position visible

---

## Option 1: AI Image Generation (Recommended for Consistency)

### Master Prompt Template (for DALL-E, Midjourney, or Flux)

```
A single person demonstrating [EXERCISE NAME] in a clean, modern fitness studio
with natural lighting. The person is wearing dark athletic clothing on a yoga mat.
Camera angle: [ANGLE]. The pose clearly shows [KEY POSITION DETAILS].
Photorealistic, warm lighting, shallow depth of field, fitness photography style.
No text, no watermarks, no equipment logos. Aspect ratio 3:2.
```

### Per-Exercise Prompts

#### MORNING ROM (30 exercises)

**1. Neck Rotation**
```
A single person standing tall demonstrating a neck rotation stretch, head turned
to look over their left shoulder, chin level. Clean modern gym, natural lighting.
Camera angle: front 3/4 view. Photorealistic fitness photography, 3:2 aspect ratio.
```

**2. Neck Flexion / Extension**
```
A single person standing demonstrating neck flexion with chin tucked toward chest.
Side profile view showing the cervical spine curve. Clean studio, natural lighting.
Photorealistic fitness photography, 3:2 aspect ratio.
```

**3. Neck Lateral Flexion**
```
A single person standing demonstrating ear-to-shoulder neck stretch, right ear
tilting toward right shoulder, left shoulder visibly staying down. Front view.
Clean studio, natural lighting. Photorealistic fitness photography, 3:2 aspect ratio.
```

**4. Neck Retraction (Chin Tuck)**
```
A single person standing demonstrating a chin tuck/neck retraction, creating a
"double chin" position with chin pulled straight back. Side profile view clearly
showing the retraction movement. Clean studio. Photorealistic, 3:2 aspect ratio.
```

**5. Shoulder Shrugs + Rolls**
```
A single person standing demonstrating shoulder shrugs with shoulders raised toward
ears. Front view showing the elevation of both shoulders. Clean modern gym.
Photorealistic fitness photography, 3:2 aspect ratio.
```

**6. Y-Raise (Thumbs Up)**
```
A single person standing with both arms raised overhead in a Y-shape, thumbs
pointing up, arms at 45 degrees from the head. Front view. Clean studio.
Photorealistic fitness photography, 3:2 aspect ratio.
```

**7. Shoulder Pass-Through**
```
A single person standing holding a resistance band or dowel with wide grip,
performing a shoulder pass-through with arms overhead. Side view showing the
arc of movement. Clean studio. Photorealistic fitness photography, 3:2.
```

**8. Cross-Body Shoulder Stretch**
```
A single person standing demonstrating a cross-body shoulder stretch, right arm
pulled across the chest with left hand at the elbow. Front 3/4 view. Clean
studio, natural lighting. Photorealistic fitness photography, 3:2 aspect ratio.
```

**9. Wrist Circles**
```
Close-up of a person's hands and forearms with wrists extended, performing wrist
circles. Both arms forward, circular motion arrows implied by wrist position.
Clean studio background. Photorealistic, 3:2 aspect ratio.
```

**10. Finger Tendon Glides**
```
Close-up of a person's hands demonstrating finger tendon glides — one hand in
a hook fist position, the other in a flat fist. Clean white/gray background.
Medical/therapeutic photography style, 3:2 aspect ratio.
```

**11. Standing Extension (McKenzie)**
```
A single person standing with hands on lower back, gently arching backward in
a McKenzie standing extension. Side profile view clearly showing the lumbar
extension. Clean studio. Photorealistic fitness photography, 3:2 aspect ratio.
```

**12. Standing Lateral Flexion**
```
A single person standing demonstrating a side bend stretch, right arm reaching
overhead and leaning left, left hand sliding down the thigh. Front view. Clean
studio, natural lighting. Photorealistic fitness photography, 3:2 aspect ratio.
```

**13. Standing Thoracic Rotation**
```
A single person standing with arms crossed on chest, rotating upper body to the
left while hips face forward. Top-down 3/4 view showing the rotation. Clean
studio. Photorealistic fitness photography, 3:2 aspect ratio.
```

**14. McKenzie Press-Up**
```
A single person lying face down on a yoga mat, pressing upper body up with
straight arms while hips remain on the floor (McKenzie press-up / prone
extension). Side view. Clean studio. Photorealistic fitness photography, 3:2.
```

**15. Cat-Cow**
```
A single person on hands and knees on a yoga mat demonstrating the cat position
(back rounded toward ceiling, head tucked). Side view clearly showing spinal
flexion. Clean studio, natural lighting. Photorealistic, 3:2 aspect ratio.
```

**16. Hip Extension in Kneeling**
```
A single person in a half-kneeling lunge position (right foot forward, left
knee on mat), pushing hips forward for a hip flexor stretch. Side view. Clean
studio, yoga mat. Photorealistic fitness photography, 3:2 aspect ratio.
```

**17. Single Knee to Chest**
```
A single person lying on their back on a yoga mat, pulling one knee toward their
chest with both hands while the other leg lies flat. Side view. Clean studio.
Photorealistic fitness photography, 3:2 aspect ratio.
```

**18. Double Knees to Chest**
```
A single person lying on their back, both knees pulled to chest, arms wrapped
around shins. Side view showing the tucked position. Clean studio, yoga mat.
Photorealistic fitness photography, 3:2 aspect ratio.
```

**19. Seated Figure-4 (Piriformis)**
```
A single person sitting in a chair with right ankle crossed over left knee
(figure-4 position), leaning slightly forward. Front 3/4 view. Clean studio.
Photorealistic fitness photography, 3:2 aspect ratio.
```

**20. Butterfly Stretch**
```
A single person sitting on a yoga mat in butterfly stretch position — soles of
feet together, knees out to sides, sitting tall. Front view. Clean studio.
Photorealistic fitness photography, 3:2 aspect ratio.
```

**21. Hip Abduction/ER (McKenzie)**
```
A single person sitting in a chair with right ankle on left knee, using hand to
gently push the right knee outward. Front 3/4 view showing the figure-4 position
with active push. Clean studio. Photorealistic fitness photography, 3:2.
```

**22. Prone Quad Stretch**
```
A single person lying face down on a yoga mat, bending right knee and reaching
back to grab right ankle, pulling heel toward glute. Side view. Clean studio.
Photorealistic fitness photography, 3:2 aspect ratio.
```

**23. Standing Quad Stretch**
```
A single person standing on one leg, holding right ankle behind them for a
standing quad stretch, left hand on wall for balance. Side view. Clean studio.
Photorealistic fitness photography, 3:2 aspect ratio.
```

**24. Standing Hamstring Stretch**
```
A single person standing with one foot elevated on a low step, hinging forward
at the hips with a flat back for a standing hamstring stretch. Side view showing
flat back clearly. Clean studio. Photorealistic fitness photography, 3:2.
```

**25. Supine Hamstring Stretch (Strap)**
```
A single person lying on their back on a yoga mat, one leg raised toward ceiling
with a strap/towel around the foot, gently pulling the leg toward them. Side
view. Clean studio. Photorealistic fitness photography, 3:2 aspect ratio.
```

**26. Runner's Calf Stretch**
```
A single person facing a wall in a runner's lunge position for a calf stretch —
back leg straight, heel on floor, leaning into the wall. Side view clearly
showing the straight back leg. Clean studio. Photorealistic, 3:2 aspect ratio.
```

**27. Soleus / Achilles Stretch**
```
A single person facing a wall in a calf stretch position with the back knee
slightly bent (targeting soleus), heel on floor. Side view showing the bent
knee. Clean studio. Photorealistic fitness photography, 3:2 aspect ratio.
```

**28. Ankle Circles**
```
A single person seated, one foot lifted, drawing circles with the foot/ankle.
Close-up of the lower leg and foot showing the circular motion. Clean studio.
Photorealistic fitness photography, 3:2 aspect ratio.
```

**29. Ankle Dorsiflexion Mobilization**
```
A single person in a half-kneeling position facing a wall, pushing front knee
forward over toes for ankle dorsiflexion mobilization, heel on ground. Side
view. Clean studio. Photorealistic fitness photography, 3:2 aspect ratio.
```

**30. Diaphragmatic Breathing**
```
A single person standing with one hand on chest and one hand on belly,
demonstrating diaphragmatic breathing. Front 3/4 view. Peaceful expression,
relaxed shoulders. Clean studio. Photorealistic fitness photography, 3:2.
```

#### BEFORE BED ROM (17 exercises)

**1. McKenzie Prone on Elbows (Sphinx)**
```
A single person lying face down on a yoga mat, propped up on forearms with
elbows under shoulders in sphinx pose, relaxed expression, hips on the floor,
belly sagging. Side view. Warm dim studio lighting. Photorealistic, 3:2.
```

**2. Supine Neck Release**
```
A single person lying on their back with a rolled towel under the curve of
their neck for gentle cervical traction, eyes closed, arms relaxed. Side view
close-up of head/neck area. Warm dim lighting. Photorealistic, 3:2.
```

**3. Supine Neck Rotation**
```
A single person lying on their back, head gently rolled to one side for passive
neck rotation, eyes closed. Top-down or 3/4 view. Warm dim studio lighting.
Photorealistic, 3:2 aspect ratio.
```

**4. Supine Chest Opener**
```
A single person lying on their back on a foam roller placed lengthwise along
the spine, arms relaxed out to the sides palms up, chest open. Front/above
view. Warm dim studio lighting. Photorealistic, 3:2 aspect ratio.
```

**5. Supine Arms Overhead**
```
A single person lying on their back with both arms extended overhead toward
the floor behind their head, thumbs up, relaxed. Side view. Warm dim studio.
Photorealistic, 3:2 aspect ratio.
```

**6. Thoracic Extension Over Roller**
```
A single person lying back over a foam roller placed horizontally across their
mid-back, arms overhead or crossed on chest, draping over the roller. Side
view. Warm dim studio. Photorealistic, 3:2 aspect ratio.
```

**7. Supine Spinal Twist**
```
A single person lying on their back, knees dropped to one side, arms in a
T-shape, head turned opposite direction. Overhead or 3/4 view showing the
full twist. Warm dim studio, yoga mat. Photorealistic, 3:2 aspect ratio.
```

**8. Legs Up the Wall**
```
A single person lying on their back with legs extended straight up against a
wall, butt close to the wall, arms relaxed at sides palms up. Side view. Warm
dim studio lighting. Photorealistic, 3:2 aspect ratio.
```

**9. Wall Straddle**
```
A single person lying on their back with legs up against a wall, spread apart
in a wide V-shape (straddle) for a gravity-assisted adductor stretch. Front
view showing the V of the legs. Warm dim lighting. Photorealistic, 3:2.
```

**10. Reclined Butterfly**
```
A single person lying on their back in reclined butterfly pose (supta baddha
konasana), soles of feet together, knees out to sides resting on pillows/blocks.
Front/above view. Warm dim lighting. Photorealistic, 3:2 aspect ratio.
```

**11. Supine Figure-4**
```
A single person lying on their back in supine figure-4 stretch — right ankle
crossed over left knee, pulling left thigh toward chest. Side view. Warm dim
studio, yoga mat. Photorealistic, 3:2 aspect ratio.
```

**12. Happy Baby**
```
A single person lying on their back in happy baby pose (ananda balasana),
knees pulled toward armpits, hands grabbing outer edges of feet. Front/above
view. Warm dim studio. Photorealistic, 3:2 aspect ratio.
```

**13. Supported Half Frog**
```
A single person lying face down with one knee bent, foot falling toward the
glute for a passive prone quad stretch. Side view showing the bent leg. Warm
dim studio, yoga mat. Photorealistic, 3:2 aspect ratio.
```

**14. Wall Hamstring Stretch**
```
A single person lying on their back near a wall/doorframe with one leg extended
straight up against the wall for a passive hamstring stretch, other leg flat.
Side view. Warm dim studio. Photorealistic, 3:2 aspect ratio.
```

**15. Wall Calf Stretch**
```
A single person lying on their back with the ball of one foot pressed against
a wall, knee slightly bent, for a supine calf stretch. Close-up side view of
leg and wall. Warm dim studio. Photorealistic, 3:2 aspect ratio.
```

**16. Supported Child's Pose**
```
A single person in child's pose (balasana) draped over a large pillow/bolster
between their thighs, head turned to one side, arms alongside the pillow.
Side view. Warm dim studio. Photorealistic, 3:2 aspect ratio.
```

**17. Savasana**
```
A single person lying on their back in savasana (corpse pose), legs slightly
apart, arms at sides palms up, eyes closed, pillow under knees. Overhead or
side view. Warm dim studio. Photorealistic, 3:2 aspect ratio.
```

---

## Option 2: Free Stock Photos (Pexels / Unsplash)

Both platforms are **free for commercial use** with no attribution required.

### Search Terms Per Exercise

| # | Exercise | Pexels Search | Unsplash Search |
|---|----------|--------------|-----------------|
| **MORNING ROM** | | | |
| 1 | Neck Rotation | `neck stretch exercise` | `neck rotation stretch` |
| 2 | Neck Flex/Ext | `neck stretch forward` | `chin tuck exercise` |
| 3 | Neck Lateral | `neck side stretch` | `lateral neck stretch` |
| 4 | Neck Retraction | `chin tuck posture` | `neck retraction exercise` |
| 5 | Shoulder Shrugs | `shoulder shrug exercise` | `shoulder shrug` |
| 6 | Y-Raise | `Y raise exercise arms overhead` | `arms overhead Y shape` |
| 7 | Pass-Through | `shoulder pass through band` | `shoulder dislocate band` |
| 8 | Cross-Body Stretch | `cross body shoulder stretch` | `shoulder stretch across` |
| 9 | Wrist Circles | `wrist exercise stretch` | `wrist mobility` |
| 10 | Finger Glides | `hand therapy exercise` | `finger exercise tendon` |
| 11 | Standing Extension | `standing back extension` | `McKenzie standing extension` |
| 12 | Lateral Flexion | `side bend stretch standing` | `lateral flexion stretch` |
| 13 | Thoracic Rotation | `torso rotation stretch` | `thoracic rotation standing` |
| 14 | McKenzie Press-Up | `cobra pose yoga` | `prone back extension exercise` |
| 15 | Cat-Cow | `cat cow yoga pose` | `cat cow stretch` |
| 16 | Hip Kneeling Ext | `hip flexor stretch kneeling` | `half kneeling hip stretch` |
| 17 | Knee to Chest | `knee to chest stretch supine` | `single knee chest lying` |
| 18 | Double Knees | `knees to chest yoga` | `double knee hug stretch` |
| 19 | Figure-4 | `piriformis stretch seated` | `figure four stretch chair` |
| 20 | Butterfly | `butterfly stretch yoga` | `baddha konasana` |
| 21 | Hip Abd/ER | `hip external rotation sitting` | `seated hip stretch` |
| 22 | Prone Quad | `prone quad stretch` | `lying quad stretch` |
| 23 | Standing Quad | `standing quad stretch wall` | `quad stretch standing` |
| 24 | Standing Hamstring | `hamstring stretch standing` | `standing hamstring stretch` |
| 25 | Supine Hamstring | `hamstring stretch strap lying` | `supine hamstring strap` |
| 26 | Calf Stretch | `wall calf stretch runner` | `calf stretch wall` |
| 27 | Soleus Stretch | `soleus stretch wall bent knee` | `achilles stretch` |
| 28 | Ankle Circles | `ankle mobility exercise` | `ankle circles` |
| 29 | Ankle Dorsiflex | `ankle dorsiflexion wall` | `knee over toe ankle` |
| 30 | Diaphragm Breath | `diaphragmatic breathing belly` | `belly breathing exercise` |
| **BEFORE BED ROM** | | | |
| 1 | McKenzie Sphinx | `sphinx pose yoga` | `sphinx pose prone` |
| 2 | Neck Release | `neck traction towel roll` | `supine neck release` |
| 3 | Neck Rotation | `supine neck rotation` | `lying neck stretch` |
| 4 | Chest Opener | `chest opener foam roller supine` | `lying chest stretch roller` |
| 5 | Arms Overhead | `supine arms overhead stretch` | `overhead stretch lying` |
| 6 | Thoracic Roller | `thoracic extension foam roller` | `foam roller back stretch` |
| 7 | Spinal Twist | `supine spinal twist yoga` | `supta matsyendrasana` |
| 8 | Legs Up Wall | `legs up the wall yoga` | `viparita karani` |
| 9 | Wall Straddle | `wall straddle stretch legs` | `legs apart wall stretch` |
| 10 | Reclined Butterfly | `reclined butterfly yoga` | `supta baddha konasana` |
| 11 | Supine Figure-4 | `supine piriformis stretch` | `supine figure four` |
| 12 | Happy Baby | `happy baby yoga pose` | `ananda balasana` |
| 13 | Half Frog | `prone quad stretch passive` | `half frog pose` |
| 14 | Wall Hamstring | `wall hamstring stretch supine` | `hamstring stretch wall` |
| 15 | Wall Calf | `calf stretch wall supine` | `supine calf wall` |
| 16 | Child's Pose | `child's pose yoga bolster` | `supported balasana` |
| 17 | Savasana | `savasana corpse pose yoga` | `savasana yoga relax` |

### Direct Pexels Search Links

- [Yoga Poses](https://www.pexels.com/search/yoga%20poses/)
- [Stretching](https://www.pexels.com/search/stretching/)
- [Neck Exercise](https://www.pexels.com/search/neck%20exercise/)
- [Legs Up Wall](https://www.pexels.com/search/legs%20on%20wall/)
- [Viparita Karani](https://www.pexels.com/search/viparita%20karani/)

### Direct Unsplash Search Links

- [Yoga Stretch](https://unsplash.com/s/photos/yoga-stretch)
- [Flexibility](https://unsplash.com/s/photos/flexibility)
- [Stretching Exercise](https://unsplash.com/s/photos/stretching-exercise)

---

## Option 3: Hybrid Approach (Recommended)

1. **Yoga/stretching poses** (child's pose, savasana, butterfly, happy baby, legs up wall, cat-cow, spinal twist): Use **Pexels/Unsplash** — these have excellent free yoga photography
2. **Clinical/PT exercises** (McKenzie press-up, chin tuck, wrist circles, finger glides, ankle dorsiflexion): Use **AI generation** — stock photos of these are rare and often wrong
3. **Simple standing stretches** (calf stretch, quad stretch, hamstring stretch, shoulder stretches): Use **Pexels/Unsplash** — common exercises, many options available

---

## How to Add Images

Once you have an image URL (hosted on your Supabase storage, Pexels CDN, or Unsplash CDN):

1. Open `src/components/MorningROM.jsx` or `src/components/EveningROM.jsx`
2. Find the exercise in the `ROM_EXERCISES` or `PM_EXERCISES` array
3. Add the `imageUrl` field:

```javascript
{
  id: "rom_cat_cow", name: "Cat-Cow", area: "Lumbar Spine", section: 5,
  imageUrl: "https://images.pexels.com/photos/XXXXXXX/pexels-photo-XXXXXXX.jpeg?auto=compress&cs=tinysrgb&w=600",
  hold: 2, reps: "10 full cycles", totalTime: 40,
  // ... rest of exercise data
}
```

The app will automatically show the photo when `imageUrl` is set, and fall back to the stick-figure SVG if the image fails to load.

### Hosting Options

- **Pexels CDN** (direct link): Free, reliable, but you're hotlinking — acceptable per Pexels TOS
- **Unsplash CDN** (direct link): Free, `images.unsplash.com/photo-XXXXX?w=600`
- **Supabase Storage** (your own): Upload to your project's Supabase storage bucket — most reliable, you control it
- **GitHub**: Commit to `public/images/rom/` — works but adds to repo size
