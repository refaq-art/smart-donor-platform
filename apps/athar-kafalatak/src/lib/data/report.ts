import "server-only";
import { createAnonServerClient } from "@/lib/supabase/anon";
import type { FullReport } from "@/lib/types";

export async function getFullReportByToken(token: string): Promise<FullReport | null> {
  try {
    const supabase = createAnonServerClient();
    const { data, error } = await supabase.rpc("get_report_by_token", { p_token: token });
    if (error || !data) return null;
    return data as unknown as FullReport;
  } catch {
    // network/config issue — never crash the sponsor's page, just show "not found"
    return null;
  }
}

export async function recordReportView(input: {
  token: string;
  sessionId: string;
  userAgent: string | null;
  stageReached?: number;
  completed?: boolean;
}) {
  try {
    const supabase = createAnonServerClient();
    await supabase.rpc("record_report_view", {
      p_token: input.token,
      p_session_id: input.sessionId,
      p_user_agent: input.userAgent,
      p_stage_reached: input.stageReached ?? 0,
      p_completed: Boolean(input.completed),
    });
  } catch {
    // best-effort tracking only
  }
}
