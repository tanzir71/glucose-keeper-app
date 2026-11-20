# 04: Rules engines

All three engines are **pure functions** in `src/lib/rules/`. They take `now` and plain data, and return plain data plus a human-readable `reason`. The UI never decides on its own whether to suggest something. Ship each engine with a table-driven test file that covers at least the cases below.

Shared helpers (`rules/time.ts`):
- `minutesBetween`
- `isWithin(time, start, end)`, which handles windows that cross midnight
- `localDay(date)`
- `isWorkDay(date, rhythm)`. The default work days come from the time zone: `Asia/Dhaka` → **Sun–Thu** (the Bangladesh weekend is Fri–Sat); otherwise Mon–Fri. The user can override this in You → Your rhythm (add `rhythm.workDays?: number[]`).

Defaults when `rhythm` is missing:

| Field | Default |
|---|---|
| wake | 07:00 |
| sleep | 23:00 |
| workday | `undefined`, which is treated as "home" |
| workHours | 09:00–17:00 |

---

## 1. Smart timing: `pickNudge(input): Nudge | null`
Board reference: `10:2` (the "Smart timing" section and "A weekday with Nadia").

```ts
interface NudgeInput {
  now: Date;
  settings: Pick<Settings, "tinyHabits" | "habitsEnabled" | "rhythm">;
  logs: LogEntry[];        // last 24 h
  checkins: CheckIn[];     // last 24 h
  nudges: NudgeEvent[];    // last 14 days
  activeFast?: FastSession & { inEatingWindow: boolean };
}
interface Nudge {
  habitId: HabitId; title: string; body: string; reason: string;
  place: "desk" | "home"; mealId?: string; expiresAt: Date;
  durationSec?: number; reps?: number; kind: "timer" | "count" | "tip";
}
```

### Algorithm (first match wins)
**0. Gates.** Return `null` when any of these holds:
- `tinyHabits` is false
- `now` is inside quiet hours (`rhythm.sleep − 30 min` → `rhythm.wake`)
- there's an active fast and `now` isn't in the eating window

