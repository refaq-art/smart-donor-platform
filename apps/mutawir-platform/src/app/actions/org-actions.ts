"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ORG_CONTEXT_FIELDS } from "@/lib/data/framework-seed-data";
import { logActivity } from "@/lib/activity";

const BASIC_FIELDS = [
  "name",
  "licenseNumber",
  "region",
  "executiveDirector",
  "contactEmail",
  "contactPhone",
  "websiteUrl",
  "xUrl",
  "report2025Url",
] as const;

export async function updateOrgProfileAction(formData: FormData) {
  const user = await requireUser(["ORG"]);
  const organizationId = user.organizationId!;

  const data: Record<string, string | number | null> = {};
  for (const field of BASIC_FIELDS) {
    const value = formData.get(field);
    data[field] = value ? String(value) : null;
  }
  const foundingYear = formData.get("foundingYear");
  data.foundingYear = foundingYear ? Number(foundingYear) : null;
  const fullTimeStaff = formData.get("fullTimeStaff");
  data.fullTimeStaff = fullTimeStaff ? Number(fullTimeStaff) : null;
  const partTimeStaff = formData.get("partTimeStaff");
  data.partTimeStaff = partTimeStaff ? Number(partTimeStaff) : null;

  const contextAnswers: Record<string, string> = {};
  for (const field of ORG_CONTEXT_FIELDS) {
    contextAnswers[field.key] = String(formData.get(field.key) ?? "");
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: { ...data, contextAnswers: JSON.stringify(contextAnswers) },
  });

  await logActivity({ organizationId, actorId: user.id, action: "PROFILE_UPDATED", entityType: "Organization", entityId: organizationId });

  revalidatePath("/org/profile");
}
