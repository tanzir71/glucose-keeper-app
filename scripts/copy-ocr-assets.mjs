// Self-host every OCR asset (local-first: no CDN). Copies the tesseract.js worker, the LSTM-only
// WebAssembly cores and the English best_int model into public/, where the app loads them on
// first use of D3 (runtime-cached by the service worker, never precached).
// Runs automatically before `npm run dev` and `npm run build`.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const nm = (p) => resolve(root, "node_modules", p);
const out = (p) => resolve(root, "public", p);

const files = [
  [nm("tesseract.js/dist/worker.min.js"), out("tesseract/worker.min.js")],
  [nm("tesseract.js-core/tesseract-core-lstm.wasm.js"), out("tesseract/tesseract-core-lstm.wasm.js")],
  [nm("tesseract.js-core/tesseract-core-simd-lstm.wasm.js"), out("tesseract/tesseract-core-simd-lstm.wasm.js")],
  [nm("tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js"), out("tesseract/tesseract-core-relaxedsimd-lstm.wasm.js")],
  [nm("@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz"), out("tessdata/eng.traineddata.gz")],
];

let copied = 0;
for (const [from, to] of files) {
  if (!existsSync(from)) {
    console.warn(`[ocr-assets] missing ${from} — run npm install`);
    continue;
  }
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
  copied++;
}
console.log(`[ocr-assets] ${copied}/${files.length} files in public/tesseract and public/tessdata`);
