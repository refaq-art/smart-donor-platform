import type { WizardState } from "@/lib/wizard-types";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "./WizardShell";

export function StepStories({
  state,
  setState,
}: {
  state: WizardState;
  setState: (updater: (s: WizardState) => WizardState) => void;
}) {
  return (
    <div className="space-y-6">
      <Field label="مقدمة تعريفية (تظهر في محطة «من أنا؟»)">
        <Textarea
          value={state.intro_note}
          onChange={(e) => setState((s) => ({ ...s, intro_note: e.target.value }))}
          placeholder="دعمكم لم يكن مجرد مبلغ، بل ساعدني على الاستقرار والاستمرار والحصول على فرص أفضل."
        />
      </Field>

      <Field label="اقتباس «لحظة صنعت فرقًا»">
        <Textarea
          value={state.story.quote_text}
          onChange={(e) => setState((s) => ({ ...s, story: { ...s.story, quote_text: e.target.value } }))}
          placeholder="أصبحت أحب الذهاب إلى المدرسة أكثر…"
        />
      </Field>
      <Field label="ملاحظة توضيحية أسفل الاقتباس">
        <Input
          value={state.story.context_note}
          onChange={(e) => setState((s) => ({ ...s, story: { ...s.story, context_note: e.target.value } }))}
        />
      </Field>

      <Field label="رسالة الشكر">
        <Textarea
          value={state.thank_you_message}
          onChange={(e) => setState((s) => ({ ...s, thank_you_message: e.target.value }))}
          placeholder="شكرًا لأنك كنت جزءًا من هذه الرحلة…"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="رابط استمرار الكفالة">
          <Input
            dir="ltr"
            value={state.renewal_url}
            onChange={(e) => setState((s) => ({ ...s, renewal_url: e.target.value }))}
            placeholder="https://..."
          />
        </Field>
        <Field label="رابط فرصة إضافية">
          <Input
            dir="ltr"
            value={state.additional_opportunity_url}
            onChange={(e) => setState((s) => ({ ...s, additional_opportunity_url: e.target.value }))}
            placeholder="https://..."
          />
        </Field>
      </div>
    </div>
  );
}
