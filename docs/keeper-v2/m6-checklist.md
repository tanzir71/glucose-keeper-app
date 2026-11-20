# M6 polish and release: status

## Done and verified
- **Automated accessibility (axe-core):** `src/test/a11y.test.tsx` runs axe on Welcome, What feels easy, Today, Week, You, Glucose comfort, Snap & seal and the landing page. All pass. A canary test proves the harness catches a real violation. Colour contrast can't be computed in jsdom; it's covered by the token contrast table (02 §7).
- **Screen-reader labels:** the audit found unnamed radio cards (Fasting mode, Glucose comfort) and checkboxes (care-team confirmation, export). They now have explicit labels. Icon-only buttons and face options carry `aria-label`s.
- **200% text:** with the root font size doubled, Today stays within the 375 px width with no horizontal scroll. The log tiles are sized in rem and wrap to two per row.
- **Offline:** with a production build served by `vite preview`, the service worker (scope `/glucose-keeper-app/app/`) precached 78 entries and controlled the page. With the server **stopped**, Welcome, onboarding, Today, Week, Learn, You, Glucose comfort and Fasting mode all loaded. OCR assets are cached on first use.
- **Copy review against 06:** `src/copy/en.test.ts` scans every string in the deck, including templates, for "test", "normal", "bad", "control", "fail", alarm words, "blood sugar", "spike", emoji, exclamation marks and streak talk. All pass. One allowlisted Figma quote describes people's feelings, not a grade.
- **Clinical-review checklist:** exported for sign-off in [`clinical-review-checklist.md`](clinical-review-checklist.md).
- **Performance budget:** app shell about 113 KB + 46 KB shared, gzip (budget 180 KB). Recharts, jsPDF, tesseract.js, the fasting/Ramadan views and the landing page are separate lazy chunks.

## Still to do on real devices (can't be done from this environment)
- [ ] Install on Android Chrome and iOS Safari; check the home-screen label reads "Keeper" and the maskable icon crops cleanly.
- [ ] VoiceOver and TalkBack pass over every flow.
- [ ] Airplane-mode run of every flow on a phone.
- [ ] Lighthouse on a mid-range phone profile: PWA installable, Performance ≥ 90, LCP < 2.5 s.
- [ ] M3.0: OCR accuracy on ≥ 20 real meter photos (see [`ocr-spike.md`](ocr-spike.md)).
- [ ] Clinician sign-off on the checklist above.
