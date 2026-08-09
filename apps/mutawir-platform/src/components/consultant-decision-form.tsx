"use client";

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
  return (
    <form action={action} className="grid grid-cols-1 gap-2 md:grid-cols-4">
      <input type="hidden" name="cycleId" value={cycleId} />
      <input type="hidden" name="indicatorId" value={indicatorId} />
      <select name="decision" defaultValue={defaultDecision} className="input">
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
        placeholder="سبب التعديل (اختياري)"
        className="input md:col-span-2"
        defaultValue={defaultChangeReason}
      />
      <input type="text" name="gapNote" placeholder="ملاحظة/فجوة" className="input md:col-span-3" defaultValue={defaultGapNote} />
      <button type="submit" className="btn-secondary">
        حفظ القرار
      </button>
    </form>
  );
}
