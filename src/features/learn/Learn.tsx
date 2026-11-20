import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Overline } from "@/components/keeper/Controls";
import { TabScreen } from "@/components/keeper/Layout";
import { cn } from "@/lib/utils";
import { t } from "@/copy/en";
import { learnItems, type LearnSection } from "./content";

const SECTIONS: { id: LearnSection; title: string; tone: string }[] = [
  { id: "glucose", title: t.learn.glucoseSection, tone: "bg-sleep-soft" },
  { id: "habits", title: t.learn.habitsSection, tone: "bg-move-soft" },
  { id: "doctor", title: t.learn.doctorSection, tone: "bg-feeling-soft" },
];

/** Learn tab: 30-second cards (undesigned; D1 card pattern). */
export default function Learn() {
  const items = learnItems();
  return (
    <TabScreen>
      <h1 className="t-title mt-2">{t.learn.title}</h1>
      <p className="t-body-l mt-2 text-muted-foreground">{t.learn.sub}</p>
      {SECTIONS.map((s) => (
        <section key={s.id} className="mt-6" aria-labelledby={`learn-${s.id}`}>
          <Overline as="h2">
            <span id={`learn-${s.id}`}>{s.title}</span>
          </Overline>
          <ul className="mt-2 space-y-2">
            {items
              .filter((i) => i.section === s.id)
              .map((i) => (
                <li key={i.id}>
                  <Link
                    to={`/learn/${i.id}`}
                    className={cn("flex items-center gap-3 rounded-card p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", s.tone)}
                  >
                    <span className="flex-1">
                      <span className="t-body-strong block">{i.title}</span>
                      <span className="t-caption text-muted-foreground">{i.tag ?? t.learn.seconds}</span>
                    </span>
                    <ChevronRight aria-hidden className="h-5 w-5 text-muted-foreground" />
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </TabScreen>
  );
}
