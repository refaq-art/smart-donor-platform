import type { ChildCharacter, ChildCharacterStage } from "@/lib/types";
import type { WizardState } from "@/lib/wizard-types";
import { Input, Select } from "@/components/ui/input";
import { Field } from "./WizardShell";

export function StepPeriod({
  state,
  setState,
  characters,
}: {
  state: WizardState;
  setState: (updater: (s: WizardState) => WizardState) => void;
  characters: (ChildCharacter & { stages: ChildCharacterStage[] })[];
}) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-3 text-sm font-bold text-forest-500">بيانات التقرير والفترة</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="عنوان التقرير">
              <Input
                value={state.title}
                onChange={(e) => setState((s) => ({ ...s, title: e.target.value }))}
              />
            </Field>
          </div>
          <Field label="بداية الفترة">
            <Input
              type="date"
              value={state.period_start}
              onChange={(e) => setState((s) => ({ ...s, period_start: e.target.value }))}
            />
          </Field>
          <Field label="نهاية الفترة">
            <Input
              type="date"
              value={state.period_end}
              onChange={(e) => setState((s) => ({ ...s, period_end: e.target.value }))}
            />
          </Field>
          <Field label="إجمالي الدعم (ريال)">
            <Input
              type="number"
              min={0}
              value={state.total_support}
              onChange={(e) =>
                setState((s) => ({ ...s, total_support: Number(e.target.value) || 0 }))
              }
            />
          </Field>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-forest-500">بيانات الطفل التمثيلي</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="الشخصية التمثيلية">
            <Select
              value={state.child_character_id}
              onChange={(e) => {
                const char = characters.find((c) => c.id === e.target.value);
                setState((s) => ({
                  ...s,
                  child_character_id: e.target.value,
                  child_gender: char?.gender ?? s.child_gender,
                }));
              }}
            >
              <option value="">اختر شخصية…</option>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.gender === "male" ? "طفل" : "طفلة"})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="الاسم المستعار">
            <Input
              value={state.child_alias_name}
              onChange={(e) => setState((s) => ({ ...s, child_alias_name: e.target.value }))}
            />
          </Field>
          <Field label="العمر">
            <Input
              type="number"
              min={1}
              max={25}
              value={state.child_age}
              onChange={(e) => setState((s) => ({ ...s, child_age: Number(e.target.value) || 0 }))}
            />
          </Field>
          <Field label="المرحلة الدراسية">
            <Input
              value={state.child_education_level}
              onChange={(e) => setState((s) => ({ ...s, child_education_level: e.target.value }))}
            />
          </Field>
          <Field label="المدينة / المنطقة (اختياري)">
            <Input
              value={state.child_city}
              onChange={(e) => setState((s) => ({ ...s, child_city: e.target.value }))}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}
