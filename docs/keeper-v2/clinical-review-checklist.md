# Clinical review checklist (for sign-off)

Everything tagged **[CLINICAL-REVIEW]** is configuration, not a literal in UI code (CLAUDE.md rule 8). A clinician can change each item in the file listed. Tick an item only once a clinician has reviewed the **current value**.

| ✔ | Item | Current value | Where |
|---|---|---|---|
| [ ] | Safety low: never sealed, Low safety screen | `< 70 mg/dL` (3.9 mmol/L) | `src/lib/clinical/thresholds.ts` → `THRESHOLDS.safetyLow` |
| [ ] | Safety very high: never sealed, High safety screen | `> 250 mg/dL` (13.9 mmol/L) | `THRESHOLDS.safetyVeryHigh` |
| [ ] | End/break a fast: low | `< 70 mg/dL` | `THRESHOLDS.fastBreakLow` |
| [ ] | End/break a fast: high | `> 300 mg/dL` | `THRESHOLDS.fastBreakHigh` |
| [ ] | **Rounding decision:** a typed 16.7 mmol/L converts to 301 mg/dL, so it ends a fast. The guideline reads "over 16.7"; Keeper errs on the side of safety | conservative | `thresholds.test.ts` documents this |
| [ ] | Default target range | 70–180 mg/dL (3.9–10.0 mmol/L), editable only via "Set with your care team" | `DEFAULT_TARGET_RANGE`; `src/features/you/YouRange.tsx` |
| [ ] | "A little above / below" wording | within 30 mg/dL of the range edge; never "a little" when safety-low | `NEAR_EDGE_MGDL`, `bandLabelKey()`; labels in `src/copy/en.ts` → `reading.labels` |
| [ ] | Plausible meter values (OCR and typed) | mg/dL 18–600; mmol/L 1.0–33.3 | `PLAUSIBLE_MGDL`, `PLAUSIBLE_MMOL` |
| [ ] | Low safety screen copy and steps | 05 §3 text | `en.ts` → `safety.lowTitle`, `safety.lowSteps`, `safety.lowNote` |
| [ ] | High safety screen copy and steps, plus "end your fast" | 05 §3 text | `en.ts` → `safety.highTitle`, `safety.highSteps`, `safety.highNote`, `safety.duringFast` |
| [ ] | 15-minute recheck timer | 15 min | `LOW_RECHECK_MINUTES` |
| [ ] | Emergency numbers | BD → 999; otherwise "your local emergency number" (from the time zone or rhythm city) | `EMERGENCY_NUMBERS`; `src/lib/readings.ts` → `emergencyNumber()` |
| [ ] | OCR-failed flow and symptom question | "Right now, do you feel shaky, sweaty, confused, very thirsty or unwell?" → Yes: "Let's make sure you're okay"; No: sealed, safety unknown | `en.ts` → `check.symptomQ`, `safety.unwell*`, `sealed.unknownCopy` |
| [ ] | Sealed copy (OCR read / not read) | 05 §2 | `en.ts` → `sealed.safeCopy`, `sealed.unknownCopy` |
| [ ] | Fasting tracks and windows | 12 / 13 / 14 / 16 h; eating window never under 8 h; no coached fast over 24 h | `src/lib/rules/fasting.ts` → `TRACK_HOURS`, `DEFAULT_WINDOW_START`; `MIN_EATING_WINDOW_HOURS`, `MAX_COACHED_FAST_HOURS` |
| [ ] | Medication gate | insulin or sulfonylurea "yes" or "not sure" → 12 h only until the care team confirms; "-gliflozin" → hydration rule; Ramadan: highRisk and plan card until confirmed | `canStart()` in `src/lib/rules/fasting.ts`; copy `fasting.q1Note`, `fasting.q2Note` |
| [ ] | Step-up rule | 5 of the last 7 days completed; no shaky/dizzy, low reading or low+unwell; at most weekly; paused 7 days after a stop | `offerNextStep()` |
| [ ] | Stop rules | reading < 70 or > 300; shaky/dizzy; low + unwell; reported symptoms | `shouldStopFast()`; copy `fasting.stopRules` |
| [ ] | Exclusion list | type 1; pregnant or breastfeeding; past eating difficulties → 12 h and Ramadan support only | `en.ts` → `fasting.exclusionItems`; `canStart()` |
| [ ] | Ramadan `supportOnly` and `highRisk` behaviour | see 05 §4.5 | `canStart("ramadan")`, `src/features/fasting/RamadanTop.tsx` |
| [ ] | Weight softening rule | loss > 1.0 kg/week for 3 weeks running, or 3+ skipped meals in a week → pause step-ups | `RAPID_LOSS_KG_PER_WEEK`, `RAPID_LOSS_WEEKS`, `SKIPPED_MEALS_PER_WEEK`; `weightSoftening()` |
| [ ] | Weight entry spacing | at most one per 6 days | `WEIGHT_MIN_DAYS_BETWEEN` |
| [ ] | Tiny-habit safety note | 05 §5 text, shown before the first habit and in the library footer | `en.ts` → `habitSafety.body` |
| [ ] | Habit descriptions and evidence tags | 05 §5 table | `en.ts` → `habits.*`; `src/lib/habits.ts` |
| [ ] | Learn cards | 06 §3 | `en.ts` → `learn.cards` |
| [ ] | "Ask your doctor about…" cards | 05 §4.8 | `en.ts` → `fasting.ask` |
| [ ] | Ramadan Sehri offset and calculation method (Bangladesh) | Karachi method, 0-minute offset, user-editable | `src/lib/ramadan.ts` → `DEFAULT_RAMADAN` |
| [ ] | IDF–DAR "Break your fast if…" wording | 05 §4.5 | `en.ts` → `fasting.stopRules`, `fasting.stopFooter` |

**Reviewer:** ____________________ **Date:** ____________ **Notes:**
