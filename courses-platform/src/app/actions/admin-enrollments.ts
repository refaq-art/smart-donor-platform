"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

export async function adminCancelEnrollmentAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== ROLES.ADMIN) return;

  const enrollmentId = String(formData.get("enrollmentId") || "");
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { course: true },
  });
  if (!enrollment || enrollment.status !== "ACTIVE") return;

  await prisma.$transaction(async (tx) => {
    await tx.enrollment.update({
      where: { id: enrollmentId },
      data: { status: "CANCELLED", cancelledAt: new Date(), cancelledBy: "ADMIN" },
    });
    await tx.course.update({
      where: { id: enrollment.courseId },
      data: { remainingSeats: { increment: 1 } },
    });
  });

  revalidatePath("/admin/enrollments");
  revalidatePath("/admin/courses");
  revalidatePath("/admin");
  revalidatePath(`/courses/${enrollment.course.slug}`);
  revalidatePath("/account/my-courses");
}
