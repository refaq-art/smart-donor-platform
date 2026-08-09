import { saveAnswerAction, uploadEvidenceAction, deleteEvidenceAction } from "@/app/actions/assessment-actions";
import { EvidenceUploadForm } from "@/components/evidence-upload-form";

type Level = { levelNumber: number; label: string; description: string };
type Evidence = { id: string; fileName: string; fileUrl: string | null; linkUrl: string | null };

export function IndicatorCard({
  cycleId,
  indicator,
  answerText,
  evidence,
  editable,
}: {
  cycleId: string;
  indicator: { id: string; name: string; type: string; levels: Level[]; requiredEvidenceHint: string | null };
  answerText: string;
  evidence: Evidence[];
  editable: boolean;
}) {
  const sortedLevels = [...indicator.levels].sort((a, b) => a.levelNumber - b.levelNumber);
  const isMaturity = indicator.type === "MATURITY_LEVEL";

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="font-semibold text-slate-800">{indicator.name}</h4>
        <span className="badge bg-slate-100 text-slate-600">{isMaturity ? "مؤشر نوعي" : "بند إجرائي"}</span>
      </div>

      {isMaturity ? (
        <div className="mb-3 grid grid-cols-1 gap-2 text-xs text-slate-500 md:grid-cols-3">
          {sortedLevels.map((l) => (
            <div key={l.levelNumber} className="rounded-lg bg-slate-50 p-2">
              <div className="mb-1 font-semibold text-slate-600">{l.label}</div>
              {l.description}
            </div>
          ))}
        </div>
      ) : (
        indicator.requiredEvidenceHint && (
          <p className="mb-3 text-xs text-slate-500">
            الشاهد المطلوب: <span className="font-medium text-slate-700">{indicator.requiredEvidenceHint}</span>
          </p>
        )
      )}

      <form action={saveAnswerAction} className="mb-3">
        <input type="hidden" name="cycleId" value={cycleId} />
        <input type="hidden" name="indicatorId" value={indicator.id} />
        <textarea
          name="answerText"
          defaultValue={answerText}
          disabled={!editable}
          rows={2}
          placeholder="اكتب التوضيح / الوضع الحالي..."
          className="input"
        />
        {editable && (
          <button type="submit" className="btn-ghost mt-1 text-xs">
            حفظ كمسودة
          </button>
        )}
      </form>

      <div className="space-y-2">
        {evidence.map((e) => (
          <div key={e.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-xs">
            <a href={e.fileUrl ?? e.linkUrl ?? "#"} target="_blank" className="text-navy-700 underline">
              {e.fileName}
            </a>
            {editable && (
              <form action={deleteEvidenceAction.bind(null, e.id)}>
                <button type="submit" className="text-red-500 hover:underline">
                  حذف
                </button>
              </form>
            )}
          </div>
        ))}
      </div>

      {editable && (
        <div className="mt-2">
          <EvidenceUploadForm
            action={uploadEvidenceAction}
            hiddenFields={{ cycleId, indicatorId: indicator.id }}
          />
        </div>
      )}
    </div>
  );
}
