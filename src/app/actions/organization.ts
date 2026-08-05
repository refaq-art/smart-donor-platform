"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireSessionOrThrow, audit, AuthzError } from "@/lib/authz";
import { revalidatePath } from "next/cache";

const orgSchema = z.object({
  name: z.string().min(2, "اسم الجمعية مطلوب"),
  about: z.string().optional(),
  regNumber: z.string().optional(),
  licenseDate: z.string().optional(),
  licenseExpiry: z.string().optional(),
  supervisingBody: z.string().optional(),
  foundedAt: z.string().optional(),
  sector: z.string().optional(),
  geographicScope: z.string().optional(),
  city: z.string().optional(),
  strategicGoalsJson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  delegateName: z.string().optional(),
  delegateRole: z.string().optional(),
  delegatePhone: z.string().optional(),
  delegateEmail: z.string().optional(),
  bankName: z.string().optional(),
  iban: z.string().optional(),
  annualBudget: z.string().optional(),
});

export type OrgFormState = { error?: string; success?: boolean } | null;

const d = (v?: string) => (v && v.trim() ? new Date(v) : null);

export async function updateOrganizationAction(
  _prev: OrgFormState,
  formData: FormData
): Promise<OrgFormState> {
  let session;
  try {
    session = await requirePermission("manageOrgProfile");
  } catch (e) {
    return { error: e instanceof AuthzError ? e.message : "غير مصرَّح" };
  }

  const parsed = orgSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "بيانات غير صحيحة" };
  const v = parsed.data;

  if (v.email && v.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) {
    return { error: "صيغة البريد الإلكتروني غير صحيحة" };
  }

  await prisma.organization.update({
    where: { id: session.organizationId },
    data: {
      name: v.name,
      about: v.about || null,
      regNumber: v.regNumber || null,
      licenseDate: d(v.licenseDate),
      licenseExpiry: d(v.licenseExpiry),
      supervisingBody: v.supervisingBody || null,
      foundedAt: d(v.foundedAt),
      sector: v.sector || null,
      geographicScope: v.geographicScope || null,
      city: v.city || null,
      strategicGoals: v.strategicGoalsJson || "[]",
      phone: v.phone || null,
      email: v.email || null,
      website: v.website || null,
      address: v.address || null,
      delegateName: v.delegateName || null,
      delegateRole: v.delegateRole || null,
      delegatePhone: v.delegatePhone || null,
      delegateEmail: v.delegateEmail || null,
      bankName: v.bankName || null,
      iban: v.iban || null,
      annualBudget: v.annualBudget ? Number(v.annualBudget) : null,
    },
  });

  await audit(session, "update", "Organization", session.organizationId);
  revalidatePath("/settings/organization");
  return { success: true };
}

// ── أعضاء مجلس الإدارة / الفريق التنفيذي ────────────────────────────────────

export async function addBoardMemberAction(formData: FormData) {
  const session = await requirePermission("manageOrgProfile");
  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  await prisma.boardMember.create({
    data: {
      organizationId: session.organizationId,
      name,
      position: String(formData.get("position") || "") || null,
      memberType: String(formData.get("memberType") || "BOARD"),
      phone: String(formData.get("phone") || "") || null,
      email: String(formData.get("email") || "") || null,
    },
  });
  await audit(session, "create", "BoardMember", name);
  revalidatePath("/settings/organization");
}

export async function deleteBoardMemberAction(id: string) {
  const session = await requirePermission("manageOrgProfile");
  const member = await prisma.boardMember.findFirst({
    where: { id, organizationId: session.organizationId },
  });
  if (!member) return;
  await prisma.boardMember.delete({ where: { id } });
  await audit(session, "delete", "BoardMember", id);
  revalidatePath("/settings/organization");
}

// ── مكتبة المستندات ─────────────────────────────────────────────────────────

export type DocState = { error?: string; success?: boolean } | null;

export async function uploadOrgDocumentAction(
  _prev: DocState,
  formData: FormData
): Promise<DocState> {
  let session;
  try {
    session = await requirePermission("manageOrgProfile");
  } catch (e) {
    return { error: e instanceof AuthzError ? e.message : "غير مصرَّح" };
  }

  const file = formData.get("file") as File | null;
  const title = String(formData.get("title") || "").trim();
  const category = String(formData.get("category") || "").trim();
  if (!file) return { error: "الرجاء اختيار ملف" };
  if (!title) return { error: "عنوان المستند مطلوب" };
  if (!category) return { error: "تصنيف المستند مطلوب" };

  const { saveUploadedFile } = await import("@/lib/upload-file");
  const outcome = await saveUploadedFile(file);
  if (!outcome.ok) return { error: outcome.error };

  await prisma.orgDocument.create({
    data: {
      organizationId: session.organizationId,
      title,
      category,
      filename: outcome.filename,
      storedName: outcome.storedName,
      url: outcome.url,
      mimeType: outcome.mimeType,
      size: outcome.size,
      issueDate: d(String(formData.get("issueDate") || "")),
      expiryDate: d(String(formData.get("expiryDate") || "")),
      notes: String(formData.get("notes") || "") || null,
      uploadedById: session.userId,
    },
  });

  await audit(session, "upload_document", "OrgDocument", title);
  revalidatePath("/settings/organization");
  return { success: true };
}

export async function deleteOrgDocumentAction(id: string) {
  const session = await requirePermission("manageOrgProfile");
  const doc = await prisma.orgDocument.findFirst({
    where: { id, organizationId: session.organizationId },
  });
  if (!doc) return;

  await prisma.orgDocument.delete({ where: { id } });
  const { deleteUploadedFile } = await import("@/lib/upload-file");
  await deleteUploadedFile(doc.storedName, doc.url);

  await audit(session, "delete_document", "OrgDocument", id);
  revalidatePath("/settings/organization");
}

/** بيانات الجمعية المستخدمة لتعبئة طلبات المنح تلقائيًا (بدل إعادة إدخالها). */
export async function getOrganizationProfileText() {
  const session = await requireSessionOrThrow();
  const org = await prisma.organization.findUnique({ where: { id: session.organizationId } });
  if (!org) return "";

  const goals = (() => {
    try {
      const g = JSON.parse(org.strategicGoals || "[]");
      return Array.isArray(g) ? g : [];
    } catch {
      return [];
    }
  })();

  const parts = [
    `${org.name}${org.regNumber ? ` (رقم الترخيص: ${org.regNumber})` : ""}`,
    org.about,
    org.foundedAt ? `تأسست عام ${new Date(org.foundedAt).getFullYear()}.` : null,
    org.sector ? `مجالات العمل: ${org.sector}.` : null,
    org.geographicScope ? `النطاق الجغرافي: ${org.geographicScope}.` : null,
    goals.length ? `الأهداف الاستراتيجية: ${goals.join("؛ ")}.` : null,
  ].filter(Boolean);

  return parts.join(" ");
}
