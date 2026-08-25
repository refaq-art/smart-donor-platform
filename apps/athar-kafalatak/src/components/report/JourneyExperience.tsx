"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, ChevronLeft, X } from "lucide-react";
import type { FullReport } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { CharacterPortrait } from "./CharacterPortrait";
import {
  STATIONS,
  StationProfile,
  StationNumbers,
  StationDistribution,
  StationJourney,
  StationStory,
  StationAchievements,
  StationThankYou,
} from "./stations";

const STATION_RENDERERS = [
  StationProfile,
  StationNumbers,
  StationDistribution,
  StationJourney,
  StationStory,
  StationAchievements,
];

export function JourneyExperience({
  data,
  currentStation,
  onNext,
  onPrev,
  onSkip,
  onFinish,
}: {
  data: FullReport;
  currentStation: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onFinish: () => void;
}) {
  const topRef = useRef<HTMLDivElement>(null);
  const station = STATIONS[currentStation];
  const isLast = currentStation === STATIONS.length - 1;

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentStation]);

  const StationComponent = STATION_RENDERERS[currentStation];

  return (
    <div ref={topRef} className="min-h-dvh bg-beige-light">
      <div className="sticky top-0 z-20 border-b border-forest-100 bg-beige-light/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
          <button
            onClick={onSkip}
            className="flex items-center gap-1 text-xs font-semibold text-forest-400 hover:text-forest-600"
          >
            <X className="h-3.5 w-3.5" />
            تخطي الجولة
          </button>
          <div className="flex-1">
            <Progress value={((currentStation + 1) / STATIONS.length) * 100} />
          </div>
          <span className="whitespace-nowrap text-xs font-bold text-forest-500">
            {currentStation + 1} من {STATIONS.length}
          </span>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 lg:grid-cols-[240px_1fr] lg:items-start lg:py-16">
        <div className="hidden lg:sticky lg:top-24 lg:flex lg:flex-col lg:items-center">
          <CharacterPortrait
            stages={data.characterStages}
            stage={station.characterStage}
            size={200}
          />
          <p className="mt-4 text-center text-sm font-bold text-forest-700">
            {data.report.child_alias_name}
          </p>
        </div>

        <div className="mb-2 flex justify-center lg:hidden">
          <div className="flex items-center gap-3 rounded-full border border-forest-100 bg-white px-4 py-2 shadow-card">
            <CharacterPortrait
              stages={data.characterStages}
              stage={station.characterStage}
              size={44}
            />
            <span className="text-xs font-bold text-forest-700">
              {data.report.child_alias_name} يشاركك المحطة {currentStation + 1}
            </span>
          </div>
        </div>

        <div className="min-h-[50vh]">
          <AnimatePresence mode="wait">
            <motion.div
              key={station.key}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.35 }}
            >
              {isLast ? (
                <StationThankYou data={data} onContinue={onFinish} />
              ) : (
                <StationComponent data={data} />
              )}
            </motion.div>
          </AnimatePresence>

          {!isLast ? (
            <div className="mt-12 flex items-center justify-between">
              <button
                onClick={onPrev}
                disabled={currentStation === 0}
                className="flex items-center gap-1 rounded-xl2 border border-forest-200 bg-white px-5 py-2.5 text-sm font-bold text-forest-700 transition-colors hover:bg-forest-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
                السابق
              </button>
              <button
                onClick={onNext}
                className="flex items-center gap-1 rounded-xl2 bg-forest px-6 py-2.5 text-sm font-bold text-white shadow-soft transition-colors hover:bg-forest-600"
              >
                التالي
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="mt-10 flex justify-center">
              <button
                onClick={onFinish}
                className="text-sm font-bold text-forest-500 underline underline-offset-4 hover:text-forest-700"
              >
                عرض ملخص التقرير الكامل
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
