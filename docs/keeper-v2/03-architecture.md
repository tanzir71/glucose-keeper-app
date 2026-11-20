# 03: Architecture

## 1. Stack and dependencies
Keep: React 18, TypeScript, Vite 5, Tailwind 3, shadcn/ui (Radix), lucide-react, date-fns, react-router-dom 6, jsPDF and jspdf-autotable (lazy-load them), Recharts (Numbers view only, lazy).

Add:
```bash
npm i dexie dexie-react-hooks adhan @fontsource-variable/fraunces @fontsource/dm-sans
npm i tesseract.js            # lazy-loaded only on D3
npm i -D vite-plugin-pwa vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom fake-indexeddb
```
- Remove the `lovable-tagger` usage from `vite.config.ts` (optional, but it ties the dev build to Lovable).
- `@tanstack/react-query` can stay, but isn't needed: Dexie live queries replace it.

## 2. Folders
```
index.html                    # landing page entry (M5)
app/index.html                # PWA app entry
src/
  main.tsx                    # app bootstrap (HashRouter)
  landing/main.tsx            # landing bootstrap
  landing/*                   # landing sections
  copy/en.ts                  # ALL user-facing strings (see 06)
  components/ui/*             # shadcn (existing)
  components/keeper/*         # TabBar, LogTile, LogDot, Chip, FaceOption, TimelineItem, Toggle, Segmented, RangeBar, Quilt, Ring, Envelope, SafetyScreen, Sheet
  features/
    onboarding/               # A1–A3
    today/                    # B1, nudge card, prompts, C3/C4 variants
    log/                      # B2 + sleep/feeling/move/water sheets
    checkin/                  # B3
    habits/                   # B4, library
    week/                     # D1, insights, envelopes list
    glucose/                  # D2–D6, numbers view, camera/OCR
    fasting/                  # C1–C4, sheets, doctor plan
    you/                      # settings, export, delete data
    learn/
  lib/
    db.ts                     # Dexie schema + migrations
    settings.ts               # typed settings get/set + hook
    migrate-v1.ts             # localStorage → Dexie
    clinical/thresholds.ts    # [CLINICAL-REVIEW] constants + classifyReading()
    rules/smart-timing.ts     # pickNudge()
    rules/invitation.ts       # shouldInvite()
    rules/insights.ts         # weeklyInsights()
    rules/fasting.ts          # eligibility, gating, step-up, stop rules
    habits.ts                 # habit library data (05)
    photos.ts                 # compress + EXIF strip
    ocr/                      # lazy OCR worker + parser
    ramadan.ts                # adhan wrapper
    ics.ts                    # calendar reminder generator
    export.ts                 # existing, extended
  types/                      # domain types (below)
public/
  icons/                      # PWA icons 192/512 + maskable
  tesseract/, tessdata/       # self-hosted OCR assets (M3)
```

## 3. Build, routing and GitHub Pages
- The repo is `tanzir71/glucose-keeper-app`, so the site lives at `https://tanzir71.github.io/glucose-keeper-app/`.
- It's a **multi-page** Vite build: the landing page at `/glucose-keeper-app/`, the app at `/glucose-keeper-app/app/`.
- **HashRouter** inside the app: routes look like `/glucose-keeper-app/app/#/week`. No 404 tricks are needed.

```ts
// vite.config.ts (sketch)
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  base: "/glucose-keeper-app/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null,               // register manually from src/main.tsx only
      manifest: {
        id: "/glucose-keeper-app/app/",
        name: "Glucose Keeper",
        short_name: "Keeper",             // the home-screen label never says "glucose"
        description: "A soft diary for your days.",
        start_url: "/glucose-keeper-app/app/",
        scope: "/glucose-keeper-app/app/",
        display: "standalone",
        background_color: "#F6F1E9",
        theme_color: "#F6F1E9",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        // OCR assets are cached on first use (runtime), not precached:
        runtimeCaching: [{ urlPattern: /\/(tesseract|tessdata)\//, handler: "CacheFirst",
          options: { cacheName: "ocr-assets", expiration: { maxEntries: 10 } } }],
      },
    }),
  ],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  build: {
    rollupOptions: {
      input: { landing: path.resolve(__dirname, "index.html"), app: path.resolve(__dirname, "app/index.html") },
    },
  },
});
```
- Only `app/index.html` should link the manifest and register the service worker. The landing page links to `./app/` with an "Open Keeper" button.
- **Icons:** the quilt-motif logo is four rounded squares (meal, sleep, move, feeling) on the oat background. Export 192, 512 and maskable 512 from the Figma landing nav logo, or draw them as SVG and rasterise.

