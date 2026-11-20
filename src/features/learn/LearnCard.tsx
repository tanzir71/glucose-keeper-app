import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BackHeader, FlowScreen } from "@/components/keeper/Layout";
import { reachLadderStep, updateSettings } from "@/lib/settings";
import { GLUCOSE_LEARN_CARDS } from "@/lib/rules/invitation";
import { t } from "@/copy/en";
import { learnItems } from "./content";

/** A 30-second Learn card. Opening a glucose card is ladder step 3 (Learn). */
export default function LearnCard() {
  const { cardId } = useParams();
  const item = learnItems().find((i) => i.id === cardId);
  const id = item?.id;

  useEffect(() => {
    if (!id) return;
    void updateSettings((s) => ({ learnOpens: [...(s.learnOpens ?? []).slice(-49), { cardId: id, at: new Date().toISOString() }] }));
    if (GLUCOSE_LEARN_CARDS.includes(id)) void reachLadderStep(3);
  }, [id]);

  if (!item) return <FlowScreen>{null}</FlowScreen>;
  return (
    <FlowScreen
      footer={
        <Button asChild size="lg" variant="outline">
          <Link to="/learn">{t.learn.readNext}</Link>
        </Button>
      }
    >
      <BackHeader label={t.learn.title} to="/learn" />
      <p className="t-overline text-muted-foreground">{item.tag ?? t.learn.seconds}</p>
      <h1 className="t-title mt-2">{item.title}</h1>
      <p className="t-body-l mt-4">{item.body}</p>
      {item.footer && <p className="t-body-strong mt-4">{item.footer}</p>}
      {item.source && <p className="t-caption mt-6 text-muted-foreground">{item.source}</p>}
    </FlowScreen>
  );
}
