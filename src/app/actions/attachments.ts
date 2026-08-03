"use server";

import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/upload-file";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { unlink } from "fs/promises";
import path from "path";

export type UploadFormState = { error?: string; success?: boolean } | null;

export async function uploadAttachmentAction(
  target: { projectId?: string; applicationId?: string; donorId?: string },
  revalidateTarget: string,
  _prev: UploadFormState,
  formData: FormData
): Promise<UploadFormState> {
  const session = await getSession();
  if (!session) return { error: "الرجاء تسجيل الدخول" };

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

  await prisma.activityLog.create({
    data: {
      userId: session.userId,
      action: "upload_attachment",
      entityType: target.projectId ? "Project" : target.applicationId ? "GrantApplication" : "Donor",
      entityId: target.projectId || target.applicationId || target.donorId || "",
      details: outcome.filename,
    },
  });

  revalidatePath(revalidateTarget);
  return { success: true };
}

export async function deleteAttachmentAction(id: string, revalidateTarget: string) {
  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) return;

  await prisma.attachment.delete({ where: { id } });

  try {
    await unlink(path.join(process.cwd(), "public", "uploads", attachment.storedName));
  } catch {
    // الملف غير موجود على القرص، لا بأس بالمتابعة
  }

  revalidatePath(revalidateTarget);
}
