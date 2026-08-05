"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOwnedApplication, requireSessionOrThrow, audit, AuthzError } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import { FIELD_KEYS } from "@/lib/application-fields";

const commentSchema = z.object({
  body: z.string().min(2, "الرجاء كتابة نص الملاحظة"),
  fieldKey: z.string().optional(),
  kind: z.enum(["NOTE", "CHANGE_REQUEST"]).default("NOTE"),
});

export type CommentFormState = { error?: string } | null;

export async function addCommentAction(
  applicationId: string,
  _prev: CommentFormState,
  formData: FormData
): Promise<CommentFormState> {
  let session;
  try {
    ({ session } = await requireOwnedApplication(applicationId));
  } catch (e) {
    return { error: e instanceof AuthzError ? e.message : "غير مصرَّح" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = commentSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "بيانات غير صحيحة" };

  const { roleHasPermission } = await import("@/lib/authz-matrix");
  const permission = parsed.data.kind === "CHANGE_REQUEST" ? "review" : "comment";
  if (!roleHasPermission(session.role, permission)) {
    return {
      error:
        parsed.data.kind === "CHANGE_REQUEST"
          ? "طلبات التعديل تتطلب صلاحية مراجعة"
          : "ليست لديك صلاحية لإضافة ملاحظات",
    };
  }

  const fieldKey = parsed.data.fieldKey && (FIELD_KEYS as readonly string[]).includes(parsed.data.fieldKey)
    ? parsed.data.fieldKey
    : null;

  await prisma.applicationComment.create({
    data: {
      applicationId,
      fieldKey,
      body: parsed.data.body,
      kind: parsed.data.kind,
      authorId: session.userId,
    },
  });

  await audit(session, "add_comment", "GrantApplication", applicationId, parsed.data.kind);
  revalidatePath(`/applications/${applicationId}`);
  return null;
}

export async function resolveCommentAction(commentId: string, applicationId: string, resolve: boolean) {
  const session = await requireSessionOrThrow();
  const { roleHasPermission } = await import("@/lib/authz-matrix");
  if (!roleHasPermission(session.role, "comment")) {
    throw new AuthzError("ليست لديك صلاحية لتحديث حالة الملاحظة");
  }

  const comment = await prisma.applicationComment.findFirst({
    where: { id: commentId, applicationId, application: { organizationId: session.organizationId } },
  });
  if (!comment) throw new AuthzError("الملاحظة غير موجودة أو خارج نطاق جمعيتك");

  await prisma.applicationComment.update({
    where: { id: commentId },
    data: { status: resolve ? "RESOLVED" : "OPEN", resolvedAt: resolve ? new Date() : null },
  });

  await audit(session, resolve ? "resolve_comment" : "reopen_comment", "GrantApplication", applicationId);
  revalidatePath(`/applications/${applicationId}`);
}

export async function deleteCommentAction(commentId: string, applicationId: string) {
  const session = await requireSessionOrThrow();
  const { roleHasPermission } = await import("@/lib/authz-matrix");

  const comment = await prisma.applicationComment.findFirst({
    where: { id: commentId, applicationId, application: { organizationId: session.organizationId } },
  });
  if (!comment) throw new AuthzError("الملاحظة غير موجودة أو خارج نطاق جمعيتك");

  const isAuthor = comment.authorId === session.userId;
  if (!isAuthor && !roleHasPermission(session.role, "deleteRecords")) {
    throw new AuthzError("لا يمكنك حذف ملاحظة لم تكتبها");
  }

  await prisma.applicationComment.delete({ where: { id: commentId } });
  await audit(session, "delete_comment", "GrantApplication", applicationId);
  revalidatePath(`/applications/${applicationId}`);
}
