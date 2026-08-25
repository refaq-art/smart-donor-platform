"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateReportToken } from "@/lib/tokens";
import type { WizardState } from "@/lib/wizard-types";

const wizardSchema = z.object({
  reportId: z.string().uuid().optional(),
  sponsorMode: z.enum(["existing", "new"]),
  sponsorId: z.string().uuid().optional(),
  newSponsor: z.object({
    full_name: z.string(),
    honorific: z.string(),
    phone: z.string(),
    email: z.string(),
    sponsor_number: z.string(),
  }),
  title: z.string().min(1),
  period_start: z.string().optional().nullable(),
  period_end: z.string().optional().nullable(),
  total_support: z.number(),
  child_character_id: z.string().optional(),
  child_gender: z.enum(["male", "female"]),
  child_alias_name: z.string().min(1),
  child_age: z.number(),
  child_education_level: z.string(),
  child_city: z.string(),
  metrics: z.array(
    z.object({
      metric_key: z.string(),
      metric_label: z.string(),
      metric_value: z.number(),
      metric_unit: z.string(),
    })
  ),
  distribution: z.array(
    z.object({
      category_key: z.string(),
      category_label: z.string(),
      percentage: z.number(),
      description: z.string(),
      color_hex: z.string(),
    })
  ),
  achievements: z.array(
    z.object({
      achievement_key: z.enum(["basic_needs", "education", "development", "skills", "stability"]),
      title: z.string(),
      description: z.string(),
    })
  ),
  journey: z.array(
    z.object({
      stage_key: z.enum(["before", "during", "now"]),
      title: z.string(),
      description: z.string(),
      character_stage: z.enum([
        "intro",
        "education",
        "basic_needs",
        "development",
        "success",
        "thank_you",
      ]),
    })
  ),
  intro_note: z.string(),
  story: z.object({ quote_text: z.string(), context_note: z.string() }),
  thank_you_message: z.string(),
  renewal_url: z.string(),
  additional_opportunity_url: z.string(),
  status: z.enum(["draft", "ready", "sent"]),
});

export interface PublishResult {
  ok: boolean;
  token?: string;
  error?: string;
}

export async function publishReport(state: WizardState): Promise<PublishResult> {
  const parsed = wizardSchema.safeParse(state);
  if (!parsed.success) {
    return { ok: false, error: "بيانات غير مكتملة أو غير صحيحة: " + parsed.error.issues[0]?.message };
  }
  const data = parsed.data;
  const supabase = createServerSupabaseClient();

  let sponsorId = data.sponsorId;
  if (data.sponsorMode === "new") {
    const { data: sponsor, error } = await supabase
      .from("sponsors")
      .insert({
        full_name: data.newSponsor.full_name,
        honorific: data.newSponsor.honorific || "الأستاذ",
        phone: data.newSponsor.phone || null,
        email: data.newSponsor.email || null,
        sponsor_number: data.newSponsor.sponsor_number || null,
      })
      .select("id")
      .single();
    if (error || !sponsor) return { ok: false, error: "تعذر إنشاء الكافل: " + error?.message };
    sponsorId = sponsor.id;
  }

  if (!sponsorId) return { ok: false, error: "يجب اختيار كافل." };

  const reportPayload = {
    sponsor_id: sponsorId,
    title: data.title,
    status: data.status,
    period_start: data.period_start || null,
    period_end: data.period_end || null,
    total_support: data.total_support,
    child_character_id: data.child_character_id || null,
    child_alias_name: data.child_alias_name,
    child_age: data.child_age,
    child_education_level: data.child_education_level || null,
    child_city: data.child_city || null,
    child_gender: data.child_gender,
    intro_note: data.intro_note || null,
    thank_you_message: data.thank_you_message || null,
    renewal_url: data.renewal_url || null,
    additional_opportunity_url: data.additional_opportunity_url || null,
    published_at: data.status !== "draft" ? new Date().toISOString() : null,
  };

  let reportId = data.reportId;
  let token: string;

  if (reportId) {
    const { data: existing } = await supabase
      .from("reports")
      .select("report_token")
      .eq("id", reportId)
      .single();
    token = existing?.report_token ?? generateReportToken();

    const { error } = await supabase.from("reports").update(reportPayload).eq("id", reportId);
    if (error) return { ok: false, error: error.message };

    await Promise.all([
      supabase.from("report_metrics").delete().eq("report_id", reportId),
      supabase.from("support_distribution").delete().eq("report_id", reportId),
      supabase.from("report_achievements").delete().eq("report_id", reportId),
      supabase.from("report_journey").delete().eq("report_id", reportId),
      supabase.from("report_stories").delete().eq("report_id", reportId),
    ]);
  } else {
    token = generateReportToken();
    const { data: created, error } = await supabase
      .from("reports")
      .insert({ ...reportPayload, report_token: token })
      .select("id")
      .single();
    if (error || !created) return { ok: false, error: "تعذر إنشاء التقرير: " + error?.message };
    reportId = created.id;
  }

  const inserts: PromiseLike<{ error: { message: string } | null }>[] = [];

  if (data.metrics.length) {
    inserts.push(
      supabase.from("report_metrics").insert(
        data.metrics.map((m, i) => ({ ...m, report_id: reportId, display_order: i }))
      )
    );
  }
  if (data.distribution.length) {
    inserts.push(
      supabase.from("support_distribution").insert(
        data.distribution.map((d, i) => ({ ...d, report_id: reportId, display_order: i }))
      )
    );
  }
  if (data.achievements.length) {
    inserts.push(
      supabase.from("report_achievements").insert(
        data.achievements.map((a, i) => ({ ...a, report_id: reportId, display_order: i }))
      )
    );
  }
  if (data.journey.length) {
    inserts.push(
      supabase.from("report_journey").insert(
        data.journey.map((j, i) => ({ ...j, report_id: reportId, display_order: i }))
      )
    );
  }
  if (data.story.quote_text) {
    inserts.push(
      supabase.from("report_stories").insert({
        report_id: reportId,
        quote_text: data.story.quote_text,
        context_note: data.story.context_note || "اقتباس تعبيري يحفظ خصوصية المستفيد",
        display_order: 0,
      })
    );
  }

  const results = await Promise.all(inserts);
  const failed = results.find((r) => r.error);
  if (failed?.error) return { ok: false, error: failed.error.message };

  revalidatePath("/admin/reports");
  revalidatePath("/admin");

  return { ok: true, token };
}

export async function deleteReport(id: string) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("reports").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/reports");
  revalidatePath("/admin");
}
