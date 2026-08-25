import type { AchievementKey, CharacterStage, Gender, JourneyStageKey } from "@/lib/types";

export interface WizardMetric {
  metric_key: string;
  metric_label: string;
  metric_value: number;
  metric_unit: string;
}

export interface WizardDistributionItem {
  category_key: string;
  category_label: string;
  percentage: number;
  description: string;
  color_hex: string;
}

export interface WizardJourneyItem {
  stage_key: JourneyStageKey;
  title: string;
  description: string;
  character_stage: CharacterStage;
}

export interface WizardStory {
  quote_text: string;
  context_note: string;
}

export interface WizardAchievement {
  achievement_key: AchievementKey;
  title: string;
  description: string;
}

export interface WizardState {
  reportId?: string;
  sponsorMode: "existing" | "new";
  sponsorId?: string;
  newSponsor: {
    full_name: string;
    honorific: string;
    phone: string;
    email: string;
    sponsor_number: string;
  };

  title: string;
  period_start: string;
  period_end: string;
  total_support: number;

  child_character_id: string;
  child_gender: Gender;
  child_alias_name: string;
  child_age: number;
  child_education_level: string;
  child_city: string;

  metrics: WizardMetric[];
  distribution: WizardDistributionItem[];
  achievements: WizardAchievement[];
  journey: WizardJourneyItem[];

  intro_note: string;
  story: WizardStory;
  thank_you_message: string;
  renewal_url: string;
  additional_opportunity_url: string;

  status: "draft" | "ready" | "sent";
}

export const DEFAULT_METRICS: WizardMetric[] = [
  { metric_key: "sponsorship_months", metric_label: "أشهر الكفالة", metric_value: 12, metric_unit: "شهرًا" },
  { metric_key: "programs_count", metric_label: "برامج نوعية", metric_value: 3, metric_unit: "برامج" },
  { metric_key: "school_attendance", metric_label: "حضور مدرسي", metric_value: 84, metric_unit: "%" },
  { metric_key: "needs_covered", metric_label: "احتياجات أساسية مغطاة", metric_value: 2, metric_unit: "احتياجان" },
];

export const DEFAULT_DISTRIBUTION: WizardDistributionItem[] = [
  { category_key: "sponsorship", category_label: "الكفالة الأساسية", percentage: 40, description: "التزام الكفالة الشهرية الذي يضمن استمرارية الدعم الأساسي.", color_hex: "#1F4D3D" },
  { category_key: "education", category_label: "التعليم", percentage: 25, description: "ساهم في توفير الاحتياجات التعليمية ودعم الاستمرار في الدراسة.", color_hex: "#C8A24A" },
  { category_key: "food_clothing", category_label: "الغذاء والكساء", percentage: 20, description: "تغطية احتياجات الغذاء والملابس الأساسية على مدار الفترة.", color_hex: "#4E7A64" },
  { category_key: "development", category_label: "التنمية والأنشطة", percentage: 15, description: "المشاركة في برامج وأنشطة تنمّي المهارات والثقة.", color_hex: "#D9C79E" },
];

export const DEFAULT_ACHIEVEMENTS: WizardAchievement[] = [
  { achievement_key: "basic_needs", title: "الاحتياجات الأساسية", description: "تمت تغطية احتياجات مرتبطة بالكفالة." },
  { achievement_key: "education", title: "التعليم", description: "استمرار أفضل في المسار التعليمي." },
  { achievement_key: "development", title: "التنمية", description: "المشاركة في برامج تنموية." },
  { achievement_key: "skills", title: "المهارات", description: "تحسن أو اكتساب مهارات جديدة." },
  { achievement_key: "stability", title: "الاستقرار", description: "تحسن في الاستقرار الاجتماعي أو التعليمي." },
];

export const DEFAULT_JOURNEY: WizardJourneyItem[] = [
  { stage_key: "before", title: "البداية", description: "في بداية الرحلة، كنت بحاجة إلى دعم يساعدني على الاستقرار في التعليم وتوفير بعض الاحتياجات الأساسية.", character_stage: "intro" },
  { stage_key: "during", title: "خلال الفترة", description: "مع استمرار الكفالة، أصبحت أكثر انتظامًا في الدراسة، وشاركت في برامج ساعدتني على تطوير مهاراتي.", character_stage: "development" },
  { stage_key: "now", title: "الآن", description: "اليوم أشعر بثقة واستقرار أكبر، وهذا من أثر دعمكم بعد فضل الله.", character_stage: "success" },
];

export function emptyWizardState(): WizardState {
  return {
    sponsorMode: "existing",
    sponsorId: undefined,
    newSponsor: { full_name: "", honorific: "الأستاذ", phone: "", email: "", sponsor_number: "" },
    title: "تقرير أثر كفالتك",
    period_start: "",
    period_end: "",
    total_support: 0,
    child_character_id: "",
    child_gender: "male",
    child_alias_name: "",
    child_age: 9,
    child_education_level: "",
    child_city: "",
    metrics: DEFAULT_METRICS,
    distribution: DEFAULT_DISTRIBUTION,
    achievements: DEFAULT_ACHIEVEMENTS,
    journey: DEFAULT_JOURNEY,
    intro_note: "",
    story: { quote_text: "", context_note: "اقتباس تعبيري يحفظ خصوصية المستفيد" },
    thank_you_message: "",
    renewal_url: "",
    additional_opportunity_url: "",
    status: "draft",
  };
}
