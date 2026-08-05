"use server";

import { prisma } from "@/lib/prisma";
import { requireOwnedApplication, requirePermission, audit, AuthzError } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import { FIELD_KEYS, type Fields } from "@/lib/application-fields";
import { snapshotIfChanged } from "@/lib/application-version-snapshot";

export async function restoreVersionAction(versionId: string, applicationId: string) {
  await requirePermission("editRecords");
  const { application, session } = await requireOwnedApplication(applicationId);

  const version = await prisma.applicationVersion.findFirst({ where: { id: versionId, applicationId } });
  if (!version) throw new AuthzError("الإصدار غير موجود");

  // احفظ الحالة الراهنة كنسخة قبل الاستعادة، حتى لا تُفقد
  await snapshotIfChanged(applicationId, application, session.userId, "قبل الاستعادة");

  const data = JSON.parse(version.snapshot) as Fields & { title: string };
  await prisma.grantApplication.update({
    where: { id: applicationId },
    data: {
      title: data.title,
      ...Object.fromEntries(FIELD_KEYS.map((k) => [k, data[k] || null])),
    },
  });

  await audit(session, "restore_version", "GrantApplication", applicationId, version.label || version.id);
  revalidatePath(`/applications/${applicationId}`);
}