**Routes (app):**
```
#/                      Today (B1 / C3 / C4 variant)
#/welcome  #/onboarding/easy  #/onboarding/rhythm
#/log/:kind             sheet over Today (meal|sleep|feeling|move|water|medicines)
#/checkin/:mealId
#/habit/:habitId
#/week   #/learn   #/learn/:cardId   #/you   #/you/habits   #/you/rhythm   #/you/export
#/you/fasting  #/you/fasting/safety  #/fasting/stop
#/glucose/comfort  #/glucose/check  #/glucose/sealed/:id  #/glucose/reading/:id  #/glucose/safety/:id  #/glucose/numbers
```
Redirect to `#/welcome` until `settings.onboarded === true`.

**Deploy:** `.github/workflows/deploy.yml`
```yaml
name: Deploy to GitHub Pages
on: { push: { branches: [main] }, workflow_dispatch: {} }
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm test -- --run
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: "${{ steps.deployment.outputs.page_url }}" }
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```
In repo Settings → Pages, set **Source = GitHub Actions**.

## 4. Data model
```ts
// src/types/domain.ts
export type LogKind = "meal" | "sleep" | "feeling" | "move" | "water" | "medicines";
export type Energy = "sleepy" | "steady" | "buzzy";
export type MealSize = "light" | "regular" | "big";
export type Plate = "veg-protein" | "some-carbs" | "carb-heavy";

export interface LogEntry {
  id: string;            // crypto.randomUUID()
  kind: LogKind;
  at: string;            // ISO time the thing happened
  createdAt: string;
  data:
    | { kind: "meal"; slot?: "breakfast" | "lunch" | "tea" | "dinner" | "snack" | "suhoor" | "iftar";
        quickPick?: string; size: MealSize; feeling?: Energy; photoId?: string; plate?: Plate }
    | { kind: "sleep"; hours: number; quality?: "rested" | "okay" | "poor" }
    | { kind: "feeling"; mood: "low" | "okay" | "good"; tags?: string[] }   // tags may include "unwell"
    | { kind: "move"; type: "walk" | "stairs" | "desk-moves" | "calf-raises" | "stand" | "other";
        minutes?: number; reps?: number; habitId?: HabitId; endedEarly?: boolean }
    | { kind: "water"; glasses: number; drink?: "water" | "tea" | "coffee" }
    | { kind: "medicines"; taken: boolean };
}

export interface CheckIn { id: string; mealId: string; at: string; energy: Energy; tags: string[] }

export type Visibility = "sealed" | "opened";
export interface GlucoseReading {
  id: string; at: string;
  valueMgdl: number | null;          // null = sealed and unread (OCR failed and not typed)
  source: "photo" | "typed" | "legacy";
  photoId?: string; ocrConfidence?: number;
  state: Visibility;
  safety: "none" | "low" | "very-high" | "unknown";
  context?: "fasting" | "before-meal" | "after-meal" | "bedtime" | "other";
  mealId?: string; note?: string;
}

export interface Photo { id: string; kind: "meal" | "meter"; blob: Blob; createdAt: string }

export type HabitId = "stroll" | "stairs-stroll" | "hallway-laps" | "desk-moves" | "calf-raises" | "stand" | "veggies-first" | "calm-minute";
export interface NudgeEvent { id: string; at: string; habitId: HabitId; mealId?: string; place: "desk" | "home";
  outcome: "shown" | "accepted" | "skipped" | "completed" | "ended-early"; reason: string }

export type FastTrack = "overnight-12" | "window-13" | "window-14" | "window-16" | "ramadan" | "doctor-plan";
export interface FastSession { id: string; track: FastTrack; startedAt: string; plannedEndAt: string;
  endedAt?: string; endedEarly?: boolean; endReason?: "planned" | "chose" | "symptom" | "reading";
  feelings: { at: string; tag: "fine" | "hungry" | "headache" | "shaky-dizzy" }[];
  drinks: { at: string; drink: "water" | "tea" | "coffee" }[] }

export interface WeightEntry { id: string; at: string; kg: number }

export interface Rhythm {
  wake?: string; sleep?: string;                  // "HH:mm"
  meals?: Partial<Record<"breakfast" | "lunch" | "tea" | "dinner", string>>;
  workday?: "desk" | "on-feet" | "home" | "shifts";
  workHours?: { start: string; end: string };     // default 09:00–17:00 when workday=desk
  anchors?: string[];                             // "morning-tea" | "commute" | "prayer-times" | "evening-walk" | custom
  fastingDays?: boolean; indoorPreferred?: boolean;
  city?: { name: string; lat: number; lng: number };
}

export interface Settings {
  onboarded: boolean;
  name?: string;
  easyKinds: LogKind[];
  unit: "mmol/L" | "mg/dL";
  glucoseComfort: "not-now" | "maybe-later" | "sealed" | "ranges" | "numbers";
  ladderStep: 1 | 2 | 3 | 4 | 5 | 6;
  targetRange: { lowMgdl: number; highMgdl: number };    // default 70–180 [CLINICAL-REVIEW]
  tinyHabits: boolean; habitsEnabled: HabitId[]; habitSafetyNoteSeen: boolean;
  rhythm?: Rhythm;
  invitation: { lastShownAt?: string; snoozedUntil?: string; dismissedForever?: boolean };
  fasting: { track?: FastTrack; excluded?: boolean; medsLowRisk?: "yes" | "no" | "not-sure";
             medsSglt2?: "yes" | "no" | "not-sure"; careTeamConfirmed?: boolean;
             doctorPlan?: { hours: number; checks: string[]; notes?: string } };
  weightTracking: boolean; showWeightNumber: boolean;
  migratedV2: boolean;
}
```

