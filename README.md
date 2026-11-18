# Glucose Keeper

A small, single-page blood glucose log that runs entirely in the browser. Add readings, see them on a chart with a daily summary, and export them as CSV or PDF. Data stays in the browser's `localStorage`; there is no backend or account.

## Features

- Add a reading with value, time and an optional note for the selected date
- Switch between mmol/L and mg/dL; values are stored in mg/dL and converted for display
- Readings classified as low (below 70 mg/dL), normal or high (above 180 mg/dL) with colour coding
- Date selector, readings list with delete, stats card and trend chart (Recharts)
- Export to CSV or PDF (jsPDF with jspdf-autotable)

This is a personal tracking aid, not medical advice or a medical device. The low/high thresholds are fixed in code and are not configurable.

## Tech stack

Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui (Radix), Recharts, jsPDF, date-fns. Originally scaffolded with Lovable.

## Getting started

Prerequisites: Node.js and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build |
| `npm run build:dev` | Build in development mode |
| `npm run lint` | Run ESLint |
| `npm run preview` | Serve the production build locally |

## Project structure

```
src/pages/        Index and NotFound pages
src/components/   form, chart, list, stats, unit switcher, date selector, export buttons (+ ui/)
src/lib/          localStorage persistence and CSV/PDF export
src/types/        reading types, unit conversion, glucose level thresholds
```
