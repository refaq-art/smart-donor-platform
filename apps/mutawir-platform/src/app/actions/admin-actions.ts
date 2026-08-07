"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import type { RoleValue } from "@/lib/constants";

export async function createOrganizationAction(formData: FormData) {
  const admin = await requireUser(["ADMIN"]);
  const name = String(formData.get("name"));
  const email = String(formData.get("email")).trim().toLowerCase();
  const password = String(formData.get("password"));
  const consultantId = String(formData.get("consultantId") ?? "") || null;
  const cycleId = String(formData.get("programCycleId") ?? "") || null;

  const org = await prisma.organization.create({
    data: { name, consultantId, programCycleId: cycleId, region: String(formData.get("region") ?? "") || null },
  });

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { email, name, role: "ORG", passwordHash, organizationId: org.id } });

  await logActivity({ organizationId: org.id, actorId: admin.id, action: "ORGANIZATION_CREATED", entityType: "Organization", entityId: org.id });
  revalidatePath("/admin/organizations");
}

export async function assignConsultantAction(formData: FormData) {
  const admin = await requireUser(["ADMIN"]);
  const organizationId = String(formData.get("organizationId"));
  const consultantId = String(formData.get("consultantId")) || null;
  await prisma.organization.update({ where: { id: organizationId }, data: { consultantId } });
  await logActivity({ organizationId, actorId: admin.id, action: "CONSULTANT_ASSIGNED", entityType: "Organization", entityId: organizationId, metadata: { consultantId } });
  revalidatePath("/admin/organizations");
}

export async function createUserAction(formData: FormData) {
  const admin = await requireUser(["ADMIN"]);
  const name = String(formData.get("name"));
  const email = String(formData.get("email")).trim().toLowerCase();
  const password = String(formData.get("password"));
  const role = String(formData.get("role")) as RoleValue;

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, passwordHash, role } });

  if (role === "CONSULTANT") await prisma.consultant.create({ data: { userId: user.id } });
  if (role === "COUNCIL") await prisma.councilMember.create({ data: { userId: user.id } });

  await logActivity({ actorId: admin.id, action: "USER_CREATED", entityType: "User", entityId: user.id, metadata: { role } });
  revalidatePath("/admin/users");
}

export async function toggleUserActiveAction(userId: string) {
  const admin = await requireUser(["ADMIN"]);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  await prisma.user.update({ where: { id: userId }, data: { isActive: !user.isActive } });
  await logActivity({ actorId: admin.id, action: "USER_TOGGLED", entityType: "User", entityId: userId, metadata: { isActive: !user.isActive } });
  revalidatePath("/admin/users");
}

// ---- Assessment framework management (no hardcoding) ----

export async function updateIndicatorAction(formData: FormData) {
  const admin = await requireUser(["ADMIN"]);
  const indicatorId = String(formData.get("indicatorId"));
  await prisma.assessmentIndicator.update({
    where: { id: indicatorId },
    data: {
      name: String(formData.get("name")),
      weight: Number(formData.get("weight") ?? 1),
      order: Number(formData.get("order") ?? 0),
      requiredEvidenceHint: String(formData.get("requiredEvidenceHint") ?? "") || null,
      isActive: formData.get("isActive") === "on",
    },
  });
  await logActivity({ actorId: admin.id, action: "INDICATOR_UPDATED", entityType: "AssessmentIndicator", entityId: indicatorId });
  revalidatePath("/admin/framework");
}

export async function updateLevelAction(formData: FormData) {
  const admin = await requireUser(["ADMIN"]);
  const levelId = String(formData.get("levelId"));
  await prisma.indicatorLevel.update({
    where: { id: levelId },
    data: {
      label: String(formData.get("label")),
      minScore: Number(formData.get("minScore")),
      maxScore: Number(formData.get("maxScore")),
      description: String(formData.get("description")),
    },
  });
  await logActivity({ actorId: admin.id, action: "INDICATOR_LEVEL_UPDATED", entityType: "IndicatorLevel", entityId: levelId });
  revalidatePath("/admin/framework");
}

export async function createDomainAction(formData: FormData) {
  const admin = await requireUser(["ADMIN"]);
  const code = String(formData.get("code")).trim().toUpperCase().replace(/\s+/g, "_");
  const name = String(formData.get("name"));
  const count = await prisma.assessmentDomain.count();
  const domain = await prisma.assessmentDomain.create({ data: { code, name, order: count + 1 } });
  await logActivity({ actorId: admin.id, action: "DOMAIN_CREATED", entityType: "AssessmentDomain", entityId: domain.id });
  revalidatePath("/admin/framework");
}

export async function createCriterionAction(formData: FormData) {
  const admin = await requireUser(["ADMIN"]);
  const domainId = String(formData.get("domainId"));
  const code = String(formData.get("code")).trim().toUpperCase().replace(/\s+/g, "_");
  const name = String(formData.get("name"));
  const count = await prisma.assessmentCriterion.count({ where: { domainId } });
  const criterion = await prisma.assessmentCriterion.create({ data: { domainId, code, name, order: count + 1 } });
  await logActivity({ actorId: admin.id, action: "CRITERION_CREATED", entityType: "AssessmentCriterion", entityId: criterion.id });
  revalidatePath("/admin/framework");
}

export async function createIndicatorAction(formData: FormData) {
  const admin = await requireUser(["ADMIN"]);
  const criterionId = String(formData.get("criterionId"));
  const code = String(formData.get("code")).trim().toUpperCase().replace(/\s+/g, "_");
  const name = String(formData.get("name"));
  const type = String(formData.get("type"));
  const count = await prisma.assessmentIndicator.count({ where: { criterionId } });
  const indicator = await prisma.assessmentIndicator.create({ data: { criterionId, code, name, type, order: count + 1 } });

  const levels = type === "MATURITY_LEVEL"
    ? [
        { levelNumber: 1, label: "مستوى التأسيس", minScore: 1, maxScore: 1.99, description: "—" },
        { levelNumber: 2, label: "مستوى الممارسة", minScore: 2, maxScore: 3.49, description: "—" },
        { levelNumber: 3, label: "مستوى التميز", minScore: 3.5, maxScore: 5, description: "—" },
      ]
    : [1, 2, 3, 4, 5].map((n) => ({ levelNumber: n, label: ["لم يبدأ", "قيد البدء", "قيد التنفيذ", "شبه مكتمل", "مكتمل"][n - 1], minScore: n, maxScore: n, description: "—" }));

  await prisma.indicatorLevel.createMany({ data: levels.map((l) => ({ ...l, indicatorId: indicator.id })) });

  await logActivity({ actorId: admin.id, action: "INDICATOR_CREATED", entityType: "AssessmentIndicator", entityId: indicator.id });
  revalidatePath("/admin/framework");
}
