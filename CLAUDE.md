# CLAUDE.md: Glucose Keeper ("Keeper" v2)

This repo is being rebuilt from a simple glucose log into **Keeper**: a gentle, local-first diary for people with diabetes who feel scared to track their glucose. The full handoff spec lives in `docs/keeper-v2/`. **Read `docs/keeper-v2/README.md` first**, then work one milestone at a time.

## Commands
- `npm install`
- `npm run dev`: Vite dev server on port 8080
- `npm run build`: production build (must pass before every PR)
- `npm run lint`
- `npm test`: Vitest (added in milestone M0)

## Product rules: never break these
1. **Today never shows a glucose number or colour** unless the user picked "Ranges" or "Numbers" in Glucose comfort.
2. **No red, no traffic lights, no scores, no streaks**, and no "you missed X days". Glucose bands use only the `range-below`, `range-in` and `range-above` tokens.
3. **Words matter:**
   - "check", not "test"
   - "below · in your range · above", not "low / normal / high / bad"
   - "managing", not "controlling"

   See `docs/keeper-v2/06-copy-and-open-questions.md`.
4. **Safety beats gentleness.** A reading outside the safety bounds is never sealed or hidden. Thresholds live only in `src/lib/clinical/thresholds.ts`.
5. **Local-first.** No accounts, no backend, no analytics, and no third-party requests that carry user data. This includes OCR models and fonts, which must be self-hosted. Everything is stored on the device (IndexedDB via Dexie).
6. **Every suggestion explains itself.** Tiny habits, fasting steps and the glucose invitation each carry a human-readable `reason`, shown under "Why this?".
7. **Fasting:**
   - Never auto-advance a fasting step.
   - Never coach eating windows under 8 h or fasts over 24 h.
   - Always show the stop rules.

   See `docs/keeper-v2/05-safety-and-fasting.md`.
8. **[CLINICAL-REVIEW] items are config, not literals.** Anything tagged that way must be a constant or copy entry in one place, so a clinician can change it without touching UI code.

## Design source of truth
- Figma: https://www.figma.com/design/SKYG2erloPFJBj05RKYBcp/Glucose (file key `SKYG2erloPFJBj05RKYBcp`).
- Use the Figma MCP (`get_design_context`, `get_screenshot`) with the node IDs listed in `docs/keeper-v2/01-screens.md`. Treat Figma output as a reference and build with this repo's Tailwind tokens and components.
- Don't invent colours, radii, shadows or fonts. Everything you need is in `docs/keeper-v2/02-design-system.md`.

## Engineering conventions
- **Stack:** React 18 + TypeScript + Vite + Tailwind + shadcn/ui (already installed).
- **Layout:** mobile-first. The app column is at most 430 px wide and centred on larger screens.
- **Routing:** `HashRouter`, because GitHub Pages has no SPA rewrites. Vite `base` is `/glucose-keeper-app/`.
- **Units:** glucose is stored in **mg/dL** (the existing convention) and converted only for display (mmol/L = mg/dL ÷ 18).
- **Rules engines** (`src/lib/rules/*`) are pure, deterministic functions that take `now` as an argument; never call `Date.now()` inside them. Each one ships with a table-driven Vitest file.
- **Folders:** features go in `src/features/<feature>/`, shared Keeper UI in `src/components/keeper/`, and all user-facing strings in `src/copy/en.ts` (Bangla will follow).
- **Accessibility:**
  - tap targets ≥ 44 px and visible focus rings
  - `aria-label`s on icon-only buttons and face options
  - honour `prefers-reduced-motion`
- **Reuse:** restyle and reuse the existing CSV/PDF export (`src/lib/export.ts`) rather than rewriting it. Lazy-load jsPDF.
- **Commits:** keep them small and reference the milestone task ID, e.g. `M1.3 Today screen`.
