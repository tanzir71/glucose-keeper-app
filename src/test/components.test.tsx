import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { db, deleteAllData } from "@/lib/db";
import { updateSettings } from "@/lib/settings";
import Today from "@/features/today/Today";
import HabitTimer from "@/features/habits/HabitTimer";
import Check from "@/features/glucose/Check";
import type { GlucoseComfort } from "@/types/domain";

function Where() {
  const l = useLocation();
  return <p data-testid="where">{l.pathname}</p>;
}

function renderAt(path: string, routes: JSX.Element) {
  return render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {routes}
      <Where />
    </MemoryRouter>,
  );
}

beforeEach(async () => {
  await deleteAllData();
  await updateSettings({ onboarded: true, unit: "mg/dL" });
});
afterEach(async () => {
  await deleteAllData();
});

async function seedOpenedReading(value: number) {
  const at = new Date();
  at.setMinutes(at.getMinutes() - 5);
  await db.readings.add({ id: "r1", at: at.toISOString(), valueMgdl: value, source: "typed", state: "opened", safety: "none" });
  await db.logs.add({ id: "w", kind: "water", at: at.toISOString(), createdAt: at.toISOString(), data: { kind: "water", glasses: 1 } });
}

describe("Today never shows glucose unless the person chose ranges or numbers", () => {
  it.each<GlucoseComfort>(["not-now", "maybe-later", "sealed"])("comfort %s: no value, no band, no range colour", async (comfort) => {
    await updateSettings({ glucoseComfort: comfort });
    await seedOpenedReading(213);
    const { container } = renderAt("/", <Routes><Route path="/" element={<Today />} /></Routes>);
    await screen.findByText(/glass of water/i);
    expect(container.textContent).not.toContain("213");
    expect(container.textContent).not.toMatch(/your range/i);
    expect(container.querySelector("[class*='bg-range-']")).toBeNull();
  });

  it("comfort numbers: shows the slim last-reading chip", async () => {
    await updateSettings({ glucoseComfort: "numbers" });
    await seedOpenedReading(213);
    const { container } = renderAt("/", <Routes><Route path="/" element={<Today />} /></Routes>);
    await screen.findByText(/glass of water/i);
    await waitFor(() => expect(container.textContent).toContain("213"));
  });
});

describe("A low reading is never sealed", () => {
  it("typed 55 mg/dL with comfort 'sealed' is stored opened and goes to the safety screen", async () => {
    await updateSettings({ glucoseComfort: "sealed", ladderStep: 4 });
    const user = userEvent.setup();
    renderAt(
      "/glucose/check",
      <Routes>
        <Route path="/glucose/check" element={<Check />} />
        <Route path="/glucose/safety/:id" element={<p>safety</p>} />
      </Routes>,
    );
    await user.click(await screen.findByRole("button", { name: /type it privately|type the number instead/i }));
    await user.type(screen.getByLabelText(/your reading in mg\/dL/i), "55");
    await user.click(screen.getByRole("button", { name: /seal it/i }));
    await waitFor(() => expect(screen.getByTestId("where").textContent).toMatch(/^\/glucose\/safety\//));
    const all = await db.readings.toArray();
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({ valueMgdl: 55, state: "opened", safety: "low" });
  });

  it("a safe reading with comfort 'sealed' is sealed", async () => {
    await updateSettings({ glucoseComfort: "sealed", ladderStep: 4 });
    const user = userEvent.setup();
    renderAt(
      "/glucose/check",
      <Routes>
        <Route path="/glucose/check" element={<Check />} />
        <Route path="/glucose/sealed/:id" element={<p>sealed</p>} />
      </Routes>,
    );
    await user.click(await screen.findByRole("button", { name: /type it privately|type the number instead/i }));
    await user.type(screen.getByLabelText(/your reading in mg\/dL/i), "140");
    await user.click(screen.getByRole("button", { name: /seal it/i }));
    await waitFor(() => expect(screen.getByTestId("where").textContent).toMatch(/^\/glucose\/sealed\//));
    expect((await db.readings.toArray())[0]).toMatchObject({ state: "sealed", safety: "none" });
  });
});

describe("Tiny habit timer", () => {
  it("'End early' writes a Move log and records ended-early", async () => {
    const user = userEvent.setup();
    renderAt(
      "/habit/stroll?min=2&place=home&meal=m1",
      <Routes>
        <Route path="/habit/:habitId" element={<HabitTimer />} />
        <Route path="/" element={<p>today</p>} />
      </Routes>,
    );
    await user.click(await screen.findByRole("button", { name: /end early/i }));
    await waitFor(async () => expect(await db.logs.count()).toBe(1));
    const [log] = await db.logs.toArray();
    expect(log.data).toMatchObject({ kind: "move", type: "walk", habitId: "stroll", endedEarly: true });
    const [ev] = await db.nudges.toArray();
    expect(ev).toMatchObject({ habitId: "stroll", outcome: "ended-early", mealId: "m1" });
  });
});
