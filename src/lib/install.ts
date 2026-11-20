// Ask to install Keeper on phones.
// - Android / Chromium: the browser fires `beforeinstallprompt`; we keep it and show our own
//   gentle card, whose button opens the native install dialog.
// - iPhone / iPad (Safari): there's no install API, so the card shows the Share → "Add to Home
//   Screen" steps instead.
// - Other mobile browsers: the card points to the browser menu.
import { useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
let started = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Call once, as early as possible: the event can fire before React mounts. */
export function initInstallCapture(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // we show our own card instead of the mini-infobar
    deferred = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    deferred = null;
    emit();
  });
}

export type InstallMode = "native" | "ios" | "menu" | null;

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return !!nav.standalone || window.matchMedia?.("(display-mode: standalone)").matches || false;
}

export function isIos(ua = navigator.userAgent, maxTouchPoints = navigator.maxTouchPoints): boolean {
  // iPadOS reports itself as a Mac, but has touch.
  return /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && maxTouchPoints > 1);
}

export function isMobile(ua = navigator.userAgent): boolean {
  return /android|iphone|ipad|ipod|mobile/i.test(ua) || isIos(ua) || !!window.matchMedia?.("(pointer: coarse)").matches;
}

/** Which kind of install ask fits this device right now, or null when none should show. */
export function installMode(): InstallMode {
  if (installed || isStandalone()) return null;
  if (deferred) return "native";
  if (!isMobile()) return null;
  return isIos() ? "ios" : "menu";
}

/** Opens the browser's install dialog. Resolves true if the person accepted. */
export async function promptInstall(): Promise<boolean> {
  const e = deferred;
  if (!e) return false;
  deferred = null; // the event can only be used once
  emit();
  await e.prompt();
  const { outcome } = await e.userChoice;
  if (outcome === "accepted") installed = true;
  emit();
  return outcome === "accepted";
}

let version = 0;
listeners.add(() => version++);

export function useInstallMode(): InstallMode {
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => version,
    () => version,
  );
  return installMode();
}

/** Test hook: reset module state. */
export function __resetInstallForTests(): void {
  deferred = null;
  installed = false;
  emit();
}
