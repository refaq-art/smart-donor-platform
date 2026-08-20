"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { FormState } from "@/app/actions/auth";

class EnrollError extends Error {}

/**
 * تسجيل مستخدم في دورة بطريقة آمنة من التزامن (Race Condition).
 *
 * الحل: نستخدم معاملة قاعدة بيانات (Transaction) تنفّذ خطوة حاسمة واحدة —
 * `updateMany` بشرط `remainingSeats > 0` — فإما تُخصم المقعد فعليًا (count=1)
 * أو لا يحدث شيء إطلاقًا (count=0) لو استهلك طلب آخر آخر مقعد للتو. بما أن
 * SQLite محرك كتابة واحد (Single Writer) وPrisma ينفّذ المعاملات التفاعلية عبر
 * BEGIN/COMMIT فعلي عليه، يستحيل أن ينجح طلبان في قراءة remainingSeats=1 ثم
 * خصمها كلاهما في آنٍ واحد — الطلب الثاني سيجد الشرط `remainingSeats > 0` قد
 * أصبح كاذبًا فور التزام (commit) الطلب الأول. هذا يمنع تجاوز السعة المحددة
 * حتى مع طلبين متزامنين تمامًا على آخر مقعد متاح.
 */
export async function enrollAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) {
    return { error: "الرجاء تسجيل الدخول للتسجيل في هذه الدورة" };
  }

  const courseId = String(formData.get("courseId") || "");
  if (!courseId) return { error: "طلب غير صحيح" };

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return { error: "الدورة غير موجودة" };

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.enrollment.findUnique({
        where: { userId_courseId: { userId: session.userId, courseId } },
      });

      if (existing?.status === "ACTIVE") {
        throw new EnrollError("أنت مسجَّل بالفعل في هذه الدورة");
      }

      const fresh = await tx.course.findUnique({ where: { id: courseId } });
      if (!fresh || !fresh.isPublished) throw new EnrollError("الدورة غير متاحة");
      if (!fresh.registrationOpen) throw new EnrollError("التسجيل في هذه الدورة مغلق حاليًا");
      if (new Date(fresh.endDate) < new Date()) throw new EnrollError("انتهت هذه الدورة بالفعل");
      if (fresh.remainingSeats <= 0) throw new EnrollError("عذرًا، اكتملت مقاعد هذه الدورة");

      // الخطوة الذرّية: تُنفَّذ فقط إن كان الشرط ما زال صحيحًا لحظة الكتابة الفعلية
      const updated = await tx.course.updateMany({
        where: { id: courseId, remainingSeats: { gt: 0 } },
        data: { remainingSeats: { decrement: 1 } },
      });
      if (updated.count === 0) {
        throw new EnrollError("عذرًا، اكتملت مقاعد هذه الدورة");
      }

      if (existing) {
        await tx.enrollment.update({
          where: { id: existing.id },
          data: { status: "ACTIVE", enrolledAt: new Date(), cancelledAt: null, cancelledBy: null },
        });
      } else {
        await tx.enrollment.create({
          data: { userId: session.userId, courseId, status: "ACTIVE" },
        });
      }
    });
  } catch (err) {
    if (err instanceof EnrollError) return { error: err.message };
    console.error("enrollAction failed:", err);
    return { error: "حدث خطأ غير متوقع أثناء التسجيل، الرجاء المحاولة لاحقًا" };
  }

  revalidatePath(`/courses/${course.slug}`);
  revalidatePath("/courses");
  revalidatePath("/account/my-courses");
  revalidatePath("/admin/enrollments");
  revalidatePath("/admin/courses");
  revalidatePath("/admin");
  return { success: "تم تسجيلك في الدورة بنجاح 🎉 يمكنك متابعتها من صفحة دوراتي." };
}

export async function cancelEnrollmentAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: "الرجاء تسجيل الدخول" };

  const enrollmentId = String(formData.get("enrollmentId") || "");
  if (!enrollmentId) return { error: "طلب غير صحيح" };

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { course: true },
  });

  if (!enrollment || enrollment.userId !== session.userId) {
    return { error: "لم يتم العثور على هذا التسجيل" };
  }
  if (enrollment.status !== "ACTIVE") {
    return { error: "هذا التسجيل ملغى بالفعل" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.enrollment.update({
      where: { id: enrollmentId },
      data: { status: "CANCELLED", cancelledAt: new Date(), cancelledBy: "USER" },
    });
    await tx.course.update({
      where: { id: enrollment.courseId },
      data: { remainingSeats: { increment: 1 } },
    });
  });

  revalidatePath(`/courses/${enrollment.course.slug}`);
  revalidatePath("/courses");
  revalidatePath("/account/my-courses");
  revalidatePath("/admin/enrollments");
  revalidatePath("/admin/courses");
  revalidatePath("/admin");
  return { success: "تم إلغاء تسجيلك في هذه الدورة" };
}