**1. After-meal path.** `meal` is the most recent meal log with `at ≤ now`, and `m` is the minutes since it.
- **a. Window.** The meal must satisfy `10 ≤ m ≤ 90` and `size !== "light"`. Otherwise go to step 2.
- **b. Never stack.** If any `move` log has `at` in (now − 30 min, now], return `null`.
- **c. One per meal.** If a NudgeEvent for this `mealId` has outcome `skipped`, `completed`, `ended-early` or `accepted`, return `null`. If it only has `shown`, return the same habit again so the card stays stable.
- **d. Unwell.** If today's latest `feeling` log has `mood:"low"` with the tag `unwell`, return `null`.
- **e. Place.**
  - `desk`: `rhythm.workday === "desk"`, it's a work day, and `now` is within work hours.
  - `on-feet` during work hours: return `null` (she's already moving).
  - Anything else counts as `home`.
- **f. Candidate order:**

  | Place | Condition | Order |
  |---|---|---|
  | desk | `m ≤ 20` | `stairs-stroll`, `calf-raises`, `desk-moves` |
  | desk | `m > 20` | `calf-raises`, `desk-moves`, `stairs-stroll` |
  | home | anchors include `evening-walk`, slot is dinner, not `indoorPreferred` | `stroll`, `hallway-laps`, `stand` |
  | home | `now ≥ 19:30` or `indoorPreferred` | `hallway-laps`, `stand`, `stroll` |
  | home | otherwise | `stroll`, `stand`, `hallway-laps` |
- **g. Energy.** Energy is the check-in energy for this meal, falling back to `meal.feeling`. If it's `sleepy`, move the gentlest option to the front: `calf-raises` at a desk, `stand` at home.
- **h. Filter.**
  - Keep only habits in `habitsEnabled`.
  - Drop any habit **skipped 3 or more times in the last 14 days in the same place**.
  - Among those left, a habit with an acceptance rate ≥ 60% (min 3 shows) moves up one position.
  - If nothing is left, return `null`.
- **i. Dose:**
  - stroll / stairs-stroll / hallway-laps: 2 min for a regular meal, 5 min for a big one. Make it 10 min when the slot is dinner and the anchors include `evening-walk`.
  - calf-raises: 10 reps (regular) or 20 (big)
  - desk-moves: 3 min
  - stand: 3 min
  - Last night's sleep under 6 h: halve the minutes (minimum 2) and the reps (minimum 10).
- **j. Reason.** Join the true facts with " · ", for example:
  - `"{m} min after a {size} {slot}"`
  - `"desk day"`
  - `"evening"`
  - `"you felt sleepy"`
  - `"your evening-walk anchor"`
  - `"you usually pick this"`
- **k. Expiry:** `meal.at + 90 min`.

**2. Desk-break path** (no qualifying meal). Applies when the place rules give `desk`, there's no `move` log in the last 90 min, there have been fewer than 2 desk-break nudges today, and the last one was at least 120 min ago. Return `desk-moves` for 3 min, reason `"90 min of sitting · desk day"`, expiring in 30 min.

**3. Pre-meal tip.** Applies when `rhythm.meals` has a slot 0–30 min ahead, `veggies-first` is enabled, and it hasn't been shown today. Return a `tip` with no timer: `"Lunch soon? Shak and fish first, rice last."`, reason `"your usual lunch is 13:15"`.

**4.** Otherwise return `null`.

**Recording:** the UI writes a NudgeEvent `shown` on first render, then `accepted`, `skipped`, `completed` or `ended-early`. `pickNudge` itself never writes.

### Test table (minimum)
Abbreviations: Dsk = desk workday, 09:00–17:00, Sun–Thu work week; Hm = home.

| # | Situation (now; last meal) | Expected |
|---|---|---|
| 1 | `tinyHabits:false` | `null` |
| 2 | Thu 13:40, Dsk; big lunch 13:15 | `calf-raises`, 20 reps, reason "25 min after a big lunch · desk day" |
| 3 | Thu 13:25, Dsk; big lunch 13:15 | `stairs-stroll`, 5 min |
| 4 | Thu 13:25, Dsk; light snack 13:15 | `null` |
| 5 | Thu 13:40, Dsk; big lunch 13:15; walk logged 13:30 | `null` (never stack) |
| 6 | Thu 14:50; lunch 13:15 | `null` (expired after 90 min) |
| 7 | **Fri** 13:20, Dsk rhythm; regular lunch 13:00 | home → `stroll`, 2 min (Friday is the weekend in BD) |
| 8 | Sun 21:00, Hm; regular dinner 20:45; anchors include evening-walk; not `indoorPreferred` | `stroll`, 10 min, reason includes "your evening-walk anchor" (see the note below) |
| 9 | 23:10; snack 23:00; sleep 23:00 | `null` (quiet hours) |
| 10 | Mon 11:00, Dsk; no meal since 08:00; no move since 09:20 | `desk-moves` 3 min, reason "90 min of sitting · desk day" |
| 11 | As #2, but `calf-raises` skipped 3× at desk in 14 days | `desk-moves` |
| 12 | Ramadan fast active at 15:00 | `null` |
| 13 | As #2, but meal feeling `sleepy` | `calf-raises` (already first) and the reason includes "you felt sleepy" |
| 14 | Sat 13:30, Hm; big lunch 13:15; slept 5 h | `stroll`, 2 min (5 halved, min 2) |
| 15 | 12:50, `rhythm.meals.lunch="13:15"`, veggies-first enabled, not shown today | `tip` veggies-first |
| 16 | Latest feeling today `low` + `unwell`; lunch 13:15; now 13:40 | `null` |

**Note for #8:** evening at home would normally put `hallway-laps` first. The evening-walk anchor means she *wants* to walk outside, so the anchor row in step f takes priority. That gives `stroll` for 10 min.

---

## 2. Glucose invitation: `shouldInvite(input): Invitation | null`
Board reference: `8:2` ("How invitations work"). The invitation appears **only on Week (D1)**, never on Today, and never as a notification.

**Eligibility.** All of these must hold:
- `ladderStep ≤ 3`
- `glucoseComfort ∈ {"not-now","maybe-later"}`
- not `dismissedForever`
- `now ≥ snoozedUntil`, and at least 14 days since `lastShownAt`
- no active fast
- no `feeling` with mood `low` in the last 24 h

**Triggers**, in priority order:
1. **T1:** ≥ 3 check-ins in the last 14 days with `energy:"sleepy"` or the tag `heavy`. Copy: `"You felt sleepy after {n} {big }{slot}s."` Include "big" when at least 2 of those meals were big; use the most frequent slot.
2. **T3:** ≥ 2 glucose Learn cards opened in the last 14 days. Copy: `"You've been reading about glucose."`
3. **T2:** ≥ 7 distinct local days with at least one log in the last 14 days. Copy: `"You've noticed your days for a whole week."`

**Card body (constant):** "Some people find one glucose check helps explain moments like this." Buttons: **Tell me more** (→ D2, sets `lastShownAt`) and **Not now** (`snoozedUntil = now + 14 d`). Long-pressing Not now, or using an overflow item, offers **Don't ask again** (`dismissedForever`).

**Tests:**
- each trigger on its own
- priority when several fire
- each eligibility gate blocks
- snooze boundary at exactly 14 d
- `ladderStep=4` never invites

---

## 3. Weekly insights: `weeklyInsights(input): Insight[]` (max 2)
Shown on D1. The window is the last 7 local days, extended to 28 if samples are too small.

**Language rules** (enforce in tests by scanning the output):
- never "because", "caused", "should", "bad", "good", "failed" or "spike"
- always observational: "often", "more often"
- the caption always shows counts plus "only your own logs"

| ID | Compare | Minimum samples | Show if | Copy |
|---|---|---|---|---|
| I1 | Meals followed by a `move` log within 90 min ("walked") vs not, on the share of check-ins with energy `steady` | ≥ 3 walked and ≥ 3 not | diff ≥ 25 pts | "On days you walked after {slot}, you felt steady more often." · "{a} of {b} walked {slot}s" |
| I2 | Nights < 6 h vs ≥ 7 h, on next-day `feeling` low | ≥ 3 / ≥ 3 | diff ≥ 25 pts | "After shorter nights, your days often felt heavier." |
| I3 | Big meals, on a sleepy or heavy check-in | ≥ 3 big meals | share ≥ 60% | "Big {slot}s were often followed by a sleepy afternoon." |
| I4 | **Only if comfort is ranges or numbers.** Readings 1–3 h after walked vs not-walked meals, on the in-range share | ≥ 3 / ≥ 3 | diff ≥ 25 pts | "After walked {slot}s, your readings were in your range more often." |
| I5 | Days with ≥ 6 glasses of water vs fewer, on `headache` tags | ≥ 3 / ≥ 3 | diff ≥ 25 pts | "On days with more water, headaches showed up less often." |

**Ranking:** the largest difference first; ties go to the lower ID. **Never** show I4 when comfort is `sealed`, `not-now` or `maybe-later`.

**Tests:** the sample-size gates, the threshold boundary at exactly 25 pts, the I4 visibility gate, the 7 → 28-day fallback, and the forbidden-words scan.
