// App bootstrap (app/index.html). The landing page has its own entry in src/landing/main.tsx.
import { createRoot } from "react-dom/client";
// Self-hosted fonts (local-first: no font CDN).
import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/fraunces/opsz-italic.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "./index.css";
import App from "./App.tsx";
import { initInstallCapture } from "@/lib/install";

// Catch the browser's install event before React mounts (it can fire early).
initInstallCapture();

// Only the app registers the service worker (scope /glucose-keeper-app/app/).
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  import("virtual:pwa-register").then(({ registerSW }) => registerSW({ immediate: true }));
}

createRoot(document.getElementById("root")!).render(<App />);
