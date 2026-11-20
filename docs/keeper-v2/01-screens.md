# 01: Screens

Figma base URL: `https://www.figma.com/design/SKYG2erloPFJBj05RKYBcp/Glucose?node-id=<id with - instead of :>`

All app screens are 390 × 844 frames on page **02 · Screens & Flow** (`4:2`). The status bar in the frames is decoration only; the PWA uses the OS status bar, so leave `env(safe-area-inset-top)` padding instead. Each screen's caption in Figma explains its intent.

## Index
| ID | Screen | Figma node | Route (HashRouter) | Milestone |
|---|---|---|---|---|
| A1 | Welcome | `13:27` | `#/welcome` | M1 |
| A2 | What feels easy | `13:75` | `#/onboarding/easy` | M1 |
| A3 | Your rhythm (optional) | `13:152` | `#/onboarding/rhythm` | M1 |
| B1 | Today | `14:66` | `#/` | M1 |
| B2 | Log a meal (sheet) | `14:213` | `#/log/meal` (sheet over Today) | M1 |
| B3 | After-meal check-in | `14:292` | `#/checkin/:mealId` | M1 |
| B4 | Tiny habit timer | `14:370` | `#/habit/:habitId` | M2 |
| C1 | Fasting mode | `21:501` | `#/you/fasting` | M4 |
| C2 | Fasting safety check | `21:580` | `#/you/fasting/safety` | M4 |
| C3 | Fasting Today | `21:637` | `#/` (Today variant) | M4 |
| C4 | Ramadan Today | `15:521` | `#/` (Today variant) | M4 |
| D1 | Week | `16:387` | `#/week` | M1/M3 |
| D2 | Glucose comfort | `16:508` | `#/glucose/comfort` | M3 |
| D3 | Snap & seal | `16:572` | `#/glucose/check` | M3 |
| D4 | Sealed | `16:617` | `#/glucose/sealed/:id` | M3 |
| D5 | Opened · ranges | `16:657` | `#/glucose/reading/:id` | M3 |
| D6 | Safety · low reading | `16:716` | `#/glucose/safety/:id` | M3 |
| L | Landing page (desktop 1440) | `23:3` on page `23:2` | `/` (separate entry) | M5 |

**Components** live on page 03 (`4:3`):
- TabBar `5:166`
- LogTile `5:227`
- LogDot `5:228`
- Chip `5:237`
- Button `5:244`
- FaceOption `5:297`
- TimelineItem `5:298`
- StatusBar `5:5`: Figma-only, don't build it

**Context boards** on page 01 (`0:1`). Read these for the "why":
- Cover `6:2`
- Person `6:76`
- Landscape `7:2`
- Concept & Ladder `8:2`
- Foundations & voice `9:2`
- Tiny habits & Smart timing `10:2`
- Fasting mode `20:2`
- Fasting knowledge map `22:2`

---

## Flow A: Start gently

### A1 Welcome (`13:27`)
- **Purpose:** promise first. No numbers are needed.
- **Layout:**
  - 3×4 "quilt" motif (rounded 44 px tiles in accent and soft colours, some dashed)
  - Display headline "Hi. / I'm Keeper."
  - Body L
  - Privacy card (shield icon)
  - Primary button "Let's start gently"
  - Ghost button "I already track my glucose"
- **Behaviour:**
  - Primary → A2.
  - Ghost → sets `glucoseComfort='numbers'` and `ladderStep=6`, then continues to A2 with the glucose segment preset to "I'm ready".
  - Users migrated from v1 (they have legacy readings) see the same screen, with the body line "Welcome back — your readings are safe here."
- **Accept when:** no glucose wording appears above the fold except in the ghost button, and the screen works offline on first open after install.

### A2 What feels easy (`13:75`)
- **Layout:**
  - Step dots 1/3, plus a "Skip" link
  - Title, then multi-select Chips: Meals, Sleep, Feelings, Movement, Water, Medicines (defaults: Meals, Sleep, Feelings, Water)
  - Glucose card: segmented control "Not now" (default) / "Maybe later" / "I'm ready"
  - Tiny habits card with a toggle (default **off**)
  - Primary button "Continue"
