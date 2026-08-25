export type ReportStatus = "draft" | "ready" | "sent" | "viewed";
export type CharacterStage =
  | "intro"
  | "education"
  | "basic_needs"
  | "development"
  | "success"
  | "thank_you";
export type Gender = "male" | "female";
export type JourneyStageKey = "before" | "during" | "now";
export type AchievementKey =
  | "basic_needs"
  | "education"
  | "development"
  | "skills"
  | "stability";

export interface Sponsor {
  id: string;
  full_name: string;
  honorific: string;
  phone: string | null;
  email: string | null;
  sponsor_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChildCharacter {
  id: string;
  name: string;
  gender: Gender;
  is_active: boolean;
}

export interface ChildCharacterStage {
  id: string;
  character_id: string;
  stage_key: CharacterStage;
  image_url: string;
  alt_text: string;
}

export interface Report {
  id: string;
  sponsor_id: string;
  report_token: string;
  title: string;
  status: ReportStatus;
  period_start: string | null;
  period_end: string | null;
  total_support: number;
  child_character_id: string | null;
  child_alias_name: string;
  child_age: number | null;
  child_education_level: string | null;
  child_city: string | null;
  child_gender: Gender;
  intro_note: string | null;
  thank_you_message: string | null;
  renewal_url: string | null;
  additional_opportunity_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportMetric {
  id: string;
  report_id: string;
  metric_key: string;
  metric_label: string;
  metric_value: number;
  metric_unit: string | null;
  display_order: number;
}

export interface SupportDistributionItem {
  id: string;
  report_id: string;
  category_key: string;
  category_label: string;
  percentage: number;
  description: string | null;
  color_hex: string | null;
  display_order: number;
}

export interface ReportJourneyItem {
  id: string;
  report_id: string;
  stage_key: JourneyStageKey;
  title: string;
  description: string;
  character_stage: CharacterStage;
  display_order: number;
}

export interface ReportStory {
  id: string;
  report_id: string;
  quote_text: string;
  context_note: string;
  display_order: number;
}

export interface ReportAchievement {
  id: string;
  report_id: string;
  achievement_key: AchievementKey;
  title: string;
  description: string;
  display_order: number;
}

export interface ReportView {
  id: string;
  report_id: string;
  session_id: string;
  started_at: string;
  last_seen_at: string;
  visit_count: number;
  completed_journey: boolean;
  last_stage_reached: number;
  user_agent: string | null;
}

export interface FullReport {
  report: Report;
  sponsor: Sponsor;
  metrics: ReportMetric[];
  distribution: SupportDistributionItem[];
  journey: ReportJourneyItem[];
  stories: ReportStory[];
  achievements: ReportAchievement[];
  characterStages: Record<CharacterStage, ChildCharacterStage | undefined>;
}
