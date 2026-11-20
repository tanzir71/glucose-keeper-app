import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FeedbackCard } from "@/features/week/FeedbackCard";
import { deleteAllData } from "@/lib/db";
import { DEFAULT_SETTINGS, getSettings } from "@/lib/settings";
import type { Settings } from "@/types/domain";

const NOW = new Date();
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();
const settings = (over: Partial<Settings>): Settings => ({ ...DEFAULT_SETTINGS, onboarded: true, ...over });

beforeEach(() => deleteAllData());
afterEach(() => deleteAllData());

describe("How is Keeper for you? (every 4 weeks, local only)", () => {
  it("doesn't show before 4 weeks", () => {
    const { container } = render(<FeedbackCard settings={settings({ firstUsedAt: daysAgo(10) })} now={NOW} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows after 4 weeks, stores the answer on the phone and offers an email link", async () => {
    render(<FeedbackCard settings={settings({ firstUsedAt: daysAgo(29) })} now={NOW} />);
    await userEvent.click(screen.getByRole("radio", { name: "Good" }));
    expect(screen.getByText("Thank you. That stays on this phone.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /tell us more by email/i }).getAttribute("href")).toBe("mailto:?subject=Keeper%20feedback");
    await waitFor(async () => expect((await getSettings()).feedback?.answers?.[0]?.mood).toBe("good"));
  });

  it("counts 4 weeks from the last answer", () => {
    const { container } = render(<FeedbackCard settings={settings({ firstUsedAt: daysAgo(90), feedback: { lastAt: daysAgo(5) } })} now={NOW} />);
    expect(container).toBeEmptyDOMElement();
  });
});