- **Saves:** `settings.easyKinds`, `glucoseComfort` (`not-now | maybe-later | sealed`), `tinyHabits`.
- **Notes:**
  - "I'm ready" sets `glucoseComfort='sealed'` (not numbers) and `ladderStep=4`. Numbers stay one more explicit choice away (D2).
  - Medicines is a simple daily "taken" tick, no doses. It's undesigned: use a LogTile-style tile with lucide `pill`.

### A3 Your rhythm (`13:152`), optional
- **Layout:**
  - "Skip" top-right
  - Day & meals card: time chips for Wake, Breakfast, Lunch, Tea, Dinner and Sleep, each opening a native time picker
  - Workdays segmented control: Desk / On feet / Home / Shifts
  - "Anchors you already have" chips: Morning tea, Commute, Prayer times, Evening walk. Allow custom.
  - "Ramadan & fasting days" toggle with the caption "Offers Fasting mode, with a Ramadan preset"
  - Primary button "Save my rhythm"
- **Saves:** `settings.rhythm` (see 03). Skipping leaves `rhythm` undefined. Smart timing then uses defaults: wake 07:00, sleep 23:00, workday unknown.
- **Accept when:** every field is optional, and Back/Skip never loses data already entered.

## Flow B: A normal day

### B1 Today (`14:66`)
- **Layout, top to bottom:**
  1. Date overline + avatar initial
  2. Greeting by time of day ("Good morning / afternoon / evening, {name or nothing}")
  3. Patch strip: up to 8 rounded 18 px squares coloured by kind, plus the caption "{n} patches today"
  4. "Add to today" + 5 LogTiles (Meal, Sleep, Feeling, Move, Water), filtered to `easyKinds`. Hidden kinds can still be reached under "More".
  5. **Smart nudge card**, only if `pickNudge()` returns one: overline "Tiny habit · {context}", body, buttons "Let's do it" / "Not now", and a clock icon with "Why this? {reason}"
  6. "Today" timeline of TimelineItems: LogDot by kind, title, meta, time
  7. TabBar (Today)
- **Variants:**
  - an active fast replaces the top section with C3
  - Ramadan replaces it with C4
  - an envelope or check-in due shows a slim prompt card above the timeline
- **Never shows** a glucose value or band unless `glucoseComfort ∈ {ranges, numbers}`. Even then it shows only a slim "last reading" chip, never a chart.
- **Empty state:** "Nothing yet today. What feels easy to add?", with tiles highlighted.

### B2 Log a meal (`14:213`), bottom sheet (shadcn `Drawer`/vaul)
- **Layout:**
  - Header "Lunch · 1:15 pm" (meal name inferred from time and rhythm) + "Change time"
  - Photo area "Snap your plate" (`<input type="file" accept="image/*" capture="environment">`)
  - Quick-pick chips (Rice & curry, Roti & sabzi, Snack, Tea & biscuits, plus her recent picks)
  - "How big?" segmented: Light / Regular / Big
  - "How do you feel?" FaceOptions: Sleepy / Steady / Buzzy
  - Save
- **Three-tap rule:** Save is enabled after any one of photo or quick pick. Size defaults to Regular and feeling is optional.
- **On save:**
  - write a `meal` log
  - schedule the after-meal check-in (due 100–180 min)
  - if Tiny habits is on, `pickNudge()` runs on Today from now on
- **In Fasting mode:** add a 4th row "On the plate" (veg & protein / some carbs / carb-heavy). Optional.

### B3 After-meal check-in (`14:292`)
- **Shown** when the app is opened or refocused 100–180 min after a meal with no check-in. It's a full screen with a close button. After 180 min the prompt expires silently.
- **Layout:**
  - FaceOptions (energy)
  - "Anything else?" chips: Heavy, Thirsty, Headache, Hungry again, All fine
  - Pattern card (feeling-soft): only shown when the invitation engine sees a pattern (04)
  - Save / "Ask me later" (re-prompts once, 30 min later)
- **Accept when:** it never mentions glucose unless `ladderStep ≥ 4`.

