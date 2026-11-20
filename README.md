# Glucose Keeper ("Keeper")

A gentle, local-first diary for people with diabetes who feel scared to check their glucose. It starts with what feels easy: meals, sleep, feelings, movement and water, each in three taps or fewer. Glucose comes in only when you're ready, through the Readiness Ladder:

1. Notice
2. Feel
3. Learn
4. **Seal:** the meter photo is blurred and kept in an envelope
5. **Ranges:** below, in your range or above, with no digits
6. **Numbers:** exact values

A safety net never hides a reading that's too low or too high.

Two layers are optional:
- **Tiny habits with Smart timing:** one research-backed micro-habit after a meal, with a "Why this?" on every suggestion.
- **Fasting mode:** gentle eating windows and a Ramadan preset, behind a medication safety check, with stop rules always on screen.

**Live:** https://tanzir71.github.io/glucose-keeper-app/. The landing page is at `/`; the installable app is at `/app/`.

> Keeper is a personal wellbeing diary, not a medical device. It doesn't diagnose or treat anything, and it doesn't replace your care team's advice. Clinical values and safety copy are marked **[CLINICAL-REVIEW]** and still need clinician sign-off before launch (see [`docs/keeper-v2/clinical-review-checklist.md`](docs/keeper-v2/clinical-review-checklist.md)).

## Principles
- **Local-first.** No account, no backend, no analytics. Everything lives on the device in IndexedDB (Dexie). Fonts and OCR models are self-hosted, and photos never leave the phone.
- **No red, no scores, no streaks.** Glucose bands use lavender, sage and apricot, always with words.
- **Today never shows a glucose number or colour** unless you choose Ranges or Numbers.
- **Safety beats gentleness.** Readings under 70 or over 250 mg/dL are never sealed. Every threshold lives in [`src/lib/clinical/thresholds.ts`](src/lib/clinical/thresholds.ts).

## Getting started
Prerequisites: Node.js 20+ and npm.

```sh
npm install
npm run dev
```

The dev server runs on port 8080:
- app: http://localhost:8080/glucose-keeper-app/app/
- landing page: http://localhost:8080/glucose-keeper-app/

## Scripts
| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server (copies the self-hosted OCR assets first) |
| `npm run build` | Production build: landing + app, with a service worker for the app |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm test` | Vitest: rules engines, thresholds, migration, OCR parser, components, axe and copy voice |
| `npm run icons` | Regenerate the PWA icons and favicon |

## Project structure
```
index.html, app/index.html   landing and app entries (multi-page Vite build, HashRouter in the app)
src/copy/en.ts               every user-facing string (Bangla will follow)
src/lib/clinical/            [CLINICAL-REVIEW] thresholds and classifyReading()
src/lib/rules/               pure rules engines: smart timing, invitation, insights, fasting
src/lib/                     Dexie db, settings, v1 migration, photos, OCR, Ramadan times, export
src/components/keeper/       Keeper UI: TabBar, LogTile, Chip, FaceOption, Sheet, RangeBar, Ring…
src/features/                onboarding, today, log, checkin, habits, week, glucose, fasting, learn, you
src/landing/                 the marketing landing page
docs/keeper-v2/              the handoff spec, OCR spike notes, M6 checklist, clinical review list
```

## Building
`npm run build` writes the landing page and the app to `dist/` (base path `/glucose-keeper-app/`). There's no CI: run `npm run lint`, `npm test -- --run` and `npm run build` before pushing.

## Upgrading from v1
On first open, v1 readings in `localStorage` are copied into IndexedDB, and the Numbers view is switched on so the old history stays visible. The v1 keys are kept until v2.1.

## Design and spec
- Figma: [Glucose](https://www.figma.com/design/SKYG2erloPFJBj05RKYBcp/Glucose)
- Spec: [`docs/keeper-v2/README.md`](docs/keeper-v2/README.md)
