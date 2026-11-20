# 05: Safety, sealed readings and Fasting mode

Board references:
- Concept & Ladder `8:2` (safety net)
- Tiny habits `10:2`
- Fasting mode `20:2`
- Fasting knowledge map `22:2`

Everything tagged **[CLINICAL-REVIEW]** needs sign-off from a clinician before launch. Implement each such item as a constant or copy key, so it can be changed in one place.

## 1. Thresholds: `src/lib/clinical/thresholds.ts`
```ts
// [CLINICAL-REVIEW] All values in mg/dL. Display: mmol/L = mg/dL / 18 (1 decimal).
export const THRESHOLDS = {
  safetyLow: 70,        // < 70 (3.9 mmol/L): never sealed → Low safety screen (D6)
  safetyVeryHigh: 250,  // > 250 (13.9 mmol/L): never sealed → High safety screen
  fastBreakLow: 70,     // < 70 (3.9 mmol/L): end / break the fast (IDF–DAR 2021)
  fastBreakHigh: 300,   // > 300 (16.7 mmol/L): end / break the fast (IDF–DAR 2021)
} as const;

// Same as v1's getGlucoseLevel (70–180). User-editable only via "Set with your care team".
export const DEFAULT_TARGET_RANGE = { lowMgdl: 70, highMgdl: 180 } as const;
export const NEAR_EDGE_MGDL = 30;  // "a little above/below" wording

export type Band = "below" | "in" | "above";
export type Safety = "none" | "low" | "very-high";
export function classifyReading(v: number, r = DEFAULT_TARGET_RANGE): { band: Band; safety: Safety } {
  const band: Band = v < r.lowMgdl ? "below" : v > r.highMgdl ? "above" : "in";
  const safety: Safety = v < THRESHOLDS.safetyLow ? "low" : v > THRESHOLDS.safetyVeryHigh ? "very-high" : "none";
  return { band, safety };
}
// Labels: "In your range" · "A little above your range" (≤ high+30) · "Above your range"
//         "A little below your range" (≥ low−30 and not safety-low) · "Below your range"
```

**Boundaries** (test them all):
- 70 is *not* low; 69 is low.
- 250 is *not* very-high; 251 is.
- 300 doesn't break a fast; 301 does.
- 180 is in range; 181 is above.

## 2. Sealed reading flow (D3 → D4 / D5 / D6)
```
capture photo → compress (03 §6) → OCR (≤ 8 s, on device)
├─ parsed { valueMgdl, confidence ≥ 70 }
│   └─ classifyReading
│       ├─ safety = low       → save { state:"opened", safety:"low" }       → D6 Low (number shown on request)
│       ├─ safety = very-high → save { state:"opened", safety:"very-high" } → High safety screen
│       └─ safety = none      → comfort "sealed"? save sealed → D4
│                               : comfort "ranges"? save opened → D5 (band only)
│                               : comfort "numbers"? save opened → D5 with number
└─ not parsed / timeout
    └─ sheet "We couldn't read the meter"
        ├─ "Type it privately" → masked input → classify as above
        └─ "Keep it sealed" → symptom check: "Right now, do you feel shaky, sweaty, confused, very thirsty or unwell?"
             ├─ Yes → "Let's make sure you're okay" (D6 layout): open & read the meter now · follow your plan · emergency line
             └─ No  → save { valueMgdl:null, state:"sealed", safety:"unknown" } → D4 with the alternative copy
```
- **D4 copy when OCR succeeded:** "Keeper checked it isn't too low or too high. If it were, you'd know straight away."
- **D4 alternative copy when OCR failed:** "We couldn't read this one, so we can't tell where it is. If you start to feel unwell, open it or check again."

**Rules:**
- A reading with `safety ≠ none` is **never** stored as sealed.
- Opening an envelope never changes `glucoseComfort`.
- Sealed envelopes show no value, band or colour anywhere, including Week and export previews.
- Export asks whether to include sealed readings. Default: include.

## 3. Safety screen copy [CLINICAL-REVIEW]
**Low (D6, plum):**
- Overline: Not sealed — for your safety
- Title: This reading is low. Let's look after it now.
- Steps:
  1. Have fast-acting sugar — about 15 g, like half a glass of juice.
  2. Rest, then check again in 15 minutes.
  3. Feeling better? Have a snack or your next meal.
- Note: Follow your care team's plan if it's different. If you feel confused or can't swallow, call {EMERGENCY} or ask someone nearby to help.
- Buttons: Start 15-minute timer · I'm okay — log how I feel

**High (undesigned, same layout):**
- Title: This reading is high. Let's take it gently.
- Steps:
  1. Drink some water.
  2. Follow your care team's plan for high readings, including any medicine they've told you to take.
  3. Check again when your plan says to.
