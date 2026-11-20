# M3.0 OCR spike: on-device meter reading

**Status:** partial. Pipeline built and measured on synthetic images. **Real meter photos (≥ 20) are still needed** before OCR can be the primary path.

## What was built
- `src/lib/ocr/index.ts`: `readMeter(blob, unit)` dynamically imports `tesseract.js` v7 and runs it in its own worker, within an 8 s budget.
- Every asset is self-hosted (local-first rule). `scripts/copy-ocr-assets.mjs` copies these into `public/` before `dev` and `build`:
  - `tesseract/worker.min.js`
  - the three LSTM-only cores (`tesseract-core{,-simd,-relaxedsimd}-lstm.wasm.js`, about 3.9 MB each; the browser loads one)
  - `tessdata/eng.traineddata.gz` (`@tesseract.js-data/eng` 4.0.0_best_int, 2.9 MB)

  They're runtime-cached by the service worker on first use and never precached. In the browser, network requests went only to `localhost`.
- Parameters: whitelist `0123456789.`, `PSM.SINGLE_BLOCK`, `OEM.LSTM_ONLY`.
- Pre-processing on canvas: grayscale, contrast stretch, optional inversion, centre crop and a white pad.
- `src/lib/ocr/parse.ts` turns the words into a reading. It keeps plausible values (mmol/L 1.0–33.3 with one decimal, mg/dL integers 18–600), prefers the person's unit, then the largest and most central token. It returns `null` under 70 confidence, or when two candidates compete closely (14 table tests).

## Findings (Chrome desktop, synthetic 640×480 JPEGs of a meter body with an LCD)
| Test | Result |
|---|---|
| A light LCD inside a dark meter body, full frame | Read **nothing** in every page-segmentation mode (AUTO, SINGLE_BLOCK, SPARSE, SINGLE_LINE) |
| Same, after a 0.5–0.6 centre crop with a white pad | Read correctly at 85–96 confidence |
| Proportional fonts (8 meters, mixed colours, clock text in the corner) | **7/8 correct, 0 wrong** |
| Seven-segment digits (10 values, drawn segment by segment) | **1/10 correct, 0 wrong** |
| Seven-segment, tilted 5° | not read |
| Time per photo | 110–300 ms on desktop (expect 3–5× slower on a mid-range phone; still within the 8 s budget) |

So the pipeline tries centre crops and inversion in turn (`VARIANTS`) and stops at the first confident read.

## Decision (open question 2)
The stock `eng` model fails seven-segment LCD digits, which is what most meters show. Seven-segment accuracy is far below 85%, so the default applies:

- **"Type it privately" is the primary path on D3.** Snapping the meter stays as a secondary option.
- If a photo is taken, it's still read on the phone. Anything unread goes to the "We couldn't read the meter" flow (type privately, or keep it sealed after the symptom check).
- This is one flag: `OCR_IS_PRIMARY` in `src/lib/ocr/config.ts`.

Safety property observed: **no wrong value was returned in any test.** Failures come back as `null`, never as a misread number. A misread could seal a reading that's actually low, so this matters more than the hit rate.

## Next steps (need real photos)
1. Collect ≥ 20 real meter photos from local meters (Accu-Chek, OneTouch, Contour, local brands) in varied light.
2. Compare the stock `eng` model with community seven-segment traineddata (`ssd`, `letsgodigital`) in the same harness. Get the licence checked, and self-host the file the same way.
3. Record per-photo accuracy here. Set `OCR_IS_PRIMARY = true` only at ≥ 85% with zero wrong values.
