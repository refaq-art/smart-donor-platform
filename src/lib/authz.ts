import { getSession, type SessionPayload } from "./auth";
import { prisma } from "./prisma";
import { redirect } from "next/navigation";
import { CAN, type Permission } from "./authz-matrix";

/**
 * نقطة الإنفاذ المركزية للصلاحيات وعزل بيانات الجمعيات.
 *
 * القاعدة الأساسية: كل استعلام على بيانات الجمعية يجب أن يمر عبر `orgScope()`
 * أو أن يستخدم `requireOwned*()` — بحيث يستحيل عمليًا كتابة استعلام يتجاوز
 * حدود الجمعية، حتى لو خمّن المستخدم معرّف سجل من جمعية أخرى.
 */

export class AuthzError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthzError";
  }
}

/** يعيد الجلسة أو يحوّل لصفحة الدخول (للاستخدام داخل الصفحات). */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** يعيد الجلسة أو يرمي خطأ (للاستخدام داخل Server Actions). */
export async function requireSessionOrThrow(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new AuthzError("الرجاء تسجيل الدخول");
  return session;
}

/** شرط `where` يقيّد أي استعلام على جمعية المستخدم الحالي. */
export async function orgScope(): Promise<{ organizationId: string }> {
  const session = await requireSessionOrThrow();
  return { organizationId: session.organizationId };
}

export async function requireRole(allowed: readonly string[]): Promise<SessionPayload> {
  const session = await requireSessionOrThrow();
  if (!allowed.includes(session.role)) {
    throw new AuthzError("ليست لديك صلاحية لتنفيذ هذا الإجراء");
  }
  return session;
}

// مصفوفة الصلاحيات معرّفة في authz-matrix.ts (بيانات صرفة مشتركة مع الواجهة)

export { CAN, roleHasPermission as hasPermission } from "./authz-matrix";

export async function requirePermission(permission: Permission) {
  return requireRole(CAN[permission]);
}

// ── جلب سجل مملوك للجمعية (يمنع الوصول العابر بين الجمعيات) ─────────────────

export async function requireOwnedProject(id: string) {
  const session = await requireSessionOrThrow();
  const project = await prisma.project.findFirst({
    where: { id, organizationId: session.organizationId },
  });
  if (!project) throw new AuthzError("السجل غير موجود أو خارج نطاق جمعيتك");
  return { project, session };
}

export async function requireOwnedDonor(id: string) {
  const session = await requireSessionOrThrow();
  const donor = await prisma.donor.findFirst({
    where: { id, organizationId: session.organizationId },
  });
  if (!donor) throw new AuthzError("السجل غير موجود أو خارج نطاق جمعيتك");
  return { donor, session };
}

export async function requireOwnedOpportunity(id: string) {
  const session = await requireSessionOrThrow();
  const opportunity = await prisma.fundingOpportunity.findFirst({
    where: { id, organizationId: session.organizationId },
  });
  if (!opportunity) throw new AuthzError("السجل غير موجود أو خارج نطاق جمعيتك");
  return { opportunity, session };
}

export async function requireOwnedApplication(id: string) {
  const session = await requireSessionOrThrow();
  const application = await prisma.grantApplication.findFirst({
    where: { id, organizationId: session.organizationId },
  });
  if (!application) throw new AuthzError("السجل غير موجود أو خارج نطاق جمعيتك");
  return { application, session };
}

/** تسجيل إجراء في سجل التدقيق، مربوطًا دائمًا بالجمعية والمستخدم. */
export async function audit(
  session: SessionPayload,
  action: string,
  entityType: string,
  entityId: string,
  details?: string
) {
  await prisma.activityLog.create({
    data: {
      organizationId: session.organizationId,
      userId: session.userId,
      action,
      entityType,
      entityId,
      details,
    },
  });
}
