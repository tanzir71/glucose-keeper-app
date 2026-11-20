import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FlowScreen } from "@/components/keeper/Layout";
import { t } from "@/copy/en";

export default function NotFound() {
  return (
    <FlowScreen
      footer={
        <Button asChild size="lg">
          <Link to="/">{t.notFound.back}</Link>
        </Button>
      }
    >
      <h1 className="t-title mt-16">{t.notFound.title}</h1>
    </FlowScreen>
  );
}
