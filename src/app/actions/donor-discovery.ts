"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireSessionOrThrow, audit, AuthzError } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import { runDonorDiscoveryForOrg } from "@/lib/donor-discovery";

export type RunDiscoveryState = { error?: string; created?: number; searched?: number } | null;

export async function runDonorDiscoveryAction(): Promise<RunDiscoveryState> {
  let session;
  try {
    session = await requirePermission("editRecords");
  } catch (e) {
    return { error: e instanceof AuthzError ? e.message : "غير مصرَّح" };
  }

  const result = await runDonorDiscoveryForOrg(session.organizationId);
  if (result.error) return { error: result.error };

  revalidatePath("/donors");
  return { created: result.created, searched: result.searched };
}

const addDonorSchema = z.object({
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
});

/** يحوّل مقترحًا مكتشفًا آليًا إلى مانح فعلي في جدول الجمعية — بمراجعة بشرية دائمًا، لا إدراج تلقائي. */
export async function addDonorLeadAsDonorAction(leadId: string, formData: FormData) {
  const session = await requireSessionOrThrow();
  const { roleHasPermission } = await import("@/lib/authz-matrix");
  if (!roleHasPermission(session.role, "editRecords")) {
    throw new AuthzError("ليست لديك صلاحية لإضافة مانحين");
  }

  const lead = await prisma.donorLead.findFirst({
    where: { id: leadId, organizationId: session.organizationId, status: "PENDING" },
  });
  if (!lead) throw new AuthzError("المقترح غير موجود أو تمت معالجته مسبقًا");

  const raw = Object.fromEntries(formData.entries());
  const parsed = addDonorSchema.safeParse(raw);

  const donor = await prisma.$transaction(async (tx) => {
    const created = await tx.donor.create({
      data: {
        organizationId: session.organizationId,
        name: lead.name,
        type: "مؤسسة مانحة",
        supportFields: lead.sector,
        city: lead.city,
        contactName: parsed.success ? parsed.data.contactName || null : null,
        phone: parsed.success ? parsed.data.phone || null : null,
        email: parsed.success ? parsed.data.email || null : null,
        notes: [
          lead.about,
          lead.sourceUrl ? `مصدر الاكتشاف: ${lead.sourceUrl}` : null,
          "أُضيف عبر اكتشاف المانحين الآلي بالذكاء الاصطناعي — يُنصح بالتحقق من البيانات قبل التواصل.",
        ]
          .filter(Boolean)
          .join("\n"),
      },
    });
    await tx.donorLead.update({ where: { id: leadId }, data: { status: "ADDED", reviewedAt: new Date() } });
    return created;
  });

  await audit(session, "add_donor_from_lead", "Donor", donor.id, `من مقترح مكتشف: ${lead.name}`);
  revalidatePath("/donors");
}

export async function dismissDonorLeadAction(leadId: string) {
  const session = await requireSessionOrThrow();
  const { roleHasPermission } = await import("@/lib/authz-matrix");
  if (!roleHasPermission(session.role, "editRecords")) {
    throw new AuthzError("ليست لديك صلاحية لتجاهل المقترحات");
  }

  const lead = await prisma.donorLead.findFirst({
    where: { id: leadId, organizationId: session.organizationId },
  });
  if (!lead) throw new AuthzError("المقترح غير موجود");

  await prisma.donorLead.update({ where: { id: leadId }, data: { status: "DISMISSED", reviewedAt: new Date() } });
  await audit(session, "dismiss_donor_lead", "DonorLead", leadId);
  revalidatePath("/donors");
}
