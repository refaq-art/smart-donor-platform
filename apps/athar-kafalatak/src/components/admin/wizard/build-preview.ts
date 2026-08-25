import type { ChildCharacter, ChildCharacterStage, CharacterStage, FullReport, Sponsor } from "@/lib/types";
import type { WizardState } from "@/lib/wizard-types";

const STAGE_KEYS: CharacterStage[] = [
  "intro",
  "education",
  "basic_needs",
  "development",
  "success",
  "thank_you",
];

export function buildPreviewData(
  state: WizardState,
  sponsors: Sponsor[],
  characters: (ChildCharacter & { stages: ChildCharacterStage[] })[]
): FullReport {
  const sponsor: Sponsor =
    state.sponsorMode === "existing"
      ? sponsors.find((s) => s.id === state.sponsorId) ?? {
          id: "preview",
          full_name: "—",
          honorific: "الأستاذ",
          phone: null,
          email: null,
          sponsor_number: null,
          notes: null,
          created_at: "",
          updated_at: "",
        }
      : {
          id: "preview",
          full_name: state.newSponsor.full_name || "—",
          honorific: state.newSponsor.honorific || "الأستاذ",
          phone: state.newSponsor.phone || null,
          email: state.newSponsor.email || null,
          sponsor_number: state.newSponsor.sponsor_number || null,
          notes: null,
          created_at: "",
          updated_at: "",
        };

  const character = characters.find((c) => c.id === state.child_character_id);
  const characterStages: Record<CharacterStage, ChildCharacterStage | undefined> = Object.fromEntries(
    STAGE_KEYS.map((k) => [k, character?.stages.find((s) => s.stage_key === k)])
  ) as Record<CharacterStage, ChildCharacterStage | undefined>;

  return {
    sponsor,
    characterStages,
    report: {
      id: "preview",
      sponsor_id: sponsor.id,
      report_token: "preview",
      title: state.title,
      status: state.status,
      period_start: state.period_start || null,
      period_end: state.period_end || null,
      total_support: state.total_support,
      child_character_id: state.child_character_id || null,
      child_alias_name: state.child_alias_name,
      child_age: state.child_age,
      child_education_level: state.child_education_level || null,
      child_city: state.child_city || null,
      child_gender: state.child_gender,
      intro_note: state.intro_note || null,
      thank_you_message: state.thank_you_message || null,
      renewal_url: state.renewal_url || null,
      additional_opportunity_url: state.additional_opportunity_url || null,
      published_at: null,
      created_at: "",
      updated_at: "",
    },
    metrics: state.metrics.map((m, i) => ({ id: `m${i}`, report_id: "preview", display_order: i, ...m })),
    distribution: state.distribution.map((d, i) => ({
      id: `d${i}`,
      report_id: "preview",
      display_order: i,
      ...d,
    })),
    journey: state.journey.map((j, i) => ({ id: `j${i}`, report_id: "preview", display_order: i, ...j })),
    stories: state.story.quote_text
      ? [{ id: "s0", report_id: "preview", display_order: 0, ...state.story }]
      : [],
    achievements: state.achievements.map((a, i) => ({
      id: `a${i}`,
      report_id: "preview",
      display_order: i,
      ...a,
    })),
  };
}
