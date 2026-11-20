// Stop rules end the fast (05 §4.6): endedEarly + endReason, step-ups paused for 7 days.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { db, deleteAllData } from "@/lib/db";
import { getSettings, updateSettings } from "@/lib/settings";
import { saveReading } from "@/lib/readings";
import { startFast } from "@/lib/fastingStore";
import Today from "@/features/today/Today";

function Where() {
  const l = useLocation();
  return <p data-testid="where">{l.pathname + l.search}</p>;
}

beforeEach(async () => {
  await deleteAllData();
  await updateSettings({ onboarded: true, unit: "mg/dL", fasting: { track: "window-14", exclusionAsked: true, medsLowRisk: "no", medsSglt2: "no" } });
});
afterEach(async () => {
  await deleteAllData();
});

async function runningFast() {
  const s = await getSettings();
  return startFast("window-14", s, new Date(Date.now() - 2 * 3_600_000));
}

describe("stop rules end the fast", () => {
  it.each([
    [65, true],
    [140, false],
    [301, true],
  ])("a %i mg/dL reading during a fast → ended: %s", async (v, ended) => {
    const fast = await runningFast();
    await saveReading({ valueMgdl: v, source: "typed", settings: await getSettings(), activeFast: fast });
    const after = await db.fasts.get(fast.id);
    expect(!!after?.endedAt).toBe(ended);
    if (ended) {
      expect(after).toMatchObject({ endedEarly: true, endReason: "reading" });
      expect((await getSettings()).fasting.stepUp?.pausedUntil).toBeTruthy();
    }
  });

  it("tapping 'Shaky or dizzy' on Today ends the fast and opens the stop sheet", async () => {
    const fast = await runningFast();
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Today />}>
            <Route path="fasting/stop" element={<p>stop sheet</p>} />
          </Route>
        </Routes>
        <Where />
      </MemoryRouter>,
    );
    await user.click(await screen.findByRole("button", { name: "Shaky or dizzy" }));
    await waitFor(() => expect(screen.getByTestId("where").textContent).toBe("/fasting/stop?ended=1&reason=shaky-dizzy"));
    const after = await db.fasts.get(fast.id);
    expect(after).toMatchObject({ endedEarly: true, endReason: "symptom" });
    const paused = new Date((await getSettings()).fasting.stepUp!.pausedUntil!);
    expect(Math.round((paused.getTime() - Date.now()) / 86_400_000)).toBe(7);
  });
});