**Dexie:**
```ts
// src/lib/db.ts
export const db = new Dexie("keeper") as Dexie & { logs: Table<LogEntry,string>; checkins: Table<CheckIn,string>;
  readings: Table<GlucoseReading,string>; photos: Table<Photo,string>; nudges: Table<NudgeEvent,string>;
  fasts: Table<FastSession,string>; weights: Table<WeightEntry,string>; kv: Table<{key:string; value:unknown},string> };
db.version(1).stores({
  logs: "id, kind, at", checkins: "id, mealId, at", readings: "id, at, state", photos: "id, kind",
  nudges: "id, at, habitId, outcome", fasts: "id, startedAt, track", weights: "id, at", kv: "key",
});
```
- Settings live in `kv` under the key `settings`. Expose `useSettings()` built on `useLiveQuery`.
- **Time:** store all times as ISO strings with offset. Compute "days" in the device's local time zone. The persona is in Asia/Dhaka (UTC+6, no DST), but don't hard-code it.

## 5. Migration from v1 (`src/lib/migrate-v1.ts`)
- **Read:**
  - `localStorage.glucose_readings`: `{id, value (mg/dL), timestamp, note}[]`
  - `localStorage.glucose_unit`
- **Write:** a reading for each entry with `source:"legacy"`, `state:"opened"`, `valueMgdl:value`, `at:timestamp`, `note`, and `safety` from `classifyReading`.
- **If at least one legacy reading exists:** set `glucoseComfort="numbers"` and `ladderStep=6`. They already tracked numbers, so don't hide their history. Also copy the unit.
- Set `migratedV2=true`. **Don't delete the localStorage keys** until v2.1.
- It must be idempotent: running it twice creates no duplicates (reuse the v1 `id`).
- **Tests:** an empty store, 3 readings, malformed JSON (skip the bad ones and log to the console), and a second run.

## 6. Photos
`photos.ts`:
1. Decode the file to a canvas.
2. Downscale so the longest side is at most 1280 px.
3. Re-encode as JPEG at quality 0.72. This also strips EXIF and GPS data.
4. Store the Blob in `photos`.

