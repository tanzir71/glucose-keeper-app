// M6 accessibility audit (automated part): axe-core over the main screens in jsdom.
// Colour contrast can't be computed in jsdom; it's covered by the token table in
// docs/keeper-v2/02-design-system.md §7. Manual checks (VoiceOver/TalkBack, 200% text) are in
// docs/keeper-v2/m6-checklist.md.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import axe from "axe-core";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { deleteAllData } from "@/lib/db";
import { updateSettings } from "@/lib/settings";
import Welcome from "@/features/onboarding/Welcome";
import WhatFeelsEasy from "@/features/onboarding/WhatFeelsEasy";
import Today from "@/features/today/Today";
import Week from "@/features/week/Week";
import You from "@/features/you/You";
import Comfort from "@/features/glucose/Comfort";
import Check from "@/features/glucose/Check";
import Landing from "@/landing/Landing";

async function audit(container: HTMLElement) {
  const res = await axe.run(container, {
    rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
  });
  return res.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

function at(path: string, el: JSX.Element) {
  return render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path={path.split("?")[0]} element={el} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(async () => {
  await deleteAllData();
  await updateSettings({ onboarded: true, glucoseComfort: "sealed", ladderStep: 4, tinyHabits: true });
});
afterEach(async () => {
  await deleteAllData();
});

describe("axe harness", () => {
  it("catches a real violation (canary)", async () => {
    const { container } = render(
      <main>
        <button type="button">
          <svg aria-hidden />
        </button>
      </main>,
    );
    expect((await audit(container)).some((v) => v.startsWith("button-name"))).toBe(true);
  });
});

describe("axe: no violations on key screens", () => {
  it.each([
    ["/welcome", <Welcome />, /I'm Keeper/],
    ["/onboarding/easy", <WhatFeelsEasy />, /What feels easy/],
    ["/", <Today />, /Add to today/i],
    ["/week", <Week />, /Your week/],
    ["/you", <You />, /Glucose comfort/],
    ["/glucose/comfort", <Comfort />, /how would you like to see it/i],
    ["/glucose/check", <Check />, /Snap your meter/],
  ] as const)("%s", async (path, el, ready) => {
    const { container } = at(path, el);
    await screen.findAllByText(ready);
    expect(await audit(container)).toEqual([]);
  });

  it("landing page", async () => {
    const { container } = render(<Landing />);
    expect(await audit(container)).toEqual([]);
  });
});
