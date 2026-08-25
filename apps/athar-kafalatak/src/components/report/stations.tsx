"use client";

import { motion } from "framer-motion";
import { Home, BookOpen, Sprout, Sparkles, HeartHandshake, type LucideIcon } from "lucide-react";
import type { FullReport, CharacterStage, AchievementKey } from "@/lib/types";
import { AnimatedCounter } from "./AnimatedCounter";
import { DonutChart } from "./DonutChart";
import { JourneyTimeline } from "./JourneyTimeline";
import { formatDate } from "@/lib/utils";

export interface StationDef {
  key: string;
  title: string;
  characterStage: CharacterStage;
}

export const STATIONS: StationDef[] = [
  { key: "profile", title: "من أنا؟", characterStage: "intro" },
  { key: "numbers", title: "أثر دعمك بالأرقام", characterStage: "education" },
  { key: "distribution", title: "أين ذهب دعمك؟", characterStage: "basic_needs" },
  { key: "journey", title: "رحلتي مع كفالتك", characterStage: "development" },
  { key: "story", title: "لحظة صنعت فرقًا", characterStage: "development" },
  { key: "achievements", title: "ما الذي تحقق؟", characterStage: "success" },
  { key: "thankyou", title: "رسالة شكر", characterStage: "thank_you" },
];

const ACHIEVEMENT_ICONS: Record<AchievementKey, LucideIcon> = {
  basic_needs: Home,
  education: BookOpen,
  development: Sprout,
  skills: Sparkles,
  stability: HeartHandshake,
};

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

export function StationTitle({ children }: { children: React.ReactNode }) {
  return (
    <motion.h2
      {...fadeUp}
      className="mb-6 text-center text-2xl font-extrabold text-forest-800 sm:text-3xl"
    >
      {children}
    </motion.h2>
  );
}

