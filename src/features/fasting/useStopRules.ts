import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { endFast } from "@/lib/fastingStore";
import { shouldStopFast } from "@/lib/rules/fasting";
import type { FastSession, GlucoseReading, LogEntry } from "@/types/domain";

/**
 * Stop rules for every track (05 §4.6): when one fires, end the fast (endedEarly + endReason,
 * which also pauses step-up offers for 7 days), then open the stop sheet. Ending early counts.
 */
export function useStopRules(session: FastSession | undefined, readings: GlucoseReading[], logs: LogEntry[]): void {
  const navigate = useNavigate();
  const handled = useRef<string>();
  const result = session && !session.endedAt ? shouldStopFast({ session, readings, logs }) : ({ stop: false } as const);
  const key = result.stop && session ? `${session.id}:${result.trigger}` : "";

  useEffect(() => {
    if (!result.stop || !session || handled.current === session.id) return;
    handled.current = session.id;
    void endFast(session, result.endReason).then(() => navigate(`/fasting/stop?ended=1&reason=${result.trigger}`));
    // key captures everything that matters about `result` and `session`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
