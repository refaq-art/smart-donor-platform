"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  requireOwnedApplication,
  requireOwnedProject,
  requirePermission,
  audit,
  AuthzError,
} from "@/lib/authz";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { APPLICATION_STATUSES } from "@/lib/constants";
import { snapshotIfChanged } from "@/lib/application-version-snapshot";

const newAppSchema = z.object({
  title: z.string().min(3, "عنوان الطلب مطلوب"),
  projectId: z.string().min(1, "الرجاء اختيار المشروع"),
  opportunityId: z.string().optional(),
});

export type ApplicationFormState = { error?: string } | null;

export async function createApplicationAction(
  _prev: ApplicationFormState,
  formData: FormData
): Promise<ApplicationFormState> {
  let session;
  try {
    session = await requirePermission("editRecords");
  } catch (e) {
    return { error: e instanceof AuthzError ? e.message : "غير مصرَّح" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = newAppSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "بيانات غير صحيحة" };

  // التأكد أن المشروع يخص جمعية المستخدم قبل ربط الطلب به
  try {
    await requireOwnedProject(parsed.data.projectId);
  } catch {
    return { error: "المشروع المحدد غير موجود أو خارج نطاق جمعيتك" };
  }

  const app = await prisma.grantApplication.create({
    data: {
      title: parsed.data.title,
      projectId: parsed.data.projectId,
      opportunityId: parsed.data.opportunityId || null,
      status: "مسودة",
      createdById: session.userId,
      organizationId: session.organizationId,
    },
  });

  await prisma.applicationStatusHistory.create({
    data: { applicationId: app.id, toStatus: "مسودة", changedById: session.userId, note: "تم إنشاء الطلب" },
  });

  await audit(session, "create", "GrantApplication", app.id);

  redirect(`/applications/${app.id}`);
}

const contentSchema = z.object({
  title: z.string().min(3),
  executiveSummary: z.string().optional(),
  orgIntroduction: z.string().optional(),
  problemStatement: z.string().optional(),
  justification: z.string().optional(),
  objectives: z.string().optional(),
  beneficiaries: z.string().optional(),
  implementationPlan: z.string().optional(),
  activities: z.string().optional(),
  outputs: z.string().optional(),
  outcomes: z.string().optional(),
  kpis: z.string().optional(),
  riskManagement: z.string().optional(),
  sustainability: z.string().optional(),
  timeline: z.string().optional(),
  budget: z.string().optional(),
  donorRequirements: z.string().optional(),
  opportunityId: z.string().optional(),
  assignedToId: z.string().optional(),
});

export type ApplicationContentState = { error?: string; savedAt?: number } | null;

export async function updateApplicationContentAction(
  id: string,
  _prev: ApplicationContentState,
  formData: FormData
): Promise<ApplicationContentState> {
  let session, current;
  try {
    await requirePermission("editRecords");
    ({ application: current, session } = await requireOwnedApplication(id));
  } catch (e) {
    return { error: e instanceof AuthzError ? e.message : "غير مصرَّح" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = contentSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "بيانات غير صحيحة" };

  // احفظ لقطة من المحتوى قبل الكتابة فوقه، لبناء سجل إصدارات قابل للمقارنة والاستعادة
  await snapshotIfChanged(id, current, session.userId);

  const d = parsed.data;
  await prisma.grantApplication.update({
    where: { id },
    data: {
      title: d.title,
      executiveSummary: d.executiveSummary || null,
      orgIntroduction: d.orgIntroduction || null,
      problemStatement: d.problemStatement || null,
      justification: d.justification || null,
      objectives: d.objectives || null,
      beneficiaries: d.beneficiaries || null,
      implementationPlan: d.implementationPlan || null,
      activities: d.activities || null,
      outputs: d.outputs || null,
      outcomes: d.outcomes || null,
      kpis: d.kpis || null,
      riskManagement: d.riskManagement || null,
      sustainability: d.sustainability || null,
      timeline: d.timeline || null,
      budget: d.budget || null,
      donorRequirements: d.donorRequirements || null,
      opportunityId: d.opportunityId || null,
      assignedToId: d.assignedToId || null,
    },
  });

  await audit(session, "update", "GrantApplication", id);

  revalidatePath(`/applications/${id}`);
  return { savedAt: Date.now() };
}

const statusSchema = z.object({
  toStatus: z.enum(APPLICATION_STATUSES),
  note: z.string().optional(),
  nextStep: z.string().optional(),
});

export type StatusChangeState = { error?: string; savedAt?: number } | null;

export async function changeApplicationStatusAction(
  id: string,
  _prev: StatusChangeState,
  formData: FormData
): Promise<StatusChangeState> {
  let session, current;
  try {
    await requirePermission("changeStatus");
    ({ application: current, session } = await requireOwnedApplication(id));
  } catch (e) {
    return { error: e instanceof AuthzError ? e.message : "غير مصرَّح" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = statusSchema.safeParse(raw);
  if (!parsed.success) return { error: "الرجاء اختيار حالة صحيحة" };

  // فصل المهام: الحالات النهائية تتطلب صلاحية اعتماد، ولا يعتمد المستخدم طلبًا أنشأه بنفسه
  const FINAL_STATUSES = ["جاهز للإرسال", "تم الإرسال", "مقبول", "مرفوض"];
  if (FINAL_STATUSES.includes(parsed.data.toStatus)) {
    const { roleHasPermission } = await import("@/lib/authz-matrix");
    if (!roleHasPermission(session.role, "finalApproval")) {
      return { error: "الاعتماد النهائي يتطلب صلاحية مدير الجمعية أو مدير النظام" };
    }
    if (current.createdById === session.userId && process.env.ENFORCE_SEGREGATION !== "off") {
      return {
        error:
          "لا يمكنك اعتماد طلب أنشأته بنفسك (مبدأ فصل المهام). الرجاء طلب الاعتماد من مستخدم آخر.",
      };
    }
  }

  await prisma.$transaction([
    prisma.grantApplication.update({ where: { id }, data: { status: parsed.data.toStatus } }),
    prisma.applicationStatusHistory.create({
      data: {
        applicationId: id,
        fromStatus: current.status,
        toStatus: parsed.data.toStatus,
        note: parsed.data.note || null,
        nextStep: parsed.data.nextStep || null,
        changedById: session.userId,
      },
    }),
  ]);

  await audit(session, "status_change", "GrantApplication", id, `${current.status} -> ${parsed.data.toStatus}`);

  revalidatePath(`/applications/${id}`);
  return { savedAt: Date.now() };
}

export async function deleteApplicationAction(id: string) {
  await requirePermission("deleteRecords");
  const { session } = await requireOwnedApplication(id);

  await prisma.grantApplication.delete({ where: { id } });
  await audit(session, "delete", "GrantApplication", id);
  revalidatePath("/applications");
  redirect("/applications");
}
