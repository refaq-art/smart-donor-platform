"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, requireOwnedOpportunity, requireSessionOrThrow, audit } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import { evaluateEligibility, type EligibilityResult } from "@/lib/eligibility";
import { documentIsValid } from "@/lib/document-validity";

export async function addCriterionAction(opportunityId: string, formData: FormData) {
  await requirePermission("manageEligibility");
  const { session } = await requireOwnedOpportunity(opportunityId);

  const label = String(formData.get("label") || "").trim();
  const ruleKey = String(formData.get("ruleKey") || "").trim();
  if (!label || !ruleKey) return;

  await prisma.eligibilityCriterion.create({
    data: {
      opportunityId,
      ruleKey,
      label,
      operator: String(formData.get("operator") || "EXISTS"),
      value: String(formData.get("value") || "") || null,
      documentCategory: String(formData.get("documentCategory") || "") || null,
      isMandatory: String(formData.get("isMandatory") || "") === "on",
      notes: String(formData.get("notes") || "") || null,
    },
  });

  await audit(session, "add_criterion", "FundingOpportunity", opportunityId, label);
  revalidatePath(`/opportunities/${opportunityId}`);
}

export async function deleteCriterionAction(id: string, opportunityId: string) {
  await requirePermission("manageEligibility");
  const { session } = await requireOwnedOpportunity(opportunityId);

  const criterion = await prisma.eligibilityCriterion.findFirst({ where: { id, opportunityId } });
  if (!criterion) return;

  await prisma.eligibilityCriterion.delete({ where: { id } });
  await audit(session, "delete_criterion", "FundingOpportunity", opportunityId);
  revalidatePath(`/opportunities/${opportunityId}`);
}

/** يقيّم أهلية الجمعية/المشروع مقابل شروط فرصة تمويل، ويعيد حكمًا مُعلَّلًا. */
export async function evaluateOpportunityEligibility(
  opportunityId: string,
  projectId?: string | null
): Promise<EligibilityResult> {
  const session = await requireSessionOrThrow();

  const [opportunity, org, documents] = await Promise.all([
    prisma.fundingOpportunity.findFirst({
      where: { id: opportunityId, organizationId: session.organizationId },
      include: { criteria: true },
    }),
    prisma.organization.findUnique({ where: { id: session.organizationId } }),
    prisma.orgDocument.findMany({ where: { organizationId: session.organizationId } }),
  ]);

  if (!opportunity || !org) {
    return {
      verdict: "INSUFFICIENT_DATA",
      summary: "تعذّر العثور على الفرصة أو بيانات الجمعية.",
      results: [],
      passed: 0,
      failed: 0,
      unknown: 0,
    };
  }

  const effectiveProjectId = projectId || opportunity.projectId;
  const project = effectiveProjectId
    ? await prisma.project.findFirst({
        where: { id: effectiveProjectId, organizationId: session.organizationId },
      })
    : null;

  const validDocumentCategories = Array.from(
    new Set(documents.filter((d) => documentIsValid(d.expiryDate)).map((d) => d.category))
  );

  return evaluateEligibility(opportunity.criteria, {
    org: {
      foundedAt: org.foundedAt,
      sector: org.sector,
      geographicScope: org.geographicScope,
      licenseExpiry: org.licenseExpiry,
    },
    project: project
      ? {
          category: project.category,
          beneficiaryCount: project.beneficiaryCount,
          budgetTotal: project.budgetTotal,
          kpis: project.kpis,
          timelineStart: project.timelineStart,
          timelineEnd: project.timelineEnd,
        }
      : null,
    validDocumentCategories,
  });
}
