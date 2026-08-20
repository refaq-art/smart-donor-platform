"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { courseSchema, firstErrorMessage } from "@/lib/validation";
import { slugify } from "@/lib/utils";
import type { FormState } from "@/app/actions/auth";

async function requireAdminSession() {
  const session = await getSession();
  if (!session || session.role !== ROLES.ADMIN) return null;
  return session;
}

async function uniqueSlug(title: string, excludeId?: string): Promise<string> {
  const base = slugify(title);
  let candidate = base;
  let suffix = 1;
  // يتحقق من عدم تكرار الرابط المختصر، ويضيف رقمًا تسلسليًا عند التعارض
  while (
    await prisma.course.findFirst({
      where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
    })
  ) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

function parseCourseFormData(formData: FormData) {
  return {
    title: formData.get("title"),
    shortDescription: formData.get("shortDescription"),
    description: formData.get("description"),
    instructorName: formData.get("instructorName"),
    providerName: formData.get("providerName"),
    categoryId: formData.get("categoryId"),
    level: formData.get("level"),
    type: formData.get("type"),
    // الحقل غير الظاهر حسب نوع الدورة (موقع/رابط) لا يُرسَل ضمن FormData إطلاقًا
    // (غير موجود في DOM)، فيعود null بدل ""؛ نطبّعه هنا حتى لا يفشل التحقق بزود.
    location: formData.get("location") ?? "",
    meetingUrl: formData.get("meetingUrl") ?? "",
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    scheduleTime: formData.get("scheduleTime"),
    durationText: formData.get("durationText"),
    totalSeats: formData.get("totalSeats"),
    hasCertificate: formData.get("hasCertificate") === "on",
    coverImageUrl: formData.get("coverImageUrl") ?? "",
    coverColor: formData.get("coverColor") || "blue",
    isPublished: formData.get("isPublished") === "on",
    registrationOpen: formData.get("registrationOpen") === "on",
    isFeatured: formData.get("isFeatured") === "on",
  };
}

export async function createCourseAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireAdminSession();
  if (!session) return { error: "غير مصرَّح لك بهذا الإجراء" };

  const parsed = courseSchema.safeParse(parseCourseFormData(formData));
  if (!parsed.success) return { error: firstErrorMessage(parsed.error) };

  const data = parsed.data;
  const slug = await uniqueSlug(data.title);

  const course = await prisma.course.create({
    data: {
      title: data.title,
      slug,
      shortDescription: data.shortDescription,
      description: data.description,
      instructorName: data.instructorName,
      providerName: data.providerName,
      categoryId: data.categoryId,
      level: data.level,
      type: data.type,
      location: data.location || null,
      meetingUrl: data.meetingUrl || null,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      scheduleTime: data.scheduleTime,
      durationText: data.durationText,
      totalSeats: data.totalSeats,
      remainingSeats: data.totalSeats,
      hasCertificate: data.hasCertificate,
      coverImageUrl: data.coverImageUrl || null,
      coverColor: data.coverColor,
      isPublished: data.isPublished,
      registrationOpen: data.registrationOpen,
      isFeatured: data.isFeatured,
      createdById: session.userId,
    },
  });

  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  revalidatePath("/");
  redirect(`/admin/courses/${course.id}/edit?created=1`);
}

export async function updateCourseAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireAdminSession();
  if (!session) return { error: "غير مصرَّح لك بهذا الإجراء" };

  const courseId = String(formData.get("courseId") || "");
  const existing = await prisma.course.findUnique({ where: { id: courseId } });
  if (!existing) return { error: "الدورة غير موجودة" };

  const parsed = courseSchema.safeParse(parseCourseFormData(formData));
  if (!parsed.success) return { error: firstErrorMessage(parsed.error) };

  const data = parsed.data;
  const slug = data.title === existing.title ? existing.slug : await uniqueSlug(data.title, courseId);

  // نحافظ على عدد المقاعد المشغولة عند تعديل السعة الكلية بدل إعادة ضبطها
  const seatsDelta = data.totalSeats - existing.totalSeats;
  const newRemainingSeats = Math.max(0, existing.remainingSeats + seatsDelta);

  await prisma.course.update({
    where: { id: courseId },
    data: {
      title: data.title,
      slug,
      shortDescription: data.shortDescription,
      description: data.description,
      instructorName: data.instructorName,
      providerName: data.providerName,
      categoryId: data.categoryId,
      level: data.level,
      type: data.type,
      location: data.location || null,
      meetingUrl: data.meetingUrl || null,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      scheduleTime: data.scheduleTime,
      durationText: data.durationText,
      totalSeats: data.totalSeats,
      remainingSeats: newRemainingSeats,
      hasCertificate: data.hasCertificate,
      coverImageUrl: data.coverImageUrl || null,
      coverColor: data.coverColor,
      isPublished: data.isPublished,
      registrationOpen: data.registrationOpen,
      isFeatured: data.isFeatured,
    },
  });

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}/edit`);
  revalidatePath(`/courses/${existing.slug}`);
  revalidatePath(`/courses/${slug}`);
  revalidatePath("/courses");
  revalidatePath("/");
  return { success: "تم حفظ تعديلات الدورة بنجاح" };
}

export async function deleteCourseAction(formData: FormData) {
  const session = await requireAdminSession();
  if (!session) redirect("/admin/courses");

  const courseId = String(formData.get("courseId") || "");
  if (courseId) {
    await prisma.course.delete({ where: { id: courseId } });
  }

  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  revalidatePath("/");
  redirect("/admin/courses?deleted=1");
}

export async function togglePublishAction(formData: FormData) {
  const session = await requireAdminSession();
  if (!session) return;

  const courseId = String(formData.get("courseId") || "");
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return;

  await prisma.course.update({
    where: { id: courseId },
    data: { isPublished: !course.isPublished },
  });

  revalidatePath("/admin/courses");
  revalidatePath(`/courses/${course.slug}`);
  revalidatePath("/courses");
  revalidatePath("/");
}

export async function toggleRegistrationAction(formData: FormData) {
  const session = await requireAdminSession();
  if (!session) return;

  const courseId = String(formData.get("courseId") || "");
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return;

  await prisma.course.update({
    where: { id: courseId },
    data: { registrationOpen: !course.registrationOpen },
  });

  revalidatePath("/admin/courses");
  revalidatePath(`/courses/${course.slug}`);
  revalidatePath("/courses");
}
