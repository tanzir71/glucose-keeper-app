# 06: Copy, voice, open questions and sources

## 1. Voice rules
Keeper sounds like a kind friend who happens to know a lot, never a lab report. Board `9:2`.

| Say | Instead of | Why |
|---|---|---|
| Check your glucose | Test your blood sugar | "Test" implies pass/fail (ADA/ADCES language guidance) |
| Below · in your range · above | Good · bad · high-risk · dangerous | Numbers are information, not a grade |
| Welcome back — want to add today? | You broke your 12-day streak | Absence is normal; shame drives avoidance |
| This is one moment, not a verdict. | Warning: abnormal value | Calm framing. Safety copy stays direct (05 §3). |
| Curious how lunch landed? | You haven't logged glucose today | Invite, never nag |
| Managing | Controlling | "Control" implies blame |
| Ending early still counts. | Fast failed | No failure states |
| may help · often · more often | will fix · reverses · burns | Honest about the evidence |

Also:
- Sentence case, short sentences, second person.
- Contractions are fine.
- No exclamation marks except "Hi." on Welcome.
- No emoji in the UI.
- Dates and times follow the device locale; the app ships `en` with `bn` coming later.

## 2. Copy deck
Put everything in `src/copy/en.ts`, keyed by screen. Strings below are taken from the Figma screens. Use the Figma text if the two ever differ.

**A1:**
- "Hi. / I'm Keeper."
- "A soft diary for your days. No numbers needed — not today, and not ever, unless you decide you want them."
- "Everything stays on this phone. No account, no sharing."
- "Let's start gently"
- "I already track my glucose"
- Returning v1 user: "Welcome back — your readings are safe here."

**A2:**
- "What feels easy to notice?"
- "Pick a few. You can change this any time."
- Glucose card: "Keeper will only bring it up when you're curious." with the options "Not now" · "Maybe later" · "I'm ready"
- Tiny habits card: "Small moves that may help after meals."

**A3:**
- "Your rhythm"
- "Optional — helps Keeper time its suggestions. Skip and it learns from your logs."
- Section labels: "Day & meals" · "Workdays" · "Anchors you already have"
- "Ramadan & fasting days — Offers Fasting mode, with a Ramadan preset"
- "Save my rhythm"

**B1:**
- "Good morning|afternoon|evening, {name}."
- "{n} patches today"
- "Add to today"
- Nudge: overline "Tiny habit · {context}", then "Let's do it" · "Not now" · "Why this? {reason}"
- Empty state: "Nothing yet today. What feels easy to add?"

**B2:**
- "{Slot} · {time}" and "Change time"
- "Snap your plate"
- "or pick below — typing is optional"
- "How big?" (Light · Regular · Big)
- "How do you feel?"
- "Save"

**B3:**
- "{2 hours} after {lunch}"
- "How's your body feeling now?"
- "No right answers — this is just noticing."
- "Anything else?" (Heavy · Thirsty · Headache · Hungry again · All fine)
- "Ask me later"

**B4:**
- "{2-minute stroll}"
- "Anywhere counts — the hallway, the stairs, the roof."
- "Why it might help"
- "I'm done"
- "End early — it still counts"

**C1:**
- "Fasting mode"
- "Pick a gentle track. Pause or stop any time — ending early always counts."
- Tracks:
  - "Gentle overnight · 12 h — Close the kitchen after dinner. The safest place to start."
  - "Daily window · 13–16 h — Add an hour only when it feels easy. Keeper never auto-advances."
  - "Ramadan — Dawn to sunset, with suhoor and iftar times."
  - "Longer fasts · 24 h+ — Only with your doctor's plan. Keeper never suggests these."

**C2:**
- "Before fasting longer than 12 hours"
- "Fasting changes how some diabetes medicines work. "Not sure" is always fine."
- Questions:
  - "Insulin, or a sulfonylurea like gliclazide?"
  - "A medicine ending in "-gliflozin"?"
- Plum note: "Lows during a fast are the main risk with these. Keeper keeps you on the 12-hour track until your care team has adjusted your plan."
- Checkbox: "My care team knows I'm fasting and has adjusted my plan"
- Buttons: "Stay on gentle 12 h for now" · "Share a summary with my doctor"

