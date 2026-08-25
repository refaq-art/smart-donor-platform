import { notFound } from "next/navigation";
import { listSponsors, getChildCharacters, getEditableReport } from "@/lib/data/admin";
import { ReportWizard } from "@/components/admin/wizard/ReportWizard";
import type { WizardState } from "@/lib/wizard-types";

export const dynamic = "force-dynamic";

export default async function EditReportPage({ params }: { params: { id: string } }) {
  const [sponsors, characters, editable] = await Promise.all([
    listSponsors(),
    getChildCharacters(),
    getEditableReport(params.id),
  ]);

  if (!editable) notFound();
  const { report, metrics, distribution, journey, stories, achievements } = editable;

  const initialState: WizardState = {
    reportId: report.id,
    sponsorMode: "existing",
    sponsorId: report.sponsor_id,
    newSponsor: { full_name: "", honorific: "الأستاذ", phone: "", email: "", sponsor_number: "" },
    title: report.title,
    period_start: report.period_start ?? "",
    period_end: report.period_end ?? "",
    total_support: report.total_support,
    child_character_id: report.child_character_id ?? "",
    child_gender: report.child_gender,
    child_alias_name: report.child_alias_name,
    child_age: report.child_age ?? 0,
    child_education_level: report.child_education_level ?? "",
    child_city: report.child_city ?? "",
    metrics: metrics.map((m) => ({
      metric_key: m.metric_key,
      metric_label: m.metric_label,
      metric_value: m.metric_value,
      metric_unit: m.metric_unit ?? "",
    })),
    distribution: distribution.map((d) => ({
      category_key: d.category_key,
      category_label: d.category_label,
      percentage: d.percentage,
      description: d.description ?? "",
      color_hex: d.color_hex ?? "#4E7A64",
    })),
    achievements: achievements.map((a) => ({
      achievement_key: a.achievement_key,
      title: a.title,
      description: a.description,
    })),
    journey: journey.map((j) => ({
      stage_key: j.stage_key,
      title: j.title,
      description: j.description,
      character_stage: j.character_stage,
    })),
    intro_note: report.intro_note ?? "",
    story: stories[0]
      ? { quote_text: stories[0].quote_text, context_note: stories[0].context_note }
      : { quote_text: "", context_note: "اقتباس تعبيري يحفظ خصوصية المستفيد" },
    thank_you_message: report.thank_you_message ?? "",
    renewal_url: report.renewal_url ?? "",
    additional_opportunity_url: report.additional_opportunity_url ?? "",
    status: report.status === "viewed" ? "sent" : report.status,
  };

  return <ReportWizard sponsors={sponsors} characters={characters} initialState={initialState} />;
}