### B4 Tiny habit timer (`14:370`)
- **Layout:**
  - Title from the habit, plus a subtitle
  - 240 px SVG ring: `move-soft` track and `primary` progress, Fraunces number "1:24" / "of 2:00"
  - "Why it might help" card with the source line
  - "I'm done" and the ghost button "End early — it still counts"
- **Count variant** (calf raises, desk moves): a large count instead of the ring, with a tap-to-count button.
- **On finish:** write a `move` log with `{habitId, minutes, endedEarly}`, record a NudgeEvent with outcome `completed` or `ended-early`, and the quilt patch gets a small leaf.
- **Accept when:** the timer keeps the correct elapsed time across backgrounding (store `startedAt`, not ticks), and reduced motion disables the ring animation.

## Flow C: Fasting mode
Read 05 before building.

### C1 Fasting mode (`21:501`)
- **Tracks** as radio cards:
  - Gentle overnight · 12 h (selected by default, pill "Recommended start")
  - Daily window · 13–16 h
  - Ramadan
  - Longer fasts · 24 h+ (disabled look, lock icon, "Only with your doctor's plan")
- **Footer note:** exclusions (type 1, pregnancy or breastfeeding, past eating difficulties).
- **First entry:** before C1, show a one-question exclusion check ("Do any of these apply to you?"). If any apply, show a kind unavailable state with a "Talk to your care team" summary export.
- **Continue:**
  - → C2 if the chosen track is longer than 12 h, or for Ramadan
  - otherwise start the overnight track

### C2 Fasting safety check (`21:580`)
- **Questions** (segmented Yes / No / Not sure):
  1. "Insulin, or a sulfonylurea like gliclazide?"
  2. "A medicine ending in "-gliflozin"?"
- **Rules:**
  - Q1 = Yes or Not sure → plum note, and the primary button becomes "Stay on gentle 12 h for now" until the checkbox "My care team knows I'm fasting and has adjusted my plan" is ticked.
  - Q2 = Yes or Not sure → add the hydration rule (water always allowed in the window; Ramadan requires the checkbox).
- **Ghost button:** "Share a summary with my doctor" (PDF via the existing export).
- **Store:** booleans only, on the device.

### C3 Fasting Today (`21:637`)
- **Header pill:** "Fasting · {track}".
- **Ring card:** 200 px SVG ring (`sleep-soft` track, `sleep` progress), Fraunces "13 h 20 m", "fasting · 40 min to go", and "Window opens 11:00 · closes 21:00".
- **"How does the fast feel?"** chips: Fine / Hungry / Headache / Shaky or dizzy. Picking "Shaky or dizzy" opens the stop-rule sheet immediately.
- **Other content:**
  - Plum strip "Shaky or dizzy? End the fast and check — it still counts."
  - Drink pills (Water · n, Black tea · n, + Add)
  - "Break your fast gently" card (move-soft)
  - Text button "End fast now — it still counts"

### C4 Ramadan Today (`15:521`)
- **Layout:**
  - "Ramadan · day N" and pill "Fasting now"
  - Plum countdown card "Iftar in 2 h 14 m" with "Suhoor ended 4:58 · Iftar 6:02 · {city}"
  - "No food nudges until iftar. Checking your glucose doesn't break your fast."
  - Outlined plum row "Break your fast if…" → sheet (05)
  - Iftar plan (Water & a date or two → Pause → A balanced plate)
  - Water tracker, 8 glasses, between iftar and suhoor
  - Post-iftar tiny habit chip

## Flow D: The bridge to glucose

### D1 Week (`16:387`)
- **Layout:**
  - "{date range}" + "Your week"
  - Quilt card: 7 rows (M–S) × up to 5 patches. Gaps are dashed and never red.
  - Up to 2 insight cards (04)
  - The glucose **invitation card** when eligible (04): "Tell me more" → D2, "Not now"
  - Below the fold: an "Envelopes" list once any reading exists (sealed ones show the envelope icon and time only)
- **Insight copy** is always an observation about her own logs, never causal (04).

### D2 Glucose comfort (`16:508`)
- **Title:** "If you check, how would you like to see it?"
- **Radio cards:** Sealed (default) / Ranges only / Numbers.
- **Ladder indicator:** 6 segments plus "Step 4 of 6 · Seal".
- **Buttons:** Continue / Maybe later.
- Also reachable from You → Glucose comfort, where you can step down any time.

