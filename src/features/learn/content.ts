// Learn tab content index. Strings live in src/copy/en.ts. [CLINICAL-REVIEW] all cards.
import { t } from "@/copy/en";
import { ALL_HABIT_IDS, HABITS } from "@/lib/habits";
import { GLUCOSE_LEARN_CARDS } from "@/lib/rules/invitation";

export type LearnSection = "glucose" | "habits" | "doctor";
export interface LearnItem {
  id: string;
  section: LearnSection;
  title: string;
  body: string;
  tag?: string;
  source?: string;
  footer?: string;
}

export function learnItems(): LearnItem[] {
  const glucose = GLUCOSE_LEARN_CARDS.map((id) => ({ id, section: "glucose" as const, ...t.learn.cards[id] }));
  const habits = ALL_HABIT_IDS.map((id) => ({
    id: `habit-${id}`,
    section: "habits" as const,
    title: t.habits[id].title,
    body: `${t.habits[id].how} ${t.habits[id].why}`,
    tag: HABITS[id].evidence,
    source: HABITS[id].source,
  }));
  const doctor = Object.entries(t.fasting.ask).map(([id, c]) => ({
    id: `ask-${id}`,
    section: "doctor" as const,
    title: c.title,
    body: c.body,
    tag: c.tag,
    source: c.source,
    footer: t.fasting.askFooter,
  }));
  return [...glucose, ...habits, ...doctor];
}
