import { prisma } from "@/lib/prisma";

// Lazily transitions overdue tasks to LATE. Called at the top of any page
// that lists tasks, instead of relying on a background cron job.
export async function syncLateTasks(developmentPlanId: string) {
  await prisma.task.updateMany({
    where: {
      developmentPlanId,
      status: { in: ["NOT_STARTED", "IN_PROGRESS", "NEEDS_REVISION"] },
      dueDate: { lt: new Date() },
    },
    data: { status: "LATE" },
  });
}