### D3 Snap & seal (`16:572`)
- **Layout:**
  - Ink viewfinder card with a blurred meter preview and the chip "Blurred instantly"
  - Title "Snap your meter" and the copy
  - Big shutter button
  - Ghost button "Type the number instead"
- **Implementation:** see 03 › Camera & OCR.
  - Show the photo only through CSS/canvas blur (≥ 24 px) until opened.
  - Run OCR, then `classifyReading()`.
  - If the safety class isn't `none`, go to D6 or the High screen instead of sealing.
- **Typed path:** an `inputmode="decimal"` field masked with `-webkit-text-security: disc` and a reveal toggle, plus a unit hint.

### D4 Sealed (`16:617`)
- **Layout:**
  - Envelope SVG (surface fill, border stroke, primary wax seal with a leaf)
  - Title "Sealed. / The brave part is done."
  - Meta pill "Envelope {n} · {day time} · {context}"
  - Primary-soft card with a shield icon: "Keeper checked it isn't too low or too high…" If OCR failed, use the alternative copy in 05.
  - Buttons: "Keep it sealed" (primary) / "Open it now" (secondary)

### D5 Opened · ranges (`16:657`)
- **Layout:**
  - Back + "Envelope n · after lunch"
  - "Your reading"
  - RangeBar card: three rounded segments (below 70 px / in 150 px / above 72 px, proportional), a 28 px marker ring, the labels Below / In your range / Above, and a heading such as "A little above your range"
  - Body L "This is one moment, not a verdict…"
  - "What might help next time" rows (only Tiny habits that are on, plus veggies-first)
  - "Show the number" (eye icon) and "Back to my day"
- **Number reveal:** with `glucoseComfort='numbers'`, show the number in Fraunces `number` style above the bar instead.

### D6 Safety · low reading (`16:716`)
- **Layout:**
  - Full plum background (`safety`), status bar text in `safety-foreground`
  - Shield tile, overline "Not sealed — for your safety", title
  - Translucent steps card (1/2/3)
  - Care-team and emergency line
  - Buttons: "Start 15-minute timer" (secondary) / "I'm okay — log how I feel"
- **High variant:** undesigned, so use the same layout with the copy in 05.

---

## Undesigned screens (build from existing patterns)
| Screen | Pattern to reuse | Notes |
|---|---|---|
| Sleep / Feeling / Move / Water sheets | B2 sheet | Sleep: hours stepper (0.5 h) + quality faces. Feeling: 3 faces + chips. Move: type chips + minutes stepper. Water: +/− glasses. All save in ≤ 3 taps. |
| Learn tab | D1 cards | 30-second cards: "What glucose is", "Why everyone rises after eating", "What sealed means", plus evidence cards for each tiny habit. Content in 06. |
| You tab | C1 radio and settings cards | Sections: Glucose comfort, Tiny habits (toggle, library, reset learned), Your rhythm, Fasting mode, Units, Export for my doctor, Delete all data, About & disclaimer. |
| Habit library | Board `10:2` cards | Card per habit with evidence tag + source. Per-habit enable/disable. |
| Envelopes list | TimelineItem with a `mail` LogDot | Sealed items never show values. |
| Numbers view (step 6) | Existing `GlucoseChart`, `ReadingsList`, `ExportButtons`, restyled | Use range tokens, no red. Chart band fill `range-in` at 25% opacity. |
| High safety screen | D6 | Copy in 05. |
| "Break your fast if…" / "End the fast if…" sheet | B2 sheet, plum header | Rules from 05 plus the 15-min timer and "I'm okay". |
| Doctor's-plan fast | C3 | Manual plan fields; Keeper never suggests this track. |
| "Ask your doctor about…" cards | Board `22:2` | Fasting-mimicking diet, 5:2 meal replacement, very-low-calorie diet (DiRECT), longer fasts. Info only, no coaching. |
| Weight trend | C3 card style (Figma "Weekly weight" pattern on board 07) | Line only, with "Number hidden" by default. Max one entry per 6 days. |
