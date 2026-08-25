"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FullReport } from "@/lib/types";
import { getOrCreateSessionId } from "@/lib/session";
import { WelcomeScreen } from "./WelcomeScreen";
import { JourneyExperience } from "./JourneyExperience";
import { SummaryReport } from "./SummaryReport";
import { STATIONS } from "./stations";

type View = "welcome" | "journey" | "summary";

export function ReportExperience({ data }: { data: FullReport }) {
  const [view, setView] = useState<View>("welcome");
  const [station, setStation] = useState(0);
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId();
    void track({ stageReached: 0, completed: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const track = useCallback(
    async (payload: { stageReached: number; completed: boolean }) => {
      try {
        await fetch("/api/report-view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: data.report.report_token,
            sessionId: sessionIdRef.current || getOrCreateSessionId(),
            ...payload,
          }),
        });
      } catch {
        // best-effort tracking — never block the sponsor's experience
      }
    },
    [data.report.report_token]
  );

  const goToStation = (index: number) => {
    setStation(index);
    void track({ stageReached: index + 1, completed: index === STATIONS.length - 1 });
  };

  return (
    <>
      {view === "welcome" ? (
        <WelcomeScreen
          data={data}
          onStartJourney={() => {
            setView("journey");
            goToStation(0);
          }}
          onViewSummary={() => {
            setView("summary");
            void track({ stageReached: STATIONS.length, completed: false });
          }}
        />
      ) : null}

      {view === "journey" ? (
        <JourneyExperience
          data={data}
          currentStation={station}
          onNext={() => goToStation(Math.min(STATIONS.length - 1, station + 1))}
          onPrev={() => goToStation(Math.max(0, station - 1))}
          onSkip={() => setView("summary")}
          onFinish={() => {
            void track({ stageReached: STATIONS.length, completed: true });
            setView("summary");
          }}
        />
      ) : null}

      {view === "summary" ? (
        <SummaryReport data={data} onBackToJourney={() => setView("journey")} />
      ) : null}
    </>
  );
}