- Urgent line: If you're vomiting, very thirsty, breathing fast, confused or feel very unwell, get medical help now — call {EMERGENCY}.
- During a fast, add: "End your fast now — it still counts."

`{EMERGENCY}` comes from a country table: BD → 999, otherwise "your local emergency number". The country comes from the time zone or the rhythm city.

## 4. Fasting mode
Board `20:2`. It's inspired by Dr. Pradip Jamnadas's gradual build-up and checked against the trials and guidelines on board `22:2`. **Weight loss is the engine; fasting is one optional route to it.**

### 4.1 Tracks
| Track | Fasting hours | Eating window example | Who can start it |
|---|---|---|---|
| `overnight-12` | 12 h | 09:00–21:00 | Anyone not excluded (default) |
| `window-13` | 13 h | 09:00–20:00 | Gate passed (§4.3) |
| `window-14` | 14 h | 10:00–20:00 or 11:00–21:00 | Gate passed |
| `window-16` | 16 h | 11:00–19:00 or 12:00–20:00 (the 8-h window from Pavlou 2023) | Gate passed. **Top rung, no further step-ups.** |
| `ramadan` | dawn to sunset (`adhan`) | maghrib → fajr | See §4.5 |
| `doctor-plan` | as her doctor's plan says (24 h+) | n/a | Only after she enters a plan. **Keeper never suggests it.** |

**Window placement:** suggest earlier windows when her rhythm allows ("Same window, a little earlier": Panda / Peterson). Never move a window into her sleep time.

### 4.2 Exclusion check (shown once, before C1)
"Do any of these apply to you?"
- Type 1 diabetes
- I'm pregnant or breastfeeding
- I've had difficulties with eating in the past (like restricting or bingeing)

Store `fasting.excluded: boolean` only, never which item applied.

If excluded:
- No windows beyond 12 h, no step-ups and no weight tracking.
- Show: "Fasting isn't something Keeper can guide safely for you — your care team can help you plan." Include the export button.
- The Ramadan support variant is still allowed (§4.5). **[CLINICAL-REVIEW]**

### 4.3 Medication gate (C2): `canStart(track, settings)`
```ts
if (settings.fasting.excluded && track !== "overnight-12" && track !== "ramadan") return { ok: false, reason: "excluded" };
if (track === "doctor-plan") return settings.fasting.doctorPlan ? { ok: true } : { ok: false, reason: "needs-plan" };
const lowRisk = settings.fasting.medsLowRisk;          // insulin or sulfonylurea
const sglt2   = settings.fasting.medsSglt2;            // "-gliflozin"
const confirmed = !!settings.fasting.careTeamConfirmed;
const flags = { hydrationRule: sglt2 !== "no" };
if (track === "ramadan") return { ok: true, flags: { ...flags, planCard: !confirmed, highRisk: lowRisk !== "no" && !confirmed, supportOnly: !!settings.fasting.excluded } };
if (track === "overnight-12") return { ok: true, flags };
if (lowRisk !== "no" && !confirmed) return { ok: false, reason: "meds", fallback: "overnight-12", flags };
return { ok: true, flags };
```
`"not-sure"` is treated like `"yes"`.

The **hydration rule** means: water is always encouraged in the window; Today shows a water nudge; Ramadan shows the plan card until she has confirmed with her care team.

### 4.4 Step-up offer: `offerNextStep(input)`
Offer the next track (12 → 13 → 14 → 16) as a dismissible card **only if all** of these hold:
- the current track is `overnight-12`, `window-13` or `window-14`
- ≥ 5 of the last 7 days have a completed session on that track (`endedEarly` because of a symptom or reading counts as not completed)
- no `shaky-dizzy` feelings, no readings with `safety:"low"`, and no `low + unwell` feelings in those 7 days
- `canStart(next)` is ok
- the last offer was ≥ 7 days ago
- the weight-trend softening (§4.7) isn't active

Copy: "Ready to try {13} hours? Only if it felt easy." Buttons: Try it / Not now. **Never switch automatically.**

### 4.5 Ramadan
- **Times:** `adhan` (03 §9). The fast runs from fajr to maghrib.
- **States:** "Fasting now" (C4), or "Eating window" (iftar → suhoor) with the iftar plan and water tracker.
- **No food nudges during the fast.** Tiny habits resume ≥ 60 min after iftar, e.g. "After iftar: a gentle 10-minute stroll".
- **"Break your fast if…" sheet** (IDF–DAR 2021), always one tap away:
  - glucose under 3.9 mmol/L (70 mg/dL) or over 16.7 mmol/L (300 mg/dL)
  - signs of a low (shaky, sweaty, confused)
  - feeling unwell or an acute illness
  - Footer: "Checking your glucose doesn't break your fast."
