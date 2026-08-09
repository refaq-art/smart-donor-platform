"use server";

import { prisma } from "@/lib/prisma";
import { requireOwnedApplication, requireSessionOrThrow, requirePermission, audit, AuthzError } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import { buildCorrespondence, type CorrespondenceType } from "@/lib/correspondence-templates";

export type CorrespondenceFormState = { error?: string } | null;

export async function generateCorrespondenceAction(
  applicationId: string,
  type: CorrespondenceType
): Promise<CorrespondenceFormState> {
  let session;
  try {
    await requirePermission("editRecords");
    ({ session } = await requireOwnedApplication(applicationId));
  } catch (e) {
    return { error: e instanceof AuthzError ? e.message : "غير مصرَّح" };
  }

  const application = await prisma.grantApplication.findFirst({
    where: { id: applicationId, organizationId: session.organizationId },
    include: {
      organization: true,
      project: true,
      opportunity: { include: { donor: true } },
    },
  });
  if (!application) return { error: "الطلب غير موجود" };
  const donor = application.opportunity?.donor;
  if (!donor) return { error: "اربط الطلب بجهة مانحة مسجلة أولًا لتوليد خطاب" };

  const { subject, body } = buildCorrespondence(type, {
    organization: application.organization,
    donor,
    applicationTitle: application.title,
    projectTitle: application.project?.title,
    amount: application.opportunity?.expectedAmount,
  });

  await prisma.donorCorrespondence.create({
    data: {
      organizationId: session.organizationId,
      donorId: donor.id,
      applicationId,
      type,
      subject,
      body,
      createdById: session.userId,
    },
  });

  await audit(session, "generate_correspondence", "GrantApplication", applicationId, type);
  revalidatePath(`/applications/${applicationId}`);
  revalidatePath(`/donors/${donor.id}`);
  return null;
}

export async function deleteCorrespondenceAction(id: string, applicationId: string) {
  const session = await requireSessionOrThrow();
  await requirePermission("editRecords");

  const letter = await prisma.donorCorrespondence.findFirst({
    where: { id, organizationId: session.organizationId },
  });
  if (!letter) throw new AuthzError("السجل غير موجود أو خارج نطاق جمعيتك");

  await prisma.donorCorrespondence.delete({ where: { id } });
  await audit(session, "delete_correspondence", "GrantApplication", applicationId);
  revalidatePath(`/applications/${applicationId}`);
  revalidatePath(`/donors/${letter.donorId}`);
}
