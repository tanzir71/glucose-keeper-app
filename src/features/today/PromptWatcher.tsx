import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "@/lib/db";
import { dueCheckIn } from "@/lib/data";
import { getSettings } from "@/lib/settings";
import { addDays, startOfLocalDay } from "@/lib/rules/time";

/**
 * In-app prompts, computed when the app is opened or refocused (no background timers, no push).
 * B3: if a meal was 100–180 min ago and has no check-in, open the check-in once — only from
 * Today, never interrupting another flow, and never again after it's closed.
 */
export function PromptWatcher() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const shown = useRef(new Set<string>());
  const path = useRef(pathname);
  path.current = pathname;

  useEffect(() => {
    let alive = true;
    const check = async () => {
      if (path.current !== "/" || document.visibilityState !== "visible") return;
      const now = new Date();
      const s = await getSettings();
      if (!s.onboarded) return;
      const from = startOfLocalDay(addDays(now, -1)).toISOString();
      const [logs, checkins] = await Promise.all([
        db.logs.where("at").aboveOrEqual(from).toArray(),
        db.checkins.where("at").aboveOrEqual(from).toArray(),
      ]);
      const meal = dueCheckIn(now, logs, checkins, s);
      if (!alive || !meal || s.checkinDismissed?.includes(meal.id)) return;
      const key = `${meal.id}:${s.checkinSnooze?.mealId === meal.id ? "again" : "first"}`;
      if (shown.current.has(key)) return;
      shown.current.add(key);
      navigate(`/checkin/${meal.id}`);
    };
    void check();
    const onVis = () => void check();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, [navigate]);

  return null;
}
