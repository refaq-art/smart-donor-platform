import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFrameworkTree } from "@/lib/assessment-data";
import { ASSESSMENT_STATUS_LABELS, type AssessmentStatusValue } from "@/lib/constants";
import { decideIndicatorAction, requestMoreInfoAction, approveAssessmentAction } from "@/app/actions/consultant-actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

export default async function ConsultantAssessmentReviewPage({ params }: { params: Promise<{ cycleId: string }> }) {
  const { cycleId } = await params;
  if (!cycleId) notFound();
  const user = await requireUser(["CONSULTANT"]);

  const cycle = await prisma.assessmentCycle.findUnique({ where: { id: cycleId }, include: { organization: { include: { consultant: true } } } });
  if (!cycle || cycle.organization.consultant?.userId !== user.id) notFound();

  if (cycle.status === "DRAFT" || cycle.status === "SUBMITTED" || cycle.status === "AI_ANALYSIS") {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card text-center text-slate-500">
          الحالة الحالية: {ASSESSMENT_STATUS_LABELS[cycle.status as AssessmentStatusValue]} — لم يكتمل تحليل الذكاء الاصطناعي بعد.
        </div>
      </div>
    );
  }

  const domains = await getFrameworkTree();
  const responses = await prisma.assessmentResponse.findMany({ where: { assessmentCycleId: cycleId } });
  const responseMap = new Map(responses.map((r) => [r.indicatorId, r.answerText]));
  const evidenceRows = await prisma.assessmentEvidence.findMany({ where: { assessmentCycleId: cycleId } });
  const evidenceByIndicator = new Map<string, typeof evidenceRows>();
  for (const e of evidenceRows) evidenceByIndicator.set(e.indicatorId, [...(evidenceByIndicator.get(e.indicatorId) ?? []), e]);

  const aiAssessments = await prisma.aIAssessment.findMany({ where: { assessmentCycleId: cycleId }, orderBy: { createdAt: "desc" } });
  const aiByIndicator = new Map(aiAssessments.map((a) => [a.indicatorId, a]));
  const decisions = await prisma.consultantAssessment.findMany({ where: { assessmentCycleId: cycleId } });
  const decisionByIndicator = new Map(decisions.map((d) => [d.indicatorId, d]));

  const editable = cycle.status === "AWAITING_CONSULTANT_REVIEW";
  const totalIndicators = domains.flatMap((d) => d.criteria).flatMap((c) => c.indicators).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-24">
      <div className="card sticky top-2 z-10 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-navy-900">
            مراجعة {cycle.phase === "PRE" ? "التقييم القبلي" : "التقييم البعدي"} — {cycle.organization.name}
          </h1>
          <p className="text-sm text-slate-500">
            الحالة: {ASSESSMENT_STATUS_LABELS[cycle.status as AssessmentStatusValue]} · القرارات: {decisions.length}/{totalIndicators}
            {cycle.overallScore && ` · النتيجة المعتمدة: ${cycle.overallScore.toFixed(2)}/5`}
          </p>
        </div>
        {editable && (
          <div className="flex gap-2">
            <form action={requestMoreInfoAction.bind(null, cycleId)}>
              <button type="submit" className="btn-secondary">طلب معلومات إضافية</button>
            </form>
            <ConfirmSubmitButton
              action={approveAssessmentAction.bind(null, cycleId)}
              confirmMessage="سيتم اعتماد النتيجة النهائية رسميًا. هل تريد المتابعة؟"
            >
              اعتماد التقييم رسميًا
            </ConfirmSubmitButton>
          </div>
        )}
      </div>

      {domains.map((domain) => (
        <section key={domain.id} className="card">
          <h2 className="mb-3 text-lg font-bold text-navy-900">{domain.name}</h2>
          <div className="space-y-4">
            {domain.criteria.flatMap((c) => c.indicators).map((indicator) => {
              const ai = aiByIndicator.get(indicator.id);
              const decision = decisionByIndicator.get(indicator.id);
              const evidence = evidenceByIndicator.get(indicator.id) ?? [];
              const evidenceUsed: string[] = ai ? JSON.parse(ai.evidenceUsed || "[]") : [];
              const missingEvidence: string[] = ai ? JSON.parse(ai.missingEvidence || "[]") : [];

              return (
                <div key={indicator.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-semibold text-slate-800">{indicator.name}</h4>
                    {decision && <span className="badge bg-emerald-100 text-emerald-700">تم اتخاذ قرار</span>}
                  </div>

                  <div className="mb-2 text-sm text-slate-600">
                    <span className="font-medium">إجابة الجمعية: </span>
                    {responseMap.get(indicator.id) || <span className="text-slate-400">لا يوجد</span>}
                  </div>

                  {evidence.length > 0 && (
                    <div className="mb-2 text-xs text-slate-500">
                      الشواهد المرفوعة:{" "}
                      {evidence.map((e) => (
                        <a key={e.id} href={e.fileUrl ?? e.linkUrl ?? "#"} target="_blank" className="mr-2 text-navy-600 underline">
                          {e.fileName}
                        </a>
                      ))}
                    </div>
                  )}

                  {ai && (
                    <div className={`mb-3 rounded-lg p-3 text-xs ${ai.insufficientInfo ? "bg-amber-50" : "bg-slate-50"}`}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-bold text-navy-800">تقييم الذكاء الاصطناعي</span>
                        <span className="text-slate-500">الثقة: {Math.round(ai.confidence * 100)}%</span>
                      </div>
                      {ai.insufficientInfo ? (
                        <div className="font-medium text-amber-700">Needs Evidence — لا توجد أدلة كافية للحكم</div>
                      ) : (
                        <>
                          <div>
                            الدرجة المقترحة: <span className="font-bold">{ai.proposedScore?.toFixed(2)}</span> ({ai.proposedLevel})
                          </div>
                          <div className="mt-1">سبب التقييم: {ai.rationale}</div>
                          {evidenceUsed.length > 0 && <div className="mt-1">الأدلة المستندة: {evidenceUsed.join("، ")}</div>}
                          {missingEvidence.length > 0 && <div className="mt-1 text-red-600">الشاهد المفقود: {missingEvidence.join("، ")}</div>}
                          {ai.strengths && <div className="mt-1">نقاط القوة: {ai.strengths}</div>}
                          {ai.weaknesses && <div className="mt-1">نقاط الضعف: {ai.weaknesses}</div>}
                          {ai.gap && <div className="mt-1">الفجوة: {ai.gap}</div>}
                        </>
                      )}
                    </div>
                  )}

                  {editable ? (
                    <form action={decideIndicatorAction} className="grid grid-cols-1 gap-2 md:grid-cols-4">
                      <input type="hidden" name="cycleId" value={cycleId} />
                      <input type="hidden" name="indicatorId" value={indicator.id} />
                      <select name="decision" defaultValue={ai?.insufficientInfo ? "MODIFIED" : "APPROVED_AI"} className="input">
                        <option value="APPROVED_AI">اعتماد تقييم AI</option>
                        <option value="MODIFIED">تعديل الدرجة</option>
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        min={1}
                        max={5}
                        name="finalScore"
                        defaultValue={decision?.finalScore ?? ai?.proposedScore ?? ""}
                        placeholder="الدرجة النهائية"
                        className="input"
                        required
                      />
                      <input type="text" name="changeReason" placeholder="سبب التعديل (إن وجد)" className="input md:col-span-2" defaultValue={decision?.changeReason ?? ""} />
                      <input type="text" name="gapNote" placeholder="ملاحظة/فجوة" className="input md:col-span-3" defaultValue={decision?.gapNote ?? ""} />
                      <button type="submit" className="btn-secondary">حفظ القرار</button>
                    </form>
                  ) : decision ? (
                    <div className="text-xs text-slate-500">
                      القرار النهائي: {decision.finalScore.toFixed(2)} ({decision.finalLevel}) {decision.changeReason && `— ${decision.changeReason}`}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
