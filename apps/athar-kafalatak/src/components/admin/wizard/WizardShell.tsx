import { cn } from "@/lib/utils";

export const WIZARD_STEPS = [
  "الكافل",
  "الفترة والطفل",
  "أرقام الأثر",
  "رحلة الطفل",
  "قصص الأثر",
  "معاينة",
  "نشر التقرير",
];

export function WizardHeader({ step }: { step: number }) {
  return (
    <div className="mb-8">
      <h1 className="mb-4 text-2xl font-extrabold text-forest-900">إنشاء تقرير أثر جديد</h1>
      <ol className="flex flex-wrap gap-2">
        {WIZARD_STEPS.map((label, i) => (
          <li
            key={label}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold",
              i === step
                ? "border-forest bg-forest text-white"
                : i < step
                ? "border-forest-200 bg-forest-50 text-forest-600"
                : "border-forest-100 bg-white text-forest-300"
            )}
          >
            <span
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded-full text-[10px]",
                i <= step ? "bg-white/30" : "bg-forest-100"
              )}
            >
              {i + 1}
            </span>
            {label}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-forest-700">{label}</label>
      {children}
    </div>
  );
}

export function WizardNav({
  step,
  onBack,
  onNext,
  nextLabel = "التالي",
  nextDisabled,
}: {
  step: number;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="mt-10 flex items-center justify-between border-t border-forest-100 pt-6">
      <button
        type="button"
        onClick={onBack}
        disabled={step === 0}
        className="rounded-xl2 border border-forest-200 bg-white px-5 py-2.5 text-sm font-bold text-forest-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        السابق
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="rounded-xl2 bg-forest px-6 py-2.5 text-sm font-bold text-white shadow-soft hover:bg-forest-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {nextLabel}
      </button>
    </div>
  );
}
