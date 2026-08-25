import type { Sponsor } from "@/lib/types";
import type { WizardState } from "@/lib/wizard-types";
import { Input, Select } from "@/components/ui/input";
import { Field } from "./WizardShell";

export function StepSponsor({
  state,
  setState,
  sponsors,
}: {
  state: WizardState;
  setState: (updater: (s: WizardState) => WizardState) => void;
  sponsors: Sponsor[];
}) {
  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setState((s) => ({ ...s, sponsorMode: "existing" }))}
          className={`flex-1 rounded-xl2 border-2 px-4 py-3 text-sm font-bold ${
            state.sponsorMode === "existing"
              ? "border-forest bg-forest-50 text-forest-800"
              : "border-forest-100 text-forest-400"
          }`}
        >
          اختيار كافل موجود
        </button>
        <button
          type="button"
          onClick={() => setState((s) => ({ ...s, sponsorMode: "new" }))}
          className={`flex-1 rounded-xl2 border-2 px-4 py-3 text-sm font-bold ${
            state.sponsorMode === "new"
              ? "border-forest bg-forest-50 text-forest-800"
              : "border-forest-100 text-forest-400"
          }`}
        >
          إضافة كافل جديد
        </button>
      </div>

      {state.sponsorMode === "existing" ? (
        <Field label="الكافل">
          <Select
            value={state.sponsorId ?? ""}
            onChange={(e) => setState((s) => ({ ...s, sponsorId: e.target.value || undefined }))}
          >
            <option value="">اختر كافلًا…</option>
            {sponsors.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.honorific} {sp.full_name} {sp.sponsor_number ? `(${sp.sponsor_number})` : ""}
              </option>
            ))}
          </Select>
        </Field>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <Field label="اللقب">
            <Input
              value={state.newSponsor.honorific}
              onChange={(e) =>
                setState((s) => ({ ...s, newSponsor: { ...s.newSponsor, honorific: e.target.value } }))
              }
            />
          </Field>
          <Field label="الاسم الكامل">
            <Input
              value={state.newSponsor.full_name}
              onChange={(e) =>
                setState((s) => ({ ...s, newSponsor: { ...s.newSponsor, full_name: e.target.value } }))
              }
            />
          </Field>
          <Field label="رقم الجوال (اختياري)">
            <Input
              dir="ltr"
              value={state.newSponsor.phone}
              onChange={(e) =>
                setState((s) => ({ ...s, newSponsor: { ...s.newSponsor, phone: e.target.value } }))
              }
            />
          </Field>
          <Field label="البريد الإلكتروني (اختياري)">
            <Input
              dir="ltr"
              value={state.newSponsor.email}
              onChange={(e) =>
                setState((s) => ({ ...s, newSponsor: { ...s.newSponsor, email: e.target.value } }))
              }
            />
          </Field>
          <Field label="رقم الكافل">
            <Input
              dir="ltr"
              value={state.newSponsor.sponsor_number}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  newSponsor: { ...s.newSponsor, sponsor_number: e.target.value },
                }))
              }
            />
          </Field>
        </div>
      )}
    </div>
  );
}