**C3:**
- "Fasting · {14 h} track"
- "{13 h 20 m}" with "fasting · {40 min} to go"
- "Window opens {11:00} · closes {21:00}"
- "How does the fast feel?" (Fine · Hungry · Headache · Shaky or dizzy)
- "Shaky or dizzy? End the fast and check — it still counts."
- "Break your fast gently — Shobji, dal or eggs first — rice and sweets last. Then a short stroll."
- "End fast now — it still counts"

**C4:**
- "Ramadan · day {n}"
- "Iftar in {2 h 14 m}"
- "Suhoor ended {4:58} · Iftar {6:02} · {Dhaka}"
- "No food nudges until iftar. Checking your glucose doesn't break your fast."
- "Break your fast if…"
- Iftar plan: "Water & a date or two" → "Pause" → "A balanced plate"
- "Water between iftar & suhoor"

**D1:**
- "Your week"
- Insights (04 §3)
- Invitation: "Something you might wonder" · "{pattern}. Some people find one glucose check helps explain moments like this." · "Tell me more" · "Not now"

**D2:**
- "If you check, how would you like to see it?"
- Options:
  - "Sealed — In an envelope until you choose to open it. The safety net still reads it for you."
  - "Ranges only — Below · in your range · above. No digits."
  - "Numbers — Exact values, trends and an export for your care team."
- "Step {4} of 6 · Seal"
- "Maybe later"

**D3:**
- "Snap your meter"
- "Look away if you like. The photo is blurred and sealed straight away — the safety net reads it on your phone."
- "Blurred instantly"
- "Type the number instead"

**D4:**
- "Sealed. / The brave part is done."
- "Envelope {n} · {Thu 2:05 pm} · {after lunch}"
- Safety copy (05 §2)
- "Keep it sealed" · "Open it now"

**D5:**
- "Your reading"
- Band label (05 §1)
- "This is one moment, not a verdict. Glucose rises after meals for everyone — a big lunch can lift it for a while."
- "What might help next time"
- "Show the number"
- "Back to my day"

**D6 / High / stop sheets:** 05 §3 and §4.5–4.6.

## 3. Learn cards (v2 launch set) [CLINICAL-REVIEW]
1. **What glucose is.** Glucose is the sugar your body runs on. It rises after you eat and comes back down as your body uses it. Everyone's does — that's your body working.
2. **Why everyone rises after eating.** How much and how fast depends on the meal, how you slept, stress, and whether you move afterwards. That's why the same lunch can land differently on different days.
3. **Checking vs looking.** Checking is the brave part. Keeper can keep the number sealed until you're ready, and still watch out for readings that need attention.
4. **What "your range" means.** Your range is set with your care team. Keeper starts at 3.9–10.0 mmol/L (70–180 mg/dL) until you change it together.
5. **Evidence cards:** one per tiny habit (05 §5), each with its evidence tag and source.

## 4. Clinical review checklist
Export this list for sign-off in M6.
- [ ] `THRESHOLDS` and `DEFAULT_TARGET_RANGE`, and the "a little above/below" wording
- [ ] Low and High safety screen copy, the 15-minute timer, and the emergency numbers
- [ ] OCR-failed flow and symptom-check wording
- [ ] Fasting tracks, medication gate logic, step-up rule, stop rules, Ramadan `supportOnly` and `highRisk` behaviour, and the exclusion list
- [ ] Weight softening rule (`RAPID_LOSS_KG_PER_WEEK`, skipped meals)
- [ ] Tiny-habit safety note, and the habit descriptions with their evidence tags
- [ ] Learn cards and "Ask your doctor about…" cards
- [ ] Ramadan Sehri offset convention and calculation method for Bangladesh

## 5. Open questions
| # | Question | Owner | Default if unanswered |
|---|---|---|---|
| 1 | Do 5–8 interviews validate the persona and the "sealed reading" idea? | Product | Keep "Sealed" as the D2 default and revisit after the interviews |
| 2 | Is OCR accurate enough on local meters (M3.0 spike)? | Eng | If < 85% on the test set, make "Type it privately" the primary path and keep OCR for the safety net only |
| 3 | Sehri offset and calculation method for Bangladesh | Product + local review | Karachi method, 0 min offset, user-editable |
| 4 | Mobile landing-page layout | Design | Stack sections in Figma order, single column < 900 px |
| 5 | Brand and app icon final art | Design | Quilt-motif icon from the landing nav |
| 6 | Who writes and reviews Learn content? | Product + clinician | The launch set above |
| 7 | Bangla localisation timing | Product | v2.1, with all strings already in `copy/en.ts` |
| 8 | How to learn whether it works without analytics | Product | An optional, local "How is Keeper for you?" check-in every 4 weeks, with a mailto feedback link |
| 9 | Remove Lovable scaffolding (`lovable-tagger`, OG images) and react-query? | Eng | Remove in M0/M5 |

