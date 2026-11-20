import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InstallCard } from "@/features/today/InstallCard";
import { __resetInstallForTests, initInstallCapture, isIos } from "@/lib/install";
import { DEFAULT_SETTINGS, getSettings } from "@/lib/settings";
import { deleteAllData } from "@/lib/db";
import type { Settings } from "@/types/domain";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36";
const DESKTOP = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

const settings = (over: Partial<Settings> = {}): Settings => ({ ...DEFAULT_SETTINGS, onboarded: true, ...over });
const NOW = new Date();

function setUA(ua: string, touch = 0) {
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue(ua);
  Object.defineProperty(navigator, "maxTouchPoints", { value: touch, configurable: true });
}

function fireBeforeInstall(outcome: "accepted" | "dismissed" = "accepted") {
  const e = new Event("beforeinstallprompt", { cancelable: true }) as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
  e.prompt = vi.fn(() => Promise.resolve());
  e.userChoice = Promise.resolve({ outcome });
  act(() => {
    window.dispatchEvent(e);
  });
  return e;
}

beforeEach(async () => {
  initInstallCapture();
  __resetInstallForTests();
  await deleteAllData();
});
afterEach(() => {
  vi.restoreAllMocks();
  delete (window as { matchMedia?: unknown }).matchMedia;
});

describe("install ask on mobile", () => {
  it("detects iPhone and iPadOS", () => {
    expect(isIos(IPHONE, 5)).toBe(true);
    expect(isIos(DESKTOP.replace("Intel ", ""), 5)).toBe(true); // iPadOS reports as a Mac with touch
    expect(isIos(DESKTOP, 0)).toBe(false);
    expect(isIos(ANDROID, 5)).toBe(false);
  });

  it("Android/Chrome: our card opens the native install dialog", async () => {
    setUA(ANDROID, 5);
    const e = fireBeforeInstall();
    expect(e.defaultPrevented).toBe(true); // no mini-infobar; Keeper asks gently instead
    render(<InstallCard settings={settings()} now={NOW} />);
    await userEvent.click(screen.getByRole("button", { name: "Add to home screen" }));
    expect(e.prompt).toHaveBeenCalledOnce();
  });

  it("iPhone Safari: shows the Share → Add to Home Screen steps", () => {
    setUA(IPHONE, 5);
    render(<InstallCard settings={settings()} now={NOW} />);
    expect(screen.getByText("Add Keeper to your home screen")).toBeInTheDocument();
    expect(screen.getByText("Choose “Add to Home Screen”")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add to home screen" })).toBeNull();
  });

  it("Android without the event (e.g. Firefox): points to the browser menu", () => {
    setUA(ANDROID, 5);
    render(<InstallCard settings={settings()} now={NOW} />);
    expect(screen.getByText("Choose “Install app” or “Add to Home screen”")).toBeInTheDocument();
  });

  it("never shows once installed (standalone)", () => {
    setUA(IPHONE, 5);
    window.matchMedia = ((q: string) => ({ matches: q.includes("standalone"), media: q })) as unknown as typeof window.matchMedia;
    const { container } = render(<InstallCard settings={settings()} now={NOW} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("hides after appinstalled", () => {
    setUA(ANDROID, 5);
    fireBeforeInstall();
    const { container } = render(<InstallCard settings={settings()} now={NOW} />);
    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("doesn't show on a desktop browser without the install event", () => {
    setUA(DESKTOP, 0);
    const { container } = render(<InstallCard settings={settings()} now={NOW} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("'Not now' hides it for 14 days", async () => {
    setUA(IPHONE, 5);
    render(<InstallCard settings={settings()} now={NOW} />);
    await userEvent.click(screen.getByRole("button", { name: "Not now" }));
    const until = new Date((await getSettings()).installPrompt!.snoozedUntil!);
    expect(Math.round((until.getTime() - Date.now()) / 86_400_000)).toBe(14);
    const { container } = render(<InstallCard settings={settings({ installPrompt: { snoozedUntil: until.toISOString() } })} now={NOW} />);
    expect(container).toBeEmptyDOMElement();
  });
});
