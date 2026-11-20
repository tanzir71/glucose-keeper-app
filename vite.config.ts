import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8")) as { version: string };

const BASE = "/glucose-keeper-app/";

// https://vitejs.dev/config/
export default defineConfig({
  base: BASE,
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // Registered manually from src/main.tsx so only the app (not the landing page) installs it.
      injectRegister: null,
      // The plugin would inject <link rel="manifest"> into every HTML entry, including the landing
      // page. The manifest is hand-written in public/app/manifest.webmanifest and linked only from
      // app/index.html instead.
      manifest: false,
      scope: `${BASE}app/`,
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2,webmanifest}"],
        // OCR assets are cached on first use (runtime), not precached. Landing images and the
        // landing bundle aren't needed offline inside the app.
        globIgnores: ["**/tesseract/**", "**/tessdata/**", "landing/**", "assets/landing-*"],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: `${BASE}app/index.html`,
        navigateFallbackAllowlist: [new RegExp(`^${BASE}app/`)],
        runtimeCaching: [
          {
            urlPattern: /\/(tesseract|tessdata)\//,
            handler: "CacheFirst",
            options: { cacheName: "ocr-assets", expiration: { maxEntries: 10 } },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        landing: path.resolve(__dirname, "index.html"),
        app: path.resolve(__dirname, "app/index.html"),
      },
    },
  },
});
