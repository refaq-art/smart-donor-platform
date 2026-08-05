"use server";

import { prisma } from "@/lib/prisma";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/upload-file";
import {
  requireSessionOrThrow,
  requireOwnedProject,
  requireOwnedApplication,
  requireOwnedDonor,
  audit,
} from "@/lib/authz";
import { revalidatePath } from "next/cache";

export type UploadFormState = { error?: string; success?: boolean } | null;

export async function uploadAttachmentAction(
  target: { projectId?: string; applicationId?: string; donorId?: string },
  revalidateTarget: string,
  _prev: UploadFormState,
  formData: FormData
): Promise<UploadFormState> {
  let session;
  try {
    session = await requireSessionOrThrow();
    // التأكد أن السجل الهدف يخص جمعية المستخدم قبل إرفاق أي ملف به
    if (target.projectId) await requireOwnedProject(target.projectId);
    else if (target.applicationId) await requireOwnedApplication(target.applicationId);
    else if (target.donorId) await requireOwnedDonor(target.donorId);
    else return { error: "لم يُحدَّد السجل المرتبط بالمرفق" };
  } catch {
    return { error: "غير مصرَّح بالوصول إلى هذا السجل" };
  }

  const file = formData.get("file") as File | null;
  if (!file) return { error: "الرجاء اختيار ملف" };

  const outcome = await saveUploadedFile(file);
  if (!outcome.ok) return { error: outcome.error };

  await prisma.attachment.create({
    data: {
      filename: outcome.filename,
      storedName: outcome.storedName,
      url: outcome.url,
      mimeType: outcome.mimeType,
      size: outcome.size,
      projectId: target.projectId,
      applicationId: target.applicationId,
      donorId: target.donorId,
    },
  });

  await audit(
    session,
    "upload_attachment",
    target.projectId ? "Project" : target.applicationId ? "GrantApplication" : "Donor",
    target.projectId || target.applicationId || target.donorId || "",
    outcome.filename
  );

  revalidatePath(revalidateTarget);
  return { success: true };
}

export async function deleteAttachmentAction(id: string, revalidateTarget: string) {
  const session = await requireSessionOrThrow();
  // التحقق من ملكية الجمعية عبر السجل الأب قبل الحذف
  const attachment = await prisma.attachment.findFirst({
    where: {
      id,
      OR: [
        { project: { organizationId: session.organizationId } },
        { application: { organizationId: session.organizationId } },
        { donor: { organizationId: session.organizationId } },
      ],
    },
  });
  if (!attachment) return;

  await prisma.attachment.delete({ where: { id } });
  await deleteUploadedFile(attachment.storedName, attachment.url);

  revalidatePath(revalidateTarget);
}
