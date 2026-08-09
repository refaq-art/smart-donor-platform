"use client";

import { useState } from "react";

export function ConsultantDecisionForm({
  action,
  cycleId,
  indicatorId,
  defaultDecision,
  defaultScore,
  defaultChangeReason,
  defaultGapNote,
}: {
  action: (formData: FormData) => Promise<void>;
  cycleId: string;
  indicatorId: string;
  defaultDecision: "APPROVED_AI" | "MODIFIED";
  defaultScore: number | string;
  defaultChangeReason: string;
  defaultGapNote: string;
}) {
  const [decision, setDecision] = useState(defaultDecision);
  const [changeReason, setChangeReason] = useState(defaultChangeReason);
  const [error, setError] = useState<string | null>(null);
  const reasonRequired = decision === "MODIFIED";

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (reasonRequired && !changeReason.trim()) {
          e.preventDefault();
          setError("يرجى كتابة سبب التعديل عند اختيار \"تعديل الدرجة\"");
          return;
        }
        setError(null);
      }}
      className="grid grid-cols-1 gap-2 md:grid-cols-4"
    >
      <input type="hidden" name="cycleId" value={cycleId} />
      <input type="hidden" name="indicatorId" value={indicatorId} />
      <select
        name="decision"
        value={decision}
        onChange={(e) => {
          setDecision(e.currentTarget.value as "APPROVED_AI" | "MODIFIED");
          setError(null);
        }}
        className="input"
      >
        <option value="APPROVED_AI">اعتماد تقييم AI</option>
        <option value="MODIFIED">تعديل الدرجة</option>
      </select>
      <input
        type="number"
        step="0.01"
        min={1}
        max={5}
        name="finalScore"
        defaultValue={defaultScore}
        placeholder="الدرجة النهائية"
        className="input"
        required
      />
      <input
        type="text"
        name="changeReason"
        placeholder={reasonRequired ? "سبب التعديل (مطلوب)" : "سبب التعديل (إن وجد)"}
        className="input md:col-span-2"
        value={changeReason}
        onChange={(e) => {
          setChangeReason(e.currentTarget.value);
          setError(null);
        }}
      />
      <input type="text" name="gapNote" placeholder="ملاحظة/فجوة" className="input md:col-span-3" defaultValue={defaultGapNote} />
      <div className="md:col-span-1">
        <button type="submit" className="btn-secondary w-full">
          حفظ القرار
        </button>
      </div>
      {error && <p className="text-xs text-red-500 md:col-span-4">{error}</p>}
    </form>
  );
}
