"use client";

import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import type { FullReport } from "@/lib/types";
import { CharacterPortrait } from "./CharacterPortrait";
import { Button } from "@/components/ui/button";

export function WelcomeScreen({
  data,
  onStartJourney,
  onViewSummary,
}: {
  data: FullReport;
  onStartJourney: () => void;
  onViewSummary: () => void;
}) {
  const { report, sponsor } = data;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-beige-light via-beige to-white px-6 py-16 geo-pattern">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 text-center"
      >
        <span className="mb-3 inline-block rounded-full bg-forest-100 px-4 py-1 text-xs font-bold text-forest-600">
          أثر كفالتك
        </span>
        <h1 className="text-3xl font-extrabold text-forest-900 sm:text-4xl">
          أهلًا {sponsor.honorific} {sponsor.full_name}
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.15 }}
      >
        <CharacterPortrait
          stages={data.characterStages}
          stage="intro"
          size={220}
          className="mx-auto"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="relative mt-6 max-w-md rounded-xl2 border border-forest-100 bg-white px-6 py-5 text-center shadow-card"
      >
        <span className="absolute -top-2 right-8 h-4 w-4 rotate-45 border-t border-l border-forest-100 bg-white" />
        <p className="text-base font-semibold leading-relaxed text-forest-800">
          السلام عليكم {sponsor.honorific} {sponsor.full_name}، أنا {report.child_alias_name}.
          <br />
          أحب أن آخذك في جولة قصيرة لأريك كيف صنع دعمك فرقًا في حياتي.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-8 flex flex-col gap-3 sm:flex-row"
      >
        <Button size="lg" variant="gold" onClick={onStartJourney}>
          ابدأ رحلة الأثر
        </Button>
        <Button size="lg" variant="outline" onClick={onViewSummary}>
          عرض التقرير مباشرة
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="mt-10 flex max-w-md items-start gap-2 text-center text-xs leading-relaxed text-forest-400"
      >
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest-300" />
        <span>
          هذه شخصية تمثيلية تعبر عن أثر الكفالة مع الحفاظ على خصوصية المستفيدين، ولا تمثل صورة
          حقيقية لأي مستفيد.
        </span>
      </motion.div>
    </div>
  );
}
