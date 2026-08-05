import { getSession, clearSessionCookie } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/app-shell";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  // التحقق من أن الحساب لا يزال نشطًا وأن الجلسة لم تُبطَل (بعد تغيير كلمة المرور
  // أو تعطيل الحساب من قبل المدير) — الجلسة وحدها لا تكفي.
  const currentUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { isActive: true, mustChangePassword: true, organizationId: true },
  });
  if (!currentUser || !currentUser.isActive || currentUser.organizationId !== session.organizationId) {
    await clearSessionCookie();
    redirect("/login");
  }

  const org = await prisma.organization.findUnique({ where: { id: session.organizationId } });

  const now = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + 14);

  const [upcomingDeadlines, missingInfoApps] = await Promise.all([
    prisma.fundingOpportunity.count({
      where: {
        organizationId: session.organizationId,
        status: { not: "مغلقة" },
        deadline: { gte: now, lte: soon },
      },
    }),
    prisma.grantApplication.count({
      where: { organizationId: session.organizationId, status: "مطلوب استكمال" },
    }),
  ]);

  return (
    <AppShell
      userName={session.name}
      userRole={session.role}
      orgName={org?.name || "منصة إدارة المنح"}
      alertCount={upcomingDeadlines + missingInfoApps}
    >
      {children}
    </AppShell>
  );
}
