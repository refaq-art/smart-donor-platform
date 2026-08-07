import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationList } from "@/components/notification-list";

export default async function OrgNotificationsPage() {
  const user = await requireUser(["ORG"]);
  const notifications = await prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  return <NotificationList notifications={notifications} />;
}
