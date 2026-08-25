import type { CharacterStage } from "@/lib/types";
import type { WizardState } from "@/lib/wizard-types";
import { Select } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import { Field } from "./WizardShell";

const STAGE_OPTIONS: { value: CharacterStage; label: string }[] = [
  { value: "intro", label: "الترحيب" },
  { value: "education", label: "التعليم" },
  { value: "basic_needs", label: "الاحتياجات الأساسية" },
  { value: "development", label: "التنمية والمشاركة" },
  { value: "success", label: "الثقة والنجاح" },
  { value: "thank_you", label: "الشكر" },
];

const LABELS: Record<string, string> = { before: "البداية", during: "خلال الفترة", now: "الآن" };

export function StepJourney({
  state,
  setState,
}: {
  state: WizardState;
  setState: (updater: (s: WizardState) => WizardState) => void;
}) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-forest-500">
        رحلة الطفل الظاهرة في المحطة الرابعة من الجولة التفاعلية — ثلاث مراحل ثابتة.
      </p>
      {state.journey.map((j, i) => (
        <div key={j.stage_key} className="rounded-xl2 border border-forest-100 p-5">
          <h3 className="mb-3 text-sm font-bold text-forest-700">{LABELS[j.stage_key]}</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="العنوان">
              <input
                className="flex h-11 w-full rounded-xl2 border border-forest-200 bg-white px-4 py-2 text-sm"
                value={j.title}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    journey: s.journey.map((x, xi) => (xi === i ? { ...x, title: e.target.value } : x)),
                  }))
                }
              />
            </Field>
            <Field label="حالة الشخصية">
              <Select
                value={j.character_stage}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    journey: s.journey.map((x, xi) =>
                      xi === i ? { ...x, character_stage: e.target.value as CharacterStage } : x
                    ),
                  }))
                }
              >
                {STAGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="col-span-2">
              <Field label="الوصف">
                <Textarea
                  value={j.description}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      journey: s.journey.map((x, xi) =>
                        xi === i ? { ...x, description: e.target.value } : x
                      ),
                    }))
                  }
                />
              </Field>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
