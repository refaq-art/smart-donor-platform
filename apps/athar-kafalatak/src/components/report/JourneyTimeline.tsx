"use client";

import { motion } from "framer-motion";
import type { ChildCharacterStage, ReportJourneyItem, CharacterStage } from "@/lib/types";

export function JourneyTimeline({
  items,
  stages,
}: {
  items: ReportJourneyItem[];
  stages: Record<CharacterStage, ChildCharacterStage | undefined>;
}) {
  return (
    <div className="relative">
      <div className="absolute right-5 top-6 bottom-6 w-0.5 bg-gradient-to-b from-gold via-forest-200 to-forest-400 sm:right-1/2" />
      <div className="space-y-10">
        {items.map((item, index) => {
          const img = stages[item.character_stage];
          const isEven = index % 2 === 0;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5 }}
              className="relative flex items-start gap-5 sm:gap-8"
            >
              <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-4 border-beige-light bg-gold text-sm font-bold text-forest-900 shadow-soft">
                {index + 1}
              </div>
              <div className="flex flex-1 flex-col items-start gap-4 sm:flex-row sm:items-center">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img.image_url}
                    alt={img.alt_text}
                    className="h-16 w-16 shrink-0 rounded-full shadow-card"
                  />
                ) : null}
                <div className="rounded-xl2 border border-forest-100 bg-white p-5 shadow-card">
                  <div className="mb-1 text-xs font-bold uppercase tracking-wide text-gold-dark">
                    {item.title}
                  </div>
                  <p className="text-sm leading-relaxed text-forest-700">{item.description}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