Meal photos show as thumbnails. Meter photos are only ever rendered through a blur (`filter: blur(24px)`, `pointer-events:none`) until the envelope is opened.

## 7. Camera and OCR (D3)
Start with spike M3.0.
- **Capture:** `<input type="file" accept="image/*" capture="environment">`. It works on iOS and Android PWAs without permission prompts. `getUserMedia` is optional later.
- **OCR:** `tesseract.js`, dynamically imported, running in its worker.
  - **Self-host every asset.** Set `workerPath`, `corePath` and `langPath` to `/glucose-keeper-app/tesseract/…` and `/tessdata/`. The default jsDelivr CDN breaks the local-first rule.
  - Parameters: `tessedit_char_whitelist: "0123456789."` and a single-block page segmentation mode. Pre-process on canvas: grayscale, contrast stretch, try both inverted and non-inverted.
  - **Seven-segment LCD digits are hard for stock models.** In the spike, compare the standard `eng` (fast) model against community seven-segment traineddata (search "tessdata ssd" or "letsgodigital"), using ≥ 20 real meter photos. Record the accuracy in the PR.
- **Parser** (`ocr/parse.ts`):
  - Extract numeric tokens. A plausible mmol/L value is 1.0–33.3 with one decimal; a plausible mg/dL value is an integer 18–600.
  - Prefer the user's unit, and pick the largest-font or most central token.
  - Return `{valueMgdl, confidence}`, or `null` when confidence < 70 or the value isn't plausible.
- **Time budget:** 8 s. On timeout or failure, use the fallback flow in 05 (type privately or symptom check). **Never upload the photo.**

## 8. Reminders (no server, so no push)
- **In-app prompts** are computed on `visibilitychange`/focus: due check-ins, nudges, fasting state and envelopes. There are no background timers.
- **Optional calendar nudge:** You → "Add a gentle daily reminder" downloads an `.ics` file with `RRULE:FREQ=DAILY` at her chosen time. Summary "Keeper · a gentle check-in", with no health details in the text.

## 9. Ramadan times (`lib/ramadan.ts`)
- **Library:** `adhan`. Use `new PrayerTimes(new Coordinates(lat, lng), date, CalculationMethod.Karachi())` as the default for Bangladesh; the method is user-selectable.
  - Suhoor ends at `fajr`, minus a user offset (default 0 min) **[REVIEW: local Sehri convention]**.
  - Iftar is at `maghrib`.
- **City picker:** Dhaka (23.8103, 90.4125), Chattogram (22.3569, 91.7832), Sylhet (24.8949, 91.8687), Khulna (22.8456, 89.5403), Rajshahi (24.3745, 88.6042), plus "Use my location" (one-time `navigator.geolocation`, stored locally).
- The Ramadan start date is user-confirmed. Don't rely on a calendar prediction; it depends on moon sighting.

## 10. Export for the doctor
Extend `export.ts`:
- **PDF summary:**
  - date range
  - meals per day and the share of big meals
  - average sleep
  - check-in energy mix
  - tiny habits completed
  - fasting sessions (track, completed or ended early, symptom endings)
  - readings
- **Before export, ask:** "Include sealed readings? They'll be visible in the file." Default: include.
- The share uses the Web Share API with files, falling back to a download.

## 11. Testing
- **Vitest + jsdom + fake-indexeddb.**
- **Rules engines:** table tests from 04 and 05 (≥ 12 cases each for smart timing and fasting).
- **Thresholds:** boundary tests at 69/70/71, 179/180/181, 249/250/251 and 299/300/301 mg/dL, in both units.
- **Migration:** the cases in §5.
- **Component tests:**
  - a low reading is never sealed
  - Today never renders a glucose value when comfort is `not-now`, `maybe-later` or `sealed`
  - "End early" writes a Move log
- **Manual checklist (M6):** install on Android Chrome and iOS Safari, airplane-mode run of every flow, 200% text, VoiceOver/TalkBack labels.

## 12. Performance budget
- App shell JS ≤ 180 KB gzip.
- Lazy chunks for Recharts, jsPDF, tesseract.js and the landing page.
- First load on a mid-range Android over 4G: LCP < 2.5 s.
