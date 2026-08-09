export type AIActionType =
  | "draft_executive_summary"
  | "improve_problem_statement"
  | "suggest_objectives"
  | "suggest_activities"
  | "suggest_outputs_outcomes"
  | "suggest_kpis"
  | "check_consistency"
  | "rewrite_formal"
  | "simplify_text"
  | "summarize_opportunity"
  | "compare_project_opportunity"
  | "missing_data_checklist"
  | "readiness_assessment"
  | "clarifying_questions"
  | "extract_donor_lead"
  | "explain_eligibility"
  | "custom";

export type AIRequest = {
  action: AIActionType;
  context: Record<string, string | undefined>;
};

export type AIResult = {
  text: string;
  provider: "mock" | "openai";
  warning?: string;
};

export interface AIProvider {
  name: "mock" | "openai";
  run(req: AIRequest): Promise<AIResult>;
}
