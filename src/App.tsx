import { Suspense, lazy, useEffect, useState, type ReactNode } from "react";
import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { migrateV1 } from "@/lib/migrate-v1";
import { useSettings } from "@/lib/settings";
import { PromptWatcher } from "@/features/today/PromptWatcher";
import Welcome from "@/features/onboarding/Welcome";
import WhatFeelsEasy from "@/features/onboarding/WhatFeelsEasy";
import YourRhythm from "@/features/onboarding/YourRhythm";
import Today from "@/features/today/Today";
import LogSheet from "@/features/log/LogSheet";

// Everything off the first-run path is a lazy chunk (shell JS budget ≤ 180 KB gzip).
const CheckIn = lazy(() => import("@/features/checkin/CheckIn"));
const HabitTimer = lazy(() => import("@/features/habits/HabitTimer"));
const HabitLibrary = lazy(() => import("@/features/habits/HabitLibrary"));
const Week = lazy(() => import("@/features/week/Week"));
const Learn = lazy(() => import("@/features/learn/Learn"));
const LearnCard = lazy(() => import("@/features/learn/LearnCard"));
const You = lazy(() => import("@/features/you/You"));
const YouRhythm = lazy(() => import("@/features/you/YouRhythm"));
const YouRange = lazy(() => import("@/features/you/YouRange"));
const ExportPage = lazy(() => import("@/features/you/ExportPage"));
const NotFound = lazy(() => import("@/features/you/NotFound"));
const Comfort = lazy(() => import("@/features/glucose/Comfort"));
const Check = lazy(() => import("@/features/glucose/Check"));
const Sealed = lazy(() => import("@/features/glucose/Sealed"));
const Reading = lazy(() => import("@/features/glucose/Reading"));
const Safety = lazy(() => import("@/features/glucose/Safety"));
const SafetyTimer = lazy(() => import("@/features/glucose/SafetyTimer"));
const Numbers = lazy(() => import("@/features/glucose/numbers/Numbers"));

function Splash() {
  return <div className="min-h-dvh bg-background" aria-busy="true" />;
}

/** Redirect to #/welcome until settings.onboarded === true. */
function Guard({ children }: { children: ReactNode }) {
  const settings = useSettings();
  const { pathname } = useLocation();
  if (!settings) return <Splash />;
  const inOnboarding = pathname.startsWith("/welcome") || pathname.startsWith("/onboarding");
  if (!settings.onboarded && !inOnboarding) return <Navigate to="/welcome" replace />;
  if (settings.onboarded && pathname === "/welcome") return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // v1 → v2: move localStorage readings into IndexedDB once (idempotent).
    migrateV1()
      .catch((e) => console.warn("[keeper] migration failed", e))
      .finally(() => setReady(true));
  }, []);

  if (!ready) return <Splash />;

  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Guard>
        <PromptWatcher />
        <Suspense fallback={<Splash />}>
          <Routes>
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/onboarding/easy" element={<WhatFeelsEasy />} />
            <Route path="/onboarding/rhythm" element={<YourRhythm />} />

            <Route path="/" element={<Today />}>
              <Route path="log/:kind" element={<LogSheet />} />
            </Route>
            <Route path="/checkin/:mealId" element={<CheckIn />} />
            <Route path="/habit/:habitId" element={<HabitTimer />} />

            <Route path="/week" element={<Week />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/learn/:cardId" element={<LearnCard />} />

            <Route path="/you" element={<You />} />
            <Route path="/you/habits" element={<HabitLibrary />} />
            <Route path="/you/rhythm" element={<YouRhythm />} />
            <Route path="/you/range" element={<YouRange />} />
            <Route path="/you/export" element={<ExportPage />} />

            <Route path="/glucose/comfort" element={<Comfort />} />
            <Route path="/glucose/check" element={<Check />} />
            <Route path="/glucose/sealed/:id" element={<Sealed />} />
            <Route path="/glucose/reading/:id" element={<Reading />} />
            <Route path="/glucose/safety/:id" element={<Safety />} />
            <Route path="/glucose/timer" element={<SafetyTimer />} />
            <Route path="/glucose/numbers" element={<Numbers />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Guard>
      <Toaster position="top-center" />
    </HashRouter>
  );
}