## 6. Sources
Cite these in the Learn and evidence cards and on the landing page's research section.
- Diabetes distress 18–45%: RACGP, *Management of type 2 diabetes* (https://www.racgp.org.au/clinical-resources/clinical-guidelines/guidelines-by-topic/view-all-guidelines-by-topic/chronic-disease/diabetes/mental-health-and-type-2-diabetes)
- Finger-prick anxiety (30%): Shlomowitz & Feher, *Br J Diabetes Vasc Dis* (https://bjd-abcd.com/index.php/bjd/article/viewFile/16/46)
- Avoiding checks for fear of feeling bad: UMass Chan Medical School (https://www.umassmed.edu/link/5c8fdb9581ea44efa70631ffbd866f16.aspx)
- Language guidance (ADA/AADE): diaTribe summary (https://diatribe.org/diabetes-language-recommendations-how-avoid-judgment-and-stigma)
- Light walking after meals: Buffey et al., *Sports Medicine* 2022 (https://link.springer.com/content/pdf/10.1007/s40279-022-01649-4.pdf)
- Breaking up sitting in type 2 diabetes: Dempsey et al., *Diabetes Care* 2016 (https://pubmed.ncbi.nlm.nih.gov/27208318/)
- Food order:
  - Shukla et al., *Diabetes Care* 2015 (https://pmc.ncbi.nlm.nih.gov/articles/PMC4876745)
  - Shukla et al., *BMJ Open Diabetes Res Care* 2017 (https://pmc.ncbi.nlm.nih.gov/articles/PMC5604719)
- Soleus push-up: Hamilton et al., *iScience* 2022 (https://pmc.ncbi.nlm.nih.gov/articles/PMC9404652)
- ADA activity guidance, including breaking up sitting every 30 min and resistance training 2–3×/week (https://professional.diabetes.org/sites/default/files/media/exercise_and_nutrition.pdf)
- Ramadan: IDF–DAR *Diabetes and Ramadan: Practical Guidelines* 2021
  - patient guide: https://idf.org/media/uploads/2024/08/DAR-guide-to-safe-fast-EN.pdf
  - break-fast thresholds summary: https://diabetesonthenet.com/wp-content/uploads/DPC_24-1_9-11.pdf
- Fasting safely with diabetes:
  - NIDDK (https://www.niddk.nih.gov/health-information/professionals/diabetes-discoveries-practice/2020/fasting-safely-with-diabetes)
  - NIDDK, intermittent fasting & type 2 diabetes (https://www.niddk.nih.gov/health-information/professionals/diabetes-discoveries-practice/patients-intermittent-fasting)
  - Cleveland Clinic J Med 2017 (https://www.ccjm.org/content/84/5/357)
- 8-hour eating window in type 2 diabetes: Pavlou et al., *JAMA Netw Open* 2023 (https://pmc.ncbi.nlm.nih.gov/articles/PMC10611992)
- Early eating window: Sutton & Peterson, *Cell Metabolism* 2018 (https://pmc.ncbi.nlm.nih.gov/articles/PMC5990470/)
- 10-hour window: Wilkinson, Manoogian & Panda, *Cell Metabolism* 2020 (https://pmc.ncbi.nlm.nih.gov/articles/PMC6953486)
- 5:2 meal replacement: Guo et al., *JAMA Netw Open* 2024 (https://pmc.ncbi.nlm.nih.gov/articles/PMC11193124/)
- Fasting-mimicking diet: van den Burg et al., *Diabetologia* 2024 (https://pubmed.ncbi.nlm.nih.gov/38546821/)
- Remission with a low-calorie diet: DiRECT, Lean et al., *Lancet* 2017 (https://www.gla.ac.uk/news/headline_562729_en.html)
- Therapeutic fasting case series: Furmli, Fung et al., *BMJ Case Reports* 2018 (https://pmc.ncbi.nlm.nih.gov/articles/PMC6194375)
- Dr. Pradip Jamnadas on fasting: *Feel Better Live More* #236/#513 (https://drchatterjee.com/513)
