import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  ChildCharacter,
  ChildCharacterStage,
  Report,
  ReportAchievement,
  ReportJourneyItem,
  ReportMetric,
  ReportStory,
  Sponsor,
  SupportDistributionItem,
} from "@/lib/types";

export interface DashboardStats {
  totalReports: number;
  sentReports: number;
  viewedReports: number;
  viewRate: number;
  avgJourneyCompletion: number;
  notViewedSponsors: { sponsor_name: string; report_token: string; title: string }[];
  recentViews: { sponsor_name: string; last_seen_at: string; title: string }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createServerSupabaseClient();

  const { data: reports } = await supabase
    .from("reports")
    .select("id, status, title, report_token, sponsor_id, sponsors(full_name)")
    .returns<
      { id: string; status: string; title: string; report_token: string; sponsor_id: string; sponsors: { full_name: string } | null }[]
    >();

  const list = reports ?? [];
  const totalReports = list.length;
  const sentReports = list.filter((r) => r.status === "sent" || r.status === "viewed").length;
  const viewedReports = list.filter((r) => r.status === "viewed").length;
  const viewRate = sentReports > 0 ? Math.round((viewedReports / sentReports) * 100) : 0;

  const { data: views } = await supabase
    .from("report_views")
    .select("report_id, completed_journey, last_stage_reached, last_seen_at");

  const viewList = views ?? [];
  const avgJourneyCompletion =
    viewList.length > 0
      ? Math.round(
          (viewList.filter((v) => v.completed_journey).length / viewList.length) * 100
        )
      : 0;

  const viewedReportIds = new Set(viewList.map((v) => v.report_id));
  const notViewedSponsors = list
    .filter((r) => (r.status === "sent") && !viewedReportIds.has(r.id))
    .slice(0, 8)
    .map((r) => ({
      sponsor_name: r.sponsors?.full_name ?? "—",
      report_token: r.report_token,
      title: r.title,
    }));

  const recentViews = [...viewList]
    .sort((a, b) => new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime())
    .slice(0, 8)
    .map((v) => {
      const report = list.find((r) => r.id === v.report_id);
      return {
        sponsor_name: report?.sponsors?.full_name ?? "—",
        last_seen_at: v.last_seen_at,
        title: report?.title ?? "—",
      };
    });

  return {
    totalReports,
    sentReports,
    viewedReports,
    viewRate,
    avgJourneyCompletion,
    notViewedSponsors,
    recentViews,
  };
}

export async function listSponsors(search?: string): Promise<Sponsor[]> {
  const supabase = createServerSupabaseClient();
  let query = supabase.from("sponsors").select("*").order("created_at", { ascending: false });
  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,sponsor_number.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`
    );
  }
  const { data } = await query;
  return data ?? [];
}

export async function getSponsor(id: string): Promise<Sponsor | null> {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase.from("sponsors").select("*").eq("id", id).maybeSingle();
  return data;
}

export interface ReportListItem extends Report {
  sponsor_name: string;
  view_count: number;
}

export async function listReports(search?: string): Promise<ReportListItem[]> {
  const supabase = createServerSupabaseClient();
  const { data: reports } = await supabase
    .from("reports")
    .select("*, sponsors(full_name)")
    .order("created_at", { ascending: false })
    .returns<(Report & { sponsors: { full_name: string } | null })[]>();

  const { data: views } = await supabase.from("report_views").select("report_id");
  const counts = new Map<string, number>();
  for (const v of views ?? []) counts.set(v.report_id, (counts.get(v.report_id) ?? 0) + 1);

  const list = (reports ?? []).map((r) => ({
    ...r,
    sponsor_name: r.sponsors?.full_name ?? "—",
    view_count: counts.get(r.id) ?? 0,
  }));

  if (!search) return list;
  const s = search.toLowerCase();
  return list.filter(
    (r) =>
      r.sponsor_name.toLowerCase().includes(s) ||
      r.title.toLowerCase().includes(s) ||
      r.report_token.toLowerCase().includes(s)
  );
}

export async function getChildCharacters(): Promise<
  (ChildCharacter & { stages: ChildCharacterStage[] })[]
> {
  const supabase = createServerSupabaseClient();
  const { data: characters } = await supabase
    .from("child_characters")
    .select("*")
    .eq("is_active", true);
  const { data: stages } = await supabase.from("child_character_stages").select("*");

  return (characters ?? []).map((c) => ({
    ...c,
    stages: (stages ?? []).filter((s) => s.character_id === c.id),
  }));
}

export interface EditableReport {
  report: Report;
  metrics: ReportMetric[];
  distribution: SupportDistributionItem[];
  journey: ReportJourneyItem[];
  stories: ReportStory[];
  achievements: ReportAchievement[];
}

export async function getEditableReport(id: string): Promise<EditableReport | null> {
  const supabase = createServerSupabaseClient();
  const { data: report } = await supabase.from("reports").select("*").eq("id", id).maybeSingle<Report>();
  if (!report) return null;

  const [{ data: metrics }, { data: distribution }, { data: journey }, { data: stories }, { data: achievements }] =
    await Promise.all([
      supabase.from("report_metrics").select("*").eq("report_id", id).order("display_order"),
      supabase.from("support_distribution").select("*").eq("report_id", id).order("display_order"),
      supabase.from("report_journey").select("*").eq("report_id", id).order("display_order"),
      supabase.from("report_stories").select("*").eq("report_id", id).order("display_order"),
      supabase.from("report_achievements").select("*").eq("report_id", id).order("display_order"),
    ]);

  return {
    report,
    metrics: metrics ?? [],
    distribution: distribution ?? [],
    journey: journey ?? [],
    stories: stories ?? [],
    achievements: achievements ?? [],
  };
}
