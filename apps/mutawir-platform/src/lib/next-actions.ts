import { prisma } from "@/lib/prisma";
import { computeCompletionPercent } from "@/lib/assessment-data";
import { ASSESSMENT_STATUS_LABELS } from "@/lib/constants";

export type NextAction = { title: string; href: string; urgency: "high" | "medium" | "low" };

export async function getOrgNextActions(organizationId: string): Promise<NextAction[]> {
  const actions: NextAction[] = [];
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: organizationId } });

  const preCycle = await prisma.assessmentCycle.findUnique({ where: { organizationId_phase: { organizationId, phase: "PRE" } } });

  if (!preCycle || preCycle.status === "DRAFT") {
    const pct = preCycle ? await computeCompletionPercent(preCycle.id) : 0;
    actions.push({ title: `أكمل الاستبيان القبلي (${pct}% مكتمل)`, href: "/org/assessment/pre", urgency: "high" });
  } else if (preCycle.status === "NEEDS_MORE_INFO") {
    actions.push({ title: "المستشار طلب معلومات/شواهد إضافية على التقييم القبلي", href: "/org/assessment/pre", urgency: "high" });
  } else if (preCycle.status === "SUBMITTED" || preCycle.status === "AI_ANALYSIS") {
    actions.push({ title: "التقييم القبلي قيد تحليل الذكاء الاصطناعي", href: "/org/assessment/pre", urgency: "low" });
  } else if (preCycle.status === "AWAITING_CONSULTANT_REVIEW") {
    actions.push({ title: "التقييم القبلي بانتظار اعتماد المستشار", href: "/org/assessment/pre", urgency: "low" });
  }

  if (preCycle?.status === "APPROVED") {
    const plan = await prisma.developmentPlan.findFirst({ where: { organizationId } });
    if (!plan) {
      actions.push({ title: "بانتظار بناء المستشار لخطة التطوير (100 يوم)", href: "/org/plan", urgency: "low" });
    } else {
      const revisionTasks = await prisma.task.count({ where: { developmentPlanId: plan.id, status: "NEEDS_REVISION" } });
      if (revisionTasks > 0) actions.push({ title: `${revisionTasks} مهمة تحتاج تعديلًا حسب ملاحظات المستشار`, href: "/org/plan", urgency: "high" });

      const lateTasks = await prisma.task.count({ where: { developmentPlanId: plan.id, status: "LATE" } });
      if (lateTasks > 0) actions.push({ title: `${lateTasks} مهمة متأخرة — يرجى تحديد سبب التأخير`, href: "/org/plan", urgency: "high" });

      const dueSoon = await prisma.task.count({
        where: {
          developmentPlanId: plan.id,
          status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
          dueDate: { lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
        },
      });
      if (dueSoon > 0) actions.push({ title: `${dueSoon} مهمة تستحق خلال 3 أيام`, href: "/org/plan", urgency: "medium" });
    }

    if (org.programStartDate) {
      const elapsedDays = Math.floor((Date.now() - org.programStartDate.getTime()) / (1000 * 60 * 60 * 24));
      const postCycle = await prisma.assessmentCycle.findUnique({ where: { organizationId_phase: { organizationId, phase: "POST" } } });
      if (elapsedDays >= 90 && (!postCycle || postCycle.status === "DRAFT")) {
        actions.push({ title: "اقترب موعد القياس البعدي — ابدأ التعبئة الآن", href: "/org/assessment/post", urgency: "medium" });
      }
    }
  }

  return actions.slice(0, 5);
}

export { ASSESSMENT_STATUS_LABELS };
