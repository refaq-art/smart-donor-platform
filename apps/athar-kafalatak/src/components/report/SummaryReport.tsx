"use client";

import { Download, ArrowRight, Home, BookOpen, Sprout, Sparkles, HeartHandshake, type LucideIcon } from "lucide-react";
import type { AchievementKey, FullReport } from "@/lib/types";
import { CharacterPortrait } from "./CharacterPortrait";
import { DonutChart } from "./DonutChart";
import { JourneyTimeline } from "./JourneyTimeline";
import { AnimatedCounter } from "./AnimatedCounter";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

const ACHIEVEMENT_ICONS: Record<AchievementKey, LucideIcon> = {
  basic_needs: Home,
  education: BookOpen,
  development: Sprout,
  skills: Sparkles,
  stability: HeartHandshake,
};

export function SummaryReport({
  data,
  onBackToJourney,
  hideActions,
}: {
  data: FullReport;
  onBackToJourney?: () => void;
  hideActions?: boolean;
}) {
  const { report, sponsor } = data;

  return (
    <div className="min-h-dvh bg-white">
      <header className="border-b border-forest-100 bg-gradient-to-b from-beige-light to-white px-6 py-14 text-center geo-pattern">
        <span className="mb-3 inline-block rounded-full bg-forest-100 px-4 py-1 text-xs font-bold text-forest-600">
          أثر كفالتك
        </span>
        <h1 className="text-3xl font-extrabold text-forest-900 sm:text-4xl">{report.title}</h1>
        <p className="mt-2 text-forest-500">
          {sponsor.honorific} {sponsor.full_name} — {formatDate(report.period_start)} إلى{" "}
          {formatDate(report.period_end)}
        </p>
        <div className="mt-6 flex justify-center">
          <CharacterPortrait stages={data.characterStages} stage="success" size={160} />
        </div>

        {!hideActions ? (
          <div className="mt-8 flex flex-wrap justify-center gap-3 no-print">
            <a href={`/report/${report.report_token}/pdf`} target="_blank" rel="noopener noreferrer">
              <Button variant="gold">
                <Download className="h-4 w-4" />
                تحميل تقرير PDF
              </Button>
            </a>
            {onBackToJourney ? (
              <Button variant="outline" onClick={onBackToJourney}>
                <ArrowRight className="h-4 w-4" />
                الرجوع إلى الجولة
              </Button>
            ) : null}
          </div>
        ) : null}
      </header>

      <section className="mx-auto max-w-4xl px-6 py-14">
        <h2 className="mb-6 text-center text-xl font-bold text-forest-800">أبرز الأرقام</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {data.metrics.map((m) => (
            <AnimatedCounter key={m.id} value={m.metric_value} unit={m.metric_unit} label={m.metric_label} />
          ))}
        </div>
        <p className="mt-4 text-center text-sm text-forest-500">
          إجمالي الدعم خلال الفترة: <span className="font-bold text-forest-800">{formatCurrency(report.total_support)}</span>
        </p>
      </section>

      <section className="bg-beige-light px-6 py-14">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-xl font-bold text-forest-800">توزيع الأثر</h2>
          <DonutChart items={data.distribution} />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-14">
        <h2 className="mb-8 text-center text-xl font-bold text-forest-800">رحلتي مع كفالتك</h2>
        <JourneyTimeline items={data.journey} stages={data.characterStages} />
      </section>

      <section className="bg-beige-light px-6 py-14">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-xl font-bold text-forest-800">أبرز الإنجازات</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {data.achievements.map((a) => {
              const Icon = ACHIEVEMENT_ICONS[a.achievement_key] ?? Sparkles;
              return (
                <div key={a.id} className="flex items-start gap-4 rounded-xl2 border border-forest-100 bg-white p-5 shadow-card">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="font-bold text-forest-800">{a.title}</div>
                    <p className="mt-1 text-sm leading-relaxed text-forest-600">{a.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {data.stories[0] ? (
        <section className="mx-auto max-w-2xl px-6 py-14 text-center">
          <blockquote className="text-xl font-bold leading-relaxed text-forest-800">
            «{data.stories[0].quote_text}»
          </blockquote>
          <p className="mt-3 text-xs text-forest-400">{data.stories[0].context_note}</p>
        </section>
      ) : null}

      {report.thank_you_message ? (
        <section className="bg-forest px-6 py-16 text-center text-white">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-4 text-xl font-bold">رسالة شكر</h2>
            <p className="leading-loose">{report.thank_you_message}</p>
          </div>
        </section>
      ) : null}

      <footer className="px-6 py-8 text-center text-xs text-forest-400">
        تقرير أثر مُصدر بتاريخ {formatDate(new Date().toISOString())} — هذه شخصية تمثيلية تعبر عن
        الأثر مع الحفاظ على خصوصية المستفيدين.
      </footer>
    </div>
  );
}