- **Pre-Ramadan card** (from 8 weeks before, once she has set the start date): "Plan with your care team 6–8 weeks before" with a checklist (medicines, past lows, how to adjust, when to check) and the export.
- **`highRisk` flag:** a plum card on C4 reading "Insulin or sulfonylureas can cause lows while fasting. Please speak with your care team before you fast — and check if you feel off."
- **`supportOnly` variant:** no weight, no step-ups, the plan card is always shown, and the stop rules are prominent. **[CLINICAL-REVIEW]**
- **After Eid:** a summary (days fasted, fasts ended early, symptom endings) and the prompt "See your doctor for a check-in."
- Ramadan can't run alongside any other fasting track.

### 4.6 Stop rules: `shouldStopFast(input)` (all tracks)
Stop the fast when any of these happens:
- a reading `< fastBreakLow` or `> fastBreakHigh`
- the feeling `shaky-dizzy`
- a feeling `low` with `unwell`
- she reports symptoms in the stop sheet

Then open the stop sheet ("End the fast now — it still counts"), set `endedEarly` and `endReason`, and pause step-up offers for 7 days. **Tests:** each trigger, plus the boundaries 70/69 and 300/301.

### 4.7 Weight (optional)
- At most one entry per 6 days (otherwise offer to replace the last one).
- Shown as a trend line, with the number hidden unless `showWeightNumber`.
- **Softening rule [CLINICAL-REVIEW]:** if the trend falls by more than `RAPID_LOSS_KG_PER_WEEK = 1.0` for 3 weeks running, or she logs skipped meals 3+ times in a week, pause step-up offers and show "Your care team can help you find a pace that suits you."

### 4.8 "Ask your doctor about…" cards (info only)
Each card has 2–3 sentences, its evidence tag and a source, and ends with "Ask your doctor if this could suit you." There's no coaching, timer or plan.
- **Fasting-mimicking diet** (Leiden FIT trial, RCT, 12 months): 5 low-calorie days a month alongside usual care. In people on metformin or diet only, it reduced medication needs and improved HbA1c.
- **5:2 meal replacement** (Guo et al., EARLY study, RCT, 16 weeks): two non-consecutive meal-replacement days a week in early type 2 diabetes.
- **Very-low-calorie diet** (DiRECT, large RCT): a clinic-run formula diet; 46% remission at 12 months, tracking weight lost.
- **Longer therapeutic fasts** (Fung case reports): only under close medical supervision, especially for people on insulin.

## 5. Tiny-habit library: `src/lib/habits.ts`
| id | Title | How | Why (short) | Evidence | Source |
|---|---|---|---|---|---|
| `stroll` | After-meal stroll | 2–5 min of light walking, within an hour of eating | Working muscles use glucose for fuel; light walking after meals softened the post-meal rise vs sitting | Meta-analysis | Buffey et al., Sports Medicine 2022 |
| `stairs-stroll` | Stairs, not the lift | Walk back to your desk the long way | as above | Meta-analysis | Buffey 2022 |
| `hallway-laps` | Hallway laps | Indoor walking when it's late or raining | as above | Meta-analysis | Buffey 2022 |
| `desk-moves` | Desk-break moves | Every 30 min of sitting: 3 min of half-squats, calf raises, knee raises | Lowered post-meal glucose vs uninterrupted sitting in type 2 diabetes | Small trial | Dempsey et al., Diabetes Care 2016 |
| `calf-raises` | Seated calf raises | Heels up, balls of the feet down, while sitting | One lab study saw a much smaller post-meal rise | Early research | Hamilton et al., iScience 2022 |
| `stand` | Stand after eating | Stand a few minutes; washing up counts | Standing helped a little, though less than walking | Meta-analysis | Buffey 2022 |
| `veggies-first` | Veggies first | Shak, salad, dal or fish first, rice or roti last | Carbs-last meals had lower glucose peaks in small trials | Small trials | Shukla et al., Diabetes Care 2015; BMJ DRC 2017 |
| `calm-minute` | A calm minute | One slow breath before eating when cravings hit | Stress and cravings travel together | Expert opinion | Fasting companion (board `20:2`) |

**Safety note**, shown once before the first habit ever and again in the library footer **[CLINICAL-REVIEW]**:
> "Check with your care team before adding new activity — especially if you take insulin or medicines that can cause lows. Stop and rest if you feel dizzy, short of breath or have chest pain. Tiny habits sit alongside your treatment plan — they never replace it."
