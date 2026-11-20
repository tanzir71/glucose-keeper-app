// Draws the Keeper quilt-motif icon (four rounded squares: meal, sleep, move, feeling on oat)
// and writes PNGs for the PWA manifest, plus the SVG favicon. Pure Node, no image libraries.
// Usage: npm run icons
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OAT = [0xf6, 0xf1, 0xe9];
const TILES = [
  [0xe9, 0xa2, 0x7c], // meal
  [0x9f, 0x8f, 0xdb], // sleep
  [0x6f, 0xa4, 0x87], // move
  [0xe2, 0xb5, 0x3f], // feeling
];

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};
function png(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// Signed-distance test for a rounded rect.
const inRoundRect = (px, py, x, y, w, h, r) => {
  const cx = Math.max(x + r, Math.min(px, x + w - r));
  const cy = Math.max(y + r, Math.min(py, y + h - r));
  return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
};

/**
 * @param size output px
 * @param content fraction of the canvas the 2×2 quilt occupies (maskable needs ≤ 0.8 safe zone)
 * @param corner background corner radius fraction (0 = full bleed square)
 */
function draw(size, content, corner) {
  const SS = 4; // supersampling
  const out = Buffer.alloc(size * size * 4);
  const grid = size * content;
  const gap = grid * 0.1;
  const tile = (grid - gap) / 2;
  const r = tile * 0.28;
  const ox = (size - grid) / 2;
  const bgR = size * corner;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let rr = 0, gg = 0, bb = 0, aa = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS;
          const py = y + (sy + 0.5) / SS;
          let col = null;
          if (bgR === 0 || inRoundRect(px, py, 0, 0, size, size, bgR)) col = OAT;
          for (let i = 0; i < 4; i++) {
            const tx = ox + (i % 2) * (tile + gap);
            const ty = ox + Math.floor(i / 2) * (tile + gap);
            if (inRoundRect(px, py, tx, ty, tile, tile, r)) col = TILES[i];
          }
          if (col) {
            rr += col[0];
            gg += col[1];
            bb += col[2];
            aa += 255;
          }
        }
      }
      const n = SS * SS;
      const covered = aa / 255;
      const o = (y * size + x) * 4;
      out[o] = covered ? Math.round(rr / covered) : 0;
      out[o + 1] = covered ? Math.round(gg / covered) : 0;
      out[o + 2] = covered ? Math.round(bb / covered) : 0;
      out[o + 3] = Math.round(aa / n);
    }
  }
  return png(size, out);
}

const write = (rel, buf) => {
  const p = resolve(root, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, buf);
  console.log("wrote", rel);
};

write("public/icons/icon-192.png", draw(192, 0.62, 0.22));
write("public/icons/icon-512.png", draw(512, 0.62, 0.22));
write("public/icons/maskable-512.png", draw(512, 0.5, 0)); // full bleed, quilt inside the safe zone
write("public/icons/apple-touch-icon.png", draw(180, 0.6, 0)); // iOS rounds the corners itself

const hex = (c) => "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
write(
  "public/favicon.svg",
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${hex(OAT)}"/>` +
      `<rect x="10" y="10" width="20" height="20" rx="6" fill="${hex(TILES[0])}"/>` +
      `<rect x="34" y="10" width="20" height="20" rx="6" fill="${hex(TILES[1])}"/>` +
      `<rect x="10" y="34" width="20" height="20" rx="6" fill="${hex(TILES[2])}"/>` +
      `<rect x="34" y="34" width="20" height="20" rx="6" fill="${hex(TILES[3])}"/></svg>\n`,
  ),
);
