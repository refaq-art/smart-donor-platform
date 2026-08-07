import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TASK_PRIORITY_LABELS, type TaskPriorityValue } from "@/lib/constants";
import { updateGapAction, generateGapSuggestionAction, respondToRecommendationAction } from "@/app/actions/plan-actions";
import type { TaskSuggestionPayload } from "@/lib/ai/recommendations";

export default async function GapAnalysisPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const user = await requireUser(["CONSULTANT"]);
  const org = await prisma.organization.findFirst({ where: { id: orgId, consultantId: user.consultant!.id } });
  if (!org) notFound();

  const gaps = await prisma.developmentGap.findMany({
    where: { organizationId: orgId },
    include: { indicator: { include: { criterion: { include: { domain: true } } } } },
    orderBy: [{ priority: "desc" }],
  });

  const recommendations = await prisma.aIRecommendation.findMany({ where: { organizationId: orgId, status: "PENDING" } });
  const recByGap = new Map(recommendations.map((r) => [r.developmentGapId, r]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">تحليل الفجوات — {org.name}</h1>
        <p className="text-sm text-slate-500">تُبنى هذه القائمة تلقائيًا من المؤشرات الأقل من المستوى الأعلى بعد اعتماد التقييم القبلي.</p>
      </div>

      {gaps.length === 0 && <div className="card text-center text-slate-500">لا توجد فجوات — يجب اعتماد التقييم القبلي أولًا.</div>}

      <div className="space-y-4">
        {gaps.map((gap) => {
          const rec = recByGap.get(gap.id);
          const payload = rec ? (JSON.parse(rec.payload) as TaskSuggestionPayload) : null;
          return (
            <div key={gap.id} className="card">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs text-slate-400">
                    {gap.indicator.criterion.domain.name} · {gap.indicator.criterion.name}
                  </div>
                  <h3 className="font-bold text-slate-800">{gap.indicator.name}</h3>
                </div>
                <span className="badge bg-amber-100 text-amber-800">{TASK_PRIORITY_LABELS[gap.priority as TaskPriorityValue]}</span>
              </div>
              <div className="mb-3 grid grid-cols-1 gap-2 text-sm text-slate-600 md:grid-cols-3">
                <div>الدرجة المعتمدة: <span className="font-medium">{gap.approvedScore.toFixed(2)}</span></div>
                <div>المستوى الحالي: <span className="font-medium">{gap.currentLevel}</span></div>
                <div>المستوى المستهدف: <span className="font-medium">{gap.targetLevel}</span></div>
              </div>
              <p className="mb-3 text-sm text-slate-500">{gap.gapDescription}</p>

              <form action={updateGapAction} className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-4">
                <input type="hidden" name="gapId" value={gap.id} />
                <input type="text" name="developmentNeed" placeholder="الاحتياج التطويري" defaultValue={gap.developmentNeed} className="input md:col-span-2" />
                <select name="priority" defaultValue={gap.priority} className="input">
                  <option value="LOW">منخفضة</option>
                  <option value="MEDIUM">متوسطة</option>
                  <option value="HIGH">عالية</option>
                  <option value="CRITICAL">حرجة</option>
                </select>
                <button type="submit" className="btn-secondary">حفظ</button>
                <input type="text" name="notes" placeholder="ملاحظات" defaultValue={gap.notes ?? ""} className="input md:col-span-4" />
              </form>

              {payload ? (
                <div className="rounded-lg bg-navy-50 p-3 text-sm">
                  <div className="mb-1 font-bold text-navy-800">اقتراح المساعد الذكي: {payload.taskTitle}</div>
                  <p className="mb-1 text-slate-600">{payload.description}</p>
                  <p className="text-xs text-slate-500">المدة المقترحة: {payload.durationDays} يوم · الشاهد المطلوب: {payload.requiredEvidence}</p>
                  <form action={respondToRecommendationAction} className="mt-2 flex flex-wrap gap-2">
                    <input type="hidden" name="recommendationId" value={rec!.id} />
                    <button name="respondAction" value="ACCEPT" className="btn-primary py-1 text-xs">اعتماد الاقتراح</button>
                    <button name="respondAction" value="DISMISS" className="btn-secondary py-1 text-xs">تجاهل الاقتراح</button>
                  </form>
                </div>
              ) : (
                <form action={generateGapSuggestionAction.bind(null, gap.id)}>
                  <button type="submit" className="btn-ghost text-xs">✨ اقتراح مهمة تطويرية بالذكاء الاصطناعي</button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
