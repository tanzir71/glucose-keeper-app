# Keeper v2: implementation handoff

**For:** Claude Code (or any engineer) implementing the redesign in this repo.
**Design:** [Figma: Glucose](https://www.figma.com/design/SKYG2erloPFJBj05RKYBcp/Glucose). The file has four pages:
- 01 Concept & Research
- 02 Screens & Flow
- 03 Components & Tokens
- 04 Landing page

**Target:** a static, offline-first PWA on GitHub Pages at `https://tanzir71.github.io/glucose-keeper-app/`.

## The product in one paragraph
Keeper is for people with diabetes who avoid checking their glucose because the number feels like a verdict. It starts as a soft daily diary: meals (photo or a quick pick), sleep, feelings, movement and water, each logged in three taps or fewer. Two hours after a meal it asks how the body feels. Glucose is brought in only when the person is ready, through the **Readiness Ladder**:

1. Notice
2. Feel
3. Learn
4. **Seal:** the meter photo is blurred and kept in an envelope
5. **Ranges:** below / in your range / above, with no digits
6. **Numbers:** exact values

A **safety net** never hides a reading that's too low or too high. Two layers are optional:
- **Tiny habits with Smart timing:** one research-backed micro-habit after a meal, timed by context.
- **Fasting mode:** a gentle time-restricted eating ladder plus a Ramadan preset, behind a medication safety check.

A marketing **landing page** explains all of this.

## The docs
| File | What's inside |
|---|---|
| [01-screens.md](01-screens.md) | Every designed screen: Figma node, route, behaviour, states and acceptance criteria. Also specs for the screens that weren't designed. |
| [02-design-system.md](02-design-system.md) | Tokens (ready-to-paste CSS), Tailwind config, type scale, fonts, components, icons and accessibility. |
| [03-architecture.md](03-architecture.md) | Dependencies, folders, routing, multi-page build, data model, Dexie schema, migration, PWA, OCR, Ramadan times, deploy and testing. |
| [04-rules-engines.md](04-rules-engines.md) | Smart timing, the glucose invitation and weekly insights: specs and test tables. |
| [05-safety-and-fasting.md](05-safety-and-fasting.md) | Thresholds, reading classification, the sealed flow, safety screens, fasting tracks, gates, stop rules and the tiny-habit library. |
| [06-copy-and-open-questions.md](06-copy-and-open-questions.md) | Voice rules, copy deck, clinical-review list, open questions and sources. |

## Milestones
Work through them in order. Each one ends with `npm run build`, `npm run lint` and `npm test` passing, plus a short demo note in the PR.

### M0: Foundation
- [x] M0.1 Add Vitest, Testing Library, jsdom and fake-indexeddb, plus an `npm test` script.
- [x] M0.2 Design tokens: replace `:root` in `src/index.css` and extend `tailwind.config.ts` (see 02). Self-host the fonts.
- [x] M0.3 Multi-page Vite build:
  - landing at `/`, app at `/app/`
  - `base: '/glucose-keeper-app/'`
  - `HashRouter` inside the app
- [x] M0.4 Dexie database, the settings store, and the migration from localStorage (`glucose_readings`, `glucose_unit`). Cover the migration with tests.
- [x] M0.5 App shell: centred column, status-bar-safe padding, and the TabBar (Today · Week · Learn · You).
- [x] M0.6 PWA via `vite-plugin-pwa`: manifest name "Glucose Keeper", short name "Keeper", offline shell and icons.
- [ ] M0.7 ~~GitHub Actions workflow that deploys to Pages (see 03).~~ Dropped at the owner's request: no CI. `npm run deploy` builds locally and publishes `dist/` to the `gh-pages` branch.
- [x] M0.8 `src/lib/clinical/thresholds.ts` and `classifyReading()`, with tests.

**DoD:** the app installs on Android and iOS, opens offline, migrates old readings, and is deployed.

### M1: Diary ("Start gently" + a normal day)
- [x] M1.1 A1 Welcome, A2 What feels easy, A3 Your rhythm (skippable)
- [x] M1.2 B1 Today: date, greeting, today's patch strip, five log tiles, timeline
- [x] M1.3 B2 Log a meal sheet: photo or quick pick, size, feeling. Photos are compressed and EXIF-stripped.
- [x] M1.4 Sleep, Feeling, Move and Water sheets (undesigned; follow the B2 pattern, see 01)
- [x] M1.5 B3 After-meal check-in. Prompted in-app when the app is opened 100–180 min after a meal.
- [x] M1.6 D1 Week: quilt, up to 2 insights (rules in 04). No invitation yet.
- [x] M1.7 You tab basics: units, export (restyled), "Delete all my data"

**DoD:** someone can use Keeper for a week without ever seeing a glucose number.

### M2: Tiny habits + Smart timing
- [x] M2.1 Tiny habits toggle (A2, You). Off by default. Show the safety note before the first habit.
- [x] M2.2 `pickNudge()` rules engine plus its full test table (04)
- [x] M2.3 Nudge card on Today with "Why this?", Not now and Let's do it
- [x] M2.4 B4 timer and count screens. "End early — it still counts". A finished habit becomes a Move log with `habitId`.
- [x] M2.5 Habit library (You → Tiny habits), with evidence tags and "Reset what Keeper learned"

### M3: The glucose ladder
- [ ] M3.0 **Spike first.** *(Pipeline built and measured on synthetic images; real-photo run pending. See [ocr-spike.md](ocr-spike.md).)* Test on-device OCR of meter photos (see 03). Record the accuracy on 20+ sample photos in the PR.
- [x] M3.1 Invitation engine plus the D1 invitation card (04)
- [x] M3.2 D2 Glucose comfort (sealed / ranges / numbers). Add a Learn tab with three 30-second cards.
- [x] M3.3 D3 Snap & seal (camera → blur → OCR → classify). Include the "Type it instead" path.
- [x] M3.4 D4 Sealed envelope, and an envelopes list in Week
- [x] M3.5 D5 Opened in ranges (range bar). The number stays behind "Show the number".
- [x] M3.6 D6 Low safety screen, the High safety screen (undesigned), and the 15-minute timer
- [x] M3.7 Numbers view: restyle the existing chart, list and export for ladder step 6

### M4: Fasting mode
- [x] M4.1 C1 Fasting mode track picker, plus the exclusion check (type 1, pregnancy or breastfeeding, past eating difficulties)
- [x] M4.2 C2 Safety check (medications), care-team confirmation, and the doctor summary export
- [x] M4.3 C3 Fasting Today (ring, feelings, drinks, break-fast card, End now)
- [x] M4.4 Step-up offer rule, plus the "Break your fast if…" / "End the fast if…" sheet
- [x] M4.5 C4 Ramadan Today: city picker and `adhan` times (suhoor ends at Fajr, iftar at Maghrib), iftar plan, water
- [x] M4.6 Doctor's-plan track (24 h+) as logging only, and the "Ask your doctor about…" cards
- [x] M4.7 Optional weekly weight trend (number hidden by default)

### M5: Landing page
- [x] M5.1 Build `/` from Figma page 04 (node `23:3`). Use static product shots exported from Figma.
- [x] M5.2 Responsive behaviour: stack to one column below 900 px. The mobile layout isn't designed; follow the section order.
- [x] M5.3 Meta/OG tags, and remove the Lovable OG images from `index.html`

### M6: Polish & release
Status: see [m6-checklist.md](m6-checklist.md). Automated a11y, offline, copy review and the clinical checklist are done; device, Lighthouse and screen-reader passes remain.

- [ ] Accessibility audit (axe, keyboard, screen reader labels), and test 200% text zoom
- [ ] Lighthouse: PWA installable, Performance ≥ 90 on a mid-range phone profile
- [ ] Offline test of every flow, a copy review against 06, and the clinical-review checklist exported for sign-off

## Not in v2
- Accounts or sync
- Server push notifications
- CGM / HealthKit / Health Connect integrations
- Dark mode
- Bangla localisation (keep strings centralised so it's easy later)
- Keto or low-carb mode (explicitly dropped)