export function StationProfile({ data }: { data: FullReport }) {
  const { report } = data;
  return (
    <div>
      <StationTitle>من أنا؟</StationTitle>
      <motion.p {...fadeUp} className="mx-auto mb-8 max-w-xl text-center leading-relaxed text-forest-700">
        أنا {report.child_alias_name}، عمري {report.child_age ?? "—"} سنوات، وأدرس في{" "}
        {report.child_education_level ?? "مرحلتي الدراسية"}. أمثل أحد نماذج الأثر الذي تصنعه
        الكفالة في حياة الأطفال المستفيدين.
      </motion.p>
      <motion.div
        {...fadeUp}
        className="mx-auto grid max-w-xl grid-cols-2 gap-3 rounded-xl2 border border-forest-100 bg-white p-5 shadow-card sm:grid-cols-4"
      >
        <Field label="الاسم المستعار" value={report.child_alias_name} />
        <Field label="العمر" value={report.child_age ? `${report.child_age} سنوات` : "—"} />
        <Field label="المرحلة الدراسية" value={report.child_education_level ?? "—"} />
        <Field label="المدينة" value={report.child_city ?? "—"} />
      </motion.div>
      {report.intro_note ? (
        <motion.p
          {...fadeUp}
          className="mx-auto mt-8 max-w-xl rounded-xl2 bg-beige px-5 py-4 text-center text-sm leading-relaxed text-forest-700"
        >
          {report.intro_note}
        </motion.p>
      ) : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-[11px] font-medium text-forest-400">{label}</div>
      <div className="mt-1 text-sm font-bold text-forest-800">{value}</div>
    </div>
  );
}

export function StationNumbers({ data }: { data: FullReport }) {
  return (
    <div>
      <StationTitle>هذا بعض ما صنعه دعمك</StationTitle>
      <motion.p {...fadeUp} className="mx-auto mb-8 max-w-xl text-center leading-relaxed text-forest-700">
        دعني أريك بعض النتائج التي تحققت بفضل دعمك.
      </motion.p>
      <div className="mx-auto grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3">
        {data.metrics.map((m, i) => (
          <AnimatedCounter
            key={m.id}
            value={m.metric_value}
            unit={m.metric_unit}
            label={m.metric_label}
            delay={i * 0.08}
          />
        ))}
      </div>
      <motion.p
        {...fadeUp}
        className="mx-auto mt-8 max-w-xl text-center text-sm leading-relaxed text-forest-600"
      >
        هذه ليست مجرد أرقام، فكل رقم منها يمثل شيئًا تغير في حياتي.
      </motion.p>
    </div>
  );
}

export function StationDistribution({ data }: { data: FullReport }) {
  return (
    <div>
      <StationTitle>أين صنع دعمك الأثر؟</StationTitle>
      <motion.p {...fadeUp} className="mx-auto mb-8 max-w-xl text-center leading-relaxed text-forest-700">
        قد تتساءل أين ذهب دعمك، دعني أوضح لك.
      </motion.p>
      <DonutChart items={data.distribution} />
    </div>
  );
}

export function StationJourney({ data }: { data: FullReport }) {
  return (
    <div>
      <StationTitle>رحلتي مع كفالتك</StationTitle>
      <div className="mx-auto max-w-2xl">
        <JourneyTimeline items={data.journey} stages={data.characterStages} />
      </div>
    </div>
  );
}

export function StationStory({ data }: { data: FullReport }) {
  const story = data.stories[0];
  return (
    <div>
      <StationTitle>لحظة صنعت فرقًا</StationTitle>
      <motion.p {...fadeUp} className="mx-auto mb-8 max-w-xl text-center leading-relaxed text-forest-700">
        أحب أن أشاركك موقفًا صغيرًا يعني لي الكثير.
      </motion.p>
      {story ? (
        <motion.figure
          {...fadeUp}
          className="mx-auto max-w-xl rounded-xl2 border border-gold-light bg-gradient-to-b from-gold-light/30 to-white p-8 text-center shadow-card"
        >
          <blockquote className="text-xl font-bold leading-relaxed text-forest-800">
            «{story.quote_text}»
          </blockquote>
          <figcaption className="mt-4 text-xs text-forest-400">{story.context_note}</figcaption>
        </motion.figure>
      ) : null}
    </div>
  );
}

export function StationAchievements({ data }: { data: FullReport }) {
  return (
    <div>
      <StationTitle>ما الذي تحقق؟</StationTitle>
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        {data.achievements.map((a, i) => {
          const Icon = ACHIEVEMENT_ICONS[a.achievement_key] ?? Sparkles;
          return (
            <motion.div
              key={a.id}
              {...fadeUp}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex items-start gap-4 rounded-xl2 border border-forest-100 bg-white p-5 shadow-card"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-600">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <div className="font-bold text-forest-800">{a.title}</div>
                <p className="mt-1 text-sm leading-relaxed text-forest-600">{a.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function StationThankYou({
  data,
  onContinue,
}: {
  data: FullReport;
  onContinue: () => void;
}) {
  const { report, sponsor } = data;
  return (
    <div className="text-center">
      <StationTitle>رسالة شكر</StationTitle>
      <motion.p
        {...fadeUp}
        className="mx-auto max-w-xl text-lg font-semibold leading-loose text-forest-800"
      >
        {sponsor.honorific} {sponsor.full_name}،
        <br />
        شكرًا لأنك كنت جزءًا من هذه الرحلة.
      </motion.p>
      {report.thank_you_message ? (
        <motion.p
          {...fadeUp}
          className="mx-auto mt-5 max-w-xl leading-relaxed text-forest-700"
        >
          {report.thank_you_message}
        </motion.p>
      ) : null}

      <motion.div {...fadeUp} className="mx-auto mt-10 max-w-xl rounded-xl2 border border-gold-light bg-beige px-6 py-8">
        <h3 className="mb-2 text-lg font-bold text-forest-800">القصة لم تنتهِ بعد</h3>
        <p className="mb-6 text-sm leading-relaxed text-forest-600">
          استمرار كفالتك يعني استمرار هذه الرحلة، ويمكنك أيضًا المساهمة في فرصة إضافية تصنع
          أثرًا أكبر.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {report.renewal_url ? (
            <a
              href={report.renewal_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl2 bg-forest px-6 py-3 text-sm font-bold text-white shadow-soft transition-colors hover:bg-forest-600"
            >
              استمرار الكفالة
            </a>
          ) : null}
          {report.additional_opportunity_url ? (
            <a
              href={report.additional_opportunity_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl2 bg-gold px-6 py-3 text-sm font-bold text-forest-900 shadow-soft transition-colors hover:bg-gold-dark hover:text-white"
            >
              دعم فرصة إضافية
            </a>
          ) : null}
          <button
            onClick={onContinue}
            className="rounded-xl2 border border-forest-200 bg-white px-6 py-3 text-sm font-bold text-forest-700 transition-colors hover:bg-forest-50"
          >
            العودة لملخص الأثر
          </button>
        </div>
      </motion.div>

      <p className="mt-6 text-xs text-forest-400">
        تقرير صادر بتاريخ {formatDate(new Date().toISOString())}
      </p>
    </div>
  );
}
